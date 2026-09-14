# 第20章：MCP Gateway 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> 增刪 MCP Server、上傳/刪除 Skill、擴充套件內建工具。

[← 第19章：Gitea 日常管理](ch19-ops-gitea.md) · [📖 目錄](index.md) · [第21章：更新伺服器管理 →](ch21-ops-update.md)

---

**入口**：`http://<伺服器IP>:3100`（市場頁 `/market`）。管理經 AI 管理中心「MCP Gateway」頁操作（`ai-platform-admin` 角色），也可直接調管理 API。

## 20.1 管理 MCP Server

1. 編輯 `mcp-gateway/mcp-servers.json` 增刪伺服器（stdio/http 兩種）；

2. 重啟 `docker compose restart mcp-gateway`；

3. 或在 AI 管理中心 MCP Gateway 頁增刪（寫回配置 + 自動重連）。

## 20.2 管理 Skill（技能包）

1. **上傳**：AI 管理中心 MCP Gateway 頁 → 上傳技能 zip（校驗含 SKILL.md、防路徑穿越）；

2. **刪除**：對應技能刪除；

3. 技能放 `mcp-gateway/skills/`（含 SKILL.md 的子目錄），每次請求自動掃描，無需重啟。

## 20.3 擴充套件內建工具

在 `mcp-gateway/gateway.js` 加兩步：

```
// ① 工具定義（builtinTools 陣列加一項）
{ name: 'platform_health', description: '查詢服務健康狀態',
  inputSchema: { type: 'object', properties: {} } }

// ② 執行邏輯（callBuiltin 加一個分支）
if (name === 'platform_health') { return '所有服務執行正常'; }
```

改完 `docker compose restart mcp-gateway`。

## 20.4 維護 skill-market 市場地址

「技能管家」的 `market_url` 在 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`，必須用主機名（不能用 IP），是部署參數（詳見第 11 章）。

> ⚠️ 管理 API 需 `X-Admin-Token` 頭（`.env` 的 `MCP_ADMIN_TOKEN`）；未配返回 503、錯 token 返回 401。

> 📖 原廠文件：MCP 協議官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第19章：Gitea 日常管理](ch19-ops-gitea.md) · [📖 目錄](index.md) · [第21章：更新伺服器管理 →](ch21-ops-update.md)
