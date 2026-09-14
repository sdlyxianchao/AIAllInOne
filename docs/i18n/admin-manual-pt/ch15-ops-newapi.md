# Capítulo 15: Gestão diária do NewAPI

*Parte 2 · Gestão (operações diárias de cada produto)*

> Gateway de LLM: gerenciar canais, tokens, cotas, usuários, logs e custos.

[← Capítulo 14: Gestão diária do Keycloak](ch14-ops-keycloak.md) · [📖 Índice](index.md) · [Capítulo 16: Gestão diária do LiteLLM →](ch16-ops-litellm.md)

---

**Entrada**: `http://<IP-do-servidor>:3000`.

## 15.1 Gerenciamento de canais (modelos upstream)

1. **Adicionar canal**: canais → adicionar novo canal → tipo OpenAI (ou Claude etc.) → Base URL `http://litellm:4000` → chave `LITELLM_MASTER_KEY` → preencher nome do modelo → salvar;

2. **Testar**: na lista de canais, clique em «Testar» e selecione o modelo para validar a conexão;

3. **Desativar/ativar**: botão na lista de canais; desativado, o canal deixa de receber requisições;

4. **Prioridade/peso**: com vários canais do mesmo modelo, divida o fluxo por prioridade/peso.

## 15.2 Gerenciamento de tokens (API Keys)

1. **Criar**: API Keys → criar token → nomear (como `dsh-key`) → pode definir cota/expiração/limite de modelo → salvar;

2. **Copiar a Key**: começa com `sk-`, **é exibida só uma vez, salve imediatamente**;

3. **Desativar/excluir**: operações na lista de tokens (desativada, a Key perde efeito na hora);

4. **Consultar consumo**: detalhes do token mostram a cota já consumida.

## 15.3 Cotas e usuários

- **Cota padrão de novo usuário**: `DEFAULT_QUOTA` (sugere-se 100 dólares);

- **Aumentar cota de um usuário**: página de usuários → editar o usuário → definir cota;

- **Recarga/banimento**: operações na página de usuários;

- **Gestão por grupos**: crie grupos por departamento, defina multiplicador de modelo/cota; usuários no grupo passam a ser controlados por departamento.

## 15.4 Logs e custos

- **Página de logs**: consultar usuário/modelo/token/cota/custo/IP de origem de cada chamada;

- **Relatório de custos**: a página «Gestão do NewAPI» da Central de Administração de IA tem relatório de custos agregado por usuário/modelo/data + os últimos 100 logs de auditoria.

> 📌 O registro do IP do cliente depende da configuração do usuário «registrar log de IP» (`record_ip_log`, desligada por padrão); quando precisar de auditoria de IP, ative para o usuário correspondente.

## 15.5 Pontos-chave das configurações do sistema

- **Endereço do servidor**: deve ser o endereço de intranet `http://<IP-do-servidor>:3000` (senão o OIDC dá `invalid_grant - Incorrect redirect_uri`);

- **Autenticação → OAuth personalizado**: integração OIDC do Keycloak (veja o capítulo 7);

- **Modo de uso**: alterna entre uso pessoal ↔ operação externa.

> ⚠️ Revisão de armadilhas críticas: ① a Base URL do canal deve ser sempre o nome do contêiner `http://litellm:4000`; ② a limitação de taxa 429 é controlada por variáveis como `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ para alterar o banco, use diretamente a variável de ambiente `MYSQL_PWD`, evitando que o aviso de senha no stderr seja interpretado como erro.

> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai · repositório open source https://github.com/QuantumNous/new-api

---

[← Capítulo 14: Gestão diária do Keycloak](ch14-ops-keycloak.md) · [📖 Índice](index.md) · [Capítulo 16: Gestão diária do LiteLLM →](ch16-ops-litellm.md)
