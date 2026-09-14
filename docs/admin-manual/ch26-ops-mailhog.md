# Chapter 26: MailHog Mail Catcher

*Part 2 · Administration*

> The "mail exit" when the intranet has no SMTP, catching Ghost verification codes / notification emails.

[← Chapter 25: PII Redaction (Presidio)](ch25-ops-pii.md) · [📖 Index](index.md) · [Chapter 27: Backup and Restore →](ch27-backup.md)

---

**Entry**: `http://<server-IP>:8025` (web inbox; SMTP 1025 is internal only).

## 26.1 Why It Is Needed

The Ghost 5 backend uses passwordless login: after entering the email, Ghost sends a mail with a 6-digit code. Without SMTP on the intranet the mail can't be sent and login reports `Failed to send email`. MailHog acts as the "mail exit" to catch these mails.

## 26.2 Ghost-Side Configuration

```
# Ghost environment variables in docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 View Mails

1. Open `http://<server-IP>:8025` in a browser;

2. In the inbox you can see the verification code/notification emails sent by Ghost.

## 26.4 Ghost Passwordless Login (AI Admin Center auto-login)

Ghost's 6-digit code is essentially **TOTP** (`TOTP(admin_session_secret + userId)`, 6 digits / 60 seconds / HMAC-SHA1). The AI Admin Center can compute the code locally; clicking "Ghost backend → Open" completes it automatically: password login → compute code locally → verify session → write cookie → enter backend, all seamless with no need to check MailHog.

> ⚠️ Even if you compute the code yourself, Ghost still really sends the email, so MailHog must be kept, otherwise login reports `Failed to send email`.

> 📖 Vendor docs:MailHog source repo https://github.com/mailhog/MailHog

---

[← Chapter 25: PII Redaction (Presidio)](ch25-ops-pii.md) · [📖 Index](index.md) · [Chapter 27: Backup and Restore →](ch27-backup.md)
