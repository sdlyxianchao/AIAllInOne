# 第10章：DSH Desktop 分發與 CI/CD

*第一部分 · 部署篇*

> 把 DSH Desktop 安裝包分發給員工，以及用 Gitea Actions 自動同步官方新版本。

[← 第9章：Dify / Ghost / Gitea 配置](ch09-products.md) · [📖 目錄](index.md) · [第11章：MCP Gateway 與 Skill 市場 →](ch11-mcp.md)

---

## 10.1 分發鏈路

分發鏈路 = GitHub Releases 安裝包 → `dsh-sync` 倉庫的 Gitea Actions → 更新伺服器（:8091）→ Ghost 下載頁 → 員工下載。

> 📌 已刪除 `dsh` 原始碼 mirror 倉庫——mirror 只同步 git 原始碼、不同步 release 安裝包，對分發無用。若要做原始碼審計/二次開發再單獨建。

## 10.2 下載安裝包到更新伺服器

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

驗證：`curl -I http://<伺服器IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206。再更新 Ghost 下載頁（見第 9 章）。

## 10.3 自動同步（Gitea Actions，推薦）

| 元件 | 說明 |
| --- | --- |
| `dsh-sync` 倉庫 | 普通倉庫（不能用 mirror），放 `.gitea/workflows/sync.yml` + `update_ghost.py` |
| 觸發 | `schedule`（每天 UTC 2 點）+ `workflow_dispatch`（手動） |
| 邏輯 | 查 GitHub 最新 tag → 對比 `version.txt` → 有新版則下載 + 更新 Ghost 下載頁 + 寫版本 |

```
# 手動觸發一次
curl -X POST "http://<伺服器IP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密碼>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ 關鍵坑：① act_runner 的 `container.network` 必須透過 `config.yaml`（+`CONFIG_FILE` 環境變數）配，否則 job 容器解析不了 `gitea` 主機名；② docker.sock 由 runner 自動掛載，別在 options 裡再掛（報 Duplicate mount point）。

## 10.4 國內下載源配置（sync-config.json）

官網 `www.dshdesktop.com` 下載頁的安裝包仍指向 GitHub，國內基本不通。真正解決靠 `sync-config.json`：

| 欄位 | 作用 | 預設 |
| --- | --- | --- |
| `version_source` | `github`（GitHub API 最準）或 `official`（官網快取，可達但滯後） | `github` |
| `download_prefix` | 下載加速字首，如 `https://ghproxy.com/` | `""` |
| `keep_releases` | 版本歷史保留數 | `5` |
| `market_url` | 下載頁「先裝技能管家」的內網市場地址 | `http://<伺服器IP>:3100` |

```
# 能連 GitHub：預設不改
{ "version_source": "github", "download_prefix": "" }
# GitHub 加速代理（最常用）
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```

> 📌 工作流內建 `version_cmp.py` 版本比較，只有「最新版 > 本地版」才下載（避免官網快取滯後把客戶端回退舊版）。

## 10.5 方式 B：Docker 構建自定義版本（可選）

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# 容器內
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# 產物在 dist/，退出後 copy 到 dsh-updates/
```

## 10.6 配置 DSH Desktop 客戶端（員工側）

1. DSH Desktop → 設定 → 模型服務 → 自定義 Provider / OpenAI 相容；

2. API Base URL：`http://<伺服器IP>:3000/v1`（必須內網 IP）；

3. API Key：`dsh-key` 的 `sk-xxx`；

4. 模型：`deepseek-chat`，儲存後測試對話。

> 📖 原廠文件：DSH Desktop 快速開始 https://www.dshdesktop.com/docs/guide/getting-started/ · 開源倉庫 https://github.com/dataelement/dsh-desktop

---

[← 第9章：Dify / Ghost / Gitea 配置](ch09-products.md) · [📖 目錄](index.md) · [第11章：MCP Gateway 與 Skill 市場 →](ch11-mcp.md)
