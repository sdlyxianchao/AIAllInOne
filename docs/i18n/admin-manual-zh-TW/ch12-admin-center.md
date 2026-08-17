# 第12章：AI 管理中心

*第一部分 · 部署篇*

> 統一管理員門戶：Keycloak 鑑權、左側選單內嵌全部產品、Dashboard 叢集狀態。

[← 第11章：MCP Gateway 與 Skill 市場](ch11-mcp.md) · [📖 目錄](index.md) · [第13章：互連驗證清單 →](ch13-interconnect.md)

---

> 📌 定位：不是 Docker 管理平台（1Panel/Portainer），而是面向管理員的統一後臺——Keycloak 鑑權 + 左側選單連結全部產品 + Dashboard 叢集狀態 + 統一管理員帳號。

## 12.1 核心能力

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

## 12.2 初始化 Global Administrator

```
# .env 中配置
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=見帳號密碼清單
ADMIN_EMAIL=ai_all_in_one_admin@<公司網域>
```

啟動後自動在 Keycloak 建 `ai_all_in_one_admin` 使用者（已有則跳過），分配 `ai-platform-admin` Realm Role。核心理念：**一個 Global Admin 帳號管理所有平台**。

## 12.3 Docker Compose 部署

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

## 12.4 Keycloak 客戶端配置

1. Keycloak → enterprise-ai → Clients → Create；

2. Client ID `AI-all-in-one-admin-portal`，Client authentication / Standard flow 都 On；

3. Valid Redirect URIs：`http://127.0.0.1:10086/*` 和 `http://<伺服器IP>:10086/*`；

4. 複製 Client Secret → 填 `.env` 的 `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`；

5. 建 Realm Role `ai-platform-admin`，分配給 `ai_all_in_one_admin`。

> ⚠️ 部署/疑難排解要點：
> - admin-portal 會話存記憶體，`up -d` 重建容器會**清空登入會話**（需重登）；
> - 首頁 `/` 必須走 Keycloak 保護（`express.static(..., {index:false})` + 顯式 `app.get('/', keycloak.protect())`），否則未登入直接渲染空看板；
> - 統計 Dify 用實際管理員郵箱（`ai_all_in_one_admin@<公司網域>`，須與 AD 全域管理員一致）；
> - **改 server.js 後必須 `docker restart admin-portal`**，不能用 `up -d`（volume 檔案內容變化不會觸發重建）。

## 12.5 驗證

1. 開啟 `http://<伺服器IP>:10086` → 自動跳 Keycloak 登入（未登入不顯示空看板）；

2. 用 `ai_all_in_one_admin` 登入 → 進總覽儀表板；

3. Dashboard 顯示 8 個產品指標 + 容器分組；

4. 點各產品先看統計、點「開啟後臺」才跳轉；

5. 系統設定可切 9 種語言。

## 12.6 管理員分模組授權 + Keycloak 認證頁管理（v0.91）

全域管理員可在 AI 管理中心直接管理其他管理員和 Keycloak：

- **管理員帳號管理**：從 Keycloak 關聯的 IdP 搜尋既有帳號（AD/LDAP 使用者，無需新建、無需密碼）→ 勾選模組 → 確定。系統分配 `admin:<產品>` Realm Role，並**真實開通到產品**（SSO 優先、API 兜底）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse。撤銷模組或刪除管理員會**從產品刪除該帳號**。無 SSO 產品建號產生臨時密碼，🔑 圖示可回看（僅全域管理員）。非管理員登入彈「你不是管理員」並退出。

- **Keycloak 認證頁**：「全部同步 / 增量同步」按鈕一鍵拉取 AD 屬性變更；每列使用者有「編輯」（跳 Keycloak 控制台）和「刪除」；角色區塊可新建/刪除角色、查看成員。同步/刪除/角色操作僅全域管理員。

> ⚠️ 注意：Keycloak 無「單一使用者同步」端點，增量同步會同步 AD 裡所有有變更的帳號；AD 同盟使用者刪除後下次全量同步或再次 SSO 登入會重新出現，徹底移除請在 AD 停用/刪除該帳號。

---

[← 第11章：MCP Gateway 與 Skill 市場](ch11-mcp.md) · [📖 目錄](index.md) · [第13章：互連驗證清單 →](ch13-interconnect.md)
