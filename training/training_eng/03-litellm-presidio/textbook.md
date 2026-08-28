# LiteLLM + Presidio — Textbook (M05 · Security Gateway)

> In-platform: container `litellm` (internal 4000, host 4001), `presidio-analyzer`/`presidio-anonymizer`, `litellm-redis` (redis-stack-server).

## 1. What it is

Open-source LLM gateway — one OpenAI-compatible endpoint for 100+ models plus auth (master key), virtual keys, budgets, guardrails (redaction/content safety), caching, observability callbacks. In this platform only NewAPI calls it.

```
request: NewAPI → LiteLLM →(redact)→ external LLM
response: NewAPI ← LiteLLM ←(restore)→ external LLM
side: success_callback → Langfuse
```

## 2. litellm-config.yaml structure

- `model_list` (default: only `deepseek-chat`; enable OpenAI/Claude by uncommenting + adding .env keys)
- `litellm_settings` (cache, cache_params, success_callback langfuse)
- `general_settings` (master_key from `.env`)
- guardrails (commented out — v1.95.1's guardrail format changed; re-enable per official docs later)

⚠️ Stay on stable **v1.95.1** (main-latest has a known bug).

**Add a model**: uncomment .env key → uncomment yaml model block → `docker compose up -d litellm` → "fetch models" in NewAPI channel.

## 3. PII redaction

### Built-in content filter

`litellm_content_filter` (default, no external service): CN mobile `\b1[3-9]\d{9}\b`, CN ID `\b\d{17}[\dXx]\b`, bank card `\b\d{16,19}\b`, email, credit code, passport, IPv4 → replaced `[xxx_REDACTED]`. Sensitive-word blacklist (`内部机密`, `商业机密`…) → **BLOCK** request; edit `blocked_words`.

⚠️ Guardrails need `default_on: true` to apply globally.

### Presidio

Presidio analyzer/anonymizer for fine-grained entities (names, emails).

- ⚠️ Env vars must be **base URL** (`http://presidio-analyzer:3000`), not with `/analyze` (LiteLLM appends it → `/analyze/analyze` 404).
- ⚠️ Image ~965 MB, slow in CN; built-in regex covers core CN PII first.
- **PII auto-restoration**: current config uses `mode: ["pre_call", "post_call"]` — PII is redacted before the request and automatically restored in the response. Users no longer see `<PERSON>` placeholders; they receive the original information.

**Verify**: send email/mobile → `[REDACTED]` in reply; send `内部机密` → `Content blocked`.

## 4. Redis semantic cache (money saver)

`type: redis-semantic` — local `bge-m3` embeds requests, compares similarity (≥threshold) across users; hits cost `Key-Spend: 0.0`.

**Prereq 3 steps**:
1. `litellm-redis` image → `redis/redis-stack-server`
2. Host Ollama + `ollama pull bge-m3`; `.env` `OLLAMA_API_BASE=http://host.docker.internal:11434`
3. litellm env `REDIS_PASSWORD=${LITELLM_REDIS_PASSWORD:-}` (required even if empty)

**Config**: `similarity_threshold: 0.8` (0.9+ exact, 0.7–0.8 balanced, 0.6–0.7 aggressive), ttl 3600, embedding model bge-m3.

**Verify**: two similar-but-different-phrased requests → 2nd has `X-Litellm-Cache-Key` + `X-Litellm-Semantic-Similarity` (0.92), latency drops to <0.5 s.

Use for deterministic tasks (KB QA, temperature=0); real-time content: `no-cache` header; disable: `cache: false`.

## 5. Langfuse reporting

`.env` LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST + `success_callback: ["langfuse"]` → auto-report prompts/responses/latency/tokens/cost (see M14).

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `No connected db` | channel key ≠ real LITELLM_MASTER_KEY |
| model 404 | not enabled in model_list / not restarted / upstream key missing |
| guardrail not triggering | missing `default_on: true` |
| Presidio 404 `/analyze/analyze` | env var included /analyze; use base URL only |
| cache startup error Missing REDIS_PASSWORD | add REDIS_PASSWORD env |
| host :4001 unreachable | WSL2 port issue: use `<SERVER_IP>:4001`, not 127.0.0.1 |

## 7. Security

Every outbound call passes the redaction layer; keep the blacklist current; master key = admin, in .env only; data classification: public→OK, internal→redacted, confidential→never to external models.
