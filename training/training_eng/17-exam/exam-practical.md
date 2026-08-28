# AI AllInOne Final Exam — Hands-On Checklist (120 min)

> 13 items across 5 phases. ⭐ key items must all pass.

## Phase 1: Environment & deploy (25 min, 25 pts)

| # | Item | ⭐ | Pts | Points |
|---|---|---|---|---|
| 1 | Container status & anomaly report | ⭐ | 8 | docker ps + root cause |
| 2 | Change one .env value, make it effective via up -d | ⭐ | 7 | up -d not restart; verify |
| 3 | Locate & fix a planted container fault via logs | ⭐ | 10 | logs → cause → fix → verify |

## Phase 2: Auth & LLM chain (30 min, 30 pts)

| # | Item | ⭐ | Pts | Points |
|---|---|---|---|---|
| 4 | Keycloak new local user → ai-user group | ⭐ | 6 | |
| 5 | AD sync & Account-Console login | ⭐ | 8 | |
| 6 | NewAPI channel → LiteLLM, test OK | ⭐ | 8 | |
| 7 | Real chat via DSH Desktop/curl, chain works | ⭐ | 8 | |

## Phase 3: Apps & content (30 min, 25 pts)

| # | Item | ⭐ | Pts | Points |
|---|---|---|---|---|
| 8 | Dify KB (high quality) + Chatflow retrieval hit | ⭐ | 10 | |
| 9 | Ghost publish + Corp Portal theme | ⭐ | 8 | |
| 10 | MCP Skill upload/delete + /skills list | | 7 | |

## Phase 4: Ops & security (25 min, 20 pts)

| # | Item | ⭐ | Pts | Points |
|---|---|---|---|---|
| 11 | Admin Center backup + availability run & interpret | ⭐ | 8 | |
| 12 | Unified logs by container+keyword | | 5 | |
| 13 | PII redaction demo incl. BLOCK | ⭐ | 7 | |

## Phase 5: Oral (10 min, mandatory talk, no pts)

| # | Item | ⭐ | Pts | Points |
|---|---|---|---|---|
| 14 | Draw the LLM request flow orally | must-pass for M01 | | |

## Rules

- ⭐ Key items (#1/#2/#3/#4/#5/#6/#7/#8/#9/#11/#13) any fail → hands-on fail
- Time-out items score 0
- +15 min allowed at −5 pts
