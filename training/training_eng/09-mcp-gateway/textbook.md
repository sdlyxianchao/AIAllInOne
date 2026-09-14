# MCP Gateway — Textbook (M10 · Tool & Skill Gateway)

> Port `3100` (container `mcp-gateway`); source `../../windows/mcp-gateway/` (gateway.js + mcp-servers.json + skills/); based on `@modelcontextprotocol/sdk`; exposes standard **Streamable HTTP `/mcp`**.

## 1. What MCP is

Model Context Protocol (Anthropic) — the "USB-C for AI": unified interface for LLMs ↔ external tools/data. Architecture: Host (DSH Desktop/Dify) ↔ Client ↔ Server (tools/resources/prompts). This gateway is **one unified MCP Server**.

## 2. Built-in tools

`platform_time`, `platform_echo`, `platform_services`, `search_knowledge` (Dify KB retrieval, §5).

## 3. Verify & use

```bash
curl http://<SERVER_IP>:3100/health          # {"status":"ok"}
curl -X POST http://<SERVER_IP>:3100/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

- DSH Desktop: manual config → Streamable HTTP → `http://<SERVER_IP>:3100/mcp` (M09).
- Dify: workflow custom/MCP tool → same address.

## 4. External servers & custom tools

- `mcp-servers.json`: `{name, type: stdio|http, command/args or url}`; aggregated tools get `{serverName}_` prefix; restart `docker compose restart mcp-gateway` after edits.
- Custom built-in: add tool def to `builtinTools` + branch in `callBuiltin` in gateway.js → restart → DSH Desktop reconnects.

## 5. RAG unified KB retrieval (search_knowledge — focus)

```
DSH Desktop ─MCP→ MCP Gateway(:3100/mcp) ─HTTP→ Dify Knowledge API
                                                POST /v1/datasets/{id}/hit-testing
```

- **Step 1** (Dify, M06 done): default embedding → KB (High quality) → Knowledge API key (record `key` + `dataset_id`).
- **Step 2** (.env, keys not hard-coded): `DIFY_API_BASE=http://<SERVER_IP>/v1`, `DIFY_KNOWLEDGE_API_KEY=dataset-...`, `DIFY_DEFAULT_DATASET_ID=<uuid>`.
- **Step 3**: `docker compose up -d mcp-gateway` → DSH Desktop calls `search_knowledge` (query, optional dataset_id/top_k) → returns segments (content + score); or Admin Center → Dify page → RAG card.

⚠️ **3 pitfalls**:

| Pitfall | Detail |
|---|---|
| network | MCP Gateway is on `ai-platform`; Dify is on its own `dify_default` network — reach Dify via host IP `http://<SERVER_IP>/v1` |
| key scope | Knowledge API key is account-level (all KBs); per-user isolation needs a user→dataset_id map in the tool layer |
| request details | use full path `/v1/datasets/{id}/hit-testing` (bare `/v1` → 308); Chinese query via `curl -d` → 400; use `--data-binary @file` or scripts (UTF-8) |

Alternative: DSH Desktop's built-in `difyKnowledge` MCP (endpoint with /v1, apiKey, datasetId) — but keys live on every client (account-level, hard to govern); **enterprise path is the gateway**.

## 6. Skill marketplace

| Endpoint | Purpose |
|---|---|
| `/market` | card browsing + download ZIP + copy install link |
| `/skills` | JSON listing (name/description/version) |
| `/skills/<name>.zip` | download (adm-zip dynamic) |

Skills live in `mcp-gateway/skills/` (dirs with SKILL.md); **auto-scanned on every request — no restart**.

Built-ins: `platform-report`, `skill-market`. Install in DSH Desktop: Install from URL → `http://<SERVER_IP>:3100/skills/<name>.zip`.

## 7. Admin API (for Admin Center)

| Endpoint | Purpose |
|---|---|
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP server CRUD (writes mcp-servers.json + auto-reconnect) |
| `POST /api/skills/upload` | upload skill zip (SKILL.md check, path-traversal guard) |
| `DELETE /api/skills/:name` | delete skill |

Requires `X-Admin-Token` (`.env` `MCP_ADMIN_TOKEN`); 503 if unset, 401 if wrong. Admins use Admin Center → MCP Gateway page (Keycloak `ai-platform-admin`).

## 8. FAQ

| Issue | Fix |
|---|---|
| /health down | container up? port mapped? |
| tools/list empty | gateway.js logs; npm install ran? |
| search_knowledge no results | DIFY_* three vars; network (host IP); dataset_id |
| new tool not visible | reconnect MCP in DSH Desktop |
| skill upload fails | zip must contain SKILL.md; traversal check |
| skill-market can't read market | hostname not IP (IP redacted) |
