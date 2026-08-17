# AI AllInOne 管理員手冊

*v0.2 · 部署 · 管理 · 維運*

**第一部分 · 部署篇**

## 1. 平台概覽與架構

### 1.1 這套平台是什麼
「AI AllInOne」是一套**企業內網 AI 平台**，把十幾個開源產品用 Docker 編排成一個整體：統一認證、LLM 路由、PII 遮蔽、AI 應用、企業門戶、原始碼 CI、客戶端分發、統一管理、監控告警、可觀測、日誌、備份恢復——全部走通，且**一個 Keycloak 帳號單點登入所有產品**。
| 層 | 元件 | 作用 |
| --- | --- | --- |
| 統一認證 | Keycloak | SSO / OIDC，可對接 AD/LDAP 或本地帳號 |
| LLM 路由 | NewAPI | 渠道、金鑰、額度、審計、成本 |
| PII 遮蔽 | LiteLLM + Presidio | 模型呼叫前自動遮蔽手機號/身分證/郵箱等 |
| AI 應用 | Dify | 視覺化 AI 應用 / Agent / 知識庫平台 |
| 企業門戶 | Ghost | 公告、新聞、下載中心、員工 Hub |
| 原始碼 / CI | Gitea + Runner | 內部 Git 倉庫 + Actions 自動化 |
| 客戶端 | DeepChat | 本地 AI 桌面客戶端（Win/macOS/Linux） |
| 客戶端分發 | 更新伺服器 | DeepChat 安裝包託管與自動更新 |
| 統一管理 | AI 管理中心 | 唯一管理入口：Dashboard + 產品內嵌 + 審計/成本/報告 |
| 閘道器 | MCP Gateway | Skill / MCP 市場管理 |
| 監控告警 | Prometheus + Grafana + Alertmanager | 容器資源監控 + 告警通知 |
| LLM 可觀測 | Langfuse | 每次模型呼叫的 trace / 延遲 / token / 成本 |
| 統一日誌 | Loki + Promtail | 所有容器日誌聚合檢索 |
| 備份恢復 | backup / restore 指令碼 + 管理頁 | 全量資料每日備份 + 一鍵恢復 |
### 1.2 軟硬體要求
| 專案 | 最低要求 | 推薦配置 |
| --- | --- | --- |
| 作業系統 | Windows 11（Docker Desktop + WSL2 後端） | Windows 11 Pro / 企業版（額外支援 Hyper-V 跑 AD 網域控制站） |
| CPU | 4 核 / 8 執行緒 | 8 核 / 16 執行緒 |
| 記憶體 | 16 GB | 32 GB |
| 磁碟 | 60 GB 可用 SSD | 150 GB+ 可用 SSD |
| GPU | 無需獨立顯示卡 | 無需獨立顯示卡 |
> 📌 依據實測：約 30 個容器空閒時合計約 5 GB 記憶體，Dify 處理/索引、Keycloak JVM、資料庫快取等峰值再增 3–5 GB，加 WSL2 虛擬記憶體，16 GB 為最低、32 GB 為舒適值。所有大模型走外部 API（deepseek-chat 等），本地不做推理，**無需 GPU**。
### 1.3 埠分配表
下文統一用 `<伺服器IP>` 表示宿主機對外地址（當前環境為 `192.168.31.117`，部署時替換成你自己的內網 IP 或網域）。
| # | 產品 | 用途 | 本機訪問 | 內網訪問（員工） |
| --- | --- | --- | --- | --- |
| 1 | AI 管理中心 | 統一管理員門戶 | `127.0.0.1:10086` | `<伺服器IP>:10086` |
| 2 | Keycloak | 認證 / SSO | `127.0.0.1:9090` | `<伺服器IP>:9090` |
| 3 | NewAPI | LLM 路由閘道器 | `127.0.0.1:3000` | `<伺服器IP>:3000` |
| 4 | LiteLLM | PII 遮蔽代理 | `<伺服器IP>:4001` | —（僅被 NewAPI 呼叫） |
| 5 | Dify | AI 應用平台 | `127.0.0.1` | `<伺服器IP>`（80 埠） |
| 6 | Ghost | 企業門戶 | `127.0.0.1:8090` | `<伺服器IP>:8090` |
| 7 | Gitea | 原始碼 + CI/CD | `127.0.0.1:3002` | `<伺服器IP>:3002` |
| 8 | 更新伺服器 | DeepChat 安裝包 | `127.0.0.1:8091` | `<伺服器IP>:8091` |
| 9 | MCP Gateway | Skill / MCP 閘道器 | `127.0.0.1:3100` | `<伺服器IP>:3100` |
| 10 | Grafana | 監控大盤 | `127.0.0.1:3030` | `<伺服器IP>:3030` |
| 11 | Prometheus | 指標採集 / 告警 | `127.0.0.1:9091` | `<伺服器IP>:9091` |
| 12 | Langfuse | LLM 可觀測 | `127.0.0.1:3010` | `<伺服器IP>:3010` |
| 13 | Loki | 日誌聚合（內部） | `127.0.0.1:3110` | —（經管理頁檢視） |
| 14 | MailHog | 本地郵件接收 | `127.0.0.1:8025` | `<伺服器IP>:8025` |
> ⚠️ 統一用**內網 IP** 訪問，不用 `localhost`（Docker Desktop WSL2 對 IPv6 `::1` 支援不穩，導致埠轉發失敗）。資料庫（MySQL/Redis/PostgreSQL）不對使用者開放，僅在 Docker 網路內部通訊。
### 1.4 核心資料流
#### LLM 請求流（最關鍵的一條鏈路）
1. **① 轉發**：DeepChat / Dify 把請求發給 NewAPI（`:3000/v1`）；
2. **② 遮蔽**：NewAPI 轉發到 LiteLLM，LiteLLM 用正則 + Presidio 把手機號/身分證/郵箱等替換成 `[xxx_REDACTED]`；
3. **③ 請求外部模型**：遮蔽後的請求發給 DeepSeek / GPT / Claude；
4. **④ 還原 PII**：響應回來時 LiteLLM 把敏感資訊還原；
5. **⑤ 返回**：最終結果回到客戶端。
#### 其它幾條流
- **認證流**：Keycloak OIDC SSO 統一登入所有 Web 產品（共用 `ai_all_in_one_admin`）；
- **可觀測流**：LiteLLM `success_callback` → Langfuse 追蹤每次呼叫；
- **自動更新流**：Gitea Actions 構建 → 更新伺服器（:8091）→ DeepChat 檢查 `version.txt` 自動下載安裝；
- **統一日誌流**：Promtail 採集各容器日誌 → Loki 聚合 → AI 管理中心「統一日誌」頁查詢。
### 1.5 本書結構導航
本手冊分三部分：**部署篇**（第 1–13 章，從零把平台跑起來）、**管理篇**（第 14–26 章，13 個產品各自的日常操作）、**維運篇**（第 27–29 章，備份/健康檢查/疑難排解）。側邊欄可隨時跳轉，頁面底部有上一章/下一章翻頁。
> ✅ 部署時也可以直接交給 **AI Agent 工具**（WorkBuddy / OpenClaw 等）自動化：把本手冊 + `docker-compose.yml` + `.env.example` + `scripts/` 交給 Agent，讓它按「部署篇」順序逐步執行（詳見第 2 章開頭的 Agent 部署提示詞）。

## 2. 前置準備

### 2.0 兩種部署方式
本手冊可**人工逐章執行**，也可**交給 AI Agent 工具自動執行**。用 Agent 時，把本目錄（含本手冊、`docker-compose.yml`、`.env.example`、`scripts/`）提供給 Agent，貼上下面的提示詞即可。
**複製給 Agent 的部署提示詞：**
```
你是企業內網 AI 平台的部署工程師。請根據本目錄的《管理員手冊》部署篇、docker-compose.yml 與 .env.example，在當前這臺機器上完整部署並驗證「AI AllInOne」平台。全程用中文溝通。

第一步 收集參數（逐項問我，不跳過、不猜測）：
1) 對外服務的內網 IP；2) Skill 市場主機名（網域，替換 mcp-gateway/skills/skill-market/config.json 與 SKILL.md 裡的 <市場主機名>，並在 hosts/DNS 解析）；3) 身分來源（接 AD 網域控制站則要網域/網域控制站 IP/LDAP base DN/bind DN/bind 密碼/sAMAccountName）；4) 統一管理員帳號密碼；5) 大模型 API Key；6) 按需問告警 webhook、HTTPS、備份保留策略。

第二步 生成進度檔案，每完成一項、每解決一個問題就更新並彙報。

第三步 嚴格按本手冊第 1~13 章順序執行，注意各章「⚠️ 關鍵坑」，優先用 scripts/ 下的指令碼自動化。

第四步 出錯先查日誌（docker logs、健康端點、配置）定位根因再修，不盲目重試。

第五步 全流程驗證：容器全 Up、Keycloak SSO、經 NewAPI/LiteLLM 發真實對話驗證 PII 遮蔽、身分來源登入、監控/日誌/告警、備份恢復，逐項彙總 ✅/❌。
```
> 💡 不用 Agent 的話，上面這段也能當「部署前資訊核對清單」：部署前先想清楚內網 IP、身分來源、管理員密碼、模型 Key 這四件事。
### 2.1 安裝並配置 Docker Desktop
Docker Desktop 安裝後預設用 WSL2 後端，通常無需額外配置。若需手動調整資源上限，在使用者目錄建 `.wslconfig`：
```
# %UserProfile%\.wslconfig（例如 C:\Users\你的使用者名稱\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大記憶體（最低 16GB，推薦 24~32GB）
processors=8      # CPU 核心數（按物理核數）
swap=4GB
```
儲存後 PowerShell 執行 `wsl --shutdown`，重啟 Docker Desktop 生效。
> ✅ 驗證：Docker Desktop 狀態列顯示 "Engine running"（綠色）。
### 2.2 準備目錄結構
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 建立 Docker 共享網路
```
docker network create ai-platform
docker network ls | findstr ai-platform   # 驗證
```
> 所有核心容器透過 `ai-platform` 網路用容器名互訪（如 NewAPI 訪問 LiteLLM 用 `http://litellm:4000`，不經過 localhost）。
### 2.4 固定宿主機內網 IP（重要）
宿主機走 WiFi 時 IP 由 DHCP 動態分配，重啟或租約到期會變；變了員工訪問各產品的地址就全失效。建議在路由器做 **DHCP 保留（MAC 繫結）**：
1. 查 WiFi 網路卡 MAC：`ipconfig /all`，找「無線區域網路介面卡 WLAN」的實體地址（如 `60-A3-E3-41-8F-61`）；
2. 登入路由器後臺（如 `http://192.168.31.1`）→ 區域網路設定 / DHCP 靜態 IP 分配；
3. 新增規則：MAC → IP（如 `192.168.31.117`），儲存；
4. 重連 WiFi 確認 IP 固定。
> ✅ DHCP 保留比在 Windows 裡設靜態 IP 更穩（路由器統一管理、不衝突）。
### 2.5 打通網路（最容易卡住的一步）
- **能連 Docker 映像倉庫**：Docker Hub / quay.io / ghcr.io。不通則先配映像加速器（如 DaoCloud）。
- **能連 GitHub**：克隆倉庫、拉取公開依賴。不通則用代理或提前下載原始碼包。
- **目標機器可被內網訪問**：確認要暴露的網段可達。

## 3. 配置檔案與環境變數

### 3.1 三個核心配置檔案
| 檔案 | 用途 | 需要修改嗎 |
| --- | --- | --- |
| `.env.windows` | 所有密碼和外部 API Key | **必須修改**：填 DeepSeek API Key，其它 provider 按需 |
| `litellm-config.yaml` | LiteLLM 模型列表 + PII 遮蔽規則 | 通常不改（只用 DeepSeek 可刪 OpenAI/Claude 條目） |
| `docker-compose.yml` | 核心服務編排 | 已預配置（含 Keycloak `KC_HOSTNAME` + 持久化卷） |
### 3.2 環境變數分類總覽
開啟 `.env`（把 `.env.windows` 複製而來），按優先順序配置。
| 變數 | 優先順序 | 說明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 立即 | 外部 LLM API Key，不配則鏈路不通 |
| `LITELLM_MASTER_KEY` | 🔴 立即 | LiteLLM 內部鑑權金鑰，NewAPI 要用 |
| `NEWAPI_DB_PASSWORD` | 🔴 立即 | MySQL root 密碼，首次建立後不宜改 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 立即 | Keycloak 管理員密碼 |
| `NEWAPI_SESSION_SECRET` | 🔴 立即 | NewAPI 會話加密，隨機字串 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 立即 | NewAPI 資料加密，隨機字串 |
| `ADMIN_PASSWORD` | 🔴 立即 | AI 管理中心 Global Admin 密碼 |
| `SESSION_SECRET` | 🔴 立即 | AI 管理中心會話加密，隨機字串 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 可後配 | 需先在 Keycloak 建 OIDC Client 拿 Secret（見第 12 章） |
| `GITEA_RUNNER_TOKEN` | 🟡 可後配 | 先啟動 Gitea 在後臺拿 Token（見第 9 章） |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 按需 | 要用時取消註釋，並同步改 `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` 等限流項 | ⚪ 預設 | 測試期設 999999，生產酌情調低 |
| `DEFAULT_QUOTA` | ⚪ 預設 | 新使用者預設額度（美元），設 100 即新使用者送 100 美元 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ 預設 | 新使用者註冊自動生成初始 Key，設 true 讓使用者登入即用 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ 預設 | 預設值即可 |
### 3.3 🔴 立即配置（首次啟動前必須完成）
| 變數 | 說明 | 如何獲取 | 格式 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 雲端 LLM Key | 註冊 https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM 內部管理員金鑰（不是外部 LLM Key） | 隨機生成（見下） | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL 密碼 | 自己定，首次建立後**不宜再改** | 任意 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理員密碼 | 自己定，≥ 8 位 | 任意 |
| `NEWAPI_SESSION_SECRET` | NewAPI 會話加密 | 隨機生成 | 32 位 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI 資料加密 | 隨機生成 | 32 位 |
| `ADMIN_PASSWORD` | AI 管理中心管理員密碼 | 自己定，≥ 8 位 | 任意 |
| `SESSION_SECRET` | AI 管理中心會話加密 | 隨機生成 | 64 位 |
生成隨機字串（PowerShell）：
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### 填入 API Key 的示例
```
# 預設已配 DeepSeek（取消註釋並填入 Key）
DEEPSEEK_API_KEY=sk-你的真實DeepSeek金鑰

# 需要 OpenAI / Claude 時取消註釋，並同步取消 litellm-config.yaml 對應 model 塊註釋
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 密碼修改策略
> ⚠️ `NEWAPI_DB_PASSWORD` 涉及已建資料庫，改後需刪對應 volume 重建（資料會丟），建議首次就定好。  
> 
>     `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` 等管理密碼可在各產品後臺改，改完同步更新 `.env`（只是備忘，不影響執行）。
### 3.5 litellm-config.yaml 說明
- `model_list` — 定義可用外部模型，NewAPI 經 LiteLLM 呼叫。預設只啟用 `deepseek-chat`；
- `general_settings.master_key` — LiteLLM 管理員金鑰，讀 `.env` 的 `LITELLM_MASTER_KEY`；
- PII 遮蔽（Presidio）當前**臨時註釋**（新版 LiteLLM guardrail API 變更不相容），後續啟用見第 25 章；
- 用穩定版本 `v1.95.1`（`main-latest` 有已知 bug）。

## 4. 啟動核心服務

### 4.1 複製 .env
```
# PowerShell
copy .env.windows .env
```
Docker Compose 預設讀 `.env`。
### 4.2 啟動全部核心服務
```
docker compose -f docker-compose.yml up -d
```
首次會拉取所有映像（約 5–10 分鐘，取決於網速）。
| 映像 | 容器 | 大小 |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 檢查容器狀態
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
預期 10 個核心容器全部 `Up`。有容器持續 `Restarting` 就 `docker logs 容器名` 看原因。
### 4.4 已知問題修復：Ghost 強制 SQLite
如果 `ghost` 一直 Restarting，日誌報 `Error: connect ECONNREFUSED <伺服器IP>:3306`——說明資料卷裡殘留了指向 MySQL 的舊 `config.production.json`。修復：在 compose 的 ghost 服務 `environment` 顯式宣告 SQLite：
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ Windows + Docker Desktop WSL2 下，卷資料被封在 WSL2 虛擬磁碟內，宿主機 git bash 看不到，無法直接刪卷內 `config.production.json`，只能走「環境變數覆蓋」路線。也不要 `docker volume rm windows_ghost-data`（會丟已釋出文章）。
> ✅ 驗證：日誌出現 `Ghost database ready` + `Ghost booted`，`curl.exe -I http://127.0.0.1:8090` 返回 200。
### 4.5 逐服務驗證可訪問
```
# Keycloak — 302 表示 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302（重定向到 /ghost/ 初始化頁）
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403（空目錄，nginx 在跑）
curl.exe -I http://127.0.0.1:8091
# AI 管理中心 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM 是純 API 無 Web 介面，從容器內部驗證：
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 預期返回 {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 Docker Desktop WSL2 的 HTTP 代理可能導致 LiteLLM 在宿主機無法訪問（HEART/空響應），是已知 bug，不影響 NewAPI 經容器名呼叫它。

## 5. Dify 獨立部署

> 📌 Dify 使用官方 docker-compose（含 ~15 個容器），獨立部署避免埠衝突，使用自己的預設網路（與核心服務的 `ai-platform` 網路不同）。
### 5.1 克隆 Dify
```
# 方案 A：GitHub（需能訪問）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 方案 B：Gitee 官方映像（國內推薦）
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 修復相容性 + 複製環境變數
```
cd dify\docker

# 修復 env_file 格式（相容舊版 Docker Compose）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 複製主環境變數
copy .env.example .env

# 複製所有子模板（sandbox.env 等）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# 修復 Dify 1.16.1 上游校驗問題（必需）
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 驗證
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ 為什麼必須改 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`：Dify 1.16.1 把該欄位從「允許 0」升級為「必須 > 0」，但 `shared.env` 模板還是 0。不改的話 `docker-api-1` / `worker` / `worker_beat` / `api_websocket` 4 個容器啟動即崩，日誌報 `ValidationError: Input should be greater than 0`。
### 5.3 啟動 Dify
```
docker compose up -d
docker compose ps
```
> ✅ 所有容器 `Up`（`init_permissions` 顯示 Exited 是正常的）。瀏覽器開啟 `http://127.0.0.1/install` 初始化管理員帳號。
### 5.4 修復 WebSocket 地址（不改會反覆連 ws://localhost）
`.env` 裡 `NEXT_PUBLIC_SOCKET_URL` 預設是 `ws://localhost`，內網部署時瀏覽器裡的 localhost 指向使用者自己電腦，導致前端反覆連不上（建立應用/工作流除錯會卡住）。
```
# .env 裡改成內網 IP
NEXT_PUBLIC_SOCKET_URL=ws://<伺服器IP>

# docker-compose.yaml 裡 web 服務的 fallback 同步改
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<伺服器IP>}

# 重建 web 容器生效
docker compose up -d web
```
> 📌 改完強刷瀏覽器（Ctrl+F5）。該變數是執行時讀取，改 .env + 重啟 web 即可，無需重建映像。
### 5.5 踩坑速查
> ⚠️ **登入密碼是 base64 傳輸**：Dify 1.16.x 登入介面 `POST /console/api/login` 的 `password` 是 base64 編碼後的密碼。指令碼登入要先 `base64(密碼)`；前端「點登入沒反應」時 console 裡 `GET /account/profile 401` 是未登入的正常現象。
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<公司網域> \
  --new-password '<新密碼>' \
  --password-confirm '<新密碼>'
```
> ⚠️ **忘記管理員密碼重置**：Dify 密碼雜湊是 `pbkdf2_hmac('sha256', password, salt, 10000)`（迭代 10000），無法反解，用容器命令重置（新密碼 ≥ 8 位）：
>     
>     📖 原廠文件：Dify 官方文件 https://docs.dify.ai · 自託管部署 https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak：Realm、使用者與 AD

> 📌 訪問：宿主機 `http://127.0.0.1:9090`，內網 `http://<伺服器IP>:9090`。資料存命名卷 `keycloak-data`，容器重建不丟。憑據見 `.env.windows` 的 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`。
### 6.1 建立 Realm
1. 瀏覽器開啟 `http://127.0.0.1:9090` → Administration Console → 管理員登入；
2. 左上角下拉 → **Create Realm** → Realm name 填 `enterprise-ai` → Create。
### 6.2 方式 A：本地建立帳號（無 AD 的小團隊/測試）
1. **Groups** → Create Group → `ai-admin`；再建 `ai-user`；
2. **Users** → Add user → 使用者名稱 → Create；
3. Credentials 標籤 → 設密碼 → Temporary 關閉；
4. Groups 標籤 → 加入 `ai-user` 組。
### 6.3 方式 B：從 Active Directory 匯入帳號（推薦）
公司已有 Windows AD 網域控制站時，員工用網域帳號登入，無需在 Keycloak 手動建號。前置：Docker 容器到網域控制站網路已互通（網路拓撲、Hyper-V Internal Switch、埠轉發見《Keycloak AD 整合指南》 `windows-ad-integration.html`）。
> 📌 需要的 AD 帳號：服務帳號 `svc_keycloak`（密碼永不過期，用於 LDAP 繫結）+ 2 個測試網域使用者（驗證同步）。
#### 建立 LDAP 使用者聯合
1. enterprise-ai Realm → 左側 **User Federation** → Add provider → **ldap**；
2. 按下表填寫。
| 配置項 | 值 | 說明 |
| --- | --- | --- |
| Vendor | **Active Directory** | 選 AD，不要選 Other（否則 objectGUID 不識別） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 經埠轉發；生產填 `ldap://dc.公司網域:389` |
| Enable StartTLS | **Off** | LDAP 389 或 LDAPS 636 |
| Bind type | **simple** | 使用者名稱+密碼認證 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必須 LDAP DN 格式**，不用 ~~DOMAIN\使用者~~ |
| Bind credentials | `svc_keycloak 密碼` | 見 `.env.windows` |
| Edit mode | **READ_ONLY** | 只讀，不寫回 AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 有子 OU 時改 `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **不要填 cn** |
| RDN LDAP attribute | `cn` | 條目命名屬性 |
| UUID LDAP attribute | `objectGUID` | AD 不可變唯一標識 |
| User object classes | `person, organizationalPerson, user` | 逗號分隔 |
| Search scope | **Subtree** | **不要選 One Level**（否則子 OU 搜不到） |
| Pagination | **On** | 使用者多時分批拉取 |
| Referral | **ignore** | 避免跟到不存在的網域控制站 |
| Import users | **On** | 全量同步匯入 |
| Sync Registrations | **On** | 首登即時同步 |
Save → **Synchronize all users** → 等待同步完成。
- ⚠️ 常見填錯：
      
        Bind DN 用 **LDAP 格式**（`CN=svc_keycloak,CN=Users,DC=xxx`），不是 ~~DOMAIN\使用者~~；
- Username LDAP attribute = `sAMAccountName`，不是 `cn`；
- Search scope = **Subtree**；
- **CN 帶空格原樣保留**：若顯示名帶空格（如 `ai all in one admin` 中間是空格），Bind DN 必須寫 `CN=ai all in one admin,...`，寫成下劃線會連不上。
#### 驗證 AD 登入
1. 無痕視窗開啟 `http://127.0.0.1:9090/realms/enterprise-ai/account`；
2. 用網域帳號登入（使用者名稱 `aitest1` 或 `aitest1@<公司網域>` UPN 均可）；
3. 成功跳轉 Account Console 即透過。
### 6.4 其它企業身分來源（附錄 N 摘要）
Keycloak 還支援多種身分來源，全部接在同一個 `enterprise-ai` Realm 下：
| 身分來源 | 接入方式 | 要點 |
| --- | --- | --- |
| Microsoft Entra ID（原 Azure AD） | Identity Providers → OpenID Connect v1.0 | Azure 註冊應用拿 client id/secret，redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google（內建） | 可用 Mapper 加 `hd=網域` 限制域 |
| GitHub | Identity Providers → GitHub（內建） | OAuth App 回撥 `/broker/github/endpoint` |
| 通用 LDAP（OpenLDAP/FreeIPA） | User Federation → ldap | Vendor 選 Other，Username attribute 用 `uid` |
| 通用 SAML 2.0（Okta/ADFS） | Identity Providers → SAML v2.0 | 貼 IdP 後設資料 URL 自動填充 |
> ✅ 多身分來源共存：可在 Authentication → Browser flow 加 Identity Provider Redirector，按郵箱網域自動選 IdP（`@公司.com`→AD，`@公司.onmicrosoft.com`→Entra ID）。
> 📖 原廠文件：Keycloak 官方文件 https://www.keycloak.org/documentation · 伺服器管理指南 https://www.keycloak.org/server/ · LDAP 聯合 https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI：初始化、渠道與 OIDC

### 7.1 初始安裝嚮導（首次訪問）
NewAPI 首次啟動彈 4 步系統設定嚮導：
1. **資料庫檢查**：點「驗證資料庫連線」，預期綠色勾。
> **管理員帳戶**：使用者名稱 `ai_all_in_one_admin`、郵箱 `ai_all_in_one_admin@<公司網域>`、密碼統一管理員密碼。
>         📌 為什麼先建本地管理員：此時 OIDC 還沒配，NewAPI 不認識 Keycloak，必須先有本地帳號「進門」完成配置，再去系統設定開啟 OIDC。
3. **使用模式**：選「個人使用」（公司內部：員工能註冊、用量分開看、無充值計費模組）。
4. **確認初始化**：建立資料庫表 → 用管理員登入。
### 7.2 配置 LLM 渠道（指向 LiteLLM）
1. **渠道** → 新增新渠道 → 型別 `OpenAI`；
2. Base URL 填 `http://litellm:4000`（容器名，走 Docker 網路，**不是 localhost**）；
3. 金鑰填 `.env` 的 `LITELLM_MASTER_KEY` 實際值（不是示例值，否則報 `No connected db`）；
4. 模型填 `deepseek-chat`（示例，按實際配置）；
5. 儲存 → 點「測試」驗證連通。
配了多個 provider 就重複新增：Claude 型別 `Anthropic Claude`、DeepSeek 型別 `OpenAI`，Base URL 都填 `http://litellm:4000`。
### 7.3 建立 API 金鑰
為 Dify 和 DeepChat 各建一把，分開統計用量：
1. 左側 **API 金鑰** → 新建；
2. 名稱 `dify-key` → 儲存 → 複製 `sk-xxx`（填到 Dify 模型供應商）；
3. 再建 `deepchat-key` → 複製 `sk-xxx`（分發給 DeepChat 使用者）。
### 7.4 允許普通使用者自助申請 Key
員工登入後預設能在「API 金鑰」頁自己新建 Key。要能真正呼叫模型，需滿足兩點（已在 `.env` 預設）：
1. **有額度**：`DEFAULT_QUOTA=100`（新使用者送 100 美元額度）；
2. **有 token**：`GENERATE_DEFAULT_TOKEN=true`（註冊即生成初始 token）。
> ⚠️ 只對「新註冊」使用者生效：已登入過的使用者（如 `aitest1`）不會自動補發，需管理員在「使用者」頁手動設額度。
### 7.5 接入 Keycloak OIDC（讓 AD 使用者直接登入）
#### ① 在 Keycloak 建 NewAPI OIDC Client
1. enterprise-ai Realm → **Clients** → Create client；
2. Client ID `newapi`，型別 OpenID Connect；
3. **Client authentication：On**（必開，否則沒 Credentials 標籤）、Standard flow / Direct access grants：On；
4. Valid redirect URIs：`http://<伺服器IP>:3000/*` 和 `http://127.0.0.1:3000/*`；
5. 儲存 → Credentials 標籤 → 複製 Client secret。
#### ② 在 NewAPI 開啟 OIDC
NewAPI 後臺 → **系統設定 → 身分驗證 → 自定義 OAuth → 新增 OAuth 提供商**，填：
| 分組 | 配置項 | 值 |
| --- | --- | --- |
| 快速設定 | 預設模板 / API 地址 | `Keycloak` / `http://127.0.0.1:9090` |
| 基本資訊 | 提供商名 / 識別符號 | `Keycloak` / `keycloak` |
| 憑證 | Client ID / Secret | `newapi` / Keycloak 複製的值 |
| 端點 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 欄位對映 | 使用者 ID / 使用者名稱 / 郵箱 | `sub` / `preferred_username` / `email` |
點「自動發現」填好端點後，**把令牌端點、使用者資訊端點改成 `host.docker.internal:9090`**（NewAPI 容器內部調 Keycloak 用），授權端點保持 `<伺服器IP>:9090`（瀏覽器跳轉用）。作用域 `openid profile email`。
- ⚠️ 兩個必改，否則登入失敗：
      
        **儲存後回 Keycloak 補回撥 URL**：把 `http://<伺服器IP>:3000/oauth/keycloak` 和 `http://127.0.0.1:3000/oauth/keycloak` 加進 Valid redirect URIs；
- **NewAPI「伺服器地址」設為內網地址**：系統設定 → 通用設定 → 伺服器地址改 `http://<伺服器IP>:3000`（預設 localhost 會導致換 token 報 `invalid_grant - Incorrect redirect_uri`）。改後本機也要用內網 IP 訪問 NewAPI。
改資料庫的方法：
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<伺服器IP>:3000') ON DUPLICATE KEY UPDATE value='http://<伺服器IP>:3000';"
docker compose restart new-api
```
> ⚠️ 疑難排解：登入返回 **429 Too Many Requests**——NewAPI 關鍵介面限流（預設 20 次/20 分鐘）觸發。臨時解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；永久方案已在 `.env` 預設 `CRITICAL_RATE_LIMIT_ENABLE=false` 等四組變數。
> 📖 原廠文件：NewAPI 官方文件 https://docs.newapi.pro · 官網 https://www.newapi.ai · 開源倉庫 https://github.com/QuantumNous/new-api

## 8. LiteLLM：驗證與快取

> ⚠️ PII 遮蔽（Presidio guardrail）當前**暫時禁用**：新版 LiteLLM 的 guardrail 配置格式變更，`litellm-config.yaml` 該段已註釋，當前 LiteLLM 僅做代理轉發（不遮蔽）。啟用方法見第 25 章。
### 8.1 驗證 LiteLLM 基本可用
```
curl -X POST http://<伺服器IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` 是 LiteLLM 管理員金鑰，取 `.env` 實際值（不是佔位符本身，否則 401）。且必須用內網 IP `<伺服器IP>:4001`，不能用 `127.0.0.1:4001`（WSL2 埠轉發問題）。
### 8.2 響應快取（已內建，節省 token）
LiteLLM 已啟用 Redis exact match 快取：完全相同的請求（模型+訊息+參數）直接返回快取，跨使用者共享、省 token。
```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 獨立快取 Redis
    port: 6379
    ttl: 3600            # 快取 1 小時
```
> 驗證：`curl http://<伺服器IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` 返回 `ping_response: true`；連續兩次相同請求，第二次耗時降到毫秒級。關閉快取：`cache: false` 後重啟 litellm。
### 8.3 新增更多 LLM 提供商
1. `.env` 取消 `# OPENAI_API_KEY=` 註釋填 Key；
2. `litellm-config.yaml` 取消對應 model 塊註釋；
3. `docker compose up -d litellm`。
> 📖 原廠文件：LiteLLM 官方文件 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Dify / Ghost / Gitea 配置

### 9.1 Dify：配置模型供應商
1. 開啟 `http://<伺服器IP>` → 首次設管理員郵箱/密碼（郵箱 `ai_all_in_one_admin@<公司網域>`）；
  - **設定 → 模型供應商** → OpenAI-API-compatible → 新增模型：
        
          模型名 `deepseek-chat`（按實際）；
  - API Key：`dify-key` 的 `sk-xxx`；
  - API endpoint：`http://host.docker.internal:3000/v1`。
3. 工作室 → 建立聊天助手 → 選模型 → 發訊息驗證。
> ⚠️ Dify 用 `host.docker.internal` 而不是容器名，因為 Dify 在自己網路裡、與 NewAPI 不同網路。
### 9.2 Ghost：配置門戶
1. 後臺入口 `http://<伺服器IP>:8090/ghost/`（**注意 /ghost/ 字尾**）。首次走 setup 嚮導建管理員（郵箱 `ai_all_in_one_admin@<公司網域>`，密碼 ≥10 位）；
2. 自動化：直接跑 `scripts\ghost-setup.ps1` 用 setup API 一次建管理員，等效嚮導（已初始化自動跳過）；
3. **主題**：外觀 → 主題，自帶的 Casper/Source 直接啟用即可；
4. **導航選單**：外觀 → 選單 → 建「主導航」。
| 選單項 | 型別 | URL |
| --- | --- | --- |
| 首頁 | 頁面 | `/` |
| 新聞動態 | 分類 | `/category/news` |
| 下載中心 | 頁面 | `/downloads` |
| AI 工作臺 | 自定義連結 | `http://<伺服器IP>` |
| 幫助文件 | 分類 | `/category/docs` |
1. **下載中心頁面**：頁面 → 新建「下載中心」（slug `downloads`），內容放 DeepChat 安裝包內網連結。
```
## DeepChat 企業版
### Windows
- [DeepChat v1.1.0（Windows x64）](http://<伺服器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0（macOS x64）](http://<伺服器IP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ 別在門戶首頁 `/` 點「註冊」——那是訪客訂閱者註冊（未配 SMTP 會 500）；管理員入口是 `/ghost/`。別從 GitHub 裝最新版主題（可能適配 Ghost 6.x，5.x 報 incompatible）。
### 9.3 Gitea：初始化和 Runner 註冊
1. 開啟 `http://<伺服器IP>:3002` → 安裝嚮導（資料庫 SQLite 已預配）→ 建管理員（使用者名稱 `ai_all_in_one_admin`）；
2. 右上角頭像 → **Site Administration → Actions** → 確認 Enabled Actions 開啟；
3. **Runners → Create new Runner** → 複製 Registration Token；
4. 把 Token 填進 `.env` 的 `GITEA_RUNNER_TOKEN`，重建 Runner：
```
# ⚠️ 必須用 up -d，不能用 restart（restart 不重讀 .env 的 token）
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ 踩坑 1：報 `readonly database` 多為 `gitea.db` 被 root 屬主，刪掉那個 root 屬主的 db 讓它以 git 使用者重建。  
> 
>     ⚠️ 踩坑 2：`ROOT_URL` 要設成 `http://<伺服器IP>:3002/`，否則生成的倉庫連結是 localhost，員工點開失效。
> 
>     📖 原廠文件：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中文） https://docs.gitea.com/zh-cn

## 10. DeepChat 分發與 CI/CD

### 10.1 分發鏈路
分發鏈路 = GitHub Releases 安裝包 → `deepchat-sync` 倉庫的 Gitea Actions → 更新伺服器（:8091）→ Ghost 下載頁 → 員工下載。
> 📌 已刪除 `deepchat` 原始碼 mirror 倉庫——mirror 只同步 git 原始碼、不同步 release 安裝包，對分發無用。若要做原始碼審計/二次開發再單獨建。
### 10.2 下載安裝包到更新伺服器
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
驗證：`curl -I http://<伺服器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206。再更新 Ghost 下載頁（見第 9 章）。
### 10.3 自動同步（Gitea Actions，推薦）
| 元件 | 說明 |
| --- | --- |
| `deepchat-sync` 倉庫 | 普通倉庫（不能用 mirror），放 `.gitea/workflows/sync.yml` + `update_ghost.py` |
| 觸發 | `schedule`（每天 UTC 2 點）+ `workflow_dispatch`（手動） |
| 邏輯 | 查 GitHub 最新 tag → 對比 `version.txt` → 有新版則下載 + 更新 Ghost 下載頁 + 寫版本 |
```
# 手動觸發一次
curl -X POST "http://<伺服器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密碼>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ 關鍵坑：① act_runner 的 `container.network` 必須透過 `config.yaml`（+`CONFIG_FILE` 環境變數）配，否則 job 容器解析不了 `gitea` 主機名；② docker.sock 由 runner 自動掛載，別在 options 裡再掛（報 Duplicate mount point）。
### 10.4 國內下載源配置（sync-config.json）
官網 `deepchatai.cn` 下載頁的安裝包仍指向 GitHub，國內基本不通。真正解決靠 `sync-config.json`：
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
### 10.5 方式 B：Docker 構建自定義版本（可選）
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# 容器內
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# 產物在 dist/，退出後 copy 到 deepchat-updates/
```
### 10.6 配置 DeepChat 客戶端（員工側）
1. DeepChat → 設定 → 模型服務 → 自定義 Provider / OpenAI 相容；
2. API Base URL：`http://<伺服器IP>:3000/v1`（必須內網 IP）；
3. API Key：`deepchat-key` 的 `sk-xxx`；
4. 模型：`deepseek-chat`，儲存後測試對話。
> 📖 原廠文件：DeepChat 快速開始 https://deepchatai.cn/docs/guide/getting-started/ · 開源倉庫 https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway 與 Skill 市場

> 📌 MCP Gateway 基於官方 `@modelcontextprotocol/sdk`，暴露標準 Streamable HTTP `/mcp` 端點，已併入主 `docker-compose.yml`（埠 3100），隨核心服務一起啟動。原始碼在 `mcp-gateway/`。
### 11.1 內建平台工具
| 工具 | 用途 |
| --- | --- |
| `platform_time` | 返回伺服器當前時間 |
| `platform_echo` | 回顯文字（連通性測試） |
| `platform_services` | 列出平台服務清單 |
### 11.2 聚合外部 MCP Server
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
### 11.3 客戶端接入
1. DeepChat：設定 → MCP → 新增伺服器 → 型別「可流式傳輸的 HTTP」，URL `http://<伺服器IP>:3100/mcp`；
2. Dify 工作流：自定義工具 / MCP 工具配置指向同地址。
> 驗證：`curl http://<伺服器IP>:3100/health` 返回 `{"status":"ok"}`；`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` 返回工具列表。
### 11.4 Skill 市場（內網技能包分發）
| 端點 | 作用 |
| --- | --- |
| `/market` | Skill 市場頁（卡片瀏覽 + 下載 ZIP + 複製安裝地址） |
| `/skills` | 技能清單 JSON（name/description/version） |
| `/skills/<名稱>.zip` | 技能包下載（動態打包） |
技能放在 `mcp-gateway/skills/` 目錄（含 SKILL.md 的子目錄），**每次請求自動掃描，無需重啟**。內建 `skill-market` 引導技能。
> 📌 DeepChat 裡 MCP 和 Skill 是兩個概念：MCP 是「工具」（function calling），Skill 是「智慧體技能包」（SKILL.md + 指令碼）。DeepChat 的 Skill 沒有「自定義市場 URL」，只支援資料夾/ZIP/URL 三種安裝，內網分發靠「URL 安裝」變相實現。
### 11.5 ⚠️ Skill 市場主機名（部署參數，必須替換）
「技能管家」讀 `config.json` 的 `market_url` 請求 `/skills` 清單。兩個關鍵點：
- **用主機名，不能用 IP**：DeepChat 的 agent 環境會把 IP 遮蔽成 `[IP_ADDRESS_REDACTED]`，導致讀不到真實地址；
- **主機名是部署參數**：每套部署都不同，不能照抄。
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<市場主機名>:3100" }
```
##### 自動（用 Agent 部署）
Agent 在收集參數時會問「Skill 市場主機名」，自動替換 `config.json` 和 `SKILL.md` 裡的 `<市場主機名>`。
##### 手動
1. 編輯 `config.json` + `SKILL.md` 兜底地址，替換 `<市場主機名>`；
2. 讓主機名可解析：單機在 `C:\Windows\System32\drivers\etc\hosts` 加 `<伺服器IP>  <主機名>`；公司內網在 DNS 加 A 記錄。
> ✅ 主機名建議用「服務名+公司網域」FQDN，如 `skillmarket.你的公司網域`。DNS 加 A 記錄：網域控制站「DNS → 正向查詢區域 → 你的網域 → 新建主機(A)」，或用 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "你的網域" -IPv4Address "<伺服器IP>"`。
### 11.6 管理 API（供 AI 管理中心增刪改）
| 端點 | 作用 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server 增刪改查（寫回配置+自動重連） |
| `POST /api/skills/upload` | 上傳技能 zip（校驗 SKILL.md、防路徑穿越） |
| `DELETE /api/skills/:name` | 刪除技能 |
需 `X-Admin-Token` 頭（`.env` 的 `MCP_ADMIN_TOKEN`）。由 AI 管理中心「MCP Gateway」頁代理呼叫（`ai-platform-admin` 角色保護）。
> 📖 原廠文件：MCP 協議官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. AI 管理中心

> 📌 定位：不是 Docker 管理平台（1Panel/Portainer），而是面向管理員的統一後臺——Keycloak 鑑權 + 左側選單連結全部產品 + Dashboard 叢集狀態 + 統一管理員帳號。
### 12.1 核心能力
| 選單項 | 行為 | 說明 |
| --- | --- | --- |
| 📊 總覽儀表板 | 內嵌頁面 | 8 個產品業務指標 + Docker 服務（按產品分組）+ 系統資訊 |
| Ghost / Dify / Gitea / Keycloak | 內嵌統計頁 | 先看統計，點「開啟後臺」才跳轉 |
| 🔀 NewAPI 管理 | 內嵌頁面 | 渠道/使用者/金鑰 + 成本報表 + 審計日誌 |
| 🔌 MCP Gateway | 內嵌管理頁 | 增刪 MCP Server、上傳/刪除 Skill |
| 📈 監控 / 🔍 可觀測 | 新標籤頁 | Grafana :3030 / Langfuse :3010 |
| 📜 統一日誌 | 內嵌頁 | 按容器+關鍵字+時間查 Loki |
| 💾 備份恢復 | 內嵌頁 | 備份列表 + 立即備份 + 一鍵恢復 |
| 🩺 可用性測試 | 內嵌頁 | 定時+手動測全鏈路 |
| 📄 報告生成 | 內嵌頁 | 自定義週期匯出 .md |
| ⚙️ 系統設定 | 內嵌頁 | 介面語言 9 種 + 產品入口 URL |
### 12.2 初始化 Global Administrator
```
# .env 中配置
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=見帳號密碼清單
ADMIN_EMAIL=ai_all_in_one_admin@<公司網域>
```
啟動後自動在 Keycloak 建 `ai_all_in_one_admin` 使用者（已有則跳過），分配 `ai-platform-admin` Realm Role。核心理念：**一個 Global Admin 帳號管理所有平台**。
### 12.3 Docker Compose 部署
```
# 前置：先裝依賴（一次）
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<伺服器IP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<公司網域>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<伺服器IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Keycloak 客戶端配置
1. Keycloak → enterprise-ai → Clients → Create；
2. Client ID `AI-all-in-one-admin-portal`，Client authentication / Standard flow 都 On；
3. Valid Redirect URIs：`http://127.0.0.1:10086/*` 和 `http://<伺服器IP>:10086/*`；
4. 複製 Client Secret → 填 `.env` 的 `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`；
5. 建 Realm Role `ai-platform-admin`，分配給 `ai_all_in_one_admin`。
- ⚠️ 部署/疑難排解要點：
      
        admin-portal 會話存記憶體，`up -d` 重建容器會**清空登入會話**（需重登）；
- 首頁 `/` 必須走 Keycloak 保護（`express.static(..., {index:false})` + 顯式 `app.get('/', keycloak.protect())`），否則未登入直接渲染空看板；
- 統計 Dify 用實際管理員郵箱（`ai_all_in_one_admin@<公司網域>`，須與 AD 全域管理員一致）；
- **改 server.js 後必須 `docker restart admin-portal`**，不能用 `up -d`（volume 檔案內容變化不會觸發重建）。
### 12.5 驗證
1. 開啟 `http://<伺服器IP>:10086` → 自動跳 Keycloak 登入（未登入不顯示空看板）；
2. 用 `ai_all_in_one_admin` 登入 → 進總覽儀表板；
3. Dashboard 顯示 8 個產品指標 + 容器分組；
4. 點各產品先看統計、點「開啟後臺」才跳轉；
5. 系統設定可切 9 種語言。
### 12.6 管理員分模組授權 + Keycloak 認證頁管理（v0.91）
全域管理員可在 AI 管理中心直接管理其他管理員和 Keycloak：
- **管理員帳號管理**：從 Keycloak 關聯的 IdP 搜尋既有帳號（AD/LDAP 使用者，無需新建、無需密碼）→ 勾選模組 → 確定。系統分配 `admin:<產品>` Realm Role，並**真實開通到產品**（SSO 優先、API 兜底）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。撤銷模組或刪除管理員會**從產品刪除該帳號**。無 SSO 產品建號產生臨時密碼，🔑 圖示可回看（僅全域管理員）。非管理員登入彈「你不是管理員」並退出。
- **Keycloak 認證頁**：「全部同步 / 增量同步」按鈕一鍵拉取 AD 屬性變更；每列使用者有「編輯」（跳 Keycloak 控制台）和「刪除」；角色區塊可新建/刪除角色、查看成員。同步/刪除/角色操作僅全域管理員。
> ⚠️ 注意：Keycloak 無「單一使用者同步」端點，增量同步會同步 AD 裡所有有變更的帳號；AD 同盟使用者刪除後下次全量同步或再次 SSO 登入會重新出現，徹底移除請在 AD 停用/刪除該帳號。

## 13. 互連驗證清單

部署篇到此結束。最後按下面 12 項逐條驗證，全部 ✅ 才說明平台真正跑通。
| # | 互連 | 驗證方式 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI 渠道測試收到 OK |
| 2 | Dify → NewAPI | Dify 模型供應商測試收到回覆 |
| 3 | DeepChat → NewAPI | DeepChat 發訊息收到回覆 |
| 4 | Keycloak → NewAPI | Keycloak 帳號 OIDC 登入 NewAPI |
| 5 | Keycloak → Dify | Keycloak 帳號 SSO 登入 Dify |
| 6 | MCP Gateway → DeepChat | DeepChat 獲取 MCP 工具列表並呼叫 |
| 7 | MCP Gateway → Dify | Dify 工作流呼叫 MCP 工具 |
| 8 | Gitea Runner → Docker | Runner 可執行 CI/CD 任務 |
| 9 | Gitea → 更新伺服器 | CI 產物可上傳到更新伺服器 |
| 10 | Ghost API → Gitea | Gitea Actions 可調 Ghost API 發公告 |
| 11 | Ghost → Dify 跳轉 | 門戶「AI 工作臺」正確跳 Dify |
| 12 | AI 管理中心 | Dashboard 顯示全部容器 + 左側選單可訪問所有產品 |
> ✅ 全部透過後，繼續讀第二部分「管理篇」學習各產品的日常操作，以及第三部分「維運篇」的備份、健康檢查、疑難排解。

**第二部分 · 管理篇（各產品日常操作）**

## 14. Keycloak 日常管理

Keycloak**入口**：http://<伺服器IP>:9090 → Administration Console → 管理員登入。
> 📌 很多操作也可在 AI 管理中心 → Keycloak 認證頁完成（僅全域管理員）：LDAP 全量/增量同步、刪除使用者、角色管理（列表/新建/刪除/查看成員）。見第 12.6 章。
### 14.1 管理使用者
1. **新建使用者**：Users → Add user → 填使用者名稱 → Create；
2. **設密碼**：該使用者 Credentials 標籤 → 設密碼 → Temporary 關閉（否則首次登入強制改密）；
3. **重置密碼**：Users → 搜到使用者 → Credentials → Set password；
4. **禁用/啟用**：使用者詳情頂部 Enabled 開關（禁用後該使用者所有 SSO 立即失效）；
5. **刪除**：使用者詳情 → Delete。
### 14.2 角色與權限
- **Realm Role**：Realm roles → Create role 建角色（如 `ai-platform-admin`）；
- **分配角色**：使用者 → Role mapping → Assign role；
- **組**：Groups → 建組（`ai-admin` / `ai-user`）→ 組內加使用者，角色賦給組，使用者隨組繼承權限。
> ✅ 管理權限統一由 `ai-platform-admin` 角色控制，各產品接 SSO 時用這個角色識別管理員。
### 14.3 OIDC 客戶端（新產品接 SSO）
1. Clients → Create client → Client ID 填產品名（如 `newapi` / `grafana` / `langfuse`）；
2. Client authentication：On（否則沒有 Credentials 標籤）、Standard flow：On；
3. Valid redirect URIs / Web origins 填產品的回撥地址（內網 IP + 127.0.0.1 兩個都加）；
4. 儲存 → Credentials 標籤複製 Client secret 給產品側。
### 14.4 AD / LDAP 聯邦維護
- **改網域控制站/密碼**：User Federation → 點 LDAP Provider → 改 Connection URL / Bind credentials → Save；
- **手動同步**：Synchronize all users；
- **組對映**：Mappers 標籤 → group-ldap-mapper → Groups DN 設 AD 組所在容器，把 AD 組對映成 Keycloak 角色。
### 14.5 會話管理
- **檢視活躍會話**：Users → 某使用者 → Sessions；
- **強制下線**：Sessions → Sign out all；
- **全域會話/令牌配置**：Realm settings → Sessions / Tokens 標籤調超時。
> ⚠️ 關鍵坑回顧：① bind DN 的 CN 帶空格原樣保留；② Username LDAP attribute 用 `sAMAccountName` 不是 `cn`；③ Search scope 選 Subtree；④ SSO 報 `unknown_error` 多為宿主機 iphlpsvc 未執行導致 AD 埠轉發失效；⑤ AD 網域控制站 VM 未開機時，LDAP 聯合的帳號登入會報 `LDAP Connection refused`。
> 📖 原廠文件：Keycloak 官方文件 https://www.keycloak.org/documentation · 伺服器管理指南 https://www.keycloak.org/server/

## 15. NewAPI 日常管理

NewAPI**入口**：http://<伺服器IP>:3000。
### 15.1 渠道管理（上游模型）
1. **新增渠道**：渠道 → 新增新渠道 → 型別 OpenAI（或 Claude 等）→ Base URL `http://litellm:4000` → 金鑰 `LITELLM_MASTER_KEY` → 填模型名 → 儲存；
2. **測試**：渠道列表點「測試」，選模型驗證連通；
3. **禁用/啟用**：渠道列表開關，禁用後該渠道不再承接請求；
4. **優先順序/權重**：多渠道同模型時按優先順序/權重分流。
### 15.2 令牌（API Key）管理
1. **新建**：API 金鑰 → 新建令牌 → 起名（如 `deepchat-key`）→ 可設額度/過期時間/模型限制 → 儲存；
2. **複製 Key**：`sk-` 開頭，**只顯示一次，立即儲存**；
3. **禁用/刪除**：令牌列表操作（禁用後該 Key 立即失效）；
4. **查用量**：令牌詳情看已消耗額度。
### 15.3 額度與使用者
- **新使用者預設額度**：`DEFAULT_QUOTA`（建議 100 美元）；
- **給單個使用者提額**：使用者頁 → 編輯該使用者 → 設額度；
- **充值/封禁**：使用者頁操作；
- **分組管理**：按部門建分組，設模型倍率/配額，使用者歸組即按部門管控。
### 15.4 日誌與成本
- **日誌頁**：查每次呼叫的使用者/模型/token/額度/成本/來源 IP；
- **成本報表**：AI 管理中心「NewAPI 管理」頁有按使用者/模型/日期聚合的成本報表 + 最近 100 條審計日誌。
> 📌 客戶端 IP 記錄依賴使用者「記錄 IP 日誌」設定（`record_ip_log`，預設關），需要 IP 審計時給對應使用者開啟。
### 15.5 系統設定要點
- **伺服器地址**：必須設為內網 `http://<伺服器IP>:3000`（否則 OIDC 報 `invalid_grant - Incorrect redirect_uri`）；
- **身分驗證 → 自定義 OAuth**：Keycloak OIDC 接入（見第 7 章）；
- **使用模式**：個人使用 ↔ 對外運營可切換。
> ⚠️ 關鍵坑回顧：① 渠道 Base URL 都填容器名 `http://litellm:4000`；② 限流 429 用 `CRITICAL_RATE_LIMIT_ENABLE=false` 等變數控制；③ 改資料庫直接用 `MYSQL_PWD` 環境變數，避免 stderr 密碼警告被誤判錯誤。
> 📖 原廠文件：NewAPI 官方文件 https://docs.newapi.pro · 官網 https://www.newapi.ai · 開源倉庫 https://github.com/QuantumNous/new-api

## 16. LiteLLM 日常管理

**入口**：http://<伺服器IP>:4001（純 API，無 Web 介面，除錯用 `/v1/models`）。配置在 `litellm-config.yaml`。
### 16.1 模型列表維護
編輯 `litellm-config.yaml` 的 `model_list`，增刪模型與對應 API Key。加新 provider 的步驟：
1. `.env` 取消 `# OPENAI_API_KEY=` 註釋填 Key；
2. `litellm-config.yaml` 取消對應 model 塊註釋；
3. `docker compose up -d litellm`。
### 16.2 響應快取
Redis exact match 快取，完全相同請求跨使用者共享。調 `cache_params.ttl`（預設 3600 秒）。關閉：`cache: false` 後重啟。
### 16.3 Langfuse 上報
透過 `success_callback: ["langfuse"]` + `.env` 的 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` 自動上報每次呼叫。
### 16.4 重啟與疑難排解
```
docker compose restart litellm          # 改配置後重啟
docker logs litellm --tail 50           # 看日誌
```
> ⚠️ 關鍵坑：① guardrails 要加 `default_on: true` 才全域生效；② PII 遮蔽（Presidio）當前因上游 API 變更暫註釋，僅做純代理；③ 用穩定版 `v1.95.1`（`main-latest` 有 bug）。
> 📖 原廠文件：LiteLLM 官方文件 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Dify 日常管理

Dify**入口**：http://<伺服器IP>（80 埠，獨立官方 compose，升級維護在 `dify/docker/` 單獨操作）。
### 17.1 應用管理（工作室）
1. **建立應用**：工作室 → 建立空白應用 → 選型別（聊天助手 / Agent / 工作流 / 文字生成）；
2. **編排**：拖拽節點編排提示詞、工具、知識庫、變數；
3. **除錯**：右上角「預覽」執行除錯；
4. **釋出**：除錯透過後「釋出」→ 生成分享連結或嵌入 Web 應用。
### 17.2 知識庫管理
1. 知識庫 → 建立知識庫；
2. 上傳文件（Word / PDF / Markdown / 網頁連結），選分段規則 + 索引方式（高質量/經濟）；
3. 在應用裡「新增」該知識庫，AI 即可基於文件回答。
> 📌 知識庫內容會被 AI 用於回答，機密資料不要上傳（遵守資料分級規範）。
### 17.3 模型供應商
- **新增模型**：設定 → 模型供應商 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（走 NewAPI）+ `dify-key`；
- **系統模型設定**：指定預設聊天/推理/嵌入模型。
### 17.4 成員與權限
- **成員**：邀請成員進工作空間，設 Owner/Admin/Editor/Normal 角色；
- **登入方式**：設定 → 登入方式 → 可接 OIDC（Keycloak）實現 SSO。
### 17.5 升級與維護
```
cd dify\docker
git pull                          # 拉最新版
docker compose pull               # 拉新映像
docker compose up -d              # 重建
```
> ⚠️ 關鍵坑：① WebSocket `NEXT_PUBLIC_SOCKET_URL` 要設內網 IP；② 登入密碼是 base64 編碼；③ 忘密碼用 `docker exec docker-api-1 flask reset-password`（≥8 位）。
> 📖 原廠文件：Dify 官方文件 https://docs.dify.ai · 自託管 https://docs.dify.ai/getting-started/install-self-hosted

## 18. Ghost 日常管理

Ghost**入口**：前臺 http://<伺服器IP>:8090；後臺 http://<伺服器IP>:8090/ghost/（注意 /ghost/ 字尾）。
### 18.1 登入後臺
Ghost 5 後臺是**免密登入**：輸入郵箱 → Ghost 發 6 位驗證碼到 MailHog（`:8025`）。更快的方式：在 AI 管理中心點「Ghost 後臺」的「開啟」按鈕，自動完成登入（本地算 TOTP 碼，免翻郵件）。
### 18.2 釋出內容
1. **文章**：Posts → New post → 寫內容（Markdown 編輯器）→ Publish；
2. **頁面**：Pages → New page（如「下載中心」slug `downloads`）；
3. **標籤/分類**：Tags → 建分類（如 `news` / `docs`），文章歸到分類下。
### 18.3 導航選單
1. 後臺 → 外觀（Design）→ 選單（Navigation）；
2. 編輯「Primary」主導航，新增首頁/新聞/下載中心/AI 工作臺/幫助文件（見第 9 章選單表）。
### 18.4 主題
- **切換**：外觀 → 主題，自帶的 Casper / Source 直接啟用；
- **安裝**：主題市場（Design → Change theme）或上傳 zip。
> ⚠️ 別從 GitHub 裝最新版主題（可能適配 Ghost 6.x，5.x 報 incompatible），要裝舊版 zip。
### 18.5 成員與訂閱（如需）
- Members：管理訂閱者；
- 若不需要訂閱，可忽略此模組（內網門戶通常用不到）。
### 18.6 整合（API Token）
1. 後臺 → Settings → Integrations → 新增自定義整合；
2. 生成 Admin API Key（格式 `id:secret`），供 Gitea Actions 釋出公告等自動化用。
> ⚠️ 關鍵坑：① 別在首頁 `/` 點「註冊」（那是訪客訂閱者註冊）；② 6 位驗證碼本質是 TOTP，AI 管理中心能本地算出；③ 即使本地算碼，Ghost 仍會真發郵件，所以 MailHog 必須保留（否則 `Failed to send email`）。
> 📖 原廠文件：Ghost 官方文件 https://ghost.org/docs/ · 管理後臺 https://ghost.org/docs/admin/

## 19. Gitea 日常管理

Gitea**入口**：Web http://<伺服器IP>:3002；SSH `ssh://git@<伺服器IP>:2222`。
### 19.1 倉庫與組織
1. **建倉庫**：右上角 + → New repository；
2. **建組織**：+ → New organization，組織下建倉庫、管理團隊；
3. **遷移外部倉庫**：+ → New migration，填 GitHub 地址可 mirror（只讀同步原始碼）。
### 19.2 使用者與權限
- **新增使用者**：Site Administration → User Accounts → Create user；
- **倉庫權限**：倉庫 → Settings → Collaborators；
- **組織團隊**：組織 → Teams → 建團隊 → 加成員 → 賦倉庫權限。
### 19.3 Actions / Runner 管理
1. **啟用 Actions**：Site Administration → Actions → Enabled；
2. **註冊 Runner**：Runners → Create new Runner → 複製 Token → 填 `.env` 的 `GITEA_RUNNER_TOKEN` → `docker compose up -d gitea-runner`；
3. **看 Runner 狀態**：Runners 頁顯示 Idle（綠色）即正常；
4. **跑工作流**：倉庫 → Actions → 手動執行或 push 觸發。
> ⚠️ 改 Runner token 必須 `up -d`（restart 不重讀 .env）。
### 19.4 站點設定
- **ROOT_URL**：`GITEA__server__ROOT_URL` 要設內網 `http://<伺服器IP>:3002/`，否則生成的倉庫連結是 localhost；
- **註冊策略**：Site Administration → Config 調註冊開關、郵箱配置。
> ⚠️ 關鍵坑：報 `readonly database` 多為 `gitea.db` 被 root 屬主，刪掉那個 root 屬主的 db 讓它以 git 使用者重建。
> 📖 原廠文件：Gitea 官方文件（中文） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. MCP Gateway 日常管理

**入口**：http://<伺服器IP>:3100（市場頁 `/market`）。管理經 AI 管理中心「MCP Gateway」頁操作（`ai-platform-admin` 角色），也可直接調管理 API。
### 20.1 管理 MCP Server
1. 編輯 `mcp-gateway/mcp-servers.json` 增刪伺服器（stdio/http 兩種）；
2. 重啟 `docker compose restart mcp-gateway`；
3. 或在 AI 管理中心 MCP Gateway 頁增刪（寫回配置 + 自動重連）。
### 20.2 管理 Skill（技能包）
1. **上傳**：AI 管理中心 MCP Gateway 頁 → 上傳技能 zip（校驗含 SKILL.md、防路徑穿越）；
2. **刪除**：對應技能刪除；
3. 技能放 `mcp-gateway/skills/`（含 SKILL.md 的子目錄），每次請求自動掃描，無需重啟。
### 20.3 擴充套件內建工具
在 `mcp-gateway/gateway.js` 加兩步：
```
// ① 工具定義（builtinTools 陣列加一項）
{ name: 'platform_health', description: '查詢服務健康狀態',
  inputSchema: { type: 'object', properties: {} } }

// ② 執行邏輯（callBuiltin 加一個分支）
if (name === 'platform_health') { return '所有服務執行正常'; }
```
改完 `docker compose restart mcp-gateway`。
### 20.4 維護 skill-market 市場地址
「技能管家」的 `market_url` 在 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`，必須用主機名（不能用 IP），是部署參數（詳見第 11 章）。
> ⚠️ 管理 API 需 `X-Admin-Token` 頭（`.env` 的 `MCP_ADMIN_TOKEN`）；未配返回 503、錯 token 返回 401。
> 📖 原廠文件：MCP 協議官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. 更新伺服器管理

**入口**：http://<伺服器IP>:8091，資料在 `deepchat-updates/`。
### 21.1 手動放置新版本
1. 下載 DeepChat 官方安裝包到 `deepchat-updates/deepchat/`；
2. 更新 `version.txt`（寫入新版本號）；
3. 員工側 DeepChat 自動更新時檢查 `version.txt` 發現新版即下載安裝。
### 21.2 自動同步（推薦）
靠 `deepchat-sync` 倉庫的 Gitea Actions 每天自動檢查 GitHub 新版本並同步（見第 10 章）。手動觸發：
```
curl -X POST "http://<伺服器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密碼>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 配置同步（sync-config.json）
| 欄位 | 作用 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 下載加速字首（如 ghproxy.com） |
| `keep_releases` | 版本歷史保留數 |
| `market_url` | 下載頁「技能管家」市場地址 |
> 📌 DeepChat 客戶端報「模型連線超時」通常是客戶端走了掛掉的系統代理（`ECONNREFUSED 127.0.0.1:33210`）。讓使用者在 DeepChat「設定 → 網路/代理」改為「不使用代理/直連」。
> 📖 原廠文件：DeepChat 快速開始 https://deepchatai.cn/docs/guide/getting-started/ · 開源倉庫 https://github.com/ThinkInAIXYZ/deepchat

## 22. 監控告警管理

Grafana**入口**：Grafana http://<伺服器IP>:3030（SSO 自動登入）；Prometheus :9091；Alertmanager :9093。
### 22.1 元件與埠
| 元件 | 埠 | 用途 |
| --- | --- | --- |
| cadvisor | 8080（內部） | 採集每個容器 CPU/記憶體/網路/磁碟 |
| Prometheus | 9091 | 匯聚指標 + 告警規則（`monitoring/alerts.yml`） |
| Grafana | 3030 | 視覺化大盤（預置「AI All In One — 容器監控」） |
| Alertmanager | 9093 | 告警去重/分組/路由/通知 |
### 22.2 檢視大盤
1. 登入 Grafana（`ai_all_in_one_admin` / 統一密碼，SSO 自動登入）；
2. 開啟「AI All In One — 容器監控」面板，看各容器 CPU/記憶體/網路。
### 22.3 告警規則
預置規則（`monitoring/alerts.yml`）：容器宕機（critical）、容器記憶體 >90%（warning）、容器 CPU >80%（warning）。
> ⚠️ 告警誤報坑：cadvisor 上報宿主機所有 cgroup（含 systemd），告警規則必須寫 `{name!=""}` 過濾，記憶體告警還要加 `container_spec_memory_limit_bytes > 0`（否則 limit=0 除零恆觸發）。
### 22.4 接入告警通知（企業 IM）
告警鏈路為 **Prometheus → Alertmanager → AI 管理中心（`/api/alert-webhook`）→ 企業 IM**。在 AI 管理中心的 **「系統維運 → 企業 IM 告警」** 選單裡配置（配置存 Redis，重啟不丟）：
- **接收人**：可加多個。類型「釘釘/企微/飛書」= 群機器人（填 webhook 位址，發到群聊）；類型「釘釘企業應用（發個人）」（AppKey/AppSecret/AgentId/userid）或「企微企業應用（發個人）」（corpId/secret/agentid/userid）= 企業應用，發到個人。
- **傳送規則**：總開關、最低告警級別（嚴重/警告/資訊）、是否傳送「觸發 firing」/「恢復 resolved」通知。
- **傳送歷史**：記錄每次傳送（時間/接收人/類型/告警名/級別/結果），支援翻頁、調整頁大小、關鍵字檢索、按類型/結果/級別分類篩選。
- 每個接收人有「測試」按鈕可發測試訊息，以及啟用開關。
> ⚠️ 群機器人 webhook 只能發到**群聊**，不能發到個人。要發個人必須用「企業應用」類型（釘釘/企微），需在釘釘/企微管理後台開通內部應用並授予訊息權限。釘釘群機器人還需設「自訂關鍵字」（如「AI 平台」「告警」）或「加簽」，否則會被安全策略攔截。
> 📌 埠衝突說明：Prometheus 預設 9090 被 Keycloak 佔用改 9091；Grafana 預設 3000/3001 被佔改 3030。
> 📖 原廠文件：Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. LLM 可觀測（Langfuse）

Langfuse**入口**：http://<伺服器IP>:3010（SSO 自動登入，AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`）。
### 23.1 元件
| 元件 | 用途 |
| --- | --- |
| langfuse | Web UI + 追蹤展示（3010） |
| langfuse-worker | 非同步事件處理 |
| langfuse-postgres | 後設資料儲存 |
| langfuse-clickhouse | 事件/追蹤資料儲存 |
| langfuse-minio | S3 附件/媒體儲存 |
| langfuse-redis | 佇列 |
LiteLLM 透過 `success_callback: ["langfuse"]` 自動上報（`.env` 的 `LANGFUSE_*`）。
### 23.2 檢視追蹤
1. 登入 Langfuse → 選組織 `AI All In One` / 專案 `AI Platform`；
2. Traces 列表看每次呼叫，點進去看提示詞/響應/模型/延遲/token/成本；
3. 用 Session 關聯多輪對話。
### 23.3 疑難排解
- ⚠️ 關鍵坑：
      
        必須設 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web 和 worker 都設），否則舊 SDK 上報 `trace-create` 失敗看不到資料；
- SSO 登入看不到資料：SSO 帳號（AD 郵箱）與初始化帳號不同，Langfuse 會自動新建一個不屬於任何組織的帳號。修復（把 SSO 使用者加進組織）：
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<公司網域>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 原廠文件：Langfuse 官方文件 https://langfuse.com/docs · 自託管 https://langfuse.com/self-hosting

## 24. 統一日誌（Loki）

**入口**：AI 管理中心「📜 統一日誌」頁（最方便），或 Loki http://<伺服器IP>:3110。
### 24.1 元件
| 元件 | 埠 | 用途 |
| --- | --- | --- |
| Loki | 3110 | 日誌儲存與查詢（單機、本地檔案系統） |
| Promtail | —（內部） | 經 docker.sock 發現容器、採集 json 日誌推給 Loki |
### 24.2 查詢日誌
1. AI 管理中心 → 統一日誌；
2. 選容器（下拉）→ 填關鍵字 → 選時間範圍 → 查詢；
3. 後端 `/api/logs/query` 用 LogQL 查 Loki。
### 24.3 LogQL 速查
```
{container="new-api"} |= "error"              # 某容器含 error 的行
{container=~".+"} |~ "(?i)error|exception"      # 所有容器匹配
{service="litellm"} |= "EMAIL"                  # 按服務查
```
> 📌 Loki 的 label 是 `container / project / service`，**沒有 `job`**。查詢用 `{container=~".+"}` 而非 `{job="docker"}`。
> ⚠️ 關鍵坑（Docker Desktop 掛載）：Promtail 需掛載 `/var/run/docker.sock` 和 `/var/lib/docker/containers`（WSL2 下指向 Docker Desktop VM 內部，正好是日誌所在）；別用宿主機 Windows 的 `C:\...\containers` 路徑。Loki 單機用 `store: tsdb` + filesystem。
> 📖 原廠文件：Loki 官方文件 https://grafana.com/docs/loki/latest/

## 25. PII 遮蔽（Presidio）

### 25.1 兩層遮蔽
| 層 | 能力 |
| --- | --- |
| LiteLLM 內建正則（`litellm_content_filter`） | 手機號、身分證、銀行卡、郵箱、統一社會信用程式碼、護照、IPv4 等，命中即替換 `[xxx_REDACTED]`；敏感詞黑名單命中即 BLOCK 拒絕 |
| Microsoft Presidio | 更細粒度實體（英文人名、郵箱等），`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 內建正則規則
| 規則 | 正則 | 型別 |
| --- | --- | --- |
| 中國手機號 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身分證號 | `\b\d{17}[\dXx]\b` | cn_id |
| 銀行卡號 | `\b\d{16,19}\b` | bank_card |
| 郵箱 | prebuilt `email` | email |
| 統一社會信用程式碼 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 護照號 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
敏感詞黑名單在 `litellm-config.yaml` 的 `blocked_words` 按公司實際增刪（`內部機密`、`商業機密` 等）。
### 25.3 啟用 Presidio（當前暫註釋）
新版 LiteLLM guardrail API 變更，Presidio 段當前註釋。啟用要點：
- guardrails 加 `default_on: true` 才全域生效；
- 端點環境變數 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` 必須填 base URL（LiteLLM 自動拼 `/analyze`、`/anonymize`，帶路徑會變 `/analyze/analyze` 404）。
> ⚠️ 映像約 965MB，國內拉取很慢（實測約 1 小時），拉不動可先用內建正則（已覆蓋中文核心 PII）。
### 25.4 驗證
發含手機號/郵箱的請求 → 模型回覆中原始值被替換為 `[REDACTED]`；發含「內部機密」的請求 → 直接返回 `Content blocked`。
> 📖 原廠文件：Microsoft Presidio https://microsoft.github.io/presidio/ · 原始碼 https://github.com/microsoft/presidio

## 26. MailHog 郵件接收器

**入口**：http://<伺服器IP>:8025（Web 收件箱，SMTP 1025 僅內部）。
### 26.1 為什麼需要它
Ghost 5 後臺是免密登入：輸入郵箱後 Ghost 發一封帶 6 位驗證碼的郵件。內網沒有 SMTP 時郵件發不出去，登入就報 `Failed to send email`。MailHog 當「郵件出口」接住這些郵件。
### 26.2 Ghost 側配置
```
# docker-compose.yml 裡 Ghost 的環境變數
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 檢視郵件
1. 瀏覽器開啟 `http://<伺服器IP>:8025`；
2. 收件箱裡看到 Ghost 發的驗證碼/通知郵件。
### 26.4 Ghost 免登入（AI 管理中心自動登入）
Ghost 的 6 位驗證碼本質是 **TOTP**（`TOTP(admin_session_secret + userId)`，6 位/60 秒/HMAC-SHA1）。AI 管理中心能本地算出驗證碼，點「Ghost 後臺 → 開啟」自動完成：密碼登入 → 本地算碼 → 驗證會話 → 寫 cookie → 進後臺，全程無感、免翻 MailHog。
> ⚠️ 就算自己算碼，Ghost 仍會真發郵件，所以 MailHog 必須保留，否則登入報 `Failed to send email`。
> 📖 原廠文件：MailHog 原始碼倉庫 https://github.com/mailhog/MailHog

**第三部分 · 維運篇**

## 27. 備份與恢復

**入口**：AI 管理中心「💾 備份與恢復」頁，或命令列 `scripts/backup.ps1` / `restore.ps1`。每日 02:00 計劃任務自動備份，保留 7 天。
### 27.1 備份項
| 備份項 | 方式 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 檔案複製 |
| Keycloak | **realm export（JSON）** |
| 配置檔案 | 檔案複製 |
### 27.2 手動備份
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 定時備份（計劃任務）
已註冊計劃任務 `AI-Platform-Backup`（每天 02:00）。未自動註冊可手動建：任務計劃程式 → 新建 → 程式 `powershell.exe`，參數 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`，觸發器每天 02:00。
> 📌 備份預設在 C 盤，建議定期把 `C:\AIAllInOne\backups\` 同步到另一塊盤或物件儲存做異地容災。
### 27.4 恢復
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
指令碼要求輸入 `yes` 確認（加 `-Force` 跳過，僅指令碼/CI 用）。也可在 AI 管理中心「備份與恢復」頁點某次備份的「恢復」一鍵恢復。
### 27.5 關鍵坑（演練已驗證）
- ⚠️
      
        Keycloak 必須用 **realm export/import（JSON）**，pg_dump 還原會丟 default role 關聯導致起不來；
- SQLite 還原後屬主是 root，需 chown 到對應 uid（grafana=472、gitea=1000），否則報 readonly；
- pg_dump 帶 `--clean --if-exists` 避免還原衝突；
- 舊版 backup.ps1 用 `Copy-Item` 批次複製時點號檔案 `.env` 導致整批靜默失敗，已改逐檔案 `-LiteralPath`；
- AI 管理中心備份用 base64 中轉 + tar-fs 保證二進位制安全（docker exec 的 stdout 走 utf8 會損壞 SQLite .db）。

## 28. 健康檢查與開機自檢

**指令碼**：`C:\AIAllInOne\windows\scripts\health-check.ps1`，輸出 `health_check_<時間戳>.log`。覆蓋 41 個容器（25 Windows 核心 + 16 Dify），憑據從 `.env` 讀，不硬編碼密碼。
### 28.1 檢查範圍（9 個階段）
| 階段 | 檢查項 |
| --- | --- |
| Stage 1 | Docker Daemon 是否執行（等待就緒，適配開機自檢） |
| Stage 2 | 41 個容器狀態（Up/Exited/Restarting） |
| Stage 3 | 10 個 HTTP 端點響應 |
| Stage 4 | LiteLLM readiness + 模型註冊、Dify API、資料庫/Redis/Sandbox 健康 |
| Stage 5 | LLM 全鏈路（NewAPI → LiteLLM → DeepSeek 真實請求） |
| Stage 6 | AD 帳號認證鏈路 + NewAPI 管理員登入 |
| Stage 7 | MCP Gateway + Skill 功能 |
| Stage 8 | DeepChat/Dify 登入前置條件 |
| Stage 9 | 磁碟空間 |
### 28.2 手動執行
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ 輸出末尾 `ALL CLEAR` 且 `Fail: 0` 表示全部正常。
### 28.3 開機自啟（計劃任務）
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登入後延遲 2 分鐘等 Docker + 容器啟動
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 注意：指令碼用 `127.0.0.1` 不用 localhost；LiteLLM 內部健康用 `/health/readiness`（無需認證）；`docker-init_permissions-1` Exited(0) 正常；Update Server 返回 403 正常（無預設 index.html）；exit code 0=透過、1=有失敗。

## 29. 疑難排解手冊

### 29.1 通用排解三步
1. **看容器狀態**：`docker ps -a` 找 Exited/Restarting；
2. **看日誌**：`docker logs <容器名> --tail 30`；
3. **看健康檢查**：跑 `health-check.ps1` 定位失敗階段。
### 29.2 症狀速查表
| 症狀 | 根因 | 解決 |
| --- | --- | --- |
| localhost 打不開任何產品 | WSL2 IPv6 `::1` 相容問題 | 改用內網 IP 或 127.0.0.1 |
| Ghost 一直 Restarting，報 ECONNREFUSED :3306 | 卷內殘留 MySQL config | 環境變數強制 SQLite（第 4 章） |
| Dify 4 容器啟動即崩 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 改成 50（第 5 章） |
| NewAPI 渠道測試報 No connected db | 渠道金鑰填了示例值 | 填 `LITELLM_MASTER_KEY` 實際值 |
| NewAPI OIDC 報 invalid_grant / Incorrect redirect_uri | 伺服器地址是 localhost | 設內網地址（第 7 章） |
| NewAPI 登入 429 | 關鍵介面限流 | 清 redis rateLimit:* 或改 .env |
| Dify 建應用反覆連 ws://localhost | WebSocket 地址未改 | NEXT_PUBLIC_SOCKET_URL 設內網 IP |
| Dify 點登入沒反應 | 密碼需 base64 / 未登入 401 正常 | 指令碼先 base64；瀏覽器重試 |
| Gitea 報 readonly database | gitea.db 被 root 屬主 | 刪 root 屬主的 db 重建 |
| Gitea 倉庫連結是 localhost | ROOT_URL 未改 | 設內網地址 |
| SSO 登入報 unknown_error | AD 埠轉發失效（iphlpsvc） | 檢查 iphlpsvc + Hyper-V 網路 |
| Keycloak 看不到網域使用者 | Search scope = One Level | 改 Subtree |
| Langfuse 看不到資料 | V4_WRITE_MODE 或 SSO 帳號未入組織 | 設 dual；SQL 加組織（第 23 章） |
| DeepChat 模型連線超時 | 客戶端走了掛掉的系統代理 | 設為不使用代理/直連 |
| Loki 查不到日誌 | 用了 job 標籤 | 用 `{container=~".+"}` |
| Presidio 404 /analyze/analyze | 端點帶了路徑 | 只填 base URL |
| 改 server.js 後新介面 404 | up -d 不重讀 volume 變化 | docker restart admin-portal |
### 29.3 常用命令
```
docker ps -a                                        # 所有容器狀態
docker logs <容器> --tail 50                         # 看日誌
docker compose up -d <服務>                          # 重建某服務
docker compose restart <服務>                        # 重啟某服務（不重讀 .env）
docker system df                                     # Docker 磁碟佔用
C:\AIAllInOne\windows\scripts\health-check.ps1       # 一鍵體檢
```

**附錄**

## 附. 原廠文件索引

### 全部產品原廠文件
| 產品 | 官方文件地址 |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Keycloak 伺服器管理 | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| NewAPI 官網 | https://www.newapi.ai |
| NewAPI 原始碼 | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify 自託管 | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Ghost 管理後臺 | https://ghost.org/docs/admin/ |
| Gitea（中文） | https://docs.gitea.com/zh-cn |
| Gitea 管理 | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| DeepChat 原始碼 | https://github.com/ThinkInAIXYZ/deepchat |
| MCP 協議 | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse 自託管 | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Presidio 原始碼 | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ 每章末尾也都帶了對應產品的原廠文件地址，方便按章查閱。

