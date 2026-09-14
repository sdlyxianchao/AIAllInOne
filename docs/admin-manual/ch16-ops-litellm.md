# Chapter 16: LiteLLM Day-to-Day Administration

*Part 2 · Administration*

> PII redaction proxy: model list, redaction rules, caching, Langfuse reporting.

[← Chapter 15: NewAPI Day-to-Day Administration](ch15-ops-newapi.md) · [📖 Index](index.md) · [Chapter 17: Dify Day-to-Day Administration →](ch17-ops-dify.md)

---

**Entry**: admin console `http://<server-IP>:4001/ui` (web UI); API `http://<server-IP>:4001` (use `/v1/models` for debugging). Configuration is in `litellm-config.yaml`.

## 16.0 Log in to the Admin Console

The LiteLLM `/ui` console uses the **unified account** (username `ai_all_in_one_admin`, password in `credentials.html`), controlled by `UI_USERNAME` / `UI_PASSWORD` in `.env`.

> 📌 You can also enable **Keycloak SSO auto-login**: set `LITELLM_UI_*` in `.env` (`GENERIC_CLIENT_ID/SECRET` + Keycloak auth/token/userinfo endpoints + `AUTO_REDIRECT_UI_LOGIN_TO_SSO=true`), and create a Keycloak OIDC Client `litellm` (redirect `<server-IP>:4001/sso/callback`) with a claim that returns `litellm_role=proxy_admin`. After that, visiting `/ui` auto-redirects to Keycloak for passwordless login.

## 16.1 Model List Maintenance

Edit `model_list` in `litellm-config.yaml` to add/remove models and their API Keys. Steps to add a new provider:

1. In `.env`, uncomment `# OPENAI_API_KEY=` and fill in the Key;

2. In `litellm-config.yaml`, uncomment the corresponding model block;

3. `docker compose up -d litellm`.

## 16.2 Response Caching

Redis exact-match caching, shared across users for identical requests. Adjust `cache_params.ttl` (default 3600 seconds). Disable: set `cache: false` then restart.

## 16.3 Langfuse Reporting

Automatically reports every call via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` in `.env`.

## 16.4 Restart and Troubleshooting

```
docker compose restart litellm          # restart after changing config
docker logs litellm --tail 50           # view logs
```

> ⚠️ Key pitfalls: ① guardrails need `default_on: true` to take effect globally; ② PII redaction (Presidio) mode is `["pre_call", "post_call"]` — PII is redacted before the model call and automatically restored in the response (users no longer see `<PERSON>` placeholders); ③ use the stable version `v1.95.1` (`main-latest` has bugs).

> 📖 Vendor docs:LiteLLM official docs https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Chapter 15: NewAPI Day-to-Day Administration](ch15-ops-newapi.md) · [📖 Index](index.md) · [Chapter 17: Dify Day-to-Day Administration →](ch17-ops-dify.md)
