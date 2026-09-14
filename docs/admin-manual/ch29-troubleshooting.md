# Chapter 29: Troubleshooting Guide

*Part 3 · Operations*

> Quick lookup by symptom to locate the root cause fast.

[← Chapter 28: Health Checks and Startup Self-Checks](ch28-healthcheck.md) · [📖 Index](index.md) · [Appendix: Vendor Documentation Index →](ch30-appendix.md)

---

## 29.1 Three General Troubleshooting Steps

1. **Check container status**: `docker ps -a` to find Exited/Restarting;

2. **Check logs**: `docker logs <container-name> --tail 30`;

3. **Check health**: run `health-check.ps1` to locate the failed stage.

## 29.2 Symptom Quick-Reference Table

| Symptom | Root cause | Fix |
| --- | --- | --- |
| can't open any product via localhost | WSL2 IPv6 `::1` compatibility issue | use intranet IP or 127.0.0.1 |
| Ghost keeps Restarting, reports ECONNREFUSED :3306 | leftover MySQL config in the volume | force SQLite via environment variables (Chapter 4) |
| 4 Dify containers crash on startup with ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | change to 50 (Chapter 5) |
| NewAPI channel test reports No connected db | channel key has the example value | fill in the actual `LITELLM_MASTER_KEY` value |
| NewAPI OIDC reports invalid_grant / Incorrect redirect_uri | server address is localhost | set the intranet address (Chapter 7) |
| NewAPI login 429 | critical-endpoint rate limit | clear redis rateLimit:* or change .env |
| Dify keeps connecting ws://localhost when creating apps | WebSocket address not changed | set NEXT_PUBLIC_SOCKET_URL to intranet IP |
| Dify login click does nothing | password needs base64 / 401 when not logged in is normal | base64 first in scripts; retry in browser |
| Gitea reports readonly database | gitea.db owned by root | delete the root-owned db and rebuild |
| Gitea repo links are localhost | ROOT_URL not changed | set the intranet address |
| SSO login reports unknown_error | AD port forwarding broken (iphlpsvc) | check iphlpsvc + Hyper-V network |
| Keycloak can't see domain users | Search scope = One Level | change to Subtree |
| Langfuse shows no data | V4_WRITE_MODE or SSO account not in the organization | set dual; SQL to add organization (Chapter 23) |
| DSH Desktop model connection timeout | client goes through a dead system proxy | set to no proxy/direct |
| Loki can't find logs | used the job label | use `{container=~".+"}` |
| Presidio 404 /analyze/analyze | endpoint has a path | fill base URL only |
| new endpoint 404 after changing server.js | up -d does not re-read volume changes | docker restart admin-portal |

## 29.3 Common Commands

```
docker ps -a                                        # all container statuses
docker logs <container> --tail 50                   # view logs
docker compose up -d <service>                      # rebuild a service
docker compose restart <service>                    # restart a service (does not re-read .env)
docker system df                                     # Docker disk usage
C:\AIAllInOne\windows\scripts\health-check.ps1       # one-click health check
```

---

[← Chapter 28: Health Checks and Startup Self-Checks](ch28-healthcheck.md) · [📖 Index](index.md) · [Appendix: Vendor Documentation Index →](ch30-appendix.md)
