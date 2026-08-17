# 第27章：バックアップと復元

*第三部 · 運用編*

> 全データの毎日バックアップ、ワンクリック復元。

[← 第26章：MailHog メール受信](ch26-ops-mailhog.md) · [📖 目次](index.md) · [第28章：ヘルスチェックと起動時セルフチェック →](ch28-healthcheck.md)

---

**入口**：AI 管理センター「💾 バックアップと復元」ページ、またはコマンドライン `scripts/backup.ps1` / `restore.ps1`。毎日 02:00 のスケジュールタスクで自動バックアップし、7 日間保持します。

## 27.1 バックアップ項目

| バックアップ項目 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | ファイルコピー |
| Keycloak | **realm export（JSON）** |
| 設定ファイル | ファイルコピー |

## 27.2 手動バックアップ

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 定期バックアップ（スケジュールタスク）

スケジュールタスク `AI-Platform-Backup`（毎日 02:00）を登録済み。自動登録されていない場合は手動作成：タスクスケジューラ → 新規作成 → プログラム `powershell.exe`、引数 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`、トリガー毎日 02:00。

> 📌 バックアップはデフォルトで C ドライブにあります。定期的に `C:\AIAllInOne\backups\` を別のディスクやオブジェクトストレージに同期して異地災害対策を行うことを推奨します。

## 27.4 復元

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

スクリプトは `yes` の入力確認を要求します（`-Force` でスキップ。スクリプト/CI 専用）。AI 管理センター「バックアップと復元」ページで任意のバックアップの「復元」をクリックしてワンクリック復元も可能です。

## 27.5 重要な落とし穴（演習で検証済み）

> ⚠️
> - Keycloak は必ず **realm export/import（JSON）** を使用します。pg_dump 復元は default role の関連付けが失われ起動できなくなります；
> - SQLite 復元後の所有権は root になるため、対応する uid に chown する必要があります（grafana=472、gitea=1000）。しないと readonly エラー；
> - pg_dump に `--clean --if-exists` を付けて復元競合を回避；
> - 旧版 backup.ps1 は `Copy-Item` のバッチコピーでドットファイル `.env` が原因で全体が静かに失敗していました。ファイルごとの `-LiteralPath` に修正済み；
> - AI 管理センターのバックアップは base64 中継 + tar-fs でバイナリ安全を保証します（docker exec の stdout は utf8 経由で SQLite .db を壊すため）。

---

[← 第26章：MailHog メール受信](ch26-ops-mailhog.md) · [📖 目次](index.md) · [第28章：ヘルスチェックと起動時セルフチェック →](ch28-healthcheck.md)
