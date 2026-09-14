# 第27章：备份与恢复

*第三部分 · 运维篇*

> 两级备份、完整性校验、独立脚本。

[← 第26章：MailHog 邮件接收器](ch26-ops-mailhog.md) · [📖 目录](index.md) · [第28章：健康检查与开机自检 →](ch28-healthcheck.md)

---

**位置**：`C:\AIAllInOne\Backup\` — 独立 PowerShell 脚本，与 AI 管理中心解耦。

| 脚本 | 用途 |
| --- | --- |
| `backup-docker.ps1` | 备份（两级） |
| `restore-docker.ps1` | 恢复（两种策略） |
| `check_backup.ps1` | 校验备份完整性（5 层检查） |
| `fix-backup-task.ps1` | 修复定时备份计划任务 |

## 27.1 备份等级

| 等级 | 包含内容 | 适用场景 |
| --- | --- | --- |
| **L1**（默认） | 配置文件 + 所有数据库 dump（MySQL、PostgreSQL ×4、SQLite ×2） | 每日快照，速度快 |
| **L2** | L1 + `docker_data.vhdx`（含全部 Docker 镜像和卷） | 完整灾难恢复——换数据盘即可恢复 |

### 备份项明细

| 备份项 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Keycloak / LiteLLM / Dify / Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea SQLite | WAL checkpoint + 文件复制 |
| 配置文件（`.env`、`docker-compose.yml`、`litellm-config.yaml`、Dify `.env`） | 文件复制 |
| Docker 数据 VHDX（仅 L2） | 停容器后热拷贝 |

## 27.2 手动备份

```powershell
# L1 快照（配置 + 数据库 dump）
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1

# L2 完整备份（额外包含 docker_data.vhdx——会短暂停止平台）
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2

# 演练模式（只打印计划和体积，不写任何文件）
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun

# 自定义备份目录
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -BackupRoot "F:\Backup\Docker"
```

默认输出目录：`C:\AIAllInOne\Backup\backups\backup_YYYYMMDD_HHMMSS\`

## 27.3 定时备份

计划任务 `AI-Platform-Backup` 每天 02:00 运行。如果报错（如 `0x800710E0`），用修复脚本：

```powershell
# 预览修复方案（安全，不做任何修改）
C:\AIAllInOne\Backup\fix-backup-task.ps1

# 应用修复（StartWhenAvailable=True、清除电池标志、重定向 action）
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

> 📌 默认保留 30 天，过期自动清理。  
> 📌 默认备份到 C:\AIAllInOne\Backup\backups\，用 `-BackupRoot` 可重定向到其他盘。

## 27.4 恢复

```powershell
# 从指定备份恢复
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"

# 演练模式（只展示恢复计划，不写任何文件）
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "..." -DryRun
```

**两种恢复策略**（根据备份内容自动选择）：

| 策略 | 触发条件 | 操作 |
| --- | --- | --- |
| **A：VHDX 替换** | 存在 `docker_data.vhdx` | 停 Docker → 替换 VHDX → 重启 → 瞬间完整恢复 |
| **B：选择性恢复** | 无 VHDX | 导入镜像（如有）→ 恢复配置 → 逐个恢复数据库（经 `docker exec`） |

## 27.5 备份校验

恢复前务必先校验备份是否可用：

```powershell
# 校验单个备份
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"

# 批量校验目录下所有备份
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups"

# JSON 输出（便于脚本消费）
C:\AIAllInOne\Backup\check_backup.ps1 "..." -Json
```

校验器分 5 层检查：
1. **路径与元信息** — 等级判定、大小、文件数、新鲜度
2. **完备性** — 恢复脚本会读的每个文件/目录是否都在、大小是否合理
3. **完整性** — 文件头魔数（SQLite / tar / gzip / VHDX）、SQL dump 是否被重编码为 UTF-16
4. **内部一致性** — `docker-compose.yml` 引用的 `${VAR}` 在 `.env` 里有没有定义
5. **自恢复性** — 备份里有没有恢复脚本自身

## 27.6 关键坑（演练已验证）

> ⚠️
> - Keycloak 必须用 **realm export/import（JSON）**，pg_dump 还原会丢失 default role 关联导致起不来；
> - SQLite 文件还原后属主是 root，恢复脚本已自动处理 chown；
> - pg_dump 带 `--clean --if-exists` 避免还原冲突；
> - L2 备份会短暂停止整个平台（Docker Desktop + WSL 关闭才能安全拷贝 VHDX），建议安排在维护窗口；
> - 旧版备份（2026-09-12 之前）可能包含 `images/` 目录（旧 L2 方案），新脚本仍可校验和恢复。

---

[← 第26章：MailHog 邮件接收器](ch26-ops-mailhog.md) · [📖 目录](index.md) · [第28章：健康检查与开机自检 →](ch28-healthcheck.md)
