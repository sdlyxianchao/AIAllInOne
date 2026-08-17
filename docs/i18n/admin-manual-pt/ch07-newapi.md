# Capítulo 7: NewAPI: inicialização, canais e OIDC

*Parte 1 · Implantação*

> Concluir o assistente de instalação inicial, configurar o canal apontando para o LiteLLM, emitir API Keys e integrar o OIDC do Keycloak.

[← Capítulo 6: Keycloak: Realm, usuários e AD](ch06-keycloak.md) · [📖 Índice](index.md) · [Capítulo 8: LiteLLM: validação e cache →](ch08-litellm.md)

---

## 7.1 Assistente de instalação inicial (primeiro acesso)

Na primeira inicialização, o NewAPI exibe um assistente de configuração de 4 etapas:

1. **Verificação do banco de dados**: clique em «Verificar conexão do banco», esperando o check verde.

2. **Conta de administrador**: nome de usuário `ai_all_in_one_admin`, e-mail `ai_all_in_one_admin@<domínio-empresa>`, senha unificada de administrador.

> 📌 Por que criar primeiro o admin local: neste momento o OIDC ainda não está configurado, então o NewAPI não reconhece o Keycloak; é preciso ter uma conta local para «entrar» e concluir a configuração, para depois ativar o OIDC nas configurações do sistema.

3. **Modo de uso**: selecione «Uso pessoal» (uso interno: funcionários podem se registrar, consumo separado, sem módulo de recarga/cobrança).

4. **Confirmar inicialização**: cria as tabelas do banco → faça login como administrador.

## 7.2 Configurar o canal LLM (apontando para o LiteLLM)

1. **Canais** → adicionar novo canal → tipo `OpenAI`;

2. Base URL preencha `http://litellm:4000` (nome do contêiner, pela rede do Docker, **não localhost**);

3. Na chave, preencha o valor real de `LITELLM_MASTER_KEY` do `.env` (não o valor de exemplo, senão dá erro `No connected db`);

4. Em modelo, preencha `deepseek-chat` (exemplo; conforme a configuração real);

5. Salve → clique em «Testar» para validar a conexão.

Se houver vários providers, repita a adição: tipo `Anthropic Claude` para Claude, tipo `OpenAI` para DeepSeek, com Base URL sempre `http://litellm:4000`.

## 7.3 Criar API Keys

Crie uma para o Dify e outra para o DeepChat, com estatísticas de consumo separadas:

1. À esquerda **API Keys** → criar;

2. Nome `dify-key` → salvar → copiar `sk-xxx` (preencher no provedor de modelos do Dify);

3. Crie também `deepchat-key` → copiar `sk-xxx` (distribuir aos usuários do DeepChat).

## 7.4 Permitir que usuários comuns solicitem Keys por conta própria

Após o login, os funcionários podem criar Keys por conta própria na página «API Keys». Para realmente conseguirem chamar o modelo, é preciso cumprir dois pontos (já pré-configurados no `.env`):

1. **Ter cota**: `DEFAULT_QUOTA=100` (novo usuário ganha 100 dólares de cota);

2. **Ter token**: `GENERATE_DEFAULT_TOKEN=true` (gera o token inicial no registro).

> ⚠️ Só vale para usuários «recém-registrados»: usuários que já fizeram login (como `aitest1`) não recebem automaticamente; o administrador deve definir a cota manualmente na página «Usuários».

## 7.5 Integrar OIDC do Keycloak (para usuários AD entrarem direto)

### ① Criar o OIDC Client do NewAPI no Keycloak

1. Realm enterprise-ai → **Clients** → Create client;

2. Client ID `newapi`, tipo OpenID Connect;

3. **Client authentication: On** (obrigatório, senão não aparece a aba Credentials), Standard flow / Direct access grants: On;

4. Valid redirect URIs: `http://<IP-do-servidor>:3000/*` e `http://127.0.0.1:3000/*`;

5. Salve → aba Credentials → copie o Client secret.

### ② Ativar OIDC no NewAPI

Painel do NewAPI → **Configurações do sistema → Autenticação → OAuth personalizado → Adicionar provedor OAuth**, preencha:

| Grupo | Configuração | Valor |
| --- | --- | --- |
| Configuração rápida | Template predefinido / Endereço da API | `Keycloak` / `http://127.0.0.1:9090` |
| Informações básicas | Nome do provedor / Identificador | `Keycloak` / `keycloak` |
| Credenciais | Client ID / Secret | `newapi` / valor copiado do Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mapeamento de campos | ID do usuário / nome / e-mail | `sub` / `preferred_username` / `email` |

Após clicar em «Descoberta automática» para preencher os endpoints, **troque os endpoints de token e de informações do usuário para `host.docker.internal:9090`** (o contêiner do NewAPI chama o Keycloak internamente), mantendo o endpoint de autorização como `<IP-do-servidor>:9090` (usado no redirecionamento do navegador). Escopo `openid profile email`.

> ⚠️ Duas mudanças obrigatórias, senão o login falha:
> - **Após salvar, volte ao Keycloak e complemente a URL de callback**: adicione `http://<IP-do-servidor>:3000/oauth/keycloak` e `http://127.0.0.1:3000/oauth/keycloak` em Valid redirect URIs;
> - **Defina o «Endereço do servidor» do NewAPI como endereço de intranet**: configurações do sistema → configurações gerais → endereço do servidor para `http://<IP-do-servidor>:3000` (o padrão localhost faz a troca de token dar erro `invalid_grant - Incorrect redirect_uri`). Depois, acesse o NewAPI também pelo IP de intranet na própria máquina.

Método para alterar o banco:

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-do-servidor>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-do-servidor>:3000';"
docker compose restart new-api
```

> ⚠️ Solução de problemas: login retorna **429 Too Many Requests** — a limitação de taxa das interfaces críticas do NewAPI (padrão 20 vezes/20 minutos) foi acionada. Solução temporária: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; a solução permanente já está pré-configurada no `.env` com quatro grupos de variáveis como `CRITICAL_RATE_LIMIT_ENABLE=false`.

> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai · repositório open source https://github.com/QuantumNous/new-api

---

[← Capítulo 6: Keycloak: Realm, usuários e AD](ch06-keycloak.md) · [📖 Índice](index.md) · [Capítulo 8: LiteLLM: validação e cache →](ch08-litellm.md)
