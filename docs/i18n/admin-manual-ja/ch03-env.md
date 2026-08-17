# 第3章：設定ファイルと環境変数

*第一部 · デプロイ編*

> 3 つのコア設定ファイル + 全環境変数の説明。どれを今設定し、どれを後で設定するか。

[← 第2章：事前準備](ch02-prereq.md) · [📖 目次](index.md) · [第4章：コアサービスの起動 →](ch04-start.md)

---

## 3.1 3 つのコア設定ファイル

| ファイル | 用途 | 変更が必要か |
| --- | --- | --- |
| `.env.windows` | すべてのパスワードと外部 API Key | **変更必須**：DeepSeek API Key を記入、その他 provider は必要に応じて |
| `litellm-config.yaml` | LiteLLM モデルリスト + PII マスキングルール | 通常変更しない（DeepSeek のみ使用なら OpenAI/Claude の項目を削除可） |
| `docker-compose.yml` | コアサービスオーケストレーション | 設定済み（Keycloak `KC_HOSTNAME` + 永続化ボリューム含む） |

## 3.2 環境変数の分類概要

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

## 3.3 🔴 今すぐ設定（初回起動前に必須）

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

### API Key 記入の例

```
# デフォルトで DeepSeek を設定済み（コメント解除して Key を記入）
DEEPSEEK_API_KEY=sk-あなたの実際のDeepSeekキー

# OpenAI / Claude が必要な場合はコメント解除し、litellm-config.yaml の対応する model ブロックのコメントも解除
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 パスワード変更の方針

> ⚠️ `NEWAPI_DB_PASSWORD` は作成済みデータベースに関わるため、変更後に対応 volume を削除して再構築する必要があります（データ消失）。初回にしっかり決めてください。
 `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` などの管理パスワードは各製品の管理画面で変更でき、変更後に `.env` を同期更新します（メモ用であり、実行には影響しません）。

## 3.5 litellm-config.yaml の説明

- `model_list` — 利用可能な外部モデルを定義。NewAPI が LiteLLM 経由で呼び出します。デフォルトでは `deepseek-chat` のみ有効；

- `general_settings.master_key` — LiteLLM 管理者キー。`.env` の `LITELLM_MASTER_KEY` を読み込み；

- PII マスキング（Presidio）は現在**一時的にコメントアウト**（新版 LiteLLM の guardrail API 変更で非互換）。後からの有効化は第 25 章参照；

- 安定版 `v1.95.1` を使用（`main-latest` には既知のバグあり）。

---

[← 第2章：事前準備](ch02-prereq.md) · [📖 目次](index.md) · [第4章：コアサービスの起動 →](ch04-start.md)
