# Loki + Promtail — Training Outline (M15 · Unified Logging)

## 1. Positioning

Unified container log aggregation. All container logs land in one place; the Admin Center "Unified Logs" page queries by container + keyword + time.

## 2. Architecture

```
container logs (json-file) → Promtail (docker_sd discovery + labels) → Loki(:3110 store/query)
       └── Admin Center "Unified Logs" page (LogQL)
```

Design philosophy: **index labels only, not content** — far lighter than ELK (roughly 135 MB total for the trio in typical setups). Single-node `store: tsdb` + filesystem (2.9.x stable).

## 3. Learning Objectives

- Understand the logging architecture (Promtail → Loki → Admin Center)
- Query logs via Admin Center Unified Logs page
- Understand LogQL basics
- Know the Docker Desktop mount pitfall for Promtail

## 4. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../docs/admin-manual/ch24-ops-loki.md`
- Configs: `../../windows/monitoring/loki.yml`, `promtail.yml`
- Official: grafana.com/docs/loki (LogQL)
