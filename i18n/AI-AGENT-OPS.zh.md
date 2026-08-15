# AI Agent 运维指南

> 📖 **语言**：[English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

这套系统是为「**用 AI Agent 来运维**」而设计的——WorkBuddy、OpenClaw、Microsoft Scout 或任何同类工具都可以。你不再需要登录十几个后台、到处点 UI，而是用大白话告诉 Agent 你要什么，它来帮你读文件、跑命令、和各服务打交道。

本指南介绍如何用 AI Agent 做日常运维：健康检查、容器管理、配置修改、AI 管理中心、Gitea/同步、Ghost 门户、备份、发布、排障。

---

## 一、它是怎么工作的

支撑整套系统运行的东西，都在你本机，形式是**代码、配置和数据**：

- **Docker Compose** 定义了所有容器。
- **`.env` 文件**（如 `windows/.env.windows`）保存各服务用的凭据。
- **Admin API** 暴露管理端点（Keycloak、Gitea、NewAPI 等）。
- **文件与数据库**（Ghost 的 SQLite 库、DeepChat 安装包文件、sync-history JSON 等）是真正的状态。

Agent 能做的：

- **读、改任意文件**——配置、脚本、AI 管理中心的 `index.html` / `server.js`、文档。
- **执行命令**——`docker`、`docker compose`、`git`、PowerShell、Node.js、Python。
- **通过 HTTP 调服务**——Admin API、健康端点、下载链接。
- **联网检索**产品文档（需要时）。

因为一切都是「文件 + 命令 + API」，Agent 全都能看到、能改——这正是你可以通过它运维整套系统的原因。

---

## 二、准备工作（一次性）

1. **在 Agent 里打开项目目录。** 把 Agent 的工作目录指向项目根目录（如 `C:\AIAllInOne`）。它会在这里读 `docker-compose.yml`、`.env` 文件、脚本和文档。
2. **确保 Docker Desktop 在运行。** 大多数操作都是 `docker` / `docker compose` 命令。如果 Docker Desktop 停了，Agent 的第一步通常是检查并启动它。
3. **凭据放 `.env`，别放对话里。** Agent 从 `windows/.env.windows` 读服务密码。别把真实密码贴进对话或提交进仓库。
4. **告诉它用哪个平台目录**（如果不明显的话；单机场景一般是 `windows/`）。

---

## 三、Agent 能帮你做什么

| 任务 | Agent 怎么做 |
|---|---|
| 健康检查 / 状态总览 | `docker ps` + 健康端点 + Admin API |
| 启动 / 重启 / 停止服务 | `docker compose up -d <服务>` / `docker restart <服务>` |
| 查看日志与报错 | `docker logs <服务> --tail N`、读日志文件 |
| 改配置 | 改文件，然后重启受影响的容器 |
| 改 AI 管理中心 | 改 `admin-portal/public/index.html`（界面）或 `admin-portal/server.js`（接口） |
| 管理 Gitea + 同步 | Gitea API：触发工作流、读运行状态/日志、改仓库文件 |
| 管理 Ghost 门户 | 读写 Ghost SQLite 库、改主题模板、导入内容种子 |
| 备份与恢复 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 发布版本 | `publish.ps1`（构建 + 提交 + 推送到 GitHub） |
| 清理 | `docker image prune`、删旧备份等（需你确认） |
| 排障 | 端口冲突、Docker Desktop 问题、DNS/代理等 |

---

## 四、常用任务与示例指令

下面是你最常做的任务，每条配一个示例指令。你可以用自己的语言说，Agent 都能听懂。把 `<…>` 换成真实值。

### 4.1 检查整体健康

> "检查所有服务是否都在运行且健康，列出任何停止或反复重启的容器，并告诉我原因。"

Agent 会跑 `docker ps`、逐个打健康端点，汇报状态。

### 4.2 排查一个停止/报错的服务

> "LiteLLM 停了，找出原因并修好，然后确认它恢复了。"

Agent 会看容器状态、读日志、定位根因（比如端口冲突）并修复。

### 4.3 重启服务

> "重启 admin portal，让我的 server.js 改动生效。"

Agent 执行 `docker restart admin-portal`。注意：**后端**代码（`server.js`）改动要重启容器；**前端**（`index.html`）改动只需刷新浏览器。

### 4.4 看日志

> "显示 Gitea runner 日志最后 50 行，告诉我有没有错误。"

### 4.5 管理 DeepChat 同步（Gitea）

> "触发 deepchat-sync 工作流，并把它的进度给我看——阶段、已下载文件数、MB、预计剩余时间。"

Agent 调 Gitea API 触发工作流，然后轮询运行状态、读 `sync-progress.json`。

### 4.6 改 AI 管理中心

> "给 Gitea 仓库列表加分页——每页 10 条，可调。"

Agent 改 `index.html`、校验 JavaScript、（后端改动时）重启容器。然后你 Ctrl+F5 硬刷新浏览器。

### 4.7 管理 Ghost 门户

> "把示例内容种子导入门户，用地址 192.168.1.100、中文。"

Agent 会先问发布地址和语言，再跑 `ghost-content-import.ps1`。它也能修主题、改页面、直接在库里改导航。

### 4.8 备份与恢复

> "现在跑一次完整备份，并确认成功。"

### 4.9 发布到 GitHub

> "发布新版本 v0.7，提交信息是 'feat: …'。"

Agent 跑 `publish.ps1 -Version v0.7 -CommitMessage "…"`。注意：`git push` 需要代理或 GitHub 凭据可用——如果网络推送失败，Agent 会提示你打开代理。

### 4.10 清理磁盘空间

> "看看 Docker 磁盘都占在哪，哪些是安全的、可以删的。"

Agent 会扫描（`docker system df`、未使用镜像、卷、旧备份）并列出来——**只在你确认要删哪些之后才会真正删。**

---

## 五、最佳实践与坑

- **前端 vs 后端刷新。** AI 管理中心里：`index.html` 改动刷新浏览器即生效（文件是 volume 挂载的）；`server.js` 改动需要 `docker restart admin-portal`——普通的 `docker compose up -d` **不会**重载 volume 挂载的代码。
- **硬刷新浏览器**（Ctrl+F5）：界面看起来没变时，多半是旧的 JavaScript 被缓存了。
- **绝不提交真实密钥或 IP。** 用占位符（如 `<服务器IP>`、`CHANGE_ME_*`）。`publish.ps1` 会自动脱敏 `server.js` 里的密码。
- **要验证，不要轻信。** 让 Agent 用命令证明结果（HTTP 状态码、`ls`、日志行），尤其是它说「已修好」时。
- **破坏性操作前先备份。** Agent 改 Ghost 库或配置前应先备份，删任何东西前先跟你确认。
- **导入内容前先问地址和语言。** 导入门户内容时，Agent 应先问发布地址和目标语言。
- **网络与代理。** 有些步骤（推送到 GitHub、联网检索）需要代理（如 `127.0.0.1:33210`）或外网。网络步骤失败时，打开代理再重试。

---

## 六、常用命令速查

| 操作 | 命令 |
|---|---|
| 列出容器 | `docker ps -a` |
| 容器日志 | `docker logs <名称> --tail 100` |
| 重启服务 | `docker restart <名称>` |
| 启动全部服务 | `docker compose up -d` |
| Compose 状态 | `docker compose ps` |
| 触发 Gitea 同步 | `POST /api/v1/repos/<用户>/deepchat-sync/actions/workflows/sync.yml/dispatches` |
| 跑备份 | `powershell .\scripts\backup.ps1` |
| 发布版本 | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
