# 第13章：互连验证清单

*第一部分 · 部署篇*

> 部署完成后，逐项确认 12 条互连链路全部打通。

[← 第12章：AI 管理中心](ch12-admin-center.md) · [📖 目录](index.md) · [第14章：Keycloak 日常管理 →](ch14-ops-keycloak.md)

---

部署篇到此结束。最后按下面 12 项逐条验证，全部 ✅ 才说明平台真正跑通。

| # | 互连 | 验证方式 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI 渠道测试收到 OK |
| 2 | Dify → NewAPI | Dify 模型供应商测试收到回复 |
| 3 | DSH Desktop → NewAPI | DSH Desktop 发消息收到回复 |
| 4 | Keycloak → NewAPI | Keycloak 账号 OIDC 登录 NewAPI |
| 5 | Keycloak → Dify | Keycloak 账号 SSO 登录 Dify |
| 6 | MCP Gateway → DSH Desktop | DSH Desktop 获取 MCP 工具列表并调用 |
| 7 | MCP Gateway → Dify | Dify 工作流调用 MCP 工具 |
| 8 | Gitea Runner → Docker | Runner 可执行 CI/CD 任务 |
| 9 | Gitea → 更新服务器 | CI 产物可上传到更新服务器 |
| 10 | Ghost API → Gitea | Gitea Actions 可调 Ghost API 发公告 |
| 11 | Ghost → Dify 跳转 | 门户「AI 工作台」正确跳 Dify |
| 12 | AI 管理中心 | Dashboard 显示全部容器 + 左侧菜单可访问所有产品 |

> ✅ 全部通过后，继续读第二部分「管理篇」学习各产品的日常操作，以及第三部分「运维篇」的备份、健康检查、排错。

---

[← 第12章：AI 管理中心](ch12-admin-center.md) · [📖 目录](index.md) · [第14章：Keycloak 日常管理 →](ch14-ops-keycloak.md)
