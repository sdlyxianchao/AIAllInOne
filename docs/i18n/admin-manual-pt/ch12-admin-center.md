# Capítulo 12: Central de Administração de IA

*Parte 1 · Implantação*

> Portal unificado do administrador: autenticação Keycloak, todos os produtos embutidos no menu lateral, Dashboard com status do cluster.

[← Capítulo 11: MCP Gateway e Mercado de Skills](ch11-mcp.md) · [📖 Índice](index.md) · [Capítulo 13: Lista de verificação de interconexão →](ch13-interconnect.md)

---

> 📌 Posicionamento: não é uma plataforma de gestão do Docker (1Panel/Portainer), mas um painel unificado voltado ao administrador — autenticação Keycloak + menu lateral com links para todos os produtos + Dashboard com status do cluster + conta de administrador unificada.

## 12.1 Capacidades principais

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

## 12.2 Inicializar o Global Administrator

```
# configurar no .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=ver lista de contas e senhas
ADMIN_EMAIL=ai_all_in_one_admin@<domínio-empresa>
```

Após iniciar, cria automaticamente o usuário `ai_all_in_one_admin` no Keycloak (pula se já existir) e atribui a Realm Role `ai-platform-admin`. Conceito central: **uma única conta Global Admin para gerenciar toda a plataforma**.

## 12.3 Implantação com Docker Compose

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

## 12.4 Configuração do cliente Keycloak

1. Keycloak → enterprise-ai → Clients → Create;

2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow ambos On;

3. Valid Redirect URIs: `http://127.0.0.1:10086/*` e `http://<IP-do-servidor>:10086/*`;

4. Copie o Client Secret → preencha `KEYCLOAK_CLIENT_SECRET` no `.env` → `docker compose up -d admin-portal`;

5. Crie a Realm Role `ai-platform-admin` e atribua a `ai_all_in_one_admin`.

> ⚠️ Pontos de implantação/solução de problemas:
> - A sessão do admin-portal fica em memória; reconstruir o contêiner com `up -d` **limpa as sessões de login** (precisa logar de novo);
> - A página inicial `/` deve ser protegida pelo Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explícito), senão renderiza um painel vazio sem login;
> - Para estatísticas do Dify, use o e-mail real do administrador (`ai_all_in_one_admin@<domínio-empresa>`, igual ao admin global do AD);
> - **Após alterar o server.js, é obrigatório `docker restart admin-portal`**, não pode usar `up -d` (a mudança do conteúdo do arquivo no volume não dispara reconstrução).

## 12.5 Verificação

1. Abra `http://<IP-do-servidor>:10086` → redireciona automaticamente ao login do Keycloak (sem login não mostra painel vazio);

2. Entre com `ai_all_in_one_admin` → entra no dashboard geral;

3. O Dashboard mostra métricas de 8 produtos + agrupamento de contêineres;

4. Ao clicar em cada produto, veja as estatísticas primeiro; clicar em «Abrir painel» é que redireciona;

5. As configurações do sistema permitem alternar entre 9 idiomas.

## 12.6 Autorização de admin por módulo + gerenciamento da página Keycloak (v0.91)

O administrador global pode gerenciar outros administradores e o Keycloak pelo AI Admin Center:

- **Contas de administrador**: pesquise uma conta existente no IdP do Keycloak (usuários AD/LDAP, sem nova conta, sem senha) → escolha módulos → confirme. O sistema atribui o Realm Role `admin:<produto>` e **provisiona de fato o produto** (SSO primeiro, API de reserva): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revogar um módulo ou excluir um admin **remove a conta do produto**. Produtos sem SSO geram senha temporária, visível pelo ícone 🔑 (somente admin global). Não-admins veem o diálogo «Você não é administrador» e são desconectados.

- **Página Keycloak**: botões «Sincronizar tudo / Sinc. alterados» para trazer mudanças do AD em um clique; cada linha tem «Editar» (para o console Keycloak) e «Excluir»; a seção de funções permite criar/excluir funções e ver membros. Ações de sincronização/exclusão/funções somente para admin global.

> ⚠️ Nota: o Keycloak não tem endpoint de «sincronizar usuário único» — a sincronização incremental traz todas as contas AD alteradas. Usuários federados AD reaparecem após a próxima sincronização completa ou o próximo login SSO; para removê-los permanentemente, desative/exclua a conta no AD.

---

[← Capítulo 11: MCP Gateway e Mercado de Skills](ch11-mcp.md) · [📖 Índice](index.md) · [Capítulo 13: Lista de verificação de interconexão →](ch13-interconnect.md)
