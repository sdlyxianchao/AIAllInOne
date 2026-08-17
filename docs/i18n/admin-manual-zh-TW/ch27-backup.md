# 第27章：備份與恢復

*第三部分 · 維運篇*

> 全量資料每日備份、一鍵恢復。

[← 第26章：MailHog 郵件接收器](ch26-ops-mailhog.md) · [📖 目錄](index.md) · [第28章：健康檢查與開機自檢 →](ch28-healthcheck.md)

---

**入口**：AI 管理中心「💾 備份與恢復」頁，或命令列 `scripts/backup.ps1` / `restore.ps1`。每日 02:00 計劃任務自動備份，保留 7 天。

## 27.1 備份項

| 備份項 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 檔案複製 |
| Keycloak | **realm export（JSON）** |
| 配置檔案 | 檔案複製 |

## 27.2 手動備份

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 定時備份（計劃任務）

已註冊計劃任務 `AI-Platform-Backup`（每天 02:00）。未自動註冊可手動建：任務計劃程式 → 新建 → 程式 `powershell.exe`，參數 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`，觸發器每天 02:00。

> 📌 備份預設在 C 盤，建議定期把 `C:\AIAllInOne\backups\` 同步到另一塊盤或物件儲存做異地容災。

## 27.4 恢復

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

指令碼要求輸入 `yes` 確認（加 `-Force` 跳過，僅指令碼/CI 用）。也可在 AI 管理中心「備份與恢復」頁點某次備份的「恢復」一鍵恢復。

## 27.5 關鍵坑（演練已驗證）

> ⚠️
> - Keycloak 必須用 **realm export/import（JSON）**，pg_dump 還原會丟 default role 關聯導致起不來；
> - SQLite 還原後屬主是 root，需 chown 到對應 uid（grafana=472、gitea=1000），否則報 readonly；
> - pg_dump 帶 `--clean --if-exists` 避免還原衝突；
> - 舊版 backup.ps1 用 `Copy-Item` 批次複製時點號檔案 `.env` 導致整批靜默失敗，已改逐檔案 `-LiteralPath`；
> - AI 管理中心備份用 base64 中轉 + tar-fs 保證二進位制安全（docker exec 的 stdout 走 utf8 會損壞 SQLite .db）。

---

[← 第26章：MailHog 郵件接收器](ch26-ops-mailhog.md) · [📖 目錄](index.md) · [第28章：健康檢查與開機自檢 →](ch28-healthcheck.md)
