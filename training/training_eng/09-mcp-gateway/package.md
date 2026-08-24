# MCP Gateway — Training Package (M10 · Tool & Skill Gateway)

## Outline

**Positioning**: centralized Skill/MCP tool gateway. DSH Desktop and Dify connect to one address and get all tools (built-in platform tools + aggregated external MCP servers + Dify knowledge retrieval RAG), and it hosts the intranet **Skill Marketplace**. The hub for "AI capability extension".

**Objectives**: explain MCP protocol basics (Host/Client/Server, Streamable HTTP, SSE) & platform role; name built-in tools (platform_time/echo/services/search_knowledge); aggregate external MCP servers (mcp-servers.json, stdio/http) & add custom built-in tools; run the Skill market (skills/ dir, /market, /skills/<name>.zip) & skill-market; wire up **RAG unified KB retrieval** (Dify prep + .env three vars + search_knowledge verify); use the admin API (X-Admin-Token) & Admin Center MCP page.

**Prereq**: M06 (KB + Knowledge API key), M09 (DSH Desktop MCP).

**Content (3 h, D7 PM)**: MCP protocol + architecture (0.5) → built-in tools + verify (0.5) → aggregate external + custom tools (0.5) → Skill market (0.5) → RAG search_knowledge full chain + 3 pitfalls (0.75) → admin API + Admin Center page + troubleshooting (0.25).

**Pass**: DSH Desktop → :3100/mcp → search_knowledge hits KB; upload/delete a Skill; add/remove an external MCP server; explain the 3 RAG pitfalls.

---

## Textbook

Port `3100` (container `mcp-gateway`); source `../../windows/mcp-gateway/` (gateway.js + mcp-servers.json + skills/); based on `@modelcontextprotocol/sdk`; exposes standard **Streamable HTTP `/mcp`**.

**1. What MCP is**: Model Context Protocol (Anthropic) — the "USB-C for AI": unified interface for LLMs ↔ external tools/data. Architecture: Host (DSH Desktop/Dify) ↔ Client ↔ Server (tools/resources/prompts). This gateway is **one unified MCP Server**.

**2. Built-in tools**: `platform_time`, `platform_echo`, `platform_services`, `search_knowledge` (Dify KB retrieval, §5).

**3. Verify & use**
```
curl http://<SERVER_IP>:3100/health          # {"status":"ok"}
curl -X POST http://<SERVER_IP>:3100/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
- DSH Desktop: manual config → Streamable HTTP → `http://<SERVER_IP>:3100/mcp` (M09).
- Dify: workflow custom/MCP tool → same address.

**4. External servers & custom tools**
- `mcp-servers.json`: `{name, type: stdio|http, command/args or url}`; aggregated tools get `{serverName}_` prefix; restart `docker compose restart mcp-gateway` after edits.
- Custom built-in: add tool def to `builtinTools` + branch in `callBuiltin` in gateway.js → restart → DSH Desktop reconnects.

**5. RAG unified KB retrieval (search_knowledge — focus)**
```
DSH Desktop ─MCP→ MCP Gateway(:3100/mcp) ─HTTP→ Dify Knowledge API
                                                POST /v1/datasets/{id}/hit-testing
```
- Step 1 (Dify, M06 done): default embedding → KB (High quality) → Knowledge API key (record `key` + `dataset_id`).
- Step 2 (.env, keys not hard-coded): `DIFY_API_BASE=http://<SERVER_IP>/v1`, `DIFY_KNOWLEDGE_API_KEY=dataset-...`, `DIFY_DEFAULT_DATASET_ID=<uuid>`.
- Step 3: `docker compose up -d mcp-gateway` → DSH Desktop calls `search_knowledge` (query, optional dataset_id/top_k) → returns segments (content + score); or Admin Center → Dify page → RAG card.
- ⚠️ 3 pitfalls:

| Pitfall | Detail |
|---|---|
| network | MCP Gateway is on `ai-platform`; Dify is on its own `docker_default` network — reach Dify via host IP `http://<SERVER_IP>/v1` |
| key scope | Knowledge API key is account-level (all KBs); per-user isolation needs a user→dataset_id map in the tool layer |
| request details | use full path `/v1/datasets/{id}/hit-testing` (bare `/v1` → 308); Chinese query via `curl -d` → 400; use `--data-binary @file` or scripts (UTF-8) |

- Alternative: DSH Desktop's built-in `difyKnowledge` MCP (endpoint with /v1, apiKey, datasetId) — but keys live on every client (account-level, hard to govern); **enterprise path is the gateway**.

**6. Skill marketplace**
| Endpoint | Purpose |
|---|---|
| `/market` | card browsing + download ZIP + copy install link |
| `/skills` | JSON listing (name/description/version) |
| `/skills/<name>.zip` | download (adm-zip dynamic) |
- Skills live in `mcp-gateway/skills/` (dirs with SKILL.md); **auto-scanned on every request — no restart**.
- Built-ins: `platform-report`, `skill-market`. Install in DSH Desktop: Install from URL → `http://<SERVER_IP>:3100/skills/<name>.zip`.

**7. Admin API (for Admin Center)**
| Endpoint | Purpose |
|---|---|
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP server CRUD (writes mcp-servers.json + auto-reconnect) |
| `POST /api/skills/upload` | upload skill zip (SKILL.md check, path-traversal guard) |
| `DELETE /api/skills/:name` | delete skill |
Requires `X-Admin-Token` (`.env` `MCP_ADMIN_TOKEN`); 503 if unset, 401 if wrong. Admins use Admin Center → MCP Gateway page (Keycloak `ai-platform-admin`).

**8. FAQ**
| Issue | Fix |
|---|---|
| /health down | container up? port mapped? |
| tools/list empty | gateway.js logs; npm install ran? |
| search_knowledge no results | DIFY_* three vars; network (host IP); dataset_id |
| new tool not visible | reconnect MCP in DSH Desktop |
| skill upload fails | zip must contain SKILL.md; traversal check |
| skill-market can't read market | hostname not IP (IP redacted) |

---

## Training Plan (3 h, D7 PM)

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | MCP protocol + gateway architecture + built-ins | lecture |
| 14:30-15:00 | Lab 1: /health + tools/list + platform_time | lab |
| 15:00-15:30 | Lab 2: aggregate external server + custom built-in tool | lab |
| 15:30-16:00 | Lab 3: Skill market browse + upload/delete | lab |
| 16:00-16:45 | Lab 4: RAG full chain (.env three vars + search_knowledge) | lab |
| 16:45-17:00 | Admin API + Admin Center page + troubleshooting | lecture |

**Lab checklist**: /health + tools/list with 4 built-ins (S); DSH Desktop calls platform_time/services; external MCP server added (prefixed tools visible) (S); custom platform_health added; Skill uploaded & installed from URL (S); .env DIFY_* configured + restart; search_knowledge returns KB content (S); admin API add/remove a server.

**Homework**: draw DSH Desktop→Gateway→Dify RAG diagram with 3 pitfalls; read ch20-ops-mcp.md → 5 ops points; design an MCP server for an internal API.

**Failure drills**: DIFY_API_BASE missing /v1 → 404/308; Chinese query via curl -d → 400; external server won't start → gateway logs.

**Handoff**: ties M06 KB + M09 client + M11 RAG card; interconnect checks #6/#7.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. client endpoint (manual) → B /mcp; 2. RAG built-in tool → D search_knowledge; 3. aggregated tool prefix → B {serverName}_; 4. Dify API call → B /v1/datasets/{id}/hit-testing; 5. reach Dify from gateway → B host IP http://<SERVER_IP>/v1; 6. skill download endpoint → A /skills/<name>.zip.

**True/False (3×4)**: 7. /market is read-only; CRUD via admin API/files. T; 8. mcp-servers.json edits need restart. T; 9. skills/ dir needs restart to be scanned. F; 10. built-in difyKnowledge is better than gateway for governance. F.

**Hands-on (50)**: 1. verify built-ins + call one (15); 2. search_knowledge full chain hit (20); 3. upload/delete a Skill + URL install (15).

**Defense (20)**: "Expose an internal business API to DSH Desktop?"; "KB retrieval returns nothing — possible causes?"; "MCP vs Skill — when to use which?"
