# 第15章：NewAPI 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> LLM 网关：管渠道、令牌、额度、用户、日志、成本。

[← 第14章：Keycloak 日常管理](ch14-ops-keycloak.md) · [📖 目录](index.md) · [第16章：LiteLLM 日常管理 →](ch16-ops-litellm.md)

---

**入口**：`http://<服务器IP>:3000`。

## 15.1 渠道管理（上游模型）

1. **新增渠道**：渠道 → 添加新渠道 → 类型 OpenAI（或 Claude 等）→ Base URL `http://litellm:4000` → 密钥 `LITELLM_MASTER_KEY` → 填模型名 → 保存；

2. **测试**：渠道列表点「测试」，选模型验证连通；

3. **禁用/启用**：渠道列表开关，禁用后该渠道不再承接请求；

4. **优先级/权重**：多渠道同模型时按优先级/权重分流。

## 15.2 令牌（API Key）管理

1. **新建**：API 密钥 → 新建令牌 → 起名（如 `deepchat-key`）→ 可设额度/过期时间/模型限制 → 保存；

2. **复制 Key**：`sk-` 开头，**只显示一次，立即保存**；

3. **禁用/删除**：令牌列表操作（禁用后该 Key 立即失效）；

4. **查用量**：令牌详情看已消耗额度。

## 15.3 额度与用户

- **新用户默认额度**：`DEFAULT_QUOTA`（建议 100 美元）；

- **给单个用户提额**：用户页 → 编辑该用户 → 设额度；

- **充值/封禁**：用户页操作；

- **分组管理**：按部门建分组，设模型倍率/配额，用户归组即按部门管控。

## 15.4 日志与成本

- **日志页**：查每次调用的用户/模型/token/额度/成本/来源 IP；

- **成本报表**：AI 管理中心「NewAPI 管理」页有按用户/模型/日期聚合的成本报表 + 最近 100 条审计日志。

> 📌 客户端 IP 记录依赖用户「记录 IP 日志」设置（`record_ip_log`，默认关），需要 IP 审计时给对应用户开启。

## 15.5 系统设置要点

- **服务器地址**：必须设为内网 `http://<服务器IP>:3000`（否则 OIDC 报 `invalid_grant - Incorrect redirect_uri`）；

- **身份验证 → 自定义 OAuth**：Keycloak OIDC 接入（见第 7 章）；

- **使用模式**：个人使用 ↔ 对外运营可切换。

> ⚠️ 关键坑回顾：① 渠道 Base URL 都填容器名 `http://litellm:4000`；② 限流 429 用 `CRITICAL_RATE_LIMIT_ENABLE=false` 等变量控制；③ 改数据库直接用 `MYSQL_PWD` 环境变量，避免 stderr 密码警告被误判错误。

> 📖 原厂文档：NewAPI 官方文档 https://docs.newapi.pro · 官网 https://www.newapi.ai · 开源仓库 https://github.com/QuantumNous/new-api

---

[← 第14章：Keycloak 日常管理](ch14-ops-keycloak.md) · [📖 目录](index.md) · [第16章：LiteLLM 日常管理 →](ch16-ops-litellm.md)
