# 第7章：NewAPI：初始化、渠道与 OIDC

*第一部分 · 部署篇*

> 完成初始安装向导，配置指向 LiteLLM 的渠道、下发 API Key，接入 Keycloak OIDC。

[← 第6章：Keycloak：Realm、用户与 AD](ch06-keycloak.md) · [📖 目录](index.md) · [第8章：LiteLLM：验证与缓存 →](ch08-litellm.md)

---

## 7.1 初始安装向导（首次访问）

NewAPI 首次启动弹 4 步系统设置向导：

1. **数据库检查**：点「验证数据库连接」，预期绿色勾。

2. **管理员账户**：用户名 `ai_all_in_one_admin`、邮箱 `ai_all_in_one_admin@<公司域名>`、密码统一管理员密码。

> 📌 为什么先建本地管理员：此时 OIDC 还没配，NewAPI 不认识 Keycloak，必须先有本地账号「进门」完成配置，再去系统设置打开 OIDC。

3. **使用模式**：选「个人使用」（公司内部：员工能注册、用量分开看、无充值计费模块）。

4. **确认初始化**：创建数据库表 → 用管理员登录。

## 7.2 配置 LLM 渠道（指向 LiteLLM）

1. **渠道** → 添加新渠道 → 类型 `OpenAI`；

2. Base URL 填 `http://litellm:4000`（容器名，走 Docker 网络，**不是 localhost**）；

3. 密钥填 `.env` 的 `LITELLM_MASTER_KEY` 实际值（不是示例值，否则报 `No connected db`）；

4. 模型填 `deepseek-chat`（示例，按实际配置）；

5. 保存 → 点「测试」验证连通。

配了多个 provider 就重复添加：Claude 类型 `Anthropic Claude`、DeepSeek 类型 `OpenAI`，Base URL 都填 `http://litellm:4000`。

## 7.3 创建 API 密钥

为 Dify 和 DSH Desktop 各建一把，分开统计用量：

1. 左侧 **API 密钥** → 新建；

2. 名称 `dify-key` → 保存 → 复制 `sk-xxx`（填到 Dify 模型供应商）；

3. 再建 `dsh-key` → 复制 `sk-xxx`（分发给 DSH Desktop 用户）。

## 7.4 允许普通用户自助申请 Key

员工登录后默认能在「API 密钥」页自己新建 Key。要能真正调用模型，需满足两点（已在 `.env` 预设）：

1. **有额度**：`DEFAULT_QUOTA=100`（新用户送 100 美元额度）；

2. **有 token**：`GENERATE_DEFAULT_TOKEN=true`（注册即生成初始 token）。

> ⚠️ 只对「新注册」用户生效：已登录过的用户（如 `aitest1`）不会自动补发，需管理员在「用户」页手动设额度。

## 7.5 接入 Keycloak OIDC（让 AD 用户直接登录）

### ① 在 Keycloak 建 NewAPI OIDC Client

1. enterprise-ai Realm → **Clients** → Create client；

2. Client ID `newapi`，类型 OpenID Connect；

3. **Client authentication：On**（必开，否则没 Credentials 标签）、Standard flow / Direct access grants：On；

4. Valid redirect URIs：`http://<服务器IP>:3000/*` 和 `http://127.0.0.1:3000/*`；

5. 保存 → Credentials 标签 → 复制 Client secret。

### ② 在 NewAPI 开启 OIDC

NewAPI 后台 → **系统设置 → 身份验证 → 自定义 OAuth → 添加 OAuth 提供商**，填：

| 分组 | 配置项 | 值 |
| --- | --- | --- |
| 快速设置 | 预设模板 / API 地址 | `Keycloak` / `http://127.0.0.1:9090` |
| 基本信息 | 提供商名 / 标识符 | `Keycloak` / `keycloak` |
| 凭证 | Client ID / Secret | `newapi` / Keycloak 复制的值 |
| 端点 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 字段映射 | 用户 ID / 用户名 / 邮箱 | `sub` / `preferred_username` / `email` |

点「自动发现」填好端点后，**把令牌端点、用户信息端点改成 `host.docker.internal:9090`**（NewAPI 容器内部调 Keycloak 用），授权端点保持 `<服务器IP>:9090`（浏览器跳转用）。作用域 `openid profile email`。

> ⚠️ 两个必改，否则登录失败：
> - **保存后回 Keycloak 补回调 URL**：把 `http://<服务器IP>:3000/oauth/keycloak` 和 `http://127.0.0.1:3000/oauth/keycloak` 加进 Valid redirect URIs；
> - **NewAPI「服务器地址」设为内网地址**：系统设置 → 通用设置 → 服务器地址改 `http://<服务器IP>:3000`（默认 localhost 会导致换 token 报 `invalid_grant - Incorrect redirect_uri`）。改后本机也要用内网 IP 访问 NewAPI。

改数据库的方法：

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<服务器IP>:3000') ON DUPLICATE KEY UPDATE value='http://<服务器IP>:3000';"
docker compose restart new-api
```

> ⚠️ 排错：登录返回 **429 Too Many Requests**——NewAPI 关键接口限流（默认 20 次/20 分钟）触发。临时解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；永久方案已在 `.env` 预设 `CRITICAL_RATE_LIMIT_ENABLE=false` 等四组变量。

> 📖 原厂文档：NewAPI 官方文档 https://docs.newapi.pro · 官网 https://www.newapi.ai · 开源仓库 https://github.com/QuantumNous/new-api

---

[← 第6章：Keycloak：Realm、用户与 AD](ch06-keycloak.md) · [📖 目录](index.md) · [第8章：LiteLLM：验证与缓存 →](ch08-litellm.md)
