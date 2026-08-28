# DSH Desktop — Training Outline (M09 · Desktop AI Client)

## 1. Positioning

Local desktop AI client (Windows/macOS/Linux). Employees install it and call LLMs through NewAPI; supports MCP tools, Skill packages, local file access. The most-used AI tool — high-frequency support topic.

## 2. Learning Objectives

- Explain role (client → NewAPI:3000/v1 → LiteLLM → external)
- Install & configure model service
- Configure MCP (manual Streamable HTTP → `http://<SERVER_IP>:3100/mcp`; filesystem tool)
- Install Skills (URL, skill-market)
- Understand auto-update chain & distribution
- Troubleshoot (connection fail, manual-config not found, IP redaction, SSE notice)

## 3. Prerequisites

- M04 (dsh-key)
- Basic MCP concept (or co-learn with M10)

## 4. Course Content & Duration (3 h, D7 AM)

| Topic | Duration | Type |
|---|---|---|
| Overview & distribution | 0.5 | Lecture |
| Install + model config + test | 0.75 | Lab |
| MCP (SSE vs /mcp, filesystem) | 0.75 | Lab |
| Skills + update chain | 0.5 | Lab |
| Troubleshooting | 0.5 | Lecture |

## 5. Pass Criteria (A Level)

- Install & configure & chat
- Guide employees end-to-end
- Understand update chain & 3 distribution ways

## 6. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
