# 第2章：前置準備

*第一部分 · 部署篇*

> 安裝 Docker Desktop、準備目錄、打通網路、固定 IP——部署前必須完成的事。

[← 第1章：平台概覽與架構](ch01-overview.md) · [📖 目錄](index.md) · [第3章：配置檔案與環境變數 →](ch03-env.md)

---

## 2.0 兩種部署方式

本手冊可**人工逐章執行**，也可**交給 AI Agent 工具自動執行**。用 Agent 時，把本目錄（含本手冊、`docker-compose.yml`、`.env.example`、`scripts/`）提供給 Agent，貼上下面的提示詞即可。

> **複製給 Agent 的部署提示詞：**
> 你是企業內網 AI 平台的部署工程師。請根據本目錄的《管理員手冊》部署篇、docker-compose.yml 與 .env.example，在當前這臺機器上完整部署並驗證「AI AllInOne」平台。全程用中文溝通。
>
> 第一步 收集參數（逐項問我，不跳過、不猜測）：
> 1) 對外服務的內網 IP；2) Skill 市場主機名（網域，替換 mcp-gateway/skills/skill-market/config.json 與 SKILL.md 裡的 <市場主機名>，並在 hosts/DNS 解析）；3) 身分來源（接 AD 網域控制站則要網域/網域控制站 IP/LDAP base DN/bind DN/bind 密碼/sAMAccountName）；4) 統一管理員帳號密碼；5) 大模型 API Key；6) 按需問告警 webhook、HTTPS、備份保留策略。
>
> 第二步 生成進度檔案，每完成一項、每解決一個問題就更新並彙報。
>
> 第三步 嚴格按本手冊第 1~13 章順序執行，注意各章「⚠️ 關鍵坑」，優先用 scripts/ 下的指令碼自動化。
>
> 第四步 出錯先查日誌（docker logs、健康端點、配置）定位根因再修，不盲目重試。
>
> 第五步 全流程驗證：容器全 Up、Keycloak SSO、經 NewAPI/LiteLLM 發真實對話驗證 PII 遮蔽、身分來源登入、監控/日誌/告警、備份恢復，逐項彙總 ✅/❌。

> 💡 不用 Agent 的話，上面這段也能當「部署前資訊核對清單」：部署前先想清楚內網 IP、身分來源、管理員密碼、模型 Key 這四件事。

## 2.1 安裝並配置 Docker Desktop

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

## 2.2 準備目錄結構

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # 假設的部署根目錄
├─ docker-compose.yml           # 核心服務編排
├─ .env.windows                 # 環境變數（需填入 API Key）
├─ litellm-config.yaml          # LiteLLM PII 遮蔽配置
├─ deepchat-updates\            # DeepChat 安裝包託管目錄
├─ admin-portal\                # AI 管理中心實現
├─ mcp-gateway\                 # Skill / MCP 閘道器
├─ monitoring\                  # Prometheus / Loki 配置
└─ scripts\                     # 備份 / 恢復 / 健康檢查 / 初始化指令碼
```

## 2.3 建立 Docker 共享網路

```
docker network create ai-platform
docker network ls | findstr ai-platform   # 驗證
```

> 所有核心容器透過 `ai-platform` 網路用容器名互訪（如 NewAPI 訪問 LiteLLM 用 `http://litellm:4000`，不經過 localhost）。

## 2.4 固定宿主機內網 IP（重要）

宿主機走 WiFi 時 IP 由 DHCP 動態分配，重啟或租約到期會變；變了員工訪問各產品的地址就全失效。建議在路由器做 **DHCP 保留（MAC 繫結）**：

1. 查 WiFi 網路卡 MAC：`ipconfig /all`，找「無線區域網路介面卡 WLAN」的實體地址（如 `60-A3-E3-41-8F-61`）；

2. 登入路由器後臺（如 `http://192.168.31.1`）→ 區域網路設定 / DHCP 靜態 IP 分配；

3. 新增規則：MAC → IP（如 `192.168.31.117`），儲存；

4. 重連 WiFi 確認 IP 固定。

> ✅ DHCP 保留比在 Windows 裡設靜態 IP 更穩（路由器統一管理、不衝突）。

## 2.5 打通網路（最容易卡住的一步）

- **能連 Docker 映像倉庫**：Docker Hub / quay.io / ghcr.io。不通則先配映像加速器（如 DaoCloud）。

- **能連 GitHub**：克隆倉庫、拉取公開依賴。不通則用代理或提前下載原始碼包。

- **目標機器可被內網訪問**：確認要暴露的網段可達。

---

[← 第1章：平台概覽與架構](ch01-overview.md) · [📖 目錄](index.md) · [第3章：配置檔案與環境變數 →](ch03-env.md)
