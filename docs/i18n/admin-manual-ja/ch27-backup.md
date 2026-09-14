# 第27章：バックアップと復元

*第三部 · 運用編*

> 2段階バックアップ、整合性検証、独立スクリプト。

[← 第26章：MailHog メール受信](ch26-ops-mailhog.md) · [📖 目次](index.md) · [第28章：ヘルスチェックと起動時セルフチェック →](ch28-healthcheck.md)

---

**場所**：`C:\AIAllInOne\Backup\` — AI管理センターから独立したPowerShellスクリプト。

| スクリプト | 用途 |
| --- | --- |
| `backup-docker.ps1` | バックアップ（2段階） |
| `restore-docker.ps1` | 復元（2種類の戦略） |
| `check_backup.ps1` | バックアップ整合性検証（5層チェック） |
| `fix-backup-task.ps1` | スケジュールタスク修復 |

## 27.1 バックアップレベル

| レベル | 内容 | 用途 |
| --- | --- | --- |
| **L1**（デフォルト） | 設定ファイル + 全DB dump | 毎日のスナップショット |
| **L2** | L1 + `docker_data.vhdx` | 完全災害復旧 |

## 27.2 手動バックアップ

```powershell
# L1 スナップショット
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1

# L2 完全バックアップ（プラットフォームを一時停止）
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2

# ドライラン
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 定期バックアップ

`AI-Platform-Backup`が毎日02:00に実行。エラー時は修復スクリプト：

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 復元

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 バックアップ検証

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 重要な落とし穴

> ⚠️
> - Keycloakは**realm export/import（JSON）**を使用必須；
> - L2バックアップはプラットフォームを一時停止；
> - 復元前に`check_backup.ps1`で整合性検証必須。

---

[← 第26章：MailHog メール受信](ch26-ops-mailhog.md) · [📖 目次](index.md) · [第28章：ヘルスチェックと起動時セルフチェック →](ch28-healthcheck.md)
