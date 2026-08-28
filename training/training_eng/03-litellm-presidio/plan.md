# LiteLLM + Presidio — Training Plan (M05, 3 h, D4 PM)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | Overview + config.yaml | lecture |
| 14:30-15:00 | Lab 1: add a model + restart + verify model list | lab |
| 15:00-15:40 | Lab 2: PII redaction + BLOCK verification | lab |
| 15:40-16:30 | Lab 3: semantic cache (3 prereqs + hit test) | lab |
| 16:30-17:00 | Langfuse reporting + troubleshooting | lecture+lab |

## 2. Lab Checklist

- [ ] Direct LiteLLM call OK (intranet IP + master key)
- [ ] Email/mobile redacted (S)
- [ ] `内部机密` BLOCKed (S)
- [ ] redis-stack + Ollama bge-m3 + REDIS_PASSWORD present
- [ ] 2nd similar request shows similarity header & faster (S)
- [ ] Langfuse trace visible

## 3. Homework

- Steps to add Claude model
- Read ch25-ops-pii.md → 3 data tiers usage
- Why local embedding (bge-m3) for semantic cache?

## 4. Failure Drills

- Wrong key → No connected db
- Missing default_on → no redaction
- Presidio env with /analyze → 404
- 127.0.0.1:4001 → use intranet IP
