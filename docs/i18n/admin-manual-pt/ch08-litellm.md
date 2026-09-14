# Capítulo 8: LiteLLM: validação e cache

*Parte 1 · Implantação*

> Validar que o proxy LiteLLM funciona e ativar cache de respostas para economizar tokens.

[← Capítulo 7: NewAPI: inicialização, canais e OIDC](ch07-newapi.md) · [📖 Índice](index.md) · [Capítulo 9: Configuração do Dify / Ghost / Gitea →](ch09-products.md)

---

> ⚠️ A anonimização de PII (guardrail Presidio) está atualmente **desativada temporariamente**: o formato de configuração de guardrail da nova versão do LiteLLM mudou, e essa seção do `litellm-config.yaml` foi comentada; por enquanto o LiteLLM só faz encaminhamento de proxy (sem anonimizar). O método de ativação está no capítulo 25.

## 8.1 Validar o funcionamento básico do LiteLLM

```
curl -X POST http://<IP-do-servidor>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` é a chave de administrador do LiteLLM; use o valor real do `.env` (não o placeholder em si, senão 401). E é obrigatório usar o IP de intranet `<IP-do-servidor>:4001`, não `127.0.0.1:4001` (problema de encaminhamento de porta do WSL2).

## 8.2 Cache de respostas (já integrado, economiza tokens)

O LiteLLM já vem com cache exact match no Redis: requisições totalmente idênticas (modelo + mensagens + parâmetros) retornam diretamente do cache, compartilhado entre usuários e economizando tokens.

```
# final do litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis de cache independente
    port: 6379
    ttl: 3600            # cache de 1 hora
```

> Verificação: `curl http://<IP-do-servidor>:4001/cache/ping -H "Authorization: Bearer <KEY>"` retorna `ping_response: true`; duas requisições idênticas seguidas: a segunda cai para a casa dos milissegundos. Para desativar o cache: `cache: false` e reinicie o litellm.

## 8.3 Adicionar mais provedores de LLM

1. No `.env`, descomente `# OPENAI_API_KEY=` e preencha a Key;

2. No `litellm-config.yaml`, descomente o bloco model correspondente;

3. `docker compose up -d litellm`.

> 📖 Documentação oficial:documentação oficial do LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Capítulo 7: NewAPI: inicialização, canais e OIDC](ch07-newapi.md) · [📖 Índice](index.md) · [Capítulo 9: Configuração do Dify / Ghost / Gitea →](ch09-products.md)
