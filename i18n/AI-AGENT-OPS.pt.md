# Guia de operação com agentes de IA

> 📖 **Idiomas**: [English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

Esta plataforma foi projetada para ser **operada e mantida por um agente de IA** — WorkBuddy, OpenClaw, Microsoft Scout ou qualquer ferramenta equivalente. Em vez de entrar em uma dúzia de consoles de administração e clicar em interfaces, você diz ao agente o que quer em linguagem natural, e ele lê arquivos, executa comandos e conversa com os serviços por você.

Este guia explica como usar um agente de IA para as operações diárias: verificações de integridade, gerenciamento de contêineres, mudanças de configuração, o Centro de Administração de IA, Gitea/sincronização, o portal Ghost, backups, releases e solução de problemas.

---

## 1. Como funciona

Tudo que faz a plataforma funcionar vive na sua máquina como **código, configuração e dados**:

- O **Docker Compose** define todos os contêineres.
- Os **arquivos `.env`** (ex. `windows/.env.windows`) guardam as credenciais usadas pelos serviços.
- As **APIs de administração** expõem os endpoints de gerenciamento (Keycloak, Gitea, NewAPI etc.).
- Os **arquivos e bancos de dados** (o banco SQLite do Ghost, os instaladores do DSH Desktop, o JSON do histórico de sincronização etc.) são o estado real.

O agente pode:

- **Ler e editar** qualquer arquivo — configurações, scripts, o `index.html` / `server.js` do Centro de Administração de IA e a documentação.
- **Executar comandos** — `docker`, `docker compose`, `git`, PowerShell, Node.js e Python.
- **Chamar serviços via HTTP** — APIs de administração, endpoints de integridade, links de download.
- **Pesquisar na web** a documentação dos produtos quando necessário.

Como tudo é só arquivos + comandos + APIs, o agente consegue ver e mudar tudo — é por isso que você pode operar a plataforma inteira por meio dele.

---

## 2. Preparação (uma única vez)

1. **Abra a pasta do projeto no agente.** Aponte o diretório de trabalho do agente para a raiz do projeto (ex. `C:\AIAllInOne`). É lá que ele lê o `docker-compose.yml`, os arquivos `.env`, os scripts e a documentação.
2. **Garanta que o Docker Desktop esteja rodando.** A maioria das operações são comandos `docker` / `docker compose`. Se o Docker Desktop estiver parado, o primeiro passo do agente costuma ser verificar e iniciá-lo.
3. **Deixe as credenciais no `.env`, não no chat.** O agente lê `windows/.env.windows` para as senhas dos serviços. Não cole senhas reais na conversa nem em arquivos versionados.
4. **Diga qual pasta de plataforma usar** se não for óbvio (`windows/` na maioria dos casos de máquina única).

---

## 3. O que o agente pode fazer

| Tarefa | Como o agente faz |
|---|---|
| Verificação de integridade / visão geral | `docker ps` + endpoints de integridade + APIs de administração |
| Iniciar / reiniciar / parar serviços | `docker compose up -d <svc>` / `docker restart <svc>` |
| Ver logs e erros | `docker logs <svc> --tail N`, ler arquivos de log |
| Mudar configuração | editar arquivos e reiniciar o contêiner afetado |
| Editar o Centro de Administração de IA | editar `admin-portal/public/index.html` (UI) ou `admin-portal/server.js` (API) |
| Gerenciar Gitea + sincronização | API do Gitea: disparar workflows, ler status/logs, editar arquivos do repositório |
| Gerenciar o portal Ghost | ler/escrever o banco SQLite do Ghost, editar templates do tema, importar o conteúdo de exemplo |
| Backup e restauração | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publicar uma versão | `publish.ps1` (build + commit + push para o GitHub) |
| Limpar | `docker image prune`, remover backups antigos etc. (com sua confirmação) |
| Solucionar problemas | conflitos de porta, problemas do Docker Desktop, DNS/proxy etc. |

---

## 4. Tarefas comuns e exemplos de instruções

Estas são as tarefas que você fará com mais frequência, cada uma com um exemplo. Você pode dizê-las no seu idioma — o agente vai seguir. Substitua `<…>` pelos valores reais.

### 4.1 Verificar a integridade de tudo

> "Verifique se todos os serviços estão rodando e íntegros. Liste qualquer contêiner parado ou reiniciando e me diga o porquê."

O agente executa `docker ps`, consulta cada endpoint de integridade e reporta o status.

### 4.2 Investigar um serviço parado ou com erro

> "O LiteLLM está parado. Descubra o porquê e corrija; depois confirme que voltou."

O agente inspeciona o estado do contêiner, lê os logs, encontra a causa raiz (ex. conflito de porta) e a corrige.

### 4.3 Reiniciar um serviço

> "Reinicie o portal de administração para que minha mudança no server.js surta efeito."

O agente executa `docker restart admin-portal`. Nota: uma mudança no **backend** (`server.js`) exige reiniciar o contêiner; uma mudança no **frontend** (`index.html`) só exige atualizar o navegador.

### 4.4 Ver logs

> "Mostre as últimas 50 linhas do log do runner do Gitea e me diga se há erros."

### 4.5 Gerenciar a sincronização do DSH Desktop (Gitea)

> "Dispare o workflow dsh-sync e me mostre o progresso — fase, arquivos baixados, MB, ETA."

O agente chama a API do Gitea para disparar o workflow, depois consulta o status da execução e lê o `sync-progress.json`.

### 4.6 Mudar o Centro de Administração de IA

> "Adicione paginação à lista de repositórios do Gitea — 10 por página, ajustável."

O agente edita o `index.html`, valida o JavaScript e (para mudanças de backend) reinicia o contêiner. Depois você faz uma atualização forçada (Ctrl+F5).

### 4.7 Gerenciar o portal Ghost

> "Importe o conteúdo de exemplo para o portal, usando o endereço 192.168.1.100 e em chinês."

O agente pergunta o endereço de publicação e o idioma, depois executa `ghost-content-import.ps1`. Ele também pode corrigir temas, editar páginas e mudar a navegação diretamente no banco.

### 4.8 Backup e restauração

> "Execute um backup completo agora e confirme que deu certo."

### 4.9 Publicar uma versão no GitHub

> "Publique uma nova versão v0.7 com a mensagem 'feat: …'."

O agente executa `publish.ps1 -Version v0.7 -CommitMessage "…"`. Nota: o `git push` precisa que o proxy ou a credencial do GitHub estejam disponíveis — se o push falhar por rede, o agente pedirá para você abrir o proxy.

### 4.10 Limpar espaço em disco

> "Mostre o que está ocupando o espaço em disco do Docker e o que dá para remover com segurança."

O agente escaneia (`docker system df`, imagens não usadas, volumes, backups antigos) e lista os candidatos — **ele só remove depois que você confirmar quais.**

---

## 5. Boas práticas e armadilhas

- **Recarga de frontend vs backend.** No Centro de Administração de IA, mudanças no `index.html` surtem efeito ao atualizar o navegador (o arquivo é montado como volume); mudanças no `server.js` exigem `docker restart admin-portal` — um simples `docker compose up -d` **não** recarrega o código montado como volume.
- **Force a atualização** (Ctrl+F5) quando a interface parecer não mudar — o JavaScript antigo costuma estar em cache.
- **Nunca versione segredos nem IPs reais.** Use marcadores (ex. `<服务器IP>`, `CHANGE_ME_*`). O `publish.ps1` limpa automaticamente as senhas do `server.js`.
- **Verifique, não acredite cegamente.** Peça ao agente que prove os resultados com comandos (códigos HTTP, `ls`, linhas de log), sobretudo quando ele diz «já está corrigido».
- **Faça backup antes de mudanças destrutivas.** O agente deve fazer backup do banco do Ghost ou da configuração antes de editá-los, e confirmar com você antes de excluir qualquer coisa.
- **Pergunte idioma e endereço antes de importar conteúdo.** O agente deve perguntar primeiro o endereço de publicação e o idioma de destino.
- **Rede e proxy.** Alguns passos (push para o GitHub, buscas na web) precisam do proxy (ex. `127.0.0.1:33210`) ou de acesso à internet. Se um passo de rede falhar, abra o proxy e tente de novo.

---

## 6. Referência rápida de comandos

| Ação | Comando |
|---|---|
| Listar contêineres | `docker ps -a` |
| Logs de um contêiner | `docker logs <nome> --tail 100` |
| Reiniciar um serviço | `docker restart <nome>` |
| Iniciar todos os serviços | `docker compose up -d` |
| Status do Compose | `docker compose ps` |
| Disparar a sincronização do Gitea | `POST /api/v1/repos/<user>/dsh-sync/actions/workflows/sync.yml/dispatches` |
| Executar um backup | `powershell .\scripts\backup.ps1` |
| Publicar uma versão | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
