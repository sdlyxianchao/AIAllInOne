# Chapter 9: Dify / Ghost / Gitea Configuration

*Part 1 · Deployment*

> Initialization and interconnect configuration for each of the three products.

[← Chapter 8: LiteLLM: Verification and Caching](ch08-litellm.md) · [📖 Index](index.md) · [Chapter 10: DSH Desktop Distribution and CI/CD →](ch10-dsh.md)

---

## 9.1 Dify: Configure the Model Provider

1. Open `http://<server-IP>` → set the admin email/password on first use (email `ai_all_in_one_admin@<company-domain>`);

2. **Settings → Model Providers** → OpenAI-API-compatible → add a model:

- Model name `deepseek-chat` (per actual);

- API Key: the `sk-xxx` of `dify-key`;

- API endpoint: `http://host.docker.internal:3000/v1`.

3. Studio → create a chat assistant → select the model → send a message to verify.

> ⚠️ Dify uses `host.docker.internal` rather than a container name, because Dify is in its own network, different from NewAPI's network.

## 9.2 Ghost: Configure the Portal

1. Admin entry `http://<server-IP>:8090/ghost/` (**note the /ghost/ suffix**). First time, go through the setup wizard to create the admin (email `ai_all_in_one_admin@<company-domain>`, password ≥ 10 characters);

2. Automation: run `scripts\ghost-setup.ps1` directly to create the admin once via the setup API, equivalent to the wizard (auto-skipped if already initialized);

3. **Theme**: Design → Themes, activate the bundled Casper/Source directly;

4. **Navigation menu**: Design → Navigation → create "Primary" navigation.

| Menu item | Type | URL |
| --- | --- | --- |
| Home | Page | `/` |
| News | Category | `/category/news` |
| Downloads | Page | `/downloads` |
| AI Workbench | Custom link | `http://<server-IP>` |
| Help Docs | Category | `/category/docs` |

1. **Downloads page**: Pages → New page "Downloads" (slug `downloads`), put the DSH Desktop installer intranet links in the content.

```
## DSH Desktop Enterprise Edition
### Windows
- [DSH Desktop v0.5.0 (Windows x64)](http://<server-IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe)
### macOS
- [DSH Desktop v0.5.0 (macOS x64)](http://<server-IP>:8091/dsh/dsh-desktop-mac-x64.dmg)
```

> ⚠️ Don't click "Sign up" on the portal home page `/` — that's visitor/subscriber registration (with no SMTP configured it returns 500); the admin entry is `/ghost/`. Don't install the latest theme from GitHub (it may target Ghost 6.x and report incompatible on 5.x).

## 9.3 Gitea: Initialization and Runner Registration

1. Open `http://<server-IP>:3002` → install wizard (SQLite database is preconfigured) → create the admin (username `ai_all_in_one_admin`);

2. Top-right avatar → **Site Administration → Actions** → confirm "Enabled Actions" is on;

3. **Runners → Create new Runner** → copy the Registration Token;

4. Put the Token into `GITEA_RUNNER_TOKEN` in `.env`, then rebuild the Runner:

```
# ⚠️ Must use up -d, not restart (restart does not re-read the token from .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

> ⚠️ Pitfall 1: `readonly database` is usually because `gitea.db` is owned by root; delete that root-owned db and let it be recreated as the git user.
 ⚠️ Pitfall 2: `ROOT_URL` must be set to `http://<server-IP>:3002/`, otherwise the generated repository links are localhost and break when employees open them.

> 📖 Vendor docs:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (Chinese) https://docs.gitea.com/zh-cn

---

[← Chapter 8: LiteLLM: Verification and Caching](ch08-litellm.md) · [📖 Index](index.md) · [Chapter 10: DSH Desktop Distribution and CI/CD →](ch10-dsh.md)
