# Capítulo 11: MCP Gateway e Mercado de Skills

*Parte 1 · Implantação*

> Gateway para gestão centralizada de Skills e ferramentas MCP; DeepChat/Dify obtêm todas as ferramentas com um único endereço.

[← Capítulo 10: Distribuição e CI/CD do DeepChat](ch10-deepchat.md) · [📖 Índice](index.md) · [Capítulo 12: Central de Administração de IA →](ch12-admin-center.md)

---

> 📌 O MCP Gateway é baseado no SDK oficial `@modelcontextprotocol/sdk`, expõe o endpoint Streamable HTTP padrão `/mcp`, já incorporado ao `docker-compose.yml` principal (porta 3100), iniciando junto com os serviços principais. O código-fonte fica em `mcp-gateway/`.

## 11.1 Ferramentas de plataforma integradas

| Ferramenta | Uso |
| --- | --- |
| `platform_time` | Retorna a hora atual do servidor |
| `platform_echo` | Ecoa o texto (teste de conectividade) |
| `platform_services` | Lista os serviços da plataforma |

## 11.2 Agregar servidores MCP externos

Edite `mcp-gateway/mcp-servers.json`, adicione tipos stdio ou http e reinicie o `mcp-gateway` para aplicar:

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

As ferramentas agregadas ganham automaticamente o prefixo `{serverName}_` para evitar nomes duplicados.

## 11.3 Integração do cliente

1. DeepChat: Configurações → MCP → adicionar servidor → tipo «HTTP transmissível», URL `http://<IP-do-servidor>:3100/mcp`;

2. Fluxo de trabalho do Dify: configurar ferramenta personalizada / ferramenta MCP apontando para o mesmo endereço.

> Verificação: `curl http://<IP-do-servidor>:3100/health` retorna `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` retorna a lista de ferramentas.

## 11.4 Mercado de Skills (distribuição de pacotes de skills na intranet)

| Endpoint | Função |
| --- | --- |
| `/market` | Página do mercado de Skills (navegação por cartões + download de ZIP + copiar endereço de instalação) |
| `/skills` | JSON da lista de skills (name/description/version) |
| `/skills/<nome>.zip` | Download do pacote de skills (empacotamento dinâmico) |

As skills ficam no diretório `mcp-gateway/skills/` (subdiretórios com SKILL.md); **a varredura é automática a cada requisição, sem necessidade de reiniciar**. A skill de bootstrap `skill-market` está integrada.

> 📌 No DeepChat, MCP e Skill são dois conceitos diferentes: MCP é «ferramenta» (function calling), Skill é «pacote de habilidades do agente» (SKILL.md + scripts). A Skill do DeepChat não tem «URL de mercado personalizado», suportando apenas instalação por pasta/ZIP/URL; a distribuição na intranet é feita de forma indireta via «instalação por URL».

## 11.5 ⚠️ Hostname do Mercado de Skills (parâmetro de implantação, obrigatório substituir)

O «Assistente de Skills» lê `market_url` do `config.json` para solicitar a lista de `/skills`. Dois pontos críticos:

- **Use hostname, não IP**: o ambiente do agente do DeepChat anonimiza o IP como `[IP_ADDRESS_REDACTED]`, impossibilitando ler o endereço real;

- **O hostname é um parâmetro de implantação**: difere em cada implantação, não copie.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<host-do-mercado>:3100" }
```

#### Automático (implantação com Agent)

Na coleta de parâmetros, o Agent pergunta pelo «hostname do Mercado de Skills» e substitui automaticamente `<host-do-mercado>` em `config.json` e `SKILL.md`.

#### Manual

1. Edite `config.json` + o endereço de fallback do `SKILL.md`, substituindo `<host-do-mercado>`;

2. Torne o hostname resolvível: em máquina única, adicione em `C:\Windows\System32\drivers\etc\hosts` a linha `<IP-do-servidor> <hostname>`; na intranet da empresa, adicione registro A no DNS.

> ✅ Recomenda-se usar FQDN «nome do serviço + domínio da empresa» como hostname, por exemplo `skillmarket.seu-domínio-empresa`. Para adicionar registro A no DNS: no controlador de domínio «DNS → zona de pesquisa direta → seu domínio → novo host (A)», ou use `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "seu-domínio" -IPv4Address "<IP-do-servidor>"`.

## 11.6 API de gestão (para a Central de Administração de IA criar/alterar/excluir)

| Endpoint | Função |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | CRUD de servidores MCP (grava de volta na configuração + reconexão automática) |
| `POST /api/skills/upload` | Upload do zip de skills (valida SKILL.md, previne path traversal) |
| `DELETE /api/skills/:name` | Excluir skill |

Requer o header `X-Admin-Token` (`MCP_ADMIN_TOKEN` do `.env`). É chamado por proxy pela página «MCP Gateway» da Central de Administração de IA (protegida pela role `ai-platform-admin`).

> 📖 Documentação oficial:protocolo MCP oficial https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Capítulo 10: Distribuição e CI/CD do DeepChat](ch10-deepchat.md) · [📖 Índice](index.md) · [Capítulo 12: Central de Administração de IA →](ch12-admin-center.md)
