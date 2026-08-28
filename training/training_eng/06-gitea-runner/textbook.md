# Gitea + Runner — Textbook (M08 · Source & CI/CD)

> Ports `3002` (web) / `2222` (Git SSH); containers `gitea`, `gitea-runner` (act_runner, GitHub Actions compatible).

## 1. Uses

- Source mirror (optional audit/2nd-dev)
- **dsh-sync** (daily check GitHub for new DSH Desktop → download installers → update Ghost download page — core)
- Build/release
- Ghost announcement via Actions

## 2. Init & Runner

- **Init**: `http://<SERVER_IP>:3002` → installer (SQLite preset) → admin `ai_all_in_one_admin`. ⚠️ **ROOT_URL must be intranet** (`GITEA__server__ROOT_URL=http://<SERVER_IP>:3002/`) or repo links/API html_url are localhost.
- **Actions**: Site Administration → Actions → enabled. Runners → Create → copy token.
- Fill `.env` `GITEA_RUNNER_TOKEN` → **recreate with `up -d`** (⚠️ not `restart` — it won't re-read .env):
  ```
  docker compose -f docker-compose.yml up -d gitea-runner
  docker logs gitea-runner 2>&1 | findstr "Runner registered"
  ```
- ✅ Runners page shows **Idle**.

## 3. Runner pitfalls (gitea-runner-config.yaml)

| Pitfall | Detail |
|---|---|
| `container.network: ai-platform` | must be set via config.yaml (+ `CONFIG_FILE` env) or job containers can't resolve `gitea` |
| docker.sock | auto-mounted by act_runner; **don't mount again** (Duplicate mount point) |
| `force_pull: false` | intranet Docker may not reach Docker Hub; pre-pull `node:20` on host or configure a mirror |
| GitHub network | add `--http1.1 --retry 5` for occasional HTTP/2 drops |

## 4. dsh-sync workflow

- Repo `dsh-sync` (**normal repo**; mirrors are read-only): `.gitea/workflows/sync.yml` + `update_ghost.py` + `version_cmp.py` + `sync-config.json`.
- Triggers: `schedule` (daily UTC 2:00) + `workflow_dispatch` (manual).
- Logic: check GitHub latest tag → compare `version.txt` → **download only if latest > deployed** → update Ghost download page + write version.
- Manual: `POST /api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches` (basic auth) or UI.
- `sync-config.json`: `version_source` (`github` accurate / `official` CN-reachable but lagging), `download_prefix` (ghproxy etc.), `keep_releases` (default 5), `market_url`.
- ⚠️ Only download when newer — the official cache lags; downloading on "different version" would **downgrade** clients.

## 5. Actions syntax

GitHub-compatible; workflow files in `.gitea/workflows/`; events push/pull_request/release/schedule/workflow_dispatch; `runs-on` + optional `container:`; contexts like `${{ gitea.repository }}`.

## 6. Keycloak SSO auto-registration

`[oauth2_client]` envs: `ENABLE_AUTO_REGISTRATION=true`, `ACCOUNT_LINKING=auto`, `USERNAME=preferred_username`. ⚠️ Local admin email must match Keycloak/AD (`@<company-domain>`) or SSO "crosses accounts"/duplicates.

## 7. FAQ

| Issue | Fix |
|---|---|
| `readonly database` | gitea.db created by root; stop, remove root-owned db, `up -d` rebuild |
| repo links are localhost | ROOT_URL |
| Runner absent/bad | token recreated via up -d? `docker logs gitea-runner` |
| job fails before steps | force_pull issue; pre-pull node:20 |
| sync downloads old version | version_cmp guard bypassed? check version_source |
| SSO cross-account | email mismatch; unify |
