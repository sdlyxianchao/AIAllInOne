# Capítulo 9: Configuração do Dify / Ghost / Gitea

*Parte 1 · Implantação*

> Inicialização e configuração de interconexão de cada um dos três produtos.

[← Capítulo 8: LiteLLM: validação e cache](ch08-litellm.md) · [📖 Índice](index.md) · [Capítulo 10: Distribuição e CI/CD do DeepChat →](ch10-deepchat.md)

---

## 9.1 Dify: configurar o provedor de modelos

1. Abra `http://<IP-do-servidor>` → defina o e-mail/senha do administrador na primeira vez (e-mail `ai_all_in_one_admin@<domínio-empresa>`);

2. **Configurações → Provedores de modelos** → OpenAI-API-compatible → adicionar modelo:

- Nome do modelo `deepseek-chat` (conforme o real);

- API Key: `sk-xxx` da `dify-key`;

- API endpoint: `http://host.docker.internal:3000/v1`.

3. Studio → criar assistente de chat → selecionar modelo → enviar mensagem para validar.

> ⚠️ O Dify usa `host.docker.internal` em vez do nome do contêiner, porque o Dify está em sua própria rede, diferente da rede do NewAPI.

## 9.2 Ghost: configurar o portal

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

## 9.3 Gitea: inicialização e registro do Runner

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
 ⚠️ Armadilha 2: `ROOT_URL` deve ser `http://<IP-do-servidor>:3002/`, senão os links de repositório gerados ficam localhost e os funcionários não conseguem abrir.

> 📖 Documentação oficial:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (em chinês) https://docs.gitea.com/zh-cn

---

[← Capítulo 8: LiteLLM: validação e cache](ch08-litellm.md) · [📖 Índice](index.md) · [Capítulo 10: Distribuição e CI/CD do DeepChat →](ch10-deepchat.md)
