# AI AllInOne Admin Manual

*Version 0.2 · Deployment · Administration · Operations*

This manual is divided into three parts: **Deployment** (Chapters 1–13, get the platform running from scratch), **Administration** (Chapters 14–26, day-to-day operations for each of the 13 products), and **Operations** (Chapters 27–29, backup / health checks / troubleshooting), plus an **Appendix** of vendor documentation links. Each chapter page has previous/next navigation at the bottom — read through from start to finish, or jump straight to the topic you need.

## Part 1 · Deployment

| # | Chapter | Description |
| --- | --- | --- |
| 1 | [Platform Overview and Architecture](ch01-overview.md) | Understanding the platform's components, ports, and data flow is a prerequisite for all subsequent deployment and administration tasks. |
| 2 | [Prerequisites](ch02-prereq.md) | Install Docker Desktop, prepare the directory structure, open up the network, fix the IP — tasks that must be done before deployment. |
| 3 | [Configuration Files and Environment Variables](ch03-env.md) | The three core configuration files + the full set of environment variables — which to configure now and which to configure later. |
| 4 | [Starting Core Services](ch04-start.md) | Copy .env, bring up the containers, verify each service is reachable, and handle the known Ghost SQLite issue. |
| 5 | [Standalone Dify Deployment](ch05-dify-deploy.md) | Dify is deployed standalone with its official compose (about 15 containers) to avoid port conflicts. |
| 6 | [Keycloak: Realm, Users, and AD](ch06-keycloak.md) | Create a Realm, create local accounts, or import domain accounts from Active Directory — the foundation of SSO for all products. |
| 7 | [NewAPI: Initialization, Channels, and OIDC](ch07-newapi.md) | Complete the initial setup wizard, configure a channel pointing to LiteLLM, issue API Keys, and integrate Keycloak OIDC. |
| 8 | [LiteLLM: Verification and Caching](ch08-litellm.md) | Verify the LiteLLM proxy works and enable response caching to save tokens. |
| 9 | [Dify / Ghost / Gitea Configuration](ch09-products.md) | Initialization and interconnect configuration for each of the three products. |
| 10 | [DSH Desktop Distribution and CI/CD](ch10-dsh.md) | Distribute the DSH Desktop installer to employees, and use Gitea Actions to auto-sync new official versions. |
| 11 | [MCP Gateway and Skill Marketplace](ch11-mcp.md) | A gateway that centrally manages Skills and MCP tools; DSH Desktop/Dify connect to one address to get all tools. |
| 12 | [AI Admin Center](ch12-admin-center.md) | Unified admin portal: Keycloak authentication, all products embedded in the left menu, Dashboard cluster status. |
| 13 | [Interconnect Verification Checklist](ch13-interconnect.md) | After deployment is complete, confirm one by one that all 12 interconnect chains work. |

## Part 2 · Administration

| # | Chapter | Description |
| --- | --- | --- |
| 14 | [Keycloak Day-to-Day Administration](ch14-ops-keycloak.md) | Authentication hub: manage users, roles, OIDC clients, AD federation, and sessions. |
| 15 | [NewAPI Day-to-Day Administration](ch15-ops-newapi.md) | LLM gateway: manage channels, tokens, quotas, users, logs, and cost. |
| 16 | [LiteLLM Day-to-Day Administration](ch16-ops-litellm.md) | PII redaction proxy: model list, redaction rules, caching, Langfuse reporting. |
| 17 | [Dify Day-to-Day Administration](ch17-ops-dify.md) | AI application platform: apps, knowledge bases, model providers, member permissions, publishing. |
| 18 | [Ghost Day-to-Day Administration](ch18-ops-ghost.md) | Enterprise portal / Hub: posts, pages, navigation, themes, members. |
| 19 | [Gitea Day-to-Day Administration](ch19-ops-gitea.md) | Internal Git + CI/CD: repositories, organizations, Runners, Actions. |
| 20 | [MCP Gateway Day-to-Day Administration](ch20-ops-mcp.md) | Add/remove MCP Servers, upload/delete Skills, extend built-in tools. |
| 21 | [Update Server Administration](ch21-ops-update.md) | Hosting and auto-updating DSH Desktop installers. |
| 22 | [Monitoring and Alerting Administration](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager: container resource monitoring and alert notifications. |
| 23 | [LLM Observability (Langfuse)](ch23-ops-langfuse.md) | Trace the prompt, response, latency, tokens, and cost of every model call. |
| 24 | [Unified Logging (Loki)](ch24-ops-loki.md) | Aggregate all container logs and search by container + keyword + time. |
| 25 | [PII Redaction (Presidio)](ch25-ops-pii.md) | Sensitive information is automatically redacted before leaving the intranet. |
| 26 | [MailHog Mail Catcher](ch26-ops-mailhog.md) | The "mail exit" when the intranet has no SMTP, catching Ghost verification codes / notification emails. |

## Part 3 · Operations

| # | Chapter | Description |
| --- | --- | --- |
| 27 | [Backup and Restore](ch27-backup.md) | Daily full-data backup, one-click restore. |
| 28 | [Health Checks and Startup Self-Checks](ch28-healthcheck.md) | One-click health check of all 41 containers + the LLM full chain + the authentication chain. |
| 29 | [Troubleshooting Guide](ch29-troubleshooting.md) | Quick lookup by symptom to locate the root cause fast. |

## Appendix

| # | Chapter | Description |
| --- | --- | --- |
| App. | [Vendor Documentation Index](ch30-appendix.md) | Official documentation URLs for all third-party products (plain-text URLs, can still be accessed after printing). |

---

> 🌐 Other languages: [简体中文](../i18n/admin-manual-zh-cn/index.md) · [繁體中文](../i18n/admin-manual-zh-TW/index.md) · [Français](../i18n/admin-manual-fr/index.md) · [Español](../i18n/admin-manual-es/index.md) · [Português](../i18n/admin-manual-pt/index.md) · [日本語](../i18n/admin-manual-ja/index.md) · [한국어](../i18n/admin-manual-ko/index.md) · [العربية](../i18n/admin-manual-ar/index.md)
