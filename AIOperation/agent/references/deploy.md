# Deployment and Initialization Reference

> Generic deployment flow, not bound to a specific server. Deployment parameters (intranet IP, AD domain controller, admin account, model API key) are provided by the deployer; when deploying, the AI Agent must **ask the user for each parameter — guessing is not allowed**. See each flavor's deployment guide for detailed port tables / data flows.

## 1. Deployment Flavor Selection

| Flavor | Suitable For | Orchestration Directory |
|---|---|---|
| Windows | Single-host, corporate intranet (Docker Desktop + WSL2), includes an AD domain controller integration example | `windows/` |
| Linux | Single-host Linux (Docker Engine) | `linux/` |
| Docker | Pure Docker orchestration reference | `docker/` |

## 2. Standard Deployment Flow (Windows Example)

1. **Prerequisites**: Install Docker Desktop (WSL2 engine) on the machine; the network must be able to reach the image registry
2. **Get the code**: Clone the project or copy the deployment directory
3. **Configure .env**: Copy `.env.example` to `.env` and fill in all credentials (each product's password, API key, AD/LDAP configuration, server intranet IP)
4. **Start the stack**:
   ```bash
   cd <flavor directory>
   docker compose up -d
   ```
5. **Initialize** (containers running ≠ platform usable; initialization is mandatory):
   - Keycloak: create the realm, OIDC client, `ai-platform-admin` role, unified admin
   - NewAPI: configure channels (LiteLLM / direct), generate app tokens (deepchat-key / dify-key), SSO
   - Dify: start the standalone compose, point model providers to NewAPI, SSO
   - Ghost: initialize + deploy the Corp Portal theme + import sample content
   - Gitea: install + Runner registration + Actions workflows
   - Monitoring / logging / observability: confirm scrape targets and log pipelines
6. **Verify**: Run the health check script → all 9 stages pass; run all Admin Center availability tests

> Initialization details: see `<flavor>/*-deploy-guide-v2.md` (includes AD integration, port tables, license review) and `docs/admin-manual/` (30-chapter admin manual, includes operations / backup / troubleshooting, 9 languages).

## 3. AI Agent Deployment (Recommended)

The project provides a **deployment prompt**. Hand the deployment directory and the prompt to an AI Agent (WorkBuddy, etc.), and it can configure everything step by step following the deployment docs:

1. The Agent first reads the deployment guide, checklist, docker-compose, `.env` template, and automation scripts
2. The prompt requires the Agent to **ask the user for each parameter**: intranet IP, AD domain controller configuration, admin account, model API key — none of them may be guessed
3. Proceed chapter by chapter; use scripts whenever available; if a step fails, check the logs first to find the cause, then make changes
4. Finally verify end-to-end: SSO login, real conversation, monitoring, backup / restore; report the results item by item

## 4. Post-deployment Verification

- All core containers Up: Keycloak / NewAPI / LiteLLM / Ghost / Gitea / Update Server / Admin Center / MCP Gateway / the full monitoring stack
- Access via the intranet IP (do not use 127.0.0.1 — the OIDC redirect_uri will fail with `invalid_grant`)
- `*-checklist.html` can be used as a deployment progress checklist (browser checkboxes, auto-saved)

## 5. Upgrade Flow

1. Back up first (`scripts/backup.ps1`)
2. Update the code / pull new images: `git pull` (or replace the deployment directory) → `docker compose pull`
3. Rebuild affected services: `docker compose up -d`
4. Verify with a health check (`health-check.ps1` / Admin Center availability tests)
5. After the upgrade, check the management portal (Admin Center) for functional completeness

## 6. Publishing a New Version (Maintainers)

```powershell
# project root
.\publish.ps1 -Gitee -CommitMessage "<description>" -Version "vX.Y" -ReleaseNotes "<release notes>"
```

- Auto-syncs windows → windows-github (redacted passwords), builds the release directory, pushes GitHub (main) + Gitee (master), and tags
- Omitting `-Version` does not bump the version number
- GitHub push depends on the network/proxy; if it fails, push with the PowerShell environment as a fallback (Bash cannot obtain credentials non-interactively)

## 7. Multilingual Documentation

- README / AI-AGENT-OPS / deployment guides / admin manual all support 9 languages (zh/zh-TW/en/fr/es/pt/ja/ko/ar)
- The admin manual is in `docs/admin-manual/` (English master) + `docs/i18n/admin-manual-*` (translated versions)
