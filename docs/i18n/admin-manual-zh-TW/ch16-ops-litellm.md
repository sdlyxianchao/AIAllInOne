# 第16章：LiteLLM 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> PII 遮蔽代理：模型列表、遮蔽規則、快取、Langfuse 上報。

[← 第15章：NewAPI 日常管理](ch15-ops-newapi.md) · [📖 目錄](index.md) · [第17章：Dify 日常管理 →](ch17-ops-dify.md)

---

**入口**：`http://<伺服器IP>:4001`（純 API，無 Web 介面，除錯用 `/v1/models`）。配置在 `litellm-config.yaml`。

## 16.1 模型列表維護

編輯 `litellm-config.yaml` 的 `model_list`，增刪模型與對應 API Key。加新 provider 的步驟：

1. `.env` 取消 `# OPENAI_API_KEY=` 註釋填 Key；

2. `litellm-config.yaml` 取消對應 model 塊註釋；

3. `docker compose up -d litellm`。

## 16.2 響應快取

Redis exact match 快取，完全相同請求跨使用者共享。調 `cache_params.ttl`（預設 3600 秒）。關閉：`cache: false` 後重啟。

## 16.3 Langfuse 上報

透過 `success_callback: ["langfuse"]` + `.env` 的 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` 自動上報每次呼叫。

## 16.4 重啟與疑難排解

```
docker compose restart litellm          # 改配置後重啟
docker logs litellm --tail 50           # 看日誌
```

> ⚠️ 關鍵坑：① guardrails 要加 `default_on: true` 才全域生效；② PII 遮蔽（Presidio）當前因上游 API 變更暫註釋，僅做純代理；③ 用穩定版 `v1.95.1`（`main-latest` 有 bug）。

> 📖 原廠文件：LiteLLM 官方文件 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第15章：NewAPI 日常管理](ch15-ops-newapi.md) · [📖 目錄](index.md) · [第17章：Dify 日常管理 →](ch17-ops-dify.md)
