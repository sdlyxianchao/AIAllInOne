# 平台架构参考

> 通用描述，不绑定任何特定服务器 IP / 主机名 / 密码。所有凭据见部署目录的 `.env`。

## 1. 部署形态与目录布局

项目根目录同时维护三种部署形态，每个形态包含完整编排文件与文档：

| 形态 | 目录 | 编排 | 说明 |
|---|---|---|---|
| Windows 单机 | `windows/` | `windows/docker-compose.yml` | Docker Desktop + WSL2，PowerShell 脚本，含 Dify 独立 compose |
| Linux 单机 | `linux/` | `linux/docker-compose.yml` | bash 脚本（`health-check.sh` 等） |
| 纯 Docker 编排 | `docker/` | `docker/docker-compose.yml` | 与平台无关的通用编排 |

每个部署目录内：
- `scripts/` — 运维脚本（backup / restore / health-check / setup-autostart / ghost 系列）
- `monitoring/` — Prometheus / Alertmanager / Grafana / Loki / Promtail 配置
- `admin-portal/` — AI Admin Center（`server.js` 后端 + `public/index.html` 前端）
- `mcp-gateway/` — MCP 工具网关（`gateway.js` + `mcp-servers.json` + `skills/`）
- `dify/`（仅 Windows）— Dify 独立 compose 与配置
- `*-deploy-guide*.md/html` — 部署指南（含端口表、数据流、许可证审查）
- `*-checklist*.html` — 部署进度核对清单
- `.env` / `.env.windows` — 全部凭据（**脚本与文档不硬编码密码**）

## 2. 核心服务清单（compose 定义）

| 服务 | 角色 | 数据 |
|---|---|---|
| `keycloak` + `keycloak-db` | 统一认证 SSO / OIDC，AD/LDAP 联合 | PostgreSQL |
| `new-api` + `new-api-db` + `new-api-redis` | 模型网关：渠道/密钥/配额/审计/成本 | MySQL + Redis |
| `litellm` + `litellm-db` + `litellm-redis` | LLM 代理：脱敏（Presidio 联动）、语义缓存 | MySQL + Redis |
| `presidio-analyzer` / `presidio-anonymizer` | PII 识别与脱敏 | 无状态 |
| `ghost` | 企业门户（含自制 Corp Portal 主题） | SQLite |
| `mailhog` | 邮件测试（开发用） | 无 |
| `gitea` + `gitea-runner` | 代码托管 + CI/Actions Runner | SQLite |
| `update-server` | DeepChat 安装包托管与自动更新 | 静态文件 + version.txt |
| `admin-session-redis` | Admin Center 会话存储 | Redis |
| `admin-portal` | 统一管理门户（AI Admin Center） | 无（调用各产品 API） |
| `mcp-gateway` | MCP 工具网关（内置工具 + 聚合业务 MCP + 技能市场） | JSON 配置 |
| `cadvisor` / `prometheus` / `alertmanager` / `grafana` | 监控与告警 | Prometheus TSDB |
| `langfuse` 系列（postgres/redis/minio/clickhouse/worker） | LLM 调用可观测 | PostgreSQL + ClickHouse + MinIO |
| `loki` + `promtail` | 统一日志聚合 | Loki 存储 |

> Dify（AI 应用平台）是**独立 compose**（`windows/dify/`），模型供应商指向 NewAPI，SSO 走 Keycloak。

## 3. 数据与状态位置

| 数据 | 存放 |
|---|---|
| 业务数据库 | NewAPI → MySQL；Dify → PostgreSQL；Keycloak → PostgreSQL；Langfuse → ClickHouse；LiteLLM → MySQL |
| 文件型数据 | Ghost / Gitea → SQLite 文件；MinIO（Langfuse 对象）；Update Server 安装包 |
| 配置 | `.env`、`litellm-config.yaml`、`mcp-servers.json`、`monitoring/*.yml`、compose 文件 |
| 备份 | 部署目录上一级 `backups/`（`backup_<时间戳>/` 目录，自动保留 N 天） |
| 报告 | `backups/reports/`（AI Admin Center 生成的历史报告） |

## 4. 运维脚本清单

| 脚本 | 作用 |
|---|---|
| `scripts/backup.ps1` | 全量备份：NewAPI MySQL（mysqldump）、Dify PostgreSQL（pg_dump）、Ghost/Gitea SQLite（WAL checkpoint 后复制）、配置文件；保留 N 天自动清理 |
| `scripts/restore.ps1` | 从指定备份目录恢复数据库与配置文件 |
| `scripts/health-check.ps1`（Windows）/ `health-check.sh`（Linux） | 一键健康检查：Docker 就绪、容器状态、HTTP 端点、内部健康、LLM 全链路、AD 认证链路、MCP+Skill、DeepChat/Dify 前置、磁盘空间，9 阶段输出报告 |
| `scripts/setup-autostart.ps1` | 注册开机自检计划任务（登录后延迟运行健康检查） |
| `scripts/ghost-setup.ps1` / `ghost-theme-setup.ps1` / `ghost-activate-theme.js` | Ghost 初始化、主题安装与激活 |
| `scripts/ghost-content-import.ps1` / `.js` | 导入门户示例内容（需提供发布地址与语言） |
| `scripts/setup-hyperv-dc-network.ps1` | Hyper-V 内网交换机 + 域控 VM 网络配置（AD 场景） |
| `publish.ps1`（项目根） | 版本发布：同步 + 脱敏 + 构建 + 提交 + 推送 GitHub/Gitee（可打 tag） |

## 5. 管理入口（AI Admin Center）

- 前端：`admin-portal/public/index.html`（单文件应用，含 9 语言 i18n 与深浅主题）
- 后端：`admin-portal/server.js`（Express，端口/挂载卷由 compose 定义，全部 API 前缀 `/api`）
- 认证：Keycloak OIDC（`ai-platform-admin` 角色授权管理功能）
- 内部产品管理员统一 `ai_all_in_one_admin`（各产品本地管理员 + Keycloak SSO）

## 6. 文档地图

- 部署指南：`<形态>/*-deploy-guide-v2.md`（或 .html / .en.html），含端口表、数据流、许可审查、AD 集成
- 管理员手册：`docs/admin-manual/`（30 章：部署→运维→备份→故障排查，含 9 语言 `docs/i18n/`）
- 用户手册：`docs/user-manual/`
- AI 运维指南：`AI-AGENT-OPS.md`（9 语言）
- 部署进度清单：`<形态>/*-checklist.html`（浏览器勾选，localStorage 保存）
