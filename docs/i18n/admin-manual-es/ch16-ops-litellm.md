# Capítulo 16: Administración diaria de LiteLLM

*Parte II · Administración (operaciones diarias de cada producto)*

> Proxy de enmascaramiento de PII: lista de modelos, reglas de enmascarado, caché e informes a Langfuse.

[← Capítulo 15: Administración diaria de NewAPI](ch15-ops-newapi.md) · [📖 Índice](index.md) · [Capítulo 17: Administración diaria de Dify →](ch17-ops-dify.md)

---

**Entrada**: `http://<IP-del-servidor>:4001` (API pura, sin interfaz web; para depurar usa `/v1/models`). La configuración está en `litellm-config.yaml`.

## 16.1 Mantenimiento de la lista de modelos

Edita el `model_list` de `litellm-config.yaml` para añadir o quitar modelos y sus API Keys. Pasos para añadir un provider nuevo:

1. En `.env` descomenta `# OPENAI_API_KEY=` y rellena la Key;

2. En `litellm-config.yaml` descomenta el bloque del modelo correspondiente;

3. `docker compose up -d litellm`.

## 16.2 Caché de respuestas

Caché de coincidencia exacta de Redis; las peticiones idénticas se comparten entre usuarios. Ajusta `cache_params.ttl` (por defecto 3600 segundos). Para desactivarla: `cache: false` y reinicia.

## 16.3 Informes a Langfuse

Mediante `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` de `.env` se informa automáticamente de cada llamada.

## 16.4 Reinicio y resolución de problemas

```
docker compose restart litellm          # reiniciar tras cambiar la configuración
docker logs litellm --tail 50           # ver registros
```

> ⚠️ Puntos críticos: ① los guardrails necesitan `default_on: true` para aplicarse globalmente; ② el enmascaramiento de PII (Presidio) está comentado temporalmente por cambios en la API upstream y solo hace de proxy puro; ③ usa la versión estable `v1.95.1` (`main-latest` tiene bugs).

> 📖 Documentación oficial:Documentación oficial de LiteLLM https://docs.litellm.ai · Guardrail de Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Capítulo 15: Administración diaria de NewAPI](ch15-ops-newapi.md) · [📖 Índice](index.md) · [Capítulo 17: Administración diaria de Dify →](ch17-ops-dify.md)
