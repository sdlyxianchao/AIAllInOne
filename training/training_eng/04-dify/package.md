# Dify — Training Package (M06 · AI Application Platform)

## Outline

**Positioning**: the web AI app platform. Employees use AI in the browser (chat assistants, agents, workflows, text generation); admins configure model providers, build the **unified knowledge base (RAG)**, and manage members. Dify is the most employee-facing core product.

**Objectives**: explain deployment (standalone ~15 containers, port 80, via NewAPI); fix deploy issues (GRAPH_ENGINE, WebSocket, base64 password, reset-password); configure model providers (LLM + embedding); create chat/text/agent/workflow apps and publish; create knowledge base (high-quality index) + RAG apps + Knowledge API key; manage members; answer employee FAQ; integrate with MCP Gateway (M10).

**Prereq**: M02, M04 (dify-key).

**Content (6 h, D5)**: overview & app types (0.5) → deploy troubleshooting (0.5) → model providers + first chatbot (1.0) → KB/RAG + Knowledge API (1.5) → Agent & Workflow (1.0) → publish/members/stats/FAQ (0.5) → integrated lab: KB-based customer service bot published (1.0).

**Pass**: full flow "model provider → KB → RAG chatbot → publish"; can answer employee questions; can fix deploy-level faults.

---

## Textbook

Dify deploys **standalone** (official compose, ~15 containers), port 80 (`http://<SERVER_IP>`), reaches NewAPI via `host.docker.internal:3000`.

**1. Five app types**: Chatbot (conversation: customer service, internal QA), Text Generator (summaries/reports), Agent (tool-calling autonomous), Workflow (fixed pipelines), Chatflow (conversation + flow: KB customer service).

**2. Deploy & pitfalls (standalone)**
- Steps: clone (GitHub tag / Gitee mirror) → fix compose compat + copy all `.env` → **required fix** `shared.env` `GRAPH_ENGINE_SCALE_UP_THRESHOLD=0→50` (1.16.1 made it PositiveInt; 4 containers restart-loop otherwise) → `docker compose up -d` → 15 containers Up (`init_permissions` Exited is normal).
- 3 must-know pitfalls:

| Pitfall | Symptom | Fix |
|---|---|---|
| WebSocket | app creation/workflow debug hangs, loops `ws://localhost` | `.env` `NEXT_PUBLIC_SOCKET_URL=ws://<SERVER_IP>` + compose web fallback + `docker compose up -d web` + hard refresh |
| base64 password | script/API login fails; "click login nothing happens" | `POST /console/api/login` password is **base64** (obfuscation, not encryption) |
| forgot admin password | cannot log in | `docker exec docker-api-1 flask reset-password --email ai_all_in_one_admin@<domain> --new-password '<new>' --password-confirm '<new>'` (≥8 chars; PBKDF2 10000 iters, not reversible) |

> `GET /console/api/account/profile 401` when logged out is normal, not a backend fault.

**3. Model providers**: Settings → Model Providers → **OpenAI-API-compatible** → model name `deepseek-chat` (match NewAPI channel), API key = dify-key, **API endpoint `http://host.docker.internal:3000/v1`**. For RAG also add an **embedding model** (local Ollama bge-m3) and set it as the **default text-embedding** (else "Default model not found"). Test → reply = chain OK.

**4. Knowledge base (unified RAG)**
- Create KB → upload docs → index mode **High quality** (needs embedding).
- Chunking & retrieval params (top_k, score_threshold, hybrid).
- **Knowledge API key**: KB → API Access → create → record `key` (dataset-...) + `dataset_id` (UUID in URL). Fill `.env`: `DIFY_API_BASE=http://<SERVER_IP>/v1`, `DIFY_KNOWLEDGE_API_KEY`, `DIFY_DEFAULT_DATASET_ID` → restart mcp-gateway → DeepChat gets `search_knowledge` (M10).
- RAG app: new Chatflow → knowledge retrieval node → LLM with retrieved context → debug → publish.

**5. Agent & Workflow**: Agent = model + tools (built-in/custom/MCP); Workflow = drag nodes (start → KB retrieval → LLM → condition → direct reply/HTTP). MCP tools point to `http://<SERVER_IP>:3100/mcp`.

**6. Publish & management**: publish → WebApp link / iframe embed (Ghost portal) / Service API (`POST /v1/chat-messages` with API key). Members: Settings → Members → invite/roles. Usage stats in console (cross-check NewAPI logs).

**7. FAQ**:
| Issue | Fix |
|---|---|
| app creation spins | WebSocket (see 2) |
| KB no hits | default embedding set? index completed (High quality processing→done)? retrieval params? |
| "Default model not found for text-embedding" | set default embedding |
| model error/no reply | NewAPI channel test; endpoint correct (`host.docker.internal:3000/v1`)? |
| login no response | base64/cache; hard refresh; profile 401 normal |
| forgot password | container reset-password (≥8) |
| containers restart-loop | `docker logs docker-api-1` → ValidationError → GRAPH_ENGINE fix |

**8. Security**: Knowledge API key is **account-level** (all KBs) — for enterprise, prefer MCP Gateway (key stays server-side); KB content follows data classification; admin email unified; minimal member permissions.

---

## Training Plan (6 h, D5)

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + deploy troubleshooting | lecture |
| 09:30-10:30 | Lab 1: model providers (LLM+embedding) + chatbot | lab |
| 10:30-11:30 | Lab 2: KB + KB app + Knowledge API key | lab |
| 11:30-12:00 | Publish/embed + members | lecture |
| 14:00-15:00 | Lab 3: Agent app | lab |
| 15:00-16:00 | Lab 4: Workflow (retrieval + LLM + condition) | lab |
| 16:00-17:00 | Integrated: KB customer-service bot → publish to Ghost (S) | lab |

**Lab checklist**: provider (deepseek-chat via host.docker.internal:3000/v1 + bge-m3 default) tested (S); chatbot replies; KB High quality indexed; Chatflow retrieval hits (S); Knowledge API key recorded; Agent with ≥1 tool; Workflow with retrieval node; app published with WebApp/embed; (bonus) Service API call.

**Homework**: 10+ item "Dify FAQ card"; read `../../Dify-RAG-接入实现方案.md` → draw RAG chain (DeepChat → MCP → Dify Knowledge API); tune retrieval params and note effect.

**Failure drills**: endpoint missing /v1 → fail; embedding not default → KB error; WebSocket localhost → debug hangs; wrong dataset → search_knowledge empty.

**Handoff**: Knowledge API key feeds M10; Ghost embed is M07 content.

---

## Exam (theory 12 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. Dify→LLM endpoint → B host.docker.internal:3000/v1; 2. Required deploy fix → B GRAPH_ENGINE_SCALE_UP_THRESHOLD; 3. WebSocket → B ws://<SERVER_IP>; 4. Login password transport → C base64; 5. High-quality KB needs default → B embedding; 6. Knowledge API key scope → B account-level.

**True/False (3×4)**: 7. Dify deploys with its own compose. T; 8. profile 401 = backend down. F; 9. forgot password → flask reset-password. T; 10. retrieval params fixed. F.

**Hands-on (50)**: 1. provider + chatbot (15); 2. KB + Chatflow retrieval hit (20); 3. Knowledge API key + .env three vars (15).

**Defense (20)**: "KB answers are off — debug path?"; "How to roll Dify apps out to all employees?"; "Forgot admin password — reset without touching DB?"
