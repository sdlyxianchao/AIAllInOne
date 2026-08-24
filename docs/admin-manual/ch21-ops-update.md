# Chapter 21: Update Server Administration

*Part 2 · Administration*

> Hosting and auto-updating DSH Desktop installers.

[← Chapter 20: MCP Gateway Day-to-Day Administration](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapter 22: Monitoring and Alerting Administration →](ch22-ops-monitoring.md)

---

**Entry**: `http://<server-IP>:8091`, data in `dsh-updates/`.

## 21.1 Manually Place a New Version

1. Download the official DSH Desktop installer to `dsh-updates/dsh/`;

2. Update `version.txt` (write the new version number);

3. When employees' DSH Desktop auto-updates, it checks `version.txt` and downloads/installs if a new version is found.

## 21.2 Auto Sync (recommended)

Rely on the Gitea Actions of the `dsh-sync` repo to auto-check GitHub for new versions daily and sync (see Chapter 10). Manual trigger:

```
curl -X POST "http://<server-IP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<password>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 Sync Configuration (sync-config.json)

| Field | Purpose |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | download acceleration prefix (e.g. ghproxy.com) |
| `keep_releases` | number of version histories to keep |
| `market_url` | the "Skill Butler" marketplace address on the download page |

> 📌 When the DSH Desktop client reports "model connection timeout", it usually means the client is going through a dead system proxy (`ECONNREFUSED 127.0.0.1:33210`). Have the user change DSH Desktop "Settings → Network/Proxy" to "No proxy / direct connection".

> 📖 Vendor docs:DSH Desktop quick start https://www.dshdesktop.com/docs/guide/getting-started/ · open-source repo https://github.com/dataelement/dsh-desktop

---

[← Chapter 20: MCP Gateway Day-to-Day Administration](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapter 22: Monitoring and Alerting Administration →](ch22-ops-monitoring.md)
