# NewAPI — Exam (M04)

> Theory 10 Q/30 + Hands-on 50 + Defense 20; ≥70 to pass.

## 1. Theory (30 pts)

### Single choice (3 pts × 6)

1. Channel Base URL → B `http://litellm:4000`
2. Channel key → B LITELLM_MASTER_KEY value
3. Mode → C Personal use
4. Token/userinfo endpoints → C host.docker.internal:9090
5. 403 after SSO → B promote role=100
6. Employee quota 0 → B only new users get DEFAULT_QUOTA; existing adjusted manually

### True/False (3 pts × 4)

7. Separate dify-key/dsh-key for stats. **T**
8. Authorize endpoint should also be host.docker.internal. **F**
9. After setting server address to intranet, debug via intranet IP too. **T**
10. Rate-limit vars are in .env not Settings. **T**

## 2. Hands-on (50 pts)

| # | Item | Points |
|---|---|---|
| 1 | Add channel→LiteLLM and test OK | 20 |
| 2 | Full OIDC config + AD login | 20 |
| 3 | Two purpose-separated tokens verified via curl | 10 |

## 3. Defense (20 pts)

1. "Quota insufficient — how to fix?"
2. "invalid_grant — where do you look?"
3. "Restrict a department to cheap models?"
