# Chapter 25: PII Redaction (Presidio)

*Part 2 · Administration*

> Sensitive information is automatically redacted before leaving the intranet.

[← Chapter 24: Unified Logging (Loki)](ch24-ops-loki.md) · [📖 Index](index.md) · [Chapter 26: MailHog Mail Catcher →](ch26-ops-mailhog.md)

---

## 25.1 Two Layers of Redaction

| Layer | Capability |
| --- | --- |
| LiteLLM built-in regex (`litellm_content_filter`) | phone numbers, ID numbers, bank cards, emails, unified social credit codes, passports, IPv4, etc.; replaced with `[xxx_REDACTED]` on match; sensitive-word blacklist hits are BLOCKed/rejected |
| Microsoft Presidio | finer-grained entities (English names, emails, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 Built-in Regex Rules

| Rule | Regex | Type |
| --- | --- | --- |
| China mobile number | `\b1[3-9]\d{9}\b` | cn_mobile |
| ID card number | `\b\d{17}[\dXx]\b` | cn_id |
| bank card number | `\b\d{16,19}\b` | bank_card |
| email | prebuilt `email` | email |
| unified social credit code | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| passport number | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

The sensitive-word blacklist in `blocked_words` in `litellm-config.yaml` is added/removed according to the company's actual situation (`internal-confidential`, `trade-secret`, etc.).

## 25.3 Enable Presidio (currently commented out)

The new LiteLLM guardrail API changed, so the Presidio section is currently commented out. Key points for enabling:

- add `default_on: true` to guardrails for global effect;

- The endpoint environment variables `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` must be base URLs (LiteLLM auto-appends `/analyze`, `/anonymize`; including a path becomes `/analyze/analyze` 404).

> ⚠️ The image is about 965MB and very slow to pull in mainland China (about 1 hour in practice); if it can't be pulled, use the built-in regex first (already covers the core Chinese PII).

## 25.4 Verify

Send a request containing a phone number/email → the original value is replaced with `[REDACTED]` in the model reply; send a request containing "internal confidential" → it returns `Content blocked` directly.

> 📖 Vendor docs:Microsoft Presidio https://microsoft.github.io/presidio/ · source https://github.com/microsoft/presidio

---

[← Chapter 24: Unified Logging (Loki)](ch24-ops-loki.md) · [📖 Index](index.md) · [Chapter 26: MailHog Mail Catcher →](ch26-ops-mailhog.md)
