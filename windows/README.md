# AI AllInOne — Windows 内网 AI 平台（v2）

一套在 **Windows 11 + Docker Desktop** 上自托管的「企业内网 AI 全家桶」：统一认证（Keycloak SSO）、LLM 路由（NewAPI + LiteLLM）、PII 脱敏（Presidio）、应用平台（Dify）、企业门户（Ghost）、源码与 CI/CD（Gitea）、客户端分发（DSH Desktop + 更新服务器）、MCP/Skill 管理、统一管理门户（AI 管理中心）、监控告警（Prometheus + Grafana + cadvisor）、LLM 可观测（Langfuse）、统一日志（Loki + Promtail）、备份与恢复。

> 本目录是**脱敏的完整可复现副本**。手动部署 + 把本目录喂给 AI 自动配置，两种方式都能搭出同一套环境。真实密钥一律不提交（见 `.env.example`）。

---

## 一、组件清单（14 个）

| 层 | 组件 | 端口 | 说明 |
|---|---|---|---|
| 认证 | Keycloak | 9090 | SSO / OIDC / LDAP(AD) |
| LLM 路由 | NewAPI | 3000 | 渠道/密钥/额度/审计 |
| 脱敏 | LiteLLM + Presidio | 4001 / 5001 / 5002 | PII 脱敏代理 |
| 应用 | Dify | 80/443 | Web AI 应用平台 |
| 门户 | Ghost | 8090 | 企业门户 |
| 源码 | Gitea + Runner | 3002 / 2222 | Git + Actions CI/CD |
| 分发 | Update Server | 8091 | DSH Desktop 安装包托管 |
| 管理 | AI 管理中心 | 10086 | 统一管理员门户 |
| 网关 | MCP Gateway | 3100 | Skill / MCP 管理 |
| 监控 | Prometheus / Grafana / cadvisor | 9091 / 3030 / 8080 | 容器资源 + 告警 |
| 可观测 | Langfuse (×6 容器) | 3010 | LLM 调用追踪 |
| 日志 | Loki + Promtail | 3110 | 统一日志聚合 |

完整架构图、端口表、数据流见 **`windows-deploy-guide-v2.html`**（第 1 章）。

---

## 二、目录结构

```
windows-github-v2/
├── docker-compose.yml          # 主 compose（含 Keycloak/NewAPI/LiteLLM/Ghost/Gitea/
│                               #   MCP/管理门户/监控/Langfuse/Loki/Promtail/Presidio）
├── .env.example                # 环境变量模板（复制为 .env 填真实值）
├── litellm-config.yaml         # LiteLLM 模型 + PII guardrails
├── gitea-runner-config.yaml    # Gitea Actions Runner
├── admin-portal/               # AI 管理中心（server.js + public/index.html）
├── mcp-gateway/                # MCP Gateway（gateway.js + skills 市场）
├── monitoring/                 # prometheus.yml / alerts.yml / loki.yml / promtail.yml / grafana/
├── dify/                       # Dify 官方 compose 部署目录（docker-compose.yaml + .env.example + nginx/ssrf_proxy 等）
├── assets/                     # 品牌图片（logo.png + Ghost 封面 ghost-cover.jpg）
├── dsh-updates/           # DSH Desktop 更新包（version.txt + assets/ 下载页图片）
├── bootstrap.ps1               # ★ 一键部署脚本（替换 IP→生成密钥→起 compose→Keycloak→NewAPI→备份任务）
├── scripts/                    # backup.ps1 / restore.ps1 / keycloak-realm-init.ps1 / health-check.ps1 / setup-hyperv-dc-network.ps1
├── credentials.html.example    # 账号密码清单模板（脱敏）
├── windows-ad-integration.html # AD/LDAP 企业身份源集成指南
├── windows-checklist.html      # 部署进度清单
└── windows-deploy-guide-v2.html # 完整部署文档（含步骤、配图、踩坑）
```

> `dify/` 是 Dify 官方 compose 部署目录（已脱敏 `.env.example`），运行时数据 `volumes/` 与证书未打包。

---

## 三、一键部署（bootstrap.ps1，推荐）

在**新电脑**装好 Docker Desktop、配好网络、建好 AD 后，一条命令即可：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 `
  -ServerIp "192.168.1.100" `
  -AdminPassword "你的统一管理员密码" `
  -DeepSeekKey "sk-xxx" `
  -LdapBindDn "CN=ai all in one admin,CN=Users,DC=chxia,DC=lab" `
  -LdapBindPassword "AD密码" `
  -LdapUsersDn "CN=Users,DC=chxia,DC=lab"
```

自动完成：① 替换所有 `192.168.31.117` → 你的 IP　② 生成随机密钥写 `.env`　③ 起全部 compose　④ 调 `scripts\keycloak-realm-init.ps1` 一键建 realm + 4 个 OIDC client + `ai-platform-admin` 角色 + LDAP 联邦，并回填 3 个 client secret　⑤ 配 NewAPI 渠道（best-effort，失败给手动指引）　⑥ 注册备份计划任务 + 打印 Langfuse SSO 修复命令。

> 脚本参数说明见 `bootstrap.ps1` 顶部注释；跳过某步用 `-SkipDify` / `-SkipKeycloak` / `-SkipNewApi`。

## 四、手动部署（核心步骤）

完整分步见 `windows-deploy-guide-v2.html`，这里给出主线：

```powershell
# 1. 前置：Docker Desktop 开启，创建网络
docker network create ai-platform

# 2. 准备环境变量
copy .env.example .env
#    编辑 .env，填 Keycloak 密码、DeepSeek Key、各随机 secret（见文档 3.1）

# 3. 起核心服务
docker compose up -d

# 4. 初始化 Keycloak realm（替代手工点 UI）
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\keycloak-realm-init.ps1 -AdminPassword "..." -ServerIp "..." -LdapBindDn "..." -LdapBindPassword "..." -LdapUsersDn "..."

# 5. 按文档第 5 章部署 Dify（cd dify; copy .env.example .env; docker compose up -d）
# 6. 按文档第 6 章完成 NewAPI 渠道 / Ghost / Gitea 首次向导
# 7. 注册备份计划任务（每日 02:00）
```

**必须替换的占位**：把 `192.168.31.117`（示例服务器 IP）替换成你的内网 IP，出现位置：
- `docker-compose.yml`：Keycloak `KC_HOSTNAME`、Ghost `url`、Gitea `DOMAIN/ROOT_URL`、各 `URL` 环境变量
- `admin-portal/server.js` 与 `admin-portal/public/index.html` 里的产品入口 URL
- `dify/.env.example` 的 `CHANGE_ME_IP`（bootstrap 会自动替换）

---

## 五、喂给 AI 自动配置（推荐）

把**本目录 + `windows-deploy-guide-v2.html`**一起提供给 AI，并告知：
1. 你的服务器内网 IP（替换 `192.168.31.117`）
2. 你有的大模型 API Key（DeepSeek/OpenAI/Claude…）
3. 是否对接公司 AD/LDAP 域控（可选）

AI 会按以下「配方」自动完成（这些是非显而易见的步骤，已全部在文档中记录）：

### 4.1 Keycloak
- 创建 realm `enterprise-ai`；管理员账号 `ai_all_in_one_admin`
- 创建 OIDC Client：`AI-all-in-one-admin-portal`（confidential，secret 写入 `.env` 的 `KEYCLOAK_CLIENT_SECRET`）
- 创建 Realm Role：`ai-platform-admin` 并分配给管理员
- （可选）配 LDAP federation 指向 AD 域控

### 4.2 SSO 客户端（Grafana / Langfuse）
- Grafana：client `grafana`，redirect `http://<IP>:3030/login/generic_oauth`，secret → `GRAFANA_OAUTH_CLIENT_SECRET`；`GF_AUTH_OAUTH_AUTO_LOGIN=true` 实现自动登录
- Langfuse：client `langfuse`，redirect `http://<IP>:3010/api/auth/callback/keycloak`，secret → `LANGFUSE_KEYCLOAK_CLIENT_SECRET`；AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`

### 4.3 Langfuse headless 初始化 + SSO 账号绑定（关键坑）
- compose 已配 `LANGFUSE_INIT_*`（自动建组织 `ai-all-in-one` / 项目 `ai-platform`）
- **SSO 登录看不到数据**：用 Keycloak SSO 登录会新建独立账号且不属于任何组织。修复：
  ```sql
  docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
  "INSERT INTO organization_memberships (id, org_id, user_id, role) \
   SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users \
   WHERE email='ai_all_in_one_admin@<你的域>' ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
  ```
- 需 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（已配）

### 4.4 PII 脱敏
- LiteLLM 内置正则（中文手机号/身份证/银行卡/邮箱/信用代码/护照/IP）+ Presidio（英文人名/邮箱/信用卡）
- 环境变量 `PRESIDIO_*_API_BASE` 填 **base URL**（不要带 `/analyze`）

### 4.5 备份 / 恢复
- 计划任务 `AI-Platform-Backup` 每日 02:00 跑 `scripts/backup.ps1`
- 恢复：`scripts/restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_XXX`，或 AI 管理中心「备份与恢复」页

### 4.6 统一日志
- Loki（`monitoring/loki.yml`）+ Promtail（`monitoring/promtail.yml`），无需额外配置，compose 起即采集

### 4.7 监控告警
- Prometheus 抓 cadvisor + 自身；`alerts.yml` 已加 `{name!=""}` 过滤避免对 systemd cgroup 误报

---

## 五、安全说明

- 本目录**不含任何真实密钥**；所有真实值在运行环境 `.env` 中
- 内网 HTTP 明文（未上 HTTPS/证书），若需加密见文档第 13 章
- 详细踩坑记录见 `windows-deploy-guide-v2.html` 各章「⚠️ 关键坑」
