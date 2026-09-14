# Monitoring & Alerting — Textbook (M13 · Prometheus + Grafana + Alertmanager)

## 1. Login & common ops

Grafana `http://<SERVER_IP>:3030` (unified account; OAuth auto-login). Dashboards → "AI All In One — Container Monitoring". Filter by container/metrics. Prometheus `:9091` → Targets / Alerts / Graph.

## 2. Preset alert rules (monitoring/alerts.yml)

Container down (critical), memory >90% (warning), CPU >80% (warning).

⚠️ **Two anti-false-positive filters — keep them**:
1. `{name!=""}` (cadvisor reports all host cgroups incl. systemd, no name label → would false-alarm)
2. `container_spec_memory_limit_bytes > 0` (limit=0 → division → +Inf always fires)

## 3. IM alert config (Admin Center)

Ops → Enterprise IM alerts (stored in Redis, survives restart):
- **Multiple receivers**: group robots with webhook, or enterprise apps for personal (DingTalk AppKey/AppSecret/AgentId/userid, WeCom corpId/secret/agentid/userid)
- **Rules**: master switch, min level, fire/resolve notices
- **Send history**: searchable
- Legacy `.env` `ALERT_IM_WEBHOOK_URL` works as default receiver
- Group-robot webhooks only send to **groups**; personal needs enterprise-app config

## 4. FAQ

| Issue | Fix |
|---|---|
| Prometheus 9090 taken | platform uses **9091** (Keycloak owns 9090); Grafana **3030** (3000 = NewAPI) |
| systemd false alarms | rules need `{name!=""}` |
| memory alert always fires | add `container_spec_memory_limit_bytes > 0` |
| no IM alerts | webhook/level filter/master switch; check send history |
| robot only to group | personal → enterprise app config |
