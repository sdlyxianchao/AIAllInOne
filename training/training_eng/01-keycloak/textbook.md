# Keycloak — Textbook (M03 · Unified Auth)

> Platform-specific usage is the backbone here, official generic concepts second. In-platform: port `9090`, realm `enterprise-ai`.

## 1. What is Keycloak

Keycloak (Red Hat) is an open-source **Identity & Access Management (IAM)** solution:
- **SSO**: log in once, every connected app is unlocked.
- **Protocols**: OIDC / OAuth 2.0 / SAML 2.0.
- **User Federation**: connect AD/LDAP/Entra ID/Google without duplicating accounts.
- **Admin console**: manage realms, users, clients, roles, sessions.

In this platform Keycloak is the **unified auth entry (SSO)**: for the **products wired into SSO** (AI Admin Center, NewAPI, Dify, Gitea, Grafana, Langfuse, LiteLLM — 7 in total), clicking "Login" redirects to Keycloak (`http://<SERVER_IP>:9090`) and back on success. **Not every product uses SSO**: Ghost uses local accounts + email codes, DeepChat (desktop) connects directly with API base + key, MCP Gateway uses the `X-Admin-Token` header, and Update Server / MailHog / Ollama have no login or use API keys (full list in §5).

## 2. Platform Conventions

| Item | Value |
|---|---|
| URL | `http://127.0.0.1:9090` (host) / `http://<SERVER_IP>:9090` (intranet) |
| Realm | `enterprise-ai` (shared by all products) |
| Admin account | `KEYCLOAK_ADMIN` (see `.env`) |
| Unified admin | `ai_all_in_one_admin`, email unified as `ai_all_in_one_admin@<company-domain>` (**same everywhere or SSO breaks**) |
| Admin role | Realm Role `ai-platform-admin` |
| Persistence | H2 DB in volume `keycloak-data`; config survives container rebuild |
| Key env vars | `KC_HOSTNAME=<SERVER_IP>`, `KC_HOSTNAME_STRICT=false` |

## 3. Core Concepts Quick Reference

| Concept | Meaning | In-platform example |
|---|---|---|
| **Realm** | isolated space of users/clients/roles | `enterprise-ai` |
| **Client** | application registered with Keycloak | `newapi`, `AI-all-in-one-admin-portal`, `grafana`, `langfuse` |
| **User** | login subject | local or AD-synced account |
| **Role** | permission marker | `ai-platform-admin`, per-module `admin:<product>` |
| **Group** | user grouping | `ai-admin`, `ai-user` |
| **User Federation** | external directory binding | AD LDAP provider |
| **Identity Provider (IdP)** | external login source | Entra ID / Google / GitHub / SAML |

## 4. Standard Procedures

### 4.1 Create Realm & local users (method A)
1. Open `http://127.0.0.1:9090`, log in with `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`.
2. Top-left dropdown → **Create Realm** → name `enterprise-ai` → Create.
3. **Groups** → create `ai-admin`, `ai-user`.
4. **Users** → Add user → set password under **Credentials** (Temporary off) → add to group.
5. ✅ Verify: user can sign in at the Keycloak login page.

### 4.2 Create an OIDC Client (standard steps for every product)
Example: NewAPI (same for others, change Client ID and redirect URIs):
1. Realm `enterprise-ai` → **Clients** → Create client.
2. Client ID `newapi`, type **OpenID Connect** → Next.
3. **Client authentication: On** (⚠️ required for the Credentials tab); **Standard flow: On**; Direct access grants as needed.
4. **Valid redirect URIs**: add both `http://<SERVER_IP>:3000/*` and `http://127.0.0.1:3000/*`.
5. **Web origins**: same two → Save.
6. **Credentials** tab → copy **Client secret** (into the product or `.env`).

> ⚠️ If the product later generates an auth callback URL, add it to Valid redirect URIs or the callback fails.

### 4.3 AD/LDAP User Federation (method B — focus)
Prereq: container→DC network reachable (see `../../windows/windows-ad-integration.en.html`); service account `svc_keycloak` in AD (password never expires).

1. Realm `enterprise-ai` → **User Federation** → Add provider → **ldap**.
2. Key fields (⚠️ common mistakes marked):

| Field | Value | ⚠️ Notes |
|---|---|---|
| Vendor | **Active Directory** | not "Other" |
| Connection URL | `ldap://host.docker.internal:389` | port-forwarded; prod: `ldap://dc.company.com:389` |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **must be LDAP DN** — not `DOMAIN\user`; keep spaces in CN |
| Edit mode | **READ_ONLY** | never write back to AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | use parent DN for sub-OUs |
| Username LDAP attribute | **`sAMAccountName`** | not `cn` |
| RDN / UUID | `cn` / `objectGUID` | objectGUID = AD immutable ID |
| User object classes | `person, organizationalPerson, user` | |
| Search scope | **Subtree** | not One Level (sub-OUs would be missed) |
| Import users | On; Sync Registrations On | immediate sync on first login |

3. Save → **Synchronize all users** → wait.
4. (Optional) **Mappers** → add `group-ldap-mapper` to map AD groups to roles.

**✅ Three verification methods**:
- A: private window → `http://127.0.0.1:9090/realms/enterprise-ai/account` → sign in with AD user (sAMAccountName or UPN).
- B: Admin Console → Users → user has `LDAP_ID` / `LDAP_ENTRY_DN` attributes.
- C: downstream app SSO (after OIDC configured).

### 4.4 Multi-IdP coexistence (awareness)
Keycloak can host several IdPs at once (AD + Entra ID + Google + GitHub + SAML) in the same realm. Best practice: add **Identity Provider Redirector** in the Browser flow to auto-route by email domain (`@company.com` → AD; `@company.onmicrosoft.com` → Entra ID; partners → low-privilege role).

## 5. SSO Wiring Table (per product)

| Product | Keycloak Client | Method | Login UX |
|---|---|---|---|
| AI Admin Center | `AI-all-in-one-admin-portal` | keycloak-connect (OIDC) | forced SSO (auto-redirect) |
| NewAPI | `newapi` | OIDC | "Keycloak/OIDC login" button |
| Dify | `dify` (as named at deploy) | OIDC | Settings → Login methods → OIDC (configured); login via Keycloak |
| Gitea | gitea | OIDC + auto-registration | "Sign in with keycloak" |
| Grafana | `grafana` | OAuth2 generic OIDC | auto-login (`GF_AUTH_OAUTH_AUTO_LOGIN=true`) |
| Langfuse | `langfuse` | Keycloak provider | IdP-initiated SSO (`/auth/sso-initiate?provider=KEYCLOAK`) |
| LiteLLM | `LITELLM_UI_CLIENT_ID` (.env) | Generic OIDC | unified-account basic auth; optional `AUTO_REDIRECT_UI_LOGIN_TO_SSO` |
| Ghost | — (local account) | none | unified account + email code (MailHog) |

> **Products NOT using SSO** (no Keycloak Client needed): **DeepChat** (desktop client, direct API base + key), **MCP Gateway** (`X-Admin-Token` header, value from `MCP_ADMIN_TOKEN` in `.env`), **Update Server** (nginx static hosting, no login), **MailHog** (mail test tool, no login), **Ollama** (local inference, no login).

## 6. Troubleshooting

| Symptom | Root cause & fix |
|---|---|
| `Invalid username or password` | wrong password / user outside Users DN |
| `Account is disabled` | AD user disabled |
| `invalid_grant - Incorrect redirect_uri` | ① redirect URI not in Client; ② NewAPI "Server Address" not set to intranet address (browser address vs server address mismatch); ③ using 127.0.0.1 while server address is the intranet IP |
| `Client not found` | Client ID case/realm mismatch |
| 429 on login | NewAPI CriticalRateLimit (default 20/20min). Clear: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" \| xargs -r docker exec new-api-redis redis-cli DEL`; permanent: `.env` `CRITICAL_RATE_LIMIT_ENABLE=false` etc., recreate container |
| 403 after SSO login on admin pages | OIDC user is `common` role; promote: `UPDATE users SET role=100 WHERE id=<user_id>;` (find id in `user_oauth_bindings`) |
| `unknown_error` on login | Keycloak federates to AD; DC VM down/unreachable |
| Nothing happens | F12 console/network; private window; clear cache |

## 7. Security Notes
- Admin password ≥ 8 chars; unified admin email consistent with AD global admin.
- Client secrets live only in `.env` / credentials.html.
- Production: enable HTTPS and tune token lifetimes (Realm Settings → Tokens).

## 8. Further Learning
- Official: Server Administration Guide; platform docs ch06/ch14; video & tutorial links: `references.md`
