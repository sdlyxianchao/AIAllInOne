# AI AllInOne Docker Backup Script
# Levels: 1 = Snapshot (config files + DB dumps)
#         2 = L1 + docker_data.vhdx  (可走「换数据盘」整盘恢复)
# 说明（2026-09-12 改）：原 L2「单独 docker save 导出镜像」已取消 ——
#   一是 VHDX 里本来就含全部镜像，单独导出纯属重复（白占 ~55 GB）；
#   二是在本机上 `docker save` 那步用的 Start-Process 必抛
#   "Item has already been added. Key in dictionary: 'Path'"，会让整个备份中止。
#   现在最高等级 New L2 = 旧 L3 去掉镜像导出。老备份里的 images/ 仍可被
#   check_backup.ps1 校验、被 restore-docker.ps1 导入。
# Retention: prunes backup_* dirs older than -RetentionDays (default 30) under -BackupRoot
# Usage: .\backup-docker.ps1 -Level 2 -BackupRoot "F:\Backup\Docker"
#        .\backup-docker.ps1 -Level 2 -DryRun     # 只打印计划与体积，一个字节都不写

param(
    [ValidateSet(1, 2)]
    [int]$Level = 1,
    [string]$BackupRoot = "C:\AIAllInOne\Backup\backups",
    [string]$OutputPath = "",
    [int]$RetentionDays = 30,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$scriptStart = Get-Date

# -- Logging setup --
$logDir = Join-Path $PSScriptRoot "logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("backup-docker-" + (Get-Date -Format "yyyy-MM-dd-HH-mm-ss") + ".log")

# Transcript captures ALL console output (commands, errors, stdout) - survives crashes because
# StreamWriter flushes on each newline. Even if the machine reboots, the file has content.
Start-Transcript -Path $logFile -Force | Out-Null

# -- Helper: timestamped log (writes to both console and transcript) --
function Log {
    param([string]$msg, [string]$color = "Gray")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] " + $msg
    # Write-Host output is captured by Start-Transcript — no need to also AppendContent
    Write-Host $line -ForegroundColor $color
}

# -- Trap: catch any unhandled error, log it, then stop transcript before dying --
trap {
    $errMsg = "FATAL: " + $_.Exception.Message
    $errLoc = $_.InvocationInfo.ScriptName + ":" + $_.InvocationInfo.ScriptLineNumber
    Log $errMsg "Red"
    Log ("  Location: " + $errLoc) "Red"
    Log ("  StackTrace: " + $_.ScriptStackTrace) "Red"
    try { Stop-Transcript | Out-Null } catch {}
    break
}

# -- Helper: format seconds as Xh Ym Zs --
function FmtTime {
    param([int]$sec)
    if ($sec -lt 0) { return "--" }
    $h = [math]::Floor($sec / 3600)
    $m = [math]::Floor(($sec % 3600) / 60)
    $s = $sec % 60
    if ($h -gt 0) { return ("{0}h {1}m {2}s" -f $h, $m, $s) }
    if ($m -gt 0) { return ("{0}m {1}s" -f $m, $s) }
    return ("{0}s" -f $s)
}

# -- Helper: copy file with progress --
function CopyWithProgress {
    param([string]$src, [string]$dst, [string]$label)
    $totalSize = (Get-Item $src).Length
    $totalGB = [math]::Round($totalSize / 1GB, 2)

    # Start async copy via BitsTransfer
    $bitsJob = Start-BitsTransfer -Source $src -Destination $dst -Description $label -Asynchronous

    $copyStart = Get-Date
    while (($bitsJob.JobState -eq "Transferring") -or ($bitsJob.JobState -eq "Connecting")) {
        $copied = $bitsJob.BytesTransferred
        $pct = if ($totalSize -gt 0) { [math]::Round($copied / $totalSize * 100, 1) } else { 0 }
        $copiedGB = [math]::Round($copied / 1GB, 2)
        $elapsed = [int]((Get-Date) - $copyStart).TotalSeconds
        $speed = if ($elapsed -gt 0) { $copied / $elapsed } else { 0 }
        $remaining = if ($speed -gt 0) { [int](($totalSize - $copied) / $speed) } else { -1 }

        $barLen = 30
        $filled = [math]::Round($pct / 100 * $barLen)
        $bar = ("#" * $filled) + ("-" * ($barLen - $filled))

        Write-Host ("`r[$(Get-Date -Format 'HH:mm:ss')] [$bar] $pct%  ${copiedGB}/${totalGB}GB  Elapsed:$(FmtTime $elapsed)  ETA:$(FmtTime $remaining)") -NoNewline
        Start-Sleep -Seconds 2
    }

    Complete-BitsTransfer -BitsJob $bitsJob
    Write-Host ""  # newline after progress
}

# -- Helper: start a detached process, surviving this machine's broken Start-Process --
# Start-Process ALWAYS throws here:
#   "Item has already been added. Key in dictionary: 'Path'  Key being added: 'PATH'"
# The throw comes from building the child environment block, so it is target-independent
# (verified with a plain console exe, not just cmd). Fall back to cmd's `start` builtin,
# which needs cmd /c because `start` is a shell builtin. Verified working for GUI exes.
function Start-Detached {
    param([string]$FilePath, [string]$Arguments = "")
    try {
        if ($Arguments) { Start-Process -FilePath $FilePath -ArgumentList $Arguments -ErrorAction Stop | Out-Null }
        else            { Start-Process -FilePath $FilePath -ErrorAction Stop | Out-Null }
        return $true
    } catch {
        Log ("  Start-Process failed (" + $_.Exception.Message + ") - falling back to 'cmd start'") "Yellow"
        try {
            if ($Arguments) { & cmd /c ('start "" "' + $FilePath + '" ' + $Arguments) | Out-Null }
            else            { & cmd /c ('start "" "' + $FilePath + '"') | Out-Null }
            return $true
        } catch {
            Log ("  fallback launch also failed: " + $_.Exception.Message) "Red"
            return $false
        }
    }
}

# ============================================================
# Manifests - 唯一事实来源（Step 1 与 -DryRun 共用一份）
# ============================================================
# 每加一项都必须在三处同名，否则恢复时会命中 if (Test-Path) 后被静默跳过：
#   backup-docker.ps1 这里  /  restore-docker.ps1 的 $dirCopies  /  check_backup.ps1 的 $CfgFiles

# 根级配置。dst = Split-Path -Leaf；dify 目录下的两个会加 dify_ 前缀。
# .env.windows 是 Windows 侧参考副本，老脚本有备、新脚本一度漏了。
$files = @(
    "C:\AIAllInOne\windows\.env",
    "C:\AIAllInOne\windows\.env.windows",
    "C:\AIAllInOne\windows\docker-compose.yml",
    "C:\AIAllInOne\windows\litellm-config.yaml",
    "C:\AIAllInOne\windows\dify\docker\.env",
    "C:\AIAllInOne\windows\dify\docker\docker-compose.yaml"
)

# 配置目录（递归复制到 config/<名>/）
$cfgDirs = @("ghost-theme-corp-portal", "ghost-content-seed", "scripts")

# admin-portal：index.html 引用 /logo.png (L108) 与 vendor/marked.min.js (L172)，
# package.json 决定依赖版本 —— 这几样不备，光还原 server.js + index.html
# 会得到「缺 logo + markdown 预览失效」的站点。
$apMap = @{
    "C:\AIAllInOne\windows\admin-portal\server.js" = "admin-portal_server.js"
    "C:\AIAllInOne\windows\admin-portal\public\index.html" = "admin-portal_index.html"
    "C:\AIAllInOne\windows\admin-portal\data\avail-keys.json" = "admin-portal_avail-keys.json"
    "C:\AIAllInOne\windows\admin-portal\public\logo.png" = "admin-portal_logo.png"
    "C:\AIAllInOne\windows\admin-portal\public\vendor\marked.min.js" = "admin-portal_marked.min.js"
    "C:\AIAllInOne\windows\admin-portal\package.json" = "admin-portal_package.json"
}

# MCP Gateway：compose 把整个 ./mcp-gateway 挂到 /app 并执行 node gateway.js，
# 所以**服务代码本身**必须在备。原先只备了 mcp-servers.json + mcp-skills/，
# 恢复出来会是一个没有代码的网关。（node_modules 可再生，不备。）
$mgMap = @{
    "C:\AIAllInOne\windows\mcp-gateway\gateway.js" = "mcp-gateway_gateway.js"
    "C:\AIAllInOne\windows\mcp-gateway\package.json" = "mcp-gateway_package.json"
    "C:\AIAllInOne\windows\mcp-gateway\package-lock.json" = "mcp-gateway_package-lock.json"
    "C:\AIAllInOne\windows\mcp-gateway\mcp-servers.example.json" = "mcp-gateway_mcp-servers.example.json"
}

# -- Main --
$ts = Get-Date -Format "yyyy-MM-dd_HHmmss"
if ($OutputPath) { $bd = $OutputPath } else { $bd = Join-Path $BackupRoot ("backup_" + $ts) }

# -DryRun 闸门：必须在创建目录之前，保证"一个字节都不写、一个容器都不停"。
# Level 2 会停掉整个平台并拷 ~49 GB 的 VHDX，跑之前值得先看一眼计划。
if ($DryRun) {
    Log "=== DRY RUN - 只打印计划，不写任何文件、不停任何容器 ===" "Cyan"
    Log ("  Level  : " + $Level + $(if ($Level -ge 2) { "  = config + DB dumps + docker_data.vhdx" } else { "  = config + DB dumps" }))
    Log ("  Target : " + $bd)
    Log ("  RetentionDays : " + $RetentionDays)
    Log ""
    $miss = 0; $hit = 0
    Log "  根级配置:" "Yellow"
    foreach ($f in $files) {
        if (Test-Path -LiteralPath $f) { Log ("    OK      " + $f) "Green"; $hit++ }
        else { Log ("    MISSING " + $f) "DarkGray"; $miss++ }
    }
    Log "  admin-portal:" "Yellow"
    foreach ($kv in $apMap.GetEnumerator()) {
        if (Test-Path -LiteralPath $kv.Key) { Log ("    OK      " + $kv.Key + "  ->  " + $kv.Value) "Green"; $hit++ }
        else { Log ("    MISSING " + $kv.Key) "DarkGray"; $miss++ }
    }
    Log "  MCP Gateway:" "Yellow"
    foreach ($kv in $mgMap.GetEnumerator()) {
        if (Test-Path -LiteralPath $kv.Key) { Log ("    OK      " + $kv.Key + "  ->  " + $kv.Value) "Green"; $hit++ }
        else { Log ("    MISSING " + $kv.Key) "DarkGray"; $miss++ }
    }
    Log "  配置目录（递归）:" "Yellow"
    foreach ($d in $cfgDirs) {
        $p = "C:\AIAllInOne\windows\" + $d
        if (Test-Path -LiteralPath $p) { Log ("    OK      " + $d + "/") "Green"; $hit++ }
        else { Log ("    MISSING " + $d + "/") "DarkGray"; $miss++ }
    }
    Log ""
    Log "  数据库 dump: newapi(mysql) keycloak/litellm/dify/langfuse(pg) ghost.db gitea.db" "Yellow"
    Log ""
    if ($Level -ge 2) {
        $vhdxSrc = Join-Path $env:LOCALAPPDATA "Docker\wsl\disk\docker_data.vhdx"
        if (Test-Path -LiteralPath $vhdxSrc) {
            Log ("  VHDX   : " + $vhdxSrc + "   " + [math]::Round((Get-Item $vhdxSrc).Length/1GB,2) + " GB") "Yellow"
            Log "  ⚠ Level 2 会先 docker compose stop 两个项目 + 关掉 Docker Desktop/WSL，平台停机数分钟。" "Yellow"
        } else {
            Log ("  VHDX   : NOT FOUND at " + $vhdxSrc) "Red"
        }
    } else {
        Log "  VHDX   : 跳过（需要 -Level 2）" "DarkGray"
    }
    # 注意：Split-Path -Qualifier 返回的是 "C:"（带冒号），而 Get-PSDrive 只认 "C"
    $q = Split-Path -Qualifier $BackupRoot -ErrorAction SilentlyContinue
    $dr = $null
    if ($q) { $dr = Get-PSDrive $q.TrimEnd(':') -ErrorAction SilentlyContinue }
    if ($dr) { Log ("  目标盘可用空间: " + [math]::Round($dr.Free/1GB,1) + " GB") "Yellow" }
    Log ""
    Log ("SUMMARY: 就绪 " + $hit + " 项 · 缺失 " + $miss + " 项") "Cyan"
    Log "DRY RUN 结束，未改动任何文件。" "Cyan"
    Stop-Transcript | Out-Null
    exit 0
}

Log "=== AI AllInOne Backup Level $Level ===" "Cyan"
Log "Target: $bd"
Log ""

New-Item -ItemType Directory -Path $bd -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bd "config") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bd "db") -Force | Out-Null

# ============================================================
# Step 1: Config files
# ============================================================
Log "[1/4] Config files..." "Yellow"

foreach ($f in $files) {
    if (Test-Path $f) {
        $leaf = Split-Path $f -Leaf
        if ($f -like "*dify*") { $leaf = "dify_" + $leaf }
        Copy-Item $f (Join-Path (Join-Path $bd "config") $leaf) -Force
        Log ("  $leaf OK") "Green"
    }
}

# admin-portal files（清单在文件顶部的 $apMap，Step 1 与 -DryRun 共用）
foreach ($kv in $apMap.GetEnumerator()) {
    if (Test-Path $kv.Key) {
        Copy-Item $kv.Key (Join-Path (Join-Path $bd "config") $kv.Value) -Force
        Log ("  " + $kv.Value + " OK") "Green"
    }
}

# MCP Gateway 服务代码（清单在顶部的 $mgMap）
foreach ($kv in $mgMap.GetEnumerator()) {
    if (Test-Path $kv.Key) {
        Copy-Item $kv.Key (Join-Path (Join-Path $bd "config") $kv.Value) -Force
        Log ("  " + $kv.Value + " OK") "Green"
    }
}

# Ghost theme and content
foreach ($d in $cfgDirs) {
    $src = "C:\AIAllInOne\windows\" + $d
    if (Test-Path $src) { Copy-Item $src (Join-Path (Join-Path $bd "config") $d) -Recurse -Force }
}

# DSH db (live copy: admin-portal reads /app/dsh-updates/db/dsh.db)
if (Test-Path "C:\AIAllInOne\windows\admin-portal\dsh-updates\db\dsh.db") {
    Copy-Item "C:\AIAllInOne\windows\admin-portal\dsh-updates\db\dsh.db" (Join-Path (Join-Path $bd "config") "dsh.db") -Force
}

# Dify full docker directory (nginx, ssrf_proxy, sandbox configs, etc.)
# Exclude volumes/db (backed up via pg_dump) to save space
$difyDocker = "C:\AIAllInOne\windows\dify\docker"
if (Test-Path $difyDocker) {
    $difyDst = Join-Path (Join-Path $bd "config") "dify-docker"
    New-Item -ItemType Directory -Path $difyDst -Force | Out-Null
    # Copy top-level configs (nginx, ssrf_proxy, .env, docker-compose.yaml, etc.)
    # Use robocopy for consistent long-path support; exclude volumes (handled below)
    & robocopy $difyDocker $difyDst /E /R:1 /W:1 /NFL /NDL /NJH /NJS /XD volumes 2>$null | Out-Null
    # Copy volumes subdirs except db (already in pg_dump) and known caches
    # Use robocopy instead of Copy-Item: handles long paths (uv/pip cache dirs hit 260-char limit)
    # Exclude: db (pg_dump), .uv-cache (uv package cache), .venv (Python venvs, recreable),
    #          __pycache__, node_modules — all fully regenerable, waste space and cause symlink errors
    $volSrc = Join-Path $difyDocker "volumes"
    $volDst = Join-Path $difyDst "volumes"
    New-Item -ItemType Directory -Path $volDst -Force | Out-Null
    & robocopy $volSrc $volDst /E /R:0 /W:0 /NFL /NDL /NJH /NJS /XD db .uv-cache .venv __pycache__ node_modules 2>$null | Out-Null
    if ($LASTEXITCODE -le 7) { Log "  dify docker/volumes/ OK (robocopy)" "Green" }
    else { Log ("  dify docker/volumes/ copied with warnings (robocopy exit " + $LASTEXITCODE + ")") "Yellow" }
}

# Embedder + Reranker model caches (2.2GB each, can re-download but slow)
$modelCaches = @(
    @{ name="embedder-model-cache"; src="C:\AIAllInOne\windows\dify-embedder\model-cache" }
    @{ name="reranker-model-cache"; src="C:\AIAllInOne\windows\dify-reranker\model-cache" }
)
foreach ($mc in $modelCaches) {
    if (Test-Path $mc.src) {
        $mcDst = Join-Path (Join-Path $bd "config") $mc.name
        $mcSizeGB = [math]::Round((Get-ChildItem $mc.src -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Log ("  " + $mc.name + " (" + $mcSizeGB + " GB) copying...")
        Copy-Item $mc.src $mcDst -Recurse -Force
        Log ("  " + $mc.name + " OK") "Green"
    }
}

# Gitea runner config
$runnerCfg = "C:\AIAllInOne\windows\gitea-runner-config.yaml"
if (Test-Path $runnerCfg) {
    Copy-Item $runnerCfg (Join-Path (Join-Path $bd "config") "gitea-runner-config.yaml") -Force
}

# Monitoring stack configs (Prometheus, Alertmanager, Loki, Promtail, Grafana)
$monSrc = "C:\AIAllInOne\windows\monitoring"
if (Test-Path $monSrc) {
    Copy-Item $monSrc (Join-Path (Join-Path $bd "config") "monitoring") -Recurse -Force
}

# Update server nginx config
$usNginx = "C:\AIAllInOne\windows\update-server-nginx.conf"
if (Test-Path $usNginx) {
    Copy-Item $usNginx (Join-Path (Join-Path $bd "config") "update-server-nginx.conf") -Force
}

# MCP Gateway config + skills
$mcpDir = "C:\AIAllInOne\windows\mcp-gateway"
if (Test-Path (Join-Path $mcpDir "mcp-servers.json")) {
    Copy-Item (Join-Path $mcpDir "mcp-servers.json") (Join-Path (Join-Path $bd "config") "mcp-servers.json") -Force
}
if (Test-Path (Join-Path $mcpDir "skills")) {
    Copy-Item (Join-Path $mcpDir "skills") (Join-Path (Join-Path $bd "config") "mcp-skills") -Recurse -Force
}

Log "  Config OK" "Green"
Log ""

# ============================================================
# Step 1b: Extra data (DSH installers + Docker volumes)
# ============================================================
Log "[1b] Extra data..." "Yellow"

# DSH installers (Windows filesystem, ~1.9GB)
$dshSrc = "C:\AIAllInOne\windows\dsh-updates\dsh"
if (Test-Path $dshSrc) {
    $dshSize = [math]::Round((Get-ChildItem $dshSrc -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
    Log ("  DSH installers: " + $dshSize + " GB, copying...")
    $dshDst = Join-Path (Join-Path $bd "config") "dsh-installers"
    Copy-Item $dshSrc $dshDst -Recurse -Force
    Log "  DSH installers OK" "Green"
}

# Docker volumes: Ghost content, Gitea repos, MinIO
New-Item -ItemType Directory -Path (Join-Path $bd "volumes") -Force | Out-Null

$volumeBackups = @(
    @{ name="ghost-content";      c="ghost";          src="/var/lib/ghost/content" }
    @{ name="gitea-data";         c="gitea";          src="/data" }
    @{ name="minio-data";         c="langfuse-minio"; src="/data" }
    @{ name="grafana-data";       c="grafana";        src="/var/lib/grafana" }
)
# NOTE: dify-plugin_daemon /app/storage is a BIND mount to dify\docker\volumes\plugin_daemon,
# already covered by the dify-docker full directory copy above - no tar backup needed.

# NOTE: Dify bind mounts (volumes\app\storage, volumes\weaviate, ...) are already
# included in the dify-docker full directory copy above - no separate copy needed.

foreach ($v in $volumeBackups) {
    $tarDst = Join-Path (Join-Path $bd "volumes") ($v.name + ".tar")
    Log ("  " + $v.name + " ...") "Yellow"
    # docker cp container:path . creates a tar to stdout
    & cmd /c ("docker cp " + $v.c + ":" + $v.src + " - > `"" + $tarDst + "`"")
    if (Test-Path $tarDst) {
        $vSizeMB = [math]::Round((Get-Item $tarDst).Length / 1MB, 1)
        Log ("  " + $v.name + " OK (" + $vSizeMB + " MB)") "Green"
    } else {
        Log ("  " + $v.name + " FAIL") "Red"
    }
}

Log ""

# ============================================================
# Step 2: Database dumps
# ============================================================
Log "[2/4] Database dumps..." "Yellow"

$pgDbs = @(
    @{ name="keycloak";  c="keycloak-db";        u="keycloak" }
    @{ name="litellm";   c="litellm-db";         u="litellm" }
    @{ name="dify";      c="dify-db_postgres-1"; u="postgres" }
    @{ name="langfuse";  c="langfuse-postgres";  u="langfuse" }
)
foreach ($db in $pgDbs) {
    $outFile = Join-Path (Join-Path $bd "db") ($db.name + ".sql")
    $t0 = Get-Date
    # IMPORTANT: use cmd redirect, NOT PowerShell pipe (Out-File re-encodes to UTF-16/BOM and corrupts non-ASCII data)
    # --clean --if-exists: emit DROP statements so restore works on an already-initialized database
    & cmd /c ("docker exec " + $db.c + " pg_dump -U " + $db.u + " --clean --if-exists " + $db.name + " > `"" + $outFile + "`"")
    $sec = [int]((Get-Date) - $t0).TotalSeconds
    if ((Test-Path $outFile) -and ((Get-Item $outFile).Length -gt 1KB)) {
        Log ("  " + $db.name + " OK (" + $sec + "s)") "Green"
    } else {
        Log ("  " + $db.name + " FAIL (dump missing or empty)") "Red"
    }
}

# MySQL
$naOut = Join-Path (Join-Path $bd "db") "newapi.sql"
$t0 = Get-Date
& cmd /c "docker exec new-api-db mysqldump -uroot -p!QAZ@WSX123456 --single-transaction new-api > `"$naOut`""
$sec = [int]((Get-Date) - $t0).TotalSeconds
if (Test-Path $naOut) { Log ("  newapi OK (" + $sec + "s)") "Green" } else { Log "  newapi FAIL" "Red" }

# SQLite
$ghostDest = Join-Path (Join-Path $bd "db") "ghost.db"
$giteaDest = Join-Path (Join-Path $bd "db") "gitea.db"
& cmd /c "docker cp ghost:/var/lib/ghost/content/data/ghost.db `"$ghostDest`""
if (Test-Path $ghostDest) { Log "  ghost OK" "Green" } else { Log "  ghost FAIL" "Red" }
& cmd /c "docker cp gitea:/data/gitea/gitea.db `"$giteaDest`""
if (Test-Path $giteaDest) { Log "  gitea OK" "Green" } else { Log "  gitea FAIL" "Red" }

Log ""

# ============================================================
# Step 3: Container state
# ============================================================
Log "[3/4] Container state..." "Yellow"
docker ps --format "table {{.Names}}`t{{.Image}}`t{{.Status}}" | Out-File (Join-Path $bd "containers.txt") -Encoding utf8
docker images --format "table {{.Repository}}:{{.Tag}}`t{{.Size}}" | Out-File (Join-Path $bd "images.txt") -Encoding utf8
Log "  State recorded" "Green"

# Backup the backup/restore scripts themselves (they live on C:, which may be the disk that died)
$scriptsDst = Join-Path $bd "scripts"
New-Item -ItemType Directory -Path $scriptsDst -Force | Out-Null
Get-ChildItem "C:\AIAllInOne\Backup" -Filter "*.ps1" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName $scriptsDst -Force
}
Log "  Backup scripts copied to backup\scripts\" "Green"
Log ""

# ============================================================
# Step 4: VHDX backup (Level 2)  —— 旧 Level 3，去掉镜像导出后的最高等级
# ============================================================
# 整块包 try/catch：这是唯一会停平台、拷 49 GB、可能因磁盘满而失败的步骤。
# 失败绝不能拖死整个备份 —— config/db 已经写好了，那部分仍然是有用的 L1。
if ($Level -ge 2) {
    try {
        Log "[4/4] VHDX backup..." "Yellow"

        # Stop containers gracefully first (flushes DB write-ahead logs)
        Log "  Stopping containers for clean snapshot..."
        & cmd /c "docker compose -f C:\AIAllInOne\windows\docker-compose.yml stop"
        & cmd /c "docker compose -f C:\AIAllInOne\windows\dify\docker\docker-compose.yaml stop"
        Start-Sleep -Seconds 5
        Log "  Containers stopped" "Green"

        # Stop Docker Desktop + WSL: the VHDX stays LOCKED by the WSL VM until wsl --shutdown
        Log "  Stopping Docker Desktop + WSL (releases VHDX lock)..."
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "com.docker.backend" -Force -ErrorAction SilentlyContinue
        & wsl --shutdown 2>$null
        Start-Sleep -Seconds 10

        $vhdxSrc = Join-Path $env:LOCALAPPDATA "Docker\wsl\disk\docker_data.vhdx"
        $vhdxDst = Join-Path $bd "docker_data.vhdx"
        if (Test-Path $vhdxSrc) {
            $srcGB = [math]::Round((Get-Item $vhdxSrc).Length / 1GB, 1)
            $needGB = [math]::Round($srcGB * 1.05 + 1, 1)
            # Split-Path -Qualifier 给的是 "C:"，Get-PSDrive 只认 "C"
            $q2 = Split-Path -Qualifier $vhdxDst -ErrorAction SilentlyContinue
            $tgt = $null
            if ($q2) { $tgt = Get-PSDrive $q2.TrimEnd(':') -ErrorAction SilentlyContinue }
            if ($tgt -and ($tgt.Free / 1GB) -lt $needGB) {
                throw ("目标盘空间不足：需要约 " + $needGB + " GB，可用只有 " + [math]::Round($tgt.Free/1GB,1) + " GB")
            }
            Log ("  Copying VHDX (" + $srcGB + " GB)...")
            Copy-Item $vhdxSrc $vhdxDst -Force
            $dstGB = [math]::Round((Get-Item $vhdxDst).Length / 1GB, 1)
            Log ("  VHDX done: " + $dstGB + " GB") "Green"
        } else {
            Log ("  VHDX not found: " + $vhdxSrc) "Red"
        }
    } catch {
        Log ("  VHDX step FAILED - 不中断备份：" + $_.Exception.Message) "Red"
        Log "  config/ 与 db/ 已经写好，这份备份依然可用（相当于 Level 1）。" "Yellow"
    } finally {
        # 无论 VHDX 成没成，平台都必须被拉起来 —— 否则会留下一个停机状态。
        Log "  Restarting Docker Desktop..."
        $exe = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"
        $null = Start-Detached -FilePath $exe
        Log "  Waiting for Docker engine..."
        $engineReady = $false
        foreach ($i in 1..36) {   # up to 180 seconds
            Start-Sleep -Seconds 5
            # cmd wrapper avoids PowerShell 5.1 native-command stderr bug
            # (2>$null on native commands doesn't suppress stderr with $ErrorActionPreference = "Stop")
            & cmd /c "docker info >nul 2>&1"
            if ($LASTEXITCODE -eq 0) { $engineReady = $true; break }
        }
        if ($engineReady) {
            Log "  Docker engine ready" "Green"
            & cmd /c "docker compose -f C:\AIAllInOne\windows\docker-compose.yml start"
            & cmd /c "docker compose -f C:\AIAllInOne\windows\dify\docker\docker-compose.yaml start"
            Start-Sleep -Seconds 10
            $cnt = (docker ps -q 2>$null | Measure-Object).Count
            Log ("  Containers restarted: " + $cnt) "Green"
        } else {
            Log "  Docker engine NOT ready after 180s - start it manually and run:" "Red"
            Log "    docker compose -f C:\AIAllInOne\windows\docker-compose.yml start" "Red"
            Log "    docker compose -f C:\AIAllInOne\windows\dify\docker\docker-compose.yaml start" "Red"
        }
    }
} else {
    Log "[4/4] Skip VHDX (need Level 2)" "DarkGray"
    Log "  Level 1 = config + DB dumps only。" "DarkGray"
}

# ============================================================
# Step 6: Retention - prune old backups under the same root
# ============================================================
# Only directories named backup_* under $BackupRoot are eligible. The current
# run ($bd) is always kept. Anything NOT matching backup_* (reports\, archive-*,
# docs-html\, ...) is never touched. The old windows\scripts\backup.ps1 had a
# 7-day prune; this replaces it with $RetentionDays (default 30).
if ($bd -and $RetentionDays -gt 0) {
    $retRoot = Split-Path -Parent $bd
    Log ("[retention] Keep last " + $RetentionDays + " days under " + $retRoot) "Yellow"
    $cut = (Get-Date).AddDays(-$RetentionDays)
    $bdFull = $null
    try { $bdFull = (Resolve-Path -LiteralPath $bd -ErrorAction Stop).Path } catch {}
    $victims = @()
    if (Test-Path -LiteralPath $retRoot) {
        $victims = @(Get-ChildItem -LiteralPath $retRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -like 'backup_*' -and
                $_.LastWriteTime -lt $cut -and
                (-not $bdFull -or $_.FullName -ne $bdFull)
            })
    }
    if ($victims.Count -eq 0) {
        Log "  nothing to prune" "DarkGray"
    } else {
        $freed = 0
        foreach ($v in $victims) {
            $vBytes = (Get-ChildItem -LiteralPath $v.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if (-not $vBytes) { $vBytes = 0 }
            try {
                Remove-Item -LiteralPath $v.FullName -Recurse -Force -ErrorAction Stop
                $freed += $vBytes
                Log ("  pruned " + $v.Name + "  " + [math]::Round($vBytes / 1MB, 1) + " MB  (" + $v.LastWriteTime.ToString('yyyy-MM-dd') + ")") "DarkGray"
            } catch {
                Log ("  prune FAILED " + $v.Name + ": " + $_.Exception.Message) "Red"
            }
        }
        Log ("  pruned " + $victims.Count + " dir(s), freed " + [math]::Round($freed / 1MB, 1) + " MB") "Green"
    }
} else {
    Log "[retention] skipped (RetentionDays = 0 or no target)" "DarkGray"
}

# ============================================================
# Summary
# ============================================================
$totalBytes = (Get-ChildItem $bd -Recurse -File | Measure-Object -Property Length -Sum).Sum
if ($totalBytes -gt 1GB) {
    $sizeLabel = "{0:N1} GB" -f ($totalBytes / 1GB)
} else {
    $sizeLabel = "{0:N1} MB" -f ($totalBytes / 1MB)
}

$totalElapsed = [int]((Get-Date) - $scriptStart).TotalSeconds
Log ""
Log "=== Backup Complete ===" "Green"
Log ("  Path: " + $bd)
Log ("  Size: " + $sizeLabel)
Log ("  Total time: " + (FmtTime $totalElapsed))
Log ""
$restoreHint = ".\restore-docker.ps1 -BackupDir `"" + $bd + "`""
Log ("  Restore: " + $restoreHint) "Cyan"
Log ("  Log file: " + $logFile) "DarkGray"

Stop-Transcript | Out-Null
