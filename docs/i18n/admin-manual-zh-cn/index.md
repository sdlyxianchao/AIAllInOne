# AI AllInOne 管理员手册

*v0.2 · 部署 · 管理 · 运维*

本手册分为三部分：**部署篇**（第 1–13 章，从零搭建平台）、**管理篇**（第 14–26 章，13 个产品的日常操作）和**运维篇**（第 27–29 章，备份 / 健康检查 / 故障排查），外加**附录**（第三方文档链接）。每章页面底部都有上一章 / 下一章导航——可以顺序通读，也可以直接跳到所需章节。

## 第一部分 · 部署篇

| # | 章节 | 说明 |
| --- | --- | --- |
| 1 | [平台概览与架构](ch01-overview.md) | 理解这套平台的组成、端口、数据流，是后续所有部署与管理操作的前提。 |
| 2 | [前置准备](ch02-prereq.md) | 安装 Docker Desktop、准备目录、打通网络、固定 IP——部署前必须完成的事。 |
| 3 | [配置文件与环境变量](ch03-env.md) | 三个核心配置文件 + 全套环境变量说明，哪些现在配、哪些以后配。 |
| 4 | [启动核心服务](ch04-start.md) | 复制 .env、拉起容器、逐服务验证可访问，处理 Ghost 的 SQLite 已知问题。 |
| 5 | [Dify 独立部署](ch05-dify-deploy.md) | Dify 用官方 compose（约 15 个容器）独立部署，避免端口冲突。 |
| 6 | [Keycloak：Realm、用户与 AD](ch06-keycloak.md) | 创建 Realm、建本地账号、或从 Active Directory 导入域账号——所有产品 SSO 的基础。 |
| 7 | [NewAPI：初始化、渠道与 OIDC](ch07-newapi.md) | 完成初始安装向导，配置指向 LiteLLM 的渠道、下发 API Key，接入 Keycloak OIDC。 |
| 8 | [LiteLLM：验证与缓存](ch08-litellm.md) | 验证 LiteLLM 代理可用、开启响应缓存节省 token。 |
| 9 | [Dify / Ghost / Gitea 配置](ch09-products.md) | 三个产品各自的初始化与互连配置。 |
| 10 | [DeepChat 分发与 CI/CD](ch10-deepchat.md) | 把 DeepChat 安装包分发给员工，以及用 Gitea Actions 自动同步官方新版本。 |
| 11 | [MCP Gateway 与 Skill 市场](ch11-mcp.md) | 集中管理 Skill 和 MCP 工具的网关，DeepChat/Dify 连一个地址即可拿到所有工具。 |
| 12 | [AI 管理中心](ch12-admin-center.md) | 统一管理员门户：Keycloak 鉴权、左侧菜单按「产品应用 / AI 网关与集成 / 系统运维 / 系统管理」分组、Dashboard 集群状态。 |
| 13 | [互连验证清单](ch13-interconnect.md) | 部署完成后，逐项确认 12 条互连链路全部打通。 |

## 第二部分 · 管理篇（各产品日常操作）

| # | 章节 | 说明 |
| --- | --- | --- |
| 14 | [Keycloak 日常管理](ch14-ops-keycloak.md) | 认证中枢：管用户、角色、OIDC 客户端、AD 联邦、会话；大部分操作可在 AI 管理中心完成。 |
| 15 | [NewAPI 日常管理](ch15-ops-newapi.md) | LLM 网关：管渠道、令牌、额度、用户、日志、成本；统计可在 AI 管理中心查看。 |
| 16 | [LiteLLM 日常管理](ch16-ops-litellm.md) | PII 脱敏代理：模型列表、脱敏规则、缓存、Langfuse 上报；AI 管理中心可看概览。 |
| 17 | [Dify 日常管理](ch17-ops-dify.md) | AI 应用平台：应用、知识库、模型供应商、成员权限、发布；AI 管理中心可看概览与检索测试。 |
| 18 | [Ghost 日常管理](ch18-ops-ghost.md) | 企业门户 / Hub：文章、页面、导航、主题、成员；AI 管理中心可一键免密进入后台。 |
| 19 | [Gitea 日常管理](ch19-ops-gitea.md) | 内部 Git + CI/CD：仓库、组织、Runner、Actions；deepchat-sync 同步管理可在 AI 管理中心完成。 |
| 20 | [MCP Gateway 日常管理](ch20-ops-mcp.md) | 增删 MCP Server、上传/删除 Skill、扩展内置工具；管理操作在 AI 管理中心完成。 |
| 21 | [更新服务器管理](ch21-ops-update.md) | DeepChat 安装包托管与自动更新；AI 管理中心可查看文件与版本。 |
| 22 | [监控告警管理](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager：容器资源监控；企业 IM 告警配置在 AI 管理中心完成。 |
| 23 | [LLM 可观测（Langfuse）](ch23-ops-langfuse.md) | 追踪每次模型调用的提示词、响应、延迟、token、成本；AI 管理中心可看概览。 |
| 24 | [统一日志（Loki）](ch24-ops-loki.md) | 聚合所有容器日志，按容器 + 关键字 + 时间检索；在 AI 管理中心完成。 |
| 25 | [PII 脱敏（Presidio）](ch25-ops-pii.md) | 敏感信息在出内网前自动脱敏；AI 管理中心可看服务状态。 |
| 26 | [MailHog 邮件接收器](ch26-ops-mailhog.md) | 内网无 SMTP 时的「邮件出口」，承接 Ghost 验证码/通知邮件。 |

## 第三部分 · 运维篇

| # | 章节 | 说明 |
| --- | --- | --- |
| 27 | [备份与恢复](ch27-backup.md) | 全量数据每日备份、一键恢复。 |
| 28 | [健康检查与开机自检](ch28-healthcheck.md) | 一键体检全部 41 个容器 + LLM 全链路 + 认证链路。 |
| 29 | [故障排查手册](ch29-troubleshooting.md) | 按症状速查，快速定位根因。 |

## 附录

| # | 章节 | 说明 |
| --- | --- | --- |
| 附录 | [原厂文档索引](ch30-appendix.md) | 所有第三方产品的官方文档地址（明文 URL，打印后仍可对照访问）。 |

---

> 🌐 其他语言版本：[English](../../admin-manual/index.md) · 简体中文 · [繁體中文](../admin-manual-zh-TW/index.md) · [Français](../admin-manual-fr/index.md) · [Español](../admin-manual-es/index.md) · [Português](../admin-manual-pt/index.md) · [日本語](../admin-manual-ja/index.md) · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
