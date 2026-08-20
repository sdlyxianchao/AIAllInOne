# 三方产品原生管理手册

> 每个部署的三方产品都有自己的管理后台和原生 API。日常管理既可通过 AI Admin Center（统一入口，见 admin-api.md），
> 也可**直接管理各产品本身**（本手册）。
> 通用约定：各产品本地管理员统一 `ai_all_in_one_admin`（密码见部署目录 `.env` 的对应变量）；
> 外部访问端口以对应部署指南的端口表为准（本手册不写死端口，用内部容器地址 + 占位符描述）；
> 所有凭据从 `.env` 读取，禁止硬编码与打印。

## 1. Keycloak — 统一认证（SSO/OIDC）

| 项 | 说明 |
|---|---|
| 管理后台 | `<keycloak>/admin/`（master realm 管理员登录） |
| 管理 API | Admin REST API：`<keycloak>/admin/realms/{realm}/…`（RESTful，token 认证） |
| 凭据 | 管理员账号/密码（.env）；OIDC client：`AI-all-in-one-admin-portal`、`newapi` 等 |

**常用管理操作**：
- 查看/管理 realm（`enterprise-ai`）：用户、角色、客户端
- 角色管理：`ai-platform-admin` 等 realm role 的创建与分配
- 用户管理：创建/禁用用户、重置密码、查看角色
- AD/LDAP 联合：用户同步（`POST <admin-portal>/api/keycloak/sync` 或 Keycloak 控制台手动同步）
- OIDC 客户端：Redirect URIs（改域名/端口后必须同步更新）、Client Secret
- token 流程：`<keycloak>/realms/{realm}/protocol/openid-connect/token` 拿管理 token

## 2. NewAPI — 模型网关

| 项 | 说明 |
|---|---|
| 管理后台 | `<newapi>/ui/`（管理员登录，SSO 或本地账号） |
| 管理 API | `<newapi>/api/…`（登录后 session token Bearer） |
| 凭据 | `NEWAPI_ADMIN_USERNAME` / `NEWAPI_ADMIN_PASSWORD`（.env）；应用令牌 `deepchat-key` / `dify-key` |

**常用管理操作**：
- 渠道管理：`/api/channel/`（列表/新增/编辑/删除/测试），渠道类型（OpenAI 兼容等）
- 令牌管理：`/api/token/`（生成/禁用），配额与过期时间
- 用户管理：`/api/user/`（列表/禁用/删除，Bearer session token）
- 审计与成本：`/api/log/`（调用日志）、`/api/data/dashboard`（看板）
- 模型定价/限流：渠道级配置

## 3. LiteLLM — LLM 代理（含 Presidio 脱敏）

| 项 | 说明 |
|---|---|
| 管理后台 | `<litellm>/ui/`（proxy_admin 角色登录） |
| 管理 API | `<litellm>/user/…`、`/v1/models` 等（Bearer LITELLM_MASTER_KEY） |
| 凭据 | `LITELLM_MASTER_KEY`（.env）；`litellm-config.yaml` 定义模型/guardrails |

**常用管理操作**：
- 模型列表：`GET /v1/models`（Bearer master key）
- 用户角色：`POST /user/new`、`POST /user/update`（user_role）、`POST /user/delete`
- 模型接入：编辑 `litellm-config.yaml`（模型、路由、成本）→ `docker restart litellm`
- 语义缓存：litellm-redis（`docker exec litellm-redis redis-cli ping`）
- PII 脱敏：Presidio analyzer/anonymizer 健康（`/health`）；guardrails 规则在 `litellm-config.yaml`

## 4. Dify — AI 应用平台（独立 compose）

| 项 | 说明 |
|---|---|
| 管理后台 | `<dify>`（Console，管理员 `DIFY_ADMIN_EMAIL`/`DIFY_ADMIN_PASSWORD`） |
| 知识库 API | `/v1/datasets/…`（Bearer `DIFY_KNOWLEDGE_API_KEY`） |
| 数据 | PostgreSQL（`docker-db_postgres-1` 等，DB 密码见 .env） |

**常用管理操作**：
- 应用管理：创建/编辑 Chatflow/Workflow/Agent 应用、发布
- 知识库：上传文档、分段、检索测试（`POST <admin-portal>/api/dify/retrieve` 或 Console）
- 模型供应商：指向 NewAPI 渠道（deepseek 等），配置 API Key
- 用户/工作区：管理员管理、成员邀请
- SSO：Keycloak OIDC 登录配置

## 5. Ghost — 企业门户

| 项 | 说明 |
|---|---|
| 管理后台 | `<ghost>/ghost/`（Admin，邮箱登录或 SSO 自动登录） |
| 管理 API | Admin API（staff token）/ Content API（public key）；数据在 SQLite |
| 凭据 | `GHOST_ADMIN_EMAIL`（.env）；登录密码见凭据表 |

**常用管理操作**：
- 内容：发布/编辑文章与页面、管理标签与导航
- 主题：`ghost-theme-corp-portal`（自制主题），`ghost-theme-setup.ps1` / `ghost-activate-theme.js` 安装激活
- 内容导入：`ghost-content-import.ps1`（需提供发布地址与语言）
- 直接操作 SQLite：`docker exec ghost sqlite3 /var/lib/ghost/content/data/ghost.db …`（改前先备份）
- 成员与邮件（MailHog 测试环境）

## 6. Gitea — 源码托管 + CI

| 项 | 说明 |
|---|---|
| 管理后台 | `<gitea>`（`/admin` 管理员） |
| 管理 API | REST：`<gitea>/api/v1/…`（Basic auth：`GITEA_ADMIN_USERNAME`/`GITEA_ADMIN_PASSWORD`） |
| CI | Actions + Runner（`gitea-runner`，`gitea-runner-config.yaml`） |

**常用管理操作**：
- 仓库：创建/迁移/删除、分支与版本（tag）
- 用户与组织：成员、权限
- Actions：手动触发工作流（如 deepchat-sync 的 `sync.yml`）、查看 run 状态与日志
- 版本管理：发布/删除 tag（配合 Update Server 分发 DeepChat 安装包）
- Runner 状态：`docker ps | grep gitea-runner`（Idle/Running）

## 7. MCP Gateway — 工具网关

| 项 | 说明 |
|---|---|
| 管理 API | `<mcp-gateway>/api/servers`、`/api/skills`、`/api/tools`（`X-Admin-Token: MCP_ADMIN_TOKEN`） |
| MCP 端点 | Streamable HTTP `<mcp-gateway>/mcp`（客户端用） |
| 配置 | `mcp-gateway/mcp-servers.json`、`gateway.js` |

**常用管理操作**：
- 注册/移除业务 MCP server（`mcp-servers.json` → `docker restart mcp-gateway`）
- 技能市场：`skills/` 目录（动态打包分发，改完即时生效无需重启）；上传/删除技能
- 工具列表：`GET /api/tools`（聚合全部可用工具，供 DeepChat 等客户端发现）

## 8. 监控告警：Prometheus / Alertmanager / Grafana

| 项 | 说明 |
|---|---|
| Grafana 后台 | `<grafana>`（SSO 或 `GRAFANA_ADMIN_USERNAME`/`GRAFANA_ADMIN_PASSWORD`） |
| Grafana API | `<grafana>/api/…`（Basic auth；`/api/orgs`、`/api/users`、`/api/admin/users`） |
| Prometheus API | `<prometheus>/api/v1/…`（内网无认证：targets/query/status） |
| 配置 | `monitoring/prometheus.yml`、`monitoring/alerts.yml`、`monitoring/alertmanager.yml`、`monitoring/grafana/` |

**常用管理操作**：
- Grafana：看板管理、数据源、用户/组织权限、告警通知渠道
- Prometheus：`GET /api/v1/targets`（up 状态）、`/api/v1/query`（指标查询）、规则状态
- Alertmanager：告警规则与路由（`alerts.yml`/`alertmanager.yml`）、静默（silence）管理
- 加监控项：改 `prometheus.yml` scrape 配置 → `docker restart prometheus`

## 9. Langfuse — LLM 可观测

| 项 | 说明 |
|---|---|
| 管理后台 | `<langfuse>`（SSO 登录） |
| 管理 API | Public API：`<langfuse>/api/public/…`（Basic：公钥/私钥）；健康 `/api/public/health` |
| 数据 | PostgreSQL + ClickHouse + MinIO（`langfuse-clickhouse` 等） |

**常用管理操作**：
- 项目与密钥：Public/Secret Key 管理
- Trace 查看：调用明细（模型/耗时/token/成本）
- 数据集与标注、Prompt 管理
- 用量统计与告警

## 10. Loki — 统一日志

| 项 | 说明 |
|---|---|
| 健康 | `<loki>/ready` |
| 查询 API | `<loki>/loki/api/v1/query_range`（LogQL，内网无认证） |
| 采集 | `promtail`（`monitoring/promtail.yml` 配置标签与路径） |

**常用管理操作**：
- 日志查询：Admin Center 日志页（`GET <admin-portal>/api/logs/query`）或直接 LogQL
- 采集配置：改 `promtail.yml`（新增容器日志路径/标签）→ `docker restart promtail`
- 保留策略：Loki 配置（`monitoring/loki.yml`）

## 11. Update Server / DeepChat

| 项 | 说明 |
|---|---|
| Update Server | 静态托管 DeepChat 安装包 + `version.txt`（`deepchat-updates/` 目录） |
| 管理 | 替换安装包/改 `version.txt` → 客户端自动提示更新 |
| DeepChat | 桌面客户端：Provider 指向 NewAPI；MCP 指向 MCP Gateway；Skill 市场 |

**常用管理操作**：
- 发布新版本：Gitea 工作流（deepchat-sync）→ Update Server 目录更新 → `version.txt` 更新
- 客户端排障：Provider 配置、MCP 连接（`<mcp-gateway>/mcp`）、日志

## 12. MailHog（开发邮箱）

- 后台：`<mailhog>`（Web UI 查看开发环境邮件）
- API：`/api/v1/messages`（无认证，仅开发环境）
- 用途：Ghost 等产品邮件测试，不发真实外网

---

### 通用安全提醒

- 所有原生 API 的凭据（admin 密码、master key、API key、token）一律从 `.env` 对应变量读取
- 直接操作数据库（Ghost SQLite、各 DB）前先备份（`scripts/backup.ps1` 或 `POST /api/backup/run`）
- 改配置（yaml/json）后按"卷内代码 restart、compose 配置 up -d 重建"规则生效
- 任何删除操作先列出清单给用户确认
