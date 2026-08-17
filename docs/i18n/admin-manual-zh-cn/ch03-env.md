# 第3章：配置文件与环境变量

*第一部分 · 部署篇*

> 三个核心配置文件 + 全套环境变量说明，哪些现在配、哪些以后配。

[← 第2章：前置准备](ch02-prereq.md) · [📖 目录](index.md) · [第4章：启动核心服务 →](ch04-start.md)

---

## 3.1 三个核心配置文件

| 文件 | 用途 | 需要修改吗 |
| --- | --- | --- |
| `.env.windows` | 所有密码和外部 API Key | **必须修改**：填 DeepSeek API Key，其它 provider 按需 |
| `litellm-config.yaml` | LiteLLM 模型列表 + PII 脱敏规则 | 通常不改（只用 DeepSeek 可删 OpenAI/Claude 条目） |
| `docker-compose.yml` | 核心服务编排 | 已预配置（含 Keycloak `KC_HOSTNAME` + 持久化卷） |

## 3.2 环境变量分类总览

打开 `.env`（把 `.env.windows` 复制而来），按优先级配置。

| 变量 | 优先级 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 立即 | 外部 LLM API Key，不配则链路不通 |
| `LITELLM_MASTER_KEY` | 🔴 立即 | LiteLLM 内部鉴权密钥，NewAPI 要用 |
| `NEWAPI_DB_PASSWORD` | 🔴 立即 | MySQL root 密码，首次创建后不宜改 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 立即 | Keycloak 管理员密码 |
| `NEWAPI_SESSION_SECRET` | 🔴 立即 | NewAPI 会话加密，随机字符串 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 立即 | NewAPI 数据加密，随机字符串 |
| `ADMIN_PASSWORD` | 🔴 立即 | AI 管理中心 Global Admin 密码 |
| `SESSION_SECRET` | 🔴 立即 | AI 管理中心会话加密，随机字符串 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 可后配 | 需先在 Keycloak 建 OIDC Client 拿 Secret（见第 12 章） |
| `GITEA_RUNNER_TOKEN` | 🟡 可后配 | 先启动 Gitea 在后台拿 Token（见第 9 章） |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 按需 | 要用时取消注释，并同步改 `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` 等限流项 | ⚪ 默认 | 测试期设 999999，生产酌情调低 |
| `DEFAULT_QUOTA` | ⚪ 默认 | 新用户默认额度（美元），设 100 即新用户送 100 美元 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ 默认 | 新用户注册自动生成初始 Key，设 true 让用户登录即用 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ 默认 | 默认值即可 |

## 3.3 🔴 立即配置（首次启动前必须完成）

| 变量 | 说明 | 如何获取 | 格式 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 云端 LLM Key | 注册 https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM 内部管理员密钥（不是外部 LLM Key） | 随机生成（见下） | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL 密码 | 自己定，首次创建后**不宜再改** | 任意 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理员密码 | 自己定，≥ 8 位 | 任意 |
| `NEWAPI_SESSION_SECRET` | NewAPI 会话加密 | 随机生成 | 32 位 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI 数据加密 | 随机生成 | 32 位 |
| `ADMIN_PASSWORD` | AI 管理中心管理员密码 | 自己定，≥ 8 位 | 任意 |
| `SESSION_SECRET` | AI 管理中心会话加密 | 随机生成 | 64 位 |

生成随机字符串（PowerShell）：

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 填入 API Key 的示例

```
# 默认已配 DeepSeek（取消注释并填入 Key）
DEEPSEEK_API_KEY=sk-你的真实DeepSeek密钥

# 需要 OpenAI / Claude 时取消注释，并同步取消 litellm-config.yaml 对应 model 块注释
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 密码修改策略

> ⚠️ `NEWAPI_DB_PASSWORD` 涉及已建数据库，改后需删对应 volume 重建（数据会丢），建议首次就定好。
 `KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD` 等管理密码可在各产品后台改，改完同步更新 `.env`（只是备忘，不影响运行）。

## 3.5 litellm-config.yaml 说明

- `model_list` — 定义可用外部模型，NewAPI 经 LiteLLM 调用。默认只启用 `deepseek-chat`；

- `general_settings.master_key` — LiteLLM 管理员密钥，读 `.env` 的 `LITELLM_MASTER_KEY`；

- PII 脱敏（Presidio）当前**临时注释**（新版 LiteLLM guardrail API 变更不兼容），后续启用见第 25 章；

- 用稳定版本 `v1.95.1`（`main-latest` 有已知 bug）。

---

[← 第2章：前置准备](ch02-prereq.md) · [📖 目录](index.md) · [第4章：启动核心服务 →](ch04-start.md)
