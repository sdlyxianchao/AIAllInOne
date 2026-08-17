# 第29章：故障排查手册

*第三部分 · 运维篇*

> 按症状速查，快速定位根因。

[← 第28章：健康检查与开机自检](ch28-healthcheck.md) · [📖 目录](index.md) · [第附章：原厂文档索引 →](ch30-appendix.md)

---

## 29.1 通用排查三步

1. **看容器状态**：`docker ps -a` 找 Exited/Restarting；

2. **看日志**：`docker logs <容器名> --tail 30`；

3. **看健康检查**：跑 `health-check.ps1` 定位失败阶段。

## 29.2 症状速查表

| 症状 | 根因 | 解决 |
| --- | --- | --- |
| localhost 打不开任何产品 | WSL2 IPv6 `::1` 兼容问题 | 改用内网 IP 或 127.0.0.1 |
| Ghost 一直 Restarting，报 ECONNREFUSED :3306 | 卷内残留 MySQL config | 环境变量强制 SQLite（第 4 章） |
| Dify 4 容器启动即崩 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 改成 50（第 5 章） |
| NewAPI 渠道测试报 No connected db | 渠道密钥填了示例值 | 填 `LITELLM_MASTER_KEY` 实际值 |
| NewAPI OIDC 报 invalid_grant / Incorrect redirect_uri | 服务器地址是 localhost | 设内网地址（第 7 章） |
| NewAPI 登录 429 | 关键接口限流 | 清 redis rateLimit:* 或改 .env |
| Dify 建应用反复连 ws://localhost | WebSocket 地址未改 | NEXT_PUBLIC_SOCKET_URL 设内网 IP |
| Dify 点登录没反应 | 密码需 base64 / 未登录 401 正常 | 脚本先 base64；浏览器重试 |
| Gitea 报 readonly database | gitea.db 被 root 属主 | 删 root 属主的 db 重建 |
| Gitea 仓库链接是 localhost | ROOT_URL 未改 | 设内网地址 |
| SSO 登录报 unknown_error | AD 端口转发失效（iphlpsvc） | 检查 iphlpsvc + Hyper-V 网络 |
| Keycloak 看不到域用户 | Search scope = One Level | 改 Subtree |
| Langfuse 看不到数据 | V4_WRITE_MODE 或 SSO 账号未入组织 | 设 dual；SQL 加组织（第 23 章） |
| DeepChat 模型连接超时 | 客户端走了挂掉的系统代理 | 设为不使用代理/直连 |
| Loki 查不到日志 | 用了 job 标签 | 用 `{container=~".+"}` |
| Presidio 404 /analyze/analyze | 端点带了路径 | 只填 base URL |
| 改 server.js 后新接口 404 | up -d 不重读 volume 变化 | docker restart admin-portal |

## 29.3 常用命令

```
docker ps -a                                        # 所有容器状态
docker logs <容器> --tail 50                         # 看日志
docker compose up -d <服务>                          # 重建某服务
docker compose restart <服务>                        # 重启某服务（不重读 .env）
docker system df                                     # Docker 磁盘占用
C:\AIAllInOne\windows\scripts\health-check.ps1       # 一键体检
```

---

[← 第28章：健康检查与开机自检](ch28-healthcheck.md) · [📖 目录](index.md) · [第附章：原厂文档索引 →](ch30-appendix.md)
