# Monitoring & Alerting — Training Outline (M13 · Prometheus + Grafana + Alertmanager)

## 1. Positioning

Container-level resource monitoring & alerting (cadvisor + Prometheus + Grafana + Alertmanager). Watch CPU/memory/network/disk of all 41 containers; container-down/over-limit alerts auto-push to enterprise IM.

## 2. Architecture & Data Flow

```
containers → cadvisor(collect CPU/mem/net/disk) → Prometheus(:9091, + alert rules)
       → Grafana(:3030 dashboard "AI All In One — Container Monitoring")
       → Alertmanager → Admin Center(/api/alert-webhook) → IM (DingTalk/WeCom/Feishu)
```

## 3. Learning Objectives

- Understand the monitoring architecture (cadvisor → Prometheus → Grafana → Alertmanager → IM)
- Login & navigate Grafana dashboards
- Understand preset alert rules and anti-false-positive filters
- Configure IM alert receivers (webhooks & enterprise apps)
- Troubleshoot common issues

## 4. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../docs/admin-manual/ch22-ops-monitoring.md`
- Configs: `../../windows/monitoring/` (prometheus.yml, alerts.yml, alertmanager.yml)
- Official docs: prometheus.io/docs, PromQL, alertmanager; grafana.com/docs; cadvisor GitHub
