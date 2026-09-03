# Chapter 17: Dify Day-to-Day Administration

*Part 2 · Administration*

> AI application platform: apps, knowledge bases, model providers, member permissions, publishing.

[← Chapter 16: LiteLLM Day-to-Day Administration](ch16-ops-litellm.md) · [📖 Index](index.md) · [Chapter 18: Ghost Day-to-Day Administration →](ch18-ops-ghost.md)

---

**Entry**: `http://<server-IP>` (port 80, independent official compose; upgrade/maintenance is done separately in `dify/docker/`).

## 17.1 App Management (Studio)

1. **Create app**: Studio → create blank app → choose type (chat assistant / Agent / workflow / text generation);

2. **Orchestrate**: drag nodes to orchestrate prompts, tools, knowledge bases, and variables;

3. **Debug**: click "Preview" in the top-right to run and debug;

4. **Publish**: after debugging passes, "Publish" → generate a share link or embed a web app.

## 17.2 Knowledge Base Management

1. Knowledge Base → create knowledge base;

2. Upload documents (Word / PDF / Markdown / web links), choose segmentation rules + indexing mode (high quality / economical);

3. "Add" the knowledge base in an app and the AI can answer based on the documents.

> 📌 Knowledge base content will be used by the AI to answer; do not upload confidential material (follow the data classification rules).

## 17.3 Model Providers

- **Add model**: Settings → Model Providers → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key`;

- **System model settings**: set the default chat / reasoning / embedding models.

## 17.4 Members and Permissions

- **Members**: invite members into the workspace and set Owner/Admin/Editor/Normal roles;

- **Login method**: Settings → Login method → can integrate OIDC (Keycloak) for SSO.

## 17.5 Upgrade and Maintenance

```
cd dify\docker
git pull                          # pull the latest version
docker compose pull               # pull new images
docker compose up -d              # rebuild
```

> ⚠️ Key pitfalls: ① WebSocket `NEXT_PUBLIC_SOCKET_URL` must be set to the intranet IP; ② the login password is base64-encoded; ③ if you forget the password, use `docker exec dify-api-1 flask reset-password` (≥ 8 characters).

> 📖 Vendor docs:Dify official docs https://docs.dify.ai · self-hosted https://docs.dify.ai/getting-started/install-self-hosted

---

[← Chapter 16: LiteLLM Day-to-Day Administration](ch16-ops-litellm.md) · [📖 Index](index.md) · [Chapter 18: Ghost Day-to-Day Administration →](ch18-ops-ghost.md)
