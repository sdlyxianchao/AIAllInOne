# Ghost — Textbook (M07 · Enterprise Portal)

> Port `8090` (container `ghost`), **SQLite** (`ghost-data` volume), admin at `http://<SERVER_IP>:8090/ghost/`.

## 1. What it is

Node.js publishing platform used as the enterprise portal with the bundled **Corp Portal** theme (professional enterprise style, CN-friendly, responsive).

## 2. Conventions

- Front: `:8090`
- Admin: `:8090/ghost/` (⚠️ note the suffix)
- Admin account: `ai_all_in_one_admin@<domain>` (password ≥10)
- SQLite forced via compose env (prevents stale MySQL config)
- Mail exit: MailHog (SMTP 1025, no auth) → Web UI `:8025`
- Login = email → 6-digit code (TOTP) in MailHog, or Admin Center auto-login

## 3. Procedures

- **Init**: automated `scripts\ghost-setup.ps1` (reads .env) or wizard at `:8090/ghost/`. ⚠️ Don't click "Register" on the homepage `/` — that's **members subscription** via magic link and needs SMTP (500 without it).
- **Theme**: automated `scripts\ghost-theme-setup.ps1` (copy theme in → set active_theme → restart). ⚠️ Don't install the latest official themes from GitHub — main branch already targets Ghost 6.x and fails on 5.x ("not compatible"); the bundled theme is verified for 5.x.
- **Seed**: `scripts\ghost-content-import.ps1 -ServerAddr "<public address>"` — replaces `<SERVER_IP>` placeholders (keep host.docker.internal), creates posts/pages/nav/site settings (idempotent). Result: news-list homepage, nav Home/DSH Desktop/Dify, download page `/dsh/`.
- **Content**: Posts (articles), Pages (fixed content), Navigation (menu), download center edits `/dsh/` with `http://<SERVER_IP>:8091/dsh/...` links.
- **Admin API key**: Integrations → custom integration → key `id:secret` → for Gitea Actions announcements.

## 4. Mail & no-password login

- Ghost 5 admin has no password box: email → 6-digit code email → MailHog `:8025`.
- Admin Center auto-login (`/api/ghost/auto-login`): password login → read `admin_session_secret` + userId → compute TOTP locally (HMAC-SHA1, 6-digit/60s) → `PUT /session/verify` → cookie → redirect; seamless.
- ⚠️ MailHog (or any SMTP) must stay — even when computing the code yourself, Ghost still sends mail or login reports `Failed to send email`.

## 5. FAQ

| Issue | Fix |
|---|---|
| homepage "Register" 500 | that's members magic-link; admins use `/ghost/` |
| ghost container restart-loop MySQL error | SQLite env override (compose already has it); don't delete volume (loses posts/themes) |
| theme not compatible | use bundled Corp Portal (5.x-verified) |
| no code email | check MailHog `:8025`; mailhog container up? |
| `Failed to send email` | SMTP exit broken; check mail__* env + mailhog |
| back to official theme | Appearance → Themes → activate Casper/Source |

## 6. Security

Restrict admin `/ghost/` to intranet; unified admin account; publish per company policy; download center only trusted internal installers.
