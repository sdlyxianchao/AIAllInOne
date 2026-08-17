# Chapter 6: Keycloak: Realm, Users, and AD

*Part 1 · Deployment*

> Create a Realm, create local accounts, or import domain accounts from Active Directory — the foundation of SSO for all products.

[← Chapter 5: Standalone Dify Deployment](ch05-dify-deploy.md) · [📖 Index](index.md) · [Chapter 7: NewAPI: Initialization, Channels, and OIDC →](ch07-newapi.md)

---

> 📌 Access: host machine `http://127.0.0.1:9090`, intranet `http://<server-IP>:9090`. Data is stored in the named volume `keycloak-data` and is not lost when the container is recreated. Credentials are in `.env.windows` under `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`.

## 6.1 Create a Realm

1. Open `http://127.0.0.1:9090` in a browser → Administration Console → log in as admin;

2. Top-left dropdown → **Create Realm** → set Realm name to `enterprise-ai` → Create.

## 6.2 Approach A: Create Local Accounts (small teams / testing without AD)

1. **Groups** → Create Group → `ai-admin`; then create `ai-user`;

2. **Users** → Add user → username → Create;

3. Credentials tab → set password → turn Temporary off;

4. Groups tab → join the `ai-user` group.

## 6.3 Approach B: Import Accounts from Active Directory (recommended)

If the company already has a Windows AD domain controller, employees log in with their domain accounts and there is no need to create accounts manually in Keycloak. Prerequisite: the Docker container must have network connectivity to the domain controller (see the "Keycloak AD Integration Guide" `windows-ad-integration.html` for network topology, Hyper-V Internal Switch, and port forwarding).

> 📌 Required AD accounts: service account `svc_keycloak` (password never expires, used for LDAP binding) + 2 test domain users (to verify sync).

### Create LDAP User Federation

1. enterprise-ai Realm → left-side **User Federation** → Add provider → **ldap**;

2. Fill in per the table below.

| Setting | Value | Notes |
| --- | --- | --- |
| Vendor | **Active Directory** | Select AD, not Other (otherwise objectGUID won't be recognized) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V goes through port forwarding; in production use `ldap://dc.company-domain:389` |
| Enable StartTLS | **Off** | LDAP 389 or LDAPS 636 |
| Bind type | **simple** | username + password authentication |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Must be in LDAP DN format**, not ~~DOMAIN\user~~ |
| Bind credentials | `svc_keycloak password` | see `.env.windows` |
| Edit mode | **READ_ONLY** | read-only, does not write back to AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | if there are sub-OUs, use `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **do not use cn** |
| RDN LDAP attribute | `cn` | entry naming attribute |
| UUID LDAP attribute | `objectGUID` | AD immutable unique identifier |
| User object classes | `person, organizationalPerson, user` | comma-separated |
| Search scope | **Subtree** | **do not select One Level** (otherwise sub-OUs won't be found) |
| Pagination | **On** | fetch in batches when there are many users |
| Referral | **ignore** | avoid following a non-existent DC |
| Import users | **On** | full sync import |
| Sync Registrations | **On** | immediate sync on first login |

Save → **Synchronize all users** → wait for sync to finish.

> ⚠️ Common mistakes:
> - Bind DN must use **LDAP format** (`CN=svc_keycloak,CN=Users,DC=xxx`), not ~~DOMAIN\user~~;
> - Username LDAP attribute = `sAMAccountName`, not `cn`;
> - Search scope = **Subtree**;
> - **Keep spaces in CN as-is**: if the display name contains spaces (e.g. `ai all in one admin` has spaces in the middle), the Bind DN must be written as `CN=ai all in one admin,...`; writing underscores will fail to connect.

### Verify AD Login

1. Open `http://127.0.0.1:9090/realms/enterprise-ai/account` in an incognito window;

2. Log in with a domain account (username `aitest1` or UPN `aitest1@<company-domain>` both work);

3. Successfully redirecting to the Account Console means it passed.

## 6.4 Other Enterprise Identity Sources (summary from Appendix N)

Keycloak also supports many identity sources, all connected under the same `enterprise-ai` Realm:

| Identity source | Integration method | Key points |
| --- | --- | --- |
| Microsoft Entra ID (formerly Azure AD) | Identity Providers → OpenID Connect v1.0 | Register an app in Azure to get client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (built-in) | can use a Mapper with `hd=domain` to restrict the domain |
| GitHub | Identity Providers → GitHub (built-in) | OAuth App callback `/broker/github/endpoint` |
| Generic LDAP (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor: Other, Username attribute: `uid` |
| Generic SAML 2.0 (Okta/ADFS) | Identity Providers → SAML v2.0 | paste the IdP metadata URL to auto-fill |

> ✅ Coexistence of multiple identity sources: add an Identity Provider Redirector under Authentication → Browser flow to auto-select the IdP by email domain (`@company.com`→AD, `@company.onmicrosoft.com`→Entra ID).

> 📖 Vendor docs:Keycloak official docs https://www.keycloak.org/documentation · server admin guide https://www.keycloak.org/server/ · LDAP federation https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← Chapter 5: Standalone Dify Deployment](ch05-dify-deploy.md) · [📖 Index](index.md) · [Chapter 7: NewAPI: Initialization, Channels, and OIDC →](ch07-newapi.md)
