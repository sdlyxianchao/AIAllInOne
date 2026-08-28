# AI Admin Center — Exam (M11)

> Theory 10 Q/30 + Hands-on 50 + Defense 20; ≥70 to pass.

## 1. Theory (30 pts)

### Single choice (3 pts × 6)

1. vs Portainer → B app-layer unified auth
2. Init role → B ai-platform-admin
3. Per-module role naming → B admin:<product>
4. Keycloak revocation → B revoke role (never delete IdP account)
5. SQLite backup corruption cause → B docker exec stdout utf8 → need base64+tar-fs
6. Availability "DSH Desktop·Dify chat" → B real request via NewAPI

### True/False (3 pts × 4)

7. Homepage must be Keycloak-protected. **T**
8. index.html edits need container restart. **F**
9. Non-admin sees "not an admin". **T**
10. Backups should be mirrored off-box. **T**

## 2. Hands-on (50 pts)

| # | Item | Points |
|---|---|---|
| 1 | Init + 302 verify | 15 |
| 2 | Ghost-only delegated admin + product verify | 20 |
| 3 | Backup + availability + log query | 15 |

## 3. Defense (20 pts)

1. "Give a new colleague Dify+Ghost access only — how?"
2. "One product page broken — debug? affects others?"
3. "Backup/DR approach & restore flow?"
