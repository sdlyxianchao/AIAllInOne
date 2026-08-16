# AI AllInOne — 企業內網 AI 平台（多平台自託管）

> 📖 **語言**：[English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

一套**開箱即用、多平台**的企業內網 AI 全家桶：把統一認證、LLM 路由、PII 脫敏、AI 應用、企業入口網站、原始碼/CI、用戶端分發、統一管理、監控告警、可觀測性、日誌、備份還原，全部用 Docker 編排成一個整體，透過 Keycloak 實現**一個帳號單一登入所有產品**。

本倉庫同時支援三種部署平台：

| 平台 | 本倉庫目錄（GitHub 上） | 適用場景 |
|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop 單機 |
| Linux / macOS | `linux/` | 自建 Linux 伺服器 / macOS（Docker） |
| 線上伺服器 | `docker/` | 雲端 / 裸 Docker 主機的線上環境 |

> 本機工作目錄裡這些資料夾對應命名為 `windows-github/`、`linux-github/`、`docker-github/`；上傳到 GitHub 後去掉 `-github` 後綴變成 `windows/`、`linux/`、`docker/`。後續每次更新都按這個對應關係同步。

---

## 一、這套系統包含什麼

| 層 | 組件 | 作用 |
|---|---|---|
| 統一認證 | Keycloak | SSO / OIDC，可對接 AD/LDAP 或本機帳號 |
| LLM 路由 | NewAPI | 渠道、金鑰、額度、稽核、成本 |
| PII 脫敏 | LiteLLM + Presidio | 模型呼叫前自動脫敏手機號/身分證/信箱等 |
| AI 應用 | Dify | 視覺化 AI 應用 / Agent 平台 + 統一知識庫（RAG） |
| 企業入口網站 | Ghost | 企業公告與新聞入口網站 |
| 原始碼 / CI | Gitea + Runner | 內部 Git + Actions 自動化 |
| 用戶端 | DeepChat | 本機 AI 桌面用戶端（Windows / macOS / Linux） |
| 用戶端分發 | Update Server | DeepChat 安裝包託管與自動更新 |
| 統一管理 | AI 管理中心 | 唯一入口：Dashboard + 各產品內嵌 + 稽核/成本/報告 + RAG 檢索 |
| 閘道 | MCP Gateway | Skill / MCP 市場管理 + Dify 知識庫檢索（RAG） |
| 監控告警 | Prometheus + Grafana + Alertmanager | 容器資源監控 + 告警通知 |
| LLM 可觀測 | Langfuse | 每次模型呼叫的 trace / 延遲 / token / 成本 |
| 統一日誌 | Loki + Promtail | 所有容器日誌聚合檢索 |
| 備份還原 | backup / restore 腳本 + 管理頁 | 全量資料每日備份 + 一鍵還原 |

每個平台目錄裡都有：`docker-compose.yml`、`.env.example`、`*-deploy-guide*.html`（部署指導）、`*-checklist*.html`（進度清單）、身份源設定指導、一鍵部署腳本，以及脫敏後的原始碼與設定。**不含任何真實金鑰**。

### 架構與資料流

![架構總覽](<../pics/Architecture.png>)

![資料流](<../pics/DataFlow.png>)

### 效果截圖

**AI 管理中心** — 統一管理入口網站

![AI 管理中心](<../pics/AI Admin.png>)

**Dify** — AI 應用平台

![Dify](<../pics/Dify.png>)

**企業入口網站** — 首頁（Ghost）

![企業入口網站首頁](<../pics/AI All In One Hub.png>)

**DeepChat 頁面** — 下載 DeepChat 安裝包

![DeepChat 頁面](<../pics/AI All In One Hub Download.png>)

**DeepChat** — 桌面 AI 用戶端

![DeepChat](<../pics/DeepChat.png>)

---

## 二、快速上手：用 Harness 類工具自動部署（推薦）

Harness 類工具（OpenClaw、Microsoft Scout、WorkBuddy 等）能讀取本專案的文檔和設定，在本機一步步搭出整套環境。以下是標準流程。

### 前置 5 步

**1. 安裝一個 Harness 工具**
安裝 OpenClaw / Microsoft Scout / WorkBuddy 任意一款（或其同類）。它們都能讀寫本機檔案、執行命令、聯網檢索。

**2. 購買訂閱或設定好自己的 API**
在工具裡完成訂閱，或填入你自己的大模型 API Key（DeepSeek / OpenAI / Claude / 通義 / 文心等），保證工具能正常對話。

**3. 準備好網路環境**
這是最容易卡住的一步：
- 確保機器能存取 **Docker 映像倉庫**（Docker Hub / quay.io 等）。若無法直連，需提前設定映像加速（如 DaoCloud 等區域映像源）。
- 確保能存取 **GitHub**（複製倉庫、拉取部分公開依賴）。若無法直連，用代理或提前下載原始碼包。
- 確認目標機器與你要對外提供服務的網段互通。

**4. Git clone 或下載本專案到本機**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# 或下載壓縮包後解壓到本機任意目錄
```

**5. 在工具裡貼上下面的提示詞，開始自動部署**

把下面的提示詞**整段複製**到 Harness 工具的輸入框，然後按它的提問逐項回答即可。工具會：判斷你的平台 → 收集參數 → 生成本機進度檔案 → 按部署指導逐步設定 → 遇到問題跟你反覆測試解決 → 全程更新進度 → 最後做一次完整測試並給你結果。

### 一鍵部署提示詞（複製到工具裡）

````text
你是企業內網 AI 平台的部署工程師。請根據本專案文檔和設定檔，在目前機器上完整部署並驗證這套「AI AllInOne」平台。全程用繁體中文與我溝通，按下面流程嚴格執行。

## 第一步：確認部署目錄與目標平台

1. 先問我：本專案的本機解壓/複製路徑是什麼？（例如 C:\AIAllInOne 或 /opt/AIAllInOne）
2. 進入該目錄後，根據目前機器的作業系統判斷目標平台資料夾：
   - Windows → 使用 `windows-github`（或 `windows`）資料夾
   - Linux / macOS → 使用 `linux-github`（或 `linux`）資料夾
   - 線上伺服器 / 純 Docker 環境 → 使用 `docker-github`（或 `docker`）資料夾
   若拿不準，把你偵測到的作業系統告訴我，並向我確認該用哪個資料夾。
3. 閱讀根目錄 README.md 和該平台資料夾內的 README.md，先理解整體架構與部署方式，再動手。

## 第二步：收集必要參數（逐項問我，不要跳過、不要擅自猜測）

開始設定前，請收集以下資訊，缺哪項就問我哪項，並說明每項的用途：

1. 對外提供服務的內網 IP（其他機器存取本平台的位址，如 192.168.1.100）。
2. 身份源（Identity Provider）：
   - 接公司 AD 網域控制站（Active Directory）：向我要網域名稱、網域控制站 IP、LDAP base DN、bind DN、bind 帳號密碼、sAMAccountName 等。
   - 接其他 IdP（LDAP/OpenLDAP/OIDC/飛書/企微/釘釘等）：向我要對應的設定與帳號資訊。
   - 不接任何外部身份源（只用本機帳號）：與我確認後跳過。
3. 統一管理員帳號：使用者名稱、密碼、信箱（用於 Keycloak SSO 及各產品管理員登入）。
4. 大模型 API Key：我實際擁有的模型服務商及 Key（DeepSeek / OpenAI / Claude / 通義 / 文心等），沒有的跳過。
5. 其他按需詢問：告警通知渠道（釘釘/企微/飛書 webhook 位址）、HTTPS 憑證、備份保留策略等。

## 第三步：生成本機進度檔案

1. 找到該平台資料夾裡的「進度清單」文檔（如 *-checklist*.html）和「身份源設定指導」文檔（如 *-ad-integration*.html 或 IdP 相關文檔）。
2. 基於進度清單內容，在專案目錄下生成一份新的進度檔案，命名如「部署進度-<平台>-<日期>.md」，把清單所有條目複製為未完成狀態（- [ ]）。
3. 之後每完成一項、每解決一個問題，就及時更新這份進度檔案，並在對話裡簡要告訴我進展。

## 第四步：按部署指導逐步設定

1. 精讀該平台「部署指導」文檔（如 *-deploy-guide*.html），嚴格按步驟執行，特別注意文檔裡標註的「⚠️ 關鍵坑 / 踩坑記錄」。
2. 順序大致為：準備環境變數 → 起容器 → 初始化認證/IdP → 設定 LLM 路由與模型渠道 → 初始化各產品 → 設定監控/可觀測/日誌/脫敏 → 設定備份與還原。
3. 優先使用目錄裡已有的自動化腳本（如 bootstrap.ps1、keycloak-realm-init.ps1、health-check 等），能自動化的步驟不要手工點 UI。

## 第五步：遇到問題反覆測試解決

1. 每一步出錯或結果不符預期時，先自查日誌（docker logs、各服務健康端點、設定檔），定位根因後再修復，不要盲目重試。
2. 需要我參與時（如需要管理員權限執行命令、需要登入確認、需要補充資訊），明確告訴我「需要你做什麼、為什麼」。
3. 解決後把根因和修復方法記錄進進度檔案，並簡要報告給我。

## 第六步：全流程驗證

當進度清單所有條目完成後，做一次完整的端到端測試，至少涵蓋：
- 各服務健康狀態（容器全部 Up、健康端點正常）；
- SSO 統一登入（Keycloak 登入 → 各產品單點/自動登入）；
- LLM 鏈路（經 NewAPI/LiteLLM 發一次真實對話，驗證返回 + PII 脫敏生效）；
- 身份源登入（接了 AD/其他 IdP 時，用對應帳號測一次登入）；
- 監控/可觀測/日誌/告警（確認有資料、告警能觸發）；
- 備份與還原（跑一次備份，驗證能還原）。

最後把測試結果逐項彙總給我，明確標出 ✅通過 / ❌失敗；失敗的項給出根因和後續建議。
````

---

## 三、手動部署（備選）

不想用 Harness 工具時，也可按各平台 `README.md` 和 `*-deploy-guide*.html` 手動部署。核心主線一致：起容器 → 初始化認證/IdP → 配 LLM 渠道 → 初始化各產品 → 配監控/備份。

---

## 四、安全與說明

- 本倉庫**不含任何真實金鑰**，所有真實值在各自執行環境的 `.env` 中（提交的是 `.env.example` 範本）。
- 預設內網 HTTP 明文；如需 HTTPS 見各平台部署指導的相關章節。
- 各平台的踩坑記錄、架構圖、連接埠表、資料流，見對應 `*-deploy-guide*.html` 文檔。

---

## 五、用 AI Agent 維運

這套系統可以完全透過 AI Agent（WorkBuddy、OpenClaw、Microsoft Scout 等）來維運：健康檢查、容器管理、設定修改、Gitea 同步、Ghost 入口網站、備份、發佈、排除故障。

完整教學見 **[AI Agent 維運指南](AI-AGENT-OPS.zh-TW.md)**（提供 9 種語言版本）。
