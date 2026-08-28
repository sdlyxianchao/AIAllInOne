# NewAPI — Training Outline (M04 · LLM Routing Gateway)

## 1. Positioning

LLM routing & API gateway. All AI apps (Dify, DSH Desktop) call external LLMs through it — channel management, API tokens, quotas/billing, rate limiting, audit logs. It is the first hop of the platform's "LLM chain".

## 2. Learning Objectives

- Initialize wizard
- Configure channels (→ LiteLLM)
- Create/separate API keys
- Keycloak OIDC login (host.docker.internal fix, server address, role promotion)
- Manage quota/groups/rate limits
- Read dashboard/logs/cost/audit
- Troubleshoot (channel test fail, 429, OIDC 403, invalid token)

## 3. Prerequisites

- M02, M03
- OpenAI API format basics

## 4. Course Content & Duration (3 h, D4 AM)

| Topic | Duration | Type |
|---|---|---|
| Overview & modes | 0.5 | Lecture |
| Init wizard | 0.5 | Lecture |
| Channels + test | 0.5 | Lab |
| Tokens + self-service quota | 0.5 | Lab |
| OIDC | 0.5 | Lab |
| Usage/cost/groups/rate limit + troubleshooting | 0.5 | Lecture+Lab |

## 5. Pass Criteria (A Level)

- Independent init→channel→token→OIDC
- Can explain why `http://litellm:4000` and `host.docker.internal`
- Can answer "how do I get an API key / why is my quota 0"

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
