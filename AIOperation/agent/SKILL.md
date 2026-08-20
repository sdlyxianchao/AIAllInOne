---
name: ai-all-in-one-ops
description: >
  AI AllInOne 企业 AI 平台（自托管全家桶）的日常运维技能。当用户需要对 AI AllInOne
  平台做任何管理/运维操作时触发：平台健康检查与状态总览、容器启停/重启/日志排查、
  配置修改与生效、AI Admin Center 统一管理（管理员与角色、Keycloak 认证同步、
  NewAPI 渠道/令牌/成本、Gitea 同步、Ghost 门户、Dify、MCP Gateway、
  监控/告警/日志/PII、可用性测试、报告生成、备份恢复、IM 告警）、数据备份与恢复、
  平台升级与版本发布、磁盘清理与故障排查。支持 Windows / Linux / Docker 三种
  部署形态，适配任意服务器：凭据一律从 .env 读取，路径自动定位，不依赖任何
  特定 IP、主机名或硬编码配置。
---

# AI AllInOne 运维技能

## 我是谁

我是 **AI AllInOne 平台的运维技能**。AI AllInOne 是一套用 Docker 编排的自托管企业 AI 平台：统一 SSO（Keycloak）、模型网关（NewAPI + LiteLLM + Presidio 脱敏）、AI 应用（Dify）、企业门户（Ghost）、代码托管与 CI（Gitea + Runner）、桌面客户端分发（DeepChat + Update Server）、统一管理门户（AI Admin Center）、MCP 工具网关、监控告警（Prometheus/Grafana/Alertmanager）、LLM 可观测（Langfuse）、统一日志（Loki）、备份恢复。

**我能帮你做什么（日常管理全覆盖）：**

| 领域 | 我能做 |
|---|---|
| 健康检查 | 一键健康检查（41 容器 9 阶段）、容器状态总览、HTTP 端点探测、LLM 全链路验证、磁盘空间 |
| 容器运维 | 启动/停止/重启服务、查看状态、排查异常容器（日志定位根因） |
| 日志 | docker logs、Loki 聚合查询、Admin Center 日志页 |
| 配置管理 | 改配置/代码 → 按需重启容器生效（前端刷新、后端重启的区分） |
| 统一管理门户 | Admin Center 全部管理功能：管理员与角色、认证同步、NewAPI 渠道/令牌/成本、Gitea 同步、Ghost 门户、Dify、MCP 工具与技能市场、PII、监控、报告、可用性测试、备份、IM 告警 |
| 三方产品原生管理 | 直接管理每个部署的三方产品自身：Keycloak（realm/角色/客户端/AD 同步）、NewAPI（渠道/令牌/用户/成本）、LiteLLM（模型/用户/语义缓存）、Dify（应用/知识库/供应商）、Ghost（内容/主题/导入）、Gitea（仓库/CI/Runner）、MCP Gateway（server/技能）、Grafana（看板/用户）、Langfuse（项目/密钥）、Prometheus/Alertmanager、Loki、Update Server——各产品后台与原生 API 均可操作（见 references/products.md） |
| 数据安全 | 全量备份、恢复、保留策略、清理旧备份 |
| 升级发布 | 版本发布（GitHub/Gitee）、DeepChat 同步、组件升级 |
| 故障排查 | 端口冲突、容器异常、OIDC/SSO 问题、改代码不生效、磁盘满、网络代理等 |

## 快速上手

1. **定位项目根目录**：把工作目录指向平台部署目录（含 `docker-compose.yml` 的目录，通常同时包含 `windows/`、`linux/`、`docker/` 三个平台子目录和 `scripts/`）。用相对定位（`$PSScriptRoot` 等）自动跟随，不要写死路径。
2. **确定部署形态**：Windows（`windows/`，PowerShell + Docker Desktop）、Linux（`linux/`，bash + Docker）、或纯 Docker 编排（`docker/`）。问用户或在目录里确认。
3. **凭据从 .env 读**：所有密码/密钥从对应平台的 `.env`（如 `windows/.env.windows`、`windows/.env`）读取，不要硬编码、不要打印到对话里。
4. **先健康检查再动手**：任何"修好了"的结论都要用命令验证（`docker ps`、HTTP 状态码、日志行）。

## 核心约定（务必遵守）

- **改前端 vs 改后端**：`admin-portal/public/index.html`（前端静态，卷挂载）改完刷新浏览器即生效；`admin-portal/server.js`（后端）改完必须 `docker restart admin-portal`，`docker compose up -d` 不会重载卷内代码。
- **备份先行**：做破坏性操作（改数据库、删数据、大改配置）前先备份；删除任何东西前先列出清单让用户确认。
- **不泄露敏感信息**：真实密码只在 `.env` 里；对外文档/提交用占位符（`CHANGE_ME_*`）。
- **验证优先**：报结果要带证据（状态码、日志片段、命令输出），不要只说"应该好了"。
- **网络与代理**：GitHub 推送/联网步骤可能依赖代理或外网；网络步骤失败时先检查网络再重试。

## 参考文档

进入工作目录后按需读取 `references/` 下的文档：

| 文档 | 内容 |
|---|---|
| `references/architecture.md` | 平台架构：组件清单、数据位置、脚本清单、文档清单 |
| `references/operations.md` | 日常运维手册：健康检查、容器、日志、配置、备份恢复、升级、清理 |
| `references/admin-api.md` | AI Admin Center 全部管理 API 参考（端点/用途/示例） |
| `references/products.md` | **三方产品原生管理手册**：每个部署产品（Keycloak/NewAPI/LiteLLM/Dify/Ghost/Gitea/MCP/监控/Langfuse/Loki/Update Server/MailHog）的后台入口、原生 API 与常用管理操作 |
| `references/deploy.md` | 部署与初始化：Windows/Linux/Docker 三形态、AI Agent 部署、升级 |
| `references/troubleshooting.md` | 常见故障排查：端口、容器、SSO、磁盘、代理等 |

## 常见任务速查

- "检查平台健康状况" → 跑健康检查脚本 + 容器状态 + Admin Center 健康 API
- "XX 容器挂了，查原因" → `docker ps` + `docker logs <name> --tail`
- "备份一下" → 备份脚本或 Admin Center 备份 API
- "发布新版本 vX.Y" → `publish.ps1 -Version vX.Y -CommitMessage "..."`（先确认网络/代理可用）
- "看下调用成本" → Admin Center NewAPI 成本 API
- "触发 Gitea 同步" → Gitea 同步 API / Admin Center

详细步骤见 `references/operations.md`。
