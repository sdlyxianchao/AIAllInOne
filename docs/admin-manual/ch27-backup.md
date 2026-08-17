# Chapter 27: Backup and Restore

*Part 3 · Operations*

> Daily full-data backup, one-click restore.

[← Chapter 26: MailHog Mail Catcher](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapter 28: Health Checks and Startup Self-Checks →](ch28-healthcheck.md)

---

**Entry**: the AI Admin Center's "💾 Backup and Restore" page, or the command line `scripts/backup.ps1` / `restore.ps1`. A scheduled task auto-backs up at 02:00 daily, keeping 7 days.

## 27.1 Backup Items

| Backup item | Method |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | file copy |
| Keycloak | **realm export (JSON)** |
| Config files | file copy |

## 27.2 Manual Backup

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 Scheduled Backup (scheduled task)

The scheduled task `AI-Platform-Backup` is already registered (daily 02:00). If not auto-registered, create it manually: Task Scheduler → New → program `powershell.exe`, arguments `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, trigger daily 02:00.

> 📌 Backups default to the C drive; it is recommended to periodically sync `C:\AIAllInOne\backups\` to another disk or object storage for offsite disaster recovery.

## 27.4 Restore

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

The script requires typing `yes` to confirm (add `-Force` to skip, only for scripts/CI). You can also click "Restore" on a backup in the AI Admin Center's "Backup and Restore" page for one-click restore.

## 27.5 Key Pitfalls (verified in drills)

> ⚠️
> - Keycloak must use **realm export/import (JSON)**; pg_dump restore loses the default role association and won't start;
> - After SQLite restore the owner is root; chown to the corresponding uid (grafana=472, gitea=1000), otherwise it reports readonly;
> - pg_dump should include `--clean --if-exists` to avoid restore conflicts;
> - The old backup.ps1 used `Copy-Item` batch copy where the dotfile `.env` caused the whole batch to silently fail; it was changed to per-file `-LiteralPath`;
> - The AI Admin Center backup uses base64 relay + tar-fs to ensure binary safety (docker exec stdout over utf8 would corrupt SQLite .db).

---

[← Chapter 26: MailHog Mail Catcher](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapter 28: Health Checks and Startup Self-Checks →](ch28-healthcheck.md)
