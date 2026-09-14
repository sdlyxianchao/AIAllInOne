# Capítulo 16: Gestão diária do LiteLLM

*Parte 2 · Gestão (operações diárias de cada produto)*

> Proxy de anonimização de PII: lista de modelos, regras de anonimização, cache, reporte ao Langfuse.

[← Capítulo 15: Gestão diária do NewAPI](ch15-ops-newapi.md) · [📖 Índice](index.md) · [Capítulo 17: Gestão diária do Dify →](ch17-ops-dify.md)

---

**Entrada**: `http://<IP-do-servidor>:4001` (API pura, sem interface Web; para depurar use `/v1/models`). A configuração fica em `litellm-config.yaml`.

## 16.1 Manutenção da lista de modelos

Edite `model_list` em `litellm-config.yaml` para adicionar/remover modelos e as API Keys correspondentes. Passos para adicionar um novo provider:

1. No `.env`, descomente `# OPENAI_API_KEY=` e preencha a Key;

2. No `litellm-config.yaml`, descomente o bloco model correspondente;

3. `docker compose up -d litellm`.

## 16.2 Cache de respostas

Cache exact match no Redis: requisições totalmente idênticas são compartilhadas entre usuários. Ajuste `cache_params.ttl` (padrão 3600 segundos). Desativar: `cache: false` e reinicie.

## 16.3 Reporte ao Langfuse

Reporta automaticamente cada chamada via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` do `.env`.

## 16.4 Reinício e solução de problemas

```
docker compose restart litellm          # reinicia após alterar a configuração
docker logs litellm --tail 50           # ver logs
```

> ⚠️ Armadilhas críticas: ① guardrails precisam de `default_on: true` para valer globalmente; ② a anonimização de PII (Presidio) está atualmente comentada por mudança na API upstream, funcionando apenas como proxy puro; ③ use a versão estável `v1.95.1` (`main-latest` tem bugs).

> 📖 Documentação oficial:documentação oficial do LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Capítulo 15: Gestão diária do NewAPI](ch15-ops-newapi.md) · [📖 Índice](index.md) · [Capítulo 17: Gestão diária do Dify →](ch17-ops-dify.md)
