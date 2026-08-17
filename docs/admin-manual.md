# AI AllInOne Admin Manual

*v0.2 · Deployment · Administration · Operations*

**Part 1 · Deployment**

## 1. Platform Overview and Architecture

### 1.1 What This Platform Is
"AI AllInOne" is an **enterprise intranet AI platform** that orchestrates more than a dozen open-source products with Docker into a whole: unified authentication, LLM routing, PII redaction, AI applications, enterprise portal, source-code CI, client distribution, unified administration, monitoring & alerting, observability, logging, backup & restore — all connected end to end, with **a single Keycloak account for SSO across every product**.
| Layer | Component | Purpose |
| --- | --- | --- |
| Unified Authentication | Keycloak | SSO / OIDC, can integrate with AD/LDAP or local accounts |
| LLM Routing | NewAPI | Channels, keys, quotas, auditing, cost |
| PII Redaction | LiteLLM + Presidio | Automatically redacts phone numbers / ID numbers / emails, etc. before model calls |
| AI Applications | Dify | Visual AI app / Agent / knowledge base platform |
| Enterprise Portal | Ghost | Announcements, news, download center, employee Hub |
| Source Code / CI | Gitea + Runner | Internal Git repository + Actions automation |
| Client | DeepChat | Local AI desktop client (Win/macOS/Linux) |
| Client Distribution | Update server | Hosts DeepChat installers and auto-updates |
| Unified Administration | AI Admin Center | Single administration entry: Dashboard + embedded products + audit/cost/reports |
| Gateway | MCP Gateway | Skill / MCP marketplace management |
| Monitoring & Alerting | Prometheus + Grafana + Alertmanager | Container resource monitoring + alert notifications |
| LLM Observability | Langfuse | trace / latency / token / cost for every model call |
| Unified Logging | Loki + Promtail | Aggregation and search of all container logs |
| Backup & Restore | backup / restore scripts + admin page | Daily full-data backup + one-click restore |
### 1.2 Hardware and Software Requirements
| Item | Minimum | Recommended |
| --- | --- | --- |
| Operating System | Windows 11 (Docker Desktop + WSL2 backend) | Windows 11 Pro / Enterprise (additionally supports Hyper-V to run the AD domain controller) |
| CPU | 4 cores / 8 threads | 8 cores / 16 threads |
| Memory | 16 GB | 32 GB |
| Disk | 60 GB free SSD | 150 GB+ free SSD |
| GPU | No discrete GPU required | No discrete GPU required |
> 📌 Based on actual measurements: about 30 containers use about 5 GB of memory combined when idle; Dify processing/indexing, the Keycloak JVM, database caches, etc. add another 3–5 GB at peak; adding WSL2 virtual memory, 16 GB is the minimum and 32 GB is the comfortable figure. All large models go through external APIs (deepseek-chat, etc.) with no local inference, so **no GPU is required**.
### 1.3 Port Allocation Table
Throughout this document, `<server-IP>` denotes the host machine's external address (currently `192.168.31.117`; replace it with your own intranet IP or domain when deploying).
| # | Product | Purpose | Local access | Intranet access (employees) |
| --- | --- | --- | --- | --- |
| 1 | AI Admin Center | Unified admin portal | `127.0.0.1:10086` | `<server-IP>:10086` |
| 2 | Keycloak | Authentication / SSO | `127.0.0.1:9090` | `<server-IP>:9090` |
| 3 | NewAPI | LLM routing gateway | `127.0.0.1:3000` | `<server-IP>:3000` |
| 4 | LiteLLM | PII redaction proxy | `<server-IP>:4001` | — (called only by NewAPI) |
| 5 | Dify | AI application platform | `127.0.0.1` | `<server-IP>` (port 80) |
| 6 | Ghost | Enterprise portal | `127.0.0.1:8090` | `<server-IP>:8090` |
| 7 | Gitea | Source code + CI/CD | `127.0.0.1:3002` | `<server-IP>:3002` |
| 8 | Update server | DeepChat installers | `127.0.0.1:8091` | `<server-IP>:8091` |
| 9 | MCP Gateway | Skill / MCP gateway | `127.0.0.1:3100` | `<server-IP>:3100` |
| 10 | Grafana | Monitoring dashboard | `127.0.0.1:3030` | `<server-IP>:3030` |
| 11 | Prometheus | Metrics collection / alerting | `127.0.0.1:9091` | `<server-IP>:9091` |
| 12 | Langfuse | LLM observability | `127.0.0.1:3010` | `<server-IP>:3010` |
| 13 | Loki | Log aggregation (internal) | `127.0.0.1:3110` | — (viewed via the admin page) |
| 14 | MailHog | Local mail reception | `127.0.0.1:8025` | `<server-IP>:8025` |
> ⚠️ Always access via **intranet IP**, not `localhost` (Docker Desktop WSL2 has unstable IPv6 `::1` support, causing port forwarding failures). Databases (MySQL/Redis/PostgreSQL) are not exposed to users; they communicate only within the Docker network.
### 1.4 Core Data Flow
#### LLM Request Flow (the most critical chain)
1. **① Forward**: DeepChat / Dify sends the request to NewAPI (`:3000/v1`);
2. **② Redact**: NewAPI forwards to LiteLLM, which uses regex + Presidio to replace phone numbers / ID numbers / emails, etc. with `[xxx_REDACTED]`;
3. **③ Call external model**: the redacted request is sent to DeepSeek / GPT / Claude;
4. **④ Restore PII**: when the response comes back, LiteLLM restores the sensitive information;
5. **⑤ Return**: the final result returns to the client.
#### Other Flows
- **Authentication flow**: Keycloak OIDC SSO for unified login to all web products (shared `ai_all_in_one_admin`);
- **Observability flow**: LiteLLM `success_callback` → Langfuse traces every call;
- **Auto-update flow**: Gitea Actions build → update server (:8091) → DeepChat checks `version.txt` and auto-downloads/installs;
- **Unified logging flow**: Promtail collects container logs → Loki aggregates → queried on the AI Admin Center "Unified Logging" page.
### 1.5 Book Structure and Navigation
This manual is divided into three parts: **Deployment** (Chapters 1–13, get the platform running from scratch), **Administration** (Chapters 14–26, day-to-day operations for each of the 13 products), and **Operations** (Chapters 27–29, backup / health checks / troubleshooting). You can jump around via the sidebar at any time; the bottom of each page has previous/next chapter navigation.
> ✅ During deployment you can also hand the work to an **AI Agent tool** (WorkBuddy / OpenClaw, etc.) for automation: give the Agent this manual + `docker-compose.yml` + `.env.example` + `scripts/`, and let it execute step by step following the "Deployment" part (see the Agent deployment prompt at the beginning of Chapter 2).

## 2. Prerequisites

### 2.0 Two Deployment Approaches
This manual can be executed **manually chapter by chapter**, or **handed to an AI Agent tool for automated execution**. When using an Agent, provide it with this directory (including this manual, `docker-compose.yml`, `.env.example`, `scripts/`) and paste the prompt below.
**Deployment prompt to copy for the Agent:**
```
You are a deployment engineer for an enterprise intranet AI platform. Based on the "Deployment" part of the Admin Manual, docker-compose.yml, and .env.example in this directory, fully deploy and verify the "AI AllInOne" platform on this machine. Communicate in Chinese throughout.

Step 1 Collect parameters (ask me for each item; do not skip or guess):
1) the intranet IP for external services; 2) the Skill marketplace hostname (domain name; replace <market-hostname> in mcp-gateway/skills/skill-market/config.json and SKILL.md, and resolve it in hosts/DNS); 3) the identity source (if connecting to an AD domain controller, you need domain name / DC IP / LDAP base DN / bind DN / bind password / sAMAccountName); 4) the unified admin account password; 5) the LLM API Key; 6) as needed, ask about the alert webhook, HTTPS, and backup retention policy.

Step 2 Generate a progress file, and update and report it each time an item is completed or a problem is resolved.

Step 3 Strictly follow Chapters 1~13 of this manual in order, pay attention to the "⚠️ Key pitfalls" in each chapter, and prefer the scripts under scripts/ for automation.

Step 4 On error, first check logs (docker logs, health endpoints, configuration) to locate the root cause and then fix it; do not blindly retry.

Step 5 End-to-end verification: all containers Up, Keycloak SSO, send a real conversation through NewAPI/LiteLLM to verify PII redaction, identity source login, monitoring/logging/alerting, backup & restore — summarize each item with ✅/❌.
```
> 💡 If you are not using an Agent, the above can also serve as a "pre-deployment information checklist": before deploying, think through these four things — intranet IP, identity source, admin password, and model Key.
### 2.1 Install and Configure Docker Desktop
Docker Desktop uses the WSL2 backend by default after installation and usually needs no extra configuration. If you need to manually adjust resource limits, create a `.wslconfig` in your user directory:
```
# %UserProfile%\.wslconfig (e.g. C:\Users\your-username\.wslconfig)
[wsl2]
memory=24GB       # Docker maximum memory (minimum 16GB, recommended 24~32GB)
processors=8      # CPU core count (per physical cores)
swap=4GB
```
After saving, run `wsl --shutdown` in PowerShell and restart Docker Desktop for it to take effect.
> ✅ Verify: the Docker Desktop status bar shows "Engine running" (green).
### 2.2 Prepare the Directory Structure
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Create the Docker Shared Network
```
docker network create ai-platform
docker network ls | findstr ai-platform   # verify
```
> All core containers reach each other by container name over the `ai-platform` network (e.g., NewAPI reaches LiteLLM via `http://litellm:4000`, not through localhost).
### 2.4 Fix the Host Machine's Intranet IP (important)
When the host machine uses WiFi, its IP is dynamically assigned by DHCP and changes on reboot or lease expiry; when it changes, all the addresses employees use to access products break. It is recommended to set up **DHCP reservation (MAC binding)** on the router:
1. Find the WiFi adapter MAC: `ipconfig /all`, locate the physical address of "Wireless LAN adapter WLAN" (e.g. `60-A3-E3-41-8F-61`);
2. Log in to the router admin (e.g. `http://192.168.31.1`) → LAN settings / DHCP static IP assignment;
3. Add a rule: MAC → IP (e.g. `192.168.31.117`), save;
4. Reconnect WiFi to confirm the IP is fixed.
> ✅ DHCP reservation is more stable than setting a static IP in Windows (centrally managed by the router, no conflicts).
### 2.5 Open Up the Network (the step most likely to get stuck)
- **Can reach Docker image registries**: Docker Hub / quay.io / ghcr.io. If not reachable, first configure an image accelerator (e.g. DaoCloud).
- **Can reach GitHub**: clone repositories and pull public dependencies. If not reachable, use a proxy or download the source packages in advance.
- **The target machine is reachable from the intranet**: confirm the network segment to be exposed is reachable.

## 3. Configuration Files and Environment Variables

### 3.1 The Three Core Configuration Files
| File | Purpose | Needs modification? |
| --- | --- | --- |
| `.env.windows` | All passwords and external API Keys | **Must modify**: fill in the DeepSeek API Key; other providers as needed |
| `litellm-config.yaml` | LiteLLM model list + PII redaction rules | Usually unchanged (if only using DeepSeek, the OpenAI/Claude entries can be removed) |
| `docker-compose.yml` | Core service orchestration | Already preconfigured (includes Keycloak `KC_HOSTNAME` + persistent volumes) |
### 3.2 Environment Variable Classification Overview
Open `.env` (copied from `.env.windows`) and configure by priority.
| Variable | Priority | Description |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 immediate | External LLM API Key; without it the chain won't work |
| `LITELLM_MASTER_KEY` | 🔴 immediate | LiteLLM internal auth key, needed by NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 immediate | MySQL root password; should not change after initial creation |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 immediate | Keycloak admin password |
| `NEWAPI_SESSION_SECRET` | 🔴 immediate | NewAPI session encryption, random string |
| `NEWAPI_CRYPTO_SECRET` | 🔴 immediate | NewAPI data encryption, random string |
| `ADMIN_PASSWORD` | 🔴 immediate | AI Admin Center Global Admin password |
| `SESSION_SECRET` | 🔴 immediate | AI Admin Center session encryption, random string |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 can configure later | First create an OIDC Client in Keycloak to get the Secret (see Chapter 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 can configure later | First start Gitea and get the Token from the admin (see Chapter 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 as needed | Uncomment when needed, and update `litellm-config.yaml` accordingly |
| `GLOBAL_WEB_RATE_LIMIT` and other rate-limit items | ⚪ default | Set 999999 during testing; lower appropriately in production |
| `DEFAULT_QUOTA` | ⚪ default | Default quota for new users (USD); setting 100 gives new users $100 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ default | Auto-generate an initial Key on new user registration; set true so users can use it right after login |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ default | Defaults are fine |
### 3.3 🔴 Immediate Configuration (must complete before first startup)
| Variable | Description | How to obtain | Format |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek cloud LLM Key | Register at https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM internal admin key (not an external LLM Key) | Randomly generate (see below) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL password | Choose your own; **should not change** after initial creation | any |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | Choose your own, ≥ 8 characters | any |
| `NEWAPI_SESSION_SECRET` | NewAPI session encryption | Randomly generate | 32 characters |
| `NEWAPI_CRYPTO_SECRET` | NewAPI data encryption | Randomly generate | 32 characters |
| `ADMIN_PASSWORD` | AI Admin Center admin password | Choose your own, ≥ 8 characters | any |
| `SESSION_SECRET` | AI Admin Center session encryption | Randomly generate | 64 characters |
Generate a random string (PowerShell):
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### Example of Filling In the API Key
```
# DeepSeek is configured by default (uncomment and fill in the Key)
DEEPSEEK_API_KEY=sk-your-real-DeepSeek-key

# Uncomment when OpenAI / Claude are needed, and also uncomment the corresponding model block in litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 Password Change Policy
> ⚠️ `NEWAPI_DB_PASSWORD` is tied to the already-created database; changing it requires deleting the corresponding volume and recreating it (data will be lost), so it is best to decide it once on the first setup.  
> 
>     Management passwords such as `KEYCLOAK_ADMIN_PASSWORD` and `ADMIN_PASSWORD` can be changed in each product's admin console; after changing, update `.env` accordingly (just a reminder; does not affect operation).
### 3.5 litellm-config.yaml Notes
- `model_list` — defines the available external models; NewAPI calls them via LiteLLM. By default only `deepseek-chat` is enabled;
- `general_settings.master_key` — LiteLLM admin key; reads `LITELLM_MASTER_KEY` from `.env`;
- PII redaction (Presidio) is currently **temporarily commented out** (the new LiteLLM guardrail API change is incompatible); see Chapter 25 for enabling it later;
- Use the stable version `v1.95.1` (`main-latest` has known bugs).

## 4. Starting Core Services

### 4.1 Copy .env
```
# PowerShell
copy .env.windows .env
```
Docker Compose reads `.env` by default.
### 4.2 Start All Core Services
```
docker compose -f docker-compose.yml up -d
```
The first run pulls all images (about 5–10 minutes, depending on network speed).
| Image | Container | Size |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 Check Container Status
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Expect all 10 core containers to be `Up`. If a container keeps `Restarting`, run `docker logs container-name` to see the reason.
### 4.4 Known Issue Fix: Force SQLite for Ghost
If `ghost` keeps Restarting and the log shows `Error: connect ECONNREFUSED <server-IP>:3306` — that means an old `config.production.json` pointing to MySQL is left over in the data volume. Fix: explicitly declare SQLite in the ghost service's `environment` in compose:
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ Under Windows + Docker Desktop WSL2, the volume data is sealed inside the WSL2 virtual disk and cannot be seen from the host git bash, so you cannot directly delete `config.production.json` inside the volume — the only path is "override via environment variables". Also, do not run `docker volume rm windows_ghost-data` (it would lose already-published posts).
> ✅ Verify: the log shows `Ghost database ready` + `Ghost booted`, and `curl.exe -I http://127.0.0.1:8090` returns 200.
### 4.5 Verify Each Service Is Reachable
```
# Keycloak — 302 means OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redirects to the /ghost/ setup page)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (empty directory, nginx is running)
curl.exe -I http://127.0.0.1:8091
# AI Admin Center — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM is a pure API with no web UI; verify it from inside a container:
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# expected to return {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 Docker Desktop WSL2's HTTP proxy may make LiteLLM unreachable from the host (HEART/empty response); this is a known bug and does not affect NewAPI calling it by container name.

## 5. Standalone Dify Deployment

> 📌 Dify uses the official docker-compose (about 15 containers) and is deployed standalone to avoid port conflicts, using its own default network (different from the core services' `ai-platform` network).
### 5.1 Clone Dify
```
# Option A: GitHub (requires access)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Option B: official Gitee mirror (recommended in mainland China)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 Fix Compatibility + Copy Environment Variables
```
cd dify\docker

# fix the env_file format (compatible with older Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# copy the main environment variables
copy .env.example .env

# copy all sub-templates (sandbox.env, etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# fix the Dify 1.16.1 upstream validation issue (required)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# verify
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ Why `GRAPH_ENGINE_SCALE_UP_THRESHOLD` must be changed: Dify 1.16.1 upgraded this field from "0 allowed" to "must be > 0", but the `shared.env` template is still 0. If unchanged, the 4 containers `docker-api-1` / `worker` / `worker_beat` / `api_websocket` crash on startup with `ValidationError: Input should be greater than 0`.
### 5.3 Start Dify
```
docker compose up -d
docker compose ps
```
> ✅ All containers `Up` (`init_permissions` showing Exited is normal). Open `http://127.0.0.1/install` in a browser to initialize the admin account.
### 5.4 Fix the WebSocket Address (otherwise it keeps connecting to ws://localhost)
In `.env`, `NEXT_PUBLIC_SOCKET_URL` defaults to `ws://localhost`; when deployed on the intranet, localhost in the browser points to the user's own machine, causing the frontend to repeatedly fail to connect (creating apps / debugging workflows gets stuck).
```
# In .env, change it to the intranet IP
NEXT_PUBLIC_SOCKET_URL=ws://<server-IP>

# In docker-compose.yaml, change the web service fallback to match
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<server-IP>}

# rebuild the web container to apply
docker compose up -d web
```
> 📌 After changing, hard-refresh the browser (Ctrl+F5). This variable is read at runtime, so changing .env + restarting web is enough; no need to rebuild the image.
### 5.5 Pitfall Quick Reference
> ⚠️ **The login password is base64-encoded**: in Dify 1.16.x, the `password` field of the login endpoint `POST /console/api/login` is the base64-encoded password. Script logins must `base64(password)` first; when the frontend "does nothing on clicking login", the `GET /account/profile 401` in the console is normal (not logged in).
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<company-domain> \
  --new-password '<new-password>' \
  --password-confirm '<new-password>'
```
> ⚠️ **Forgot admin password reset**: Dify's password hash is `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iterations) and cannot be reversed; reset it with a container command (new password ≥ 8 characters):
>     
>     📖 Vendor docs:Dify official docs https://docs.dify.ai · self-hosted deployment https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak: Realm, Users, and AD

> 📌 Access: host machine `http://127.0.0.1:9090`, intranet `http://<server-IP>:9090`. Data is stored in the named volume `keycloak-data` and is not lost when the container is recreated. Credentials are in `.env.windows` under `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`.
### 6.1 Create a Realm
1. Open `http://127.0.0.1:9090` in a browser → Administration Console → log in as admin;
2. Top-left dropdown → **Create Realm** → set Realm name to `enterprise-ai` → Create.
### 6.2 Approach A: Create Local Accounts (small teams / testing without AD)
1. **Groups** → Create Group → `ai-admin`; then create `ai-user`;
2. **Users** → Add user → username → Create;
3. Credentials tab → set password → turn Temporary off;
4. Groups tab → join the `ai-user` group.
### 6.3 Approach B: Import Accounts from Active Directory (recommended)
If the company already has a Windows AD domain controller, employees log in with their domain accounts and there is no need to create accounts manually in Keycloak. Prerequisite: the Docker container must have network connectivity to the domain controller (see the "Keycloak AD Integration Guide" `windows-ad-integration.html` for network topology, Hyper-V Internal Switch, and port forwarding).
> 📌 Required AD accounts: service account `svc_keycloak` (password never expires, used for LDAP binding) + 2 test domain users (to verify sync).
#### Create LDAP User Federation
1. enterprise-ai Realm → left-side **User Federation** → Add provider → **ldap**;
2. Fill in per the table below.
| Setting | Value | Notes |
| --- | --- | --- |
| Vendor | **Active Directory** | Select AD, not Other (otherwise objectGUID won't be recognized) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V goes through port forwarding; in production use `ldap://dc.company-domain:389` |
| Enable StartTLS | **Off** | LDAP 389 or LDAPS 636 |
| Bind type | **simple** | username + password authentication |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Must be in LDAP DN format**, not ~~DOMAIN\user~~ |
| Bind credentials | `svc_keycloak password` | see `.env.windows` |
| Edit mode | **READ_ONLY** | read-only, does not write back to AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | if there are sub-OUs, use `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **do not use cn** |
| RDN LDAP attribute | `cn` | entry naming attribute |
| UUID LDAP attribute | `objectGUID` | AD immutable unique identifier |
| User object classes | `person, organizationalPerson, user` | comma-separated |
| Search scope | **Subtree** | **do not select One Level** (otherwise sub-OUs won't be found) |
| Pagination | **On** | fetch in batches when there are many users |
| Referral | **ignore** | avoid following a non-existent DC |
| Import users | **On** | full sync import |
| Sync Registrations | **On** | immediate sync on first login |
Save → **Synchronize all users** → wait for sync to finish.
- ⚠️ Common mistakes:
      
        Bind DN must use **LDAP format** (`CN=svc_keycloak,CN=Users,DC=xxx`), not ~~DOMAIN\user~~;
- Username LDAP attribute = `sAMAccountName`, not `cn`;
- Search scope = **Subtree**;
- **Keep spaces in CN as-is**: if the display name contains spaces (e.g. `ai all in one admin` has spaces in the middle), the Bind DN must be written as `CN=ai all in one admin,...`; writing underscores will fail to connect.
#### Verify AD Login
1. Open `http://127.0.0.1:9090/realms/enterprise-ai/account` in an incognito window;
2. Log in with a domain account (username `aitest1` or UPN `aitest1@<company-domain>` both work);
3. Successfully redirecting to the Account Console means it passed.
### 6.4 Other Enterprise Identity Sources (summary from Appendix N)
Keycloak also supports many identity sources, all connected under the same `enterprise-ai` Realm:
| Identity source | Integration method | Key points |
| --- | --- | --- |
| Microsoft Entra ID (formerly Azure AD) | Identity Providers → OpenID Connect v1.0 | Register an app in Azure to get client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (built-in) | can use a Mapper with `hd=domain` to restrict the domain |
| GitHub | Identity Providers → GitHub (built-in) | OAuth App callback `/broker/github/endpoint` |
| Generic LDAP (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor: Other, Username attribute: `uid` |
| Generic SAML 2.0 (Okta/ADFS) | Identity Providers → SAML v2.0 | paste the IdP metadata URL to auto-fill |
> ✅ Coexistence of multiple identity sources: add an Identity Provider Redirector under Authentication → Browser flow to auto-select the IdP by email domain (`@company.com`→AD, `@company.onmicrosoft.com`→Entra ID).
> 📖 Vendor docs:Keycloak official docs https://www.keycloak.org/documentation · server admin guide https://www.keycloak.org/server/ · LDAP federation https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI: Initialization, Channels, and OIDC

### 7.1 Initial Setup Wizard (first access)
On first launch, NewAPI pops up a 4-step system setup wizard:
1. **Database check**: click "Verify database connection"; expect a green check.
> **Admin account**: username `ai_all_in_one_admin`, email `ai_all_in_one_admin@<company-domain>`, password the unified admin password.
>         📌 Why create a local admin first: OIDC is not configured yet at this point, so NewAPI does not know Keycloak; you must have a local account to "get in the door", finish configuration, then go to system settings to enable OIDC.
3. **Usage mode**: select "Personal use" (company-internal: employees can register, usage is viewed separately, no top-up/billing module).
4. **Confirm initialization**: create database tables → log in as admin.
### 7.2 Configure the LLM Channel (pointing to LiteLLM)
1. **Channels** → Add new channel → type `OpenAI`;
2. Base URL: `http://litellm:4000` (container name, over the Docker network, **not localhost**);
3. Key: the actual value of `LITELLM_MASTER_KEY` from `.env` (not the example value, otherwise you get `No connected db`);
4. Model: `deepseek-chat` (example, per your actual config);
5. Save → click "Test" to verify connectivity.
If you configured multiple providers, add them the same way: Claude type `Anthropic Claude`, DeepSeek type `OpenAI`, all with Base URL `http://litellm:4000`.
### 7.3 Create API Keys
Create one for Dify and one for DeepChat to track usage separately:
1. Left-side **API Keys** → New;
2. Name `dify-key` → Save → copy `sk-xxx` (fill into Dify's model provider);
3. Create `deepchat-key` → copy `sk-xxx` (distribute to DeepChat users).
### 7.4 Allow Regular Users to Self-Service Request Keys
After logging in, employees can by default create their own Keys on the "API Keys" page. To actually call models, two conditions must be met (already preset in `.env`):
1. **Has quota**: `DEFAULT_QUOTA=100` (new users get $100 quota);
2. **Has token**: `GENERATE_DEFAULT_TOKEN=true` (an initial token is generated on registration).
> ⚠️ Only applies to "newly registered" users: users who have already logged in (e.g. `aitest1`) will not be automatically topped up; an admin must set their quota manually on the "Users" page.
### 7.5 Integrate Keycloak OIDC (let AD users log in directly)
#### ① Create the NewAPI OIDC Client in Keycloak
1. enterprise-ai Realm → **Clients** → Create client;
2. Client ID `newapi`, type OpenID Connect;
3. **Client authentication: On** (must be on, otherwise there is no Credentials tab), Standard flow / Direct access grants: On;
4. Valid redirect URIs: `http://<server-IP>:3000/*` and `http://127.0.0.1:3000/*`;
5. Save → Credentials tab → copy the Client secret.
#### ② Enable OIDC in NewAPI
NewAPI admin → **System Settings → Authentication → Custom OAuth → Add OAuth provider**, fill in:
| Group | Setting | Value |
| --- | --- | --- |
| Quick setup | Preset template / API address | `Keycloak` / `http://127.0.0.1:9090` |
| Basic info | Provider name / identifier | `Keycloak` / `keycloak` |
| Credentials | Client ID / Secret | `newapi` / the value copied from Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Field mapping | User ID / username / email | `sub` / `preferred_username` / `email` |
After clicking "Auto discover" to fill the endpoint, **change the token endpoint and userinfo endpoint to `host.docker.internal:9090`** (for NewAPI's container to call Keycloak internally); keep the authorization endpoint at `<server-IP>:9090` (for browser redirects). Scope `openid profile email`.
- ⚠️ Two things must be changed, otherwise login fails:
      
        **After saving, go back to Keycloak to add the callback URL**: add `http://<server-IP>:3000/oauth/keycloak` and `http://127.0.0.1:3000/oauth/keycloak` to Valid redirect URIs;
- **Set NewAPI's "Server address" to the intranet address**: System Settings → General Settings → change Server address to `http://<server-IP>:3000` (the default localhost causes `invalid_grant - Incorrect redirect_uri` when exchanging tokens). After changing, access NewAPI from this machine via the intranet IP as well.
Method to change the database:
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<server-IP>:3000') ON DUPLICATE KEY UPDATE value='http://<server-IP>:3000';"
docker compose restart new-api
```
> ⚠️ Troubleshooting: login returns **429 Too Many Requests** — NewAPI's critical-endpoint rate limit (default 20 requests / 20 minutes) was triggered. Temporary fix: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; the permanent solution is already preset in `.env` as four groups of variables including `CRITICAL_RATE_LIMIT_ENABLE=false`.
> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai · open-source repo https://github.com/QuantumNous/new-api

## 8. LiteLLM: Verification and Caching

> ⚠️ PII redaction (Presidio guardrail) is currently **temporarily disabled**: the new LiteLLM guardrail configuration format changed, so that section of `litellm-config.yaml` is commented out, and LiteLLM currently only proxies/forwards (no redaction). See Chapter 25 for how to enable it.
### 8.1 Verify LiteLLM Is Basically Working
```
curl -X POST http://<server-IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` is the LiteLLM admin key; use the actual value from `.env` (not the placeholder itself, otherwise you get 401). And you must use the intranet IP `<server-IP>:4001`, not `127.0.0.1:4001` (WSL2 port forwarding issue).
### 8.2 Response Caching (built-in, saves tokens)
LiteLLM already has Redis exact-match caching enabled: completely identical requests (model + messages + parameters) return the cache directly, shared across users, saving tokens.
```
# end of litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # dedicated cache Redis
    port: 6379
    ttl: 3600            # cache for 1 hour
```
> Verify: `curl http://<server-IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` returns `ping_response: true`; send the same request twice in a row and the second one drops to milliseconds. Disable caching: set `cache: false` then restart litellm.
### 8.3 Add More LLM Providers
1. In `.env`, uncomment `# OPENAI_API_KEY=` and fill in the Key;
2. In `litellm-config.yaml`, uncomment the corresponding model block;
3. `docker compose up -d litellm`.
> 📖 Vendor docs:LiteLLM official docs https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Dify / Ghost / Gitea Configuration

### 9.1 Dify: Configure the Model Provider
1. Open `http://<server-IP>` → set the admin email/password on first use (email `ai_all_in_one_admin@<company-domain>`);
  - **Settings → Model Providers** → OpenAI-API-compatible → add a model:
        
          Model name `deepseek-chat` (per actual);
  - API Key: the `sk-xxx` of `dify-key`;
  - API endpoint: `http://host.docker.internal:3000/v1`.
3. Studio → create a chat assistant → select the model → send a message to verify.
> ⚠️ Dify uses `host.docker.internal` rather than a container name, because Dify is in its own network, different from NewAPI's network.
### 9.2 Ghost: Configure the Portal
1. Admin entry `http://<server-IP>:8090/ghost/` (**note the /ghost/ suffix**). First time, go through the setup wizard to create the admin (email `ai_all_in_one_admin@<company-domain>`, password ≥ 10 characters);
2. Automation: run `scripts\ghost-setup.ps1` directly to create the admin once via the setup API, equivalent to the wizard (auto-skipped if already initialized);
3. **Theme**: Design → Themes, activate the bundled Casper/Source directly;
4. **Navigation menu**: Design → Navigation → create "Primary" navigation.
| Menu item | Type | URL |
| --- | --- | --- |
| Home | Page | `/` |
| News | Category | `/category/news` |
| Downloads | Page | `/downloads` |
| AI Workbench | Custom link | `http://<server-IP>` |
| Help Docs | Category | `/category/docs` |
1. **Downloads page**: Pages → New page "Downloads" (slug `downloads`), put the DeepChat installer intranet links in the content.
```
## DeepChat Enterprise Edition
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<server-IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<server-IP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ Don't click "Sign up" on the portal home page `/` — that's visitor/subscriber registration (with no SMTP configured it returns 500); the admin entry is `/ghost/`. Don't install the latest theme from GitHub (it may target Ghost 6.x and report incompatible on 5.x).
### 9.3 Gitea: Initialization and Runner Registration
1. Open `http://<server-IP>:3002` → install wizard (SQLite database is preconfigured) → create the admin (username `ai_all_in_one_admin`);
2. Top-right avatar → **Site Administration → Actions** → confirm "Enabled Actions" is on;
3. **Runners → Create new Runner** → copy the Registration Token;
4. Put the Token into `GITEA_RUNNER_TOKEN` in `.env`, then rebuild the Runner:
```
# ⚠️ Must use up -d, not restart (restart does not re-read the token from .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ Pitfall 1: `readonly database` is usually because `gitea.db` is owned by root; delete that root-owned db and let it be recreated as the git user.  
> 
>     ⚠️ Pitfall 2: `ROOT_URL` must be set to `http://<server-IP>:3002/`, otherwise the generated repository links are localhost and break when employees open them.
> 
>     📖 Vendor docs:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (Chinese) https://docs.gitea.com/zh-cn

## 10. DeepChat Distribution and CI/CD

### 10.1 Distribution Chain
Distribution chain = GitHub Releases installers → Gitea Actions of the `deepchat-sync` repo → update server (:8091) → Ghost download page → employee download.
> 📌 The `deepchat` source mirror repo has been deleted — a mirror only syncs git source, not release installers, so it is useless for distribution. Create it separately only if you need source auditing / secondary development.
### 10.2 Download the Installers to the Update Server
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
Verify: `curl -I http://<server-IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206. Then update the Ghost download page (see Chapter 9).
### 10.3 Auto Sync (Gitea Actions, recommended)
| Component | Description |
| --- | --- |
| `deepchat-sync` repo | Regular repo (cannot use mirror), containing `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Trigger | `schedule` (daily at UTC 2 AM) + `workflow_dispatch` (manual) |
| Logic | Check the latest GitHub tag → compare with `version.txt` → if newer, download + update the Ghost download page + write the version |
```
# trigger once manually
curl -X POST "http://<server-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<password>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ Key pitfalls: ① act_runner's `container.network` must be configured via `config.yaml` (with the `CONFIG_FILE` environment variable), otherwise the job container cannot resolve the `gitea` hostname; ② docker.sock is auto-mounted by the runner, don't mount it again in options (would report Duplicate mount point).
### 10.4 Mainland-China Download Source Configuration (sync-config.json)
The installers on the official `deepchatai.cn` download page still point to GitHub, which is basically unreachable in mainland China. The real solution is `sync-config.json`:
| Field | Purpose | Default |
| --- | --- | --- |
| `version_source` | `github` (GitHub API, most accurate) or `official` (official-site cache, reachable but lagging) | `github` |
| `download_prefix` | download acceleration prefix, e.g. `https://ghproxy.com/` | `""` |
| `keep_releases` | number of version histories to keep | `5` |
| `market_url` | the intranet marketplace address for "install Skill Butler first" on the download page | `http://<server-IP>:3100` |
```
# Can reach GitHub: keep defaults
{ "version_source": "github", "download_prefix": "" }
# GitHub acceleration proxy (most common)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 The workflow has built-in `version_cmp.py` version comparison; it only downloads when "latest > local" (to avoid the official-site cache lag rolling the client back to an older version).
### 10.5 Approach B: Build a Custom Version with Docker (optional)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# inside the container
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# output is in dist/, copy it to deepchat-updates/ after exiting
```
### 10.6 Configure the DeepChat Client (employee side)
1. DeepChat → Settings → Model Service → custom Provider / OpenAI-compatible;
2. API Base URL: `http://<server-IP>:3000/v1` (must be intranet IP);
3. API Key: the `sk-xxx` of `deepchat-key`;
4. Model: `deepseek-chat`, save then test a conversation.
> 📖 Vendor docs:DeepChat quick start https://deepchatai.cn/docs/guide/getting-started/ · open-source repo https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway and Skill Marketplace

> 📌 MCP Gateway is based on the official `@modelcontextprotocol/sdk`, exposes the standard Streamable HTTP `/mcp` endpoint, has been merged into the main `docker-compose.yml` (port 3100), and starts with the core services. Source code is in `mcp-gateway/`.
### 11.1 Built-in Platform Tools
| Tool | Purpose |
| --- | --- |
| `platform_time` | Returns the server's current time |
| `platform_echo` | Echoes text (connectivity test) |
| `platform_services` | Lists the platform service catalog |
### 11.2 Aggregate External MCP Servers
Edit `mcp-gateway/mcp-servers.json`, add stdio or http types, and restart `mcp-gateway` for it to take effect:
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
Aggregated tools automatically get the `{serverName}_` prefix to avoid name collisions.
### 11.3 Client Integration
1. DeepChat: Settings → MCP → add server → type "Streamable HTTP", URL `http://<server-IP>:3100/mcp`;
2. Dify workflow: custom tool / MCP tool configuration points to the same address.
> Verify: `curl http://<server-IP>:3100/health` returns `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` returns the tool list.
### 11.4 Skill Marketplace (intranet skill package distribution)
| Endpoint | Purpose |
| --- | --- |
| `/market` | Skill marketplace page (browse cards + download ZIP + copy install address) |
| `/skills` | Skill catalog JSON (name/description/version) |
| `/skills/<name>.zip` | skill package download (dynamically packaged) |
Skills are placed in the `mcp-gateway/skills/` directory (subdirectories containing SKILL.md), and **are automatically scanned on each request with no restart needed**. The `skill-market` bootstrap skill is built in.
> 📌 In DeepChat, MCP and Skill are two concepts: MCP is a "tool" (function calling), while a Skill is an "agent skill package" (SKILL.md + scripts). DeepChat's Skill has no "custom marketplace URL"; it only supports three install methods — folder / ZIP / URL — and intranet distribution is achieved indirectly via "URL install".
### 11.5 ⚠️ Skill Marketplace Hostname (deployment parameter, must be replaced)
"Skill Butler" reads `market_url` in `config.json` to request the `/skills` catalog. Two key points:
- **Use a hostname, not an IP**: DeepChat's agent environment redacts the IP into `[IP_ADDRESS_REDACTED]`, making the real address unreadable;
- **The hostname is a deployment parameter**: it differs for each deployment and must not be copied verbatim.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<market-hostname>:3100" }
```
##### Automatic (deploy with an Agent)
When collecting parameters, the Agent asks for the "Skill marketplace hostname" and automatically replaces `<market-hostname>` in `config.json` and `SKILL.md`.
##### Manual
1. Edit `config.json` + the fallback address in `SKILL.md`, replacing `<market-hostname>`;
2. Make the hostname resolvable: on a single machine, add `<server-IP>  <hostname>` to `C:\Windows\System32\drivers\etc\hosts`; on the company intranet, add an A record in DNS.
> ✅ For the hostname, use an FQDN like "service name + company domain", e.g. `skillmarket.your-company-domain`. To add a DNS A record: domain controller "DNS → Forward Lookup Zones → your domain → New Host (A)", or use `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "your-domain" -IPv4Address "<server-IP>"`.
### 11.6 Management API (for the AI Admin Center to create/update/delete)
| Endpoint | Purpose |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP Server CRUD (writes back config + auto-reconnects) |
| `POST /api/skills/upload` | Upload a skill zip (validates SKILL.md, prevents path traversal) |
| `DELETE /api/skills/:name` | Delete a skill |
Requires the `X-Admin-Token` header (`MCP_ADMIN_TOKEN` in `.env`). Proxied by the "MCP Gateway" page of the AI Admin Center (protected by the `ai-platform-admin` role).
> 📖 Vendor docs:MCP protocol official https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. AI Admin Center

> 📌 Positioning: this is not a Docker management platform (1Panel/Portainer), but a unified backend for administrators — Keycloak authentication + left menu linking all products + Dashboard cluster status + a unified admin account.
### 12.1 Core Capabilities
| Menu item | Behavior | Notes |
| --- | --- | --- |
| 📊 Overview Dashboard | embedded page | 8 product business metrics + Docker services (grouped by product) + system info |
| Ghost / Dify / Gitea / Keycloak | embedded stats page | view stats first; clicking "Open backend" jumps |
| 🔀 NewAPI Management | embedded page | channels/users/keys + cost reports + audit logs |
| 🔌 MCP Gateway | embedded admin page | add/remove MCP Servers, upload/delete Skills |
| 📈 Monitoring / 🔍 Observability | new tab | Grafana :3030 / Langfuse :3010 |
| 📜 Unified Logging | embedded page | query Loki by container + keyword + time |
| 💾 Backup & Restore | embedded page | backup list + backup now + one-click restore |
| 🩺 Availability Test | embedded page | scheduled + manual full-chain test |
| 📄 Report Generation | embedded page | export .md for a custom period |
| ⚙️ System Settings | embedded page | 9 UI languages + product entry URLs |
### 12.2 Initialize the Global Administrator
```
# configure in .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=see the account/password list
ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>
```
After startup, it automatically creates the `ai_all_in_one_admin` user in Keycloak (skips if it already exists) and assigns the `ai-platform-admin` Realm Role. Core idea: **one Global Admin account manages the whole platform**.
### 12.3 Docker Compose Deployment
```
# prerequisite: install dependencies first (once)
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<server-IP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<company-domain>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<server-IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Keycloak Client Configuration
1. Keycloak → enterprise-ai → Clients → Create;
2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow both On;
3. Valid Redirect URIs: `http://127.0.0.1:10086/*` and `http://<server-IP>:10086/*`;
4. Copy the Client Secret → fill `KEYCLOAK_CLIENT_SECRET` in `.env` → `docker compose up -d admin-portal`;
5. Create the Realm Role `ai-platform-admin` and assign it to `ai_all_in_one_admin`.
- ⚠️ Deployment / troubleshooting points:
      
        admin-portal sessions are stored in Redis (`admin-session-redis`); restarting the container no longer clears login sessions;
- The home page `/` must be Keycloak-protected (`express.static(..., {index:false})` + an explicit `app.get('/', keycloak.protect())`), otherwise it renders an empty dashboard before login;
- For Dify statistics use the actual admin email (`ai_all_in_one_admin@<company-domain>`), which must match the AD global admin email;
- **After modifying server.js you must run `docker restart admin-portal`**, not `up -d` (volume file content changes won't trigger a rebuild).
### 12.5 Verify
1. Open `http://<server-IP>:10086` → auto-redirects to Keycloak login (no empty dashboard before login);
2. Log in with `ai_all_in_one_admin` → enter the Overview Dashboard;
3. The Dashboard shows 8 product metrics + container groups;
4. Click each product to view stats first; click "Open backend" to jump;
5. System Settings can switch between 9 languages.
### 12.6 Scoped Admin Authorization & Keycloak Management (v0.91)
The global admin can manage other admins and Keycloak directly from the AI Admin Center:
- **Admin Accounts**: search an existing account from the Keycloak IdP (AD/LDAP users, no new account, no password) → pick modules → confirm. The system assigns the `admin:<product>` Realm Role and **really provisions the product** (SSO first, API fallback) for Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revoking a module or deleting an admin **removes the account from the product**. No-SSO products generate a temp password, viewable via the 🔑 icon (global admin only). Non-admin users get a "You are not an admin" dialog and are signed out.
- **Keycloak page**: "Sync All / Sync Changed" buttons pull AD attribute changes into Keycloak in one click; each user row has Edit (jump to the Keycloak console) and Delete; the role section supports create/delete roles and view role members. Sync/delete/role actions are global-admin only.
> ⚠️ Notes: Keycloak has no "sync single user" endpoint — incremental sync pulls all changed AD accounts. AD-federated users reappear after the next full sync or their next SSO login, so to remove permanently, disable/delete the account in AD.

## 13. Interconnect Verification Checklist

This ends the Deployment part. Finally, verify the 12 items below one by one; the platform is truly up only when all are ✅.
| # | Interconnect | Verification |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI channel test receives OK |
| 2 | Dify → NewAPI | Dify model provider test receives a reply |
| 3 | DeepChat → NewAPI | DeepChat sends a message and receives a reply |
| 4 | Keycloak → NewAPI | Keycloak account OIDC login to NewAPI |
| 5 | Keycloak → Dify | Keycloak account SSO login to Dify |
| 6 | MCP Gateway → DeepChat | DeepChat gets the MCP tool list and calls it |
| 7 | MCP Gateway → Dify | Dify workflow calls an MCP tool |
| 8 | Gitea Runner → Docker | Runner can execute CI/CD jobs |
| 9 | Gitea → update server | CI artifacts can be uploaded to the update server |
| 10 | Ghost API → Gitea | Gitea Actions can call the Ghost API to post announcements |
| 11 | Ghost → Dify redirect | the portal "AI Workbench" correctly redirects to Dify |
| 12 | AI Admin Center | Dashboard shows all containers + left menu can access all products |
> ✅ After all pass, continue to Part 2 "Administration" to learn day-to-day operations for each product, and Part 3 "Operations" for backup, health checks, and troubleshooting.

**Part 2 · Administration (day-to-day operations for each product)**

## 14. Keycloak Day-to-Day Administration

Keycloak**Entry**: http://<server-IP>:9090 → Administration Console → log in as admin.
> 📌 Many of these operations can also be done from the AI Admin Center → Keycloak page (global admin only): LDAP full/incremental sync, delete users, and role management (list/create/delete/view members). See Chapter 12.6.
### 14.1 Manage Users
1. **Create user**: Users → Add user → enter username → Create;
2. **Set password**: the user's Credentials tab → set password → turn Temporary off (otherwise first login forces a password change);
3. **Reset password**: Users → search the user → Credentials → Set password;
4. **Disable/enable**: the Enabled toggle at the top of the user detail (after disabling, all of that user's SSO immediately becomes invalid);
5. **Delete**: user detail → Delete.
### 14.2 Roles and Permissions
- **Realm Role**: Realm roles → Create role to create a role (e.g. `ai-platform-admin`); can also create/delete roles and view role members from the AI Admin Center → Keycloak page;
- **Assign role**: user → Role mapping → Assign role;
- **Groups**: Groups → create groups (`ai-admin` / `ai-user`) → add users to the group, assign roles to the group, users inherit permissions through the group.
> ✅ Admin permissions are uniformly controlled by the `ai-platform-admin` role; products use this role to identify admins when integrating SSO.
### 14.3 OIDC Clients (new products integrating SSO)
1. Clients → Create client → set Client ID to the product name (e.g. `newapi` / `grafana` / `langfuse`);
2. Client authentication: On (otherwise there is no Credentials tab), Standard flow: On;
3. Valid redirect URIs / Web origins: fill in the product's callback addresses (add both the intranet IP and 127.0.0.1);
4. Save → Credentials tab, copy the Client secret for the product side.
### 14.4 AD / LDAP Federation Maintenance
- **Change DC/password**: User Federation → click the LDAP Provider → change Connection URL / Bind credentials → Save;
- **Manual sync**: Synchronize all users; or click "Sync All / Sync Changed" on the AI Admin Center → Keycloak page (incremental sync pulls only changed AD accounts).
- **Group mapping**: Mappers tab → group-ldap-mapper → set Groups DN to the container holding the AD groups, mapping AD groups to Keycloak roles.
### 14.5 Session Management
- **View active sessions**: Users → a user → Sessions;
- **Force logout**: Sessions → Sign out all;
- **Global session/token configuration**: Realm settings → Sessions / Tokens tabs to adjust timeouts.
> ⚠️ Key pitfall review: ① keep spaces in the bind DN's CN as-is; ② Username LDAP attribute uses `sAMAccountName`, not `cn`; ③ Search scope: Subtree; ④ SSO reporting `unknown_error` is usually because the host's iphlpsvc is not running, breaking AD port forwarding; ⑤ when the AD domain controller VM is off, LDAP-federated account logins report `LDAP Connection refused`.
> 📖 Vendor docs:Keycloak official docs https://www.keycloak.org/documentation · server admin guide https://www.keycloak.org/server/

## 15. NewAPI Day-to-Day Administration

NewAPI**Entry**: http://<server-IP>:3000.
### 15.1 Channel Management (upstream models)
1. **Add channel**: Channels → Add new channel → type OpenAI (or Claude, etc.) → Base URL `http://litellm:4000` → Key `LITELLM_MASTER_KEY` → fill in the model name → Save;
2. **Test**: in the channel list click "Test", select a model to verify connectivity;
3. **Disable/enable**: the toggle in the channel list; after disabling, the channel no longer accepts requests;
4. **Priority/weight**: when multiple channels serve the same model, traffic is split by priority/weight.
### 15.2 Token (API Key) Management
1. **Create**: API Keys → New token → name it (e.g. `deepchat-key`) → can set quota / expiry / model limits → Save;
2. **Copy Key**: starts with `sk-`, **shown only once, save it immediately**;
3. **Disable/delete**: token list actions (after disabling, the Key immediately becomes invalid);
4. **Check usage**: token detail shows the consumed quota.
### 15.3 Quotas and Users
- **Default quota for new users**: `DEFAULT_QUOTA` (suggested $100);
- **Raise a single user's quota**: Users page → edit that user → set quota;
- **Top up/ban**: operations on the Users page;
- **Group management**: create groups by department, set model multipliers/quotas; when users are assigned to a group they are governed by the department.
### 15.4 Logs and Cost
- **Logs page**: check user/model/token/quota/cost/source IP for each call;
- **Cost report**: the AI Admin Center's "NewAPI Management" page has cost reports aggregated by user/model/date + the latest 100 audit logs.
> 📌 Client IP recording depends on the user's "Record IP log" setting (`record_ip_log`, off by default); enable it for the corresponding users when IP auditing is needed.
### 15.5 System Settings Essentials
- **Server address**: must be set to the intranet `http://<server-IP>:3000` (otherwise OIDC reports `invalid_grant - Incorrect redirect_uri`);
- **Authentication → Custom OAuth**: Keycloak OIDC integration (see Chapter 7);
- **Usage mode**: switchable between personal use ↔ public operation.
> ⚠️ Key pitfall review: ① channel Base URL should all be the container name `http://litellm:4000`; ② rate-limit 429 is controlled by variables such as `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ when changing the database, use the `MYSQL_PWD` environment variable directly to avoid the stderr password warning being mistaken for an error.
> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai · open-source repo https://github.com/QuantumNous/new-api

## 16. LiteLLM Day-to-Day Administration

**Entry**: admin console http://<server-IP>:4001/ui (web UI); API http://<server-IP>:4001 (use `/v1/models` for debugging). Configuration is in `litellm-config.yaml`.
### 16.0 Log in to the Admin Console
The LiteLLM `/ui` console uses the **unified account** (username `ai_all_in_one_admin`, password in `credentials.html`), controlled by `UI_USERNAME` / `UI_PASSWORD` in `.env`.
> 📌 You can also enable **Keycloak SSO auto-login**: set `LITELLM_UI_*` in `.env` (`GENERIC_CLIENT_ID/SECRET` + Keycloak auth/token/userinfo endpoints + `AUTO_REDIRECT_UI_LOGIN_TO_SSO=true`), and create a Keycloak OIDC Client `litellm` (redirect `<server-IP>:4001/sso/callback`) with a claim that returns `litellm_role=proxy_admin`. After that, visiting `/ui` auto-redirects to Keycloak for passwordless login.
### 16.1 Model List Maintenance
Edit `model_list` in `litellm-config.yaml` to add/remove models and their API Keys. Steps to add a new provider:
1. In `.env`, uncomment `# OPENAI_API_KEY=` and fill in the Key;
2. In `litellm-config.yaml`, uncomment the corresponding model block;
3. `docker compose up -d litellm`.
### 16.2 Response Caching
Redis exact-match caching, shared across users for identical requests. Adjust `cache_params.ttl` (default 3600 seconds). Disable: set `cache: false` then restart.
### 16.3 Langfuse Reporting
Automatically reports every call via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` in `.env`.
### 16.4 Restart and Troubleshooting
```
docker compose restart litellm          # restart after changing config
docker logs litellm --tail 50           # view logs
```
> ⚠️ Key pitfalls: ① guardrails need `default_on: true` to take effect globally; ② PII redaction (Presidio) is currently commented out due to upstream API changes, acting only as a pure proxy; ③ use the stable version `v1.95.1` (`main-latest` has bugs).
> 📖 Vendor docs:LiteLLM official docs https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Dify Day-to-Day Administration

Dify**Entry**: http://<server-IP> (port 80, independent official compose; upgrade/maintenance is done separately in `dify/docker/`).
### 17.1 App Management (Studio)
1. **Create app**: Studio → create blank app → choose type (chat assistant / Agent / workflow / text generation);
2. **Orchestrate**: drag nodes to orchestrate prompts, tools, knowledge bases, and variables;
3. **Debug**: click "Preview" in the top-right to run and debug;
4. **Publish**: after debugging passes, "Publish" → generate a share link or embed a web app.
### 17.2 Knowledge Base Management
1. Knowledge Base → create knowledge base;
2. Upload documents (Word / PDF / Markdown / web links), choose segmentation rules + indexing mode (high quality / economical);
3. "Add" the knowledge base in an app and the AI can answer based on the documents.
> 📌 Knowledge base content will be used by the AI to answer; do not upload confidential material (follow the data classification rules).
### 17.3 Model Providers
- **Add model**: Settings → Model Providers → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key`;
- **System model settings**: set the default chat / reasoning / embedding models.
### 17.4 Members and Permissions
- **Members**: invite members into the workspace and set Owner/Admin/Editor/Normal roles;
- **Login method**: Settings → Login method → can integrate OIDC (Keycloak) for SSO.
### 17.5 Upgrade and Maintenance
```
cd dify\docker
git pull                          # pull the latest version
docker compose pull               # pull new images
docker compose up -d              # rebuild
```
> ⚠️ Key pitfalls: ① WebSocket `NEXT_PUBLIC_SOCKET_URL` must be set to the intranet IP; ② the login password is base64-encoded; ③ if you forget the password, use `docker exec docker-api-1 flask reset-password` (≥ 8 characters).
> 📖 Vendor docs:Dify official docs https://docs.dify.ai · self-hosted https://docs.dify.ai/getting-started/install-self-hosted

## 18. Ghost Day-to-Day Administration

Ghost**Entry**: frontend http://<server-IP>:8090; backend http://<server-IP>:8090/ghost/ (note the /ghost/ suffix).
### 18.1 Log In to the Backend
The Ghost 5 backend uses **passwordless login**: enter your email → Ghost sends a 6-digit code to MailHog (`:8025`). A faster way: in the AI Admin Center, click the "Open" button for "Ghost backend" to complete login automatically (the TOTP code is computed locally, no need to check email).
### 18.2 Publish Content
1. **Post**: Posts → New post → write content (Markdown editor) → Publish;
2. **Page**: Pages → New page (e.g. "Downloads" slug `downloads`);
3. **Tags/categories**: Tags → create categories (e.g. `news` / `docs`), assign posts to categories.
### 18.3 Navigation Menu
1. Backend → Design → Navigation;
2. Edit the "Primary" navigation, add Home/News/Downloads/AI Workbench/Help Docs (see the menu table in Chapter 9).
### 18.4 Themes
- **Switch**: Design → Themes, activate the bundled Casper / Source directly;
- **Install**: the theme marketplace (Design → Change theme) or upload a zip.
> ⚠️ Don't install the latest theme from GitHub (it may target Ghost 6.x and report incompatible on 5.x); install an older-version zip instead.
### 18.5 Members and Subscriptions (if needed)
- Members: manage subscribers;
- If subscriptions are not needed, this module can be ignored (intranet portals usually don't need it).
### 18.6 Integrations (API Token)
1. Backend → Settings → Integrations → add a custom integration;
2. Generate an Admin API Key (format `id:secret`) for automation such as Gitea Actions posting announcements.
> ⚠️ Key pitfalls: ① don't click "Sign up" on the home page `/` (that's visitor/subscriber registration); ② the 6-digit code is essentially TOTP, which the AI Admin Center can compute locally; ③ even with local computation, Ghost still really sends the email, so MailHog must be kept (otherwise `Failed to send email`).
> 📖 Vendor docs:Ghost official docs https://ghost.org/docs/ · admin backend https://ghost.org/docs/admin/

## 19. Gitea Day-to-Day Administration

Gitea**Entry**: Web http://<server-IP>:3002; SSH `ssh://git@<server-IP>:2222`.
### 19.1 Repositories and Organizations
1. **Create repo**: top-right + → New repository;
2. **Create org**: + → New organization, create repos and manage teams under it;
3. **Migrate external repo**: + → New migration, enter a GitHub address to mirror (read-only source sync).
### 19.2 Users and Permissions
- **Add user**: Site Administration → User Accounts → Create user;
- **Repo permissions**: repo → Settings → Collaborators;
- **Org teams**: organization → Teams → create team → add members → grant repo permissions.
### 19.3 Actions / Runner Management
1. **Enable Actions**: Site Administration → Actions → Enabled;
2. **Register Runner**: Runners → Create new Runner → copy Token → fill `GITEA_RUNNER_TOKEN` in `.env` → `docker compose up -d gitea-runner`;
3. **Check Runner status**: the Runners page showing Idle (green) means normal;
4. **Run workflows**: repo → Actions → run manually or trigger via push.
> ⚠️ Changing the Runner token requires `up -d` (restart does not re-read .env).
### 19.4 Site Settings
- **ROOT_URL**: `GITEA__server__ROOT_URL` must be set to the intranet `http://<server-IP>:3002/`, otherwise generated repo links are localhost;
- **Registration policy**: Site Administration → Config to adjust registration switch and email config.
> ⚠️ Key pitfall: `readonly database` is usually because `gitea.db` is owned by root; delete that root-owned db and let it be recreated as the git user.
> 📖 Vendor docs:Gitea official docs (Chinese) https://docs.gitea.com/zh-cn · administration https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. MCP Gateway Day-to-Day Administration

**Entry**: http://<server-IP>:3100 (marketplace page `/market`). Management is done via the "MCP Gateway" page of the AI Admin Center (`ai-platform-admin` role), or by calling the management API directly.
### 20.1 Manage MCP Servers
1. Edit `mcp-gateway/mcp-servers.json` to add/remove servers (stdio/http types);
2. Restart: `docker compose restart mcp-gateway`;
3. Or add/remove on the AI Admin Center's MCP Gateway page (writes back config + auto-reconnects).
### 20.2 Manage Skills (skill packages)
1. **Upload**: AI Admin Center MCP Gateway page → upload a skill zip (validates it contains SKILL.md, prevents path traversal);
2. **Delete**: delete the corresponding skill;
3. Skills are placed in `mcp-gateway/skills/` (subdirectories containing SKILL.md), automatically scanned on each request, no restart needed.
### 20.3 Extend Built-in Tools
In `mcp-gateway/gateway.js`, add two steps:
```
// ① tool definition (add one item to the builtinTools array)
{ name: 'platform_health', description: 'query service health status',
  inputSchema: { type: 'object', properties: {} } }

// ② execution logic (add one branch to callBuiltin)
if (name === 'platform_health') { return 'all services running normally'; }
```
After editing, `docker compose restart mcp-gateway`.
### 20.4 Maintain the skill-market Marketplace Address
"Skill Butler"'s `market_url` is in `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; it must use a hostname (not an IP) and is a deployment parameter (see Chapter 11).
> ⚠️ The management API requires the `X-Admin-Token` header (`MCP_ADMIN_TOKEN` in `.env`); unconfigured returns 503, wrong token returns 401.
> 📖 Vendor docs:MCP protocol official https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. Update Server Administration

**Entry**: http://<server-IP>:8091, data in `deepchat-updates/`.
### 21.1 Manually Place a New Version
1. Download the official DeepChat installer to `deepchat-updates/deepchat/`;
2. Update `version.txt` (write the new version number);
3. When employees' DeepChat auto-updates, it checks `version.txt` and downloads/installs if a new version is found.
### 21.2 Auto Sync (recommended)
Rely on the Gitea Actions of the `deepchat-sync` repo to auto-check GitHub for new versions daily and sync (see Chapter 10). Manual trigger:
```
curl -X POST "http://<server-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<password>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 Sync Configuration (sync-config.json)
| Field | Purpose |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | download acceleration prefix (e.g. ghproxy.com) |
| `keep_releases` | number of version histories to keep |
| `market_url` | the "Skill Butler" marketplace address on the download page |
> 📌 When the DeepChat client reports "model connection timeout", it usually means the client is going through a dead system proxy (`ECONNREFUSED 127.0.0.1:33210`). Have the user change DeepChat "Settings → Network/Proxy" to "No proxy / direct connection".
> 📖 Vendor docs:DeepChat quick start https://deepchatai.cn/docs/guide/getting-started/ · open-source repo https://github.com/ThinkInAIXYZ/deepchat

## 22. Monitoring and Alerting Administration

Grafana**Entry**: Grafana http://<server-IP>:3030 (SSO auto-login); Prometheus :9091; Alertmanager :9093.
### 22.1 Components and Ports
| Component | Port | Purpose |
| --- | --- | --- |
| cadvisor | 8080 (internal) | collects CPU/memory/network/disk for each container |
| Prometheus | 9091 | aggregates metrics + alert rules (`monitoring/alerts.yml`) |
| Grafana | 3030 | visualization dashboard (prebuilt "AI All In One — Container Monitoring") |
| Alertmanager | 9093 | alert dedup/grouping/routing/notification |
### 22.2 View the Dashboard
1. Log in to Grafana (`ai_all_in_one_admin` / unified password, SSO auto-login);
2. Open the "AI All In One — Container Monitoring" panel to view each container's CPU/memory/network.
### 22.3 Alert Rules
Prebuilt rules (`monitoring/alerts.yml`): container down (critical), container memory >90% (warning), container CPU >80% (warning).
> ⚠️ Alert false-positive pitfall: cadvisor reports all cgroups on the host (including systemd); alert rules must filter with `{name!=""}`, and memory alerts must also add `container_spec_memory_limit_bytes > 0` (otherwise limit=0 causes a divide-by-zero that always triggers).
### 22.4 Connect Alert Notifications (Enterprise IM)
The alert path is **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → enterprise IM**. Configure it in the AI Admin Center menu **"Operations → Enterprise IM Alerts"** (configuration is stored in Redis and survives restarts):
- **Receivers**: add multiple receivers. Type "DingTalk/WeCom/Feishu" = group bot (fill webhook URL, sends to a group chat); type "DingTalk App (to person)" (AppKey/AppSecret/AgentId/userid) or "WeCom App (to person)" (corpId/secret/agentid/userid) = enterprise app, sends to individuals.
- **Sending rules**: master switch, minimum severity (critical/warning/info), whether to send "firing" and "resolved" notifications.
- **Send history**: records every send (time/receiver/type/alert name/severity/result), with pagination, adjustable page size, keyword search, and category filtering (by type / result / severity).
- Each receiver has a **Test** button to send a test message, and an enable toggle.
> ⚠️ A group-bot webhook can only send to a **group chat** — it cannot send to a single person. To message individuals you must use the enterprise-app types (DingTalk/WeCom), which require an internal app created in the DingTalk/WeCom admin console with message permission. DingTalk group bots also need "custom keywords" (e.g. "AI 平台" / "告警") or "signing", otherwise the security policy blocks the message.
> 📌 Port conflict note: Prometheus's default 9090 was occupied by Keycloak, so it was changed to 9091; Grafana's default 3000/3001 were occupied, so it was changed to 3030.
> 📖 Vendor docs:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. LLM Observability (Langfuse)

Langfuse**Entry**: http://<server-IP>:3010 (SSO auto-login; the AI Admin Center entry points to `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 Components
| Component | Purpose |
| --- | --- |
| langfuse | Web UI + trace display (3010) |
| langfuse-worker | asynchronous event processing |
| langfuse-postgres | metadata storage |
| langfuse-clickhouse | event/trace data storage |
| langfuse-minio | S3 attachment/media storage |
| langfuse-redis | queue |
LiteLLM auto-reports via `success_callback: ["langfuse"]` (`LANGFUSE_*` in `.env`).
### 23.2 View Traces
1. Log in to Langfuse → select organization `AI All In One` / project `AI Platform`;
2. In the Traces list view each call; click in to see prompt/response/model/latency/token/cost;
3. Use Session to correlate multi-turn conversations.
### 23.3 Troubleshooting
- ⚠️ Key pitfalls:
      
        Must set `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (on both web and worker), otherwise the old SDK's `trace-create` reporting fails and no data shows;
- SSO login shows no data: the SSO account (AD email) differs from the initialization account, so Langfuse auto-creates a new account that belongs to no organization. Fix (add the SSO user to the organization):
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<company-domain>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 Vendor docs:Langfuse official docs https://langfuse.com/docs · self-hosting https://langfuse.com/self-hosting

## 24. Unified Logging (Loki)

**Entry**: the AI Admin Center's "📜 Unified Logging" page (most convenient), or Loki http://<server-IP>:3110.
### 24.1 Components
| Component | Port | Purpose |
| --- | --- | --- |
| Loki | 3110 | log storage and query (single-node, local filesystem) |
| Promtail | — (internal) | discovers containers via docker.sock, collects json logs and pushes to Loki |
### 24.2 Query Logs
1. AI Admin Center → Unified Logging;
2. select container (dropdown) → enter keyword → choose time range → query;
3. The backend `/api/logs/query` queries Loki using LogQL.
### 24.3 LogQL Quick Reference
```
{container="new-api"} |= "error"              # lines of a container containing error
{container=~".+"} |~ "(?i)error|exception"      # match all containers
{service="litellm"} |= "EMAIL"                  # query by service
```
> 📌 Loki's labels are `container / project / service`, **there is no `job`**. Query with `{container=~".+"}`, not `{job="docker"}`.
> ⚠️ Key pitfall (Docker Desktop mounts): Promtail must mount `/var/run/docker.sock` and `/var/lib/docker/containers` (under WSL2 these point inside the Docker Desktop VM, exactly where the logs are); do not use the host Windows `C:\...\containers` path. Single-node Loki uses `store: tsdb` + filesystem.
> 📖 Vendor docs:Loki official docs https://grafana.com/docs/loki/latest/

## 25. PII Redaction (Presidio)

### 25.1 Two Layers of Redaction
| Layer | Capability |
| --- | --- |
| LiteLLM built-in regex (`litellm_content_filter`) | phone numbers, ID numbers, bank cards, emails, unified social credit codes, passports, IPv4, etc.; replaced with `[xxx_REDACTED]` on match; sensitive-word blacklist hits are BLOCKed/rejected |
| Microsoft Presidio | finer-grained entities (English names, emails, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 Built-in Regex Rules
| Rule | Regex | Type |
| --- | --- | --- |
| China mobile number | `\b1[3-9]\d{9}\b` | cn_mobile |
| ID card number | `\b\d{17}[\dXx]\b` | cn_id |
| bank card number | `\b\d{16,19}\b` | bank_card |
| email | prebuilt `email` | email |
| unified social credit code | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| passport number | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
The sensitive-word blacklist in `blocked_words` in `litellm-config.yaml` is added/removed according to the company's actual situation (`internal-confidential`, `trade-secret`, etc.).
### 25.3 Enable Presidio (currently commented out)
The new LiteLLM guardrail API changed, so the Presidio section is currently commented out. Key points for enabling:
- add `default_on: true` to guardrails for global effect;
- The endpoint environment variables `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` must be base URLs (LiteLLM auto-appends `/analyze`, `/anonymize`; including a path becomes `/analyze/analyze` 404).
> ⚠️ The image is about 965MB and very slow to pull in mainland China (about 1 hour in practice); if it can't be pulled, use the built-in regex first (already covers the core Chinese PII).
### 25.4 Verify
Send a request containing a phone number/email → the original value is replaced with `[REDACTED]` in the model reply; send a request containing "internal confidential" → it returns `Content blocked` directly.
> 📖 Vendor docs:Microsoft Presidio https://microsoft.github.io/presidio/ · source https://github.com/microsoft/presidio

## 26. MailHog Mail Catcher

**Entry**: http://<server-IP>:8025 (web inbox; SMTP 1025 is internal only).
### 26.1 Why It Is Needed
The Ghost 5 backend uses passwordless login: after entering the email, Ghost sends a mail with a 6-digit code. Without SMTP on the intranet the mail can't be sent and login reports `Failed to send email`. MailHog acts as the "mail exit" to catch these mails.
### 26.2 Ghost-Side Configuration
```
# Ghost environment variables in docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 View Mails
1. Open `http://<server-IP>:8025` in a browser;
2. In the inbox you can see the verification code/notification emails sent by Ghost.
### 26.4 Ghost Passwordless Login (AI Admin Center auto-login)
Ghost's 6-digit code is essentially **TOTP** (`TOTP(admin_session_secret + userId)`, 6 digits / 60 seconds / HMAC-SHA1). The AI Admin Center can compute the code locally; clicking "Ghost backend → Open" completes it automatically: password login → compute code locally → verify session → write cookie → enter backend, all seamless with no need to check MailHog.
> ⚠️ Even if you compute the code yourself, Ghost still really sends the email, so MailHog must be kept, otherwise login reports `Failed to send email`.
> 📖 Vendor docs:MailHog source repo https://github.com/mailhog/MailHog

**Part 3 · Operations**

## 27. Backup and Restore

**Entry**: the AI Admin Center's "💾 Backup and Restore" page, or the command line `scripts/backup.ps1` / `restore.ps1`. A scheduled task auto-backs up at 02:00 daily, keeping 7 days.
### 27.1 Backup Items
| Backup item | Method |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | file copy |
| Keycloak | **realm export (JSON)** |
| Config files | file copy |
### 27.2 Manual Backup
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 Scheduled Backup (scheduled task)
The scheduled task `AI-Platform-Backup` is already registered (daily 02:00). If not auto-registered, create it manually: Task Scheduler → New → program `powershell.exe`, arguments `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, trigger daily 02:00.
> 📌 Backups default to the C drive; it is recommended to periodically sync `C:\AIAllInOne\backups\` to another disk or object storage for offsite disaster recovery.
### 27.4 Restore
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
The script requires typing `yes` to confirm (add `-Force` to skip, only for scripts/CI). You can also click "Restore" on a backup in the AI Admin Center's "Backup and Restore" page for one-click restore.
### 27.5 Key Pitfalls (verified in drills)
- ⚠️
      
        Keycloak must use **realm export/import (JSON)**; pg_dump restore loses the default role association and won't start;
- After SQLite restore the owner is root; chown to the corresponding uid (grafana=472, gitea=1000), otherwise it reports readonly;
- pg_dump should include `--clean --if-exists` to avoid restore conflicts;
- The old backup.ps1 used `Copy-Item` batch copy where the dotfile `.env` caused the whole batch to silently fail; it was changed to per-file `-LiteralPath`;
- The AI Admin Center backup uses base64 relay + tar-fs to ensure binary safety (docker exec stdout over utf8 would corrupt SQLite .db).

## 28. Health Checks and Startup Self-Checks

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, outputs `health_check_<timestamp>.log`. Covers 41 containers (25 Windows core + 16 Dify); credentials are read from `.env`, no hardcoded passwords.
### 28.1 Check Scope (9 stages)
| Stage | Check items |
| --- | --- |
| Stage 1 | whether the Docker Daemon is running (waits for readiness, suited for startup self-check) |
| Stage 2 | status of 41 containers (Up/Exited/Restarting) |
| Stage 3 | 10 HTTP endpoint responses |
| Stage 4 | LiteLLM readiness + model registration, Dify API, database/Redis/Sandbox health |
| Stage 5 | LLM full chain (NewAPI → LiteLLM → DeepSeek real request) |
| Stage 6 | AD account authentication chain + NewAPI admin login |
| Stage 7 | MCP Gateway + Skill functionality |
| Stage 8 | DeepChat/Dify login prerequisites |
| Stage 9 | disk space |
### 28.2 Manual Execution
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ If the output ends with `ALL CLEAR` and `Fail: 0`, everything is normal.
### 28.3 Startup Auto-Run (scheduled task)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # delay 2 minutes after login to wait for Docker + containers to start
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 Note: the script uses `127.0.0.1`, not localhost; LiteLLM internal health uses `/health/readiness` (no auth); `docker-init_permissions-1` Exited(0) is normal; the Update Server returning 403 is normal (no default index.html); exit code 0=pass, 1=has failures.

## 29. Troubleshooting Guide

### 29.1 Three General Troubleshooting Steps
1. **Check container status**: `docker ps -a` to find Exited/Restarting;
2. **Check logs**: `docker logs <container-name> --tail 30`;
3. **Check health**: run `health-check.ps1` to locate the failed stage.
### 29.2 Symptom Quick-Reference Table
| Symptom | Root cause | Fix |
| --- | --- | --- |
| can't open any product via localhost | WSL2 IPv6 `::1` compatibility issue | use intranet IP or 127.0.0.1 |
| Ghost keeps Restarting, reports ECONNREFUSED :3306 | leftover MySQL config in the volume | force SQLite via environment variables (Chapter 4) |
| 4 Dify containers crash on startup with ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | change to 50 (Chapter 5) |
| NewAPI channel test reports No connected db | channel key has the example value | fill in the actual `LITELLM_MASTER_KEY` value |
| NewAPI OIDC reports invalid_grant / Incorrect redirect_uri | server address is localhost | set the intranet address (Chapter 7) |
| NewAPI login 429 | critical-endpoint rate limit | clear redis rateLimit:* or change .env |
| Dify keeps connecting ws://localhost when creating apps | WebSocket address not changed | set NEXT_PUBLIC_SOCKET_URL to intranet IP |
| Dify login click does nothing | password needs base64 / 401 when not logged in is normal | base64 first in scripts; retry in browser |
| Gitea reports readonly database | gitea.db owned by root | delete the root-owned db and rebuild |
| Gitea repo links are localhost | ROOT_URL not changed | set the intranet address |
| SSO login reports unknown_error | AD port forwarding broken (iphlpsvc) | check iphlpsvc + Hyper-V network |
| Keycloak can't see domain users | Search scope = One Level | change to Subtree |
| Langfuse shows no data | V4_WRITE_MODE or SSO account not in the organization | set dual; SQL to add organization (Chapter 23) |
| DeepChat model connection timeout | client goes through a dead system proxy | set to no proxy/direct |
| Loki can't find logs | used the job label | use `{container=~".+"}` |
| Presidio 404 /analyze/analyze | endpoint has a path | fill base URL only |
| new endpoint 404 after changing server.js | up -d does not re-read volume changes | docker restart admin-portal |
### 29.3 Common Commands
```
docker ps -a                                        # all container statuses
docker logs <container> --tail 50                   # view logs
docker compose up -d <service>                      # rebuild a service
docker compose restart <service>                    # restart a service (does not re-read .env)
docker system df                                     # Docker disk usage
C:\AIAllInOne\windows\scripts\health-check.ps1       # one-click health check
```

**Appendix**

## App.. Vendor Documentation Index

### Vendor Documentation for All Products
| Product | Official docs URL |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Keycloak server admin | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| NewAPI website | https://www.newapi.ai |
| NewAPI source | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify self-hosted | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Ghost admin backend | https://ghost.org/docs/admin/ |
| Gitea (Chinese) | https://docs.gitea.com/zh-cn |
| Gitea administration | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| DeepChat source | https://github.com/ThinkInAIXYZ/deepchat |
| MCP protocol | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse self-hosting | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Presidio source | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ The end of each chapter also lists the corresponding product's vendor docs for convenient chapter-by-chapter reference.

