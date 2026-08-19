# LiteLLM + Presidio — Training Package (M05 · Security Gateway)

## Outline

**Positioning**: LLM proxy gateway — unified 100+ model API, PII redaction, Redis semantic cache, cost stats, Langfuse reporting. Presidio (Microsoft) provides advanced PII detection. Together they guarantee "sensitive data is redacted before it leaves the intranet".

**Objectives**: explain chain position (NewAPI → LiteLLM → external → restore); read/write `litellm-config.yaml` (model_list / litellm_settings / general_settings); understand dual redaction (built-in regex filter + Presidio); configure & verify Redis semantic cache (bge-m3); configure Langfuse reporting; troubleshoot (keys, model 404, guardrail not global, Presidio endpoint 404).

**Prereq**: M02, M04. OpenAI-compatible API basics.

**Content (3 h, D4 PM)**: overview (0.5) → config.yaml (0.5) → PII redaction + verify (0.5) → semantic cache (0.75) → Langfuse reporting (0.25) → troubleshooting (0.5).

**Pass**: add a model & restart; redaction & BLOCK verified; cache hit verified; can explain `default_on: true`.

---

## Textbook

In-platform: container `litellm` (internal 4000, host 4001), `presidio-analyzer`/`presidio-anonymizer`, `litellm-redis` (redis-stack-server).

**1. What it is**: open-source LLM gateway — one OpenAI-compatible endpoint for 100+ models plus auth (master key), virtual keys, budgets, guardrails (redaction/content safety), caching, observability callbacks. In this platform only NewAPI calls it.

```
request: NewAPI → LiteLLM →(redact)→ external LLM
response: NewAPI ← LiteLLM ←(restore)→ external LLM
side: success_callback → Langfuse
```

**2. litellm-config.yaml structure**: `model_list` (default: only `deepseek-chat`; enable OpenAI/Claude by uncommenting + adding .env keys); `litellm_settings` (cache, cache_params, success_callback langfuse); `general_settings` (master_key from `.env`); guardrails (commented out — v1.95.1's guardrail format changed; re-enable per official docs later). ⚠️ Stay on stable **v1.95.1** (main-latest has a known bug).

Add a model: uncomment .env key → uncomment yaml model block → `docker compose up -d litellm` → "fetch models" in NewAPI channel.

**3. PII redaction**
- Built-in content filter `litellm_content_filter` (default, no external service): CN mobile `\b1[3-9]\d{9}\b`, CN ID `\b\d{17}[\dXx]\b`, bank card `\b\d{16,19}\b`, email, credit code, passport, IPv4 → replaced `[xxx_REDACTED]`. Sensitive-word blacklist (`内部机密`, `商业机密`…) → **BLOCK** request; edit `blocked_words`.
- ⚠️ guardrails need `default_on: true` to apply globally.
- Presidio analyzer/anonymizer for fine-grained entities (names, emails).
  - ⚠️ env vars must be **base URL** (`http://presidio-analyzer:3000`), not with `/analyze` (LiteLLM appends it → `/analyze/analyze` 404).
  - ⚠️ image ~965 MB, slow in CN; built-in regex covers core CN PII first.
- Verify: send email/mobile → `[REDACTED]` in reply; send `内部机密` → `Content blocked`.

**4. Redis semantic cache (money saver)**: `type: redis-semantic` — local `bge-m3` embeds requests, compares similarity (≥threshold) across users; hits cost `Key-Spend: 0.0`.
- Prereq 3 steps: ① `litellm-redis` image → `redis/redis-stack-server`; ② host Ollama + `ollama pull bge-m3`; `.env` `OLLAMA_API_BASE=http://host.docker.internal:11434`; ③ litellm env `REDIS_PASSWORD=${LITELLM_REDIS_PASSWORD:-}` (required even if empty).
- Config: `similarity_threshold: 0.8` (0.9+ exact, 0.7–0.8 balanced, 0.6–0.7 aggressive), ttl 3600, embedding model bge-m3.
- Verify: two similar-but-different-phrased requests → 2nd has `X-Litellm-Cache-Key` + `X-Litellm-Semantic-Similarity` (0.92), latency drops to <0.5 s.
- Use for deterministic tasks (KB QA, temperature=0); real-time content: `no-cache` header; disable: `cache: false`.

**5. Langfuse reporting**: `.env` LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST + `success_callback: ["langfuse"]` → auto-report prompts/responses/latency/tokens/cost (see M14).

**6. Troubleshooting**:
| Symptom | Fix |
|---|---|
| `No connected db` | channel key ≠ real LITELLM_MASTER_KEY |
| model 404 | not enabled in model_list / not restarted / upstream key missing |
| guardrail not triggering | missing `default_on: true` |
| Presidio 404 `/analyze/analyze` | env var included /analyze; use base URL only |
| cache startup error Missing REDIS_PASSWORD | add REDIS_PASSWORD env |
| host :4001 unreachable | WSL2 port issue: use `<SERVER_IP>:4001`, not 127.0.0.1 |

**7. Security**: every outbound call passes the redaction layer; keep the blacklist current; master key = admin, in .env only; data classification: public→OK, internal→redacted, confidential→never to external models.

---

## Training Plan (3 h, D4 PM)

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | Overview + config.yaml | lecture |
| 14:30-15:00 | Lab 1: add a model + restart + verify model list | lab |
| 15:00-15:40 | Lab 2: PII redaction + BLOCK verification | lab |
| 15:40-16:30 | Lab 3: semantic cache (3 prereqs + hit test) | lab |
| 16:30-17:00 | Langfuse reporting + troubleshooting | lecture+lab |

**Lab checklist**: direct LiteLLM call OK (intranet IP + master key); email/mobile redacted (S); `内部机密` BLOCKed (S); redis-stack + Ollama bge-m3 + REDIS_PASSWORD present; 2nd similar request shows similarity header & faster (S); Langfuse trace visible.

**Homework**: steps to add Claude model; read ch25-ops-pii.md → 3 data tiers usage; why local embedding (bge-m3) for semantic cache?

**Failure drills**: wrong key → No connected db; missing default_on → no redaction; Presidio env with /analyze → 404; 127.0.0.1:4001 → use intranet IP.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. Caller of LiteLLM → C NewAPI; 2. Host access → B intranet IP:4001; 3. Blacklist hit → B BLOCK; 4. Global guardrail → A default_on:true; 5. Presidio env → B base URL only; 6. Cache hit signature → B similarity header + near-zero spend.

**True/False (3×4)**: 7. bge-m3 embedding is local & free. T; 8. Platform runs main-latest. F; 9. Redaction happens before leaving intranet. T; 10. Semantic cache suits real-time personalization. F.

**Hands-on (50)**: 1. Direct call + redaction & BLOCK (20); 2. Semantic cache hit (20); 3. Add a model end-to-end (10).

**Defense (20)**: "Redact mobile numbers — how, and debug when it fails?"; "What does the semantic cache save, and when not to use it?"; "Three data tiers — how to use external models for each?"
