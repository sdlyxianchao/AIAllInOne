# Manual do Administrador do AI AllInOne

*v0.2 · Implantação · Gestão · Operações*

Este manual está dividido em três partes: **Implantação** (capítulos 1–13, colocar a plataforma em funcionamento do zero), **Administração** (capítulos 14–26, operações diárias dos 13 produtos) e **Operações** (capítulos 27–29, backup / verificações de saúde / solução de problemas), além de um **Apêndice** com links para a documentação dos fornecedores. Cada capítulo tem navegação anterior/próximo na parte inferior — leia do início ao fim ou vá direto ao tópico que precisar.

## Parte 1 · Implantação

| # | Capítulo | Descrição |
| --- | --- | --- |
| 1 | [Visão geral e arquitetura da plataforma](ch01-overview.md) | Entender a composição, as portas e o fluxo de dados desta plataforma é o pré-requisito para todas as operações de implantação e gestão a seguir. |
| 2 | [Preparação prévia](ch02-prereq.md) | Instalar o Docker Desktop, preparar diretórios, abrir a rede, fixar o IP — o que precisa ser feito antes da implantação. |
| 3 | [Arquivos de configuração e variáveis de ambiente](ch03-env.md) | Três arquivos de configuração principais + explicação de todas as variáveis de ambiente: o que configurar agora e o que configurar depois. |
| 4 | [Iniciar serviços principais](ch04-start.md) | Copiar o .env, subir os contêineres, validar o acesso serviço por serviço e tratar o problema conhecido de SQLite do Ghost. |
| 5 | [Implantação independente do Dify](ch05-dify-deploy.md) | O Dify é implantado independentemente com o compose oficial (cerca de 15 contêineres), evitando conflitos de porta. |
| 6 | [Keycloak: Realm, usuários e AD](ch06-keycloak.md) | Criar o Realm, criar contas locais ou importar contas de domínio do Active Directory — a base do SSO de todos os produtos. |
| 7 | [NewAPI: inicialização, canais e OIDC](ch07-newapi.md) | Concluir o assistente de instalação inicial, configurar o canal apontando para o LiteLLM, emitir API Keys e integrar o OIDC do Keycloak. |
| 8 | [LiteLLM: validação e cache](ch08-litellm.md) | Validar que o proxy LiteLLM funciona e ativar cache de respostas para economizar tokens. |
| 9 | [Configuração do Dify / Ghost / Gitea](ch09-products.md) | Inicialização e configuração de interconexão de cada um dos três produtos. |
| 10 | [Distribuição e CI/CD do DeepChat](ch10-deepchat.md) | Distribuir o instalador do DeepChat aos funcionários e usar o Gitea Actions para sincronizar automaticamente as novas versões oficiais. |
| 11 | [MCP Gateway e Mercado de Skills](ch11-mcp.md) | Gateway para gestão centralizada de Skills e ferramentas MCP; DeepChat/Dify obtêm todas as ferramentas com um único endereço. |
| 12 | [Central de Administração de IA](ch12-admin-center.md) | Portal unificado do administrador: autenticação Keycloak, todos os produtos embutidos no menu lateral, Dashboard com status do cluster. |
| 13 | [Lista de verificação de interconexão](ch13-interconnect.md) | Após concluir a implantação, confirme item por item que as 12 cadeias de interconexão estão todas abertas. |

## Parte 2 · Gestão (operações diárias de cada produto)

| # | Capítulo | Descrição |
| --- | --- | --- |
| 14 | [Gestão diária do Keycloak](ch14-ops-keycloak.md) | Centro de autenticação: gerenciar usuários, roles, clientes OIDC, federação AD e sessões. |
| 15 | [Gestão diária do NewAPI](ch15-ops-newapi.md) | Gateway de LLM: gerenciar canais, tokens, cotas, usuários, logs e custos. |
| 16 | [Gestão diária do LiteLLM](ch16-ops-litellm.md) | Proxy de anonimização de PII: lista de modelos, regras de anonimização, cache, reporte ao Langfuse. |
| 17 | [Gestão diária do Dify](ch17-ops-dify.md) | Plataforma de aplicações de IA: aplicações, bases de conhecimento, provedores de modelos, permissões de membros, publicação. |
| 18 | [Gestão diária do Ghost](ch18-ops-ghost.md) | Portal corporativo / Hub: artigos, páginas, navegação, temas, membros. |
| 19 | [Gestão diária do Gitea](ch19-ops-gitea.md) | Git interno + CI/CD: repositórios, organizações, Runner, Actions. |
| 20 | [Gestão diária do MCP Gateway](ch20-ops-mcp.md) | Adicionar/remover servidores MCP, fazer upload/excluir Skills, estender as ferramentas integradas. |
| 21 | [Gestão do Servidor de Atualização](ch21-ops-update.md) | Hospedagem de instaladores do DeepChat e atualização automática. |
| 22 | [Gestão de monitoramento e alertas](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager: monitoramento de recursos dos contêineres e notificação de alertas. |
| 23 | [Observabilidade de LLM (Langfuse)](ch23-ops-langfuse.md) | Rastrear o prompt, a resposta, a latência, os tokens e o custo de cada chamada ao modelo. |
| 24 | [Logs unificados (Loki)](ch24-ops-loki.md) | Agregar logs de todos os contêineres, com busca por contêiner + palavra-chave + tempo. |
| 25 | [Anonimização de PII (Presidio)](ch25-ops-pii.md) | Informações sensíveis são anonimizadas automaticamente antes de sair da intranet. |
| 26 | [MailHog: receptor de e-mails](ch26-ops-mailhog.md) | A «saída de e-mail» quando a intranet não tem SMTP, recebendo os códigos de verificação/e-mails de notificação do Ghost. |

## Parte 3 · Operações

| # | Capítulo | Descrição |
| --- | --- | --- |
| 27 | [Backup e recuperação](ch27-backup.md) | Backup diário de todos os dados e recuperação com um clique. |
| 28 | [Verificação de integridade e autoteste na inicialização](ch28-healthcheck.md) | Exame completo de todos os 41 contêineres + cadeia completa de LLM + cadeia de autenticação com um clique. |
| 29 | [Manual de solução de problemas](ch29-troubleshooting.md) | Consulta rápida por sintoma para localizar a causa raiz rapidamente. |

## Apêndice

| # | Capítulo | Descrição |
| --- | --- | --- |
| Apêndice | [Índice de documentação oficial](ch30-appendix.md) | Endereços da documentação oficial de todos os produtos de terceiros (URLs em texto simples, para consulta mesmo após impressão). |

---

> 🌐 Outros idiomas：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · [繁體中文](../admin-manual-zh-TW/index.md) · [Français](../admin-manual-fr/index.md) · [Español](../admin-manual-es/index.md) · Português · [日本語](../admin-manual-ja/index.md) · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
