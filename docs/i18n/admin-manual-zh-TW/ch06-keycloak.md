# 第6章：Keycloak：Realm、使用者與 AD

*第一部分 · 部署篇*

> 建立 Realm、建本地帳號、或從 Active Directory 匯入網域帳號——所有產品 SSO 的基礎。

[← 第5章：Dify 獨立部署](ch05-dify-deploy.md) · [📖 目錄](index.md) · [第7章：NewAPI：初始化、渠道與 OIDC →](ch07-newapi.md)

---

> 📌 訪問：宿主機 `http://127.0.0.1:9090`，內網 `http://<伺服器IP>:9090`。資料存命名卷 `keycloak-data`，容器重建不丟。憑據見 `.env.windows` 的 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`。

## 6.1 建立 Realm

1. 瀏覽器開啟 `http://127.0.0.1:9090` → Administration Console → 管理員登入；

2. 左上角下拉 → **Create Realm** → Realm name 填 `enterprise-ai` → Create。

## 6.2 方式 A：本地建立帳號（無 AD 的小團隊/測試）

1. **Groups** → Create Group → `ai-admin`；再建 `ai-user`；

2. **Users** → Add user → 使用者名稱 → Create；

3. Credentials 標籤 → 設密碼 → Temporary 關閉；

4. Groups 標籤 → 加入 `ai-user` 組。

## 6.3 方式 B：從 Active Directory 匯入帳號（推薦）

公司已有 Windows AD 網域控制站時，員工用網域帳號登入，無需在 Keycloak 手動建號。前置：Docker 容器到網域控制站網路已互通（網路拓撲、Hyper-V Internal Switch、埠轉發見《Keycloak AD 整合指南》 `windows-ad-integration.html`）。

> 📌 需要的 AD 帳號：服務帳號 `svc_keycloak`（密碼永不過期，用於 LDAP 繫結）+ 2 個測試網域使用者（驗證同步）。

### 建立 LDAP 使用者聯合

1. enterprise-ai Realm → 左側 **User Federation** → Add provider → **ldap**；

2. 按下表填寫。

| 配置項 | 值 | 說明 |
| --- | --- | --- |
| Vendor | **Active Directory** | 選 AD，不要選 Other（否則 objectGUID 不識別） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 經埠轉發；生產填 `ldap://dc.公司網域:389` |
| Enable StartTLS | **Off** | LDAP 389 或 LDAPS 636 |
| Bind type | **simple** | 使用者名稱+密碼認證 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必須 LDAP DN 格式**，不用 ~~DOMAIN\使用者~~ |
| Bind credentials | `svc_keycloak 密碼` | 見 `.env.windows` |
| Edit mode | **READ_ONLY** | 只讀，不寫回 AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 有子 OU 時改 `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **不要填 cn** |
| RDN LDAP attribute | `cn` | 條目命名屬性 |
| UUID LDAP attribute | `objectGUID` | AD 不可變唯一標識 |
| User object classes | `person, organizationalPerson, user` | 逗號分隔 |
| Search scope | **Subtree** | **不要選 One Level**（否則子 OU 搜不到） |
| Pagination | **On** | 使用者多時分批拉取 |
| Referral | **ignore** | 避免跟到不存在的網域控制站 |
| Import users | **On** | 全量同步匯入 |
| Sync Registrations | **On** | 首登即時同步 |

Save → **Synchronize all users** → 等待同步完成。

> ⚠️ 常見填錯：
> - Bind DN 用 **LDAP 格式**（`CN=svc_keycloak,CN=Users,DC=xxx`），不是 ~~DOMAIN\使用者~~；
> - Username LDAP attribute = `sAMAccountName`，不是 `cn`；
> - Search scope = **Subtree**；
> - **CN 帶空格原樣保留**：若顯示名帶空格（如 `ai all in one admin` 中間是空格），Bind DN 必須寫 `CN=ai all in one admin,...`，寫成下劃線會連不上。

### 驗證 AD 登入

1. 無痕視窗開啟 `http://127.0.0.1:9090/realms/enterprise-ai/account`；

2. 用網域帳號登入（使用者名稱 `aitest1` 或 `aitest1@<公司網域>` UPN 均可）；

3. 成功跳轉 Account Console 即透過。

## 6.4 其它企業身分來源（附錄 N 摘要）

Keycloak 還支援多種身分來源，全部接在同一個 `enterprise-ai` Realm 下：

| 身分來源 | 接入方式 | 要點 |
| --- | --- | --- |
| Microsoft Entra ID（原 Azure AD） | Identity Providers → OpenID Connect v1.0 | Azure 註冊應用拿 client id/secret，redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google（內建） | 可用 Mapper 加 `hd=網域` 限制域 |
| GitHub | Identity Providers → GitHub（內建） | OAuth App 回撥 `/broker/github/endpoint` |
| 通用 LDAP（OpenLDAP/FreeIPA） | User Federation → ldap | Vendor 選 Other，Username attribute 用 `uid` |
| 通用 SAML 2.0（Okta/ADFS） | Identity Providers → SAML v2.0 | 貼 IdP 後設資料 URL 自動填充 |

> ✅ 多身分來源共存：可在 Authentication → Browser flow 加 Identity Provider Redirector，按郵箱網域自動選 IdP（`@公司.com`→AD，`@公司.onmicrosoft.com`→Entra ID）。

> 📖 原廠文件：Keycloak 官方文件 https://www.keycloak.org/documentation · 伺服器管理指南 https://www.keycloak.org/server/ · LDAP 聯合 https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← 第5章：Dify 獨立部署](ch05-dify-deploy.md) · [📖 目錄](index.md) · [第7章：NewAPI：初始化、渠道與 OIDC →](ch07-newapi.md)
