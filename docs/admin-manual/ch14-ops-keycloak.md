# Chapter 14: Keycloak Day-to-Day Administration

*Part 2 · Administration*

> Authentication hub: manage users, roles, OIDC clients, AD federation, and sessions.

[← Chapter 13: Interconnect Verification Checklist](ch13-interconnect.md) · [📖 Index](index.md) · [Chapter 15: NewAPI Day-to-Day Administration →](ch15-ops-newapi.md)

---

**Entry**: `http://<server-IP>:9090` → Administration Console → log in as admin.

> 📌 Many of these operations can also be done from the AI Admin Center → Keycloak page (global admin only): LDAP full/incremental sync, delete users, and role management (list/create/delete/view members). See Chapter 12.6.

## 14.1 Manage Users

1. **Create user**: Users → Add user → enter username → Create;

2. **Set password**: the user's Credentials tab → set password → turn Temporary off (otherwise first login forces a password change);

3. **Reset password**: Users → search the user → Credentials → Set password;

4. **Disable/enable**: the Enabled toggle at the top of the user detail (after disabling, all of that user's SSO immediately becomes invalid);

5. **Delete**: user detail → Delete.

## 14.2 Roles and Permissions

- **Realm Role**: Realm roles → Create role to create a role (e.g. `ai-platform-admin`); can also create/delete roles and view role members from the AI Admin Center → Keycloak page;

- **Assign role**: user → Role mapping → Assign role;

- **Groups**: Groups → create groups (`ai-admin` / `ai-user`) → add users to the group, assign roles to the group, users inherit permissions through the group.

> ✅ Admin permissions are uniformly controlled by the `ai-platform-admin` role; products use this role to identify admins when integrating SSO.

## 14.3 OIDC Clients (new products integrating SSO)

1. Clients → Create client → set Client ID to the product name (e.g. `newapi` / `grafana` / `langfuse`);

2. Client authentication: On (otherwise there is no Credentials tab), Standard flow: On;

3. Valid redirect URIs / Web origins: fill in the product's callback addresses (add both the intranet IP and 127.0.0.1);

4. Save → Credentials tab, copy the Client secret for the product side.

## 14.4 AD / LDAP Federation Maintenance

- **Change DC/password**: User Federation → click the LDAP Provider → change Connection URL / Bind credentials → Save;

- **Manual sync**: Synchronize all users; or click "Sync All / Sync Changed" on the AI Admin Center → Keycloak page (incremental sync pulls only changed AD accounts).

- **Group mapping**: Mappers tab → group-ldap-mapper → set Groups DN to the container holding the AD groups, mapping AD groups to Keycloak roles.

## 14.5 Session Management

- **View active sessions**: Users → a user → Sessions;

- **Force logout**: Sessions → Sign out all;

- **Global session/token configuration**: Realm settings → Sessions / Tokens tabs to adjust timeouts.

> ⚠️ Key pitfall review: ① keep spaces in the bind DN's CN as-is; ② Username LDAP attribute uses `sAMAccountName`, not `cn`; ③ Search scope: Subtree; ④ SSO reporting `unknown_error` is usually because the host's iphlpsvc is not running, breaking AD port forwarding; ⑤ when the AD domain controller VM is off, LDAP-federated account logins report `LDAP Connection refused`.

> 📖 Vendor docs:Keycloak official docs https://www.keycloak.org/documentation · server admin guide https://www.keycloak.org/server/

---

[← Chapter 13: Interconnect Verification Checklist](ch13-interconnect.md) · [📖 Index](index.md) · [Chapter 15: NewAPI Day-to-Day Administration →](ch15-ops-newapi.md)
