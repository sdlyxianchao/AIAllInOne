# 第11章：MCP Gateway 與 Skill 市場

*第一部分 · 部署篇*

> 集中管理 Skill 和 MCP 工具的閘道器，DeepChat/Dify 連一個地址即可拿到所有工具。

[← 第10章：DeepChat 分發與 CI/CD](ch10-deepchat.md) · [📖 目錄](index.md) · [第12章：AI 管理中心 →](ch12-admin-center.md)

---

> 📌 MCP Gateway 基於官方 `@modelcontextprotocol/sdk`，暴露標準 Streamable HTTP `/mcp` 端點，已併入主 `docker-compose.yml`（埠 3100），隨核心服務一起啟動。原始碼在 `mcp-gateway/`。

## 11.1 內建平台工具

| 工具 | 用途 |
| --- | --- |
| `platform_time` | 返回伺服器當前時間 |
| `platform_echo` | 回顯文字（連通性測試） |
| `platform_services` | 列出平台服務清單 |

## 11.2 聚合外部 MCP Server

編輯 `mcp-gateway/mcp-servers.json`，新增 stdio 或 http 型別，重啟 `mcp-gateway` 生效：

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

聚合的工具自動加 `{serverName}_` 字首避免重名。

## 11.3 客戶端接入

1. DeepChat：設定 → MCP → 新增伺服器 → 型別「可流式傳輸的 HTTP」，URL `http://<伺服器IP>:3100/mcp`；

2. Dify 工作流：自定義工具 / MCP 工具配置指向同地址。

> 驗證：`curl http://<伺服器IP>:3100/health` 返回 `{"status":"ok"}`；`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` 返回工具列表。

## 11.4 Skill 市場（內網技能包分發）

| 端點 | 作用 |
| --- | --- |
| `/market` | Skill 市場頁（卡片瀏覽 + 下載 ZIP + 複製安裝地址） |
| `/skills` | 技能清單 JSON（name/description/version） |
| `/skills/<名稱>.zip` | 技能包下載（動態打包） |

技能放在 `mcp-gateway/skills/` 目錄（含 SKILL.md 的子目錄），**每次請求自動掃描，無需重啟**。內建 `skill-market` 引導技能。

> 📌 DeepChat 裡 MCP 和 Skill 是兩個概念：MCP 是「工具」（function calling），Skill 是「智慧體技能包」（SKILL.md + 指令碼）。DeepChat 的 Skill 沒有「自定義市場 URL」，只支援資料夾/ZIP/URL 三種安裝，內網分發靠「URL 安裝」變相實現。

## 11.5 ⚠️ Skill 市場主機名（部署參數，必須替換）

「技能管家」讀 `config.json` 的 `market_url` 請求 `/skills` 清單。兩個關鍵點：

- **用主機名，不能用 IP**：DeepChat 的 agent 環境會把 IP 遮蔽成 `[IP_ADDRESS_REDACTED]`，導致讀不到真實地址；

- **主機名是部署參數**：每套部署都不同，不能照抄。

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<市場主機名>:3100" }
```

#### 自動（用 Agent 部署）

Agent 在收集參數時會問「Skill 市場主機名」，自動替換 `config.json` 和 `SKILL.md` 裡的 `<市場主機名>`。

#### 手動

1. 編輯 `config.json` + `SKILL.md` 兜底地址，替換 `<市場主機名>`；

2. 讓主機名可解析：單機在 `C:\Windows\System32\drivers\etc\hosts` 加 `<伺服器IP> <主機名>`；公司內網在 DNS 加 A 記錄。

> ✅ 主機名建議用「服務名+公司網域」FQDN，如 `skillmarket.你的公司網域`。DNS 加 A 記錄：網域控制站「DNS → 正向查詢區域 → 你的網域 → 新建主機(A)」，或用 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "你的網域" -IPv4Address "<伺服器IP>"`。

## 11.6 管理 API（供 AI 管理中心增刪改）

| 端點 | 作用 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server 增刪改查（寫回配置+自動重連） |
| `POST /api/skills/upload` | 上傳技能 zip（校驗 SKILL.md、防路徑穿越） |
| `DELETE /api/skills/:name` | 刪除技能 |

需 `X-Admin-Token` 頭（`.env` 的 `MCP_ADMIN_TOKEN`）。由 AI 管理中心「MCP Gateway」頁代理呼叫（`ai-platform-admin` 角色保護）。

> 📖 原廠文件：MCP 協議官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第10章：DeepChat 分發與 CI/CD](ch10-deepchat.md) · [📖 目錄](index.md) · [第12章：AI 管理中心 →](ch12-admin-center.md)
