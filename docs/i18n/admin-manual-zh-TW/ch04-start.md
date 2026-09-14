# 第4章：啟動核心服務

*第一部分 · 部署篇*

> 複製 .env、拉起容器、逐服務驗證可訪問，處理 Ghost 的 SQLite 已知問題。

[← 第3章：配置檔案與環境變數](ch03-env.md) · [📖 目錄](index.md) · [第5章：Dify 獨立部署 →](ch05-dify-deploy.md)

---

## 4.1 複製 .env

```
# PowerShell
copy .env.windows .env
```

Docker Compose 預設讀 `.env`。

## 4.2 啟動全部核心服務

```
docker compose -f docker-compose.yml up -d
```

首次會拉取所有映像（約 5–10 分鐘，取決於網速）。

| 映像 | 容器 | 大小 |
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

## 4.3 檢查容器狀態

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

預期 10 個核心容器全部 `Up`。有容器持續 `Restarting` 就 `docker logs 容器名` 看原因。

## 4.4 已知問題修復：Ghost 強制 SQLite

如果 `ghost` 一直 Restarting，日誌報 `Error: connect ECONNREFUSED <伺服器IP>:3306`——說明資料卷裡殘留了指向 MySQL 的舊 `config.production.json`。修復：在 compose 的 ghost 服務 `environment` 顯式宣告 SQLite：

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

> ⚠️ Windows + Docker Desktop WSL2 下，卷資料被封在 WSL2 虛擬磁碟內，宿主機 git bash 看不到，無法直接刪卷內 `config.production.json`，只能走「環境變數覆蓋」路線。也不要 `docker volume rm windows_ghost-data`（會丟已釋出文章）。

> ✅ 驗證：日誌出現 `Ghost database ready` + `Ghost booted`，`curl.exe -I http://127.0.0.1:8090` 返回 200。

## 4.5 逐服務驗證可訪問

```
# Keycloak — 302 表示 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302（重定向到 /ghost/ 初始化頁）
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403（空目錄，nginx 在跑）
curl.exe -I http://127.0.0.1:8091
# AI 管理中心 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM 是純 API 無 Web 介面，從容器內部驗證：

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 預期返回 {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 Docker Desktop WSL2 的 HTTP 代理可能導致 LiteLLM 在宿主機無法訪問（HEART/空響應），是已知 bug，不影響 NewAPI 經容器名呼叫它。

---

[← 第3章：配置檔案與環境變數](ch03-env.md) · [📖 目錄](index.md) · [第5章：Dify 獨立部署 →](ch05-dify-deploy.md)
