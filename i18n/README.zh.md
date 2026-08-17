# AI AllInOne — 开源自托管的企业 AI 平台

> 📖 **语言**：[English](../README.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

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

1. **自动部署（推荐）**——把部署交给 AI Agent（WorkBuddy / OpenClaw / Microsoft Scout）。它会读取部署文档和配置，向你收集参数（服务器 IP、身份源、管理员账号、LLM 密钥），然后一步步完成全部配置。[查看一键部署提示词 →](../windows/windows-deploy-guide-v2.html)

<details>
<summary>📋 一键部署提示词（点击展开）</summary>

````text
你是企业内网 AI 平台的部署工程师。请基于本项目的文档和配置文件，在当前机器上完整部署并验证「AI AllInOne」平台。全程用中文与我沟通，并严格按以下流程执行。

## 第 1 步：确认部署目录与目标平台
1. 先问我：本项目的本地解压/克隆路径是什么？（例如 C:\AIAllInOne 或 /opt/AIAllInOne）
2. 进入该目录后，根据当前机器操作系统确定目标平台目录：
   - Windows → 使用 windows-github（或 windows）目录
   - Linux / macOS → 使用 linux-github（或 linux）目录
   - 在线服务器 / 纯 Docker 环境 → 使用 docker-github（或 docker）目录
   如果不确定，告诉我检测到的操作系统并和我确认使用哪个目录。
3. 动手前先阅读根目录 README.md 和该平台目录内的 README，理解架构和部署方式。

## 第 2 步：逐项收集所需参数（逐个问我，不要跳过或猜测）
1. 平台对外暴露的内网 IP（或域名），即其他机器访问它的地址（如 192.168.1.100 或 portal.company.com）。
2. 身份源（Identity Provider）：
   - 公司 AD 域控：问我域名、DC IP、LDAP base DN、bind DN、bind 账号密码、sAMAccountName 等。
   - 其他 IdP（LDAP/OpenLDAP/OIDC/飞书/企微/钉钉等）：问我对应配置和账号信息。
   - 无外部身份源（仅本地账号）：和我确认后跳过。
3. 统一管理员账号：用户名、密码、邮箱（用于 Keycloak SSO 和各产品管理员登录）。
4. LLM API 密钥：我实际有哪些模型供应商和密钥（DeepSeek / OpenAI / Claude / Qwen / 通义 / ERNIE 等）；没有的跳过。
5. Ghost 门户示例内容的语言：中文，或翻译成其他语言后再导入。
6. 其他按需询问：MCP 技能市场主机名（Windows）、告警通知渠道（钉钉/企微/飞书 webhook）、HTTPS 证书、备份保留策略等。

## 第 3 步：生成本地进度文件
1. 找到平台目录内的「进度清单」文档（*-checklist*.html）和「身份源对接指南」（如 *-ad-integration*.html 或 IdP 相关文档）。
2. 根据清单内容，在项目目录生成进度文件，命名如 "deployment-progress-<platform>-<date>.md"，把每一项清单复制为未完成（- [ ]）。
3. 之后每完成一项或解决一个问题，及时更新该进度文件，并在对话中向我简要汇报进度。

## 第 4 步：按部署指南逐步配置
1. 仔细阅读平台的「部署指南」文档（如 *-deploy-guide*.html）并严格遵循，特别注意其中标注的「⚠️ 关键坑位」。
2. 大致顺序：准备环境变量 → 启动容器 → 初始化认证/IdP → 配置 LLM 路由和模型渠道 → 初始化各产品（Ghost 门户：部署内置 Corp Portal 主题并导入示例内容）→ 配置监控/可观测/日志/脱敏 → 配置备份恢复。
3. 优先使用目录内的自动化脚本（如 bootstrap.ps1、keycloak-realm-init.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、health-check.ps1 等），能脚本化的步骤不要手动点 UI。

## 第 5 步：和我一起迭代测试并解决问题
1. 某一步失败或不符合预期时，先查日志（docker logs、各服务健康端点、配置文件）定位根因再修，不要盲目重试。
2. 需要我参与时（例如执行需要管理员权限的命令、确认登录、补充信息），明确告诉我「要做什么、为什么」。
3. 解决后把根因和修复记录到进度文件，并简要向我汇报。

## 第 6 步：完整端到端验证
全部清单项完成后，做一次完整端到端测试，至少覆盖：
- 服务健康（所有容器 Up、健康端点正常）；
- SSO 统一登录（Keycloak 登录 → 各产品 SSO/自动登录）；
- LLM 链路（通过 NewAPI/LiteLLM 发一次真实对话，验证响应和 PII 脱敏生效）；
- 身份源登录（如已对接 AD/其他 IdP，用对应账号测试登录）；
- 监控/可观测/日志/告警（确认有数据、告警能触发）；
- 备份与恢复（执行一次备份并验证可恢复）。

最后逐项汇总测试结果，明确标注 ✅ 通过 / ❌ 失败；失败项给出根因和后续建议。
````

</details>

2. **手动部署**——按 [Windows 部署指南](../windows/windows-deploy-guide-v2.html) 逐步操作（配合 `windows-checklist.html` 进度清单）。

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

## 📄 许可证

[MIT](../LICENSE)——可自由使用、修改与分发。所集成组件保留各自的许可证（见部署指南的许可证审查章节）。
