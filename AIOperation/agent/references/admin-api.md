# AI Admin Center API Reference

> AI Admin Center (`admin-portal`, Express) prefixes all management APIs with `/api`, protected by Keycloak OIDC;
> admin endpoints require the `ai-platform-admin` role. The base address `<admin-portal>` depends on the actual deployment (compose port mapping).
> Requests must carry a logged-in session Cookie; without a session, return 302 redirect to Keycloak login.

## 1. Session and System

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/me` | Current logged-in user and roles |
| GET | `/api/urls` | Entry URLs of each product (derived from the server public address) |
| GET | `/api/health` | Aggregated health of the whole platform |
| GET | `/api/health/:name` | Health of a single service |
| GET | `/api/system` | System info (Docker version/CPU/memory/images/container count) |
| GET | `/api/metrics` | Aggregated product business metrics (NewAPI/Gitea/Ghost/Dify/Keycloak/MCP/LiteLLM/PII/Monitoring/Langfuse) |

## 2. Admins and Permissions

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admins` / `/api/admins/search` | List admins / search |
| POST | `/api/admins` | Add admin |
| PUT/DELETE | `/api/admins/:id` | Update / delete admin |
| GET/PUT | `/api/admins/:id/products`、`/api/admins/:id/products/:product` | Product-level authorization |
| PUT | `/api/admins/:id/credentials` | Manage application credentials per product |

## 3. Authentication and Keycloak

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/overview` | SSO/auth overview |
| GET | `/api/keycloak/overview` | Keycloak overview (realm/user count/clients) |
| GET | `/api/keycloak/clients` | OIDC client list |
| GET | `/api/keycloak/users` / `/api/keycloak/users/:id` | User list / details |
| GET/POST | `/api/keycloak/roles`、`/api/keycloak/roles/:name` | Role management |
| GET | `/api/keycloak/roles/:name/users` | Role members |
| POST | `/api/keycloak/sync` | Trigger AD/LDAP user sync |

## 4. NewAPI (Model Gateway)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/newapi/overview` | Channel/token/user totals |
| GET/POST | `/api/newapi/channels` | List channels / add channel |
| GET/POST | `/api/newapi/tokens` | List API keys / generate |
| GET | `/api/newapi/users` | Users |
| GET | `/api/newapi/audit` | Call audit |
| GET | `/api/newapi/cost` | Cost statistics |

## 5. Gitea (Source Code + DeepChat Sync)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/gitea/overview` | Repo/user/version overview |
| GET | `/api/gitea/open` | Generate login-free open URL |
| GET/POST | `/api/gitea/sync/config` | Sync config (target platform/number of versions to retain) |
| GET | `/api/gitea/sync/history` | Sync history |
| GET/POST | `/api/gitea/sync/schedule` | Auto sync schedule (cron) |
| POST | `/api/gitea/sync/trigger` | Manually trigger sync |
| GET | `/api/gitea/sync/versions` | Synced versions |
| DELETE | `/api/gitea/sync/version/:ver` | Delete a version |

## 6. Ghost Portal / Dify

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/ghost/overview` | Post/page/member/tag statistics |
| POST | `/api/ghost/auto-login` | Admin login-free entry to Ghost admin |
| GET | `/api/dify/overview` | Dify apps/workspaces/versions |
| POST | `/api/dify/retrieve` | Knowledge base retrieval test |

## 7. MCP Gateway

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/mcp-gateway/servers` | List registered MCP servers / add |
| PUT/DELETE | `/api/mcp-gateway/servers/:name` | Update / delete server |
| GET/POST | `/api/mcp-gateway/skills` | List skills / add |
| DELETE | `/api/mcp-gateway/skills/:name` | Delete skill |
| POST | `/api/mcp-gateway/skills/upload` | Upload skill package |
| GET | `/api/mcp-gateway/tools` | Aggregated list of available tools |

## 8. Monitoring / Logs / PII / Updates

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/monitoring/overview` | Prometheus scrape targets and health |
| GET | `/api/alerts` | Current alerts |
| GET | `/api/logs/query` | Unified Loki log query |
| GET | `/api/pii/overview` | PII redaction rules and model integration |
| GET | `/api/litellm` / `/api/litellm/models` | LiteLLM status / model list |
| GET | `/api/langfuse/overview` | Langfuse call volume/cost overview |
| GET | `/api/update/overview` | Update server status and DeepChat version |

## 9. Availability Tests

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/availability` | Test item list + latest results + statistics |
| POST | `/api/availability/run` | Run full test suite (returns all results) |
| POST | `/api/availability/test/:id` | Single-item test (writes back cache and recomputes statistics, returns `{...result, summary}`) |

## 10. Backup / Reports / IM Alerts

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/backup/list` | Backup list |
| POST | `/api/backup/run` | Run full backup immediately |
| POST | `/api/backup/restore` | Restore from a specified backup |
| GET | `/api/report?days=&lang=&sections=` | Generate report (returns markdown + saves to server) |
| GET | `/api/report/list` | Historical reports + retention settings |
| GET | `/api/report/settings` / POST | Read / update retention policy (count/days) |
| GET | `/api/report/file/:name` | View historical report content |
| GET | `/api/report/file/:name/download` | Download .md |
| DELETE | `/api/report/file/:name` | Delete a single report |
| GET/POST | `/api/imalert/config` | Alert config (switch, etc.) |
| GET/PUT | `/api/imalert/rules` | Alert rules |
| GET | `/api/imalert/receivers`、POST/PUT/DELETE `/api/imalert/receivers/:id` | Receiver management |
| GET | `/api/imalert/history` | Alert send history |
| POST | `/api/imalert/test/:id` | Test a receiver |
| POST | `/api/alert-webhook` | Alertmanager alert callback entry |

## Call Examples

```bash
# Generate 7-day full-section report in Chinese
curl -b <session-cookie> "<admin-portal>/api/report?days=7&lang=zh&sections=system,usage,client,issues,avail,backup,pii"

# Single-item availability test (e.g. ghost)
curl -b <session-cookie> -X POST "<admin-portal>/api/availability/test/ghost"

# Trigger Gitea sync
curl -b <session-cookie> -X POST "<admin-portal>/api/gitea/sync/trigger"

# Query recent logs (Loki)
curl -b <session-cookie> "<admin-portal>/api/logs/query?q=error&since=1h"
```
