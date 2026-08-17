# Capítulo 20: Gestão diária do MCP Gateway

*Parte 2 · Gestão (operações diárias de cada produto)*

> Adicionar/remover servidores MCP, fazer upload/excluir Skills, estender as ferramentas integradas.

[← Capítulo 19: Gestão diária do Gitea](ch19-ops-gitea.md) · [📖 Índice](index.md) · [Capítulo 21: Gestão do Servidor de Atualização →](ch21-ops-update.md)

---

**Entrada**: `http://<IP-do-servidor>:3100` (página de mercado `/market`). A gestão é feita pela página «MCP Gateway» da Central de Administração de IA (role `ai-platform-admin`), ou chamando diretamente a API de gestão.

## 20.1 Gerenciar servidores MCP

1. Edite `mcp-gateway/mcp-servers.json` para adicionar/remover servidores (tipos stdio/http);

2. Reinicie com `docker compose restart mcp-gateway`;

3. Ou adicione/remova na página MCP Gateway da Central de Administração de IA (grava de volta na configuração + reconexão automática).

## 20.2 Gerenciar Skills (pacotes de skills)

1. **Upload**: página MCP Gateway da Central de Administração de IA → upload do zip da skill (valida presença de SKILL.md, previne path traversal);

2. **Excluir**: excluir a skill correspondente;

3. As skills ficam em `mcp-gateway/skills/` (subdiretórios com SKILL.md); a varredura é automática a cada requisição, sem necessidade de reiniciar.

## 20.3 Estender as ferramentas integradas

Adicione duas etapas em `mcp-gateway/gateway.js`:

```
// ① Definição da ferramenta (adicione um item ao array builtinTools)
{ name: 'platform_health', description: 'consultar o status de saúde dos serviços',
  inputSchema: { type: 'object', properties: {} } }

// ② Lógica de execução (adicione um branch ao callBuiltin)
if (name === 'platform_health') { return 'todos os serviços funcionando normalmente'; }
```

Depois de alterar, execute `docker compose restart mcp-gateway`.

## 20.4 Manter o endereço de mercado do skill-market

O `market_url` do «Assistente de Skills» fica em `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; deve usar hostname (não IP) e é um parâmetro de implantação (veja o capítulo 11).

> ⚠️ A API de gestão requer o header `X-Admin-Token` (`MCP_ADMIN_TOKEN` do `.env`); sem configurar, retorna 503; token errado, retorna 401.

> 📖 Documentação oficial:protocolo MCP oficial https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Capítulo 19: Gestão diária do Gitea](ch19-ops-gitea.md) · [📖 Índice](index.md) · [Capítulo 21: Gestão do Servidor de Atualização →](ch21-ops-update.md)
