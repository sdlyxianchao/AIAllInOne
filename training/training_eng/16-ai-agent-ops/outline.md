# AI Agent Operations — Training Outline (M17 · AI-Driven Ops)

## 1. Positioning

This platform is **designed to be operated through an AI agent** (WorkBuddy / OpenClaw / Microsoft Scout): instead of clicking through a dozen consoles, you tell the agent what you want in plain language; it reads files, runs commands, and calls APIs. A differentiated capability and an advanced ops skill.

## 2. How it works

Everything lives on the machine as **code, config, and data**:
- Docker Compose defines all containers; `.env` holds credentials; admin APIs (Keycloak/Gitea/NewAPI…) expose management endpoints; files & DBs (Ghost SQLite, installers, sync-history JSON) are the actual state.
- So an agent can: read/write any file, run commands (docker/git/PowerShell/Node/Python), call services over HTTP, and search the web — **the whole platform is agent-operable**.

## 3. Getting ready (one-time)

1. Point the agent's working dir at the project root (`C:\AIAllInOne`)
2. Docker Desktop running
3. Credentials stay in `.env` (never paste into chat/repos)
4. Tell it the platform dir (`windows/`)

## 4. Learning Objectives

- Understand agent-driven operations principle
- Use common prompts for health check, investigation, restart, logs, sync, backup, release
- Follow best practices (frontend vs backend reload, no secrets, verify, backup before destructive)
- Run health-check.ps1 and interpret results

## 5. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../AI-AGENT-OPS.md` (full, 9 languages)
