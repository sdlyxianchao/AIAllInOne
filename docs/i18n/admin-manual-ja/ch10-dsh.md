# 第10章：DSH Desktop の配布と CI/CD

*第一部 · デプロイ編*

> DSH Desktop インストーラの従業員への配布と、Gitea Actions による公式新バージョンの自動同期。

[← 第9章：Dify / Ghost / Gitea の設定](ch09-products.md) · [📖 目次](index.md) · [第11章：MCP Gateway とスキルマーケット →](ch11-mcp.md)

---

## 10.1 配布経路

配布経路 = GitHub Releases インストーラ → `dsh-sync` リポジトリの Gitea Actions → 更新サーバー（:8091）→ Ghost ダウンロードページ → 従業員がダウンロード。

> 📌 `dsh` ソース mirror リポジトリは削除済み——mirror は git ソースのみ同期し、release インストーラは同期しないため配布には無用です。ソース監査/二次開発を行う場合に別途作成します。

## 10.2 インストーラの更新サーバーへのダウンロード

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

検証：`curl -I http://<サーバーIP>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206。その後 Ghost ダウンロードページを更新（第 9 章参照）。

## 10.3 自動同期（Gitea Actions、推奨）

| コンポーネント | 説明 |
| --- | --- |
| `dsh-sync` リポジトリ | 通常リポジトリ（mirror は不可）。`.gitea/workflows/sync.yml` + `update_ghost.py` を配置 |
| トリガー | `schedule`（毎日 UTC 2 時）+ `workflow_dispatch`（手動） |
| ロジック | GitHub の最新 tag を確認 → `version.txt` と比較 → 新バージョンがあればダウンロード + Ghost ダウンロードページ更新 + バージョン書き込み |

```
# 手動トリガー
curl -X POST "http://<サーバーIP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<パスワード>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ 重要な落とし穴：① act_runner の `container.network` は `config.yaml`（+`CONFIG_FILE` 環境変数）で設定する必要があります。しないと job コンテナが `gitea` ホスト名を解決できません；② docker.sock は runner が自動マウントするので、options で再度マウントしない（Duplicate mount point エラー）。

## 10.4 中国国内ダウンロードソース設定（sync-config.json）

公式サイト `www.dshdesktop.com` ダウンロードページのインストーラは依然 GitHub を指しており、中国国内ではほぼつながりません。本当の解決は `sync-config.json` です：

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

## 10.5 方法B：Docker でカスタムバージョンをビルド（任意）

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# コンテナ内
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# 成果物は dist/ にあり、終了後に dsh-updates/ にコピー
```

## 10.6 DSH Desktop クライアントの設定（従業員側）

1. DSH Desktop → 設定 → モデルサービス → カスタム Provider / OpenAI 互換；

2. API Base URL：`http://<サーバーIP>:3000/v1`（必ずイントラネット IP）；

3. API Key：`dsh-key` の `sk-xxx`；

4. モデル：`deepseek-chat`。保存後にテスト対話。

> 📖 公式ドキュメント：DSH Desktop クイックスタート https://www.dshdesktop.com/docs/guide/getting-started/ · オープンソースリポジトリ https://github.com/dataelement/dsh-desktop

---

[← 第9章：Dify / Ghost / Gitea の設定](ch09-products.md) · [📖 目次](index.md) · [第11章：MCP Gateway とスキルマーケット →](ch11-mcp.md)
