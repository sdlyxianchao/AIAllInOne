# Docker + Compose + Ollama — Textbook (M02 · Infrastructure)

> All containers run in Docker Desktop (WSL2), on network `ai-platform`, reaching each other by **container name** (e.g. `http://litellm:4000`).

## 1. Concepts & commands

- **Image**: read-only template, e.g. `quay.io/keycloak/keycloak:25.0`
- **Container**: running instance
- **Volume**: persistence, e.g. `keycloak-data`
- **Network**: `ai-platform`

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

## 2. Windows prerequisites (platform-specific)

- **`.wslconfig`**: `memory=24GB` (min 16, ~half of host RAM), `processors=8`, `swap=4GB`; `wsl --shutdown` then restart Docker Desktop.
- **Files**: `docker-compose.yml` (25 core containers); `.env.windows` → copy to `.env` (🔴 before first start: DEEPSEEK_API_KEY, LITELLM_MASTER_KEY, NEWAPI_DB_PASSWORD, KEYCLOAK_ADMIN_PASSWORD, NEWAPI_SESSION_SECRET, NEWAPI_CRYPTO_SECRET, ADMIN_PASSWORD, SESSION_SECRET); `litellm-config.yaml`.
- **Network**: `docker network create ai-platform`. **Fix the intranet IP** (router DHCP reservation/MAC binding) or all employee URLs break on restart.
- **Start & verify**: `docker compose up -d` (first pull 5–10 min) → `docker ps` → 10 core containers Up; verify Keycloak 302 / NewAPI 200 / Gitea 200 / Admin Center 200.

## 3. Compose syntax (read/edit)

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

## 4. Dify standalone (D2 PM)

Own compose (~15 containers, network `docker_default`) — not mixed with the main compose. Required fix: `shared.env` `GRAPH_ENGINE_SCALE_UP_THRESHOLD=0→50` (1.16.1 PositiveInt; else 4 containers restart-loop). WebSocket: `.env` `NEXT_PUBLIC_SOCKET_URL=ws://<SERVER_IP>` + compose web fallback + `docker compose up -d web` + hard refresh. Details in M06.

## 5. Ollama (optional but recommended)

| Use | Notes |
|---|---|
| bge-m3 embedding | semantic cache vectors (LiteLLM redis-semantic) + Dify local embedding (1024-dim CN) |
| local inference (optional) | for offline intranet |

- Install: `irm https://ollama.com/install.ps1 \| iex` (Windows) or official download.
- Pull: `ollama pull bge-m3`.
- Containers reach host via `http://host.docker.internal:11434`; platform `OLLAMA_API_BASE` defaults to it.

## 6. Common deploy issues

| Issue | Fix |
|---|---|
| container Restarting | `docker logs <name>` for root cause (Ghost SQLite / Dify GRAPH_ENGINE / port conflict) |
| image pull slow/fail | registry mirror; proxy for GitHub; presidio ~965 MB needs patience |
| WSL2 IPv6 | use `<SERVER_IP>` or 127.0.0.1, not localhost (LiteLLM: intranet IP) |
| compose change not effective | `.env` changes need `up -d` (restart doesn't re-read env) |
| port taken | `netstat -ano \| findstr <port>`; change mapping |
