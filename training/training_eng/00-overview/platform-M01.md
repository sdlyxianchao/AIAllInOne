# Platform Overview & Architecture (M01)

> Corresponds to Chapter 1 of the deployment guide. Goal: build the full platform map before touching anything — components, ports, data flows, security model.

## 1. One-Line Positioning

**One server + Docker orchestration, 8+ open-source components pre-integrated: unified SSO, LLM routing, AI apps, enterprise portal, Git/CI, unified admin, monitoring & alerting, observability, logging, backup — log in once, use every AI tool, data never leaves the intranet.**

## 2. Layered Architecture (6 layers)

| Layer | Components | Notes |
|---|---|---|
| User | DSH Desktop desktop client / browser | employee entry points |
| Portal & Apps | Ghost enterprise portal / Dify AI app platform | content + AI apps |
| LLM Routing | NewAPI → LiteLLM(+Presidio) → external LLMs | routing/billing/redaction |
| Observability | Langfuse | traces/tokens/cost per call |
| Infrastructure | Keycloak / MCP Gateway / Gitea+Runner / Update Server / monitoring & logging | auth/tools/source/distribution/ops |
| Unified Admin | AI Admin Center (:10086) | dashboard + product entries + audit/cost/backup/logs |

## 3. Port Quick Reference (16 items, memorize)

| Product | Port | Who uses |
|---|---|---|
| AI Admin Center | 10086 | admins |
| Keycloak | 9090 | everyone (SSO redirect) |
| NewAPI | 3000 | everyone (AI entry / get API key) |
| LiteLLM | 4001 (container 4000) | internal (called by NewAPI only) |
| Dify | 80 | everyone |
| Ghost | 8090 | everyone |
| Gitea | 3002 / SSH 2222 | developers |
| Update Server | 8091 | DSH Desktop download/update |
| Grafana | 3030 | admins |
| Prometheus | 9091 | admins |
| Langfuse | 3010 | admins |
| MCP Gateway | 3100 | DSH Desktop/Dify tool access |
| MailHog | 8025 | view verification-code emails |
| cadvisor | 8080 | internal (scraped by Prometheus) |
| Loki | 3110 | internal (unified log queries) |
| Promtail | — | internal (log collection) |

## 4. Core Data Flows (must be able to explain)

### 4.1 LLM request flow (the core chain)
```
DSH Desktop / Dify → ① NewAPI(:3000) → ② LiteLLM (PII redaction) → ③ external LLM
                 ← ⑤ return w/ PII restored ← ④ response
Side channel: LiteLLM success_callback → Langfuse (prompt/response/latency/tokens/cost)
```

### 4.2 User access flows
- Browser → Ghost(:8090) → portal → Dify / download center
- Browser → AI Admin Center(:10086) → manage all Docker containers
- Browser → Grafana(:3030) / Langfuse(:3010) → monitoring / observability

### 4.3 Other chains
- Auto-update: GitHub → Gitea Actions → Update Server(:8091) → DSH Desktop auto-download & install
- RAG: DSH Desktop → MCP Gateway(:3100/mcp) → Dify Knowledge API → knowledge base
- Auth: Keycloak OIDC SSO → SSO-wired web products (Admin Center/NewAPI/Dify/Gitea/Grafana/Langfuse/LiteLLM; Ghost uses local accounts + email codes, other tools use API keys/tokens)
- Logs: Promtail collects → Loki aggregates → AI Admin Center queries

## 5. The 16 Open-Source Components

Keycloak / NewAPI / LiteLLM+Presidio / Dify / Ghost / Gitea+Runner / DSH Desktop / Update Server (nginx) / MCP Gateway / AI Admin Center (self-built) / Prometheus+Grafana+Alertmanager+cadvisor / Langfuse / Loki+Promtail / MailHog / MySQL+Redis+PostgreSQL (foundation) / Ollama (optional)

## 6. Security Model (3 points)

1. **Data stays inside**: model calls are redacted by LiteLLM before leaving; data classified public/internal/confidential.
2. **Unified auth**: Keycloak SSO; admin role `ai-platform-admin` + per-module `admin:<product>`.
3. **Secret management**: real values only in runtime `.env`; repo commits only `.env.example`; default plain HTTP on intranet, HTTPS recommended for production.

## 7. Deployment Shapes (awareness)

- **Windows (current mainline)**: Windows 11 + Docker Desktop (WSL2), `windows/` folder, 41 containers.
- **Linux / online server (planned)**: `linux/`, `docker/` folders.

## 8. Self-Check

- [ ] Can write all 16 ports from memory
- [ ] Can draw the 5-step LLM request flow and explain redaction & restoration
- [ ] Can name the components of each of the 6 layers
- [ ] Can explain the relation between data classification and redaction
