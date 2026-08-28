# AI Admin Center — Textbook (M11 · Unified Admin Portal)

> Port `10086` (container `admin-portal`); source `../../windows/admin-portal/` (server.js + public/index.html); session in Redis (`admin-session-redis`).

## 1. Positioning

Surveyed Organizr/Dashy/Homarr/Heimdall — none met: native Keycloak OIDC, sidebar + iframe embed, real-time Docker status, unified Keycloak admin account management, Global Admin init, all-product entry + auth. Hence self-built.

## 2. Initialization

1. `.env`: `ADMIN_USERNAME=ai_all_in_one_admin`, `ADMIN_PASSWORD`, `ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>`.
2. On start it auto-creates the user (if missing) and assigns `ai-platform-admin` Realm Role.
3. Keycloak: OIDC client `AI-all-in-one-admin-portal` (Client authentication On, Standard flow On, redirect URIs 127.0.0.1 + intranet) → secret → `.env` `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`.
4. Create the same `ai-platform-admin` role in Dify/Ghost/NewAPI for cross-platform admins.
5. ✅ Unauthenticated visit `http://<SERVER_IP>:10086` → 302 to Keycloak (NOT an empty dashboard).

## 3. Menu map

The sidebar is organized into four groups: **Application Services (apps)**, **Platform Infrastructure (infra)**, **Operations & Monitoring (ops)**, **System Management (admin)**.

| Menu | Function |
|---|---|
| 📊 Dashboard | 8 product business metrics + Docker services (grouped) + system info; one product failing doesn't break the page |
| 📰 Ghost / 🤖 Dify / 📦 Gitea / 🔐 Keycloak | per-product stat pages + "Open backend" buttons |
| 🔀 NewAPI mgmt | channels/users/tokens + 💰 cost report + 📋 audit log (1 USD = 500000 quota) |
| 🔌 MCP Gateway | endpoints + MCP server CRUD + Skill upload/delete (ai-platform-admin) |
| 🛡️ LiteLLM+PII | copy master key + health + guardrails list |
| ⬇️ Update Server | DSH Desktop version + installer list |
| 📈 Monitoring & IM Alerts / 🔍 Observability | Grafana / Langfuse entries (auto-login) + DingTalk/WeCom/Feishu webhooks or app-level (stored in Redis) |
| 🔐 Centralized auth / 👥 Admin accounts | unified account notes + delegated authorization (ai-platform-admin) |
| ⚙️ Settings | env var notes + product entry URLs + **9 UI languages** (Arabic RTL) |
| 💾 Backup & restore | list/run/restore (same format as backup.ps1) |
| 📜 Unified logs | Loki query (container + keyword + time) |
| 🩺 Availability | 16 checks, scheduled (default 10 min) + manual |
| 📄 Report | 1/7/30/90-day system report, export .md |
| 🖥️ Desktop Client Management | DSH Desktop version + installer list (renamed from "Client Software Sync") |

## 4. Delegated admin (focus)

Global admin (ai-platform-admin) on "Admin accounts" page:

1. **Add**: search accounts from connected IdPs (AD users — no password needed) → check modules → confirm. System: ① adds `admin:<product>` Realm Role (controls what they see/do in Admin Center); ② **really provisions in the product** (SSO-first, API-fallback): Gitea/NewAPI/Dify/Ghost/Grafana/LiteLLM/Keycloak/Langfuse, non-blocking per failure.
2. **Revoke/delete**: remove `admin:<product>` roles + delete product accounts (SSO products revoke; API products delete). Temporary passwords for non-SSO products are viewable via 🔑 (global admin only).
3. Non-admins get "You are not an admin" and log out.

**Provision table** (awareness): Gitea SSO auto-reg + admin; NewAPI SSO + role=10; Dify console API invite admin; Ghost Admin API invite staff; Grafana global account + org Admin (SSO); LiteLLM master-key `proxy_admin`; Keycloak `realm-admin` composite (never delete the account); Langfuse direct Postgres membership=ADMIN.

## 5. Backup & restore

Page "Backup & restore": list → run → restore (docker.sock + mounted `C:\AIAllInOne\backups`). Same format as backup.ps1 (NewAPI MySQL / Dify PG / Ghost SQLite / Gitea SQLite / configs). ⚠️ Binary safety: Admin Center backup uses base64 + tar-fs/putArchive (docker exec stdout utf8 would corrupt SQLite .db). ⚠️ Restore needs `yes` confirm (-Force skips); sync backups/ off-box for DR.

## 6. Availability (16 checks)

Scheduled (AVAILABILITY_INTERVAL_MIN) + "Test all" + per-item: Keycloak auth / NewAPI / LiteLLM / DSH Desktop·Dify chat (real request via NewAPI) / Ghost / Gitea / MCP / Prometheus / Grafana / Langfuse / Loki / Presidio / SSO / Update Server / backup / Docker / Redis. Each card shows result + key logs.

## 7. Ghost auto-login (awareness)

"Open Ghost admin" → `/api/ghost/auto-login`: password login → read `admin_session_secret` + userId → local TOTP (HMAC-SHA1, matches emailed code) → `/session/verify` → cookie → redirect. ⚠️ Don't spam (brute rate-limit).

## 8. Troubleshooting

| Issue | Fix |
|---|---|
| empty dashboard + 401s when logged out | homepage must be Keycloak-protected: `express.static(...,{index:false})` + `app.get('/', keycloak.protect())` |
| login lost after restart | sessions are in admin-session-redis; check Redis container |
| Dify stats empty | email must match Dify's real admin email (`ai_all_in_one_admin@<company-domain>`) |
| one product page fails | non-blocking; check its data source (API/sqlite/container) |
| admin can't see a module | missing `admin:<product>` role |
| frontend change not showing | index.html → refresh; server.js → `docker restart admin-portal` |

## 9. Dev (optional)

Frontend public/index.html; backend server.js (express/keycloak-connect/dockerode/@keycloak/keycloak-admin-client). Frontend → refresh; backend → restart container.
