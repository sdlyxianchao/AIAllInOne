# MailHog — Textbook (M16 · Mail Catcher)

## 1. Viewing mail

Browser `http://<SERVER_IP>:8025` → all Ghost emails incl. the 6-digit code.

## 2. Ghost auto-login (Admin Center)

The code is actually **TOTP**: `TOTP(admin_session_secret + userId)`, 6 digits / 60 s / HMAC-SHA1. Admin Center's "Open Ghost admin" computes it locally and completes session verification — **no need to read MailHog**.

## 3. FAQ

| Issue | Fix |
|---|---|
| login `Failed to send email` | check mail__* config & mailhog container |
| no code email | check :8025; SMTP → mailhog:1025? |
| replace MailHog | use a real SMTP (corporate) via mail__options__* |
