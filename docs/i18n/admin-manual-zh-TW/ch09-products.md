# 第9章：Dify / Ghost / Gitea 配置

*第一部分 · 部署篇*

> 三個產品各自的初始化與互連配置。

[← 第8章：LiteLLM：驗證與快取](ch08-litellm.md) · [📖 目錄](index.md) · [第10章：DeepChat 分發與 CI/CD →](ch10-deepchat.md)

---

## 9.1 Dify：配置模型供應商

1. 開啟 `http://<伺服器IP>` → 首次設管理員郵箱/密碼（郵箱 `ai_all_in_one_admin@<公司網域>`）；

2. **設定 → 模型供應商** → OpenAI-API-compatible → 新增模型：

- 模型名 `deepseek-chat`（按實際）；

- API Key：`dify-key` 的 `sk-xxx`；

- API endpoint：`http://host.docker.internal:3000/v1`。

3. 工作室 → 建立聊天助手 → 選模型 → 發訊息驗證。

> ⚠️ Dify 用 `host.docker.internal` 而不是容器名，因為 Dify 在自己網路裡、與 NewAPI 不同網路。

## 9.2 Ghost：配置門戶

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

## 9.3 Gitea：初始化和 Runner 註冊

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
 ⚠️ 踩坑 2：`ROOT_URL` 要設成 `http://<伺服器IP>:3002/`，否則生成的倉庫連結是 localhost，員工點開失效。

> 📖 原廠文件：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中文） https://docs.gitea.com/zh-cn

---

[← 第8章：LiteLLM：驗證與快取](ch08-litellm.md) · [📖 目錄](index.md) · [第10章：DeepChat 分發與 CI/CD →](ch10-deepchat.md)
