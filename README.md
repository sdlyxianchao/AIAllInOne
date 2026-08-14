# AI AllInOne — Enterprise Intranet AI Platform (Multi-platform, Self-hosted)

> 📖 **Languages**: [English](README.md) · [简体中文](i18n/README.zh.md) · [繁體中文](i18n/README.zh-TW.md) · [Français](i18n/README.fr.md) · [Español](i18n/README.es.md) · [Português](i18n/README.pt.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [العربية](i18n/README.ar.md)

A **ready-to-use, multi-platform** enterprise intranet AI stack: unified authentication, LLM routing, PII redaction, AI applications, an enterprise portal, source/CI, client distribution, unified administration, monitoring & alerting, observability, logging, and backup/restore — all orchestrated with Docker into one integrated system, with **single sign-on to every product via one Keycloak account**.

The repository supports three deployment platforms:

| Platform | Repo directory (on GitHub) | Typical use case | Status |
|---|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop (single machine) | ✅ **In testing** |
| Linux / macOS | `linux/` | Self-hosted Linux server / macOS (Docker) | 🚧 Coming soon |
| Online server | `docker/` | Cloud / bare Docker host (production) | 🚧 Coming soon |

> **Current status: we are actively testing the Windows platform.** The Linux/macOS and online-server platforms are still under development — their folders only contain a "Coming Soon" README for now.
>
> In the local working directory these folders are named `windows-github/`, `linux-github/`, and `docker-github/`; after uploading to GitHub the `-github` suffix is dropped and they become `windows/`, `linux/`, and `docker/`. Every future update follows this same mapping.

---

## 1. What's inside

| Layer | Component | Purpose |
|---|---|---|
| Auth | Keycloak | SSO / OIDC, can integrate with AD/LDAP or local accounts |
| LLM routing | NewAPI | Channels, keys, quotas, audit, cost |
| PII redaction | LiteLLM + Presidio | Auto-redact phone numbers / IDs / emails before model calls |
| AI applications | Dify | Visual AI app / Agent platform |
| Enterprise portal | Ghost | Company announcements & news portal |
| Source / CI | Gitea + Runner | Internal Git + Actions automation |
| Client distribution | Update Server | DeepChat installer hosting & auto-update |
| Unified admin | AI Admin Center | Single entry: dashboard + embedded products + audit/cost/reports |
| Gateway | MCP Gateway | Skill / MCP market management |
| Monitoring | Prometheus + Grafana + Alertmanager | Container resource monitoring + alert notifications |
| LLM observability | Langfuse | Trace / latency / tokens / cost of every model call |
| Unified logging | Loki + Promtail | Aggregated, searchable logs from all containers |
| Backup & restore | backup/restore scripts + admin page | Daily full backup + one-click restore |

Every platform directory contains: `docker-compose.yml`, `.env.example`, `*-deploy-guide*.html` (deployment guide), `*-checklist*.html` (progress checklist), identity-provider integration guide, one-click deployment scripts, plus sanitized source code and config. **No real secrets are committed.**

### Screenshots

**AI Admin Center** — unified management portal

![AI Admin Center](<pics/AI Admin.png>)

**Dify** — AI application platform

![Dify](<pics/Dify.png>)

**Enterprise portal** — home (Ghost)

![Enterprise portal home](<pics/AI All In One Hub.png>)

**Enterprise portal** — news

![Enterprise portal news](<pics/AI All In One Hub News.png>)

**Download center** — DeepChat installers

![Download center](<pics/AI All In One Hub Download.png>)

**DeepChat** — desktop AI client

![DeepChat](<pics/DeepChat.png>)

---

## 2. Quick start: automated deployment via a Harness-style tool (recommended)

Harness-style tools (OpenClaw, Microsoft Scout, WorkBuddy, and similar) can read this project's docs and config and build the entire environment step by step on your machine. Below is the standard flow.

### 5 prerequisites

**1. Install a Harness-style tool**
Install OpenClaw / Microsoft Scout / WorkBuddy (or an equivalent). They can all read/write local files, run commands, and search the web.

**2. Buy a subscription or configure your own API**
Complete the subscription in the tool, or fill in your own LLM API key (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.) so the tool can converse normally.

**3. Prepare the network environment**
This is the step that most often blocks people:
- Make sure the machine can reach **Docker image registries** (Docker Hub / quay.io, etc.). If direct access fails, configure a registry mirror (e.g. DaoCloud or another regional mirror) beforehand.
- Make sure it can reach **GitHub** (to clone the repo and pull some public dependencies). If direct access fails, use a proxy or download the source archive in advance.
- Confirm the target machine is reachable on the network segment you intend to expose.

**4. Git clone or download the project locally**
```bash
git clone <your-repo-url> AIAllInOne
# or download the archive and extract it to any local directory
```

**5. Paste the prompt below into the tool to start automated deployment**

Copy the **entire prompt** below into the Harness tool's input box, then answer its questions one by one. The tool will: detect your platform → collect parameters → generate a local progress file → configure step by step per the deployment guide → iterate with you to test and fix problems → keep the progress updated → run a full test at the end and report the results.

### One-click deployment prompt (copy into the tool)

````text
You are a deployment engineer for an enterprise intranet AI platform. Based on this project's documentation and config files, fully deploy and verify the "AI AllInOne" platform on the current machine. Communicate with me in English throughout and strictly follow the process below.

## Step 1: Confirm the deployment directory and target platform

1. First ask me: what is the local extraction/clone path of this project? (e.g. C:\AIAllInOne or /opt/AIAllInOne)
2. After entering that directory, determine the target platform folder based on the current machine's operating system:
   - Windows → use the `windows-github` (or `windows`) folder
   - Linux / macOS → use the `linux-github` (or `linux`) folder
   - Online server / pure Docker environment → use the `docker-github` (or `docker`) folder
   If unsure, tell me what OS you detected and confirm with me which folder to use.
3. Read the root README.md and the README.md inside that platform folder to understand the architecture and deployment approach before acting.

## Step 2: Collect required parameters (ask me one by one; don't skip or guess)

Before configuring, collect the following information, asking me for anything missing and explaining the purpose of each item:

1. The intranet IP used to expose the platform (the address other machines use to reach it, e.g. 192.168.1.100).
2. Identity source (Identity Provider):
   - Company AD domain controller (Active Directory): ask me for the domain name, DC IP, LDAP base DN, bind DN, bind account password, sAMAccountName, etc.
   - Other IdP (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk, etc.): ask me for the corresponding config and account info.
   - No external identity source (local accounts only): confirm with me and skip.
3. Unified admin account: username, password, email (used for Keycloak SSO and admin login to every product).
4. LLM API keys: which model providers and keys I actually have (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.); skip any I don't have.
5. Other items to ask as needed: alert notification channel (DingTalk/WeCom/Feishu webhook URL), HTTPS certificates, backup retention policy, etc.

## Step 3: Generate a local progress file

1. Locate the "progress checklist" document in the platform folder (e.g. *-checklist*.html) and the "identity source integration guide" (e.g. *-ad-integration*.html or IdP-related docs).
2. Based on the checklist content, generate a new progress file in the project directory, named e.g. "deployment-progress-<platform>-<date>.md", copying every checklist item as incomplete (- [ ]).
3. From then on, promptly update this progress file each time you complete an item or solve a problem, and briefly report progress to me in the conversation.

## Step 4: Configure step by step per the deployment guide

1. Carefully read the platform's "deployment guide" document (e.g. *-deploy-guide*.html) and follow it strictly, paying special attention to "⚠️ critical pitfalls / gotchas" it marks.
2. Rough order: prepare environment variables → start containers → initialize auth/IdP → configure LLM routing and model channels → initialize each product → configure monitoring/observability/logging/redaction → configure backup & restore.
3. Prefer the automation scripts already in the directory (e.g. bootstrap.ps1, keycloak-realm-init.ps1, health-check, etc.); don't click through UIs for steps that can be automated.

## Step 5: Iterate with me to test and fix problems

1. When a step fails or doesn't match expectations, first inspect logs (docker logs, each service's health endpoint, config files), locate the root cause, then fix it — don't blindly retry.
2. When you need me involved (e.g. running a command with admin rights, confirming a login, providing extra info), clearly tell me "what to do and why".
3. After solving, record the root cause and fix in the progress file and briefly report back to me.

## Step 6: Full end-to-end verification

Once every checklist item is complete, run a full end-to-end test covering at least:
- Service health (all containers Up, health endpoints normal);
- SSO unified login (Keycloak login → SSO/auto-login into each product);
- LLM chain (send one real chat through NewAPI/LiteLLM, verify the response + PII redaction works);
- Identity-source login (if AD/other IdP is connected, test login with the corresponding account);
- Monitoring/observability/logging/alerting (confirm data exists and alerts can fire);
- Backup & restore (run a backup and verify it can be restored).

Finally, summarize the test results item by item, clearly marking ✅ passed / ❌ failed; for failures, give the root cause and follow-up suggestions.
````

---

## 3. Manual deployment (alternative)

If you prefer not to use a Harness-style tool, you can deploy manually following each platform's `README.md` and `*-deploy-guide*.html`. The main flow is the same: start containers → initialize auth/IdP → configure LLM channels → initialize each product → configure monitoring/backup.

---

## 4. Security & notes

- This repository contains **no real secrets**; all real values live in each runtime environment's `.env` (only `.env.example` templates are committed).
- The default is plain HTTP on the intranet; for HTTPS see the relevant chapter in each platform's deployment guide.
- Per-platform gotchas, architecture diagrams, port tables, and data flows are in the corresponding `*-deploy-guide*.html` documents.

---

## 5. Community — WeChat group

> 👥 **WeChat group** — scan the QR code below to join the community and discuss deployment & usage.

<!-- TODO: WeChat group QR code image goes here (placeholder) -->

![WeChat Group]()

---

## 6. Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sdlyxianchao/AIAllInOne&type=Date)](https://star-history.com/#sdlyxianchao/AIAllInOne&Date)
