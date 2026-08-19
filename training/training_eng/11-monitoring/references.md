# Monitoring & Alerting — References (learning resources)

> Covers Prometheus + Grafana + Alertmanager + cadvisor.

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch22 (ops) | `../../docs/admin-manual/ch22-ops-monitoring.md` |
| Deployment Guide §13.3 | `../../windows/windows-deploy-guide-v2.en.html` |
| Alert rules | `../../windows/monitoring/alerts.yml` |
| Prometheus config | `../../windows/monitoring/prometheus.yml` |
| Alertmanager config | `../../windows/monitoring/alertmanager.yml` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| Prometheus docs | https://prometheus.io/docs/ |
| PromQL | https://prometheus.io/docs/prometheus/latest/querying/basics/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| cadvisor | https://github.com/google/cadvisor |

## Videos / articles
| Resource | Link |
|---|---|
| 2025 Prometheus master course (Bilibili) | https://www.bilibili.com/video/BV1DpycBaEgK/ |
| Same series alt entry | https://www.bilibili.com/video/BV17zECznERx/ |
| Grafana 12-episode collection | via https://juejin.cn/post/7143294420794736676 |
| Docker Prometheus+Grafana (CN) | https://blog.lcayun.com/3210.html |

## Self-study path
1. `package.md` → roles, ports, 2 anti-false-positive rules, IM alerts; 2. labs (dashboard → Alerts → webhook → stop container); 3. Prometheus video course (PromQL + rules); 4. pitfalls: ports (9091/3030), false alarms (name!="" / limit>0).
