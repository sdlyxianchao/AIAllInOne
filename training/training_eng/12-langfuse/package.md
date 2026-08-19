# Langfuse — Training Package (M14 · LLM Observability)

## Outline & Textbook

**Positioning**: LLM observability platform (port 3010): trace every model call — prompt, response, model, latency, tokens, cost — for back-tracing and cost/quality analysis; also Prompt Management & evaluation.

**Data flow**: LiteLLM `success_callback: ["langfuse"]` auto-reports every call.

**Login & use**: Admin Center → "LLM Observability" → opens `http://<SERVER_IP>:3010/auth/sso-initiate?provider=KEYCLOAK` (IdP-initiated SSO, auto-login). Account `ai_all_in_one_admin@<company-domain>`. Headless init already created org **AI All In One** and project **AI Platform**. Key pages: Traces (call chains, per-trace prompt/response/model/latency/tokens/cost), Metrics/Cost (by model/date/user), Prompt Management & Datasets (advanced).

**Two critical pitfalls**:
| Pitfall | Symptom | Fix |
|---|---|---|
| `LANGFUSE_MIGRATION_V4_WRITE_MODE` | old clients (LiteLLM SDK) fail trace-create; no traces at all | set `events_only` → **`dual`** (both web and worker), restart |
| SSO org binding | SSO login creates a fresh account in no org; no data visible | unified email prevents it; otherwise join org: `INSERT INTO organization_memberships ... SELECT ... WHERE email='ai_all_in_one_admin@<company-domain>'` |

**FAQ**:
| Issue | Fix |
|---|---|
| no traces at all | V4_WRITE_MODE=dual? LANGFUSE_* three vars? `docker logs litellm` report errors? |
| SSO login no data | email mismatch → unify / manual org join |
| /auth/sso-initiate returns 200 shell | normal — redirect happens in browser (curl won't see 302) |
| disk growth | clickhouse/minio volumes; plan capacity; clean/archive |

**Platform docs**: `../../docs/admin-manual/ch23-ops-langfuse.md`. **Official**: langfuse.com/docs, self-hosting, videos.

## Training Plan (1.5 h, D8 PM)

| Time | Content | Method |
|---|---|---|
| 17:00-17:20 | architecture + flow + pitfalls | lecture |
| 17:20-17:50 | Lab: login via Admin Center → Traces → open one → filter | lab |

**Lab checklist**: auto-login OK (S); a real trace present (send a chat first); interpret model/latency/tokens/cost; cost view by model/date; V4_WRITE_MODE=dual confirmed.

## Exam

**Theory (5 pts × 4 = 20)**: 1. trace source → B LiteLLM success_callback; 2. no traces → check B V4_WRITE_MODE=dual; 3. SSO no data root cause → B email mismatch → new account not in org; 4. core data store → A ClickHouse.

**Hands-on (30)**: 1. open a trace & explain model/latency/tokens/cost (15); 2. locate & verify V4 write-mode config (15).

**Defense (10)**: "Boss asks: how much did models cost this month and where?" (Langfuse cost analysis / Admin Center cost report / NewAPI audit).

**Scorecard**: Theory(20) + Hands-on(30) + Defense(10).

## References
See `references.md` — Juejin 15-min intro, huggingface.tw full guide, CSDN ops guide, Bilibili integration video, official videos.
