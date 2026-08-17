# Capítulo 2: Preparação prévia

*Parte 1 · Implantação*

> Instalar o Docker Desktop, preparar diretórios, abrir a rede, fixar o IP — o que precisa ser feito antes da implantação.

[← Capítulo 1: Visão geral e arquitetura da plataforma](ch01-overview.md) · [📖 Índice](index.md) · [Capítulo 3: Arquivos de configuração e variáveis de ambiente →](ch03-env.md)

---

## 2.0 Duas formas de implantação

Este manual pode ser executado **manualmente capítulo a capítulo** ou **entregue a uma ferramenta AI Agent para execução automática**. Ao usar o Agent, forneça a ele este diretório (incluindo este manual, `docker-compose.yml`, `.env.example`, `scripts/`) e cole o prompt abaixo.

> **Prompt de implantação para copiar ao Agent:**
> Você é o engenheiro de implantação da plataforma de IA da intranet corporativa. Com base na parte de Implantação do «Manual do Administrador», no docker-compose.yml e no .env.example deste diretório, implante e valide completamente a plataforma «AI AllInOne» nesta máquina. Comunique-se em chinês durante todo o processo.
>
> Primeiro passo — coletar parâmetros (pergunte um por um, sem pular, sem adivinhar):
> 1) IP de intranet dos serviços externos; 2) hostname do Mercado de Skills (domínio, substituindo <host-do-mercado> em mcp-gateway/skills/skill-market/config.json e SKILL.md, com resolução em hosts/DNS); 3) fonte de identidade (se usar controlador de domínio AD, informe domínio/IP do DC/LDAP base DN/bind DN/senha do bind/sAMAccountName); 4) senha da conta de administrador unificada; 5) API Key do modelo LLM; 6) pergunte conforme necessário sobre webhook de alertas, HTTPS e política de retenção de backup.
>
> Segundo passo — gerar um arquivo de progresso, atualizando e reportando a cada item concluído e a cada problema resolvido.
>
> Terceiro passo — executar estritamente na ordem dos capítulos 1~13 deste manual, prestando atenção às seções «⚠️ Armadilhas críticas» de cada capítulo, priorizando a automação com os scripts em scripts/.
>
> Quarto passo — ao encontrar erros, verifique primeiro os logs (docker logs, endpoints de saúde, configuração) para localizar a causa raiz e corrigir, sem repetir tentativas às cegas.
>
> Quinto passo — validação completa: todos os contêineres Up, SSO do Keycloak, envio de conversa real via NewAPI/LiteLLM para validar anonimização de PII, login pela fonte de identidade, monitoramento/logs/alertas, backup e recuperação, resumindo item por item com ✅/❌.

> 💡 Mesmo sem usar o Agent, o trecho acima também serve como «checklist de informações antes da implantação»: antes de começar, deixe claros o IP de intranet, a fonte de identidade, a senha do administrador e a Key do modelo.

## 2.1 Instalar e configurar o Docker Desktop

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

## 2.2 Preparar a estrutura de diretórios

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # diretório raiz de implantação (exemplo)
├─ docker-compose.yml           # orquestração dos serviços principais
├─ .env.windows                 # variáveis de ambiente (preencher API Key)
├─ litellm-config.yaml          # configuração de anonimização de PII do LiteLLM
├─ deepchat-updates\            # diretório de hospedagem dos instaladores do DeepChat
├─ admin-portal\                # implementação da Central de Administração de IA
├─ mcp-gateway\                 # gateway de Skills / MCP
├─ monitoring\                  # configuração do Prometheus / Loki
└─ scripts\                     # scripts de backup / recuperação / verificação de integridade / inicialização
```

## 2.3 Criar a rede compartilhada do Docker

```
docker network create ai-platform
docker network ls | findstr ai-platform   # verificação
```

> Todos os contêineres principais se comunicam pela rede `ai-platform` usando o nome do contêiner (por exemplo, o NewAPI acessa o LiteLLM com `http://litellm:4000`, sem passar por localhost).

## 2.4 Fixar o IP de intranet do host (importante)

Quando o host usa WiFi, o IP é atribuído dinamicamente por DHCP e muda ao reiniciar ou ao expirar a concessão; se mudar, todos os endereços de acesso aos produtos usados pelos funcionários ficam inválidos. Recomenda-se configurar **reserva DHCP (vinculação por MAC)** no roteador:

1. Descubra o MAC da placa WiFi: `ipconfig /all`, procure o endereço físico de «Adaptador de LAN sem fio WLAN» (ex.: `60-A3-E3-41-8F-61`);

2. Acesse o painel do roteador (ex.: `http://192.168.31.1`) → configurações de LAN / atribuição de IP estático por DHCP;

3. Adicione a regra: MAC → IP (ex.: `192.168.31.117`), salve;

4. Reconecte o WiFi e confirme que o IP está fixo.

> ✅ A reserva DHCP é mais estável do que definir IP estático no Windows (gestão centralizada no roteador, sem conflitos).

## 2.5 Abrir a rede (a etapa que mais costuma travar)

- **Conseguir acessar o registro de imagens do Docker**: Docker Hub / quay.io / ghcr.io. Se não funcionar, configure primeiro um acelerador de imagens (ex.: DaoCloud).

- **Conseguir acessar o GitHub**: clonar repositórios, baixar dependências públicas. Se não funcionar, use proxy ou baixe o pacote de código-fonte com antecedência.

- **A máquina de destino precisa ser acessível pela intranet**: confirme que o segmento de rede a ser exposto é alcançável.

---

[← Capítulo 1: Visão geral e arquitetura da plataforma](ch01-overview.md) · [📖 Índice](index.md) · [Capítulo 3: Arquivos de configuração e variáveis de ambiente →](ch03-env.md)
