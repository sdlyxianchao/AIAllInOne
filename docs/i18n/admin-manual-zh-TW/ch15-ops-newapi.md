# 第15章：NewAPI 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> LLM 閘道器：管渠道、令牌、額度、使用者、日誌、成本。

[← 第14章：Keycloak 日常管理](ch14-ops-keycloak.md) · [📖 目錄](index.md) · [第16章：LiteLLM 日常管理 →](ch16-ops-litellm.md)

---

**入口**：`http://<伺服器IP>:3000`。

## 15.1 渠道管理（上游模型）

1. **新增渠道**：渠道 → 新增新渠道 → 型別 OpenAI（或 Claude 等）→ Base URL `http://litellm:4000` → 金鑰 `LITELLM_MASTER_KEY` → 填模型名 → 儲存；

2. **測試**：渠道列表點「測試」，選模型驗證連通；

3. **禁用/啟用**：渠道列表開關，禁用後該渠道不再承接請求；

4. **優先順序/權重**：多渠道同模型時按優先順序/權重分流。

## 15.2 令牌（API Key）管理

1. **新建**：API 金鑰 → 新建令牌 → 起名（如 `dsh-key`）→ 可設額度/過期時間/模型限制 → 儲存；

2. **複製 Key**：`sk-` 開頭，**只顯示一次，立即儲存**；

3. **禁用/刪除**：令牌列表操作（禁用後該 Key 立即失效）；

4. **查用量**：令牌詳情看已消耗額度。

## 15.3 額度與使用者

- **新使用者預設額度**：`DEFAULT_QUOTA`（建議 100 美元）；

- **給單個使用者提額**：使用者頁 → 編輯該使用者 → 設額度；

- **充值/封禁**：使用者頁操作；

- **分組管理**：按部門建分組，設模型倍率/配額，使用者歸組即按部門管控。

## 15.4 日誌與成本

- **日誌頁**：查每次呼叫的使用者/模型/token/額度/成本/來源 IP；

- **成本報表**：AI 管理中心「NewAPI 管理」頁有按使用者/模型/日期聚合的成本報表 + 最近 100 條審計日誌。

> 📌 客戶端 IP 記錄依賴使用者「記錄 IP 日誌」設定（`record_ip_log`，預設關），需要 IP 審計時給對應使用者開啟。

## 15.5 系統設定要點

- **伺服器地址**：必須設為內網 `http://<伺服器IP>:3000`（否則 OIDC 報 `invalid_grant - Incorrect redirect_uri`）；

- **身分驗證 → 自定義 OAuth**：Keycloak OIDC 接入（見第 7 章）；

- **使用模式**：個人使用 ↔ 對外運營可切換。

> ⚠️ 關鍵坑回顧：① 渠道 Base URL 都填容器名 `http://litellm:4000`；② 限流 429 用 `CRITICAL_RATE_LIMIT_ENABLE=false` 等變數控制；③ 改資料庫直接用 `MYSQL_PWD` 環境變數，避免 stderr 密碼警告被誤判錯誤。

> 📖 原廠文件：NewAPI 官方文件 https://docs.newapi.pro · 官網 https://www.newapi.ai · 開源倉庫 https://github.com/QuantumNous/new-api

---

[← 第14章：Keycloak 日常管理](ch14-ops-keycloak.md) · [📖 目錄](index.md) · [第16章：LiteLLM 日常管理 →](ch16-ops-litellm.md)
