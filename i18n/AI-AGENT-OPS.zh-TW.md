# AI Agent 維運指南

> 📖 **語言**：[English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

這套系統是為「**用 AI Agent 來維運**」而設計的——WorkBuddy、OpenClaw、Microsoft Scout 或任何同類工具都可以。你不再需要登入十幾個後台、到處點 UI，而是用白話告訴 Agent 你要什麼，它來幫你讀檔案、跑指令、和各服務打交道。

本指南介紹如何用 AI Agent 做日常維運：健康檢查、容器管理、設定修改、AI 管理中心、Gitea／同步、Ghost 入口網站、備份、發佈、排除故障。

---

## 一、它是怎麼運作的

支撐整套系統運作的東西，都在你本機，形式是**程式碼、設定和資料**：

- **Docker Compose** 定義了所有容器。
- **`.env` 檔案**（如 `windows/.env.windows`）保存各服務用的憑證。
- **Admin API** 暴露管理端點（Keycloak、Gitea、NewAPI 等）。
- **檔案與資料庫**（Ghost 的 SQLite 庫、DeepChat 安裝檔、sync-history JSON 等）是真正的狀態。

Agent 能做的：

- **讀、改任意檔案**——設定、腳本、AI 管理中心的 `index.html` / `server.js`、文件。
- **執行指令**——`docker`、`docker compose`、`git`、PowerShell、Node.js、Python。
- **透過 HTTP 呼叫服務**——Admin API、健康端點、下載連結。
- **連網檢索**產品文件（需要時）。

因為一切都是「檔案 + 指令 + API」，Agent 全都看得到、改得了——這正是你可以透過它維運整套系統的原因。

---

## 二、準備工作（一次性）

1. **在 Agent 裡開啟專案目錄。** 把 Agent 的工作目錄指向專案根目錄（如 `C:\AIAllInOne`）。它會在這裡讀 `docker-compose.yml`、`.env` 檔案、腳本和文件。
2. **確保 Docker Desktop 在執行。** 大多數操作都是 `docker` / `docker compose` 指令。如果 Docker Desktop 停了，Agent 的第一步通常是檢查並啟動它。
3. **憑證放 `.env`，別放對話裡。** Agent 從 `windows/.env.windows` 讀服務密碼。別把真實密碼貼進對話或提交進倉庫。
4. **告訴它用哪個平台目錄**（如果不明顯的話；單機情境一般是 `windows/`）。

---

## 三、Agent 能幫你做什麼

| 任務 | Agent 怎麼做 |
|---|---|
| 健康檢查 / 狀態總覽 | `docker ps` + 健康端點 + Admin API |
| 啟動 / 重啟 / 停止服務 | `docker compose up -d <服務>` / `docker restart <服務>` |
| 查看日誌與報錯 | `docker logs <服務> --tail N`、讀日誌檔案 |
| 改設定 | 改檔案，然後重啟受影響的容器 |
| 改 AI 管理中心 | 改 `admin-portal/public/index.html`（介面）或 `admin-portal/server.js`（介面 API） |
| 管理 Gitea + 同步 | Gitea API：觸發工作流程、讀執行狀態／日誌、改倉庫檔案 |
| 管理 Ghost 入口網站 | 讀寫 Ghost SQLite 庫、改主題模板、匯入內容種子 |
| 備份與還原 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 發佈版本 | `publish.ps1`（建置 + 提交 + 推送到 GitHub） |
| 清理 | `docker image prune`、刪舊備份等（需你確認） |
| 排除故障 | 埠口衝突、Docker Desktop 問題、DNS／代理等 |

---

## 四、常用任務與範例指令

下面是你最常做的任務，每條配一個範例指令。你可以用自己的語言說，Agent 都能聽懂。把 `<…>` 換成真實值。

### 4.1 檢查整體健康

> "檢查所有服務是否都在執行且健康，列出任何停止或反覆重啟的容器，並告訴我原因。"

Agent 會跑 `docker ps`、逐個打健康端點，回報狀態。

### 4.2 排查一個停止／報錯的服務

> "LiteLLM 停了，找出原因並修好，然後確認它恢復了。"

Agent 會看容器狀態、讀日誌、定位根因（例如埠口衝突）並修復。

### 4.3 重啟服務

> "重啟 admin portal，讓我的 server.js 改動生效。"

Agent 執行 `docker restart admin-portal`。注意：**後端**程式碼（`server.js`）改動要重啟容器；**前端**（`index.html`）改動只需重新整理瀏覽器。

### 4.4 看日誌

> "顯示 Gitea runner 日誌最後 50 行，告訴我有沒有錯誤。"

### 4.5 管理 DeepChat 同步（Gitea）

> "觸發 deepchat-sync 工作流程，並把它的進度給我看——階段、已下載檔案數、MB、預計剩餘時間。"

Agent 呼叫 Gitea API 觸發工作流程，然後輪詢執行狀態、讀 `sync-progress.json`。

### 4.6 改 AI 管理中心

> "給 Gitea 倉庫清單加分頁——每頁 10 條，可調。"

Agent 改 `index.html`、驗證 JavaScript、（後端改動時）重啟容器。然後你 Ctrl+F5 硬重新整理瀏覽器。

### 4.7 管理 Ghost 入口網站

> "把範例內容種子匯入入口網站，用地址 192.168.1.100、中文。"

Agent 會先問發佈地址和語言，再跑 `ghost-content-import.ps1`。它也能修主題、改頁面、直接在庫裡改導覽。

### 4.8 備份與還原

> "現在跑一次完整備份，並確認成功。"

### 4.9 發佈到 GitHub

> "發佈新版本 v0.7，提交訊息是 'feat: …'。"

Agent 跑 `publish.ps1 -Version v0.7 -CommitMessage "…"`。注意：`git push` 需要代理或 GitHub 憑證可用——如果網路推送失敗，Agent 會提示你開啟代理。

### 4.10 清理磁碟空間

> "看看 Docker 磁碟都佔在哪，哪些是安全的、可以刪的。"

Agent 會掃描（`docker system df`、未使用映像、卷、舊備份）並列出來——**只在你確認要刪哪些之後才會真正刪。**

---

## 五、最佳實務與坑

- **前端 vs 後端重新整理。** AI 管理中心裡：`index.html` 改動重新整理瀏覽器即生效（檔案是 volume 掛載的）；`server.js` 改動需要 `docker restart admin-portal`——普通的 `docker compose up -d` **不會**重新載入 volume 掛載的程式碼。
- **硬重新整理瀏覽器**（Ctrl+F5）：介面看起來沒變時，多半是舊的 JavaScript 被快取了。
- **絕不提交真實密鑰或 IP。** 用佔位符（如 `<伺服器IP>`、`CHANGE_ME_*`）。`publish.ps1` 會自動去識別化 `server.js` 裡的密碼。
- **要驗證，不要輕信。** 讓 Agent 用指令證明結果（HTTP 狀態碼、`ls`、日誌行），尤其是它說「已修好」時。
- **破壞性操作前先備份。** Agent 改 Ghost 庫或設定前應先備份，刪任何東西前先跟你確認。
- **匯入內容前先問地址和語言。** 匯入入口網站內容時，Agent 應先問發佈地址和目標語言。
- **網路與代理。** 有些步驟（推送到 GitHub、連網檢索）需要代理（如 `127.0.0.1:33210`）或外網。網路步驟失敗時，開啟代理再重試。

---

## 六、常用指令速查

| 操作 | 指令 |
|---|---|
| 列出容器 | `docker ps -a` |
| 容器日誌 | `docker logs <名稱> --tail 100` |
| 重啟服務 | `docker restart <名稱>` |
| 啟動全部服務 | `docker compose up -d` |
| Compose 狀態 | `docker compose ps` |
| 觸發 Gitea 同步 | `POST /api/v1/repos/<使用者>/deepchat-sync/actions/workflows/sync.yml/dispatches` |
| 跑備份 | `powershell .\scripts\backup.ps1` |
| 發佈版本 | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
