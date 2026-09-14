# ============================================================
# Keycloak Realm 初始化脚本（替代手工点 UI）
# 路径: <部署目录>\scripts\keycloak-realm-init.ps1
#
# 一条命令创建：
#   - realm "enterprise-ai"
#   - 4 个 OIDC confidential client：AI-all-in-one-admin-portal / grafana / langfuse / newapi
#   - realm role "ai-platform-admin"
#   - LDAP 联邦（对接公司 AD，vendor=ad）
#   - （尽力）把 ai_all_in_one_admin 用户分配 ai-platform-admin 角色
#
# 用法示例：
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\keycloak-realm-init.ps1 `
#     -KeycloakUrl "http://127.0.0.1:9090" `
#     -AdminPassword "你的Keycloak管理员密码" `
#     -ServerIp "192.168.1.100" `
#     -LdapBindDn "CN=ai all in one admin,CN=Users,DC=chxia,DC=lab" `
#     -LdapBindPassword "AD账号密码" `
#     -LdapUsersDn "CN=Users,DC=chxia,DC=lab" `
#     -LdapConnectionUrl "ldap://host.docker.internal:389"
# ============================================================

param(
    [string]$KeycloakUrl = "http://127.0.0.1:9090",
    [string]$AdminUser = "ai_all_in_one_admin",        # Keycloak master realm 管理员（对应 .env 的 KEYCLOAK_ADMIN）
    [string]$AdminPassword = "",                     # Keycloak master realm 管理员密码
    [string]$ServerIp = "192.168.31.117",            # 服务器内网 IP
    [string]$Realm = "enterprise-ai",
    [string]$AdminUsername = "ai_all_in_one_admin",  # 统一管理员用户名
    # LDAP（AD）参数
    [string]$LdapBindDn = "",
    [string]$LdapBindPassword = "",
    [string]$LdapUsersDn = "",
    [string]$LdapConnectionUrl = "ldap://host.docker.internal:389",
    # 可选：是否创建本地管理员兜底（AD 未就绪时仍能登录）
    [switch]$CreateLocalAdmin,
    # 可选：把 client secret 写到 JSON 文件（供 bootstrap.ps1 读取）
    [string]$OutputJson = ""
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "[*] $msg" }
function Write-Ok($msg) { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

function Invoke-Kc($Method, $Path, $Body, $Token) {
    $headers = @{ Authorization = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = "$KeycloakUrl$Path"; Headers = $headers }
    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = ($Body | ConvertTo-Json -Depth 30)
    }
    return Invoke-RestMethod @params
}

# ---- 0. 校验必填 ----
if (-not $AdminPassword) { Write-Host "[FAIL] 必须提供 -AdminPassword（Keycloak 管理员密码）"; exit 1 }
if (-not $LdapBindDn -and -not $CreateLocalAdmin) {
    Write-Warn "未提供 LDAP 参数，将跳过 LDAP 联邦创建（仅搭 realm/clients/role）。"
}

# ---- 1. 获取 master realm 管理员 token ----
Write-Step "获取 Keycloak master 管理员 token"
$tokenBody = @{ client_id = 'admin-cli'; username = $AdminUser; password = $AdminPassword; grant_type = 'password' }
$token = (Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" -Body $tokenBody).access_token
Write-Ok "token 获取成功"

# ---- 2. 创建 realm ----
Write-Step "创建 realm: $Realm"
$realmExists = $false
try { Invoke-Kc GET "/admin/realms/$Realm" $null $token | Out-Null; $realmExists = $true } catch { $realmExists = $false }
if ($realmExists) {
    Write-Warn "realm 已存在，跳过"
} else {
    Invoke-Kc POST "/admin/realms" @{ realm = $Realm; enabled = $true; displayName = "Enterprise AI" } $token | Out-Null
    Write-Ok "realm 已创建"
}
# 取 realm 的真实 id（UUID，供 LDAP 组件的 parentId 用）
$realmId = (Invoke-Kc GET "/admin/realms/$Realm" $null $token).id
Write-Ok "realm id = $realmId"

# ---- 3. 创建 realm role: ai-platform-admin ----
Write-Step "创建角色 ai-platform-admin"
try {
    Invoke-Kc GET "/admin/realms/$Realm/roles/ai-platform-admin" $null $token | Out-Null
    Write-Warn "角色已存在，跳过"
} catch {
    Invoke-Kc POST "/admin/realms/$Realm/roles" @{ name = 'ai-platform-admin'; description = '跨平台统一管理员角色' } $token | Out-Null
    Write-Ok "角色已创建"
}

# ---- 4. 创建 4 个 OIDC client ----
Write-Step "创建 OIDC clients"
$clients = @(
    @{
        id = 'AI-all-in-one-admin-portal'
        redirect = @("http://${ServerIp}:10086/*", "http://127.0.0.1:10086/*")
        origins  = @("http://${ServerIp}:10086", "http://127.0.0.1:10086")
    },
    @{
        id = 'grafana'
        redirect = @("http://${ServerIp}:3030/login/generic_oauth")
        origins  = @("http://${ServerIp}:3030")
    },
    @{
        id = 'langfuse'
        redirect = @("http://${ServerIp}:3010/api/auth/callback/keycloak")
        origins  = @("http://${ServerIp}:3010")
    },
    @{
        id = 'newapi'
        redirect = @("http://${ServerIp}:3000/*", "http://127.0.0.1:3000/*")
        origins  = @("http://${ServerIp}:3000", "http://127.0.0.1:3000")
    }
)

$secrets = @{}
foreach ($c in $clients) {
    $clientId = $c.id
    Write-Step "  client: $clientId"
    # 是否已存在
    $existing = @(Invoke-Kc GET "/admin/realms/$Realm/clients?clientId=$clientId" $null $token)
    if ($existing.Count -gt 0) {
        Write-Warn "已存在，跳过创建（读取现有 secret）"
        $cid = $existing[0].id
    } else {
        $body = @{
            clientId = $clientId
            protocol = 'openid-connect'
            publicClient = $false
            standardFlowEnabled = $true
            directAccessGrantsEnabled = $true
            serviceAccountsEnabled = $false
            clientAuthenticatorType = 'client-secret'
            redirectUris = $c.redirect
            webOrigins = $c.origins
        }
        $created = Invoke-Kc POST "/admin/realms/$Realm/clients" $body $token
        $cid = $created.id
    }
    # 读取 secret
    $sec = Invoke-Kc GET "/admin/realms/$Realm/clients/$cid/client-secret" $null $token
    $secrets[$clientId] = $sec.value
    Write-Ok "secret: $($sec.value)"
}

# ---- 5. 创建 LDAP 联邦 ----
if ($LdapBindDn -and $LdapUsersDn) {
    Write-Step "创建 LDAP 联邦（Company AD）"
    $ldapBody = @{
        name = "Company AD"
        providerId = "ldap"
        providerType = "org.keycloak.storage.UserStorageProvider"
        parentId = $realmId
        config = @{
            enabled = @("true")
            vendor = @("ad")
            connectionUrl = @($LdapConnectionUrl)
            bindDn = @($LdapBindDn)
            bindCredential = @($LdapBindPassword)
            usersDn = @($LdapUsersDn)
            usernameLDAPAttribute = @("sAMAccountName")
            rdnLDAPAttribute = @("cn")
            uuidLDAPAttribute = @("objectGUID")
            userObjectClasses = @("person, organizationalPerson, user")
            editMode = @("READ_ONLY")
            importEnabled = @("true")
            pagination = @("true")
            syncRegistrations = @("true")
            trustEmail = @("true")
            searchScope = @("2")
            referral = @("ignore")
            authType = @("simple")
        }
    }
    Invoke-Kc POST "/admin/realms/$Realm/components" $ldapBody $token | Out-Null
    Write-Ok "LDAP 联邦已创建"
}

# ---- 6. 分配 ai-platform-admin 角色给统一管理员（尽力）----
Write-Step "分配 ai-platform-admin 角色给 $AdminUsername（尽力，AD 未同步则跳过）"
try {
    $users = @(Invoke-Kc GET "/admin/realms/$Realm/users?username=$AdminUsername" $null $token)
    if ($users.Count -gt 0) {
        $uid = $users[0].id
        $role = Invoke-Kc GET "/admin/realms/$Realm/roles/ai-platform-admin" $null $token
        Invoke-Kc POST "/admin/realms/$Realm/users/$uid/role-mappings/realm" @($role) $token | Out-Null
        Write-Ok "角色已分配给 $AdminUsername"
    } else {
        Write-Warn "用户 $AdminUsername 不存在（LDAP 未同步），跳过；登录一次后会随 LDAP 自动导入"
    }
} catch { Write-Warn "分配角色失败：$($_.Exception.Message)" }

# ---- 7. 可选：本地兜底管理员 ----
if ($CreateLocalAdmin) {
    Write-Step "创建本地兜底管理员（可选）"
    # 用传入的 master 密码作为本地账号密码（可在 .env 里覆盖）
    $body = @{
        username = $AdminUsername
        enabled = $true
        email = "$AdminUsername@company.com"
        credentials = @(@{ type = 'password'; value = $AdminPassword; temporary = $false })
    }
    try {
        Invoke-Kc POST "/admin/realms/$Realm/users" $body $token | Out-Null
        Write-Ok "本地管理员已创建"
    } catch { Write-Warn "创建本地管理员失败（可能已存在）：$($_.Exception.Message)" }
}

Write-Host ""
Write-Host "================= 完成 =================" -ForegroundColor Cyan
Write-Host "请把以下 client secret 填入 .env：" -ForegroundColor Cyan
foreach ($k in $secrets.Keys) {
    Write-Host ("  " + $k + " = " + $secrets[$k]) -ForegroundColor White
}
Write-Host "映射关系：" -ForegroundColor Cyan
Write-Host "  AI-all-in-one-admin-portal  -> KEYCLOAK_CLIENT_SECRET"
Write-Host "  grafana                      -> GRAFANA_OAUTH_CLIENT_SECRET"
Write-Host "  langfuse                     -> LANGFUSE_KEYCLOAK_CLIENT_SECRET"
Write-Host "  newapi                       -> NewAPI 后台 OIDC 配置"

# 写 JSON 供 bootstrap 读取
if ($OutputJson) {
    try {
        $secrets | ConvertTo-Json | Set-Content -Path $OutputJson -Encoding UTF8
        Write-Host "已写入 secret 到 $OutputJson" -ForegroundColor Cyan
    } catch { Write-Warn "写 $OutputJson 失败：$($_.Exception.Message)" }
}
