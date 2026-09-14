# 第22章：監控告警管理

*第二部分 · 管理篇（各產品日常操作）*

> Prometheus + Grafana + Alertmanager：容器資源監控與告警通知。

[← 第21章：更新伺服器管理](ch21-ops-update.md) · [📖 目錄](index.md) · [第23章：LLM 可觀測（Langfuse） →](ch23-ops-langfuse.md)

---

**入口**：Grafana `http://<伺服器IP>:3030`（SSO 自動登入）；Prometheus `:9091`；Alertmanager `:9093`。

## 22.1 元件與埠

| 元件 | 埠 | 用途 |
| --- | --- | --- |
| cadvisor | 8080（內部） | 採集每個容器 CPU/記憶體/網路/磁碟 |
| Prometheus | 9091 | 匯聚指標 + 告警規則（`monitoring/alerts.yml`） |
| Grafana | 3030 | 視覺化大盤（預置「AI All In One — 容器監控」） |
| Alertmanager | 9093 | 告警去重/分組/路由/通知 |

## 22.2 檢視大盤

1. 登入 Grafana（`ai_all_in_one_admin` / 統一密碼，SSO 自動登入）；

2. 開啟「AI All In One — 容器監控」面板，看各容器 CPU/記憶體/網路。

## 22.3 告警規則

預置規則（`monitoring/alerts.yml`）：容器宕機（critical）、容器記憶體 >90%（warning）、容器 CPU >80%（warning）。

> ⚠️ 告警誤報坑：cadvisor 上報宿主機所有 cgroup（含 systemd），告警規則必須寫 `{name!=""}` 過濾，記憶體告警還要加 `container_spec_memory_limit_bytes > 0`（否則 limit=0 除零恆觸發）。

## 22.4 接入告警通知（企業 IM）

告警鏈路為 **Prometheus → Alertmanager → AI 管理中心（`/api/alert-webhook`）→ 企業 IM**。在 AI 管理中心的 **「系統維運 → 企業 IM 告警」** 選單裡配置（配置存 Redis，重啟不丟）：

- **接收人**：可加多個。類型「釘釘/企微/飛書」= 群機器人（填 webhook 位址，發到群聊）；類型「釘釘企業應用（發個人）」（AppKey/AppSecret/AgentId/userid）或「企微企業應用（發個人）」（corpId/secret/agentid/userid）= 企業應用，發到個人。

- **傳送規則**：總開關、最低告警級別（嚴重/警告/資訊）、是否傳送「觸發 firing」/「恢復 resolved」通知。

- **傳送歷史**：記錄每次傳送（時間/接收人/類型/告警名/級別/結果），支援翻頁、調整頁大小、關鍵字檢索、按類型/結果/級別分類篩選。

- 每個接收人有「測試」按鈕可發測試訊息，以及啟用開關。

> ⚠️ 群機器人 webhook 只能發到**群聊**，不能發到個人。要發個人必須用「企業應用」類型（釘釘/企微），需在釘釘/企微管理後台開通內部應用並授予訊息權限。釘釘群機器人還需設「自訂關鍵字」（如「AI 平台」「告警」）或「加簽」，否則會被安全策略攔截。

> 📌 埠衝突說明：Prometheus 預設 9090 被 Keycloak 佔用改 9091；Grafana 預設 3000/3001 被佔改 3030。

> 📖 原廠文件：Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← 第21章：更新伺服器管理](ch21-ops-update.md) · [📖 目錄](index.md) · [第23章：LLM 可觀測（Langfuse） →](ch23-ops-langfuse.md)
