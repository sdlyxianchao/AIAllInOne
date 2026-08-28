# LiteLLM + Presidio — Training Outline (M05 · Security Gateway)

## 1. Positioning

LLM proxy gateway — unified 100+ model API, PII redaction, Redis semantic cache, cost stats, Langfuse reporting. Presidio (Microsoft) provides advanced PII detection. Together they guarantee "sensitive data is redacted before it leaves the intranet".

## 2. Learning Objectives

- Explain chain position (NewAPI → LiteLLM → external → restore)
- Read/write `litellm-config.yaml` (model_list / litellm_settings / general_settings)
- Understand dual redaction (built-in regex filter + Presidio)
- Configure & verify Redis semantic cache (bge-m3)
- Configure Langfuse reporting
- Troubleshoot (keys, model 404, guardrail not global, Presidio endpoint 404)

## 3. Prerequisites

- M02, M04
- OpenAI-compatible API basics

## 4. Course Content & Duration (3 h, D4 PM)

| Topic | Duration | Type |
|---|---|---|
| Overview | 0.5 | Lecture |
| config.yaml | 0.5 | Lecture |
| PII redaction + verify | 0.5 | Lab |
| Semantic cache | 0.75 | Lab |
| Langfuse reporting | 0.25 | Lecture |
| Troubleshooting | 0.5 | Lecture+Lab |

## 5. Pass Criteria (A Level)

- Add a model & restart
- Redaction & BLOCK verified
- Cache hit verified
- Can explain `default_on: true`

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
