# 第21章：更新サーバーの管理

*第二部 · 管理編（各製品の日常運用）*

> DSH Desktop インストーラのホスティングと自動更新。

[← 第20章：MCP Gateway の日常管理](ch20-ops-mcp.md) · [📖 目次](index.md) · [第22章：監視・アラート管理 →](ch22-ops-monitoring.md)

---

**入口**：`http://<サーバーIP>:8091`。データは `dsh-updates/`。

## 21.1 新バージョンの手動配置

1. DSH Desktop 公式インストーラを `dsh-updates/dsh/` にダウンロード；

2. `version.txt` を更新（新しいバージョン番号を書き込み）；

3. 従業員側の DSH Desktop は自動更新時に `version.txt` を確認し、新バージョンを発見するとダウンロード・インストールします。

## 21.2 自動同期（推奨）

`dsh-sync` リポジトリの Gitea Actions が毎日自動で GitHub の新バージョンを確認し同期します（第 10 章参照）。手動トリガー：

```
curl -X POST "http://<サーバーIP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<パスワード>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 同期設定（sync-config.json）

| フィールド | 役割 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | ダウンロード加速プレフィックス（例：ghproxy.com） |
| `keep_releases` | バージョン履歴の保持数 |
| `market_url` | ダウンロードページ「スキルマネージャー」のマーケットアドレス |

> 📌 DSH Desktop クライアントが「モデル接続タイムアウト」を報告するのは、多くの場合クライアントが停止したシステムプロキシ（`ECONNREFUSED 127.0.0.1:33210`）を経由しているため。ユーザーに DSH Desktop「設定 → ネットワーク/プロキシ」で「プロキシ不使用/直接接続」に変更させます。

> 📖 公式ドキュメント：DSH Desktop クイックスタート https://www.dshdesktop.com/docs/guide/getting-started/ · オープンソースリポジトリ https://github.com/dataelement/dsh-desktop

---

[← 第20章：MCP Gateway の日常管理](ch20-ops-mcp.md) · [📖 目次](index.md) · [第22章：監視・アラート管理 →](ch22-ops-monitoring.md)
