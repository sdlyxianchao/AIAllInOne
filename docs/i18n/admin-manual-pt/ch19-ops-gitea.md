# Capítulo 19: Gestão diária do Gitea

*Parte 2 · Gestão (operações diárias de cada produto)*

> Git interno + CI/CD: repositórios, organizações, Runner, Actions.

[← Capítulo 18: Gestão diária do Ghost](ch18-ops-ghost.md) · [📖 Índice](index.md) · [Capítulo 20: Gestão diária do MCP Gateway →](ch20-ops-mcp.md)

---

**Entrada**: Web `http://<IP-do-servidor>:3002`; SSH `ssh://git@<IP-do-servidor>:2222`.

## 19.1 Repositórios e organizações

1. **Criar repositório**: + no canto superior direito → New repository;

2. **Criar organização**: + → New organization, crie repositórios e gerencie equipes dentro da organização;

3. **Migrar repositório externo**: + → New migration, preencha o endereço do GitHub para mirror (sincroniza o código-fonte somente leitura).

## 19.2 Usuários e permissões

- **Adicionar usuário**: Site Administration → User Accounts → Create user;

- **Permissão de repositório**: repositório → Settings → Collaborators;

- **Equipes da organização**: organização → Teams → criar equipe → adicionar membros → atribuir permissão de repositório.

## 19.3 Gerenciamento de Actions / Runner

1. **Ativar Actions**: Site Administration → Actions → Enabled;

2. **Registrar Runner**: Runners → Create new Runner → copiar Token → preencher `GITEA_RUNNER_TOKEN` no `.env` → `docker compose up -d gitea-runner`;

3. **Ver status do Runner**: a página Runners mostra Idle (verde), o que é normal;

4. **Executar workflow**: repositório → Actions → execução manual ou gatilho por push.

> ⚠️ Para alterar o token do Runner, é obrigatório `up -d` (restart não relê o .env).

## 19.4 Configurações do site

- **ROOT_URL**: `GITEA__server__ROOT_URL` deve ser o endereço de intranet `http://<IP-do-servidor>:3002/`, senão os links de repositório gerados ficam localhost;

- **Política de registro**: Site Administration → Config para ajustar o registro e a configuração de e-mail.

> ⚠️ Armadilha crítica: o erro `readonly database` geralmente é porque o `gitea.db` está com dono root; apague o db com dono root para que seja recriado com o usuário git.

> 📖 Documentação oficial:documentação oficial do Gitea (em chinês) https://docs.gitea.com/zh-cn · administração https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← Capítulo 18: Gestão diária do Ghost](ch18-ops-ghost.md) · [📖 Índice](index.md) · [Capítulo 20: Gestão diária do MCP Gateway →](ch20-ops-mcp.md)
