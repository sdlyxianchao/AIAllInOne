# 第12章：AI 管理中心

*第一部分 · 部署篇*

> 统一管理员门户：Keycloak 鉴权、左侧菜单内嵌全部产品、Dashboard 集群状态。

[← 第11章：MCP Gateway 与 Skill 市场](ch11-mcp.md) · [📖 目录](index.md) · [第13章：互连验证清单 →](ch13-interconnect.md)

---

> 📌 定位：不是 Docker 管理平台（1Panel/Portainer），而是面向管理员的统一后台——Keycloak 鉴权 + 左侧菜单链接全部产品 + Dashboard 集群状态 + 统一管理员账号。

## 12.1 核心能力

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

## 12.2 初始化 Global Administrator

```
# .env 中配置
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=见账号密码清单
ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>
```

启动后自动在 Keycloak 建 `ai_all_in_one_admin` 用户（已有则跳过），分配 `ai-platform-admin` Realm Role。核心理念：**一个 Global Admin 账号管理所有平台**。

## 12.3 Docker Compose 部署

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

## 12.4 Keycloak 客户端配置

1. Keycloak → enterprise-ai → Clients → Create；

2. Client ID `AI-all-in-one-admin-portal`，Client authentication / Standard flow 都 On；

3. Valid Redirect URIs：`http://127.0.0.1:10086/*` 和 `http://<服务器IP>:10086/*`；

4. 复制 Client Secret → 填 `.env` 的 `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`；

5. 建 Realm Role `ai-platform-admin`，分配给 `ai_all_in_one_admin`。

> ⚠️ 部署/排错要点：
> - admin-portal 会话存 Redis（`admin-session-redis`），重启容器不再清空登录会话；
> - 首页 `/` 必须走 Keycloak 保护（`express.static(..., {index:false})` + 显式 `app.get('/', keycloak.protect())`），否则未登录直接渲染空看板；
> - 统计 Dify 用实际管理员邮箱（`ai_all_in_one_admin@<company-domain>`，须与 AD 全局管理员一致）；
> - **改 server.js 后必须 `docker restart admin-portal`**，不能用 `up -d`（volume 文件内容变化不会触发重建）。

## 12.5 验证

1. 打开 `http://<服务器IP>:10086` → 自动跳 Keycloak 登录（未登录不显示空看板）；

2. 用 `ai_all_in_one_admin` 登录 → 进总览仪表板；

3. Dashboard 显示 8 个产品指标 + 容器分组；

4. 点各产品先看统计、点「打开后台」才跳转；

5. 系统设置可切 9 种语言。

## 12.6 管理员分模块授权 + Keycloak 认证页管理（v0.91）

全局管理员可在 AI 管理中心直接管理其他管理员和 Keycloak：

- **管理员账号管理**：从 Keycloak 关联的 IdP 搜索已有账号（AD/LDAP 用户，无需新建、无需密码）→ 勾选模块 → 确定。系统分配 `admin:<产品>` Realm Role，并**真实开通到产品**（SSO 优先、API 兜底）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。撤销模块或删除管理员会**从产品删除该账号**。无 SSO 产品建号生成临时密码，🔑 图标可回看（仅全局管理员）。非管理员登录弹「你不是管理员」并退出。

- **Keycloak 认证页**：「全部同步 / 增量同步」按钮一键拉取 AD 属性变更；每行用户有「编辑」（跳 Keycloak 控制台）和「删除」；角色区块可新建/删除角色、查看成员。同步/删除/角色操作仅全局管理员。

> ⚠️ 注意：Keycloak 无「单用户同步」端点，增量同步会同步 AD 里所有有变更的账号；AD 联邦用户删除后下次全量同步或再次 SSO 登录会重新出现，彻底移除请在 AD 里禁用/删除该账号。

---

[← 第11章：MCP Gateway 与 Skill 市场](ch11-mcp.md) · [📖 目录](index.md) · [第13章：互连验证清单 →](ch13-interconnect.md)
