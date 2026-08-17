# 第21章：更新服务器管理

*第二部分 · 管理篇（各产品日常操作）*

> DeepChat 安装包托管与自动更新。

[← 第20章：MCP Gateway 日常管理](ch20-ops-mcp.md) · [📖 目录](index.md) · [第22章：监控告警管理 →](ch22-ops-monitoring.md)

---

**入口**：`http://<服务器IP>:8091`，数据在 `deepchat-updates/`。

## 21.1 手动放置新版本

1. 下载 DeepChat 官方安装包到 `deepchat-updates/deepchat/`；

2. 更新 `version.txt`（写入新版本号）；

3. 员工侧 DeepChat 自动更新时检查 `version.txt` 发现新版即下载安装。

## 21.2 自动同步（推荐）

靠 `deepchat-sync` 仓库的 Gitea Actions 每天自动检查 GitHub 新版本并同步（见第 10 章）。手动触发：

```
curl -X POST "http://<服务器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密码>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 配置同步（sync-config.json）

| 字段 | 作用 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 下载加速前缀（如 ghproxy.com） |
| `keep_releases` | 版本历史保留数 |
| `market_url` | 下载页「技能管家」市场地址 |

> 📌 DeepChat 客户端报「模型连接超时」通常是客户端走了挂掉的系统代理（`ECONNREFUSED 127.0.0.1:33210`）。让用户在 DeepChat「设置 → 网络/代理」改为「不使用代理/直连」。

> 📖 原厂文档：DeepChat 快速开始 https://deepchatai.cn/docs/guide/getting-started/ · 开源仓库 https://github.com/ThinkInAIXYZ/deepchat

---

[← 第20章：MCP Gateway 日常管理](ch20-ops-mcp.md) · [📖 目录](index.md) · [第22章：监控告警管理 →](ch22-ops-monitoring.md)
