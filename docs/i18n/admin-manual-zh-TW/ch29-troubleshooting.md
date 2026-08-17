# 第29章：疑難排解手冊

*第三部分 · 維運篇*

> 按症狀速查，快速定位根因。

[← 第28章：健康檢查與開機自檢](ch28-healthcheck.md) · [📖 目錄](index.md) · [第附章：原廠文件索引 →](ch30-appendix.md)

---

## 29.1 通用排解三步

1. **看容器狀態**：`docker ps -a` 找 Exited/Restarting；

2. **看日誌**：`docker logs <容器名> --tail 30`；

3. **看健康檢查**：跑 `health-check.ps1` 定位失敗階段。

## 29.2 症狀速查表

| 症狀 | 根因 | 解決 |
| --- | --- | --- |
| localhost 打不開任何產品 | WSL2 IPv6 `::1` 相容問題 | 改用內網 IP 或 127.0.0.1 |
| Ghost 一直 Restarting，報 ECONNREFUSED :3306 | 卷內殘留 MySQL config | 環境變數強制 SQLite（第 4 章） |
| Dify 4 容器啟動即崩 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 改成 50（第 5 章） |
| NewAPI 渠道測試報 No connected db | 渠道金鑰填了示例值 | 填 `LITELLM_MASTER_KEY` 實際值 |
| NewAPI OIDC 報 invalid_grant / Incorrect redirect_uri | 伺服器地址是 localhost | 設內網地址（第 7 章） |
| NewAPI 登入 429 | 關鍵介面限流 | 清 redis rateLimit:* 或改 .env |
| Dify 建應用反覆連 ws://localhost | WebSocket 地址未改 | NEXT_PUBLIC_SOCKET_URL 設內網 IP |
| Dify 點登入沒反應 | 密碼需 base64 / 未登入 401 正常 | 指令碼先 base64；瀏覽器重試 |
| Gitea 報 readonly database | gitea.db 被 root 屬主 | 刪 root 屬主的 db 重建 |
| Gitea 倉庫連結是 localhost | ROOT_URL 未改 | 設內網地址 |
| SSO 登入報 unknown_error | AD 埠轉發失效（iphlpsvc） | 檢查 iphlpsvc + Hyper-V 網路 |
| Keycloak 看不到網域使用者 | Search scope = One Level | 改 Subtree |
| Langfuse 看不到資料 | V4_WRITE_MODE 或 SSO 帳號未入組織 | 設 dual；SQL 加組織（第 23 章） |
| DeepChat 模型連線超時 | 客戶端走了掛掉的系統代理 | 設為不使用代理/直連 |
| Loki 查不到日誌 | 用了 job 標籤 | 用 `{container=~".+"}` |
| Presidio 404 /analyze/analyze | 端點帶了路徑 | 只填 base URL |
| 改 server.js 後新介面 404 | up -d 不重讀 volume 變化 | docker restart admin-portal |

## 29.3 常用命令

```
docker ps -a                                        # 所有容器狀態
docker logs <容器> --tail 50                         # 看日誌
docker compose up -d <服務>                          # 重建某服務
docker compose restart <服務>                        # 重啟某服務（不重讀 .env）
docker system df                                     # Docker 磁碟佔用
C:\AIAllInOne\windows\scripts\health-check.ps1       # 一鍵體檢
```

---

[← 第28章：健康檢查與開機自檢](ch28-healthcheck.md) · [📖 目錄](index.md) · [第附章：原廠文件索引 →](ch30-appendix.md)
