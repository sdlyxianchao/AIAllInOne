# 第6章：Keycloak：Realm、用户与 AD

*第一部分 · 部署篇*

> 创建 Realm、建本地账号、或从 Active Directory 导入域账号——所有产品 SSO 的基础。

[← 第5章：Dify 独立部署](ch05-dify-deploy.md) · [📖 目录](index.md) · [第7章：NewAPI：初始化、渠道与 OIDC →](ch07-newapi.md)

---

> 📌 访问：宿主机 `http://127.0.0.1:9090`，内网 `http://<服务器IP>:9090`。数据存命名卷 `keycloak-data`，容器重建不丢。凭据见 `.env.windows` 的 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`。

## 6.1 创建 Realm

1. 浏览器打开 `http://127.0.0.1:9090` → Administration Console → 管理员登录；

2. 左上角下拉 → **Create Realm** → Realm name 填 `enterprise-ai` → Create。

## 6.2 方式 A：本地创建账号（无 AD 的小团队/测试）

1. **Groups** → Create Group → `ai-admin`；再建 `ai-user`；

2. **Users** → Add user → 用户名 → Create；

3. Credentials 标签 → 设密码 → Temporary 关闭；

4. Groups 标签 → 加入 `ai-user` 组。

## 6.3 方式 B：从 Active Directory 导入账号（推荐）

公司已有 Windows AD 域控时，员工用域账号登录，无需在 Keycloak 手动建号。前置：Docker 容器到域控网络已互通（网络拓扑、Hyper-V Internal Switch、端口转发见《Keycloak AD 集成指南》 `windows-ad-integration.html`）。

> 📌 需要的 AD 账号：服务账号 `svc_keycloak`（密码永不过期，用于 LDAP 绑定）+ 2 个测试域用户（验证同步）。

### 创建 LDAP 用户联合

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

> ⚠️ 常见填错：
> - Bind DN 用 **LDAP 格式**（`CN=svc_keycloak,CN=Users,DC=xxx`），不是 ~~DOMAIN\用户~~；
> - Username LDAP attribute = `sAMAccountName`，不是 `cn`；
> - Search scope = **Subtree**；
> - **CN 带空格原样保留**：若显示名带空格（如 `ai all in one admin` 中间是空格），Bind DN 必须写 `CN=ai all in one admin,...`，写成下划线会连不上。

### 验证 AD 登录

1. 无痕窗口打开 `http://127.0.0.1:9090/realms/enterprise-ai/account`；

2. 用域账号登录（用户名 `aitest1` 或 `aitest1@<company-domain>` UPN 均可）；

3. 成功跳转 Account Console 即通过。

## 6.4 其它企业身份源（附录 N 摘要）

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

---

[← 第5章：Dify 独立部署](ch05-dify-deploy.md) · [📖 目录](index.md) · [第7章：NewAPI：初始化、渠道与 OIDC →](ch07-newapi.md)
