# MailHog — Training Outline (M16 · Mail Catcher)

## 1. Positioning

Local mail catcher (Web UI `:8025`, SMTP 1025 internal). When the intranet has no SMTP, it acts as Ghost's "mail exit" to receive login verification-code / notification emails.

## 2. Why it's needed

Ghost 5 admin is **passwordless**: enter email → Ghost sends a 6-digit code email. With no SMTP the mail can't be sent → login fails with `Failed to send email`. Solution: point Ghost mail at local MailHog:

```yaml
# docker-compose.yml ghost service
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025      # no auth
```

## 3. Learning Objectives

- Understand why MailHog is needed for Ghost
- View login codes at `:8025`
- Understand Ghost auto-login via Admin Center (TOTP)

## 4. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../docs/admin-manual/ch26-ops-mailhog.md`; deploy guide §13.10
- Official: github.com/mailhog/MailHog
