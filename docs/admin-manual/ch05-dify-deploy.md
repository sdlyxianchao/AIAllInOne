# Chapter 5: Standalone Dify Deployment

*Part 1 · Deployment*

> Dify is deployed standalone with its official compose (about 15 containers) to avoid port conflicts.

[← Chapter 4: Starting Core Services](ch04-start.md) · [📖 Index](index.md) · [Chapter 6: Keycloak: Realm, Users, and AD →](ch06-keycloak.md)

---

> 📌 Dify uses the official docker-compose (about 15 containers) and is deployed standalone to avoid port conflicts, using its own default network (different from the core services' `ai-platform` network).

## 5.1 Clone Dify

```
# Option A: GitHub (requires access)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Option B: official Gitee mirror (recommended in mainland China)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 Fix Compatibility + Copy Environment Variables

```
cd dify\docker

# fix the env_file format (compatible with older Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# copy the main environment variables
copy .env.example .env

# copy all sub-templates (sandbox.env, etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# fix the Dify 1.16.1 upstream validation issue (required)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# verify
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ Why `GRAPH_ENGINE_SCALE_UP_THRESHOLD` must be changed: Dify 1.16.1 upgraded this field from "0 allowed" to "must be > 0", but the `shared.env` template is still 0. If unchanged, the 4 containers `docker-api-1` / `worker` / `worker_beat` / `api_websocket` crash on startup with `ValidationError: Input should be greater than 0`.

## 5.3 Start Dify

```
docker compose up -d
docker compose ps
```

> ✅ All containers `Up` (`init_permissions` showing Exited is normal). Open `http://127.0.0.1/install` in a browser to initialize the admin account.

## 5.4 Fix the WebSocket Address (otherwise it keeps connecting to ws://localhost)

In `.env`, `NEXT_PUBLIC_SOCKET_URL` defaults to `ws://localhost`; when deployed on the intranet, localhost in the browser points to the user's own machine, causing the frontend to repeatedly fail to connect (creating apps / debugging workflows gets stuck).

```
# In .env, change it to the intranet IP
NEXT_PUBLIC_SOCKET_URL=ws://<server-IP>

# In docker-compose.yaml, change the web service fallback to match
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<server-IP>}

# rebuild the web container to apply
docker compose up -d web
```

> 📌 After changing, hard-refresh the browser (Ctrl+F5). This variable is read at runtime, so changing .env + restarting web is enough; no need to rebuild the image.

## 5.5 Pitfall Quick Reference

> ⚠️ **The login password is base64-encoded**: in Dify 1.16.x, the `password` field of the login endpoint `POST /console/api/login` is the base64-encoded password. Script logins must `base64(password)` first; when the frontend "does nothing on clicking login", the `GET /account/profile 401` in the console is normal (not logged in).

> ⚠️ **Forgot admin password reset**: Dify's password hash is `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iterations) and cannot be reversed; reset it with a container command (new password ≥ 8 characters):

```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<company-domain> \
  --new-password '<new-password>' \
  --password-confirm '<new-password>'
```

> 📖 Vendor docs:Dify official docs https://docs.dify.ai · self-hosted deployment https://docs.dify.ai/getting-started/install-self-hosted

---

[← Chapter 4: Starting Core Services](ch04-start.md) · [📖 Index](index.md) · [Chapter 6: Keycloak: Realm, Users, and AD →](ch06-keycloak.md)
