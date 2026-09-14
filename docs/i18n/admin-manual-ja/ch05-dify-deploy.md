# 第5章：Dify の独立デプロイ

*第一部 · デプロイ編*

> Dify は公式 compose（約 15 コンテナ）で独立デプロイし、ポート競合を回避します。

[← 第4章：コアサービスの起動](ch04-start.md) · [📖 目次](index.md) · [第6章：Keycloak：Realm・ユーザー・AD →](ch06-keycloak.md)

---

> 📌 Dify は公式 docker-compose（約 15 コンテナを含む）を使用し、ポート競合を避けるため独立デプロイします。自身のデフォルトネットワーク（コアサービスの `ai-platform` ネットワークとは異なる）を使用します。

## 5.1 Dify のクローン

```
# 案A：GitHub（アクセス可能な場合）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 案B：Gitee 公式ミラー（中国国内推奨）
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 互換性の修正 + 環境変数のコピー

```
cd dify\docker

# env_file 形式の修正（旧版 Docker Compose との互換性）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# メイン環境変数のコピー
copy .env.example .env

# 全サブテンプレートのコピー（sandbox.env など）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Dify 1.16.1 の上流検証問題の修正（必須）
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 検証
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ なぜ `GRAPH_ENGINE_SCALE_UP_THRESHOLD` を変更しなければならないか：Dify 1.16.1 はこのフィールドを「0 を許可」から「0 より大きい必須」に変更しましたが、`shared.env` テンプレートはまだ 0 のままです。変更しないと `dify-api-1` / `worker` / `worker_beat` / `api_websocket` の 4 コンテナが起動直後にクラッシュし、ログに `ValidationError: Input should be greater than 0` と表示されます。

## 5.3 Dify の起動

```
docker compose up -d
docker compose ps
```

> ✅ 全コンテナが `Up`（`init_permissions` が Exited と表示されるのは正常）。ブラウザで `http://127.0.0.1/install` を開いて管理者アカウントを初期化します。

## 5.4 WebSocket アドレスの修正（変更しないと ws://localhost に何度も接続）

`.env` の `NEXT_PUBLIC_SOCKET_URL` はデフォルトで `ws://localhost` です。イントラネットデプロイ時、ブラウザ内の localhost はユーザー自身の PC を指すため、フロントエンドが繰り返し接続できなくなります（アプリ作成/ワークフローデバッグが固まります）。

```
# .env でイントラネット IP に変更
NEXT_PUBLIC_SOCKET_URL=ws://<サーバーIP>

# docker-compose.yaml の web サービスの fallback も同期変更
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<サーバーIP>}

# web コンテナを再構築して反映
docker compose up -d web
```

> 📌 変更後はブラウザを強制リロード（Ctrl+F5）。この変数は実行時に読み込まれるため、.env 変更 + web 再起動で十分で、イメージ再構築は不要です。

## 5.5 落とし穴クイックリファレンス

> ⚠️ **ログインパスワードは base64 で送信**：Dify 1.16.x のログイン API `POST /console/api/login` の `password` は base64 エンコード後のパスワードです。スクリプトログインでは先に `base64(パスワード)` が必要です。フロントエンドで「ログインが反応しない」場合、console の `GET /account/profile 401` は未ログイン時の正常な現象です。

> ⚠️ **管理者パスワードを忘れた場合のリセット**：Dify のパスワードハッシュは `pbkdf2_hmac('sha256', password, salt, 10000)`（反復 10000 回）で、逆算できません。コンテナコマンドでリセットします（新しいパスワードは 8 文字以上）：

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<会社ドメイン> \
  --new-password '<新しいパスワード>' \
  --password-confirm '<新しいパスワード>'
```

> 📖 公式ドキュメント：Dify 公式ドキュメント https://docs.dify.ai · セルフホストデプロイ https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第4章：コアサービスの起動](ch04-start.md) · [📖 目次](index.md) · [第6章：Keycloak：Realm・ユーザー・AD →](ch06-keycloak.md)
