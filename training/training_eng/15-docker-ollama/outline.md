# Docker + Compose + Ollama — Training Outline (M02 · Infrastructure)

## 1. Positioning

Docker Desktop (WSL2) is the platform's only runtime base — all 41 containers are orchestrated by Docker Compose. Ollama is the optional local model runtime (provides the bge-m3 embedding used by the semantic cache / knowledge base). This module precedes everything else.

## 2. Learning Objectives

- Docker concepts (image/container/volume/network) & everyday commands (ps/logs/exec/restart/inspect/volume)
- Docker Compose (services/projects/env vars/ports/volumes/networks) — read & edit docker-compose.yml
- Complete platform prerequisites (.wslconfig, ai-platform network, copy .env, start core services, verify)
- Handle deploy issues (port conflicts, Restarting containers, slow/failed image pulls, WSL2 IPv6)
- Install Ollama + pull bge-m3
- Understand `host.docker.internal`

## 3. Course Content & Duration (6 h, D1–D2)

| Slot | Content | Type |
|---|---|---|
| D1 AM | Concepts + commands | Lecture+Demo |
| D1 PM | Environment prep (.wslconfig, dirs, .env, network) | Lab |
| D2 AM | Compose deep-dive + core services | Lab |
| D2 PM | Dify standalone + Ollama | Lab |

## 4. Pass Criteria (A Level)

- .env configured & core services started — 41 containers Up
- Read any service block in compose
- Use logs/exec/restart for troubleshooting

## 5. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
