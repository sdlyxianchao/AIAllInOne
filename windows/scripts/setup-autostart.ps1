# ============================================================
# AI 平台 — 开机自启固化脚本
# 路径: <部署目录>\scripts\setup-autostart.ps1
# 用法: 以【管理员身份】运行一次
#       powershell -ExecutionPolicy Bypass -File .\scripts\setup-autostart.ps1
#
# 作用：固化 Windows 重启后的自动恢复链路，避免手动逐项拉起：
#   1. Docker Desktop 开机自启
#   2. iphlpsvc（IP Helper）服务自启 —— portproxy 端口转发依赖它
#   3. portproxy 规则重挂（容器 → AD 域控 389/636 LDAP 转发）
#   4. Hyper-V 域控 DC VM 开机自启
# ============================================================

param(
    [string]$DcVmName = "DC",                 # Hyper-V 域控 VM 名称（按实际改）
    [string]$DcIp      = "192.168.99.10"      # 域控 VM 的固定私网 IP
)

$ErrorActionPreference = "Continue"
function Step($m) { Write-Host "`n[Step] $m" -ForegroundColor Cyan }
function Ok($m)  { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [WARN] $m" -ForegroundColor Yellow }

# 是否管理员
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Host "⚠️ 请以管理员身份运行本脚本" -ForegroundColor Red; exit 1 }

# 1. Docker Desktop 开机自启（注册表 Run 键）
Step "1. Docker Desktop 开机自启"
$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerExe) {
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Docker Desktop" -Value "`"$dockerExe`""
    Ok "已设置 Docker Desktop 开机自启"
} else { Warn "未找到 Docker Desktop.exe，请确认安装路径" }

# 2. iphlpsvc 服务自启
Step "2. iphlpsvc（IP Helper）服务自启"
Set-Service iphlpsvc -StartupType Automatic
Start-Service iphlpsvc -ErrorAction SilentlyContinue
$svc = Get-Service iphlpsvc
if ($svc.Status -eq "Running") { Ok "iphlpsvc 已启动，开机自启已设置" }
else { Warn "iphlpsvc 未启动，请检查服务状态" }

# 3. portproxy 规则重挂（LDAP 389 / LDAPS 636）
Step "3. portproxy 规则重挂（-> $DcIp）"
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=389 2>$null
netsh interface portproxy add    v4tov4 listenaddress=0.0.0.0 listenport=389 connectaddress=$DcIp connectport=389
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=636 2>$null
netsh interface portproxy add    v4tov4 listenaddress=0.0.0.0 listenport=636 connectaddress=$DcIp connectport=636
Ok "portproxy 规则已重挂（389/636 -> $DcIp）"
Write-Host "  当前规则："
netsh interface portproxy show v4tov4

# 4. Hyper-V DC VM 开机自启
Step "4. Hyper-V 域控 VM 开机自启"
$vm = Get-VM -Name $DcVmName -ErrorAction SilentlyContinue
if ($vm) {
    Set-VM -Name $DcVmName -AutomaticStartAction Start -AutomaticStartDelay 30
    Ok "VM '$DcVmName' 已设为开机自启（延迟 30s）"
    # 若当前未运行则启动
    if ($vm.State -ne "Running") { Start-VM -Name $DcVmName; Ok "已启动 VM '$DcVmName'" }
} else { Warn "未找到 Hyper-V VM '$DcVmName'，请用 -DcVmName 指定实际名称" }

Write-Host ""
Write-Host "========== 开机自启固化完成 ==========" -ForegroundColor Green
Write-Host "重启后链路：Windows 开机 → Docker Desktop 自启 → 容器 restart:always 恢复 →"
Write-Host "           iphlpsvc 自启 + portproxy 生效 → 域控 VM 自启 → SSO/LDAP 可用。"
