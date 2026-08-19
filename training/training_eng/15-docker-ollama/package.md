# Docker + Compose + Ollama — Training Package (M02 · Infrastructure)

## Outline

**Positioning**: Docker Desktop (WSL2) is the platform's only runtime base — all 41 containers are orchestrated by Docker Compose. Ollama is the optional local model runtime (provides the bge-m3 embedding used by the semantic cache / knowledge base). This module precedes everything else.

**Objectives**: Docker concepts (image/container/volume/network) & everyday commands (ps/logs/exec/restart/inspect/volume); Docker Compose (services/projects/env vars/ports/volumes/networks) — read & edit docker-compose.yml; complete platform prerequisites (.wslconfig, ai-platform network, copy .env, start core services, verify); handle deploy issues (port conflicts, Restarting containers, slow/failed image pulls, WSL2 IPv6); install Ollama + pull bge-m3; understand `host.docker.internal`.

**Content (6 h, D1–D2)**: D1 AM concepts+commands; D1 PM environment prep; D2 AM Compose deep-dive + core services; D2 PM Dify standalone + Ollama.

**Pass**: .env configured & core services started — 41 containers Up; read any service block in compose; use logs/exec/restart for troubleshooting.

---

## Textbook

All containers run in Docker Desktop (WSL2), on network `ai-platform`, reaching each other by **container name** (e.g. `http://litellm:4000`).

**1. Concepts & commands**: Image (read-only template, e.g. `quay.io/keycloak/keycloak:25.0`), Container (running instance), Volume (persistence, e.g. `keycloak-data`), Network (`ai-platform`).

```bash
docker ps -a                       # all containers
docker logs <name> --tail 100      # logs
docker exec -it <name> <cmd>       # exec
docker restart <name>              # restart
docker inspect <name>              # details (health/mounts)
docker volume ls / docker network ls
docker system df                   # disk
docker compose -f docker-compose.yml up -d <svc>   # start/recreate (re-reads .env)
```

**2. Windows prerequisites (platform-specific)**
- `.wslconfig`: `memory=24GB` (min 16, ~half of host RAM), `processors=8`, `swap=4GB`; `wsl --shutdown` then restart Docker Desktop.
- Files: `docker-compose.yml` (25 core containers); `.env.windows` → copy to `.env` (🔴 before first start: DEEPSEEK_API_KEY, LITELLM_MASTER_KEY, NEWAPI_DB_PASSWORD, KEYCLOAK_ADMIN_PASSWORD, NEWAPI_SESSION_SECRET, NEWAPI_CRYPTO_SECRET, ADMIN_PASSWORD, SESSION_SECRET); `litellm-config.yaml`.
- Network: `docker network create ai-platform`. **Fix the intranet IP** (router DHCP reservation/MAC binding) or all employee URLs break on restart.
- Start & verify: `docker compose up -d` (first pull 5–10 min) → `docker ps` → 10 core containers Up; verify Keycloak 302 / NewAPI 200 / Gitea 200 / Admin Center 200.

**3. Compose syntax (read/edit)**
```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    ports: ["3000:3000"]
    environment: ["SQL_DSN=root:${NEWAPI_DB_PASSWORD}@tcp(new-api-db:3306)/new-api"]
    volumes: ["new-api-data:/data"]
    networks: ["ai-platform"]
    depends_on: ["new-api-db"]
```
**8 port conflicts to know**: Prometheus 9091 (9090=Keycloak), Grafana 3030 (3000=NewAPI), LiteLLM host 4001 (container 4000), cadvisor 8080 internal, Loki 3110 internal, MailHog 8025, MCP Gateway 3100, Admin Center 10086.

**4. Dify standalone (D2 PM)**: own compose (~15 containers, network `docker_default`) — not mixed with the main compose. Required fix: `shared.env` `GRAPH_ENGINE_SCALE_UP_THRESHOLD=0→50` (1.16.1 PositiveInt; else 4 containers restart-loop). WebSocket: `.env` `NEXT_PUBLIC_SOCKET_URL=ws://<SERVER_IP>` + compose web fallback + `docker compose up -d web` + hard refresh. Details in M06.

**5. Ollama (optional but recommended)**
| Use | Notes |
|---|---|
| bge-m3 embedding | semantic cache vectors (LiteLLM redis-semantic) + Dify local embedding (1024-dim CN) |
| local inference (optional) | for offline intranet |
- Install: `irm https://ollama.com/install.ps1 | iex` (Windows) or official download.
- Pull: `ollama pull bge-m3`.
- Containers reach host via `http://host.docker.internal:11434`; platform `OLLAMA_API_BASE` defaults to it.

**6. Common deploy issues**
| Issue | Fix |
|---|---|
| container Restarting | `docker logs <name>` for root cause (Ghost SQLite / Dify GRAPH_ENGINE / port conflict) |
| image pull slow/fail | registry mirror; proxy for GitHub; presidio ~965 MB needs patience |
| WSL2 IPv6 | use `<SERVER_IP>` or 127.0.0.1, not localhost (LiteLLM: intranet IP) |
| compose change not effective | `.env` changes need `up -d` (restart doesn't re-read env) |
| port taken | `netstat -ano \| findstr <port>`; change mapping |

---

## Training Plan (6 h, D1–D2)

| Slot | Content | Method |
|---|---|---|
| D1 AM 1 | concepts + commands | lecture+demo |
| D1 AM 2-3 | Lab: Docker Desktop config + command drills | lab |
| D1 PM 1 | env prep: .wslconfig/dirs/.env/network | lecture |
| D1 PM 2-3 | Lab: edit .env (🔴 8 vars), create network, fix IP | lab |
| D2 AM 1 | Compose syntax + port table | lecture |
| D2 AM 2-3 | Lab: start core services + per-service verify (S) | lab |
| D2 PM 1 | Dify deploy + troubleshooting | lecture |
| D2 PM 2-3 | Lab: Dify 15 containers + Ollama + bge-m3 | lab |

**Lab checklist**: `docker ps` all core Up (S); explain any compose service block; 🔴 8 .env vars set; ai-platform exists; Dify 15 containers Up (S); `ollama pull bge-m3` OK; fixed one container issue with docker logs.

## Exam (merged into D2 phase quiz)

**Theory (2 pts × 10 = 20)**: 1. persistence → B volume; 2. .env change → B up -d; 3. Prometheus port → B 9091; 4. container-to-container → B container name on ai-platform; 5. LiteLLM host access → B intranet IP:4001; 6. container→host service → A host.docker.internal; 7. Dify network → B docker_default; 8. GRAPH_ENGINE un-fixed → B 4 Dify containers restart; 9. .wslconfig memory → B ~half host RAM (min 16GB); 10. NOT a fix for slow pulls → C increase RAM.

**Hands-on (30)**: 1. start core services & verify each (20); 2. locate & fix a planted container fault via logs (10).
