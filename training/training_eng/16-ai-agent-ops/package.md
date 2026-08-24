# AI Agent Operations — Training Package (M17 · AI-Driven Ops)

## Outline & Textbook

**Positioning**: this platform is **designed to be operated through an AI agent** (WorkBuddy / OpenClaw / Microsoft Scout): instead of clicking through a dozen consoles, you tell the agent what you want in plain language; it reads files, runs commands, and calls APIs. A differentiated capability and an advanced ops skill.

**How it works**: everything lives on the machine as **code, config, and data**:
- Docker Compose defines all containers; `.env` holds credentials; admin APIs (Keycloak/Gitea/NewAPI…) expose management endpoints; files & DBs (Ghost SQLite, installers, sync-history JSON) are the actual state.
- So an agent can: read/write any file, run commands (docker/git/PowerShell/Node/Python), call services over HTTP, and search the web — **the whole platform is agent-operable**.

**Getting ready (one-time)**: 1) point the agent's working dir at the project root (`C:\AIAllInOne`); 2) Docker Desktop running; 3) credentials stay in `.env` (never paste into chat/repos); 4) tell it the platform dir (`windows/`).

**Common prompts (copy & use)**
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

**Best practices (memorize)**
- **Frontend vs backend reload**: Admin Center `index.html` → browser refresh (volume-mounted); `server.js` → `docker restart admin-portal` (`up -d` does NOT reload mounted code).
- **Hard refresh** Ctrl+F5 (stale JS).
- **No secrets in repos/chat**: placeholders (`<SERVER_IP>`, CHANGE_ME_*); publish.ps1 auto-sanitizes server.js passwords.
- **Verify, don't believe**: demand proof via commands (HTTP codes, ls, log lines) — especially "it's fixed".
- **Backup before destructive changes**; confirm before deleting anything.
- **Ask parameters before content import** (address & language).
- **Network/proxy**: git push & web lookups may need the proxy; retry after opening it.

**Quick command reference**:
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

**Built-in health check (health-check.ps1)**: `../../windows/scripts/health-check.ps1` → log `health_check_<ts>.log`, success = trailing `ALL CLEAR` + `Fail: 0`. Covers 41 containers / 9 stages (daemon → containers → HTTP endpoints → LiteLLM/model registry → real LLM chain calls → AD auth chain → MCP/Skill → login prereqs → disk). Can be registered as a logon scheduled task (2-min delay). ⚠️ Credentials read from `.env`; `docker-init_permissions-1` Exited(0) is normal; Update Server 403 is normal.

**FAQ**:
| Issue | Fix |
|---|---|
| agent claims fixed, not sure | demand command proof (curl code, log lines) |
| UI change not visible | Ctrl+F5; confirm frontend vs backend |
| release fails | proxy/GitHub credentials; `git push` needs network |
| backup fails | backups/ permissions; configs copied with -LiteralPath |
| cleanup over-deletion risk | delete only confirmed items; back up first |

**Platform docs**: `../../AI-AGENT-OPS.md` (full, 9 languages); deploy guide chapter 0 (full agent-driven deployment prompt).

## Training Plan (3 h, D9 PM)

| Time | Content | Method |
|---|---|---|
| 14:00-14:40 | principle + prep + prompt library | lecture |
| 14:40-15:40 | Practice 1: agent-driven full health check & report (S) | lab |
| 15:40-16:30 | Practice 2: trigger sync + backup + failure drill (instructor plants fault) | lab |
| 16:30-17:00 | best-practice recap + Q&A | lecture |

**Lab checklist**: natural-language container status + anomaly report (S); agent locates & fixes a planted fault (S); sync triggered & progress read; backup executed & confirmed; frontend edit guided; health-check.ps1 run & 9 stages explained.

## Exam

**Theory (5 pts × 4 = 20)**: 1. frontend change → B browser refresh; 2. server.js → B docker restart admin-portal; 3. health-check success → B ALL CLEAR + Fail: 0; 4. NOT a good prompt principle → C "delete all old backups directly".

**Hands-on (30)**: 1. agent health check → report → human review (15); 2. agent backup/restore drill (supervised) (15).

**Defense (10)**: "How would you roll out AI ops? What to hand to the agent vs keep human?" (inspection/backup/regular config → agent; production changes/deletes/sensitive ops → human approval).

**Scorecard**: Theory(20) + Hands-on(30) + Defense(10).

## References
`../../AI-AGENT-OPS.md` (authoritative, 9 languages); agent product docs — OpenClaw docs.openclaw.ai, Microsoft Scout per official site; M10 Skill marketplace for turning ops playbooks into Skills.
