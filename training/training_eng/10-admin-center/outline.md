# AI Admin Center — Training Outline (M11 · Unified Admin Portal)

## 1. Positioning

Self-built unified admin portal (port 10086): Keycloak auth, dashboard of all containers & business metrics, left menu aggregating all products, delegated admin authorization, audit/cost reports, backup/restore, unified logs, availability tests, report generation. 90% of daily ops happen here.

## 2. Learning Objectives

- Explain difference from 1Panel/Portainer (app-layer unified auth vs Docker management)
- Initialize (Global Admin, OIDC client, ai-platform-admin role)
- Use the menus (dashboard, product stat pages, NewAPI cost/audit, MCP mgmt, centralized auth, admin account mgmt, settings)
- **Delegate per-module admin** (admin:<product> roles + real provisioning) & revoke
- Use backup/restore, logs, availability, reports
- Know 9 UI languages & Ghost auto-login

## 3. Prerequisites

- M01–M10

## 4. Course Content & Duration (4 h, D8 AM)

| Topic | Duration | Type |
|---|---|---|
| Positioning & architecture + menu map | 0.5 | Lecture |
| Init | 0.75 | Lab |
| Dashboard & product pages walkthrough | 0.75 | Lab |
| Delegated admin | 0.75 | Lab |
| Ops features: backup/logs/availability/report/IM alerts | 0.75 | Lab |
| Settings/languages/Ghost auto-login + troubleshooting | 0.5 | Lecture |

## 5. Pass Criteria (A Level)

- Init + "unauthenticated → 302 to Keycloak" verified
- Add a Ghost-only delegated admin & verify real permissions
- Do a backup, a restore drill, run availability tests & interpret

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
