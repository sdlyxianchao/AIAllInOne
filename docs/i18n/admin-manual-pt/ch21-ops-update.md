# Capítulo 21: Gestão do Servidor de Atualização

*Parte 2 · Gestão (operações diárias de cada produto)*

> Hospedagem de instaladores do DSH Desktop e atualização automática.

[← Capítulo 20: Gestão diária do MCP Gateway](ch20-ops-mcp.md) · [📖 Índice](index.md) · [Capítulo 22: Gestão de monitoramento e alertas →](ch22-ops-monitoring.md)

---

**Entrada**: `http://<IP-do-servidor>:8091`, dados em `dsh-updates/`.

## 21.1 Colocar uma nova versão manualmente

1. Baixe o instalador oficial do DSH Desktop para `dsh-updates/dsh/`;

2. Atualize o `version.txt` (gravar o novo número de versão);

3. Na atualização automática, o DSH Desktop do funcionário verifica o `version.txt` e, ao encontrar nova versão, baixa e instala.

## 21.2 Sincronização automática (recomendado)

Use o Gitea Actions do repositório `dsh-sync` para verificar diariamente novas versões no GitHub e sincronizar (veja o capítulo 10). Disparo manual:

```
curl -X POST "http://<IP-do-servidor>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<senha>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 Configuração de sincronização (sync-config.json)

| Campo | Função |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Prefixo de aceleração de download (como ghproxy.com) |
| `keep_releases` | Quantidade de versões históricas retidas |
| `market_url` | Endereço de mercado do «Assistente de Skills» na página de downloads |

> 📌 Quando o cliente DSH Desktop reporta «tempo esgotado de conexão com o modelo», geralmente o cliente passou por um proxy de sistema que caiu (`ECONNREFUSED 127.0.0.1:33210`). Oriente o usuário a alterar em «Configurações → rede/proxy» do DSH Desktop para «não usar proxy / conexão direta».

> 📖 Documentação oficial:guia rápido do DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · repositório open source https://github.com/dataelement/dsh-desktop

---

[← Capítulo 20: Gestão diária do MCP Gateway](ch20-ops-mcp.md) · [📖 Índice](index.md) · [Capítulo 22: Gestão de monitoramento e alertas →](ch22-ops-monitoring.md)
