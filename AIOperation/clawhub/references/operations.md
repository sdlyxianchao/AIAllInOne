# Daily Operations Manual

> Covers all day-to-day administration of the AI AllInOne platform. All paths/ports/credentials follow the common conventions:
> Paths are located relatively (scripts use `$PSScriptRoot` to automatically follow the deployment directory); ports follow the port table in the corresponding deployment guide;
> Passwords are always read from `.env` — never hardcode or print them.

## 1. Health Check and Status Overview

**One-click health check** (recommended, covers 41 containers across 9 stages: Docker readiness / container status / HTTP endpoints / internal health / full LLM chain / AD authentication chain / MCP+Skill / login prerequisites / disk space):

```powershell
# Windows (from the deployment directory)
powershell -ExecutionPolicy Bypass -File .\scripts\health-check.ps1
# Linux
./health-check.sh
```

Results are written to the console + `health_check_<timestamp>.log`; an ending `ALL CLEAR` with `Fail: 0` means everything is normal.

**Quick overview** (Admin Center health API, requires an admin session):

```
GET <admin-portal>/api/health          # Platform-wide health aggregation
GET <admin-portal>/api/system          # System info (container count / CPU / memory / images)
GET <admin-portal>/api/metrics         # Product business metrics aggregation
GET <admin-portal>/api/monitoring/overview  # Prometheus scrape targets
GET <admin-portal>/api/availability    # Latest availability test results + test item list
```

**Container status**: `docker compose ps` / `docker ps -a`, watch for `Up` (healthy), `Exited`, `Restarting`.

## 2. Container Management

```bash
docker compose up -d              # Start/update all services (applies only when compose config changes)
docker compose up -d <svc>        # Start a single service
docker restart <svc>              # Restart (required after editing code inside a volume)
docker stop <svc> && docker start <svc>
docker compose logs -f <svc>      # Follow logs
```

> ⚠️ **Code change rules**: After changing backend code (e.g., `admin-portal/server.js`), run `docker restart admin-portal`; `docker compose up -d` only detects compose config changes and does not reload files inside volumes. After changing frontend static files (`public/index.html`), refresh the browser (Ctrl+F5 recommended).

## 3. Log Investigation

- **Single container logs**: `docker logs <svc> --tail 100` (add `--since 1h` for recent entries)
- **Aggregated logs** (Loki): `GET <admin-portal>/api/logs/query?q=<lucene_query>&since=<time>` (same source as the Admin Center unified log page)
- **Alerts**: `GET <admin-portal>/api/alerts` to view currently firing alerts; Alertmanager config is in `monitoring/alertmanager.yml`

## 4. Configuration Changes

1. Edit the config file (`.env`, `litellm-config.yaml`, `monitoring/*.yml`, `mcp-servers.json`, compose files, etc.)
2. Apply per type: env vars / mount config → `docker compose up -d` (rebuilds changed services); in-volume code → `docker restart <svc>`
3. Verify after changes: health API / `docker compose ps` / real requests

**AI Admin Center secondary development**: edit `admin-portal/public/index.html` (frontend, apply via browser refresh) or `admin-portal/server.js` (backend, apply via `docker restart admin-portal`). After changing JS, validate syntax with Node before restarting.

## 5. Availability Tests

```
POST <admin-portal>/api/availability/run       # Run all (20 items: auth / LLM chain / chat / each service / SSO)
POST <admin-portal>/api/availability/test/<id> # Run a single test
GET  <admin-portal>/api/availability           # Latest results + summary + test item list
```

Sample test items: `keycloak`, `newapi`, `litellm`, `chat-deepchat`, `chat-dify`, `dify`, `ghost`, `gitea`, `mcp`, `prometheus`, `grafana`, `langfuse`, `loki`, `presidio`, `sso-grafana`, `sso-langfuse`, `update-server`, `backup`, `docker`, `redis`. The test interval is a platform-level parameter (configured at deployment); changing it requires editing the backend and restarting.

## 6. Report Generation

```
GET <admin-portal>/api/report?days=<1-365>&lang=<zh|en|...>&sections=<system,usage,client,issues,avail,backup,pii>
GET <admin-portal>/api/report/list              # Historical reports + retention settings
GET <admin-portal>/api/report/file/<name>       # View a historical report (markdown)
GET <admin-portal>/api/report/file/<name>/download
POST <admin-portal>/api/report/settings         # Retention policy (count / days)
DELETE <admin-portal>/api/report/file/<name>    # Delete a single report
```

## 7. Backup and Restore

**Manual backup**:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

Backup contents: NewAPI MySQL, Dify PostgreSQL, Ghost/Gitea SQLite, config files; output goes to `backups/backup_<timestamp>/` one level above the deployment directory, retained automatically for N days. The Weaviate vector store and Redis cache are not backed up (they can be rebuilt).

**Admin Center backup API**:

```
POST <admin-portal>/api/backup/run        # Run a backup immediately
GET  <admin-portal>/api/backup/list       # Backup list
POST <admin-portal>/api/backup/restore    # Restore from a specified backup
```

**Restore**: `scripts/restore.ps1 -BackupDir <backup_directory>` (backs up the current state before overwriting).

> Recommendation: automate daily backups (scheduled task / cron), and run manual backups before critical changes. Verify file integrity after backup (`backup.log`, backup directory size).

## 8. Unified Admin Portal (AI Admin Center) Day-to-Day Management

Entry: open `<admin-portal>` in a browser (Keycloak login, requires the `ai-platform-admin` role).

| Function | API (see admin-api.md) | Notes |
|---|---|---|
| Admin management | `/api/admins*` | Admin CRUD, role grants, product permissions |
| Authentication/accounts | `/api/auth/overview`、`/api/keycloak/*` | SSO overview, Keycloak clients/roles/users, AD user sync |
| NewAPI | `/api/newapi/*` | Channels, tokens, users, audit, cost |
| Gitea | `/api/gitea/*` | Repository overview, deepchat-sync trigger/history/version management |
| Ghost | `/api/ghost/*` | Portal overview, auto login |
| Dify | `/api/dify/overview`、`/api/dify/retrieve` | App/workspace overview, knowledge base retrieval tests |
| MCP | `/api/mcp-gateway/*` | Registered servers, aggregated skills, tool lists, skill uploads |
| PII | `/api/pii/overview` | Redaction rules and model integration status |
| Monitoring | `/api/monitoring/overview`、`/api/alerts` | Scrape targets, alerts |
| Logs | `/api/logs/query` | Loki aggregated queries |
| IM alerts | `/api/imalert/*` | Alert rules, recipients (DingTalk/WeCom/Feishu), tests, history |

## 8b. Native Management of Third-Party Products

Admin Center is the unified entry point, but **every deployed third-party product also has its own admin UI and native API**; day-to-day administration can be done directly against the products themselves:

| Product | Admin UI | Native API (auth) |
|---|---|---|
| Keycloak | `/admin/` | Admin REST `/admin/realms/…` (admin token) |
| NewAPI | `/ui/` | `/api/…` (session token Bearer) |
| LiteLLM | `/ui/` | `/v1/models`、`/user/*` (Bearer LITELLM_MASTER_KEY) |
| Dify | Console | `/v1/datasets/…` (Bearer DIFY_KNOWLEDGE_API_KEY) |
| Ghost | `/ghost/` | Admin API / SQLite (back up before changing) |
| Gitea | `/admin` | `/api/v1/…` (Basic: GITEA_ADMIN_USER/PASS) |
| MCP Gateway | — | `/api/servers`、`/api/skills` (X-Admin-Token) |
| Grafana | Login page | `/api/…` (Basic: GRAFANA_ADMIN_USER/PASS) |
| Langfuse | Login page | `/api/public/…` (Basic: public key/private key) |
| Prometheus/Alertmanager/Loki | — | `/api/v1/…`、`/loki/api/v1/…` (no auth on internal network) |
| Update Server | — | Static files + `version.txt` |

Full manual (entry points, common admin operations, credential variables, security reminders for each product): see **`references/products.md`**. Common conventions: admin account `ai_all_in_one_admin`, passwords always read from `.env`; back up before touching databases directly.

## 9. Gitea and DeepChat Sync

- **Trigger sync**: `POST /api/gitea/sync/trigger` (or dispatch the `sync.yml` workflow via the Gitea Actions API)
- **Watch progress**: poll `/api/gitea/sync/history` + read `sync-progress.json`
- **Version management**: `/api/gitea/sync/versions` list, `/api/gitea/sync/version/<ver>` operations, delete outdated versions
- **Schedule**: `GET/POST /api/gitea/sync/schedule` (cron expression)、`/api/gitea/sync/config`

## 10. Upgrades and Releases

**Publish a new release** (project root, PowerShell):

```powershell
.\publish.ps1 -Gitee -CommitMessage "<description>" -Version "vX.Y" -ReleaseNotes "<release notes>"
# Without -Version the version number is not bumped; -Gitee also pushes to Gitee (primary Chinese README)
```

Flow: sync windows → windows-github (passwords auto-redacted) → build release directory → push GitHub (main) → build Gitee version (Chinese primary README) → push Gitee (master) → tag.

> ⚠️ Pushing to GitHub depends on the network/proxy; if the push fails, check the network first, then push the remainder using the PowerShell environment (Bash non-interactive sessions cannot retrieve GitHub credentials).

**Component upgrades**: change the compose image tag → `docker compose pull <svc> && docker compose up -d <svc>` → run the health check to verify. Back up before major version upgrades.

**DeepChat client**: Update Server hosts the installer packages (`deepchat-updates/`); `version.txt` is updated automatically after the Gitea workflow publishes.

## 11. Disk Cleanup (Confirm First, Then Execute)

1. Survey: `docker system df`, `docker ps -a` (Exited containers), `backups/` usage, old images
2. List candidate items for user confirmation before deleting:
   - Dangling images: `docker image prune` (add `-f` only after user confirmation)
   - Stopped containers, unused volumes: `docker container prune` / `docker volume prune`
   - Expired backups: delete old `backups/backup_*` directories per the retention policy
3. Run the health check after cleanup to confirm no impact

## 12. Autostart on Boot

```powershell
# Windows: register autostart health check (admin PowerShell)
powershell -ExecutionPolicy Bypass -File .\scripts\setup-autostart.ps1
```

The scheduled task runs `health-check.ps1` after login with a delay, writing output to a log file.

## 13. Security and Compliance Reminders

- Admin accounts: all product-local admins use `ai_all_in_one_admin` uniformly (passwords in `.env`), Keycloak SSO single sign-on
- Data stays inside the internal network: model calls, prompts, and documents remain on your own servers
- Before external publication/push: verify there are no real passwords/IPs (publish.ps1 redacts `server.js` automatically, but other files must be reviewed manually)
