# Chapter 10: DSH Desktop Distribution and CI/CD

*Part 1 · Deployment*

> Distribute the DSH Desktop installer to employees, and use Gitea Actions to auto-sync new official versions.

[← Chapter 9: Dify / Ghost / Gitea Configuration](ch09-products.md) · [📖 Index](index.md) · [Chapter 11: MCP Gateway and Skill Marketplace →](ch11-mcp.md)

---

## 10.1 Distribution Chain

Distribution chain = GitHub Releases installers → Gitea Actions of the `dsh-sync` repo → update server (:8091) → Ghost download page → employee download.

> 📌 The `dsh` source mirror repo has been deleted — a mirror only syncs git source, not release installers, so it is useless for distribution. Create it separately only if you need source auditing / secondary development.

## 10.2 Download the Installers to the Update Server

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

Verify: `curl -I http://<server-IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206. Then update the Ghost download page (see Chapter 9).

## 10.3 Auto Sync (Gitea Actions, recommended)

| Component | Description |
| --- | --- |
| `dsh-sync` repo | Regular repo (cannot use mirror), containing `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Trigger | `schedule` (daily at UTC 2 AM) + `workflow_dispatch` (manual) |
| Logic | Check the latest GitHub tag → compare with `version.txt` → if newer, download + update the Ghost download page + write the version |

```
# trigger once manually
curl -X POST "http://<server-IP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<password>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ Key pitfalls: ① act_runner's `container.network` must be configured via `config.yaml` (with the `CONFIG_FILE` environment variable), otherwise the job container cannot resolve the `gitea` hostname; ② docker.sock is auto-mounted by the runner, don't mount it again in options (would report Duplicate mount point).

## 10.4 Mainland-China Download Source Configuration (sync-config.json)

The installers on the official `www.dshdesktop.com` download page still point to GitHub, which is basically unreachable in mainland China. The real solution is `sync-config.json`:

| Field | Purpose | Default |
| --- | --- | --- |
| `version_source` | `github` (GitHub API, most accurate) or `official` (official-site cache, reachable but lagging) | `github` |
| `download_prefix` | download acceleration prefix, e.g. `https://ghproxy.com/` | `""` |
| `keep_releases` | number of version histories to keep | `5` |
| `market_url` | the intranet marketplace address for "install Skill Butler first" on the download page | `http://<server-IP>:3100` |

```
# Can reach GitHub: keep defaults
{ "version_source": "github", "download_prefix": "" }
# GitHub acceleration proxy (most common)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```

> 📌 The workflow has built-in `version_cmp.py` version comparison; it only downloads when "latest > local" (to avoid the official-site cache lag rolling the client back to an older version).

## 10.5 Approach B: Build a Custom Version with Docker (optional)

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# inside the container
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# output is in dist/, copy it to dsh-updates/ after exiting
```

## 10.6 Configure the DSH Desktop Client (employee side)

1. DSH Desktop → Settings → Model Service → custom Provider / OpenAI-compatible;

2. API Base URL: `http://<server-IP>:3000/v1` (must be intranet IP);

3. API Key: the `sk-xxx` of `dsh-key`;

4. Model: `deepseek-chat`, save then test a conversation.

> 📖 Vendor docs:DSH Desktop quick start https://www.dshdesktop.com/docs/guide/getting-started/ · open-source repo https://github.com/dataelement/dsh-desktop

---

[← Chapter 9: Dify / Ghost / Gitea Configuration](ch09-products.md) · [📖 Index](index.md) · [Chapter 11: MCP Gateway and Skill Marketplace →](ch11-mcp.md)
