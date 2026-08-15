# AI AllInOne — 企业内网 AI 平台（多平台自托管）

> 📖 **语言**：[English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

一套**开箱即用、多平台**的企业内网 AI 全家桶：把统一认证、LLM 路由、PII 脱敏、AI 应用、企业门户、源码/CI、客户端分发、统一管理、监控告警、可观测、日志、备份恢复，全部用 Docker 编排成一个整体，通过 Keycloak 实现**一个账号单点登录所有产品**。

本仓库同时支持三种部署平台：

| 平台 | 本仓库目录（GitHub 上） | 适用场景 | 状态 |
|---|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop 单机 | ✅ **正在测试** |
| Linux / macOS | `linux/` | 自建 Linux 服务器 / macOS（Docker） | 🚧 即将上线 |
| 线上服务器 | `docker/` | 云端 / 裸 Docker 主机的线上环境 | 🚧 即将上线 |

> **当前状态：正在测试 Windows 平台。** Linux/macOS 和线上服务器平台仍在开发中，其目录目前只放了一个「Coming Soon」的 README。
>
> 本地工作目录里这些文件夹对应命名为 `windows-github/`、`linux-github/`、`docker-github/`；上传到 GitHub 后去掉 `-github` 后缀变成 `windows/`、`linux/`、`docker/`。后续每次更新都按这个映射关系同步。

---

## 一、这套系统包含什么

| 层 | 组件 | 作用 |
|---|---|---|
| 统一认证 | Keycloak | SSO / OIDC，可对接 AD/LDAP 或本地账号 |
| LLM 路由 | NewAPI | 渠道、密钥、额度、审计、成本 |
| PII 脱敏 | LiteLLM + Presidio | 模型调用前自动脱敏手机号/身份证/邮箱等 |
| AI 应用 | Dify | 可视化 AI 应用 / Agent 平台 |
| 企业门户 | Ghost | 企业公告与新闻门户 |
| 源码 / CI | Gitea + Runner | 内部 Git + Actions 自动化 |
| 客户端 | DeepChat | 本地 AI 桌面客户端（Windows / macOS / Linux） |
| 客户端分发 | Update Server | DeepChat 安装包托管与自动更新 |
| 统一管理 | AI 管理中心 | 唯一入口：Dashboard + 各产品内嵌 + 审计/成本/报告 |
| 网关 | MCP Gateway | Skill / MCP 市场管理 |
| 监控告警 | Prometheus + Grafana + Alertmanager | 容器资源监控 + 告警通知 |
| LLM 可观测 | Langfuse | 每次模型调用的 trace / 延迟 / token / 成本 |
| 统一日志 | Loki + Promtail | 所有容器日志聚合检索 |
| 备份恢复 | backup / restore 脚本 + 管理页 | 全量数据每日备份 + 一键恢复 |

每个平台目录里都有：`docker-compose.yml`、`.env.example`、`*-deploy-guide*.html`（部署指导）、`*-checklist*.html`（进度清单）、身份源配置指导、一键部署脚本，以及脱敏后的源码与配置。**不含任何真实密钥**。

### 架构与数据流

![架构总览](<../pics/Architecture.png>)

![数据流](<../pics/DataFlow.png>)

### 效果截图

**AI 管理中心** — 统一管理门户

![AI 管理中心](<../pics/AI Admin.png>)

**Dify** — AI 应用平台

![Dify](<../pics/Dify.png>)

**企业门户** — 首页（Ghost）

![企业门户首页](<../pics/AI All In One Hub.png>)

**DeepChat 页面** — 下载 DeepChat 安装包

![DeepChat 页面](<../pics/AI All In One Hub Download.png>)

**DeepChat** — 桌面 AI 客户端

![DeepChat](<../pics/DeepChat.png>)

---

## 二、快速上手：用 Harness 类工具自动部署（推荐）

Harness 类工具（OpenClaw、Microsoft Scout、WorkBuddy 等）能读取本项目的文档和配置，在本地一步步搭出整套环境。以下是标准流程。

### 前置 5 步

**1. 安装一个 Harness 工具**
安装 OpenClaw / Microsoft Scout / WorkBuddy 任意一款（或其同类）。它们都能读写本地文件、执行命令、联网检索。

**2. 购买订阅或配置好自己的 API**
在工具里完成订阅，或填入你自己的大模型 API Key（DeepSeek / OpenAI / Claude / 通义 / 文心等），保证工具能正常对话。

**3. 准备好网络环境**
这是最容易卡住的一步：
- 确保机器能访问 **Docker 镜像仓库**（Docker Hub / quay.io 等）。若无法直连，需提前配置镜像加速（如 DaoCloud 等国内镜像源）。
- 确保能访问 **GitHub**（克隆仓库、拉取部分公开依赖）。若无法直连，用代理或提前下载源码包。
- 确认目标机器与你要对外提供服务的网段互通。

**4. Git clone 或下载本项目到本地**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# 或下载压缩包后解压到本地任意目录
```

**5. 在工具里粘贴下面的提示词，开始自动部署**

把下面的提示词**整段复制**到 Harness 工具的输入框，然后按它的提问逐项回答即可。工具会：判断你的平台 → 收集参数 → 生成本地进度文件 → 按部署指导逐步配置 → 遇到问题跟你反复测试解决 → 全程更新进度 → 最后做一次完整测试并给你结果。

### 一键部署提示词（复制到工具里）

````text
你是企业内网 AI 平台的部署工程师。请根据本项目文档和配置文件，在当前机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通，按下面流程严格执行。

## 第一步：确认部署目录与目标平台

1. 先问我：本项目的本地解压/克隆路径是什么？（例如 C:\AIAllInOne 或 /opt/AIAllInOne）
2. 进入该目录后，根据当前机器的操作系统判断目标平台文件夹：
   - Windows → 使用 `windows-github`（或 `windows`）文件夹
   - Linux / macOS → 使用 `linux-github`（或 `linux`）文件夹
   - 线上服务器 / 纯 Docker 环境 → 使用 `docker-github`（或 `docker`）文件夹
   若拿不准，把你检测到的操作系统告诉我，并向我确认该用哪个文件夹。
3. 阅读根目录 README.md 和该平台文件夹内的 README.md，先理解整体架构与部署方式，再动手。

## 第二步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）

开始配置前，请收集以下信息，缺哪项就问我哪项，并说明每项的用途：

1. 对外提供服务的内网 IP（或域名，其他机器访问本平台的地址，如 192.168.1.100 或 portal.company.com）。这个地址也会用来生成门户示例内容里的各产品链接。
2. 身份源（Identity Provider）：
   - 接公司 AD 域控（Active Directory）：向我要域名、域控 IP、LDAP base DN、bind DN、bind 账号密码、sAMAccountName 等。
   - 接其他 IdP（LDAP/OpenLDAP/OIDC/飞书/企微/钉钉等）：向我要对应的配置与账号信息。
   - 不接任何外部身份源（只用本地账号）：与我确认后跳过。
3. 统一管理员账号：用户名、密码、邮箱（用于 Keycloak SSO 及各产品管理员登录）。
4. 大模型 API Key：我实际拥有的模型服务商及 Key（DeepSeek / OpenAI / Claude / 通义 / 文心等），没有的跳过。
5. Ghost 门户示例内容语言：中文，或选择其他语言，导入前先把示例内容种子翻译成目标语言。
6. 其他按需询问：MCP Skill 市场主机名（Windows）、告警通知渠道（钉钉/企微/飞书 webhook 地址）、HTTPS 证书、备份保留策略等。

## 第三步：生成本地进度文件

1. 找到该平台文件夹里的「进度清单」文档（如 *-checklist*.html）和「身份源配置指导」文档（如 *-ad-integration*.html 或 IdP 相关文档）。
2. 基于进度清单内容，在项目目录下生成一份新的进度文件，命名如「部署进度-<平台>-<日期>.md」，把清单所有条目复制为未完成状态（- [ ]）。
3. 之后每完成一项、每解决一个问题，就及时更新这份进度文件，并在对话里简要告诉我进展。

## 第四步：按部署指导逐步配置

1. 精读该平台「部署指导」文档（如 *-deploy-guide*.html），严格按步骤执行，特别注意文档里标注的「⚠️ 关键坑 / 踩坑记录」。
2. 顺序大致为：准备环境变量 → 起容器 → 初始化认证/IdP → 配置 LLM 路由与模型渠道 → 初始化各产品（Ghost 门户：部署自带「Corp Portal」主题并导入示例内容种子）→ 配置监控/可观测/日志/脱敏 → 配置备份与恢复。
3. 优先使用目录里已有的自动化脚本（如 bootstrap.ps1、keycloak-realm-init.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、health-check 等），能自动化的步骤不要手工点 UI。

## 第五步：遇到问题反复测试解决

1. 每一步出错或结果不符预期时，先自查日志（docker logs、各服务健康端点、配置文件），定位根因后再修复，不要盲目重试。
2. 需要我参与时（如需要管理员权限执行命令、需要登录确认、需要补充信息），明确告诉我「需要你做什么、为什么」。
3. 解决后把根因和修复方法记录进进度文件，并简要报告给我。

## 第六步：全流程验证

当进度清单所有条目完成后，做一次完整的端到端测试，至少覆盖：
- 各服务健康状态（容器全部 Up、健康端点正常）；
- SSO 统一登录（Keycloak 登录 → 各产品单点/自动登录）；
- LLM 链路（经 NewAPI/LiteLLM 发一次真实对话，验证返回 + PII 脱敏生效）；
- 身份源登录（接了 AD/其他 IdP 时，用对应账号测一次登录）；
- 监控/可观测/日志/告警（确认有数据、告警能触发）；
- 备份与恢复（跑一次备份，验证能恢复）。

最后把测试结果逐项汇总给我，明确标出 ✅通过 / ❌失败；失败的项给出根因和后续建议。
````

---

## 三、手动部署（备选）

不想用 Harness 工具时，也可按各平台 `README.md` 和 `*-deploy-guide*.html` 手动部署。核心主线一致：起容器 → 初始化认证/IdP → 配 LLM 渠道 → 初始化各产品 → 配监控/备份。

---

## 四、安全与说明

- 本仓库**不含任何真实密钥**，所有真实值在各自运行环境的 `.env` 中（提交的是 `.env.example` 模板）。
- 默认内网 HTTP 明文；如需 HTTPS 见各平台部署指导的相关章节。
- 各平台的踩坑记录、架构图、端口表、数据流，见对应 `*-deploy-guide*.html` 文档。

---

## 五、社区 — 微信群

> 👥 **微信群** —— 本群用于交流（部署、使用、反馈）。扫码添加微信，我们会拉你进群。

<img src="../pics/wechat.png" alt="微信群二维码" width="200" />

---

## 六、用 AI Agent 运维

这套系统可以完全通过 AI Agent（WorkBuddy、OpenClaw、Microsoft Scout 等）来运维：健康检查、容器管理、配置修改、Gitea 同步、Ghost 门户、备份、发布、排障。

完整教程见 **[AI Agent 运维指南](AI-AGENT-OPS.zh.md)**（提供 9 种语言版本）。
