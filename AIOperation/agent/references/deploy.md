# Deployment and Initialization Reference

> Generic deployment flow, not bound to a specific server. Deployment parameters (intranet IP, AD domain controller, admin account, model API key) are provided by the deployer; when deploying, the AI Agent must **ask the user for each parameter — guessing is not allowed**. See each flavor's deployment guide for detailed port tables / data flows.

## 0. Project and Prerequisites

This skill targets the **AI AllInOne open-source enterprise AI platform** (self-hosted all-in-one stack, MIT licensed):

- GitHub: `https://github.com/sdlyxianchao/AIAllInOne`
- Gitee: `https://gitee.com/sdxianchao/AIAllInOne`

**Prerequisite**: the platform must be deployed before this skill can manage it. If the user has not deployed yet:

1. Tell the user "this is the deploy & ops skill for the AI AllInOne project and requires the platform to be deployed first", and share the project address above
2. Guide the user to clone the project or download a release (GitHub / Gitee Releases)
3. Deploy via the standard flow in section 2 below, or assist via the AI Agent deployment in section 3
4. Run the health check to verify once deployment is done, then enter ops mode

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

### 3.1 Deployment prompt (Windows example — copy verbatim to your agent)

````text
You are a deployment engineer for an enterprise intranet AI platform. Based on the deployment guide "windows-deploy-guide-v2.html", the progress checklist windows-checklist.html, docker-compose.yml and .env.example in this directory, fully deploy and verify this "AI AllInOne" platform on the current Windows machine. Communicate with me in English throughout.

## Step 1: Collect the required parameters (ask me one by one — don't skip or guess)
Before starting, collect from me: 1) the intranet IP exposed by the platform; 2) the Skill market hostname (domain — used to replace <market-hostname> in mcp-gateway/skills/skill-market/config.json and SKILL.md, and resolved via hosts/DNS); 3) the identity source (if connecting an AD domain controller: domain / DC IP / LDAP base DN / bind DN / bind password / sAMAccountName; or the config of another IdP; confirm if none); 4) the unified admin account and password; 5) LLM API keys (DeepSeek / OpenAI / Claude, etc.); 6) ask as needed about alert webhook, HTTPS and backup retention policy.

## Step 2: Generate a local progress file
Based on the content of windows-checklist.html, generate "deployment-progress-<date>.md" in this directory with every item marked as incomplete (- [ ]). Update it and report briefly after completing each item or resolving each issue.

## Step 3: Configure step by step per the deployment guide
Read windows-deploy-guide-v2.html carefully — it is the only authoritative guide for this deployment. Execute its chapters 1~13 strictly in order (do not substitute windows-checklist.html or any older document), paying special attention to the "⚠️ critical pitfalls" in each chapter. Prefer the automation scripts under scripts/ (bootstrap.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, keycloak-realm-init.ps1, backup.ps1, restore.ps1, etc.); automate rather than clicking through UIs. The Ghost portal (section 6.5) must: ① deploy the bundled Corp Portal theme — run scripts\ghost-theme-setup.ps1 to install and activate it, do not stay on the default official theme; ② import the example content: first ask me for the public address of the portal and all products (intranet IP or domain, e.g. 192.168.1.10 or portal.company.com) — use it to replace the <server-IP> placeholders in the seed (also replace the NewAPI / MCP / Dify access URLs in article bodies; do not change container-internal fixed addresses such as host.docker.internal); then ask me what language the portal example content should use — for Chinese, run scripts\ghost-content-import.ps1 -ServerAddr "<public address>" directly; for other languages, first translate the title / html / plaintext / custom_excerpt fields in ghost-content-seed/content.json into the target language (keep the <server-IP> placeholders and all URL structures unchanged), then import.

## Step 4: Test and fix iteratively
On failure, first inspect the logs (docker logs, health endpoints, configs) to find the root cause before fixing — do not blindly retry. When admin rights or my manual confirmation are needed, clearly tell me "what to do and why". After resolving, write back to the progress file and report briefly.

## Step 5: Full end-to-end verification
When everything is done, run end-to-end tests: all containers Up, Keycloak SSO login, a real conversation through NewAPI/LiteLLM to verify PII masking, identity-source login, monitoring / logging / alerting, backup & restore. Finally summarize each item as ✅/❌, giving the root cause and a suggestion for failures.
````

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
