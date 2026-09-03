# Dify — Textbook (M06 · AI Application Platform)

> Dify deploys **standalone** (official compose, ~15 containers), port 80 (`http://<SERVER_IP>`), reaches NewAPI via `host.docker.internal:3000`.

## 1. Five app types

- **Chatbot** (conversation: customer service, internal QA)
- **Text Generator** (summaries/reports)
- **Agent** (tool-calling autonomous)
- **Workflow** (fixed pipelines)
- **Chatflow** (conversation + flow: KB customer service)

## 2. Deploy & pitfalls (standalone)

**Steps**: clone (GitHub tag / Gitee mirror) → fix compose compat + copy all `.env` → **required fix** `shared.env` `GRAPH_ENGINE_SCALE_UP_THRESHOLD=0→50` (1.16.1 made it PositiveInt; 4 containers restart-loop otherwise) → `docker compose up -d` → 15 containers Up (`init_permissions` Exited is normal).

**3 must-know pitfalls**:

| Pitfall | Symptom | Fix |
|---|---|---|
| WebSocket | app creation/workflow debug hangs, loops `ws://localhost` | `.env` `NEXT_PUBLIC_SOCKET_URL=ws://<SERVER_IP>` + compose web fallback + `docker compose up -d web` + hard refresh |
| base64 password | script/API login fails; "click login nothing happens" | `POST /console/api/login` password is **base64** (obfuscation, not encryption) |
| forgot admin password | cannot log in | `docker exec dify-api-1 flask reset-password --email ai_all_in_one_admin@<domain> --new-password '<new>' --password-confirm '<new>'` (≥8 chars; PBKDF2 10000 iters, not reversible) |

> `GET /console/api/account/profile 401` when logged out is normal, not a backend fault.

## 3. Model providers

Settings → Model Providers → **OpenAI-API-compatible** → model name `deepseek-chat` (match NewAPI channel), API key = dify-key, **API endpoint `http://host.docker.internal:3000/v1`**. For RAG also add an **embedding model** (local Ollama bge-m3) and set it as the **default text-embedding** (else "Default model not found"). Test → reply = chain OK.

## 4. Knowledge base (unified RAG)

- Create KB → upload docs → index mode **High quality** (needs embedding).
- Chunking & retrieval params (top_k, score_threshold, hybrid).
- **Knowledge API key**: KB → API Access → create → record `key` (dataset-...) + `dataset_id` (UUID in URL). Fill `.env`: `DIFY_API_BASE=http://<SERVER_IP>/v1`, `DIFY_KNOWLEDGE_API_KEY`, `DIFY_DEFAULT_DATASET_ID` → restart mcp-gateway → DSH Desktop gets `search_knowledge` (M10).
- RAG app: new Chatflow → knowledge retrieval node → LLM with retrieved context → debug → publish.

## 5. Agent & Workflow

- **Agent** = model + tools (built-in/custom/MCP)
- **Workflow** = drag nodes (start → KB retrieval → LLM → condition → direct reply/HTTP)
- MCP tools point to `http://<SERVER_IP>:3100/mcp`

## 6. Publish & management

Publish → WebApp link / iframe embed (Ghost portal) / Service API (`POST /v1/chat-messages` with API key). Members: Settings → Members → invite/roles. Usage stats in console (cross-check NewAPI logs).

## 7. FAQ

| Issue | Fix |
|---|---|
| app creation spins | WebSocket (see §2) |
| KB no hits | default embedding set? index completed (High quality processing→done)? retrieval params? |
| "Default model not found for text-embedding" | set default embedding |
| model error/no reply | NewAPI channel test; endpoint correct (`host.docker.internal:3000/v1`)? |
| login no response | base64/cache; hard refresh; profile 401 normal |
| forgot password | container reset-password (≥8) |
| containers restart-loop | `docker logs dify-api-1` → ValidationError → GRAPH_ENGINE fix |

## 8. Security

Knowledge API key is **account-level** (all KBs) — for enterprise, prefer MCP Gateway (key stays server-side); KB content follows data classification; admin email unified; minimal member permissions.
