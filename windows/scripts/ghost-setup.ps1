# ============================================================
#  Ghost 管理员自动化创建（替代浏览器 setup 向导）
# ============================================================
#  用法：
#    .\ghost-setup.ps1                                   # 从 .env 读邮箱/密码，默认 http://127.0.0.1:8090
#    .\ghost-setup.ps1 -GhostUrl "http://192.168.1.10:8090"   # 指定 Ghost 地址
#    .\ghost-setup.ps1 -Email "x@company.com" -Password "..."  # 显式传参
#
#  原理：Ghost 首次启动未初始化时，调用 setup API 一次性创建管理员，
#        效果等价于在浏览器里走完 /ghost/ 的 setup 向导。
# ============================================================
param(
    [string]$GhostUrl = "http://127.0.0.1:8090",
    [string]$Email = "",
    [string]$Password = "",
    [string]$SiteTitle = "AI All In One Hub",
    [string]$Name = "ai all in one admin"
)

$ErrorActionPreference = "Stop"
$DeployDir = Split-Path -Parent $PSScriptRoot   # 脚本上一级 = 部署目录

function Get-EnvValue($key, $envFile) {
    if (-not (Test-Path -LiteralPath $envFile)) { return $null }
    $line = (Select-String -Path $envFile -Pattern "^$key=" | Select-Object -First 1).Line
    if ($line) { return $line.Substring($key.Length + 1) }
    return $null
}

# 从 .env 补参数
$envFile = Join-Path $DeployDir ".env"
if (-not $Email)    { $Email    = Get-EnvValue "GHOST_ADMIN_EMAIL" $envFile }
if (-not $Password) { $Password = Get-EnvValue "ADMIN_PASSWORD" $envFile }
if (-not $Email -or -not $Password) {
    Write-Host "[FAIL] 缺少邮箱/密码（请传 -Email/-Password，或确保 .env 有 GHOST_ADMIN_EMAIL / ADMIN_PASSWORD）" -ForegroundColor Red
    exit 1
}

# 1. 检查是否已初始化
try {
    $check = Invoke-RestMethod -Uri "$GhostUrl/ghost/api/admin/authentication/setup" -Method GET -TimeoutSec 10
    $status = $check.setup[0].status
    if ($status) {
        Write-Host "[跳过] Ghost 已完成初始化（管理员已存在）" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "[FAIL] 无法访问 Ghost（$GhostUrl）：$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 创建管理员
Write-Host "创建 Ghost 管理员：$Email" -ForegroundColor Cyan
$body = @{
    setup = @(@{
        name        = $Name
        email       = $Email
        password    = $Password
        blogTitle   = $SiteTitle
        description = ""
    })
} | ConvertTo-Json -Depth 5

try {
    $r = Invoke-RestMethod -Uri "$GhostUrl/ghost/api/admin/authentication/setup" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "[OK] Ghost 管理员已创建：$Email（站点标题：$SiteTitle）" -ForegroundColor Green
    Write-Host "      后续可在 AI 管理中心点「Ghost 后台」免登录进入（自动算验证码）。" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] 创建失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      提示：若返回 'setup already complete'，说明已有管理员，忽略即可。" -ForegroundColor Yellow
    exit 1
}
