# Update Server — Training Outline (M12 · Installer Distribution)

## 1. Positioning

DSH Desktop installer hosting & auto-update (port 8091, nginx). Employees download installers here; the DSH Desktop client auto-updates from here.

## 2. Distribution Chain

```
GitHub Releases → dsh-sync (Gitea Actions) → Update Server(:8091/dsh/)
      └─ writes version.txt / updates Ghost download page(/dsh/) ─> employees / DSH Desktop auto-update
```

## 3. Auto-update Mechanics

DSH Desktop `build.publish.url = http://<SERVER_IP>:8091/dsh/` (generic provider); client reads **latest.yml** at startup → compares local version → auto-download/install. **version.txt** is maintained by dsh-sync to track "latest synced".

## 4. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../docs/admin-manual/ch21-ops-update.md`, `ch10-dsh.md`
- Nginx config: `../../windows/update-server-nginx.conf`
