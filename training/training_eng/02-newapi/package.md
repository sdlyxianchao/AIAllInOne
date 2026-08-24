# NewAPI — Training Package (M04 · LLM Routing Gateway)

## Outline

**Positioning**: LLM routing & API gateway. All AI apps (Dify, DSH Desktop) call external LLMs through it — channel management, API tokens, quotas/billing, rate limiting, audit logs. It is the first hop of the platform's "LLM chain".

**Objectives**: initialize wizard; configure channels (→ LiteLLM); create/separate API keys; Keycloak OIDC login (host.docker.internal fix, server address, role promotion); manage quota/groups/rate limits; read dashboard/logs/cost/audit; troubleshoot (channel test fail, 429, OIDC 403, invalid token).

**Prereq**: M02, M03. OpenAI API format basics.

**Content (3 h, D4 AM)**: overview & modes (0.5) → init wizard (0.5) → channels + test (0.5) → tokens + self-service quota (0.5) → OIDC (0.5) → usage/cost/groups/rate limit + troubleshooting (0.5).

**Pass**: independent init→channel→token→OIDC; can explain why `http://litellm:4000` and `host.docker.internal`; can answer "how do I get an API key / why is my quota 0".

---

## Textbook

In-platform: port `3000` (container `new-api`), MySQL `new-api-db`, Redis `new-api-redis`.

**1. What it is**: NewAPI is an LLM gateway/AI asset management system forked from OneAPI: unifies OpenAI/Claude/Gemini/DeepSeek into an OpenAI-compatible API with channels, token distribution, quota/billing, rate limits, and stats.

```
DSH Desktop / Dify → NewAPI(:3000) → LiteLLM(:4000, PII redaction) → external LLM
```

**2. Conventions**: URL `http://<SERVER_IP>:3000`; admin `ai_all_in_one_admin`; mode **Personal use**; channel Base URL `http://litellm:4000`; channel key = `LITELLM_MASTER_KEY` from `.env`; env: `DEFAULT_QUOTA=100`, `GENERATE_DEFAULT_TOKEN=true`, rate-limit vars.

**3. Init wizard (4 steps)**: ① verify DB connection → ② admin account (`ai_all_in_one_admin` + unified email/password) → ③ **Personal use** → ④ confirm & init → login.

**4. Channels & tokens**
- Channel: type `OpenAI`, name `LiteLLM-OpenAI`, Base URL **`http://litellm:4000`** (container name, not localhost), key = real `LITELLM_MASTER_KEY` value, models `gpt-4o, gpt-4o-mini` (+`deepseek-chat`); Claude → type `Anthropic Claude`, same base; test → reply = chain OK.
- Tokens: create `dify-key` (server-side) and `dsh-key` (client) — separate for usage stats.
- Self-service: `DEFAULT_QUOTA` + `GENERATE_DEFAULT_TOKEN` apply **only to newly registered users**; existing users need manual quota adjustment.

**5. Keycloak OIDC (focus)**
1. Keycloak side (M03 done): client `newapi`.
2. NewAPI: Settings → Authentication → Custom OAuth → preset `Keycloak`; API address `http://127.0.0.1:9090`; Client ID `newapi` + secret; Well-Known `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` → **Auto-discover** → ⚠️ **fix**: keep authorize endpoint `<SERVER_IP>:9090` (browser), change **token & userinfo endpoints to `host.docker.internal:9090`** (container→host). Scopes `openid profile email`; mapping `sub`/`preferred_username`/`name`/`email`.
3. ⚠️ **Server address** (Settings → General) must be `http://<SERVER_IP>:3000` — the token exchange builds redirect_uri from it; mismatch → invalid_grant. After setting it, access via the intranet IP (not 127.0.0.1).
4. ⚠️ **Promote SSO admin**: OIDC users are role=1; run the MySQL UPDATE role=100 + restart.
5. Verify: Keycloak button appears; AD account logs in.

**6. Usage/cost/audit**: Dashboard (requests/tokens/channel load); logs (per-call detail); cost report & audit via AI Admin Center NewAPI page (1 USD = 500000 quota); groups & per-department quotas (chain: AD group → Keycloak role → NewAPI group → model access).

**7. Rate limits (.env)**: `GLOBAL_WEB_RATE_LIMIT`, `GLOBAL_API_RATE_LIMIT`, `CRITICAL_RATE_LIMIT_ENABLE`, `CRITICAL_RATE_LIMIT` (test: 999999 / false). Clear Redis keys to unblock.

**8. Troubleshooting**:
| Symptom | Fix |
|---|---|
| Channel test fails | wrong LITELLM key (use real .env value), upstream key missing, check `docker logs litellm` |
| `No connected db` | channel key is not the real master key |
| invalid_grant | server address not intranet / redirect mismatch |
| SSO 403 | role not promoted |
| 429 | rate limit; clear Redis or adjust .env + recreate |
| employee quota 0 | not eligible for DEFAULT_QUOTA; adjust manually |

**9. Security**: upstream keys only in channel config; tokens per purpose with quota/expiry; disable departed users; HTTPS in production.

---

## Training Plan (3 h, D4 AM)

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + modes + init wizard | lecture |
| 09:30-10:00 | Lab 1: init wizard | lab |
| 10:00-10:40 | Lab 2: channel (LiteLLM) + test + dify-key/dsh-key | lab |
| 10:40-11:30 | Lab 3: OIDC (discover + endpoint fix + server address + promote) | lab |
| 11:30-12:00 | Usage/cost/groups + troubleshooting | lecture+lab |

**Lab checklist**: init wizard done; channel added & tested (S); two tokens created; OIDC configured with token/userinfo fixed to host.docker.internal; server address = intranet; AD user logs in via Keycloak button (S); role promoted (S); test user has quota 100; dashboard shows real requests.

**Homework**: curl `POST http://<SERVER_IP>:3000/v1/chat/completions` with your token; screenshot channels/tokens/logs; read ch15-ops-newapi.md → 5 ops points.

**Failure drills**: Base URL localhost → fail; token endpoint not fixed → token exchange fail; server address default → invalid_grant; SSO before promote → 403.

**Handoff**: dify-key feeds M06; dsh-key feeds M09; interconnect checks #1/#3.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3 pts × 6)**: 1. Channel Base URL → B `http://litellm:4000`; 2. Channel key → B LITELLM_MASTER_KEY value; 3. Mode → C Personal use; 4. Token/userinfo endpoints → C host.docker.internal:9090; 5. 403 after SSO → B promote role=100; 6. Employee quota 0 → B only new users get DEFAULT_QUOTA; existing adjusted manually.

**True/False (3 pts × 4)**: 7. Separate dify-key/dsh-key for stats. T; 8. Authorize endpoint should also be host.docker.internal. F; 9. After setting server address to intranet, debug via intranet IP too. T; 10. Rate-limit vars are in .env not Settings. T.

**Hands-on (50)**: 1. Add channel→LiteLLM and test OK (20); 2. Full OIDC config + AD login (20); 3. Two purpose-separated tokens verified via curl (10).

**Defense (20)**: "Quota insufficient — how to fix?"; "invalid_grant — where do you look?"; "Restrict a department to cheap models?".
