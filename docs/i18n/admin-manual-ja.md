# AI AllInOne 管理者マニュアル

*v0.2 · デプロイ · 管理 · 運用*

**第一部 · デプロイ編**

## 1. プラットフォーム概要とアーキテクチャ

### 1.1 このプラットフォームとは
「AI AllInOne」は**企業内網 AI プラットフォーム**で、十数個のオープンソース製品を Docker で一つの全体にオーケストレーションします：統合認証、LLM ルーティング、PII マスキング、AI アプリケーション、企業ポータル、ソースコード CI、クライアント配布、統合管理、監視・アラート、可観測性、ログ、バックアップ・復元——すべてを接続し、かつ**1 つの Keycloak アカウントですべての製品にシングルサインオン**します。
| レイヤー | コンポーネント | 役割 |
| --- | --- | --- |
| 統合認証 | Keycloak | SSO / OIDC。AD/LDAP またはローカルアカウントに接続可能 |
| LLM ルーティング | NewAPI | チャネル、キー、クォータ、監査、コスト |
| PII マスキング | LiteLLM + Presidio | モデル呼び出し前に携帯番号/身分証番号/メールなどを自動マスキング |
| AI アプリケーション | Dify | ビジュアル AI アプリ / Agent / ナレッジベースプラットフォーム |
| 企業ポータル | Ghost | お知らせ、ニュース、ダウンロードセンター、従業員 Hub |
| ソースコード / CI | Gitea + Runner | 社内 Git リポジトリ + Actions 自動化 |
| クライアント | DeepChat | ローカル AI デスクトップクライアント（Win/macOS/Linux） |
| クライアント配布 | 更新サーバー | DeepChat インストーラのホスティングと自動更新 |
| 統合管理 | AI 管理センター | 唯一の管理エントリ：Dashboard + 製品埋め込み + 監査/コスト/レポート |
| ゲートウェイ | MCP Gateway | スキル / MCP マーケット管理 |
| 監視・アラート | Prometheus + Grafana + Alertmanager | コンテナリソース監視 + アラート通知 |
| LLM 可観測性 | Langfuse | 各モデル呼び出しの trace / 遅延 / token / コスト |
| 統合ログ | Loki + Promtail | 全コンテナログの集約検索 |
| バックアップ・復元 | backup / restore スクリプト + 管理ページ | 全データの毎日バックアップ + ワンクリック復元 |
### 1.2 ハードウェア・ソフトウェア要件
| 項目 | 最低要件 | 推奨構成 |
| --- | --- | --- |
| OS | Windows 11（Docker Desktop + WSL2 バックエンド） | Windows 11 Pro / Enterprise（Hyper-V で AD ドメインコントローラを追加運用可能） |
| CPU | 4 コア / 8 スレッド | 8 コア / 16 スレッド |
| メモリ | 16 GB | 32 GB |
| ディスク | 60 GB 空き SSD | 150 GB 以上 空き SSD |
| GPU | 独立 GPU 不要 | 独立 GPU 不要 |
> 📌 実測に基づく：約 30 コンテナのアイドル時合計は約 5 GB メモリ。Dify の処理/インデックス、Keycloak JVM、データベースキャッシュなどのピーク時にさらに 3–5 GB 増加し、WSL2 仮想メモリを加えると、16 GB が最低、32 GB が快適値です。すべての大規模モデルは外部 API（deepseek-chat など）を利用し、ローカルで推論しないため**GPU は不要**です。
### 1.3 ポート割り当て表
以下では統一して `<サーバーIP>` をホストマシンの対外アドレスとして使います（現環境は `192.168.31.117`。デプロイ時に自分のイントラネット IP またはドメインに置き換えてください）。
| # | 製品 | 用途 | ローカルアクセス | イントラネットアクセス（従業員） |
| --- | --- | --- | --- | --- |
| 1 | AI 管理センター | 統合管理者ポータル | `127.0.0.1:10086` | `<サーバーIP>:10086` |
| 2 | Keycloak | 認証 / SSO | `127.0.0.1:9090` | `<サーバーIP>:9090` |
| 3 | NewAPI | LLM ルーティングゲートウェイ | `127.0.0.1:3000` | `<サーバーIP>:3000` |
| 4 | LiteLLM | PII マスキングプロキシ | `<サーバーIP>:4001` | —（NewAPI からのみ呼び出し） |
| 5 | Dify | AI アプリケーションプラットフォーム | `127.0.0.1` | `<サーバーIP>`（80 ポート） |
| 6 | Ghost | 企業ポータル | `127.0.0.1:8090` | `<サーバーIP>:8090` |
| 7 | Gitea | ソースコード + CI/CD | `127.0.0.1:3002` | `<サーバーIP>:3002` |
| 8 | 更新サーバー | DeepChat インストーラ | `127.0.0.1:8091` | `<サーバーIP>:8091` |
| 9 | MCP Gateway | スキル / MCP ゲートウェイ | `127.0.0.1:3100` | `<サーバーIP>:3100` |
| 10 | Grafana | 監視ダッシュボード | `127.0.0.1:3030` | `<サーバーIP>:3030` |
| 11 | Prometheus | メトリクス収集 / アラート | `127.0.0.1:9091` | `<サーバーIP>:9091` |
| 12 | Langfuse | LLM 可観測性 | `127.0.0.1:3010` | `<サーバーIP>:3010` |
| 13 | Loki | ログ集約（内部） | `127.0.0.1:3110` | —（管理ページで閲覧） |
| 14 | MailHog | ローカルメール受信 | `127.0.0.1:8025` | `<サーバーIP>:8025` |
> ⚠️ 統一して**イントラネット IP** でアクセスし、`localhost` は使いません（Docker Desktop WSL2 は IPv6 `::1` のサポートが不安定で、ポート転送失敗の原因になります）。データベース（MySQL/Redis/PostgreSQL）はユーザーに公開せず、Docker ネットワーク内部でのみ通信します。
### 1.4 コアデータフロー
#### LLM リクエストフロー（最も重要な経路）
1. **① 転送**：DeepChat / Dify がリクエストを NewAPI に送信（`:3000/v1`）；
2. **② マスキング**：NewAPI が LiteLLM へ転送し、LiteLLM が正規表現 + Presidio で携帯番号/身分証番号/メールなどを `[xxx_REDACTED]` に置換；
3. **③ 外部モデルへリクエスト**：マスキング済みリクエストを DeepSeek / GPT / Claude に送信；
4. **④ PII 復元**：レスポンス返却時に LiteLLM が機密情報を復元；
5. **⑤ 返却**：最終結果がクライアントに戻ります。
#### その他のフロー
- **認証フロー**：Keycloak OIDC SSO で全 Web 製品に統合ログイン（共用 `ai_all_in_one_admin`）；
- **可観測性フロー**：LiteLLM `success_callback` → Langfuse が各呼び出しを追跡；
- **自動更新フロー**：Gitea Actions ビルド → 更新サーバー（:8091）→ DeepChat が `version.txt` を確認して自動ダウンロード・インストール；
- **統合ログフロー**：Promtail が各コンテナログを収集 → Loki に集約 → AI 管理センター「統合ログ」ページで照会。
### 1.5 本書の構成とナビゲーション
本マニュアルは三部構成です：**デプロイ編**（第 1–13 章、ゼロからプラットフォームを起動）、**管理編**（第 14–26 章、13 製品それぞれの日常運用）、**運用編**（第 27–29 章、バックアップ/ヘルスチェック/トラブル対応）。サイドバーからいつでも移動でき、ページ下部に前章/次章のページ送りがあります。
> ✅ デプロイは **AI Agent ツール**（WorkBuddy / OpenClaw など）に任せて自動化することも可能です：本マニュアル + `docker-compose.yml` + `.env.example` + `scripts/` を Agent に渡し、「デプロイ編」の順序に沿って段階的に実行させます（詳細は第 2 章冒頭の Agent デプロイプロンプト参照）。

## 2. 事前準備

### 2.0 2 つのデプロイ方法
本マニュアルは**手動で章ごとに実行**することも、**AI Agent ツールに自動実行させる**こともできます。Agent を使う場合は、本ディレクトリ（本マニュアル、`docker-compose.yml`、`.env.example`、`scripts/` を含む）を Agent に渡し、以下のプロンプトを貼り付けます。
**Agent にコピーするデプロイプロンプト：**
```
あなたは企業内網 AI プラットフォームのデプロイエンジニアです。本ディレクトリの『管理者マニュアル』デプロイ編、docker-compose.yml、.env.example に基づいて、このマシン上で「AI AllInOne」プラットフォームを完全にデプロイ・検証してください。終始日本語でコミュニケーションします。

ステップ1 パラメータ収集（項目ごとに質問し、スキップ・推測しない）：
1) 対外サービスのイントラネット IP；2) スキルマーケットのホスト名（ドメイン。mcp-gateway/skills/skill-market/config.json と SKILL.md の <マーケットホスト名> を置換し、hosts/DNS で解決）；3) アイデンティティソース（AD ドメインコントローラに接続する場合はドメイン/ドメインコントローラ IP/LDAP base DN/bind DN/bind パスワード/sAMAccountName）；4) 統合管理者アカウントのパスワード；5) 大規模モデル API Key；6) 必要に応じてアラート webhook、HTTPS、バックアップ保持ポリシーを確認。

ステップ2 進捗ファイルを生成し、各項目の完了・各問題の解決ごとに更新して報告します。

ステップ3 本マニュアル第 1~13 章の順序に厳密に従い、各章の「⚠️ 重要な落とし穴」に注意し、scripts/ 配下のスクリプトを優先して自動化します。

ステップ4 エラー時はまずログ（docker logs、ヘルスエンドポイント、設定）を確認して根本原因を特定してから修正し、盲目的に再試行しません。

ステップ5 全フロー検証：コンテナ全 Up、Keycloak SSO、NewAPI/LiteLLM 経由の実対話で PII マスキング検証、アイデンティティソースログイン、監視/ログ/アラート、バックアップ復元を、項目ごとに ✅/❌ で集計します。
```
> 💡 Agent を使わない場合も、上記は「デプロイ前情報チェックリスト」として使えます：デプロイ前にイントラネット IP、アイデンティティソース、管理者パスワード、モデル Key の 4 点を明確にしておきます。
### 2.1 Docker Desktop のインストールと設定
Docker Desktop はインストール後デフォルトで WSL2 バックエンドを使うため、通常は追加設定不要です。リソース上限を手動調整する場合は、ユーザーディレクトリに `.wslconfig` を作成します：
```
# %UserProfile%\.wslconfig（例：C:\Users\あなたのユーザー名\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大メモリ（最低 16GB、推奨 24~32GB）
processors=8      # CPU コア数（物理コア数に合わせる）
swap=4GB
```
保存後、PowerShell で `wsl --shutdown` を実行し、Docker Desktop を再起動すると反映されます。
> ✅ 検証：Docker Desktop のステータスバーに "Engine running"（緑）と表示されること。
### 2.2 ディレクトリ構成の準備
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Docker 共有ネットワークの作成
```
docker network create ai-platform
docker network ls | findstr ai-platform   # 検証
```
> すべてのコアコンテナは `ai-platform` ネットワークでコンテナ名によって相互アクセスします（例：NewAPI が LiteLLM にアクセスする際は `http://litellm:4000` を使い、localhost を経由しません）。
### 2.4 ホストマシンのイントラネット IP 固定（重要）
ホストマシンが WiFi 接続の場合、IP は DHCP で動的に割り当てられ、再起動やリース期限切れで変わります。変わると従業員が各製品へアクセスするアドレスがすべて無効になります。ルーターで **DHCP 予約（MAC バインド）** を行うことを推奨します：
1. WiFi アダプタの MAC を確認：`ipconfig /all` で「ワイヤレス LAN アダプター WLAN」の物理アドレスを確認（例：`60-A3-E3-41-8F-61`）；
2. ルーター管理画面（例：`http://192.168.31.1`）にログイン → LAN 設定 / DHCP 静的 IP 割り当て；
3. ルールを追加：MAC → IP（例：`192.168.31.117`）を保存；
4. WiFi に再接続して IP が固定されたことを確認。
> ✅ DHCP 予約の方が Windows 内で静的 IP を設定するより安定します（ルーターで一元管理でき、競合しません）。
### 2.5 ネットワーク疎通（最もつまずきやすい手順）
- **Docker イメージレジストリに接続できる**：Docker Hub / quay.io / ghcr.io。つながらない場合は先にミラーアクセラレータ（例：DaoCloud）を設定します。
- **GitHub に接続できる**：リポジトリのクローン、公開依存の取得。つながらない場合はプロキシを使うか、あらかじめソースパッケージをダウンロードします。
- **対象マシンにイントラネットからアクセスできる**：公開するネットワークセグメントが到達可能であることを確認します。

## 3. 設定ファイルと環境変数

### 3.1 3 つのコア設定ファイル
| ファイル | 用途 | 変更が必要か |
| --- | --- | --- |
| `.env.windows` | すべてのパスワードと外部 API Key | **変更必須**：DeepSeek API Key を記入、その他 provider は必要に応じて |
| `litellm-config.yaml` | LiteLLM モデルリスト + PII マスキングルール | 通常変更しない（DeepSeek のみ使用なら OpenAI/Claude の項目を削除可） |
| `docker-compose.yml` | コアサービスオーケストレーション | 設定済み（Keycloak `KC_HOSTNAME` + 永続化ボリューム含む） |
### 3.2 環境変数の分類概要
`.env`（`.env.windows` からコピー）を開き、優先度順に設定します。
| 変数 | 優先度 | 説明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 今すぐ | 外部 LLM API Key。未設定なら経路がつながらない |
| `LITELLM_MASTER_KEY` | 🔴 今すぐ | LiteLLM 内部認証キー。NewAPI が使用 |
| `NEWAPI_DB_PASSWORD` | 🔴 今すぐ | MySQL root パスワード。初回作成後の変更は非推奨 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 今すぐ | Keycloak 管理者パスワード |
| `NEWAPI_SESSION_SECRET` | 🔴 今すぐ | NewAPI セッション暗号化、ランダム文字列 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 今すぐ | NewAPI データ暗号化、ランダム文字列 |
| `ADMIN_PASSWORD` | 🔴 今すぐ | AI 管理センター Global Admin パスワード |
| `SESSION_SECRET` | 🔴 今すぐ | AI 管理センターセッション暗号化、ランダム文字列 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 後で設定可 | まず Keycloak で OIDC Client を作成して Secret を取得（第 12 章参照） |
| `GITEA_RUNNER_TOKEN` | 🟡 後で設定可 | まず Gitea を起動して管理画面で Token を取得（第 9 章参照） |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 必要時 | 使う場合にコメント解除し、同時に `litellm-config.yaml` も変更 |
| `GLOBAL_WEB_RATE_LIMIT` などのレート制限項目 | ⚪ デフォルト | テスト期間は 999999、本番では適宜引き下げ |
| `DEFAULT_QUOTA` | ⚪ デフォルト | 新規ユーザーのデフォルトクォータ（ドル）。100 なら新規ユーザーに 100 ドル付与 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ デフォルト | 新規ユーザー登録時に初期 Key を自動生成。true ならログイン即利用可 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ デフォルト | デフォルト値で可 |
### 3.3 🔴 今すぐ設定（初回起動前に必須）
| 変数 | 説明 | 入手方法 | 形式 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek クラウド LLM Key | https://platform.deepseek.com に登録 → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM 内部管理者キー（外部 LLM Key ではない） | ランダム生成（下記参照） | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL パスワード | 自分で決める。初回作成後は**変更非推奨** | 任意 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理者パスワード | 自分で決める。8 文字以上 | 任意 |
| `NEWAPI_SESSION_SECRET` | NewAPI セッション暗号化 | ランダム生成 | 32 桁 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI データ暗号化 | ランダム生成 | 32 桁 |
| `ADMIN_PASSWORD` | AI 管理センター管理者パスワード | 自分で決める。8 文字以上 | 任意 |
| `SESSION_SECRET` | AI 管理センターセッション暗号化 | ランダム生成 | 64 桁 |
ランダム文字列の生成（PowerShell）：
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### API Key 記入の例
```
# デフォルトで DeepSeek を設定済み（コメント解除して Key を記入）
DEEPSEEK_API_KEY=sk-あなたの実際のDeepSeekキー

# OpenAI / Claude が必要な場合はコメント解除し、litellm-config.yaml の対応する model ブロックのコメントも解除
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 パスワード変更の方針
> ⚠️ `NEWAPI_DB_PASSWORD` は作成済みデータベースに関わるため、変更後に対応 volume を削除して再構築する必要があります（データ消失）。初回にしっかり決めてください。  
> 
>     `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` などの管理パスワードは各製品の管理画面で変更でき、変更後に `.env` を同期更新します（メモ用であり、実行には影響しません）。
### 3.5 litellm-config.yaml の説明
- `model_list` — 利用可能な外部モデルを定義。NewAPI が LiteLLM 経由で呼び出します。デフォルトでは `deepseek-chat` のみ有効；
- `general_settings.master_key` — LiteLLM 管理者キー。`.env` の `LITELLM_MASTER_KEY` を読み込み；
- PII マスキング（Presidio）は現在**一時的にコメントアウト**（新版 LiteLLM の guardrail API 変更で非互換）。後からの有効化は第 25 章参照；
- 安定版 `v1.95.1` を使用（`main-latest` には既知のバグあり）。

## 4. コアサービスの起動

### 4.1 .env のコピー
```
# PowerShell
copy .env.windows .env
```
Docker Compose はデフォルトで `.env` を読み込みます。
### 4.2 全コアサービスの起動
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
### 4.3 コンテナ状態の確認
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
期待されるのは 10 個のコアコンテナがすべて `Up` であること。継続的に `Restarting` になるコンテナがあれば `docker logs コンテナ名` で原因を確認します。
### 4.4 既知問題の修正：Ghost の SQLite 強制
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
### 4.5 サービスごとのアクセス確認
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

## 5. Dify の独立デプロイ

> 📌 Dify は公式 docker-compose（約 15 コンテナを含む）を使用し、ポート競合を避けるため独立デプロイします。自身のデフォルトネットワーク（コアサービスの `ai-platform` ネットワークとは異なる）を使用します。
### 5.1 Dify のクローン
```
# 案A：GitHub（アクセス可能な場合）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 案B：Gitee 公式ミラー（中国国内推奨）
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 互換性の修正 + 環境変数のコピー
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
> ⚠️ なぜ `GRAPH_ENGINE_SCALE_UP_THRESHOLD` を変更しなければならないか：Dify 1.16.1 はこのフィールドを「0 を許可」から「0 より大きい必須」に変更しましたが、`shared.env` テンプレートはまだ 0 のままです。変更しないと `docker-api-1` / `worker` / `worker_beat` / `api_websocket` の 4 コンテナが起動直後にクラッシュし、ログに `ValidationError: Input should be greater than 0` と表示されます。
### 5.3 Dify の起動
```
docker compose up -d
docker compose ps
```
> ✅ 全コンテナが `Up`（`init_permissions` が Exited と表示されるのは正常）。ブラウザで `http://127.0.0.1/install` を開いて管理者アカウントを初期化します。
### 5.4 WebSocket アドレスの修正（変更しないと ws://localhost に何度も接続）
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
### 5.5 落とし穴クイックリファレンス
> ⚠️ **ログインパスワードは base64 で送信**：Dify 1.16.x のログイン API `POST /console/api/login` の `password` は base64 エンコード後のパスワードです。スクリプトログインでは先に `base64(パスワード)` が必要です。フロントエンドで「ログインが反応しない」場合、console の `GET /account/profile 401` は未ログイン時の正常な現象です。
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<会社ドメイン> \
  --new-password '<新しいパスワード>' \
  --password-confirm '<新しいパスワード>'
```
> ⚠️ **管理者パスワードを忘れた場合のリセット**：Dify のパスワードハッシュは `pbkdf2_hmac('sha256', password, salt, 10000)`（反復 10000 回）で、逆算できません。コンテナコマンドでリセットします（新しいパスワードは 8 文字以上）：
>     
>     📖 公式ドキュメント：Dify 公式ドキュメント https://docs.dify.ai · セルフホストデプロイ https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak：Realm・ユーザー・AD

> 📌 アクセス：ホストマシン `http://127.0.0.1:9090`、イントラネット `http://<サーバーIP>:9090`。データは named volume `keycloak-data` に保存され、コンテナ再構築でも失われません。資格情報は `.env.windows` の `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` 参照。
### 6.1 Realm の作成
1. ブラウザで `http://127.0.0.1:9090` を開く → Administration Console → 管理者ログイン；
2. 左上のドロップダウン → **Create Realm** → Realm name に `enterprise-ai` を入力 → Create。
### 6.2 方法A：ローカルでアカウント作成（AD なしの小規模チーム/テスト）
1. **Groups** → Create Group → `ai-admin`；さらに `ai-user` を作成；
2. **Users** → Add user → ユーザー名 → Create；
3. Credentials タブ → パスワード設定 → Temporary をオフ；
4. Groups タブ → `ai-user` グループに追加。
### 6.3 方法B：Active Directory からアカウントを取り込み（推奨）
会社に既存の Windows AD ドメインコントローラがある場合、従業員はドメインアカウントでログインでき、Keycloak で手動アカウント作成は不要です。前提：Docker コンテナからドメインコントローラネットワークへの疎通が済んでいること（ネットワークトポロジ、Hyper-V Internal Switch、ポート転送は『Keycloak AD 統合ガイド』`windows-ad-integration.html` 参照）。
> 📌 必要な AD アカウント：サービスアカウント `svc_keycloak`（パスワード無期限、LDAP バインド用）+ テスト用ドメインユーザー 2 人（同期検証用）。
#### LDAP ユーザーフェデレーションの作成
1. enterprise-ai Realm → 左側 **User Federation** → Add provider → **ldap**；
2. 下表に従って入力。
| 設定項目 | 値 | 説明 |
| --- | --- | --- |
| Vendor | **Active Directory** | AD を選択。Other を選ばない（objectGUID を認識できなくなる） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 経由のポート転送。本番は `ldap://dc.会社ドメイン:389` を記入 |
| Enable StartTLS | **Off** | LDAP 389 または LDAPS 636 |
| Bind type | **simple** | ユーザー名+パスワード認証 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必ず LDAP DN 形式**。~~DOMAIN\ユーザー~~ は使わない |
| Bind credentials | `svc_keycloak のパスワード` | `.env.windows` 参照 |
| Edit mode | **READ_ONLY** | 読み取り専用。AD に書き戻さない |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 子 OU がある場合は `DC=testcompany,DC=local` に変更 |
| Username LDAP attribute | `sAMAccountName` | **cn を入力しない** |
| RDN LDAP attribute | `cn` | エントリ命名属性 |
| UUID LDAP attribute | `objectGUID` | AD の不変の一意識別子 |
| User object classes | `person, organizationalPerson, user` | カンマ区切り |
| Search scope | **Subtree** | **One Level を選ばない**（子 OU を検索できなくなる） |
| Pagination | **On** | ユーザーが多い場合の分割取得 |
| Referral | **ignore** | 存在しないドメインコントローラへの追従を回避 |
| Import users | **On** | 全量同期取り込み |
| Sync Registrations | **On** | 初回ログイン時に即時同期 |
Save → **Synchronize all users** → 同期完了を待つ。
- ⚠️ よくある入力ミス：
      
        Bind DN は **LDAP 形式**（`CN=svc_keycloak,CN=Users,DC=xxx`）。~~DOMAIN\ユーザー~~ ではない；
- Username LDAP attribute = `sAMAccountName`。`cn` ではない；
- Search scope = **Subtree**；
- **CN のスペースはそのまま保持**：表示名にスペースがある場合（例：`ai all in one admin` の中央がスペース）、Bind DN は `CN=ai all in one admin,...` と書く必要があり、アンダースコアにすると接続できません。
#### AD ログインの検証
1. シークレットウィンドウで `http://127.0.0.1:9090/realms/enterprise-ai/account` を開く；
2. ドメインアカウントでログイン（ユーザー名 `aitest1` または `aitest1@<会社ドメイン>` の UPN のいずれでも可）；
3. Account Console に遷移できれば成功。
### 6.4 その他の企業アイデンティティソース（付録 N の要約）
Keycloak は複数のアイデンティティソースをサポートし、すべて同じ `enterprise-ai` Realm 配下に接続します：
| アイデンティティソース | 接続方法 | ポイント |
| --- | --- | --- |
| Microsoft Entra ID（旧 Azure AD） | Identity Providers → OpenID Connect v1.0 | Azure でアプリを登録して client id/secret を取得。redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google（組み込み） | Mapper で `hd=ドメイン` を追加してドメイン制限可能 |
| GitHub | Identity Providers → GitHub（組み込み） | OAuth App コールバック `/broker/github/endpoint` |
| 汎用 LDAP（OpenLDAP/FreeIPA） | User Federation → ldap | Vendor は Other、Username attribute は `uid` |
| 汎用 SAML 2.0（Okta/ADFS） | Identity Providers → SAML v2.0 | IdP メタデータ URL を貼り付けて自動入力 |
> ✅ 複数アイデンティティソースの共存：Authentication → Browser flow に Identity Provider Redirector を追加し、メールドメインで自動的に IdP を選択できます（`@会社.com`→AD、`@会社.onmicrosoft.com`→Entra ID）。
> 📖 公式ドキュメント：Keycloak 公式ドキュメント https://www.keycloak.org/documentation · サーバー管理ガイド https://www.keycloak.org/server/ · LDAP フェデレーション https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI：初期化・チャネル・OIDC

### 7.1 初期インストールウィザード（初回アクセス）
NewAPI は初回起動時に 4 ステップのシステム設定ウィザードを表示します：
1. **データベースチェック**：「データベース接続を検証」をクリックし、緑のチェックを確認。
> **管理者アカウント**：ユーザー名 `ai_all_in_one_admin`、メール `ai_all_in_one_admin@<会社ドメイン>`、パスワードは統一管理者パスワード。
>         📌 なぜ先にローカル管理者を作るか：この時点では OIDC が未設定で、NewAPI は Keycloak を認識しません。まずローカルアカウントで「入門」して設定を完了し、それからシステム設定で OIDC を有効にします。
3. **利用モード**：「個人利用」を選択（社内：従業員が登録でき、利用量を分けて表示、チャージ/課金モジュールなし）。
4. **初期化確認**：データベーステーブル作成 → 管理者でログイン。
### 7.2 LLM チャネルの設定（LiteLLM を指す）
1. **チャネル** → 新規チャネル追加 → タイプ `OpenAI`；
2. Base URL に `http://litellm:4000` を入力（コンテナ名。Docker ネットワーク経由。**localhost ではない**）；
3. キーに `.env` の `LITELLM_MASTER_KEY` の実際の値を入力（サンプル値だと `No connected db` エラー）；
4. モデルに `deepseek-chat` を入力（サンプル。実際の設定に合わせる）；
5. 保存 → 「テスト」をクリックして接続を確認。
複数の provider を設定する場合は同様に追加します：Claude タイプ `Anthropic Claude`、DeepSeek タイプ `OpenAI`、Base URL はいずれも `http://litellm:4000`。
### 7.3 API キーの作成
Dify と DeepChat 用に 1 つずつ作成し、利用量を分けて集計します：
1. 左側 **API キー** → 新規作成；
2. 名前 `dify-key` → 保存 → `sk-xxx` をコピー（Dify モデルプロバイダーに記入）；
3. さらに `deepchat-key` を作成 → `sk-xxx` をコピー（DeepChat ユーザーに配布）。
### 7.4 一般ユーザーの自己申告 Key 申請を許可
従業員はログイン後、デフォルトで「API キー」ページで自分で Key を作成できます。モデルを実際に呼び出すには次の 2 点が必要です（`.env` にプリセット済み）：
1. **クォータあり**：`DEFAULT_QUOTA=100`（新規ユーザーに 100 ドルのクォータ付与）；
2. **トークンあり**：`GENERATE_DEFAULT_TOKEN=true`（登録時に初期トークンを生成）。
> ⚠️ 「新規登録」ユーザーのみに有効：既にログインしたユーザー（例：`aitest1`）には自動で追加されません。管理者が「ユーザー」ページで手動でクォータを設定する必要があります。
### 7.5 Keycloak OIDC への接続（AD ユーザーの直接ログインを可能に）
#### ① Keycloak で NewAPI OIDC Client を作成
1. enterprise-ai Realm → **Clients** → Create client；
2. Client ID `newapi`、タイプ OpenID Connect；
3. **Client authentication：On**（必須。オフだと Credentials タブが出ない）、Standard flow / Direct access grants：On；
4. Valid redirect URIs：`http://<サーバーIP>:3000/*` と `http://127.0.0.1:3000/*`；
5. 保存 → Credentials タブ → Client secret をコピー。
#### ② NewAPI で OIDC を有効化
NewAPI 管理画面 → **システム設定 → 認証 → カスタム OAuth → OAuth プロバイダー追加**で、以下を入力：
| グループ | 設定項目 | 値 |
| --- | --- | --- |
| クイック設定 | プリセットテンプレート / API アドレス | `Keycloak` / `http://127.0.0.1:9090` |
| 基本情報 | プロバイダー名 / 識別子 | `Keycloak` / `keycloak` |
| 認証情報 | Client ID / Secret | `newapi` / Keycloak からコピーした値 |
| エンドポイント | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| フィールドマッピング | ユーザー ID / ユーザー名 / メール | `sub` / `preferred_username` / `email` |
「自動検出」でエンドポイントを入力後、**トークンエンドポイントとユーザー情報エンドポイントを `host.docker.internal:9090` に変更**します（NewAPI コンテナ内部が Keycloak を呼び出すため）。認可エンドポイントは `<サーバーIP>:9090` のまま（ブラウザ遷移用）。スコープは `openid profile email`。
- ⚠️ 変更必須の 2 点。怠るとログイン失敗：
      
        **保存後に Keycloak に戻ってコールバック URL を追加**：`http://<サーバーIP>:3000/oauth/keycloak` と `http://127.0.0.1:3000/oauth/keycloak` を Valid redirect URIs に追加；
- **NewAPI「サーバーアドレス」をイントラネットアドレスに設定**：システム設定 → 一般設定 → サーバーアドレスを `http://<サーバーIP>:3000` に変更（デフォルト localhost だとトークン交換時に `invalid_grant - Incorrect redirect_uri` エラー）。変更後はローカルでもイントラネット IP で NewAPI にアクセスします。
データベースを変更する方法：
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<サーバーIP>:3000') ON DUPLICATE KEY UPDATE value='http://<サーバーIP>:3000';"
docker compose restart new-api
```
> ⚠️ トラブルシュート：ログインが **429 Too Many Requests** を返す——NewAPI の重要インターフェースのレート制限（デフォルト 20 回/20 分）が発動。一時解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；恒久対策は `.env` に `CRITICAL_RATE_LIMIT_ENABLE=false` など 4 組の変数をプリセット済み。
> 📖 公式ドキュメント：NewAPI 公式ドキュメント https://docs.newapi.pro · 公式サイト https://www.newapi.ai · オープンソースリポジトリ https://github.com/QuantumNous/new-api

## 8. LiteLLM：検証とキャッシュ

> ⚠️ PII マスキング（Presidio guardrail）は現在**一時的に無効**：新版 LiteLLM の guardrail 設定形式が変更され、`litellm-config.yaml` の該当部分はコメントアウトされています。現在 LiteLLM はプロキシ転送のみを行います（マスキングなし）。有効化方法は第 25 章参照。
### 8.1 LiteLLM の基本利用検証
```
curl -X POST http://<サーバーIP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` は LiteLLM 管理者キーで、`.env` の実際の値を取ります（プレースホルダそのままだと 401）。かつ、イントラネット IP `<サーバーIP>:4001` を使う必要があり、`127.0.0.1:4001` は使えません（WSL2 ポート転送の問題）。
### 8.2 レスポンスキャッシュ（組み込み済み、token 節約）
LiteLLM は Redis exact match キャッシュを有効にしています：完全に同一のリクエスト（モデル+メッセージ+パラメータ）はキャッシュを直接返し、ユーザー間で共有して token を節約します。
```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 独立キャッシュ Redis
    port: 6379
    ttl: 3600            # キャッシュ 1 時間
```
> 検証：`curl http://<サーバーIP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` が `ping_response: true` を返すこと。同じリクエストを連続 2 回行うと、2 回目の所要時間がミリ秒単位に短縮されます。キャッシュ無効化：`cache: false` にして litellm を再起動。
### 8.3 その他の LLM プロバイダーの追加
1. `.env` の `# OPENAI_API_KEY=` のコメントを解除して Key を記入；
2. `litellm-config.yaml` の対応する model ブロックのコメントを解除；
3. `docker compose up -d litellm`。
> 📖 公式ドキュメント：LiteLLM 公式ドキュメント https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Dify / Ghost / Gitea の設定

### 9.1 Dify：モデルプロバイダーの設定
1. `http://<サーバーIP>` を開く → 初回は管理者メール/パスワードを設定（メール `ai_all_in_one_admin@<会社ドメイン>`）；
  - **設定 → モデルプロバイダー** → OpenAI-API-compatible → モデル追加：
        
          モデル名 `deepseek-chat`（実際に合わせる）；
  - API Key：`dify-key` の `sk-xxx`；
  - API endpoint：`http://host.docker.internal:3000/v1`。
3. スタジオ → チャットアシスタント作成 → モデル選択 → メッセージ送信で検証。
> ⚠️ Dify は `host.docker.internal` を使い、コンテナ名は使いません。Dify は自身のネットワーク内にあり、NewAPI と異なるネットワークのためです。
### 9.2 Ghost：ポータルの設定
1. 管理画面入口 `http://<サーバーIP>:8090/ghost/`（**/ghost/ サフィックスに注意**）。初回は setup ウィザードで管理者を作成（メール `ai_all_in_one_admin@<会社ドメイン>`、パスワード 10 文字以上）；
2. 自動化：直接 `scripts\ghost-setup.ps1` を実行して setup API で管理者を一度に作成。ウィザードと同等（初期化済みなら自動スキップ）；
3. **テーマ**：外観 → テーマ。同梱の Casper/Source を直接アクティブ化；
4. **ナビゲーションメニュー**：外観 → メニュー → 「メインナビゲーション」を作成。
| メニュー項目 | タイプ | URL |
| --- | --- | --- |
| ホーム | ページ | `/` |
| ニュース | カテゴリ | `/category/news` |
| ダウンロードセンター | ページ | `/downloads` |
| AI ワークベンチ | カスタムリンク | `http://<サーバーIP>` |
| ヘルプドキュメント | カテゴリ | `/category/docs` |
1. **ダウンロードセンターページ**：ページ → 「ダウンロードセンター」を新規作成（slug `downloads`）。内容に DeepChat インストーラのイントラネットリンクを配置。
```
## DeepChat エンタープライズ版
### Windows
- [DeepChat v1.1.0（Windows x64）](http://<サーバーIP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0（macOS x64）](http://<サーバーIP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ ポータルホーム `/` で「登録」をクリックしない——それは訪問者購読者の登録です（SMTP 未設定だと 500）。管理者入口は `/ghost/`。GitHub から最新版テーマをインストールしない（Ghost 6.x 向けの可能性があり、5.x では incompatible エラー）。
### 9.3 Gitea：初期化と Runner 登録
1. `http://<サーバーIP>:3002` を開く → インストールウィザード（SQLite データベースはプリセット済み）→ 管理者作成（ユーザー名 `ai_all_in_one_admin`）；
2. 右上のアバター → **Site Administration → Actions** → Enabled Actions がオンであることを確認；
3. **Runners → Create new Runner** → Registration Token をコピー；
4. Token を `.env` の `GITEA_RUNNER_TOKEN` に記入し、Runner を再構築：
```
# ⚠️ 必ず up -d を使う。restart は不可（restart は .env の token を再読み込みしない）
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ 落とし穴 1：`readonly database` エラーは多くの場合 `gitea.db` が root 所有になっているため。root 所有の db を削除し、git ユーザーで再構築させます。  
> 
>     ⚠️ 落とし穴 2：`ROOT_URL` を `http://<サーバーIP>:3002/` に設定する必要があります。しないと生成されるリポジトリリンクが localhost になり、従業員が開くと無効です。
> 
>     📖 公式ドキュメント：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中国語） https://docs.gitea.com/zh-cn

## 10. DeepChat の配布と CI/CD

### 10.1 配布経路
配布経路 = GitHub Releases インストーラ → `deepchat-sync` リポジトリの Gitea Actions → 更新サーバー（:8091）→ Ghost ダウンロードページ → 従業員がダウンロード。
> 📌 `deepchat` ソース mirror リポジトリは削除済み——mirror は git ソースのみ同期し、release インストーラは同期しないため配布には無用です。ソース監査/二次開発を行う場合に別途作成します。
### 10.2 インストーラの更新サーバーへのダウンロード
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
検証：`curl -I http://<サーバーIP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206。その後 Ghost ダウンロードページを更新（第 9 章参照）。
### 10.3 自動同期（Gitea Actions、推奨）
| コンポーネント | 説明 |
| --- | --- |
| `deepchat-sync` リポジトリ | 通常リポジトリ（mirror は不可）。`.gitea/workflows/sync.yml` + `update_ghost.py` を配置 |
| トリガー | `schedule`（毎日 UTC 2 時）+ `workflow_dispatch`（手動） |
| ロジック | GitHub の最新 tag を確認 → `version.txt` と比較 → 新バージョンがあればダウンロード + Ghost ダウンロードページ更新 + バージョン書き込み |
```
# 手動トリガー
curl -X POST "http://<サーバーIP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<パスワード>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ 重要な落とし穴：① act_runner の `container.network` は `config.yaml`（+`CONFIG_FILE` 環境変数）で設定する必要があります。しないと job コンテナが `gitea` ホスト名を解決できません；② docker.sock は runner が自動マウントするので、options で再度マウントしない（Duplicate mount point エラー）。
### 10.4 中国国内ダウンロードソース設定（sync-config.json）
公式サイト `deepchatai.cn` ダウンロードページのインストーラは依然 GitHub を指しており、中国国内ではほぼつながりません。本当の解決は `sync-config.json` です：
| フィールド | 役割 | デフォルト |
| --- | --- | --- |
| `version_source` | `github`（GitHub API が最も正確）または `official`（公式サイトキャッシュ、到達可だが遅延） | `github` |
| `download_prefix` | ダウンロード加速プレフィックス。例：`https://ghproxy.com/` | `""` |
| `keep_releases` | バージョン履歴の保持数 | `5` |
| `market_url` | ダウンロードページ「まずスキルマネージャーをインストール」のイントラネットマーケットアドレス | `http://<サーバーIP>:3100` |
```
# GitHub に接続できる場合：デフォルトのまま変更しない
{ "version_source": "github", "download_prefix": "" }
# GitHub 加速プロキシ（最も一般的）
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 ワークフロー内蔵の `version_cmp.py` でバージョン比較し、「最新版 > ローカル版」の場合のみダウンロードします（公式サイトキャッシュの遅延でクライアントが旧版に戻るのを回避）。
### 10.5 方法B：Docker でカスタムバージョンをビルド（任意）
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# コンテナ内
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# 成果物は dist/ にあり、終了後に deepchat-updates/ にコピー
```
### 10.6 DeepChat クライアントの設定（従業員側）
1. DeepChat → 設定 → モデルサービス → カスタム Provider / OpenAI 互換；
2. API Base URL：`http://<サーバーIP>:3000/v1`（必ずイントラネット IP）；
3. API Key：`deepchat-key` の `sk-xxx`；
4. モデル：`deepseek-chat`。保存後にテスト対話。
> 📖 公式ドキュメント：DeepChat クイックスタート https://deepchatai.cn/docs/guide/getting-started/ · オープンソースリポジトリ https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway とスキルマーケット

> 📌 MCP Gateway は公式 `@modelcontextprotocol/sdk` を基盤とし、標準 Streamable HTTP `/mcp` エンドポイントを公開します。メイン `docker-compose.yml` に統合済み（ポート 3100）で、コアサービスとともに起動します。ソースは `mcp-gateway/`。
### 11.1 組み込みプラットフォームツール
| ツール | 用途 |
| --- | --- |
| `platform_time` | サーバーの現在時刻を返す |
| `platform_echo` | テキストをエコー（接続テスト） |
| `platform_services` | プラットフォームサービスの一覧を表示 |
### 11.2 外部 MCP Server の集約
`mcp-gateway/mcp-servers.json` を編集し、stdio または http タイプを追加して `mcp-gateway` を再起動すると反映されます：
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
集約したツールには自動で `{serverName}_` プレフィックスが付き、重複を防ぎます。
### 11.3 クライアント接続
1. DeepChat：設定 → MCP → サーバー追加 → タイプ「ストリーミング可能な HTTP」、URL `http://<サーバーIP>:3100/mcp`；
2. Dify ワークフロー：カスタムツール / MCP ツール設定を同じアドレスに向けます。
> 検証：`curl http://<サーバーIP>:3100/health` が `{"status":"ok"}` を返すこと。`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` がツールリストを返します。
### 11.4 スキルマーケット（イントラネットスキルパッケージ配布）
| エンドポイント | 役割 |
| --- | --- |
| `/market` | スキルマーケットページ（カード閲覧 + ZIP ダウンロード + インストールアドレスコピー） |
| `/skills` | スキル一覧 JSON（name/description/version） |
| `/skills/<名前>.zip` | スキルパッケージのダウンロード（動的パッキング） |
スキルは `mcp-gateway/skills/` ディレクトリ（SKILL.md を含むサブディレクトリ）に置き、**リクエストごとに自動スキャンされ、再起動不要**。組み込みの `skill-market` ガイドスキルがあります。
> 📌 DeepChat における MCP と Skill は別概念です：MCP は「ツール」（function calling）、Skill は「エージェントスキルパッケージ」（SKILL.md + スクリプト）。DeepChat の Skill には「カスタムマーケット URL」がなく、フォルダ/ZIP/URL の 3 方式のインストールのみ対応。イントラネット配布は「URL インストール」で実現します。
### 11.5 ⚠️ スキルマーケットのホスト名（デプロイパラメータ、置換必須）
「スキルマネージャー」は `config.json` の `market_url` を読み、`/skills` 一覧を要求します。重要な 2 点：
- **ホスト名を使い、IP は使わない**：DeepChat の agent 環境は IP を `[IP_ADDRESS_REDACTED]` にマスキングするため、実際のアドレスを読み取れなくなります；
- **ホスト名はデプロイパラメータ**：各デプロイで異なるため、そのままコピーできません。
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<マーケットホスト名>:3100" }
```
##### 自動（Agent でデプロイ）
Agent はパラメータ収集時に「スキルマーケットのホスト名」を尋ね、`config.json` と `SKILL.md` 内の `<マーケットホスト名>` を自動置換します。
##### 手動
1. `config.json` + `SKILL.md` のフォールバックアドレスを編集し、`<マーケットホスト名>` を置換；
2. ホスト名を解決可能にする：単一マシンでは `C:\Windows\System32\drivers\etc\hosts` に `<サーバーIP>  <ホスト名>` を追加。会社イントラネットでは DNS に A レコードを追加。
> ✅ ホスト名は「サービス名+会社ドメイン」の FQDN を推奨。例：`skillmarket.あなたの会社ドメイン`。DNS に A レコード追加：ドメインコントローラ「DNS → 前方参照ゾーン → あなたのドメイン → 新しいホスト(A)」、または `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "あなたのドメイン" -IPv4Address "<サーバーIP>"`。
### 11.6 管理 API（AI 管理センターの増改削用）
| エンドポイント | 役割 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server の CRUD（設定に書き戻し+自動再接続） |
| `POST /api/skills/upload` | スキル zip アップロード（SKILL.md 検証、パストラバーサル防止） |
| `DELETE /api/skills/:name` | スキル削除 |
`X-Admin-Token` ヘッダーが必要（`.env` の `MCP_ADMIN_TOKEN`）。AI 管理センター「MCP Gateway」ページが代理呼び出しします（`ai-platform-admin` ロールで保護）。
> 📖 公式ドキュメント：MCP プロトコル公式 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. AI 管理センター

> 📌 位置づけ：Docker 管理プラットフォーム（1Panel/Portainer）ではなく、管理者向けの統合バックエンド——Keycloak 認証 + 左メニューで全製品にリンク + Dashboard クラスタ状態 + 統合管理者アカウント。
### 12.1 コア機能
| メニュー項目 | 動作 | 説明 |
| --- | --- | --- |
| 📊 概要ダッシュボード | 埋め込みページ | 8 製品の業務指標 + Docker サービス（製品別グループ）+ システム情報 |
| Ghost / Dify / Gitea / Keycloak | 埋め込み統計ページ | 先に統計を見て、「バックエンドを開く」をクリックして遷移 |
| 🔀 NewAPI 管理 | 埋め込みページ | チャネル/ユーザー/キー + コストレポート + 監査ログ |
| 🔌 MCP Gateway | 埋め込み管理ページ | MCP Server の増減、スキルのアップロード/削除 |
| 📈 監視 / 🔍 可観測性 | 新規タブ | Grafana :3030 / Langfuse :3010 |
| 📜 統合ログ | 埋め込みページ | コンテナ+キーワード+時間で Loki を照会 |
| 💾 バックアップ・復元 | 埋め込みページ | バックアップリスト + 即時バックアップ + ワンクリック復元 |
| 🩺 可用性テスト | 埋め込みページ | 定期+手動で全経路をテスト |
| 📄 レポート生成 | 埋め込みページ | カスタム期間で .md をエクスポート |
| ⚙️ システム設定 | 埋め込みページ | UI 言語 9 種 + 製品入口 URL |
### 12.2 Global Administrator の初期化
```
# .env で設定
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=アカウントパスワード一覧参照
ADMIN_EMAIL=ai_all_in_one_admin@<会社ドメイン>
```
起動後に自動で Keycloak に `ai_all_in_one_admin` ユーザーを作成（既存ならスキップ）し、`ai-platform-admin` Realm Role を割り当てます。核心理念：**1 つの Global Admin アカウントで全プラットフォームを管理**。
### 12.3 Docker Compose デプロイ
```
# 前提：先に依存関係をインストール（1 回）
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<サーバーIP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<会社ドメイン>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<サーバーIP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Keycloak クライアント設定
1. Keycloak → enterprise-ai → Clients → Create；
2. Client ID `AI-all-in-one-admin-portal`、Client authentication / Standard flow を On；
3. Valid Redirect URIs：`http://127.0.0.1:10086/*` と `http://<サーバーIP>:10086/*`；
4. Client Secret をコピー → `.env` の `KEYCLOAK_CLIENT_SECRET` に記入 → `docker compose up -d admin-portal`；
5. Realm Role `ai-platform-admin` を作成し、`ai_all_in_one_admin` に割り当て。
- ⚠️ デプロイ/トラブルシュートの要点：
      
        admin-portal のセッションはメモリ保存で、`up -d` でコンテナを再構築すると**ログインセッションが消えます**（再ログイン必要）；
- ホーム `/` は必ず Keycloak 保護にする（`express.static(..., {index:false})` + 明示的な `app.get('/', keycloak.protect())`）。しないと未ログイン時に空のダッシュボードが直接描画されます；
- Dify 統計は実際の管理者メール（`ai_all_in_one_admin@<会社ドメイン>`、AD グローバル管理者と一致）を使います；
- **server.js 変更後は必ず `docker restart admin-portal`**。`up -d` は使えません（volume ファイル内容の変化は再構築をトリガーしません）。
### 12.5 検証
1. `http://<サーバーIP>:10086` を開く → 自動で Keycloak ログインへ遷移（未ログイン時は空ダッシュボードを表示しない）；
2. `ai_all_in_one_admin` でログイン → 概要ダッシュボードへ；
3. Dashboard に 8 製品の指標 + コンテナグループが表示；
4. 各製品で先に統計を見て、「バックエンドを開く」をクリックして遷移；
5. システム設定で 9 言語に切り替え可能。
### 12.6 モジュール別管理者認可 + Keycloak ページ管理（v0.91）
グローバル管理者は AI 管理センターから他の管理者と Keycloak を直接管理できます：
- **管理者アカウント管理**：Keycloak 連携 IdP から既存アカウントを検索（AD/LDAP ユーザー、新規作成なし・パスワード不要）→ モジュールを選択 → 確定。システムは `admin:<製品>` Realm Role を付与し、**実際に製品へプロビジョニング**（SSO 優先・API フォールバック）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。モジュールの取消や管理者の削除は**製品からアカウントを削除**します。SSO なし製品は仮パスワードを生成し 🔑 アイコンで確認可能（グローバル管理者のみ）。非管理者は「管理者ではありません」と表示されサインアウトします。
- **Keycloak ページ**：「すべて同期 / 変更を同期」ボタンで AD 属性変更をワンクリック反映；各ユーザー行に「編集」（Keycloak コンソールへ）と「削除」；ロール欄は作成/削除/メンバー確認に対応。同期/削除/ロール操作はグローバル管理者のみ。
> ⚠️ 注意：Keycloak に「単一ユーザー同期」エンドポイントはなく、増分同期は AD の変更済みアカウントをすべて同期します。AD フェデレーションユーザーは次回の全量同期または SSO ログインで再び現れます。完全に削除するには AD で無効化/削除してください。

## 13. 相互接続検証チェックリスト

デプロイ編はここで終了です。最後に以下の 12 項目を順に検証し、すべて ✅ になればプラットフォームが本当に稼働していることを示します。
| # | 相互接続 | 検証方法 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI チャネルテストで OK を受信 |
| 2 | Dify → NewAPI | Dify モデルプロバイダーテストで応答を受信 |
| 3 | DeepChat → NewAPI | DeepChat でメッセージ送信し応答を受信 |
| 4 | Keycloak → NewAPI | Keycloak アカウントで OIDC ログイン NewAPI |
| 5 | Keycloak → Dify | Keycloak アカウントで SSO ログイン Dify |
| 6 | MCP Gateway → DeepChat | DeepChat が MCP ツールリストを取得し呼び出し |
| 7 | MCP Gateway → Dify | Dify ワークフローが MCP ツールを呼び出し |
| 8 | Gitea Runner → Docker | Runner が CI/CD タスクを実行可能 |
| 9 | Gitea → 更新サーバー | CI 成果物を更新サーバーにアップロード可能 |
| 10 | Ghost API → Gitea | Gitea Actions が Ghost API を呼び出してお知らせを発行可能 |
| 11 | Ghost → Dify 遷移 | ポータル「AI ワークベンチ」が正しく Dify へ遷移 |
| 12 | AI 管理センター | Dashboard に全コンテナが表示され、左メニューから全製品にアクセス可能 |
> ✅ すべて通過したら、第二部「管理編」で各製品の日常運用、第三部「運用編」のバックアップ、ヘルスチェック、トラブル対応を学習します。

**第二部 · 管理編（各製品の日常運用）**

## 14. Keycloak の日常管理

Keycloak**入口**：http://<サーバーIP>:9090 → Administration Console → 管理者ログイン。
> 📌 これらの操作の多くは AI 管理センター → Keycloak ページでも実行できます（グローバル管理者のみ）：LDAP 全量/増分同期、ユーザー削除、ロール管理（一覧/作成/削除/メンバー確認）。第 12.6 章参照。
### 14.1 ユーザー管理
1. **新規ユーザー**：Users → Add user → ユーザー名入力 → Create；
2. **パスワード設定**：該当ユーザーの Credentials タブ → パスワード設定 → Temporary をオフ（オンだと初回ログイン時に変更を強制）；
3. **パスワードリセット**：Users → ユーザー検索 → Credentials → Set password；
4. **無効化/有効化**：ユーザー詳細上部の Enabled スイッチ（無効化するとそのユーザーの全 SSO が即時失効）；
5. **削除**：ユーザー詳細 → Delete。
### 14.2 ロールと権限
- **Realm Role**：Realm roles → Create role でロール作成（例：`ai-platform-admin`）；
- **ロール割り当て**：ユーザー → Role mapping → Assign role；
- **グループ**：Groups → グループ作成（`ai-admin` / `ai-user`）→ グループにユーザー追加。ロールをグループに付与し、ユーザーはグループを通じて権限を継承します。
> ✅ 管理権限は `ai-platform-admin` ロールで一元管理します。各製品は SSO 接続時にこのロールで管理者を識別します。
### 14.3 OIDC クライアント（新製品の SSO 接続）
1. Clients → Create client → Client ID に製品名を入力（例：`newapi` / `grafana` / `langfuse`）；
2. Client authentication：On（オフだと Credentials タブが出ない）、Standard flow：On；
3. Valid redirect URIs / Web origins に製品のコールバックアドレスを入力（イントラネット IP + 127.0.0.1 の両方を追加）；
4. 保存 → Credentials タブで Client secret をコピーして製品側に渡します。
### 14.4 AD / LDAP フェデレーションの保守
- **ドメインコントローラ/パスワード変更**：User Federation → LDAP Provider をクリック → Connection URL / Bind credentials を変更 → Save；
- **手動同期**：Synchronize all users；
- **グループマッピング**：Mappers タブ → group-ldap-mapper → Groups DN に AD グループのコンテナを設定し、AD グループを Keycloak ロールにマッピング。
### 14.5 セッション管理
- **アクティブセッションの確認**：Users → 任意のユーザー → Sessions；
- **強制ログアウト**：Sessions → Sign out all；
- **グローバルセッション/トークン設定**：Realm settings → Sessions / Tokens タブでタイムアウト調整。
> ⚠️ 重要な落とし穴の復習：① bind DN の CN のスペースはそのまま保持；② Username LDAP attribute は `sAMAccountName` で `cn` ではない；③ Search scope は Subtree を選択；④ SSO で `unknown_error` が出るのは多くの場合ホストマシンの iphlpsvc が停止して AD ポート転送が失効しているため；⑤ AD ドメインコントローラ VM が起動していない場合、LDAP フェデレーションのアカウントログインは `LDAP Connection refused` を返します。
> 📖 公式ドキュメント：Keycloak 公式ドキュメント https://www.keycloak.org/documentation · サーバー管理ガイド https://www.keycloak.org/server/

## 15. NewAPI の日常管理

NewAPI**入口**：http://<サーバーIP>:3000。
### 15.1 チャネル管理（上流モデル）
1. **チャネル追加**：チャネル → 新規チャネル追加 → タイプ OpenAI（または Claude など）→ Base URL `http://litellm:4000` → キー `LITELLM_MASTER_KEY` → モデル名入力 → 保存；
2. **テスト**：チャネルリストの「テスト」をクリックし、モデルを選んで接続検証；
3. **無効化/有効化**：チャネルリストのスイッチ。無効化するとそのチャネルはリクエストを受けなくなります；
4. **優先度/重み**：複数チャネルで同一モデルの場合、優先度/重みで振り分け。
### 15.2 トークン（API Key）管理
1. **新規作成**：API キー → 新規トークン → 名前付け（例：`deepchat-key`）→ クォータ/有効期限/モデル制限を設定可能 → 保存；
2. **Key コピー**：`sk-` で始まり、**一度しか表示されないため即保存**；
3. **無効化/削除**：トークンリストの操作（無効化するとその Key は即時失効）；
4. **利用量確認**：トークン詳細で消費済みクォータを確認。
### 15.3 クォータとユーザー
- **新規ユーザーデフォルトクォータ**：`DEFAULT_QUOTA`（100 ドル推奨）；
- **単一ユーザーの引き上げ**：ユーザーページ → 該当ユーザー編集 → クォータ設定；
- **チャージ/凍結**：ユーザーページの操作；
- **グループ管理**：部署ごとにグループを作成し、モデル倍率/クォータを設定。ユーザーをグループに所属させて部署単位で管理。
### 15.4 ログとコスト
- **ログページ**：各呼び出しのユーザー/モデル/token/クォータ/コスト/送信元 IP を照会；
- **コストレポート**：AI 管理センター「NewAPI 管理」ページにユーザー/モデル/日付別に集約したコストレポート + 直近 100 件の監査ログ。
> 📌 クライアント IP の記録はユーザーの「IP ログ記録」設定（`record_ip_log`、デフォルトオフ）に依存します。IP 監査が必要な場合は該当ユーザーで有効にします。
### 15.5 システム設定の要点
- **サーバーアドレス**：必ずイントラネット `http://<サーバーIP>:3000` に設定（しないと OIDC が `invalid_grant - Incorrect redirect_uri` を返す）；
- **認証 → カスタム OAuth**：Keycloak OIDC 接続（第 7 章参照）；
- **利用モード**：個人利用 ↔ 対外運用を切り替え可能。
> ⚠️ 重要な落とし穴の復習：① チャネル Base URL はすべてコンテナ名 `http://litellm:4000`；② レート制限 429 は `CRITICAL_RATE_LIMIT_ENABLE=false` などの変数で制御；③ データベース変更は `MYSQL_PWD` 環境変数を直接使い、stderr のパスワード警告が誤ってエラー判定されるのを避けます。
> 📖 公式ドキュメント：NewAPI 公式ドキュメント https://docs.newapi.pro · 公式サイト https://www.newapi.ai · オープンソースリポジトリ https://github.com/QuantumNous/new-api

## 16. LiteLLM の日常管理

**入口**：http://<サーバーIP>:4001（純粋な API で Web 画面なし。デバッグは `/v1/models`）。設定は `litellm-config.yaml`。
### 16.1 モデルリストの保守
`litellm-config.yaml` の `model_list` を編集し、モデルと対応する API Key を追加/削除します。新しい provider の追加手順：
1. `.env` の `# OPENAI_API_KEY=` のコメントを解除して Key を記入；
2. `litellm-config.yaml` の対応する model ブロックのコメントを解除；
3. `docker compose up -d litellm`。
### 16.2 レスポンスキャッシュ
Redis exact match キャッシュ。完全に同一のリクエストをユーザー間で共有。`cache_params.ttl`（デフォルト 3600 秒）を調整。無効化：`cache: false` にして再起動。
### 16.3 Langfuse 報告
`success_callback: ["langfuse"]` + `.env` の `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` により各呼び出しを自動報告します。
### 16.4 再起動とトラブルシュート
```
docker compose restart litellm          # 設定変更後の再起動
docker logs litellm --tail 50           # ログ確認
```
> ⚠️ 重要な落とし穴：① guardrails に `default_on: true` を追加しないとグローバルに有効になりません；② PII マスキング（Presidio）は現在上流 API 変更により一時コメントアウトされ、純粋なプロキシのみを行います；③ 安定版 `v1.95.1` を使用（`main-latest` にはバグあり）。
> 📖 公式ドキュメント：LiteLLM 公式ドキュメント https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Dify の日常管理

Dify**入口**：http://<サーバーIP>（80 ポート、独立公式 compose。アップグレード保守は `dify/docker/` で個別操作）。
### 17.1 アプリ管理（スタジオ）
1. **アプリ作成**：スタジオ → 空のアプリ作成 → タイプ選択（チャットアシスタント / Agent / ワークフロー / テキスト生成）；
2. **オーケストレーション**：ノードをドラッグしてプロンプト、ツール、ナレッジベース、変数を組み立て；
3. **デバッグ**：右上の「プレビュー」で実行デバッグ；
4. **公開**：デバッグ通過後「公開」→ 共有リンク生成または Web アプリ埋め込み。
### 17.2 ナレッジベース管理
1. ナレッジベース → ナレッジベース作成；
2. ドキュメントをアップロード（Word / PDF / Markdown / ウェブリンク）。セグメントルール + インデックス方式（高品質/経済）を選択；
3. アプリでこのナレッジベースを「追加」すると、AI がドキュメントに基づいて回答できます。
> 📌 ナレッジベースの内容は AI が回答に使用します。機密資料はアップロードしないでください（データ分類規程を遵守）。
### 17.3 モデルプロバイダー
- **モデル追加**：設定 → モデルプロバイダー → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（NewAPI 経由）+ `dify-key`；
- **システムモデル設定**：デフォルトのチャット/推論/埋め込みモデルを指定。
### 17.4 メンバーと権限
- **メンバー**：メンバーをワークスペースに招待し、Owner/Admin/Editor/Normal ロールを設定；
- **ログイン方式**：設定 → ログイン方式 → OIDC（Keycloak）を接続して SSO 実現。
### 17.5 アップグレードと保守
```
cd dify\docker
git pull                          # 最新版を取得
docker compose pull               # 新イメージ取得
docker compose up -d              # 再構築
```
> ⚠️ 重要な落とし穴：① WebSocket `NEXT_PUBLIC_SOCKET_URL` はイントラネット IP に設定；② ログインパスワードは base64 エンコード；③ パスワード忘れは `docker exec docker-api-1 flask reset-password`（8 文字以上）。
> 📖 公式ドキュメント：Dify 公式ドキュメント https://docs.dify.ai · セルフホスト https://docs.dify.ai/getting-started/install-self-hosted

## 18. Ghost の日常管理

Ghost**入口**：フロント http://<サーバーIP>:8090；バックエンド http://<サーバーIP>:8090/ghost/（/ghost/ サフィックスに注意）。
### 18.1 バックエンドへのログイン
Ghost 5 のバックエンドは**パスワードレスログイン**：メールを入力 → Ghost が 6 桁の認証コードを MailHog（`:8025`）に送信。より速い方法：AI 管理センターで「Ghost バックエンド」の「開く」ボタンをクリックすると自動ログインします（ローカルで TOTP コードを計算し、メール確認不要）。
### 18.2 コンテンツ公開
1. **記事**：Posts → New post → 内容を記述（Markdown エディタ）→ Publish；
2. **ページ**：Pages → New page（例：「ダウンロードセンター」slug `downloads`）；
3. **タグ/カテゴリ**：Tags → カテゴリ作成（例：`news` / `docs`）。記事をカテゴリに分類。
### 18.3 ナビゲーションメニュー
1. バックエンド → 外観（Design）→ メニュー（Navigation）；
2. 「Primary」メインナビゲーションを編集し、ホーム/ニュース/ダウンロードセンター/AI ワークベンチ/ヘルプドキュメントを追加（第 9 章のメニュー表参照）。
### 18.4 テーマ
- **切り替え**：外観 → テーマ。同梱の Casper / Source を直接アクティブ化；
- **インストール**：テーママーケット（Design → Change theme）または zip アップロード。
> ⚠️ GitHub から最新版テーマをインストールしない（Ghost 6.x 向けの可能性があり、5.x では incompatible エラー）。旧版の zip をインストールします。
### 18.5 メンバーと購読（必要な場合）
- Members：購読者を管理；
- 購読が不要な場合はこのモジュールを無視できます（イントラネットポータルでは通常使用しません）。
### 18.6 統合（API Token）
1. バックエンド → Settings → Integrations → カスタム統合を追加；
2. Admin API Key を生成（形式 `id:secret`）。Gitea Actions のお知らせ発行などの自動化に使用します。
> ⚠️ 重要な落とし穴：① ホーム `/` で「登録」をクリックしない（訪問者購読者の登録）；② 6 桁の認証コードの正体は TOTP で、AI 管理センターがローカルで計算可能；③ ローカルでコードを計算しても、Ghost は依然として実際にメールを送信するため、MailHog を保持する必要があります（ないと `Failed to send email`）。
> 📖 公式ドキュメント：Ghost 公式ドキュメント https://ghost.org/docs/ · 管理バックエンド https://ghost.org/docs/admin/

## 19. Gitea の日常管理

Gitea**入口**：Web http://<サーバーIP>:3002；SSH `ssh://git@<サーバーIP>:2222`。
### 19.1 リポジトリと組織
1. **リポジトリ作成**：右上の + → New repository；
2. **組織作成**：+ → New organization。組織配下にリポジトリ作成、チーム管理；
3. **外部リポジトリの移行**：+ → New migration。GitHub アドレスを入力して mirror 可能（ソースの読み取り専用同期）。
### 19.2 ユーザーと権限
- **ユーザー追加**：Site Administration → User Accounts → Create user；
- **リポジトリ権限**：リポジトリ → Settings → Collaborators；
- **組織チーム**：組織 → Teams → チーム作成 → メンバー追加 → リポジトリ権限付与。
### 19.3 Actions / Runner 管理
1. **Actions 有効化**：Site Administration → Actions → Enabled；
2. **Runner 登録**：Runners → Create new Runner → Token コピー → `.env` の `GITEA_RUNNER_TOKEN` に記入 → `docker compose up -d gitea-runner`；
3. **Runner 状態確認**：Runners ページで Idle（緑）表示なら正常；
4. **ワークフロー実行**：リポジトリ → Actions → 手動実行または push トリガー。
> ⚠️ Runner token の変更は必ず `up -d`（restart は .env を再読み込みしません）。
### 19.4 サイト設定
- **ROOT_URL**：`GITEA__server__ROOT_URL` をイントラネット `http://<サーバーIP>:3002/` に設定。しないと生成されるリポジトリリンクが localhost になります；
- **登録ポリシー**：Site Administration → Config で登録スイッチ、メール設定を調整。
> ⚠️ 重要な落とし穴：`readonly database` エラーは多くの場合 `gitea.db` が root 所有になっているため。root 所有の db を削除し、git ユーザーで再構築させます。
> 📖 公式ドキュメント：Gitea 公式ドキュメント（中国語） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. MCP Gateway の日常管理

**入口**：http://<サーバーIP>:3100（マーケットページ `/market`）。管理は AI 管理センター「MCP Gateway」ページで操作（`ai-platform-admin` ロール）、または管理 API を直接呼び出します。
### 20.1 MCP Server の管理
1. `mcp-gateway/mcp-servers.json` を編集してサーバーを増減（stdio/http の 2 種）；
2. `docker compose restart mcp-gateway` で再起動；
3. または AI 管理センター MCP Gateway ページで増減（設定に書き戻し + 自動再接続）。
### 20.2 スキル（スキルパッケージ）の管理
1. **アップロード**：AI 管理センター MCP Gateway ページ → スキル zip アップロード（SKILL.md の存在検証、パストラバーサル防止）；
2. **削除**：該当スキルを削除；
3. スキルは `mcp-gateway/skills/`（SKILL.md を含むサブディレクトリ）に置き、リクエストごとに自動スキャンされ、再起動不要。
### 20.3 組み込みツールの拡張
`mcp-gateway/gateway.js` に 2 ステップ追加します：
```
// ① ツール定義（builtinTools 配列に 1 項目追加）
{ name: 'platform_health', description: 'サービスヘルス状態の照会',
  inputSchema: { type: 'object', properties: {} } }

// ② 実行ロジック（callBuiltin に 1 分岐追加）
if (name === 'platform_health') { return 'すべてのサービスは正常に稼働中'; }
```
変更後 `docker compose restart mcp-gateway`。
### 20.4 skill-market マーケットアドレスの保守
「スキルマネージャー」の `market_url` は `mcp-gateway/skills/skill-market/config.json` + `SKILL.md` にあり、必ずホスト名（IP 不可）を使います。デプロイパラメータです（詳細は第 11 章）。
> ⚠️ 管理 API には `X-Admin-Token` ヘッダーが必要（`.env` の `MCP_ADMIN_TOKEN`）。未設定なら 503、トークン誤りなら 401 を返します。
> 📖 公式ドキュメント：MCP プロトコル公式 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. 更新サーバーの管理

**入口**：http://<サーバーIP>:8091。データは `deepchat-updates/`。
### 21.1 新バージョンの手動配置
1. DeepChat 公式インストーラを `deepchat-updates/deepchat/` にダウンロード；
2. `version.txt` を更新（新しいバージョン番号を書き込み）；
3. 従業員側の DeepChat は自動更新時に `version.txt` を確認し、新バージョンを発見するとダウンロード・インストールします。
### 21.2 自動同期（推奨）
`deepchat-sync` リポジトリの Gitea Actions が毎日自動で GitHub の新バージョンを確認し同期します（第 10 章参照）。手動トリガー：
```
curl -X POST "http://<サーバーIP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<パスワード>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 同期設定（sync-config.json）
| フィールド | 役割 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | ダウンロード加速プレフィックス（例：ghproxy.com） |
| `keep_releases` | バージョン履歴の保持数 |
| `market_url` | ダウンロードページ「スキルマネージャー」のマーケットアドレス |
> 📌 DeepChat クライアントが「モデル接続タイムアウト」を報告するのは、多くの場合クライアントが停止したシステムプロキシ（`ECONNREFUSED 127.0.0.1:33210`）を経由しているため。ユーザーに DeepChat「設定 → ネットワーク/プロキシ」で「プロキシ不使用/直接接続」に変更させます。
> 📖 公式ドキュメント：DeepChat クイックスタート https://deepchatai.cn/docs/guide/getting-started/ · オープンソースリポジトリ https://github.com/ThinkInAIXYZ/deepchat

## 22. 監視・アラート管理

Grafana**入口**：Grafana http://<サーバーIP>:3030（SSO 自動ログイン）；Prometheus :9091；Alertmanager :9093。
### 22.1 コンポーネントとポート
| コンポーネント | ポート | 用途 |
| --- | --- | --- |
| cadvisor | 8080（内部） | 各コンテナの CPU/メモリ/ネットワーク/ディスクを収集 |
| Prometheus | 9091 | メトリクス集約 + アラートルール（`monitoring/alerts.yml`） |
| Grafana | 3030 | 可視化ダッシュボード（プリセット「AI All In One — コンテナ監視」） |
| Alertmanager | 9093 | アラートの重複排除/グループ化/ルーティング/通知 |
### 22.2 ダッシュボードの閲覧
1. Grafana にログイン（`ai_all_in_one_admin` / 統一パスワード、SSO 自動ログイン）；
2. 「AI All In One — コンテナ監視」パネルを開き、各コンテナの CPU/メモリ/ネットワークを確認。
### 22.3 アラートルール
プリセットルール（`monitoring/alerts.yml`）：コンテナ停止（critical）、コンテナメモリ >90%（warning）、コンテナ CPU >80%（warning）。
> ⚠️ アラート誤報の落とし穴：cadvisor はホストマシンの全 cgroup（systemd 含む）を報告するため、アラートルールに `{name!=""}` フィルタを書く必要があります。メモリアラートはさらに `container_spec_memory_limit_bytes > 0` を追加します（ないと limit=0 のゼロ除算で常時発火）。
### 22.4 アラート通知の接続（企業 IM）
アラート経路は **Prometheus → Alertmanager → AI管理センター（`/api/alert-webhook`）→ 企業 IM**。AI管理センターの **「システム運用 → 企業 IM アラート」** メニューで設定します（設定は Redis に保存され再起動後も保持）：
- **受信者**：複数追加可。種別「DingTalk/WeCom/Feishu」＝グループボット（Webhook URL を入力、グループへ送信）；種別「DingTalk アプリ（個人宛）」（AppKey/AppSecret/AgentId/userid）または「WeCom アプリ（個人宛）」（corpId/secret/agentid/userid）＝企業アプリ、個人へ送信。
- **送信ルール**：全体スイッチ、最低重大度（重大/警告/情報）、「発火 firing」/「復旧 resolved」通知の送信有無。
- **送信履歴**：各送信（時刻/受信者/種別/アラート名/重大度/結果）を記録し、ページ送り・ページサイズ調整・キーワード検索・種別/結果/重大度による分類絞り込みに対応。
- 各受信者にはテストメッセージ送信用の「テスト」ボタンと有効スイッチがあります。
> ⚠️ グループボットの Webhook は**グループ**にしか送信できず、個人には送信できません。個人へ送るには「企業アプリ」種別（DingTalk/WeCom）を使い、管理コンソールでメッセージ権限を持つ内部アプリを作成する必要があります。DingTalk のグループボットは「カスタムキーワード」（例「AI 平台」「告警」）または「署名」の設定も必要で、無いとセキュリティポリシーでブロックされます。
> 📌 ポート競合の説明：Prometheus のデフォルト 9090 は Keycloak が使用するため 9091 に変更。Grafana のデフォルト 3000/3001 は使用中のため 3030 に変更。
> 📖 公式ドキュメント：Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. LLM 可観測性（Langfuse）

Langfuse**入口**：http://<サーバーIP>:3010（SSO 自動ログイン、AI 管理センターの入口は `/auth/sso-initiate?provider=KEYCLOAK` を指す）。
### 23.1 コンポーネント
| コンポーネント | 用途 |
| --- | --- |
| langfuse | Web UI + トレース表示（3010） |
| langfuse-worker | 非同期イベント処理 |
| langfuse-postgres | メタデータ保存 |
| langfuse-clickhouse | イベント/トレースデータ保存 |
| langfuse-minio | S3 添付/メディア保存 |
| langfuse-redis | キュー |
LiteLLM は `success_callback: ["langfuse"]` で自動報告します（`.env` の `LANGFUSE_*`）。
### 23.2 トレースの閲覧
1. Langfuse にログイン → 組織 `AI All In One` / プロジェクト `AI Platform` を選択；
2. Traces リストで各呼び出しを確認し、クリックしてプロンプト/レスポンス/モデル/遅延/token/コストを表示；
3. Session で複数ターンの対話を関連付け。
### 23.3 トラブルシュート
- ⚠️ 重要な落とし穴：
      
        `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web と worker の両方）を設定する必要があります。しないと旧 SDK の報告 `trace-create` が失敗しデータが見えません；
- SSO ログインでデータが見えない：SSO アカウント（AD メール）と初期化アカウントが異なるため、Langfuse がどの組織にも属さないアカウントを自動新規作成します。修正（SSO ユーザーを組織に追加）：
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<会社ドメイン>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 公式ドキュメント：Langfuse 公式ドキュメント https://langfuse.com/docs · セルフホスト https://langfuse.com/self-hosting

## 24. 統合ログ（Loki）

**入口**：AI 管理センター「📜 統合ログ」ページ（最も便利）、または Loki http://<サーバーIP>:3110。
### 24.1 コンポーネント
| コンポーネント | ポート | 用途 |
| --- | --- | --- |
| Loki | 3110 | ログ保存と照会（単一マシン、ローカルファイルシステム） |
| Promtail | —（内部） | docker.sock 経由でコンテナを検出し、json ログを収集して Loki に送信 |
### 24.2 ログ照会
1. AI 管理センター → 統合ログ；
2. コンテナ選択（ドロップダウン）→ キーワード入力 → 時間範囲選択 → 照会；
3. バックエンド `/api/logs/query` が LogQL で Loki を照会。
### 24.3 LogQL クイックリファレンス
```
{container="new-api"} |= "error"              # あるコンテナの error を含む行
{container=~".+"} |~ "(?i)error|exception"      # 全コンテナでマッチ
{service="litellm"} |= "EMAIL"                  # サービス別で照会
```
> 📌 Loki の label は `container / project / service` で、**`job` はありません**。照会は `{container=~".+"}` を使い、`{job="docker"}` は使いません。
> ⚠️ 重要な落とし穴（Docker Desktop のマウント）：Promtail は `/var/run/docker.sock` と `/var/lib/docker/containers` をマウントする必要があります（WSL2 下では Docker Desktop VM 内部を指し、ログのある場所です）。ホストマシン Windows の `C:\...\containers` パスは使わないでください。Loki 単一マシンは `store: tsdb` + filesystem を使います。
> 📖 公式ドキュメント：Loki 公式ドキュメント https://grafana.com/docs/loki/latest/

## 25. PII マスキング（Presidio）

### 25.1 2 層のマスキング
| レイヤー | 能力 |
| --- | --- |
| LiteLLM 内蔵正規表現（`litellm_content_filter`） | 携帯番号、身分証番号、銀行カード、メール、統一社会信用コード、パスポート、IPv4 など。ヒットすると `[xxx_REDACTED]` に置換。機密語ブラックリストにヒットすると BLOCK 拒否 |
| Microsoft Presidio | より細かいエンティティ（英語人名、メールなど）。`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 内蔵正規表現ルール
| ルール | 正規表現 | タイプ |
| --- | --- | --- |
| 中国携帯番号 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身分証番号 | `\b\d{17}[\dXx]\b` | cn_id |
| 銀行カード番号 | `\b\d{16,19}\b` | bank_card |
| メール | prebuilt `email` | email |
| 統一社会信用コード | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| パスポート番号 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
機密語ブラックリストは `litellm-config.yaml` の `blocked_words` で会社の実情に合わせて増減します（`内部機密`、`商業機密` など）。
### 25.3 Presidio の有効化（現在一時コメントアウト）
新版 LiteLLM の guardrail API 変更により、Presidio 部分は現在コメントアウトされています。有効化の要点：
- guardrails に `default_on: true` を追加しないとグローバルに有効になりません；
- エンドポイント環境変数 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` は必ず base URL を記入します（LiteLLM が `/analyze`、`/anonymize` を自動付加するため、パス付きだと `/analyze/analyze` 404 になります）。
> ⚠️ イメージは約 965MB で、中国国内での取得は非常に遅い（実測約 1 時間）。取得できない場合はまず内蔵正規表現を使用できます（中国語のコア PII をカバー済み）。
### 25.4 検証
携帯番号/メールを含むリクエストを送信 → モデル応答内の元の値が `[REDACTED]` に置換されます。「内部機密」を含むリクエスト → 直接 `Content blocked` が返ります。
> 📖 公式ドキュメント：Microsoft Presidio https://microsoft.github.io/presidio/ · ソース https://github.com/microsoft/presidio

## 26. MailHog メール受信

**入口**：http://<サーバーIP>:8025（Web 受信箱。SMTP 1025 は内部のみ）。
### 26.1 なぜ必要か
Ghost 5 のバックエンドはパスワードレスログインです：メール入力後、Ghost が 6 桁の認証コードを含むメールを送信します。イントラネットに SMTP がないとメールが送信できず、ログイン時に `Failed to send email` を返します。MailHog が「メール出口」としてこれらのメールを受け取ります。
### 26.2 Ghost 側の設定
```
# docker-compose.yml 内の Ghost 環境変数
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 メールの確認
1. ブラウザで `http://<サーバーIP>:8025` を開く；
2. 受信箱で Ghost が送信した認証コード/通知メールを確認。
### 26.4 Ghost のパスワードレスログイン（AI 管理センターの自動ログイン）
Ghost の 6 桁の認証コードの正体は **TOTP**（`TOTP(admin_session_secret + userId)`、6 桁/60 秒/HMAC-SHA1）。AI 管理センターがローカルで認証コードを計算でき、「Ghost バックエンド → 開く」をクリックすると自動完了します：パスワードログイン → ローカルでコード計算 → セッション検証 → cookie 書き込み → バックエンドへ、全プロセス無感覚で MailHog 確認不要。
> ⚠️ 自分でコードを計算しても、Ghost は依然として実際にメールを送信するため、MailHog を保持する必要があります。ないとログイン時に `Failed to send email` を返します。
> 📖 公式ドキュメント：MailHog ソースリポジトリ https://github.com/mailhog/MailHog

**第三部 · 運用編**

## 27. バックアップと復元

**入口**：AI 管理センター「💾 バックアップと復元」ページ、またはコマンドライン `scripts/backup.ps1` / `restore.ps1`。毎日 02:00 のスケジュールタスクで自動バックアップし、7 日間保持します。
### 27.1 バックアップ項目
| バックアップ項目 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | ファイルコピー |
| Keycloak | **realm export（JSON）** |
| 設定ファイル | ファイルコピー |
### 27.2 手動バックアップ
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 定期バックアップ（スケジュールタスク）
スケジュールタスク `AI-Platform-Backup`（毎日 02:00）を登録済み。自動登録されていない場合は手動作成：タスクスケジューラ → 新規作成 → プログラム `powershell.exe`、引数 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`、トリガー毎日 02:00。
> 📌 バックアップはデフォルトで C ドライブにあります。定期的に `C:\AIAllInOne\backups\` を別のディスクやオブジェクトストレージに同期して異地災害対策を行うことを推奨します。
### 27.4 復元
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
スクリプトは `yes` の入力確認を要求します（`-Force` でスキップ。スクリプト/CI 専用）。AI 管理センター「バックアップと復元」ページで任意のバックアップの「復元」をクリックしてワンクリック復元も可能です。
### 27.5 重要な落とし穴（演習で検証済み）
- ⚠️
      
        Keycloak は必ず **realm export/import（JSON）** を使用します。pg_dump 復元は default role の関連付けが失われ起動できなくなります；
- SQLite 復元後の所有権は root になるため、対応する uid に chown する必要があります（grafana=472、gitea=1000）。しないと readonly エラー；
- pg_dump に `--clean --if-exists` を付けて復元競合を回避；
- 旧版 backup.ps1 は `Copy-Item` のバッチコピーでドットファイル `.env` が原因で全体が静かに失敗していました。ファイルごとの `-LiteralPath` に修正済み；
- AI 管理センターのバックアップは base64 中継 + tar-fs でバイナリ安全を保証します（docker exec の stdout は utf8 経由で SQLite .db を壊すため）。

## 28. ヘルスチェックと起動時セルフチェック

**スクリプト**：`C:\AIAllInOne\windows\scripts\health-check.ps1`。出力は `health_check_<タイムスタンプ>.log`。41 コンテナ（Windows コア 25 + Dify 16）をカバーし、資格情報は `.env` から読み取り、パスワードをハードコードしません。
### 28.1 検査範囲（9 ステージ）
| ステージ | 検査項目 |
| --- | --- |
| Stage 1 | Docker Daemon 稼働状態（起動待機、起動時セルフチェック対応） |
| Stage 2 | 41 コンテナの状態（Up/Exited/Restarting） |
| Stage 3 | 10 個の HTTP エンドポイント応答 |
| Stage 4 | LiteLLM readiness + モデル登録、Dify API、データベース/Redis/Sandbox ヘルス |
| Stage 5 | LLM 全経路（NewAPI → LiteLLM → DeepSeek 実リクエスト） |
| Stage 6 | AD アカウント認証経路 + NewAPI 管理者ログイン |
| Stage 7 | MCP Gateway + スキル機能 |
| Stage 8 | DeepChat/Dify ログイン前提条件 |
| Stage 9 | ディスク空き容量 |
### 28.2 手動実行
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ 出力末尾に `ALL CLEAR` かつ `Fail: 0` ならすべて正常です。
### 28.3 起動時自動実行（スケジュールタスク）
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # ログイン後 2 分遅延させて Docker + コンテナ起動を待つ
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 注意：スクリプトは `127.0.0.1` を使い localhost は使いません。LiteLLM 内部ヘルスは `/health/readiness`（認証不要）。`docker-init_permissions-1` の Exited(0) は正常。Update Server の 403 は正常（デフォルト index.html なし）。exit code 0=通過、1=失敗あり。

## 29. トラブルシューティングマニュアル

### 29.1 共通トラブルシュート 3 ステップ
1. **コンテナ状態の確認**：`docker ps -a` で Exited/Restarting を探す；
2. **ログの確認**：`docker logs <コンテナ名> --tail 30`；
3. **ヘルスチェックの実行**：`health-check.ps1` を実行して失敗ステージを特定。
### 29.2 症状クイックリファレンス表
| 症状 | 根本原因 | 解決策 |
| --- | --- | --- |
| localhost でどの製品も開けない | WSL2 IPv6 `::1` 互換性問題 | イントラネット IP または 127.0.0.1 に変更 |
| Ghost がずっと Restarting、ECONNREFUSED :3306 エラー | ボリューム内に MySQL 設定が残留 | 環境変数で SQLite を強制（第 4 章） |
| Dify 4 コンテナが起動直後にクラッシュ ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 50 に変更（第 5 章） |
| NewAPI チャネルテストで No connected db | チャネルキーにサンプル値を入力 | `LITELLM_MASTER_KEY` の実際の値を入力 |
| NewAPI OIDC が invalid_grant / Incorrect redirect_uri | サーバーアドレスが localhost | イントラネットアドレスに設定（第 7 章） |
| NewAPI ログイン 429 | 重要インターフェースのレート制限 | redis rateLimit:* を削除するか .env を変更 |
| Dify アプリ作成で ws://localhost に何度も接続 | WebSocket アドレス未変更 | NEXT_PUBLIC_SOCKET_URL をイントラネット IP に設定 |
| Dify でログインが反応しない | パスワードは base64 必要 / 未ログイン 401 は正常 | スクリプトで先に base64、ブラウザは再試行 |
| Gitea が readonly database エラー | gitea.db が root 所有 | root 所有の db を削除して再構築 |
| Gitea リポジトリリンクが localhost | ROOT_URL 未変更 | イントラネットアドレスに設定 |
| SSO ログインで unknown_error | AD ポート転送失効（iphlpsvc） | iphlpsvc + Hyper-V ネットワークを確認 |
| Keycloak でドメインユーザーが見えない | Search scope = One Level | Subtree に変更 |
| Langfuse でデータが見えない | V4_WRITE_MODE または SSO アカウントが組織未所属 | dual に設定。SQL で組織に追加（第 23 章） |
| DeepChat モデル接続タイムアウト | クライアントが停止したシステムプロキシ経由 | プロキシ不使用/直接接続に設定 |
| Loki でログが見つからない | job ラベルを使用 | `{container=~".+"}` を使用 |
| Presidio 404 /analyze/analyze | エンドポイントにパス付き | base URL のみ記入 |
| server.js 変更後の新インターフェースが 404 | up -d は volume 変更を再読み込みしない | docker restart admin-portal |
### 29.3 よく使うコマンド
```
docker ps -a                                        # 全コンテナの状態
docker logs <コンテナ> --tail 50                     # ログ確認
docker compose up -d <サービス>                      # あるサービスを再構築
docker compose restart <サービス>                    # あるサービスを再起動（.env 再読み込みなし）
docker system df                                     # Docker ディスク使用量
C:\AIAllInOne\windows\scripts\health-check.ps1       # ワンクリック検査
```

**付録**

## 付. 公式ドキュメント索引

### 全製品の公式ドキュメント
| 製品 | 公式ドキュメントアドレス |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Keycloak サーバー管理 | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| NewAPI 公式サイト | https://www.newapi.ai |
| NewAPI ソース | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify セルフホスト | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Ghost 管理バックエンド | https://ghost.org/docs/admin/ |
| Gitea（中国語） | https://docs.gitea.com/zh-cn |
| Gitea 管理 | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| DeepChat ソース | https://github.com/ThinkInAIXYZ/deepchat |
| MCP プロトコル | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse セルフホスト | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Presidio ソース | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ 各章の末尾にも該当製品の公式ドキュメントアドレスを記載しています。章ごとの参照に便利です。

