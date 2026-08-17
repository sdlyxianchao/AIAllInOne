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

1. **Implantação automática (recomendada)** — deixe a implantação com um AI Agent (WorkBuddy / OpenClaw / Microsoft Scout). Ele lê a documentação e as configurações, coleta os parâmetros com você (IP do servidor, fonte de identidade, conta de administrador, chaves de LLM) e conclui toda a configuração passo a passo. [Ver o prompt de implantação com um clique →](../windows/windows-deploy-guide-v2.html)

<details>
<summary>📋 Prompt de implantação com um clique (clique para expandir)</summary>

````text
Você é o engenheiro de implantação da plataforma de IA da intranet corporativa. Com base na documentação e nos arquivos de configuração deste projeto, implante e valide completamente a plataforma "AI AllInOne" na máquina atual. Comunique-se comigo em português durante todo o processo e siga rigorosamente o fluxo abaixo.

## Etapa 1: Confirme o diretório de implantação e a plataforma de destino
1. Pergunte-me primeiro: qual é o caminho local de extração/clone deste projeto? (por exemplo, C:\AIAllInOne ou /opt/AIAllInOne)
2. Após entrar nesse diretório, determine o diretório da plataforma de destino com base no sistema operacional da máquina atual:
   - Windows → use o diretório windows-github (ou windows)
   - Linux / macOS → use o diretório linux-github (ou linux)
   - Servidor online / ambiente puramente Docker → use o diretório docker-github (ou docker)
   Se não tiver certeza, informe o sistema operacional detectado e confirme comigo qual diretório usar.
3. Antes de começar, leia o README.md na raiz e o README no diretório da plataforma para entender a arquitetura e o método de implantação.

## Etapa 2: Coleta dos parâmetros necessários, item por item (pergunte um a um, sem pular ou adivinhar)
1. O IP da intranet (ou domínio) exposto pela plataforma, ou seja, o endereço que outras máquinas usam para acessá-la (por exemplo, 192.168.1.100 ou portal.company.com).
2. Fonte de identidade (Identity Provider):
   - Controlador de domínio AD da empresa: pergunte-me o domínio, IP do DC, base DN do LDAP, bind DN, senha da conta de bind, sAMAccountName, etc.
   - Outros IdPs (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk, etc.): pergunte-me as configurações e as informações de conta correspondentes.
   - Sem fonte de identidade externa (somente contas locais): confirme comigo e pule.
3. Conta de administrador unificada: nome de usuário, senha, e-mail (para o SSO do Keycloak e o login de administrador de cada produto).
4. Chaves de API de LLM: quais provedores de modelo e chaves eu realmente tenho (DeepSeek / OpenAI / Claude / Qwen / Tongyi / ERNIE, etc.); pule os que não tiver.
5. Idioma do conteúdo de exemplo do portal Ghost: chinês, ou traduza para outro idioma antes de importar.
6. Outros itens perguntados conforme necessário: hostname do mercado de habilidades MCP (Windows), canal de notificação de alertas (webhook DingTalk/WeCom/Feishu), certificados HTTPS, política de retenção de backup, etc.

## Etapa 3: Gere um arquivo de progresso local
1. Encontre o documento "checklist de progresso" no diretório da plataforma (*-checklist*.html) e o "guia de integração da fonte de identidade" (por exemplo, *-ad-integration*.html ou documentos relacionados a IdP).
2. Com base no checklist, gere um arquivo de progresso no diretório do projeto, nomeado como "deployment-progress-<platform>-<date>.md", copiando cada item como não concluído (- [ ]).
3. Depois disso, a cada item concluído ou problema resolvido, atualize o arquivo de progresso em tempo hábil e me informe resumidamente o andamento na conversa.

## Etapa 4: Configure passo a passo conforme o guia de implantação
1. Leia atentamente o documento "guia de implantação" da plataforma (por exemplo, *-deploy-guide*.html) e siga-o rigorosamente, prestando especial atenção às "⚠️ armadilhas críticas" marcadas.
2. Ordem aproximada: preparar as variáveis de ambiente → iniciar os contêineres → inicializar autenticação/IdP → configurar o roteamento de LLM e os canais de modelos → inicializar cada produto (portal Ghost: implantar o tema Corp Portal integrado e importar o conteúdo de exemplo) → configurar monitoramento/observabilidade/logs/redação → configurar backup e restauração.
3. Priorize o uso dos scripts automatizados no diretório (como bootstrap.ps1, keycloak-realm-init.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, health-check.ps1, etc.); para etapas que podem ser automatizadas, não faça manualmente pela UI.

## Etapa 5: Teste de forma iterativa e resolva problemas comigo
1. Quando uma etapa falhar ou não sair como esperado, primeiro consulte os logs (docker logs, endpoints de saúde de cada serviço, arquivos de configuração) para localizar a causa raiz antes de corrigir; não fique tentando às cegas.
2. Quando precisar da minha participação (por exemplo, executar comandos que exigem privilégios de administrador, confirmar logins, fornecer informações), diga claramente "o que fazer e por quê".
3. Depois de resolvido, registre a causa raiz e a correção no arquivo de progresso e me informe resumidamente.

## Etapa 6: Validação completa de ponta a ponta
Depois de concluir todos os itens do checklist, faça um teste completo de ponta a ponta, cobrindo pelo menos:
- Saúde dos serviços (todos os contêineres Up, endpoints de saúde normais);
- Login unificado via SSO (login no Keycloak → SSO/login automático em cada produto);
- Cadeia de LLM (enviar uma conversa real via NewAPI/LiteLLM, validar a resposta e o funcionamento da redação de PII);
- Login pela fonte de identidade (se integrado a AD/outros IdPs, testar o login com a conta correspondente);
- Monitoramento/observabilidade/logs/alertas (confirmar que há dados e que os alertas podem ser disparados);
- Backup e restauração (executar um backup e validar que é possível restaurar).

Por fim, resuma os resultados dos testes item por item, marcando claramente ✅ Aprovado / ❌ Falhou; para os itens com falha, indique a causa raiz e recomendações posteriores.
````

</details>

2. **Implantação manual** — siga o [Guia de implantação do Windows](../windows/windows-deploy-guide-v2.html) passo a passo (use a checklist de progresso `windows-checklist.html`).

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
