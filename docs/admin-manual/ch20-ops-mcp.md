# Chapter 20: MCP Gateway Day-to-Day Administration

*Part 2 · Administration*

> Add/remove MCP Servers, upload/delete Skills, extend built-in tools.

[← Chapter 19: Gitea Day-to-Day Administration](ch19-ops-gitea.md) · [📖 Index](index.md) · [Chapter 21: Update Server Administration →](ch21-ops-update.md)

---

**Entry**: `http://<server-IP>:3100` (marketplace page `/market`). Management is done via the "MCP Gateway" page of the AI Admin Center (`ai-platform-admin` role), or by calling the management API directly.

## 20.1 Manage MCP Servers

1. Edit `mcp-gateway/mcp-servers.json` to add/remove servers (stdio/http types);

2. Restart: `docker compose restart mcp-gateway`;

3. Or add/remove on the AI Admin Center's MCP Gateway page (writes back config + auto-reconnects).

## 20.2 Manage Skills (skill packages)

1. **Upload**: AI Admin Center MCP Gateway page → upload a skill zip (validates it contains SKILL.md, prevents path traversal);

2. **Delete**: delete the corresponding skill;

3. Skills are placed in `mcp-gateway/skills/` (subdirectories containing SKILL.md), automatically scanned on each request, no restart needed.

## 20.3 Extend Built-in Tools

In `mcp-gateway/gateway.js`, add two steps:

```
// ① tool definition (add one item to the builtinTools array)
{ name: 'platform_health', description: 'query service health status',
  inputSchema: { type: 'object', properties: {} } }

// ② execution logic (add one branch to callBuiltin)
if (name === 'platform_health') { return 'all services running normally'; }
```

After editing, `docker compose restart mcp-gateway`.

## 20.4 Maintain the skill-market Marketplace Address

"Skill Butler"'s `market_url` is in `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; it must use a hostname (not an IP) and is a deployment parameter (see Chapter 11).

> ⚠️ The management API requires the `X-Admin-Token` header (`MCP_ADMIN_TOKEN` in `.env`); unconfigured returns 503, wrong token returns 401.

> 📖 Vendor docs:MCP protocol official https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Chapter 19: Gitea Day-to-Day Administration](ch19-ops-gitea.md) · [📖 Index](index.md) · [Chapter 21: Update Server Administration →](ch21-ops-update.md)
