# NewAPI — Textbook (M04 · LLM Routing Gateway)

> In-platform: port `3000` (container `new-api`), MySQL `new-api-db`, Redis `new-api-redis`.

## 1. What it is

NewAPI is an LLM gateway/AI asset management system forked from OneAPI: unifies OpenAI/Claude/Gemini/DeepSeek into an OpenAI-compatible API with channels, token distribution, quota/billing, rate limits, and stats.

```
DSH Desktop / Dify → NewAPI(:3000) → LiteLLM(:4000, PII redaction) → external LLM
```

## 2. Conventions

- URL: `http://<SERVER_IP>:3000`
- Admin: `ai_all_in_one_admin`
- Mode: **Personal use**
- Channel Base URL: `http://litellm:4000`
- Channel key = `LITELLM_MASTER_KEY` from `.env`
- Env vars: `DEFAULT_QUOTA=100`, `GENERATE_DEFAULT_TOKEN=true`, rate-limit vars

## 3. Init wizard (4 steps)

1. Verify DB connection
2. Admin account (`ai_all_in_one_admin` + unified email/password)
3. **Personal use**
4. Confirm & init → login

## 4. Channels & tokens

- **Channel**: type `OpenAI`, name `LiteLLM-OpenAI`, Base URL **`http://litellm:4000`** (container name, not localhost), key = real `LITELLM_MASTER_KEY` value, models `gpt-4o, gpt-4o-mini` (+`deepseek-chat`); Claude → type `Anthropic Claude`, same base; test → reply = chain OK.
- **Tokens**: create `dify-key` (server-side) and `dsh-key` (client) — separate for usage stats.
- **Self-service**: `DEFAULT_QUOTA` + `GENERATE_DEFAULT_TOKEN` apply **only to newly registered users**; existing users need manual quota adjustment.

## 5. Keycloak OIDC (focus)

1. **Keycloak side** (M03 done): client `newapi`.
2. **NewAPI**: Settings → Authentication → Custom OAuth → preset `Keycloak`; API address `http://127.0.0.1:9090`; Client ID `newapi` + secret; Well-Known `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` → **Auto-discover** → ⚠️ **fix**: keep authorize endpoint `<SERVER_IP>:9090` (browser), change **token & userinfo endpoints to `host.docker.internal:9090`** (container→host). Scopes `openid profile email`; mapping `sub`/`preferred_username`/`name`/`email`.
3. ⚠️ **Server address** (Settings → General) must be `http://<SERVER_IP>:3000` — the token exchange builds redirect_uri from it; mismatch → invalid_grant. After setting it, access via the intranet IP (not 127.0.0.1).
4. ⚠️ **Promote SSO admin**: OIDC users are role=1; run the MySQL UPDATE role=100 + restart.
5. **Verify**: Keycloak button appears; AD account logs in.

## 6. Usage/cost/audit

Dashboard (requests/tokens/channel load); logs (per-call detail); cost report & audit via AI Admin Center NewAPI page (1 USD = 500000 quota); groups & per-department quotas (chain: AD group → Keycloak role → NewAPI group → model access).

## 7. Rate limits (.env)

`GLOBAL_WEB_RATE_LIMIT`, `GLOBAL_API_RATE_LIMIT`, `CRITICAL_RATE_LIMIT_ENABLE`, `CRITICAL_RATE_LIMIT` (test: 999999 / false). Clear Redis keys to unblock.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Channel test fails | wrong LITELLM key (use real .env value), upstream key missing, check `docker logs litellm` |
| `No connected db` | channel key is not the real master key |
| invalid_grant | server address not intranet / redirect mismatch |
| SSO 403 | role not promoted |
| 429 | rate limit; clear Redis or adjust .env + recreate |
| employee quota 0 | not eligible for DEFAULT_QUOTA; adjust manually |

## 9. Security

Upstream keys only in channel config; tokens per purpose with quota/expiry; disable departed users; HTTPS in production.
