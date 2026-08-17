# Chapter 5: Requesting an API Key

*Quick Start*

> To connect the company's AI capabilities to third-party tools, you need an API Key.

[← Chapter 4: Tool 2: Dify](ch04-dify.md) · [📖 Index](index.md) · [Chapter 6: Data Security Policy →](ch06-security.md)

---

If you want to connect the company's AI capabilities to **third-party tools** (your own scripts, other software supporting the OpenAI interface), you need an API Key (a key starting with `sk-`).

## 5.1 Log In to NewAPI

1. Open `http://IP:3000` in a browser;

2. Log in with the unified account (or click "one-click login / OIDC" to use the domain account).

## 5.2 Create a New Token

1. Left menu "**API Keys / Tokens**";

2. Click "**New token**", name it (e.g. `my-script`), and optionally set quota and expiry;

3. After saving, copy the generated `sk-xxxx` string. **It is shown only once; be sure to save it immediately**.

## 5.3 Fill Into the Client

- **API Base URL**: `http://IP:3000/v1`

- **API Key**: the `sk-xxxx` you just copied

## 5.4 Common Usage Examples

> 💡 Test with curl:
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hello"}]}'`

> ⚠️ When your quota is exhausted you'll see "insufficient balance"; contact the admin to request a raise. The Key is like your account password; **don't share it with others and don't commit it to a code repository**.

> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai

---

[← Chapter 4: Tool 2: Dify](ch04-dify.md) · [📖 Index](index.md) · [Chapter 6: Data Security Policy →](ch06-security.md)
