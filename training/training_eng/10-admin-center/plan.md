# AI Admin Center — Training Plan (M11, 4 h, D8 AM + afternoon prefix)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Positioning + menu map | lecture |
| 09:30-10:15 | Lab 1: init (Global Admin + OIDC client + role) | lab |
| 10:15-11:00 | Lab 2: walk every page | lab |
| 11:00-11:45 | Lab 3: delegated admin add/revoke | lab |
| 11:45-12:00 | summary | lecture |
| PM (2 h) | Lab 4: backup + restore drill + availability + logs + report + IM alert | lab |

## 2. Lab Checklist

- [ ] Global Admin login → dashboard shows 8 metrics + Docker groups (S)
- [ ] Unauthenticated → 302 (S)
- [ ] All menu pages open
- [ ] Add Ghost-only admin → sees only Ghost in Admin Center + staff in Ghost (S)
- [ ] Revoke → product account cleaned
- [ ] Backup run → backups/ new dir
- [ ] "Test all" interpreted
- [ ] Log search hit
- [ ] 7-day report exported
- [ ] Language switch round-trip

## 3. Homework

- Read ch12-admin-center.md → data-source diagram
- Write an "admin delegation SOP"
- Read ch27/ch28 → daily/weekly/monthly ops list

## 4. Failure Drills

- Client without Standard flow → login no callback
- Secret not in .env → login fail
- Provision not effective → check product method

## 5. Handoff

- Backup/health-check used on D9
- IM alerts tie M13
