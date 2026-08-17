# 第8章：LiteLLM：驗證與快取

*第一部分 · 部署篇*

> 驗證 LiteLLM 代理可用、開啟響應快取節省 token。

[← 第7章：NewAPI：初始化、渠道與 OIDC](ch07-newapi.md) · [📖 目錄](index.md) · [第9章：Dify / Ghost / Gitea 配置 →](ch09-products.md)

---

> ⚠️ PII 遮蔽（Presidio guardrail）當前**暫時禁用**：新版 LiteLLM 的 guardrail 配置格式變更，`litellm-config.yaml` 該段已註釋，當前 LiteLLM 僅做代理轉發（不遮蔽）。啟用方法見第 25 章。

## 8.1 驗證 LiteLLM 基本可用

```
curl -X POST http://<伺服器IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` 是 LiteLLM 管理員金鑰，取 `.env` 實際值（不是佔位符本身，否則 401）。且必須用內網 IP `<伺服器IP>:4001`，不能用 `127.0.0.1:4001`（WSL2 埠轉發問題）。

## 8.2 響應快取（已內建，節省 token）

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

## 8.3 新增更多 LLM 提供商

1. `.env` 取消 `# OPENAI_API_KEY=` 註釋填 Key；

2. `litellm-config.yaml` 取消對應 model 塊註釋；

3. `docker compose up -d litellm`。

> 📖 原廠文件：LiteLLM 官方文件 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第7章：NewAPI：初始化、渠道與 OIDC](ch07-newapi.md) · [📖 目錄](index.md) · [第9章：Dify / Ghost / Gitea 配置 →](ch09-products.md)
