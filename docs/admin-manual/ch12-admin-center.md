# Chapter 12: AI Admin Center

*Part 1 · Deployment*

> Unified admin portal: Keycloak authentication, all products embedded in the left menu, Dashboard cluster status.

[← Chapter 11: MCP Gateway and Skill Marketplace](ch11-mcp.md) · [📖 Index](index.md) · [Chapter 13: Interconnect Verification Checklist →](ch13-interconnect.md)

---

> 📌 Positioning: this is not a Docker management platform (1Panel/Portainer), but a unified backend for administrators — Keycloak authentication + left menu linking all products + Dashboard cluster status + a unified admin account.

## 12.1 Core Capabilities

| Menu item | Behavior | Notes |
| --- | --- | --- |
| 📊 Overview Dashboard | embedded page | 8 product business metrics + Docker services (grouped by product) + system info |
| Ghost / Dify / Gitea / Keycloak | embedded stats page | view stats first; clicking "Open backend" jumps |
| 🔀 NewAPI Management | embedded page | channels/users/keys + cost reports + audit logs |
| 🔌 MCP Gateway | embedded admin page | add/remove MCP Servers, upload/delete Skills |
| 📈 Monitoring / 🔍 Observability | new tab | Grafana :3030 / Langfuse :3010 |
| 📜 Unified Logging | embedded page | query Loki by container + keyword + time |
| 💾 Backup & Restore | embedded page | backup list + backup now + one-click restore |
| 🩺 Availability Test | embedded page | scheduled + manual full-chain test |
| 📄 Report Generation | embedded page | export .md for a custom period |
| ⚙️ System Settings | embedded page | 9 UI languages + product entry URLs |

## 12.2 Initialize the Global Administrator

```
# configure in .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=see the account/password list
ADMIN_EMAIL=ai_all_in_one_admin@<company-domain>
```

After startup, it automatically creates the `ai_all_in_one_admin` user in Keycloak (skips if it already exists) and assigns the `ai-platform-admin` Realm Role. Core idea: **one Global Admin account manages the whole platform**.

## 12.3 Docker Compose Deployment

```
# prerequisite: install dependencies first (once)
cd admin-portal
npm install
cd ..
```

```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<server-IP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<company-domain>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<server-IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```

## 12.4 Keycloak Client Configuration

1. Keycloak → enterprise-ai → Clients → Create;

2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow both On;

3. Valid Redirect URIs: `http://127.0.0.1:10086/*` and `http://<server-IP>:10086/*`;

4. Copy the Client Secret → fill `KEYCLOAK_CLIENT_SECRET` in `.env` → `docker compose up -d admin-portal`;

5. Create the Realm Role `ai-platform-admin` and assign it to `ai_all_in_one_admin`.

> ⚠️ Deployment / troubleshooting points:
> - admin-portal sessions are stored in Redis (`admin-session-redis`); restarting the container no longer clears login sessions;
> - The home page `/` must be Keycloak-protected (`express.static(..., {index:false})` + an explicit `app.get('/', keycloak.protect())`), otherwise it renders an empty dashboard before login;
> - For Dify statistics use the actual admin email (`ai_all_in_one_admin@<company-domain>`), which must match the AD global admin email;
> - **After modifying server.js you must run `docker restart admin-portal`**, not `up -d` (volume file content changes won't trigger a rebuild).

## 12.5 Verify

1. Open `http://<server-IP>:10086` → auto-redirects to Keycloak login (no empty dashboard before login);

2. Log in with `ai_all_in_one_admin` → enter the Overview Dashboard;

3. The Dashboard shows 8 product metrics + container groups;

4. Click each product to view stats first; click "Open backend" to jump;

5. System Settings can switch between 9 languages.

## 12.6 Scoped Admin Authorization & Keycloak Management (v0.91)

The global admin can manage other admins and Keycloak directly from the AI Admin Center:

- **Admin Accounts**: search an existing account from the Keycloak IdP (AD/LDAP users, no new account, no password) → pick modules → confirm. The system assigns the `admin:<product>` Realm Role and **really provisions the product** (SSO first, API fallback) for Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revoking a module or deleting an admin **removes the account from the product**. No-SSO products generate a temp password, viewable via the 🔑 icon (global admin only). Non-admin users get a "You are not an admin" dialog and are signed out.

- **Keycloak page**: "Sync All / Sync Changed" buttons pull AD attribute changes into Keycloak in one click; each user row has Edit (jump to the Keycloak console) and Delete; the role section supports create/delete roles and view role members. Sync/delete/role actions are global-admin only.

> ⚠️ Notes: Keycloak has no "sync single user" endpoint — incremental sync pulls all changed AD accounts. AD-federated users reappear after the next full sync or their next SSO login, so to remove permanently, disable/delete the account in AD.

---

[← Chapter 11: MCP Gateway and Skill Marketplace](ch11-mcp.md) · [📖 Index](index.md) · [Chapter 13: Interconnect Verification Checklist →](ch13-interconnect.md)
