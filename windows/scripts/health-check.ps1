# ============================================================
# AI 平台健康检查脚本（增强版）
# 路径: C:\AIAllInOne\windows\scripts\health-check.ps1
# 用法: .\health-check.ps1
#       或加入 Windows 计划任务实现开机自检
# 输出: 同时输出到控制台和结果文件 health_check_<时间戳>.log
#       （时间戳 = 年月日时分秒，每次运行生成独立报告）
#
# 检查项（9 个 Stage）:
#   1. Docker daemon（含等待就绪，适配开机自检）
#   2. 容器启动状态（全部关键组件）
#   3. HTTP 端点可达性
#   4. 内部健康（LiteLLM 模型注册 / Dify / Redis / MySQL / MCP）
#   5. LLM 全链路 —— 以 DSH Desktop 和 Dify 名义各发一个真实请求
#   6. NewAPI AD 账号认证链路 + 管理员登录（Keycloak SSO）
#   7. MCP Gateway + Skill（tools/list + tools/call）
#   8. DSH Desktop / Dify 登录前置条件
#   9. 磁盘空间
#
# 凭据从上级目录（windows/.env）读取，脚本本身不硬编码任何密码/密钥。
# ============================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ---- 配置（当前唯一启用的模型）----
$NewApiAddr = "http://127.0.0.1:3000"   # NewAPI（API 网关）
$KcAddr     = "http://127.0.0.1:9090"   # Keycloak（SSO）
$McpAddr    = "http://127.0.0.1:3100"   # MCP Gateway
$Model      = "deepseek-chat"           # LiteLLM 当前唯一启用的模型

$PASS = 0; $FAIL = 0; $WARN = 0; $ALL_OK = $true
$TimeStamp = Get-Date -Format "yyyy_MM_dd_HH_mm_ss"
$LogFile = "$PSScriptRoot\health_check_$TimeStamp.log"
$Lines = [System.Collections.ArrayList]::new()

# ---- 从 .env 读取凭据（脚本不硬编码密码）----
function Get-EnvValue($key) {
    $f = "$PSScriptRoot\..\.env"
    if (-not (Test-Path $f)) { return "" }
    $m = Select-String -Path $f -Pattern "^$key=" | Select-Object -First 1
    if ($m) { return ($m.Line -replace "^$key=", "").Trim() }
    return ""
}
$KcAdmin     = Get-EnvValue "KEYCLOAK_ADMIN"
$KcPass      = Get-EnvValue "KEYCLOAK_ADMIN_PASSWORD"
$DbPass      = Get-EnvValue "NEWAPI_DB_PASSWORD"
$NaAdminUser = Get-EnvValue "NEWAPI_ADMIN_USERNAME"
$NaAdminPass = Get-EnvValue "NEWAPI_ADMIN_PASSWORD"
$LiteLLMKey  = Get-EnvValue "LITELLM_MASTER_KEY"

# ---- 输出辅助 ----
function Out-Line($icon, $color, $msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "  [$icon] $msg"
    [void]$Lines.Add("$ts $line")
    if ($Host.UI) { Write-Host "$ts $line" -ForegroundColor $color }
}
function P($msg) { $script:PASS++; Out-Line "PASS" Green $msg }
function F($msg) { $script:FAIL++; $script:ALL_OK = $false; Out-Line "FAIL" Red $msg }
function W($msg) { $script:WARN++; Out-Line "WARN" Yellow $msg }
function Head($t) { [void]$Lines.Add(""); [void]$Lines.Add("-- $t --") }

[void]$Lines.Add("")
[void]$Lines.Add("  AI Platform Health Check (Enhanced)  -  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$Lines.Add("")

# ===== Stage 1: Docker Daemon（等待就绪，适配开机自检）=====
Head "Stage 1: Docker Daemon"
$dockerReady = $false
for ($i = 1; $i -le 12; $i++) {
    docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
    if ($i -lt 12) { W "Docker 未就绪，10 秒后重试 ($i/12)"; Start-Sleep -Seconds 10 }
}
if ($dockerReady) { P "Docker daemon running" }
else {
    F "Docker daemon NOT running（等待 2 分钟后仍不可用，请先启动 Docker Desktop）"
    [System.IO.File]::WriteAllLines($LogFile, $Lines, [System.Text.UTF8Encoding]::new($false))
    exit 1
}

# ===== Stage 2: Container Status =====
Head "Stage 2: Container Status"
$raw = docker ps -a --format "{{.Names}}|{{.Status}}" 2>&1
$cs = @{}
foreach ($line in $raw) { $p = $line -split '\|', 2; if ($p.Count -eq 2) { $cs[$p[0]] = $p[1] } }

$expected = @(
    # 核心平台
    @{n="keycloak";e="Up"}, @{n="new-api";e="Up"}, @{n="new-api-db";e="Up"}, @{n="new-api-redis";e="Up"},
    @{n="litellm";e="Up"}, @{n="litellm-redis";e="Up"}, @{n="mcp-gateway";e="Up"},
    @{n="ghost";e="Up"}, @{n="gitea";e="Up"}, @{n="gitea-runner";e="Up"},
    @{n="admin-portal";e="Up"}, @{n="update-server";e="Up"},
    # Dify（独立 compose）
    @{n="docker-api-1";e="Up"}, @{n="docker-worker-1";e="Up"}, @{n="docker-worker_beat-1";e="Up"},
    @{n="docker-api_websocket-1";e="Up"}, @{n="docker-web-1";e="Up"}, @{n="docker-nginx-1";e="Up"},
    @{n="docker-plugin_daemon-1";e="Up"}, @{n="docker-agent_backend-1";e="Up"},
    @{n="docker-sandbox-1";e="Up"}, @{n="docker-local_sandbox-1";e="Up"},
    @{n="docker-db_postgres-1";e="Up"}, @{n="docker-redis-1";e="Up"}, @{n="docker-weaviate-1";e="Up"},
    @{n="docker-ssrf_proxy-1";e="Up"}, @{n="docker-agent_ssrf_proxy-1";e="Up"},
    @{n="docker-init_permissions-1";e="Exited"}
)

foreach ($item in $expected) {
    $n = $item.n; $e = $item.e; $a = $cs[$n]
    if (-not $a) { F "$n  -  NOT FOUND"; continue }
    if ($n -eq "docker-init_permissions-1") {
        if ($a -match "Exited") { P "$n  -  Exited (one-shot init task, normal)" } else { F "$n  -  $a" }
        continue
    }
    if ($a -match "Restarting") { F "$n  -  $a (RESTARTING!)" }
    elseif ($a -match "^$e") { P "$n  -  $a" }
    elseif ($a -match "Exited") {
        $ec = docker inspect $n --format '{{.State.ExitCode}}' 2>&1
        F "$n  -  $a (exit code: $ec)"
    }
    else { W "$n  -  $a (expected: $e)" }
}

# ===== Stage 3: HTTP Endpoints =====
Head "Stage 3: HTTP Endpoints (curl 127.0.0.1)"
$http = @(
    @{t="Keycloak";u="$KcAddr/"},
    @{t="NewAPI";u="$NewApiAddr/"},
    @{t="Gitea";u="http://127.0.0.1:3002/"},
    @{t="Ghost";u="http://127.0.0.1:8090/"},
    @{t="Admin Portal";u="http://127.0.0.1:10086/"},
    @{t="Update Server";u="http://127.0.0.1:8091/"},
    @{t="Dify (Nginx:80)";u="http://127.0.0.1/"},
    @{t="MCP Gateway";u="$McpAddr/health"}
)
foreach ($h in $http) {
    try {
        $code = (curl.exe -sS -o NUL -w "%{http_code}" --max-time 5 $h.u 2>&1) -as [int]
        if ($code -ge 200 -and $code -lt 500) { P "$($h.t) ($($h.u)) HTTP $code" }
        elseif ($code -gt 0) { W "$($h.t) ($($h.u)) HTTP $code" }
        else { F "$($h.t) ($($h.u)) no response" }
    } catch { F "$($h.t) ($($h.u)) connection failed" }
}

# ===== Stage 4: Internal Health =====
Head "Stage 4: Internal Health (docker exec)"

# LiteLLM readiness（容器内）
$lr = docker exec litellm python3 -c "import urllib.request; r=urllib.request.urlopen('http://127.0.0.1:4000/health/readiness',timeout=5); print('OK:'+str(r.status))" 2>&1
if ($lr -match "OK:200") { P "LiteLLM /health/readiness  -  OK" }
else { F "LiteLLM /health/readiness  -  $lr" }

# litellm-redis（缓存 Redis）
$rp = docker exec litellm-redis redis-cli PING 2>&1
if ($rp -match "PONG") { P "litellm-redis PING  -  PONG" }
else { F "litellm-redis PING  -  $rp" }

# LiteLLM 模型注册（deepseek-chat，需 master key 认证）
if ($LiteLLMKey) {
    $models = docker exec litellm python3 -c "import urllib.request,json; r=urllib.request.Request('http://127.0.0.1:4000/v1/models', headers={'Authorization':'Bearer $LiteLLMKey'}); d=json.load(urllib.request.urlopen(r,timeout=5)); print(','.join([m['id'] for m in d.get('data',[])]))" 2>&1
    if ($models -match 'deepseek-chat') { P "LiteLLM 模型已注册  -  deepseek-chat" }
    else { F "LiteLLM 模型注册异常  -  $($models -join '')" }
} else { W "未读取到 LITELLM_MASTER_KEY，跳过模型检查" }

# Dify API /health
$da = docker exec docker-api-1 curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:5001/health 2>&1
if ($da -match "^[23]\d\d") { P "Dify API :5001/health  -  HTTP $da" }
else { F "Dify API :5001/health  -  $da" }

# 容器 healthcheck
$hc = @{
    "new-api-db"="new-api-db (MySQL)";
    "docker-db_postgres-1"="Dify PostgreSQL";
    "docker-redis-1"="Dify Redis";
    "docker-sandbox-1"="Dify Sandbox"
}
foreach ($cn in $hc.Keys) {
    $label = $hc[$cn]
    $h = docker inspect $cn --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-check{{end}}' 2>&1
    if ($h -eq "healthy") { P "$label  -  $h" }
    elseif ($h -eq "no-check") { W "$label  -  no healthcheck defined" }
    else { F "$label  -  $h" }
}

# ===== Stage 5: LLM 全链路（DSH Desktop / Dify 名义）=====
Head "Stage 5: LLM 全链路（NewAPI -> LiteLLM -> DeepSeek）"

# NewAPI 渠道状态（LLM 链路前置）
if ($DbPass) {
    $ch = (docker exec new-api-db mysql -uroot "-p$DbPass" new-api -N -e "SELECT name FROM channels WHERE status=1 LIMIT 1" 2>$null).Trim()
    if ($ch) { P "NewAPI 启用渠道  -  $ch" } else { F "NewAPI 无启用渠道（LLM 链路会失败）" }
}

# 从数据库读取两把 key（避免硬编码密钥）
function Get-TokenKey($name) {
    $sql = "SELECT ``key`` FROM tokens WHERE name='$name' AND status=1"
    $k = docker exec new-api-db mysql -uroot "-p$DbPass" new-api -N -e $sql 2>$null
    return ($k -join '').Trim()
}
$dshKey = Get-TokenKey "dsh-key"
$difyKey     = Get-TokenKey "dify-key"

function Test-LLM($label, $key) {
    if (-not $key) { F "$label - 未获取到 API key（tokens 表）"; return }
    $body = '{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}'
    $resp = curl.exe -sS -X POST "$NewApiAddr/v1/chat/completions" -H "Authorization: Bearer $key" -H "Content-Type: application/json" -d $body --max-time 60 2>&1
    if ($resp -match '"content":"([^"]*)"') {
        $c = $Matches[1]
        P "$label - LLM 响应成功（$($c.Length) 字符）"
    } else {
        $s = ($resp -join ' ')
        if ($s.Length -gt 150) { $s = $s.Substring(0, 150) }
        F "$label - 请求失败: $s"
    }
}

Test-LLM "DSH Desktop 名义 (dsh-key)" $dshKey
Test-LLM "Dify 名义 (dify-key)"       $difyKey

# ===== Stage 6: NewAPI AD 账号认证（Keycloak SSO）=====
Head "Stage 6: NewAPI AD 账号认证链路（Keycloak SSO）"

# 1) Keycloak well-known（OIDC 发现）
$wk = curl.exe -sS -o NUL -w "%{http_code}" "$KcAddr/realms/enterprise-ai/.well-known/openid-configuration" --max-time 8 2>&1
if ($wk -match "^2\d\d") { P "Keycloak enterprise-ai well-known  -  HTTP $wk" }
else { F "Keycloak enterprise-ai well-known  -  $wk" }

# 2) Keycloak admin 登录 + 查 AD 用户
$kcToken = curl.exe -sS -X POST "$KcAddr/realms/master/protocol/openid-connect/token" -d "client_id=admin-cli&username=$KcAdmin&password=$KcPass&grant_type=password" --max-time 10 2>&1
$accessToken = ""
if ($kcToken -match '"access_token":"([^"]+)"') { $accessToken = $Matches[1] }

if ($accessToken) {
    $usersJson = curl.exe -sS "$KcAddr/admin/realms/enterprise-ai/users?max=200" -H "Authorization: Bearer $accessToken" --max-time 10 2>&1
    $userCount = ([regex]::Matches(($usersJson -join ''), '"username":"')).Count
    if ($usersJson -match '"username":"aitest1"') { P "AD 用户 aitest1 已同步到 Keycloak（共 $userCount 用户）" }
    else { W "未找到 aitest1（共 $userCount 用户，AD 同步可能未完成）" }
} else {
    F "Keycloak admin 登录失败（检查 .env KEYCLOAK_ADMIN 凭据）"
}

# 3) NewAPI OIDC 配置（数据库）
if ($DbPass) {
    $oidcAuth = (docker exec new-api-db mysql -uroot "-p$DbPass" new-api -N -e "SELECT authorization_endpoint FROM custom_oauth_providers WHERE slug='keycloak'" 2>$null).Trim()
    if ($oidcAuth -match "9090") { P "NewAPI OIDC 授权端点已配置  -  $oidcAuth" }
    else { F "NewAPI OIDC 配置异常  -  [$oidcAuth]" }
}

# 4) Keycloak OIDC clients 完整性（newapi + admin-portal）
if ($accessToken) {
    $clientsJson = curl.exe -sS "$KcAddr/admin/realms/enterprise-ai/clients" -H "Authorization: Bearer $accessToken" --max-time 10 2>&1
    if ($clientsJson -match '"clientId":"newapi"' -and $clientsJson -match 'AI-all-in-one-admin-portal') {
        P "Keycloak OIDC clients 完整（newapi + admin-portal）"
    } else {
        W "Keycloak OIDC clients 不完整"
    }
}

# 5) NewAPI 管理员登录验证（真实登录测试）
if ($NaAdminUser -and $NaAdminPass) {
    $loginBody = '{\"username\":\"' + $NaAdminUser + '\",\"password\":\"' + $NaAdminPass + '\"}'
    $loginResp = curl.exe -sS -X POST "$NewApiAddr/api/user/login" -H "Content-Type: application/json" -d $loginBody --max-time 10 2>&1
    if ($loginResp -match '"success":true') { P "NewAPI 管理员登录成功（$NaAdminUser）" }
    else { F "NewAPI 管理员登录失败  -  $($loginResp -join '')" }
}

# ===== Stage 7: MCP Gateway + Skill =====
Head "Stage 7: MCP Gateway + Skill"

# /health
$mh = curl.exe -sS "$McpAddr/health" --max-time 5 2>&1
if ($mh -match '"status":"ok"') { P "MCP Gateway /health  -  ok" }
else { F "MCP Gateway /health  -  $mh" }

# tools/list（内置工具）
$tl = curl.exe -sS -X POST "$McpAddr/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}' --max-time 8 2>&1
$toolCount = ([regex]::Matches(($tl -join ''), '"name":"platform_')).Count
if ($toolCount -ge 1) { P "MCP tools/list  -  内置工具 $toolCount 个" }
else { F "MCP tools/list  -  $($tl -join '')" }

# tools/call platform_echo（工具调用）
$ec = curl.exe -sS -X POST "$McpAddr/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"platform_echo\",\"arguments\":{\"text\":\"ping\"}}}' --max-time 8 2>&1
if ($ec -match 'result') { P "MCP tools/call platform_echo  -  调用成功" }
else { F "MCP tools/call platform_echo  -  $($ec -join '')" }

# 外部 Skill 聚合（mcp-servers.json）
$serversFile = "$PSScriptRoot\..\mcp-gateway\mcp-servers.json"
if (Test-Path $serversFile) {
    try {
        $sj = Get-Content $serversFile -Raw | ConvertFrom-Json
        $extCount = @($sj.servers).Count
        if ($extCount -ge 1) { P "外部 Skill/MCP Server 聚合  -  $extCount 个" }
        else { W "未配置外部 Skill（mcp-servers.json servers 为空，仅内置工具）" }
    } catch { W "mcp-servers.json 解析失败" }
} else { W "mcp-servers.json 不存在" }

# ===== Stage 8: DSH Desktop / Dify 登录前置条件 =====
Head "Stage 8: DSH Desktop / Dify 登录前置条件"

# DSH Desktop 登录 = 走 NewAPI OIDC（Keycloak SSO），检查 NewAPI 服务 + OIDC
$naStatus = curl.exe -sS -o NUL -w "%{http_code}" "$NewApiAddr/api/status" --max-time 8 2>&1
if ($naStatus -match "^[23]\d\d") { P "NewAPI /api/status  -  HTTP $naStatus（DSH Desktop 登录入口可用）" }
else { W "NewAPI /api/status  -  $naStatus" }

# Dify 登录：Dify 已初始化 + 管理员账号存在
$difyAccounts = (docker exec docker-db_postgres-1 psql -U postgres -d dify -t -A -c "SELECT COUNT(*) FROM accounts;" 2>$null).Trim()
if ($difyAccounts -match "^\d+$" -and [int]$difyAccounts -ge 1) { P "Dify 已初始化（accounts=$difyAccounts，登录可用）" }
else { W "Dify 未初始化或账号数异常  -  accounts=$difyAccounts" }

# ===== Stage 9: 磁盘空间 =====
Head "Stage 9: 磁盘空间"
$disk = Get-PSDrive -Name C
if ($disk) {
    $freeGB = [math]::Round($disk.Free / 1GB, 1)
    $usedGB = [math]::Round($disk.Used / 1GB, 1)
    if ($freeGB -gt 10) { P "系统盘 C: 剩余 $freeGB GB（已用 $usedGB GB）" }
    else { W "系统盘 C: 空间不足，剩余 $freeGB GB" }
}
$df = docker system df --format "{{.Type}}: {{.Size}}" 2>&1
if ($df) { P "Docker 磁盘占用  -  $($df -join '; ')" }

# ===== Summary =====
[void]$Lines.Add("")
[void]$Lines.Add("============================================")
$total = $PASS + $FAIL + $WARN
[void]$Lines.Add("  Total: $total   Pass: $PASS   Fail: $FAIL   Warn: $WARN")
[void]$Lines.Add("============================================")
[void]$Lines.Add("")

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if ($FAIL -eq 0) {
    [void]$Lines.Add("  ====== ALL CLEAR [$ts] ======")
} else {
    [void]$Lines.Add("  ====== $FAIL FAILURE(S) [$ts] ======")
    [void]$Lines.Add("  提示：若宿主机刚重启，部分服务可能仍在启动，请 2 分钟后重跑本脚本。")
    [void]$Lines.Add("  排查：docker logs <容器名> --tail 30")
}

# 写结果文件
[System.IO.File]::WriteAllLines($LogFile, $Lines, [System.Text.UTF8Encoding]::new($false))

# 回显到控制台
foreach ($l in $Lines) { Write-Host $l }

exit $(if ($FAIL -gt 0) { 1 } else { 0 })
