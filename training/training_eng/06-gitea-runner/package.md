# Gitea + Runner — Training Package (M08 · Source & CI/CD)

## Outline

**Positioning**: internal Git hosting + CI/CD (Actions). Hosts the DSH Desktop source mirror and the `dsh-sync` auto-sync workflow (GitHub → installers → update server → portal), plus build/release pipelines.

**Objectives**: explain role (port 3002 / SSH 2222 / Runner / Actions); init, enable Actions, create & register Runner; understand & troubleshoot `dsh-sync` (schedule + workflow_dispatch, sync-config.json, update_ghost.py); wire Keycloak SSO auto-registration; write simple workflows (.gitea/workflows/*.yml); fix common issues (readonly database, ROOT_URL, runner registration, force_pull).

**Prereq**: M02, M03 (optional SSO part).

**Content (3 h, D6 PM)**: overview (0.5) → init + Actions + Runner (0.75) → dsh-sync deep-dive (0.75) → Actions syntax (0.5) → SSO + troubleshooting (0.5).

**Pass**: init → Runner Idle → trigger sync → read logs; write a push workflow; explain the 4 Runner pitfalls.

---

## Textbook

Ports `3002` (web) / `2222` (Git SSH); containers `gitea`, `gitea-runner` (act_runner, GitHub Actions compatible).

**1. Uses**: source mirror (optional audit/2nd-dev); **dsh-sync** (daily check GitHub for new DSH Desktop → download installers → update Ghost download page — core); build/release; Ghost announcement via Actions.

**2. Init & Runner**
- Init: `http://<SERVER_IP>:3002` → installer (SQLite preset) → admin `ai_all_in_one_admin`. ⚠️ **ROOT_URL must be intranet** (`GITEA__server__ROOT_URL=http://<SERVER_IP>:3002/`) or repo links/API html_url are localhost.
- Actions: Site Administration → Actions → enabled. Runners → Create → copy token.
- Fill `.env` `GITEA_RUNNER_TOKEN` → **recreate with `up -d`** (⚠️ not `restart` — it won't re-read .env):
  ```
  docker compose -f docker-compose.yml up -d gitea-runner
  docker logs gitea-runner 2>&1 | findstr "Runner registered"
  ```
- ✅ Runners page shows **Idle**.

**3. Runner pitfalls (gitea-runner-config.yaml)**
| Pitfall | Detail |
|---|---|
| `container.network: ai-platform` | must be set via config.yaml (+ `CONFIG_FILE` env) or job containers can't resolve `gitea` |
| docker.sock | auto-mounted by act_runner; **don't mount again** (Duplicate mount point) |
| `force_pull: false` | intranet Docker may not reach Docker Hub; pre-pull `node:20` on host or configure a mirror |
| GitHub network | add `--http1.1 --retry 5` for occasional HTTP/2 drops |

**4. dsh-sync workflow**
- Repo `dsh-sync` (**normal repo**; mirrors are read-only): `.gitea/workflows/sync.yml` + `update_ghost.py` + `version_cmp.py` + `sync-config.json`.
- Triggers: `schedule` (daily UTC 2:00) + `workflow_dispatch` (manual).
- Logic: check GitHub latest tag → compare `version.txt` → **download only if latest > deployed** → update Ghost download page + write version.
- Manual: `POST /api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches` (basic auth) or UI.
- `sync-config.json`: `version_source` (`github` accurate / `official` CN-reachable but lagging), `download_prefix` (ghproxy etc.), `keep_releases` (default 5), `market_url`.
- ⚠️ Only download when newer — the official cache lags; downloading on "different version" would **downgrade** clients.

**5. Actions syntax**: GitHub-compatible; workflow files in `.gitea/workflows/`; events push/pull_request/release/schedule/workflow_dispatch; `runs-on` + optional `container:`; contexts like `${{ gitea.repository }}`.

**6. Keycloak SSO auto-registration**: `[oauth2_client]` envs: `ENABLE_AUTO_REGISTRATION=true`, `ACCOUNT_LINKING=auto`, `USERNAME=preferred_username`. ⚠️ Local admin email must match Keycloak/AD (`@<company-domain>`) or SSO "crosses accounts"/duplicates.

**7. FAQ**
| Issue | Fix |
|---|---|
| `readonly database` | gitea.db created by root; stop, remove root-owned db, `up -d` rebuild |
| repo links are localhost | ROOT_URL |
| Runner absent/bad | token recreated via up -d? `docker logs gitea-runner` |
| job fails before steps | force_pull issue; pre-pull node:20 |
| sync downloads old version | version_cmp guard bypassed? check version_source |
| SSO cross-account | email mismatch; unify |

---

## Training Plan (3 h, D6 PM)

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | Overview + Actions concept | lecture |
| 14:30-15:15 | Lab 1: init + enable Actions + Runner + token | lab |
| 15:15-16:00 | Lab 2: manual trigger dsh-sync, read logs/artifacts | lab |
| 16:00-16:30 | Lab 3: write a push workflow and run it | lab |
| 16:30-17:00 | SSO + pitfalls + FAQ | lecture |

**Lab checklist**: Gitea initialized with unified admin (S); ROOT_URL intranet; Actions enabled + Runner Idle (S); sync triggered, version.txt updated; sync-config.json 3 switches explained; `test-ci` repo with demo.yml runs (S); (optional) Keycloak login.

**Homework**: draft a "release → build → upload Update Server" workflow; read ch19-ops-gitea.md → 5 ops points; explain why "only newer" download prevents downgrade.

**Failure drills**: restart instead of up -d → stale token; force_pull on → image pull fail; ROOT_URL localhost → wrong links.

**Handoff**: sync output → Update Server (M12) → Ghost download page (M07) → DSH Desktop update (M09).

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. Token update requires → B up -d; 2. ROOT_URL → B http://<SERVER_IP>:3002/; 3. sync download rule → B only newer; 4. `version_source: official` → A official cache (CN-reachable, lagging); 5. job image pull fix → B force_pull:false + pre-pull; 6. workflow dir → B .gitea/workflows/.

**True/False (3×4)**: 7. sync repo must be normal, not mirror. T; 8. mount docker.sock again in options. F; 9. Gitea admin email must match Keycloak/AD. T; 10. act_runner container.network needs no config. F.

**Hands-on (50)**: 1. register Runner → Idle (20); 2. trigger sync + explain 3 switches (15); 3. write & run push workflow (15).

**Defense (20)**: "How does DSH Desktop sync in from GitHub, and speed up in CN?"; "Runner jobs fail — debug path?"; "A dev team wants CI — where to start?"
