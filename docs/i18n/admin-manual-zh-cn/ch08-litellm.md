# 第8章：LiteLLM：验证与缓存

*第一部分 · 部署篇*

> 验证 LiteLLM 代理可用、开启响应缓存节省 token。

[← 第7章：NewAPI：初始化、渠道与 OIDC](ch07-newapi.md) · [📖 目录](index.md) · [第9章：Dify / Ghost / Gitea 配置 →](ch09-products.md)

---

> ⚠️ PII 脱敏（Presidio guardrail）当前**暂时禁用**：新版 LiteLLM 的 guardrail 配置格式变更，`litellm-config.yaml` 该段已注释，当前 LiteLLM 仅做代理转发（不脱敏）。启用方法见第 25 章。

## 8.1 验证 LiteLLM 基本可用

```
curl -X POST http://<服务器IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` 是 LiteLLM 管理员密钥，取 `.env` 实际值（不是占位符本身，否则 401）。且必须用内网 IP `<服务器IP>:4001`，不能用 `127.0.0.1:4001`（WSL2 端口转发问题）。

## 8.2 响应缓存（已内置，节省 token）

LiteLLM 已启用 Redis exact match 缓存：完全相同的请求（模型+消息+参数）直接返回缓存，跨用户共享、省 token。

```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 独立缓存 Redis
    port: 6379
    ttl: 3600            # 缓存 1 小时
```

> 验证：`curl http://<服务器IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` 返回 `ping_response: true`；连续两次相同请求，第二次耗时降到毫秒级。关闭缓存：`cache: false` 后重启 litellm。

## 8.3 添加更多 LLM 提供商

1. `.env` 取消 `# OPENAI_API_KEY=` 注释填 Key；

2. `litellm-config.yaml` 取消对应 model 块注释；

3. `docker compose up -d litellm`。

> 📖 原厂文档：LiteLLM 官方文档 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第7章：NewAPI：初始化、渠道与 OIDC](ch07-newapi.md) · [📖 目录](index.md) · [第9章：Dify / Ghost / Gitea 配置 →](ch09-products.md)
