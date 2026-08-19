# AI AllInOne — 开源自托管的企业 AI 平台

> 📖 **语言**：[English](../README.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

> ⭐ **如果这个项目帮到了你，给个 Star 吧——免费，还能让更多人找到它。**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

> **一台服务器。一个账号。企业级 AI 全家桶——开源免费，数据不出内网。**

AI AllInOne 是一套**开源免费**、开箱即用的企业内网 AI 平台：统一 SSO、LLM 路由、AI 应用、企业门户、源码/CI、统一管理、监控告警、可观测、日志、备份恢复——全部用 Docker 编排成一个整体。**员工用一个账号登录一次，就能使用所有 AI 工具。**

![AI 管理中心](<../pics/AI Admin.png>)

![企业门户](<../pics/AI All In One Hub.png>)

---

## ✨ 为什么选择 AI AllInOne

| | |
|---|---|
| 🧩 **全家桶，免组装** | 8+ 个开源组件预集成：认证、网关、应用、门户、Git、监控、日志、备份。无需自己"拼装"。 |
| 🔐 **统一 SSO** | 一个 Keycloak 账号（支持 AD/LDAP 联邦）自动登录所有产品，免密进入。 |
| 🔒 **数据不出内网** | 完全自托管——模型调用、提示词、文档和用户数据都留在企业内部。 |
| ⚡ **约 30 分钟完成部署** | `docker compose` + 自动化脚本，或直接让 AI Agent 帮你部署整套环境。 |
| 🛡️ **PII 脱敏** | 手机号 / 身份证 / 邮箱等敏感信息在调用外部大模型前自动脱敏（Presidio）。 |
| 📊 **全链路可观测** | Prometheus + Grafana 监控、Langfuse LLM 追踪、Loki 统一日志、企业 IM 告警（钉钉/企微/飞书）。 |
| 💾 **备份与恢复** | 管理后台一键每日全量备份和一键恢复。 |
| 🌐 **9 种语言** | 手册和管理界面多语言（简中 / 繁中 / 英 / 法 / 西 / 葡 / 日 / 韩 / 阿）。 |

## 📦 组件清单

| 层级 | 组件 | 用途 |
|---|---|---|
| 认证 | Keycloak | SSO / OIDC，AD/LDAP 联邦或本地账号 |
| LLM 路由 | NewAPI | 渠道、密钥、额度、审计、成本 |
| PII 脱敏 | LiteLLM + Presidio | 调用模型前自动脱敏敏感信息 |
| AI 应用 | Dify | 可视化 AI 应用 / Agent 平台 + 统一知识库（RAG） |
| 企业门户 | Ghost | 公司公告与新闻门户（内置定制 Corp Portal 主题） |
| 源码 / CI | Gitea + Runner | 内部 Git + Actions 自动化 |
| 客户端 | DeepChat | 本地 AI 桌面客户端（Windows / macOS / Linux） |
| 客户端分发 | Update Server | DeepChat 安装包托管与自动更新 |
| 统一管理 | AI Admin Center | 统一入口：仪表板 + 内嵌产品 + 审计/成本/报表 + 分级管理员授权 + Keycloak 同步/角色 |
| 网关 | MCP Gateway | 技能 / MCP 市场 + Dify 知识检索（RAG） |
| 监控 | Prometheus + Grafana + Alertmanager | 容器资源监控 + 告警通知 |
| LLM 可观测 | Langfuse | 追踪每次模型调用的延迟、token、成本 |
| 统一日志 | Loki + Promtail | 聚合全部容器日志，可按容器/关键字/时间检索 |
| 备份恢复 | 脚本 + 管理页 | 每日全量备份 + 一键恢复 |

### 架构与数据流

![架构总览](<../pics/Architecture.png>)

![数据流](<../pics/DataFlow.png>)

---

## 🚀 快速开始

**前置条件**：一台装有 Docker 的机器（Windows 11 + Docker Desktop，或 Linux），且能访问 Docker 镜像仓库。

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# 启动核心服务，然后按部署指南初始化认证 / LLM 渠道 / 各产品
docker compose up -d
```

接下来有两种方式：

1. **自动部署（推荐）**——把部署交给 AI Agent（WorkBuddy / OpenClaw / Microsoft Scout）。它会读取部署文档和配置，向你收集参数（服务器 IP、身份源、管理员账号、LLM 密钥），然后一步步完成全部配置。[查看一键部署提示词 →](../windows/windows-deploy-guide-v2.md)

#### 🤖 AI 部署——交给 AI Agent 一键完成

> 以下内容复制自部署指南（第 0 章）：部署指南既可以**人工逐章执行**，也可以**整体交给 AI Agent**（WorkBuddy / OpenClaw / Microsoft Scout）端到端完成。把本目录（部署指南、`windows-checklist.html`、`docker-compose.yml`、`.env.example`、`scripts/`）提供给 Agent，再粘贴下面的提示词，它会：判断平台 → 逐项向你收集参数 → 生成本地进度文件 → 按部署指南逐步配置 → 遇错调试重试 → 全程更新进度 → 最后做一次完整端到端验证并汇报结果。

**复制给 Agent 的提示词**（Windows 平台，中文——Agent 会带你逐步完成）：

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

> 💡 即使你**不用 Agent**，这段提示词也可以当作「部署前信息核对清单」——它列出了启动前需要准备的全部参数。

2. **手动部署**——按 [Windows 部署指南](../windows/windows-deploy-guide-v2.md) 逐步操作（配合 `windows-checklist.html` 进度清单）。

> **平台状态**：Windows（Windows 11 + Docker Desktop）**实测中**。Linux/macOS（`linux/`）与在线服务器（`docker/`）已在规划中——见[路线图](#roadmap)。

## 🖼️ 界面截图

**Dify** — AI 应用平台 · **MCP/Skill 市场** — 一键接入工具与技能 · **DeepChat** — 桌面 AI 客户端

![Dify](<../pics/Dify.png>) ![MCP/SKILL 市场](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

更多截图（48 张真实界面截图）已嵌入[管理员手册](../docs/admin-manual/index.md)。

## 📚 手册（在线，9 种语言）

| 手册 | 语言 |
|---|---|
| **管理员手册** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **用户手册** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

## 🎓 培训体系

平台自带一整套**上岗培训体系**（17 个模块、60 学时、10 个工作日），面向部署与运维：培训总纲、10 日培训计划、各产品培训大纲/教材/上机计划/考试考察（均附本地 + 官方 + 视频资料），以及结业考试体系（含证书）。

| 培训包 | 语言 | 入口 |
|---|---|---|
| **简体中文** | 中文 | [training/training_chn/index.html](../training/training_chn/index.html) |
| **English** | 英文 | [training/training_eng/index.html](../training/training_eng/index.html) |

> ⚠️ 发布说明：GitHub 版 README 关联**英文版**培训包；Gitee 版默认中文 README 关联**中文版**培训包——保持语言匹配。

日常 AI Agent 运维见 **[AI Agent 运维指南](../AI-AGENT-OPS.md)**。

## 👥 社区

> 微信群——用于交流、部署答疑、反馈与**共建**。扫码加好友，拉你进群。

<img src="../pics/wechat.png" alt="微信群二维码" width="200" />

同时欢迎使用 [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions)（或直接提 [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues)）。

## 🤝 参与共建

本项目**开源免费**，靠社区一起成长。无论你的水平如何，都有适合你的方式：

- ⭐ **给仓库点星**——最简单也是最有价值的支持
- 🐛 **报 Bug / 提需求**——开 issue 并写清楚复现步骤
- 📝 **写文档和教程**——部署指南、排错经验、最佳实践
- 🌐 **翻译**——手册已有 9 种语言，帮忙改进或新增更多
- 🧪 **测试分享**——部署一次，告诉我们哪些好用哪些踩坑
- 💻 **贡献代码**——集成层（统一 SSO、管理门户、监控、备份）是最好上手的地方

完整指南见 [CONTRIBUTING.md](../CONTRIBUTING.md)，公开的[路线图](#roadmap)可以看到下一步计划。**每一位贡献者都会列入 README 的贡献者名单。**

<h2 id="roadmap">🗺️ 路线图</h2>

- ✅ v0.9x — Windows 平台：全家桶 + AI 管理中心 + 分级管理员授权 + 企业 IM 告警 + 语义缓存（LiteLLM redis-semantic）
- 🚧 **Linux / macOS** — 自托管 Linux 服务器支持（`linux/`）
- 🚧 **在线服务器** — 纯 Docker / 云上生产部署（`docker/`）
- 🚧 **共建者计划** — 任务看板、每周同步例会、部署伙伴认证

## 🔒 安全说明

- 本仓库**不含任何真实密钥**；真实值只存在各运行环境的 `.env`（仓库只提交 `.env.example` 模板）。
- 默认内网明文 HTTP；HTTPS 配置见各平台部署指南。
- 各平台的坑位、端口表、数据流见对应 `*-deploy-guide*.html` 文档。

## ⭐ 支持这个项目

如果 AI AllInOne 帮你省了时间或钱，点个 Star 不花一分钱，却能帮项目成长：

- ⭐ **Star 这个仓库** — 让更多人能搜到这个项目
- 🐛 **提 Issue** — 报 bug、提功能建议、部署问题都可以
- 🤝 **参与贡献** — 代码、文档、翻译（9 种语言都欢迎）
- 💬 **加入社群** — 分享你的部署经验和想法
- 📣 **分享出去** — 转给同事，或发到你的博客 / 社交平台

右上角点一下 Star，就是对这个项目最大的支持。

## 📄 许可证

[MIT](../LICENSE)——可自由使用、修改与分发。所集成组件保留各自的许可证（见部署指南的许可证审查章节）。

## 🤖 AI Agent 运维

本平台从设计上就支持**通过 AI Agent 运维**——WorkBuddy、OpenClaw、Microsoft Scout 或任何同类工具。你不再需要逐个登录十几个管理后台点点点，而是用自然语言告诉 Agent 你想做什么，它负责读文件、执行命令、调用服务。

平台的一切都运行在你机器上的**代码、配置和数据**里——Docker Compose 服务、`.env` 文件、管理 API，以及保存实际状态的数据/文件——所以 Agent 能看得到、改得了全部：

| 任务 | Agent 的做法 |
|---|---|
| 健康检查 / 状态总览 | `docker ps` + 健康端点 + 管理 API |
| 启动 / 重启 / 停止服务 | `docker compose up -d <svc>` / `docker restart <svc>` |
| 查看日志与报错 | `docker logs <svc> --tail N` + 日志文件 |
| 修改配置 | 改配置文件后重启对应容器 |
| 修改 AI 管理中心 | 改 `admin-portal/public/index.html`（前端）或 `admin-portal/server.js`（后端）后重启 |
| 管理 Gitea 与同步 | Gitea API：触发工作流、查看运行状态/日志、编辑仓库文件 |
| 管理 Ghost 门户 | 读写 Ghost SQLite 库、改主题模板、导入内容种子 |
| 备份与恢复 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 发布版本 | `publish.ps1`（构建 + 提交 + 推送到 GitHub） |
| 排障 | 端口冲突、Docker Desktop 问题、DNS/代理等 |

示例：*"检查所有服务是否都在正常运行"* —— Agent 执行 `docker ps`、探测各健康端点，然后告诉你哪里有问题、为什么。完整的现成提示词、最佳实践和命令速查见 **[AI Agent 运维指南](../AI-AGENT-OPS.md)**（9 种语言）。

### 🛡️ AI 运维——一键健康检查与开机自检

> 以下内容复制自部署指南（第 12 章）：平台内置**一条命令的健康检查**（`health-check.ps1`），分 9 个阶段检查全部 **41 个容器**——含 LLM 全链路、AD 认证与管理员登录、MCP/Skill 功能、磁盘空间。凭据从 `.env` 读取，脚本不硬编码密码。直接让 AI Agent 执行即可（例如 *"跑一下健康检查，告诉我哪里挂了"*），也可以设置成每次登录自动运行：

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

**手动执行**（PowerShell）：

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**开机自动运行**（计划任务，请以管理员身份运行 PowerShell）：

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
