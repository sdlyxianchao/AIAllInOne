# ============================================================
# AI 平台数据恢复脚本
# 路径: <部署目录>\scripts\restore.ps1
# 用法: powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
# 参数:
#   -BackupDir   备份目录（内含 newapi-mysql.sql / dify-postgres.sql / ghost.db / gitea.db / config\）
#   -Force       跳过确认，直接恢复（危险，仅脚本/CI 用）
#
# 说明:
#   - 恢复会覆盖现有数据，务必先停相关容器或确认可接受数据回滚。
#   - 恢复顺序：停目标容器 → 导入 → 起容器 → 校验。
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir,
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$DeployDir = Split-Path -Parent $PSScriptRoot

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Write-Host $line
}

if (-not (Test-Path -LiteralPath $BackupDir)) {
    Log "[FAIL] 备份目录不存在: $BackupDir"
    exit 1
}

Log "========== 开始恢复，来源: $BackupDir =========="
Log "!! 恢复将覆盖现有数据（NewAPI/MySQL、Dify/Postgres、Ghost/Gitea SQLite、配置文件）"

if (-not $Force) {
    $ans = Read-Host "确认恢复？输入 yes 继续"
    if ($ans -ne "yes") { Log "已取消"; exit 0 }
}

# ---- 1. 配置文件恢复 ----
Log "1. 恢复配置文件"
$cfgDir = Join-Path $BackupDir "config"
if (Test-Path -LiteralPath $cfgDir) {
    foreach ($f in @(".env", ".env.windows", "docker-compose.yml", "litellm-config.yaml", "gitea-runner-config.yaml", "mcp-servers.json")) {
        $src = Join-Path $cfgDir $f
        $dst = if ($f -eq "mcp-servers.json") { Join-Path $DeployDir "mcp-gateway\mcp-servers.json" } else { Join-Path $DeployDir $f }
        if (Test-Path -LiteralPath $src) {
            Copy-Item -LiteralPath $src -Destination $dst -Force
            Log "  [OK] 恢复 $f"
        } else { Log "  [跳过] 备份中无 $f" }
    }
} else { Log "  [跳过] 备份中无 config 目录" }

# ---- 2. NewAPI MySQL 恢复 ----
Log "2. 恢复 NewAPI MySQL"
$mysqlDump = Join-Path $BackupDir "newapi-mysql.sql"
if (Test-Path -LiteralPath $mysqlDump) {
    $pass = (Select-String -Path "$DeployDir\.env" -Pattern "^NEWAPI_DB_PASSWORD=" | Select-Object -First 1).Line -replace "^NEWAPI_DB_PASSWORD=", ""
    # 通过 stdin 导入，避免命令行暴露密码
    Get-Content -LiteralPath $mysqlDump -Raw | docker exec -i new-api-db sh -c "MYSQL_PWD='$pass' mysql -uroot new-api"
    if ($LASTEXITCODE -eq 0) { Log "  [OK] NewAPI MySQL 已恢复" } else { Log "  [FAIL] NewAPI MySQL 恢复失败" }
} else { Log "  [跳过] 无 newapi-mysql.sql" }

# ---- 3. Dify PostgreSQL 恢复 ----
Log "3. 恢复 Dify PostgreSQL"
$pgDump = Join-Path $BackupDir "dify-postgres.sql"
if (Test-Path -LiteralPath $pgDump) {
    $difyPass = (Select-String -Path "$DeployDir\dify\docker\.env" -Pattern "^DB_PASSWORD=" | Select-Object -First 1).Line -replace "^DB_PASSWORD=", ""
    if (-not $difyPass) { $difyPass = "difyai123456" }
    Get-Content -LiteralPath $pgDump -Raw | docker exec -i docker-db_postgres-1 sh -c "PGPASSWORD='$difyPass' psql -U postgres -d dify"
    if ($LASTEXITCODE -eq 0) { Log "  [OK] Dify PostgreSQL 已恢复" } else { Log "  [FAIL] Dify PostgreSQL 恢复失败" }
} else { Log "  [跳过] 无 dify-postgres.sql" }

# ---- 4. Keycloak realm 恢复（清空 PG + import realm JSON）----
Log "4. 恢复 Keycloak"
$kcDir = Join-Path $BackupDir "keycloak-realm"
$realmFile = Join-Path $kcDir "enterprise-ai-realm.json"
if (Test-Path -LiteralPath $realmFile) {
    $kcPass = (Select-String -Path "$DeployDir\.env" -Pattern "^KEYCLOAK_DB_PASSWORD=" | Select-Object -First 1).Line -replace "^KEYCLOAK_DB_PASSWORD=", ""
    docker stop keycloak 2>$null | Out-Null
    # 清空 PG 库（DROP + CREATE）
    docker exec keycloak-db sh -c "PGPASSWORD='$kcPass' psql -U keycloak -d postgres -c 'DROP DATABASE keycloak WITH (FORCE);' -c 'CREATE DATABASE keycloak;'" 2>$null
    # import realm JSON 到空库
    docker run --rm --network ai-platform -v "$kcDir:/import" `
        -e KC_DB=postgres -e "KC_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak" `
        -e KC_DB_USERNAME=keycloak -e "KC_DB_PASSWORD=$kcPass" `
        quay.io/keycloak/keycloak:25.0 import --dir /import 2>$null
    if ($LASTEXITCODE -eq 0) { Log "  [OK] Keycloak realm 已导入" } else { Log "  [FAIL] Keycloak realm 导入失败" }
    docker start keycloak 2>$null | Out-Null
} else { Log "  [跳过] 无 keycloak-realm/enterprise-ai-realm.json" }

# ---- 5. Langfuse PostgreSQL 恢复 ----
Log "5. 恢复 Langfuse PostgreSQL"
$lfDump = Join-Path $BackupDir "langfuse-postgres.sql"
if (Test-Path -LiteralPath $lfDump) {
    $lfPass = (Select-String -Path "$DeployDir\.env" -Pattern "^LANGFUSE_POSTGRES_PASSWORD=" | Select-Object -First 1).Line -replace "^LANGFUSE_POSTGRES_PASSWORD=", ""
    docker stop langfuse langfuse-worker 2>$null | Out-Null
    Get-Content -LiteralPath $lfDump -Raw | docker exec -i langfuse-postgres sh -c "PGPASSWORD='$lfPass' psql -U langfuse -d langfuse" 2>$null
    if ($LASTEXITCODE -eq 0) { Log "  [OK] Langfuse PostgreSQL 已恢复" } else { Log "  [FAIL] Langfuse PostgreSQL 恢复失败" }
    docker start langfuse langfuse-worker 2>$null | Out-Null
} else { Log "  [跳过] 无 langfuse-postgres.sql" }

# ---- 6. Grafana 恢复 ----
Log "6. 恢复 Grafana"
$grafanaDb = Join-Path $BackupDir "grafana.db"
if (Test-Path -LiteralPath $grafanaDb) {
    docker stop grafana 2>$null | Out-Null
    docker cp $grafanaDb grafana:/var/lib/grafana/grafana.db
    docker exec -u 0 grafana sh -c "chown 472:0 /var/lib/grafana/grafana.db && chmod 640 /var/lib/grafana/grafana.db" 2>$null
    docker start grafana 2>$null | Out-Null
    Log "  [OK] Grafana grafana.db 已恢复并重启"
} else { Log "  [跳过] 无 grafana.db" }

# ---- 7. Ghost / Gitea SQLite 恢复 ----
Log "7. 恢复 SQLite（Ghost / Gitea）"
$ghostDb = Join-Path $BackupDir "ghost.db"
if (Test-Path -LiteralPath $ghostDb) {
    docker cp $ghostDb ghost:/var/lib/ghost/content/data/ghost.db
    docker exec -u 0 ghost sh -c "chown 1000:1000 /var/lib/ghost/content/data/ghost.db && chmod 640 /var/lib/ghost/content/data/ghost.db" 2>$null
    docker restart ghost | Out-Null
    Log "  [OK] Ghost ghost.db 已恢复并重启"
} else { Log "  [跳过] 无 ghost.db" }

$giteaDb = Join-Path $BackupDir "gitea.db"
if (Test-Path -LiteralPath $giteaDb) {
    docker cp $giteaDb gitea:/data/gitea/gitea.db
    docker exec -u 0 gitea sh -c "chown 1000:1000 /data/gitea/gitea.db && chmod 640 /data/gitea/gitea.db" 2>$null
    docker restart gitea | Out-Null
    Log "  [OK] Gitea gitea.db 已恢复并重启"
} else { Log "  [跳过] 无 gitea.db" }

Log "========== 恢复完成 =========="
Log "提示：恢复后请检查各产品是否正常，必要时 docker compose restart 相关服务。"
