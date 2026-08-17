# Chapter 21: Update Server Administration

*Part 2 · Administration*

> Hosting and auto-updating DeepChat installers.

[← Chapter 20: MCP Gateway Day-to-Day Administration](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapter 22: Monitoring and Alerting Administration →](ch22-ops-monitoring.md)

---

**Entry**: `http://<server-IP>:8091`, data in `deepchat-updates/`.

## 21.1 Manually Place a New Version

1. Download the official DeepChat installer to `deepchat-updates/deepchat/`;

2. Update `version.txt` (write the new version number);

3. When employees' DeepChat auto-updates, it checks `version.txt` and downloads/installs if a new version is found.

## 21.2 Auto Sync (recommended)

Rely on the Gitea Actions of the `deepchat-sync` repo to auto-check GitHub for new versions daily and sync (see Chapter 10). Manual trigger:

```
curl -X POST "http://<server-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<password>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 Sync Configuration (sync-config.json)

| Field | Purpose |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | download acceleration prefix (e.g. ghproxy.com) |
| `keep_releases` | number of version histories to keep |
| `market_url` | the "Skill Butler" marketplace address on the download page |

> 📌 When the DeepChat client reports "model connection timeout", it usually means the client is going through a dead system proxy (`ECONNREFUSED 127.0.0.1:33210`). Have the user change DeepChat "Settings → Network/Proxy" to "No proxy / direct connection".

> 📖 Vendor docs:DeepChat quick start https://deepchatai.cn/docs/guide/getting-started/ · open-source repo https://github.com/ThinkInAIXYZ/deepchat

---

[← Chapter 20: MCP Gateway Day-to-Day Administration](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapter 22: Monitoring and Alerting Administration →](ch22-ops-monitoring.md)
