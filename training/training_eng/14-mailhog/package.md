# MailHog — Training Package (M16 · Mail Catcher)

## Outline & Textbook

**Positioning**: local mail catcher (Web UI `:8025`, SMTP 1025 internal). When the intranet has no SMTP, it acts as Ghost's "mail exit" to receive login verification-code / notification emails.

**Why it's needed**: Ghost 5 admin is **passwordless**: enter email → Ghost sends a 6-digit code email. With no SMTP the mail can't be sent → login fails with `Failed to send email`. Solution: point Ghost mail at local MailHog:

```
# docker-compose.yml ghost service
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025      # no auth
```

**Viewing mail**: browser `http://<SERVER_IP>:8025` → all Ghost emails incl. the 6-digit code.

**Ghost auto-login (Admin Center)**: the code is actually **TOTP**: `TOTP(admin_session_secret + userId)`, 6 digits / 60 s / HMAC-SHA1. Admin Center's "Open Ghost admin" computes it locally and completes session verification — **no need to read MailHog**.

**FAQ**:
| Issue | Fix |
|---|---|
| login `Failed to send email` | check mail__* config & mailhog container |
| no code email | check :8025; SMTP → mailhog:1025? |
| replace MailHog | use a real SMTP (corporate) via mail__options__* |

**Platform docs**: `../../docs/admin-manual/ch26-ops-mailhog.md`; deploy guide §13.10. **Official**: github.com/mailhog/MailHog.

## Training Plan (0.5 h, D8 PM interleaved)

**Lab checklist**: open :8025 and see a Ghost code email; use Admin Center auto-login into Ghost admin (compare with manual code entry).

## Exam (merged into M07 Ghost)

One additional question: "Where is the Ghost login code? How does Admin Center log in without it?" (MailHog :8025 / local TOTP + session verify).

## References
MailHog GitHub (only official source); TOTP RFC 6238 for the mechanism; Ghost email config in ghost.org/docs.
