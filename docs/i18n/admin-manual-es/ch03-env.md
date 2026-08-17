# Capítulo 3: Archivos de configuración y variables de entorno

*Parte I · Implementación*

> Tres archivos de configuración principales + la explicación completa de las variables de entorno: cuáles se configuran ahora y cuáles después.

[← Capítulo 2: Preparación previa](ch02-prereq.md) · [📖 Índice](index.md) · [Capítulo 4: Iniciar los servicios principales →](ch04-start.md)

---

## 3.1 Los tres archivos de configuración principales

| Archivo | Uso | ¿Hay que modificarlo? |
| --- | --- | --- |
| `.env.windows` | Todas las contraseñas y API Keys externas | **Modificación obligatoria**: rellenar la API Key de DeepSeek; los demás providers según necesidad |
| `litellm-config.yaml` | Lista de modelos de LiteLLM + reglas de enmascaramiento de PII | Normalmente no se modifica (si solo usas DeepSeek, puedes eliminar las entradas de OpenAI/Claude) |
| `docker-compose.yml` | Orquestación de los servicios principales | Ya preconfigurado (incluye `KC_HOSTNAME` de Keycloak + volúmenes persistentes) |

## 3.2 Resumen de la clasificación de variables de entorno

Abre `.env` (copiado de `.env.windows`) y configúralo por prioridad.

| Variable | Prioridad | Descripción |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 Inmediata | API Key del LLM externo; sin ella la cadena no funciona |
| `LITELLM_MASTER_KEY` | 🔴 Inmediata | Clave de autenticación interna de LiteLLM; NewAPI la necesita |
| `NEWAPI_DB_PASSWORD` | 🔴 Inmediata | Contraseña de root de MySQL; no conviene cambiarla tras la primera creación |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 Inmediata | Contraseña del administrador de Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 Inmediata | Cifrado de sesión de NewAPI; cadena aleatoria |
| `NEWAPI_CRYPTO_SECRET` | 🔴 Inmediata | Cifrado de datos de NewAPI; cadena aleatoria |
| `ADMIN_PASSWORD` | 🔴 Inmediata | Contraseña del Global Admin del Centro de administración de IA |
| `SESSION_SECRET` | 🔴 Inmediata | Cifrado de sesión del Centro de administración de IA; cadena aleatoria |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 Posterior | Primero hay que crear el OIDC Client en Keycloak y obtener el Secret (ver capítulo 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 Posterior | Inicia primero Gitea y obtén el Token desde el panel (ver capítulo 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 Según necesidad | Descomenta cuando las uses y actualiza también `litellm-config.yaml` |
| `GLOBAL_WEB_RATE_LIMIT` y otros límites de tasa | ⚪ Por defecto | En pruebas pon 999999; en producción baja según corresponda |
| `DEFAULT_QUOTA` | ⚪ Por defecto | Cuota por defecto de los nuevos usuarios (dólares); con 100, cada usuario nuevo recibe 100 dólares |
| `GENERATE_DEFAULT_TOKEN` | ⚪ Por defecto | Genera automáticamente una Key inicial al registrar un usuario; pon true para que el usuario la use al iniciar sesión |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ Por defecto | Los valores por defecto bastan |

## 3.3 🔴 Configuración inmediata (obligatoria antes del primer arranque)

| Variable | Descripción | Cómo obtenerla | Formato |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Key del LLM en la nube de DeepSeek | Regístrate en https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | Clave de administrador interna de LiteLLM (no es una Key de LLM externo) | Genérala aleatoriamente (ver abajo) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | Contraseña de MySQL | Defínela tú; **no conviene cambiarla** tras la primera creación | Cualquiera |
| `KEYCLOAK_ADMIN_PASSWORD` | Contraseña del administrador de Keycloak | Defínela tú; ≥ 8 caracteres | Cualquiera |
| `NEWAPI_SESSION_SECRET` | Cifrado de sesión de NewAPI | Generada aleatoriamente | 32 caracteres |
| `NEWAPI_CRYPTO_SECRET` | Cifrado de datos de NewAPI | Generada aleatoriamente | 32 caracteres |
| `ADMIN_PASSWORD` | Contraseña del administrador del Centro de administración de IA | Defínela tú; ≥ 8 caracteres | Cualquiera |
| `SESSION_SECRET` | Cifrado de sesión del Centro de administración de IA | Generada aleatoriamente | 64 caracteres |

Generar una cadena aleatoria (PowerShell):

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Ejemplo de rellenar la API Key

```
# DeepSeek ya viene configurado por defecto (descomenta y rellena la Key)
DEEPSEEK_API_KEY=sk-tu-clave-real-de-deepseek

# Si necesitas OpenAI / Claude, descomenta y descomenta también el bloque de modelo correspondiente en litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 Política de modificación de contraseñas

> ⚠️ `NEWAPI_DB_PASSWORD` afecta a una base de datos ya creada; si la cambias tendrás que eliminar y recrear el volumen correspondiente (se pierden los datos), así que conviene fijarla bien desde el principio.
 Las contraseñas de administración como `KEYCLOAK_ADMIN_PASSWORD` y `ADMIN_PASSWORD` pueden cambiarse en el panel de cada producto; tras cambiarlas, actualiza también `.env` (solo como recordatorio, no afecta a la ejecución).

## 3.5 Explicación de litellm-config.yaml

- `model_list` — define los modelos externos disponibles; NewAPI llama a través de LiteLLM. Por defecto solo está habilitado `deepseek-chat`;

- `general_settings.master_key` — clave de administrador de LiteLLM, lee `LITELLM_MASTER_KEY` de `.env`;

- El enmascaramiento de PII (Presidio) está actualmente **comentado temporalmente** (la API de guardrail de la nueva versión de LiteLLM cambió y es incompatible); para habilitarlo después, ver el capítulo 25;

- Usa la versión estable `v1.95.1` (`main-latest` tiene bugs conocidos).

---

[← Capítulo 2: Preparación previa](ch02-prereq.md) · [📖 Índice](index.md) · [Capítulo 4: Iniciar los servicios principales →](ch04-start.md)
