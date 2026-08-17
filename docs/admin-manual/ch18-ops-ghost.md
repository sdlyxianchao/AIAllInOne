# Chapter 18: Ghost Day-to-Day Administration

*Part 2 · Administration*

> Enterprise portal / Hub: posts, pages, navigation, themes, members.

[← Chapter 17: Dify Day-to-Day Administration](ch17-ops-dify.md) · [📖 Index](index.md) · [Chapter 19: Gitea Day-to-Day Administration →](ch19-ops-gitea.md)

---

**Entry**: frontend `http://<server-IP>:8090`; backend `http://<server-IP>:8090/ghost/` (note the /ghost/ suffix).

## 18.1 Log In to the Backend

The Ghost 5 backend uses **passwordless login**: enter your email → Ghost sends a 6-digit code to MailHog (`:8025`). A faster way: in the AI Admin Center, click the "Open" button for "Ghost backend" to complete login automatically (the TOTP code is computed locally, no need to check email).

## 18.2 Publish Content

1. **Post**: Posts → New post → write content (Markdown editor) → Publish;

2. **Page**: Pages → New page (e.g. "Downloads" slug `downloads`);

3. **Tags/categories**: Tags → create categories (e.g. `news` / `docs`), assign posts to categories.

## 18.3 Navigation Menu

1. Backend → Design → Navigation;

2. Edit the "Primary" navigation, add Home/News/Downloads/AI Workbench/Help Docs (see the menu table in Chapter 9).

## 18.4 Themes

- **Switch**: Design → Themes, activate the bundled Casper / Source directly;

- **Install**: the theme marketplace (Design → Change theme) or upload a zip.

> ⚠️ Don't install the latest theme from GitHub (it may target Ghost 6.x and report incompatible on 5.x); install an older-version zip instead.

## 18.5 Members and Subscriptions (if needed)

- Members: manage subscribers;

- If subscriptions are not needed, this module can be ignored (intranet portals usually don't need it).

## 18.6 Integrations (API Token)

1. Backend → Settings → Integrations → add a custom integration;

2. Generate an Admin API Key (format `id:secret`) for automation such as Gitea Actions posting announcements.

> ⚠️ Key pitfalls: ① don't click "Sign up" on the home page `/` (that's visitor/subscriber registration); ② the 6-digit code is essentially TOTP, which the AI Admin Center can compute locally; ③ even with local computation, Ghost still really sends the email, so MailHog must be kept (otherwise `Failed to send email`).

> 📖 Vendor docs:Ghost official docs https://ghost.org/docs/ · admin backend https://ghost.org/docs/admin/

---

[← Chapter 17: Dify Day-to-Day Administration](ch17-ops-dify.md) · [📖 Index](index.md) · [Chapter 19: Gitea Day-to-Day Administration →](ch19-ops-gitea.md)
