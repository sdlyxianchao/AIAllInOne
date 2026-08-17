# 第17章：Dify の日常管理

*第二部 · 管理編（各製品の日常運用）*

> AI アプリケーションプラットフォーム：アプリ、ナレッジベース、モデルプロバイダー、メンバー権限、公開。

[← 第16章：LiteLLM の日常管理](ch16-ops-litellm.md) · [📖 目次](index.md) · [第18章：Ghost の日常管理 →](ch18-ops-ghost.md)

---

**入口**：`http://<サーバーIP>`（80 ポート、独立公式 compose。アップグレード保守は `dify/docker/` で個別操作）。

## 17.1 アプリ管理（スタジオ）

1. **アプリ作成**：スタジオ → 空のアプリ作成 → タイプ選択（チャットアシスタント / Agent / ワークフロー / テキスト生成）；

2. **オーケストレーション**：ノードをドラッグしてプロンプト、ツール、ナレッジベース、変数を組み立て；

3. **デバッグ**：右上の「プレビュー」で実行デバッグ；

4. **公開**：デバッグ通過後「公開」→ 共有リンク生成または Web アプリ埋め込み。

## 17.2 ナレッジベース管理

1. ナレッジベース → ナレッジベース作成；

2. ドキュメントをアップロード（Word / PDF / Markdown / ウェブリンク）。セグメントルール + インデックス方式（高品質/経済）を選択；

3. アプリでこのナレッジベースを「追加」すると、AI がドキュメントに基づいて回答できます。

> 📌 ナレッジベースの内容は AI が回答に使用します。機密資料はアップロードしないでください（データ分類規程を遵守）。

## 17.3 モデルプロバイダー

- **モデル追加**：設定 → モデルプロバイダー → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（NewAPI 経由）+ `dify-key`；

- **システムモデル設定**：デフォルトのチャット/推論/埋め込みモデルを指定。

## 17.4 メンバーと権限

- **メンバー**：メンバーをワークスペースに招待し、Owner/Admin/Editor/Normal ロールを設定；

- **ログイン方式**：設定 → ログイン方式 → OIDC（Keycloak）を接続して SSO 実現。

## 17.5 アップグレードと保守

```
cd dify\docker
git pull                          # 最新版を取得
docker compose pull               # 新イメージ取得
docker compose up -d              # 再構築
```

> ⚠️ 重要な落とし穴：① WebSocket `NEXT_PUBLIC_SOCKET_URL` はイントラネット IP に設定；② ログインパスワードは base64 エンコード；③ パスワード忘れは `docker exec docker-api-1 flask reset-password`（8 文字以上）。

> 📖 公式ドキュメント：Dify 公式ドキュメント https://docs.dify.ai · セルフホスト https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第16章：LiteLLM の日常管理](ch16-ops-litellm.md) · [📖 目次](index.md) · [第18章：Ghost の日常管理 →](ch18-ops-ghost.md)
