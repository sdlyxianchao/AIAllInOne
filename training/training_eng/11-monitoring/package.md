# Monitoring & Alerting — Training Package (M13 · Prometheus + Grafana + Alertmanager)

## Outline & Textbook

**Positioning**: container-level resource monitoring & alerting (cadvisor + Prometheus + Grafana + Alertmanager). Watch CPU/memory/network/disk of all 41 containers; container-down/over-limit alerts auto-push to enterprise IM.

**Architecture & data flow**:
```
containers → cadvisor(collect CPU/mem/net/disk) → Prometheus(:9091, + alert rules)
       → Grafana(:3030 dashboard "AI All In One — Container Monitoring")
       → Alertmanager → Admin Center(/api/alert-webhook) → IM (DingTalk/WeCom/Feishu)
```

**Login & common ops**: Grafana `http://<SERVER_IP>:3030` (unified account; OAuth auto-login). Dashboards → "AI All In One — Container Monitoring". Filter by container/metrics. Prometheus `:9091` → Targets / Alerts / Graph.

**Preset alert rules (monitoring/alerts.yml)**: container down (critical), memory >90% (warning), CPU >80% (warning).
- ⚠️ **Two anti-false-positive filters — keep them**: ① `{name!=""}` (cadvisor reports all host cgroups incl. systemd, no name label → would false-alarm); ② `container_spec_memory_limit_bytes > 0` (limit=0 → division → +Inf always fires).

**IM alert config (Admin Center)**: Ops → Enterprise IM alerts (stored in Redis, survives restart): multiple receivers (group robots with webhook, or enterprise apps for personal: DingTalk AppKey/AppSecret/AgentId/userid, WeCom corpId/secret/agentid/userid); rules (master switch, min level, fire/resolve notices); send history searchable. Legacy `.env` `ALERT_IM_WEBHOOK_URL` works as default receiver. Group-robot webhooks only send to **groups**; personal needs enterprise-app config.

**FAQ**:
| Issue | Fix |
|---|---|
| Prometheus 9090 taken | platform uses **9091** (Keycloak owns 9090); Grafana **3030** (3000 = NewAPI) |
| systemd false alarms | rules need `{name!=""}` |
| memory alert always fires | add `container_spec_memory_limit_bytes > 0` |
| no IM alerts | webhook/level filter/master switch; check send history |
| robot only to group | personal → enterprise app config |

**Platform docs**: `../../docs/admin-manual/ch22-ops-monitoring.md`; configs `../../windows/monitoring/` (prometheus.yml, alerts.yml, alertmanager.yml).

**Official docs**: prometheus.io/docs, PromQL, alertmanager; grafana.com/docs; cadvisor GitHub.

## Training Plan (2 h, D8 PM)

| Time | Content | Method |
|---|---|---|
| 16:00-16:30 | architecture + Grafana demo | lecture+demo |
| 16:30-17:00 | Lab: Grafana → filter a container → Prometheus Alerts → configure IM webhook | lab |

**Lab checklist**: Grafana login + dashboard open (S); filter new-api CPU/mem; Prometheus targets UP + 3 rules visible; IM webhook receiver configured; stop a container → alert observed in Grafana/IM (S, supervised).

## Exam

**Theory (4 pts × 5 = 20)**: 1. Prometheus port → B 9091; 2. container metrics collector → B cadvisor; 3. systemd false alarm fix → B add `{name!=""}`; 4. group robot scope → A groups only; personal needs enterprise app; 5. memory +Inf cause → A missing limit>0 filter.

**Hands-on (40)**: 1. dashboard → find highest-memory container (10); 2. configure IM receiver + test send (15); 3. supervised: stop non-critical container, observe alert & recovery (15).

**Defense (10)**: "2 AM container-down alert — what do you do?" (confirm → status/logs → root cause → recover → update rules/playbook).

**Scorecard**: Theory(20) + Hands-on(40) + Defense(10).

## References
See `references.md` (videos incl. Prometheus Bilibili series, Grafana 12-episode collection, Docker-based tutorial).
