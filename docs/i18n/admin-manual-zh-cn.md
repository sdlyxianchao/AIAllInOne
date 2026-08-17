# AI AllInOne 管理员手册

*v0.2 · 部署 · 管理 · 运维*

**第一部分 · 部署篇**

## 1. 平台概览与架构

### 1.1 这套平台是什么
「AI AllInOne」是一套**企业内网 AI 平台**，把十几个开源产品用 Docker 编排成一个整体：统一认证、LLM 路由、PII 脱敏、AI 应用、企业门户、源码 CI、客户端分发、统一管理、监控告警、可观测、日志、备份恢复——全部走通，且**一个 Keycloak 账号单点登录所有产品**。
| 层 | 组件 | 作用 |
| --- | --- | --- |
| 统一认证 | Keycloak | SSO / OIDC，可对接 AD/LDAP 或本地账号 |
| LLM 路由 | NewAPI | 渠道、密钥、额度、审计、成本 |
| PII 脱敏 | LiteLLM + Presidio | 模型调用前自动脱敏手机号/身份证/邮箱等 |
| AI 应用 | Dify | 可视化 AI 应用 / Agent / 知识库平台 |
| 企业门户 | Ghost | 公告、新闻、下载中心、员工 Hub |
| 源码 / CI | Gitea + Runner | 内部 Git 仓库 + Actions 自动化 |
| 客户端 | DeepChat | 本地 AI 桌面客户端（Win/macOS/Linux） |
| 客户端分发 | 更新服务器 | DeepChat 安装包托管与自动更新 |
| 统一管理 | AI 管理中心 | 唯一管理入口：Dashboard + 产品内嵌 + 审计/成本/报告 |
| 网关 | MCP Gateway | Skill / MCP 市场管理 |
| 监控告警 | Prometheus + Grafana + Alertmanager | 容器资源监控 + 告警通知 |
| LLM 可观测 | Langfuse | 每次模型调用的 trace / 延迟 / token / 成本 |
| 统一日志 | Loki + Promtail | 所有容器日志聚合检索 |
| 备份恢复 | backup / restore 脚本 + 管理页 | 全量数据每日备份 + 一键恢复 |
### 1.2 软硬件要求
| 项目 | 最低要求 | 推荐配置 |
| --- | --- | --- |
| 操作系统 | Windows 11（Docker Desktop + WSL2 后端） | Windows 11 Pro / 企业版（额外支持 Hyper-V 跑 AD 域控） |
| CPU | 4 核 / 8 线程 | 8 核 / 16 线程 |
| 内存 | 16 GB | 32 GB |
| 磁盘 | 60 GB 可用 SSD | 150 GB+ 可用 SSD |
| GPU | 无需独立显卡 | 无需独立显卡 |
> 📌 依据实测：约 30 个容器空闲时合计约 5 GB 内存，Dify 处理/索引、Keycloak JVM、数据库缓存等峰值再增 3–5 GB，加 WSL2 虚拟内存，16 GB 为最低、32 GB 为舒适值。所有大模型走外部 API（deepseek-chat 等），本地不做推理，**无需 GPU**。
### 1.3 端口分配表
下文统一用 `<服务器IP>` 表示宿主机对外地址（当前环境为 `192.168.31.117`，部署时替换成你自己的内网 IP 或域名）。
| # | 产品 | 用途 | 本机访问 | 内网访问（员工） |
| --- | --- | --- | --- | --- |
| 1 | AI 管理中心 | 统一管理员门户 | `127.0.0.1:10086` | `<服务器IP>:10086` |
| 2 | Keycloak | 认证 / SSO | `127.0.0.1:9090` | `<服务器IP>:9090` |
| 3 | NewAPI | LLM 路由网关 | `127.0.0.1:3000` | `<服务器IP>:3000` |
| 4 | LiteLLM | PII 脱敏代理 | `<服务器IP>:4001` | —（仅被 NewAPI 调用） |
| 5 | Dify | AI 应用平台 | `127.0.0.1` | `<服务器IP>`（80 端口） |
| 6 | Ghost | 企业门户 | `127.0.0.1:8090` | `<服务器IP>:8090` |
| 7 | Gitea | 源码 + CI/CD | `127.0.0.1:3002` | `<服务器IP>:3002` |
| 8 | 更新服务器 | DeepChat 安装包 | `127.0.0.1:8091` | `<服务器IP>:8091` |
| 9 | MCP Gateway | Skill / MCP 网关 | `127.0.0.1:3100` | `<服务器IP>:3100` |
| 10 | Grafana | 监控大盘 | `127.0.0.1:3030` | `<服务器IP>:3030` |
| 11 | Prometheus | 指标采集 / 告警 | `127.0.0.1:9091` | `<服务器IP>:9091` |
| 12 | Langfuse | LLM 可观测 | `127.0.0.1:3010` | `<服务器IP>:3010` |
| 13 | Loki | 日志聚合（内部） | `127.0.0.1:3110` | —（经管理页查看） |
| 14 | MailHog | 本地邮件接收 | `127.0.0.1:8025` | `<服务器IP>:8025` |
> ⚠️ 统一用**内网 IP** 访问，不用 `localhost`（Docker Desktop WSL2 对 IPv6 `::1` 支持不稳，导致端口转发失败）。数据库（MySQL/Redis/PostgreSQL）不对用户开放，仅在 Docker 网络内部通信。
### 1.4 核心数据流
#### LLM 请求流（最关键的一条链路）
1. **① 转发**：DeepChat / Dify 把请求发给 NewAPI（`:3000/v1`）；
2. **② 脱敏**：NewAPI 转发到 LiteLLM，LiteLLM 用正则 + Presidio 把手机号/身份证/邮箱等替换成 `[xxx_REDACTED]`；
3. **③ 请求外部模型**：脱敏后的请求发给 DeepSeek / GPT / Claude；
4. **④ 还原 PII**：响应回来时 LiteLLM 把敏感信息还原；
5. **⑤ 返回**：最终结果回到客户端。
#### 其它几条流
- **认证流**：Keycloak OIDC SSO 统一登录所有 Web 产品（共用 `ai_all_in_one_admin`）；
- **可观测流**：LiteLLM `success_callback` → Langfuse 追踪每次调用；
- **自动更新流**：Gitea Actions 构建 → 更新服务器（:8091）→ DeepChat 检查 `version.txt` 自动下载安装；
- **统一日志流**：Promtail 采集各容器日志 → Loki 聚合 → AI 管理中心「统一日志」页查询。
### 1.5 本书结构导航
本手册分三部分：**部署篇**（第 1–13 章，从零把平台跑起来）、**管理篇**（第 14–26 章，13 个产品各自的日常操作）、**运维篇**（第 27–29 章，备份/健康检查/排错）。侧边栏可随时跳转，页面底部有上一章/下一章翻页。
> ✅ 部署时也可以直接交给 **AI Agent 工具**（WorkBuddy / OpenClaw 等）自动化：把本手册 + `docker-compose.yml` + `.env.example` + `scripts/` 交给 Agent，让它按「部署篇」顺序逐步执行（详见第 2 章开头的 Agent 部署提示词）。

## 2. 前置准备

### 2.0 两种部署方式
本手册可**人工逐章执行**，也可**交给 AI Agent 工具自动执行**。用 Agent 时，把本目录（含本手册、`docker-compose.yml`、`.env.example`、`scripts/`）提供给 Agent，粘贴下面的提示词即可。
**复制给 Agent 的部署提示词：**
```
你是企业内网 AI 平台的部署工程师。请根据本目录的《管理员手册》部署篇、docker-compose.yml 与 .env.example，在当前这台机器上完整部署并验证「AI AllInOne」平台。全程用中文沟通。

第一步 收集参数（逐项问我，不跳过、不猜测）：
1) 对外服务的内网 IP；2) Skill 市场主机名（域名，替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName）；4) 统一管理员账号密码；5) 大模型 API Key；6) 按需问告警 webhook、HTTPS、备份保留策略。

第二步 生成进度文件，每完成一项、每解决一个问题就更新并汇报。

第三步 严格按本手册第 1~13 章顺序执行，注意各章「⚠️ 关键坑」，优先用 scripts/ 下的脚本自动化。

第四步 出错先查日志（docker logs、健康端点、配置）定位根因再修，不盲目重试。

第五步 全流程验证：容器全 Up、Keycloak SSO、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复，逐项汇总 ✅/❌。
```
> 💡 不用 Agent 的话，上面这段也能当「部署前信息核对清单」：部署前先想清楚内网 IP、身份源、管理员密码、模型 Key 这四件事。
### 2.1 安装并配置 Docker Desktop
Docker Desktop 安装后默认用 WSL2 后端，通常无需额外配置。若需手动调整资源上限，在用户目录建 `.wslconfig`：
```
# %UserProfile%\.wslconfig（例如 C:\Users\你的用户名\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大内存（最低 16GB，推荐 24~32GB）
processors=8      # CPU 核心数（按物理核数）
swap=4GB
```
保存后 PowerShell 执行 `wsl --shutdown`，重启 Docker Desktop 生效。
> ✅ 验证：Docker Desktop 状态栏显示 "Engine running"（绿色）。
### 2.2 准备目录结构
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 创建 Docker 共享网络
```
docker network create ai-platform
docker network ls | findstr ai-platform   # 验证
```
> 所有核心容器通过 `ai-platform` 网络用容器名互访（如 NewAPI 访问 LiteLLM 用 `http://litellm:4000`，不经过 localhost）。
### 2.4 固定宿主机内网 IP（重要）
宿主机走 WiFi 时 IP 由 DHCP 动态分配，重启或租约到期会变；变了员工访问各产品的地址就全失效。建议在路由器做 **DHCP 保留（MAC 绑定）**：
1. 查 WiFi 网卡 MAC：`ipconfig /all`，找「无线局域网适配器 WLAN」的物理地址（如 `60-A3-E3-41-8F-61`）；
2. 登录路由器后台（如 `http://192.168.31.1`）→ 局域网设置 / DHCP 静态 IP 分配；
3. 添加规则：MAC → IP（如 `192.168.31.117`），保存；
4. 重连 WiFi 确认 IP 固定。
> ✅ DHCP 保留比在 Windows 里设静态 IP 更稳（路由器统一管理、不冲突）。
### 2.5 打通网络（最容易卡住的一步）
- **能连 Docker 镜像仓库**：Docker Hub / quay.io / ghcr.io。不通则先配镜像加速器（如 DaoCloud）。
- **能连 GitHub**：克隆仓库、拉取公开依赖。不通则用代理或提前下载源码包。
- **目标机器可被内网访问**：确认要暴露的网段可达。

## 3. 配置文件与环境变量

### 3.1 三个核心配置文件
| 文件 | 用途 | 需要修改吗 |
| --- | --- | --- |
| `.env.windows` | 所有密码和外部 API Key | **必须修改**：填 DeepSeek API Key，其它 provider 按需 |
| `litellm-config.yaml` | LiteLLM 模型列表 + PII 脱敏规则 | 通常不改（只用 DeepSeek 可删 OpenAI/Claude 条目） |
| `docker-compose.yml` | 核心服务编排 | 已预配置（含 Keycloak `KC_HOSTNAME` + 持久化卷） |
### 3.2 环境变量分类总览
打开 `.env`（把 `.env.windows` 复制而来），按优先级配置。
| 变量 | 优先级 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 立即 | 外部 LLM API Key，不配则链路不通 |
| `LITELLM_MASTER_KEY` | 🔴 立即 | LiteLLM 内部鉴权密钥，NewAPI 要用 |
| `NEWAPI_DB_PASSWORD` | 🔴 立即 | MySQL root 密码，首次创建后不宜改 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 立即 | Keycloak 管理员密码 |
| `NEWAPI_SESSION_SECRET` | 🔴 立即 | NewAPI 会话加密，随机字符串 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 立即 | NewAPI 数据加密，随机字符串 |
| `ADMIN_PASSWORD` | 🔴 立即 | AI 管理中心 Global Admin 密码 |
| `SESSION_SECRET` | 🔴 立即 | AI 管理中心会话加密，随机字符串 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 可后配 | 需先在 Keycloak 建 OIDC Client 拿 Secret（见第 12 章） |
| `GITEA_RUNNER_TOKEN` | 🟡 可后配 | 先启动 Gitea 在后台拿 Token（见第 9 章） |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 按需 | 要用时取消注释，并同步改 `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` 等限流项 | ⚪ 默认 | 测试期设 999999，生产酌情调低 |
| `DEFAULT_QUOTA` | ⚪ 默认 | 新用户默认额度（美元），设 100 即新用户送 100 美元 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ 默认 | 新用户注册自动生成初始 Key，设 true 让用户登录即用 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ 默认 | 默认值即可 |
### 3.3 🔴 立即配置（首次启动前必须完成）
| 变量 | 说明 | 如何获取 | 格式 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 云端 LLM Key | 注册 https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM 内部管理员密钥（不是外部 LLM Key） | 随机生成（见下） | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL 密码 | 自己定，首次创建后**不宜再改** | 任意 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理员密码 | 自己定，≥ 8 位 | 任意 |
| `NEWAPI_SESSION_SECRET` | NewAPI 会话加密 | 随机生成 | 32 位 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI 数据加密 | 随机生成 | 32 位 |
| `ADMIN_PASSWORD` | AI 管理中心管理员密码 | 自己定，≥ 8 位 | 任意 |
| `SESSION_SECRET` | AI 管理中心会话加密 | 随机生成 | 64 位 |
生成随机字符串（PowerShell）：
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### 填入 API Key 的示例
```
# 默认已配 DeepSeek（取消注释并填入 Key）
DEEPSEEK_API_KEY=sk-你的真实DeepSeek密钥

# 需要 OpenAI / Claude 时取消注释，并同步取消 litellm-config.yaml 对应 model 块注释
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 密码修改策略
> ⚠️ `NEWAPI_DB_PASSWORD` 涉及已建数据库，改后需删对应 volume 重建（数据会丢），建议首次就定好。  
> 
>     `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` 等管理密码可在各产品后台改，改完同步更新 `.env`（只是备忘，不影响运行）。
### 3.5 litellm-config.yaml 说明
- `model_list` — 定义可用外部模型，NewAPI 经 LiteLLM 调用。默认只启用 `deepseek-chat`；
- `general_settings.master_key` — LiteLLM 管理员密钥，读 `.env` 的 `LITELLM_MASTER_KEY`；
- PII 脱敏（Presidio）当前**临时注释**（新版 LiteLLM guardrail API 变更不兼容），后续启用见第 25 章；
- 用稳定版本 `v1.95.1`（`main-latest` 有已知 bug）。

## 4. 启动核心服务

### 4.1 复制 .env
```
# PowerShell
copy .env.windows .env
```
Docker Compose 默认读 `.env`。
### 4.2 启动全部核心服务
```
docker compose -f docker-compose.yml up -d
```
首次会拉取所有镜像（约 5–10 分钟，取决于网速）。
| 镜像 | 容器 | 大小 |
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
### 4.3 检查容器状态
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
预期 10 个核心容器全部 `Up`。有容器持续 `Restarting` 就 `docker logs 容器名` 看原因。
### 4.4 已知问题修复：Ghost 强制 SQLite
如果 `ghost` 一直 Restarting，日志报 `Error: connect ECONNREFUSED <服务器IP>:3306`——说明数据卷里残留了指向 MySQL 的旧 `config.production.json`。修复：在 compose 的 ghost 服务 `environment` 显式声明 SQLite：
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
> ⚠️ Windows + Docker Desktop WSL2 下，卷数据被封在 WSL2 虚拟磁盘内，宿主机 git bash 看不到，无法直接删卷内 `config.production.json`，只能走「环境变量覆盖」路线。也不要 `docker volume rm windows_ghost-data`（会丢已发布文章）。
> ✅ 验证：日志出现 `Ghost database ready` + `Ghost booted`，`curl.exe -I http://127.0.0.1:8090` 返回 200。
### 4.5 逐服务验证可访问
```
# Keycloak — 302 表示 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302（重定向到 /ghost/ 初始化页）
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403（空目录，nginx 在跑）
curl.exe -I http://127.0.0.1:8091
# AI 管理中心 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM 是纯 API 无 Web 界面，从容器内部验证：
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 预期返回 {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 Docker Desktop WSL2 的 HTTP 代理可能导致 LiteLLM 在宿主机无法访问（HEART/空响应），是已知 bug，不影响 NewAPI 经容器名调用它。

## 5. Dify 独立部署

> 📌 Dify 使用官方 docker-compose（含 ~15 个容器），独立部署避免端口冲突，使用自己的默认网络（与核心服务的 `ai-platform` 网络不同）。
### 5.1 克隆 Dify
```
# 方案 A：GitHub（需能访问）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 方案 B：Gitee 官方镜像（国内推荐）
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 修复兼容性 + 复制环境变量
```
cd dify\docker

# 修复 env_file 格式（兼容旧版 Docker Compose）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 复制主环境变量
copy .env.example .env

# 复制所有子模板（sandbox.env 等）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# 修复 Dify 1.16.1 上游校验问题（必需）
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 验证
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ 为什么必须改 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`：Dify 1.16.1 把该字段从「允许 0」升级为「必须 > 0」，但 `shared.env` 模板还是 0。不改的话 `docker-api-1` / `worker` / `worker_beat` / `api_websocket` 4 个容器启动即崩，日志报 `ValidationError: Input should be greater than 0`。
### 5.3 启动 Dify
```
docker compose up -d
docker compose ps
```
> ✅ 所有容器 `Up`（`init_permissions` 显示 Exited 是正常的）。浏览器打开 `http://127.0.0.1/install` 初始化管理员账号。
### 5.4 修复 WebSocket 地址（不改会反复连 ws://localhost）
`.env` 里 `NEXT_PUBLIC_SOCKET_URL` 默认是 `ws://localhost`，内网部署时浏览器里的 localhost 指向用户自己电脑，导致前端反复连不上（创建应用/工作流调试会卡住）。
```
# .env 里改成内网 IP
NEXT_PUBLIC_SOCKET_URL=ws://<服务器IP>

# docker-compose.yaml 里 web 服务的 fallback 同步改
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<服务器IP>}

# 重建 web 容器生效
docker compose up -d web
```
> 📌 改完强刷浏览器（Ctrl+F5）。该变量是运行时读取，改 .env + 重启 web 即可，无需重建镜像。
### 5.5 踩坑速查
> ⚠️ **登录密码是 base64 传输**：Dify 1.16.x 登录接口 `POST /console/api/login` 的 `password` 是 base64 编码后的密码。脚本登录要先 `base64(密码)`；前端「点登录没反应」时 console 里 `GET /account/profile 401` 是未登录的正常现象。
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<公司域名> \
  --new-password '<新密码>' \
  --password-confirm '<新密码>'
```
> ⚠️ **忘记管理员密码重置**：Dify 密码哈希是 `pbkdf2_hmac('sha256', password, salt, 10000)`（迭代 10000），无法反解，用容器命令重置（新密码 ≥ 8 位）：
>     
>     📖 原厂文档：Dify 官方文档 https://docs.dify.ai · 自托管部署 https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak：Realm、用户与 AD

> 📌 访问：宿主机 `http://127.0.0.1:9090`，内网 `http://<服务器IP>:9090`。数据存命名卷 `keycloak-data`，容器重建不丢。凭据见 `.env.windows` 的 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`。
### 6.1 创建 Realm
1. 浏览器打开 `http://127.0.0.1:9090` → Administration Console → 管理员登录；
2. 左上角下拉 → **Create Realm** → Realm name 填 `enterprise-ai` → Create。
### 6.2 方式 A：本地创建账号（无 AD 的小团队/测试）
1. **Groups** → Create Group → `ai-admin`；再建 `ai-user`；
2. **Users** → Add user → 用户名 → Create；
3. Credentials 标签 → 设密码 → Temporary 关闭；
4. Groups 标签 → 加入 `ai-user` 组。
### 6.3 方式 B：从 Active Directory 导入账号（推荐）
公司已有 Windows AD 域控时，员工用域账号登录，无需在 Keycloak 手动建号。前置：Docker 容器到域控网络已互通（网络拓扑、Hyper-V Internal Switch、端口转发见《Keycloak AD 集成指南》 `windows-ad-integration.html`）。
> 📌 需要的 AD 账号：服务账号 `svc_keycloak`（密码永不过期，用于 LDAP 绑定）+ 2 个测试域用户（验证同步）。
#### 创建 LDAP 用户联合
1. enterprise-ai Realm → 左侧 **User Federation** → Add provider → **ldap**；
2. 按下表填写。
| 配置项 | 值 | 说明 |
| --- | --- | --- |
| Vendor | **Active Directory** | 选 AD，不要选 Other（否则 objectGUID 不识别） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 经端口转发；生产填 `ldap://dc.公司域:389` |
| Enable StartTLS | **Off** | LDAP 389 或 LDAPS 636 |
| Bind type | **simple** | 用户名+密码认证 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必须 LDAP DN 格式**，不用 ~~DOMAIN\用户~~ |
| Bind credentials | `svc_keycloak 密码` | 见 `.env.windows` |
| Edit mode | **READ_ONLY** | 只读，不写回 AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 有子 OU 时改 `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **不要填 cn** |
| RDN LDAP attribute | `cn` | 条目命名属性 |
| UUID LDAP attribute | `objectGUID` | AD 不可变唯一标识 |
| User object classes | `person, organizationalPerson, user` | 逗号分隔 |
| Search scope | **Subtree** | **不要选 One Level**（否则子 OU 搜不到） |
| Pagination | **On** | 用户多时分批拉取 |
| Referral | **ignore** | 避免跟到不存在的域控 |
| Import users | **On** | 全量同步导入 |
| Sync Registrations | **On** | 首登即时同步 |
Save → **Synchronize all users** → 等待同步完成。
- ⚠️ 常见填错：
      
        Bind DN 用 **LDAP 格式**（`CN=svc_keycloak,CN=Users,DC=xxx`），不是 ~~DOMAIN\用户~~；
- Username LDAP attribute = `sAMAccountName`，不是 `cn`；
- Search scope = **Subtree**；
- **CN 带空格原样保留**：若显示名带空格（如 `ai all in one admin` 中间是空格），Bind DN 必须写 `CN=ai all in one admin,...`，写成下划线会连不上。
#### 验证 AD 登录
1. 无痕窗口打开 `http://127.0.0.1:9090/realms/enterprise-ai/account`；
2. 用域账号登录（用户名 `aitest1` 或 `aitest1@<company-domain>` UPN 均可）；
3. 成功跳转 Account Console 即通过。
### 6.4 其它企业身份源（附录 N 摘要）
Keycloak 还支持多种身份源，全部接在同一个 `enterprise-ai` Realm 下：
| 身份源 | 接入方式 | 要点 |
| --- | --- | --- |
| Microsoft Entra ID（原 Azure AD） | Identity Providers → OpenID Connect v1.0 | Azure 注册应用拿 client id/secret，redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google（内置） | 可用 Mapper 加 `hd=域名` 限制域 |
| GitHub | Identity Providers → GitHub（内置） | OAuth App 回调 `/broker/github/endpoint` |
| 通用 LDAP（OpenLDAP/FreeIPA） | User Federation → ldap | Vendor 选 Other，Username attribute 用 `uid` |
| 通用 SAML 2.0（Okta/ADFS） | Identity Providers → SAML v2.0 | 贴 IdP 元数据 URL 自动填充 |
> ✅ 多身份源共存：可在 Authentication → Browser flow 加 Identity Provider Redirector，按邮箱域名自动选 IdP（`@公司.com`→AD，`@公司.onmicrosoft.com`→Entra ID）。
> 📖 原厂文档：Keycloak 官方文档 https://www.keycloak.org/documentation · 服务器管理指南 https://www.keycloak.org/server/ · LDAP 联合 https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI：初始化、渠道与 OIDC

### 7.1 初始安装向导（首次访问）
NewAPI 首次启动弹 4 步系统设置向导：
1. **数据库检查**：点「验证数据库连接」，预期绿色勾。
> **管理员账户**：用户名 `ai_all_in_one_admin`、邮箱 `ai_all_in_one_admin@<公司域名>`、密码统一管理员密码。
>         📌 为什么先建本地管理员：此时 OIDC 还没配，NewAPI 不认识 Keycloak，必须先有本地账号「进门」完成配置，再去系统设置打开 OIDC。
3. **使用模式**：选「个人使用」（公司内部：员工能注册、用量分开看、无充值计费模块）。
4. **确认初始化**：创建数据库表 → 用管理员登录。
### 7.2 配置 LLM 渠道（指向 LiteLLM）
1. **渠道** → 添加新渠道 → 类型 `OpenAI`；
2. Base URL 填 `http://litellm:4000`（容器名，走 Docker 网络，**不是 localhost**）；
3. 密钥填 `.env` 的 `LITELLM_MASTER_KEY` 实际值（不是示例值，否则报 `No connected db`）；
4. 模型填 `deepseek-chat`（示例，按实际配置）；
5. 保存 → 点「测试」验证连通。
配了多个 provider 就重复添加：Claude 类型 `Anthropic Claude`、DeepSeek 类型 `OpenAI`，Base URL 都填 `http://litellm:4000`。
### 7.3 创建 API 密钥
为 Dify 和 DeepChat 各建一把，分开统计用量：
1. 左侧 **API 密钥** → 新建；
2. 名称 `dify-key` → 保存 → 复制 `sk-xxx`（填到 Dify 模型供应商）；
3. 再建 `deepchat-key` → 复制 `sk-xxx`（分发给 DeepChat 用户）。
### 7.4 允许普通用户自助申请 Key
员工登录后默认能在「API 密钥」页自己新建 Key。要能真正调用模型，需满足两点（已在 `.env` 预设）：
1. **有额度**：`DEFAULT_QUOTA=100`（新用户送 100 美元额度）；
2. **有 token**：`GENERATE_DEFAULT_TOKEN=true`（注册即生成初始 token）。
> ⚠️ 只对「新注册」用户生效：已登录过的用户（如 `aitest1`）不会自动补发，需管理员在「用户」页手动设额度。
### 7.5 接入 Keycloak OIDC（让 AD 用户直接登录）
#### ① 在 Keycloak 建 NewAPI OIDC Client
1. enterprise-ai Realm → **Clients** → Create client；
2. Client ID `newapi`，类型 OpenID Connect；
3. **Client authentication：On**（必开，否则没 Credentials 标签）、Standard flow / Direct access grants：On；
4. Valid redirect URIs：`http://<服务器IP>:3000/*` 和 `http://127.0.0.1:3000/*`；
5. 保存 → Credentials 标签 → 复制 Client secret。
#### ② 在 NewAPI 开启 OIDC
NewAPI 后台 → **系统设置 → 身份验证 → 自定义 OAuth → 添加 OAuth 提供商**，填：
| 分组 | 配置项 | 值 |
| --- | --- | --- |
| 快速设置 | 预设模板 / API 地址 | `Keycloak` / `http://127.0.0.1:9090` |
| 基本信息 | 提供商名 / 标识符 | `Keycloak` / `keycloak` |
| 凭证 | Client ID / Secret | `newapi` / Keycloak 复制的值 |
| 端点 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 字段映射 | 用户 ID / 用户名 / 邮箱 | `sub` / `preferred_username` / `email` |
点「自动发现」填好端点后，**把令牌端点、用户信息端点改成 `host.docker.internal:9090`**（NewAPI 容器内部调 Keycloak 用），授权端点保持 `<服务器IP>:9090`（浏览器跳转用）。作用域 `openid profile email`。
- ⚠️ 两个必改，否则登录失败：
      
        **保存后回 Keycloak 补回调 URL**：把 `http://<服务器IP>:3000/oauth/keycloak` 和 `http://127.0.0.1:3000/oauth/keycloak` 加进 Valid redirect URIs；
- **NewAPI「服务器地址」设为内网地址**：系统设置 → 通用设置 → 服务器地址改 `http://<服务器IP>:3000`（默认 localhost 会导致换 token 报 `invalid_grant - Incorrect redirect_uri`）。改后本机也要用内网 IP 访问 NewAPI。
改数据库的方法：
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<服务器IP>:3000') ON DUPLICATE KEY UPDATE value='http://<服务器IP>:3000';"
docker compose restart new-api
```
> ⚠️ 排错：登录返回 **429 Too Many Requests**——NewAPI 关键接口限流（默认 20 次/20 分钟）触发。临时解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；永久方案已在 `.env` 预设 `CRITICAL_RATE_LIMIT_ENABLE=false` 等四组变量。
> 📖 原厂文档：NewAPI 官方文档 https://docs.newapi.pro · 官网 https://www.newapi.ai · 开源仓库 https://github.com/QuantumNous/new-api

## 8. LiteLLM：验证与缓存

> ⚠️ PII 脱敏（Presidio guardrail）当前**暂时禁用**：新版 LiteLLM 的 guardrail 配置格式变更，`litellm-config.yaml` 该段已注释，当前 LiteLLM 仅做代理转发（不脱敏）。启用方法见第 25 章。
### 8.1 验证 LiteLLM 基本可用
```
curl -X POST http://<服务器IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` 是 LiteLLM 管理员密钥，取 `.env` 实际值（不是占位符本身，否则 401）。且必须用内网 IP `<服务器IP>:4001`，不能用 `127.0.0.1:4001`（WSL2 端口转发问题）。
### 8.2 响应缓存（已内置，节省 token）
LiteLLM 已启用 Redis exact match 缓存：完全相同的请求（模型+消息+参数）直接返回缓存，跨用户共享、省 token。
```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 独立缓存 Redis
    port: 6379
    ttl: 3600            # 缓存 1 小时
```
> 验证：`curl http://<服务器IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` 返回 `ping_response: true`；连续两次相同请求，第二次耗时降到毫秒级。关闭缓存：`cache: false` 后重启 litellm。
### 8.3 添加更多 LLM 提供商
1. `.env` 取消 `# OPENAI_API_KEY=` 注释填 Key；
2. `litellm-config.yaml` 取消对应 model 块注释；
3. `docker compose up -d litellm`。
> 📖 原厂文档：LiteLLM 官方文档 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Dify / Ghost / Gitea 配置

### 9.1 Dify：配置模型供应商
1. 打开 `http://<服务器IP>` → 首次设管理员邮箱/密码（邮箱 `ai_all_in_one_admin@<公司域名>`）；
  - **设置 → 模型供应商** → OpenAI-API-compatible → 添加模型：
        
          模型名 `deepseek-chat`（按实际）；
  - API Key：`dify-key` 的 `sk-xxx`；
  - API endpoint：`http://host.docker.internal:3000/v1`。
3. 工作室 → 创建聊天助手 → 选模型 → 发消息验证。
> ⚠️ Dify 用 `host.docker.internal` 而不是容器名，因为 Dify 在自己网络里、与 NewAPI 不同网络。
### 9.2 Ghost：配置门户
1. 后台入口 `http://<服务器IP>:8090/ghost/`（**注意 /ghost/ 后缀**）。首次走 setup 向导建管理员（邮箱 `ai_all_in_one_admin@<公司域名>`，密码 ≥10 位）；
2. 自动化：直接跑 `scripts\ghost-setup.ps1` 用 setup API 一次建管理员，等效向导（已初始化自动跳过）；
3. **主题**：外观 → 主题，自带的 Casper/Source 直接激活即可；
4. **导航菜单**：外观 → 菜单 → 建「主导航」。
| 菜单项 | 类型 | URL |
| --- | --- | --- |
| 首页 | 页面 | `/` |
| 新闻动态 | 分类 | `/category/news` |
| 下载中心 | 页面 | `/downloads` |
| AI 工作台 | 自定义链接 | `http://<服务器IP>` |
| 帮助文档 | 分类 | `/category/docs` |
1. **下载中心页面**：页面 → 新建「下载中心」（slug `downloads`），内容放 DeepChat 安装包内网链接。
```
## DeepChat 企业版
### Windows
- [DeepChat v1.1.0（Windows x64）](http://<服务器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0（macOS x64）](http://<服务器IP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ 别在门户首页 `/` 点「注册」——那是访客订阅者注册（未配 SMTP 会 500）；管理员入口是 `/ghost/`。别从 GitHub 装最新版主题（可能适配 Ghost 6.x，5.x 报 incompatible）。
### 9.3 Gitea：初始化和 Runner 注册
1. 打开 `http://<服务器IP>:3002` → 安装向导（数据库 SQLite 已预配）→ 建管理员（用户名 `ai_all_in_one_admin`）；
2. 右上角头像 → **Site Administration → Actions** → 确认 Enabled Actions 开启；
3. **Runners → Create new Runner** → 复制 Registration Token；
4. 把 Token 填进 `.env` 的 `GITEA_RUNNER_TOKEN`，重建 Runner：
```
# ⚠️ 必须用 up -d，不能用 restart（restart 不重读 .env 的 token）
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ 踩坑 1：报 `readonly database` 多为 `gitea.db` 被 root 属主，删掉那个 root 属主的 db 让它以 git 用户重建。  
> 
>     ⚠️ 踩坑 2：`ROOT_URL` 要设成 `http://<服务器IP>:3002/`，否则生成的仓库链接是 localhost，员工点开失效。
> 
>     📖 原厂文档：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中文） https://docs.gitea.com/zh-cn

## 10. DeepChat 分发与 CI/CD

### 10.1 分发链路
分发链路 = GitHub Releases 安装包 → `deepchat-sync` 仓库的 Gitea Actions → 更新服务器（:8091）→ Ghost 下载页 → 员工下载。
> 📌 已删除 `deepchat` 源码 mirror 仓库——mirror 只同步 git 源码、不同步 release 安装包，对分发无用。若要做源码审计/二次开发再单独建。
### 10.2 下载安装包到更新服务器
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
验证：`curl -I http://<服务器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206。再更新 Ghost 下载页（见第 9 章）。
### 10.3 自动同步（Gitea Actions，推荐）
| 组件 | 说明 |
| --- | --- |
| `deepchat-sync` 仓库 | 普通仓库（不能用 mirror），放 `.gitea/workflows/sync.yml` + `update_ghost.py` |
| 触发 | `schedule`（每天 UTC 2 点）+ `workflow_dispatch`（手动） |
| 逻辑 | 查 GitHub 最新 tag → 对比 `version.txt` → 有新版则下载 + 更新 Ghost 下载页 + 写版本 |
```
# 手动触发一次
curl -X POST "http://<服务器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密码>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ 关键坑：① act_runner 的 `container.network` 必须通过 `config.yaml`（+`CONFIG_FILE` 环境变量）配，否则 job 容器解析不了 `gitea` 主机名；② docker.sock 由 runner 自动挂载，别在 options 里再挂（报 Duplicate mount point）。
### 10.4 国内下载源配置（sync-config.json）
官网 `deepchatai.cn` 下载页的安装包仍指向 GitHub，国内基本不通。真正解决靠 `sync-config.json`：
| 字段 | 作用 | 默认 |
| --- | --- | --- |
| `version_source` | `github`（GitHub API 最准）或 `official`（官网缓存，可达但滞后） | `github` |
| `download_prefix` | 下载加速前缀，如 `https://ghproxy.com/` | `""` |
| `keep_releases` | 版本历史保留数 | `5` |
| `market_url` | 下载页「先装技能管家」的内网市场地址 | `http://<服务器IP>:3100` |
```
# 能连 GitHub：默认不改
{ "version_source": "github", "download_prefix": "" }
# GitHub 加速代理（最常用）
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 工作流内置 `version_cmp.py` 版本比较，只有「最新版 > 本地版」才下载（避免官网缓存滞后把客户端回退旧版）。
### 10.5 方式 B：Docker 构建自定义版本（可选）
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# 容器内
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# 产物在 dist/，退出后 copy 到 deepchat-updates/
```
### 10.6 配置 DeepChat 客户端（员工侧）
1. DeepChat → 设置 → 模型服务 → 自定义 Provider / OpenAI 兼容；
2. API Base URL：`http://<服务器IP>:3000/v1`（必须内网 IP）；
3. API Key：`deepchat-key` 的 `sk-xxx`；
4. 模型：`deepseek-chat`，保存后测试对话。
> 📖 原厂文档：DeepChat 快速开始 https://deepchatai.cn/docs/guide/getting-started/ · 开源仓库 https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway 与 Skill 市场

> 📌 MCP Gateway 基于官方 `@modelcontextprotocol/sdk`，暴露标准 Streamable HTTP `/mcp` 端点，已并入主 `docker-compose.yml`（端口 3100），随核心服务一起启动。源码在 `mcp-gateway/`。
### 11.1 内置平台工具
| 工具 | 用途 |
| --- | --- |
| `platform_time` | 返回服务器当前时间 |
| `platform_echo` | 回显文本（连通性测试） |
| `platform_services` | 列出平台服务清单 |
### 11.2 聚合外部 MCP Server
编辑 `mcp-gateway/mcp-servers.json`，添加 stdio 或 http 类型，重启 `mcp-gateway` 生效：
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
聚合的工具自动加 `{serverName}_` 前缀避免重名。
### 11.3 客户端接入
1. DeepChat：设置 → MCP → 添加服务器 → 类型「可流式传输的 HTTP」，URL `http://<服务器IP>:3100/mcp`；
2. Dify 工作流：自定义工具 / MCP 工具配置指向同地址。
> 验证：`curl http://<服务器IP>:3100/health` 返回 `{"status":"ok"}`；`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` 返回工具列表。
### 11.4 Skill 市场（内网技能包分发）
| 端点 | 作用 |
| --- | --- |
| `/market` | Skill 市场页（卡片浏览 + 下载 ZIP + 复制安装地址） |
| `/skills` | 技能清单 JSON（name/description/version） |
| `/skills/<名称>.zip` | 技能包下载（动态打包） |
技能放在 `mcp-gateway/skills/` 目录（含 SKILL.md 的子目录），**每次请求自动扫描，无需重启**。内置 `skill-market` 引导技能。
> 📌 DeepChat 里 MCP 和 Skill 是两个概念：MCP 是「工具」（function calling），Skill 是「智能体技能包」（SKILL.md + 脚本）。DeepChat 的 Skill 没有「自定义市场 URL」，只支持文件夹/ZIP/URL 三种安装，内网分发靠「URL 安装」变相实现。
### 11.5 ⚠️ Skill 市场主机名（部署参数，必须替换）
「技能管家」读 `config.json` 的 `market_url` 请求 `/skills` 清单。两个关键点：
- **用主机名，不能用 IP**：DeepChat 的 agent 环境会把 IP 脱敏成 `[IP_ADDRESS_REDACTED]`，导致读不到真实地址；
- **主机名是部署参数**：每套部署都不同，不能照抄。
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<市场主机名>:3100" }
```
##### 自动（用 Agent 部署）
Agent 在收集参数时会问「Skill 市场主机名」，自动替换 `config.json` 和 `SKILL.md` 里的 `<市场主机名>`。
##### 手动
1. 编辑 `config.json` + `SKILL.md` 兜底地址，替换 `<市场主机名>`；
2. 让主机名可解析：单机在 `C:\Windows\System32\drivers\etc\hosts` 加 `<服务器IP>  <主机名>`；公司内网在 DNS 加 A 记录。
> ✅ 主机名建议用「服务名+公司域」FQDN，如 `skillmarket.你的公司域名`。DNS 加 A 记录：域控「DNS → 正向查找区域 → 你的域 → 新建主机(A)」，或用 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "你的域" -IPv4Address "<服务器IP>"`。
### 11.6 管理 API（供 AI 管理中心增删改）
| 端点 | 作用 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server 增删改查（写回配置+自动重连） |
| `POST /api/skills/upload` | 上传技能 zip（校验 SKILL.md、防路径穿越） |
| `DELETE /api/skills/:name` | 删除技能 |
需 `X-Admin-Token` 头（`.env` 的 `MCP_ADMIN_TOKEN`）。由 AI 管理中心「MCP Gateway」页代理调用（`ai-platform-admin` 角色保护）。
> 📖 原厂文档：MCP 协议官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. AI 管理中心

> 📌 定位：不是 Docker 管理平台（1Panel/Portainer），而是面向管理员的统一后台——Keycloak 鉴权 + 左侧菜单链接全部产品 + Dashboard 集群状态 + 统一管理员账号。
### 12.1 核心能力
| 菜单项 | 行为 | 说明 |
| --- | --- | --- |
| 📊 总览仪表板 | 内嵌页面 | 8 个产品业务指标 + Docker 服务（按产品分组）+ 系统信息 |
| Ghost / Dify / Gitea / Keycloak | 内嵌统计页 | 先看统计，点「打开后台」才跳转 |
| 🔀 NewAPI 管理 | 内嵌页面 | 渠道/用户/密钥 + 成本报表 + 审计日志 |
| 🔌 MCP Gateway | 内嵌管理页 | 增删 MCP Server、上传/删除 Skill |
| 📈 监控 / 🔍 可观测 | 新标签页 | Grafana :3030 / Langfuse :3010 |
| 📜 统一日志 | 内嵌页 | 按容器+关键字+时间查 Loki |
| 💾 备份恢复 | 内嵌页 | 备份列表 + 立即备份 + 一键恢复 |
| 🩺 可用性测试 | 内嵌页 | 定时+手动测全链路 |
| 📄 报告生成 | 内嵌页 | 自定义周期导出 .md |
| ⚙️ 系统设置 | 内嵌页 | 界面语言 9 种 + 产品入口 URL |
### 12.2 初始化 Global Administrator
```
# .env 中配置
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=见账号密码清单
ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>
```
启动后自动在 Keycloak 建 `ai_all_in_one_admin` 用户（已有则跳过），分配 `ai-platform-admin` Realm Role。核心理念：**一个 Global Admin 账号管理所有平台**。
### 12.3 Docker Compose 部署
```
# 前置：先装依赖（一次）
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
      - KEYCLOAK_URL=http://<服务器IP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<company-domain>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<服务器IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Keycloak 客户端配置
1. Keycloak → enterprise-ai → Clients → Create；
2. Client ID `AI-all-in-one-admin-portal`，Client authentication / Standard flow 都 On；
3. Valid Redirect URIs：`http://127.0.0.1:10086/*` 和 `http://<服务器IP>:10086/*`；
4. 复制 Client Secret → 填 `.env` 的 `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`；
5. 建 Realm Role `ai-platform-admin`，分配给 `ai_all_in_one_admin`。
- ⚠️ 部署/排错要点：
      
        admin-portal 会话存 Redis（`admin-session-redis`），重启容器不再清空登录会话；
- 首页 `/` 必须走 Keycloak 保护（`express.static(..., {index:false})` + 显式 `app.get('/', keycloak.protect())`），否则未登录直接渲染空看板；
- 统计 Dify 用实际管理员邮箱（`ai_all_in_one_admin@<company-domain>`，须与 AD 全局管理员一致）；
- **改 server.js 后必须 `docker restart admin-portal`**，不能用 `up -d`（volume 文件内容变化不会触发重建）。
### 12.5 验证
1. 打开 `http://<服务器IP>:10086` → 自动跳 Keycloak 登录（未登录不显示空看板）；
2. 用 `ai_all_in_one_admin` 登录 → 进总览仪表板；
3. Dashboard 显示 8 个产品指标 + 容器分组；
4. 点各产品先看统计、点「打开后台」才跳转；
5. 系统设置可切 9 种语言。
### 12.6 管理员分模块授权 + Keycloak 认证页管理（v0.91）
全局管理员可在 AI 管理中心直接管理其他管理员和 Keycloak：
- **管理员账号管理**：从 Keycloak 关联的 IdP 搜索已有账号（AD/LDAP 用户，无需新建、无需密码）→ 勾选模块 → 确定。系统分配 `admin:<产品>` Realm Role，并**真实开通到产品**（SSO 优先、API 兜底）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。撤销模块或删除管理员会**从产品删除该账号**。无 SSO 产品建号生成临时密码，🔑 图标可回看（仅全局管理员）。非管理员登录弹「你不是管理员」并退出。
- **Keycloak 认证页**：「全部同步 / 增量同步」按钮一键拉取 AD 属性变更；每行用户有「编辑」（跳 Keycloak 控制台）和「删除」；角色区块可新建/删除角色、查看成员。同步/删除/角色操作仅全局管理员。
> ⚠️ 注意：Keycloak 无「单用户同步」端点，增量同步会同步 AD 里所有有变更的账号；AD 联邦用户删除后下次全量同步或再次 SSO 登录会重新出现，彻底移除请在 AD 里禁用/删除该账号。

## 13. 互连验证清单

部署篇到此结束。最后按下面 12 项逐条验证，全部 ✅ 才说明平台真正跑通。
| # | 互连 | 验证方式 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI 渠道测试收到 OK |
| 2 | Dify → NewAPI | Dify 模型供应商测试收到回复 |
| 3 | DeepChat → NewAPI | DeepChat 发消息收到回复 |
| 4 | Keycloak → NewAPI | Keycloak 账号 OIDC 登录 NewAPI |
| 5 | Keycloak → Dify | Keycloak 账号 SSO 登录 Dify |
| 6 | MCP Gateway → DeepChat | DeepChat 获取 MCP 工具列表并调用 |
| 7 | MCP Gateway → Dify | Dify 工作流调用 MCP 工具 |
| 8 | Gitea Runner → Docker | Runner 可执行 CI/CD 任务 |
| 9 | Gitea → 更新服务器 | CI 产物可上传到更新服务器 |
| 10 | Ghost API → Gitea | Gitea Actions 可调 Ghost API 发公告 |
| 11 | Ghost → Dify 跳转 | 门户「AI 工作台」正确跳 Dify |
| 12 | AI 管理中心 | Dashboard 显示全部容器 + 左侧菜单可访问所有产品 |
> ✅ 全部通过后，继续读第二部分「管理篇」学习各产品的日常操作，以及第三部分「运维篇」的备份、健康检查、排错。

**第二部分 · 管理篇（各产品日常操作）**

## 14. Keycloak 日常管理

Keycloak**入口**：http://<服务器IP>:9090 → Administration Console → 管理员登录。
> 📌 很多操作也可在 AI 管理中心 → Keycloak 认证页完成（仅全局管理员）：LDAP 全量/增量同步、删除用户、角色管理（列表/新建/删除/查看成员）。见第 12.6 章。
### 14.1 管理用户
1. **新建用户**：Users → Add user → 填用户名 → Create；
2. **设密码**：该用户 Credentials 标签 → 设密码 → Temporary 关闭（否则首次登录强制改密）；
3. **重置密码**：Users → 搜到用户 → Credentials → Set password；
4. **禁用/启用**：用户详情顶部 Enabled 开关（禁用后该用户所有 SSO 立即失效）；
5. **删除**：用户详情 → Delete。
### 14.2 角色与权限
- **Realm Role**：Realm roles → Create role 建角色（如 `ai-platform-admin`）；也可在 AI 管理中心 → Keycloak 认证页新建/删除角色、查看成员；
- **分配角色**：用户 → Role mapping → Assign role；
- **组**：Groups → 建组（`ai-admin` / `ai-user`）→ 组内加用户，角色赋给组，用户随组继承权限。
> ✅ 管理权限统一由 `ai-platform-admin` 角色控制，各产品接 SSO 时用这个角色识别管理员。
### 14.3 OIDC 客户端（新产品接 SSO）
1. Clients → Create client → Client ID 填产品名（如 `newapi` / `grafana` / `langfuse`）；
2. Client authentication：On（否则没有 Credentials 标签）、Standard flow：On；
3. Valid redirect URIs / Web origins 填产品的回调地址（内网 IP + 127.0.0.1 两个都加）；
4. 保存 → Credentials 标签复制 Client secret 给产品侧。
### 14.4 AD / LDAP 联邦维护
- **改域控/密码**：User Federation → 点 LDAP Provider → 改 Connection URL / Bind credentials → Save；
- **手动同步**：Synchronize all users；或在 AI 管理中心 → Keycloak 认证页点「全部同步 / 增量同步」（增量只同步 AD 里有变更的账号）。
- **组映射**：Mappers 标签 → group-ldap-mapper → Groups DN 设 AD 组所在容器，把 AD 组映射成 Keycloak 角色。
### 14.5 会话管理
- **查看活跃会话**：Users → 某用户 → Sessions；
- **强制下线**：Sessions → Sign out all；
- **全局会话/令牌配置**：Realm settings → Sessions / Tokens 标签调超时。
> ⚠️ 关键坑回顾：① bind DN 的 CN 带空格原样保留；② Username LDAP attribute 用 `sAMAccountName` 不是 `cn`；③ Search scope 选 Subtree；④ SSO 报 `unknown_error` 多为宿主机 iphlpsvc 未运行导致 AD 端口转发失效；⑤ AD 域控 VM 未开机时，LDAP 联合的账号登录会报 `LDAP Connection refused`。
> 📖 原厂文档：Keycloak 官方文档 https://www.keycloak.org/documentation · 服务器管理指南 https://www.keycloak.org/server/

## 15. NewAPI 日常管理

NewAPI**入口**：http://<服务器IP>:3000。
### 15.1 渠道管理（上游模型）
1. **新增渠道**：渠道 → 添加新渠道 → 类型 OpenAI（或 Claude 等）→ Base URL `http://litellm:4000` → 密钥 `LITELLM_MASTER_KEY` → 填模型名 → 保存；
2. **测试**：渠道列表点「测试」，选模型验证连通；
3. **禁用/启用**：渠道列表开关，禁用后该渠道不再承接请求；
4. **优先级/权重**：多渠道同模型时按优先级/权重分流。
### 15.2 令牌（API Key）管理
1. **新建**：API 密钥 → 新建令牌 → 起名（如 `deepchat-key`）→ 可设额度/过期时间/模型限制 → 保存；
2. **复制 Key**：`sk-` 开头，**只显示一次，立即保存**；
3. **禁用/删除**：令牌列表操作（禁用后该 Key 立即失效）；
4. **查用量**：令牌详情看已消耗额度。
### 15.3 额度与用户
- **新用户默认额度**：`DEFAULT_QUOTA`（建议 100 美元）；
- **给单个用户提额**：用户页 → 编辑该用户 → 设额度；
- **充值/封禁**：用户页操作；
- **分组管理**：按部门建分组，设模型倍率/配额，用户归组即按部门管控。
### 15.4 日志与成本
- **日志页**：查每次调用的用户/模型/token/额度/成本/来源 IP；
- **成本报表**：AI 管理中心「NewAPI 管理」页有按用户/模型/日期聚合的成本报表 + 最近 100 条审计日志。
> 📌 客户端 IP 记录依赖用户「记录 IP 日志」设置（`record_ip_log`，默认关），需要 IP 审计时给对应用户开启。
### 15.5 系统设置要点
- **服务器地址**：必须设为内网 `http://<服务器IP>:3000`（否则 OIDC 报 `invalid_grant - Incorrect redirect_uri`）；
- **身份验证 → 自定义 OAuth**：Keycloak OIDC 接入（见第 7 章）；
- **使用模式**：个人使用 ↔ 对外运营可切换。
> ⚠️ 关键坑回顾：① 渠道 Base URL 都填容器名 `http://litellm:4000`；② 限流 429 用 `CRITICAL_RATE_LIMIT_ENABLE=false` 等变量控制；③ 改数据库直接用 `MYSQL_PWD` 环境变量，避免 stderr 密码警告被误判错误。
> 📖 原厂文档：NewAPI 官方文档 https://docs.newapi.pro · 官网 https://www.newapi.ai · 开源仓库 https://github.com/QuantumNous/new-api

## 16. LiteLLM 日常管理

**入口**：管理后台 http://<服务器IP>:4001/ui（Web 界面）；API http://<服务器IP>:4001（调试用 `/v1/models`）。配置在 `litellm-config.yaml`。
### 16.0 登录管理后台
LiteLLM 的 `/ui` 管理后台用**统一账号**登录（用户名 `ai_all_in_one_admin`、密码见 `credentials.html`），由 `.env` 的 `UI_USERNAME` / `UI_PASSWORD` 控制。
> 📌 也可配置 **Keycloak SSO 自动登录**：在 `.env` 设 `LITELLM_UI_*`（`GENERIC_CLIENT_ID/SECRET` + Keycloak 的 auth/token/userinfo 端点 + `AUTO_REDIRECT_UI_LOGIN_TO_SSO=true`），并在 Keycloak 建 OIDC Client `litellm`（redirect `<服务器IP>:4001/sso/callback`）+ 返回 `litellm_role=proxy_admin` 的 claim。配置后访问 `/ui` 自动跳 Keycloak 免密登录。
### 16.1 模型列表维护
编辑 `litellm-config.yaml` 的 `model_list`，增删模型与对应 API Key。加新 provider 的步骤：
1. `.env` 取消 `# OPENAI_API_KEY=` 注释填 Key；
2. `litellm-config.yaml` 取消对应 model 块注释；
3. `docker compose up -d litellm`。
### 16.2 响应缓存
Redis exact match 缓存，完全相同请求跨用户共享。调 `cache_params.ttl`（默认 3600 秒）。关闭：`cache: false` 后重启。
### 16.3 Langfuse 上报
通过 `success_callback: ["langfuse"]` + `.env` 的 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` 自动上报每次调用。
### 16.4 重启与排错
```
docker compose restart litellm          # 改配置后重启
docker logs litellm --tail 50           # 看日志
```
> ⚠️ 关键坑：① guardrails 要加 `default_on: true` 才全局生效；② PII 脱敏（Presidio）当前因上游 API 变更暂注释，仅做纯代理；③ 用稳定版 `v1.95.1`（`main-latest` 有 bug）。
> 📖 原厂文档：LiteLLM 官方文档 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Dify 日常管理

Dify**入口**：http://<服务器IP>（80 端口，独立官方 compose，升级维护在 `dify/docker/` 单独操作）。
### 17.1 应用管理（工作室）
1. **创建应用**：工作室 → 创建空白应用 → 选类型（聊天助手 / Agent / 工作流 / 文本生成）；
2. **编排**：拖拽节点编排提示词、工具、知识库、变量；
3. **调试**：右上角「预览」运行调试；
4. **发布**：调试通过后「发布」→ 生成分享链接或嵌入 Web 应用。
### 17.2 知识库管理
1. 知识库 → 创建知识库；
2. 上传文档（Word / PDF / Markdown / 网页链接），选分段规则 + 索引方式（高质量/经济）；
3. 在应用里「添加」该知识库，AI 即可基于文档回答。
> 📌 知识库内容会被 AI 用于回答，机密资料不要上传（遵守数据分级规范）。
### 17.3 模型供应商
- **添加模型**：设置 → 模型供应商 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（走 NewAPI）+ `dify-key`；
- **系统模型设置**：指定默认聊天/推理/嵌入模型。
### 17.4 成员与权限
- **成员**：邀请成员进工作空间，设 Owner/Admin/Editor/Normal 角色；
- **登录方式**：设置 → 登录方式 → 可接 OIDC（Keycloak）实现 SSO。
### 17.5 升级与维护
```
cd dify\docker
git pull                          # 拉最新版
docker compose pull               # 拉新镜像
docker compose up -d              # 重建
```
> ⚠️ 关键坑：① WebSocket `NEXT_PUBLIC_SOCKET_URL` 要设内网 IP；② 登录密码是 base64 编码；③ 忘密码用 `docker exec docker-api-1 flask reset-password`（≥8 位）。
> 📖 原厂文档：Dify 官方文档 https://docs.dify.ai · 自托管 https://docs.dify.ai/getting-started/install-self-hosted

## 18. Ghost 日常管理

Ghost**入口**：前台 http://<服务器IP>:8090；后台 http://<服务器IP>:8090/ghost/（注意 /ghost/ 后缀）。
### 18.1 登录后台
Ghost 5 后台是**免密登录**：输入邮箱 → Ghost 发 6 位验证码到 MailHog（`:8025`）。更快的方式：在 AI 管理中心点「Ghost 后台」的「打开」按钮，自动完成登录（本地算 TOTP 码，免翻邮件）。
### 18.2 发布内容
1. **文章**：Posts → New post → 写内容（Markdown 编辑器）→ Publish；
2. **页面**：Pages → New page（如「下载中心」slug `downloads`）；
3. **标签/分类**：Tags → 建分类（如 `news` / `docs`），文章归到分类下。
### 18.3 导航菜单
1. 后台 → 外观（Design）→ 菜单（Navigation）；
2. 编辑「Primary」主导航，添加首页/新闻/下载中心/AI 工作台/帮助文档（见第 9 章菜单表）。
### 18.4 主题
- **切换**：外观 → 主题，自带的 Casper / Source 直接激活；
- **安装**：主题市场（Design → Change theme）或上传 zip。
> ⚠️ 别从 GitHub 装最新版主题（可能适配 Ghost 6.x，5.x 报 incompatible），要装旧版 zip。
### 18.5 成员与订阅（如需）
- Members：管理订阅者；
- 若不需要订阅，可忽略此模块（内网门户通常用不到）。
### 18.6 集成（API Token）
1. 后台 → Settings → Integrations → 添加自定义集成；
2. 生成 Admin API Key（格式 `id:secret`），供 Gitea Actions 发布公告等自动化用。
> ⚠️ 关键坑：① 别在首页 `/` 点「注册」（那是访客订阅者注册）；② 6 位验证码本质是 TOTP，AI 管理中心能本地算出；③ 即使本地算码，Ghost 仍会真发邮件，所以 MailHog 必须保留（否则 `Failed to send email`）。
> 📖 原厂文档：Ghost 官方文档 https://ghost.org/docs/ · 管理后台 https://ghost.org/docs/admin/

## 19. Gitea 日常管理

Gitea**入口**：Web http://<服务器IP>:3002；SSH `ssh://git@<服务器IP>:2222`。
### 19.1 仓库与组织
1. **建仓库**：右上角 + → New repository；
2. **建组织**：+ → New organization，组织下建仓库、管理团队；
3. **迁移外部仓库**：+ → New migration，填 GitHub 地址可 mirror（只读同步源码）。
### 19.2 用户与权限
- **添加用户**：Site Administration → User Accounts → Create user；
- **仓库权限**：仓库 → Settings → Collaborators；
- **组织团队**：组织 → Teams → 建团队 → 加成员 → 赋仓库权限。
### 19.3 Actions / Runner 管理
1. **启用 Actions**：Site Administration → Actions → Enabled；
2. **注册 Runner**：Runners → Create new Runner → 复制 Token → 填 `.env` 的 `GITEA_RUNNER_TOKEN` → `docker compose up -d gitea-runner`；
3. **看 Runner 状态**：Runners 页显示 Idle（绿色）即正常；
4. **跑工作流**：仓库 → Actions → 手动运行或 push 触发。
> ⚠️ 改 Runner token 必须 `up -d`（restart 不重读 .env）。
### 19.4 站点设置
- **ROOT_URL**：`GITEA__server__ROOT_URL` 要设内网 `http://<服务器IP>:3002/`，否则生成的仓库链接是 localhost；
- **注册策略**：Site Administration → Config 调注册开关、邮箱配置。
> ⚠️ 关键坑：报 `readonly database` 多为 `gitea.db` 被 root 属主，删掉那个 root 属主的 db 让它以 git 用户重建。
> 📖 原厂文档：Gitea 官方文档（中文） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. MCP Gateway 日常管理

**入口**：http://<服务器IP>:3100（市场页 `/market`）。管理经 AI 管理中心「MCP Gateway」页操作（`ai-platform-admin` 角色），也可直接调管理 API。
### 20.1 管理 MCP Server
1. 编辑 `mcp-gateway/mcp-servers.json` 增删服务器（stdio/http 两种）；
2. 重启 `docker compose restart mcp-gateway`；
3. 或在 AI 管理中心 MCP Gateway 页增删（写回配置 + 自动重连）。
### 20.2 管理 Skill（技能包）
1. **上传**：AI 管理中心 MCP Gateway 页 → 上传技能 zip（校验含 SKILL.md、防路径穿越）；
2. **删除**：对应技能删除；
3. 技能放 `mcp-gateway/skills/`（含 SKILL.md 的子目录），每次请求自动扫描，无需重启。
### 20.3 扩展内置工具
在 `mcp-gateway/gateway.js` 加两步：
```
// ① 工具定义（builtinTools 数组加一项）
{ name: 'platform_health', description: '查询服务健康状态',
  inputSchema: { type: 'object', properties: {} } }

// ② 执行逻辑（callBuiltin 加一个分支）
if (name === 'platform_health') { return '所有服务运行正常'; }
```
改完 `docker compose restart mcp-gateway`。
### 20.4 维护 skill-market 市场地址
「技能管家」的 `market_url` 在 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`，必须用主机名（不能用 IP），是部署参数（详见第 11 章）。
> ⚠️ 管理 API 需 `X-Admin-Token` 头（`.env` 的 `MCP_ADMIN_TOKEN`）；未配返回 503、错 token 返回 401。
> 📖 原厂文档：MCP 协议官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. 更新服务器管理

**入口**：http://<服务器IP>:8091，数据在 `deepchat-updates/`。
### 21.1 手动放置新版本
1. 下载 DeepChat 官方安装包到 `deepchat-updates/deepchat/`；
2. 更新 `version.txt`（写入新版本号）；
3. 员工侧 DeepChat 自动更新时检查 `version.txt` 发现新版即下载安装。
### 21.2 自动同步（推荐）
靠 `deepchat-sync` 仓库的 Gitea Actions 每天自动检查 GitHub 新版本并同步（见第 10 章）。手动触发：
```
curl -X POST "http://<服务器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密码>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 配置同步（sync-config.json）
| 字段 | 作用 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 下载加速前缀（如 ghproxy.com） |
| `keep_releases` | 版本历史保留数 |
| `market_url` | 下载页「技能管家」市场地址 |
> 📌 DeepChat 客户端报「模型连接超时」通常是客户端走了挂掉的系统代理（`ECONNREFUSED 127.0.0.1:33210`）。让用户在 DeepChat「设置 → 网络/代理」改为「不使用代理/直连」。
> 📖 原厂文档：DeepChat 快速开始 https://deepchatai.cn/docs/guide/getting-started/ · 开源仓库 https://github.com/ThinkInAIXYZ/deepchat

## 22. 监控告警管理

Grafana**入口**：Grafana http://<服务器IP>:3030（SSO 自动登录）；Prometheus :9091；Alertmanager :9093。
### 22.1 组件与端口
| 组件 | 端口 | 用途 |
| --- | --- | --- |
| cadvisor | 8080（内部） | 采集每个容器 CPU/内存/网络/磁盘 |
| Prometheus | 9091 | 汇聚指标 + 告警规则（`monitoring/alerts.yml`） |
| Grafana | 3030 | 可视化大盘（预置「AI All In One — 容器监控」） |
| Alertmanager | 9093 | 告警去重/分组/路由/通知 |
### 22.2 查看大盘
1. 登录 Grafana（`ai_all_in_one_admin` / 统一密码，SSO 自动登录）；
2. 打开「AI All In One — 容器监控」面板，看各容器 CPU/内存/网络。
### 22.3 告警规则
预置规则（`monitoring/alerts.yml`）：容器宕机（critical）、容器内存 >90%（warning）、容器 CPU >80%（warning）。
> ⚠️ 告警误报坑：cadvisor 上报宿主机所有 cgroup（含 systemd），告警规则必须写 `{name!=""}` 过滤，内存告警还要加 `container_spec_memory_limit_bytes > 0`（否则 limit=0 除零恒触发）。
### 22.4 接入告警通知（企业 IM）
告警链路为 **Prometheus → Alertmanager → AI 管理中心（`/api/alert-webhook`）→ 企业 IM**。在 AI 管理中心的 **「系统运维 → 企业 IM 告警」** 菜单里配置（配置存 Redis，重启不丢）：
- **接收人**：可加多个。类型「钉钉/企微/飞书」= 群机器人（填 webhook 地址，发到群聊）；类型「钉钉企业应用（发个人）」（AppKey/AppSecret/AgentId/userid）或「企微企业应用（发个人）」（corpId/secret/agentid/userid）= 企业应用，发到个人。
- **发送规则**：总开关、最低告警级别（严重/警告/信息）、是否发送「触发 firing」/「恢复 resolved」通知。
- **发送历史**：记录每次发送（时间/接收人/类型/告警名/级别/结果），支持翻页、调整页大小、关键字检索、按类型/结果/级别分类筛选。
- 每个接收人有「测试」按钮可发测试消息，以及启用开关。
> ⚠️ 群机器人 webhook 只能发到**群聊**，不能发到个人。要发个人必须用「企业应用」类型（钉钉/企微），需在钉钉/企微管理后台开通内部应用并授予消息权限。钉钉群机器人还需设「自定义关键词」（如「AI 平台」「告警」）或「加签」，否则会被安全策略拦截。
> 📌 端口冲突说明：Prometheus 默认 9090 被 Keycloak 占用改 9091；Grafana 默认 3000/3001 被占改 3030。
> 📖 原厂文档：Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. LLM 可观测（Langfuse）

Langfuse**入口**：http://<服务器IP>:3010（SSO 自动登录，AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`）。
### 23.1 组件
| 组件 | 用途 |
| --- | --- |
| langfuse | Web UI + 追踪展示（3010） |
| langfuse-worker | 异步事件处理 |
| langfuse-postgres | 元数据存储 |
| langfuse-clickhouse | 事件/追踪数据存储 |
| langfuse-minio | S3 附件/媒体存储 |
| langfuse-redis | 队列 |
LiteLLM 通过 `success_callback: ["langfuse"]` 自动上报（`.env` 的 `LANGFUSE_*`）。
### 23.2 查看追踪
1. 登录 Langfuse → 选组织 `AI All In One` / 项目 `AI Platform`；
2. Traces 列表看每次调用，点进去看提示词/响应/模型/延迟/token/成本；
3. 用 Session 关联多轮对话。
### 23.3 排错
- ⚠️ 关键坑：
      
        必须设 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web 和 worker 都设），否则旧 SDK 上报 `trace-create` 失败看不到数据；
- SSO 登录看不到数据：SSO 账号（AD 邮箱）与初始化账号不同，Langfuse 会自动新建一个不属于任何组织的账号。修复（把 SSO 用户加进组织）：
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<company-domain>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 原厂文档：Langfuse 官方文档 https://langfuse.com/docs · 自托管 https://langfuse.com/self-hosting

## 24. 统一日志（Loki）

**入口**：AI 管理中心「📜 统一日志」页（最方便），或 Loki http://<服务器IP>:3110。
### 24.1 组件
| 组件 | 端口 | 用途 |
| --- | --- | --- |
| Loki | 3110 | 日志存储与查询（单机、本地文件系统） |
| Promtail | —（内部） | 经 docker.sock 发现容器、采集 json 日志推给 Loki |
### 24.2 查询日志
1. AI 管理中心 → 统一日志；
2. 选容器（下拉）→ 填关键字 → 选时间范围 → 查询；
3. 后端 `/api/logs/query` 用 LogQL 查 Loki。
### 24.3 LogQL 速查
```
{container="new-api"} |= "error"              # 某容器含 error 的行
{container=~".+"} |~ "(?i)error|exception"      # 所有容器匹配
{service="litellm"} |= "EMAIL"                  # 按服务查
```
> 📌 Loki 的 label 是 `container / project / service`，**没有 `job`**。查询用 `{container=~".+"}` 而非 `{job="docker"}`。
> ⚠️ 关键坑（Docker Desktop 挂载）：Promtail 需挂载 `/var/run/docker.sock` 和 `/var/lib/docker/containers`（WSL2 下指向 Docker Desktop VM 内部，正好是日志所在）；别用宿主机 Windows 的 `C:\...\containers` 路径。Loki 单机用 `store: tsdb` + filesystem。
> 📖 原厂文档：Loki 官方文档 https://grafana.com/docs/loki/latest/

## 25. PII 脱敏（Presidio）

### 25.1 两层脱敏
| 层 | 能力 |
| --- | --- |
| LiteLLM 内置正则（`litellm_content_filter`） | 手机号、身份证、银行卡、邮箱、统一社会信用代码、护照、IPv4 等，命中即替换 `[xxx_REDACTED]`；敏感词黑名单命中即 BLOCK 拒绝 |
| Microsoft Presidio | 更细粒度实体（英文人名、邮箱等），`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 内置正则规则
| 规则 | 正则 | 类型 |
| --- | --- | --- |
| 中国手机号 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身份证号 | `\b\d{17}[\dXx]\b` | cn_id |
| 银行卡号 | `\b\d{16,19}\b` | bank_card |
| 邮箱 | prebuilt `email` | email |
| 统一社会信用代码 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 护照号 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
敏感词黑名单在 `litellm-config.yaml` 的 `blocked_words` 按公司实际增删（`内部机密`、`商业机密` 等）。
### 25.3 启用 Presidio（当前暂注释）
新版 LiteLLM guardrail API 变更，Presidio 段当前注释。启用要点：
- guardrails 加 `default_on: true` 才全局生效；
- 端点环境变量 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` 必须填 base URL（LiteLLM 自动拼 `/analyze`、`/anonymize`，带路径会变 `/analyze/analyze` 404）。
> ⚠️ 镜像约 965MB，国内拉取很慢（实测约 1 小时），拉不动可先用内置正则（已覆盖中文核心 PII）。
### 25.4 验证
发含手机号/邮箱的请求 → 模型回复中原始值被替换为 `[REDACTED]`；发含「内部机密」的请求 → 直接返回 `Content blocked`。
> 📖 原厂文档：Microsoft Presidio https://microsoft.github.io/presidio/ · 源码 https://github.com/microsoft/presidio

## 26. MailHog 邮件接收器

**入口**：http://<服务器IP>:8025（Web 收件箱，SMTP 1025 仅内部）。
### 26.1 为什么需要它
Ghost 5 后台是免密登录：输入邮箱后 Ghost 发一封带 6 位验证码的邮件。内网没有 SMTP 时邮件发不出去，登录就报 `Failed to send email`。MailHog 当「邮件出口」接住这些邮件。
### 26.2 Ghost 侧配置
```
# docker-compose.yml 里 Ghost 的环境变量
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 查看邮件
1. 浏览器打开 `http://<服务器IP>:8025`；
2. 收件箱里看到 Ghost 发的验证码/通知邮件。
### 26.4 Ghost 免登录（AI 管理中心自动登录）
Ghost 的 6 位验证码本质是 **TOTP**（`TOTP(admin_session_secret + userId)`，6 位/60 秒/HMAC-SHA1）。AI 管理中心能本地算出验证码，点「Ghost 后台 → 打开」自动完成：密码登录 → 本地算码 → 验证会话 → 写 cookie → 进后台，全程无感、免翻 MailHog。
> ⚠️ 就算自己算码，Ghost 仍会真发邮件，所以 MailHog 必须保留，否则登录报 `Failed to send email`。
> 📖 原厂文档：MailHog 源码仓库 https://github.com/mailhog/MailHog

**第三部分 · 运维篇**

## 27. 备份与恢复

**入口**：AI 管理中心「💾 备份与恢复」页，或命令行 `scripts/backup.ps1` / `restore.ps1`。每日 02:00 计划任务自动备份，保留 7 天。
### 27.1 备份项
| 备份项 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 文件复制 |
| Keycloak | **realm export（JSON）** |
| 配置文件 | 文件复制 |
### 27.2 手动备份
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 定时备份（计划任务）
已注册计划任务 `AI-Platform-Backup`（每天 02:00）。未自动注册可手动建：任务计划程序 → 新建 → 程序 `powershell.exe`，参数 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`，触发器每天 02:00。
> 📌 备份默认在 C 盘，建议定期把 `C:\AIAllInOne\backups\` 同步到另一块盘或对象存储做异地容灾。
### 27.4 恢复
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
脚本要求输入 `yes` 确认（加 `-Force` 跳过，仅脚本/CI 用）。也可在 AI 管理中心「备份与恢复」页点某次备份的「恢复」一键恢复。
### 27.5 关键坑（演练已验证）
- ⚠️
      
        Keycloak 必须用 **realm export/import（JSON）**，pg_dump 还原会丢 default role 关联导致起不来；
- SQLite 还原后属主是 root，需 chown 到对应 uid（grafana=472、gitea=1000），否则报 readonly；
- pg_dump 带 `--clean --if-exists` 避免还原冲突；
- 旧版 backup.ps1 用 `Copy-Item` 批量复制时点号文件 `.env` 导致整批静默失败，已改逐文件 `-LiteralPath`；
- AI 管理中心备份用 base64 中转 + tar-fs 保证二进制安全（docker exec 的 stdout 走 utf8 会损坏 SQLite .db）。

## 28. 健康检查与开机自检

**脚本**：`C:\AIAllInOne\windows\scripts\health-check.ps1`，输出 `health_check_<时间戳>.log`。覆盖 41 个容器（25 Windows 核心 + 16 Dify），凭据从 `.env` 读，不硬编码密码。
### 28.1 检查范围（9 个阶段）
| 阶段 | 检查项 |
| --- | --- |
| Stage 1 | Docker Daemon 是否运行（等待就绪，适配开机自检） |
| Stage 2 | 41 个容器状态（Up/Exited/Restarting） |
| Stage 3 | 10 个 HTTP 端点响应 |
| Stage 4 | LiteLLM readiness + 模型注册、Dify API、数据库/Redis/Sandbox 健康 |
| Stage 5 | LLM 全链路（NewAPI → LiteLLM → DeepSeek 真实请求） |
| Stage 6 | AD 账号认证链路 + NewAPI 管理员登录 |
| Stage 7 | MCP Gateway + Skill 功能 |
| Stage 8 | DeepChat/Dify 登录前置条件 |
| Stage 9 | 磁盘空间 |
### 28.2 手动执行
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ 输出末尾 `ALL CLEAR` 且 `Fail: 0` 表示全部正常。
### 28.3 开机自启（计划任务）
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟等 Docker + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 注意：脚本用 `127.0.0.1` 不用 localhost；LiteLLM 内部健康用 `/health/readiness`（无需认证）；`docker-init_permissions-1` Exited(0) 正常；Update Server 返回 403 正常（无默认 index.html）；exit code 0=通过、1=有失败。

## 29. 故障排查手册

### 29.1 通用排查三步
1. **看容器状态**：`docker ps -a` 找 Exited/Restarting；
2. **看日志**：`docker logs <容器名> --tail 30`；
3. **看健康检查**：跑 `health-check.ps1` 定位失败阶段。
### 29.2 症状速查表
| 症状 | 根因 | 解决 |
| --- | --- | --- |
| localhost 打不开任何产品 | WSL2 IPv6 `::1` 兼容问题 | 改用内网 IP 或 127.0.0.1 |
| Ghost 一直 Restarting，报 ECONNREFUSED :3306 | 卷内残留 MySQL config | 环境变量强制 SQLite（第 4 章） |
| Dify 4 容器启动即崩 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 改成 50（第 5 章） |
| NewAPI 渠道测试报 No connected db | 渠道密钥填了示例值 | 填 `LITELLM_MASTER_KEY` 实际值 |
| NewAPI OIDC 报 invalid_grant / Incorrect redirect_uri | 服务器地址是 localhost | 设内网地址（第 7 章） |
| NewAPI 登录 429 | 关键接口限流 | 清 redis rateLimit:* 或改 .env |
| Dify 建应用反复连 ws://localhost | WebSocket 地址未改 | NEXT_PUBLIC_SOCKET_URL 设内网 IP |
| Dify 点登录没反应 | 密码需 base64 / 未登录 401 正常 | 脚本先 base64；浏览器重试 |
| Gitea 报 readonly database | gitea.db 被 root 属主 | 删 root 属主的 db 重建 |
| Gitea 仓库链接是 localhost | ROOT_URL 未改 | 设内网地址 |
| SSO 登录报 unknown_error | AD 端口转发失效（iphlpsvc） | 检查 iphlpsvc + Hyper-V 网络 |
| Keycloak 看不到域用户 | Search scope = One Level | 改 Subtree |
| Langfuse 看不到数据 | V4_WRITE_MODE 或 SSO 账号未入组织 | 设 dual；SQL 加组织（第 23 章） |
| DeepChat 模型连接超时 | 客户端走了挂掉的系统代理 | 设为不使用代理/直连 |
| Loki 查不到日志 | 用了 job 标签 | 用 `{container=~".+"}` |
| Presidio 404 /analyze/analyze | 端点带了路径 | 只填 base URL |
| 改 server.js 后新接口 404 | up -d 不重读 volume 变化 | docker restart admin-portal |
### 29.3 常用命令
```
docker ps -a                                        # 所有容器状态
docker logs <容器> --tail 50                         # 看日志
docker compose up -d <服务>                          # 重建某服务
docker compose restart <服务>                        # 重启某服务（不重读 .env）
docker system df                                     # Docker 磁盘占用
C:\AIAllInOne\windows\scripts\health-check.ps1       # 一键体检
```

**附录**

## 附. 原厂文档索引

### 全部产品原厂文档
| 产品 | 官方文档地址 |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Keycloak 服务器管理 | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| NewAPI 官网 | https://www.newapi.ai |
| NewAPI 源码 | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify 自托管 | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Ghost 管理后台 | https://ghost.org/docs/admin/ |
| Gitea（中文） | https://docs.gitea.com/zh-cn |
| Gitea 管理 | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| DeepChat 源码 | https://github.com/ThinkInAIXYZ/deepchat |
| MCP 协议 | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse 自托管 | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Presidio 源码 | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ 每章末尾也都带了对应产品的原厂文档地址，方便按章查阅。

