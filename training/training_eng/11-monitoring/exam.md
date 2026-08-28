# Monitoring & Alerting — Exam (M13)

> Theory 20 + Hands-on 40 + Defense 10.

## 1. Theory (4 pts × 5 = 20)

1. Prometheus port → B 9091
2. Container metrics collector → B cadvisor
3. Systemd false alarm fix → B add `{name!=""}`
4. Group robot scope → A groups only; personal needs enterprise app
5. Memory +Inf cause → A missing limit>0 filter

## 2. Hands-on (40 pts)

| # | Item | Points |
|---|---|---|
| 1 | Dashboard → find highest-memory container | 10 |
| 2 | Configure IM receiver + test send | 15 |
| 3 | Supervised: stop non-critical container, observe alert & recovery | 15 |

## 3. Defense (10 pts)

"2 AM container-down alert — what do you do?" (confirm → status/logs → root cause → recover → update rules/playbook).
