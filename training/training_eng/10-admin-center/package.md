# AI Admin Center — Training Package (M11 · Unified Admin Portal)

## Outline

**Positioning**: self-built unified admin portal (port 10086): Keycloak auth, dashboard of all containers & business metrics, left menu aggregating all products, delegated admin authorization, audit/cost reports, backup/restore, unified logs, availability tests, report generation. 90% of daily ops happen here.

**Objectives**: explain difference from 1Panel/Portainer (app-layer unified auth vs Docker management); initialize (Global Admin, OIDC client, ai-platform-admin role); use the menus (dashboard, product stat pages, NewAPI cost/audit, MCP mgmt, centralized auth, admin account mgmt, settings); **delegate per-module admin** (admin:<product> roles + real provisioning) & revoke; use backup/restore, logs, availability, reports; know 9 UI languages & Ghost auto-login.

**Prereq**: M01–M10.

**Content (4 h, D8 AM)**: positioning & architecture + menu map (0.5) → init (0.75) → dashboard & product pages walkthrough (0.75) → delegated admin (0.75) → ops features: backup/logs/availability/report/IM alerts (0.75) → settings/languages/Ghost auto-login + troubleshooting (0.5).

**Pass**: init + "unauthenticated → 302 to Keycloak" verified; add a Ghost-only delegated admin & verify real permissions; do a backup, a restore drill, run availability tests & interpret.

---

## Textbook

Port `10086` (container `admin-portal`); source `../../windows/admin-portal/` (server.js + public/index.html); session in Redis (`admin-session-redis`).

**1. Positioning**: surveyed Organizr/Dashy/Homarr/Heimdall — none met: native Keycloak OIDC, sidebar + iframe embed, real-time Docker status, unified Keycloak admin account management, Global Admin init, all-product entry + auth. Hence self-built.

**2. Initialization**
1. `.env`: `ADMIN_USERNAME=ai_all_in_one_admin`, `ADMIN_PASSWORD`, `ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>`.
2. On start it auto-creates the user (if missing) and assigns `ai-platform-admin` Realm Role.
3. Keycloak: OIDC client `AI-all-in-one-admin-portal` (Client authentication On, Standard flow On, redirect URIs 127.0.0.1 + intranet) → secret → `.env` `KEYCLOAK_CLIENT_SECRET` → `docker compose up -d admin-portal`.
4. Create the same `ai-platform-admin` role in Dify/Ghost/NewAPI for cross-platform admins.
5. ✅ Unauthenticated visit `http://<SERVER_IP>:10086` → 302 to Keycloak (NOT an empty dashboard).

**3. Menu map**
| Menu | Function |
|---|---|
| 📊 Dashboard | 8 product business metrics + Docker services (grouped) + system info; one product failing doesn't break the page |
| 📰 Ghost / 🤖 Dify / 📦 Gitea / 🔐 Keycloak | per-product stat pages + "Open backend" buttons |
| 🔀 NewAPI mgmt | channels/users/tokens + 💰 cost report + 📋 audit log (1 USD = 500000 quota) |
| 🔌 MCP Gateway | endpoints + MCP server CRUD + Skill upload/delete (ai-platform-admin) |
| 🛡️ LiteLLM+PII | copy master key + health + guardrails list |
| ⬇️ Update Server | DeepChat version + installer list |
| 📈 Monitoring / 🔍 Observability | Grafana / Langfuse entries (auto-login) |
| 🔐 Centralized auth / 👥 Admin accounts | unified account notes + delegated authorization (ai-platform-admin) |
| ⚙️ Settings | env var notes + product entry URLs + **9 UI languages** (Arabic RTL) |
| 💾 Backup & restore | list/run/restore (same format as backup.ps1) |
| 📜 Unified logs | Loki query (container + keyword + time) |
| 🩺 Availability | 16 checks, scheduled (default 10 min) + manual |
| 📄 Report | 1/7/30/90-day system report, export .md |
| 🧬 PII | Presidio health + guardrail rules + connected models |
| 🔔 IM alerts | DingTalk/WeCom/Feishu webhooks or app-level, stored in Redis |

**4. Delegated admin (focus)**
Global admin (ai-platform-admin) on "Admin accounts" page:
1. **Add**: search accounts from connected IdPs (AD users — no password needed) → check modules → confirm. System: ① adds `admin:<product>` Realm Role (controls what they see/do in Admin Center); ② **really provisions in the product** (SSO-first, API-fallback): Gitea/NewAPI/Dify/Ghost/Grafana/LiteLLM/Keycloak/Langfuse, non-blocking per failure.
2. **Revoke/delete**: remove `admin:<product>` roles + delete product accounts (SSO products revoke; API products delete). Temporary passwords for non-SSO products are viewable via 🔑 (global admin only).
3. Non-admins get "You are not an admin" and log out.

Provision table (awareness): Gitea SSO auto-reg + admin; NewAPI SSO + role=10; Dify console API invite admin; Ghost Admin API invite staff; Grafana global account + org Admin (SSO); LiteLLM master-key `proxy_admin`; Keycloak `realm-admin` composite (never delete the account); Langfuse direct Postgres membership=ADMIN.

**5. Backup & restore**: page "Backup & restore": list → run → restore (docker.sock + mounted `C:\AIAllInOne\backups`). Same format as backup.ps1 (NewAPI MySQL / Dify PG / Ghost SQLite / Gitea SQLite / configs). ⚠️ Binary safety: Admin Center backup uses base64 + tar-fs/putArchive (docker exec stdout utf8 would corrupt SQLite .db). ⚠️ restore needs `yes` confirm (-Force skips); sync backups/ off-box for DR.

**6. Availability (16 checks)**: scheduled (AVAILABILITY_INTERVAL_MIN) + "Test all" + per-item: Keycloak auth / NewAPI / LiteLLM / DeepChat·Dify chat (real request via NewAPI) / Ghost / Gitea / MCP / Prometheus / Grafana / Langfuse / Loki / Presidio / SSO / Update Server / backup / Docker / Redis. Each card shows result + key logs.

**7. Ghost auto-login (awareness)**: "Open Ghost admin" → `/api/ghost/auto-login`: password login → read `admin_session_secret` + userId → local TOTP (HMAC-SHA1, matches emailed code) → `/session/verify` → cookie → redirect. ⚠️ don't spam (brute rate-limit).

**8. Troubleshooting**
| Issue | Fix |
|---|---|
| empty dashboard + 401s when logged out | homepage must be Keycloak-protected: `express.static(...,{index:false})` + `app.get('/', keycloak.protect())` |
| login lost after restart | sessions are in admin-session-redis; check Redis container |
| Dify stats empty | email must match Dify's real admin email (`ai_all_in_one_admin@<company-domain>`) |
| one product page fails | non-blocking; check its data source (API/sqlite/container) |
| admin can't see a module | missing `admin:<product>` role |
| frontend change not showing | index.html → refresh; server.js → `docker restart admin-portal` |

**9. Dev (optional)**: frontend public/index.html; backend server.js (express/keycloak-connect/dockerode/@keycloak/keycloak-admin-client). Frontend → refresh; backend → restart container.

---

## Training Plan (4 h, D8 AM + afternoon prefix)

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Positioning + menu map | lecture |
| 09:30-10:15 | Lab 1: init (Global Admin + OIDC client + role) | lab |
| 10:15-11:00 | Lab 2: walk every page | lab |
| 11:00-11:45 | Lab 3: delegated admin add/revoke | lab |
| 11:45-12:00 | summary | lecture |
| PM (2 h) | Lab 4: backup + restore drill + availability + logs + report + IM alert | lab |

**Lab checklist**: Global Admin login → dashboard shows 8 metrics + Docker groups (S); unauthenticated → 302 (S); all menu pages open; add Ghost-only admin → sees only Ghost in Admin Center + staff in Ghost (S); revoke → product account cleaned; backup run → backups/ new dir; "Test all" interpreted; log search hit; 7-day report exported; language switch round-trip.

**Homework**: read ch12-admin-center.md → data-source diagram; write an "admin delegation SOP"; read ch27/ch28 → daily/weekly/monthly ops list.

**Failure drills**: client without Standard flow → login no callback; secret not in .env → login fail; provision not effective → check product method.

**Handoff**: backup/health-check used on D9; IM alerts tie M13.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. vs Portainer → B app-layer unified auth; 2. init role → B ai-platform-admin; 3. per-module role naming → B admin:<product>; 4. Keycloak revocation → B revoke role (never delete IdP account); 5. SQLite backup corruption cause → B docker exec stdout utf8 → need base64+tar-fs; 6. availability "DeepChat·Dify chat" → B real request via NewAPI.

**True/False (3×4)**: 7. homepage must be Keycloak-protected. T; 8. index.html edits need container restart. F; 9. non-admin sees "not an admin". T; 10. backups should be mirrored off-box. T.

**Hands-on (50)**: 1. init + 302 verify (15); 2. Ghost-only delegated admin + product verify (20); 3. backup + availability + log query (15).

**Defense (20)**: "Give a new colleague Dify+Ghost access only — how?"; "One product page broken — debug? affects others?"; "Backup/DR approach & restore flow?"
