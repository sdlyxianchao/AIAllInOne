# AI AllInOne — Plataforma de IA empresarial open-source auto-hospedada

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · **Português** · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

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
| Cliente | DeepChat | Cliente desktop de IA local (Windows / macOS / Linux) |
| Distribuição de clientes | Update Server | Hospedagem dos pacotes de instalação e atualização automática do DeepChat |
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

**Prompt para copiar para o seu agente** (plataforma Windows, em chinês — o agente irá guiá-lo passo a passo) :

````text
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
````

> 💡 Mesmo que você **não use um agente**, este prompt também serve como uma lista de verificação pré-implantação — ele lista todos os parâmetros que você precisa preparar antes de começar.

2. **Implantação manual** — siga o [Guia de implantação do Windows](../windows/windows-deploy-guide-v2.md) passo a passo (use a checklist de progresso `windows-checklist.html`).

> **Status da plataforma**: Windows (Windows 11 + Docker Desktop) **em testes reais**. Linux/macOS (`linux/`) e servidores online (`docker/`) estão planejados — veja o [roteiro](#roadmap).

## 🖼️ Capturas de tela

**Dify** — plataforma de aplicações de IA · **Mercado de MCP/Skills** — acesso a ferramentas e habilidades com um clique · **DeepChat** — cliente desktop de IA

![Dify](<../pics/Dify.png>) ![Mercado de MCP/SKILLS](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

Mais capturas de tela (48 capturas reais da interface) estão incorporadas no [Manual do Administrador](../docs/admin-manual/index.md).

## 📚 Manuais (online, em 9 idiomas)

| Manual | Idioma |
|---|---|
| **Manual do Administrador** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **Manual do Usuário** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

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

<h2 id="roadmap">🗺️ Roteiro</h2>

- ✅ v0.9x — Plataforma Windows: pacote completo + AI Admin Center + autorização de administradores em níveis + alertas via IM corporativo + cache semântica (LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — suporte a servidor Linux auto-hospedado (`linux/`)
- 🚧 **Servidores online** — implantação de produção puramente Docker / em nuvem (`docker/`)
- 🚧 **Programa de colaboradores** — quadro de tarefas, reuniões semanais de sincronização, certificação de parceiros de implantação

## 🔒 Notas de segurança

- Este repositório **não contém nenhuma chave real**; os valores reais ficam apenas nos `.env` de cada ambiente (o repositório só commita o modelo `.env.example`).
- Por padrão, HTTP em texto simples na intranet; a configuração de HTTPS está nos guias de implantação de cada plataforma.
- As armadilhas, a tabela de portas e o fluxo de dados de cada plataforma estão nos documentos `*-deploy-guide*.html` correspondentes.

## 📄 Licença

[MIT](../LICENSE) — use, modifique e distribua livremente. Os componentes integrados mantêm suas próprias licenças (veja a seção de revisão de licenças no guia de implantação).

## 🤖 Operações com agente de IA

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
| Stage 5 | **Cadeia LLM completa** : status dos canais NewAPI + uma requisição real em nome do DeepChat e do Dify (NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **Cadeia de autenticação AD** : Keycloak well-known + sincronização de usuários AD (aitest1) + configuração OIDC do NewAPI + integridade dos clientes OIDC + **login admin do NewAPI** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + agregação de Skills externos | curl (protocolo MCP) |
| Stage 8 | **Pré-requisitos de login DeepChat / Dify** : NewAPI disponível + Dify inicializado | curl + psql |
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
