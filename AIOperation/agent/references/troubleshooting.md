# 故障排查手册

> 通用排查思路，所有命令在部署目录下执行；端口/路径按实际部署为准。

## 1. 容器起不来 / 反复重启

排查顺序：
1. `docker ps -a` 看状态（Exited / Restarting）和退出码
2. `docker logs <svc> --tail 100` 看报错（找 `Error`、`FATAL`、连接失败）
3. 常见原因：
   - **端口冲突**：宿主机端口被占用 → `netstat -ano | findstr <端口>` 查占用，改 compose 映射或停冲突进程
   - **依赖没起来**：DB 先于应用 → 确认依赖服务健康（`docker compose ps`）
   - **配置/环境变量错**：.env 缺项或格式错 → 检查对应变量
   - **镜像拉取失败**：网络/仓库 → 重试或换镜像源
4. 修复后 `docker restart <svc>` 或 `docker compose up -d <svc>`，再 `docker ps` 验证

## 2. 登录/OIDC 问题

| 现象 | 排查 |
|---|---|
| 登录后报 `invalid_grant - Incorrect redirect_uri` | 用内网 IP 访问，不要用 127.0.0.1/localhost；检查 Keycloak client 的 Valid Redirect URIs |
| 产品里 SSO 登录无反应 | Keycloak 客户端配置（client id/secret、redirect）、realm 是否正确；`/api/keycloak/overview` 查状态 |
| AD 用户同步不上 | `POST /api/keycloak/sync` 触发，查同步日志；检查 LDAP 连接（域控地址/凭据在 .env） |
| 管理员进不了管理功能 | 账号是否分配 `ai-platform-admin` 角色（`/api/keycloak/roles/:name/users` 查看） |

## 3. 改代码/配置不生效

- **前端（index.html）**：改完刷新浏览器，必要时 Ctrl+F5（缓存）
- **后端（server.js 等卷内代码）**：必须 `docker restart admin-portal`；`docker compose up -d` 不重载卷内代码
- **compose 配置/环境变量**：`docker compose up -d`（会重建变更服务）；确认 `docker compose config` 无误
- **典型症状**：改后端后前端调接口返回 HTML 而非 JSON（`Unexpected token '<'`）→ 说明容器还在跑旧代码，restart

## 4. 模型调用异常

- **调用报错/超时**：`POST /api/availability/test/chat-deepchat` 单测链路（DeepChat → NewAPI → LiteLLM → 外部模型）；`GET /api/litellm/models` 查模型注册；NewAPI 渠道状态 `/api/newapi/channels`
- **脱敏误伤**：Presidio 规则过严 → `/api/pii/overview` 查规则，调整 `litellm-config.yaml` guardrails
- **成本/配额异常**：`/api/newapi/cost`、`/api/newapi/audit` 查调用明细
- **语义缓存**：litellm-redis 健康（`docker exec litellm-redis redis-cli ping` → PONG）；缓存命中走 0.4s 级返回

## 5. 监控/告警/日志异常

- **Grafana 无数据**：Prometheus 抓取目标 `/api/monitoring/overview`（targets up 数）；`docker logs prometheus --tail`
- **告警轰炸/漏报**：`monitoring/alerts.yml` + `alertmanager.yml` 规则；`/api/alerts` 当前状态；IM 接收人 `/api/imalert/receivers` 配置与 `/api/imalert/test/:id` 测试
- **Loki 查不到日志**：promtail 是否在跑（`docker ps`）；`promtail.yml` 标签与查询匹配

## 6. 磁盘空间不足

1. `docker system df` 看 Docker 占用；`Get-PSDrive`（Windows）/ `df -h`（Linux）看磁盘
2. 清理候选（**列清单给用户确认后删**）：悬挂镜像 `docker image prune`、停止容器、旧备份 `backups/backup_*`、旧报告
3. 健康检查脚本 Stage 9 会检查磁盘；告警规则含磁盘阈值

## 7. 网络与代理

- **GitHub push/拉取失败**：确认代理（如 `127.0.0.1:33210`）在运行；git 配置了 GitHub 走代理时代理不可用会导致连接失败（Gitee 不受影响）
- **容器拉镜像慢/失败**：镜像加速或换源
- **产品互访失败**：compose 内网网络（`ai-platform` 等）是否正常；用容器名互访

## 8. 备份恢复相关

- **备份失败**：查 `backups/backup.log`；数据库容器是否健康（mysqldump/pg_dump 依赖）
- **恢复后起不来**：恢复操作先备份当前状态；数据库恢复后重启对应容器；验证数据（登录、查询）
- **备份目录磁盘满**：缩短保留天数或手动清理旧备份

## 9. 管理门户（Admin Center）自身问题

- **页面白屏/接口 302**：会话过期 → 重新登录
- **改完 server.js 不生效**：`docker restart admin-portal`（见 §3）
- **功能页报错**：`docker logs admin-portal --tail 50` 看服务端报错；对应产品 API 是否可达（`/api/health/:name`）
- **UI 显示旧内容**：Ctrl+F5 硬刷新

## 10. 通用排查纪律

1. 先看健康检查报告（`health-check.ps1` / `health-check.sh`），定位失败 Stage
2. 每步操作后验证（`docker ps`、HTTP 状态、日志）
3. 破坏性操作（删除、恢复、重建）先备份 + 用户确认
4. 报结论带证据：状态码、日志片段、命令输出
