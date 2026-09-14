# Capítulo 3: Arquivos de configuração e variáveis de ambiente

*Parte 1 · Implantação*

> Três arquivos de configuração principais + explicação de todas as variáveis de ambiente: o que configurar agora e o que configurar depois.

[← Capítulo 2: Preparação prévia](ch02-prereq.md) · [📖 Índice](index.md) · [Capítulo 4: Iniciar serviços principais →](ch04-start.md)

---

## 3.1 Os três arquivos de configuração principais

| Arquivo | Uso | Precisa modificar? |
| --- | --- | --- |
| `.env.windows` | Todas as senhas e API Keys externas | **Deve modificar**: preencher a DeepSeek API Key; outros providers conforme necessário |
| `litellm-config.yaml` | Lista de modelos do LiteLLM + regras de anonimização de PII | Normalmente não altera (usando só DeepSeek, pode remover as entradas OpenAI/Claude) |
| `docker-compose.yml` | Orquestração dos serviços principais | Já pré-configurado (inclui `KC_HOSTNAME` do Keycloak + volumes persistentes) |

## 3.2 Visão geral das variáveis de ambiente por categoria

Abra o `.env` (cópia do `.env.windows`) e configure por prioridade.

| Variável | Prioridade | Descrição |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 Imediata | API Key do LLM externo; sem ela a cadeia não funciona |
| `LITELLM_MASTER_KEY` | 🔴 Imediata | Chave de autenticação interna do LiteLLM, usada pelo NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 Imediata | Senha root do MySQL; não convém alterar após a primeira criação |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 Imediata | Senha do administrador do Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 Imediata | Criptografia de sessão do NewAPI, string aleatória |
| `NEWAPI_CRYPTO_SECRET` | 🔴 Imediata | Criptografia de dados do NewAPI, string aleatória |
| `ADMIN_PASSWORD` | 🔴 Imediata | Senha do Global Admin da Central de Administração de IA |
| `SESSION_SECRET` | 🔴 Imediata | Criptografia de sessão da Central de Administração de IA, string aleatória |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 Pode ser depois | Primeiro crie o OIDC Client no Keycloak para obter o Secret (veja o capítulo 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 Pode ser depois | Inicie o Gitea primeiro e obtenha o Token no painel (veja o capítulo 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 Conforme necessidade | Descomente quando for usar e altere em sincronia o `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` e outras de limitação | ⚪ Padrão | No período de testes use 999999; em produção reduza conforme necessário |
| `DEFAULT_QUOTA` | ⚪ Padrão | Cota padrão para novos usuários (em dólares); com 100, o novo usuário ganha 100 dólares |
| `GENERATE_DEFAULT_TOKEN` | ⚪ Padrão | Gera automaticamente uma Key inicial no registro; defina true para o usuário usar logo após o login |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ Padrão | Os valores padrão são suficientes |

## 3.3 🔴 Configuração imediata (obrigatória antes do primeiro start)

| Variável | Descrição | Como obter | Formato |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Key do LLM na nuvem DeepSeek | Registre-se em https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | Chave de administrador interno do LiteLLM (não é a Key do LLM externo) | Gere aleatoriamente (veja abaixo) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | Senha do MySQL | Defina você mesmo; após a primeira criação, **não convém alterar** | Qualquer |
| `KEYCLOAK_ADMIN_PASSWORD` | Senha do administrador do Keycloak | Defina você mesmo, ≥ 8 caracteres | Qualquer |
| `NEWAPI_SESSION_SECRET` | Criptografia de sessão do NewAPI | Gere aleatoriamente | 32 caracteres |
| `NEWAPI_CRYPTO_SECRET` | Criptografia de dados do NewAPI | Gere aleatoriamente | 32 caracteres |
| `ADMIN_PASSWORD` | Senha do administrador da Central de Administração de IA | Defina você mesmo, ≥ 8 caracteres | Qualquer |
| `SESSION_SECRET` | Criptografia de sessão da Central de Administração de IA | Gere aleatoriamente | 64 caracteres |

Gerar string aleatória (PowerShell):

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Exemplo de preenchimento da API Key

```
# Por padrão já configurado para DeepSeek (descomente e preencha a Key)
DEEPSEEK_API_KEY=sk-sua-chave-real-do-deepseek

# Para usar OpenAI / Claude, descomente e, em sincronia, descomente o bloco model correspondente no litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 Política de alteração de senhas

> ⚠️ `NEWAPI_DB_PASSWORD` envolve o banco já criado; alterar exige apagar o volume correspondente e recriar (os dados serão perdidos), então defina bem na primeira vez.
 `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` e outras senhas administrativas podem ser alteradas no painel de cada produto; depois, atualize o `.env` em sincronia (é apenas um lembrete, não afeta a execução).

## 3.5 Explicação do litellm-config.yaml

- `model_list` — define os modelos externos disponíveis; o NewAPI chama via LiteLLM. Por padrão, apenas `deepseek-chat` está habilitado;

- `general_settings.master_key` — chave de administrador do LiteLLM, lida de `LITELLM_MASTER_KEY` no `.env`;

- A anonimização de PII (Presidio) está atualmente **temporariamente comentada** (a API de guardrail da nova versão do LiteLLM mudou e ficou incompatível); para habilitar depois, veja o capítulo 25;

- Use a versão estável `v1.95.1` (`main-latest` tem bugs conhecidos).

---

[← Capítulo 2: Preparação prévia](ch02-prereq.md) · [📖 Índice](index.md) · [Capítulo 4: Iniciar serviços principais →](ch04-start.md)
