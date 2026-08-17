# Chapter 23: LLM Observability (Langfuse)

*Part 2 · Administration*

> Trace the prompt, response, latency, tokens, and cost of every model call.

[← Chapter 22: Monitoring and Alerting Administration](ch22-ops-monitoring.md) · [📖 Index](index.md) · [Chapter 24: Unified Logging (Loki) →](ch24-ops-loki.md)

---

**Entry**: `http://<server-IP>:3010` (SSO auto-login; the AI Admin Center entry points to `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 Components

| Component | Purpose |
| --- | --- |
| langfuse | Web UI + trace display (3010) |
| langfuse-worker | asynchronous event processing |
| langfuse-postgres | metadata storage |
| langfuse-clickhouse | event/trace data storage |
| langfuse-minio | S3 attachment/media storage |
| langfuse-redis | queue |

LiteLLM auto-reports via `success_callback: ["langfuse"]` (`LANGFUSE_*` in `.env`).

## 23.2 View Traces

1. Log in to Langfuse → select organization `AI All In One` / project `AI Platform`;

2. In the Traces list view each call; click in to see prompt/response/model/latency/token/cost;

3. Use Session to correlate multi-turn conversations.

## 23.3 Troubleshooting

> ⚠️ Key pitfalls:
> - Must set `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (on both web and worker), otherwise the old SDK's `trace-create` reporting fails and no data shows;
> - SSO login shows no data: the SSO account (AD email) differs from the initialization account, so Langfuse auto-creates a new account that belongs to no organization. Fix (add the SSO user to the organization):

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<company-domain>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 Vendor docs:Langfuse official docs https://langfuse.com/docs · self-hosting https://langfuse.com/self-hosting

---

[← Chapter 22: Monitoring and Alerting Administration](ch22-ops-monitoring.md) · [📖 Index](index.md) · [Chapter 24: Unified Logging (Loki) →](ch24-ops-loki.md)
