# 第13章：互連驗證清單

*第一部分 · 部署篇*

> 部署完成後，逐項確認 12 條互連鏈路全部打通。

[← 第12章：AI 管理中心](ch12-admin-center.md) · [📖 目錄](index.md) · [第14章：Keycloak 日常管理 →](ch14-ops-keycloak.md)

---

部署篇到此結束。最後按下面 12 項逐條驗證，全部 ✅ 才說明平台真正跑通。

| # | 互連 | 驗證方式 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI 渠道測試收到 OK |
| 2 | Dify → NewAPI | Dify 模型供應商測試收到回覆 |
| 3 | DSH Desktop → NewAPI | DSH Desktop 發訊息收到回覆 |
| 4 | Keycloak → NewAPI | Keycloak 帳號 OIDC 登入 NewAPI |
| 5 | Keycloak → Dify | Keycloak 帳號 SSO 登入 Dify |
| 6 | MCP Gateway → DSH Desktop | DSH Desktop 獲取 MCP 工具列表並呼叫 |
| 7 | MCP Gateway → Dify | Dify 工作流呼叫 MCP 工具 |
| 8 | Gitea Runner → Docker | Runner 可執行 CI/CD 任務 |
| 9 | Gitea → 更新伺服器 | CI 產物可上傳到更新伺服器 |
| 10 | Ghost API → Gitea | Gitea Actions 可調 Ghost API 發公告 |
| 11 | Ghost → Dify 跳轉 | 門戶「AI 工作臺」正確跳 Dify |
| 12 | AI 管理中心 | Dashboard 顯示全部容器 + 左側選單可訪問所有產品 |

> ✅ 全部透過後，繼續讀第二部分「管理篇」學習各產品的日常操作，以及第三部分「維運篇」的備份、健康檢查、疑難排解。

---

[← 第12章：AI 管理中心](ch12-admin-center.md) · [📖 目錄](index.md) · [第14章：Keycloak 日常管理 →](ch14-ops-keycloak.md)
