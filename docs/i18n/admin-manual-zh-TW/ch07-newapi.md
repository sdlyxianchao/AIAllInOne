# 第7章：NewAPI：初始化、渠道與 OIDC

*第一部分 · 部署篇*

> 完成初始安裝嚮導，配置指向 LiteLLM 的渠道、下發 API Key，接入 Keycloak OIDC。

[← 第6章：Keycloak：Realm、使用者與 AD](ch06-keycloak.md) · [📖 目錄](index.md) · [第8章：LiteLLM：驗證與快取 →](ch08-litellm.md)

---

## 7.1 初始安裝嚮導（首次訪問）

NewAPI 首次啟動彈 4 步系統設定嚮導：

1. **資料庫檢查**：點「驗證資料庫連線」，預期綠色勾。

2. **管理員帳戶**：使用者名稱 `ai_all_in_one_admin`、郵箱 `ai_all_in_one_admin@<公司網域>`、密碼統一管理員密碼。

> 📌 為什麼先建本地管理員：此時 OIDC 還沒配，NewAPI 不認識 Keycloak，必須先有本地帳號「進門」完成配置，再去系統設定開啟 OIDC。

3. **使用模式**：選「個人使用」（公司內部：員工能註冊、用量分開看、無充值計費模組）。

4. **確認初始化**：建立資料庫表 → 用管理員登入。

## 7.2 配置 LLM 渠道（指向 LiteLLM）

1. **渠道** → 新增新渠道 → 型別 `OpenAI`；

2. Base URL 填 `http://litellm:4000`（容器名，走 Docker 網路，**不是 localhost**）；

3. 金鑰填 `.env` 的 `LITELLM_MASTER_KEY` 實際值（不是示例值，否則報 `No connected db`）；

4. 模型填 `deepseek-chat`（示例，按實際配置）；

5. 儲存 → 點「測試」驗證連通。

配了多個 provider 就重複新增：Claude 型別 `Anthropic Claude`、DeepSeek 型別 `OpenAI`，Base URL 都填 `http://litellm:4000`。

## 7.3 建立 API 金鑰

為 Dify 和 DeepChat 各建一把，分開統計用量：

1. 左側 **API 金鑰** → 新建；

2. 名稱 `dify-key` → 儲存 → 複製 `sk-xxx`（填到 Dify 模型供應商）；

3. 再建 `deepchat-key` → 複製 `sk-xxx`（分發給 DeepChat 使用者）。

## 7.4 允許普通使用者自助申請 Key

員工登入後預設能在「API 金鑰」頁自己新建 Key。要能真正呼叫模型，需滿足兩點（已在 `.env` 預設）：

1. **有額度**：`DEFAULT_QUOTA=100`（新使用者送 100 美元額度）；

2. **有 token**：`GENERATE_DEFAULT_TOKEN=true`（註冊即生成初始 token）。

> ⚠️ 只對「新註冊」使用者生效：已登入過的使用者（如 `aitest1`）不會自動補發，需管理員在「使用者」頁手動設額度。

## 7.5 接入 Keycloak OIDC（讓 AD 使用者直接登入）

### ① 在 Keycloak 建 NewAPI OIDC Client

1. enterprise-ai Realm → **Clients** → Create client；

2. Client ID `newapi`，型別 OpenID Connect；

3. **Client authentication：On**（必開，否則沒 Credentials 標籤）、Standard flow / Direct access grants：On；

4. Valid redirect URIs：`http://<伺服器IP>:3000/*` 和 `http://127.0.0.1:3000/*`；

5. 儲存 → Credentials 標籤 → 複製 Client secret。

### ② 在 NewAPI 開啟 OIDC

NewAPI 後臺 → **系統設定 → 身分驗證 → 自定義 OAuth → 新增 OAuth 提供商**，填：

| 分組 | 配置項 | 值 |
| --- | --- | --- |
| 快速設定 | 預設模板 / API 地址 | `Keycloak` / `http://127.0.0.1:9090` |
| 基本資訊 | 提供商名 / 識別符號 | `Keycloak` / `keycloak` |
| 憑證 | Client ID / Secret | `newapi` / Keycloak 複製的值 |
| 端點 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 欄位對映 | 使用者 ID / 使用者名稱 / 郵箱 | `sub` / `preferred_username` / `email` |

點「自動發現」填好端點後，**把令牌端點、使用者資訊端點改成 `host.docker.internal:9090`**（NewAPI 容器內部調 Keycloak 用），授權端點保持 `<伺服器IP>:9090`（瀏覽器跳轉用）。作用域 `openid profile email`。

> ⚠️ 兩個必改，否則登入失敗：
> - **儲存後回 Keycloak 補回撥 URL**：把 `http://<伺服器IP>:3000/oauth/keycloak` 和 `http://127.0.0.1:3000/oauth/keycloak` 加進 Valid redirect URIs；
> - **NewAPI「伺服器地址」設為內網地址**：系統設定 → 通用設定 → 伺服器地址改 `http://<伺服器IP>:3000`（預設 localhost 會導致換 token 報 `invalid_grant - Incorrect redirect_uri`）。改後本機也要用內網 IP 訪問 NewAPI。

改資料庫的方法：

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<伺服器IP>:3000') ON DUPLICATE KEY UPDATE value='http://<伺服器IP>:3000';"
docker compose restart new-api
```

> ⚠️ 疑難排解：登入返回 **429 Too Many Requests**——NewAPI 關鍵介面限流（預設 20 次/20 分鐘）觸發。臨時解除：`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`；永久方案已在 `.env` 預設 `CRITICAL_RATE_LIMIT_ENABLE=false` 等四組變數。

> 📖 原廠文件：NewAPI 官方文件 https://docs.newapi.pro · 官網 https://www.newapi.ai · 開源倉庫 https://github.com/QuantumNous/new-api

---

[← 第6章：Keycloak：Realm、使用者與 AD](ch06-keycloak.md) · [📖 目錄](index.md) · [第8章：LiteLLM：驗證與快取 →](ch08-litellm.md)
