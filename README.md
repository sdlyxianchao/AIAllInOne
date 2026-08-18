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

1. **Automated (recommended)** — hand the deployment to an AI agent (WorkBuddy / OpenClaw / Microsoft Scout). It reads the deployment guide and configs, asks you for parameters (server IP, IdP, admin account, LLM keys), and configures everything step by step.

#### 🤖 AI Deployment — one-click, driven by an AI agent

> Copied from the deployment guide (chapter 0): the guide can be executed **chapter by chapter by hand**, or handed to an **AI agent** end-to-end. With WorkBuddy / OpenClaw / Microsoft Scout, point the agent at this directory (guide, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), paste the prompt below, and it will: detect the platform → collect your parameters one by one → generate a local progress file → configure step by step per the guide → test, debug and retry on failures → update progress throughout → run a full end-to-end verification and report the results.

**Prompt to copy to your agent** (Windows platform, Chinese — the agent will walk you through it):

````text
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
````

> 💡 Even if you **don't use an agent**, this prompt doubles as a clear pre-deployment checklist — it lists every parameter you need to prepare before starting.

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
