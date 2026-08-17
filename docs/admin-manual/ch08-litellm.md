# Chapter 8: LiteLLM: Verification and Caching

*Part 1 · Deployment*

> Verify the LiteLLM proxy works and enable response caching to save tokens.

[← Chapter 7: NewAPI: Initialization, Channels, and OIDC](ch07-newapi.md) · [📖 Index](index.md) · [Chapter 9: Dify / Ghost / Gitea Configuration →](ch09-products.md)

---

> ⚠️ PII redaction (Presidio guardrail) is currently **temporarily disabled**: the new LiteLLM guardrail configuration format changed, so that section of `litellm-config.yaml` is commented out, and LiteLLM currently only proxies/forwards (no redaction). See Chapter 25 for how to enable it.

## 8.1 Verify LiteLLM Is Basically Working

```
curl -X POST http://<server-IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` is the LiteLLM admin key; use the actual value from `.env` (not the placeholder itself, otherwise you get 401). And you must use the intranet IP `<server-IP>:4001`, not `127.0.0.1:4001` (WSL2 port forwarding issue).

## 8.2 Response Caching (built-in, saves tokens)

LiteLLM already has Redis exact-match caching enabled: completely identical requests (model + messages + parameters) return the cache directly, shared across users, saving tokens.

```
# end of litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # dedicated cache Redis
    port: 6379
    ttl: 3600            # cache for 1 hour
```

> Verify: `curl http://<server-IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` returns `ping_response: true`; send the same request twice in a row and the second one drops to milliseconds. Disable caching: set `cache: false` then restart litellm.

## 8.3 Add More LLM Providers

1. In `.env`, uncomment `# OPENAI_API_KEY=` and fill in the Key;

2. In `litellm-config.yaml`, uncomment the corresponding model block;

3. `docker compose up -d litellm`.

> 📖 Vendor docs:LiteLLM official docs https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Chapter 7: NewAPI: Initialization, Channels, and OIDC](ch07-newapi.md) · [📖 Index](index.md) · [Chapter 9: Dify / Ghost / Gitea Configuration →](ch09-products.md)
