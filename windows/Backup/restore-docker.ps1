# AI AllInOne Docker Restore Script
# Usage: .\restore-docker.ps1 -BackupDir "F:\Backup\Docker\backup_xxx"
#        .\restore-docker.ps1 -BackupDir "..." -DryRun      # 只解析+列计划，不写任何东西
#
# Strategies:
#   A) VHDX present  -> replace data disk, instant restore
#   B) No VHDX       -> import images, restore configs, restore DBs
#
# 老命名兼容：2026-09-12 之前的备份把 admin-portal 的文件存成裸名
#   （server.js / index.html / avail-keys.json ...），dify 配置用连字符。
#   本脚本两种名字都认，命中别名时会打日志说明，不再静默跳过。

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupDir,
    [switch]$SkipImages,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$scriptStart = Get-Date

# -- Logging setup --
$logDir = Join-Path $PSScriptRoot "logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("restore-docker-" + (Get-Date -Format "yyyy-MM-dd-HH-mm-ss") + ".log")

# Transcript captures ALL console output (commands, errors, stdout) - survives crashes because
# StreamWriter flushes on each newline. Even if the machine reboots, the file has content.
Start-Transcript -Path $logFile -Force | Out-Null

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

# -- Helper: exit with transcript cleanup --
function Exit-Script {
    param([int]$code = 0)
    try { Stop-Transcript | Out-Null } catch {}
    exit $code
}
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
# Detect backup contents
# ============================================================
Log "=== AI AllInOne Docker Restore ===" "Cyan"
Log ("From: " + $BackupDir)
Log ""

if (!(Test-Path $BackupDir)) {
    Log ("ERROR: Not found: " + $BackupDir) "Red"
    Exit-Script 1
}

$hasVhdx    = Test-Path (Join-Path $BackupDir "docker_data.vhdx")
$hasImages  = Test-Path (Join-Path $BackupDir "images")
$dbDir      = Join-Path $BackupDir "db"
$hasDb      = Test-Path $dbDir
$cfgDir     = Join-Path $BackupDir "config"
$hasCfg     = Test-Path $cfgDir

Log "Backup contents:" "Yellow"
Log ("  VHDX:            " + $(if($hasVhdx){"YES"}else{"NO"}))
Log ("  Images:          " + $(if($hasImages){"YES"}else{"NO"}))
Log ("  Database dumps:  " + $(if($hasDb){"YES"}else{"NO"}))
Log ("  Config + volumes:" + $(if($hasCfg){"YES"}else{"NO"}))
Log ""

# ============================================================
# Config manifests - single source of truth
# ============================================================
# 这份清单同时被 Restore-Configs 和 -DryRun 使用。刻意只写一份：
# 两份拷贝迟早会漂移，而"名字对不上"正是 2026-09-11 那次恢复静默漏文件的根因。
$RootCfgTargets = [ordered]@{
    ".env"                      = "C:\AIAllInOne\windows\.env"
    ".env.windows"              = "C:\AIAllInOne\windows\.env.windows"
    "docker-compose.yml"        = "C:\AIAllInOne\windows\docker-compose.yml"
    "litellm-config.yaml"       = "C:\AIAllInOne\windows\litellm-config.yaml"
    "dify_.env"                 = "C:\AIAllInOne\windows\dify\docker\.env"
    "dify_docker-compose.yaml"  = "C:\AIAllInOne\windows\dify\docker\docker-compose.yaml"
    "update-server-nginx.conf"  = "C:\AIAllInOne\windows\update-server-nginx.conf"
    "mcp-servers.json"          = "C:\AIAllInOne\windows\mcp-gateway\mcp-servers.json"
    "gitea-runner-config.yaml"  = "C:\AIAllInOne\windows\gitea-runner-config.yaml"
    # live DB: admin-portal 容器内读 /app/dsh-updates/db/dsh.db，/app 挂的是 .\admin-portal
    "dsh.db"                    = "C:\AIAllInOne\windows\admin-portal\dsh-updates\db\dsh.db"
}

# admin-portal 单文件。名字必须与 backup-docker.ps1 的 $apMap /
# check_backup.ps1 的 $CfgFiles 三处一致。
$ApCfgTargets = @(
    @{ s = "admin-portal_server.js";       d = "C:\AIAllInOne\windows\admin-portal\server.js" }
    @{ s = "admin-portal_index.html";      d = "C:\AIAllInOne\windows\admin-portal\public\index.html" }
    @{ s = "admin-portal_avail-keys.json"; d = "C:\AIAllInOne\windows\admin-portal\data\avail-keys.json" }
    @{ s = "admin-portal_logo.png";        d = "C:\AIAllInOne\windows\admin-portal\public\logo.png" }
    @{ s = "admin-portal_marked.min.js";   d = "C:\AIAllInOne\windows\admin-portal\public\vendor\marked.min.js" }
    @{ s = "admin-portal_package.json";    d = "C:\AIAllInOne\windows\admin-portal\package.json" }
)

# MCP Gateway 服务代码。compose 把整个 ./mcp-gateway 挂到 /app 并跑 node gateway.js，
# 只恢复 mcp-servers.json + skills 会得到一个没有代码的网关。
$MgCfgTargets = @(
    @{ s = "mcp-gateway_gateway.js";             d = "C:\AIAllInOne\windows\mcp-gateway\gateway.js" }
    @{ s = "mcp-gateway_package.json";           d = "C:\AIAllInOne\windows\mcp-gateway\package.json" }
    @{ s = "mcp-gateway_package-lock.json";      d = "C:\AIAllInOne\windows\mcp-gateway\package-lock.json" }
    @{ s = "mcp-gateway_mcp-servers.example.json"; d = "C:\AIAllInOne\windows\mcp-gateway\mcp-servers.example.json" }
)

$RecCfgTargets = @(
    @{ s = "ghost-theme-corp-portal"; d = "C:\AIAllInOne\windows\ghost-theme-corp-portal" }
    @{ s = "ghost-content-seed";      d = "C:\AIAllInOne\windows\ghost-content-seed" }
    @{ s = "scripts";                 d = "C:\AIAllInOne\windows\scripts" }
    @{ s = "monitoring";              d = "C:\AIAllInOne\windows\monitoring" }
    @{ s = "mcp-skills";              d = "C:\AIAllInOne\windows\mcp-gateway\skills" }
    @{ s = "dsh-installers";          d = "C:\AIAllInOne\windows\dsh-updates\dsh" }
    @{ s = "dify-docker";             d = "C:\AIAllInOne\windows\dify\docker" }
    @{ s = "embedder-model-cache";    d = "C:\AIAllInOne\windows\dify-embedder\model-cache" }
    @{ s = "reranker-model-cache";    d = "C:\AIAllInOne\windows\dify-reranker\model-cache" }
)

# ============================================================
# Legacy name aliases
# ============================================================
# Older backups stored the admin-portal files under bare names and the dify config
# with a dash instead of an underscore. restore-docker.ps1 only looked for the
# canonical names, so a perfectly good backup (backup_2026-09-10_231020_full) had
# its admin-portal content silently skipped. Aliases below fix that; every fallback
# hit is logged so it is never silent again.
$CfgAliases = @{
    "dify_.env"                    = @("dify.env")
    "dify_docker-compose.yaml"     = @("dify-docker-compose.yaml")
    "admin-portal_server.js"       = @("server.js")
    "admin-portal_index.html"      = @("index.html")
    "admin-portal_avail-keys.json" = @("avail-keys.json")
    "admin-portal_logo.png"        = @("logo.png")
    "admin-portal_marked.min.js"   = @("marked.min.js")
    "admin-portal_package.json"    = @("package.json")
}
$script:LegacyHits = New-Object System.Collections.ArrayList

function Resolve-CfgSource {
    # 规范名 -> config\ 下的真实路径；不在时依次试老命名别名。
    # 返回 $null 表示真缺失。命中别名会记进 $script:LegacyHits。
    param([string]$Name)
    $p = Join-Path $cfgDir $Name
    if (Test-Path -LiteralPath $p) { return $p }
    if ($CfgAliases.ContainsKey($Name)) {
        foreach ($alt in $CfgAliases[$Name]) {
            $q = Join-Path $cfgDir $alt
            if (Test-Path -LiteralPath $q) {
                [void]$script:LegacyHits.Add($Name + "  <- " + $alt)
                return $q
            }
        }
    }
    return $null
}

# ============================================================
# -DryRun: 只解析路径 + 列计划，一个字节都不写
# ============================================================
# 存在的意义：改恢复逻辑之前，先拿一份真备份印证"它现在能取到哪些文件"。
# 放在所有破坏性动作（换数据盘 / 导入镜像 / 还原数据库）之前，DryRun 时直接退出。
if ($DryRun) {
    Log "=== DRY RUN - 只解析路径并列出计划，不写任何文件 ===" "Cyan"
    Log ("  config 目录: " + $cfgDir)
    Log ""
    if (-not $hasCfg) {
        Log "  没有 config\ 目录，恢复不了任何配置。" "Red"
        Exit-Script 1
    }

    $nHit = 0; $nLegacy = 0; $nMiss = 0

    Log "-- 根级配置 --" "Yellow"
    foreach ($f in $RootCfgTargets.Keys) {
        $src = Resolve-CfgSource $f
        if (-not $src) {
            Log ("  MISSING  " + $f) "DarkGray"; $nMiss++
        } elseif ($script:LegacyHits.Count -gt 0 -and $script:LegacyHits[$script:LegacyHits.Count - 1] -like ($f + "  <- *")) {
            Log ("  LEGACY   " + $f + "   ->  " + $RootCfgTargets[$f]) "Yellow"
            Log ("           " + $script:LegacyHits[$script:LegacyHits.Count - 1]) "DarkGray"
            $nLegacy++
        } else {
            Log ("  OK       " + $f + "   ->  " + $RootCfgTargets[$f]) "Green"
            $nHit++
        }
    }

    Log "-- admin-portal 单文件 --" "Yellow"
    foreach ($dc in $ApCfgTargets) {
        $src = Resolve-CfgSource $dc.s
        if (-not $src) {
            Log ("  MISSING  " + $dc.s) "DarkGray"; $nMiss++
        } elseif ($script:LegacyHits.Count -gt 0 -and $script:LegacyHits[$script:LegacyHits.Count - 1] -like ($dc.s + "  <- *")) {
            Log ("  LEGACY   " + $dc.s + "   ->  " + $dc.d) "Yellow"
            Log ("           " + $script:LegacyHits[$script:LegacyHits.Count - 1]) "DarkGray"
            $nLegacy++
        } else {
            Log ("  OK       " + $dc.s + "   ->  " + $dc.d) "Green"
            $nHit++
        }
    }

    Log "-- MCP Gateway 服务代码 --" "Yellow"
    foreach ($dc in $MgCfgTargets) {
        $src = Resolve-CfgSource $dc.s
        if (-not $src) {
            Log ("  MISSING  " + $dc.s) "DarkGray"; $nMiss++
        } elseif ($script:LegacyHits.Count -gt 0 -and $script:LegacyHits[$script:LegacyHits.Count - 1] -like ($dc.s + "  <- *")) {
            Log ("  LEGACY   " + $dc.s + "   ->  " + $dc.d) "Yellow"; $nLegacy++
        } else {
            Log ("  OK       " + $dc.s + "   ->  " + $dc.d) "Green"; $nHit++
        }
    }

    Log "-- 目录（递归） --" "Yellow"
    foreach ($dc in $RecCfgTargets) {
        if (Test-Path -LiteralPath (Join-Path $cfgDir $dc.s)) {
            Log ("  OK       " + $dc.s + "/   ->  " + $dc.d) "Green"; $nHit++
        } else {
            Log ("  MISSING  " + $dc.s + "/") "DarkGray"; $nMiss++
        }
    }

    Log ""
    Log ("SUMMARY: 直接命中 " + $nHit + " · 老命名兼容 " + $nLegacy + " · 缺失 " + $nMiss) "Cyan"
    if ($nLegacy -gt 0) {
        Log "  老命名项 restore 已能读取（这是本次兼容改动的目的）。" "Yellow"
    }
    Log "DRY RUN 结束，未改动任何文件。" "Cyan"
    Exit-Script 0
}

# ============================================================
# Config restore (shared by Strategy A and Strategy B)
# Restores Windows-side bind mount data - this is NOT inside the VHDX
# ============================================================
function Restore-Configs {
    $script:LegacyHits.Clear()

    foreach ($f in $RootCfgTargets.Keys) {
        $src = Resolve-CfgSource $f
        if ($src) {
            $dst = $RootCfgTargets[$f]
            $dstDir = Split-Path $dst -Parent
            if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
            Copy-Item $src $dst -Force
            Log ("  " + $f + " OK") "Green"
        }
    }

    foreach ($dc in $ApCfgTargets) {
        $src = Resolve-CfgSource $dc.s
        if ($src) {
            $dstDir = Split-Path $dc.d -Parent
            if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
            Copy-Item $src $dc.d -Force
            Log ("  " + $dc.s + " OK") "Green"
        }
    }

    foreach ($dc in $MgCfgTargets) {
        $src = Resolve-CfgSource $dc.s
        if ($src) {
            $dstDir = Split-Path $dc.d -Parent
            if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
            Copy-Item $src $dc.d -Force
            Log ("  " + $dc.s + " OK") "Green"
        }
    }

    foreach ($dc in $RecCfgTargets) {
        $src = Join-Path $cfgDir $dc.s
        if (Test-Path -LiteralPath $src) {
            Copy-Item $src $dc.d -Recurse -Force
            Log ("  " + $dc.s + "/ OK") "Green"
        }
    }

    if ($script:LegacyHits.Count -gt 0) {
        Log ("  [老命名兼容] " + $script:LegacyHits.Count + " 个文件是按老名字取到的：") "Yellow"
        foreach ($h in $script:LegacyHits) { Log ("    " + $h) "DarkGray" }
    }
}

# ============================================================
# Strategy A: VHDX replace
# ============================================================
if ($hasVhdx) {
    Log "=== Strategy A: VHDX Replace ===" "Green"
    Log "Replaces Docker data disk (images, named volumes, DBs inside containers)."
    Log ""
    $confirm = Read-Host "Confirm replace Docker data disk? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') { Log "Cancelled." "Red"; Exit-Script }

    Log "[1/3] Stopping Docker..." "Yellow"
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "com.docker.backend" -Force -ErrorAction SilentlyContinue
    & wsl --shutdown 2>$null
    Start-Sleep -Seconds 5

    Log "[2/3] Replacing data disk..." "Yellow"
    $vhdxPath = Join-Path $env:LOCALAPPDATA "Docker\wsl\disk\docker_data.vhdx"
    if (Test-Path $vhdxPath) {
        $bakPath = $vhdxPath + ".old_" + (Get-Date -Format 'yyyyMMdd')
        Rename-Item $vhdxPath $bakPath -Force
        Log ("  Old disk: " + $bakPath) "DarkGray"
    }
    Copy-Item (Join-Path $BackupDir "docker_data.vhdx") $vhdxPath -Force
    Log "  Data disk replaced" "Green"

    Log "[3/3] Starting Docker..." "Yellow"
    $null = Start-Detached -FilePath (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe")
    Log "  Waiting for Docker engine..."
    $engineReady = $false
    foreach ($i in 1..36) {   # up to 180 seconds
        Start-Sleep -Seconds 5
        # cmd wrapper avoids PowerShell 5.1 native-command stderr bug
        & cmd /c "docker info >nul 2>&1"
        if ($LASTEXITCODE -eq 0) { $engineReady = $true; break }
    }
    if ($engineReady) { Log "  Docker engine ready" "Green" }
    else { Log "  Docker engine NOT ready after 180s - start it manually" "Red" }

    # Explicitly start both compose projects (restart policies alone are not reliable)
    & cmd /c "docker compose -f C:\AIAllInOne\windows\docker-compose.yml start" 2>$null
    & cmd /c "docker compose -f C:\AIAllInOne\windows\dify\docker\docker-compose.yaml start" 2>$null
    Start-Sleep -Seconds 10
    $cnt = (docker ps -q 2>$null | Measure-Object).Count
    Log ("  Containers running: " + $cnt) "Green"

    # The VHDX only contains Docker-internal data (images, named volumes, container layers).
    # Bind-mounted files (Dify configs/app-storage/weaviate, model caches, monitoring,
    # MCP gateway, admin-portal, ...) live on C: and are NOT inside the VHDX.
    if ($hasCfg) {
        Log "NOTE: Windows-side files are NOT inside the VHDX." "Yellow"
        $cfgConfirm = Read-Host "Also restore Windows-side configs? Overwrites C:\AIAllInOne\windows (y/N)"
        if ($cfgConfirm -eq 'y' -or $cfgConfirm -eq 'Y') {
            Restore-Configs
            # Restart services that read these configs at startup
            & cmd /c "docker compose -f C:\AIAllInOne\windows\docker-compose.yml restart" 2>$null
            & cmd /c "docker compose -f C:\AIAllInOne\windows\dify\docker\docker-compose.yaml restart" 2>$null
        }
    }

    $elapsed = [int]((Get-Date) - $scriptStart).TotalSeconds
    Log ("=== Done! Containers: " + $cnt + " | Time: " + (FmtTime $elapsed) + " ===") "Green"
    Exit-Script
}

# ============================================================
# Strategy B: Full restore from dumps + configs
# ============================================================
Log "=== Strategy B: Full Restore ===" "Green"

# -- Step 1: Ensure Docker --
Log "[1/8] Ensure Docker running..." "Yellow"
# cmd wrapper avoids PS5.1 native-command stderr bug (same fix as backup script)
& cmd /c "docker info >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
    Log "  Starting Docker Desktop..." "DarkGray"
    $null = Start-Detached -FilePath (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe")
    Start-Sleep -Seconds 60
}
Log "  Docker ready" "Green"

# -- Step 2: Import images --
if (!$SkipImages -and $hasImages) {
    Log "[2/8] Importing images..." "Yellow"
    $tarFiles = Get-ChildItem (Join-Path $BackupDir "images") -Filter "*.tar*"
    $importStart = Get-Date
    $i = 0
    foreach ($tar in $tarFiles) {
        $i++
        Log ("  [" + $i + "/" + $tarFiles.Count + "] " + $tar.Name)
        $t0 = Get-Date
        # docker load natively handles gzip/bzip2/xz compressed tars (.tar.gz) - no external gzip needed
        docker load -i $tar.FullName
        $sec = [int]((Get-Date) - $t0).TotalSeconds
        Log ("    Done (" + (FmtTime $sec) + ")") "Green"
    }
    if ($tarFiles.Count -eq 0) {
        Log "  No images in backup, importing from windows-image..." "DarkGray"
        $imgDir = "C:\AIAllInOne\windows-image"
        if (Test-Path $imgDir) {
            $imgFiles = Get-ChildItem $imgDir -Filter "*.tar.gz"
            foreach ($f in $imgFiles) {
                $i++
                Log ("  [" + $i + "/" + $imgFiles.Count + "] " + $f.Name)
                docker load -i $f.FullName
            }
        }
    }
    $importElapsed = [int]((Get-Date) - $importStart).TotalSeconds
    Log ("  Image import done (" + (FmtTime $importElapsed) + ")") "Green"
} else {
    Log "[2/8] Skip image import" "DarkGray"
}

# -- Step 3: Restore ALL config files --
Log "[3/8] Restoring config files..." "Yellow"
if ($hasCfg) { Restore-Configs }

# -- Step 4: Start ai-all-in-one (needed for DB restore) --
Log "[4/8] Starting ai-all-in-one..." "Yellow"
Set-Location "C:\AIAllInOne\windows"
docker compose up -d 2>$null
Start-Sleep -Seconds 20
$cnt1 = (docker ps --filter "label=com.docker.compose.project=ai-all-in-one" -q 2>$null | Measure-Object).Count
Log ("  " + $cnt1 + " containers started") "Green"

# -- Step 5: Restore databases (containers running for PG/MySQL) --
if ($hasDb) {
    Log "[5/8] Restoring databases..." "Yellow"

    # PostgreSQL databases (can restore while running - PG handles concurrent access)
    $pgList = @(
        @{ n="keycloak";  c="keycloak-db";        u="keycloak"; f="keycloak.sql" }
        @{ n="litellm";   c="litellm-db";         u="litellm";  f="litellm.sql" }
        @{ n="langfuse";  c="langfuse-postgres";  u="langfuse"; f="langfuse.sql" }
    )
    foreach ($db in $pgList) {
        $sqlFile = Join-Path $dbDir $db.f
        if (Test-Path $sqlFile) {
            $t0 = Get-Date
            # IMPORTANT: cmd input redirect = byte-exact. A PowerShell pipe (Get-Content | docker exec)
            # re-encodes through ASCII and corrupts all non-ASCII (Chinese) content in the dump.
            & cmd /c ("docker exec -i " + $db.c + " psql -U " + $db.u + " -d " + $db.n + " < `"" + $sqlFile + "`"")
            $sec = [int]((Get-Date) - $t0).TotalSeconds
            Log ("  " + $db.n + " PG (" + $sec + "s)") "Green"
        }
    }

    # MySQL (can restore while running)
    $mysqlFile = Join-Path $dbDir "newapi.sql"
    if (Test-Path $mysqlFile) {
        $t0 = Get-Date
        & cmd /c ("docker exec -i new-api-db mysql -uroot -p!QAZ@WSX123456 new-api < `"" + $mysqlFile + "`"")
        $sec = [int]((Get-Date) - $t0).TotalSeconds
        Log ("  newapi MySQL (" + $sec + "s)") "Green"
    }
} else {
    Log "[5/8] No DB backup, skip" "DarkGray"
}

# -- Step 6: Start Dify --
Log "[6/8] Starting Dify..." "Yellow"
Set-Location "C:\AIAllInOne\windows\dify\docker"
docker compose down 2>$null
docker compose up -d 2>$null
Start-Sleep -Seconds 20

# Restore Dify PostgreSQL
if ($hasDb) {
    $difySql = Join-Path $dbDir "dify.sql"
    if (Test-Path $difySql) {
        $t0 = Get-Date
        & cmd /c ("docker exec -i dify-db_postgres-1 psql -U postgres -d dify < `"" + $difySql + "`"")
        $sec = [int]((Get-Date) - $t0).TotalSeconds
        Log ("  dify PG (" + $sec + "s)") "Green"
    }
}

# -- Step 7: Stop ALL, restore SQLite + volumes, restart --
Log "[7/8] Restoring SQLite + Docker volumes (stopping containers first)..." "Yellow"

# Stop everything for clean SQLite restore
Set-Location "C:\AIAllInOne\windows"
docker compose stop 2>$null
Set-Location "C:\AIAllInOne\windows\dify\docker"
docker compose stop 2>$null
Start-Sleep -Seconds 5
Log "  All containers stopped" "Green"

# Restore Docker volume data FIRST (volume tars also contain a copy of the SQLite
# databases, so the dedicated .db files must be copied AFTER these to win)
$volDir = Join-Path $BackupDir "volumes"
if (Test-Path $volDir) {
    # docker cp tars have the source path's BASENAME as top-level dir:
    #   docker cp ghost:/var/lib/ghost/content -  ->  tar contains "content/..."
    # so the inner dir must be docker-cp'd into the PARENT of the original path.
    $volRestore = @(
        @{ name="ghost-content";      c="ghost";                base="content"; parent="/var/lib/ghost" }
        @{ name="gitea-data";         c="gitea";                base="data";    parent="/" }
        @{ name="minio-data";         c="langfuse-minio";       base="data";    parent="/" }
        @{ name="grafana-data";       c="grafana";              base="grafana"; parent="/var/lib" }
        @{ name="dify-plugin-daemon"; c="dify-plugin_daemon-1"; base="storage"; parent="/app" }
    )
    foreach ($v in $volRestore) {
        $volTar = Join-Path $volDir ($v.name + ".tar")
        if (Test-Path $volTar) {
            # Extract locally with tar.exe then docker cp
            # (cmd "type | docker cp -" is NOT binary-safe: 0x1A bytes truncate the pipe)
            $tmp = Join-Path $env:TEMP ("volrestore_" + $v.name)
            if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
            New-Item -ItemType Directory -Path $tmp -Force | Out-Null
            & C:\Windows\System32\tar.exe -xf $volTar -C $tmp
            $inner = Join-Path $tmp $v.base
            if (Test-Path $inner) {
                docker cp $inner ($v.c + ":" + $v.parent) 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Log ("  " + $v.name + " -> " + $v.parent + "/" + $v.base + " OK") "Green"
                } else {
                    Log ("  " + $v.name + " FAIL (docker cp error)") "Red"
                }
            } else {
                Log ("  " + $v.name + " FAIL (unexpected tar layout)") "Red"
            }
            Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Restore SQLite databases SECOND (overwrites the copies inside the volume tars)
if ($hasDb) {
    $sqliteList = @(
        @{ n="ghost"; c="ghost"; f="ghost.db"; d="/var/lib/ghost/content/data/ghost.db" }
        @{ n="gitea"; c="gitea"; f="gitea.db"; d="/data/gitea/gitea.db" }
    )
    foreach ($s in $sqliteList) {
        $dbFile = Join-Path $dbDir $s.f
        if (Test-Path $dbFile) {
            docker cp $dbFile ($s.c + ":" + $s.d) 2>$null
            Log ("  " + $s.n + " SQLite OK") "Green"
        }
    }
}

# Fix file ownership: docker cp writes everything as root:root, but these containers
# run as non-root users (ghost=node/1000, gitea=git/1000, grafana=472) and would
# fail to start or write. Runs via helper container so it works while targets are stopped.
$chownJobs = @(
    @{ vol="windows_ghost-data";   uid="1000:1000" }
    @{ vol="windows_gitea-data";   uid="1000:1000" }
    @{ vol="windows_grafana-data"; uid="472:472" }
)
$helperImg = "ghost:5-alpine"   # alpine-based, guaranteed present after image import
docker image inspect $helperImg 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { $helperImg = "alpine" }
foreach ($j in $chownJobs) {
    docker volume inspect $j.vol 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        docker run --rm -v ($j.vol + ":/v") --entrypoint chown $helperImg -R $j.uid /v 2>$null
        Log ("  chown -R " + $j.uid + " " + $j.vol + " OK") "Green"
    }
}

# Restore Dify bind mount volumes (LEGACY: only present in backups made before
# the dify-docker full-directory copy was introduced; newer backups cover these
# via config\dify-docker\volumes\...)
$difyVolDir = Join-Path $BackupDir "dify-volumes"
if (Test-Path $difyVolDir) {
    $difyVolRestore = @(
        @{ name="app-storage"; dst="C:\AIAllInOne\windows\dify\docker\volumes\app\storage" }
        @{ name="weaviate";    dst="C:\AIAllInOne\windows\dify\docker\volumes\weaviate" }
    )
    foreach ($dv in $difyVolRestore) {
        $dvSrc = Join-Path $difyVolDir $dv.name
        if (Test-Path $dvSrc) {
            Copy-Item $dvSrc $dv.dst -Recurse -Force
            Log ("  Dify " + $dv.name + " OK") "Green"
        }
    }
}

# -- Step 8: Restart everything --
Log "[8/8] Restarting all services..." "Yellow"
Set-Location "C:\AIAllInOne\windows"
docker compose start 2>$null
Start-Sleep -Seconds 10

Set-Location "C:\AIAllInOne\windows\dify\docker"
docker compose start 2>$null
Start-Sleep -Seconds 10

# Restart key services
@("admin-portal", "new-api", "litellm", "ghost", "gitea") | ForEach-Object {
    docker restart $_ 2>$null
}
Start-Sleep -Seconds 10

$allCnt = (docker ps -q 2>$null | Measure-Object).Count
$totalElapsed = [int]((Get-Date) - $scriptStart).TotalSeconds

Log ""
Log ("=== Restore Done! Containers: " + $allCnt + " | Time: " + (FmtTime $totalElapsed) + " ===") "Green"
Log ""
Log "Verify at:" "Cyan"
Log "  Admin Portal: http://192.168.31.117:10086"
Log "  Dify:         http://192.168.31.117"
Log "  Gitea:        http://192.168.31.117:3002"
Log "  NewAPI:       http://192.168.31.117:3000"
Log "  Ghost:        http://192.168.31.117:8090"
Log "  Grafana:      http://192.168.31.117:3030"
Log "  Langfuse:     http://192.168.31.117:3010"
Log "  Update Server:http://192.168.31.117:8091"
Log ("  Log file: " + $logFile) "DarkGray"

Stop-Transcript | Out-Null
