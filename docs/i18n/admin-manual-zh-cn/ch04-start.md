# 第4章：启动核心服务

*第一部分 · 部署篇*

> 复制 .env、拉起容器、逐服务验证可访问，处理 Ghost 的 SQLite 已知问题。

[← 第3章：配置文件与环境变量](ch03-env.md) · [📖 目录](index.md) · [第5章：Dify 独立部署 →](ch05-dify-deploy.md)

---

## 4.1 复制 .env

```
# PowerShell
copy .env.windows .env
```

Docker Compose 默认读 `.env`。

## 4.2 启动全部核心服务

```
docker compose -f docker-compose.yml up -d
```

首次会拉取所有镜像（约 5–10 分钟，取决于网速）。

| 镜像 | 容器 | 大小 |
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

## 4.3 检查容器状态

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

预期 10 个核心容器全部 `Up`。有容器持续 `Restarting` 就 `docker logs 容器名` 看原因。

## 4.4 已知问题修复：Ghost 强制 SQLite

如果 `ghost` 一直 Restarting，日志报 `Error: connect ECONNREFUSED <服务器IP>:3306`——说明数据卷里残留了指向 MySQL 的旧 `config.production.json`。修复：在 compose 的 ghost 服务 `environment` 显式声明 SQLite：

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

> ⚠️ Windows + Docker Desktop WSL2 下，卷数据被封在 WSL2 虚拟磁盘内，宿主机 git bash 看不到，无法直接删卷内 `config.production.json`，只能走「环境变量覆盖」路线。也不要 `docker volume rm windows_ghost-data`（会丢已发布文章）。

> ✅ 验证：日志出现 `Ghost database ready` + `Ghost booted`，`curl.exe -I http://127.0.0.1:8090` 返回 200。

## 4.5 逐服务验证可访问

```
# Keycloak — 302 表示 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302（重定向到 /ghost/ 初始化页）
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403（空目录，nginx 在跑）
curl.exe -I http://127.0.0.1:8091
# AI 管理中心 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM 是纯 API 无 Web 界面，从容器内部验证：

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 预期返回 {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 Docker Desktop WSL2 的 HTTP 代理可能导致 LiteLLM 在宿主机无法访问（HEART/空响应），是已知 bug，不影响 NewAPI 经容器名调用它。

---

[← 第3章：配置文件与环境变量](ch03-env.md) · [📖 目录](index.md) · [第5章：Dify 独立部署 →](ch05-dify-deploy.md)
