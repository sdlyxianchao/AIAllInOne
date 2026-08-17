# 第9章：Dify / Ghost / Gitea の設定

*第一部 · デプロイ編*

> 3 製品それぞれの初期化と相互接続の設定。

[← 第8章：LiteLLM：検証とキャッシュ](ch08-litellm.md) · [📖 目次](index.md) · [第10章：DeepChat の配布と CI/CD →](ch10-deepchat.md)

---

## 9.1 Dify：モデルプロバイダーの設定

1. `http://<サーバーIP>` を開く → 初回は管理者メール/パスワードを設定（メール `ai_all_in_one_admin@<会社ドメイン>`）；

2. **設定 → モデルプロバイダー** → OpenAI-API-compatible → モデル追加：

- モデル名 `deepseek-chat`（実際に合わせる）；

- API Key：`dify-key` の `sk-xxx`；

- API endpoint：`http://host.docker.internal:3000/v1`。

3. スタジオ → チャットアシスタント作成 → モデル選択 → メッセージ送信で検証。

> ⚠️ Dify は `host.docker.internal` を使い、コンテナ名は使いません。Dify は自身のネットワーク内にあり、NewAPI と異なるネットワークのためです。

## 9.2 Ghost：ポータルの設定

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

## 9.3 Gitea：初期化と Runner 登録

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
 ⚠️ 落とし穴 2：`ROOT_URL` を `http://<サーバーIP>:3002/` に設定する必要があります。しないと生成されるリポジトリリンクが localhost になり、従業員が開くと無効です。

> 📖 公式ドキュメント：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中国語） https://docs.gitea.com/zh-cn

---

[← 第8章：LiteLLM：検証とキャッシュ](ch08-litellm.md) · [📖 目次](index.md) · [第10章：DeepChat の配布と CI/CD →](ch10-deepchat.md)
