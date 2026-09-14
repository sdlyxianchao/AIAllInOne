# Capítulo 14: Gestão diária do Keycloak

*Parte 2 · Gestão (operações diárias de cada produto)*

> Centro de autenticação: gerenciar usuários, roles, clientes OIDC, federação AD e sessões.

[← Capítulo 13: Lista de verificação de interconexão](ch13-interconnect.md) · [📖 Índice](index.md) · [Capítulo 15: Gestão diária do NewAPI →](ch15-ops-newapi.md)

---

**Entrada**: `http://<IP-do-servidor>:9090` → Administration Console → login do administrador.

> 📌 Muitas dessas operações também podem ser feitas no AI Admin Center → página Keycloak (somente admin global): sincronização LDAP completa/incremental, excluir usuários e gerenciamento de funções (listar/criar/excluir/ver membros). Ver capítulo 12.6.

## 14.1 Gerenciar usuários

1. **Criar usuário**: Users → Add user → preencher nome de usuário → Create;

2. **Definir senha**: aba Credentials do usuário → definir senha → Temporary desligado (senão força troca no primeiro login);

3. **Redefinir senha**: Users → localizar o usuário → Credentials → Set password;

4. **Desativar/ativar**: botão Enabled no topo dos detalhes do usuário (após desativar, todo SSO do usuário perde efeito imediatamente);

5. **Excluir**: detalhes do usuário → Delete.

## 14.2 Roles e permissões

- **Realm Role**: Realm roles → Create role para criar a role (como `ai-platform-admin`);

- **Atribuir role**: usuário → Role mapping → Assign role;

- **Grupos**: Groups → criar grupo (`ai-admin` / `ai-user`) → adicionar usuários ao grupo; a role é atribuída ao grupo, e os usuários herdam as permissões do grupo.

> ✅ As permissões de gestão são controladas de forma unificada pela role `ai-platform-admin`; cada produto usa essa role para identificar o administrador ao integrar SSO.

## 14.3 Clientes OIDC (novos produtos integrando SSO)

1. Clients → Create client → Client ID com o nome do produto (como `newapi` / `grafana` / `langfuse`);

2. Client authentication: On (senão não aparece a aba Credentials), Standard flow: On;

3. Valid redirect URIs / Web origins: preencher o endereço de callback do produto (adicionar tanto o IP de intranet quanto 127.0.0.1);

4. Salvar → copiar o Client secret na aba Credentials para o lado do produto.

## 14.4 Manutenção da federação AD / LDAP

- **Alterar controlador de domínio/senha**: User Federation → clicar no LDAP Provider → alterar Connection URL / Bind credentials → Save;

- **Sincronização manual**: Synchronize all users;

- **Mapeamento de grupos**: aba Mappers → group-ldap-mapper → Groups DN define o contêiner onde estão os grupos do AD, mapeando os grupos do AD para roles do Keycloak.

## 14.5 Gerenciamento de sessões

- **Ver sessões ativas**: Users → um usuário → Sessions;

- **Forçar logout**: Sessions → Sign out all;

- **Configuração global de sessão/token**: Realm settings → abas Sessions / Tokens para ajustar o tempo limite.

> ⚠️ Revisão de armadilhas críticas: ① preserve os espaços no CN do bind DN; ② Username LDAP attribute = `sAMAccountName`, não `cn`; ③ Search scope = Subtree; ④ SSO com `unknown_error` geralmente é o serviço iphlpsvc do host parado, fazendo o encaminhamento de porta do AD falhar; ⑤ quando a VM do controlador de domínio AD não está ligada, o login de contas federadas por LDAP dá `LDAP Connection refused`.

> 📖 Documentação oficial:documentação oficial do Keycloak https://www.keycloak.org/documentation · guia de administração do servidor https://www.keycloak.org/server/

---

[← Capítulo 13: Lista de verificação de interconexão](ch13-interconnect.md) · [📖 Índice](index.md) · [Capítulo 15: Gestão diária do NewAPI →](ch15-ops-newapi.md)
