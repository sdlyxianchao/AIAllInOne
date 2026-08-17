# 第21章：更新伺服器管理

*第二部分 · 管理篇（各產品日常操作）*

> DeepChat 安裝包託管與自動更新。

[← 第20章：MCP Gateway 日常管理](ch20-ops-mcp.md) · [📖 目錄](index.md) · [第22章：監控告警管理 →](ch22-ops-monitoring.md)

---

**入口**：`http://<伺服器IP>:8091`，資料在 `deepchat-updates/`。

## 21.1 手動放置新版本

1. 下載 DeepChat 官方安裝包到 `deepchat-updates/deepchat/`；

2. 更新 `version.txt`（寫入新版本號）；

3. 員工側 DeepChat 自動更新時檢查 `version.txt` 發現新版即下載安裝。

## 21.2 自動同步（推薦）

靠 `deepchat-sync` 倉庫的 Gitea Actions 每天自動檢查 GitHub 新版本並同步（見第 10 章）。手動觸發：

```
curl -X POST "http://<伺服器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密碼>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 配置同步（sync-config.json）

| 欄位 | 作用 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 下載加速字首（如 ghproxy.com） |
| `keep_releases` | 版本歷史保留數 |
| `market_url` | 下載頁「技能管家」市場地址 |

> 📌 DeepChat 客戶端報「模型連線超時」通常是客戶端走了掛掉的系統代理（`ECONNREFUSED 127.0.0.1:33210`）。讓使用者在 DeepChat「設定 → 網路/代理」改為「不使用代理/直連」。

> 📖 原廠文件：DeepChat 快速開始 https://deepchatai.cn/docs/guide/getting-started/ · 開源倉庫 https://github.com/ThinkInAIXYZ/deepchat

---

[← 第20章：MCP Gateway 日常管理](ch20-ops-mcp.md) · [📖 目錄](index.md) · [第22章：監控告警管理 →](ch22-ops-monitoring.md)
