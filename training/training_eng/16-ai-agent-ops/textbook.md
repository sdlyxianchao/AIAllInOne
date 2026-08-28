# AI Agent Operations — Textbook (M17 · AI-Driven Ops)

## 1. Common prompts (copy & use)

| Task | Prompt |
|---|---|
| health check | "Check that all services are running and healthy. List any container that is stopped or restarting, and tell me why." |
| investigate | "LiteLLM is stopped. Find out why and fix it, then confirm it's back up." |
| restart | "Restart the admin portal so my server.js change takes effect." |
| logs | "Show me the last 50 lines of the Gitea runner log and tell me if there are errors." |
| trigger sync | "Trigger the dsh-sync workflow and show me its progress — phase, files downloaded, MB, ETA." |
| edit Admin Center | "Add pagination to the Gitea repositories list — 10 per page, adjustable." |
| portal seed | "Import the example content seed into the portal, using address 192.168.1.100 and Chinese." |
| backup | "Run a full backup now and confirm it succeeded." |
| release | "Publish a new release v0.7 with the message 'feat: …'." |
| disk cleanup | "Show me what's using Docker disk space and what's safe to remove." (list first, delete only after confirmation) |

## 2. Best practices (memorize)

- **Frontend vs backend reload**: Admin Center `index.html` → browser refresh (volume-mounted); `server.js` → `docker restart admin-portal` (`up -d` does NOT reload mounted code).
- **Hard refresh** Ctrl+F5 (stale JS).
- **No secrets in repos/chat**: placeholders (`<SERVER_IP>`, CHANGE_ME_*); publish.ps1 auto-sanitizes server.js passwords.
- **Verify, don't believe**: demand proof via commands (HTTP codes, ls, log lines) — especially "it's fixed".
- **Backup before destructive changes**; confirm before deleting anything.
- **Ask parameters before content import** (address & language).
- **Network/proxy**: git push & web lookups may need the proxy; retry after opening it.

## 3. Quick command reference

| Action | Command |
|---|---|
| list containers | `docker ps -a` |
| logs | `docker logs <name> --tail 100` |
| restart | `docker restart <name>` |
| start all | `docker compose up -d` |
| compose status | `docker compose ps` |
| trigger Gitea sync | `POST /api/v1/repos/<user>/dsh-sync/actions/workflows/sync.yml/dispatches` |
| backup | `powershell .\scripts\backup.ps1` |
| release | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |

## 4. Built-in health check (health-check.ps1)

`../../windows/scripts/health-check.ps1` → log `health_check_<ts>.log`, success = trailing `ALL CLEAR` + `Fail: 0`.

Covers 41 containers / 9 stages: daemon → containers → HTTP endpoints → LiteLLM/model registry → real LLM chain calls → AD auth chain → MCP/Skill → login prereqs → disk.

Can be registered as a logon scheduled task (2-min delay). ⚠️ Credentials read from `.env`; `docker-init_permissions-1` Exited(0) is normal; Update Server 403 is normal.

## 5. FAQ

| Issue | Fix |
|---|---|
| agent claims fixed, not sure | demand command proof (curl code, log lines) |
| UI change not visible | Ctrl+F5; confirm frontend vs backend |
| release fails | proxy/GitHub credentials; `git push` needs network |
| backup fails | backups/ permissions; configs copied with -LiteralPath |
| cleanup over-deletion risk | delete only confirmed items; back up first |
