# 第19章：Gitea の日常管理

*第二部 · 管理編（各製品の日常運用）*

> 社内 Git + CI/CD：リポジトリ、組織、Runner、Actions。

[← 第18章：Ghost の日常管理](ch18-ops-ghost.md) · [📖 目次](index.md) · [第20章：MCP Gateway の日常管理 →](ch20-ops-mcp.md)

---

**入口**：Web `http://<サーバーIP>:3002`；SSH `ssh://git@<サーバーIP>:2222`。

## 19.1 リポジトリと組織

1. **リポジトリ作成**：右上の + → New repository；

2. **組織作成**：+ → New organization。組織配下にリポジトリ作成、チーム管理；

3. **外部リポジトリの移行**：+ → New migration。GitHub アドレスを入力して mirror 可能（ソースの読み取り専用同期）。

## 19.2 ユーザーと権限

- **ユーザー追加**：Site Administration → User Accounts → Create user；

- **リポジトリ権限**：リポジトリ → Settings → Collaborators；

- **組織チーム**：組織 → Teams → チーム作成 → メンバー追加 → リポジトリ権限付与。

## 19.3 Actions / Runner 管理

1. **Actions 有効化**：Site Administration → Actions → Enabled；

2. **Runner 登録**：Runners → Create new Runner → Token コピー → `.env` の `GITEA_RUNNER_TOKEN` に記入 → `docker compose up -d gitea-runner`；

3. **Runner 状態確認**：Runners ページで Idle（緑）表示なら正常；

4. **ワークフロー実行**：リポジトリ → Actions → 手動実行または push トリガー。

> ⚠️ Runner token の変更は必ず `up -d`（restart は .env を再読み込みしません）。

## 19.4 サイト設定

- **ROOT_URL**：`GITEA__server__ROOT_URL` をイントラネット `http://<サーバーIP>:3002/` に設定。しないと生成されるリポジトリリンクが localhost になります；

- **登録ポリシー**：Site Administration → Config で登録スイッチ、メール設定を調整。

> ⚠️ 重要な落とし穴：`readonly database` エラーは多くの場合 `gitea.db` が root 所有になっているため。root 所有の db を削除し、git ユーザーで再構築させます。

> 📖 公式ドキュメント：Gitea 公式ドキュメント（中国語） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← 第18章：Ghost の日常管理](ch18-ops-ghost.md) · [📖 目次](index.md) · [第20章：MCP Gateway の日常管理 →](ch20-ops-mcp.md)
