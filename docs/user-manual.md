# AI AllInOne User Manual

*v0.2 · Employee Usage Guide*

**Quick Start**

## 1. Getting to Know the Platform

> 📌 Note: in this manual, `IP` refers to the company intranet server address (example `192.168.31.117`, subject to the address published by the admin). All addresses use the **intranet IP**, not `localhost` or `127.0.0.1`.
### 1.1 What the Platform Is
"AI AllInOne" is an enterprise AI platform deployed on the company intranet, bringing the capabilities of large models (DeepSeek, GPT, Claude, etc.) together on the intranet; employees can use it with **a single account**. You don't need to care about the servers, models, or keys behind it — just remember the three entry points.
### 1.2 What I Can Do with the Platform
| What you want to do | Which to use | Where to open |
| --- | --- | --- |
| Daily chat, writing documents, translation, editing code like ChatGPT | 💬 DeepChat | desktop client (download and install from the portal first) |
| Use company-built AI apps (customer service Q&A, approval assistant, etc.) | 🤖 Dify | browser `http://IP` |
| Upload documents for "knowledge base Q&A" (ask about internal material) | 🤖 Dify | browser `http://IP` |
| Read company news and announcements, download software | 📰 Portal (Hub) | browser `http://IP:8090` |
| Apply for your own API Key to connect third-party tools | 🔑 NewAPI | browser `http://IP:3000` |
### 1.3 How to Choose Among the Three Entry Points
> ✅ **Remember in one sentence**: **chat/writing/translation → DeepChat**; **company-built apps/knowledge base → Dify**; **find things / read announcements / download software → the Hub portal**. All three use the same account to log in.
Login: all products use the **Keycloak unified account** (some also support the company AD domain account, i.e. the account you use to log in to your computer). Click "Log in" to be redirected to the unified login page; enter the account once and you won't need to log in again for each product.
### 1.4 How to Use This Manual
- **Beginners**: read Chapters 2~4 in order, install DeepChat first and start using it;
- **Want to connect third-party tools**: read Chapter 5 to request a Key;
- **Have questions**: check the FAQ in Chapter 7 first, then ask the admin;
- **Must-read**: Chapter 6 Data Security and Chapter 8 Code of Conduct — everyone must follow them.

## 2. AI All In One Hub (Portal)

### 2.1 What the Portal Is
Ghost**AI All In One Hub** is the company's enterprise portal (built on the open-source software Ghost), at `http://IP:8090`. It is the **starting point** into the AI platform.
### 2.2 Read News / Announcements
1. Open `http://IP:8090` in a browser;
2. The home page is the latest news/announcement list; click a title to read the full text.
### 2.3 Download Center (install DeepChat)
1. Click the "**Download center**" menu at the top of the portal, or open `http://IP:8090/downloads/` directly;
2. Choose the **Windows** / **macOS** installer for your system, and download **DeepChat**;
3. Install: on Windows double-click the .exe and follow the wizard; on macOS open the .dmg and drag it into "Applications".
> ✅ The "Install Skill Butler on first use" item at the top of the download page is a skill package for advanced users; regular users can ignore it.
### 2.4 Jump to Dify / Help
- Click the "**AI Workbench**" portal menu → jumps directly to Dify (the AI app platform);
- Click "**Help docs**" → view the help articles compiled by the company.
> 📖 Vendor docs:the portal is powered by Ghost, official docs https://ghost.org/docs/

## 3. Tool 1: DeepChat

### 3.1 Download and Install
1. Open the portal download center `http://IP:8090/downloads/`;
2. Download the installer for your system and install it;
3. Launch DeepChat.
### 3.2 Configure the Model (connect to the company gateway)
On first use you need to tell DeepChat where the model is. The company has unified the models into the **NewAPI** gateway; you only need to fill in three values:
1Open DeepChat → bottom-left **Settings (⚙️)** → **Model Service / Model Provider**.
2Add a "**custom Provider**" or "**OpenAI-compatible**".
3Fill in the following three items:
| Field | What to fill |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | the `sk-` key requested from NewAPI (see Chapter 5) |
| Model | `deepseek-chat` (company default; other open models are optional) |
4Save.
> ⚠️ **Key**: the API Base URL must use the **intranet IP** (`http://IP:3000/v1`), not `localhost`, otherwise it can't reach the company server.
### 3.3 Start Chatting
1. Click "**+ New chat**";
2. Type in the input box and press Enter to send;
3. Receiving a reply means the chain is working.
### 💡 **Try it**: send "Help me write a polite payment-reminder email to a customer" and see how the AI responds. Then try "Translate the following paragraph into English: ...". DeepChat supports multi-turn conversations; you can keep asking follow-ups and have the AI revise.

    3.4 Common Features and Tips
| Feature | How to use |
| --- | --- |
| multi-model switching | select different models at the top of the chat (if the company has opened several) |
| file read/write / MCP tools | Settings → MCP enable company tools (e.g. filesystem) to let the AI read local files |
| dark/light theme | Settings → Appearance |
| network proxy issues | reports "connection timeout" → Settings → Network/Proxy → change to "No proxy / direct" |
### 3.5 Question-Asking Tips
> ✅ **The more specific the better** — provide context, state requirements clearly, and give examples; the AI's answers will be higher quality.
- 💡 Good example: "You are a senior copywriter; write a 200-word product introduction for CTO readers in a professional, restrained style" — much better than "write an introduction".
    
      **Give a role**: "You are a financial expert, help me...";
- **Give constraints**: "Keep it under 100 words / use a table / do it in three steps";
- **Give examples**: "Rewrite following this format...";
- **Follow up step by step**: if not satisfied, say "revise it again" or "use a different tone".
> 📖 Vendor docs:DeepChat quick start https://deepchatai.cn/docs/guide/getting-started/ · open-source repo https://github.com/ThinkInAIXYZ/deepchat

## 4. Tool 2: Dify

### 4.1 Log In to Dify
1. Open `http://IP` in a browser (port 80, no port number; you can also click in via the portal's "AI Workbench");
2. Log in with the unified account (first time may require the admin to create the account first).
### 4.2 Use Ready-Made Chat Apps
Admins pre-build some apps (e.g. "company policy Q&A", "customer service assistant"); regular users just "use" them:
1. After login, enter the "**Studio / Apps**" list;
2. Find the app you want, click "**Run / Preview**" (the play button in the top-right);
3. Ask questions directly on the opened chat page.
### 4.3 Knowledge Base Q&A
To "feed" internal documents to the AI so it can answer, use Dify's **knowledge base** (requires admin permission):
1. "**Knowledge Base**" → "Create knowledge base";
2. Upload documents (supports Word / PDF / Markdown / web links, etc.);
3. The system automatically segments and indexes;
4. "Reference" this knowledge base in an app and the AI can answer based on your documents.
> 📌 Knowledge base content will be used by the AI to answer; follow the Chapter 6 data security policy — **do not upload confidential material**.
### 4.4 Build a Simple App Yourself (advanced)
1. Studio → create blank app → select "chat assistant";
2. Write a "prompt" telling the AI its role (e.g. "you are the company attendance-policy Q&A assistant");
3. add a knowledge base → select the model → preview/test → publish.
> 📖 Vendor docs:Dify official docs https://docs.dify.ai

## 5. Requesting an API Key

If you want to connect the company's AI capabilities to **third-party tools** (your own scripts, other software supporting the OpenAI interface), you need an API Key (a key starting with `sk-`).
### 5.1 Log In to NewAPI
1. Open `http://IP:3000` in a browser;
2. Log in with the unified account (or click "one-click login / OIDC" to use the domain account).
### 5.2 Create a New Token
1. Left menu "**API Keys / Tokens**";
2. Click "**New token**", name it (e.g. `my-script`), and optionally set quota and expiry;
3. After saving, copy the generated `sk-xxxx` string. **It is shown only once; be sure to save it immediately**.
### 5.3 Fill Into the Client
- **API Base URL**: `http://IP:3000/v1`
- **API Key**: the `sk-xxxx` you just copied
### 5.4 Common Usage Examples
> 💡 Test with curl:  
> 
>     `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hello"}]}'`
> 
>     ⚠️ When your quota is exhausted you'll see "insufficient balance"; contact the admin to request a raise. The Key is like your account password; **don't share it with others and don't commit it to a code repository**.
> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai

## 6. Data Security Policy

The platform already auto-**redacts** sensitive information such as **phone numbers, ID card numbers, bank card numbers, and emails** (auto-masked before sending to the large model) and blocks sensitive words. But please consciously follow the red lines below.
### 6.1 What Can and Cannot Be Sent
#### ❌ Strictly forbidden to send to the AI
- internal confidential / trade secrets (unreleased product code, pricing, customer lists, contract terms);
- personal privacy (ID card numbers, bank card numbers, passwords, health information, others' privacy);
- source code / unreleased technical designs.
#### ✅ Safe to use
- public materials, general knowledge, document writing, translation, summarization;
- redacted business data (after removing specific names/numbers/sensitive fields).
### 6.2 Data Classification Quick Reference
| Data level | Can it go to external LLMs | Notes |
| --- | --- | --- |
| public data | ✅ yes | published material, general information |
| internal ordinary data | ⚠️ usable after redaction | usable after removing sensitive fields |
| internal confidential / personal privacy | ❌ forbidden | strictly forbidden to send |
> > Judgment principle: **"Would it be a problem if outsiders saw this content?"** If yes → don't send it.
### 6.3 Three Typical Scenarios
| Scenario | What to do |
| --- | --- |
| writing a weekly report involving customer names | use "a customer" / "Customer A" instead of the real customer name |
| having the AI analyze a data table | first delete columns like name, phone, ID number, keeping only summarized data |
| translating contract terms | first delete sensitive info like amounts and the counterparty's name, or use "Party A / Party B" instead |

## 7. FAQ

### 7.1 Login / Access
| Problem | Solution |
| --- | --- |
| Can't log in to a product? | make sure you're using the intranet IP (not localhost) and the unified account; if it still fails, contact the admin |
| Login page won't open / keeps spinning? | make sure you're on the company intranet (WiFi/wired) and the address uses `http://IP`, not localhost |
| Forgot the unified account password? | contact the admin to reset (or recover via the domain account) |
### 7.2 Usage
| Problem | Solution |
| --- | --- |
| "Insufficient quota" prompt? | check balance in the NewAPI admin; contact the admin to top up / raise when exhausted |
| Content blocked on send? | hit a sensitive word or contains sensitive info; adjust per Chapter 6 rules and retry |
| DeepChat reports connection timeout? | Settings → Network/Proxy → change to "No proxy / direct" |
| Model reply quality is poor? | switch models, or improve the question (provide context, clarify requirements, give examples) |
| Forgot where to download DeepChat? | the portal download center `http://IP:8090/downloads/` |
| Dify keeps spinning when creating apps? | usually a network/WebSocket issue; contact the admin; hard-refresh with Ctrl+F5 |
### 7.3 Awareness
| Problem | Solution |
| --- | --- |
| Can I trust the AI's answers? | not fully. The AI can be wrong (hallucination); always manually verify important facts, numbers, and code |
| Will the AI remember what I say? | the current conversation context is kept for multi-turn responses; do not enter confidential information (see Chapter 6) |

## 8. Code of Conduct

### 8.1 Usage Rules
- Do not use it for illegal or non-compliant purposes, and do not generate illegal, harmful, or infringing content;
- Do not bypass the platform's security restrictions or batch-farm quota;
- When sending AI-generated content externally, verify the facts and follow the company's information-publishing rules;
- Keep your API Key safe; don't lend it to others or commit it to a code repository;
- Report anomalies promptly to the admin (account anomalies, content anomalies).
### 8.2 One-Sentence Summary
> ✅ Use AI well to boost efficiency, but **don't send confidential material, always verify facts, and follow the rules**. Contact the platform admin if you have questions.

