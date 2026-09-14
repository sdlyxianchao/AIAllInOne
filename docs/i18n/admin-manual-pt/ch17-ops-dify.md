# Capítulo 17: Gestão diária do Dify

*Parte 2 · Gestão (operações diárias de cada produto)*

> Plataforma de aplicações de IA: aplicações, bases de conhecimento, provedores de modelos, permissões de membros, publicação.

[← Capítulo 16: Gestão diária do LiteLLM](ch16-ops-litellm.md) · [📖 Índice](index.md) · [Capítulo 18: Gestão diária do Ghost →](ch18-ops-ghost.md)

---

**Entrada**: `http://<IP-do-servidor>` (porta 80, compose oficial independente; upgrades e manutenção são feitos separadamente em `dify/docker/`).

## 17.1 Gerenciamento de aplicações (Studio)

1. **Criar aplicação**: Studio → criar aplicação em branco → escolher tipo (assistente de chat / Agent / fluxo de trabalho / geração de texto);

2. **Orquestração**: arraste nós para orquestrar prompts, ferramentas, bases de conhecimento, variáveis;

3. **Depurar**: «Pré-visualização» no canto superior direito para executar a depuração;

4. **Publicar**: após passar na depuração, «Publicar» → gerar link de compartilhamento ou incorporar em aplicação Web.

## 17.2 Gerenciamento de bases de conhecimento

1. Base de conhecimento → criar base de conhecimento;

2. Enviar documentos (Word / PDF / Markdown / link de página), escolher regra de segmentação + modo de indexação (alta qualidade/econômico);

3. «Adicionar» essa base na aplicação e a IA passa a responder com base nos documentos.

> 📌 O conteúdo da base de conhecimento é usado pela IA para responder; não envie material confidencial (obedeça à norma de classificação de dados).

## 17.3 Provedores de modelos

- **Adicionar modelo**: Configurações → provedores de modelos → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key`;

- **Configuração de modelos do sistema**: defina os modelos padrão de chat/raciocínio/embedding.

## 17.4 Membros e permissões

- **Membros**: convide membros para o workspace, defina roles Owner/Admin/Editor/Normal;

- **Método de login**: Configurações → método de login → pode integrar OIDC (Keycloak) para SSO.

## 17.5 Upgrade e manutenção

```
cd dify\docker
git pull                          # baixar a versão mais recente
docker compose pull               # baixar novas imagens
docker compose up -d              # reconstruir
```

> ⚠️ Armadilhas críticas: ① o WebSocket `NEXT_PUBLIC_SOCKET_URL` deve usar IP de intranet; ② a senha de login é codificada em base64; ③ esqueceu a senha? Use `docker exec dify-api-1 flask reset-password` (≥8 caracteres).

> 📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai · self-hosted https://docs.dify.ai/getting-started/install-self-hosted

---

[← Capítulo 16: Gestão diária do LiteLLM](ch16-ops-litellm.md) · [📖 Índice](index.md) · [Capítulo 18: Gestão diária do Ghost →](ch18-ops-ghost.md)
