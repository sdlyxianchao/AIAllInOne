# Ghost — Training Package (M07 · Enterprise Portal)

## Outline

**Positioning**: the enterprise portal/news site (the "AI All In One Hub"): announcements, platform guides, DeepChat download center, product entry navigation. Employees see the portal first every day.

**Objectives**: explain role (port 8090, SQLite, Corp Portal theme); init (setup wizard / ghost-setup.ps1), install/activate theme, import content seed; publish posts/pages, manage nav & site settings; configure mail exit (MailHog) & understand the no-password login + Admin Center auto-login; create Admin API key (for Gitea announcements); troubleshoot (`/ghost/` entry, members 500, theme incompatibility, code login).

**Prereq**: M02. Basic HTML.

**Content (3 h, D6 AM)**: overview (0.5) → init + theme + seed (0.75) → content management (0.75) → mail & login (0.5) → troubleshooting (0.5).

**Pass**: full "init → theme → seed → publish" flow; answer portal/download questions; explain Ghost 5 passwordless login & MailHog.

---

## Textbook

Port `8090` (container `ghost`), **SQLite** (`ghost-data` volume), admin at `http://<SERVER_IP>:8090/ghost/`.

**1. What it is**: Node.js publishing platform used as the enterprise portal with the bundled **Corp Portal** theme (professional enterprise style, CN-friendly, responsive).

**2. Conventions**: front `:8090`; admin `:8090/ghost/` (⚠️ note the suffix); admin `ai_all_in_one_admin@<domain>` (password ≥10); SQLite forced via compose env (prevents stale MySQL config); mail exit MailHog (SMTP 1025, no auth) → Web UI `:8025`; login = email → 6-digit code (TOTP) in MailHog, or Admin Center auto-login.

**3. Procedures**
- Init: automated `scripts\ghost-setup.ps1` (reads .env) or wizard at `:8090/ghost/`. ⚠️ Don't click "Register" on the homepage `/` — that's **members subscription** via magic link and needs SMTP (500 without it).
- Theme: automated `scripts\ghost-theme-setup.ps1` (copy theme in → set active_theme → restart). ⚠️ Don't install the latest official themes from GitHub — main branch already targets Ghost 6.x and fails on 5.x ("not compatible"); the bundled theme is verified for 5.x.
- Seed: `scripts\ghost-content-import.ps1 -ServerAddr "<public address>"` — replaces `<SERVER_IP>` placeholders (keep host.docker.internal), creates posts/pages/nav/site settings (idempotent). Result: news-list homepage, nav Home/DeepChat/Dify, download page `/deepchat/`.
- Content: Posts (articles), Pages (fixed content), Navigation (menu), download center edits `/deepchat/` with `http://<SERVER_IP>:8091/deepchat/...` links.
- Admin API key: Integrations → custom integration → key `id:secret` → for Gitea Actions announcements.

**4. Mail & no-password login**
- Ghost 5 admin has no password box: email → 6-digit code email → MailHog `:8025`.
- Admin Center auto-login (`/api/ghost/auto-login`): password login → read `admin_session_secret` + userId → compute TOTP locally (HMAC-SHA1, 6-digit/60s) → `PUT /session/verify` → cookie → redirect; seamless.
- ⚠️ MailHog (or any SMTP) must stay — even when computing the code yourself, Ghost still sends mail or login reports `Failed to send email`.

**5. FAQ**
| Issue | Fix |
|---|---|
| homepage "Register" 500 | that's members magic-link; admins use `/ghost/` |
| ghost container restart-loop MySQL error | SQLite env override (compose already has it); don't delete volume (loses posts/themes) |
| theme not compatible | use bundled Corp Portal (5.x-verified) |
| no code email | check MailHog `:8025`; mailhog container up? |
| `Failed to send email` | SMTP exit broken; check mail__* env + mailhog |
| back to official theme | Appearance → Themes → activate Casper/Source |

**6. Security**: restrict admin `/ghost/` to intranet; unified admin account; publish per company policy; download center only trusted internal installers.

---

## Training Plan (3 h, D6 AM)

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + conventions + passwordless login | lecture |
| 09:30-10:15 | Lab 1: init + Corp Portal theme + content seed | lab |
| 10:15-11:00 | Lab 2: publish an announcement + edit nav + check download page | lab |
| 11:00-11:30 | Lab 3: Admin API key + MailHog code + Admin Center auto-login | lab |
| 11:30-12:00 | FAQ + failure drills | lecture |

**Lab checklist**: init via ghost-setup.ps1 or wizard (S); Corp Portal active — homepage changes (S); seed imported — nav Home/DeepChat/Dify, `/deepchat/` reachable; announcement published & visible; nav edited; Admin API key created; code email seen in MailHog; Admin Center auto-login enters Ghost admin (S).

**Homework**: publish a "AI platform usage guide" post; read ch18-ops-ghost.md → 5 ops points; draw the user-navigation diagram portal→products.

**Failure drills**: homepage Register → 500 (guide to /ghost/); incompatible theme error; no code → check MailHog.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. Admin entry → B :8090/ghost/; 2. DB → C SQLite; 3. homepage Register 500 → B members magic-link needs SMTP; 4. 6-digit code is → B TOTP(HMAC-SHA1(secret+userId)); 5. where to view code → B MailHog :8025; 6. seed script param → A -ServerAddr.

**True/False (3×4)**: 7. MailHog must stay even with local TOTP. T; 8. Install latest official themes from GitHub. F; 9. Delete ghost-data volume to fix MySQL error. F; 10. Admin email must match Keycloak/AD global admin. T.

**Hands-on (50)**: 1. init + theme + seed (20); 2. publish post with media visible (15); 3. Admin API key + auto-login (15).

**Defense (20)**: "How do employees find & download DeepChat?"; "Why no password login? Where's the code?"; "Company-wide announcement workflow?"
