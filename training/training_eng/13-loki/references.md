# Loki + Promtail — References (learning resources)

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch24 (ops) | `../../docs/admin-manual/ch24-ops-loki.md` |
| Deployment Guide §13.9 | `../../windows/windows-deploy-guide-v2.en.html` |
| Loki config | `../../windows/monitoring/loki.yml` |
| Promtail config | `../../windows/monitoring/promtail.yml` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| Loki docs | https://grafana.com/docs/loki/latest/ |
| LogQL | https://grafana.com/docs/loki/latest/logql/ |
| Promtail | https://grafana.com/docs/loki/latest/clients/promtail/ |
| Source | https://github.com/grafana/loki |

## Articles
| Article | Link |
|---|---|
| Loki+Promtail+Grafana stack hands-on (CN) | https://gitcode.csdn.net/6a2a6730662f9a54cb7d0134.html |
| Loki+Promtail in 5 min (CN) | https://blog.csdn.net/weixin_28419039/article/details/158341883 |
| Loki+Promtail+Rsyslog practice (CN) | https://wenku.csdn.net/column/aac7703s897 |
| Collect logs with Loki/Promtail (EN, video+repo) | https://github.com/isItObservable/Episode2--Kubernetes-Loki |

## Self-study path
1. `package.md` → labels-only philosophy + in-platform query; 2. labs (Unified Logs by container+keyword); 3. LogQL (label filter, |= keyword, count_over_time, rate) — core ops skill; 4. pitfalls: mount path (WSL2-internal), retention.
