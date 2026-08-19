# AI AllInOne Master Training Schedule

> Version: v1.0 (2026-08-19) · Companion docs: overview.md · per-module folders · exam package (17-exam/)

## 1. At a Glance

- **Total**: 60 hours (10 working days × 6 hours; 3 in the morning + 3 in the afternoon)
- **Format**: instructor lecture + hands-on labs (3:7) + homework + phase quizzes
- **Location**: training room (one machine per trainee) or single demo machine + rotation
- **Staff**: 1 lead instructor (M01–M17), 1 TA (lab coaching & assessment records)

## 2. 10-Day Schedule (Tier A Admin Class)

| Day | Morning (3h) | Afternoon (3h) | Deliverable / Homework |
|---|---|---|---|
| **D1** | M01 Platform overview & architecture (components/ports/data flows/security) | M02 Docker basics + environment prep (Docker Desktop, dirs, .env, network) | Environment ready; draw the architecture diagram |
| **D2** | M02 Docker Compose deep-dive + start core services (10 containers) | M02 cont.: Dify standalone deploy (15 containers) + troubleshooting (WebSocket, GRAPH_ENGINE) | All 41 containers Up; submit deploy log |
| **D3** | M03 Keycloak (Realm/users/clients/OIDC) | M03 cont.: AD/LDAP federation + Entra ID/SAML multi-IdP | Keycloak SSO login verified |
| **D4** | M04 NewAPI (init/channels/tokens/quota/OIDC) | M05 LiteLLM + Presidio (model list/redaction/semantic cache/Langfuse) | LLM chain (NewAPI→LiteLLM→DeepSeek) works |
| **D5** | M06 Dify (model providers/apps/agents) | M06 cont.: knowledge base RAG + Dify API + workflows | Dify app + KB retrieval usable |
| **D6** | M07 Ghost (init/theme/content seed/download center) | M08 Gitea + Runner + Actions (deepchat-sync workflow) | Portal article published; CI workflow green |
| **D7** | M09 DeepChat (install/models/MCP/Skills/update chain) | M10 MCP Gateway (tools/external MCP/Skill market/RAG) | DeepChat calls search_knowledge |
| **D8** | M11 AI Admin Center (init/menus/delegated admin/backup) | M12–M16 ops modules (Update Server/monitoring/observability/logs/MailHog) | Admin Center fully usable; alerts configured |
| **D9** | Integrated practice 1: 12-item interconnect check + health-check script | Integrated practice 2 · M17 AI-driven ops (agent-driven inspection/backup/failure drill) | 12 interconnects green; health check ALL CLEAR |
| **D10** | Review + Q&A + mock defense | Final exams: theory (100 Q, 90 min) + hands-on (120 min) + defense | All three assessments graded |

> Tier B (ops): follow D1–D2 half-day, trim D3–D6, focus D7–D8 on Dify/Ghost/NewAPI/DeepChat user side & KB — about 5 days.
> Tier C (support): D1 full + half-days of D5–D7 — about 2.5 days.

## 3. Daily Routine

1. **Morning quiz (15 min)**: random 3-person oral check of yesterday's commands/concepts.
2. **Lecture (90 min)**: per module textbook, concepts + demo.
3. **Hands-on (90 min)**: follow the lab list in each module's `plan.md`; TA coaches.
4. **Review (15 min)**: key points + common errors + homework.
5. **Log**: trainees submit a daily practice log (what was done / result / errors & fixes) — counts toward daily score.

## 4. Phase Quizzes

| Phase | When | Scope | Form |
|---|---|---|---|
| Quiz 1 | End of D2 | M01+M02 (architecture/Docker/deploy) | computer quiz, 30 Q |
| Quiz 2 | End of D5 | M03–M06 (auth/routing/security/Dify) | computer quiz, 40 Q |
| Quiz 3 | End of D8 | M07–M16 (portal/CI/client/gateway/ops) | computer quiz, 40 Q |
| Final | D10 | all modules | theory 100 Q + hands-on + defense |

## 5. Resource Usage

| Resource | How to use |
|---|---|
| `../../windows/windows-deploy-guide-v2.en.html` | D2–D8 main hands-on reference, follow chapters 1–13 |
| `../../docs/admin-manual/` (English 30 chapters) | post-class reading + exam source |
| `../../docs/user-manual/` (English 8 chapters) | Tier C textbook; Tier A/B read for user perspective |
| Per-product `textbook.md` | lecture backbone (more platform-specific than official docs) |
| Per-product `references.md` | official docs + videos (self-study) |
| `../../AI-AGENT-OPS.md` | D9 AI-ops prompts reference |

## 6. Assessment & Graduation

- Weights and pass lines per overview §6; questions in `17-exam/`.
- Certificate template in `17-exam/scorecard.md` appendix.
- Make-up: single subject ≥60 but <70 can retake once; hands-on key items must be re-passed.

## 7. Instructor Prep Checklist

- [ ] Training machine prepared per D1–D2 scripts (or one clean deploy snapshot for repeat demos)
- [ ] DeepSeek API key configured with sufficient quota
- [ ] Print: deploy guide key card, port quick reference, credentials sheet (sanitized)
- [ ] Rehearse each day's demo so it fits in 90 minutes
- [ ] Prepare phase quiz papers & computer exam environment

---
*Adjust to trainee level; the core requirements stay: full-stack deploy on your own, 12 interconnects green, and ability to answer user questions.*
