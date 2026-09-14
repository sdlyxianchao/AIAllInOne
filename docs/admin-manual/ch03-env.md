# Chapter 3: Configuration Files and Environment Variables

*Part 1 · Deployment*

> The three core configuration files + the full set of environment variables — which to configure now and which to configure later.

[← Chapter 2: Prerequisites](ch02-prereq.md) · [📖 Index](index.md) · [Chapter 4: Starting Core Services →](ch04-start.md)

---

## 3.1 The Three Core Configuration Files

| File | Purpose | Needs modification? |
| --- | --- | --- |
| `.env.windows` | All passwords and external API Keys | **Must modify**: fill in the DeepSeek API Key; other providers as needed |
| `litellm-config.yaml` | LiteLLM model list + PII redaction rules | Usually unchanged (if only using DeepSeek, the OpenAI/Claude entries can be removed) |
| `docker-compose.yml` | Core service orchestration | Already preconfigured (includes Keycloak `KC_HOSTNAME` + persistent volumes) |

## 3.2 Environment Variable Classification Overview

Open `.env` (copied from `.env.windows`) and configure by priority.

| Variable | Priority | Description |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 immediate | External LLM API Key; without it the chain won't work |
| `LITELLM_MASTER_KEY` | 🔴 immediate | LiteLLM internal auth key, needed by NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 immediate | MySQL root password; should not change after initial creation |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 immediate | Keycloak admin password |
| `NEWAPI_SESSION_SECRET` | 🔴 immediate | NewAPI session encryption, random string |
| `NEWAPI_CRYPTO_SECRET` | 🔴 immediate | NewAPI data encryption, random string |
| `ADMIN_PASSWORD` | 🔴 immediate | AI Admin Center Global Admin password |
| `SESSION_SECRET` | 🔴 immediate | AI Admin Center session encryption, random string |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 can configure later | First create an OIDC Client in Keycloak to get the Secret (see Chapter 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 can configure later | First start Gitea and get the Token from the admin (see Chapter 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 as needed | Uncomment when needed, and update `litellm-config.yaml` accordingly |
| `GLOBAL_WEB_RATE_LIMIT` and other rate-limit items | ⚪ default | Set 999999 during testing; lower appropriately in production |
| `DEFAULT_QUOTA` | ⚪ default | Default quota for new users (USD); setting 100 gives new users $100 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ default | Auto-generate an initial Key on new user registration; set true so users can use it right after login |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ default | Defaults are fine |

## 3.3 🔴 Immediate Configuration (must complete before first startup)

| Variable | Description | How to obtain | Format |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek cloud LLM Key | Register at https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM internal admin key (not an external LLM Key) | Randomly generate (see below) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL password | Choose your own; **should not change** after initial creation | any |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | Choose your own, ≥ 8 characters | any |
| `NEWAPI_SESSION_SECRET` | NewAPI session encryption | Randomly generate | 32 characters |
| `NEWAPI_CRYPTO_SECRET` | NewAPI data encryption | Randomly generate | 32 characters |
| `ADMIN_PASSWORD` | AI Admin Center admin password | Choose your own, ≥ 8 characters | any |
| `SESSION_SECRET` | AI Admin Center session encryption | Randomly generate | 64 characters |

Generate a random string (PowerShell):

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Example of Filling In the API Key

```
# DeepSeek is configured by default (uncomment and fill in the Key)
DEEPSEEK_API_KEY=sk-your-real-DeepSeek-key

# Uncomment when OpenAI / Claude are needed, and also uncomment the corresponding model block in litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 Password Change Policy

> ⚠️ `NEWAPI_DB_PASSWORD` is tied to the already-created database; changing it requires deleting the corresponding volume and recreating it (data will be lost), so it is best to decide it once on the first setup.
 Management passwords such as `KEYCLOAK_ADMIN_PASSWORD` and `ADMIN_PASSWORD` can be changed in each product's admin console; after changing, update `.env` accordingly (just a reminder; does not affect operation).

## 3.5 litellm-config.yaml Notes

- `model_list` — defines the available external models; NewAPI calls them via LiteLLM. By default only `deepseek-chat` is enabled;

- `general_settings.master_key` — LiteLLM admin key; reads `LITELLM_MASTER_KEY` from `.env`;

- PII redaction (Presidio) is currently **temporarily commented out** (the new LiteLLM guardrail API change is incompatible); see Chapter 25 for enabling it later;

- Use the stable version `v1.95.1` (`main-latest` has known bugs).

---

[← Chapter 2: Prerequisites](ch02-prereq.md) · [📖 Index](index.md) · [Chapter 4: Starting Core Services →](ch04-start.md)
