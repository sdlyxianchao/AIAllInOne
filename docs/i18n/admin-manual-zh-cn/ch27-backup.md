# 第27章：备份与恢复

*第三部分 · 运维篇*

> 全量数据每日备份、一键恢复。

[← 第26章：MailHog 邮件接收器](ch26-ops-mailhog.md) · [📖 目录](index.md) · [第28章：健康检查与开机自检 →](ch28-healthcheck.md)

---

**入口**：AI 管理中心「💾 备份与恢复」页，或命令行 `scripts/backup.ps1` / `restore.ps1`。每日 02:00 计划任务自动备份，保留 7 天。

## 27.1 备份项

| 备份项 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 文件复制 |
| Keycloak | **realm export（JSON）** |
| 配置文件 | 文件复制 |

## 27.2 手动备份

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 定时备份（计划任务）

已注册计划任务 `AI-Platform-Backup`（每天 02:00）。未自动注册可手动建：任务计划程序 → 新建 → 程序 `powershell.exe`，参数 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`，触发器每天 02:00。

> 📌 备份默认在 C 盘，建议定期把 `C:\AIAllInOne\backups\` 同步到另一块盘或对象存储做异地容灾。

## 27.4 恢复

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

脚本要求输入 `yes` 确认（加 `-Force` 跳过，仅脚本/CI 用）。也可在 AI 管理中心「备份与恢复」页点某次备份的「恢复」一键恢复。

## 27.5 关键坑（演练已验证）

> ⚠️
> - Keycloak 必须用 **realm export/import（JSON）**，pg_dump 还原会丢 default role 关联导致起不来；
> - SQLite 还原后属主是 root，需 chown 到对应 uid（grafana=472、gitea=1000），否则报 readonly；
> - pg_dump 带 `--clean --if-exists` 避免还原冲突；
> - 旧版 backup.ps1 用 `Copy-Item` 批量复制时点号文件 `.env` 导致整批静默失败，已改逐文件 `-LiteralPath`；
> - AI 管理中心备份用 base64 中转 + tar-fs 保证二进制安全（docker exec 的 stdout 走 utf8 会损坏 SQLite .db）。

---

[← 第26章：MailHog 邮件接收器](ch26-ops-mailhog.md) · [📖 目录](index.md) · [第28章：健康检查与开机自检 →](ch28-healthcheck.md)
