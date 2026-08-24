# Chapter 7: NewAPI: Initialization, Channels, and OIDC

*Part 1 · Deployment*

> Complete the initial setup wizard, configure a channel pointing to LiteLLM, issue API Keys, and integrate Keycloak OIDC.

[← Chapter 6: Keycloak: Realm, Users, and AD](ch06-keycloak.md) · [📖 Index](index.md) · [Chapter 8: LiteLLM: Verification and Caching →](ch08-litellm.md)

---

## 7.1 Initial Setup Wizard (first access)

On first launch, NewAPI pops up a 4-step system setup wizard:

1. **Database check**: click "Verify database connection"; expect a green check.

2. **Admin account**: username `ai_all_in_one_admin`, email `ai_all_in_one_admin@<company-domain>`, password the unified admin password.

> 📌 Why create a local admin first: OIDC is not configured yet at this point, so NewAPI does not know Keycloak; you must have a local account to "get in the door", finish configuration, then go to system settings to enable OIDC.

3. **Usage mode**: select "Personal use" (company-internal: employees can register, usage is viewed separately, no top-up/billing module).

4. **Confirm initialization**: create database tables → log in as admin.

## 7.2 Configure the LLM Channel (pointing to LiteLLM)

1. **Channels** → Add new channel → type `OpenAI`;

2. Base URL: `http://litellm:4000` (container name, over the Docker network, **not localhost**);

3. Key: the actual value of `LITELLM_MASTER_KEY` from `.env` (not the example value, otherwise you get `No connected db`);

4. Model: `deepseek-chat` (example, per your actual config);

5. Save → click "Test" to verify connectivity.

If you configured multiple providers, add them the same way: Claude type `Anthropic Claude`, DeepSeek type `OpenAI`, all with Base URL `http://litellm:4000`.

## 7.3 Create API Keys

Create one for Dify and one for DSH Desktop to track usage separately:

1. Left-side **API Keys** → New;

2. Name `dify-key` → Save → copy `sk-xxx` (fill into Dify's model provider);

3. Create `dsh-key` → copy `sk-xxx` (distribute to DSH Desktop users).

## 7.4 Allow Regular Users to Self-Service Request Keys

After logging in, employees can by default create their own Keys on the "API Keys" page. To actually call models, two conditions must be met (already preset in `.env`):

1. **Has quota**: `DEFAULT_QUOTA=100` (new users get $100 quota);

2. **Has token**: `GENERATE_DEFAULT_TOKEN=true` (an initial token is generated on registration).

> ⚠️ Only applies to "newly registered" users: users who have already logged in (e.g. `aitest1`) will not be automatically topped up; an admin must set their quota manually on the "Users" page.

## 7.5 Integrate Keycloak OIDC (let AD users log in directly)

### ① Create the NewAPI OIDC Client in Keycloak

1. enterprise-ai Realm → **Clients** → Create client;

2. Client ID `newapi`, type OpenID Connect;

3. **Client authentication: On** (must be on, otherwise there is no Credentials tab), Standard flow / Direct access grants: On;

4. Valid redirect URIs: `http://<server-IP>:3000/*` and `http://127.0.0.1:3000/*`;

5. Save → Credentials tab → copy the Client secret.

### ② Enable OIDC in NewAPI

NewAPI admin → **System Settings → Authentication → Custom OAuth → Add OAuth provider**, fill in:

| Group | Setting | Value |
| --- | --- | --- |
| Quick setup | Preset template / API address | `Keycloak` / `http://127.0.0.1:9090` |
| Basic info | Provider name / identifier | `Keycloak` / `keycloak` |
| Credentials | Client ID / Secret | `newapi` / the value copied from Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Field mapping | User ID / username / email | `sub` / `preferred_username` / `email` |

After clicking "Auto discover" to fill the endpoint, **change the token endpoint and userinfo endpoint to `host.docker.internal:9090`** (for NewAPI's container to call Keycloak internally); keep the authorization endpoint at `<server-IP>:9090` (for browser redirects). Scope `openid profile email`.

> ⚠️ Two things must be changed, otherwise login fails:
> - **After saving, go back to Keycloak to add the callback URL**: add `http://<server-IP>:3000/oauth/keycloak` and `http://127.0.0.1:3000/oauth/keycloak` to Valid redirect URIs;
> - **Set NewAPI's "Server address" to the intranet address**: System Settings → General Settings → change Server address to `http://<server-IP>:3000` (the default localhost causes `invalid_grant - Incorrect redirect_uri` when exchanging tokens). After changing, access NewAPI from this machine via the intranet IP as well.

Method to change the database:

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<server-IP>:3000') ON DUPLICATE KEY UPDATE value='http://<server-IP>:3000';"
docker compose restart new-api
```

> ⚠️ Troubleshooting: login returns **429 Too Many Requests** — NewAPI's critical-endpoint rate limit (default 20 requests / 20 minutes) was triggered. Temporary fix: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; the permanent solution is already preset in `.env` as four groups of variables including `CRITICAL_RATE_LIMIT_ENABLE=false`.

> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai · open-source repo https://github.com/QuantumNous/new-api

---

[← Chapter 6: Keycloak: Realm, Users, and AD](ch06-keycloak.md) · [📖 Index](index.md) · [Chapter 8: LiteLLM: Verification and Caching →](ch08-litellm.md)
