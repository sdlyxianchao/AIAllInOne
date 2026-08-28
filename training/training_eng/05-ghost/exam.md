# Ghost — Exam (M07)

> Theory 10 Q/30 + Hands-on 50 + Defense 20; ≥70 to pass.

## 1. Theory (30 pts)

### Single choice (3 pts × 6)

1. Admin entry → B :8090/ghost/
2. DB → C SQLite
3. homepage Register 500 → B members magic-link needs SMTP
4. 6-digit code is → B TOTP(HMAC-SHA1(secret+userId))
5. where to view code → B MailHog :8025
6. seed script param → A -ServerAddr

### True/False (3 pts × 4)

7. MailHog must stay even with local TOTP. **T**
8. Install latest official themes from GitHub. **F**
9. Delete ghost-data volume to fix MySQL error. **F**
10. Admin email must match Keycloak/AD global admin. **T**

## 2. Hands-on (50 pts)

| # | Item | Points |
|---|---|---|
| 1 | Init + theme + seed | 20 |
| 2 | Publish post with media visible | 15 |
| 3 | Admin API key + auto-login | 15 |

## 3. Defense (20 pts)

1. "How do employees find & download DSH Desktop?"
2. "Why no password login? Where's the code?"
3. "Company-wide announcement workflow?"
