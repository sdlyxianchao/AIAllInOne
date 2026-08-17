# 第14章：Keycloak 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> 认证中枢：管用户、角色、OIDC 客户端、AD 联邦、会话。

[← 第13章：互连验证清单](ch13-interconnect.md) · [📖 目录](index.md) · [第15章：NewAPI 日常管理 →](ch15-ops-newapi.md)

---

**入口**：`http://<服务器IP>:9090` → Administration Console → 管理员登录。

> 📌 很多操作也可在 AI 管理中心 → Keycloak 认证页完成（仅全局管理员）：LDAP 全量/增量同步、删除用户、角色管理（列表/新建/删除/查看成员）。见第 12.6 章。

## 14.1 管理用户

1. **新建用户**：Users → Add user → 填用户名 → Create；

2. **设密码**：该用户 Credentials 标签 → 设密码 → Temporary 关闭（否则首次登录强制改密）；

3. **重置密码**：Users → 搜到用户 → Credentials → Set password；

4. **禁用/启用**：用户详情顶部 Enabled 开关（禁用后该用户所有 SSO 立即失效）；

5. **删除**：用户详情 → Delete。

## 14.2 角色与权限

- **Realm Role**：Realm roles → Create role 建角色（如 `ai-platform-admin`）；也可在 AI 管理中心 → Keycloak 认证页新建/删除角色、查看成员；

- **分配角色**：用户 → Role mapping → Assign role；

- **组**：Groups → 建组（`ai-admin` / `ai-user`）→ 组内加用户，角色赋给组，用户随组继承权限。

> ✅ 管理权限统一由 `ai-platform-admin` 角色控制，各产品接 SSO 时用这个角色识别管理员。

## 14.3 OIDC 客户端（新产品接 SSO）

1. Clients → Create client → Client ID 填产品名（如 `newapi` / `grafana` / `langfuse`）；

2. Client authentication：On（否则没有 Credentials 标签）、Standard flow：On；

3. Valid redirect URIs / Web origins 填产品的回调地址（内网 IP + 127.0.0.1 两个都加）；

4. 保存 → Credentials 标签复制 Client secret 给产品侧。

## 14.4 AD / LDAP 联邦维护

- **改域控/密码**：User Federation → 点 LDAP Provider → 改 Connection URL / Bind credentials → Save；

- **手动同步**：Synchronize all users；或在 AI 管理中心 → Keycloak 认证页点「全部同步 / 增量同步」（增量只同步 AD 里有变更的账号）。

- **组映射**：Mappers 标签 → group-ldap-mapper → Groups DN 设 AD 组所在容器，把 AD 组映射成 Keycloak 角色。

## 14.5 会话管理

- **查看活跃会话**：Users → 某用户 → Sessions；

- **强制下线**：Sessions → Sign out all；

- **全局会话/令牌配置**：Realm settings → Sessions / Tokens 标签调超时。

> ⚠️ 关键坑回顾：① bind DN 的 CN 带空格原样保留；② Username LDAP attribute 用 `sAMAccountName` 不是 `cn`；③ Search scope 选 Subtree；④ SSO 报 `unknown_error` 多为宿主机 iphlpsvc 未运行导致 AD 端口转发失效；⑤ AD 域控 VM 未开机时，LDAP 联合的账号登录会报 `LDAP Connection refused`。

> 📖 原厂文档：Keycloak 官方文档 https://www.keycloak.org/documentation · 服务器管理指南 https://www.keycloak.org/server/

---

[← 第13章：互连验证清单](ch13-interconnect.md) · [📖 目录](index.md) · [第15章：NewAPI 日常管理 →](ch15-ops-newapi.md)
