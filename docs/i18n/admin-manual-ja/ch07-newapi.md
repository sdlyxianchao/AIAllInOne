# 第7章：NewAPI：初期化・チャネル・OIDC

*第一部 · デプロイ編*

> 初期インストールウィザードの完了、LiteLLM を指すチャネルの設定、API Key の発行、Keycloak OIDC への接続。

[← 第6章：Keycloak：Realm・ユーザー・AD](ch06-keycloak.md) · [📖 目次](index.md) · [第8章：LiteLLM：検証とキャッシュ →](ch08-litellm.md)

---

## 7.1 初期インストールウィザード（初回アクセス）

NewAPI は初回起動時に 4 ステップのシステム設定ウィザードを表示します：

1. **データベースチェック**：「データベース接続を検証」をクリックし、緑のチェックを確認。

2. **管理者アカウント**：ユーザー名 `ai_all_in_one_admin`、メール `ai_all_in_one_admin@<会社ドメイン>`、パスワードは統一管理者パスワード。

> 📌 なぜ先にローカル管理者を作るか：この時点では OIDC が未設定で、NewAPI は Keycloak を認識しません。まずローカルアカウントで「入門」して設定を完了し、それからシステム設定で OIDC を有効にします。

3. **利用モード**：「個人利用」を選択（社内：従業員が登録でき、利用量を分けて表示、チャージ/課金モジュールなし）。

4. **初期化確認**：データベーステーブル作成 → 管理者でログイン。

## 7.2 LLM チャネルの設定（LiteLLM を指す）

1. **チャネル** → 新規チャネル追加 → タイプ `OpenAI`；

2. Base URL に `http://litellm:4000` を入力（コンテナ名。Docker ネットワーク経由。**localhost ではない**）；

3. キーに `.env` の `LITELLM_MASTER_KEY` の実際の値を入力（サンプル値だと `No connected db` エラー）；

4. モデルに `deepseek-chat` を入力（サンプル。実際の設定に合わせる）；

5. 保存 → 「テスト」をクリックして接続を確認。

複数の provider を設定する場合は同様に追加します：Claude タイプ `Anthropic Claude`、DeepSeek タイプ `OpenAI`、Base URL はいずれも `http://litellm:4000`。

## 7.3 API キーの作成

Dify と DSH Desktop 用に 1 つずつ作成し、利用量を分けて集計します：

1. 左側 **API キー** → 新規作成；

2. 名前 `dify-key` → 保存 → `sk-xxx` をコピー（Dify モデルプロバイダーに記入）；

3. さらに `dsh-key` を作成 → `sk-xxx` をコピー（DSH Desktop ユーザーに配布）。

## 7.4 一般ユーザーの自己申告 Key 申請を許可

従業員はログイン後、デフォルトで「API キー」ページで自分で Key を作成できます。モデルを実際に呼び出すには次の 2 点が必要です（`.env` にプリセット済み）：

1. **クォータあり**：`DEFAULT_QUOTA=100`（新規ユーザーに 100 ドルのクォータ付与）；

2. **トークンあり**：`GENERATE_DEFAULT_TOKEN=true`（登録時に初期トークンを生成）。

> ⚠️ 「新規登録」ユーザーのみに有効：既にログインしたユーザー（例：`aitest1`）には自動で追加されません。管理者が「ユーザー」ページで手動でクォータを設定する必要があります。

## 7.5 Keycloak OIDC への接続（AD ユーザーの直接ログインを可能に）

### ① Keycloak で NewAPI OIDC Client を作成

1. enterprise-ai Realm → **Clients** → Create client；

2. Client ID `newapi`、タイプ OpenID Connect；

3. **Client authentication：On**（必須。オフだと Credentials タブが出ない）、Standard flow / Direct access grants：On；

4. Valid redirect URIs：`http://<サーバーIP>:3000/*` と `http://127.0.0.1:3000/*`；

5. 保存 → Credentials タブ → Client secret をコピー。

### ② NewAPI で OIDC を有効化

NewAPI 管理画面 → **システム設定 → 認証 → カスタム OAuth → OAuth プロバイダー追加**で、以下を入力：

| グループ | 設定項目 | 値 |
| --- | --- | --- |
| クイック設定 | プリセットテンプレート / API アドレス | `Keycloak` / `http://127.0.0.1:9090` |
| 基本情報 | プロバイダー名 / 識別子 | `Keycloak` / `keycloak` |
| 認証情報 | Client ID / Secret | `newapi` / Keycloak からコピーした値 |
| エンドポイント | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| フィールドマッピング | ユーザー ID / ユーザー名 / メール | `sub` / `preferred_username` / `email` |

「自動検出」でエンドポイントを入力後、**トークンエンドポイントとユーザー情報エンドポイントを `host.docker.internal:9090` に変更**します（NewAPI コンテナ内部が Keycloak を呼び出すため）。認可エンドポイントは `<サーバーIP>:9090` のまま（ブラウザ遷移用）。スコープは `openid profile email`。

> ⚠️ 変更必須の 2 点。怠るとログイン失敗：
> - **保存後に Keycloak に戻ってコールバック URL を追加**：`http://<サーバーIP>:3000/oauth/keycloak` と `http://127.0.0.1:3000/oauth/keycloak` を Valid redirect URIs に追加；
> - **NewAPI「サーバーアドレス」をイントラネットアドレスに設定**：システム設定 → 一般設定 → サーバーアドレスを `http://<サーバーIP>:3000` に変更（デフォルト localhost だとトークン交換時に `invalid_grant - Incorrect redirect_uri` エラー）。変更後はローカルでもイントラネット IP で NewAPI にアクセスします。

データベースを変更する方法：

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<サーバーIP>:3000') ON DUPLICATE KEY UPDATE value='http://<サーバーIP>:3000';"
docker compose restart new-api
```

> ⚠️ トラブルシュート：ログインが **429 Too Many Requests** を返す——NewAPI の重要インターフェースのレート制限（デフォルト 20 回/20 分）が発動。一時解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；恒久対策は `.env` に `CRITICAL_RATE_LIMIT_ENABLE=false` など 4 組の変数をプリセット済み。

> 📖 公式ドキュメント：NewAPI 公式ドキュメント https://docs.newapi.pro · 公式サイト https://www.newapi.ai · オープンソースリポジトリ https://github.com/QuantumNous/new-api

---

[← 第6章：Keycloak：Realm・ユーザー・AD](ch06-keycloak.md) · [📖 目次](index.md) · [第8章：LiteLLM：検証とキャッシュ →](ch08-litellm.md)
