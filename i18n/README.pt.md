# AI AllInOne — Plataforma de IA de intranet empresarial (multiplataforma, auto-hospedada)

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

Uma **suíte de IA de intranet empresarial pronta para uso e multiplataforma**: autenticação unificada, roteamento LLM, mascaramento de PII, aplicações de IA, portal corporativo, código/CI, distribuição de clientes, administração unificada, monitoramento e alertas, observabilidade, registro (logs) e backup/restauração — tudo orquestrado com Docker em um sistema integrado, com **login único (SSO) em todos os produtos por meio de uma única conta Keycloak**.

O repositório oferece suporte a três plataformas de implantação:

| Plataforma | Pasta do repositório (no GitHub) | Caso de uso típico |
|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop (máquina única) |
| Linux / macOS | `linux/` | Servidor Linux próprio / macOS (Docker) |
| Servidor online | `docker/` | Host em nuvem / Docker puro (produção) |

> No diretório de trabalho local, essas pastas são nomeadas `windows-github/`, `linux-github/` e `docker-github/`; após o upload para o GitHub, o sufixo `-github` é removido e elas passam a ser `windows/`, `linux/` e `docker/`. Toda atualização futura segue esse mesmo mapeamento.

---

## 1. O que está incluído

| Camada | Componente | Finalidade |
|---|---|---|
| Autenticação | Keycloak | SSO / OIDC, integrável com AD/LDAP ou contas locais |
| Roteamento LLM | NewAPI | Canais, chaves, cotas, auditoria, custo |
| Mascaramento de PII | LiteLLM + Presidio | Mascaramento automático de telefones/documentos/e-mails antes das chamadas ao modelo |
| Aplicações de IA | Dify | Plataforma visual de apps de IA / Agentes + base de conhecimento unificada (RAG) |
| Portal corporativo | Ghost | Avisos e notícias da empresa |
| Código / CI | Gitea + Runner | Git interno + automação Actions |
| Cliente | DeepChat | Cliente de IA para desktop local (Windows / macOS / Linux) |
| Distribuição de clientes | Update Server | Hospedagem e atualização automática do instalador do DeepChat |
| Administração unificada | AI Admin Center | Entrada única: painel + produtos integrados + auditoria/custo/relatórios + busca RAG |
| Gateway | MCP Gateway | Gerenciamento do mercado Skill / MCP + busca de conhecimento Dify (RAG) |
| Monitoramento | Prometheus + Grafana + Alertmanager | Monitoramento de recursos de contêineres + notificações de alerta |
| Observabilidade LLM | Langfuse | Rastreamento / latência / tokens / custo de cada chamada ao modelo |
| Logs unificados | Loki + Promtail | Logs agregados e pesquisáveis de todos os contêineres |
| Backup/restauração | scripts backup/restore + página admin | Backup completo diário + restauração em um clique |

Cada pasta de plataforma contém: `docker-compose.yml`, `.env.example`, `*-deploy-guide*.html` (guia de implantação), `*-checklist*.html` (lista de verificação), guia de integração do provedor de identidade, scripts de implantação em um clique, além do código-fonte e da configuração saneados. **Nenhum segredo real é versionado.**

### Arquitetura e fluxo de dados

![Arquitetura](<../pics/Architecture.png>)

![Fluxo de dados](<../pics/DataFlow.png>)

### Capturas de tela

**AI Admin Center** — portal de administração unificado

![AI Admin Center](<../pics/AI Admin.png>)

**Dify** — plataforma de aplicações de IA

![Dify](<../pics/Dify.png>)

**Portal corporativo** — início (Ghost)

![Início do portal](<../pics/AI All In One Hub.png>)

**DeepChat** — cliente de IA para desktop

![DeepChat](<../pics/DeepChat.png>)

**Mercado MCP/SKILL** — acesso MCP em um clique + download de pacotes de habilidades

![Mercado MCP/SKILL](<../pics/Market.png>)

---

## 2. Início rápido: implantação automatizada via ferramenta do tipo Harness (recomendado)

Ferramentas do tipo Harness (OpenClaw, Microsoft Scout, WorkBuddy e similares) podem ler a documentação e a configuração deste projeto e construir todo o ambiente passo a passo na sua máquina. Abaixo está o fluxo padrão.

### 5 pré-requisitos

**1. Instalar uma ferramenta do tipo Harness**
Instale o OpenClaw / Microsoft Scout / WorkBuddy (ou um equivalente). Todas conseguem ler/gravar arquivos locais, executar comandos e pesquisar na web.

**2. Comprar uma assinatura ou configurar sua própria API**
Conclua a assinatura na ferramenta ou insira sua própria chave de API de LLM (DeepSeek / OpenAI / Claude / Qwen / ERNIE etc.) para que a ferramenta converse normalmente.

**3. Preparar o ambiente de rede**
Esta é a etapa que mais costuma bloquear:
- Certifique-se de que a máquina consegue acessar os **registros de imagens Docker** (Docker Hub / quay.io etc.). Se não houver acesso direto, configure um espelho de registro (ex.: DaoCloud) com antecedência.
- Certifique-se de que ela acessa o **GitHub** (para clonar o repositório e baixar algumas dependências públicas). Se não houver acesso direto, use um proxy ou baixe o pacote de código-fonte antecipadamente.
- Confirme que a máquina de destino é alcançável no segmento de rede que você pretende expor.

**4. Clonar ou baixar o projeto localmente**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# ou baixe o arquivo e extraia em qualquer pasta local
```

**5. Cole o prompt abaixo na ferramenta para iniciar a implantação automatizada**

Copie o **prompt completo** abaixo na caixa de entrada da ferramenta Harness e responda às perguntas uma a uma. A ferramenta vai: detectar sua plataforma → coletar parâmetros → gerar um arquivo de progresso local → configurar passo a passo conforme o guia → iterar com você para testar e corrigir problemas → manter o progresso atualizado → executar um teste completo ao final e relatar os resultados.

### Prompt de implantação em um clique (copiar para a ferramenta)

````text
Você é engenheiro de implantação de uma plataforma de IA de intranet empresarial. Com base na documentação e nos arquivos de configuração deste projeto, implante e verifique integralmente a plataforma "AI AllInOne" na máquina atual. Comunique-se comigo em português durante todo o processo e siga rigorosamente o procedimento abaixo.

## Passo 1: Confirmar o diretório de implantação e a plataforma de destino

1. Primeiro me pergunte: qual é o caminho local de extração/clonagem deste projeto? (ex.: C:\AIAllInOne ou /opt/AIAllInOne)
2. Após entrar nesse diretório, determine a pasta da plataforma de destino conforme o sistema operacional da máquina:
   - Windows → usar a pasta `windows-github` (ou `windows`)
   - Linux / macOS → usar a pasta `linux-github` (ou `linux`)
   - Servidor online / ambiente Docker puro → usar a pasta `docker-github` (ou `docker`)
   Se não tiver certeza, me diga qual SO você detectou e confirme comigo qual pasta usar.
3. Leia o README.md da raiz e o README.md dentro dessa pasta de plataforma para entender a arquitetura e a abordagem de implantação antes de agir.

## Passo 2: Coletar os parâmetros necessários (me pergunte um a um; não pule nem adivinhe)

Antes de configurar, colete as seguintes informações, me perguntando o que estiver faltando e explicando a finalidade de cada item:

1. O IP da intranet usado para expor a plataforma (o endereço que outras máquinas usam para acessá-la, ex.: 192.168.1.100).
2. Fonte de identidade (Identity Provider):
   - Controlador de domínio AD corporativo (Active Directory): me peça o nome do domínio, IP do DC, base DN do LDAP, bind DN, senha da conta de bind, sAMAccountName etc.
   - Outro IdP (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk etc.): me peça a configuração e os dados de conta correspondentes.
   - Nenhuma fonte de identidade externa (apenas contas locais): confirme comigo e pule.
3. Conta de administrador unificada: nome de usuário, senha, e-mail (para o SSO do Keycloak e o login de administrador em cada produto).
4. Chaves de API de LLM: quais provedores de modelo e quais chaves eu realmente tenho (DeepSeek / OpenAI / Claude / Qwen / ERNIE etc.); pule os que eu não tiver.
5. Outros itens a perguntar conforme necessário: canal de notificação de alerta (URL de webhook do DingTalk/WeCom/Feishu), certificados HTTPS, política de retenção de backups etc.

## Passo 3: Gerar um arquivo de progresso local

1. Localize o documento "lista de verificação" na pasta da plataforma (ex.: *-checklist*.html) e o "guia de integração da fonte de identidade" (ex.: *-ad-integration*.html ou documentos relacionados ao IdP).
2. Com base no conteúdo da lista, gere um novo arquivo de progresso no diretório do projeto, nomeado ex.: "progresso-implantacao-<plataforma>-<data>.md", copiando cada item da lista como incompleto (- [ ]).
3. A partir de então, atualize esse arquivo sempre que concluir um item ou resolver um problema e relate brevemente o progresso na conversa.

## Passo 4: Configurar passo a passo conforme o guia de implantação

1. Leia com atenção o "guia de implantação" da plataforma (ex.: *-deploy-guide*.html) e siga-o rigorosamente, prestando atenção especial aos "⚠️ pontos críticos / armadilhas" que ele sinaliza.
2. Ordem aproximada: preparar variáveis de ambiente → iniciar contêineres → inicializar auth/IdP → configurar roteamento LLM e canais de modelos → inicializar cada produto → configurar monitoramento/observabilidade/logs/mascaramento → configurar backup e restauração.
3. Priorize os scripts de automação já presentes na pasta (ex.: bootstrap.ps1, keycloak-realm-init.ps1, health-check etc.); não clique nas UIs para etapas que podem ser automatizadas.

## Passo 5: Iterar comigo para testar e corrigir problemas

1. Quando uma etapa falhar ou não corresponder ao esperado, inspecione primeiro os logs (docker logs, endpoints de saúde de cada serviço, arquivos de configuração), localize a causa raiz e então corrija — não tente novamente às cegas.
2. Quando precisar do meu envolvimento (executar um comando com permissões de administrador, confirmar um login, fornecer informações), me diga claramente "o que fazer e por quê".
3. Após resolver, registre a causa raiz e a correção no arquivo de progresso e me relate brevemente.

## Passo 6: Verificação completa de ponta a ponta

Depois que todos os itens da lista forem concluídos, execute um teste completo de ponta a ponta cobrindo pelo menos:
- Saúde dos serviços (todos os contêineres ativos, endpoints de saúde normais);
- Login unificado SSO (login no Keycloak → SSO/login automático em cada produto);
- Cadeia LLM (envie um chat real pelo NewAPI/LiteLLM, verifique a resposta + o mascaramento de PII);
- Login pela fonte de identidade (se AD/outro IdP estiver conectado, teste o login com a conta correspondente);
- Monitoramento/observabilidade/logs/alertas (confirme que há dados e que os alertas disparam);
- Backup e restauração (execute um backup e verifique que ele pode ser restaurado).

Por fim, resuma os resultados do teste item a item, marcando claramente ✅ aprovado / ❌ reprovado; para as falhas, dê a causa raiz e sugestões de acompanhamento.
````

---

## 3. Implantação manual (alternativa)

Se preferir não usar uma ferramenta do tipo Harness, você pode implantar manualmente seguindo o `README.md` e o `*-deploy-guide*.html` de cada plataforma. O fluxo principal é o mesmo: iniciar contêineres → inicializar auth/IdP → configurar canais LLM → inicializar cada produto → configurar monitoramento/backup.

---

## 4. Segurança e observações

- Este repositório não contém **nenhum segredo real**; todos os valores reais ficam no `.env` de cada ambiente de execução (apenas os modelos `.env.example` são versionados).
- Por padrão, usa-se HTTP em texto claro na intranet; para HTTPS, consulte o capítulo correspondente no guia de implantação de cada plataforma.
- Armadilhas, diagramas de arquitetura, tabelas de portas e fluxos de dados de cada plataforma estão nos documentos `*-deploy-guide*.html` correspondentes.

---

## 5. Operar com um agente de IA

Esta plataforma pode ser totalmente operada e mantida por um agente de IA (WorkBuddy, OpenClaw, Microsoft Scout etc.): verificações de integridade, gerenciamento de contêineres, mudanças de configuração, sincronização do Gitea, o portal Ghost, backups, releases e solução de problemas.

Veja o **[Guia de operação com agentes de IA](AI-AGENT-OPS.pt.md)** (disponível em 9 idiomas).
