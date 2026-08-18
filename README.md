# AI AllInOne — Enterprise AI Platform, Self-hosted & Open Source

> 📖 **Languages**: English · [简体中文](i18n/README.zh.md) · [繁體中文](i18n/README.zh-TW.md) · [Français](i18n/README.fr.md) · [Español](i18n/README.es.md) · [Português](i18n/README.pt.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [العربية](i18n/README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

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

1. **Automated (recommended)** — hand the deployment to an AI agent (WorkBuddy / OpenClaw / Microsoft Scout). It reads the deployment guide and configs, asks you for parameters (server IP, IdP, admin account, LLM keys), and configures everything step by step. [Copy the one-click prompt →](windows/windows-deploy-guide-v2.md)

<details>
<summary>📋 One-click deployment prompt (click to expand)</summary>

````text
You are a deployment engineer for an enterprise intranet AI platform. Based on this project's documentation and config files, fully deploy and verify the "AI AllInOne" platform on the current machine. Communicate with me in English throughout and strictly follow the process below.

## Step 1: Confirm the deployment directory and target platform
1. First ask me: what is the local extraction/clone path of this project? (e.g. C:\AIAllInOne or /opt/AIAllInOne)
2. After entering that directory, determine the target platform folder based on the current machine's operating system (Windows → windows-github/windows; Linux/macOS → linux-github/linux; Online server → docker-github/docker).
3. Read the root README.md and the platform folder's README to understand the architecture before acting.

## Step 2: Collect required parameters (ask me one by one; don't skip or guess)
1. The intranet IP (or domain) used to expose the platform.
2. Identity source: company AD domain controller (domain, DC IP, LDAP base DN, bind DN, bind password), other IdP (LDAP/OIDC/Feishu/WeCom/DingTalk), or local accounts only.
3. Unified admin account: username, password, email (Keycloak SSO + admin login to every product).
4. LLM API keys: which providers/keys I have (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.); skip any I don't have.
5. Ghost portal example content language.
6. Other: MCP skill-market hostname, alert channel webhook (DingTalk/WeCom/Feishu), HTTPS certs, backup retention.

## Step 3: Generate a local progress file
1. Find the progress checklist (*-checklist*.html) and identity-provider guide (*-ad-integration*.html) in the platform folder.
2. Generate "deployment-progress-<platform>-<date>.md" with every checklist item as incomplete (- [ ]).
3. Update this file as you complete items and report progress to me.

## Step 4: Configure step by step per the deployment guide
1. Follow the platform deployment guide (*-deploy-guide*.html) strictly, paying attention to "⚠️ critical pitfalls".
2. Rough order: env vars → start containers → init auth/IdP → configure LLM routing/channels → init each product (Ghost: deploy Corp Portal theme + import seed) → monitoring/observability/logging/redaction → backup.
3. Prefer the automation scripts in scripts/ (bootstrap.ps1, keycloak-realm-init.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, health-check.ps1, etc.).

## Step 5: Iterate with me to test and fix problems
1. On failure: inspect logs (docker logs, health endpoints, configs), find the root cause, fix it — don't blindly retry.
2. When you need me (admin command, login confirmation, extra info), clearly tell me "what to do and why".
3. Record the root cause and fix in the progress file.

## Step 6: Full end-to-end verification
Test at least: service health; SSO unified login into each product; LLM chain (real chat through NewAPI/LiteLLM, PII redaction); IdP login (if AD connected); monitoring/observability/logging/alerting; backup & restore.
Finally summarize results item by item with ✅/❌; for failures give root cause and follow-up.
````

</details>

2. **Manual** — follow the [Windows deployment guide](windows/windows-deploy-guide-v2.md) step by step (or `windows/README.md` + `windows-checklist.html`).

> **Platform status**: Windows (Windows 11 + Docker Desktop) is **actively tested**. Linux/macOS (`linux/`) and online-server (`docker/`) are planned — see the [Roadmap](#roadmap).

## 🖼️ Screenshots

**Dify** — AI application platform · **MCP/Skill Market** — one-click tool & skill access · **DeepChat** — desktop AI client

![Dify](<pics/Dify.png>) ![MCP/SKILL Market](<pics/Market.png>) ![DeepChat](<pics/DeepChat.png>)

More screenshots (48 real UI captures) are embedded in the [Admin Manual](docs/admin-manual/index.md).

## 📚 Manuals (online, 9 languages)

| Manual | Languages |
|---|---|
| **Admin Manual** | [English](docs/admin-manual/index.md) · [简体中文](docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](docs/i18n/admin-manual-zh-TW/index.md) · [Français](docs/i18n/admin-manual-fr/index.md) · [Español](docs/i18n/admin-manual-es/index.md) · [Português](docs/i18n/admin-manual-pt/index.md) · [日本語](docs/i18n/admin-manual-ja/index.md) · [한국어](docs/i18n/admin-manual-ko/index.md) · [العربية](docs/i18n/admin-manual-ar/index.md) |
| **User Manual** | [English](docs/user-manual/index.md) · [简体中文](docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](docs/i18n/user-manual-zh-TW/index.md) · [Français](docs/i18n/user-manual-fr/index.md) · [Español](docs/i18n/user-manual-es/index.md) · [Português](docs/i18n/user-manual-pt/index.md) · [日本語](docs/i18n/user-manual-ja/index.md) · [한국어](docs/i18n/user-manual-ko/index.md) · [العربية](docs/i18n/user-manual-ar/index.md) |

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

- ✅ v0.9x — Windows platform: full stack + AI Admin Center + scoped admin authorization + IM alerting + semantic caching (LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — self-hosted Linux server support (`linux/`)
- 🚧 **Online server** — pure Docker / cloud production deployment (`docker/`)
- 🚧 **Contributor program** — task board, weekly sync calls, certification for deployment partners

## 🔒 Security & notes

- This repository contains **no real secrets**; real values live in each runtime `.env` (only `.env.example` templates are committed).
- Default is plain HTTP on the intranet; HTTPS guidance is in each platform's deployment guide.
- Per-platform gotchas, port tables, and data flows are in the corresponding `*-deploy-guide*` docs (Markdown / HTML, e.g. `windows/windows-deploy-guide-v2.md`).

## 📄 License

[MIT](LICENSE) — free to use, modify and distribute. The underlying components retain their own licenses (see the deployment guide's license review section).

## 🤖 AI Agent Operations

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
