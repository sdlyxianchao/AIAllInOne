# setup-hyperv-dc-network.ps1
# Hyper-V DC <--> Docker network: detect, fix, verify
# Run as Administrator
# Usage:
#   .\setup-hyperv-dc-network.ps1          (full run: detect + fix + verify)
#   .\setup-hyperv-dc-network.ps1 -Detect  (detect only, no changes)
#   .\setup-hyperv-dc-network.ps1 -Verbose (show detailed status)

param(
    [switch]$Detect,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$script:issues = 0
$script:ok = 0
$script:warn = 0
$script:fixed = 0

$switchName = "DockerDCBridge"
$vmName = "DC"
$hostIP = "192.168.99.1"
$dcIP = "192.168.99.10"
$subnet = "192.168.99.0/24"
$natName = "DockerDC-NAT"

function Dormant($color, $label, $text) {
    $c = switch ($color) { 'green' { 32 } 'red' { 31 } 'yellow' { 33 } default { 0 } }
    Write-Host "  [$label] $text" -ForegroundColor $c
}

function Title($text) {
    Write-Host "`n========== $text ==========" -ForegroundColor Cyan
}

# ========================================================
# PHASE 1: DETECT
# ========================================================
Title "PHASE 1: DETECT current state"

Dormant default "INFO" "switch=$switchName  vm=$vmName  net=$subnet  dc=$dcIP"

# 1a. VMSwitch
$sw = Get-VMSwitch -Name $switchName -ErrorAction SilentlyContinue
if ($sw) {
    Dormant green "OK" "VMSwitch [$switchName] exists, SwitchType=$($sw.SwitchType)"
    $script:ok++
} else {
    Dormant red "MISS" "VMSwitch [$switchName] not found"
    $script:issues++
}

# 1b. Host vEthernet IP
$if = Get-NetAdapter | Where-Object { $_.Name -like "*$switchName*" } | Select-Object -First 1
$hostIPOk = $false
if ($if) {
    $ipInfo = Get-NetIPAddress -InterfaceIndex $if.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.PrefixOrigin -eq "Manual" }
    if ($ipInfo -and $ipInfo.IPAddress -eq $hostIP) {
        Dormant green "OK" "Host vEthernet IP: $hostIP/24"
        $script:ok++; $hostIPOk = $true
    } elseif ($ipInfo) {
        Dormant yellow "WARN" "Host vEthernet IP is $($ipInfo.IPAddress), expected $hostIP"
        $script:warn++
    } else {
        Dormant red "MISS" "No static IP on $($if.Name)"
        $script:issues++
    }
} else {
    Dormant red "MISS" "vEthernet ($switchName) adapter not found on host"
    $script:issues++
}

# 1c. DC VM
$vm = Get-VM -Name $vmName -ErrorAction SilentlyContinue
if ($vm) {
    Dormant green "OK" "VM [$vmName] state=$($vm.State)"
    $script:ok++
} else {
    Dormant red "MISS" "VM [$vmName] not found"
    $script:issues++
}

# 1d. DC NIC on switch
$dcNic = $null
if ($vm) {
    $dcNic = $vm | Get-VMNetworkAdapter | Where-Object { $_.SwitchName -eq $switchName }
}
if ($dcNic) {
    $ips = $dcNic.IPAddresses -join ', '
    if ($ips -like "*$dcIP*") {
        Dormant green "OK" "DC NIC on [$switchName] IP=$ips"
        $script:ok++
    } else {
        Dormant yellow "WARN" "DC NIC on [$switchName] IP=$ips (expected $dcIP)"
        $script:warn++
    }
} else {
    Dormant red "MISS" "DC has no NIC on [$switchName]"
    $script:issues++
}

# 1e. NAT
try {
    $nat = Get-NetNat -Name $natName -ErrorAction Stop
    Dormant green "OK" "NAT [$natName] prefix=$($nat.InternalIPInterfaceAddressPrefix)"
    $script:ok++
} catch {
    Dormant yellow "WARN" "NAT [$natName] not found"
    $script:warn++
}

# 1f. portproxy
$pp = netsh interface portproxy show all
$pp389 = ($pp | Select-String "389.*$dcIP" -Quiet)
$pp636 = ($pp | Select-String "636.*$dcIP" -Quiet)
if ($pp389 -and $pp636) {
    Dormant green "OK" "portproxy 389/636 -> $dcIP"
    $script:ok++
} else {
    Dormant red "MISS" "portproxy missing or wrong target"
    $script:issues++
}

# 1g. Firewall
$fw389 = (netsh advfirewall firewall show rule name="DC-LDAP" 2>$null) -match "Allow"
$fw636 = (netsh advfirewall firewall show rule name="DC-LDAPS" 2>$null) -match "Allow"
if ($fw389 -and $fw636) {
    Dormant green "OK" "Firewall rules DC-LDAP / DC-LDAPS"
    $script:ok++
} else {
    Dormant red "MISS" "Firewall rules missing"
    $script:issues++
}

# 1h. WSLBridge warning
$wsl = Get-VMSwitch -Name "WSLBridge" -ErrorAction SilentlyContinue
if ($wsl) {
    $wslAdapter = Get-NetAdapter -Name "vEthernet (WSLBridge)" -ErrorAction SilentlyContinue
    if ($wslAdapter -and $wslAdapter.Status -ne "Up") {
        Dormant yellow "WARN" "WSLBridge is $($wslAdapter.Status) - Docker networking may be affected"
        $script:warn++
    }
}

# 1i. Known VMs summary
Title "VM summary"
Get-VM | Select-Object Name, State, @{N='MemMB';E={[math]::Round($_.MemoryAssigned/1MB)}} |
    Format-Table -AutoSize | Out-Host
Get-VMNetworkAdapter -VMName $vmName |
    Select-Object Name, SwitchName, @{N='IPs';E={$_.IPAddresses -join ', '}} |
    Format-Table -AutoSize | Out-Host

Write-Host "`nDetection summary: OK=$script:ok  WARN=$script:warn  ISSUE=$script:issues"

# ========================================================
# Exit early if detect-only
# ========================================================
if ($Detect) {
    Write-Host "`nDetect-only mode. No changes made."
    if ($script:issues -gt 0) { exit 1 } else { exit 0 }
}

if ($script:issues -eq 0 -and $script:warn -eq 0) {
    Write-Host "`nAll checks passed. Nothing to fix."
    # Still run verify
    goto verify
}

# ========================================================
# PHASE 2: FIX
# ========================================================
Title "PHASE 2: FIX"

# 2a. Create switch
if (-not $sw) {
    Write-Host "Creating VMSwitch [$switchName] Internal..."
    New-VMSwitch -Name $switchName -SwitchType Internal
    Start-Sleep 2
    Dormant green "FIXED" "VMSwitch [$switchName] created"
    $script:fixed++
}

# 2b. Host IP
if (-not $hostIPOk) {
    $if = Get-NetAdapter | Where-Object { $_.Name -like "*$switchName*" } | Select-Object -First 1
    if ($if) {
        $oldIP = Get-NetIPAddress -InterfaceIndex $if.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.PrefixOrigin -eq "Manual" }
        if ($oldIP) { Remove-NetIPAddress -InterfaceIndex $if.InterfaceIndex -AddressFamily IPv4 -Confirm:$false }
        New-NetIPAddress -InterfaceIndex $if.InterfaceIndex -IPAddress $hostIP -PrefixLength 24
        Dormant green "FIXED" "Host IP set to $hostIP/24"
    }
    $script:fixed++
}

# 2c. DC NIC
if (-not $dcNic) {
    Add-VMNetworkAdapter -VMName $vmName -SwitchName $switchName
    Dormant green "FIXED" "NIC added to VM [$vmName] on [$switchName]"
    Write-Host "  >>> THEN run manually inside DC VM:"
    Write-Host "  >>>   ipconfig (find new NIC name)"
    Write-Host "  >>>   netsh interface ip set address 'Ethernet X' static $dcIP 255.255.255.0 $hostIP"
    Write-Host "  >>>   netsh interface ip set dns 'Ethernet X' static 127.0.0.1"
    $script:fixed++
} elseif ($dcNic.IPAddresses -notlike "*$dcIP*") {
    Dormant yellow "WARN" "DC NIC exists but IP not confirmed as $dcIP - verify inside DC VM"
}

# 2d. NAT
try { $null = Get-NetNat -Name $natName -ErrorAction Stop }
catch {
    New-NetNat -Name $natName -InternalIPInterfaceAddressPrefix $subnet
    Dormant green "FIXED" "NAT [$natName] created"
    $script:fixed++
}

# 2e. portproxy
netsh interface portproxy delete v4tov4 listenport=389 2>$null
netsh interface portproxy delete v4tov4 listenport=636 2>$null
netsh interface portproxy add v4tov4 listenport=389 listenaddress=0.0.0.0 connectport=389 connectaddress=$dcIP
netsh interface portproxy add v4tov4 listenport=636 listenaddress=0.0.0.0 connectport=636 connectaddress=$dcIP
Dormant green "FIXED" "portproxy 389/636 -> $dcIP"
$script:fixed++

# 2f. Firewall
netsh advfirewall firewall add rule name="DC-LDAP" dir=in protocol=tcp localport=389 action=allow 2>$null
netsh advfirewall firewall add rule name="DC-LDAPS" dir=in protocol=tcp localport=636 action=allow 2>$null
Dormant green "FIXED" "Firewall rules added"
$script:fixed++

# ========================================================
# verify label
# ========================================================
:verify

# ========================================================
# PHASE 3: VERIFY
# ========================================================
Title "PHASE 3: VERIFY connectivity"

Write-Host "  Testing host -> DC ($dcIP:389)..."
$t1 = Test-NetConnection -ComputerName $dcIP -Port 389 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($t1) {
    Dormant green "OK" "Host -> DC ($dcIP:389)"
} else {
    Dormant red "FAIL" "Cannot reach $dcIP:389 from host"
}

Write-Host "  Testing portproxy via 0.0.0.0:389..."
$t2 = Test-NetConnection -ComputerName "0.0.0.0" -Port 389 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($t2) {
    Dormant green "OK" "portproxy 0.0.0.0:389"
} else {
    Dormant red "FAIL" "portproxy 0.0.0.0:389 - is DC NIC IP set to $dcIP?"
}

Write-Host "  Testing Docker container -> DC..."
$dc = docker exec keycloak bash -c 'exec 3<>/dev/tcp/host.docker.internal/389 && echo OK 2>/dev/null && exec 3>&-' 2>&1
if ($dc -match "OK") {
    Dormant green "OK" "Docker Keycloak -> host.docker.internal:389"
} else {
    Dormant red "FAIL" "Docker container cannot reach host.docker.internal:389"
}

# ========================================================
# Final summary
# ========================================================
Write-Host "`n========== $(Get-Date -Format 'HH:mm:ss') DONE =========="
Write-Host "Detected: OK=$script:ok  WARN=$script:warn"
Write-Host "Fixed: $script:fixed"
Write-Host "`nNext manual steps:"
Write-Host "  1. If DC NIC IP is not $dcIP: set inside DC VM (see instructions above)"
Write-Host "  2. Keycloak: User Federation -> LDAP -> ldap://host.docker.internal:389"
Write-Host "  3. See: windows-ad-integration.html section 4"
