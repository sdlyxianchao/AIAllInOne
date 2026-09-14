# 第12章：AI 管理センター

*第一部 · デプロイ編*

> 統合管理者ポータル：Keycloak 認証、左メニューに全製品を埋め込み、Dashboard のクラスタ状態表示。

[← 第11章：MCP Gateway とスキルマーケット](ch11-mcp.md) · [📖 目次](index.md) · [第13章：相互接続検証チェックリスト →](ch13-interconnect.md)

---

> 📌 位置づけ：Docker 管理プラットフォーム（1Panel/Portainer）ではなく、管理者向けの統合バックエンド——Keycloak 認証 + 左メニューで全製品にリンク + Dashboard クラスタ状態 + 統合管理者アカウント。

## 12.1 コア機能

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

## 12.2 Global Administrator の初期化

```
# .env で設定
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=アカウントパスワード一覧参照
ADMIN_EMAIL=ai_all_in_one_admin@<会社ドメイン>
```

起動後に自動で Keycloak に `ai_all_in_one_admin` ユーザーを作成（既存ならスキップ）し、`ai-platform-admin` Realm Role を割り当てます。核心理念：**1 つの Global Admin アカウントで全プラットフォームを管理**。

## 12.3 Docker Compose デプロイ

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

## 12.4 Keycloak クライアント設定

1. Keycloak → enterprise-ai → Clients → Create；

2. Client ID `AI-all-in-one-admin-portal`、Client authentication / Standard flow を On；

3. Valid Redirect URIs：`http://127.0.0.1:10086/*` と `http://<サーバーIP>:10086/*`；

4. Client Secret をコピー → `.env` の `KEYCLOAK_CLIENT_SECRET` に記入 → `docker compose up -d admin-portal`；

5. Realm Role `ai-platform-admin` を作成し、`ai_all_in_one_admin` に割り当て。

> ⚠️ デプロイ/トラブルシュートの要点：
> - admin-portal のセッションはメモリ保存で、`up -d` でコンテナを再構築すると**ログインセッションが消えます**（再ログイン必要）；
> - ホーム `/` は必ず Keycloak 保護にする（`express.static(..., {index:false})` + 明示的な `app.get('/', keycloak.protect())`）。しないと未ログイン時に空のダッシュボードが直接描画されます；
> - Dify 統計は実際の管理者メール（`ai_all_in_one_admin@<会社ドメイン>`、AD グローバル管理者と一致）を使います；
> - **server.js 変更後は必ず `docker restart admin-portal`**。`up -d` は使えません（volume ファイル内容の変化は再構築をトリガーしません）。

## 12.5 検証

1. `http://<サーバーIP>:10086` を開く → 自動で Keycloak ログインへ遷移（未ログイン時は空ダッシュボードを表示しない）；

2. `ai_all_in_one_admin` でログイン → 概要ダッシュボードへ；

3. Dashboard に 8 製品の指標 + コンテナグループが表示；

4. 各製品で先に統計を見て、「バックエンドを開く」をクリックして遷移；

5. システム設定で 9 言語に切り替え可能。

## 12.6 モジュール別管理者認可 + Keycloak ページ管理（v0.91）

グローバル管理者は AI 管理センターから他の管理者と Keycloak を直接管理できます：

- **管理者アカウント管理**：Keycloak 連携 IdP から既存アカウントを検索（AD/LDAP ユーザー、新規作成なし・パスワード不要）→ モジュールを選択 → 確定。システムは `admin:<製品>` Realm Role を付与し、**実際に製品へプロビジョニング**（SSO 優先・API フォールバック）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。モジュールの取消や管理者の削除は**製品からアカウントを削除**します。SSO なし製品は仮パスワードを生成し 🔑 アイコンで確認可能（グローバル管理者のみ）。非管理者は「管理者ではありません」と表示されサインアウトします。

- **Keycloak ページ**：「すべて同期 / 変更を同期」ボタンで AD 属性変更をワンクリック反映；各ユーザー行に「編集」（Keycloak コンソールへ）と「削除」；ロール欄は作成/削除/メンバー確認に対応。同期/削除/ロール操作はグローバル管理者のみ。

> ⚠️ 注意：Keycloak に「単一ユーザー同期」エンドポイントはなく、増分同期は AD の変更済みアカウントをすべて同期します。AD フェデレーションユーザーは次回の全量同期または SSO ログインで再び現れます。完全に削除するには AD で無効化/削除してください。

---

[← 第11章：MCP Gateway とスキルマーケット](ch11-mcp.md) · [📖 目次](index.md) · [第13章：相互接続検証チェックリスト →](ch13-interconnect.md)
