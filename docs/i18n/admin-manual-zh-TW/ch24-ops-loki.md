# 第24章：統一日誌（Loki）

*第二部分 · 管理篇（各產品日常操作）*

> 聚合所有容器日誌，按容器 + 關鍵字 + 時間檢索。

[← 第23章：LLM 可觀測（Langfuse）](ch23-ops-langfuse.md) · [📖 目錄](index.md) · [第25章：PII 遮蔽（Presidio） →](ch25-ops-pii.md)

---

**入口**：AI 管理中心「📜 統一日誌」頁（最方便），或 Loki `http://<伺服器IP>:3110`。

## 24.1 元件

| 元件 | 埠 | 用途 |
| --- | --- | --- |
| Loki | 3110 | 日誌儲存與查詢（單機、本地檔案系統） |
| Promtail | —（內部） | 經 docker.sock 發現容器、採集 json 日誌推給 Loki |

## 24.2 查詢日誌

1. AI 管理中心 → 統一日誌；

2. 選容器（下拉）→ 填關鍵字 → 選時間範圍 → 查詢；

3. 後端 `/api/logs/query` 用 LogQL 查 Loki。

## 24.3 LogQL 速查

```
{container="new-api"} |= "error"              # 某容器含 error 的行
{container=~".+"} |~ "(?i)error|exception"      # 所有容器匹配
{service="litellm"} |= "EMAIL"                  # 按服務查
```

> 📌 Loki 的 label 是 `container / project / service`，**沒有 `job`**。查詢用 `{container=~".+"}` 而非 `{job="docker"}`。

> ⚠️ 關鍵坑（Docker Desktop 掛載）：Promtail 需掛載 `/var/run/docker.sock` 和 `/var/lib/docker/containers`（WSL2 下指向 Docker Desktop VM 內部，正好是日誌所在）；別用宿主機 Windows 的 `C:\...\containers` 路徑。Loki 單機用 `store: tsdb` + filesystem。

> 📖 原廠文件：Loki 官方文件 https://grafana.com/docs/loki/latest/

---

[← 第23章：LLM 可觀測（Langfuse）](ch23-ops-langfuse.md) · [📖 目錄](index.md) · [第25章：PII 遮蔽（Presidio） →](ch25-ops-pii.md)
