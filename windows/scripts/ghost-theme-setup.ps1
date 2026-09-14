# ============================================================
#  Ghost 主题部署：把项目自带的 Corp Portal 主题装进 Ghost 并激活
# ============================================================
#  用法：
#    .\ghost-theme-setup.ps1                                     # 默认主题名 corp-portal-theme
#    .\ghost-theme-setup.ps1 -ThemeName "my-theme"               # 指定主题名
#
#  步骤：
#    1. 把 ghost-theme-corp-portal/ 复制进 Ghost 容器 themes 目录
#    2. 在 Ghost 容器内改 settings 表 active_theme（免 Admin API 认证）
#    3. 重启 Ghost 让新主题生效
# ============================================================
param(
    [string]$ThemeName = "corp-portal-theme"
)

$ErrorActionPreference = "Stop"
$DeployDir = Split-Path -Parent $PSScriptRoot   # 脚本上一级 = 部署目录
$ThemeSrc  = Join-Path $DeployDir "ghost-theme-corp-portal"
$ScriptSrc = Join-Path $PSScriptRoot "ghost-activate-theme.js"
$Container = "ghost"
$ThemeDst  = "/var/lib/ghost/content/themes/$ThemeName"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }

# 1. 复制主题目录
Step "1/3 复制主题到容器 themes 目录"
if (-not (Test-Path -LiteralPath $ThemeSrc)) { Fail "主题目录缺失: $ThemeSrc" }
docker cp "$ThemeSrc\." "${Container}:$ThemeDst/"
if ($LASTEXITCODE -ne 0) { Fail "docker cp 主题失败" }
Ok "主题已复制到 $ThemeDst"

# 2. 在容器内改 active_theme
Step "2/3 激活主题（改 settings.active_theme）"
if (-not (Test-Path -LiteralPath $ScriptSrc)) { Fail "激活脚本缺失: $ScriptSrc" }
docker cp "$ScriptSrc" "${Container}:/tmp/ghost-activate-theme.js"
if ($LASTEXITCODE -ne 0) { Fail "docker cp 激活脚本失败" }
$out = docker exec $Container node /tmp/ghost-activate-theme.js $ThemeName 2>&1
if ($LASTEXITCODE -ne 0) { Fail "激活失败: $out" }
Ok ($out | Select-Object -Last 1)

# 3. 重启 Ghost
Step "3/3 重启 Ghost"
docker restart $Container | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "docker restart ghost 失败" }
Ok "Ghost 已重启，主题 $ThemeName 已激活"

Write-Host "`n完成。打开 http://<服务器IP>:8090 查看主题效果。" -ForegroundColor Green
