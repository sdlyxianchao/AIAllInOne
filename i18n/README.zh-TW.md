# AI AllInOne — 開源自託管的企業 AI 平台

> 📖 **語言**：[English](../README.md) · [简体中文](README.zh.md) · **繁體中文** · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

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

1. **自動部署（推薦）**——把部署交給 AI Agent（WorkBuddy / OpenClaw / Microsoft Scout）。它會讀取部署文件和設定，向你收集參數（伺服器 IP、身分來源、管理員帳號、LLM 金鑰），然後一步步完成全部設定。[查看一鍵部署提示詞 →](../windows/windows-deploy-guide-v2.html)

<details>
<summary>📋 一鍵部署提示詞（點擊展開）</summary>

````text
你是企業內網 AI 平台的部署工程師。請基於本專案的文件和設定檔，在目前機器上完整部署並驗證「AI AllInOne」平台。全程用中文與我溝通，並嚴格依照以下流程執行。

## 第 1 步：確認部署目錄與目標平台
1. 先問我：本專案的本機解壓縮/克隆路徑是什麼？（例如 C:\AIAllInOne 或 /opt/AIAllInOne）
2. 進入該目錄後，根據目前機器的作業系統確定目標平台目錄：
   - Windows → 使用 windows-github（或 windows）目錄
   - Linux / macOS → 使用 linux-github（或 linux）目錄
   - 線上伺服器 / 純 Docker 環境 → 使用 docker-github（或 docker）目錄
   如果不確定，告訴我偵測到的作業系統並和我確認使用哪個目錄。
3. 動手前先閱讀根目錄 README.md 和該平台目錄內的 README，理解架構和部署方式。

## 第 2 步：逐項收集所需參數（逐個問我，不要跳過或猜測）
1. 平台對外暴露的內網 IP（或網域名稱），也就是其他機器存取它的位址（如 192.168.1.100 或 portal.company.com）。
2. 身分來源（Identity Provider）：
   - 公司 AD 網域控制站：問我網域名稱、DC IP、LDAP base DN、bind DN、bind 帳號密碼、sAMAccountName 等。
   - 其他 IdP（LDAP/OpenLDAP/OIDC/飛書/企微/釘釘等）：問我對應設定和帳號資訊。
   - 沒有外部身分來源（僅本機帳號）：和我確認後跳過。
3. 統一管理員帳號：使用者名稱、密碼、電子郵件（用於 Keycloak SSO 和各產品管理員登入）。
4. LLM API 金鑰：我實際有哪些模型供應商和金鑰（DeepSeek / OpenAI / Claude / Qwen / 通義 / ERNIE 等）；沒有的跳過。
5. Ghost 入口網站範例內容的語言：中文，或翻譯成其他語言後再匯入。
6. 其他依需求詢問：MCP 技能市集主機名稱（Windows）、告警通知渠道（釘釘/企微/飛書 webhook）、HTTPS 憑證、備份保留策略等。

## 第 3 步：生成本機進度檔案
1. 找到平台目錄內的「進度清單」文件（*-checklist*.html）和「身分來源對接指南」（如 *-ad-integration*.html 或 IdP 相關文件）。
2. 根據清單內容，在專案目錄生成進度檔案，命名如 "deployment-progress-<platform>-<date>.md"，把每一項清單複製為未完成（- [ ]）。
3. 之後每完成一項或解決一個問題，即時更新該進度檔案，並在對話中向我簡要回報進度。

## 第 4 步：依照部署指南逐步設定
1. 仔細閱讀平台的「部署指南」文件（如 *-deploy-guide*.html）並嚴格遵循，特別注意其中標註的「⚠️ 關鍵地雷」。
2. 大致順序：準備環境變數 → 啟動容器 → 初始化身分驗證/IdP → 設定 LLM 路由和模型渠道 → 初始化各產品（Ghost 入口網站：部署內建 Corp Portal 主題並匯入範例內容）→ 設定監控/可觀測性/日誌/去識別化 → 設定備份還原。
3. 優先使用目錄內的自動化指令碼（如 bootstrap.ps1、keycloak-realm-init.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、health-check.ps1 等），能指令碼化的步驟不要手動操作 UI。

## 第 5 步：和我一起疊代測試並解決問題
1. 某一步失敗或不符合預期時，先查日誌（docker logs、各服務健康端點、設定檔）定位根因再修，不要盲目重試。
2. 需要我參與時（例如執行需要管理員權限的指令、確認登入、補充資訊），明確告訴我「要做什麼、為什麼」。
3. 解決後把根因和修復記錄到進度檔案，並簡要向我回報。

## 第 6 步：完整端對端驗證
全部清單項完成後，做一次完整端對端測試，至少涵蓋：
- 服務健康（所有容器 Up、健康端點正常）；
- SSO 統一登入（Keycloak 登入 → 各產品 SSO/自動登入）；
- LLM 鏈路（透過 NewAPI/LiteLLM 發送一次真實對話，驗證回應和 PII 去識別化生效）；
- 身分來源登入（如已對接 AD/其他 IdP，用對應帳號測試登入）；
- 監控/可觀測性/日誌/告警（確認有資料、告警能觸發）；
- 備份與還原（執行一次備份並驗證可還原）。

最後逐項彙總測試結果，明確標註 ✅ 通過 / ❌ 失敗；失敗項目說明根因和後續建議。
````

</details>

2. **手動部署**——依照 [Windows 部署指南](../windows/windows-deploy-guide-v2.html) 逐步操作（搭配 `windows-checklist.html` 進度清單）。

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

## 📄 授權條款

[MIT](../LICENSE)——可自由使用、修改與散布。所整合的元件保留各自的授權條款（見部署指南的授權條款審查章節）。
