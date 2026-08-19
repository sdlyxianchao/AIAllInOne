# Loki + Promtail — Training Package (M15 · Unified Logging)

## Outline & Textbook

**Positioning**: unified container log aggregation. All container logs land in one place; the Admin Center "Unified Logs" page queries by container + keyword + time.

**Architecture**:
```
container logs (json-file) → Promtail (docker_sd discovery + labels) → Loki(:3110 store/query)
       └── Admin Center "Unified Logs" page (LogQL)
```
Design philosophy: **index labels only, not content** — far lighter than ELK (roughly 135 MB total for the trio in typical setups). Single-node `store: tsdb` + filesystem (2.9.x stable).

**Query (Admin Center)**: Unified Logs → container dropdown → keyword → time range. Backend `/api/logs/query` uses LogQL. Typical: find errors, back-trace a failure window.

**LogQL basics**:
```
{container="new-api"}                       # label filter
{service="litellm"} |= "error"              # + keyword
{job="docker"} != "healthcheck"             # exclude
rate({container="new-api"}[1m])             # log rate (can chart)
```

**Key config (monitoring/promtail.yml)**: `docker_sd_configs` via docker.sock → labels `container`/`service`/`project`. ⚠️ **Docker Desktop mount pitfall**: Promtail must mount `/var/run/docker.sock` + `/var/lib/docker/containers` (WSL2 VM-internal paths where logs actually live); **do not** use a Windows `C:\...\containers` path. Loki single-node: filesystem storage, replication_factor 1, inmemory ring.

**FAQ**:
| Issue | Fix |
|---|---|
| container missing in Unified Logs | Promtail collecting it? (docker_sd labels); time range; keyword |
| promtail mount error | check mount paths (VM-internal) |
| slow queries | narrow time range; use labels not full-text |
| disk growth | Loki data volume; configure retention |

**Platform docs**: `../../docs/admin-manual/ch24-ops-loki.md`; configs `../../windows/monitoring/loki.yml`, `promtail.yml`. **Official**: grafana.com/docs/loki (LogQL).

## Training Plan (1 h, D8 PM)

| Time | Content | Method |
|---|---|---|
| 16:00-16:25 | architecture + LogQL + mount pitfall | lecture |
| 16:25-17:00 | Lab: Unified Logs query (container + keyword + time) | lab |

**Lab checklist**: Unified Logs → litellm container → keyword search → logs visible (S); back-trace a historical window; read promtail.yml docker_sd/labels; explain why not to use a Windows path.

## Exam

**Theory (5 pts × 4 = 20)**: 1. Loki vs ELK → B labels-only indexing, low footprint; 2. Promtail source → B /var/lib/docker/containers/*/*-json.log; 3. Docker Desktop mount → B VM-internal path; 4. find errors for a container → A container dropdown + keyword + time.

**Hands-on (30)**: 1. locate new-api errors in last hour via Unified Logs + screenshot (15); 2. explain promtail docker_sd discovery & labels (15).

**Defense (10)**: "Platform down around 10:20 — locate with logs?" (availability test first → Unified Logs by time across containers → root cause).

**Scorecard**: Theory(20) + Hands-on(30) + Defense(10).

## References
See `references.md` — CN walkthroughs (Loki+Promtail+Grafana stack), LogQL, official docs.
