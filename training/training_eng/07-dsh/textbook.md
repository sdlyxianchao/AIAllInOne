# DSH Desktop — Textbook (M09 · Desktop AI Client)

> Desktop app (not Docker). Employee machines point API at `http://<SERVER_IP>:3000/v1` (NewAPI).

## 1. What it is

Electron-based open-source AI chat client; 30+ providers, MCP tools, Skills, multi-window/tab, Markdown, local file IO.

```
DSH Desktop ─HTTP→ NewAPI(:3000/v1) → LiteLLM → external LLM
      └── MCP → MCP Gateway(:3100/mcp) → tools/Skills/knowledge
```

## 2. Distribution (3 ways)

- **A. Intranet (recommended)**: GitHub release → dsh-sync → Update Server(:8091) → Ghost download page → employees; auto-update checks `version.txt`.
- **B. Docker-build** custom version (node:20 + electron-builder; .exe + latest.yml into dsh-updates).
- **C. Direct copy** of installer.

## 3. Install & configure

- Download from portal `/dsh/` (or :8091).
- Settings → Model Service → "Custom Provider"/"OpenAI compatible": **API Base URL `http://<SERVER_IP>:3000/v1`** (intranet IP on employee machines), API key `dsh-key` (or self-service token from NewAPI), model `deepseek-chat`/`gpt-4o-mini` (as configured). Save → new chat → "hi" → reply.

## 4. MCP (focus)

- **Manual (recommended, Streamable HTTP)**: Settings → MCP → **Add** → click **"Skip to manual configuration"** (⚠️ required — otherwise you land in the template picker and never see the HTTP type) → type **Streamable HTTP** → Base URL `http://<SERVER_IP>:3100/mcp` → save → call platform tools.
- **One-click (SSE)**: via `/market` or Admin Center `dsh://mcp/install` link → **SSE endpoint `/sse`**; the dsh:// handler accepts stdio/sse only; "SSE is legacy-only" notice is **normal**. Same gateway, same tools.
- **filesystem example**: name `filesystem`, command `npx -y @modelcontextprotocol/server-filesystem C:\Users`; test "list my files".

## 5. Skills

- **MCP vs Skill**: MCP = tools (function calling); Skill = agent skill packages (SKILL.md instructions + scripts).
- **Install**: folder / ZIP / **URL** (official only these 3); intranet: DSH Desktop → Settings → Skills → **Install from URL** → `http://<SERVER_IP>:3100/skills/<name>.zip`.
- **skill-market** ("skill manager"): employees install it first, then ask "what skills are there / install X / update skills" in chat. It reads `config.json` `market_url` → `/skills` listing → recommend/guide. ⚠️ `market_url` must be a **hostname** (e.g. `skillmarket.<company-domain>`) — DSH Desktop redacts IPs to `[IP_ADDRESS_REDACTED]`, which breaks IP-based market URLs.

## 6. Auto-update chain

```
GitHub Releases → dsh-sync (Gitea Actions, daily UTC 2) → Update Server(:8091/dsh/)
    └─ version.txt ──> DSH Desktop checks at startup → auto download/install
```

- `publish.url` = `http://<SERVER_IP>:8091/dsh/` (generic provider, reads latest.yml). Download page maintained by update_ghost.py (timeline, keep_releases trim, idempotent).

## 7. FAQ

| Issue | Fix |
|---|---|
| connection fail | Base URL intranet + /v1; NewAPI reachable; token valid/has quota |
| no "Streamable HTTP" type | click "Skip to manual configuration" first |
| SSE legacy-only notice | normal; or use manual /mcp |
| skill-market can't read market | market_url used IP (redacted); switch to hostname + hosts/DNS |
| no auto-update | version.txt current? Update Server reachable? latest.yml correct? |
| where to download | portal `/dsh/` |
