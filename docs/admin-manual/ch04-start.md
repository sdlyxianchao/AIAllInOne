# Chapter 4: Starting Core Services

*Part 1 · Deployment*

> Copy .env, bring up the containers, verify each service is reachable, and handle the known Ghost SQLite issue.

[← Chapter 3: Configuration Files and Environment Variables](ch03-env.md) · [📖 Index](index.md) · [Chapter 5: Standalone Dify Deployment →](ch05-dify-deploy.md)

---

## 4.1 Copy .env

```
# PowerShell
copy .env.windows .env
```

Docker Compose reads `.env` by default.

## 4.2 Start All Core Services

```
docker compose -f docker-compose.yml up -d
```

The first run pulls all images (about 5–10 minutes, depending on network speed).

| Image | Container | Size |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |

## 4.3 Check Container Status

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expect all 10 core containers to be `Up`. If a container keeps `Restarting`, run `docker logs container-name` to see the reason.

## 4.4 Known Issue Fix: Force SQLite for Ghost

If `ghost` keeps Restarting and the log shows `Error: connect ECONNREFUSED <server-IP>:3306` — that means an old `config.production.json` pointing to MySQL is left over in the data volume. Fix: explicitly declare SQLite in the ghost service's `environment` in compose:

```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```

```
docker compose up -d ghost
docker logs ghost --tail 20
```

> ⚠️ Under Windows + Docker Desktop WSL2, the volume data is sealed inside the WSL2 virtual disk and cannot be seen from the host git bash, so you cannot directly delete `config.production.json` inside the volume — the only path is "override via environment variables". Also, do not run `docker volume rm windows_ghost-data` (it would lose already-published posts).

> ✅ Verify: the log shows `Ghost database ready` + `Ghost booted`, and `curl.exe -I http://127.0.0.1:8090` returns 200.

## 4.5 Verify Each Service Is Reachable

```
# Keycloak — 302 means OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redirects to the /ghost/ setup page)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (empty directory, nginx is running)
curl.exe -I http://127.0.0.1:8091
# AI Admin Center — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM is a pure API with no web UI; verify it from inside a container:

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# expected to return {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 Docker Desktop WSL2's HTTP proxy may make LiteLLM unreachable from the host (HEART/empty response); this is a known bug and does not affect NewAPI calling it by container name.

---

[← Chapter 3: Configuration Files and Environment Variables](ch03-env.md) · [📖 Index](index.md) · [Chapter 5: Standalone Dify Deployment →](ch05-dify-deploy.md)
