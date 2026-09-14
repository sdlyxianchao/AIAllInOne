# MCP Gateway — Training Outline (M10 · Tool & Skill Gateway)

## 1. Positioning

Centralized Skill/MCP tool gateway. DSH Desktop and Dify connect to one address and get all tools (built-in platform tools + aggregated external MCP servers + Dify knowledge retrieval RAG), and it hosts the intranet **Skill Marketplace**. The hub for "AI capability extension".

## 2. Learning Objectives

- Explain MCP protocol basics (Host/Client/Server, Streamable HTTP, SSE) & platform role
- Name built-in tools (platform_time/echo/services/search_knowledge)
- Aggregate external MCP servers (mcp-servers.json, stdio/http) & add custom built-in tools
- Run the Skill market (skills/ dir, /market, /skills/<name>.zip) & skill-market
- Wire up **RAG unified KB retrieval** (Dify prep + .env three vars + search_knowledge verify)
- Use the admin API (X-Admin-Token) & Admin Center MCP page

## 3. Prerequisites

- M06 (KB + Knowledge API key), M09 (DSH Desktop MCP)

## 4. Course Content & Duration (3 h, D7 PM)

| Topic | Duration | Type |
|---|---|---|
| MCP protocol + architecture | 0.5 | Lecture |
| Built-in tools + verify | 0.5 | Lab |
| Aggregate external + custom tools | 0.5 | Lab |
| Skill market | 0.5 | Lab |
| RAG search_knowledge full chain + 3 pitfalls | 0.75 | Lab |
| Admin API + Admin Center page + troubleshooting | 0.25 | Lecture |

## 5. Pass Criteria (A Level)

- DSH Desktop → :3100/mcp → search_knowledge hits KB
- Upload/delete a Skill
- Add/remove an external MCP server
- Explain the 3 RAG pitfalls

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
