# DSH Desktop — Training Package (M09 · Desktop AI Client)

## Outline

**Positioning**: local desktop AI client (Windows/macOS/Linux). Employees install it and call LLMs through NewAPI; supports MCP tools, Skill packages, local file access. The most-used AI tool — high-frequency support topic.

**Objectives**: explain role (client → NewAPI:3000/v1 → LiteLLM → external); install & configure model service; configure MCP (manual Streamable HTTP → `http://<SERVER_IP>:3100/mcp`; filesystem tool); install Skills (URL, skill-market); understand auto-update chain & distribution; troubleshoot (connection fail, manual-config not found, IP redaction, SSE notice).

**Prereq**: M04 (dsh-key); basic MCP concept (or co-learn with M10).

**Content (3 h, D7 AM)**: overview & distribution (0.5) → install + model config + test (0.75) → MCP (SSE vs /mcp, filesystem) (0.75) → Skills + update chain (0.5) → troubleshooting (0.5).

**Pass**: install & configure & chat; guide employees end-to-end; understand update chain & 3 distribution ways.

---

## Textbook

Desktop app (not Docker). Employee machines point API at `http://<SERVER_IP>:3000/v1` (NewAPI).

**1. What it is**: Electron-based open-source AI chat client; 30+ providers, MCP tools, Skills, multi-window/tab, Markdown, local file IO.

```
DSH Desktop ─HTTP→ NewAPI(:3000/v1) → LiteLLM → external LLM
      └── MCP → MCP Gateway(:3100/mcp) → tools/Skills/knowledge
```

**2. Distribution (3 ways)**: A. intranet (recommended): GitHub release → dsh-sync → Update Server(:8091) → Ghost download page → employees; auto-update checks `version.txt`. B. Docker-build custom version (node:20 + electron-builder; .exe + latest.yml into dsh-updates). C. direct copy of installer.

**3. Install & configure**
- Download from portal `/dsh/` (or :8091).
- Settings → Model Service → "Custom Provider"/"OpenAI compatible": **API Base URL `http://<SERVER_IP>:3000/v1`** (intranet IP on employee machines), API key `dsh-key` (or self-service token from NewAPI), model `deepseek-chat`/`gpt-4o-mini` (as configured). Save → new chat → "hi" → reply.

**4. MCP (focus)**
- Manual (recommended, Streamable HTTP): Settings → MCP → **Add** → click **"Skip to manual configuration"** (⚠️ required — otherwise you land in the template picker and never see the HTTP type) → type **Streamable HTTP** → Base URL `http://<SERVER_IP>:3100/mcp` → save → call platform tools.
- One-click (SSE): via `/market` or Admin Center `dsh://mcp/install` link → **SSE endpoint `/sse`**; the dsh:// handler accepts stdio/sse only; "SSE is legacy-only" notice is **normal**. Same gateway, same tools.
- filesystem example: name `filesystem`, command `npx -y @modelcontextprotocol/server-filesystem C:\Users`; test "list my files".

**5. Skills**
- MCP vs Skill: MCP = tools (function calling); Skill = agent skill packages (SKILL.md instructions + scripts).
- Install: folder / ZIP / **URL** (official only these 3); intranet: DSH Desktop → Settings → Skills → **Install from URL** → `http://<SERVER_IP>:3100/skills/<name>.zip`.
- **skill-market** ("skill manager"): employees install it first, then ask "what skills are there / install X / update skills" in chat. It reads `config.json` `market_url` → `/skills` listing → recommend/guide. ⚠️ `market_url` must be a **hostname** (e.g. `skillmarket.<company-domain>`) — DSH Desktop redacts IPs to `[IP_ADDRESS_REDACTED]`, which breaks IP-based market URLs.

**6. Auto-update chain**
```
GitHub Releases → dsh-sync (Gitea Actions, daily UTC 2) → Update Server(:8091/dsh/)
    └─ version.txt ──> DSH Desktop checks at startup → auto download/install
```
- `publish.url` = `http://<SERVER_IP>:8091/dsh/` (generic provider, reads latest.yml). Download page maintained by update_ghost.py (timeline, keep_releases trim, idempotent).

**7. FAQ**
| Issue | Fix |
|---|---|
| connection fail | Base URL intranet + /v1; NewAPI reachable; token valid/has quota |
| no "Streamable HTTP" type | click "Skip to manual configuration" first |
| SSE legacy-only notice | normal; or use manual /mcp |
| skill-market can't read market | market_url used IP (redacted); switch to hostname + hosts/DNS |
| no auto-update | version.txt current? Update Server reachable? latest.yml correct? |
| where to download | portal `/dsh/` |

---

## Training Plan (3 h, D7 AM)

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + distribution + update chain | lecture |
| 09:30-10:15 | Lab 1: install + model config + chat | lab |
| 10:15-11:00 | Lab 2: MCP manual (/mcp) + filesystem | lab |
| 11:00-11:30 | Lab 3: Skill URL install + skill-market + update check | lab |
| 11:30-12:00 | FAQ + drills | lecture |

**Lab checklist**: DSH Desktop installed from portal/Update Server (S); OpenAI-compatible provider (intranet+/v1+dsh-key+deepseek-chat) chats OK (S); MCP manual config → tools/list shows platform tools (S); call `platform_time` or `search_knowledge`; install a Skill from URL; configure skill-market (hostname rule understood); version.txt matches latest.

**Homework**: write an "Employee DSH Desktop guide"; read ch10-dsh.md → distribution chain; use filesystem tool once.

**Failure drills**: skip "Skip to manual config" → no HTTP type; Base URL missing /v1; market_url IP → unreadable.

**Handoff**: MCP depends on M10; update chain ties M08 + M12.

---

## Exam (theory 10 Q/30 + hands-on 50 + defense 20; ≥70)

**Single choice (3×6)**: 1. API Base URL → B http://<SERVER_IP>:3000/v1; 2. to see "Streamable HTTP" first → B Skip to manual configuration; 3. MCP vs Skill → B tools vs skill packages; 4. market_url must use → B hostname (IP redacted); 5. auto-update version file → A version.txt; 6. one-click install endpoint → B /sse.

**True/False (3×4)**: 7. SSE legacy-only notice is normal. T; 8. Skills install: folder/ZIP/URL only. T; 9. employees can self-service API keys for DSH Desktop. T; 10. installers can only come via Update Server. F.

**Hands-on (50)**: 1. install + provider + chat (20); 2. manual MCP → tool list + call (20); 3. Skill install from URL (10).

**Defense (20)**: "Employee can't connect — debug steps?"; "How to use the company KB in DSH Desktop?"; "How to push a new version to everyone?"
