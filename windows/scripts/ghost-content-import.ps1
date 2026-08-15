# ============================================================
#  Ghost 示例内容导入：把 ghost-content-seed/content.json 导入当前 Ghost
# ============================================================
#  用法：
#    .\ghost-content-import.ps1                                    # 默认 127.0.0.1，默认 seed
#    .\ghost-content-import.ps1 -ServerIp "192.168.1.10"           # 指定内网 IP
#    .\ghost-content-import.ps1 -SeedPath ".\translated.json"      # 用翻译后的 seed
#
#  说明：
#    seed 里的 <服务器IP> 占位符会被替换成 -ServerIp 传入的实际内网 IP。
#    翻译由部署 Agent 完成（先问用户语言，非中文则翻译 title/html 等字段后再调本脚本）。
# ============================================================
param(
    [string]$ServerIp = "127.0.0.1",
    [string]$SeedPath = ""
)

$ErrorActionPreference = "Stop"
$DeployDir = Split-Path -Parent $PSScriptRoot   # 脚本上一级 = 部署目录
if (-not $SeedPath) { $SeedPath = Join-Path $DeployDir "ghost-content-seed\content.json" }
$ImportJs = Join-Path $PSScriptRoot "ghost-content-import.js"
$Container = "ghost"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path -LiteralPath $SeedPath))   { Fail "seed 文件缺失: $SeedPath" }
if (-not (Test-Path -LiteralPath $ImportJs))   { Fail "导入脚本缺失: $ImportJs" }

Step "1/2 复制 seed + 导入脚本进容器"
docker cp "$SeedPath" "${Container}:/tmp/content.json"
if ($LASTEXITCODE -ne 0) { Fail "docker cp seed 失败" }
docker cp "$ImportJs" "${Container}:/tmp/ghost-content-import.js"
if ($LASTEXITCODE -ne 0) { Fail "docker cp 导入脚本失败" }
Ok "已复制"

Step "2/2 执行导入（服务器 IP: $ServerIp）"
$out = docker exec $Container node /tmp/ghost-content-import.js /tmp/content.json $ServerIp 2>&1
if ($LASTEXITCODE -ne 0) { Fail "导入失败: $out" }
Ok ($out | Select-Object -Last 1)

Write-Host "`n完成。打开 http://$ServerIp`:8090 查看首页（示例新闻已导入）。" -ForegroundColor Green
