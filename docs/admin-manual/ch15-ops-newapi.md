# Chapter 15: NewAPI Day-to-Day Administration

*Part 2 · Administration*

> LLM gateway: manage channels, tokens, quotas, users, logs, and cost.

[← Chapter 14: Keycloak Day-to-Day Administration](ch14-ops-keycloak.md) · [📖 Index](index.md) · [Chapter 16: LiteLLM Day-to-Day Administration →](ch16-ops-litellm.md)

---

**Entry**: `http://<server-IP>:3000`.

## 15.1 Channel Management (upstream models)

1. **Add channel**: Channels → Add new channel → type OpenAI (or Claude, etc.) → Base URL `http://litellm:4000` → Key `LITELLM_MASTER_KEY` → fill in the model name → Save;

2. **Test**: in the channel list click "Test", select a model to verify connectivity;

3. **Disable/enable**: the toggle in the channel list; after disabling, the channel no longer accepts requests;

4. **Priority/weight**: when multiple channels serve the same model, traffic is split by priority/weight.

## 15.2 Token (API Key) Management

1. **Create**: API Keys → New token → name it (e.g. `dsh-key`) → can set quota / expiry / model limits → Save;

2. **Copy Key**: starts with `sk-`, **shown only once, save it immediately**;

3. **Disable/delete**: token list actions (after disabling, the Key immediately becomes invalid);

4. **Check usage**: token detail shows the consumed quota.

## 15.3 Quotas and Users

- **Default quota for new users**: `DEFAULT_QUOTA` (suggested $100);

- **Raise a single user's quota**: Users page → edit that user → set quota;

- **Top up/ban**: operations on the Users page;

- **Group management**: create groups by department, set model multipliers/quotas; when users are assigned to a group they are governed by the department.

## 15.4 Logs and Cost

- **Logs page**: check user/model/token/quota/cost/source IP for each call;

- **Cost report**: the AI Admin Center's "NewAPI Management" page has cost reports aggregated by user/model/date + the latest 100 audit logs.

> 📌 Client IP recording depends on the user's "Record IP log" setting (`record_ip_log`, off by default); enable it for the corresponding users when IP auditing is needed.

## 15.5 System Settings Essentials

- **Server address**: must be set to the intranet `http://<server-IP>:3000` (otherwise OIDC reports `invalid_grant - Incorrect redirect_uri`);

- **Authentication → Custom OAuth**: Keycloak OIDC integration (see Chapter 7);

- **Usage mode**: switchable between personal use ↔ public operation.

> ⚠️ Key pitfall review: ① channel Base URL should all be the container name `http://litellm:4000`; ② rate-limit 429 is controlled by variables such as `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ when changing the database, use the `MYSQL_PWD` environment variable directly to avoid the stderr password warning being mistaken for an error.

> 📖 Vendor docs:NewAPI official docs https://docs.newapi.pro · website https://www.newapi.ai · open-source repo https://github.com/QuantumNous/new-api

---

[← Chapter 14: Keycloak Day-to-Day Administration](ch14-ops-keycloak.md) · [📖 Index](index.md) · [Chapter 16: LiteLLM Day-to-Day Administration →](ch16-ops-litellm.md)
