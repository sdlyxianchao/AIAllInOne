# ============================================================
# AI AllInOne — 一键部署脚本（Windows + Docker Desktop）
# 路径: <部署目录>\bootstrap.ps1
#
# 流程：替换 IP → 生成密钥(.env) → 起 compose → Keycloak realm 初始化
#       → 配 NewAPI 渠道 → 注册备份计划任务 → 修 Langfuse SSO 账号绑定
#
# 用法示例：
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 `
#     -ServerIp "192.168.1.100" `
#     -AdminPassword "你的统一管理员密码" `
#     -DeepSeekKey "sk-xxx" `
#     -LdapBindDn "CN=ai all in one admin,CN=Users,DC=chxia,DC=lab" `
#     -LdapBindPassword "AD密码" `
#     -LdapUsersDn "CN=Users,DC=chxia,DC=lab"
# ============================================================

param(
    [Parameter(Mandatory = $true)][string]$ServerIp,     # 服务器内网 IP（必填）
    [string]$AdminPassword = "",                          # 统一管理员密码（留空自动生成）
    [string]$DeepSeekKey = "",                            # DeepSeek API Key（留空则 LiteLLM 无模型）
    [string]$OpenAIKey = "",                              # 可选 OpenAI Key
    [string]$AnthropicKey = "",                           # 可选 Anthropic Key
    # AD / LDAP
    [string]$LdapBindDn = "",
    [string]$LdapBindPassword = "",
    [string]$LdapUsersDn = "",
    [string]$LdapConnectionUrl = "ldap://host.docker.internal:389",
    # 开关
    [switch]$SkipDify,       # 跳过 Dify 部署
    [switch]$SkipKeycloak,   # 跳过 Keycloak realm 初始化（已初始化过）
    [switch]$SkipNewApi      # 跳过 NewAPI 渠道配置
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RootDir = $PSScriptRoot                       # 脚本所在目录（即部署目录）
$KeycloakUrl = "http://127.0.0.1:9090"
$SecretsFile = Join-Path $RootDir "scripts\keycloak-secrets.json"

function Write-Step($m) { Write-Host "[*] $m" }
function Write-Ok($m)  { Write-Host "    [OK] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "    [WARN] $m" -ForegroundColor Yellow }
function Write-Fail($m){ Write-Host "    [FAIL] $m" -ForegroundColor Red }

# 生成随机 hex 字符串（PowerShell 5.1 兼容）
function New-Hex([int]$bytes) {
    $b = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return ([BitConverter]::ToString($b) -replace '-', '').ToLower()
}
# 生成随机 base64
function New-B64([int]$bytes) {
    $b = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return [Convert]::ToBase64String($b)
}
# 文件内全文替换
function Replace-InFile([string]$file, [string]$old, [string]$new) {
    if (Test-Path -LiteralPath $file) {
        $c = Get-Content -LiteralPath $file -Raw
        $c = $c.Replace($old, $new)
        Set-Content -LiteralPath $file -Value $c -NoNewline -Encoding UTF8
    }
}

# ════════════════════════════════════════════
# Phase 1: 替换 IP（192.168.31.117 -> 目标 IP）
# ════════════════════════════════════════════
Write-Step "Phase 1: 替换 IP 为 $ServerIp"
$ipFiles = @(
    (Join-Path $RootDir "docker-compose.yml"),
    (Join-Path $RootDir "admin-portal\server.js"),
    (Join-Path $RootDir "admin-portal\public\index.html")
)
foreach ($f in $ipFiles) {
    Replace-InFile $f "192.168.31.117" $ServerIp
    Write-Ok "已替换: $f"
}
# Dify 的 .env.example 用 CHANGE_ME_IP 占位（脱敏时替换过）
$difyEnv = Join-Path $RootDir "dify\.env.example"
if (Test-Path -LiteralPath $difyEnv) {
    Replace-InFile $difyEnv "CHANGE_ME_IP" $ServerIp
    Write-Ok "已替换 Dify .env.example 的 IP"
}

# ════════════════════════════════════════════
# Phase 2: 生成 .env（随机密钥 + 逐行替换）
# ════════════════════════════════════════════
Write-Step "Phase 2: 生成 .env（随机密钥）"
if (-not $AdminPassword) { $AdminPassword = ("Abc@" + (New-Hex 6)) }
$envExample = Join-Path $RootDir ".env.example"
if (-not (Test-Path -LiteralPath $envExample)) { Write-Fail ".env.example 不存在"; exit 1 }

$envContent = Get-Content -LiteralPath $envExample -Raw

# 按行（正则 ^KEY=...）替换，避免前缀/子串误替换
function Set-EnvLine([string]$key, [string]$value) {
    $script:envContent = [regex]::Replace($script:envContent, '(?m)^' + [regex]::Escape($key) + '=.*$',
        [System.Text.RegularExpressions.MatchEvaluator]{ param($m) return ($key + '=' + $value) })
}

$dbPw       = New-Hex 16
$langfusePk = "pk-lf-" + (New-Hex 16)
$langfuseSk = "sk-lf-" + (New-Hex 32)

Set-EnvLine "KEYCLOAK_ADMIN_PASSWORD" $AdminPassword
Set-EnvLine "NEWAPI_DB_PASSWORD"      $dbPw
Set-EnvLine "NEWAPI_ADMIN_PASSWORD"   $AdminPassword
Set-EnvLine "NEWAPI_SESSION_SECRET"   (New-Hex 16)
Set-EnvLine "NEWAPI_CRYPTO_SECRET"    (New-Hex 16)
Set-EnvLine "LITELLM_MASTER_KEY"      (New-Hex 24)
Set-EnvLine "GITEA_RUNNER_TOKEN"      (New-Hex 24)
Set-EnvLine "ADMIN_PASSWORD"          $AdminPassword
Set-EnvLine "SESSION_SECRET"          (New-Hex 32)
Set-EnvLine "MCP_ADMIN_TOKEN"         (New-Hex 16)
Set-EnvLine "DIFY_ADMIN_PASSWORD"     $AdminPassword
Set-EnvLine "GRAFANA_ADMIN_PASSWORD"  $AdminPassword
Set-EnvLine "LANGFUSE_NEXTAUTH_SECRET"   (New-B64 32)
Set-EnvLine "LANGFUSE_SALT"              (New-B64 32)
Set-EnvLine "LANGFUSE_POSTGRES_PASSWORD" (New-Hex 12)
Set-EnvLine "LANGFUSE_MINIO_PASSWORD"    (New-Hex 12)
Set-EnvLine "LANGFUSE_CLICKHOUSE_PASSWORD" (New-Hex 12)
Set-EnvLine "LANGFUSE_ENCRYPTION_KEY"    (New-Hex 32)
Set-EnvLine "LANGFUSE_PUBLIC_KEY"        $langfusePk
Set-EnvLine "LANGFUSE_SECRET_KEY"        $langfuseSk
# 3 个 Keycloak client secret 待 Phase 4 生成，先置空
Set-EnvLine "KEYCLOAK_CLIENT_SECRET" ""
Set-EnvLine "GRAFANA_OAUTH_CLIENT_SECRET" ""
Set-EnvLine "LANGFUSE_KEYCLOAK_CLIENT_SECRET" ""

# 模型 key
if ($DeepSeekKey) { Set-EnvLine "DEEPSEEK_API_KEY" $DeepSeekKey }
if ($OpenAIKey)   { Set-EnvLine "OPENAI_API_KEY"   $OpenAIKey }
if ($AnthropicKey){ Set-EnvLine "ANTHROPIC_API_KEY" $AnthropicKey }

$envFile = Join-Path $RootDir ".env"
Set-Content -LiteralPath $envFile -Value $envContent -NoNewline -Encoding UTF8
Write-Ok ".env 已生成（统一管理员密码: $AdminPassword）"

# ════════════════════════════════════════════
# Phase 3: 起 compose
# ════════════════════════════════════════════
Write-Step "Phase 3: 起 Docker compose"
docker network create ai-platform 2>$null | Out-Null
Push-Location $RootDir
docker compose up -d 2>&1 | Out-Null
Pop-Location
Write-Ok "compose 已启动"

# 等 Keycloak 就绪
Write-Step "等待 Keycloak 就绪..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$KeycloakUrl/realms/master" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 5
}
if (-not $ready) { Write-Fail "Keycloak 60s 内未就绪，请检查容器状态"; exit 1 }
Write-Ok "Keycloak 已就绪"

# ════════════════════════════════════════════
# Phase 4: Keycloak realm 初始化
# ════════════════════════════════════════════
if ($SkipKeycloak) {
    Write-Warn "跳过 Keycloak realm 初始化（-SkipKeycloak）"
} else {
    Write-Step "Phase 4: Keycloak realm 初始化（realm + 4 client + role + LDAP）"
    $kcArgs = @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
        (Join-Path $RootDir "scripts\keycloak-realm-init.ps1"),
        "-KeycloakUrl", $KeycloakUrl,
        "-AdminUser", "ai_all_in_one_admin",
        "-AdminPassword", $AdminPassword,
        "-ServerIp", $ServerIp,
        "-OutputJson", $SecretsFile
    )
    if ($LdapBindDn)     { $kcArgs += @("-LdapBindDn", $LdapBindDn) }
    if ($LdapBindPassword){ $kcArgs += @("-LdapBindPassword", $LdapBindPassword) }
    if ($LdapUsersDn)    { $kcArgs += @("-LdapUsersDn", $LdapUsersDn) }
    if ($LdapConnectionUrl){ $kcArgs += @("-LdapConnectionUrl", $LdapConnectionUrl) }

    & powershell.exe @kcArgs
    if ($LASTEXITCODE -ne 0) { Write-Fail "Keycloak 初始化失败"; }
    else {
        Write-Ok "Keycloak realm 初始化完成"
        # 回填 client secret 到 .env
        if (Test-Path -LiteralPath $SecretsFile) {
            $secs = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
            $env2 = Get-Content -LiteralPath $envFile -Raw
            function Set-FileLine([string]$key, [string]$value) {
                $script:env2 = [regex]::Replace($script:env2, '(?m)^' + [regex]::Escape($key) + '=.*$',
                    [System.Text.RegularExpressions.MatchEvaluator]{ param($m) return ($key + '=' + $value) })
            }
            $ap = $secs.'AI-all-in-one-admin-portal'; if ($ap) { Set-FileLine "KEYCLOAK_CLIENT_SECRET" $ap }
            if ($secs.grafana)  { Set-FileLine "GRAFANA_OAUTH_CLIENT_SECRET" $secs.grafana }
            if ($secs.langfuse) { Set-FileLine "LANGFUSE_KEYCLOAK_CLIENT_SECRET" $secs.langfuse }
            Set-Content -LiteralPath $envFile -Value $env2 -NoNewline -Encoding UTF8
            Write-Ok "已回填 3 个 client secret 到 .env"
        }
        # 用新 secret 重建依赖 SSO 的容器
        Push-Location $RootDir
        docker compose up -d admin-portal grafana langfuse langfuse-worker 2>&1 | Out-Null
        Pop-Location
        Write-Ok "已重建 admin-portal / grafana / langfuse"
    }
}

# ════════════════════════════════════════════
# Phase 5: 配 NewAPI 渠道（best-effort）
# ════════════════════════════════════════════
if ($SkipNewApi) {
    Write-Warn "跳过 NewAPI 渠道配置（-SkipNewApi）"
} else {
    Write-Step "Phase 5: 配 NewAPI 渠道（指向 LiteLLM）"
    $newapiUrl = "http://127.0.0.1:3000"
    $naUser = "root"; $naPass = "123456"   # NewAPI 首次启动默认管理员
    # 等 NewAPI 就绪
    for ($i = 0; $i -lt 30; $i++) {
        try { $r = Invoke-WebRequest -Uri "$newapiUrl/api/status" -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { break } } catch { }
        Start-Sleep -Seconds 4
    }
    try {
        $loginBody = @{ username = $naUser; password = $naPass } | ConvertTo-Json
        $login = Invoke-RestMethod -Method Post -Uri "$newapiUrl/api/user/login" -ContentType "application/json" -Body $loginBody
        $naToken = $login.data.access_token
        if (-not $naToken) { throw "登录返回无 token" }
        Write-Ok "NewAPI 管理员登录成功"

        # 读 LiteLLM master key 用于渠道
        $llmKey = (Select-String -Path $envFile -Pattern '^LITELLM_MASTER_KEY=' | Select-Object -First 1).Line -replace '^LITELLM_MASTER_KEY=', ''
        $channelBody = @{
            name = "LiteLLM"
            type = 1
            key = $llmKey
            base_url = "http://litellm:4000/v1"
            models = "deepseek-chat"
            groups = @("default")
        } | ConvertTo-Json -Depth 5
        Invoke-RestMethod -Method Post -Uri "$newapiUrl/api/channel/" -Headers @{ Authorization = "Bearer $naToken" } -ContentType "application/json" -Body $channelBody | Out-Null
        Write-Ok "NewAPI 渠道 LiteLLM 已创建"
    } catch {
        Write-Warn "NewAPI 渠道自动配置失败：$($_.Exception.Message)"
        Write-Warn "请手动：打开 http://${ServerIp}:3000 登录 → 渠道 → 新建渠道（类型 OpenAI，地址 http://litellm:4000/v1，密钥用 .env 的 LITELLM_MASTER_KEY）"
    }
}

# ════════════════════════════════════════════
# Phase 6: 备份计划任务 + Langfuse SSO 修复说明
# ════════════════════════════════════════════
Write-Step "Phase 6: 注册备份计划任务 + Langfuse SSO 修复"
$backupScript = Join-Path $RootDir "scripts\backup.ps1"
try {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`""
    $trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
    Register-ScheduledTask -TaskName "AI-Platform-Backup" -Action $action -Trigger $trigger -Description "AI 平台每日备份" -Force | Out-Null
    Write-Ok "备份计划任务已注册（每日 02:00）"
} catch {
    Write-Warn "注册计划任务失败（可能已存在或无权限）：$($_.Exception.Message)"
}

Write-Host ""
Write-Host "================= 部署完成 =================" -ForegroundColor Cyan
Write-Host "统一管理员账号：ai_all_in_one_admin"
Write-Host "统一管理员密码：$AdminPassword"
Write-Host "AI 管理中心：http://${ServerIp}:10086"
Write-Host ""
Write-Host "后续人工步骤：" -ForegroundColor Yellow
Write-Host " 1. 首次用 ai_all_in_one_admin 登录 Keycloak/AI 管理中心（触发 AD 用户导入）"
Write-Host " 2. 修 Langfuse SSO 账号绑定（否则 Langfuse 看不到数据）：" -ForegroundColor Yellow
Write-Host '    docker exec langfuse-postgres psql -U langfuse -d langfuse -c "INSERT INTO organization_memberships (id, org_id, user_id, role) SELECT gen_random_uuid()::text, ''ai-all-in-one'', id, ''ADMIN'' FROM users WHERE email=''ai_all_in_one_admin@你的域'' ON CONFLICT (org_id, user_id) DO UPDATE SET role=''ADMIN'';"'
if (-not $SkipDify) {
    Write-Host " 3. 部署 Dify：cd $RootDir\dify; copy .env.example .env; docker compose up -d"
}
Write-Host " 4. 按 windows-deploy-guide-v2.html 第 6 章完成 Ghost/Gitea/Dify 首次向导"
