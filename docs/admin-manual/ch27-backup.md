# Chapter 27: Backup and Restore

*Part 3 · Operations*

> Two-level backup, integrity verification, standalone scripts.

[← Chapter 26: MailHog Mail Catcher](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapter 28: Health Checks and Startup Self-Checks →](ch28-healthcheck.md)

---

**Location**: `C:\AIAllInOne\Backup\` — standalone PowerShell scripts, independent of AI Admin Center.

| Script | Purpose |
| --- | --- |
| `backup-docker.ps1` | Backup (two levels) |
| `restore-docker.ps1` | Restore (two strategies) |
| `check_backup.ps1` | Verify backup integrity (5-layer check) |
| `fix-backup-task.ps1` | Fix the scheduled backup task |

## 27.1 Backup Levels

| Level | What's included | Use case |
| --- | --- | --- |
| **L1** (default) | Config files + all DB dumps (MySQL, PostgreSQL ×4, SQLite ×2) | Daily snapshot, fast |
| **L2** | L1 + `docker_data.vhdx` (contains all Docker images & volumes) | Full disaster recovery — swap the VHDX data disk |

### What gets backed up

| Item | Method |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Keycloak / LiteLLM / Dify / Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea SQLite | WAL checkpoint + file copy |
| Config files (`.env`, `docker-compose.yml`, `litellm-config.yaml`, Dify `.env`) | File copy |
| Docker data VHDX (L2 only) | Hot copy after stopping containers |

## 27.2 Manual Backup

```powershell
# L1 snapshot (config + DB dumps)
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1

# L2 full (adds docker_data.vhdx — stops the platform briefly)
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2

# Dry run (prints plan & sizes, writes nothing)
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun

# Custom backup location
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -BackupRoot "F:\Backup\Docker"
```

Default backup output: `C:\AIAllInOne\Backup\backups\backup_YYYYMMDD_HHMMSS\`

## 27.3 Scheduled Backup

The scheduled task `AI-Platform-Backup` runs daily at 02:00. If it reports errors (e.g. `0x800710E0`), run the fix script:

```powershell
# Preview what would change (safe — no modifications)
C:\AIAllInOne\Backup\fix-backup-task.ps1

# Apply the fix (StartWhenAvailable=True, battery flags=False, repoints action)
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

> 📌 Default retention is 30 days. Old backups are pruned automatically.  
> 📌 Backups default to C:\AIAllInOne\Backup\backups\; use `-BackupRoot` to redirect to another disk.

## 27.4 Restore

```powershell
# Restore from a specific backup
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"

# Dry run (shows what would be restored, writes nothing)
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "..." -DryRun
```

**Two restore strategies** (auto-selected based on backup contents):

| Strategy | When | What it does |
| --- | --- | --- |
| **A: VHDX swap** | `docker_data.vhdx` present | Stop Docker → replace VHDX → restart → instant full restore |
| **B: Selective** | No VHDX | Import images (if any), restore configs, restore each DB via `docker exec` |

## 27.5 Backup Verification

Always verify a backup before relying on it:

```powershell
# Check a single backup
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"

# Check all backups under a directory
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups"

# JSON output (for scripting)
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000" -Json
```

The verifier checks 5 layers:
1. **Path & metadata** — level, size, file count, freshness
2. **Completeness** — every file/directory the restore script expects
3. **Integrity** — file header magic numbers (SQLite / tar / gzip / VHDX), SQL dump encoding
4. **Internal consistency** — `.env` variables referenced by `docker-compose.yml` exist
5. **Self-recovery** — backup contains the restore script itself

## 27.6 Key Pitfalls

> ⚠️
> - Keycloak must use **realm export/import (JSON)**; `pg_dump` restore loses default role associations and prevents startup.
> - SQLite files restored as root may cause readonly errors; the restore script handles `chown` automatically.
> - `pg_dump` uses `--clean --if-exists` to avoid restore conflicts.
> - L2 backup stops the entire platform briefly (Docker Desktop + WSL shutdown to safely copy VHDX). Schedule during maintenance windows.
> - Old backups (pre-2026-09-12) may contain an `images/` directory from the legacy L2 scheme; these are still verified and restorable by the new scripts.

---

[← Chapter 26: MailHog Mail Catcher](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapter 28: Health Checks and Startup Self-Checks →](ch28-healthcheck.md)
