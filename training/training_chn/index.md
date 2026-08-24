# AI AllInOne 企业内网 AI 平台 · 培训计划

> **One server. One SSO. The whole enterprise AI stack — free and self-hosted.**
> 本培训体系面向平台部署与运维上岗，共 17 模块、60 学时、10 个工作日。

| 版本 | 日期 | 模块 | 学时 | 考核 | 结业 |
|---|---|---|---|---|---|
| v1.0 | 2026-08-19 | 17 | 60 | 理论 + 实操 + 答辩 | 证书 ✓ |

**目录**
- [培训总览](#培训总览)
- [10 日培训日程](#10-日培训日程a-级管理员班)
- [产品模块](#产品模块16-个产品文件夹--平台总览)
- [考核体系](#考核体系)
- [参考资料](#参考资料)
- [培训目录结构](#培训目录结构)

---

## 培训总览

### 目标能力

| 能力 | 达标标准 |
|---|---|
| 部署 | 独立完成 Windows 11 + Docker Desktop 全栈部署（约 41 容器），走通 LLM 全链路 |
| 配置 | 独立完成 Keycloak SSO、NewAPI 渠道、Dify 模型/知识库、Ghost 门户、Gitea CI/CD、MCP Gateway 互连配置 |
| 运维 | 日常巡检、健康检查、备份恢复、日志查询、故障排查 |
| 答疑 | 面对「怎么用 / 为什么不能用 / 怎么配」能给出正确回答 |
| 安全 | 理解 PII 脱敏、数据分级（公开/内部/机密）、内网合规 |

### 角色分层

| 角色 | 对象 | 深度 | 考核 |
|---|---|---|---|
| A · 平台管理员（核心） | 部署/运维技术人员 | 全部 17 模块，深度掌握 | 理论+实操+答辩 |
| B · 产品运营/内容管理员 | 门户内容、知识库、日常答疑 | 8 个重点模块，中深度 | 理论+实操 |
| C · 普通用户支持人员 | 一线答疑、用户培训 | 5 个模块，了解级 | 理论 |

> 默认按 A 级制定全套计划；B、C 级可裁减对应模块。详细内容见 [培训总纲.md](00-总纲/培训总纲.md)

---

## 10 日培训日程（A 级管理员班）

| 天 | 上午（3 学时） | 下午（3 学时） | 产出/作业 |
|---|---|---|---|
| **D1** | M01 平台总览与架构（组件/端口/数据流/安全模型） | M02 Docker 基础 + 环境准备（Docker Desktop、.wslconfig、目录、.env、ai-platform 网络、固定 IP） | 环境就绪；画出平台架构图 |
| **D2** | M02 Docker Compose 深度 + 核心服务启动（10 容器 Up + 逐服务验证） | M02 续：Dify 独立部署（15 容器 + 排错 GRAPH_ENGINE / WebSocket + Ollama bge-m3） | 41 容器全 Up；提交部署日志 |
| **D3** | M03 Keycloak 上（Realm/用户/组/角色/OIDC Client） | M03 Keycloak 下（AD/LDAP 联邦 + Entra ID / SAML 多身份源 + 排错） | Keycloak SSO 登录验证通过 |
| **D4** | M04 NewAPI（初始化/渠道/令牌/额度/OIDC 接入/提权） | M05 LiteLLM + Presidio（模型列表/PII 脱敏/语义缓存/Langfuse 上报） | LLM 全链路（NewAPI→LiteLLM→DeepSeek）打通 |
| **D5** | M06 Dify 上（模型供应商/聊天助手/Agent） | M06 Dify 下（知识库 RAG / Knowledge API / 工作流 / 发布） | Dify 应用 + 知识库检索可用 |
| **D6** | M07 Ghost（初始化/Corp Portal 主题/内容种子/下载中心） | M08 Gitea + Runner（Actions / dsh-sync / 工作流语法 / SSO） | 门户发布文章；CI 工作流跑通 |
| **D7** | M09 DSH Desktop（安装/模型配置/MCP/Skill/更新链路） | M10 MCP Gateway（内置工具/外部 MCP/Skill 市场/RAG 检索） | DSH Desktop 调 search_knowledge 成功 |
| **D8** | M11 AI 管理中心（初始化/菜单/分模块授权/备份恢复） | M12~M16 运维模块（Update Server/监控告警/Langfuse/Loki/MailHog） | 管理中心全功能可用；告警配置完成 |
| **D9** | 综合实战一（12 项互连验证 + health-check.ps1 全绿） | 综合实战二 · M17 AI 运维（Agent 驱动巡检/备份/故障演练/发布） | 12 项互连全绿；健康检查 ALL CLEAR |
| **D10** | 总复习 + 答疑 + 模拟答辩 | 结业考核（理论 100 题 90min + 实操 120min + 答辩） | 三项考核完成并评分、结业 |

> ⚠️ 培训纪律：使用测试数据；凭据仅存 .env；遇到问题先按《故障排查手册》自查再求助；破坏性操作须讲师监督。B/C 级班日程按总纲裁减。

---

## 产品模块（16 个产品文件夹 + 平台总览）

> 📚 **每个产品文件夹都有一份《参考资料清单.md》**：本地文档（docs 手册对应章节 + 部署指南 + 源码/配置）+ 官方文档 + 视频教程 + 优质图文，按「先本地 → 再官方 → 后视频」给出自学路径。

| # | 模块 | 类别 | 学时 | 描述 | 链接 |
|---|---|---|---|---|---|
| M01 | 平台总览与架构 | 基础 | — | 6 层架构 / 16 端口 / 数据流 / 安全模型：动手前建立完整平台地图 | [教材](00-总纲/平台总览教材-M01.md) |
| M02 | Docker + Compose + Ollama | 基础 | 6 | 镜像/容器/卷/网络、compose 语法、8 个端口冲突、.env 必填项、Dify 独立部署、bge-m3 | [大纲](15-docker-ollama/培训大纲.md) · [教材](15-docker-ollama/教材.md) · [计划/考试](15-docker-ollama/培训计划与考试.md) · [资料](15-docker-ollama/参考资料清单.md) |
| M03 | Keycloak 统一认证 | 核心 | 6 | SSO/OIDC/AD 联邦：Realm/Client/User/Role、OIDC Client、AD/LDAP 用户联合、多身份源、SSO 排错 | [大纲](01-keycloak/培训大纲.md) · [教材](01-keycloak/教材.md) · [计划](01-keycloak/培训计划.md) · [考试](01-keycloak/考试考察.md) · [资料](01-keycloak/参考资料清单.md) |
| M04 | NewAPI LLM 路由 | 核心 | 3 | 初始化向导、渠道指向 LiteLLM、密钥分离、OIDC 接入（host.docker.internal 修正 + 服务器地址 + 提权）、成本/审计、限流 | [大纲](02-newapi/培训大纲.md) · [教材](02-newapi/教材.md) · [计划](02-newapi/培训计划.md) · [考试](02-newapi/考试考察.md) · [资料](02-newapi/参考资料清单.md) |
| M05 | LiteLLM + Presidio | 核心 | 3 | config.yaml 结构、内置正则脱敏 + 敏感词 BLOCK、Presidio 端点坑、Redis 语义缓存（bge-m3）、Langfuse 上报 | [大纲](03-litellm-presidio/培训大纲.md) · [教材](03-litellm-presidio/教材.md) · [计划](03-litellm-presidio/培训计划.md) · [考试](03-litellm-presidio/考试考察.md) · [资料](03-litellm-presidio/参考资料清单.md) |
| M06 | Dify AI 应用平台 | 核心 | 6 | 独立部署排错、模型供应商、五类应用、知识库高质量索引、Knowledge API、Chatflow 智能客服、发布嵌入 | [大纲](04-dify/培训大纲.md) · [教材](04-dify/教材.md) · [计划](04-dify/培训计划.md) · [考试](04-dify/考试考察.md) · [资料](04-dify/参考资料清单.md) |
| M07 | Ghost 企业门户 | 核心 | 3 | SQLite 坑、Corp Portal 主题、内容种子导入、文章/导航、MailHog 验证码、AI 管理中心免登录（TOTP） | [大纲](05-ghost/培训大纲.md) · [教材](05-ghost/教材.md) · [计划](05-ghost/培训计划.md) · [考试](05-ghost/考试考察.md) · [资料](05-ghost/参考资料清单.md) |
| M08 | Gitea + Runner | 核心 | 3 | Runner 注册与 4 个坑、dsh-sync 工作流（sync-config.json 三开关）、Actions 语法、SSO 自动注册、ROOT_URL | [大纲](06-gitea-runner/培训大纲.md) · [教材](06-gitea-runner/教材.md) · [计划](06-gitea-runner/培训计划.md) · [考试](06-gitea-runner/考试考察.md) · [资料](06-gitea-runner/参考资料清单.md) |
| M09 | DSH Desktop 桌面客户端 | 核心 | 3 | 安装配置、手动 MCP（跳过至手动配置）、SSE 提示、Skill URL 安装、技能管家（主机名坑）、自动更新链路 | [大纲](07-dsh/培训大纲.md) · [教材](07-dsh/教材.md) · [计划](07-dsh/培训计划.md) · [考试](07-dsh/考试考察.md) · [资料](07-dsh/参考资料清单.md) |
| M10 | MCP Gateway | 核心 | 3 | MCP 协议、内置 4 工具、外部 Server 聚合、Skill 市场、search_knowledge 全链路（3 个坑）、管理 API | [大纲](09-mcp-gateway/培训大纲.md) · [教材](09-mcp-gateway/教材.md) · [计划](09-mcp-gateway/培训计划.md) · [考试](09-mcp-gateway/考试考察.md) · [资料](09-mcp-gateway/参考资料清单.md) |
| M11 | AI 管理中心 | 核心 | 4 | Global Admin 初始化、菜单全览、分模块授权（admin:产品 + 产品侧 provision）、备份恢复、可用性测试、报告、IM 告警 | [大纲](10-admin-center/培训大纲.md) · [教材](10-admin-center/教材.md) · [计划](10-admin-center/培训计划.md) · [考试](10-admin-center/考试考察.md) · [资料](10-admin-center/参考资料清单.md) |
| M12 | Update Server | 基础 | 1 | 分发链路、手工上传验证、latest.yml/version.txt/publish.url、403 属正常、防版本回退 | [大纲](08-update-server/培训大纲.md) · [教材](08-update-server/教材.md) · [计划/考试](08-update-server/培训计划与考试.md) · [资料](08-update-server/参考资料清单.md) |
| M13 | 监控告警 | 重要 | 2 | cadvisor 采集、大盘操作、两条防误报规则、IM 告警配置（群机器人/企业应用）、端口冲突 | [大纲](11-monitoring/培训大纲.md) · [教材](11-monitoring/教材.md) · [计划/考试](11-monitoring/培训计划与考试.md) · [资料](11-monitoring/参考资料清单.md) |
| M14 | Langfuse 可观测 | 重要 | 1.5 | trace 解读、V4_WRITE_MODE=dual 坑、SSO 组织绑定坑、成本分析、Prompt 管理入门 | [大纲](12-langfuse/培训大纲.md) · [教材](12-langfuse/教材.md) · [计划/考试](12-langfuse/培训计划与考试.md) · [资料](12-langfuse/参考资料清单.md) |
| M15 | Loki 统一日志 | 重要 | 1 | 只索引标签的设计、统一日志页查询、LogQL 基础、Docker Desktop 挂载坑 | [大纲](13-loki/培训大纲.md) · [教材](13-loki/教材.md) · [计划/考试](13-loki/培训计划与考试.md) · [资料](13-loki/参考资料清单.md) |
| M16 | MailHog 邮件接收器 | 基础 | 0.5 | Ghost 邮件出口、验证码查看 :8025、TOTP 免登录原理（考核并入 M07） | [大纲/教材](14-mailhog/培训大纲与教材.md) · [资料](14-mailhog/参考资料清单.md) |
| M17 | AI Agent 运维 | 进阶 | 3 | 原理、10 个常用提示词、Best Practices（前端/后端重载、验证不轻信）、health-check.ps1、命令参考 | [大纲](16-ai-agent-ops/培训大纲.md) · [教材](16-ai-agent-ops/教材.md) · [计划/考试](16-ai-agent-ops/培训计划与考试.md) · [资料](16-ai-agent-ops/参考资料清单.md) |

---

## 考核体系

| 考核项 | 形式 | 权重 | 通过线 | 组织 |
|---|---|---|---|---|
| 理论考试 | 闭卷笔试 100 题（单选50/多选15/判断25/简答10） | 40% | ≥70 分 | D10 · 90 分钟 |
| 实操考核 | 现场操作（13 项，⭐ 关键项全过） | 40% | 关键项全过 | D10 · 120 分钟 |
| 综合答辩 | 模拟用户提问（员工/管理层/同事三类） | 20% | ≥70 分 | D10 · 10 分钟/人 |

> **总评 = 理论×0.4 + 实操×0.4 + 答辩×0.2，≥70 结业；单科 <60 需补考。** 实操关键项任一不通过即实操不合格。

**考核文档**：[总考试考察方案](17-考试考察/总考试考察方案.md) · [理论考试题库（100 题含答案）](17-考试考察/理论考试题库.md) · [上机实操考核清单](17-考试考察/上机实操考核清单.md) · [考核评分表（含结业证书模板）](17-考试考察/考核评分表.md)

---

## 参考资料

| 资源 | 位置 |
|---|---|
| 📚 各产品全套资料清单（本地文档 + 官方文档 + 视频 + 图文） | 各产品文件夹下的 `参考资料清单.md`（01-keycloak/ … 16-ai-agent-ops/） |
| 视频教程索引（B 站 / YouTube，按模块归类） | [99-参考资料/视频教程索引.md](99-参考资料/视频教程索引.md) |
| 官方文档快照（离线） | 各产品 `参考资料/` 目录（含抓取脚本说明 [99-参考资料/README.md](99-参考资料/README.md)） |
| 官方文档链接总表（原厂索引） | [../../docs/i18n/admin-manual-zh-cn/ch30-appendix.md](../../docs/i18n/admin-manual-zh-cn/ch30-appendix.md) |
| 平台管理员手册（中文 30 章） | [../../docs/i18n/admin-manual-zh-cn/index.md](../../docs/i18n/admin-manual-zh-cn/index.md) |
| 平台用户手册（中文 8 章） | [../../docs/i18n/user-manual-zh-cn/index.md](../../docs/i18n/user-manual-zh-cn/index.md) |
| Windows 部署指南（权威指南） | [../../windows/windows-deploy-guide-v2.md](../../windows/windows-deploy-guide-v2.md) |
| AI Agent 运维指南 | [../../AI-AGENT-OPS.md](../../AI-AGENT-OPS.md) |
| AD 集成完整指南 | [../../windows/windows-ad-integration.html](../../windows/windows-ad-integration.html) |
| 账号密码清单（机密） | `../../windows/credentials.html`（不随培训材料外传） |

---

## 培训目录结构

```text
C:\AIAllInOne\training\training_chn\
├── index.md                     ← 本文件（Markdown 培训计划主页，在线渲染）
├── 00-总纲\
│   ├── 培训总纲.md              ← 目标/对象/体系/原则/考核
│   ├── 总体培训计划.md          ← 10 日日程表/阶段测验/讲师清单
│   └── 平台总览教材-M01.md
├── 01-keycloak\ … 16-ai-agent-ops\   ← 每个产品一个文件夹
│   ├── 培训大纲.md / 教材.md / 培训计划.md / 考试考察.md
│   ├── 参考资料清单.md          ← 本地文档+官方文档+视频+图文 全套资料
│   └── 参考资料\（官方文档快照）
├── 17-考试考察\
│   ├── 总考试考察方案.md / 理论考试题库.md
│   ├── 上机实操考核清单.md / 考核评分表.md
│   └── 成绩\（归档）
└── 99-参考资料\
    ├── 视频教程索引.md / 官方文档快照 / 下载脚本
```

---

*AI AllInOne 培训体系 v1.0 · 2026-08-19 · 基于 [../../windows/windows-deploy-guide-v2.md](../../windows/windows-deploy-guide-v2.md) 与 docs/ 手册提炼。可在 GitHub / Gitee 在线渲染；如需 PDF，可本地用 Typora / Pandoc 转换。*
