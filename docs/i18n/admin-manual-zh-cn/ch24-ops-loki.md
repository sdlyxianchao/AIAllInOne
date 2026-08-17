# 第24章：统一日志（Loki）

*第二部分 · 管理篇（各产品日常操作）*

> 聚合所有容器日志，按容器 + 关键字 + 时间检索。

[← 第23章：LLM 可观测（Langfuse）](ch23-ops-langfuse.md) · [📖 目录](index.md) · [第25章：PII 脱敏（Presidio） →](ch25-ops-pii.md)

---

**入口**：AI 管理中心「📜 统一日志」页（最方便），或 Loki `http://<服务器IP>:3110`。

## 24.1 组件

| 组件 | 端口 | 用途 |
| --- | --- | --- |
| Loki | 3110 | 日志存储与查询（单机、本地文件系统） |
| Promtail | —（内部） | 经 docker.sock 发现容器、采集 json 日志推给 Loki |

## 24.2 查询日志

1. AI 管理中心 → 统一日志；

2. 选容器（下拉）→ 填关键字 → 选时间范围 → 查询；

3. 后端 `/api/logs/query` 用 LogQL 查 Loki。

## 24.3 LogQL 速查

```
{container="new-api"} |= "error"              # 某容器含 error 的行
{container=~".+"} |~ "(?i)error|exception"      # 所有容器匹配
{service="litellm"} |= "EMAIL"                  # 按服务查
```

> 📌 Loki 的 label 是 `container / project / service`，**没有 `job`**。查询用 `{container=~".+"}` 而非 `{job="docker"}`。

> ⚠️ 关键坑（Docker Desktop 挂载）：Promtail 需挂载 `/var/run/docker.sock` 和 `/var/lib/docker/containers`（WSL2 下指向 Docker Desktop VM 内部，正好是日志所在）；别用宿主机 Windows 的 `C:\...\containers` 路径。Loki 单机用 `store: tsdb` + filesystem。

> 📖 原厂文档：Loki 官方文档 https://grafana.com/docs/loki/latest/

---

[← 第23章：LLM 可观测（Langfuse）](ch23-ops-langfuse.md) · [📖 目录](index.md) · [第25章：PII 脱敏（Presidio） →](ch25-ops-pii.md)
