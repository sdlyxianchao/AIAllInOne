# Chapter 6: Data Security Policy

*Quick Start*

> What can and what must never be sent to the AI — the red lines everyone must follow.

[← Chapter 5: Requesting an API Key](ch05-key.md) · [📖 Index](index.md) · [Chapter 7: FAQ →](ch07-faq.md)

---

The platform already auto-**redacts** sensitive information such as **phone numbers, ID card numbers, bank card numbers, and emails** (auto-masked before sending to the large model) and blocks sensitive words. But please consciously follow the red lines below.

## 6.1 What Can and Cannot Be Sent

### ❌ Strictly forbidden to send to the AI

- internal confidential / trade secrets (unreleased product code, pricing, customer lists, contract terms);

- personal privacy (ID card numbers, bank card numbers, passwords, health information, others' privacy);

- source code / unreleased technical designs.

### ✅ Safe to use

- public materials, general knowledge, document writing, translation, summarization;

- redacted business data (after removing specific names/numbers/sensitive fields).

## 6.2 Data Classification Quick Reference

| Data level | Can it go to external LLMs | Notes |
| --- | --- | --- |
| public data | ✅ yes | published material, general information |
| internal ordinary data | ⚠️ usable after redaction | usable after removing sensitive fields |
| internal confidential / personal privacy | ❌ forbidden | strictly forbidden to send |

Judgment principle: **"Would it be a problem if outsiders saw this content?"** If yes → don't send it.

## 6.3 Three Typical Scenarios

| Scenario | What to do |
| --- | --- |
| writing a weekly report involving customer names | use "a customer" / "Customer A" instead of the real customer name |
| having the AI analyze a data table | first delete columns like name, phone, ID number, keeping only summarized data |
| translating contract terms | first delete sensitive info like amounts and the counterparty's name, or use "Party A / Party B" instead |

---

[← Chapter 5: Requesting an API Key](ch05-key.md) · [📖 Index](index.md) · [Chapter 7: FAQ →](ch07-faq.md)
