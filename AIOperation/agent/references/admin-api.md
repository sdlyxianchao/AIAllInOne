# AI Admin Center API 参考

> AI Admin Center（`admin-portal`，Express）全部管理 API 前缀 `/api`，经 Keycloak OIDC 保护，
> 管理类端点需 `ai-platform-admin` 角色。基地址 `<admin-portal>` 以实际部署为准（compose 端口映射）。
> 请求需携带登录会话 Cookie；无会话时返回 302 跳 Keycloak 登录。

## 1. 会话与系统

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/me` | 当前登录用户与角色 |
| GET | `/api/urls` | 各产品入口 URL（由服务器公开地址派生） |
| GET | `/api/health` | 全平台健康聚合 |
| GET | `/api/health/:name` | 单服务健康 |
| GET | `/api/system` | 系统信息（Docker 版本/CPU/内存/镜像/容器数） |
| GET | `/api/metrics` | 产品业务指标聚合（NewAPI/Gitea/Ghost/Dify/Keycloak/MCP/LiteLLM/PII/监控/Langfuse） |

## 2. 管理员与权限

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/admins` / `/api/admins/search` | 管理员列表 / 搜索 |
| POST | `/api/admins` | 新增管理员 |
| PUT/DELETE | `/api/admins/:id` | 修改 / 删除管理员 |
| GET/PUT | `/api/admins/:id/products`、`/api/admins/:id/products/:product` | 产品级授权 |
| PUT | `/api/admins/:id/credentials` | 各产品应用凭据管理 |

## 3. 认证与 Keycloak

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/auth/overview` | SSO/认证总览 |
| GET | `/api/keycloak/overview` | Keycloak 概览（realm/用户数/客户端） |
| GET | `/api/keycloak/clients` | OIDC 客户端列表 |
| GET | `/api/keycloak/users` / `/api/keycloak/users/:id` | 用户列表 / 详情 |
| GET/POST | `/api/keycloak/roles`、`/api/keycloak/roles/:name` | 角色管理 |
| GET | `/api/keycloak/roles/:name/users` | 角色成员 |
| POST | `/api/keycloak/sync` | 触发 AD/LDAP 用户同步 |

## 4. NewAPI（模型网关）

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/newapi/overview` | 渠道/令牌/用户总数 |
| GET/POST | `/api/newapi/channels` | 渠道列表 / 新增渠道 |
| GET/POST | `/api/newapi/tokens` | API 密钥列表 / 生成 |
| GET | `/api/newapi/users` | 用户 |
| GET | `/api/newapi/audit` | 调用审计 |
| GET | `/api/newapi/cost` | 成本统计 |

## 5. Gitea（源码 + DeepChat 同步）

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/gitea/overview` | 仓库/用户/版本概览 |
| GET | `/api/gitea/open` | 生成免登录打开地址 |
| GET/POST | `/api/gitea/sync/config` | 同步配置（目标平台/保留版本数） |
| GET | `/api/gitea/sync/history` | 同步历史 |
| GET/POST | `/api/gitea/sync/schedule` | 自动同步计划（cron） |
| POST | `/api/gitea/sync/trigger` | 手动触发同步 |
| GET | `/api/gitea/sync/versions` | 已同步版本 |
| DELETE | `/api/gitea/sync/version/:ver` | 删除某版本 |

## 6. Ghost 门户 / Dify

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/ghost/overview` | 文章/页面/成员/标签统计 |
| POST | `/api/ghost/auto-login` | 管理员免登录进入 Ghost 后台 |
| GET | `/api/dify/overview` | Dify 应用/工作区/版本 |
| POST | `/api/dify/retrieve` | 知识库检索测试 |

## 7. MCP Gateway

| 方法 | 端点 | 用途 |
|---|---|---|
| GET/POST | `/api/mcp-gateway/servers` | 已注册 MCP server 列表 / 新增 |
| PUT/DELETE | `/api/mcp-gateway/servers/:name` | 修改 / 删除 server |
| GET/POST | `/api/mcp-gateway/skills` | 技能列表 / 新增 |
| DELETE | `/api/mcp-gateway/skills/:name` | 删除技能 |
| POST | `/api/mcp-gateway/skills/upload` | 上传技能包 |
| GET | `/api/mcp-gateway/tools` | 可用工具聚合列表 |

## 8. 监控 / 日志 / PII / 更新

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/monitoring/overview` | Prometheus 抓取目标与健康 |
| GET | `/api/alerts` | 当前告警 |
| GET | `/api/logs/query` | Loki 统一日志查询 |
| GET | `/api/pii/overview` | PII 脱敏规则与模型接入 |
| GET | `/api/litellm` / `/api/litellm/models` | LiteLLM 状态 / 模型列表 |
| GET | `/api/langfuse/overview` | Langfuse 调用量/成本概览 |
| GET | `/api/update/overview` | 更新服务器状态与 DeepChat 版本 |

## 9. 可用性测试

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/availability` | 测试项清单 + 最近结果 + 统计 |
| POST | `/api/availability/run` | 全量测试（返回全部结果） |
| POST | `/api/availability/test/:id` | 单项测试（回写缓存并重算统计，返回 `{...result, summary}`） |

## 10. 备份 / 报告 / IM 告警

| 方法 | 端点 | 用途 |
|---|---|---|
| GET | `/api/backup/list` | 备份列表 |
| POST | `/api/backup/run` | 立即全量备份 |
| POST | `/api/backup/restore` | 从指定备份恢复 |
| GET | `/api/report?days=&lang=&sections=` | 生成报告（返回 markdown + 保存到服务器） |
| GET | `/api/report/list` | 历史报告 + 保留设置 |
| GET | `/api/report/settings` / POST | 读取 / 更新保留策略（count/days） |
| GET | `/api/report/file/:name` | 查看历史报告内容 |
| GET | `/api/report/file/:name/download` | 下载 .md |
| DELETE | `/api/report/file/:name` | 删除单份报告 |
| GET/POST | `/api/imalert/config` | 告警配置（开关等） |
| GET/PUT | `/api/imalert/rules` | 告警规则 |
| GET | `/api/imalert/receivers`、POST/PUT/DELETE `/api/imalert/receivers/:id` | 接收人管理 |
| GET | `/api/imalert/history` | 告警发送历史 |
| POST | `/api/imalert/test/:id` | 测试某接收人 |
| POST | `/api/alert-webhook` | Alertmanager 告警回调入口 |

## 调用示例

```bash
# 生成 7 天中文全章节报告
curl -b <session-cookie> "<admin-portal>/api/report?days=7&lang=zh&sections=system,usage,client,issues,avail,backup,pii"

# 单项可用性测试（如 ghost）
curl -b <session-cookie> -X POST "<admin-portal>/api/availability/test/ghost"

# 触发 Gitea 同步
curl -b <session-cookie> -X POST "<admin-portal>/api/gitea/sync/trigger"

# 查询最近日志（Loki）
curl -b <session-cookie> "<admin-portal>/api/logs/query?q=error&since=1h"
```
