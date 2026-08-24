---
name: ai-all-in-one-deploy-ops
description: Deploy & operations skill for AI AllInOne. AI AllInOne is an open-source enterprise AI platform (self-hosted all-in-one stack, MIT licensed). Project: GitHub https://github.com/sdlyxianchao/AIAllInOne / Gitee https://gitee.com/sdxianchao/AIAllInOne . Trigger when the user needs to deploy or manage an AI AllInOne deployment — typical phrasings: "deploy AI AllInOne", "deploy from scratch", "initialize the platform", "check platform health", "container X is down, find out why", "restart a service", "show logs / call costs", "backup / restore", "release a new version", "trigger Gitea sync", "clean up disk space". Capabilities: ① from-scratch deployment and initialization (fetch the project, environment checks, docker compose up, Keycloak/NewAPI/Dify/Ghost/Gitea initialization, AD domain controller integration, health-check verification); ② platform health check and status overview; ③ container start/stop/restart and log troubleshooting; ④ configuration changes and reload; ⑤ AI Admin Center unified management (admins and roles, Keycloak auth sync, NewAPI channels/tokens/cost, Gitea sync, Ghost portal, Dify, MCP Gateway, monitoring/alerting/logs/PII, availability tests, report generation, backup/restore, IM alerting); ⑥ native management of third-party products (Keycloak/NewAPI/LiteLLM/Dify/Ghost/Gitea/Grafana/Langfuse/Prometheus/Loki); ⑦ data backup and restore; ⑧ platform upgrade and version release; ⑨ disk cleanup and troubleshooting. Supports Windows / Linux / Docker deployment layouts on any server: credentials are always read from .env, paths auto-resolve, and no specific IP, hostname or hardcoded config is required.
agent_created: true
---

# AI AllInOne Deploy & Ops Skill

> **Prerequisite**: this skill is for the **AI AllInOne open-source enterprise AI platform** (GitHub `https://github.com/sdlyxianchao/AIAllInOne` · Gitee `https://gitee.com/sdxianchao/AIAllInOne`). AI AllInOne must be deployed before this skill can be used; this skill can also help you deploy it (see `references/deploy.md`).

## Who I am

I am the **operations skill for the AI AllInOne platform**. AI AllInOne is a self-hosted enterprise AI platform orchestrated with Docker: unified SSO (Keycloak), model gateway (NewAPI + LiteLLM + Presidio PII redaction), AI applications (Dify), enterprise portal (Ghost), source hosting & CI (Gitea + Runner), desktop client distribution (DSH Desktop + Update Server), unified admin portal (AI Admin Center), MCP tool gateway, monitoring & alerting (Prometheus/Grafana/Alertmanager), LLM observability (Langfuse), unified logging (Loki), backup & restore.

**What I can do (full day-to-day coverage):**

| Area | What I do |
|---|---|
| Deployment & initialization | Deploy AI AllInOne from scratch: fetch the project (clone / download release) → environment checks → configure .env → docker compose up → initialization (Keycloak realm/OIDC/roles, NewAPI channels/tokens, Dify model providers/SSO, Ghost theme/content, Gitea Runner) → AD domain controller integration → health-check verification; Windows / Linux / Docker flavors; **if not deployed yet, first guide the user through the project docs** (see references/deploy.md) |
| Health checks | One-command health check (41 containers x 9 stages), container status overview, HTTP endpoint probes, full LLM chain verification, disk space |
| Container ops | Start / stop / restart services, view status, troubleshoot unhealthy containers (root-cause from logs) |
| Logs | `docker logs`, Loki aggregated queries, Admin Center log page |
| Config management | Edit config/code, then reload per type (frontend refresh, backend restart) |
| Unified admin portal | Full Admin Center management: admins & roles, auth sync, NewAPI channels/tokens/cost, Gitea sync, Ghost portal, Dify, MCP tools & skill market, PII, monitoring, reports, availability tests, backup, IM alerting |
| Native third-party product management | Manage each deployed third-party product directly: Keycloak (realms/roles/clients/AD sync), NewAPI (channels/tokens/users/cost), LiteLLM (models/users/semantic cache), Dify (apps/knowledge bases/providers), Ghost (content/themes/import), Gitea (repos/CI/Runner), MCP Gateway (servers/skills), Grafana (dashboards/users), Langfuse (projects/keys), Prometheus/Alertmanager, Loki, Update Server — both product admin UIs and native APIs are supported (see references/products.md) |
| Data safety | Full backup, restore, retention policy, prune old backups |
| Upgrade & release | Version releases (GitHub/Gitee), DSH Desktop sync, component upgrades |
| Troubleshooting | Port conflicts, container issues, OIDC/SSO problems, code changes not taking effect, disk full, network/proxy |

## Quick start

1. **Locate the project root**: point the working directory at the platform deployment directory (the one containing `docker-compose.yml` — usually also containing `windows/`, `linux/`, `docker/` platform subdirectories and `scripts/`). Use relative positioning (e.g. `$PSScriptRoot`) so it auto-follows; do not hardcode paths.
2. **Determine the deployment layout**: Windows (`windows/`, PowerShell + Docker Desktop), Linux (`linux/`, bash + Docker), or plain Docker orchestration (`docker/`). Ask the user or confirm from the directory.
3. **Read credentials from .env**: read all passwords/keys from the platform's `.env` (e.g. `windows/.env.windows`, `windows/.env`); never hardcode them or print them into the conversation.
4. **Health-check before acting**: back up any "it's fixed" claim with commands (`docker ps`, HTTP status codes, log lines).

## Core conventions (must follow)

- **Every capability has a real grounding**: each capability claimed in this skill is backed by a script (`scripts/`), a management API (`references/admin-api.md`), or a native product API (`references/products.md`); when unsure about an exact command, consult the relevant reference first — never invent commands.
- **Frontend vs backend reload**: `admin-portal/public/index.html` (frontend, volume-mounted) takes effect on a browser refresh; `admin-portal/server.js` (backend) requires `docker restart admin-portal` — a plain `docker compose up -d` does NOT reload volume-mounted code.
- **Back up first**: before destructive operations (database changes, deletions, big config changes) take a backup; before deleting anything, list the candidates and get user confirmation.
- **No sensitive leaks**: real passwords live only in `.env`; use placeholders (`CHANGE_ME_*`) in external docs/commits.
- **Verify, don't just believe**: report results with evidence (status codes, log excerpts, command output), not "should be fine".
- **Network & proxy**: GitHub push / online steps may depend on a proxy or outbound network; on network failure check connectivity first, then retry.

## Reference documents

Read the `references/` files as needed after entering the working directory:

| Doc | Content |
|---|---|
| `references/architecture.md` | Platform architecture: component list, data locations, script inventory, doc map |
| `references/operations.md` | Day-to-day ops manual: health checks, containers, logs, config, backup/restore, upgrade, cleanup |
| `references/admin-api.md` | All AI Admin Center management APIs (endpoints/purpose/examples) |
| `references/products.md` | **Native third-party product management**: admin entry, native APIs and common ops for every deployed product (Keycloak/NewAPI/LiteLLM/Dify/Ghost/Gitea/MCP/monitoring/Langfuse/Loki/Update Server/MailHog) |
| `references/deploy.md` | **Deployment & initialization**: from-scratch flow (fetch project → environment checks → compose up → initialization → AD integration → verification), project address and prerequisites, AI-agent deployment, upgrade and version releases |
| `references/troubleshooting.md` | Common troubleshooting: ports, containers, SSO, disk, proxy, etc. |

## Common task quick reference

- "Deploy / initialize the platform" → if not deployed, guide the user with the project address first, then follow the flow in `references/deploy.md` (ask for every initialization parameter)
- "Check platform health" → run the health-check script + container status + Admin Center health API
- "Container X is down, find out why" → `docker ps` + `docker logs <name> --tail`
- "Take a backup" → backup script or Admin Center backup API
- "Release vX.Y" → `publish.ps1 -Version vX.Y -CommitMessage "..."` (confirm network/proxy first)
- "Show call costs" → Admin Center NewAPI cost API
- "Trigger Gitea sync" → Gitea sync API / Admin Center

Detailed steps are in `references/operations.md`.
