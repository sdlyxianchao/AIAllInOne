# Chapter 13: Interconnect Verification Checklist

*Part 1 · Deployment*

> After deployment is complete, confirm one by one that all 12 interconnect chains work.

[← Chapter 12: AI Admin Center](ch12-admin-center.md) · [📖 Index](index.md) · [Chapter 14: Keycloak Day-to-Day Administration →](ch14-ops-keycloak.md)

---

This ends the Deployment part. Finally, verify the 12 items below one by one; the platform is truly up only when all are ✅.

| # | Interconnect | Verification |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI channel test receives OK |
| 2 | Dify → NewAPI | Dify model provider test receives a reply |
| 3 | DSH Desktop → NewAPI | DSH Desktop sends a message and receives a reply |
| 4 | Keycloak → NewAPI | Keycloak account OIDC login to NewAPI |
| 5 | Keycloak → Dify | Keycloak account SSO login to Dify |
| 6 | MCP Gateway → DSH Desktop | DSH Desktop gets the MCP tool list and calls it |
| 7 | MCP Gateway → Dify | Dify workflow calls an MCP tool |
| 8 | Gitea Runner → Docker | Runner can execute CI/CD jobs |
| 9 | Gitea → update server | CI artifacts can be uploaded to the update server |
| 10 | Ghost API → Gitea | Gitea Actions can call the Ghost API to post announcements |
| 11 | Ghost → Dify redirect | the portal "AI Workbench" correctly redirects to Dify |
| 12 | AI Admin Center | Dashboard shows all containers + left menu can access all products |

> ✅ After all pass, continue to Part 2 "Administration" to learn day-to-day operations for each product, and Part 3 "Operations" for backup, health checks, and troubleshooting.

---

[← Chapter 12: AI Admin Center](ch12-admin-center.md) · [📖 Index](index.md) · [Chapter 14: Keycloak Day-to-Day Administration →](ch14-ops-keycloak.md)
