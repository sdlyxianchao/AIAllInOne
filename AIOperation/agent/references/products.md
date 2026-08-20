# Third-Party Product Native Management Guide

> Each deployed third-party product has its own admin console and native API. Daily management can go through AI Admin Center (unified entry, see admin-api.md),
> or directly manage each product itself (this guide).
> Common conventions: the local admin for all products is uniformly `ai_all_in_one_admin` (password from the corresponding variable in `.env` under the deployment directory);
> external access ports follow the port tables in the corresponding deployment guides (this guide does not hardcode ports, using internal container addresses + placeholders);
> read all credentials from `.env`; hardcoding or printing them is forbidden.

## 1. Keycloak — Unified Authentication (SSO/OIDC)

| Item | Description |
|---|---|
| Admin console | `<keycloak>/admin/` (master realm admin login) |
| Admin API | Admin REST API: `<keycloak>/admin/realms/{realm}/…` (RESTful, token auth) |
| Credentials | Admin account/password (.env); OIDC clients: `AI-all-in-one-admin-portal`, `newapi`, etc. |

**Common admin operations**:
- View/manage realms (`enterprise-ai`): users, roles, clients
- Role management: create and assign realm roles such as `ai-platform-admin`
- User management: create/disable users, reset passwords, view roles
- AD/LDAP federation: user sync (`POST <admin-portal>/api/keycloak/sync` or manual sync in the Keycloak console)
- OIDC clients: Redirect URIs (must be updated after changing domain/port), Client Secret
- Token flow: get admin token from `<keycloak>/realms/{realm}/protocol/openid-connect/token`

## 2. NewAPI — Model Gateway

| Item | Description |
|---|---|
| Admin console | `<newapi>/ui/` (admin login, SSO or local account) |
| Admin API | `<newapi>/api/…` (session token Bearer after login) |
| Credentials | `NEWAPI_ADMIN_USERNAME` / `NEWAPI_ADMIN_PASSWORD` (.env); app tokens `deepchat-key` / `dify-key` |

**Common admin operations**:
- Channel management: `/api/channel/` (list/add/edit/delete/test), channel types (OpenAI-compatible, etc.)
- Token management: `/api/token/` (generate/disable), quota and expiry
- User management: `/api/user/` (list/disable/delete, Bearer session token)
- Audit and cost: `/api/log/` (call logs), `/api/data/dashboard` (dashboard)
- Model pricing/rate limits: channel-level configuration

## 3. LiteLLM — LLM Proxy (with Presidio Redaction)

| Item | Description |
|---|---|
| Admin console | `<litellm>/ui/` (proxy_admin role login) |
| Admin API | `<litellm>/user/…`, `/v1/models`, etc. (Bearer LITELLM_MASTER_KEY) |
| Credentials | `LITELLM_MASTER_KEY` (.env); `litellm-config.yaml` defines models/guardrails |

**Common admin operations**:
- Model list: `GET /v1/models` (Bearer master key)
- User roles: `POST /user/new`, `POST /user/update` (user_role), `POST /user/delete`
- Model integration: edit `litellm-config.yaml` (models, routing, cost) → `docker restart litellm`
- Semantic cache: litellm-redis (`docker exec litellm-redis redis-cli ping`)
- PII redaction: Presidio analyzer/anonymizer health (`/health`); guardrail rules in `litellm-config.yaml`

## 4. Dify — AI Application Platform (standalone compose)

| Item | Description |
|---|---|
| Admin console | `<dify>` (Console, admin `DIFY_ADMIN_EMAIL`/`DIFY_ADMIN_PASSWORD`) |
| Knowledge base API | `/v1/datasets/…` (Bearer `DIFY_KNOWLEDGE_API_KEY`) |
| Data | PostgreSQL (`docker-db_postgres-1`, etc.; DB password in .env) |

**Common admin operations**:
- App management: create/edit/publish Chatflow/Workflow/Agent apps
- Knowledge bases: upload documents, chunking, retrieval test (`POST <admin-portal>/api/dify/retrieve` or Console)
- Model providers: point to NewAPI channels (deepseek, etc.), configure API Key
- Users/workspaces: admin management, member invitations
- SSO: Keycloak OIDC login configuration

## 5. Ghost — Enterprise Portal

| Item | Description |
|---|---|
| Admin console | `<ghost>/ghost/` (Admin, email login or SSO auto-login) |
| Admin API | Admin API (staff token) / Content API (public key); data in SQLite |
| Credentials | `GHOST_ADMIN_EMAIL` (.env); login password in the credentials table |

**Common admin operations**:
- Content: publish/edit posts and pages, manage tags and navigation
- Themes: `ghost-theme-corp-portal` (in-house theme), install/activate with `ghost-theme-setup.ps1` / `ghost-activate-theme.js`
- Content import: `ghost-content-import.ps1` (requires publish address and language)
- Direct SQLite access: `docker exec ghost sqlite3 /var/lib/ghost/content/data/ghost.db …` (back up before modifying)
- Members and email (MailHog test environment)

## 6. Gitea — Source Hosting + CI

| Item | Description |
|---|---|
| Admin console | `<gitea>` (`/admin` admin) |
| Admin API | REST: `<gitea>/api/v1/…` (Basic auth: `GITEA_ADMIN_USERNAME`/`GITEA_ADMIN_PASSWORD`) |
| CI | Actions + Runner (`gitea-runner`, `gitea-runner-config.yaml`) |

**Common admin operations**:
- Repos: create/migrate/delete, branches and releases (tags)
- Users and organizations: members, permissions
- Actions: manually trigger workflows (e.g. `sync.yml` of deepchat-sync), view run status and logs
- Release management: publish/delete tags (distribute DeepChat packages with Update Server)
- Runner status: `docker ps | grep gitea-runner` (Idle/Running)

## 7. MCP Gateway — Tool Gateway

| Item | Description |
|---|---|
| Admin API | `<mcp-gateway>/api/servers`, `/api/skills`, `/api/tools` (`X-Admin-Token: MCP_ADMIN_TOKEN`) |
| MCP endpoint | Streamable HTTP `<mcp-gateway>/mcp` (for clients) |
| Config | `mcp-gateway/mcp-servers.json`, `gateway.js` |

**Common admin operations**:
- Register/remove business MCP servers (`mcp-servers.json` → `docker restart mcp-gateway`)
- Skill marketplace: `skills/` directory (dynamically packaged and distributed; changes take effect immediately without restart); upload/delete skills
- Tool list: `GET /api/tools` (aggregates all available tools for clients such as DeepChat to discover)

## 8. Monitoring & Alerting: Prometheus / Alertmanager / Grafana

| Item | Description |
|---|---|
| Grafana console | `<grafana>` (SSO or `GRAFANA_ADMIN_USERNAME`/`GRAFANA_ADMIN_PASSWORD`) |
| Grafana API | `<grafana>/api/…` (Basic auth; `/api/orgs`, `/api/users`, `/api/admin/users`) |
| Prometheus API | `<prometheus>/api/v1/…` (intranet, no auth: targets/query/status) |
| Config | `monitoring/prometheus.yml`, `monitoring/alerts.yml`, `monitoring/alertmanager.yml`, `monitoring/grafana/` |

**Common admin operations**:
- Grafana: dashboard management, data sources, user/org permissions, alert notification channels
- Prometheus: `GET /api/v1/targets` (up status), `/api/v1/query` (metric queries), rule status
- Alertmanager: alert rules and routing (`alerts.yml`/`alertmanager.yml`), silence management
- Add monitoring targets: edit scrape config in `prometheus.yml` → `docker restart prometheus`

## 9. Langfuse — LLM Observability

| Item | Description |
|---|---|
| Admin console | `<langfuse>` (SSO login) |
| Admin API | Public API: `<langfuse>/api/public/…` (Basic: public/secret key); health `/api/public/health` |
| Data | PostgreSQL + ClickHouse + MinIO (`langfuse-clickhouse`, etc.) |

**Common admin operations**:
- Projects and keys: Public/Secret Key management
- Trace viewing: call details (model/latency/token/cost)
- Datasets and annotations, Prompt management
- Usage statistics and alerts

## 10. Loki — Unified Logging

| Item | Description |
|---|---|
| Health | `<loki>/ready` |
| Query API | `<loki>/loki/api/v1/query_range` (LogQL, intranet, no auth) |
| Collection | `promtail` (`monitoring/promtail.yml` configures labels and paths) |

**Common admin operations**:
- Log queries: Admin Center log page (`GET <admin-portal>/api/logs/query`) or direct LogQL
- Collection config: edit `promtail.yml` (add container log paths/labels) → `docker restart promtail`
- Retention policy: Loki config (`monitoring/loki.yml`)

## 11. Update Server / DeepChat

| Item | Description |
|---|---|
| Update Server | Statically hosts DeepChat packages + `version.txt` (`deepchat-updates/` directory) |
| Management | Replace packages/edit `version.txt` → clients auto-prompt for updates |
| DeepChat | Desktop client: Provider points to NewAPI; MCP points to MCP Gateway; Skill marketplace |

**Common admin operations**:
- Publish a new version: Gitea workflow (deepchat-sync) → update Update Server directory → update `version.txt`
- Client troubleshooting: Provider config, MCP connection (`<mcp-gateway>/mcp`), logs

## 12. MailHog (Dev Mail)

- Console: `<mailhog>` (Web UI to view dev environment emails)
- API: `/api/v1/messages` (no auth, dev environment only)
- Purpose: email testing for products like Ghost; no real external delivery

---

### General Security Reminders

- Read all native API credentials (admin passwords, master keys, API keys, tokens) from the corresponding variables in `.env`
- Back up before directly operating databases (Ghost SQLite, other DBs) (`scripts/backup.ps1` or `POST /api/backup/run`)
- After changing config (yaml/json), apply per the rule: "in-volume code: restart; compose config: up -d to rebuild"
- List all items for user confirmation before any deletion operation
