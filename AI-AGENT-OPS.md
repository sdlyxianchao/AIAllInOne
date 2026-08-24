# AI Agent Operations Guide

> 📖 **Languages**: [English](AI-AGENT-OPS.md) · [简体中文](i18n/AI-AGENT-OPS.zh.md) · [繁體中文](i18n/AI-AGENT-OPS.zh-TW.md) · [Français](i18n/AI-AGENT-OPS.fr.md) · [Español](i18n/AI-AGENT-OPS.es.md) · [Português](i18n/AI-AGENT-OPS.pt.md) · [日本語](i18n/AI-AGENT-OPS.ja.md) · [한국어](i18n/AI-AGENT-OPS.ko.md) · [العربية](i18n/AI-AGENT-OPS.ar.md)

This platform is designed to be **operated and maintained through an AI agent** — WorkBuddy, OpenClaw, Microsoft Scout, or any equivalent tool. Instead of logging into a dozen admin consoles and clicking through UIs, you tell the agent what you want in plain language, and it reads files, runs commands, and talks to the services for you.

This guide explains how to use an AI agent for day-to-day operations: health checks, container management, configuration changes, the AI Admin Center, Gitea/sync, the Ghost portal, backups, releases, and troubleshooting.

---

## 1. How it works

Everything that makes the platform run lives on your local machine as **code, config, and data**:

- **Docker Compose** defines all the containers.
- **`.env` files** (e.g. `windows/.env.windows`) hold the credentials the services use.
- **Admin APIs** expose management endpoints (Keycloak, Gitea, NewAPI, and more).
- **Files & databases** (the Ghost SQLite DB, DSH Desktop installer files, sync-history JSON, etc.) are the actual state.

The agent can:

- **Read and edit** any file — configs, scripts, the AI Admin Center's `index.html` / `server.js`, and docs.
- **Run commands** — `docker`, `docker compose`, `git`, PowerShell, Node.js, and Python.
- **Call services over HTTP** — admin APIs, health endpoints, download links.
- **Search the web** for product documentation when it needs to.

Because everything is just files + commands + APIs, the agent can see and change all of it — which is why you can operate the entire platform through it.

---

## 2. Getting ready (one-time)

1. **Open the project folder in the agent.** Point the agent's working directory at the project root (e.g. `C:\AIAllInOne`). That's where it reads `docker-compose.yml`, `.env` files, scripts, and docs.
2. **Make sure Docker Desktop is running.** Most operations are `docker` / `docker compose` commands. If Docker Desktop is stopped, the agent's first step is usually to check and start it.
3. **Leave credentials in `.env`, not in chat.** The agent reads `windows/.env.windows` for service passwords. Don't paste real passwords into the conversation or into committed files.
4. **Tell it which platform folder to use** if it isn't obvious (`windows/` in most single-machine cases).

---

## 3. What the agent can do

| Task | How the agent does it |
|---|---|
| Health check / status overview | `docker ps` + health endpoints + admin APIs |
| Start / restart / stop services | `docker compose up -d <svc>` / `docker restart <svc>` |
| Inspect logs & errors | `docker logs <svc> --tail N`, read log files |
| Change configuration | edit files, then restart the affected container |
| Edit the AI Admin Center | edit `admin-portal/public/index.html` (UI) or `admin-portal/server.js` (API) |
| Manage Gitea + sync | Gitea API: trigger workflows, read run status/logs, edit repo files |
| Manage the Ghost portal | read/write the Ghost SQLite DB, edit theme templates, import the content seed |
| Backup & restore | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publish a release | `publish.ps1` (build + commit + push to GitHub) |
| Clean up | `docker image prune`, remove old backups, etc. (with your confirmation) |
| Troubleshoot | port conflicts, Docker Desktop issues, DNS/proxy, etc. |

---

## 4. Common tasks & example prompts

Below are the tasks you'll do most often, each with an example prompt. You can say them in your own language — the agent will follow. Replace `<…>` with real values.

### 4.1 Check the health of everything

> "Check that all services are running and healthy. List any container that is stopped or restarting, and tell me why."

The agent runs `docker ps`, hits each health endpoint, and reports status.

### 4.2 Investigate a stopped or erroring service

> "LiteLLM is stopped. Find out why and fix it, then confirm it's back up."

The agent inspects the container state, reads the logs, finds the root cause (e.g. a port conflict), and fixes it.

### 4.3 Restart a service

> "Restart the admin portal so my server.js change takes effect."

The agent runs `docker restart admin-portal`. Note: a **backend** code change (`server.js`) needs a container restart; a **frontend** change (`index.html`) only needs a browser refresh.

### 4.4 Look at logs

> "Show me the last 50 lines of the Gitea runner log and tell me if there are errors."

### 4.5 Manage the DSH Desktop sync (Gitea)

> "Trigger the dsh-sync workflow and show me its progress — phase, files downloaded, MB, ETA."

The agent calls the Gitea API to trigger the workflow, then polls the run status and reads `sync-progress.json`.

### 4.6 Change the AI Admin Center

> "Add pagination to the Gitea repositories list — 10 per page, adjustable."

The agent edits `index.html`, validates the JavaScript, and (for backend changes) restarts the container. Then you hard-refresh the browser (Ctrl+F5).

### 4.7 Manage the Ghost portal

> "Import the example content seed into the portal, using address 192.168.1.100 and Chinese."

The agent asks for the publish address and language, then runs `ghost-content-import.ps1`. It can also fix themes, edit pages, and change navigation directly in the DB.

### 4.8 Backup & restore

> "Run a full backup now and confirm it succeeded."

### 4.9 Publish a release to GitHub

> "Publish a new release v0.7 with the message 'feat: …'."

The agent runs `publish.ps1 -Version v0.7 -CommitMessage "…"`. Note: `git push` needs the proxy or GitHub credential to be available — if push fails on network, the agent will tell you to open the proxy.

### 4.10 Clean up disk space

> "Show me what's using Docker disk space and what's safe to remove."

The agent scans (`docker system df`, unused images, volumes, old backups) and lists candidates — **it should only delete after you confirm which ones.**

---

## 5. Best practices & gotchas

- **Frontend vs backend reload.** In the AI Admin Center, `index.html` changes take effect on a browser refresh (the file is volume-mounted); `server.js` changes need `docker restart admin-portal` — a plain `docker compose up -d` does **not** reload volume-mounted code.
- **Hard-refresh your browser** (Ctrl+F5) when the UI doesn't seem to change — old JavaScript is often cached.
- **Never commit real secrets or IPs.** Use placeholders (e.g. `<服务器IP>`, `CHANGE_ME_*`). `publish.ps1` sanitizes `server.js` passwords automatically.
- **Verify, don't just believe.** Ask the agent to prove results with commands (HTTP status codes, `ls`, log lines), especially for "it's fixed" claims.
- **Back up before destructive changes.** The agent should back up the Ghost DB or config before editing it, and confirm with you before deleting anything.
- **Ask for language & address before content import.** When importing portal content, the agent should ask for the publish address and target language first.
- **Network & proxy.** Some steps (git push to GitHub, web searches) need the proxy (e.g. `127.0.0.1:33210`) or outbound network. If a network step fails, open the proxy and retry.

---

## 6. Quick command reference

| Action | Command |
|---|---|
| List containers | `docker ps -a` |
| Container logs | `docker logs <name> --tail 100` |
| Restart a service | `docker restart <name>` |
| Start all services | `docker compose up -d` |
| Compose status | `docker compose ps` |
| Trigger Gitea sync | `POST /api/v1/repos/<user>/dsh-sync/actions/workflows/sync.yml/dispatches` |
| Run a backup | `powershell .\scripts\backup.ps1` |
| Publish a release | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
