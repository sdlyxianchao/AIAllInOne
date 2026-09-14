<#
.SYNOPSIS
    Repoint the nightly AI AllInOne backup task and fix the settings behind 0x800710E0.

.DESCRIPTION
    PREVIEW BY DEFAULT - nothing is changed unless you pass -Apply.

    Why this task reports 0x800710E0 (ERROR_REQUEST_REFUSED / "the operator or
    administrator has refused the request") on this machine:

      * The box is NOT on 24/7. Kernel-Power event 109 "Power Action Shutdown Off"
        shows it goes down overnight (2026-09-12 00:43), so the 02:00 trigger fires
        while the machine is off.
      * The task has StartWhenAvailable = False, so a missed trigger is never retried.
        The scheduler records the refusal the next time it evaluates the task - which
        is why LastRunTime shows 2026-09-12 09:26 for a 02:00 trigger.
      * DisallowStartIfOnBatteries / StopIfGoingOnBatteries are True. Harmless on a
        desktop, but they are the textbook cause and cost nothing to clear.

    What -Apply changes:
      1. StartWhenAvailable = True, battery flags = False.   <-- the actual fix
      2. Action -> powershell.exe ... \Backup\backup-docker.ps1, the script that
         actually backs up admin-portal. This only happens when -BackupRoot is given,
         because F: is not attached right now and we must not silently write to the
         wrong disk.

.PARAMETER TaskName
    Defaults to AI-Platform-Backup. Exposed so the logic can be tested against a
    throwaway task without touching the real one.

.PARAMETER BackupRoot
    Where nightly backups should land, e.g. F:\Backup\Docker. Omit it to fix the
    task settings only and leave the action untouched.

.PARAMETER Level
    Passed through to backup-docker.ps1. 1 = config+db snapshot.
    2 = L1 + docker_data.vhdx (stops the platform for several minutes).

.PARAMETER RetentionDays
    Passed through to backup-docker.ps1's new prune step.

.EXAMPLE
    .\fix-backup-task.ps1
    Preview: shows current vs desired, changes nothing.

.EXAMPLE
    .\fix-backup-task.ps1 -BackupRoot F:\Backup\Docker -Apply
    Fix settings and repoint the action at F:.
#>
[CmdletBinding()]
param(
    [string]$TaskName = "AI-Platform-Backup",
    [string]$BackupRoot = "",
    [ValidateSet(1, 2)][int]$Level = 1,
    [int]$RetentionDays = 30,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$newScript = "C:\AIAllInOne\Backup\backup-docker.ps1"

# ---- desired action argument string ----
$wantArgs = '-NoProfile -ExecutionPolicy Bypass -File "' + $newScript + '" -Level ' + $Level + ' -RetentionDays ' + $RetentionDays
if ($BackupRoot) { $wantArgs += ' -BackupRoot "' + $BackupRoot + '"' }

# ---- read the task ----
$svc = New-Object -ComObject Schedule.Service
$svc.Connect()
$folder = $svc.GetFolder("\")
try { $task = $folder.GetTask($TaskName) } catch { throw ("task not found: " + $TaskName) }
$def = $task.Definition
$act = @($def.Actions) | Select-Object -First 1

Write-Host ""
Write-Host "=== current ===" -ForegroundColor Cyan
Write-Host ("  Task                       : " + $TaskName)
Write-Host ("  Action                     : " + $act.Path)
Write-Host ("  Arguments                  : " + $act.Arguments)
Write-Host ("  StartWhenAvailable         : " + $def.Settings.StartWhenAvailable)
Write-Host ("  DisallowStartIfOnBatteries : " + $def.Settings.DisallowStartIfOnBatteries)
Write-Host ("  StopIfGoingOnBatteries     : " + $def.Settings.StopIfGoingOnBatteries)

Write-Host ""
Write-Host "=== desired ===" -ForegroundColor Cyan
Write-Host ("  StartWhenAvailable         : True")
Write-Host ("  DisallowStartIfOnBatteries : False")
Write-Host ("  StopIfGoingOnBatteries     : False")
if ($BackupRoot) {
    Write-Host ("  Action                     : powershell.exe")
    Write-Host ("  Arguments                  : " + $wantArgs)
} else {
    Write-Host ("  Action                     : UNCHANGED (no -BackupRoot given)")
}

if (-not $Apply) {
    Write-Host ""
    Write-Host "PREVIEW ONLY - nothing was changed. Re-run with -Apply to commit." -ForegroundColor Yellow
    Write-Host "When F: is attached:" -ForegroundColor Yellow
    Write-Host ("  .\fix-backup-task.ps1 -BackupRoot ""F:\Backup\Docker"" -Apply") -ForegroundColor Yellow
    return
}

# ---- guards before touching anything ----
if ($BackupRoot) {
    if (-not (Test-Path -LiteralPath $newScript)) { throw ("missing: " + $newScript) }
    $drive = Split-Path -Qualifier $BackupRoot
    if (-not (Test-Path ($drive + "\"))) { throw ("drive not attached: " + $drive) }
}

# ---- apply: patch the existing definition in place ----
$def.Settings.StartWhenAvailable = $true
$def.Settings.DisallowStartIfOnBatteries = $false
$def.Settings.StopIfGoingOnBatteries = $false

if ($BackupRoot) {
    if (-not (Test-Path -LiteralPath $BackupRoot)) {
        New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
        Write-Host ("  created " + $BackupRoot) -ForegroundColor DarkGray
    }
    $def.Actions.Clear()
    $a = $def.Actions.Create(0)          # 0 = TASK_ACTION_EXEC
    $a.Path = "powershell.exe"
    $a.Arguments = $wantArgs
    $a.WorkingDirectory = "C:\AIAllInOne\Backup"
}

# 6 = TASK_CREATE_OR_UPDATE(2) + TASK_DONT_ADD_PRINCIPAL_ACE(4)
# keep the existing principal: same user, same logon type
$folder.RegisterTaskDefinition($TaskName, $def, 6, $def.Principal.UserId, $null, $def.Principal.LogonType) | Out-Null

# ---- verify by re-reading ----
$after = ($folder.GetTask($TaskName)).Definition
$a2 = @($after.Actions) | Select-Object -First 1
Write-Host ""
Write-Host "=== after ===" -ForegroundColor Green
Write-Host ("  Action                     : " + $a2.Path)
Write-Host ("  Arguments                  : " + $a2.Arguments)
Write-Host ("  StartWhenAvailable         : " + $after.Settings.StartWhenAvailable)
Write-Host ("  DisallowStartIfOnBatteries : " + $after.Settings.DisallowStartIfOnBatteries)
Write-Host ("  StopIfGoingOnBatteries     : " + $after.Settings.StopIfGoingOnBatteries)
Write-Host ""
Write-Host "Done. Next trigger: check with Get-ScheduledTaskInfo -TaskName $TaskName" -ForegroundColor Green
