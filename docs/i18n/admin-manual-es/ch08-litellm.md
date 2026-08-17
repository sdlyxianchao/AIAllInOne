# Capítulo 8: LiteLLM: verificación y caché

*Parte I · Implementación*

> Verificar que el proxy de LiteLLM funciona y activar la caché de respuestas para ahorrar tokens.

[← Capítulo 7: NewAPI: inicialización, canales y OIDC](ch07-newapi.md) · [📖 Índice](index.md) · [Capítulo 9: Configuración de Dify / Ghost / Gitea →](ch09-products.md)

---

> ⚠️ El enmascaramiento de PII (guardrail de Presidio) está **desactivado temporalmente**: el formato de configuración del guardrail cambió en la nueva versión de LiteLLM, por lo que ese bloque de `litellm-config.yaml` está comentado y, por ahora, LiteLLM solo reenvía como proxy (sin enmascarar). El método de activación se describe en el capítulo 25.

## 8.1 Verificar que LiteLLM funciona básicamente

```
curl -X POST http://<IP-del-servidor>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` es la clave de administrador de LiteLLM; toma el valor real de `.env` (no el propio marcador, de lo contrario da 401). Y debe usarse la IP de intranet `<IP-del-servidor>:4001`, no `127.0.0.1:4001` (problema de reenvío de puertos de WSL2).

## 8.2 Caché de respuestas (ya integrada, ahorra tokens)

LiteLLM ya tiene activada la caché de coincidencia exacta de Redis: las peticiones idénticas (modelo + mensajes + parámetros) devuelven directamente la caché, compartida entre usuarios y ahorrando tokens.

```
# Al final de litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis de caché independiente
    port: 6379
    ttl: 3600            # caché de 1 hora
```

> Verificación: `curl http://<IP-del-servidor>:4001/cache/ping -H "Authorization: Bearer <KEY>"` devuelve `ping_response: true`; con dos peticiones idénticas consecutivas, la segunda baja a milisegundos. Para desactivar la caché: pon `cache: false` y reinicia litellm.

## 8.3 Añadir más proveedores de LLM

1. En `.env` descomenta `# OPENAI_API_KEY=` y rellena la Key;

2. En `litellm-config.yaml` descomenta el bloque del modelo correspondiente;

3. `docker compose up -d litellm`.

> 📖 Documentación oficial:Documentación oficial de LiteLLM https://docs.litellm.ai · Guardrail de Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Capítulo 7: NewAPI: inicialización, canales y OIDC](ch07-newapi.md) · [📖 Índice](index.md) · [Capítulo 9: Configuración de Dify / Ghost / Gitea →](ch09-products.md)
