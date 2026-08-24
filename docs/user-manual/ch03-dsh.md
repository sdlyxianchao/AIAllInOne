# Chapter 3: Tool 1: DSH Desktop

*Quick Start*

> Desktop AI chat client: download, configuration, chat, and advanced tips.

[← Chapter 2: AI All In One Hub (Portal)](ch02-hub.md) · [📖 Index](index.md) · [Chapter 4: Tool 2: Dify →](ch04-dify.md)

---

## 3.1 Download and Install

1. Open the portal download center `http://IP:8090/downloads/`;

2. Download the installer for your system and install it;

3. Launch DSH Desktop.

## 3.2 Configure the Model (connect to the company gateway)

On first use you need to tell DSH Desktop where the model is. The company has unified the models into the **NewAPI** gateway; you only need to fill in three values:

**1.** Open DSH Desktop → bottom-left **Settings (⚙️)** → **Model Service / Model Provider**.

**2.** Add a "**custom Provider**" or "**OpenAI-compatible**".

**3.** Fill in the following three items:

| Field | What to fill |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | the `sk-` key requested from NewAPI (see Chapter 5) |
| Model | `deepseek-chat` (company default; other open models are optional) |

**4.** Save.

> ⚠️ **Key**: the API Base URL must use the **intranet IP** (`http://IP:3000/v1`), not `localhost`, otherwise it can't reach the company server.

## 3.3 Start Chatting

1. Click "**+ New chat**";

2. Type in the input box and press Enter to send;

3. Receiving a reply means the chain is working.

> 💡 **Try it**: send "Help me write a polite payment-reminder email to a customer" and see how the AI responds. Then try "Translate the following paragraph into English: ...". DSH Desktop supports multi-turn conversations; you can keep asking follow-ups and have the AI revise.

## 3.4 Common Features and Tips

| Feature | How to use |
| --- | --- |
| multi-model switching | select different models at the top of the chat (if the company has opened several) |
| file read/write / MCP tools | Settings → MCP enable company tools (e.g. filesystem) to let the AI read local files |
| dark/light theme | Settings → Appearance |
| network proxy issues | reports "connection timeout" → Settings → Network/Proxy → change to "No proxy / direct" |

## 3.5 Question-Asking Tips

> ✅ **The more specific the better** — provide context, state requirements clearly, and give examples; the AI's answers will be higher quality.

> 💡 Good example: "You are a senior copywriter; write a 200-word product introduction for CTO readers in a professional, restrained style" — much better than "write an introduction".

- **Give a role**: "You are a financial expert, help me...";

- **Give constraints**: "Keep it under 100 words / use a table / do it in three steps";

- **Give examples**: "Rewrite following this format...";

- **Follow up step by step**: if not satisfied, say "revise it again" or "use a different tone".

> 📖 Vendor docs:DSH Desktop quick start https://www.dshdesktop.com/docs/guide/getting-started/ · open-source repo https://github.com/dataelement/dsh-desktop

---

[← Chapter 2: AI All In One Hub (Portal)](ch02-hub.md) · [📖 Index](index.md) · [Chapter 4: Tool 2: Dify →](ch04-dify.md)
