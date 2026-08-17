# Chapter 4: Tool 2: Dify

*Quick Start*

> Web AI app platform: use ready-made apps and build knowledge base Q&amp;A.

[← Chapter 3: Tool 1: DeepChat](ch03-deepchat.md) · [📖 Index](index.md) · [Chapter 5: Requesting an API Key →](ch05-key.md)

---

## 4.1 Log In to Dify

1. Open `http://IP` in a browser (port 80, no port number; you can also click in via the portal's "AI Workbench");

2. Log in with the unified account (first time may require the admin to create the account first).

## 4.2 Use Ready-Made Chat Apps

Admins pre-build some apps (e.g. "company policy Q&A", "customer service assistant"); regular users just "use" them:

1. After login, enter the "**Studio / Apps**" list;

2. Find the app you want, click "**Run / Preview**" (the play button in the top-right);

3. Ask questions directly on the opened chat page.

## 4.3 Knowledge Base Q&A

To "feed" internal documents to the AI so it can answer, use Dify's **knowledge base** (requires admin permission):

1. "**Knowledge Base**" → "Create knowledge base";

2. Upload documents (supports Word / PDF / Markdown / web links, etc.);

3. The system automatically segments and indexes;

4. "Reference" this knowledge base in an app and the AI can answer based on your documents.

> 📌 Knowledge base content will be used by the AI to answer; follow the Chapter 6 data security policy — **do not upload confidential material**.

## 4.4 Build a Simple App Yourself (advanced)

1. Studio → create blank app → select "chat assistant";

2. Write a "prompt" telling the AI its role (e.g. "you are the company attendance-policy Q&A assistant");

3. add a knowledge base → select the model → preview/test → publish.

> 📖 Vendor docs:Dify official docs https://docs.dify.ai

---

[← Chapter 3: Tool 1: DeepChat](ch03-deepchat.md) · [📖 Index](index.md) · [Chapter 5: Requesting an API Key →](ch05-key.md)
