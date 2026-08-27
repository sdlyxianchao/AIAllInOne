# AI AllInOne — Plataforma de IA empresarial open-source auto-hospedada

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · **Português** · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

> ⭐ **Se este projeto te ajuda, dê uma estrela — é grátis e ajuda mais pessoas a encontrá-lo.**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

> **Um servidor. Uma conta. O pacote completo de IA empresarial — open-source e gratuito, com os dados que nunca saem da intranet.**

AI AllInOne é uma plataforma de IA empresarial **open-source e gratuita**, pronta para uso, para a intranet corporativa: SSO unificado, roteamento de LLM, aplicações de IA, portal empresarial, código-fonte/CI, gestão unificada, monitoramento e alertas, observabilidade, logs, backup e restauração — tudo orquestrado com Docker em um único conjunto. **Os funcionários fazem login uma única vez com uma conta e podem usar todas as ferramentas de IA.**

![AI Admin Center](<../pics/AI Admin.png>)

![Portal empresarial](<../pics/AI All In One Hub.png>)

---

## ✨ Por que escolher o AI AllInOne

| | |
|---|---|
| 🧩 **Pacote completo, sem montagem** | Mais de 8 componentes open-source pré-integrados: autenticação, gateway, aplicações, portal, Git, monitoramento, logs, backup. Sem necessidade de "montar" você mesmo. |
| 🔐 **SSO unificado** | Uma conta Keycloak (com suporte a federação AD/LDAP) faz login automático em todos os produtos, sem senha. |
| 🔒 **Dados que não saem da intranet** | Totalmente auto-hospedado — chamadas de modelos, prompts, documentos e dados de usuários permanecem dentro da empresa. |
| ⚡ **Implantação em cerca de 30 minutos** | `docker compose` + scripts automatizados, ou deixe um AI Agent implantar todo o ambiente por você. |
| 🛡️ **Redação de PII** | Informações sensíveis como telefone, CPF e e-mail são automaticamente redigidas antes de chamar modelos externos (Presidio). |
| 📊 **Observabilidade de ponta a ponta** | Monitoramento com Prometheus + Grafana, rastreamento de LLM com Langfuse, logs unificados com Loki, alertas via IM corporativo (DingTalk/WeCom/Feishu). |
| 💾 **Backup e restauração** | Backup completo diário e restauração com um clique no painel de administração. |
| 🌐 **9 idiomas** | Manual e interface de administração multilíngues (chinês simplificado / chinês tradicional / inglês / francês / espanhol / português / japonês / coreano / árabe). |

## 📦 Lista de componentes

| Camada | Componente | Finalidade |
|---|---|---|
| Autenticação | Keycloak | SSO / OIDC, federação AD/LDAP ou contas locais |
| Roteamento de LLM | NewAPI | Canais, chaves, cotas, auditoria, custos |
| Redação de PII | LiteLLM + Presidio | Redação automática de informações sensíveis antes de chamar os modelos |
| Aplicações de IA | Dify | Plataforma visual de aplicações de IA / Agent + base de conhecimento unificada (RAG) |
| Portal empresarial | Ghost | Portal de comunicados e notícias da empresa (tema Corp Portal integrado e personalizado) |
| Código-fonte / CI | Gitea + Runner | Git interno + automação com Actions |
| Cliente | DSH Desktop (Windows/macOS) · Linux (em breve) | Cliente desktop de IA local — DSH Desktop no Windows/macOS; versão para Linux em breve |
| Distribuição de clientes | Update Server | Hospedagem de instaladores do cliente desktop e atualização automática (DSH Desktop para Windows/macOS) |
| Gestão unificada | AI Admin Center | Ponto de entrada unificado: dashboard + produtos embarcados + auditoria/custos/relatórios + autorização de administradores em níveis + sincronização/roles do Keycloak |
| Gateway | MCP Gateway | Mercado de habilidades / MCP + busca de conhecimento do Dify (RAG) |
| Monitoramento | Prometheus + Grafana + Alertmanager | Monitoramento de recursos dos contêineres + notificações de alerta |
| Observabilidade de LLM | Langfuse | Rastreia a latência, os tokens e o custo de cada chamada de modelo |
| Logs unificados | Loki + Promtail | Agrega todos os logs dos contêineres, pesquisáveis por contêiner/palavra-chave/período |
| Backup e restauração | Scripts + página de administração | Backup completo diário + restauração com um clique |

### Arquitetura e fluxo de dados

![Visão geral da arquitetura](<../pics/Architecture.png>)

![Fluxo de dados](<../pics/DataFlow.png>)

---

## 🚀 Início rápido

**Pré-requisitos**: uma máquina com Docker instalado (Windows 11 + Docker Desktop, ou Linux) e acesso a registros de imagens Docker.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# Inicie os serviços principais e, em seguida, inicialize a autenticação / canais de LLM / produtos conforme o guia de implantação
docker compose up -d
```

Você tem duas opções a seguir:

1. **Implantação automática (recomendada)** — deixe a implantação com um AI Agent (WorkBuddy / OpenClaw / Microsoft Scout). Ele lê a documentação e as configurações, coleta os parâmetros com você (IP do servidor, fonte de identidade, conta de administrador, chaves de LLM) e conclui toda a configuração passo a passo. [Ver o prompt de implantação com um clique →](../windows/windows-deploy-guide-v2.md)

#### 🤖 Implantação com IA — em um clique, conduzida por um agente de IA

> Copiado do guia de implantação (capítulo 0) : o guia pode ser executado **capítulo por capítulo manualmente**, ou entregue de ponta a ponta a um **agente de IA** (WorkBuddy / OpenClaw / Microsoft Scout). Dê a este diretório (o guia, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), cole o prompt abaixo e ele : detectará a plataforma → coletará seus parâmetros um a um → gerará um arquivo de progresso local → configurará passo a passo conforme o guia → testará, depurará e tentará novamente em caso de falha → atualizará o progresso o tempo todo → executará uma verificação completa de ponta a ponta e relatará os resultados.

**Prompt para copiar para o seu agente** (plataforma Windows, em português — o agente irá guiá-lo passo a passo) :

````text
Você é engenheiro de implantação de uma plataforma de IA empresarial em intranet. Com base no guia de implantação « windows-deploy-guide-v2.html », na lista de verificação windows-checklist.html, no docker-compose.yml e no .env.example deste diretório, implante e verifique completamente a plataforma « AI AllInOne » nesta máquina Windows. Comunique-se comigo em português durante todo o processo.

## Etapa 1: Coletar os parâmetros necessários (pergunte-me um a um — não pule nem adivinhe nada)
Antes de começar, colete de mim: 1) o IP de intranet exposto pela plataforma; 2) o nome de host do mercado Skill (domínio — usado para substituir <market-hostname> em mcp-gateway/skills/skill-market/config.json e SKILL.md, e resolvido via hosts/DNS); 3) a fonte de identidade (se conectar a um controlador de domínio AD: domínio / IP do DC / base DN LDAP / bind DN / senha de bind / sAMAccountName; ou a configuração de outro IdP; confirme se não houver); 4) a conta e a senha de administrador unificada; 5) as chaves de API de LLM (DeepSeek / OpenAI / Claude, etc.); 6) pergunte conforme necessário sobre webhook de alertas, HTTPS e política de retenção de backups.

## Etapa 2: Gerar um arquivo de progresso local
Com base no conteúdo de windows-checklist.html, gere « deployment-progress-<date>.md » neste diretório com cada item marcado como incompleto (- [ ]). Atualize-o e relate brevemente após concluir cada item ou resolver cada problema.

## Etapa 3: Configurar passo a passo conforme o guia
Leia com atenção windows-deploy-guide-v2.html — é o único guia autoritativo desta implantação. Execute estritamente seus capítulos 1~13 em ordem (não o substitua por windows-checklist.html nem por nenhum documento mais antigo), prestando especial atenção aos « ⚠️ pontos críticos » de cada capítulo. Prefira os scripts de automação de scripts/ (bootstrap.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, keycloak-realm-init.ps1, backup.ps1, restore.ps1, etc.); automatize em vez de clicar nas interfaces. O portal Ghost (seção 6.5) deve: ① implantar o tema Corp Portal incluído — execute scripts\ghost-theme-setup.ps1 para instalá-lo e ativá-lo, não fique no tema oficial padrão; ② importar o conteúdo de exemplo: primeiro pergunte-me o endereço público do portal e de todos os produtos (IP de intranet ou domínio, ex. 192.168.1.10 ou portal.company.com) — use-o para substituir os placeholders <server-IP> do seed (também substitua as URLs de acesso NewAPI / MCP / Dify nos artigos; não altere endereços internos fixos como host.docker.internal); depois pergunte-me em que idioma deve estar o conteúdo do portal — para chinês, execute diretamente scripts\ghost-content-import.ps1 -ServerAddr "<endereço público>" ; para outros idiomas, primeiro traduza os campos title / html / plaintext / custom_excerpt de ghost-content-seed/content.json para o idioma de destino (mantendo os placeholders <server-IP> e todas as estruturas de URL inalterados) e depois importe.

## Etapa 4: Testar e resolver de forma iterativa
Em caso de falha, inspecione primeiro os logs (docker logs, endpoints de saúde, configurações) para encontrar a causa raiz antes de corrigir — não tente novamente às cegas. Quando forem necessários direitos de administrador ou minha confirmação manual, diga-me claramente « o que fazer e por quê ». Após resolver, atualize o arquivo de progresso e relate brevemente.

## Etapa 5: Verificação completa de ponta a ponta
Quando tudo estiver pronto, execute testes de ponta a ponta: todos os contêineres Up, login SSO do Keycloak, uma conversa real via NewAPI/LiteLLM para verificar o mascaramento de PII, login com a fonte de identidade, monitoramento / registro / alertas, backup e restauração. Por fim, resuma cada item como ✅/❌, dando a causa raiz e uma sugestão para as falhas.
````

> 💡 Mesmo que você **não use um agente**, este prompt também serve como uma lista de verificação pré-implantação — ele lista todos os parâmetros que você precisa preparar antes de começar.

2. **Implantação manual** — siga o [Guia de implantação do Windows](../windows/windows-deploy-guide-v2.md) passo a passo (use a checklist de progresso `windows-checklist.html`).


## 🖼️ Capturas de tela

**Dify** — plataforma de aplicações de IA · **Mercado de MCP/Skills** — acesso a ferramentas e habilidades com um clique · **DSH Desktop** — cliente desktop de IA

![Dify](<../pics/Dify.png>) ![Mercado de MCP/SKILLS](<../pics/Market.png>) ![DSH Desktop](<../pics/dsh.png>)

Mais capturas de tela (48 capturas reais da interface) estão incorporadas no [Manual do Administrador](../docs/admin-manual/index.md).

## 📚 Manuais (online, em 9 idiomas)

| Manual | Idioma |
|---|---|
| **Manual do Administrador** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **Manual do Usuário** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

## 🎓 Programa de treinamento

A plataforma inclui um **programa de treinamento completo** (17 módulos, 60 horas, 10 dias úteis) para integração em implantação e operação:

| Pacote | Idioma | Entrada |
|---|---|---|
| **English** | EN | [training/training_eng/index.md](../training/training_eng/index.md) |
| **简体中文** | zh-CN | [training/training_chn/index.md](../training/training_chn/index.md) |

Para operação diária com AI Agent, consulte o **[Guia de Operação do AI Agent](../AI-AGENT-OPS.md)**.

## 👥 Comunidade

> Grupo do WeChat — para troca de ideias, dúvidas sobre implantação, feedback e **construção conjunta**. Escaneie o código para adicionar um contato e ser adicionado ao grupo.

<img src="../pics/wechat.png" alt="QR code do grupo do WeChat" width="200" />

Você também pode usar o [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions) (ou abrir uma [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues) diretamente).

## 🤝 Contribua com o projeto

Este projeto é **open-source e gratuito** e cresce com a comunidade. Não importa o seu nível de experiência, há uma forma adequada para você:

- ⭐ **Dê uma estrela no repositório** — a forma mais simples e valiosa de apoiar
- 🐛 **Reporte bugs / sugira recursos** — abra uma issue e descreva claramente os passos para reproduzir
- 📝 **Escreva documentação e tutoriais** — guias de implantação, experiências de solução de problemas, melhores práticas
- 🌐 **Tradução** — os manuais já têm 9 idiomas; ajude a melhorar ou adicione mais
- 🧪 **Teste e compartilhe** — faça uma implantação e nos diga o que funcionou bem e onde você caiu em armadilhas
- 💻 **Contribua com código** — a camada de integração (SSO unificado, portal de administração, monitoramento, backup) é o melhor lugar para começar

O guia completo está no [CONTRIBUTING.md](../CONTRIBUTING.md), e o [roteiro](#roadmap) público mostra os próximos planos. **Todos os colaboradores serão listados na lista de colaboradores do README.**

## 📋 Registro de alterações

### v1.03（2026-08-28）

- **Melhoria: reorganização da barra lateral do centro de administração** — grupos renomeados para "应用服务（Serviços de aplicação）/ 平台基础设施（Infraestrutura da plataforma）/ 运维监控（Supervisão de operações）/ 系统管理（Administração do sistema）"; LiteLLM movido para 应用服务, Keycloak movido para 平台基础设施, "企业 IM 告警" fundido em "监控告警 + IM 通知", "PII 脱敏" removido como item independente (integrado no nome do LiteLLM), "客户端软件同步" renomeado para "桌面客户端管理"
- **Melhoria: desanonimização automática de PII** — modo do Presidio alterado de `pre_call` para `["pre_call", "post_call"]`; os PII agora são restaurados automaticamente nas respostas do LLM (os usuários não veem mais os placeholders `<PERSON>`)
- **Correção: loop de redirecionamento do parámetro `iss`** — middleware adicionado em admin-portal server.js para remover parâmetros de consulta `iss` antes do processamento pelo middleware Keycloak, prevenindo loops de redirecionamento infinitos após expiração do token
- **Novo: scripts de sincronização DSH** — novo diretório `dsh-sync-export/` com workflow do Gitea Actions para sincronização automática de atualizações do DSH Desktop

<h2 id="roadmap">🗺️ Roteiro</h2>

- ✅ v0.9x — Plataforma Windows: pacote completo + AI Admin Center + autorização de administradores em níveis + alertas via IM corporativo + cache semântica (LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — suporte a servidor Linux auto-hospedado (`linux/`)
- 🚧 **Programa de colaboradores** — quadro de tarefas, reuniões semanais de sincronização, certificação de parceiros de implantação

## 🔒 Notas de segurança

- Este repositório **não contém nenhuma chave real**; os valores reais ficam apenas nos `.env` de cada ambiente (o repositório só commita o modelo `.env.example`).
- Por padrão, HTTP em texto simples na intranet; a configuração de HTTPS está nos guias de implantação de cada plataforma.
- As armadilhas, a tabela de portas e o fluxo de dados de cada plataforma estão nos documentos `*-deploy-guide*.html` correspondentes.

## ⭐ Apoie o projeto

Se o AI AllInOne economiza seu tempo ou dinheiro, uma estrela não custa nada e ajuda o projeto a crescer:

- ⭐ **Dê uma estrela neste repositório** — ajuda mais pessoas a descobrir e se beneficiar do projeto
- 🐛 **Reporte problemas** — bugs, pedidos de recursos e problemas de implantação são bem-vindos
- 🤝 **Contribua** — código, documentação e traduções (9 idiomas) são bem-vindos
- 💬 **Entre na comunidade** — compartilhe suas experiências de implantação e ideias
- 📣 **Compartilhe** — conte para seus colegas ou publique no seu blog / redes sociais

Uma estrela no canto superior direito é o maior apoio para este projeto.

## 📄 Licença

[MIT](../LICENSE) — use, modifique e distribua livremente. Os componentes integrados mantêm suas próprias licenças (veja a seção de revisão de licenças no guia de implantação).

## 🤖 Operações com agente de IA

### 🎯 Habilidade de operação de IA pronta para usar — baixar e implantar

> O repositório agora inclui uma **habilidade de operação pronta para usar** ([`AIOperation/agent/`](../AIOperation/agent/SKILL.md)) que transforma qualquer agente de IA (WorkBuddy, OpenClaw, Microsoft Scout ou equivalente) em um operador completo da plataforma — **sem configuração específica do servidor**. Sem IP, sem senhas, sem caminhos fixos: as credenciais são lidas do `.env`, os caminhos são resolvidos automaticamente, por isso funciona em **qualquer máquina** onde a plataforma for implantada.

**O que a habilidade cobre** (toda a gestão diária): verificações de saúde com um comando (41 contêineres × 9 etapas), iniciar/parar/reiniciar contêineres e diagnóstico de logs, mudanças de configuração, todo o AI Admin Center — administradores e papéis, sincronização Keycloak/AD, canais/tokens/custos do NewAPI, sincronização do Gitea, portal Ghost, Dify, MCP Gateway, monitoramento/alertas/logs/PII, testes de disponibilidade, relatórios, backup e restauração, alertas IM — a gestão nativa de cada produto de terceiros (domínios/papéis/clientes Keycloak, canais/tokens NewAPI, modelos/usuários LiteLLM, aplicativos/bases de conhecimento Dify, conteúdos/temas Ghost, repositórios/CI Gitea, gateway MCP, painéis/usuários Grafana, projetos/chaves Langfuse, Prometheus/Alertmanager/Loki, Update Server), além de lançamentos de versões, limpeza de disco e solução de problemas.

**Download e implantação (3 passos):**

1. **Obtenha** — clone o repositório ou baixe a pasta `AIOperation/` do GitHub / Gitee:
   ```bash
   git clone https://github.com/sdlyxianchao/AIAllInOne
   # a habilidade fica em: AIAllInOne/AIOperation/agent/
   ```
2. **Instale** — copie a pasta para o diretório de habilidades do seu agente (WorkBuddy: `~/.workbuddy/skills/ai-all-in-one-deploy-ops/`; outros agentes seguem a própria convenção):
   ```bash
   cp -r AIAllInOne/AIOperation/agent ~/.workbuddy/skills/ai-all-in-one-deploy-ops
   ```
3. **Use** — abra o agente no seu diretório de implantação e apenas pergunte, p. ex. *«Execute a verificação de saúde»*, *«Faça um backup»*, *«Por que o Ghost está fora?»*, *«Publique a v0.96»*. A habilidade lê as credenciais do `.env` sozinha — você nunca precisa colar senhas, e ela se adapta a qualquer máquina que você indicar.

A plataforma é projetada para ser **operada e mantida por meio de um agente de IA** — WorkBuddy, OpenClaw, Microsoft Scout ou qualquer ferramenta equivalente. Em vez de clicar em uma dúzia de consoles de administração, você diz ao agente o que quer em linguagem natural ; ele lê arquivos, executa comandos e fala com os serviços por você.

Tudo o que faz a plataforma funcionar vive na sua máquina como **código, configuração e dados** — serviços do Docker Compose, arquivos `.env`, APIs de administração e os bancos/arquivos com o estado real — portanto, um agente pode ver e alterar tudo :

| 任务 | Agent 的做法 |
|---|---|
| Verificação de saúde / visão geral | `docker ps` + endpoints de saúde + APIs de administração |
| Iniciar / reiniciar / parar serviços | `docker compose up -d <svc>` / `docker restart <svc>` |
| Inspecionar logs e erros | `docker logs <svc> --tail N` + arquivos de log |
| Alterar configuração | editar arquivos de configuração e reiniciar o contêiner afetado |
| Editar o Centro de Administração de IA | editar `admin-portal/public/index.html` (UI) ou `admin-portal/server.js` (API) e reiniciar |
| Gerenciar Gitea e sincronização | API do Gitea : disparar workflows, ler status/logs, editar arquivos do repositório |
| Gerenciar o portal Ghost | ler/gravar o banco SQLite do Ghost, editar temas, importar o seed de conteúdo |
| Backup e restauração | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publicar uma versão | `publish.ps1` (build + commit + push para o GitHub) |
| Solucionar problemas | conflitos de porta, problemas do Docker Desktop, DNS/proxy, etc. |

Exemplo : *« Verifique se todos os serviços estão em execução e saudáveis »* — o agente executa `docker ps`, consulta cada endpoint de saúde e informa o que está errado e por quê. Prompts prontos, boas práticas e referência completa de comandos : **[Guia de operações com agente de IA](../AI-AGENT-OPS.md)** (9 idiomas).

### 🛡️ Operações de IA — verificação de saúde em um comando e início automático

> Copiado do guia de implantação (capítulo 12) : a plataforma inclui uma **verificação de saúde com um único comando** (`health-check.ps1`) que valida os **41 contêineres em 9 etapas** — incluindo a cadeia LLM completa, autenticação AD + login de administrador, funcionalidade MCP/Skill e espaço em disco. As credenciais são lidas de `.env` ; o script não embute senhas. Basta pedir ao seu agente de IA para executá-lo (ex. : *« Execute a verificação de saúde e me diga o que está falhando »*), ou deixe-o rodar automaticamente a cada login :

| Etapa | Verificação | Método |
|---|---|---|
| Stage 1 | O daemon do Docker está em execução (aguarda prontidão, para início automático) | `docker info` |
| Stage 2 | Estado dos 41 contêineres (Up/Exited/Restarting) | `docker ps -a` |
| Stage 3 | Resposta de 10 endpoints HTTP (incluindo MCP Gateway) | `curl.exe 127.0.0.1:porta` |
| Stage 4 | LiteLLM /readiness + **registro de modelos**, litellm-redis PING, Dify API /health, saúde de MySQL/PostgreSQL/Redis/Sandbox | `docker exec` + `docker inspect` |
| Stage 5 | **Cadeia LLM completa** : status dos canais NewAPI + uma requisição real em nome do DSH Desktop e do Dify (NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **Cadeia de autenticação AD** : Keycloak well-known + sincronização de usuários AD (aitest1) + configuração OIDC do NewAPI + integridade dos clientes OIDC + **login admin do NewAPI** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + agregação de Skills externos | curl (protocolo MCP) |
| Stage 8 | **Pré-requisitos de login DSH Desktop / Dify** : NewAPI disponível + Dify inicializado | curl + psql |
| Stage 9 | **Espaço em disco** : restante no disco do sistema + uso do Docker | `Get-PSDrive` + `docker system df` |

**Execução manual** (PowerShell) :

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**Execução automática no login** (tarefa agendada — execute o PowerShell como administrador) :

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
