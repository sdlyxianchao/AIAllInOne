# Langfuse — Textbook (M14 · LLM Observability)

> Port 3010 (container `langfuse`). LLM observability platform.

## 1. Login & use

Admin Center → "LLM Observability" → opens `http://<SERVER_IP>:3010/auth/sso-initiate?provider=KEYCLOAK` (IdP-initiated SSO, auto-login). Account `ai_all_in_one_admin@<company-domain>`. Headless init already created org **AI All In One** and project **AI Platform**.

**Key pages**: Traces (call chains, per-trace prompt/response/model/latency/tokens/cost), Metrics/Cost (by model/date/user), Prompt Management & Datasets (advanced).

## 2. Two critical pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| `LANGFUSE_MIGRATION_V4_WRITE_MODE` | old clients (LiteLLM SDK) fail trace-create; no traces at all | set `events_only` → **`dual`** (both web and worker), restart |
| SSO org binding | SSO login creates a fresh account in no org; no data visible | unified email prevents it; otherwise join org: `INSERT INTO organization_memberships ... SELECT ... WHERE email='ai_all_in_one_admin@<company-domain>'` |

## 3. FAQ

| Issue | Fix |
|---|---|
| no traces at all | V4_WRITE_MODE=dual? LANGFUSE_* three vars? `docker logs litellm` report errors? |
| SSO login no data | email mismatch → unify / manual org join |
| /auth/sso-initiate returns 200 shell | normal — redirect happens in browser (curl won't see 302) |
| disk growth | clickhouse/minio volumes; plan capacity; clean/archive |
