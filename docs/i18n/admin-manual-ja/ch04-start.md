# 第4章：コアサービスの起動

*第一部 · デプロイ編*

> .env のコピー、コンテナ起動、サービスごとのアクセス確認、Ghost の SQLite 既知問題の対処。

[← 第3章：設定ファイルと環境変数](ch03-env.md) · [📖 目次](index.md) · [第5章：Dify の独立デプロイ →](ch05-dify-deploy.md)

---

## 4.1 .env のコピー

```
# PowerShell
copy .env.windows .env
```

Docker Compose はデフォルトで `.env` を読み込みます。

## 4.2 全コアサービスの起動

```
docker compose -f docker-compose.yml up -d
```

初回はすべてのイメージを取得します（約 5–10 分、ネットワーク速度に依存）。

| イメージ | コンテナ | サイズ |
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

## 4.3 コンテナ状態の確認

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

期待されるのは 10 個のコアコンテナがすべて `Up` であること。継続的に `Restarting` になるコンテナがあれば `docker logs コンテナ名` で原因を確認します。

## 4.4 既知問題の修正：Ghost の SQLite 強制

`ghost` がずっと Restarting で、ログに `Error: connect ECONNREFUSED <サーバーIP>:3306` と出る場合——データボリューム内に MySQL を指す古い `config.production.json` が残っていることを示します。修正：compose の ghost サービスの `environment` で明示的に SQLite を宣言します：

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

> ⚠️ Windows + Docker Desktop WSL2 では、ボリュームデータは WSL2 仮想ディスク内に封じられ、ホストマシンの git bash からは見えないため、ボリューム内の `config.production.json` を直接削除できず、「環境変数による上書き」という手段しか取れません。`docker volume rm windows_ghost-data` も実行しないでください（公開済み記事が失われます）。

> ✅ 検証：ログに `Ghost database ready` + `Ghost booted` が出て、`curl.exe -I http://127.0.0.1:8090` が 200 を返すこと。

## 4.5 サービスごとのアクセス確認

```
# Keycloak — 302 なら OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302（/ghost/ 初期化ページへリダイレクト）
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403（空ディレクトリ、nginx 稼働中）
curl.exe -I http://127.0.0.1:8091
# AI 管理センター — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM は純粋な API で Web 画面がないため、コンテナ内部から検証します：

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 期待される戻り値 {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 Docker Desktop WSL2 の HTTP プロキシにより、LiteLLM がホストマシンからアクセスできないことがあります（HEART/空レスポンス）。これは既知のバグで、NewAPI がコンテナ名で呼び出すことには影響しません。

---

[← 第3章：設定ファイルと環境変数](ch03-env.md) · [📖 目次](index.md) · [第5章：Dify の独立デプロイ →](ch05-dify-deploy.md)
