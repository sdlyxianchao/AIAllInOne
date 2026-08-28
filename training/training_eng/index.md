# AI AllInOne Enterprise Intranet AI Platform · Training Program

> **One server. One SSO. The whole enterprise AI stack — free and self-hosted.**
> On-the-job training for platform deployment & operations onboarding: 17 modules, 60 hours, 10 working days.

| Version | Date | Modules | Hours | Assessment | Certificate |
|---|---|---|---|---|---|
| v1.0 | 2026-08-19 | 17 | 60 | Theory + Hands-on + Defense | ✓ |

**Contents**
- [Training Overview](#training-overview)
- [10-Day Schedule](#10-day-schedule-tier-a-admin-class)
- [Modules](#modules-16-product-folders--platform-overview)
- [Assessment](#assessment)
- [Resources](#resources)
- [Directory Structure](#directory-structure)

---

## Training Overview

### Target Capabilities

| Capability | Pass criteria |
|---|---|
| Deploy | Independently deploy the full stack on Windows 11 + Docker Desktop (~41 containers); LLM chain end-to-end |
| Configure | Keycloak SSO, NewAPI channels, Dify models/KB, Ghost portal, Gitea CI/CD, MCP Gateway interconnections |
| Operate | Daily inspection, health checks, backup/restore, log queries, troubleshooting |
| Support | Answer "how to use / why not working / how to configure" correctly |
| Security | PII redaction, data classification (public/internal/confidential), intranet compliance |

### Role Tiers

| Tier | Audience | Depth | Assessment |
|---|---|---|---|
| A · Platform Admin (core) | Deployment/ops engineers | All 17 modules, deep | Theory + Hands-on + Defense |
| B · Product/Content Admin | Portal content, KB, daily support | 8 key modules, medium | Theory + Hands-on |
| C · End-user Support | First-line help, user training | 5 modules, awareness | Theory |

> Default plan is Tier A; trim modules for B/C. Details: [overview.md](00-overview/overview.md)

---

## 10-Day Schedule (Tier A Admin Class)

| Day | Morning (3h) | Afternoon (3h) | Deliverable / Homework |
|---|---|---|---|
| **D1** | M01 Platform overview & architecture (components/ports/data flows/security) | M02 Docker basics + environment prep (Docker Desktop, .wslconfig, dirs, .env, network, fix IP) | Environment ready; draw architecture diagram |
| **D2** | M02 Compose deep-dive + core services (10 containers Up + verify) | M02 cont.: Dify standalone deploy (15 containers + troubleshoot GRAPH_ENGINE/WebSocket + Ollama bge-m3) | All 41 containers Up; deploy log submitted |
| **D3** | M03 Keycloak part 1 (Realm/users/groups/roles/OIDC Client) | M03 part 2 (AD/LDAP federation + Entra ID/SAML multi-IdP + troubleshooting) | Keycloak SSO login verified |
| **D4** | M04 NewAPI (init/channels/tokens/quota/OIDC/promote) | M05 LiteLLM + Presidio (model list/PII redaction/semantic cache/Langfuse) | LLM chain (NewAPI→LiteLLM→DeepSeek) green |
| **D5** | M06 Dify part 1 (model providers/chatbot/agent) | M06 part 2 (knowledge base RAG/Knowledge API/workflows/publish) | Dify app + KB retrieval usable |
| **D6** | M07 Ghost (init/Corp Portal theme/content seed/download center) | M08 Gitea + Runner (Actions/dsh-sync/workflow syntax/SSO) | Portal article published; CI green |
| **D7** | M09 DSH Desktop (install/models/MCP/Skills/update chain) | M10 MCP Gateway (built-ins/external MCP/Skill market/RAG) | DSH Desktop calls search_knowledge |
| **D8** | M11 AI Admin Center (init/menus/delegated admin/backup) | M12–M16 ops modules (Update Server/monitoring/observability/logs/MailHog) | Admin Center fully usable; alerts configured |
| **D9** | Integrated practice 1 (12 interconnect checks + health-check ALL CLEAR) | Integrated practice 2 · M17 AI ops (agent-driven inspection/backup/failure drill/release) | 12 interconnects green; health check ALL CLEAR |
| **D10** | Review + Q&A + mock defense | Final exams (theory 100 Q 90min + hands-on 120min + defense) | All three assessed & graded |

> ⚠️ Discipline: test data only; credentials live only in .env; self-check with the troubleshooting manual first; destructive operations require instructor supervision. Tier B/C schedules are trimmed per overview.

---

## Modules (16 product folders + platform overview)

> 📚 **Every product folder has a `references.md`**: local docs (English Admin Manual chapters + deployment guide + source/config) + official docs + videos + articles, with a "local → official → video" self-study path.

| # | Module | Type | Hours | Description | Links |
|---|---|---|---|---|---|
| M01 | Platform Overview & Architecture | Foundation | — | 6 layers / 16 ports / data flows / security: full platform map before touching anything | [Textbook](00-overview/platform-M01.md) |
| M02 | Docker + Compose + Ollama | Foundation | 6 | Images/containers/volumes/networks, compose syntax, 8 port conflicts, 🔴 .env vars, Dify standalone, bge-m3 | [Outline](15-docker-ollama/outline.md) · [Textbook](15-docker-ollama/textbook.md) · [Plan](15-docker-ollama/plan.md) · [Exam](15-docker-ollama/exam.md) · [Refs](15-docker-ollama/references.md) |
| M03 | Keycloak Unified Auth | Core | 6 | SSO/OIDC/AD federation: Realm/Client/User/Role, OIDC Clients, AD/LDAP User Federation, multi-IdP, troubleshooting | [Outline](01-keycloak/outline.md) · [Textbook](01-keycloak/textbook.md) · [Plan/Exam](01-keycloak/plan.md) · [Refs](01-keycloak/references.md) |
| M04 | NewAPI LLM Routing | Core | 3 | Init wizard, channels→LiteLLM, key separation, OIDC (endpoint fix + server address + promote), cost/audit, rate limits | [Outline](02-newapi/outline.md) · [Textbook](02-newapi/textbook.md) · [Plan](02-newapi/plan.md) · [Exam](02-newapi/exam.md) · [Refs](02-newapi/references.md) |
| M05 | LiteLLM + Presidio | Core | 3 | config.yaml, regex redaction + BLOCK, Presidio endpoint pitfall, Redis semantic cache (bge-m3), Langfuse reporting | [Outline](03-litellm-presidio/outline.md) · [Textbook](03-litellm-presidio/textbook.md) · [Plan](03-litellm-presidio/plan.md) · [Exam](03-litellm-presidio/exam.md) · [Refs](03-litellm-presidio/references.md) |
| M06 | Dify AI Application Platform | Core | 6 | Standalone deploy pitfalls, model providers, five app types, High-quality KB, Knowledge API, Chatflow support bot, publish | [Outline](04-dify/outline.md) · [Textbook](04-dify/textbook.md) · [Plan](04-dify/plan.md) · [Exam](04-dify/exam.md) · [Refs](04-dify/references.md) |
| M07 | Ghost Enterprise Portal | Core | 3 | SQLite pitfall, Corp Portal theme, content seed, posts/nav, MailHog code, Admin Center auto-login (TOTP) | [Outline](05-ghost/outline.md) · [Textbook](05-ghost/textbook.md) · [Plan](05-ghost/plan.md) · [Exam](05-ghost/exam.md) · [Refs](05-ghost/references.md) |
| M08 | Gitea + Runner | Core | 3 | Runner registration + 4 pitfalls, dsh-sync (sync-config.json), Actions syntax, SSO auto-registration, ROOT_URL | [Outline](06-gitea-runner/outline.md) · [Textbook](06-gitea-runner/textbook.md) · [Plan](06-gitea-runner/plan.md) · [Exam](06-gitea-runner/exam.md) · [Refs](06-gitea-runner/references.md) |
| M09 | DSH Desktop Desktop Client | Core | 3 | Install/config, manual MCP (Skip to manual config), SSE notice, Skill URL install, skill-market (hostname), auto-update | [Outline](07-dsh/outline.md) · [Textbook](07-dsh/textbook.md) · [Plan](07-dsh/plan.md) · [Exam](07-dsh/exam.md) · [Refs](07-dsh/references.md) |
| M10 | MCP Gateway | Core | 3 | MCP protocol, 4 built-ins, external server aggregation, Skill market, search_knowledge chain (3 pitfalls), admin API | [Outline](09-mcp-gateway/outline.md) · [Textbook](09-mcp-gateway/textbook.md) · [Plan](09-mcp-gateway/plan.md) · [Exam](09-mcp-gateway/exam.md) · [Refs](09-mcp-gateway/references.md) |
| M11 | AI Admin Center | Core | 4 | Global Admin init, menu map, delegated admin (admin:product + provisioning), backup/restore, availability, reports, IM alerts | [Outline](10-admin-center/outline.md) · [Textbook](10-admin-center/textbook.md) · [Plan](10-admin-center/plan.md) · [Exam](10-admin-center/exam.md) · [Refs](10-admin-center/references.md) |
| M12 | Update Server | Foundation | 1 | Distribution chain, upload/verify, latest.yml/version.txt/publish.url, 403 is normal, rollback guard | [Outline](08-update-server/outline.md) · [Textbook](08-update-server/textbook.md) · [Plan](08-update-server/plan.md) · [Exam](08-update-server/exam.md) · [Refs](08-update-server/references.md) |
| M13 | Monitoring & Alerting | Important | 2 | cadvisor collection, dashboards, 2 anti-false-positive rules, IM alerts (robots/apps), port conflicts | [Outline](11-monitoring/outline.md) · [Textbook](11-monitoring/textbook.md) · [Plan](11-monitoring/plan.md) · [Exam](11-monitoring/exam.md) · [Refs](11-monitoring/references.md) |
| M14 | Langfuse Observability | Important | 1.5 | Trace interpretation, V4_WRITE_MODE=dual pitfall, SSO org pitfall, cost analysis, Prompt Management intro | [Outline](12-langfuse/outline.md) · [Textbook](12-langfuse/textbook.md) · [Plan](12-langfuse/plan.md) · [Exam](12-langfuse/exam.md) · [Refs](12-langfuse/references.md) |
| M15 | Loki Unified Logging | Important | 1 | Labels-only philosophy, Unified Logs queries, LogQL basics, Docker Desktop mount pitfall | [Outline](13-loki/outline.md) · [Textbook](13-loki/textbook.md) · [Plan](13-loki/plan.md) · [Exam](13-loki/exam.md) · [Refs](13-loki/references.md) |
| M16 | MailHog Mail Catcher | Foundation | 0.5 | Ghost mail exit, view codes at :8025, TOTP auto-login (exam merged into M07) | [Outline](14-mailhog/outline.md) · [Textbook](14-mailhog/textbook.md) · [Plan](14-mailhog/plan.md) · [Exam](14-mailhog/exam.md) · [Refs](14-mailhog/references.md) |
| M17 | AI Agent Operations | Advanced | 3 | Principle, 10 prompt templates, best practices (reload/verify/secrets), health-check.ps1, command reference | [Outline](16-ai-agent-ops/outline.md) · [Textbook](16-ai-agent-ops/textbook.md) · [Plan](16-ai-agent-ops/plan.md) · [Exam](16-ai-agent-ops/exam.md) · [Refs](16-ai-agent-ops/references.md) |

---

## Assessment

| Item | Form | Weight | Pass line | Organization |
|---|---|---|---|---|
| Theory exam | Closed-book, 100 Q (50 single / 15 multi / 25 true-false / 10 short) | 40% | ≥ 70 | D10 · 90 min |
| Hands-on exam | On-site, 13 items (⭐ key items all pass) | 40% | key items pass | D10 · 120 min |
| Q&A defense | Mock user questions (employee/mgmt/colleague) | 20% | ≥ 70 | D10 · 10 min/person |

> **Total = theory×0.4 + hands-on×0.4 + defense×0.2; ≥70 to graduate; any single <60 → make-up.** Any ⭐ key item failing fails the hands-on.

**Exam docs**: [exam-overview.md (scheme)](17-exam/exam-overview.md) · [exam-theory.md (100-Q bank)](17-exam/exam-theory.md) · [exam-practical.md (checklist)](17-exam/exam-practical.md) · [exam-grading.md (scorecard)](17-exam/exam-grading.md)

---

## Resources

| Resource | Location |
|---|---|
| 📚 Per-product full resource lists (local + official + videos) | `references.md` in each folder (01-keycloak/ … 16-ai-agent-ops/) |
| Video & tutorial index | [99-references/video-index.md](99-references/video-index.md) |
| Official doc index (vendor links) | [../../docs/admin-manual/ch30-appendix.md](../../docs/admin-manual/ch30-appendix.md) |
| Admin Manual (English, 30 chapters) | [../../docs/admin-manual/index.md](../../docs/admin-manual/index.md) |
| User Manual (English, 8 chapters) | [../../docs/user-manual/index.md](../../docs/user-manual/index.md) |
| Windows Deployment Guide | [../../windows/windows-deploy-guide-v2.en.html](../../windows/windows-deploy-guide-v2.en.html) |
| AI Agent Operations Guide | [../../AI-AGENT-OPS.md](../../AI-AGENT-OPS.md) |
| AD Integration Guide | [../../windows/windows-ad-integration.en.html](../../windows/windows-ad-integration.en.html) |
| Credentials sheet (confidential) | `../../windows/credentials.html` (not distributed) |

---

## Directory Structure

```text
C:\AIAllInOne\training\training_eng\
├── index.md                     ← this file (Markdown portal, rendered online)
├── 00-overview\                 ← overview.md / schedule.md / platform-M01.md
├── 01-keycloak\ … 16-ai-agent-ops\  ← per product: outline.md + plan.md + textbook.md + exam.md + references.md
├── 17-exam\                     ← exam-overview.md / exam-theory.md / exam-practical.md / exam-grading.md
└── 99-references\               ← video-index.md / policies-faq.md / README.md
```

---

*AI AllInOne Training System v1.0 · 2026-08-19 · distilled from [../../windows/windows-deploy-guide-v2.en.html](../../windows/windows-deploy-guide-v2.en.html) & docs/ manuals. Rendered online on GitHub/Gitee; for a PDF, convert locally with Typora/Pandoc.*
