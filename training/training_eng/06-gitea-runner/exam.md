# Gitea + Runner — Exam (M08)

> Theory 10 Q/30 + Hands-on 50 + Defense 20; ≥70 to pass.

## 1. Theory (30 pts)

### Single choice (3 pts × 6)

1. Token update requires → B up -d
2. ROOT_URL → B http://<SERVER_IP>:3002/
3. Sync download rule → B only newer
4. `version_source: official` → A official cache (CN-reachable, lagging)
5. Job image pull fix → B force_pull:false + pre-pull
6. Workflow dir → B .gitea/workflows/

### True/False (3 pts × 4)

7. Sync repo must be normal, not mirror. **T**
8. Mount docker.sock again in options. **F**
9. Gitea admin email must match Keycloak/AD. **T**
10. act_runner container.network needs no config. **F**

## 2. Hands-on (50 pts)

| # | Item | Points |
|---|---|---|
| 1 | Register Runner → Idle | 20 |
| 2 | Trigger sync + explain 3 switches | 15 |
| 3 | Write & run push workflow | 15 |

## 3. Defense (20 pts)

1. "How does DSH Desktop sync in from GitHub, and speed up in CN?"
2. "Runner jobs fail — debug path?"
3. "A dev team wants CI — where to start?"
