# 第3章：配置檔案與環境變數

*第一部分 · 部署篇*

> 三個核心配置檔案 + 全套環境變數說明，哪些現在配、哪些以後配。

[← 第2章：前置準備](ch02-prereq.md) · [📖 目錄](index.md) · [第4章：啟動核心服務 →](ch04-start.md)

---

## 3.1 三個核心配置檔案

| 檔案 | 用途 | 需要修改嗎 |
| --- | --- | --- |
| `.env.windows` | 所有密碼和外部 API Key | **必須修改**：填 DeepSeek API Key，其它 provider 按需 |
| `litellm-config.yaml` | LiteLLM 模型列表 + PII 遮蔽規則 | 通常不改（只用 DeepSeek 可刪 OpenAI/Claude 條目） |
| `docker-compose.yml` | 核心服務編排 | 已預配置（含 Keycloak `KC_HOSTNAME` + 持久化卷） |

## 3.2 環境變數分類總覽

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

## 3.3 🔴 立即配置（首次啟動前必須完成）

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

### 填入 API Key 的示例

```
# 預設已配 DeepSeek（取消註釋並填入 Key）
DEEPSEEK_API_KEY=sk-你的真實DeepSeek金鑰

# 需要 OpenAI / Claude 時取消註釋，並同步取消 litellm-config.yaml 對應 model 塊註釋
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 密碼修改策略

> ⚠️ `NEWAPI_DB_PASSWORD` 涉及已建資料庫，改後需刪對應 volume 重建（資料會丟），建議首次就定好。
 `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` 等管理密碼可在各產品後臺改，改完同步更新 `.env`（只是備忘，不影響執行）。

## 3.5 litellm-config.yaml 說明

- `model_list` — 定義可用外部模型，NewAPI 經 LiteLLM 呼叫。預設只啟用 `deepseek-chat`；

- `general_settings.master_key` — LiteLLM 管理員金鑰，讀 `.env` 的 `LITELLM_MASTER_KEY`；

- PII 遮蔽（Presidio）當前**臨時註釋**（新版 LiteLLM guardrail API 變更不相容），後續啟用見第 25 章；

- 用穩定版本 `v1.95.1`（`main-latest` 有已知 bug）。

---

[← 第2章：前置準備](ch02-prereq.md) · [📖 目錄](index.md) · [第4章：啟動核心服務 →](ch04-start.md)
