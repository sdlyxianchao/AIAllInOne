# Troubleshooting Manual

> General troubleshooting approach; run all commands from the deployment directory; ports/paths follow the actual deployment.

## 1. Containers Won't Start / Restart Looping

Investigation order:
1. `docker ps -a` to check status (`Exited` / `Restarting`) and exit codes
2. `docker logs <svc> --tail 100` to check errors (look for `Error`, `FATAL`, connection failures)
3. Common causes:
   - **Port conflict**: host port already in use → `netstat -ano | findstr <port>` to find the occupant, change the compose mapping or stop the conflicting process
   - **Dependency not up**: DB before app → confirm the dependency service is healthy (`docker compose ps`)
   - **Config/env var wrong**: `.env` missing entries or wrong format → check the corresponding variables
   - **Image pull failure**: network/registry → retry or switch mirror source
4. After fixing, `docker restart <svc>` or `docker compose up -d <svc>`, then verify with `docker ps`

## 2. Login / OIDC Issues

| Symptom | Investigation |
|---|---|
| `invalid_grant - Incorrect redirect_uri` after login | Access via the internal IP, not 127.0.0.1/localhost; check the Valid Redirect URIs of the Keycloak client |
| SSO login does nothing in a product | Check Keycloak client config (client id/secret, redirect), realm correctness; query status via `/api/keycloak/overview` |
| AD users won't sync | Trigger via `POST /api/keycloak/sync`, check the sync log; check the LDAP connection (domain controller address/credentials in .env) |
| Admin cannot access admin features | Check whether the account has the `ai-platform-admin` role (`/api/keycloak/roles/:name/users`) |

## 3. Code/Config Changes Not Taking Effect

- **Frontend (index.html)**: refresh the browser after editing, use Ctrl+F5 if needed (cache)
- **Backend (in-volume code such as server.js)**: must run `docker restart admin-portal`; `docker compose up -d` does not reload in-volume code
- **Compose config / env vars**: `docker compose up -d` (rebuilds changed services); confirm `docker compose config` is valid
- **Typical symptom**: after a backend change, the frontend API returns HTML instead of JSON (`Unexpected token '<'`) → the container is still running old code, restart it

## 4. Model Call Issues

- **Call errors/timeouts**: `POST /api/availability/test/chat-dsh` to test the chain (DSH Desktop → NewAPI → LiteLLM → external model); `GET /api/litellm/models` to check model registration; NewAPI channel status `/api/newapi/channels`
- **Redaction false positives**: Presidio rules too strict → check rules via `/api/pii/overview`, adjust `litellm-config.yaml` guardrails
- **Cost/quota anomalies**: `/api/newapi/cost`、`/api/newapi/audit` to check call details
- **Semantic cache**: litellm-redis health (`docker exec litellm-redis redis-cli ping` → PONG); cache hits return at ~0.4s level

## 5. Monitoring / Alerting / Logging Issues

- **Grafana no data**: Prometheus scrape targets `/api/monitoring/overview` (targets up count); `docker logs prometheus --tail`
- **Alert flooding/missed alerts**: `monitoring/alerts.yml` + `alertmanager.yml` rules; current state via `/api/alerts`; IM recipients config `/api/imalert/receivers` and `/api/imalert/test/:id` tests
- **Loki can't find logs**: check whether promtail is running (`docker ps`); `promtail.yml` labels must match the query

## 6. Disk Space Low

1. `docker system df` to check Docker usage; `Get-PSDrive` (Windows) / `df -h` (Linux) to check the disk
2. Cleanup candidates (**list them for user confirmation before deleting**): dangling images `docker image prune`, stopped containers, old backups `backups/backup_*`, old reports
3. Stage 9 of the health check script checks disk; alert rules include disk thresholds

## 7. Network and Proxy

- **GitHub push/pull failures**: confirm the proxy (e.g., `127.0.0.1:33210`) is running; if git routes GitHub through a proxy and the proxy is unavailable, connections fail (Gitee is unaffected)
- **Slow/failed image pulls**: use a mirror accelerator or switch source
- **Products can't reach each other**: check the compose internal network (e.g., `ai-platform`); access each other by container name

## 8. Backup / Restore Issues

- **Backup failed**: check `backups/backup.log`; check whether the database containers are healthy (mysqldump/pg_dump dependencies)
- **Won't start after restore**: restore first backs up the current state; restart the corresponding containers after database restore; verify the data (login, query)
- **Backup directory disk full**: shorten the retention days or manually clean old backups

## 9. Admin Portal (Admin Center) Issues

- **Blank page / endpoint 302**: session expired → log in again
- **server.js changes not taking effect**: `docker restart admin-portal` (see §3)
- **Function page errors**: `docker logs admin-portal --tail 50` to see server-side errors; check whether the corresponding product API is reachable (`/api/health/:name`)
- **UI shows old content**: hard refresh with Ctrl+F5

## 10. General Troubleshooting Discipline

1. Start with the health check report (`health-check.ps1` / `health-check.sh`) to locate the failing stage
2. Verify after every step (`docker ps`, HTTP status, logs)
3. Destructive operations (delete, restore, rebuild) require a backup first + user confirmation
4. Report conclusions with evidence: status codes, log excerpts, command output
