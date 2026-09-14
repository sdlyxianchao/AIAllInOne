# 第14章：Keycloak 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> 認證中樞：管使用者、角色、OIDC 客戶端、AD 聯邦、會話。

[← 第13章：互連驗證清單](ch13-interconnect.md) · [📖 目錄](index.md) · [第15章：NewAPI 日常管理 →](ch15-ops-newapi.md)

---

**入口**：`http://<伺服器IP>:9090` → Administration Console → 管理員登入。

> 📌 很多操作也可在 AI 管理中心 → Keycloak 認證頁完成（僅全域管理員）：LDAP 全量/增量同步、刪除使用者、角色管理（列表/新建/刪除/查看成員）。見第 12.6 章。

## 14.1 管理使用者

1. **新建使用者**：Users → Add user → 填使用者名稱 → Create；

2. **設密碼**：該使用者 Credentials 標籤 → 設密碼 → Temporary 關閉（否則首次登入強制改密）；

3. **重置密碼**：Users → 搜到使用者 → Credentials → Set password；

4. **禁用/啟用**：使用者詳情頂部 Enabled 開關（禁用後該使用者所有 SSO 立即失效）；

5. **刪除**：使用者詳情 → Delete。

## 14.2 角色與權限

- **Realm Role**：Realm roles → Create role 建角色（如 `ai-platform-admin`）；

- **分配角色**：使用者 → Role mapping → Assign role；

- **組**：Groups → 建組（`ai-admin` / `ai-user`）→ 組內加使用者，角色賦給組，使用者隨組繼承權限。

> ✅ 管理權限統一由 `ai-platform-admin` 角色控制，各產品接 SSO 時用這個角色識別管理員。

## 14.3 OIDC 客戶端（新產品接 SSO）

1. Clients → Create client → Client ID 填產品名（如 `newapi` / `grafana` / `langfuse`）；

2. Client authentication：On（否則沒有 Credentials 標籤）、Standard flow：On；

3. Valid redirect URIs / Web origins 填產品的回撥地址（內網 IP + 127.0.0.1 兩個都加）；

4. 儲存 → Credentials 標籤複製 Client secret 給產品側。

## 14.4 AD / LDAP 聯邦維護

- **改網域控制站/密碼**：User Federation → 點 LDAP Provider → 改 Connection URL / Bind credentials → Save；

- **手動同步**：Synchronize all users；

- **組對映**：Mappers 標籤 → group-ldap-mapper → Groups DN 設 AD 組所在容器，把 AD 組對映成 Keycloak 角色。

## 14.5 會話管理

- **檢視活躍會話**：Users → 某使用者 → Sessions；

- **強制下線**：Sessions → Sign out all；

- **全域會話/令牌配置**：Realm settings → Sessions / Tokens 標籤調超時。

> ⚠️ 關鍵坑回顧：① bind DN 的 CN 帶空格原樣保留；② Username LDAP attribute 用 `sAMAccountName` 不是 `cn`；③ Search scope 選 Subtree；④ SSO 報 `unknown_error` 多為宿主機 iphlpsvc 未執行導致 AD 埠轉發失效；⑤ AD 網域控制站 VM 未開機時，LDAP 聯合的帳號登入會報 `LDAP Connection refused`。

> 📖 原廠文件：Keycloak 官方文件 https://www.keycloak.org/documentation · 伺服器管理指南 https://www.keycloak.org/server/

---

[← 第13章：互連驗證清單](ch13-interconnect.md) · [📖 目錄](index.md) · [第15章：NewAPI 日常管理 →](ch15-ops-newapi.md)
