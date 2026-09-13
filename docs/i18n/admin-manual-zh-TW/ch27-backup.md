# 第27章：備份與恢復

*第三部分 · 維運篇*

> 兩級備份、完整性校驗、獨立腳本。

[← 第26章：MailHog 郵件接收器](ch26-ops-mailhog.md) · [📖 目錄](index.md) · [第28章：健康檢查與開機自檢 →](ch28-healthcheck.md)

---

**位置**：`C:\AIAllInOne\Backup\` — 獨立 PowerShell 腳本，與 AI 管理中心解耦。

| 腳本 | 用途 |
| --- | --- |
| `backup-docker.ps1` | 備份（兩級） |
| `restore-docker.ps1` | 恢復（兩種策略） |
| `check_backup.ps1` | 校驗備份完整性（5 層檢查） |
| `fix-backup-task.ps1` | 修復定時備份計劃任務 |

## 27.1 備份等級

| 等級 | 包含內容 | 適用場景 |
| --- | --- | --- |
| **L1**（默認） | 配置文件 + 所有資料庫 dump（MySQL、PostgreSQL ×4、SQLite ×2） | 每日快照，速度快 |
| **L2** | L1 + `docker_data.vhdx`（含全部 Docker 鏡像和卷） | 完整災難恢復——換數據盤即可恢復 |

## 27.2 手動備份

```powershell
# L1 快照
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1

# L2 完整備份（會短暫停止平台）
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2

# 演練模式
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 定時備份

計劃任務 `AI-Platform-Backup` 每天 02:00 運行。如果報錯，用修復腳本：

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 恢復

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

兩種恢復策略（自動選擇）：VHDX 替換（瞬間恢復）或選擇性恢復（逐個資料庫導入）。

## 27.5 備份校驗

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

5 層檢查：路徑與元信息 → 完備性 → 完整性 → 內部一致性 → 自恢復性。

## 27.6 關鍵坑

> ⚠️
> - Keycloak 必須用 **realm export/import（JSON）**，pg_dump 還原會丟失 default role 關聯；
> - L2 備份會短暫停止整個平台（Docker Desktop + WSL 關閉才能安全拷貝 VHDX）；
> - 恢復前務必先用 `check_backup.ps1` 校驗備份完整性。

---

[← 第26章：MailHog 郵件接收器](ch26-ops-mailhog.md) · [📖 目錄](index.md) · [第28章：健康檢查與開機自檢 →](ch28-healthcheck.md)
