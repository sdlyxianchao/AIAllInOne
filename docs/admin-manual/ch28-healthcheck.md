# Chapter 28: Health Checks and Startup Self-Checks

*Part 3 · Operations*

> One-click health check of all 41 containers + the LLM full chain + the authentication chain.

[← Chapter 27: Backup and Restore](ch27-backup.md) · [📖 Index](index.md) · [Chapter 29: Troubleshooting Guide →](ch29-troubleshooting.md)

---

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, outputs `health_check_<timestamp>.log`. Covers 41 containers (25 Windows core + 16 Dify); credentials are read from `.env`, no hardcoded passwords.

## 28.1 Check Scope (9 stages)

| Stage | Check items |
| --- | --- |
| Stage 1 | whether the Docker Daemon is running (waits for readiness, suited for startup self-check) |
| Stage 2 | status of 41 containers (Up/Exited/Restarting) |
| Stage 3 | 10 HTTP endpoint responses |
| Stage 4 | LiteLLM readiness + model registration, Dify API, database/Redis/Sandbox health |
| Stage 5 | LLM full chain (NewAPI → LiteLLM → DeepSeek real request) |
| Stage 6 | AD account authentication chain + NewAPI admin login |
| Stage 7 | MCP Gateway + Skill functionality |
| Stage 8 | DeepChat/Dify login prerequisites |
| Stage 9 | disk space |

## 28.2 Manual Execution

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ If the output ends with `ALL CLEAR` and `Fail: 0`, everything is normal.

## 28.3 Startup Auto-Run (scheduled task)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # delay 2 minutes after login to wait for Docker + containers to start
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 Note: the script uses `127.0.0.1`, not localhost; LiteLLM internal health uses `/health/readiness` (no auth); `docker-init_permissions-1` Exited(0) is normal; the Update Server returning 403 is normal (no default index.html); exit code 0=pass, 1=has failures.

---

[← Chapter 27: Backup and Restore](ch27-backup.md) · [📖 Index](index.md) · [Chapter 29: Troubleshooting Guide →](ch29-troubleshooting.md)
