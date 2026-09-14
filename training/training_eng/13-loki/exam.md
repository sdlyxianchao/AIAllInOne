# Loki + Promtail — Exam (M15)

> Theory 20 + Hands-on 30 + Defense 10.

## 1. Theory (5 pts × 4 = 20)

1. Loki vs ELK → B labels-only indexing, low footprint
2. Promtail source → B /var/lib/docker/containers/*/*-json.log
3. Docker Desktop mount → B VM-internal path
4. Find errors for a container → A container dropdown + keyword + time

## 2. Hands-on (30 pts)

| # | Item | Points |
|---|---|---|
| 1 | Locate new-api errors in last hour via Unified Logs + screenshot | 15 |
| 2 | Explain promtail docker_sd discovery & labels | 15 |

## 3. Defense (10 pts)

"Platform down around 10:20 — locate with logs?" (availability test first → Unified Logs by time across containers → root cause).
