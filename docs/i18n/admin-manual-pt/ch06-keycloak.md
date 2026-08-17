# Capítulo 6: Keycloak: Realm, usuários e AD

*Parte 1 · Implantação*

> Criar o Realm, criar contas locais ou importar contas de domínio do Active Directory — a base do SSO de todos os produtos.

[← Capítulo 5: Implantação independente do Dify](ch05-dify-deploy.md) · [📖 Índice](index.md) · [Capítulo 7: NewAPI: inicialização, canais e OIDC →](ch07-newapi.md)

---

> 📌 Acesso: host `http://127.0.0.1:9090`, intranet `http://<IP-do-servidor>:9090`. Os dados ficam no volume nomeado `keycloak-data`, e não se perdem ao reconstruir o contêiner. As credenciais estão em `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` no `.env.windows`.

## 6.1 Criar o Realm

1. Abra `http://127.0.0.1:9090` no navegador → Administration Console → login do administrador;

2. Menu suspenso no canto superior esquerdo → **Create Realm** → em Realm name, digite `enterprise-ai` → Create.

## 6.2 Método A: criar contas locais (equipes pequenas/testes sem AD)

1. **Groups** → Create Group → `ai-admin`; depois crie `ai-user`;

2. **Users** → Add user → nome de usuário → Create;

3. Aba Credentials → definir senha → Temporary desligado;

4. Aba Groups → adicionar ao grupo `ai-user`.

## 6.3 Método B: importar contas do Active Directory (recomendado)

Quando a empresa já tem controlador de domínio Windows AD, os funcionários fazem login com a conta de domínio, sem necessidade de criar contas manualmente no Keycloak. Pré-requisito: a rede entre o contêiner Docker e o controlador de domínio já está aberta (topologia de rede, Hyper-V Internal Switch e encaminhamento de portas estão no «Guia de integração de AD do Keycloak» `windows-ad-integration.html`).

> 📌 Conta AD necessária: conta de serviço `svc_keycloak` (senha sem expiração, usada para binding LDAP) + 2 usuários de domínio de teste (para validar a sincronização).

### Criar federação de usuários LDAP

1. Realm enterprise-ai → à esquerda **User Federation** → Add provider → **ldap**;

2. Preencha conforme a tabela abaixo.

| Configuração | Valor | Descrição |
| --- | --- | --- |
| Vendor | **Active Directory** | Selecione AD, não Other (senão o objectGUID não é reconhecido) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V com encaminhamento de porta; em produção use `ldap://dc.domínio-empresa:389` |
| Enable StartTLS | **Off** | LDAP 389 ou LDAPS 636 |
| Bind type | **simple** | Autenticação por usuário + senha |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Deve estar no formato LDAP DN**, não use ~~DOMAIN\usuário~~ |
| Bind credentials | `senha do svc_keycloak` | Veja `.env.windows` |
| Edit mode | **READ_ONLY** | Somente leitura, não grava de volta no AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | Com sub-OU, mude para `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **Não preencha cn** |
| RDN LDAP attribute | `cn` | Atributo de nomeação da entrada |
| UUID LDAP attribute | `objectGUID` | Identificador único imutável do AD |
| User object classes | `person, organizationalPerson, user` | Separados por vírgula |
| Search scope | **Subtree** | **Não selecione One Level** (senão não encontra sub-OU) |
| Pagination | **On** | Busca em lotes quando há muitos usuários |
| Referral | **ignore** | Evita seguir controladores de domínio inexistentes |
| Import users | **On** | Importação completa por sincronização |
| Sync Registrations | **On** | Sincronização imediata no primeiro login |

Save → **Synchronize all users** → aguarde a sincronização terminar.

> ⚠️ Erros comuns de preenchimento:
> - Bind DN no **formato LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), não ~~DOMAIN\usuário~~;
> - Username LDAP attribute = `sAMAccountName`, não `cn`;
> - Search scope = **Subtree**;
> - **Preserve os espaços no CN**: se o nome de exibição tiver espaços (como `ai all in one admin` com espaço no meio), o Bind DN deve ser escrito `CN=ai all in one admin,...`; usar underline fará a conexão falhar.

### Validar login AD

1. Abra `http://127.0.0.1:9090/realms/enterprise-ai/account` em janela anônima;

2. Faça login com a conta de domínio (nome de usuário `aitest1` ou UPN `aitest1@<domínio-empresa>`, ambos funcionam);

3. Se redirecionar para o Account Console, está aprovado.

## 6.4 Outras fontes de identidade corporativa (resumo do apêndice N)

O Keycloak também suporta várias fontes de identidade, todas conectadas ao mesmo Realm `enterprise-ai`:

| Fonte de identidade | Método de integração | Pontos-chave |
| --- | --- | --- |
| Microsoft Entra ID (antigo Azure AD) | Identity Providers → OpenID Connect v1.0 | Registre o app no Azure para obter client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (integrado) | Pode usar Mapper para adicionar `hd=domínio` e restringir o domínio |
| GitHub | Identity Providers → GitHub (integrado) | Callback do OAuth App `/broker/github/endpoint` |
| LDAP genérico (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor = Other, Username attribute = `uid` |
| SAML 2.0 genérico (Okta/ADFS) | Identity Providers → SAML v2.0 | Cole a URL de metadados do IdP para preencher automaticamente |

> ✅ Coexistência de múltiplas fontes: no fluxo Authentication → Browser, adicione Identity Provider Redirector para selecionar o IdP automaticamente pelo domínio do e-mail (`@empresa.com`→AD, `@empresa.onmicrosoft.com`→Entra ID).

> 📖 Documentação oficial:documentação oficial do Keycloak https://www.keycloak.org/documentation · guia de administração do servidor https://www.keycloak.org/server/ · federação LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← Capítulo 5: Implantação independente do Dify](ch05-dify-deploy.md) · [📖 Índice](index.md) · [Capítulo 7: NewAPI: inicialização, canais e OIDC →](ch07-newapi.md)
