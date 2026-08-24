# Capítulo 10: Distribuição e CI/CD do DSH Desktop

*Parte 1 · Implantação*

> Distribuir o instalador do DSH Desktop aos funcionários e usar o Gitea Actions para sincronizar automaticamente as novas versões oficiais.

[← Capítulo 9: Configuração do Dify / Ghost / Gitea](ch09-products.md) · [📖 Índice](index.md) · [Capítulo 11: MCP Gateway e Mercado de Skills →](ch11-mcp.md)

---

## 10.1 Cadeia de distribuição

Cadeia de distribuição = instaladores do GitHub Releases → Gitea Actions do repositório `dsh-sync` → Servidor de Atualização (:8091) → página de downloads do Ghost → download pelos funcionários.

> 📌 O repositório mirror do código-fonte `dsh` foi removido — mirror só sincroniza o código git, não sincroniza os instaladores dos releases, portanto é inútil para a distribuição. Se precisar de auditoria de código/desenvolvimento secundário, crie um separado.

## 10.2 Baixar o instalador para o Servidor de Atualização

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

Verificação: `curl -I http://<IP-do-servidor>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206. Depois atualize a página de downloads do Ghost (veja o capítulo 9).

## 10.3 Sincronização automática (Gitea Actions, recomendado)

| Componente | Descrição |
| --- | --- |
| Repositório `dsh-sync` | Repositório comum (não pode ser mirror), contém `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Gatilho | `schedule` (todos os dias às 2h UTC) + `workflow_dispatch` (manual) |
| Lógica | Consulta a tag mais recente do GitHub → compara com `version.txt` → se houver versão nova, baixa + atualiza a página de downloads do Ghost + grava a versão |

```
# Disparar manualmente uma vez
curl -X POST "http://<IP-do-servidor>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<senha>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ Armadilhas críticas: ① o `container.network` do act_runner deve ser configurado via `config.yaml` (+ variável de ambiente `CONFIG_FILE`), senão o contêiner do job não resolve o hostname `gitea`; ② o docker.sock é montado automaticamente pelo runner, não monte novamente nas options (dá Duplicate mount point).

## 10.4 Configuração de fonte de download na China (sync-config.json)

Os instaladores da página de downloads do site oficial `www.dshdesktop.com` ainda apontam para o GitHub, que geralmente não funciona na China. A solução real é o `sync-config.json`:

| Campo | Função | Padrão |
| --- | --- | --- |
| `version_source` | `github` (API do GitHub, mais precisa) ou `official` (cache do site, alcançável mas atrasado) | `github` |
| `download_prefix` | Prefixo de aceleração de download, como `https://ghproxy.com/` | `""` |
| `keep_releases` | Quantidade de versões históricas retidas | `5` |
| `market_url` | Endereço de intranet do mercado «instale primeiro o Assistente de Skills» na página de downloads | `http://<IP-do-servidor>:3100` |

```
# Com acesso ao GitHub: mantenha o padrão
{ "version_source": "github", "download_prefix": "" }
# Proxy de aceleração do GitHub (mais usado)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```

> 📌 O workflow inclui o comparador de versões `version_cmp.py`: só baixa quando «versão mais recente > versão local» (evita que o atraso do cache do site regrida o cliente para uma versão antiga).

## 10.5 Método B: build de versão personalizada com Docker (opcional)

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# dentro do contêiner
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# os artefatos ficam em dist/; após sair, copie para dsh-updates/
```

## 10.6 Configurar o cliente DSH Desktop (lado do funcionário)

1. DSH Desktop → Configurações → serviço de modelos → Provider personalizado / compatível com OpenAI;

2. API Base URL: `http://<IP-do-servidor>:3000/v1` (obrigatório IP de intranet);

3. API Key: `sk-xxx` da `dsh-key`;

4. Modelo: `deepseek-chat`, salve e teste a conversa.

> 📖 Documentação oficial:guia rápido do DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · repositório open source https://github.com/dataelement/dsh-desktop

---

[← Capítulo 9: Configuração do Dify / Ghost / Gitea](ch09-products.md) · [📖 Índice](index.md) · [Capítulo 11: MCP Gateway e Mercado de Skills →](ch11-mcp.md)
