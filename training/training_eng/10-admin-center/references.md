# AI Admin Center — References (learning resources)

> The Admin Center is a **self-built component** (not a third-party OSS product) — no external official docs; resources are the project docs and source.

## Local (authoritative — read first)
| Doc | Location |
|---|---|
| Admin Manual ch12 | `../../docs/admin-manual/ch12-admin-center.md` |
| Admin Manual ch27 (backup) | `../../docs/admin-manual/ch27-backup.md` |
| Admin Manual ch28 (health check) | `../../docs/admin-manual/ch28-healthcheck.md` |
| Deployment Guide §11–§13 | `../../windows/windows-deploy-guide-v2.en.html` |
| Frontend source | `../../windows/admin-portal/public/index.html` |
| Backend source | `../../windows/admin-portal/server.js` |
| Backup/restore scripts | `../../windows/scripts/backup.ps1`, `restore.ps1` |
| Health-check script | `../../windows/scripts/health-check.ps1` |
| Training package | `package.md` |

## Underlying tech (learn on demand)
| Tech | Docs | Role here |
|---|---|---|
| Keycloak Admin REST API | https://www.keycloak.org/docs-api/latest/rest-api/ | users/roles mgmt |
| dockerode | https://github.com/apocas/dockerode | container status / backup |
| express | https://expressjs.com/ | backend framework |
| LogQL | https://grafana.com/docs/loki/latest/logql/ | unified log queries |

## Self-study path
1. `package.md` → menu map, init, delegated admin; 2. labs (init → pages → add/revoke delegated admin → backup → availability → report); 3. source reading: `index.html` (page requests) → `server.js` (`/api/*`, esp. `/api/ghost/auto-login` & `/api/backup/*`); 4. pitfalls in deploy guide §11.5 (homepage protection / Redis session / Dify email match); 5. dev: frontend → refresh; backend → `docker restart admin-portal`.
