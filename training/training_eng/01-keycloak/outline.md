# Keycloak — Training Outline (M03 · Unified Auth)

## 1. Positioning
Keycloak is the platform's **identity & authentication hub**: every web product (AI Admin Center, NewAPI, Dify, Ghost, Gitea, Grafana, Langfuse) uses it for Single Sign-On (SSO). Mastering Keycloak is a prerequisite for deploying and operating this platform.

## 2. Learning Objectives
After this module you can:
1. Explain Keycloak's role and core concepts (Realm/Client/User/Role/Identity Provider).
2. Create Realms, users, groups, and OIDC Clients; configure Valid Redirect URIs.
3. Configure AD/LDAP User Federation, sync domain users, and verify login.
4. Register OIDC Clients and wire each product into SSO (Admin Center, NewAPI, Grafana, Langfuse).
5. Troubleshoot common SSO failures (invalid_grant, redirect_uri mismatch, LDAP unreachable, 429).
6. Understand multi-IdP coexistence (AD + Entra ID + Google + SAML) and Identity Provider Redirector.

## 3. Prerequisites
- M01 (platform overview) and M02 (Docker basics); Keycloak container running.
- Basic OAuth 2.0 / OIDC concepts (authorization-code flow, tokens, scopes).

## 4. Content & Hours (6 hours)

| Sec | Content | H | Type |
|---|---|---|---|
| 1 | Keycloak overview & platform role (port 9090, realm `enterprise-ai`, unified admin convention) | 0.5 | lecture |
| 2 | Core concepts: Realm / Client / User / Role / Group / IdP | 1.0 | lecture+demo |
| 3 | Admin console: create Realm, users, groups, roles; credentials | 1.0 | lab |
| 4 | OIDC Client: Client authentication, Standard flow, Redirect URIs, Web origins, Client Secret | 1.0 | lab |
| 5 | AD/LDAP User Federation: Bind DN, sAMAccountName, Subtree, sync (key, common mistakes) | 1.5 | lecture+lab |
| 6 | Multi-IdP (Entra ID / Google / GitHub / SAML) + coexistence strategy | 0.5 | lecture |
| 7 | Troubleshooting: invalid_grant / redirect_uri / 429 / LDAP unknown_error / Account console test | 0.5 | lecture+lab |

## 5. Pass Criteria (Tier A)
- Full flow: create Realm → user → OIDC Client → NewAPI SSO login, independently.
- AD federation configured and verified 3 ways (Account Console / Admin Console / downstream app SSO).
- Can recite the per-product SSO table (textbook §5.5).

## 6. Resources
- Textbook: `textbook.md`; labs: `plan.md`; assessment: `exam.md`
- Official docs: Keycloak Server Administration Guide (keycloak.org/docs/latest/server_admin/)
- Platform docs: `../../docs/admin-manual/ch06-keycloak.md`, `ch14-ops-keycloak.md`, `../../windows/windows-ad-integration.en.html`
- Full reference list: `references.md`
