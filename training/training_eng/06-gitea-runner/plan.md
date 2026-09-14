# Gitea + Runner — Training Plan (M08, 3 h, D6 PM)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 14:00-14:30 | Overview + Actions concept | lecture |
| 14:30-15:15 | Lab 1: init + enable Actions + Runner + token | lab |
| 15:15-16:00 | Lab 2: manual trigger dsh-sync, read logs/artifacts | lab |
| 16:00-16:30 | Lab 3: write a push workflow and run it | lab |
| 16:30-17:00 | SSO + pitfalls + FAQ | lecture |

## 2. Lab Checklist

- [ ] Gitea initialized with unified admin (S)
- [ ] ROOT_URL intranet
- [ ] Actions enabled + Runner Idle (S)
- [ ] Sync triggered, version.txt updated
- [ ] sync-config.json 3 switches explained
- [ ] `test-ci` repo with demo.yml runs (S)
- [ ] (Optional) Keycloak login

## 3. Homework

- Draft a "release → build → upload Update Server" workflow
- Read ch19-ops-gitea.md → 5 ops points
- Explain why "only newer" download prevents downgrade

## 4. Failure Drills

- Restart instead of up -d → stale token
- force_pull on → image pull fail
- ROOT_URL localhost → wrong links

## 5. Handoff

- Sync output → Update Server (M12) → Ghost download page (M07) → DSH Desktop update (M09)
