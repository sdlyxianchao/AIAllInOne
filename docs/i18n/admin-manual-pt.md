# Manual do Administrador do AI AllInOne

*v0.2 · Implantação · Gestão · Operações*

**Parte 1 · Implantação**

## 1. Visão geral e arquitetura da plataforma

### 1.1 O que é esta plataforma
«AI AllInOne» é uma **plataforma de IA para intranet corporativa** que orquestra mais de uma dezena de produtos de código aberto com Docker: autenticação unificada, roteamento de LLM, anonimização de PII, aplicações de IA, portal corporativo, CI de código-fonte, distribuição de clientes, gestão unificada, monitoramento e alertas, observabilidade, logs, backup e recuperação — tudo integrado, e com **uma única conta Keycloak com SSO para todos os produtos**.
| Camada | Componente | Função |
| --- | --- | --- |
| Autenticação unificada | Keycloak | SSO / OIDC, integrável com AD/LDAP ou contas locais |
| Roteamento de LLM | NewAPI | Canais, chaves, cotas, auditoria, custos |
| Anonimização de PII | LiteLLM + Presidio | Anonimiza automaticamente celular/CPF/e-mail etc. antes de chamar o modelo |
| Aplicações de IA | Dify | Plataforma visual de aplicações de IA / Agente / base de conhecimento |
| Portal corporativo | Ghost | Avisos, notícias, central de downloads, Hub dos funcionários |
| Código-fonte / CI | Gitea + Runner | Repositório Git interno + automação com Actions |
| Cliente | DeepChat | Cliente de desktop local de IA (Win/macOS/Linux) |
| Distribuição do cliente | Servidor de Atualização | Hospedagem de instaladores do DeepChat e atualização automática |
| Gestão unificada | Central de Administração de IA | Único ponto de gestão: Dashboard + produtos embutidos + auditoria/custos/relatórios |
| Gateway | MCP Gateway | Gestão do mercado de Skills / MCP |
| Monitoramento e alertas | Prometheus + Grafana + Alertmanager | Monitoramento de recursos dos contêineres + notificação de alertas |
| Observabilidade de LLM | Langfuse | Trace / latência / tokens / custo de cada chamada ao modelo |
| Logs unificados | Loki + Promtail | Agregação e busca de logs de todos os contêineres |
| Backup e recuperação | Scripts backup / restore + página de gestão | Backup diário de todos os dados + recuperação com um clique |
### 1.2 Requisitos de software e hardware
| Item | Requisito mínimo | Configuração recomendada |
| --- | --- | --- |
| Sistema operacional | Windows 11 (Docker Desktop + backend WSL2) | Windows 11 Pro / Enterprise (suporte adicional a Hyper-V para rodar o controlador de domínio AD) |
| CPU | 4 núcleos / 8 threads | 8 núcleos / 16 threads |
| Memória | 16 GB | 32 GB |
| Disco | 60 GB de SSD disponível | 150 GB+ de SSD disponível |
| GPU | Sem placa de vídeo dedicada | Sem placa de vídeo dedicada |
> 📌 Conforme testes reais: cerca de 30 contêineres ociosos somam ~5 GB de memória; picos de processamento/indexação do Dify, JVM do Keycloak e cache de banco de dados adicionam mais 3–5 GB, somando a memória virtual do WSL2. 16 GB é o mínimo e 32 GB é o valor confortável. Todos os grandes modelos usam API externa (deepseek-chat etc.), sem inferência local, portanto **não é necessária GPU**.
### 1.3 Tabela de alocação de portas
A seguir, `<IP-do-servidor>` representa o endereço externo da máquina host (no ambiente atual é `192.168.31.117`; substitua pelo seu próprio IP de intranet ou domínio ao implantar).
| # | Produto | Uso | Acesso local | Acesso na intranet (funcionários) |
| --- | --- | --- | --- | --- |
| 1 | Central de Administração de IA | Portal unificado do administrador | `127.0.0.1:10086` | `<IP-do-servidor>:10086` |
| 2 | Keycloak | Autenticação / SSO | `127.0.0.1:9090` | `<IP-do-servidor>:9090` |
| 3 | NewAPI | Gateway de roteamento de LLM | `127.0.0.1:3000` | `<IP-do-servidor>:3000` |
| 4 | LiteLLM | Proxy de anonimização de PII | `<IP-do-servidor>:4001` | — (chamado apenas pelo NewAPI) |
| 5 | Dify | Plataforma de aplicações de IA | `127.0.0.1` | `<IP-do-servidor>` (porta 80) |
| 6 | Ghost | Portal corporativo | `127.0.0.1:8090` | `<IP-do-servidor>:8090` |
| 7 | Gitea | Código-fonte + CI/CD | `127.0.0.1:3002` | `<IP-do-servidor>:3002` |
| 8 | Servidor de Atualização | Instaladores do DeepChat | `127.0.0.1:8091` | `<IP-do-servidor>:8091` |
| 9 | MCP Gateway | Gateway de Skills / MCP | `127.0.0.1:3100` | `<IP-do-servidor>:3100` |
| 10 | Grafana | Painel de monitoramento | `127.0.0.1:3030` | `<IP-do-servidor>:3030` |
| 11 | Prometheus | Coleta de métricas / alertas | `127.0.0.1:9091` | `<IP-do-servidor>:9091` |
| 12 | Langfuse | Observabilidade de LLM | `127.0.0.1:3010` | `<IP-do-servidor>:3010` |
| 13 | Loki | Agregação de logs (interno) | `127.0.0.1:3110` | — (visualizar pela página de gestão) |
| 14 | MailHog | Recepção local de e-mails | `127.0.0.1:8025` | `<IP-do-servidor>:8025` |
> ⚠️ Acesse sempre pelo **IP de intranet**, não por `localhost` (o Docker Desktop WSL2 tem suporte instável a IPv6 `::1`, causando falha no encaminhamento de portas). Os bancos de dados (MySQL/Redis/PostgreSQL) não são expostos aos usuários e comunicam-se apenas dentro da rede do Docker.
### 1.4 Fluxos de dados principais
#### Fluxo de requisição LLM (a cadeia mais crítica)
1. **① Encaminhar**: DeepChat / Dify envia a requisição ao NewAPI (`:3000/v1`);
2. **② Anonimizar**: o NewAPI encaminha ao LiteLLM, que usa regex + Presidio para substituir celular/CPF/e-mail etc. por `[xxx_REDACTED]`;
3. **③ Chamar o modelo externo**: a requisição anonimizada é enviada ao DeepSeek / GPT / Claude;
4. **④ Restaurar PII**: quando a resposta volta, o LiteLLM restaura as informações sensíveis;
5. **⑤ Devolver**: o resultado final chega ao cliente.
#### Outros fluxos
- **Fluxo de autenticação**: SSO OIDC do Keycloak para login unificado em todos os produtos Web (compartilhando `ai_all_in_one_admin`);
- **Fluxo de observabilidade**: `success_callback` do LiteLLM → Langfuse rastreia cada chamada;
- **Fluxo de atualização automática**: build do Gitea Actions → Servidor de Atualização (:8091) → DeepChat verifica `version.txt` e baixa/instala automaticamente;
- **Fluxo de logs unificados**: Promtail coleta logs de cada contêiner → Loki agrega → consulta na página «Logs unificados» da Central de Administração de IA.
### 1.5 Navegação da estrutura deste manual
Este manual tem três partes: **Implantação** (capítulos 1–13, colocar a plataforma em funcionamento do zero), **Gestão** (capítulos 14–26, operações diárias de cada um dos 13 produtos), **Operações** (capítulos 27–29, backup/verificação de integridade/solução de problemas). A barra lateral permite pular a qualquer momento, e no rodapé da página há navegação para o capítulo anterior/seguinte.
> ✅ Ao implantar, você também pode entregar diretamente a uma ferramenta **AI Agent** (WorkBuddy / OpenClaw etc.) para automatizar: forneça este manual + `docker-compose.yml` + `.env.example` + `scripts/` ao Agent e deixe-o executar passo a passo na ordem da «Implantação» (veja o prompt de implantação do Agent no início do capítulo 2).

## 2. Preparação prévia

### 2.0 Duas formas de implantação
Este manual pode ser executado **manualmente capítulo a capítulo** ou **entregue a uma ferramenta AI Agent para execução automática**. Ao usar o Agent, forneça a ele este diretório (incluindo este manual, `docker-compose.yml`, `.env.example`, `scripts/`) e cole o prompt abaixo.
**Prompt de implantação para copiar ao Agent:**
```
Você é o engenheiro de implantação da plataforma de IA da intranet corporativa. Com base na parte de Implantação do «Manual do Administrador», no docker-compose.yml e no .env.example deste diretório, implante e valide completamente a plataforma «AI AllInOne» nesta máquina. Comunique-se em chinês durante todo o processo.

Primeiro passo — coletar parâmetros (pergunte um por um, sem pular, sem adivinhar):
1) IP de intranet dos serviços externos; 2) hostname do Mercado de Skills (domínio, substituindo <host-do-mercado> em mcp-gateway/skills/skill-market/config.json e SKILL.md, com resolução em hosts/DNS); 3) fonte de identidade (se usar controlador de domínio AD, informe domínio/IP do DC/LDAP base DN/bind DN/senha do bind/sAMAccountName); 4) senha da conta de administrador unificada; 5) API Key do modelo LLM; 6) pergunte conforme necessário sobre webhook de alertas, HTTPS e política de retenção de backup.

Segundo passo — gerar um arquivo de progresso, atualizando e reportando a cada item concluído e a cada problema resolvido.

Terceiro passo — executar estritamente na ordem dos capítulos 1~13 deste manual, prestando atenção às seções «⚠️ Armadilhas críticas» de cada capítulo, priorizando a automação com os scripts em scripts/.

Quarto passo — ao encontrar erros, verifique primeiro os logs (docker logs, endpoints de saúde, configuração) para localizar a causa raiz e corrigir, sem repetir tentativas às cegas.

Quinto passo — validação completa: todos os contêineres Up, SSO do Keycloak, envio de conversa real via NewAPI/LiteLLM para validar anonimização de PII, login pela fonte de identidade, monitoramento/logs/alertas, backup e recuperação, resumindo item por item com ✅/❌.
```
> 💡 Mesmo sem usar o Agent, o trecho acima também serve como «checklist de informações antes da implantação»: antes de começar, deixe claros o IP de intranet, a fonte de identidade, a senha do administrador e a Key do modelo.
### 2.1 Instalar e configurar o Docker Desktop
Após a instalação, o Docker Desktop usa por padrão o backend WSL2 e normalmente não exige configuração extra. Para ajustar manualmente o limite de recursos, crie `.wslconfig` no diretório do usuário:
```
# %UserProfile%\.wslconfig (por exemplo C:\Users\seu-usuario\.wslconfig)
[wsl2]
memory=24GB       # memória máxima do Docker (mínimo 16GB, recomendado 24~32GB)
processors=8      # número de núcleos de CPU (conforme núcleos físicos)
swap=4GB
```
Após salvar, execute `wsl --shutdown` no PowerShell e reinicie o Docker Desktop para aplicar.
> ✅ Verificação: a barra de status do Docker Desktop mostra "Engine running" (verde).
### 2.2 Preparar a estrutura de diretórios
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Criar a rede compartilhada do Docker
```
docker network create ai-platform
docker network ls | findstr ai-platform   # verificação
```
> Todos os contêineres principais se comunicam pela rede `ai-platform` usando o nome do contêiner (por exemplo, o NewAPI acessa o LiteLLM com `http://litellm:4000`, sem passar por localhost).
### 2.4 Fixar o IP de intranet do host (importante)
Quando o host usa WiFi, o IP é atribuído dinamicamente por DHCP e muda ao reiniciar ou ao expirar a concessão; se mudar, todos os endereços de acesso aos produtos usados pelos funcionários ficam inválidos. Recomenda-se configurar **reserva DHCP (vinculação por MAC)** no roteador:
1. Descubra o MAC da placa WiFi: `ipconfig /all`, procure o endereço físico de «Adaptador de LAN sem fio WLAN» (ex.: `60-A3-E3-41-8F-61`);
2. Acesse o painel do roteador (ex.: `http://192.168.31.1`) → configurações de LAN / atribuição de IP estático por DHCP;
3. Adicione a regra: MAC → IP (ex.: `192.168.31.117`), salve;
4. Reconecte o WiFi e confirme que o IP está fixo.
> ✅ A reserva DHCP é mais estável do que definir IP estático no Windows (gestão centralizada no roteador, sem conflitos).
### 2.5 Abrir a rede (a etapa que mais costuma travar)
- **Conseguir acessar o registro de imagens do Docker**: Docker Hub / quay.io / ghcr.io. Se não funcionar, configure primeiro um acelerador de imagens (ex.: DaoCloud).
- **Conseguir acessar o GitHub**: clonar repositórios, baixar dependências públicas. Se não funcionar, use proxy ou baixe o pacote de código-fonte com antecedência.
- **A máquina de destino precisa ser acessível pela intranet**: confirme que o segmento de rede a ser exposto é alcançável.

## 3. Arquivos de configuração e variáveis de ambiente

### 3.1 Os três arquivos de configuração principais
| Arquivo | Uso | Precisa modificar? |
| --- | --- | --- |
| `.env.windows` | Todas as senhas e API Keys externas | **Deve modificar**: preencher a DeepSeek API Key; outros providers conforme necessário |
| `litellm-config.yaml` | Lista de modelos do LiteLLM + regras de anonimização de PII | Normalmente não altera (usando só DeepSeek, pode remover as entradas OpenAI/Claude) |
| `docker-compose.yml` | Orquestração dos serviços principais | Já pré-configurado (inclui `KC_HOSTNAME` do Keycloak + volumes persistentes) |
### 3.2 Visão geral das variáveis de ambiente por categoria
Abra o `.env` (cópia do `.env.windows`) e configure por prioridade.
| Variável | Prioridade | Descrição |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 Imediata | API Key do LLM externo; sem ela a cadeia não funciona |
| `LITELLM_MASTER_KEY` | 🔴 Imediata | Chave de autenticação interna do LiteLLM, usada pelo NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 Imediata | Senha root do MySQL; não convém alterar após a primeira criação |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 Imediata | Senha do administrador do Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 Imediata | Criptografia de sessão do NewAPI, string aleatória |
| `NEWAPI_CRYPTO_SECRET` | 🔴 Imediata | Criptografia de dados do NewAPI, string aleatória |
| `ADMIN_PASSWORD` | 🔴 Imediata | Senha do Global Admin da Central de Administração de IA |
| `SESSION_SECRET` | 🔴 Imediata | Criptografia de sessão da Central de Administração de IA, string aleatória |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 Pode ser depois | Primeiro crie o OIDC Client no Keycloak para obter o Secret (veja o capítulo 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 Pode ser depois | Inicie o Gitea primeiro e obtenha o Token no painel (veja o capítulo 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 Conforme necessidade | Descomente quando for usar e altere em sincronia o `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` e outras de limitação | ⚪ Padrão | No período de testes use 999999; em produção reduza conforme necessário |
| `DEFAULT_QUOTA` | ⚪ Padrão | Cota padrão para novos usuários (em dólares); com 100, o novo usuário ganha 100 dólares |
| `GENERATE_DEFAULT_TOKEN` | ⚪ Padrão | Gera automaticamente uma Key inicial no registro; defina true para o usuário usar logo após o login |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ Padrão | Os valores padrão são suficientes |
### 3.3 🔴 Configuração imediata (obrigatória antes do primeiro start)
| Variável | Descrição | Como obter | Formato |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Key do LLM na nuvem DeepSeek | Registre-se em https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | Chave de administrador interno do LiteLLM (não é a Key do LLM externo) | Gere aleatoriamente (veja abaixo) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | Senha do MySQL | Defina você mesmo; após a primeira criação, **não convém alterar** | Qualquer |
| `KEYCLOAK_ADMIN_PASSWORD` | Senha do administrador do Keycloak | Defina você mesmo, ≥ 8 caracteres | Qualquer |
| `NEWAPI_SESSION_SECRET` | Criptografia de sessão do NewAPI | Gere aleatoriamente | 32 caracteres |
| `NEWAPI_CRYPTO_SECRET` | Criptografia de dados do NewAPI | Gere aleatoriamente | 32 caracteres |
| `ADMIN_PASSWORD` | Senha do administrador da Central de Administração de IA | Defina você mesmo, ≥ 8 caracteres | Qualquer |
| `SESSION_SECRET` | Criptografia de sessão da Central de Administração de IA | Gere aleatoriamente | 64 caracteres |
Gerar string aleatória (PowerShell):
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### Exemplo de preenchimento da API Key
```
# Por padrão já configurado para DeepSeek (descomente e preencha a Key)
DEEPSEEK_API_KEY=sk-sua-chave-real-do-deepseek

# Para usar OpenAI / Claude, descomente e, em sincronia, descomente o bloco model correspondente no litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 Política de alteração de senhas
> ⚠️ `NEWAPI_DB_PASSWORD` envolve o banco já criado; alterar exige apagar o volume correspondente e recriar (os dados serão perdidos), então defina bem na primeira vez.  
> 
>     `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` e outras senhas administrativas podem ser alteradas no painel de cada produto; depois, atualize o `.env` em sincronia (é apenas um lembrete, não afeta a execução).
### 3.5 Explicação do litellm-config.yaml
- `model_list` — define os modelos externos disponíveis; o NewAPI chama via LiteLLM. Por padrão, apenas `deepseek-chat` está habilitado;
- `general_settings.master_key` — chave de administrador do LiteLLM, lida de `LITELLM_MASTER_KEY` no `.env`;
- A anonimização de PII (Presidio) está atualmente **temporariamente comentada** (a API de guardrail da nova versão do LiteLLM mudou e ficou incompatível); para habilitar depois, veja o capítulo 25;
- Use a versão estável `v1.95.1` (`main-latest` tem bugs conhecidos).

## 4. Iniciar serviços principais

### 4.1 Copiar o .env
```
# PowerShell
copy .env.windows .env
```
O Docker Compose lê o `.env` por padrão.
### 4.2 Iniciar todos os serviços principais
```
docker compose -f docker-compose.yml up -d
```
Na primeira vez, todas as imagens serão baixadas (cerca de 5–10 minutos, dependendo da velocidade da rede).
| Imagem | Contêiner | Tamanho |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 Verificar o status dos contêineres
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Espera-se que os 10 contêineres principais estejam todos `Up`. Se algum contêiner ficar constantemente `Restarting`, use `docker logs nome-do-contêiner` para ver a causa.
### 4.4 Correção de problema conhecido: Ghost forçando SQLite
Se o `ghost` ficar sempre em Restarting e o log mostrar `Error: connect ECONNREFUSED <IP-do-servidor>:3306` — significa que o volume de dados ainda contém um `config.production.json` antigo apontando para o MySQL. Correção: declare explicitamente SQLite em `environment` do serviço ghost no compose:
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ No Windows + Docker Desktop WSL2, os dados do volume ficam dentro do disco virtual do WSL2 e o git bash do host não os enxerga, portanto não dá para excluir diretamente o `config.production.json` de dentro do volume; a única saída é a rota de «sobrescrita por variável de ambiente». Também não execute `docker volume rm windows_ghost-data` (isso apagaria os artigos já publicados).
> ✅ Verificação: o log mostra `Ghost database ready` + `Ghost booted`, e `curl.exe -I http://127.0.0.1:8090` retorna 200.
### 4.5 Validar o acesso serviço por serviço
```
# Keycloak — 302 indica OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redireciona para a página de inicialização /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Servidor de Atualização — 403 (diretório vazio, nginx em execução)
curl.exe -I http://127.0.0.1:8091
# Central de Administração de IA — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
O LiteLLM é uma API pura, sem interface Web; valide a partir de dentro do contêiner:
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# Resposta esperada: {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 O proxy HTTP do Docker Desktop WSL2 pode fazer o LiteLLM ficar inacessível a partir do host (resposta HEART/vazia); é um bug conhecido e não afeta o NewAPI, que o chama pelo nome do contêiner.

## 5. Implantação independente do Dify

> 📌 O Dify usa o docker-compose oficial (com ~15 contêineres), com implantação independente para evitar conflitos de porta, usando sua própria rede padrão (diferente da rede `ai-platform` dos serviços principais).
### 5.1 Clonar o Dify
```
# Opção A: GitHub (requer acesso)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Opção B: espelho oficial do Gitee (recomendado na China)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 Corrigir compatibilidade + copiar variáveis de ambiente
```
cd dify\docker

# Corrigir o formato env_file (compatível com Docker Compose antigo)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# Copiar as variáveis de ambiente principais
copy .env.example .env

# Copiar todos os subtemplates (sandbox.env etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Corrigir problema de validação upstream do Dify 1.16.1 (obrigatório)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# Verificar
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ Por que é obrigatório mudar `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: o Dify 1.16.1 elevou esse campo de «permitido 0» para «deve ser > 0», mas o template `shared.env` ainda está 0. Sem a mudança, os 4 contêineres `docker-api-1` / `worker` / `worker_beat` / `api_websocket` quebram logo ao iniciar, com o log `ValidationError: Input should be greater than 0`.
### 5.3 Iniciar o Dify
```
docker compose up -d
docker compose ps
```
> ✅ Todos os contêineres `Up` (`init_permissions` aparecendo como Exited é normal). Abra `http://127.0.0.1/install` no navegador para inicializar a conta de administrador.
### 5.4 Corrigir o endereço WebSocket (sem a mudança, fica reconectando em ws://localhost)
No `.env`, `NEXT_PUBLIC_SOCKET_URL` é por padrão `ws://localhost`; na implantação em intranet, o localhost do navegador aponta para o computador do próprio usuário, fazendo o frontend falhar repetidamente na conexão (a criação de aplicativos/depuração de fluxo de trabalho trava).
```
# No .env, troque para o IP de intranet
NEXT_PUBLIC_SOCKET_URL=ws://<IP-do-servidor>

# No docker-compose.yaml, altere em sincronia o fallback do serviço web
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<IP-do-servidor>}

# Reconstrua o contêiner web para aplicar
docker compose up -d web
```
> 📌 Após a mudança, force a atualização do navegador (Ctrl+F5). Essa variável é lida em tempo de execução; basta alterar o .env + reiniciar o web, sem reconstruir a imagem.
### 5.5 Consulta rápida de armadilhas
> ⚠️ **A senha de login é transmitida em base64**: no Dify 1.16.x, o `password` da interface de login `POST /console/api/login` é a senha codificada em base64. Scripts de login devem primeiro fazer `base64(senha)`; no frontend, quando «clicar em login não faz nada», o `GET /account/profile 401` no console é um fenômeno normal de não logado.
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<domínio-empresa> \
  --new-password '<nova-senha>' \
  --password-confirm '<nova-senha>'
```
> ⚠️ **Redefinir senha de administrador esquecida**: o hash de senha do Dify é `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iterações), não é reversível; use o comando do contêiner para redefinir (nova senha ≥ 8 caracteres):
>     
>     📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai · implantação self-hosted https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak: Realm, usuários e AD

> 📌 Acesso: host `http://127.0.0.1:9090`, intranet `http://<IP-do-servidor>:9090`. Os dados ficam no volume nomeado `keycloak-data`, e não se perdem ao reconstruir o contêiner. As credenciais estão em `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` no `.env.windows`.
### 6.1 Criar o Realm
1. Abra `http://127.0.0.1:9090` no navegador → Administration Console → login do administrador;
2. Menu suspenso no canto superior esquerdo → **Create Realm** → em Realm name, digite `enterprise-ai` → Create.
### 6.2 Método A: criar contas locais (equipes pequenas/testes sem AD)
1. **Groups** → Create Group → `ai-admin`; depois crie `ai-user`;
2. **Users** → Add user → nome de usuário → Create;
3. Aba Credentials → definir senha → Temporary desligado;
4. Aba Groups → adicionar ao grupo `ai-user`.
### 6.3 Método B: importar contas do Active Directory (recomendado)
Quando a empresa já tem controlador de domínio Windows AD, os funcionários fazem login com a conta de domínio, sem necessidade de criar contas manualmente no Keycloak. Pré-requisito: a rede entre o contêiner Docker e o controlador de domínio já está aberta (topologia de rede, Hyper-V Internal Switch e encaminhamento de portas estão no «Guia de integração de AD do Keycloak» `windows-ad-integration.html`).
> 📌 Conta AD necessária: conta de serviço `svc_keycloak` (senha sem expiração, usada para binding LDAP) + 2 usuários de domínio de teste (para validar a sincronização).
#### Criar federação de usuários LDAP
1. Realm enterprise-ai → à esquerda **User Federation** → Add provider → **ldap**;
2. Preencha conforme a tabela abaixo.
| Configuração | Valor | Descrição |
| --- | --- | --- |
| Vendor | **Active Directory** | Selecione AD, não Other (senão o objectGUID não é reconhecido) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V com encaminhamento de porta; em produção use `ldap://dc.domínio-empresa:389` |
| Enable StartTLS | **Off** | LDAP 389 ou LDAPS 636 |
| Bind type | **simple** | Autenticação por usuário + senha |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Deve estar no formato LDAP DN**, não use ~~DOMAIN\usuário~~ |
| Bind credentials | `senha do svc_keycloak` | Veja `.env.windows` |
| Edit mode | **READ_ONLY** | Somente leitura, não grava de volta no AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | Com sub-OU, mude para `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **Não preencha cn** |
| RDN LDAP attribute | `cn` | Atributo de nomeação da entrada |
| UUID LDAP attribute | `objectGUID` | Identificador único imutável do AD |
| User object classes | `person, organizationalPerson, user` | Separados por vírgula |
| Search scope | **Subtree** | **Não selecione One Level** (senão não encontra sub-OU) |
| Pagination | **On** | Busca em lotes quando há muitos usuários |
| Referral | **ignore** | Evita seguir controladores de domínio inexistentes |
| Import users | **On** | Importação completa por sincronização |
| Sync Registrations | **On** | Sincronização imediata no primeiro login |
Save → **Synchronize all users** → aguarde a sincronização terminar.
- ⚠️ Erros comuns de preenchimento:
      
        Bind DN no **formato LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), não ~~DOMAIN\usuário~~;
- Username LDAP attribute = `sAMAccountName`, não `cn`;
- Search scope = **Subtree**;
- **Preserve os espaços no CN**: se o nome de exibição tiver espaços (como `ai all in one admin` com espaço no meio), o Bind DN deve ser escrito `CN=ai all in one admin,...`; usar underline fará a conexão falhar.
#### Validar login AD
1. Abra `http://127.0.0.1:9090/realms/enterprise-ai/account` em janela anônima;
2. Faça login com a conta de domínio (nome de usuário `aitest1` ou UPN `aitest1@<domínio-empresa>`, ambos funcionam);
3. Se redirecionar para o Account Console, está aprovado.
### 6.4 Outras fontes de identidade corporativa (resumo do apêndice N)
O Keycloak também suporta várias fontes de identidade, todas conectadas ao mesmo Realm `enterprise-ai`:
| Fonte de identidade | Método de integração | Pontos-chave |
| --- | --- | --- |
| Microsoft Entra ID (antigo Azure AD) | Identity Providers → OpenID Connect v1.0 | Registre o app no Azure para obter client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (integrado) | Pode usar Mapper para adicionar `hd=domínio` e restringir o domínio |
| GitHub | Identity Providers → GitHub (integrado) | Callback do OAuth App `/broker/github/endpoint` |
| LDAP genérico (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor = Other, Username attribute = `uid` |
| SAML 2.0 genérico (Okta/ADFS) | Identity Providers → SAML v2.0 | Cole a URL de metadados do IdP para preencher automaticamente |
> ✅ Coexistência de múltiplas fontes: no fluxo Authentication → Browser, adicione Identity Provider Redirector para selecionar o IdP automaticamente pelo domínio do e-mail (`@empresa.com`→AD, `@empresa.onmicrosoft.com`→Entra ID).
> 📖 Documentação oficial:documentação oficial do Keycloak https://www.keycloak.org/documentation · guia de administração do servidor https://www.keycloak.org/server/ · federação LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI: inicialização, canais e OIDC

### 7.1 Assistente de instalação inicial (primeiro acesso)
Na primeira inicialização, o NewAPI exibe um assistente de configuração de 4 etapas:
1. **Verificação do banco de dados**: clique em «Verificar conexão do banco», esperando o check verde.
> **Conta de administrador**: nome de usuário `ai_all_in_one_admin`, e-mail `ai_all_in_one_admin@<domínio-empresa>`, senha unificada de administrador.
>         📌 Por que criar primeiro o admin local: neste momento o OIDC ainda não está configurado, então o NewAPI não reconhece o Keycloak; é preciso ter uma conta local para «entrar» e concluir a configuração, para depois ativar o OIDC nas configurações do sistema.
3. **Modo de uso**: selecione «Uso pessoal» (uso interno: funcionários podem se registrar, consumo separado, sem módulo de recarga/cobrança).
4. **Confirmar inicialização**: cria as tabelas do banco → faça login como administrador.
### 7.2 Configurar o canal LLM (apontando para o LiteLLM)
1. **Canais** → adicionar novo canal → tipo `OpenAI`;
2. Base URL preencha `http://litellm:4000` (nome do contêiner, pela rede do Docker, **não localhost**);
3. Na chave, preencha o valor real de `LITELLM_MASTER_KEY` do `.env` (não o valor de exemplo, senão dá erro `No connected db`);
4. Em modelo, preencha `deepseek-chat` (exemplo; conforme a configuração real);
5. Salve → clique em «Testar» para validar a conexão.
Se houver vários providers, repita a adição: tipo `Anthropic Claude` para Claude, tipo `OpenAI` para DeepSeek, com Base URL sempre `http://litellm:4000`.
### 7.3 Criar API Keys
Crie uma para o Dify e outra para o DeepChat, com estatísticas de consumo separadas:
1. À esquerda **API Keys** → criar;
2. Nome `dify-key` → salvar → copiar `sk-xxx` (preencher no provedor de modelos do Dify);
3. Crie também `deepchat-key` → copiar `sk-xxx` (distribuir aos usuários do DeepChat).
### 7.4 Permitir que usuários comuns solicitem Keys por conta própria
Após o login, os funcionários podem criar Keys por conta própria na página «API Keys». Para realmente conseguirem chamar o modelo, é preciso cumprir dois pontos (já pré-configurados no `.env`):
1. **Ter cota**: `DEFAULT_QUOTA=100` (novo usuário ganha 100 dólares de cota);
2. **Ter token**: `GENERATE_DEFAULT_TOKEN=true` (gera o token inicial no registro).
> ⚠️ Só vale para usuários «recém-registrados»: usuários que já fizeram login (como `aitest1`) não recebem automaticamente; o administrador deve definir a cota manualmente na página «Usuários».
### 7.5 Integrar OIDC do Keycloak (para usuários AD entrarem direto)
#### ① Criar o OIDC Client do NewAPI no Keycloak
1. Realm enterprise-ai → **Clients** → Create client;
2. Client ID `newapi`, tipo OpenID Connect;
3. **Client authentication: On** (obrigatório, senão não aparece a aba Credentials), Standard flow / Direct access grants: On;
4. Valid redirect URIs: `http://<IP-do-servidor>:3000/*` e `http://127.0.0.1:3000/*`;
5. Salve → aba Credentials → copie o Client secret.
#### ② Ativar OIDC no NewAPI
Painel do NewAPI → **Configurações do sistema → Autenticação → OAuth personalizado → Adicionar provedor OAuth**, preencha:
| Grupo | Configuração | Valor |
| --- | --- | --- |
| Configuração rápida | Template predefinido / Endereço da API | `Keycloak` / `http://127.0.0.1:9090` |
| Informações básicas | Nome do provedor / Identificador | `Keycloak` / `keycloak` |
| Credenciais | Client ID / Secret | `newapi` / valor copiado do Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mapeamento de campos | ID do usuário / nome / e-mail | `sub` / `preferred_username` / `email` |
Após clicar em «Descoberta automática» para preencher os endpoints, **troque os endpoints de token e de informações do usuário para `host.docker.internal:9090`** (o contêiner do NewAPI chama o Keycloak internamente), mantendo o endpoint de autorização como `<IP-do-servidor>:9090` (usado no redirecionamento do navegador). Escopo `openid profile email`.
- ⚠️ Duas mudanças obrigatórias, senão o login falha:
      
        **Após salvar, volte ao Keycloak e complemente a URL de callback**: adicione `http://<IP-do-servidor>:3000/oauth/keycloak` e `http://127.0.0.1:3000/oauth/keycloak` em Valid redirect URIs;
- **Defina o «Endereço do servidor» do NewAPI como endereço de intranet**: configurações do sistema → configurações gerais → endereço do servidor para `http://<IP-do-servidor>:3000` (o padrão localhost faz a troca de token dar erro `invalid_grant - Incorrect redirect_uri`). Depois, acesse o NewAPI também pelo IP de intranet na própria máquina.
Método para alterar o banco:
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-do-servidor>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-do-servidor>:3000';"
docker compose restart new-api
```
> ⚠️ Solução de problemas: login retorna **429 Too Many Requests** — a limitação de taxa das interfaces críticas do NewAPI (padrão 20 vezes/20 minutos) foi acionada. Solução temporária: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; a solução permanente já está pré-configurada no `.env` com quatro grupos de variáveis como `CRITICAL_RATE_LIMIT_ENABLE=false`.
> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai · repositório open source https://github.com/QuantumNous/new-api

## 8. LiteLLM: validação e cache

> ⚠️ A anonimização de PII (guardrail Presidio) está atualmente **desativada temporariamente**: o formato de configuração de guardrail da nova versão do LiteLLM mudou, e essa seção do `litellm-config.yaml` foi comentada; por enquanto o LiteLLM só faz encaminhamento de proxy (sem anonimizar). O método de ativação está no capítulo 25.
### 8.1 Validar o funcionamento básico do LiteLLM
```
curl -X POST http://<IP-do-servidor>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` é a chave de administrador do LiteLLM; use o valor real do `.env` (não o placeholder em si, senão 401). E é obrigatório usar o IP de intranet `<IP-do-servidor>:4001`, não `127.0.0.1:4001` (problema de encaminhamento de porta do WSL2).
### 8.2 Cache de respostas (já integrado, economiza tokens)
O LiteLLM já vem com cache exact match no Redis: requisições totalmente idênticas (modelo + mensagens + parâmetros) retornam diretamente do cache, compartilhado entre usuários e economizando tokens.
```
# final do litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis de cache independente
    port: 6379
    ttl: 3600            # cache de 1 hora
```
> Verificação: `curl http://<IP-do-servidor>:4001/cache/ping -H "Authorization: Bearer <KEY>"` retorna `ping_response: true`; duas requisições idênticas seguidas: a segunda cai para a casa dos milissegundos. Para desativar o cache: `cache: false` e reinicie o litellm.
### 8.3 Adicionar mais provedores de LLM
1. No `.env`, descomente `# OPENAI_API_KEY=` e preencha a Key;
2. No `litellm-config.yaml`, descomente o bloco model correspondente;
3. `docker compose up -d litellm`.
> 📖 Documentação oficial:documentação oficial do LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Configuração do Dify / Ghost / Gitea

### 9.1 Dify: configurar o provedor de modelos
1. Abra `http://<IP-do-servidor>` → defina o e-mail/senha do administrador na primeira vez (e-mail `ai_all_in_one_admin@<domínio-empresa>`);
  - **Configurações → Provedores de modelos** → OpenAI-API-compatible → adicionar modelo:
        
          Nome do modelo `deepseek-chat` (conforme o real);
  - API Key: `sk-xxx` da `dify-key`;
  - API endpoint: `http://host.docker.internal:3000/v1`.
3. Studio → criar assistente de chat → selecionar modelo → enviar mensagem para validar.
> ⚠️ O Dify usa `host.docker.internal` em vez do nome do contêiner, porque o Dify está em sua própria rede, diferente da rede do NewAPI.
### 9.2 Ghost: configurar o portal
1. Entrada do painel `http://<IP-do-servidor>:8090/ghost/` (**atenção ao sufixo /ghost/**). Na primeira vez, use o assistente setup para criar o administrador (e-mail `ai_all_in_one_admin@<domínio-empresa>`, senha ≥ 10 caracteres);
2. Automação: execute `scripts\ghost-setup.ps1` para criar o administrador de uma vez via setup API (equivalente ao assistente; se já inicializado, é pulado automaticamente);
3. **Tema**: Design → temas, ative diretamente os temas Casper/Source embutidos;
4. **Menu de navegação**: Design → menus → crie o «menu principal».
| Item de menu | Tipo | URL |
| --- | --- | --- |
| Início | Página | `/` |
| Notícias | Categoria | `/category/news` |
| Central de downloads | Página | `/downloads` |
| Workbench de IA | Link personalizado | `http://<IP-do-servidor>` |
| Documentação de ajuda | Categoria | `/category/docs` |
1. **Página da central de downloads**: páginas → criar «Central de downloads» (slug `downloads`), com o link de intranet do instalador do DeepChat no conteúdo.
```
## DeepChat Enterprise
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<IP-do-servidor>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<IP-do-servidor>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ Não clique em «Registrar» na página inicial `/` — é o registro de visitantes/assinantes (dá 500 sem SMTP configurado); a entrada do administrador é `/ghost/`. Não instale temas da versão mais recente pelo GitHub (podem ser compatíveis com Ghost 6.x, e no 5.x dão incompatible).
### 9.3 Gitea: inicialização e registro do Runner
1. Abra `http://<IP-do-servidor>:3002` → assistente de instalação (banco SQLite já pré-configurado) → crie o administrador (nome de usuário `ai_all_in_one_admin`);
2. Avatar no canto superior direito → **Site Administration → Actions** → confirme que Enabled Actions está ativado;
3. **Runners → Create new Runner** → copie o Registration Token;
4. Preencha o Token em `GITEA_RUNNER_TOKEN` no `.env` e reconstrua o Runner:
```
# ⚠️ Deve usar up -d, não restart (restart não relê o token do .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ Armadilha 1: o erro `readonly database` geralmente é porque o `gitea.db` está com dono root; apague o db com dono root para que ele seja recriado com o usuário git.  
> 
>     ⚠️ Armadilha 2: `ROOT_URL` deve ser `http://<IP-do-servidor>:3002/`, senão os links de repositório gerados ficam localhost e os funcionários não conseguem abrir.
> 
>     📖 Documentação oficial:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (em chinês) https://docs.gitea.com/zh-cn

## 10. Distribuição e CI/CD do DeepChat

### 10.1 Cadeia de distribuição
Cadeia de distribuição = instaladores do GitHub Releases → Gitea Actions do repositório `deepchat-sync` → Servidor de Atualização (:8091) → página de downloads do Ghost → download pelos funcionários.
> 📌 O repositório mirror do código-fonte `deepchat` foi removido — mirror só sincroniza o código git, não sincroniza os instaladores dos releases, portanto é inútil para a distribuição. Se precisar de auditoria de código/desenvolvimento secundário, crie um separado.
### 10.2 Baixar o instalador para o Servidor de Atualização
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
Verificação: `curl -I http://<IP-do-servidor>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206. Depois atualize a página de downloads do Ghost (veja o capítulo 9).
### 10.3 Sincronização automática (Gitea Actions, recomendado)
| Componente | Descrição |
| --- | --- |
| Repositório `deepchat-sync` | Repositório comum (não pode ser mirror), contém `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Gatilho | `schedule` (todos os dias às 2h UTC) + `workflow_dispatch` (manual) |
| Lógica | Consulta a tag mais recente do GitHub → compara com `version.txt` → se houver versão nova, baixa + atualiza a página de downloads do Ghost + grava a versão |
```
# Disparar manualmente uma vez
curl -X POST "http://<IP-do-servidor>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<senha>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ Armadilhas críticas: ① o `container.network` do act_runner deve ser configurado via `config.yaml` (+ variável de ambiente `CONFIG_FILE`), senão o contêiner do job não resolve o hostname `gitea`; ② o docker.sock é montado automaticamente pelo runner, não monte novamente nas options (dá Duplicate mount point).
### 10.4 Configuração de fonte de download na China (sync-config.json)
Os instaladores da página de downloads do site oficial `deepchatai.cn` ainda apontam para o GitHub, que geralmente não funciona na China. A solução real é o `sync-config.json`:
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
### 10.5 Método B: build de versão personalizada com Docker (opcional)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# dentro do contêiner
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# os artefatos ficam em dist/; após sair, copie para deepchat-updates/
```
### 10.6 Configurar o cliente DeepChat (lado do funcionário)
1. DeepChat → Configurações → serviço de modelos → Provider personalizado / compatível com OpenAI;
2. API Base URL: `http://<IP-do-servidor>:3000/v1` (obrigatório IP de intranet);
3. API Key: `sk-xxx` da `deepchat-key`;
4. Modelo: `deepseek-chat`, salve e teste a conversa.
> 📖 Documentação oficial:guia rápido do DeepChat https://deepchatai.cn/docs/guide/getting-started/ · repositório open source https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway e Mercado de Skills

> 📌 O MCP Gateway é baseado no SDK oficial `@modelcontextprotocol/sdk`, expõe o endpoint Streamable HTTP padrão `/mcp`, já incorporado ao `docker-compose.yml` principal (porta 3100), iniciando junto com os serviços principais. O código-fonte fica em `mcp-gateway/`.
### 11.1 Ferramentas de plataforma integradas
| Ferramenta | Uso |
| --- | --- |
| `platform_time` | Retorna a hora atual do servidor |
| `platform_echo` | Ecoa o texto (teste de conectividade) |
| `platform_services` | Lista os serviços da plataforma |
### 11.2 Agregar servidores MCP externos
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
### 11.3 Integração do cliente
1. DeepChat: Configurações → MCP → adicionar servidor → tipo «HTTP transmissível», URL `http://<IP-do-servidor>:3100/mcp`;
2. Fluxo de trabalho do Dify: configurar ferramenta personalizada / ferramenta MCP apontando para o mesmo endereço.
> Verificação: `curl http://<IP-do-servidor>:3100/health` retorna `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` retorna a lista de ferramentas.
### 11.4 Mercado de Skills (distribuição de pacotes de skills na intranet)
| Endpoint | Função |
| --- | --- |
| `/market` | Página do mercado de Skills (navegação por cartões + download de ZIP + copiar endereço de instalação) |
| `/skills` | JSON da lista de skills (name/description/version) |
| `/skills/<nome>.zip` | Download do pacote de skills (empacotamento dinâmico) |
As skills ficam no diretório `mcp-gateway/skills/` (subdiretórios com SKILL.md); **a varredura é automática a cada requisição, sem necessidade de reiniciar**. A skill de bootstrap `skill-market` está integrada.
> 📌 No DeepChat, MCP e Skill são dois conceitos diferentes: MCP é «ferramenta» (function calling), Skill é «pacote de habilidades do agente» (SKILL.md + scripts). A Skill do DeepChat não tem «URL de mercado personalizado», suportando apenas instalação por pasta/ZIP/URL; a distribuição na intranet é feita de forma indireta via «instalação por URL».
### 11.5 ⚠️ Hostname do Mercado de Skills (parâmetro de implantação, obrigatório substituir)
O «Assistente de Skills» lê `market_url` do `config.json` para solicitar a lista de `/skills`. Dois pontos críticos:
- **Use hostname, não IP**: o ambiente do agente do DeepChat anonimiza o IP como `[IP_ADDRESS_REDACTED]`, impossibilitando ler o endereço real;
- **O hostname é um parâmetro de implantação**: difere em cada implantação, não copie.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<host-do-mercado>:3100" }
```
##### Automático (implantação com Agent)
Na coleta de parâmetros, o Agent pergunta pelo «hostname do Mercado de Skills» e substitui automaticamente `<host-do-mercado>` em `config.json` e `SKILL.md`.
##### Manual
1. Edite `config.json` + o endereço de fallback do `SKILL.md`, substituindo `<host-do-mercado>`;
2. Torne o hostname resolvível: em máquina única, adicione em `C:\Windows\System32\drivers\etc\hosts` a linha `<IP-do-servidor>  <hostname>`; na intranet da empresa, adicione registro A no DNS.
> ✅ Recomenda-se usar FQDN «nome do serviço + domínio da empresa» como hostname, por exemplo `skillmarket.seu-domínio-empresa`. Para adicionar registro A no DNS: no controlador de domínio «DNS → zona de pesquisa direta → seu domínio → novo host (A)», ou use `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "seu-domínio" -IPv4Address "<IP-do-servidor>"`.
### 11.6 API de gestão (para a Central de Administração de IA criar/alterar/excluir)
| Endpoint | Função |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | CRUD de servidores MCP (grava de volta na configuração + reconexão automática) |
| `POST /api/skills/upload` | Upload do zip de skills (valida SKILL.md, previne path traversal) |
| `DELETE /api/skills/:name` | Excluir skill |
Requer o header `X-Admin-Token` (`MCP_ADMIN_TOKEN` do `.env`). É chamado por proxy pela página «MCP Gateway» da Central de Administração de IA (protegida pela role `ai-platform-admin`).
> 📖 Documentação oficial:protocolo MCP oficial https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. Central de Administração de IA

> 📌 Posicionamento: não é uma plataforma de gestão do Docker (1Panel/Portainer), mas um painel unificado voltado ao administrador — autenticação Keycloak + menu lateral com links para todos os produtos + Dashboard com status do cluster + conta de administrador unificada.
### 12.1 Capacidades principais
| Item de menu | Comportamento | Descrição |
| --- | --- | --- |
| 📊 Dashboard geral | Página embutida | Métricas de negócio de 8 produtos + serviços Docker (agrupados por produto) + informações do sistema |
| Ghost / Dify / Gitea / Keycloak | Página de estatísticas embutida | Veja as estatísticas primeiro; clicar em «Abrir painel» é que redireciona |
| 🔀 Gestão do NewAPI | Página embutida | Canais/usuários/chaves + relatórios de custo + logs de auditoria |
| 🔌 MCP Gateway | Página de gestão embutida | Adicionar/remover servidores MCP, upload/exclusão de Skills |
| 📈 Monitoramento / 🔍 Observabilidade | Nova aba | Grafana :3030 / Langfuse :3010 |
| 📜 Logs unificados | Página embutida | Consulta ao Loki por contêiner + palavra-chave + tempo |
| 💾 Backup e recuperação | Página embutida | Lista de backups + backup imediato + recuperação com um clique |
| 🩺 Teste de disponibilidade | Página embutida | Teste da cadeia completa por agendamento + manual |
| 📄 Geração de relatórios | Página embutida | Exportação .md por período personalizado |
| ⚙️ Configurações do sistema | Página embutida | Idioma da interface (9 idiomas) + URLs de entrada dos produtos |
### 12.2 Inicializar o Global Administrator
```
# configurar no .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=ver lista de contas e senhas
ADMIN_EMAIL=ai_all_in_one_admin@<domínio-empresa>
```
Após iniciar, cria automaticamente o usuário `ai_all_in_one_admin` no Keycloak (pula se já existir) e atribui a Realm Role `ai-platform-admin`. Conceito central: **uma única conta Global Admin para gerenciar toda a plataforma**.
### 12.3 Implantação com Docker Compose
```
# pré-requisito: instalar dependências (uma vez)
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<IP-do-servidor>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<domínio-empresa>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<IP-do-servidor>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Configuração do cliente Keycloak
1. Keycloak → enterprise-ai → Clients → Create;
2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow ambos On;
3. Valid Redirect URIs: `http://127.0.0.1:10086/*` e `http://<IP-do-servidor>:10086/*`;
4. Copie o Client Secret → preencha `KEYCLOAK_CLIENT_SECRET` no `.env` → `docker compose up -d admin-portal`;
5. Crie a Realm Role `ai-platform-admin` e atribua a `ai_all_in_one_admin`.
- ⚠️ Pontos de implantação/solução de problemas:
      
        A sessão do admin-portal fica em memória; reconstruir o contêiner com `up -d` **limpa as sessões de login** (precisa logar de novo);
- A página inicial `/` deve ser protegida pelo Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explícito), senão renderiza um painel vazio sem login;
- Para estatísticas do Dify, use o e-mail real do administrador (`ai_all_in_one_admin@<domínio-empresa>`, igual ao admin global do AD);
- **Após alterar o server.js, é obrigatório `docker restart admin-portal`**, não pode usar `up -d` (a mudança do conteúdo do arquivo no volume não dispara reconstrução).
### 12.5 Verificação
1. Abra `http://<IP-do-servidor>:10086` → redireciona automaticamente ao login do Keycloak (sem login não mostra painel vazio);
2. Entre com `ai_all_in_one_admin` → entra no dashboard geral;
3. O Dashboard mostra métricas de 8 produtos + agrupamento de contêineres;
4. Ao clicar em cada produto, veja as estatísticas primeiro; clicar em «Abrir painel» é que redireciona;
5. As configurações do sistema permitem alternar entre 9 idiomas.
### 12.6 Autorização de admin por módulo + gerenciamento da página Keycloak (v0.91)
O administrador global pode gerenciar outros administradores e o Keycloak pelo AI Admin Center:
- **Contas de administrador**: pesquise uma conta existente no IdP do Keycloak (usuários AD/LDAP, sem nova conta, sem senha) → escolha módulos → confirme. O sistema atribui o Realm Role `admin:<produto>` e **provisiona de fato o produto** (SSO primeiro, API de reserva): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revogar um módulo ou excluir um admin **remove a conta do produto**. Produtos sem SSO geram senha temporária, visível pelo ícone 🔑 (somente admin global). Não-admins veem o diálogo «Você não é administrador» e são desconectados.
- **Página Keycloak**: botões «Sincronizar tudo / Sinc. alterados» para trazer mudanças do AD em um clique; cada linha tem «Editar» (para o console Keycloak) e «Excluir»; a seção de funções permite criar/excluir funções e ver membros. Ações de sincronização/exclusão/funções somente para admin global.
> ⚠️ Nota: o Keycloak não tem endpoint de «sincronizar usuário único» — a sincronização incremental traz todas as contas AD alteradas. Usuários federados AD reaparecem após a próxima sincronização completa ou o próximo login SSO; para removê-los permanentemente, desative/exclua a conta no AD.

## 13. Lista de verificação de interconexão

A parte de implantação termina aqui. Por fim, valide os 12 itens abaixo um a um; somente com todos ✅ a plataforma estará realmente funcionando.
| # | Interconexão | Método de verificação |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | Teste de canal do NewAPI recebe OK |
| 2 | Dify → NewAPI | Teste do provedor de modelos do Dify recebe resposta |
| 3 | DeepChat → NewAPI | Enviar mensagem no DeepChat recebe resposta |
| 4 | Keycloak → NewAPI | Login OIDC no NewAPI com conta Keycloak |
| 5 | Keycloak → Dify | Login SSO no Dify com conta Keycloak |
| 6 | MCP Gateway → DeepChat | DeepChat obtém a lista de ferramentas MCP e as chama |
| 7 | MCP Gateway → Dify | Fluxo de trabalho do Dify chama a ferramenta MCP |
| 8 | Gitea Runner → Docker | Runner executa tarefas de CI/CD |
| 9 | Gitea → Servidor de Atualização | Artefatos de CI podem ser enviados ao Servidor de Atualização |
| 10 | Ghost API → Gitea | Gitea Actions pode chamar a API do Ghost para publicar avisos |
| 11 | Ghost → redirecionamento para Dify | «Workbench de IA» do portal redireciona corretamente ao Dify |
| 12 | Central de Administração de IA | Dashboard mostra todos os contêineres + menu lateral acessa todos os produtos |
> ✅ Após passar em todos, continue lendo a Parte 2 «Gestão» para aprender as operações diárias de cada produto, e a Parte 3 «Operações» para backup, verificação de integridade e solução de problemas.

**Parte 2 · Gestão (operações diárias de cada produto)**

## 14. Gestão diária do Keycloak

Keycloak**Entrada**: http://<IP-do-servidor>:9090 → Administration Console → login do administrador.
> 📌 Muitas dessas operações também podem ser feitas no AI Admin Center → página Keycloak (somente admin global): sincronização LDAP completa/incremental, excluir usuários e gerenciamento de funções (listar/criar/excluir/ver membros). Ver capítulo 12.6.
### 14.1 Gerenciar usuários
1. **Criar usuário**: Users → Add user → preencher nome de usuário → Create;
2. **Definir senha**: aba Credentials do usuário → definir senha → Temporary desligado (senão força troca no primeiro login);
3. **Redefinir senha**: Users → localizar o usuário → Credentials → Set password;
4. **Desativar/ativar**: botão Enabled no topo dos detalhes do usuário (após desativar, todo SSO do usuário perde efeito imediatamente);
5. **Excluir**: detalhes do usuário → Delete.
### 14.2 Roles e permissões
- **Realm Role**: Realm roles → Create role para criar a role (como `ai-platform-admin`);
- **Atribuir role**: usuário → Role mapping → Assign role;
- **Grupos**: Groups → criar grupo (`ai-admin` / `ai-user`) → adicionar usuários ao grupo; a role é atribuída ao grupo, e os usuários herdam as permissões do grupo.
> ✅ As permissões de gestão são controladas de forma unificada pela role `ai-platform-admin`; cada produto usa essa role para identificar o administrador ao integrar SSO.
### 14.3 Clientes OIDC (novos produtos integrando SSO)
1. Clients → Create client → Client ID com o nome do produto (como `newapi` / `grafana` / `langfuse`);
2. Client authentication: On (senão não aparece a aba Credentials), Standard flow: On;
3. Valid redirect URIs / Web origins: preencher o endereço de callback do produto (adicionar tanto o IP de intranet quanto 127.0.0.1);
4. Salvar → copiar o Client secret na aba Credentials para o lado do produto.
### 14.4 Manutenção da federação AD / LDAP
- **Alterar controlador de domínio/senha**: User Federation → clicar no LDAP Provider → alterar Connection URL / Bind credentials → Save;
- **Sincronização manual**: Synchronize all users;
- **Mapeamento de grupos**: aba Mappers → group-ldap-mapper → Groups DN define o contêiner onde estão os grupos do AD, mapeando os grupos do AD para roles do Keycloak.
### 14.5 Gerenciamento de sessões
- **Ver sessões ativas**: Users → um usuário → Sessions;
- **Forçar logout**: Sessions → Sign out all;
- **Configuração global de sessão/token**: Realm settings → abas Sessions / Tokens para ajustar o tempo limite.
> ⚠️ Revisão de armadilhas críticas: ① preserve os espaços no CN do bind DN; ② Username LDAP attribute = `sAMAccountName`, não `cn`; ③ Search scope = Subtree; ④ SSO com `unknown_error` geralmente é o serviço iphlpsvc do host parado, fazendo o encaminhamento de porta do AD falhar; ⑤ quando a VM do controlador de domínio AD não está ligada, o login de contas federadas por LDAP dá `LDAP Connection refused`.
> 📖 Documentação oficial:documentação oficial do Keycloak https://www.keycloak.org/documentation · guia de administração do servidor https://www.keycloak.org/server/

## 15. Gestão diária do NewAPI

NewAPI**Entrada**: http://<IP-do-servidor>:3000.
### 15.1 Gerenciamento de canais (modelos upstream)
1. **Adicionar canal**: canais → adicionar novo canal → tipo OpenAI (ou Claude etc.) → Base URL `http://litellm:4000` → chave `LITELLM_MASTER_KEY` → preencher nome do modelo → salvar;
2. **Testar**: na lista de canais, clique em «Testar» e selecione o modelo para validar a conexão;
3. **Desativar/ativar**: botão na lista de canais; desativado, o canal deixa de receber requisições;
4. **Prioridade/peso**: com vários canais do mesmo modelo, divida o fluxo por prioridade/peso.
### 15.2 Gerenciamento de tokens (API Keys)
1. **Criar**: API Keys → criar token → nomear (como `deepchat-key`) → pode definir cota/expiração/limite de modelo → salvar;
2. **Copiar a Key**: começa com `sk-`, **é exibida só uma vez, salve imediatamente**;
3. **Desativar/excluir**: operações na lista de tokens (desativada, a Key perde efeito na hora);
4. **Consultar consumo**: detalhes do token mostram a cota já consumida.
### 15.3 Cotas e usuários
- **Cota padrão de novo usuário**: `DEFAULT_QUOTA` (sugere-se 100 dólares);
- **Aumentar cota de um usuário**: página de usuários → editar o usuário → definir cota;
- **Recarga/banimento**: operações na página de usuários;
- **Gestão por grupos**: crie grupos por departamento, defina multiplicador de modelo/cota; usuários no grupo passam a ser controlados por departamento.
### 15.4 Logs e custos
- **Página de logs**: consultar usuário/modelo/token/cota/custo/IP de origem de cada chamada;
- **Relatório de custos**: a página «Gestão do NewAPI» da Central de Administração de IA tem relatório de custos agregado por usuário/modelo/data + os últimos 100 logs de auditoria.
> 📌 O registro do IP do cliente depende da configuração do usuário «registrar log de IP» (`record_ip_log`, desligada por padrão); quando precisar de auditoria de IP, ative para o usuário correspondente.
### 15.5 Pontos-chave das configurações do sistema
- **Endereço do servidor**: deve ser o endereço de intranet `http://<IP-do-servidor>:3000` (senão o OIDC dá `invalid_grant - Incorrect redirect_uri`);
- **Autenticação → OAuth personalizado**: integração OIDC do Keycloak (veja o capítulo 7);
- **Modo de uso**: alterna entre uso pessoal ↔ operação externa.
> ⚠️ Revisão de armadilhas críticas: ① a Base URL do canal deve ser sempre o nome do contêiner `http://litellm:4000`; ② a limitação de taxa 429 é controlada por variáveis como `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ para alterar o banco, use diretamente a variável de ambiente `MYSQL_PWD`, evitando que o aviso de senha no stderr seja interpretado como erro.
> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai · repositório open source https://github.com/QuantumNous/new-api

## 16. Gestão diária do LiteLLM

**Entrada**: http://<IP-do-servidor>:4001 (API pura, sem interface Web; para depurar use `/v1/models`). A configuração fica em `litellm-config.yaml`.
### 16.1 Manutenção da lista de modelos
Edite `model_list` em `litellm-config.yaml` para adicionar/remover modelos e as API Keys correspondentes. Passos para adicionar um novo provider:
1. No `.env`, descomente `# OPENAI_API_KEY=` e preencha a Key;
2. No `litellm-config.yaml`, descomente o bloco model correspondente;
3. `docker compose up -d litellm`.
### 16.2 Cache de respostas
Cache exact match no Redis: requisições totalmente idênticas são compartilhadas entre usuários. Ajuste `cache_params.ttl` (padrão 3600 segundos). Desativar: `cache: false` e reinicie.
### 16.3 Reporte ao Langfuse
Reporta automaticamente cada chamada via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` do `.env`.
### 16.4 Reinício e solução de problemas
```
docker compose restart litellm          # reinicia após alterar a configuração
docker logs litellm --tail 50           # ver logs
```
> ⚠️ Armadilhas críticas: ① guardrails precisam de `default_on: true` para valer globalmente; ② a anonimização de PII (Presidio) está atualmente comentada por mudança na API upstream, funcionando apenas como proxy puro; ③ use a versão estável `v1.95.1` (`main-latest` tem bugs).
> 📖 Documentação oficial:documentação oficial do LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Gestão diária do Dify

Dify**Entrada**: http://<IP-do-servidor> (porta 80, compose oficial independente; upgrades e manutenção são feitos separadamente em `dify/docker/`).
### 17.1 Gerenciamento de aplicações (Studio)
1. **Criar aplicação**: Studio → criar aplicação em branco → escolher tipo (assistente de chat / Agent / fluxo de trabalho / geração de texto);
2. **Orquestração**: arraste nós para orquestrar prompts, ferramentas, bases de conhecimento, variáveis;
3. **Depurar**: «Pré-visualização» no canto superior direito para executar a depuração;
4. **Publicar**: após passar na depuração, «Publicar» → gerar link de compartilhamento ou incorporar em aplicação Web.
### 17.2 Gerenciamento de bases de conhecimento
1. Base de conhecimento → criar base de conhecimento;
2. Enviar documentos (Word / PDF / Markdown / link de página), escolher regra de segmentação + modo de indexação (alta qualidade/econômico);
3. «Adicionar» essa base na aplicação e a IA passa a responder com base nos documentos.
> 📌 O conteúdo da base de conhecimento é usado pela IA para responder; não envie material confidencial (obedeça à norma de classificação de dados).
### 17.3 Provedores de modelos
- **Adicionar modelo**: Configurações → provedores de modelos → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key`;
- **Configuração de modelos do sistema**: defina os modelos padrão de chat/raciocínio/embedding.
### 17.4 Membros e permissões
- **Membros**: convide membros para o workspace, defina roles Owner/Admin/Editor/Normal;
- **Método de login**: Configurações → método de login → pode integrar OIDC (Keycloak) para SSO.
### 17.5 Upgrade e manutenção
```
cd dify\docker
git pull                          # baixar a versão mais recente
docker compose pull               # baixar novas imagens
docker compose up -d              # reconstruir
```
> ⚠️ Armadilhas críticas: ① o WebSocket `NEXT_PUBLIC_SOCKET_URL` deve usar IP de intranet; ② a senha de login é codificada em base64; ③ esqueceu a senha? Use `docker exec docker-api-1 flask reset-password` (≥8 caracteres).
> 📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai · self-hosted https://docs.dify.ai/getting-started/install-self-hosted

## 18. Gestão diária do Ghost

Ghost**Entrada**: frontend http://<IP-do-servidor>:8090; painel http://<IP-do-servidor>:8090/ghost/ (atenção ao sufixo /ghost/).
### 18.1 Entrar no painel
O painel do Ghost 5 usa **login sem senha**: digite o e-mail → o Ghost envia um código de 6 dígitos ao MailHog (`:8025`). Um jeito mais rápido: na Central de Administração de IA, clique no botão «Abrir» de «Painel do Ghost», que conclui o login automaticamente (calcula o código TOTP localmente, sem consultar o e-mail).
### 18.2 Publicar conteúdo
1. **Artigos**: Posts → New post → escrever conteúdo (editor Markdown) → Publish;
2. **Páginas**: Pages → New page (como «Central de downloads», slug `downloads`);
3. **Tags/categorias**: Tags → criar categoria (como `news` / `docs`), e classificar os artigos na categoria.
### 18.3 Menu de navegação
1. Painel → Design → menus (Navigation);
2. Edite o menu principal «Primary», adicionando Início/Notícias/Central de downloads/Workbench de IA/Documentação de ajuda (veja a tabela de menus do capítulo 9).
### 18.4 Temas
- **Alternar**: Design → temas, ative diretamente os temas Casper / Source embutidos;
- **Instalar**: mercado de temas (Design → Change theme) ou upload de zip.
> ⚠️ Não instale temas da versão mais recente pelo GitHub (podem ser compatíveis com Ghost 6.x, e no 5.x dão incompatible); instale o zip de versão antiga.
### 18.5 Membros e assinaturas (se necessário)
- Members: gerenciar assinantes;
- Se não precisar de assinaturas, ignore este módulo (portais de intranet normalmente não usam).
### 18.6 Integrações (API Token)
1. Painel → Settings → Integrations → adicionar integração personalizada;
2. Gerar Admin API Key (formato `id:secret`), usada pelo Gitea Actions para publicar avisos e outras automações.
> ⚠️ Armadilhas críticas: ① não clique em «Registrar» na página inicial `/` (é o registro de visitantes/assinantes); ② o código de 6 dígitos é essencialmente TOTP, e a Central de Administração de IA consegue calculá-lo localmente; ③ mesmo calculando o código localmente, o Ghost ainda envia o e-mail de verdade, então o MailHog deve ser mantido (senão dá `Failed to send email`).
> 📖 Documentação oficial:documentação oficial do Ghost https://ghost.org/docs/ · painel de administração https://ghost.org/docs/admin/

## 19. Gestão diária do Gitea

Gitea**Entrada**: Web http://<IP-do-servidor>:3002; SSH `ssh://git@<IP-do-servidor>:2222`.
### 19.1 Repositórios e organizações
1. **Criar repositório**: + no canto superior direito → New repository;
2. **Criar organização**: + → New organization, crie repositórios e gerencie equipes dentro da organização;
3. **Migrar repositório externo**: + → New migration, preencha o endereço do GitHub para mirror (sincroniza o código-fonte somente leitura).
### 19.2 Usuários e permissões
- **Adicionar usuário**: Site Administration → User Accounts → Create user;
- **Permissão de repositório**: repositório → Settings → Collaborators;
- **Equipes da organização**: organização → Teams → criar equipe → adicionar membros → atribuir permissão de repositório.
### 19.3 Gerenciamento de Actions / Runner
1. **Ativar Actions**: Site Administration → Actions → Enabled;
2. **Registrar Runner**: Runners → Create new Runner → copiar Token → preencher `GITEA_RUNNER_TOKEN` no `.env` → `docker compose up -d gitea-runner`;
3. **Ver status do Runner**: a página Runners mostra Idle (verde), o que é normal;
4. **Executar workflow**: repositório → Actions → execução manual ou gatilho por push.
> ⚠️ Para alterar o token do Runner, é obrigatório `up -d` (restart não relê o .env).
### 19.4 Configurações do site
- **ROOT_URL**: `GITEA__server__ROOT_URL` deve ser o endereço de intranet `http://<IP-do-servidor>:3002/`, senão os links de repositório gerados ficam localhost;
- **Política de registro**: Site Administration → Config para ajustar o registro e a configuração de e-mail.
> ⚠️ Armadilha crítica: o erro `readonly database` geralmente é porque o `gitea.db` está com dono root; apague o db com dono root para que seja recriado com o usuário git.
> 📖 Documentação oficial:documentação oficial do Gitea (em chinês) https://docs.gitea.com/zh-cn · administração https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. Gestão diária do MCP Gateway

**Entrada**: http://<IP-do-servidor>:3100 (página de mercado `/market`). A gestão é feita pela página «MCP Gateway» da Central de Administração de IA (role `ai-platform-admin`), ou chamando diretamente a API de gestão.
### 20.1 Gerenciar servidores MCP
1. Edite `mcp-gateway/mcp-servers.json` para adicionar/remover servidores (tipos stdio/http);
2. Reinicie com `docker compose restart mcp-gateway`;
3. Ou adicione/remova na página MCP Gateway da Central de Administração de IA (grava de volta na configuração + reconexão automática).
### 20.2 Gerenciar Skills (pacotes de skills)
1. **Upload**: página MCP Gateway da Central de Administração de IA → upload do zip da skill (valida presença de SKILL.md, previne path traversal);
2. **Excluir**: excluir a skill correspondente;
3. As skills ficam em `mcp-gateway/skills/` (subdiretórios com SKILL.md); a varredura é automática a cada requisição, sem necessidade de reiniciar.
### 20.3 Estender as ferramentas integradas
Adicione duas etapas em `mcp-gateway/gateway.js`:
```
// ① Definição da ferramenta (adicione um item ao array builtinTools)
{ name: 'platform_health', description: 'consultar o status de saúde dos serviços',
  inputSchema: { type: 'object', properties: {} } }

// ② Lógica de execução (adicione um branch ao callBuiltin)
if (name === 'platform_health') { return 'todos os serviços funcionando normalmente'; }
```
Depois de alterar, execute `docker compose restart mcp-gateway`.
### 20.4 Manter o endereço de mercado do skill-market
O `market_url` do «Assistente de Skills» fica em `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; deve usar hostname (não IP) e é um parâmetro de implantação (veja o capítulo 11).
> ⚠️ A API de gestão requer o header `X-Admin-Token` (`MCP_ADMIN_TOKEN` do `.env`); sem configurar, retorna 503; token errado, retorna 401.
> 📖 Documentação oficial:protocolo MCP oficial https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. Gestão do Servidor de Atualização

**Entrada**: http://<IP-do-servidor>:8091, dados em `deepchat-updates/`.
### 21.1 Colocar uma nova versão manualmente
1. Baixe o instalador oficial do DeepChat para `deepchat-updates/deepchat/`;
2. Atualize o `version.txt` (gravar o novo número de versão);
3. Na atualização automática, o DeepChat do funcionário verifica o `version.txt` e, ao encontrar nova versão, baixa e instala.
### 21.2 Sincronização automática (recomendado)
Use o Gitea Actions do repositório `deepchat-sync` para verificar diariamente novas versões no GitHub e sincronizar (veja o capítulo 10). Disparo manual:
```
curl -X POST "http://<IP-do-servidor>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<senha>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 Configuração de sincronização (sync-config.json)
| Campo | Função |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Prefixo de aceleração de download (como ghproxy.com) |
| `keep_releases` | Quantidade de versões históricas retidas |
| `market_url` | Endereço de mercado do «Assistente de Skills» na página de downloads |
> 📌 Quando o cliente DeepChat reporta «tempo esgotado de conexão com o modelo», geralmente o cliente passou por um proxy de sistema que caiu (`ECONNREFUSED 127.0.0.1:33210`). Oriente o usuário a alterar em «Configurações → rede/proxy» do DeepChat para «não usar proxy / conexão direta».
> 📖 Documentação oficial:guia rápido do DeepChat https://deepchatai.cn/docs/guide/getting-started/ · repositório open source https://github.com/ThinkInAIXYZ/deepchat

## 22. Gestão de monitoramento e alertas

Grafana**Entrada**: Grafana http://<IP-do-servidor>:3030 (login automático via SSO); Prometheus :9091; Alertmanager :9093.
### 22.1 Componentes e portas
| Componente | Porta | Uso |
| --- | --- | --- |
| cadvisor | 8080 (interno) | Coleta CPU/memória/rede/disco de cada contêiner |
| Prometheus | 9091 | Agrega métricas + regras de alerta (`monitoring/alerts.yml`) |
| Grafana | 3030 | Painel de visualização (pré-configurado «AI All In One — monitoramento de contêineres») |
| Alertmanager | 9093 | Deduplicação/agrupamento/roteamento/notificação de alertas |
### 22.2 Ver o painel
1. Entre no Grafana (`ai_all_in_one_admin` / senha unificada, login automático via SSO);
2. Abra o painel «AI All In One — monitoramento de contêineres» e veja CPU/memória/rede de cada contêiner.
### 22.3 Regras de alerta
Regras pré-configuradas (`monitoring/alerts.yml`): contêiner fora do ar (critical), memória do contêiner >90% (warning), CPU do contêiner >80% (warning).
> ⚠️ Armadilha de falsos positivos: o cadvisor reporta todos os cgroups do host (incluindo systemd); a regra de alerta deve filtrar com `{name!=""}`, e o alerta de memória também precisa de `container_spec_memory_limit_bytes > 0` (senão, com limit=0, a divisão por zero dispara sempre).
### 22.4 Conectar a notificação de alertas (IM empresarial)
O caminho das alertas é **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM empresarial**. Configure-o no menu **« Operações → Alertas IM empresariais »** (a configuração fica no Redis e sobrevive a reinícios):
- **Destinatários**: adicione vários. Tipo « DingTalk/WeCom/Feishu » = bot de grupo (URL do webhook, envia para o grupo); tipo « DingTalk App (para pessoa) » (AppKey/AppSecret/AgentId/userid) ou « WeCom App (para pessoa) » (corpId/secret/agentid/userid) = app empresarial, envia para pessoas.
- **Regras de envio**: interruptor geral, severidade mínima (crítico/aviso/info), enviar ou não notificações « firing » / « resolved ».
- **Histórico de envio**: registra cada envio (hora/destinatário/tipo/nome da alerta/severidade/resultado), com paginação, tamanho de página ajustável, busca por palavra-chave e filtro por tipo/resultado/severidade.
- Cada destinatário tem um botão « Testar » para enviar mensagem de teste e um interruptor de ativação.
> ⚠️ Um webhook de bot de grupo só pode enviar para um **grupo**, não para uma pessoa. Para enviar a pessoas use os tipos « app empresarial » (DingTalk/WeCom), que exigem um app interno criado no console de administração com permissão de mensagens. Bots de grupo do DingTalk também precisam de « palavras-chave personalizadas » (ex. « AI 平台 » / « 告警 ») ou « assinatura », senão a mensagem é bloqueada pela política de segurança.
> 📌 Sobre conflito de portas: a porta 9090 padrão do Prometheus está ocupada pelo Keycloak, então foi alterada para 9091; a 3000/3001 padrão do Grafana está ocupada, então foi alterada para 3030.
> 📖 Documentação oficial:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. Observabilidade de LLM (Langfuse)

Langfuse**Entrada**: http://<IP-do-servidor>:3010 (login automático via SSO, a entrada da Central de Administração de IA aponta para `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 Componentes
| Componente | Uso |
| --- | --- |
| langfuse | Web UI + exibição de rastreamento (3010) |
| langfuse-worker | Processamento assíncrono de eventos |
| langfuse-postgres | Armazenamento de metadados |
| langfuse-clickhouse | Armazenamento de eventos/rastreamento |
| langfuse-minio | Armazenamento S3 de anexos/mídia |
| langfuse-redis | Fila |
O LiteLLM reporta automaticamente via `success_callback: ["langfuse"]` (`LANGFUSE_*` do `.env`).
### 23.2 Ver o rastreamento
1. Entre no Langfuse → selecione a organização `AI All In One` / projeto `AI Platform`;
2. A lista Traces mostra cada chamada; clique para ver prompt/resposta/modelo/latência/tokens/custo;
3. Use Session para relacionar conversas de múltiplas rodadas.
### 23.3 Solução de problemas
- ⚠️ Armadilhas críticas:
      
        É obrigatório definir `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (tanto no web quanto no worker), senão o SDK antigo falha no reporte `trace-create` e os dados não aparecem;
- Login SSO sem dados: a conta SSO (e-mail AD) é diferente da conta de inicialização, e o Langfuse cria automaticamente uma conta que não pertence a nenhuma organização. Correção (adicionar o usuário SSO à organização):
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<domínio-empresa>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 Documentação oficial:documentação oficial do Langfuse https://langfuse.com/docs · self-hosting https://langfuse.com/self-hosting

## 24. Logs unificados (Loki)

**Entrada**: página «📜 Logs unificados» da Central de Administração de IA (mais conveniente), ou Loki http://<IP-do-servidor>:3110.
### 24.1 Componentes
| Componente | Porta | Uso |
| --- | --- | --- |
| Loki | 3110 | Armazenamento e consulta de logs (standalone, sistema de arquivos local) |
| Promtail | — (interno) | Descobre contêineres via docker.sock, coleta logs json e envia ao Loki |
### 24.2 Consultar logs
1. Central de Administração de IA → Logs unificados;
2. Selecione o contêiner (dropdown) → digite a palavra-chave → selecione o intervalo de tempo → consultar;
3. O backend `/api/logs/query` consulta o Loki com LogQL.
### 24.3 Consulta rápida de LogQL
```
{container="new-api"} |= "error"              # linhas com "error" em um contêiner
{container=~".+"} |~ "(?i)error|exception"      # corresponde a todos os contêineres
{service="litellm"} |= "EMAIL"                  # consulta por serviço
```
> 📌 Os labels do Loki são `container / project / service`, **sem `job`**. Use `{container=~".+"}` em vez de `{job="docker"}`.
> ⚠️ Armadilha crítica (montagem no Docker Desktop): o Promtail precisa montar `/var/run/docker.sock` e `/var/lib/docker/containers` (no WSL2, apontam para dentro da VM do Docker Desktop, que é exatamente onde ficam os logs); não use o caminho `C:\...\containers` do Windows do host. O Loki standalone usa `store: tsdb` + filesystem.
> 📖 Documentação oficial:documentação oficial do Loki https://grafana.com/docs/loki/latest/

## 25. Anonimização de PII (Presidio)

### 25.1 Duas camadas de anonimização
| Camada | Capacidade |
| --- | --- |
| Regex integrada do LiteLLM (`litellm_content_filter`) | Celular, CPF, cartão bancário, e-mail, código unificado de crédito social, passaporte, IPv4 etc.; ao corresponder, substitui por `[xxx_REDACTED]`; ao corresponder à lista negra de palavras sensíveis, bloqueia com BLOCK |
| Microsoft Presidio | Entidades mais granulares (nomes em inglês, e-mail etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 Regras de regex integradas
| Regra | Regex | Tipo |
| --- | --- | --- |
| Celular chinês | `\b1[3-9]\d{9}\b` | cn_mobile |
| Número de CPF | `\b\d{17}[\dXx]\b` | cn_id |
| Número de cartão bancário | `\b\d{16,19}\b` | bank_card |
| E-mail | prebuilt `email` | email |
| Código unificado de crédito social | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Número de passaporte | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
A lista negra de palavras sensíveis fica em `blocked_words` do `litellm-config.yaml`, adicionada/removida conforme a realidade da empresa (`confidencial interno`, `segredo comercial` etc.).
### 25.3 Ativar o Presidio (atualmente comentado)
Com a mudança da API de guardrail do LiteLLM, a seção do Presidio está comentada no momento. Pontos para ativar:
- guardrails precisam de `default_on: true` para valer globalmente;
- as variáveis de ambiente de endpoint `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` devem conter apenas a base URL (o LiteLLM concatena `/analyze`, `/anonymize`; com caminho, vira `/analyze/analyze` e dá 404).
> ⚠️ A imagem tem cerca de 965MB e é muito lenta de baixar na China (cerca de 1 hora em testes); se não conseguir baixar, use primeiro a regex integrada (já cobre as PII chinesas principais).
### 25.4 Verificação
Envie uma requisição com celular/e-mail → na resposta do modelo, os valores originais são substituídos por `[REDACTED]`; envie uma requisição com «confidencial interno» → retorna diretamente `Content blocked`.
> 📖 Documentação oficial:Microsoft Presidio https://microsoft.github.io/presidio/ · código-fonte https://github.com/microsoft/presidio

## 26. MailHog: receptor de e-mails

**Entrada**: http://<IP-do-servidor>:8025 (caixa de entrada Web, SMTP 1025 apenas interno).
### 26.1 Por que ele é necessário
O painel do Ghost 5 usa login sem senha: ao digitar o e-mail, o Ghost envia uma mensagem com código de 6 dígitos. Sem SMTP na intranet, o e-mail não sai e o login dá `Failed to send email`. O MailHog funciona como a «saída de e-mail» que recebe essas mensagens.
### 26.2 Configuração do lado do Ghost
```
# variáveis de ambiente do Ghost no docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 Ver os e-mails
1. Abra `http://<IP-do-servidor>:8025` no navegador;
2. Na caixa de entrada, veja os códigos de verificação/e-mails de notificação enviados pelo Ghost.
### 26.4 Login sem senha do Ghost (login automático pela Central de Administração de IA)
O código de 6 dígitos do Ghost é essencialmente **TOTP** (`TOTP(admin_session_secret + userId)`, 6 dígitos/60 segundos/HMAC-SHA1). A Central de Administração de IA calcula o código localmente; ao clicar em «Painel do Ghost → Abrir», conclui automaticamente: login por senha → cálculo local do código → validação da sessão → gravação de cookie → entrada no painel, tudo sem fricção e sem consultar o MailHog.
> ⚠️ Mesmo calculando o código por conta própria, o Ghost ainda envia o e-mail de verdade, então o MailHog deve ser mantido, senão o login dá `Failed to send email`.
> 📖 Documentação oficial:repositório do código-fonte do MailHog https://github.com/mailhog/MailHog

**Parte 3 · Operações**

## 27. Backup e recuperação

**Entrada**: página «💾 Backup e recuperação» da Central de Administração de IA, ou pela linha de comando `scripts/backup.ps1` / `restore.ps1`. Backup automático diário às 02:00 via tarefa agendada, retendo 7 dias.
### 27.1 Itens de backup
| Item de backup | Método |
| --- | --- |
| MySQL do NewAPI | `mysqldump` |
| PostgreSQL do Dify | `pg_dump` |
| PostgreSQL do Langfuse | `pg_dump` |
| SQLite do Ghost / Gitea / Grafana | Cópia de arquivo |
| Keycloak | **realm export (JSON)** |
| Arquivos de configuração | Cópia de arquivo |
### 27.2 Backup manual
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 Backup agendado (tarefa agendada)
A tarefa agendada `AI-Platform-Backup` (diariamente às 02:00) já está registrada. Se não estiver registrada automaticamente, crie manualmente: Agendador de Tarefas → criar → programa `powershell.exe`, argumentos `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, gatilho diário às 02:00.
> 📌 O backup fica no disco C por padrão; recomenda-se sincronizar periodicamente `C:\AIAllInOne\backups\` para outro disco ou armazenamento de objetos como recuperação de desastre off-site.
### 27.4 Recuperação
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
O script pede a confirmação `yes` (adicione `-Force` para pular, somente para scripts/CI). Também é possível clicar em «Recuperar» de um backup na página «Backup e recuperação» da Central de Administração de IA.
### 27.5 Armadilhas críticas (validadas em simulações)
- ⚠️
      
        O Keycloak deve usar **realm export/import (JSON)**; restaurar via pg_dump perde a associação de default role e não sobe;
- Após restaurar o SQLite, o dono é root; faça chown para o uid correspondente (grafana=472, gitea=1000), senão dá readonly;
- O pg_dump deve usar `--clean --if-exists` para evitar conflito na restauração;
- No backup.ps1 antigo, o `Copy-Item` em lote falhava silenciosamente por causa do arquivo de ponto `.env`; já foi alterado para copiar arquivo por arquivo com `-LiteralPath`;
- O backup da Central de Administração de IA usa base64 como intermediário + tar-fs para garantir segurança binária (o stdout do docker exec passa por utf8 e corromperia o SQLite .db).

## 28. Verificação de integridade e autoteste na inicialização

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, saída `health_check_<timestamp>.log`. Cobre 41 contêineres (25 do núcleo Windows + 16 do Dify), lê as credenciais do `.env`, sem senhas fixas no código.
### 28.1 Escopo da verificação (9 estágios)
| Estágio | Item verificado |
| --- | --- |
| Stage 1 | Se o Docker Daemon está em execução (aguarda a prontidão, adequado ao autoteste na inicialização) |
| Stage 2 | Status dos 41 contêineres (Up/Exited/Restarting) |
| Stage 3 | Resposta de 10 endpoints HTTP |
| Stage 4 | Readiness do LiteLLM + registro de modelos, API do Dify, saúde de banco/Redis/Sandbox |
| Stage 5 | Cadeia completa de LLM (NewAPI → LiteLLM → DeepSeek com requisição real) |
| Stage 6 | Cadeia de autenticação da conta AD + login de administrador do NewAPI |
| Stage 7 | MCP Gateway + funcionalidade de Skill |
| Stage 8 | Pré-condições de login do DeepChat/Dify |
| Stage 9 | Espaço em disco |
### 28.2 Execução manual
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ No final da saída, `ALL CLEAR` e `Fail: 0` indicam que tudo está normal.
### 28.3 Inicialização automática (tarefa agendada)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # atraso de 2 minutos após o login para aguardar o Docker + contêineres iniciarem
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 Atenção: o script usa `127.0.0.1`, não localhost; a saúde interna do LiteLLM usa `/health/readiness` (sem autenticação); `docker-init_permissions-1` Exited(0) é normal; o Servidor de Atualização retorna 403 normalmente (sem index.html padrão); exit code 0=aprovado, 1=com falhas.

## 29. Manual de solução de problemas

### 29.1 Três passos gerais de solução
1. **Ver o status dos contêineres**: `docker ps -a` para encontrar Exited/Restarting;
2. **Ver os logs**: `docker logs <nome-do-contêiner> --tail 30`;
3. **Ver a verificação de integridade**: execute `health-check.ps1` para localizar o estágio com falha.
### 29.2 Tabela rápida de sintomas
| Sintoma | Causa raiz | Solução |
| --- | --- | --- |
| localhost não abre nenhum produto | Problema de compatibilidade com IPv6 `::1` do WSL2 | Use IP de intranet ou 127.0.0.1 |
| Ghost sempre Restarting, com ECONNREFUSED :3306 | Config de MySQL residual no volume | Forçar SQLite por variável de ambiente (capítulo 4) |
| 4 contêineres do Dify quebram no start com ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | Mudar para 50 (capítulo 5) |
| Teste de canal do NewAPI dá No connected db | Chave do canal preenchida com valor de exemplo | Preencher o valor real de `LITELLM_MASTER_KEY` |
| OIDC do NewAPI dá invalid_grant / Incorrect redirect_uri | Endereço do servidor é localhost | Definir endereço de intranet (capítulo 7) |
| Login do NewAPI dá 429 | Limitação de taxa das interfaces críticas | Limpar rateLimit:* do redis ou alterar .env |
| Dify reconecta repetidamente em ws://localhost ao criar app | Endereço WebSocket não alterado | NEXT_PUBLIC_SOCKET_URL com IP de intranet |
| Clicar em login no Dify não faz nada | Senha precisa de base64 / 401 por não logado é normal | Script: base64 antes; navegador: tentar de novo |
| Gitea dá readonly database | gitea.db com dono root | Apagar o db com dono root para recriar |
| Link de repositório do Gitea é localhost | ROOT_URL não alterado | Definir endereço de intranet |
| Login SSO dá unknown_error | Falha no encaminhamento de porta do AD (iphlpsvc) | Verificar iphlpsvc + rede Hyper-V |
| Keycloak não vê os usuários do domínio | Search scope = One Level | Mudar para Subtree |
| Langfuse não mostra dados | V4_WRITE_MODE ou conta SSO fora da organização | Definir dual; SQL para adicionar à organização (capítulo 23) |
| DeepChat dá tempo esgotado de conexão com o modelo | Cliente passou por proxy de sistema caído | Definir sem proxy/conexão direta |
| Loki não encontra logs | Usou o label job | Use `{container=~".+"}` |
| Presidio dá 404 /analyze/analyze | Endpoint com caminho | Preencher apenas a base URL |
| Após alterar server.js, nova interface dá 404 | up -d não relê a mudança do volume | docker restart admin-portal |
### 29.3 Comandos comuns
```
docker ps -a                                        # status de todos os contêineres
docker logs <contêiner> --tail 50                    # ver logs
docker compose up -d <serviço>                       # reconstruir um serviço
docker compose restart <serviço>                     # reiniciar um serviço (não relê .env)
docker system df                                     # ocupação de disco do Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # exame completo com um clique
```

**Apêndice**

## Ap. Índice de documentação oficial

### Documentação oficial de todos os produtos
| Produto | Endereço da documentação oficial |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Administração do servidor Keycloak | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| Site oficial do NewAPI | https://www.newapi.ai |
| Código-fonte do NewAPI | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| Guardrail Presidio do LiteLLM | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Self-hosted do Dify | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Painel de administração do Ghost | https://ghost.org/docs/admin/ |
| Gitea (em chinês) | https://docs.gitea.com/zh-cn |
| Administração do Gitea | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| Código-fonte do DeepChat | https://github.com/ThinkInAIXYZ/deepchat |
| Protocolo MCP | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Self-hosting do Langfuse | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Código-fonte do Presidio | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ O final de cada capítulo também traz o endereço da documentação oficial do produto correspondente, para consulta por capítulo.

