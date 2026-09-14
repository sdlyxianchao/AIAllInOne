# Gitea + Runner — Training Outline (M08 · Source & CI/CD)

## 1. Positioning

Internal Git hosting + CI/CD (Actions). Hosts the DSH Desktop source mirror and the `dsh-sync` auto-sync workflow (GitHub → installers → update server → portal), plus build/release pipelines.

## 2. Learning Objectives

- Explain role (port 3002 / SSH 2222 / Runner / Actions)
- Init, enable Actions, create & register Runner
- Understand & troubleshoot `dsh-sync` (schedule + workflow_dispatch, sync-config.json, update_ghost.py)
- Wire Keycloak SSO auto-registration
- Write simple workflows (.gitea/workflows/*.yml)
- Fix common issues (readonly database, ROOT_URL, runner registration, force_pull)

## 3. Prerequisites

- M02, M03 (optional SSO part)

## 4. Course Content & Duration (3 h, D6 PM)

| Topic | Duration | Type |
|---|---|---|
| Overview | 0.5 | Lecture |
| Init + Actions + Runner | 0.75 | Lab |
| dsh-sync deep-dive | 0.75 | Lab |
| Actions syntax | 0.5 | Lab |
| SSO + troubleshooting | 0.5 | Lecture |

## 5. Pass Criteria (A Level)

- Init → Runner Idle → trigger sync → read logs
- Write a push workflow
- Explain the 4 Runner pitfalls

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
