# Keycloak — Training Plan & Exam (M03)

## Training Plan (6 hours, Day 3)

| Time | Content | Method | Materials |
|---|---|---|---|
| 09:00-09:30 | Overview + platform role + core concepts | lecture | textbook §1–3 |
| 09:30-10:30 | Lab 1: create Realm, users, groups, roles | lab | deploy guide §6.1 |
| 10:30-11:30 | Lab 2: OIDC Client (NewAPI) + SSO login | lab | deploy guide §6.2 |
| 11:30-12:00 | Summary + common errors | lecture | textbook §6 |
| 14:00-15:30 | Lab 3: AD/LDAP User Federation (focus) | lab | windows-ad-integration.en.html |
| 15:30-16:30 | Lab 4: verify AD login 3 ways + troubleshooting drill | lab | textbook §4.3/§6 |
| 16:30-17:00 | Multi-IdP + Q&A | lecture | textbook §4.4 |

**Lab checklist (sign off each)**
- [ ] Create realm `enterprise-ai`
- [ ] Create groups `ai-admin`/`ai-user`, a local user with password, added to group
- [ ] Create client `newapi` (Client authentication on, Standard flow on), redirect URIs + web origins, copy secret
- [ ] NewAPI custom OAuth (Keycloak preset + host.docker.internal endpoint fix + field mapping); Keycloak button appears
- [ ] AD user logs into NewAPI via Keycloak (S key)
- [ ] Promote SSO admin (role=100); admin pages accessible
- [ ] AD/LDAP federation configured; Synchronize all users OK
- [ ] Account-console login verified (private window)
- [ ] Create OIDC Client for AI Admin Center, fill `KEYCLOAK_CLIENT_SECRET`, restart admin-portal

**Homework**
1. Draw the SSO wiring diagram (Keycloak ↔ 7 products, Client IDs, login UX).
2. Write a "Keycloak daily admin SOP" (add user, wire a product, fix redirect_uri; 150+ words).
3. Read `../../docs/admin-manual/ch14-ops-keycloak.md`; list 5 daily ops points.

**Failure drills (instructor plants faults)**
1. redirect URI missing intranet address → invalid_grant.
2. Bind DN written as `DOMAIN\svc_keycloak` → connection fails.
3. Username LDAP attribute set to `cn` → wrong login name.
4. Search scope One Level → sub-OUs missing.

**Handoff**: M04 (NewAPI OIDC) builds on this module; interconnect check #4 uses it.

---

## Exam (theory 15 Q / 30 pts + hands-on 50 + defense 20; ≥70 pass)

### Single choice (2 pts each, 12 pts)
1. Keycloak's role in the platform is (　) — B. identity & SSO center
2. The shared realm name is (　) — B. enterprise-ai
3. To get a Client Secret you must enable (　) — A. Client authentication
4. Username LDAP attribute for AD is (　) — C. sAMAccountName
5. Search scope for sub-OUs must be (　) — B. Subtree
6. Fix for SSO user getting 403 on NewAPI admin pages (　) — B. promote role=100 in DB + restart new-api

### True/False (2 pts each, 8 pts)
7. Unified admin email must be identical across products or SSO "crosses accounts". (T)
8. Keycloak data lives in volume `keycloak-data`; survives rebuilds. (T)
9. Bind DN can use `DOMAIN\user`. (F — must be LDAP DN)
10. Keycloak supports multiple IdPs at once. (T)

### Short answer (5 pts each, 10 pts)
11. Walk through the OIDC authorization-code flow in this platform.
12. Write the "AD group → Keycloak role → NewAPI group → model permission" mapping and where each step is configured.

### Hands-on (50 pts)
| # | Item | Points |
|---|---|---|
| 1 | Create realm + local user + group from scratch; login works | 10 |
| 2 | Create OIDC Client with correct redirect URIs; obtain secret | 15 |
| 3 | Configure AD/LDAP federation and sync successfully | 15 |
| 4 | Verify AD login via Account Console (private window) | 10 |

> Key items #3 and #4 must pass or the module fails.

### Q&A defense (20 pts)
1. "We have AD; can employees log into Dify with domain accounts? How?"
2. "A user reports invalid_grant; how do you debug?"
3. "A new product needs SSO; what steps and parameters?"
4. "Why must the unified admin email match? What breaks if not?"

### Scorecard

| Trainee | Theory(30) | Hands-on(50) | Defense(20) | Total | Result |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
