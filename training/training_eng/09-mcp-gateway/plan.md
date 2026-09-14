# MCP Gateway — Training Plan (M10, 3 h, D7 PM)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | MCP protocol + gateway architecture + built-ins | lecture |
| 14:30-15:00 | Lab 1: /health + tools/list + platform_time | lab |
| 15:00-15:30 | Lab 2: aggregate external server + custom built-in tool | lab |
| 15:30-16:00 | Lab 3: Skill market browse + upload/delete | lab |
| 16:00-16:45 | Lab 4: RAG full chain (.env three vars + search_knowledge) | lab |
| 16:45-17:00 | Admin API + Admin Center page + troubleshooting | lecture |

## 2. Lab Checklist

- [ ] /health + tools/list with 4 built-ins (S)
- [ ] DSH Desktop calls platform_time/services
- [ ] External MCP server added (prefixed tools visible) (S)
- [ ] Custom platform_health added
- [ ] Skill uploaded & installed from URL (S)
- [ ] .env DIFY_* configured + restart
- [ ] search_knowledge returns KB content (S)
- [ ] Admin API add/remove a server

## 3. Homework

- Draw DSH Desktop→Gateway→Dify RAG diagram with 3 pitfalls
- Read ch20-ops-mcp.md → 5 ops points
- Design an MCP server for an internal API

## 4. Failure Drills

- DIFY_API_BASE missing /v1 → 404/308
- Chinese query via curl -d → 400
- External server won't start → gateway logs

## 5. Handoff

- Ties M06 KB + M09 client + M11 RAG card
- Interconnect checks #6/#7
