# MailHog — References (learning resources)

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch26 (ops) | `../../docs/admin-manual/ch26-ops-mailhog.md` |
| Deployment Guide §13.10 | `../../windows/windows-deploy-guide-v2.en.html` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| MailHog GitHub (only official source) | https://github.com/mailhog/MailHog |
| MailHog API v2 (optional deep-dive) | https://github.com/mailhog/MailHog/blob/master/docs/APIv2.md |

## Note
MailHog is a tiny tool (Go mail catcher, Web UI :8025 + SMTP :1025) — no dedicated video tutorials. The two things that matter:
1. **Why**: Ghost 5 admin is passwordless; the code email needs an SMTP exit; MailHog plays it on the intranet. Code visible at `http://<IP>:8025`.
2. **Auto-login**: the code is TOTP (HMAC-SHA1(admin_session_secret+userId)); Admin Center computes it locally, no need to read MailHog.

Best learned by doing: trigger a Ghost login → look at :8025 → compare with Admin Center auto-login. Related: RFC 6238 (TOTP), Ghost email config in ghost.org/docs.
