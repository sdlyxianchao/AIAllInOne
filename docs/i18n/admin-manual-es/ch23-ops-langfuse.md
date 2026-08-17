# Capítulo 23: Observabilidad de LLM (Langfuse)

*Parte II · Administración (operaciones diarias de cada producto)*

> Rastrear el prompt, la respuesta, la latencia, los tokens y el costo de cada llamada al modelo.

[← Capítulo 22: Administración de monitoreo y alertas](ch22-ops-monitoring.md) · [📖 Índice](index.md) · [Capítulo 24: Registro unificado (Loki) →](ch24-ops-loki.md)

---

**Entrada**: `http://<IP-del-servidor>:3010` (inicio de sesión automático por SSO; la entrada del Centro de administración de IA apunta a `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 Componentes

| Componente | Uso |
| --- | --- |
| langfuse | Web UI + visualización de trazas (3010) |
| langfuse-worker | Procesamiento asíncrono de eventos |
| langfuse-postgres | Almacenamiento de metadatos |
| langfuse-clickhouse | Almacenamiento de eventos/trazas |
| langfuse-minio | Almacenamiento de adjuntos/medios S3 |
| langfuse-redis | Cola |

LiteLLM informa automáticamente mediante `success_callback: ["langfuse"]` (`LANGFUSE_*` de `.env`).

## 23.2 Ver trazas

1. Inicia sesión en Langfuse → elige la organización `AI All In One` / el proyecto `AI Platform`;

2. En la lista Traces ves cada llamada; haz clic para ver prompt/respuesta/modelo/latencia/tokens/costo;

3. Usa Session para relacionar conversaciones de varias rondas.

## 23.3 Resolución de problemas

> ⚠️ Puntos críticos:
> - Debe configurarse `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (tanto en web como en worker); de lo contrario, el SDK antiguo falla al informar `trace-create` y no se ven los datos;
> - Si con SSO no ves datos: la cuenta de SSO (correo de AD) es distinta de la cuenta de inicialización y Langfuse crea automáticamente una cuenta que no pertenece a ninguna organización. Corrección (añadir el usuario de SSO a la organización):

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<dominio-empresa>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 Documentación oficial:Documentación oficial de Langfuse https://langfuse.com/docs · Autoalojada https://langfuse.com/self-hosting

---

[← Capítulo 22: Administración de monitoreo y alertas](ch22-ops-monitoring.md) · [📖 Índice](index.md) · [Capítulo 24: Registro unificado (Loki) →](ch24-ops-loki.md)
