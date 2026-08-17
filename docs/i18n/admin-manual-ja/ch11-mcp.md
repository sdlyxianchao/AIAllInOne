# 第11章：MCP Gateway とスキルマーケット

*第一部 · デプロイ編*

> スキルと MCP ツールを集中管理するゲートウェイ。DeepChat/Dify は 1 つのアドレスに接続するだけで全ツールを取得できます。

[← 第10章：DeepChat の配布と CI/CD](ch10-deepchat.md) · [📖 目次](index.md) · [第12章：AI 管理センター →](ch12-admin-center.md)

---

> 📌 MCP Gateway は公式 `@modelcontextprotocol/sdk` を基盤とし、標準 Streamable HTTP `/mcp` エンドポイントを公開します。メイン `docker-compose.yml` に統合済み（ポート 3100）で、コアサービスとともに起動します。ソースは `mcp-gateway/`。

## 11.1 組み込みプラットフォームツール

| ツール | 用途 |
| --- | --- |
| `platform_time` | サーバーの現在時刻を返す |
| `platform_echo` | テキストをエコー（接続テスト） |
| `platform_services` | プラットフォームサービスの一覧を表示 |

## 11.2 外部 MCP Server の集約

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

## 11.3 クライアント接続

1. DeepChat：設定 → MCP → サーバー追加 → タイプ「ストリーミング可能な HTTP」、URL `http://<サーバーIP>:3100/mcp`；

2. Dify ワークフロー：カスタムツール / MCP ツール設定を同じアドレスに向けます。

> 検証：`curl http://<サーバーIP>:3100/health` が `{"status":"ok"}` を返すこと。`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` がツールリストを返します。

## 11.4 スキルマーケット（イントラネットスキルパッケージ配布）

| エンドポイント | 役割 |
| --- | --- |
| `/market` | スキルマーケットページ（カード閲覧 + ZIP ダウンロード + インストールアドレスコピー） |
| `/skills` | スキル一覧 JSON（name/description/version） |
| `/skills/<名前>.zip` | スキルパッケージのダウンロード（動的パッキング） |

スキルは `mcp-gateway/skills/` ディレクトリ（SKILL.md を含むサブディレクトリ）に置き、**リクエストごとに自動スキャンされ、再起動不要**。組み込みの `skill-market` ガイドスキルがあります。

> 📌 DeepChat における MCP と Skill は別概念です：MCP は「ツール」（function calling）、Skill は「エージェントスキルパッケージ」（SKILL.md + スクリプト）。DeepChat の Skill には「カスタムマーケット URL」がなく、フォルダ/ZIP/URL の 3 方式のインストールのみ対応。イントラネット配布は「URL インストール」で実現します。

## 11.5 ⚠️ スキルマーケットのホスト名（デプロイパラメータ、置換必須）

「スキルマネージャー」は `config.json` の `market_url` を読み、`/skills` 一覧を要求します。重要な 2 点：

- **ホスト名を使い、IP は使わない**：DeepChat の agent 環境は IP を `[IP_ADDRESS_REDACTED]` にマスキングするため、実際のアドレスを読み取れなくなります；

- **ホスト名はデプロイパラメータ**：各デプロイで異なるため、そのままコピーできません。

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<マーケットホスト名>:3100" }
```

#### 自動（Agent でデプロイ）

Agent はパラメータ収集時に「スキルマーケットのホスト名」を尋ね、`config.json` と `SKILL.md` 内の `<マーケットホスト名>` を自動置換します。

#### 手動

1. `config.json` + `SKILL.md` のフォールバックアドレスを編集し、`<マーケットホスト名>` を置換；

2. ホスト名を解決可能にする：単一マシンでは `C:\Windows\System32\drivers\etc\hosts` に `<サーバーIP> <ホスト名>` を追加。会社イントラネットでは DNS に A レコードを追加。

> ✅ ホスト名は「サービス名+会社ドメイン」の FQDN を推奨。例：`skillmarket.あなたの会社ドメイン`。DNS に A レコード追加：ドメインコントローラ「DNS → 前方参照ゾーン → あなたのドメイン → 新しいホスト(A)」、または `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "あなたのドメイン" -IPv4Address "<サーバーIP>"`。

## 11.6 管理 API（AI 管理センターの増改削用）

| エンドポイント | 役割 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server の CRUD（設定に書き戻し+自動再接続） |
| `POST /api/skills/upload` | スキル zip アップロード（SKILL.md 検証、パストラバーサル防止） |
| `DELETE /api/skills/:name` | スキル削除 |

`X-Admin-Token` ヘッダーが必要（`.env` の `MCP_ADMIN_TOKEN`）。AI 管理センター「MCP Gateway」ページが代理呼び出しします（`ai-platform-admin` ロールで保護）。

> 📖 公式ドキュメント：MCP プロトコル公式 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第10章：DeepChat の配布と CI/CD](ch10-deepchat.md) · [📖 目次](index.md) · [第12章：AI 管理センター →](ch12-admin-center.md)
