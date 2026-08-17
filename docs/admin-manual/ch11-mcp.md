# Chapter 11: MCP Gateway and Skill Marketplace

*Part 1 · Deployment*

> A gateway that centrally manages Skills and MCP tools; DeepChat/Dify connect to one address to get all tools.

[← Chapter 10: DeepChat Distribution and CI/CD](ch10-deepchat.md) · [📖 Index](index.md) · [Chapter 12: AI Admin Center →](ch12-admin-center.md)

---

> 📌 MCP Gateway is based on the official `@modelcontextprotocol/sdk`, exposes the standard Streamable HTTP `/mcp` endpoint, has been merged into the main `docker-compose.yml` (port 3100), and starts with the core services. Source code is in `mcp-gateway/`.

## 11.1 Built-in Platform Tools

| Tool | Purpose |
| --- | --- |
| `platform_time` | Returns the server's current time |
| `platform_echo` | Echoes text (connectivity test) |
| `platform_services` | Lists the platform service catalog |

## 11.2 Aggregate External MCP Servers

Edit `mcp-gateway/mcp-servers.json`, add stdio or http types, and restart `mcp-gateway` for it to take effect:

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

Aggregated tools automatically get the `{serverName}_` prefix to avoid name collisions.

## 11.3 Client Integration

1. DeepChat: Settings → MCP → add server → type "Streamable HTTP", URL `http://<server-IP>:3100/mcp`;

2. Dify workflow: custom tool / MCP tool configuration points to the same address.

> Verify: `curl http://<server-IP>:3100/health` returns `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` returns the tool list.

## 11.4 Skill Marketplace (intranet skill package distribution)

| Endpoint | Purpose |
| --- | --- |
| `/market` | Skill marketplace page (browse cards + download ZIP + copy install address) |
| `/skills` | Skill catalog JSON (name/description/version) |
| `/skills/<name>.zip` | skill package download (dynamically packaged) |

Skills are placed in the `mcp-gateway/skills/` directory (subdirectories containing SKILL.md), and **are automatically scanned on each request with no restart needed**. The `skill-market` bootstrap skill is built in.

> 📌 In DeepChat, MCP and Skill are two concepts: MCP is a "tool" (function calling), while a Skill is an "agent skill package" (SKILL.md + scripts). DeepChat's Skill has no "custom marketplace URL"; it only supports three install methods — folder / ZIP / URL — and intranet distribution is achieved indirectly via "URL install".

## 11.5 ⚠️ Skill Marketplace Hostname (deployment parameter, must be replaced)

"Skill Butler" reads `market_url` in `config.json` to request the `/skills` catalog. Two key points:

- **Use a hostname, not an IP**: DeepChat's agent environment redacts the IP into `[IP_ADDRESS_REDACTED]`, making the real address unreadable;

- **The hostname is a deployment parameter**: it differs for each deployment and must not be copied verbatim.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<market-hostname>:3100" }
```

#### Automatic (deploy with an Agent)

When collecting parameters, the Agent asks for the "Skill marketplace hostname" and automatically replaces `<market-hostname>` in `config.json` and `SKILL.md`.

#### Manual

1. Edit `config.json` + the fallback address in `SKILL.md`, replacing `<market-hostname>`;

2. Make the hostname resolvable: on a single machine, add `<server-IP> <hostname>` to `C:\Windows\System32\drivers\etc\hosts`; on the company intranet, add an A record in DNS.

> ✅ For the hostname, use an FQDN like "service name + company domain", e.g. `skillmarket.your-company-domain`. To add a DNS A record: domain controller "DNS → Forward Lookup Zones → your domain → New Host (A)", or use `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "your-domain" -IPv4Address "<server-IP>"`.

## 11.6 Management API (for the AI Admin Center to create/update/delete)

| Endpoint | Purpose |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP Server CRUD (writes back config + auto-reconnects) |
| `POST /api/skills/upload` | Upload a skill zip (validates SKILL.md, prevents path traversal) |
| `DELETE /api/skills/:name` | Delete a skill |

Requires the `X-Admin-Token` header (`MCP_ADMIN_TOKEN` in `.env`). Proxied by the "MCP Gateway" page of the AI Admin Center (protected by the `ai-platform-admin` role).

> 📖 Vendor docs:MCP protocol official https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Chapter 10: DeepChat Distribution and CI/CD](ch10-deepchat.md) · [📖 Index](index.md) · [Chapter 12: AI Admin Center →](ch12-admin-center.md)
