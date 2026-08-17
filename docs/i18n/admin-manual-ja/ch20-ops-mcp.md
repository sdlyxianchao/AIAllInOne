# 第20章：MCP Gateway の日常管理

*第二部 · 管理編（各製品の日常運用）*

> MCP Server の増減、スキルのアップロード/削除、組み込みツールの拡張。

[← 第19章：Gitea の日常管理](ch19-ops-gitea.md) · [📖 目次](index.md) · [第21章：更新サーバーの管理 →](ch21-ops-update.md)

---

**入口**：`http://<サーバーIP>:3100`（マーケットページ `/market`）。管理は AI 管理センター「MCP Gateway」ページで操作（`ai-platform-admin` ロール）、または管理 API を直接呼び出します。

## 20.1 MCP Server の管理

1. `mcp-gateway/mcp-servers.json` を編集してサーバーを増減（stdio/http の 2 種）；

2. `docker compose restart mcp-gateway` で再起動；

3. または AI 管理センター MCP Gateway ページで増減（設定に書き戻し + 自動再接続）。

## 20.2 スキル（スキルパッケージ）の管理

1. **アップロード**：AI 管理センター MCP Gateway ページ → スキル zip アップロード（SKILL.md の存在検証、パストラバーサル防止）；

2. **削除**：該当スキルを削除；

3. スキルは `mcp-gateway/skills/`（SKILL.md を含むサブディレクトリ）に置き、リクエストごとに自動スキャンされ、再起動不要。

## 20.3 組み込みツールの拡張

`mcp-gateway/gateway.js` に 2 ステップ追加します：

```
// ① ツール定義（builtinTools 配列に 1 項目追加）
{ name: 'platform_health', description: 'サービスヘルス状態の照会',
  inputSchema: { type: 'object', properties: {} } }

// ② 実行ロジック（callBuiltin に 1 分岐追加）
if (name === 'platform_health') { return 'すべてのサービスは正常に稼働中'; }
```

変更後 `docker compose restart mcp-gateway`。

## 20.4 skill-market マーケットアドレスの保守

「スキルマネージャー」の `market_url` は `mcp-gateway/skills/skill-market/config.json` + `SKILL.md` にあり、必ずホスト名（IP 不可）を使います。デプロイパラメータです（詳細は第 11 章）。

> ⚠️ 管理 API には `X-Admin-Token` ヘッダーが必要（`.env` の `MCP_ADMIN_TOKEN`）。未設定なら 503、トークン誤りなら 401 を返します。

> 📖 公式ドキュメント：MCP プロトコル公式 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第19章：Gitea の日常管理](ch19-ops-gitea.md) · [📖 目次](index.md) · [第21章：更新サーバーの管理 →](ch21-ops-update.md)
