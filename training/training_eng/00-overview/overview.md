# AI AllInOne Training Program — Master Outline

> Version: v1.0 (2026-08-19)
> Purpose: On-the-job training for the **AI AllInOne** enterprise intranet AI platform. After this training you will be able to deploy, configure, operate, and support the platform on your own.

---

## 1. Background & Goals

AI AllInOne is an **open-source, self-hosted enterprise intranet AI platform**: one server + Docker orchestration integrates 16+ open-source components — auth, LLM routing, AI apps, enterprise portal, Git/CI, unified admin, monitoring & alerting, observability, logging, and backup — into a single system. Employees log in once and get every AI tool; data never leaves the intranet.

| Capability | Pass criteria |
|---|---|
| Deploy | Independently deploy the full stack on Windows 11 + Docker Desktop (~41 containers) and get the LLM chain working end-to-end |
| Configure | Configure Keycloak SSO, NewAPI channels, Dify models/knowledge base, Ghost portal, Gitea CI/CD, and MCP Gateway interconnections |
| Operate | Daily inspection, health checks, backup/restore, log queries, troubleshooting |
| Support | Correctly answer users' "how to use / why it doesn't work / how to configure" questions |
| Security | Understand PII redaction, data classification (public/internal/confidential), and intranet compliance |

## 2. Audience & Role Tiers

| Tier | Audience | Depth | Assessment |
|---|---|---|---|
| **A. Platform Admin (core)** | Deployment/ops engineers | All 17 modules, deep | Theory + hands-on + Q&A |
| **B. Product/Content Admin** | Portal content, knowledge base, day-to-day support | 8 key modules, medium | Theory + hands-on |
| **C. End-user Support** | First-line help & user training | 5 modules, awareness | Theory only |

> The full plan below is for **Tier A**. Tiers B/C can trim modules accordingly.

## 3. Module Map (17 modules)

| # | Module | Product | Type | Depth |
|---|---|---|---|---|
| M01 | Platform Overview & Architecture | AI AllInOne | Foundation | ★★★ |
| M02 | Infrastructure | Docker Desktop / Docker Compose / Ollama | Foundation | ★★★ |
| M03 | Unified Auth | Keycloak (SSO/OIDC/AD federation) | Core | ★★★ |
| M04 | LLM Routing | NewAPI (channels/tokens/quota/audit) | Core | ★★★ |
| M05 | Security Gateway | LiteLLM + Presidio (PII redaction / semantic cache) | Core | ★★★ |
| M06 | AI App Platform | Dify (apps/agents/workflows/RAG) | Core | ★★★ |
| M07 | Enterprise Portal | Ghost (posts/pages/theme/download center) | Core | ★★★ |
| M08 | Source & CI/CD | Gitea + Runner + Actions | Core | ★★★ |
| M09 | Desktop Client | DeepChat (models/MCP/Skills/auto-update) | Core | ★★★ |
| M10 | Tool Gateway | MCP Gateway + Skill Marketplace | Core | ★★★ |
| M11 | Unified Admin | AI Admin Center | Core | ★★★ |
| M12 | Installer Distribution | Update Server | Foundation | ★★ |
| M13 | Monitoring & Alerting | Prometheus + Grafana + Alertmanager + cadvisor | Important | ★★★ |
| M14 | LLM Observability | Langfuse | Important | ★★ |
| M15 | Unified Logging | Loki + Promtail | Important | ★★ |
| M16 | Mail Helper | MailHog | Foundation | ★★ |
| M17 | AI-driven Ops | WorkBuddy / OpenClaw / Microsoft Scout | Advanced | ★★ |

> Detailed outline, textbook, plan, and exam for each module live in folders `01-keycloak/` … `16-ai-agent-ops/`.

## 4. Training Principles

1. **Deployment-driven**: the whole course follows "actually deploy the platform once" — every module is taught and practiced on a real environment (one machine with Docker Desktop on Windows 11 is enough).
2. **Whole before parts**: M01 architecture first, then each module, finally "interconnect verification & overall operations".
3. **Lecture : hands-on = 3:7**: every module includes lab work; core modules require hands-on configuration.
4. **The manuals are the textbook**: the project's own Admin Manual (`../../docs/admin-manual/`, 30 chapters) and Deployment Guide (`../../windows/windows-deploy-guide-v2.en.html`) are the primary textbooks; this training package distills exam points, labs, and assessments from them.
5. **Support-oriented**: every module exam includes a "customer/user questions" session to train the ability to answer on the spot.

## 5. Hours Allocation (suggested total: 60 hours ≈ 10 working days)

| Phase | Content | Hours |
|---|---|---|
| Phase 1 (Day 1-2) | Platform overview + Docker basics + full-stack deployment | 12 |
| Phase 2 (Day 3-5) | Core modules: Keycloak / NewAPI / LiteLLM / Dify / Ghost | 18 |
| Phase 3 (Day 6-7) | Advanced: Gitea CI/CD / MCP Gateway / DeepChat / Admin Center | 12 |
| Phase 4 (Day 8) | Ops: monitoring / observability / logs / backup / health check | 8 |
| Phase 5 (Day 9) | Integrated practice: end-to-end verification + AI-driven ops | 6 |
| Phase 6 (Day 10) | Review + theory exam + hands-on exam + Q&A defense | 4 |

## 6. Assessment System

| Item | Form | Weight | Pass line |
|---|---|---|---|
| Theory exam | Closed-book, 100 questions (single/multiple choice, true-false, short answer, scenario) | 40% | ≥ 70 |
| Hands-on exam | On-site operations (see hands-on checklist) | 40% | All key items pass |
| Q&A defense | Mock user questions (2-3 per core module) | 20% | ≥ 70 |

See `17-exam/`: exam scheme, 100-question bank (with answers), hands-on checklist, scorecard (with certificate template).

## 7. Training Environment & Resources

| Resource | Notes |
|---|---|
| Training machine | Windows 11 + Docker Desktop (WSL2), ≥16 GB RAM, 60 GB disk — one machine suffices |
| External LLM key | At least 1 DeepSeek API key (to get the LLM chain working) |
| Sample data | Built-in: Ghost content seed, DeepChat installers, sample MCP Skills |
| Primary textbooks | `../../windows/windows-deploy-guide-v2.en.html`, `../../docs/admin-manual/` (30 chapters), `../../docs/user-manual/` (8 chapters), this training package |
| References | Per-product `references.md` (official docs + videos, see `99-references/video-index.md`) |

## 8. Discipline & Notes

1. Use test data only; never leak real enterprise data or keys; PII module requires understanding data classification (public/internal/confidential).
2. Practice on an isolated training machine; any production touch requires approval.
3. Secrets live only in `.env`; never hard-code passwords in docs, chats, or repos.
4. On failure, self-check with the troubleshooting manual first, then ask the instructor — build a "log-driven debugging" habit.
5. Pass all three assessments to graduate; otherwise take make-up exams.

## 9. Deliverables Map

| File | Location |
|---|---|
| Master outline | `00-overview/overview.md` |
| Master schedule (10-day) | `00-overview/schedule.md` |
| 16 product packages (outline/textbook/plan/exam) | `01-keycloak/` … `16-ai-agent-ops/` |
| Exam package | `17-exam/` |
| Video tutorial index | `99-references/video-index.md` |
| HTML portal | `index.html` |

---
*This master outline is the top-level document; module details live in their folders.*
