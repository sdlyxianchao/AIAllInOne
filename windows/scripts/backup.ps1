# ============================================================
# AI 平台数据备份脚本
# 路径: <部署目录>\scripts\backup.ps1
# 用法: powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
#       建议加入 Windows 计划任务，每天凌晨执行
#
# 备份内容:
#   1. NewAPI MySQL      —— mysqldump 全量逻辑备份
#   2. Dify PostgreSQL   —— pg_dump 全量逻辑备份
#   3. Ghost / Gitea     —— SQLite 文件复制（先 WAL checkpoint）
#   4. 配置文件          —— .env / docker-compose / yaml / 源码配置
#
# 说明:
#   - Weaviate（Dify 向量库）暂不备份：向量数据可由文档重新索引恢复
#   - Redis 为缓存，不备份（可重建）
#   - 备份目录保留最近 N 天（$RetentionDays），旧备份自动清理
# ============================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ---- 配置 ----
$DeployDir  = Split-Path -Parent $PSScriptRoot          # 部署目录（脚本上一级，自动定位）
$BackupRoot = Join-Path (Split-Path -Parent $DeployDir) "backups"          # 备份根目录（部署目录上一级，与 compose ../backups 一致）
$RetentionDays = 7                             # 保留最近 N 天备份

# 从 .env 读取 NewAPI MySQL 密码
function Get-EnvValue($key, $envFile) {
    if (-not (Test-Path $envFile)) { return "" }
    $m = Select-String -Path $envFile -Pattern "^$key=" | Select-Object -First 1
    if ($m) { return ($m.Line -replace "^$key=", "").Trim() }
    return ""
}
$NewApiDbPass = Get-EnvValue "NEWAPI_DB_PASSWORD" "$DeployDir\.env"
$DifyDbPass   = Get-EnvValue "DB_PASSWORD" "$DeployDir\dify\docker\.env"
if (-not $DifyDbPass) { $DifyDbPass = "difyai123456" }

$TimeStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $BackupRoot "backup_$TimeStamp"
$LogFile   = Join-Path $BackupRoot "backup.log"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$PASS = 0; $FAIL = 0

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    # 统一写 UTF-8（无 BOM），否则中文在 AI 管理中心按 UTF-8 读取会乱码
    [System.IO.File]::AppendAllText($LogFile, $line + "`r`n", (New-Object System.Text.UTF8Encoding($false)))
    Write-Host $line
}
function Ok($msg) { $script:PASS++; Log "  [OK] $msg" }
function Err($msg) { $script:FAIL++; Log "  [FAIL] $msg" }

Log "========== 开始备份 -> $BackupDir =========="

# 1. NewAPI MySQL dump
Log "1. NewAPI MySQL 备份"
$mysqlDump = Join-Path $BackupDir "newapi-mysql.sql"
if ($NewApiDbPass) {
    docker exec new-api-db sh -c "mysqldump -uroot -p'$NewApiDbPass' --single-transaction --routines --triggers new-api" 2>$null | Out-File -Encoding utf8 $mysqlDump
    if ((Test-Path $mysqlDump) -and ((Get-Item $mysqlDump).Length -gt 1024)) { Ok "NewAPI MySQL dump ($([math]::Round((Get-Item $mysqlDump).Length/1KB,1)) KB)" }
    else { Err "NewAPI MySQL dump 失败或为空" }
} else { Err "未读取到 NEWAPI_DB_PASSWORD" }

# 2. Dify PostgreSQL dump
Log "2. Dify PostgreSQL 备份"
$pgDump = Join-Path $BackupDir "dify-postgres.sql"
docker exec docker-db_postgres-1 sh -c "PGPASSWORD='$DifyDbPass' pg_dump -U postgres -d dify --clean --if-exists" 2>$null | Out-File -Encoding utf8 $pgDump
if ((Test-Path $pgDump) -and ((Get-Item $pgDump).Length -gt 1024)) { Ok "Dify PostgreSQL dump ($([math]::Round((Get-Item $pgDump).Length/1KB,1)) KB)" }
else { Err "Dify PostgreSQL dump 失败或为空" }

# 3. SQLite（Ghost / Gitea）文件复制
Log "3. SQLite 备份（Ghost / Gitea）"
# Ghost: 先 WAL checkpoint 再复制
docker exec ghost sh -c 'cd /var/lib/ghost && node -e "const D=require(\"/var/lib/ghost/versions/5.130.6/node_modules/better-sqlite3\");const db=new D(\"/var/lib/ghost/content/data/ghost.db\");db.pragma(\"wal_checkpoint(TRUNCATE)\");db.close()"' 2>$null
docker cp ghost:/var/lib/ghost/content/data/ghost.db "$BackupDir\ghost.db" 2>$null
if ((Test-Path "$BackupDir\ghost.db") -and ((Get-Item "$BackupDir\ghost.db").Length -gt 0)) { Ok "Ghost ghost.db 已复制" }
else { Err "Ghost ghost.db 复制失败" }

docker exec gitea sh -c 'sqlite3 /data/gitea/gitea.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null' 2>$null
docker cp gitea:/data/gitea/gitea.db "$BackupDir\gitea.db" 2>$null
if ((Test-Path "$BackupDir\gitea.db") -and ((Get-Item "$BackupDir\gitea.db").Length -gt 0)) { Ok "Gitea gitea.db 已复制" }
else { Err "Gitea gitea.db 复制失败" }

# 4. 配置文件（逐文件复制 + 逐文件校验，避免点号文件/批量复制被静默跳过）
Log "4. 配置文件备份"
$cfgDir = Join-Path $BackupDir "config"
New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null
$cfgFiles = @(
    @{ src = "$DeployDir\.env";                     dst = ".env" },
    @{ src = "$DeployDir\.env.windows";             dst = ".env.windows" },
    @{ src = "$DeployDir\docker-compose.yml";       dst = "docker-compose.yml" },
    @{ src = "$DeployDir\litellm-config.yaml";      dst = "litellm-config.yaml" },
    @{ src = "$DeployDir\gitea-runner-config.yaml"; dst = "gitea-runner-config.yaml" },
    @{ src = "$DeployDir\mcp-gateway\mcp-servers.json"; dst = "mcp-servers.json" },
    @{ src = "$DeployDir\dify\docker\.env";         dst = "dify.env" }
)
foreach ($f in $cfgFiles) {
    $dst = Join-Path $cfgDir $f.dst
    if (Test-Path -LiteralPath $f.src) {
        Copy-Item -LiteralPath $f.src -Destination $dst -Force -ErrorAction SilentlyContinue
        if (Test-Path -LiteralPath $dst) { Ok "配置 $($f.dst) 已备份" }
        else { Err "配置 $($f.dst) 复制失败" }
    } else {
        Err "配置 $($f.src) 不存在（跳过）"
    }
}

# 5. Keycloak（realm export 导出 JSON，停机保证一致性，含用户/角色/客户端/LDAP）
#    注意：不能用 pg_dump —— 还原时 default role 关联会丢失导致 Keycloak 起不来
Log "5. Keycloak 数据备份"
$kcDir = Join-Path $BackupDir "keycloak-realm"
New-Item -ItemType Directory -Force -Path $kcDir | Out-Null
$KcDbPass = Get-EnvValue "KEYCLOAK_DB_PASSWORD" "$DeployDir\.env"
if ($KcDbPass) {
    docker stop keycloak 2>$null | Out-Null
    docker run --rm --network ai-platform -v "${kcDir}:/backup" `
        -e KC_DB=postgres -e "KC_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak" `
        -e KC_DB_USERNAME=keycloak -e "KC_DB_PASSWORD=$KcDbPass" `
        quay.io/keycloak/keycloak:25.0 export --dir /backup --realm enterprise-ai --users realm_file 2>$null
    docker start keycloak 2>$null | Out-Null
    $realmFile = Join-Path $kcDir "enterprise-ai-realm.json"
    if ((Test-Path $realmFile) -and ((Get-Item $realmFile).Length -gt 1024)) { Ok "Keycloak realm 导出 ($([math]::Round((Get-Item $realmFile).Length/1KB,1)) KB)" }
    else { Err "Keycloak realm 导出失败" }
} else { Err "未读取到 KEYCLOAK_DB_PASSWORD" }

# 6. Langfuse PostgreSQL dump（项目/API key 配置）
Log "6. Langfuse PostgreSQL 备份"
$lfDump = Join-Path $BackupDir "langfuse-postgres.sql"
$LangfusePgPass = Get-EnvValue "LANGFUSE_POSTGRES_PASSWORD" "$DeployDir\.env"
if ($LangfusePgPass) {
    docker exec langfuse-postgres sh -c "PGPASSWORD='$LangfusePgPass' pg_dump -U langfuse -d langfuse --clean --if-exists" 2>$null | Out-File -Encoding utf8 $lfDump
    if ((Test-Path $lfDump) -and ((Get-Item $lfDump).Length -gt 1024)) { Ok "Langfuse PostgreSQL dump ($([math]::Round((Get-Item $lfDump).Length/1KB,1)) KB)" }
    else { Err "Langfuse PostgreSQL dump 失败或为空" }
} else { Err "未读取到 LANGFUSE_POSTGRES_PASSWORD" }

# 7. Grafana（grafana.db SQLite，含大盘/用户/告警/数据源配置）
Log "7. Grafana 数据备份"
docker cp grafana:/var/lib/grafana/grafana.db "$BackupDir\grafana.db" 2>$null
if ((Test-Path "$BackupDir\grafana.db") -and ((Get-Item "$BackupDir\grafana.db").Length -gt 1024)) { Ok "Grafana grafana.db 已备份 ($([math]::Round((Get-Item "$BackupDir\grafana.db").Length/1KB,1)) KB)" }
else { Err "Grafana grafana.db 备份失败" }

# 8. 说明：Prometheus TSDB / Langfuse ClickHouse / MinIO 为可重建的运行时数据（历史指标、trace 及附件），
#    体积大且丢失可重新产生，故不纳入每日备份。

# 9. 清理旧备份
Log "9. 清理旧备份（保留最近 $RetentionDays 天）"
Get-ChildItem -Path $BackupRoot -Directory -Filter "backup_*" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force; Log "  删除旧备份 $($_.Name)" }

Log "========== 备份完成：通过 $PASS，失败 $FAIL =========="
Log ""
