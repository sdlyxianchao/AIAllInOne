<#
.SYNOPSIS
    校验一个 AI AllInOne Docker 备份目录是否是「一个正确的备份」。

.DESCRIPTION
    判据不是「文件在不在」，而是「restore-docker.ps1 能不能照着它跑通」。
    因此检查分五层：
      1. 路径与总体信息（等级判定、大小、文件数、新鲜度）
      2. 完备性：restore-docker.ps1 会读的每一个文件/目录是否都在、大小是否合理
      3. 完整性：文件头魔数（SQLite / tar / gzip / VHDX）、SQL 转储是否被重编码成 UTF-16、
         SQLite 页数与实际长度是否自洽（能抓「被截断」）
      4. 内部一致性：compose 里引用的 ${VAR} 在 .env 里有没有定义；备份等级与内容是否自洽；
         备份脚本复制的 dsh.db、恢复脚本写回的位置，是不是 admin-portal 实际读写的那个库
         （只验"是个合法 SQLite"验不出"是不是活库"，这一条专门抓"备份抓错了文件"）
      5. 自恢复性：备份里有没有 restore 脚本

    等级（与 backup-docker.ps1 一致；2026-09-12 起只有两级）：
      L1 = config + db（快照）
      L2 = L1 + docker_data.vhdx（可走「换数据盘」即时恢复；VHDX 已含全部镜像）
    旧备份可能带 images/（当年的 L2「单独导出镜像」）甚至是 images+VHDX 的旧 L3。
    本脚本仍会把这些 images/ 一并校验并标注为「旧式」，但等级一律按新体系报。
    restore-docker.ps1 选策略只看"有没有 VHDX / images"，与等级名无关。

.PARAMETER BackupDir
    要检查的备份目录。可以传单个备份（含 config\ 的那层），
    也可以传它们的父目录（如 F:\Backup\Docker），此时会逐个检查里面的 backup_*。

.PARAMETER RequireLevel
    要求的最低等级：0=不要求（自动判定），1/2=必须达到。达不到记为 FAIL。

.PARAMETER MaxAgeDays
    备份「新鲜度」阈值（天）。最新的文件比这个更旧就记 WARN。默认 7。

.PARAMETER Json
    以 JSON 输出，便于其它脚本消费。

.EXAMPLE
    .\check_backup.ps1 "F:\Backup\Docker\backup_2026-09-11_100017"

.EXAMPLE
    .\check_backup.ps1 "F:\Backup\Docker" -RequireLevel 2

.EXAMPLE
    .\check_backup.ps1 "F:\Backup\Docker\backup_2026-09-11_100017" -Json > result.json

.NOTES
    退出码：0 = 可用（可能有 WARN）；1 = 有 FAIL（按 restore-docker.ps1 恢复会出问题）；2 = 参数/路径错误。
    只读，不修改备份里的任何东西。
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BackupDir,

    [ValidateSet(0, 1, 2)]
    [int]$RequireLevel = 0,

    [int]$MaxAgeDays = 7,

    [switch]$Json
)

$ErrorActionPreference = "Continue"

# ============================================================
# 结果收集
# ============================================================
$script:Results = New-Object System.Collections.ArrayList

function Add-Res {
    param(
        [string]$Group,
        [string]$Name,
        [ValidateSet("OK", "WARN", "FAIL", "INFO")]
        [string]$Status,
        [string]$Detail = ""
    )
    [void]$script:Results.Add([PSCustomObject]@{
        Group  = $Group
        Name   = $Name
        Status = $Status
        Detail = $Detail
    })
}

function Get-Count {
    param([string]$Status)
    return @($script:Results | Where-Object { $_.Status -eq $Status }).Count
}

# ============================================================
# 基础工具
# ============================================================
function Get-HeadBytes {
    # 只读文件头若干字节——备份里可能有 6.8GB 的镜像包 / 52GB 的 VHDX，绝不能整个读进来
    param([string]$Path, [int]$Count = 512)
    $fs = $null
    try {
        $fs = New-Object System.IO.FileStream($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $len = [int][Math]::Min([int64]$Count, [int64]$fs.Length)
        if ($len -le 0) { return $null }
        $buf = New-Object byte[] $len
        $read = $fs.Read($buf, 0, $len)
        if ($read -lt $len) { $buf = $buf[0..($read - 1)] }
        return $buf
    } catch {
        return $null
    } finally {
        if ($fs) { $fs.Dispose() }
    }
}

function Read-Lines {
    # .env / compose 都是无 BOM 的 UTF-8；显式按 UTF-8 解，避免 PS 5.1 默认按 ANSI 解析出乱码
    param([string]$Path)
    $txt = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $txt = $txt.TrimStart([char]0xFEFF)
    $lines = @($txt -split "\r?\n")
    # 文件末尾的换行会split出一个空串，去掉它，行数才与编辑器里看到的一致
    if ($lines.Count -gt 1 -and $lines[$lines.Count - 1] -eq "") { $lines = @($lines[0..($lines.Count - 2)]) }
    return $lines
}

function Format-Size {
    param([double]$Bytes)
    if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
    if ($Bytes -ge 1KB) { return ("{0:N1} KB" -f ($Bytes / 1KB)) }
    return ("{0} B" -f [int]$Bytes)
}

function Test-FlatFile {
    # 通用单文件检查：存在 + 非空 + 达到最小体积
    param([string]$Path, [string]$Label, [string]$Group, [int]$MinBytes = 1, [switch]$Critical)
    if (-not (Test-Path -LiteralPath $Path)) {
        Add-Res $Group $Label $(if ($Critical) { "FAIL" } else { "WARN" }) "缺失"
        return $false
    }
    $fi = Get-Item -LiteralPath $Path
    if ($fi.Length -lt $MinBytes) {
        Add-Res $Group $Label "FAIL" ("体积异常：" + (Format-Size $fi.Length) + "，至少应约 " + (Format-Size $MinBytes))
        return $false
    }
    Add-Res $Group $Label "OK" (Format-Size $fi.Length)
    return $true
}

# --- SQLite 头 + 页数自洽性：能抓出「被截断的库」---
function Test-Sqlite {
    param([string]$Path, [string]$Label, [string]$Group)
    $b = Get-HeadBytes -Path $Path -Count 128
    if ($null -eq $b -or $b.Length -lt 100) {
        Add-Res $Group $Label "FAIL" "读不到文件头（文件太小或不可读）"
        return
    }
    $magic = [System.Text.Encoding]::ASCII.GetString($b, 0, 16)
    if ($magic -ne "SQLite format 3`0") {
        $shown = $magic -replace "[^\x20-\x7e]", "."
        Add-Res $Group $Label "FAIL" ("不是 SQLite 文件（文件头 = '" + $shown + "'）")
        return
    }
    $pageSize = ([int]$b[16] -shl 8) + [int]$b[17]
    if ($pageSize -eq 1) { $pageSize = 65536 }
    $pageCount = ([int]$b[28] -shl 24) + ([int]$b[29] -shl 16) + ([int]$b[30] -shl 8) + [int]$b[31]
    $actual = (Get-Item -LiteralPath $Path).Length

    if ($pageCount -le 0) {
        Add-Res $Group $Label "WARN" ("SQLite 头正常，但页数为 0（" + (Format-Size $actual) + "），无法校验是否截断")
        return
    }
    $expected = [int64]$pageSize * [int64]$pageCount
    if ($actual -lt $expected) {
        Add-Res $Group $Label "FAIL" ("文件被截断：头声明 " + $pageCount + " 页 x " + $pageSize + "B = " + (Format-Size $expected) + "，实际只有 " + (Format-Size $actual))
        return
    }
    Add-Res $Group $Label "OK" ("SQLite 正常，" + $pageCount + " 页 x " + $pageSize + "B，" + (Format-Size $actual))
}

# --- SQL 转储：魔数 + 是否被重编码成 UTF-16 ---
function Test-SqlDump {
    param([string]$Path, [string]$Label, [string]$Group, [string]$Kind, [int]$MinKB)
    if (-not (Test-Path -LiteralPath $Path)) {
        Add-Res $Group $Label "FAIL" "缺失"
        return
    }
    $fi = Get-Item -LiteralPath $Path
    if ($fi.Length -lt ($MinKB * 1KB)) {
        Add-Res $Group $Label "FAIL" ("体积异常：" + (Format-Size $fi.Length) + "，至少应约 " + $MinKB + " KB")
        return
    }
    $b = Get-HeadBytes -Path $Path -Count 65536
    if ($null -eq $b -or $b.Length -lt 8) {
        Add-Res $Group $Label "FAIL" "读不到内容"
        return
    }
    # UTF-16 / UTF-16BE 的 BOM —— Out-File / PowerShell 管道重编码的典型后果，会把非 ASCII 数据毁掉
    if (($b[0] -eq 0xFF -and $b[1] -eq 0xFE) -or ($b[0] -eq 0xFE -and $b[1] -eq 0xFF)) {
        Add-Res $Group $Label "FAIL" "转储是 UTF-16（带 BOM），非 ASCII 数据已损坏；应改用 cmd 重定向导出"
        return
    }
    # 前 1KB 里若含 NUL 字节，也说明是 UTF-16 或被二进制污染
    $nul = 0
    $scan = [Math]::Min(1024, $b.Length)
    for ($i = 0; $i -lt $scan; $i++) { if ($b[$i] -eq 0) { $nul++ } }
    if ($nul -gt 4) {
        Add-Res $Group $Label "FAIL" ("前 1KB 含 " + $nul + " 个 NUL 字节，疑似 UTF-16/二进制污染")
        return
    }
    $head = [System.Text.Encoding]::ASCII.GetString($b)
    $ok = $false
    $what = ""
    if ($Kind -eq "pg") {
        if ($head -match "PostgreSQL database dump") { $ok = $true; $what = "pg_dump" }
    } else {
        if ($head -match "MySQL dump") { $ok = $true; $what = "mysqldump" }
        elseif ($head -match "MariaDB dump") { $ok = $true; $what = "mariadb-dump" }
    }
    if (-not $ok) {
        Add-Res $Group $Label "FAIL" ("文件头不像 " + $Kind + " 转储，可能是空的或损坏的 dump")
        return
    }
    # pg_dump 的前面是 SET / ALTER TABLE ... DROP CONSTRAINT 之类的头部，
    # 建表语句可能晚于 4KB，所以窗口给到 64KB 再判断「有没有真内容」
    if ($head -notmatch "CREATE TABLE|CREATE SCHEMA|ALTER TABLE|DROP TABLE|COPY |INSERT INTO") {
        Add-Res $Group $Label "WARN" ($what + " 头正常，但前 64KB 里没看到任何 DDL/DML，转储可能是空的")
        return
    }
    Add-Res $Group $Label "OK" ($what + "，" + (Format-Size $fi.Length))
}

# --- tar：ustar 魔数 + 顶层目录名必须与 restore-docker.ps1 的映射一致 ---
function Test-Tar {
    param([string]$Path, [string]$Label, [string]$Group, [string]$ExpectTop, [int]$MinKB = 10)
    if (-not (Test-Path -LiteralPath $Path)) {
        Add-Res $Group $Label "FAIL" "缺失"
        return
    }
    $fi = Get-Item -LiteralPath $Path
    if ($fi.Length -lt ($MinKB * 1KB)) {
        Add-Res $Group $Label "FAIL" ("体积异常：" + (Format-Size $fi.Length) + "，至少应约 " + $MinKB + " KB")
        return
    }
    $b = Get-HeadBytes -Path $Path -Count 512
    if ($null -eq $b -or $b.Length -lt 512) {
        Add-Res $Group $Label "FAIL" "读不到 tar 头（文件太小）"
        return
    }
    $isGz = ($b[0] -eq 0x1F -and $b[1] -eq 0x8B)
    if ($isGz) {
        Add-Res $Group $Label "WARN" ("是 gzip 压缩包，" + (Format-Size $fi.Length) + "；restore-docker.ps1 走的是 tar.exe -xf，能自动识别")
        return
    }
    $magic = [System.Text.Encoding]::ASCII.GetString($b, 257, 5)
    if ($magic -ne "ustar") {
        Add-Res $Group $Label "FAIL" ("不是 tar（offset 257 处不是 ustar，而是 '" + ($magic -replace "[^\x20-\x7e]", ".") + "'）")
        return
    }
    $name = [System.Text.Encoding]::UTF8.GetString($b, 0, 100)
    $z = $name.IndexOf([char]0)
    if ($z -ge 0) { $name = $name.Substring(0, $z) }
    $name = $name -replace "^\./", ""
    $top = ($name -split "/")[0]

    if ([string]::IsNullOrEmpty($ExpectTop)) {
        Add-Res $Group $Label "OK" ("tar 正常，顶层条目 = " + $top + "，" + (Format-Size $fi.Length))
        return
    }
    if ($top -ne $ExpectTop) {
        Add-Res $Group $Label "FAIL" ("tar 顶层目录应是 '" + $ExpectTop + "/'，实际是 '" + $top + "/'；restore 会因目录布局不符而跳过")
        return
    }
    Add-Res $Group $Label "OK" ("tar 正常，顶层条目 = " + $top + "/，" + (Format-Size $fi.Length))
}

function Get-AdminPortalAppMount {
    # 从备份里的 docker-compose.yml 找出 admin-portal 服务把哪个宿主目录挂到 /app。
    # 返回目录名（本项目是 'admin-portal'）；读不到返回 $null。
    # 为什么要这样绕：admin-portal 读的是容器内路径 /app/dsh-updates/db/dsh.db，
    # 而 /app 是宿主 <windows>\<这个目录> —— 备份里没有绝对路径，只能靠这层挂载关系推。
    param([string]$ComposePath)
    if (-not (Test-Path -LiteralPath $ComposePath)) { return $null }
    try {
        $lines = [System.IO.File]::ReadAllLines($ComposePath, [System.Text.Encoding]::UTF8)
    } catch { return $null }
    $svc = $null
    foreach ($ln in $lines) {
        if ($ln -match '^\s*#') { continue }
        if ($ln -match '^  ([A-Za-z0-9_.\-]+):\s*$') { $svc = $matches[1]; continue }
        if ($svc -eq 'admin-portal' -and $ln -match '^\s*-\s*\./([^:\s#]+):/app\s*$') { return $matches[1] }
    }
    return $null
}

function Get-DshDbPathParents {
    # 从一段脚本文本里取出所有「...\<PARENT>\dsh-updates\db\dsh.db」的 <PARENT>。
    # 只取 dsh-updates\db\dsh.db 前面那一级目录名，这样无论盘符/根目录怎么变都能比。
    # 注意：调用方必须写成 @(Get-DshDbPathParents $txt) —— PowerShell 会把单元素数组
    # 自动拆成标量，直接用 $x[0] 会取到字符串的第一个字符。
    param([string]$Text)
    $out = @()
    foreach ($m in [regex]::Matches($Text, '(?i)\\([^\\"\s]+)\\dsh-updates\\db\\dsh\.db')) {
        $out += $m.Groups[1].Value
    }
    return @($out | Select-Object -Unique)
}

function Get-AppFileParents {
    # 从一段脚本文本里取出所有「...\<PARENT>\<tail>」里的 <PARENT>，用于核对
    # 「备份脚本复制的是不是 admin-portal 真正在跑的那个文件」。
    # $Tail 是 <PARENT>\ 之后那一段的正则片段（例如 'server\.js'）。
    # 注意：备份脚本里 admin-portal_server.js 这类「目标名」前面是引号不是反斜杠，
    # 所以不会被误匹配；只有真正的绝对路径才会命中。
    # 调用方必须写 @(Get-AppFileParents ...) —— 单元素数组会被 PS 拆成标量。
    param([string]$Text, [string]$Tail)
    $out = @()
    foreach ($m in [regex]::Matches($Text, '(?i)\\([^\\"\s]+)\\' + $Tail)) {
        $out += $m.Groups[1].Value
    }
    return @($out | Select-Object -Unique)
}

# ============================================================
# 常量表：与 backup-docker.ps1 / restore-docker.ps1 一一对应
# ============================================================
$CfgFiles = @(
    @{ F = ".env";                           Min = 2000;  Crit = $true;  What = "根级环境变量：所有对外 URL、密码、密钥的来源" }
    @{ F = ".env.windows";                   Min = 500;   Crit = $false; What = "Windows 侧环境变量参考副本" }
    @{ F = "docker-compose.yml";             Min = 5000;  Crit = $true;  What = "ai-all-in-one 编排文件" }
    @{ F = "litellm-config.yaml";            Min = 1000;  Crit = $true;  What = "LiteLLM 模型/脱敏配置" }
    @{ F = "dify_.env";                      Min = 2000;  Crit = $true;  What = "Dify 环境变量" }
    @{ F = "dify_docker-compose.yaml";       Min = 5000;  Crit = $true;  What = "Dify 编排文件" }
    @{ F = "admin-portal_server.js";         Min = 20000; Crit = $true;  What = "AI Admin Center 后端" }
    @{ F = "admin-portal_index.html";        Min = 20000; Crit = $true;  What = "AI Admin Center 前端" }
    @{ F = "admin-portal_avail-keys.json";   Min = 2;     Crit = $false; What = "可用性探测配置" }
    # 下面三样 index.html 会引用（L108 侧栏 logo、L172 markdown 渲染器）或决定依赖版本。
    # Crit = $false：缺了站点还能起，但界面不完整，所以记 WARN 不记 FAIL。
    @{ F = "admin-portal_logo.png";          Min = 5000;  Crit = $false; What = "AI Admin Center 侧栏 logo（index.html L108 引用）" }
    @{ F = "admin-portal_marked.min.js";     Min = 5000;  Crit = $false; What = "Markdown 渲染器（index.html L172 引用）" }
    @{ F = "admin-portal_package.json";      Min = 50;    Crit = $false; What = "AI Admin Center 依赖版本清单" }
    # MCP Gateway 的服务代码。compose 把整个 ./mcp-gateway 挂到 /app 并跑 node gateway.js，
    # 只备 mcp-servers.json + skills 的话，恢复出来是个没有代码的网关。
    @{ F = "mcp-gateway_gateway.js";         Min = 2000;  Crit = $true;  What = "MCP Gateway 服务代码" }
    @{ F = "mcp-gateway_package.json";       Min = 50;    Crit = $false; What = "MCP Gateway 依赖清单" }
    @{ F = "mcp-gateway_package-lock.json";  Min = 500;   Crit = $false; What = "MCP Gateway 依赖锁文件" }
    @{ F = "mcp-gateway_mcp-servers.example.json"; Min = 2; Crit = $false; What = "MCP Gateway 配置样例" }
    @{ F = "dsh.db";                         Min = 0;     Crit = $true;  What = "DSH 客户端同步数据库（SQLite）" }
    @{ F = "gitea-runner-config.yaml";       Min = 100;   Crit = $false; What = "Gitea Runner 配置" }
    @{ F = "mcp-servers.json";               Min = 2;     Crit = $false; What = "MCP Gateway 服务器清单" }
    @{ F = "update-server-nginx.conf";       Min = 50;    Crit = $false; What = "安装包分发站点 nginx 配置" }
)

$CfgDirs = @(
    @{ D = "dify-docker";             Probe = "docker-compose.yaml"; What = "Dify 完整编排目录（nginx/ssrf_proxy/sandbox 等）" }
    @{ D = "ghost-theme-corp-portal"; Probe = "index.hbs";           What = "Ghost 企业门户主题" }
    @{ D = "ghost-content-seed";      Probe = "content.json";        What = "Ghost 内容种子" }
    @{ D = "monitoring";              Probe = "prometheus.yml";      What = "监控栈配置" }
    @{ D = "scripts";                 Probe = "";                    What = "部署脚本目录" }
    @{ D = "mcp-skills";              Probe = "";                    What = "MCP 技能包" }
    @{ D = "dsh-installers";          Probe = "";                    What = "DSH 客户端安装包（约 1.9GB）" }
    @{ D = "embedder-model-cache";    Probe = "BAAI";                What = "Embedding 模型缓存（约 2.2GB）" }
    @{ D = "reranker-model-cache";    Probe = "BAAI";                What = "Reranker 模型缓存" }
)

# 老命名别名：2026-09-12 之前的 backup.ps1 / 中间版本把 admin-portal 的文件存成裸名，
# dify 的配置用连字符而不是下划线。restore-docker.ps1 现在两者都认，
# 所以 checker 也必须认 —— 否则会把「内容其实在、只是名字旧」误判成「缺失」，
# 结论直接翻转成 FAIL（backup_2026-09-10_231020_full 就是这么被误判的）。
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

function Resolve-CfgFile {
    # 规范名 -> config\ 下的真实路径；规范名不在时依次试老命名别名。
    # 返回 $null 表示真缺失。命中别名时把别名名字写进 $script:CfgViaAlias。
    param([string]$Dir, [string]$Name)
    $script:CfgViaAlias = $null
    $p = Join-Path $Dir $Name
    if (Test-Path -LiteralPath $p) { return $p }
    if ($CfgAliases.ContainsKey($Name)) {
        foreach ($alt in $CfgAliases[$Name]) {
            $q = Join-Path $Dir $alt
            if (Test-Path -LiteralPath $q) {
                $script:CfgViaAlias = $alt
                return $q
            }
        }
    }
    return $null
}

$DbFiles = @(
    @{ F = "keycloak.sql"; Kind = "pg";    MinKB = 10; What = "Keycloak 统一认证" }
    @{ F = "litellm.sql";  Kind = "pg";    MinKB = 10; What = "LiteLLM 模型网关" }
    @{ F = "dify.sql";     Kind = "pg";    MinKB = 10; What = "Dify 平台" }
    @{ F = "langfuse.sql"; Kind = "pg";    MinKB = 10; What = "Langfuse 可观测" }
    @{ F = "newapi.sql";   Kind = "mysql"; MinKB = 10; What = "NewAPI 网关" }
)

$VolTars = @(
    @{ F = "ghost-content.tar";   Top = "content";  What = "Ghost 内容卷" }
    @{ F = "gitea-data.tar";      Top = "data";     What = "Gitea 仓库/数据卷" }
    @{ F = "minio-data.tar";      Top = "data";     What = "MinIO 对象存储卷" }
    @{ F = "grafana-data.tar";    Top = "grafana";  What = "Grafana 看板卷" }
)

# .env 里必须有值的键：缺了就一定起不来 / URL 会拼错
$EnvCritical = @("SERVER_PUBLIC_URL", "ADMIN_USERNAME", "ADMIN_PASSWORD")
$EnvExpected = @(
    "SESSION_SECRET", "KEYCLOAK_ADMIN_PASSWORD", "KEYCLOAK_DB_PASSWORD",
    "NEWAPI_DB_PASSWORD", "LITELLM_MASTER_KEY", "GITEA_RUNNER_TOKEN",
    "DIFY_KNOWLEDGE_API_KEY", "DIFY_DEFAULT_DATASET_ID",
    "LANGFUSE_CLICKHOUSE_PASSWORD", "MCP_ADMIN_TOKEN", "GRAFANA_ADMIN_PASSWORD"
)

# ============================================================
# 单个备份的检查
# ============================================================
function Test-OneBackup {
    param([string]$Dir)

    $script:Results = New-Object System.Collections.ArrayList

    # ---------- 1. 路径 ----------
    if (-not (Test-Path -LiteralPath $Dir)) {
        Add-Res "路径" "备份目录存在" "FAIL" ("找不到：" + $Dir)
        return
    }
    if (-not (Test-Path -LiteralPath $Dir -PathType Container)) {
        Add-Res "路径" "备份目录存在" "FAIL" "给的是一个文件，不是目录"
        return
    }
    Add-Res "路径" "备份目录存在" "OK" $Dir

    $cfgDir = Join-Path $Dir "config"
    $dbDir = Join-Path $Dir "db"
    $volDir = Join-Path $Dir "volumes"
    $imgDir = Join-Path $Dir "images"
    $scrDir = Join-Path $Dir "scripts"
    $vhdx = Join-Path $Dir "docker_data.vhdx"

    # ---------- 2. 总体信息 + 等级判定 ----------
    $allFiles = @(Get-ChildItem -LiteralPath $Dir -Recurse -File -Force -ErrorAction SilentlyContinue)
    $totalBytes = 0
    foreach ($f in $allFiles) { $totalBytes += $f.Length }
    $newest = $null
    foreach ($f in $allFiles) { if ($null -eq $newest -or $f.LastWriteTime -gt $newest) { $newest = $f.LastWriteTime } }

    # 新等级（2026-09-12 起）：L1 = config + db；L2 = L1 + docker_data.vhdx
    # images/ 不再是等级判据（新脚本不再单独导出镜像），但存在时仍会校验并标注。
    $level = 1
    $hasImages = $false
    $hasVhdx = (Test-Path -LiteralPath $vhdx)
    if (Test-Path -LiteralPath $imgDir) {
        $imgPkg = @(Get-ChildItem -LiteralPath $imgDir -File -Force -ErrorAction SilentlyContinue)
        if ($imgPkg.Count -gt 0) { $hasImages = $true }
    }
    if ($hasVhdx) { $level = 2 }

    Add-Res "总体" "文件数 / 总大小" "INFO" ($allFiles.Count.ToString() + " 个文件，" + (Format-Size $totalBytes))
    Add-Res "总体" "备份等级" "INFO" ("Level " + $level + "（" + $(if ($level -ge 2) { "config + db + VHDX，可走换数据盘即时恢复" } else { "config + db 快照" }) + "）")
    if ($hasImages) {
        Add-Res "总体" "旧式镜像包" "WARN" "本备份带 images\（2026-09-12 前的等级体系遗留）。新体系不再单独导出镜像 —— VHDX 已含全部镜像；这些包仍可用、仍会被校验。"
    }
    if ($null -ne $newest) {
        $age = [math]::Round(((Get-Date) - $newest).TotalDays, 1)
        if ($age -gt $MaxAgeDays) {
            Add-Res "总体" "新鲜度" "WARN" ("最新文件是 " + $newest.ToString("yyyy-MM-dd HH:mm") + "，距今 " + $age + " 天（阈值 " + $MaxAgeDays + " 天）")
        } else {
            Add-Res "总体" "新鲜度" "OK" ("最新文件 " + $newest.ToString("yyyy-MM-dd HH:mm") + "，距今 " + $age + " 天")
        }
    }
    $leafName = Split-Path $Dir -Leaf
    if ($leafName -match "^backup_\d{4}-\d{2}-\d{2}_\d{6}$") {
        $stampInName = $leafName.Substring(7)
        $parsed = $null
        try { $parsed = [datetime]::ParseExact($stampInName, "yyyy-MM-dd_HHmmss", $null) } catch { $parsed = $null }
        if ($null -ne $parsed -and $null -ne $newest -and [math]::Abs(($newest - $parsed).TotalHours) -gt 6) {
            Add-Res "总体" "目录名时间戳" "WARN" ("目录名是 " + $parsed.ToString("yyyy-MM-dd HH:mm") + "，但文件时间到 " + $newest.ToString("yyyy-MM-dd HH:mm") + "，可能被后续改动过")
        } else {
            Add-Res "总体" "目录名时间戳" "OK" $leafName
        }
    } else {
        Add-Res "总体" "目录名时间戳" "WARN" ("目录名不是 backup_YYYY-MM-DD_HHMMSS 形式：'" + $leafName + "'（不影响可用性）")
    }

    if ($RequireLevel -gt 0) {
        if ($level -ge $RequireLevel) {
            Add-Res "总体" ("最低等级要求 L" + $RequireLevel) "OK" ("实际 L" + $level)
        } else {
            Add-Res "总体" ("最低等级要求 L" + $RequireLevel) "FAIL" ("实际只有 L" + $level + "，缺 " + $(if ($RequireLevel -ge 2 -and -not $hasVhdx) { "docker_data.vhdx" } else { "images/ 镜像包" }))
        }
    }

    # ---------- 3. 顶层骨架 ----------
    if (Test-Path -LiteralPath $cfgDir) {
        Add-Res "骨架" "config\" "OK" ""
    } else {
        Add-Res "骨架" "config\" "FAIL" "缺失——没有它恢复不出任何配置"
    }
    if (Test-Path -LiteralPath $dbDir) {
        Add-Res "骨架" "db\" "OK" ""
    } else {
        Add-Res "骨架" "db\" "FAIL" "缺失——没有它恢复不出任何数据库"
    }
    if (Test-Path -LiteralPath $volDir) {
        Add-Res "骨架" "volumes\" "OK" ""
    } else {
        Add-Res "骨架" "volumes\" "WARN" "缺失——Ghost/Gitea/MinIO/Grafana 的卷数据将无法恢复"
    }
    Add-Res "骨架" "containers.txt" $(if (Test-Path -LiteralPath (Join-Path $Dir "containers.txt")) { "OK" } else { "WARN" }) ""
    Add-Res "骨架" "images.txt" $(if (Test-Path -LiteralPath (Join-Path $Dir "images.txt")) { "OK" } else { "WARN" }) ""

    # ---------- 4. 配置文件 ----------
    if (Test-Path -LiteralPath $cfgDir) {
        foreach ($c in $CfgFiles) {
            $lbl = "config\" + $c.F
            $p = Resolve-CfgFile $cfgDir $c.F
            $via = $script:CfgViaAlias
            if (-not $p) {
                if ($c.F -eq "dsh.db") {
                    Add-Res "配置" $lbl "FAIL" "缺失——DSH 客户端同步的版本表/历史都在这个库里"
                } else {
                    Add-Res "配置" $lbl $(if ($c.Crit) { "FAIL" } else { "WARN" }) "缺失"
                }
                continue
            }
            if ($c.F -eq "dsh.db") {
                Test-Sqlite -Path $p -Label $lbl -Group "配置"
            } else {
                $null = Test-FlatFile -Path $p -Label $lbl -Group "配置" -MinBytes $c.Min -Critical:$c.Crit
            }
            if ($via) {
                # 内容在、只是名字旧：不计 FAIL，但要让人知道这份备份出自老脚本
                Add-Res "配置" ($lbl + " 命名") "WARN" `
                    ("备份用的是老命名 '" + $via + "'，restore-docker.ps1 已兼容读取；建议用 backup-docker.ps1 重做备份")
            }
        }

        # ---------- 4b. dsh.db 的「来源路径」是否就是 admin-portal 真正在用的那个库 ----------
        # 2026-09-11 踩过的坑：备份脚本复制的是另一个同名旧库（早已停止更新），
        # 备份"成功"、SQLite 也合法，于是 check 全绿 —— 但备份里根本没有真实的版本表/同步历史。
        # 只验"是不是合法 SQLite"验不出"是不是活库"；这里改成核对路径：
        #   admin-portal 容器内读 /app/dsh-updates/db/dsh.db，/app 挂的是 <windows>\admin-portal，
        #   所以备份脚本的源路径必须落在 ...\admin-portal\dsh-updates\db\dsh.db。
        $dshDbBk = Join-Path $cfgDir "dsh.db"
        if (Test-Path -LiteralPath $dshDbBk) {
            # Copy-Item 会保留源文件的 LastWriteTime，所以备份里这个文件的时间就是源文件的时间
            $mt = (Get-Item -LiteralPath $dshDbBk).LastWriteTime
            $ageDays = [math]::Round(((Get-Date) - $mt).TotalDays, 1)
            Add-Res "配置" "config\dsh.db 快照时间" "INFO" `
                ($mt.ToString("yyyy-MM-dd HH:mm") + "（源文件时间，距现在 " + $ageDays + " 天）")

            $appMount = Get-AdminPortalAppMount (Join-Path $cfgDir "docker-compose.yml")
            if (-not $appMount) {
                Add-Res "配置" "dsh.db 来源路径" "INFO" "读不出 admin-portal 的 /app 挂载（compose 缺失或格式变了），跳过一致性核对"
            } else {
                $expTail = "\" + $appMount + "\dsh-updates\db\dsh.db"

                # 备份脚本：它复制的是哪个库
                $bkScript = Join-Path $scrDir "backup-docker.ps1"
                if (-not (Test-Path -LiteralPath $bkScript)) {
                    Add-Res "配置" "dsh.db 来源路径" "INFO" "备份里没带 scripts\backup-docker.ps1（更早版本做的备份），跳过一致性核对"
                } else {
                    $bkTxt = [System.IO.File]::ReadAllText($bkScript, [System.Text.Encoding]::UTF8)
                    $srcParents = @(Get-DshDbPathParents $bkTxt)
                    if ($srcParents.Count -eq 0) {
                        Add-Res "配置" "dsh.db 来源路径" "WARN" "备份脚本里找不到 dsh.db 的源路径，无法确认它复制的是哪个库"
                    } elseif ($srcParents.Count -eq 1 -and $srcParents[0] -ieq $appMount) {
                        Add-Res "配置" "dsh.db 来源路径" "OK" ("复制的是 ..." + $srcParents[0] + "\dsh-updates\db\dsh.db，与 admin-portal 实际读的库一致")
                    } else {
                        Add-Res "配置" "dsh.db 来源路径" "WARN" `
                            ("备份脚本复制的是 ...\" + ($srcParents -join " / ...\") + "\dsh-updates\db\dsh.db，" +
                             "但 admin-portal 实际读的是 ..." + $expTail +
                             " —— 备份里的版本表/同步历史很可能不是活数据（恢复后客户端同步页会显示旧版本）")
                    }
                }

                # 恢复脚本：它会把 config\dsh.db 写回哪里
                $rsScript = Join-Path $scrDir "restore-docker.ps1"
                if (Test-Path -LiteralPath $rsScript) {
                    $rsTxt = [System.IO.File]::ReadAllText($rsScript, [System.Text.Encoding]::UTF8)
                    $dstParents = @(Get-DshDbPathParents $rsTxt)
                    if ($dstParents.Count -eq 0) {
                        Add-Res "配置" "dsh.db 恢复目标" "WARN" "恢复脚本里找不到 dsh.db 的目标路径，恢复时会不知道往哪写"
                    } elseif ($dstParents.Count -eq 1 -and $dstParents[0] -ieq $appMount) {
                        Add-Res "配置" "dsh.db 恢复目标" "OK" ("写回 ..." + $dstParents[0] + "\dsh-updates\db\dsh.db，与 admin-portal 实际读的库一致")
                    } else {
                        Add-Res "配置" "dsh.db 恢复目标" "WARN" `
                            ("恢复脚本把 config\dsh.db 写回 ...\" + ($dstParents -join " / ...\") + "\dsh-updates\db\dsh.db，" +
                             "而 admin-portal 读的是 ..." + $expTail + " —— 恢复的库应用读不到")
                    }
                }
            }
        }

        # ---------- 4c. admin-portal 的「是不是活站点」 ----------
        # 与 4b 同一个思路，只是对象换成 AI Admin Center 的代码本体：
        #   admin-portal 容器内跑 /app/server.js、对外发 /app/public/index.html，
        #   而 /app 挂的是 <windows>\<compose 里那个目录>。
        #   所以备份/恢复脚本的源路径必须落在 ...\<那个目录>\server.js 与
        #   ...\<那个目录>\public\index.html，否则备份下来的是一份"别处的"站点。
        # 只验「文件在不在、够不够大」是抓不出这个的 —— 换了个副本一样能全绿。
        $apMount = Get-AdminPortalAppMount (Join-Path $cfgDir "docker-compose.yml")
        if (-not $apMount) {
            Add-Res "配置" "admin-portal 站点路径" "INFO" "读不出 admin-portal 的 /app 挂载（compose 缺失或格式变了），跳过一致性核对"
        } else {
            $apProbes = @(
                @{ N = "server.js";        T = 'server\.js' },
                @{ N = "public\index.html"; T = 'public\\index\.html' }
            )
            $bkScript = Join-Path $scrDir "backup-docker.ps1"
            $rsScript = Join-Path $scrDir "restore-docker.ps1"
            if (-not (Test-Path -LiteralPath $bkScript)) {
                Add-Res "配置" "admin-portal 站点路径" "INFO" "备份里没带 scripts\backup-docker.ps1（更早版本做的备份），跳过一致性核对"
            } else {
                $bkTxt = [System.IO.File]::ReadAllText($bkScript, [System.Text.Encoding]::UTF8)
                $rsTxt = $null
                if (Test-Path -LiteralPath $rsScript) {
                    $rsTxt = [System.IO.File]::ReadAllText($rsScript, [System.Text.Encoding]::UTF8)
                }
                foreach ($pr in $apProbes) {
                    $side = @(
                        @{ S = "备份脚本"; Txt = $bkTxt; V = "复制" },
                        @{ S = "恢复脚本"; Txt = $rsTxt; V = "写回" }
                    )
                    foreach ($sd in $side) {
                        $tag = "admin-portal 站点路径 " + $pr.N + "（" + $sd.S + "）"
                        if ($null -eq $sd.Txt) {
                            Add-Res "配置" $tag "INFO" "备份里没带 scripts\$($sd.S -replace '脚本','-docker.ps1')，跳过"
                            continue
                        }
                        $par = @(Get-AppFileParents $sd.Txt $pr.T)
                        if ($par.Count -eq 0) {
                            Add-Res "配置" $tag "INFO" ("脚本里找不到 " + $pr.N + " 的绝对路径")
                        } elseif ($par.Count -eq 1 -and $par[0] -ieq $apMount) {
                            Add-Res "配置" $tag "OK" `
                                ($sd.V + "的是 ...\" + $par[0] + "\" + $pr.N + "，与容器 /app 挂载（" + $apMount + "）一致")
                        } else {
                            Add-Res "配置" $tag "WARN" `
                                ($sd.V + "的是 ...\" + ($par -join " / ...\") + "\" + $pr.N +
                                 "，但容器的 /app 挂的是 ...\" + $apMount +
                                 " —— 这份备份/恢复操作的可能不是正在跑的那个站点")
                        }
                    }
                }
            }
        }

        foreach ($d in $CfgDirs) {
            $p = Join-Path $cfgDir $d.D
            $label = "config\" + $d.D + "\"
            if (-not (Test-Path -LiteralPath $p)) {
                Add-Res "配置" $label "WARN" ("缺失：" + $d.What)
                continue
            }
            $cnt = @(Get-ChildItem -LiteralPath $p -Recurse -File -Force -ErrorAction SilentlyContinue).Count
            if ($cnt -eq 0) {
                Add-Res "配置" $label "FAIL" ("目录是空的：" + $d.What)
                continue
            }
            if ($d.Probe -ne "") {
                $probeFound = @(Get-ChildItem -LiteralPath $p -Recurse -Filter $d.Probe -Force -ErrorAction SilentlyContinue).Count -gt 0
                if (-not $probeFound) {
                    Add-Res "配置" $label "WARN" ("有 " + $cnt + " 个文件，但找不到标志文件 " + $d.Probe + "（" + $d.What + "）")
                    continue
                }
            }
            Add-Res "配置" $label "OK" ($cnt.ToString() + " 个文件")
        }
    }

    # ---------- 5. 数据库 ----------
    if (Test-Path -LiteralPath $dbDir) {
        foreach ($d in $DbFiles) {
            Test-SqlDump -Path (Join-Path $dbDir $d.F) -Label ("db\" + $d.F) -Group "数据库" -Kind $d.Kind -MinKB $d.MinKB
        }
        foreach ($s in @("ghost.db", "gitea.db")) {
            $p = Join-Path $dbDir $s
            if (Test-Path -LiteralPath $p) { Test-Sqlite -Path $p -Label ("db\" + $s) -Group "数据库" }
            else { Add-Res "数据库" ("db\" + $s) "FAIL" "缺失" }
        }
    }

    # ---------- 6. 卷 ----------
    if (Test-Path -LiteralPath $volDir) {
        foreach ($v in $VolTars) {
            Test-Tar -Path (Join-Path $volDir $v.F) -Label ("volumes\" + $v.F) -Group "卷" -ExpectTop $v.Top
        }
        # dify-plugin-daemon 已由 dify-docker 目录覆盖，存在则顺带校验
        $pd = Join-Path $volDir "dify-plugin-daemon.tar"
        if (Test-Path -LiteralPath $pd) { Test-Tar -Path $pd -Label "volumes\dify-plugin-daemon.tar" -Group "卷" -ExpectTop "storage" }
    }

    # ---------- 7. 镜像 ----------
    if (Test-Path -LiteralPath $imgDir) {
        $pkgs = @(Get-ChildItem -LiteralPath $imgDir -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*.tar*" })
        if ($pkgs.Count -eq 0) {
            Add-Res "镜像" "images\ 镜像包" "WARN" "images\ 目录存在但没有 .tar/.tar.gz 镜像包（新体系已不再产生 images\，属旧备份残留）"
        } else {
            $okAll = $true
            foreach ($p in $pkgs) {
                $b = Get-HeadBytes -Path $p.FullName -Count 520
                if ($null -eq $b) { Add-Res "镜像" ("images\" + $p.Name) "FAIL" "读不到文件头"; $okAll = $false; continue }
                if ($p.Name -like "*.gz") {
                    if ($b[0] -eq 0x1F -and $b[1] -eq 0x8B) {
                        Add-Res "镜像" ("images\" + $p.Name) "OK" ("gzip 头正常，" + (Format-Size $p.Length))
                    } else {
                        Add-Res "镜像" ("images\" + $p.Name) "FAIL" ("后缀是 .gz 但没有 gzip 魔数，压缩包不完整"); $okAll = $false
                    }
                } else {
                    $m = [System.Text.Encoding]::ASCII.GetString($b, 257, 5)
                    if ($m -eq "ustar") { Add-Res "镜像" ("images\" + $p.Name) "OK" ("tar 头正常，" + (Format-Size $p.Length)) }
                    else { Add-Res "镜像" ("images\" + $p.Name) "FAIL" "不是有效的 tar"; $okAll = $false }
                }
                if ($p.Length -lt 100MB) {
                    Add-Res "镜像" ("images\" + $p.Name + " 体积") "WARN" ((Format-Size $p.Length) + " —— 明显偏小，很可能导出中断")
                }
            }
            if ($okAll -and $pkgs.Count -gt 0) { Add-Res "镜像" "镜像包可离线加载" "OK" ($pkgs.Count.ToString() + " 个包，可用 docker load -i 恢复") }
        }
    }

    # ---------- 8. VHDX ----------
    if ($hasVhdx) {
        $b = Get-HeadBytes -Path $vhdx -Count 8
        $len = (Get-Item -LiteralPath $vhdx).Length
        if ($null -ne $b -and [System.Text.Encoding]::ASCII.GetString($b, 0, 8) -eq "vhdxfile") {
            Add-Res "VHDX" "docker_data.vhdx" "OK" ("VHDX 头正常，" + (Format-Size $len))
        } else {
            Add-Res "VHDX" "docker_data.vhdx" "FAIL" "文件头不是 'vhdxfile'，不是有效的 VHDX"
        }
        if ($len -lt 1GB) { Add-Res "VHDX" "docker_data.vhdx 体积" "WARN" ((Format-Size $len) + " —— 偏小，可能不是完整数据盘") }
    } elseif ($RequireLevel -ge 2) {
        Add-Res "VHDX" "docker_data.vhdx" "FAIL" "缺失，无法走换数据盘恢复（-RequireLevel 2 要求有 VHDX）"
    } else {
        Add-Res "VHDX" "docker_data.vhdx" "INFO" "本备份是 Level 1（config + db），没有 VHDX 属正常；恢复只能走还原 DB + 配置的路径"
    }

    # ---------- 9. 自恢复性 ----------
    $hasRestore = $false
    if (Test-Path -LiteralPath $scrDir) {
        foreach ($n in @("restore-docker.ps1", "backup-docker.ps1")) {
            $p = Join-Path $scrDir $n
            if (Test-Path -LiteralPath $p) {
                $sz = (Get-Item -LiteralPath $p).Length
                if ($sz -lt 1000) { Add-Res "自恢复" ("scripts\" + $n) "WARN" ((Format-Size $sz) + " —— 体积过小，可能不完整") }
                else { Add-Res "自恢复" ("scripts\" + $n) "OK" (Format-Size $sz) }
                if ($n -eq "restore-docker.ps1") { $hasRestore = $true }
            } else {
                Add-Res "自恢复" ("scripts\" + $n) "WARN" "缺失（备份里没带恢复脚本，C: 盘挂了就得另找）"
            }
        }
        if ($hasRestore) {
            $rtxt = ""
            try { $rtxt = [System.IO.File]::ReadAllText((Join-Path $scrDir "restore-docker.ps1"), [System.Text.Encoding]::UTF8) } catch { }
            if ($rtxt -match "BackupDir" -and $rtxt -match "strategy|Strategy") { Add-Res "自恢复" "restore 脚本可用性" "OK" "含 -BackupDir 参数与恢复策略分支" }
            else { Add-Res "自恢复" "restore 脚本可用性" "WARN" "内容不像 restore-docker.ps1（缺 -BackupDir 或策略分支）" }
        }
    } else {
        Add-Res "自恢复" "scripts\" "WARN" "缺失——备份里没带备份/恢复脚本"
    }

    # ---------- 10. .env 结构与变量一致性 ----------
    $envPath = Join-Path $cfgDir ".env"
    if (Test-Path -LiteralPath $envPath) {
        $lines = Read-Lines -Path $envPath

        if ($lines.Count -lt 100) {
            Add-Res "一致性" ".env 行数" "FAIL" ($lines.Count.ToString() + " 行 —— 正常应约 130 行；偏少说明换行被吞过")
        } else {
            Add-Res "一致性" ".env 行数" "OK" ($lines.Count.ToString() + " 行")
        }

        $overlong = @($lines | Where-Object { $_.Length -gt 200 })
        if ($overlong.Count -gt 0) {
            Add-Res "一致性" ".env 超长行" "FAIL" ($overlong.Count.ToString() + " 行超过 200 字符 —— 典型的「多行被合并成一行」损坏，变量会整行失效")
        } else {
            Add-Res "一致性" ".env 超长行" "OK" "无超长行"
        }

        # 收集已生效（非注释）的键，以及「被注释掉的赋值」
        $defined = @{}
        $commented = @()
        foreach ($ln in $lines) {
            if ($ln -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=") {
                $defined[$matches[1]] = $true
            } elseif ($ln -cmatch "^\s*#.*?([A-Z][A-Z0-9_]{2,})\s*=") {
                # 用 -cmatch（区分大小写）：-match 默认忽略大小写，[A-Z] 会连小写一起匹配，
                # 于是注释里的英文句子会被误判成"被注释掉的变量"。只认 SCREAMING_SNAKE_CASE。
                $commented += $matches[1]
            }
        }
        Add-Res "一致性" ".env 变量数" "OK" ($defined.Keys.Count.ToString() + " 个已生效变量")

        $hitCritical = @()
        foreach ($k in $EnvCritical) { if (-not $defined.ContainsKey($k)) { $hitCritical += $k } }
        if ($hitCritical.Count -gt 0) {
            Add-Res "一致性" "关键变量" "FAIL" ("缺失：" + ($hitCritical -join ", ") + " —— 恢复后对外 URL / 管理员登录会直接坏掉")
        } else {
            Add-Res "一致性" "关键变量" "OK" ($EnvCritical -join ", ")
        }

        $hitExpected = @()
        foreach ($k in $EnvExpected) { if (-not $defined.ContainsKey($k)) { $hitExpected += $k } }
        if ($hitExpected.Count -gt 0) {
            Add-Res "一致性" "常见变量" "WARN" ("缺失：" + ($hitExpected -join ", "))
        } else {
            Add-Res "一致性" "常见变量" "OK" ($EnvExpected.Count.ToString() + " 个都在")
        }

        if ($commented.Count -gt 0) {
            $uniq = @($commented | Sort-Object -Unique)
            $hit = @($uniq | Where-Object { $EnvCritical -contains $_ -or $EnvExpected -contains $_ })
            if ($hit.Count -gt 0) {
                Add-Res "一致性" "被注释掉的变量" "FAIL" ("这些赋值被注释掉了，等于没定义：" + ($hit -join ", "))
            } else {
                # 注释掉非关键变量是正常写法（保留备选值），只作提示
                Add-Res "一致性" "被注释掉的变量" "INFO" ($uniq.Count.ToString() + " 个赋值处于注释状态（非关键变量，属正常）：" + (($uniq | Select-Object -First 8) -join ", "))
            }
        }

        if ($defined.ContainsKey("SERVER_PUBLIC_URL")) {
            $srv = ""
            foreach ($ln in $lines) {
                if ($ln -match "^\s*SERVER_PUBLIC_URL\s*=\s*(.*)$") { $srv = $matches[1].Trim(); break }
            }
            if ($srv -match "^https?://[^\s]+$") {
                Add-Res "一致性" "SERVER_PUBLIC_URL 取值" "OK" ($srv + "（所有对外 URL 的基地址）")
            } else {
                Add-Res "一致性" "SERVER_PUBLIC_URL 取值" "FAIL" ("取值为 '" + $srv + "'，不是 http(s)://主机 形式 —— 所有产品入口 URL 都会拼错")
            }
        }

        # compose 引用的 ${VAR} 是否都在 .env 里
        $pairs = @(
            @{ Compose = (Join-Path $cfgDir "docker-compose.yml");       Env = (Join-Path $cfgDir ".env");         Label = "docker-compose.yml" }
            @{ Compose = (Join-Path $cfgDir "dify_docker-compose.yaml"); Env = (Join-Path $cfgDir "dify_.env");   Label = "dify_docker-compose.yaml" }
        )
        foreach ($pr in $pairs) {
            if (-not (Test-Path -LiteralPath $pr.Compose)) { continue }
            $ctxt = [System.IO.File]::ReadAllText($pr.Compose, [System.Text.Encoding]::UTF8)
            $envTxt = ""
            if (Test-Path -LiteralPath $pr.Env) { $envTxt = [System.IO.File]::ReadAllText($pr.Env, [System.Text.Encoding]::UTF8) }
            # 只认 ${VAR} 形式；(?<!\$) 用来跳过 $${VAR}——那是 compose 里给 shell 用的字面量，不是 compose 变量
            $refs = [regex]::Matches($ctxt, '(?<!\$)\$\{([A-Za-z_][A-Za-z0-9_]*)(:?[-?][^}]*)?\}')
            $missingNoDefault = @()
            $missingWithDefault = @()
            foreach ($m in $refs) {
                $k = $m.Groups[1].Value
                $hasDefault = $m.Groups[2].Value -ne ""
                # 用 -cmatch：compose 的变量名区分大小写，这里也必须区分
                $inEnv = ($envTxt -cmatch ("(?m)^\s*" + [regex]::Escape($k) + "\s*="))
                if ($inEnv) { continue }
                if ($hasDefault) { $missingWithDefault += $k } else { $missingNoDefault += $k }
            }
            $missingNoDefault = @($missingNoDefault | Sort-Object -Unique)
            $missingWithDefault = @($missingWithDefault | Sort-Object -Unique)
            # 这些在 compose 里是可选集成，允许为空
            $optional = @("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GHOST_ADMIN_EMAIL")
            $optionalHit = @($missingNoDefault | Where-Object { $optional -contains $_ })
            $missingNoDefault = @($missingNoDefault | Where-Object { $optional -notcontains $_ })

            if ($missingNoDefault.Count -eq 0) {
                Add-Res "一致性" ($pr.Label + " 引用的变量") "OK" "compose 里引用的变量在 .env 中都有定义"
            } else {
                Add-Res "一致性" ($pr.Label + " 引用的变量") "WARN" ($missingNoDefault.Count.ToString() + " 个无默认值的变量未在 .env 中定义：" + (($missingNoDefault | Select-Object -First 12) -join ", "))
            }
            if ($missingWithDefault.Count -gt 0) {
                Add-Res "一致性" ($pr.Label + " 有默认值的变量") "INFO" ($missingWithDefault.Count.ToString() + " 个未定义但有默认值兜底：" + (($missingWithDefault | Select-Object -First 8) -join ", "))
            }
            if ($optionalHit.Count -gt 0) {
                Add-Res "一致性" ($pr.Label + " 可选集成") "INFO" ("未配置（属正常）：" + ($optionalHit -join ", "))
            }
        }
    }
}

# ============================================================
# 入口：支持单备份 / 父目录批量
# ============================================================
$targets = @()
if ((Test-Path -LiteralPath (Join-Path $BackupDir "config")) -or (Test-Path -LiteralPath (Join-Path $BackupDir "db"))) {
    $targets = @($BackupDir)
} elseif (Test-Path -LiteralPath $BackupDir -PathType Container) {
    $subs = @(Get-ChildItem -LiteralPath $BackupDir -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "backup_*" } | Sort-Object Name)
    if ($subs.Count -eq 0) {
        # 既不是备份目录，里面也没有 backup_* —— 还是按单备份检查，让它把问题报清楚
        $targets = @($BackupDir)
    } else {
        $targets = @($subs | ForEach-Object { $_.FullName })
    }
} else {
    $targets = @($BackupDir)
}

$summary = New-Object System.Collections.ArrayList

foreach ($t in $targets) {
    Test-OneBackup -Dir $t
    $fails = @($script:Results | Where-Object { $_.Status -eq "FAIL" })
    $warns = @($script:Results | Where-Object { $_.Status -eq "WARN" })
    $verdict = "通过"
    if ($fails.Count -gt 0) { $verdict = "不可用" }
    elseif ($warns.Count -gt 0) { $verdict = "可用但需注意" }
    [void]$summary.Add([PSCustomObject]@{
        Path   = $t
        Verdict = $verdict
        Fail   = $fails.Count
        Warn   = $warns.Count
        Results = @($script:Results)
    })
}

# ============================================================
# 输出
# ============================================================
$anyFail = $false
foreach ($s in $summary) { if ($s.Fail -gt 0) { $anyFail = $true } }
$exitCode = 0
if ($anyFail) { $exitCode = 1 }
if ($targets.Count -eq 0) { $exitCode = 2 }

if ($Json) {
    $payload = @()
    foreach ($s in $summary) {
        $payload += @{
            path    = $s.Path
            verdict = $s.Verdict
            fail    = $s.Fail
            warn    = $s.Warn
            checks  = @($s.Results | ForEach-Object { @{ group = $_.Group; name = $_.Name; status = $_.Status; detail = $_.Detail } })
        }
    }
    $payload | ConvertTo-Json -Depth 6
    exit $exitCode
}

$line = "=" * 74
Write-Output $line
Write-Output "AI AllInOne 备份校验  (判据：restore-docker.ps1 能否照着恢复)"
Write-Output ("时间: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-Output $line

foreach ($s in $summary) {
    Write-Output ""
    Write-Output ("备份目录: " + $s.Path)
    Write-Output ("结论    : " + $s.Verdict + "   (FAIL " + $s.Fail + " / WARN " + $s.Warn + ")")
    Write-Output ("-" * 74)
    $curGroup = ""
    foreach ($r in $s.Results) {
        if ($r.Group -ne $curGroup) {
            $curGroup = $r.Group
            Write-Output ("[" + $curGroup + "]")
        }
        $mark = "  "
        switch ($r.Status) {
            "OK"   { $mark = " OK " }
            "WARN" { $mark = "WARN" }
            "FAIL" { $mark = "FAIL" }
            "INFO" { $mark = " -- " }
        }
        $n = $r.Name
        if ($n.Length -lt 30) { $n = $n.PadRight(30) }
        if ($r.Detail -ne "") {
            Write-Output ("  " + $mark + " " + $n + "  " + $r.Detail)
        } else {
            Write-Output ("  " + $mark + " " + $n)
        }
    }
    $fails = @($s.Results | Where-Object { $_.Status -eq "FAIL" })
    if ($fails.Count -gt 0) {
        Write-Output ""
        Write-Output "必须处理的问题："
        foreach ($f in $fails) { Write-Output ("  - [" + $f.Group + "] " + $f.Name + ": " + $f.Detail) }
    }
}

if ($summary.Count -gt 1) {
    Write-Output ""
    Write-Output $line
    Write-Output "汇总"
    Write-Output $line
    foreach ($s in $summary) {
        Write-Output ("  " + $s.Verdict.PadRight(14) + " FAIL=" + $s.Fail + " WARN=" + $s.Warn + "  " + $s.Path)
    }
}

Write-Output ""
Write-Output $line
if ($anyFail) {
    Write-Output "结论：有备份不通过。上面标 FAIL 的项会导致 restore-docker.ps1 无法正确恢复，请重做备份或改用其它备份。"
} else {
    Write-Output "结论：检查通过。该备份可用于 restore-docker.ps1 恢复（WARN 项不阻塞，但建议看一眼）。"
}
Write-Output $line

exit $exitCode
