# AI AllInOne — 開源自託管的企業 AI 平台

> 📖 **語言**：[English](../README.md) · [简体中文](README.zh.md) · **繁體中文** · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

> ⭐ **如果這個專案幫到了你，給個 Star 吧——免費，還能讓更多人找到它。**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

> **一台伺服器。一個帳號。企業級 AI 全家桶——開源免費，資料不出內網。**

AI AllInOne 是一套**開源免費**、開箱即用的企業內網 AI 平台：統一 SSO、LLM 路由、AI 應用程式、企業入口網站、原始碼/CI、統一管理、監控告警、可觀測性、日誌、備份還原——全部用 Docker 編排成一個整體。**員工用一個帳號登入一次，就能使用所有 AI 工具。**

![AI 管理中心](<../pics/AI Admin.png>)

![企業入口網站](<../pics/AI All In One Hub.png>)

---

## ✨ 為什麼選擇 AI AllInOne

| | |
|---|---|
| 🧩 **全家桶，免組裝** | 8+ 個開源元件預整合：身分驗證、閘道、應用程式、入口網站、Git、監控、日誌、備份。無需自己"拼裝"。 |
| 🔐 **統一 SSO** | 一個 Keycloak 帳號（支援 AD/LDAP 聯合）自動登入所有產品，免密碼進入。 |
| 🔒 **資料不出內網** | 完全自託管——模型呼叫、提示詞、文件和使用者資料都留在企業內部。 |
| ⚡ **約 30 分鐘完成部署** | `docker compose` + 自動化指令碼，或直接讓 AI Agent 幫你部署整套環境。 |
| 🛡️ **PII 去識別化** | 手機號碼 / 身分證 / 電子信箱等敏感資訊在呼叫外部大型模型前自動去識別化（Presidio）。 |
| 📊 **全鏈路可觀測性** | Prometheus + Grafana 監控、Langfuse LLM 追蹤、Loki 統一日誌、企業 IM 告警（釘釘/企微/飛書）。 |
| 💾 **備份與還原** | 管理後台一鍵每日全量備份和一鍵還原。 |
| 🌐 **9 種語言** | 手冊和管理介面多語言（簡中 / 繁中 / 英 / 法 / 西 / 葡 / 日 / 韓 / 阿）。 |

## 📦 元件清單

| 階層 | 元件 | 用途 |
|---|---|---|
| 身分驗證 | Keycloak | SSO / OIDC，AD/LDAP 聯合或本機帳號 |
| LLM 路由 | NewAPI | 渠道、金鑰、額度、稽核、成本 |
| PII 去識別化 | LiteLLM + Presidio | 呼叫模型前自動去識別化敏感資訊 |
| AI 應用程式 | Dify | 視覺化 AI 應用程式 / Agent 平台 + 統一知識庫（RAG） |
| 企業入口網站 | Ghost | 公司公告與新聞入口網站（內建自訂 Corp Portal 主題） |
| 原始碼 / CI | Gitea + Runner | 內部 Git + Actions 自動化 |
| 用戶端 | DeepChat | 本機 AI 桌面用戶端（Windows / macOS / Linux） |
| 用戶端發佈 | Update Server | DeepChat 安裝檔託管與自動更新 |
| 統一管理 | AI Admin Center | 統一入口：儀表板 + 內嵌產品 + 稽核/成本/報表 + 分級管理員授權 + Keycloak 同步/角色 |
| 閘道 | MCP Gateway | 技能 / MCP 市集 + Dify 知識檢索（RAG） |
| 監控 | Prometheus + Grafana + Alertmanager | 容器資源監控 + 告警通知 |
| LLM 可觀測性 | Langfuse | 追蹤每次模型呼叫的延遲、token、成本 |
| 統一日誌 | Loki + Promtail | 彙整所有容器日誌，可依容器/關鍵字/時間檢索 |
| 備份還原 | 指令碼 + 管理頁面 | 每日全量備份 + 一鍵還原 |

### 架構與資料流

![架構總覽](<../pics/Architecture.png>)

![資料流](<../pics/DataFlow.png>)

---

## 🚀 快速開始

**前置條件**：一台安裝 Docker 的機器（Windows 11 + Docker Desktop，或 Linux），且能存取 Docker 映像檔儲存庫。

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# 啟動核心服務，然後依照部署指南初始化身分驗證 / LLM 渠道 / 各產品
docker compose up -d
```

接下來有兩種方式：

1. **自動部署（推薦）**——把部署交給 AI Agent（WorkBuddy / OpenClaw / Microsoft Scout）。它會讀取部署文件和設定，向你收集參數（伺服器 IP、身分來源、管理員帳號、LLM 金鑰），然後一步步完成全部設定。[查看一鍵部署提示詞 →](../windows/windows-deploy-guide-v2.md)

#### 🤖 AI 部署——交給 AI Agent 一鍵完成

> 以下內容複製自部署指南（第 0 章）：部署指南既可以**人工逐章執行**，也可以**整體交給 AI Agent**（WorkBuddy / OpenClaw / Microsoft Scout）端到端完成。把本目錄（部署指南、`windows-checklist.html`、`docker-compose.yml`、`.env.example`、`scripts/`）提供給 Agent，再貼上下列提示詞，它會：判斷平台 → 逐項向你收集參數 → 生成本地進度檔 → 依部署指南逐步設定 → 遇錯除錯重試 → 全程更新進度 → 最後做一次完整端到端驗證並回報結果。

**複製給 Agent 的提示詞**（Windows 平台，繁體中文——Agent 會帶你逐步完成）：

````text
你是企業內網 AI 平台的部署工程師。請根據本目錄下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 進度清單、docker-compose.yml 與 .env.example 配置，在目前這台 Windows 機器上完整部署並驗證這套「AI AllInOne」平台。全程用繁體中文與我溝通。

## 第一步：收集必要參數（逐項問我，不要跳過、不要擅自猜測）
開始前向我收集：1) 對外服務的內網 IP；2) Skill 市場主機名稱（網域名稱，用於取代 mcp-gateway/skills/skill-market/config.json 與 SKILL.md 裡的 <市場主機名稱>，並在 hosts/DNS 裡解析）；3) 身分來源（接 AD 域控則要網域/域控 IP/LDAP base DN/bind DN/bind 密碼/sAMAccountName，或接其他 IdP 的設定，不接則確認）；4) 統一管理員帳號密碼；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需詢問告警 webhook、HTTPS、備份保留策略。

## 第二步：生成本地進度檔案
基於 windows-checklist.html 的內容，在本目錄生成「部署進度-<日期>.md」，所有條目複製為未完成（- [ ]）。每完成一項、每解決一個問題就更新它並簡要回報。

## 第三步：依部署指南逐步執行
精讀《windows-deploy-guide-v2.html》——這是本次部署唯一的權威指南，嚴格依它的第 1~13 章順序執行（不要用 windows-checklist.html 或任何舊文件替代），特別注意各章「⚠️ 關鍵坑」。優先使用 scripts/ 下的自動化腳本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自動化的不要手動點 UI。其中 Ghost 入口網站（6.5 章）必須：①部署專案自帶的 Corp Portal 主題，執行 scripts\ghost-theme-setup.ps1 自動裝好並啟動，不要停留在官方預設主題；②匯入範例內容：先問使用者「入口網站及各產品的對外發布位址（內網 IP 或網域，如 192.168.1.10 或 portal.company.com）」——用它取代 seed 裡的 <伺服器IP> 佔位符（文章內文裡的 NewAPI / MCP / Dify 等存取位址也一併取代，注意別把 host.docker.internal 這類容器內固定位址改掉）；再問使用者「入口網站範例內容用什麼語言」，中文則直接執行 scripts\ghost-content-import.ps1 -ServerAddr "發布位址" 匯入；選其他語言時，先把 ghost-content-seed/content.json 裡的 title / html / plaintext / custom_excerpt 欄位翻譯成目標語言（保留 <伺服器IP> 佔位符和所有 URL 結構不動），再匯入。

## 第四步：反覆測試解決
出錯先查日誌（docker logs、健康端點、設定）定位根因再修，不要盲目重試；需要系統管理員權限或我手動確認時，明確告訴我「做什麼、為什麼」；解決後回寫進度檔案並簡要回報。

## 第五步：全流程驗證
全部完成後做端到端測試：容器全 Up、Keycloak SSO 登入、經 NewAPI/LiteLLM 發真實對話驗證 PII 脫敏、身分來源登入、監控/日誌/告警、備份還原。最後逐項彙整 ✅/❌ 結果，失敗項給根因和建議。
````

> 💡 即使你**不用 Agent**，這段提示詞也可以當作「部署前資訊核對清單」——它列出了啟動前需要準備的全部參數。

2. **手動部署**——依照 [Windows 部署指南](../windows/windows-deploy-guide-v2.md) 逐步操作（搭配 `windows-checklist.html` 進度清單）。

> **平台狀態**：Windows（Windows 11 + Docker Desktop）**實測中**。Linux/macOS（`linux/`）與線上伺服器（`docker/`）已在規劃中——見[路線圖](#roadmap)。

## 🖼️ 介面截圖

**Dify** — AI 應用程式平台 · **MCP/Skill 市集** — 一鍵接入工具與技能 · **DeepChat** — 桌面 AI 用戶端

![Dify](<../pics/Dify.png>) ![MCP/SKILL 市集](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

更多截圖（48 張真實介面截圖）已嵌入[管理員手冊](../docs/admin-manual/index.md)。

## 📚 手冊（線上，9 種語言）

| 手冊 | 語言 |
|---|---|
| **管理員手冊** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **使用者手冊** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

## 🎓 培訓體系

本平台內建完整的**上線培訓體系**（17 個模組、60 學時、10 個工作日），面向部署與維運。英文版培訓包：

| 培訓包 | 語言 | 入口 |
|---|---|---|
| **English** | 英文 | [training/training_eng/index.html](../training/training_eng/index.html) |
| **简体中文** | 中文 | [training/training_chn/index.html](../training/training_chn/index.html) |

日常 AI Agent 維運請見 **[AI Agent 維運指南](../AI-AGENT-OPS.md)**。

## 👥 社群

> 微信群——用於交流、部署解惑、回饋與**共建**。掃碼加好友，拉你進群。

<img src="../pics/wechat.png" alt="微信群 QR Code" width="200" />

同時歡迎使用 [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions)（或直接提出 [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues)）。

## 🤝 參與共建

本專案**開源免費**，靠社群一起成長。無論你的程度如何，都有適合你的方式：

- ⭐ **幫倉庫按星**——最簡單也是最有價值的支持
- 🐛 **回報 Bug / 提出需求**——開 issue 並寫清楚重現步驟
- 📝 **撰寫文件和教學**——部署指南、除錯經驗、最佳實務
- 🌐 **翻譯**——手冊已有 9 種語言，幫忙改進或新增更多
- 🧪 **測試分享**——部署一次，告訴我們哪些好用、哪些踩坑
- 💻 **貢獻程式碼**——整合層（統一 SSO、管理入口網站、監控、備份）是最好上手的地方

完整指南見 [CONTRIBUTING.md](../CONTRIBUTING.md)，公開的[路線圖](#roadmap)可以看到下一步計畫。**每一位貢獻者都會列入 README 的貢獻者名單。**

<h2 id="roadmap">🗺️ 路線圖</h2>

- ✅ v0.9x — Windows 平台：全家桶 + AI 管理中心 + 分級管理員授權 + 企業 IM 告警 + 語意快取（LiteLLM redis-semantic）
- 🚧 **Linux / macOS** — 自託管 Linux 伺服器支援（`linux/`）
- 🚧 **線上伺服器** — 純 Docker / 雲端生產部署（`docker/`）
- 🚧 **共建者計畫** — 任務看板、每週同步會議、部署夥伴認證

## 🔒 安全說明

- 本倉庫**不含任何真實金鑰**；真實值只存在各執行環境的 `.env`（倉庫只提交 `.env.example` 模板）。
- 預設內網明文 HTTP；HTTPS 設定請見各平台部署指南。
- 各平台的地雷、連接埠表、資料流請見對應 `*-deploy-guide*.html` 文件。

## ⭐ 支持這個專案

如果 AI AllInOne 幫你省了時間或錢，點個 Star 不用花一分錢，卻能幫專案成長：

- ⭐ **Star 這個倉庫** — 讓更多人能搜到這個專案
- 🐛 **提 Issue** — 回報 bug、提功能建議、部署問題都可以
- 🤝 **參與貢獻** — 程式碼、文件、翻譯（9 種語言都歡迎）
- 💬 **加入社群** — 分享你的部署經驗和想法
- 📣 **分享出去** — 轉給同事，或發到你的部落格 / 社交平台

右上角點一下 Star，就是對這個專案最大的支持。

## 📄 授權條款

[MIT](../LICENSE)——可自由使用、修改與散布。所整合的元件保留各自的授權條款（見部署指南的授權條款審查章節）。

## 🤖 AI Agent 運維

本平台從設計上就支援**透過 AI Agent 運維**——WorkBuddy、OpenClaw、Microsoft Scout 或任何同類工具。你不再需要逐一登入十幾個管理後台點點點，而是用自然語言告訴 Agent 你想做什麼，它負責讀檔案、執行指令、呼叫服務。

平台的一切都執行在你機器上的**程式碼、設定和資料**裡——Docker Compose 服務、`.env` 檔案、管理 API，以及保存實際狀態的資料庫/檔案——所以 Agent 能看得到、改得了全部：

| 任务 | Agent 的做法 |
|---|---|
| 健康檢查 / 狀態總覽 | `docker ps` + 健康端點 + 管理 API |
| 啟動 / 重啟 / 停止服務 | `docker compose up -d <svc>` / `docker restart <svc>` |
| 查看日誌與報錯 | `docker logs <svc> --tail N` + 日誌檔案 |
| 修改設定 | 改設定檔後重啟對應容器 |
| 修改 AI 管理中心 | 改 `admin-portal/public/index.html`（前端）或 `admin-portal/server.js`（後端）後重啟 |
| 管理 Gitea 與同步 | Gitea API：觸發工作流程、查看執行狀態/日誌、編輯儲存庫檔案 |
| 管理 Ghost 入口網站 | 讀寫 Ghost SQLite 資料庫、改主題樣板、匯入內容種子 |
| 備份與還原 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 發佈版本 | `publish.ps1`（建置 + 提交 + 推送到 GitHub） |
| 排障 | 連接埠衝突、Docker Desktop 問題、DNS/代理等 |

範例：*「檢查所有服務是否都在正常執行」* —— Agent 執行 `docker ps`、探測各健康端點，然後告訴你哪裡有問題、為什麼。完整的現成提示詞、最佳實務和指令速查見 **[AI Agent 運維指南](../AI-AGENT-OPS.md)**（9 種語言）。

### 🛡️ AI 運維——一鍵健康檢查與開機自檢

> 以下內容複製自部署指南（第 12 章）：平台內建**一條指令的健康檢查**（`health-check.ps1`），分 9 個階段檢查全部 **41 個容器**——含 LLM 全鏈路、AD 認證與管理員登入、MCP/Skill 功能、磁碟空間。憑證從 `.env` 讀取，腳本不寫死密碼。直接讓 AI Agent 執行即可（例如 *「跑一下健康檢查，告訴我哪裡掛了」*），也可以設定成每次登入自動執行：

| 阶段 | 檢查項 | 方式 |
|---|---|---|
| Stage 1 | Docker Daemon 是否运行（等待就绪，适配开机自检） | `docker info` |
| Stage 2 | 41 个容器状态（Up/Exited/Restarting） | `docker ps -a` |
| Stage 3 | 10 个 HTTP 端点响应（含 MCP Gateway） | `curl.exe 127.0.0.1:端口` |
| Stage 4 | LiteLLM /readiness + **模型注册**、litellm-redis PING、Dify API /health、MySQL/PostgreSQL/Redis/Sandbox 健康状态 | `docker exec` + `docker inspect` |
| Stage 5 | **LLM 全链路**：NewAPI 渠道状态 + 以 DeepChat 和 Dify 名义各发一个真实请求（NewAPI → LiteLLM → DeepSeek） | `curl /v1/chat/completions` |
| Stage 6 | **AD 账号认证链路**：Keycloak well-known + AD 用户同步（aitest1）+ NewAPI OIDC 配置 + OIDC clients 完整性 + **NewAPI 管理员登录** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill**：/health + tools/list + tools/call + 外部 Skill 聚合 | curl MCP 协议 |
| Stage 8 | **DeepChat / Dify 登录前置条件**：NewAPI 服务可用 + Dify 已初始化 | curl + psql |
| Stage 9 | **磁碟空間**：系统盘剩余 + Docker 磁盘占用 | `Get-PSDrive` + `docker system df` |

**手動執行**（PowerShell）：

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**開機自動執行**（工作排程器，請以系統管理員身分執行 PowerShell）：

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
