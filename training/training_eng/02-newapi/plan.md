# NewAPI — Training Plan (M04, 3 h, D4 AM)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + modes + init wizard | lecture |
| 09:30-10:00 | Lab 1: init wizard | lab |
| 10:00-10:40 | Lab 2: channel (LiteLLM) + test + dify-key/dsh-key | lab |
| 10:40-11:30 | Lab 3: OIDC (discover + endpoint fix + server address + promote) | lab |
| 11:30-12:00 | Usage/cost/groups + troubleshooting | lecture+lab |

## 2. Lab Checklist

- [ ] Init wizard done
- [ ] Channel added & tested (S)
- [ ] Two tokens created
- [ ] OIDC configured with token/userinfo fixed to host.docker.internal
- [ ] Server address = intranet
- [ ] AD user logs in via Keycloak button (S)
- [ ] Role promoted (S)
- [ ] Test user has quota 100
- [ ] Dashboard shows real requests

## 3. Homework

- curl `POST http://<SERVER_IP>:3000/v1/chat/completions` with your token
- Screenshot channels/tokens/logs
- Read ch15-ops-newapi.md → 5 ops points

## 4. Failure Drills

- Base URL localhost → fail
- Token endpoint not fixed → token exchange fail
- Server address default → invalid_grant
- SSO before promote → 403

## 5. Handoff

- dify-key feeds M06
- dsh-key feeds M09
- Interconnect checks #1/#3
