# Loki + Promtail — Textbook (M15 · Unified Logging)

## 1. Query (Admin Center)

Unified Logs → container dropdown → keyword → time range. Backend `/api/logs/query` uses LogQL. Typical: find errors, back-trace a failure window.

## 2. LogQL basics

```
{container="new-api"}                       # label filter
{service="litellm"} |= "error"              # + keyword
{job="docker"} != "healthcheck"             # exclude
rate({container="new-api"}[1m])             # log rate (can chart)
```

## 3. Key config (monitoring/promtail.yml)

`docker_sd_configs` via docker.sock → labels `container`/`service`/`project`.

⚠️ **Docker Desktop mount pitfall**: Promtail must mount `/var/run/docker.sock` + `/var/lib/docker/containers` (WSL2 VM-internal paths where logs actually live); **do not** use a Windows `C:\...\containers` path.

Loki single-node: filesystem storage, replication_factor 1, inmemory ring.

## 4. FAQ

| Issue | Fix |
|---|---|
| container missing in Unified Logs | Promtail collecting it? (docker_sd labels); time range; keyword |
| promtail mount error | check mount paths (VM-internal) |
| slow queries | narrow time range; use labels not full-text |
| disk growth | Loki data volume; configure retention |
