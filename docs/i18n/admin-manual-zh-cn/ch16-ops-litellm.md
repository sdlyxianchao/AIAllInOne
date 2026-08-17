# 第16章：LiteLLM 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> PII 脱敏代理：模型列表、脱敏规则、缓存、Langfuse 上报。

[← 第15章：NewAPI 日常管理](ch15-ops-newapi.md) · [📖 目录](index.md) · [第17章：Dify 日常管理 →](ch17-ops-dify.md)

---

**入口**：管理后台 `http://<服务器IP>:4001/ui`（Web 界面）；API `http://<服务器IP>:4001`（调试用 `/v1/models`）。配置在 `litellm-config.yaml`。

## 16.0 登录管理后台

LiteLLM 的 `/ui` 管理后台用**统一账号**登录（用户名 `ai_all_in_one_admin`、密码见 `credentials.html`），由 `.env` 的 `UI_USERNAME` / `UI_PASSWORD` 控制。

> 📌 也可配置 **Keycloak SSO 自动登录**：在 `.env` 设 `LITELLM_UI_*`（`GENERIC_CLIENT_ID/SECRET` + Keycloak 的 auth/token/userinfo 端点 + `AUTO_REDIRECT_UI_LOGIN_TO_SSO=true`），并在 Keycloak 建 OIDC Client `litellm`（redirect `<服务器IP>:4001/sso/callback`）+ 返回 `litellm_role=proxy_admin` 的 claim。配置后访问 `/ui` 自动跳 Keycloak 免密登录。

## 16.1 模型列表维护

编辑 `litellm-config.yaml` 的 `model_list`，增删模型与对应 API Key。加新 provider 的步骤：

1. `.env` 取消 `# OPENAI_API_KEY=` 注释填 Key；

2. `litellm-config.yaml` 取消对应 model 块注释；

3. `docker compose up -d litellm`。

## 16.2 响应缓存

Redis exact match 缓存，完全相同请求跨用户共享。调 `cache_params.ttl`（默认 3600 秒）。关闭：`cache: false` 后重启。

## 16.3 Langfuse 上报

通过 `success_callback: ["langfuse"]` + `.env` 的 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` 自动上报每次调用。

## 16.4 重启与排错

```
docker compose restart litellm          # 改配置后重启
docker logs litellm --tail 50           # 看日志
```

> ⚠️ 关键坑：① guardrails 要加 `default_on: true` 才全局生效；② PII 脱敏（Presidio）当前因上游 API 变更暂注释，仅做纯代理；③ 用稳定版 `v1.95.1`（`main-latest` 有 bug）。

> 📖 原厂文档：LiteLLM 官方文档 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第15章：NewAPI 日常管理](ch15-ops-newapi.md) · [📖 目录](index.md) · [第17章：Dify 日常管理 →](ch17-ops-dify.md)
