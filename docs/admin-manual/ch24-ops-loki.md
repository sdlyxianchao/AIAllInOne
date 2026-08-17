# Chapter 24: Unified Logging (Loki)

*Part 2 · Administration*

> Aggregate all container logs and search by container + keyword + time.

[← Chapter 23: LLM Observability (Langfuse)](ch23-ops-langfuse.md) · [📖 Index](index.md) · [Chapter 25: PII Redaction (Presidio) →](ch25-ops-pii.md)

---

**Entry**: the AI Admin Center's "📜 Unified Logging" page (most convenient), or Loki `http://<server-IP>:3110`.

## 24.1 Components

| Component | Port | Purpose |
| --- | --- | --- |
| Loki | 3110 | log storage and query (single-node, local filesystem) |
| Promtail | — (internal) | discovers containers via docker.sock, collects json logs and pushes to Loki |

## 24.2 Query Logs

1. AI Admin Center → Unified Logging;

2. select container (dropdown) → enter keyword → choose time range → query;

3. The backend `/api/logs/query` queries Loki using LogQL.

## 24.3 LogQL Quick Reference

```
{container="new-api"} |= "error"              # lines of a container containing error
{container=~".+"} |~ "(?i)error|exception"      # match all containers
{service="litellm"} |= "EMAIL"                  # query by service
```

> 📌 Loki's labels are `container / project / service`, **there is no `job`**. Query with `{container=~".+"}`, not `{job="docker"}`.

> ⚠️ Key pitfall (Docker Desktop mounts): Promtail must mount `/var/run/docker.sock` and `/var/lib/docker/containers` (under WSL2 these point inside the Docker Desktop VM, exactly where the logs are); do not use the host Windows `C:\...\containers` path. Single-node Loki uses `store: tsdb` + filesystem.

> 📖 Vendor docs:Loki official docs https://grafana.com/docs/loki/latest/

---

[← Chapter 23: LLM Observability (Langfuse)](ch23-ops-langfuse.md) · [📖 Index](index.md) · [Chapter 25: PII Redaction (Presidio) →](ch25-ops-pii.md)
