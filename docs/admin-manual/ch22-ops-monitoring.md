# Chapter 22: Monitoring and Alerting Administration

*Part 2 · Administration*

> Prometheus + Grafana + Alertmanager: container resource monitoring and alert notifications.

[← Chapter 21: Update Server Administration](ch21-ops-update.md) · [📖 Index](index.md) · [Chapter 23: LLM Observability (Langfuse) →](ch23-ops-langfuse.md)

---

**Entry**: Grafana `http://<server-IP>:3030` (SSO auto-login); Prometheus `:9091`; Alertmanager `:9093`.

## 22.1 Components and Ports

| Component | Port | Purpose |
| --- | --- | --- |
| cadvisor | 8080 (internal) | collects CPU/memory/network/disk for each container |
| Prometheus | 9091 | aggregates metrics + alert rules (`monitoring/alerts.yml`) |
| Grafana | 3030 | visualization dashboard (prebuilt "AI All In One — Container Monitoring") |
| Alertmanager | 9093 | alert dedup/grouping/routing/notification |

## 22.2 View the Dashboard

1. Log in to Grafana (`ai_all_in_one_admin` / unified password, SSO auto-login);

2. Open the "AI All In One — Container Monitoring" panel to view each container's CPU/memory/network.

## 22.3 Alert Rules

Prebuilt rules (`monitoring/alerts.yml`): container down (critical), container memory >90% (warning), container CPU >80% (warning).

> ⚠️ Alert false-positive pitfall: cadvisor reports all cgroups on the host (including systemd); alert rules must filter with `{name!=""}`, and memory alerts must also add `container_spec_memory_limit_bytes > 0` (otherwise limit=0 causes a divide-by-zero that always triggers).

## 22.4 Connect Alert Notifications (Enterprise IM)

The alert path is **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → enterprise IM**. Configure it in the AI Admin Center menu **"Operations → Enterprise IM Alerts"** (configuration is stored in Redis and survives restarts):

- **Receivers**: add multiple receivers. Type "DingTalk/WeCom/Feishu" = group bot (fill webhook URL, sends to a group chat); type "DingTalk App (to person)" (AppKey/AppSecret/AgentId/userid) or "WeCom App (to person)" (corpId/secret/agentid/userid) = enterprise app, sends to individuals.

- **Sending rules**: master switch, minimum severity (critical/warning/info), whether to send "firing" and "resolved" notifications.

- **Send history**: records every send (time/receiver/type/alert name/severity/result), with pagination, adjustable page size, keyword search, and category filtering (by type / result / severity).

- Each receiver has a **Test** button to send a test message, and an enable toggle.

> ⚠️ A group-bot webhook can only send to a **group chat** — it cannot send to a single person. To message individuals you must use the enterprise-app types (DingTalk/WeCom), which require an internal app created in the DingTalk/WeCom admin console with message permission. DingTalk group bots also need "custom keywords" (e.g. "AI 平台" / "告警") or "signing", otherwise the security policy blocks the message.

> 📌 Port conflict note: Prometheus's default 9090 was occupied by Keycloak, so it was changed to 9091; Grafana's default 3000/3001 were occupied, so it was changed to 3030.

> 📖 Vendor docs:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← Chapter 21: Update Server Administration](ch21-ops-update.md) · [📖 Index](index.md) · [Chapter 23: LLM Observability (Langfuse) →](ch23-ops-langfuse.md)
