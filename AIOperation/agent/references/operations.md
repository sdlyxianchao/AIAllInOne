# 日常运维手册

> 覆盖 AI AllInOne 平台的所有日常管理。所有路径/端口/凭据均按通用规则处理：
> 路径用相对定位（脚本 `$PSScriptRoot` 自动跟随部署目录）；端口以对应部署指南的端口表为准；
> 密码一律读 `.env`，禁止硬编码与打印。

## 1. 健康检查与状态总览

**一键健康检查**（推荐，覆盖 41 容器 9 阶段：Docker 就绪 / 容器状态 / HTTP 端点 / 内部健康 / LLM 全链路 / AD 认证链路 / MCP+Skill / 登录前置 / 磁盘空间）：

```powershell
# Windows（在部署目录下）
powershell -ExecutionPolicy Bypass -File .\scripts\health-check.ps1
# Linux
./health-check.sh
```

结果输出到控制台 + `health_check_<时间戳>.log`；末尾 `ALL CLEAR` 且 `Fail: 0` 为全部正常。

**快速总览**（Admin Center 健康 API，需管理员会话）：

```
GET <admin-portal>/api/health          # 全平台健康聚合
GET <admin-portal>/api/system          # 系统信息（容器数/CPU/内存/镜像）
GET <admin-portal>/api/metrics         # 产品业务指标聚合
GET <admin-portal>/api/monitoring/overview  # Prometheus 抓取目标
GET <admin-portal>/api/availability    # 最近一次可用性测试结果 + 测试项清单
```

**容器状态**：`docker compose ps` / `docker ps -a`，关注 `Up`（健康）、`Exited`、`Restarting`。

## 2. 容器管理

```bash
docker compose up -d              # 启动/更新全部服务（仅按 compose 配置变化生效）
docker compose up -d <svc>        # 启动单个服务
docker restart <svc>              # 重启（改 volume 内代码后必须用这个）
docker stop <svc> && docker start <svc>
docker compose logs -f <svc>      # 跟踪日志
```

> ⚠️ **改代码生效规则**：后端代码（如 `admin-portal/server.js`）改完必须 `docker restart admin-portal`；`docker compose up -d` 只检测 compose 配置变化，不会重载卷内文件。前端静态文件（`public/index.html`）改完刷新浏览器（建议 Ctrl+F5）即可。

## 3. 日志排查

- **单容器日志**：`docker logs <svc> --tail 100`（加 `--since 1h` 看近期）
- **聚合日志**（Loki）：`GET <admin-portal>/api/logs/query?q=<lucene查询>&since=<时间>`（Admin Center 统一日志页同源）
- **告警**：`GET <admin-portal>/api/alerts` 查看当前 firing 告警；Alertmanager 配置在 `monitoring/alertmanager.yml`

## 4. 配置修改

1. 编辑配置文件（`.env`、`litellm-config.yaml`、`monitoring/*.yml`、`mcp-servers.json`、compose 文件等）
2. 按类型生效：环境变量/挂载配置 → `docker compose up -d`（重建变更服务）；卷内代码 → `docker restart <svc>`
3. 改完验证：健康 API / `docker compose ps` / 实际请求

**AI Admin Center 二次开发**：改 `admin-portal/public/index.html`（前端，刷新生效）或 `admin-portal/server.js`（后端，`docker restart admin-portal`）。改 JS 后用 Node 做语法校验再重启。

## 5. 可用性测试

```
POST <admin-portal>/api/availability/run       # 全测（20 项：认证/LLM 链路/聊天/各服务/SSO）
POST <admin-portal>/api/availability/test/<id> # 单测某项
GET  <admin-portal>/api/availability           # 最近结果 + summary + 测试项清单
```

测试项示例：`keycloak`、`newapi`、`litellm`、`chat-deepchat`、`chat-dify`、`dify`、`ghost`、`gitea`、`mcp`、`prometheus`、`grafana`、`langfuse`、`loki`、`presidio`、`sso-grafana`、`sso-langfuse`、`update-server`、`backup`、`docker`、`redis`。测试间隔为平台级参数（部署时配置），改动需修改后端并重启。

## 6. 报告生成

```
GET <admin-portal>/api/report?days=<1-365>&lang=<zh|en|...>&sections=<system,usage,client,issues,avail,backup,pii>
GET <admin-portal>/api/report/list              # 历史报告 + 保留设置
GET <admin-portal>/api/report/file/<name>       # 查看历史报告（markdown）
GET <admin-portal>/api/report/file/<name>/download
POST <admin-portal>/api/report/settings         # 保留策略（count 份数 / days 天数）
DELETE <admin-portal>/api/report/file/<name>    # 删除单份报告
```

## 7. 备份与恢复

**手动备份**：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

备份内容：NewAPI MySQL、Dify PostgreSQL、Ghost/Gitea SQLite、配置文件；输出到部署目录上一级 `backups/backup_<时间戳>/`，自动保留 N 天。Weaviate 向量库与 Redis 缓存不备份（可重建）。

**Admin Center 备份 API**：

```
POST <admin-portal>/api/backup/run        # 立即备份
GET  <admin-portal>/api/backup/list       # 备份列表
POST <admin-portal>/api/backup/restore    # 从指定备份恢复
```

**恢复**：`scripts/restore.ps1 -BackupDir <备份目录>`（先备份当前状态再覆盖）。

> 建议：每天自动备份（计划任务/cron），关键变更前手动备份。备份后验证文件完整（`backup.log`、备份目录大小）。

## 8. 统一管理门户（AI Admin Center）日常管理

入口：浏览器访问 `<admin-portal>` 地址（Keycloak 登录，需 `ai-platform-admin` 角色）。

| 功能 | API（详见 admin-api.md） | 说明 |
|---|---|---|
| 管理员管理 | `/api/admins*` | 管理员增删改查、角色授权、产品权限 |
| 认证/账号 | `/api/auth/overview`、`/api/keycloak/*` | SSO 总览、Keycloak 客户端/角色/用户、AD 用户同步 |
| NewAPI | `/api/newapi/*` | 渠道、令牌、用户、审计、成本 |
| Gitea | `/api/gitea/*` | 仓库总览、deepchat-sync 触发/历史/版本管理 |
| Ghost | `/api/ghost/*` | 门户概览、自动登录 |
| Dify | `/api/dify/overview`、`/api/dify/retrieve` | 应用/工作区概览、知识库检索测试 |
| MCP | `/api/mcp-gateway/*` | 已注册 server、聚合 Skill、工具列表、技能上传 |
| PII | `/api/pii/overview` | 脱敏规则与模型接入状态 |
| 监控 | `/api/monitoring/overview`、`/api/alerts` | 抓取目标、告警 |
| 日志 | `/api/logs/query` | Loki 聚合查询 |
| IM 告警 | `/api/imalert/*` | 告警规则、接收人（钉钉/企微/飞书）、测试、历史 |

## 8b. 三方产品原生管理

Admin Center 是统一入口，但**每个部署的三方产品也有自己的后台和原生 API**，日常管理可以直接对产品本身操作：

| 产品 | 后台 | 原生 API（认证） |
|---|---|---|
| Keycloak | `/admin/` | Admin REST `/admin/realms/…`（管理员 token） |
| NewAPI | `/ui/` | `/api/…`（session token Bearer） |
| LiteLLM | `/ui/` | `/v1/models`、`/user/*`（Bearer LITELLM_MASTER_KEY） |
| Dify | Console | `/v1/datasets/…`（Bearer DIFY_KNOWLEDGE_API_KEY） |
| Ghost | `/ghost/` | Admin API / SQLite（改前备份） |
| Gitea | `/admin` | `/api/v1/…`（Basic：GITEA_ADMIN_USER/PASS） |
| MCP Gateway | — | `/api/servers`、`/api/skills`（X-Admin-Token） |
| Grafana | 登录页 | `/api/…`（Basic：GRAFANA_ADMIN_USER/PASS） |
| Langfuse | 登录页 | `/api/public/…`（Basic：公钥/私钥） |
| Prometheus/Alertmanager/Loki | — | `/api/v1/…`、`/loki/api/v1/…`（内网无认证） |
| Update Server | — | 静态文件 + `version.txt` |

完整手册（各产品的入口、常用管理操作、凭据变量、安全提醒）见 **`references/products.md`**。统一原则：管理员账号 `ai_all_in_one_admin`，密码一律从 `.env` 读；直接动数据库前先备份。

## 9. Gitea 与 DeepChat 同步

- **触发同步**：`POST /api/gitea/sync/trigger`（或 Gitea Actions API dispatch `sync.yml` 工作流）
- **查看进度**：轮询 `/api/gitea/sync/history` + 读取 `sync-progress.json`
- **版本管理**：`/api/gitea/sync/versions` 列表、`/api/gitea/sync/version/<ver>` 操作、删除过期版本
- **计划**：`GET/POST /api/gitea/sync/schedule`（cron 表达式）、`/api/gitea/sync/config`

## 10. 升级与版本发布

**发布新版本**（项目根目录，PowerShell）：

```powershell
.\publish.ps1 -Gitee -CommitMessage "<说明>" -Version "vX.Y" -ReleaseNotes "<发布说明>"
# 不带 -Version 则不更新版本号；-Gitee 同时推 Gitee（中文 README 主版）
```

流程：同步 windows → windows-github（自动脱敏密码）→ 构建发布目录 → 推送 GitHub（main）→ 构建 Gitee 版（中文主 README）→ 推送 Gitee（master）→ 打 tag。

> ⚠️ GitHub 推送依赖网络/代理；推送失败先检查网络，再用 PowerShell 环境补推（Bash 非交互取不到 GitHub 凭据）。

**组件升级**：改 compose 镜像 tag → `docker compose pull <svc> && docker compose up -d <svc>` → 跑健康检查验证。大版本升级先备份。

**DeepChat 客户端**：Update Server 托管安装包（`deepchat-updates/`），Gitea 工作流发布后自动更新 `version.txt`。

## 11. 磁盘清理（先确认后执行）

1. 摸底：`docker system df`、`docker ps -a`（Exited 容器）、`backups/` 占用、旧镜像
2. 列出候选清单给用户确认后再删：
   - 悬挂镜像：`docker image prune`（加 `-f` 需用户确认）
   - 停止的容器、未用卷：`docker container prune` / `docker volume prune`
   - 过期备份：按保留策略删除 `backups/backup_*` 旧目录
3. 清理后跑健康检查确认无影响

## 12. 开机自启

```powershell
# Windows：注册开机自检（管理员 PowerShell）
powershell -ExecutionPolicy Bypass -File .\scripts\setup-autostart.ps1
```

计划任务登录后延迟运行 `health-check.ps1`，输出到日志文件。

## 13. 安全与合规提醒

- 管理员账号：各产品本地管理员统一 `ai_all_in_one_admin`（密码见 `.env`），Keycloak SSO 单点登录
- 数据不出内网：模型调用、提示词、文档都在自家服务器
- 对外发布/提交前：检查无真实密码/IP（publish.ps1 自动对 server.js 脱敏，但其它文件要人工核对）
