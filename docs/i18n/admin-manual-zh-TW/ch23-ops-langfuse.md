# 第23章：LLM 可觀測（Langfuse）

*第二部分 · 管理篇（各產品日常操作）*

> 追蹤每次模型呼叫的提示詞、響應、延遲、token、成本。

[← 第22章：監控告警管理](ch22-ops-monitoring.md) · [📖 目錄](index.md) · [第24章：統一日誌（Loki） →](ch24-ops-loki.md)

---

**入口**：`http://<伺服器IP>:3010`（SSO 自動登入，AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`）。

## 23.1 元件

| 元件 | 用途 |
| --- | --- |
| langfuse | Web UI + 追蹤展示（3010） |
| langfuse-worker | 非同步事件處理 |
| langfuse-postgres | 後設資料儲存 |
| langfuse-clickhouse | 事件/追蹤資料儲存 |
| langfuse-minio | S3 附件/媒體儲存 |
| langfuse-redis | 佇列 |

LiteLLM 透過 `success_callback: ["langfuse"]` 自動上報（`.env` 的 `LANGFUSE_*`）。

## 23.2 檢視追蹤

1. 登入 Langfuse → 選組織 `AI All In One` / 專案 `AI Platform`；

2. Traces 列表看每次呼叫，點進去看提示詞/響應/模型/延遲/token/成本；

3. 用 Session 關聯多輪對話。

## 23.3 疑難排解

> ⚠️ 關鍵坑：
> - 必須設 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web 和 worker 都設），否則舊 SDK 上報 `trace-create` 失敗看不到資料；
> - SSO 登入看不到資料：SSO 帳號（AD 郵箱）與初始化帳號不同，Langfuse 會自動新建一個不屬於任何組織的帳號。修復（把 SSO 使用者加進組織）：

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<公司網域>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 原廠文件：Langfuse 官方文件 https://langfuse.com/docs · 自託管 https://langfuse.com/self-hosting

---

[← 第22章：監控告警管理](ch22-ops-monitoring.md) · [📖 目錄](index.md) · [第24章：統一日誌（Loki） →](ch24-ops-loki.md)
