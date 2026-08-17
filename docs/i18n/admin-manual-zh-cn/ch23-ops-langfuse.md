# 第23章：LLM 可观测（Langfuse）

*第二部分 · 管理篇（各产品日常操作）*

> 追踪每次模型调用的提示词、响应、延迟、token、成本。

[← 第22章：监控告警管理](ch22-ops-monitoring.md) · [📖 目录](index.md) · [第24章：统一日志（Loki） →](ch24-ops-loki.md)

---

**入口**：`http://<服务器IP>:3010`（SSO 自动登录，AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`）。

## 23.1 组件

| 组件 | 用途 |
| --- | --- |
| langfuse | Web UI + 追踪展示（3010） |
| langfuse-worker | 异步事件处理 |
| langfuse-postgres | 元数据存储 |
| langfuse-clickhouse | 事件/追踪数据存储 |
| langfuse-minio | S3 附件/媒体存储 |
| langfuse-redis | 队列 |

LiteLLM 通过 `success_callback: ["langfuse"]` 自动上报（`.env` 的 `LANGFUSE_*`）。

## 23.2 查看追踪

1. 登录 Langfuse → 选组织 `AI All In One` / 项目 `AI Platform`；

2. Traces 列表看每次调用，点进去看提示词/响应/模型/延迟/token/成本；

3. 用 Session 关联多轮对话。

## 23.3 排错

> ⚠️ 关键坑：
> - 必须设 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web 和 worker 都设），否则旧 SDK 上报 `trace-create` 失败看不到数据；
> - SSO 登录看不到数据：SSO 账号（AD 邮箱）与初始化账号不同，Langfuse 会自动新建一个不属于任何组织的账号。修复（把 SSO 用户加进组织）：

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<company-domain>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 原厂文档：Langfuse 官方文档 https://langfuse.com/docs · 自托管 https://langfuse.com/self-hosting

---

[← 第22章：监控告警管理](ch22-ops-monitoring.md) · [📖 目录](index.md) · [第24章：统一日志（Loki） →](ch24-ops-loki.md)
