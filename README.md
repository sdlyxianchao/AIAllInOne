# AI AllInOne — Enterprise AI Platform, Self-hosted & Open Source

> 📖 **Languages**: English · [简体中文](i18n/README.zh.md) · [繁體中文](i18n/README.zh-TW.md) · [Français](i18n/README.fr.md) · [Español](i18n/README.es.md) · [Português](i18n/README.pt.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [العربية](i18n/README.ar.md)

> ⭐ **If this project helps you, give it a star — it's free and helps more people find it.**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

> **One server. One SSO. The whole enterprise AI stack — free and self-hosted.**

AI AllInOne is a ready-to-use, **open-source** enterprise intranet AI platform: unified SSO, LLM routing, AI applications, an enterprise portal, source/CI, unified administration, monitoring & alerting, observability, logging, and backup/restore — all orchestrated with Docker into one integrated system. **Employees log in once with a single account and get every AI tool.**

![AI Admin Center](<pics/AI Admin.png>)

![Enterprise portal](<pics/AI All In One Hub.png>)

---

## ✨ Why AI AllInOne

| | |
|---|---|
| 🧩 **All-in-one, no assembly** | 8+ open-source components pre-integrated: auth, gateway, apps, portal, Git, monitoring, logging, backup. No "glue it yourself" work. |
| 🔐 **One SSO for everything** | Single Keycloak account (with AD/LDAP federation) signs into every product automatically. |
| 🔒 **Data never leaves the intranet** | Fully self-hosted — model calls, prompts, docs and user data stay inside your network. |
| ⚡ **Deploy in ~30 minutes** | `docker compose` + automation scripts, or let an AI agent deploy the whole stack for you. |
| 🛡️ **PII redaction** | Phone numbers / IDs / emails are redacted before calls reach external LLMs (Presidio). |
| 📊 **Observe everything** | Prometheus + Grafana monitoring, Langfuse LLM tracing, Loki unified logs, IM alerting (DingTalk/WeCom/Feishu). |
| 💾 **Backup & restore** | One-click daily full backup and restore from the admin portal. |
| 🌐 **9 languages** | Manuals and admin UI localized (zh-CN / zh-TW / en / fr / es / pt / ja / ko / ar). |

## 📦 What's inside

| Layer | Component | Purpose |
|---|---|---|
| Auth | Keycloak | SSO / OIDC, AD/LDAP federation or local accounts |
| LLM routing | NewAPI | Channels, keys, quotas, audit, cost |
| PII redaction | LiteLLM + Presidio | Auto-redact sensitive info before model calls |
| AI applications | Dify | Visual AI app / Agent platform + unified knowledge base (RAG) |
| Enterprise portal | Ghost | Company announcements & news portal (custom Corp Portal theme included) |
| Source / CI | Gitea + Runner | Internal Git + Actions automation |
| Client | DeepChat | Local AI desktop client (Windows / macOS / Linux) |
| Client distribution | Update Server | DeepChat installer hosting & auto-update |
| Unified admin | AI Admin Center | Single entry: dashboard + embedded products + audit/cost/reports + scoped admin authorization + Keycloak sync/roles |
| Gateway | MCP Gateway | Skill / MCP market + Dify knowledge retrieval (RAG) |
| Monitoring | Prometheus + Grafana + Alertmanager | Container resource monitoring + alert notifications |
| LLM observability | Langfuse | Trace / latency / tokens / cost of every model call |
| Unified logging | Loki + Promtail | Aggregated, searchable logs from all containers |
| Backup & restore | scripts + admin page | Daily full backup + one-click restore |
| AI operations | WorkBuddy / OpenClaw / Microsoft Scout | Operate & maintain the whole platform through an AI agent — see [AI Agent Operations](#ai-agent-operations) |

### Architecture & data flow

![Architecture](<pics/Architecture.png>)

![Data flow](<pics/DataFlow.png>)

---

## 🚀 Quick start

**Prerequisites:** a machine with Docker (Windows 11 + Docker Desktop, or Linux), and network access to Docker registries.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# start the core stack, then follow the deployment guide to initialize auth/LLM channels/products
docker compose up -d
```

Two ways to go from here:

1. **Automated (recommended)** — hand the deployment to an AI agent (WorkBuddy / OpenClaw / Microsoft Scout). It reads the deployment guide and configs, asks you for parameters (server IP, IdP, admin account, LLM keys), and configures everything step by step.

#### 🤖 AI Deployment — one-click, driven by an AI agent

> Copied from the deployment guide (chapter 0): the guide can be executed **chapter by chapter by hand**, or handed to an **AI agent** end-to-end. With WorkBuddy / OpenClaw / Microsoft Scout, point the agent at this directory (guide, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), paste the prompt below, and it will: detect the platform → collect your parameters one by one → generate a local progress file → configure step by step per the guide → test, debug and retry on failures → update progress throughout → run a full end-to-end verification and report the results.

You can also pair it with the bundled **AIOps skill** (the `AIOperation/agent/` folder in this repo, see the "AI Agent Operations" section below) — the skill covers the full deployment flow, so the same agent can deploy the platform first, then handle day-to-day ops with plain-language requests.

**Prompt to copy to your agent** (Windows platform, English — the agent will walk you through it):

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

> 💡 Even if you **don't use an agent**, this prompt doubles as a clear pre-deployment checklist — it lists every parameter you need to prepare before starting.

2. **Manual** — follow the [Windows deployment guide](windows/windows-deploy-guide-v2.md) step by step (or `windows/README.md` + `windows-checklist.html`).

> **Platform status**: Windows (Windows 11 + Docker Desktop) and **Linux** (Debian 12+ / Ubuntu 22.04+ / RHEL 9+ / Rocky 9+ / Fedora 39+) are **actively tested**.

## 🖼️ Screenshots

**Dify** — AI application platform · **MCP/Skill Market** — one-click tool & skill access · **DeepChat** — desktop AI client

![Dify](<pics/Dify.png>) ![MCP/SKILL Market](<pics/Market.png>) ![DeepChat](<pics/DeepChat.png>)

More screenshots (48 real UI captures) are embedded in the [Admin Manual](docs/admin-manual/index.md).

## 📚 Manuals (online, 9 languages)

| Manual | Languages |
|---|---|
| **Admin Manual** | [English](docs/admin-manual/index.md) · [简体中文](docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](docs/i18n/admin-manual-zh-TW/index.md) · [Français](docs/i18n/admin-manual-fr/index.md) · [Español](docs/i18n/admin-manual-es/index.md) · [Português](docs/i18n/admin-manual-pt/index.md) · [日本語](docs/i18n/admin-manual-ja/index.md) · [한국어](docs/i18n/admin-manual-ko/index.md) · [العربية](docs/i18n/admin-manual-ar/index.md) |
| **User Manual** | [English](docs/user-manual/index.md) · [简体中文](docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](docs/i18n/user-manual-zh-TW/index.md) · [Français](docs/i18n/user-manual-fr/index.md) · [Español](docs/i18n/user-manual-es/index.md) · [Português](docs/i18n/user-manual-pt/index.md) · [日本語](docs/i18n/user-manual-ja/index.md) · [한국어](docs/i18n/user-manual-ko/index.md) · [العربية](docs/i18n/user-manual-ar/index.md) |

## 🎓 Training Program

The platform ships with a complete **on-the-job training program** (17 modules, 60 hours, 10 working days) for deployment & operations onboarding: master outline, 10-day schedule, per-product outlines/textbooks/labs/exams (each with local + official docs + video references), and a final exam package with certificate.

| Training package | Language | Entry |
|---|---|---|
| **English** | EN | [training/training_eng/index.md](training/training_eng/index.md) |
| **简体中文** | zh-CN | [training/training_chn/index.md](training/training_chn/index.md) |

> ⚠️ For published copies (GitHub / Gitee): the English README links to the **English** training package; the Chinese README (Gitee default) links to the **Chinese** package — keep the language matched.

Also see the **[AI Agent Operations Guide](AI-AGENT-OPS.md)** (9 languages) for day-to-day AI-agent-driven operation.

## 👥 Community

> WeChat group — for discussion, deployment help, feedback and **co-building**. Scan the QR code; we'll pull you in.

<img src="pics/wechat.png" alt="WeChat group QR code" width="200" />

Also available: [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions) (or open an [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues)).

## 🤝 Contributing

This project is **open source and free** — it grows through the community. You can help in many ways, no matter your skill level:

- ⭐ **Star the repo** — the simplest and most valuable support
- 🐛 **Report bugs / request features** — open an issue with a clear description
- 📝 **Write docs & tutorials** — deployment guides, troubleshooting, best practices
- 🌐 **Translate** — manuals are already in 9 languages; help improve or add more
- 🧪 **Test & share** — deploy it and tell us what worked / what didn't
- 💻 **Contribute code** — the integration layer (unified SSO, admin portal, monitoring, backup) is the easiest place to start

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, and our public [Roadmap](#roadmap) to see what's next. **Every contributor is listed in the README's contributors section.**

<h2 id="roadmap">🗺️ Roadmap</h2>

- ✅ v1.00 — Full stack: Windows + Linux (Debian/RPM) + Dify + offline deployment + AI Admin Center + scoped admin authorization + IM alerting + semantic caching (LiteLLM redis-semantic)
- 🚧 **Contributor program** — task board, weekly sync calls, certification for deployment partners

## 🔒 Security & notes

- This repository contains **no real secrets**; real values live in each runtime `.env` (only `.env.example` templates are committed).
- Default is plain HTTP on the intranet; HTTPS guidance is in each platform's deployment guide.
- Per-platform gotchas, port tables, and data flows are in the corresponding `*-deploy-guide*` docs (Markdown / HTML, e.g. `windows/windows-deploy-guide-v2.md`).

## 📋 Changelog

### v1.00 (2026-08-23)

**New: Linux Platform Support**
- Complete Linux deployment: Debian-based (Debian 12+ / Ubuntu 22.04+) and RPM-based (RHEL 9+ / CentOS Stream 9+ / Rocky 9+ / Fedora 39+)
- Pre-built Docker image packages for offline deployment (6.2GB main + 2.5GB Dify)
- Linux bash scripts: backup.sh, restore.sh, health-check.sh, ghost-setup.sh, dify-setup.sh
- Import scripts for Windows (PowerShell) and Linux (bash)

**New: Dify AI Application Platform**
- Standalone deployment with separate Docker Compose
- Auto-initialization script: creates default chat app, knowledge base, and API key
- Keycloak SSO integration for unified login

**New: Gitea Sync Workflow**
- DeepChat auto-update sync scripts exported and documented
- Gitea Actions workflow for automated desktop client distribution

**Improved: Deployment Guides**
- Windows deploy guide: offline image import, scheduled tasks, port quick reference, verified fix log
- Linux deploy guide (Debian/RPM): full parity with Windows guide
- Keycloak IdP questionnaire (7 types) + Admin REST API auto-configuration
- Dify auto-setup and Gitea sync import steps

**Improved: AI Admin Center**
- Availability tests dynamically query available models via NewAPI (no hardcoded DeepSeek)

**Improved: GitHub Pages**
- New project landing page at https://sdlyxianchao.github.io/AIAllInOne/

## ⭐ Support the project

If AI AllInOne saves you time or money, a star costs you nothing and helps the project grow:

- ⭐ **Star this repo** — helps more people discover and benefit from the project
- 🐛 **Report issues** — bugs, feature requests and deployment problems are all welcome
- 🤝 **Contribute** — code, docs and translations (9 languages) are all welcome
- 💬 **Join the community** — share your deployment experience and ideas
- 📣 **Share it** — tell your colleagues, or post about it on your blog / social media

One star on the top right is the biggest support for this project.

## 📄 License

[MIT](LICENSE) — free to use, modify and distribute. The underlying components retain their own licenses (see the deployment guide's license review section).

## 🤖 AI Agent Operations

### 🎯 Ready-made AI Ops Skill — download & deploy

> The repo now ships a **ready-made Ops Skill** at [`AIOperation/agent/`](AIOperation/agent/SKILL.md) that turns any AI agent (WorkBuddy, OpenClaw, Microsoft Scout, or equivalent) into a full platform operator — **with zero server-specific setup**. No IPs, no passwords, no hardcoded paths: credentials are read from `.env`, paths auto-resolve, so it works on **any machine** where this platform is deployed.

**What the skill covers** (all day-to-day management): one-command health checks (41 containers × 9 stages), container start/stop/restart & log troubleshooting, configuration changes, the whole AI Admin Center — admins & roles, Keycloak/AD sync, NewAPI channels/tokens/cost, Gitea sync, Ghost portal, Dify, MCP Gateway, monitoring/alerts/logs/PII, availability tests, reports, backup & restore, IM alerting — **native management of every third-party product** (Keycloak realms/roles/clients, NewAPI channels/tokens, LiteLLM models/users, Dify apps/knowledge bases, Ghost content/themes, Gitea repos/CI, Grafana dashboards/users, Langfuse projects, Prometheus/Alertmanager/Loki, Update Server) — plus version releases, disk cleanup and troubleshooting.

**Download & deploy in 3 steps:**

1. **Get it** — clone the repo or download the `AIOperation/` folder from GitHub / Gitee:
   ```bash
   git clone https://github.com/sdlyxianchao/AIAllInOne
   # the skill lives at: AIAllInOne/AIOperation/agent/
   ```
2. **Install it** — copy the folder into your agent's skills directory (WorkBuddy: `~/.workbuddy/skills/ai-all-in-one-deploy-ops/`; other agents follow their own skill-folder convention):
   ```bash
   cp -r AIAllInOne/AIOperation/agent ~/.workbuddy/skills/ai-all-in-one-deploy-ops
   ```
3. **Use it** — open the agent in your deployment directory and just ask, e.g. *"Run the health check"*, *"Back up the platform"*, *"Why is Ghost down?"*, *"Publish v0.96"*. The skill reads `.env` for credentials itself — you never paste passwords, and it adapts to whichever machine you point it at.

The platform is designed to be **operated and maintained through an AI agent** — WorkBuddy, OpenClaw, Microsoft Scout, or any equivalent tool. Instead of clicking through a dozen admin consoles, you tell the agent what you want in plain language; it reads files, runs commands, and talks to the services for you.

Everything that makes the platform run lives on your machine as **code, config, and data** — Docker Compose services, `.env` files, admin APIs, and the databases/files that hold the actual state — so an agent can see and change all of it:

| Task | How the agent does it |
|---|---|
| Health check / status overview | `docker ps` + health endpoints + admin APIs |
| Start / restart / stop services | `docker compose up -d <svc>` / `docker restart <svc>` |
| Inspect logs & errors | `docker logs <svc> --tail N` + log files |
| Change configuration | edit config files, then restart the affected container |
| Edit the AI Admin Center | edit `admin-portal/public/index.html` (UI) or `admin-portal/server.js` (API), then restart |
| Manage Gitea + sync | Gitea API: trigger workflows, read run status/logs, edit repo files |
| Manage the Ghost portal | read/write the Ghost SQLite DB, edit theme templates, import the content seed |
| Backup & restore | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publish a release | `publish.ps1` (build + commit + push to GitHub) |
| Troubleshoot | port conflicts, Docker Desktop issues, DNS/proxy, etc. |

Example: *"Check that all services are running and healthy"* — the agent runs `docker ps`, hits each health endpoint, and reports what's wrong and why. For ready-made prompts, best practices and the full command reference, see the **[AI Agent Operations Guide](AI-AGENT-OPS.md)** (9 languages).

### 🛡️ AI Ops — one-command health check & autostart

> Copied from the deployment guide (chapter 12): the platform ships a **one-command health check** (`health-check.ps1`) that verifies all **41 containers in 9 stages** — including the full LLM chain, AD authentication + admin login, MCP/Skill functionality and disk space. Credentials are read from `.env`; the script hardcodes no passwords. Just tell your AI agent to run it (e.g. *"Run the health check and tell me what's failing"*), or let it run automatically at every logon:

| 阶段 | 检查项 | 方式 |
|---|---|---|
| Stage 1 | Docker Daemon 是否运行（等待就绪，适配开机自检） | `docker info` |
| Stage 2 | 41 个容器状态（Up/Exited/Restarting） | `docker ps -a` |
| Stage 3 | 10 个 HTTP 端点响应（含 MCP Gateway） | `curl.exe 127.0.0.1:端口` |
| Stage 4 | LiteLLM /readiness + **模型注册**、litellm-redis PING、Dify API /health、MySQL/PostgreSQL/Redis/Sandbox 健康状态 | `docker exec` + `docker inspect` |
| Stage 5 | **LLM 全链路**：NewAPI 渠道状态 + 以 DeepChat 和 Dify 名义各发一个真实请求（NewAPI → LiteLLM → DeepSeek） | `curl /v1/chat/completions` |
| Stage 6 | **AD 账号认证链路**：Keycloak well-known + AD 用户同步（aitest1）+ NewAPI OIDC 配置 + OIDC clients 完整性 + **NewAPI 管理员登录** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill**：/health + tools/list + tools/call + 外部 Skill 聚合 | curl MCP 协议 |
| Stage 8 | **DeepChat / Dify 登录前置条件**：NewAPI 服务可用 + Dify 已初始化 | curl + psql |
| Stage 9 | **磁盘空间**：系统盘剩余 + Docker 磁盘占用 | `Get-PSDrive` + `docker system df` |

**Run it manually** (PowerShell):

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**Run it automatically at logon** (scheduled task, run PowerShell as admin):

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
