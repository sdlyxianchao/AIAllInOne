# Capítulo 7: NewAPI: inicialización, canales y OIDC

*Parte I · Implementación*

> Completar el asistente de instalación inicial, configurar el canal que apunta a LiteLLM, emitir API Keys e integrar Keycloak OIDC.

[← Capítulo 6: Keycloak: Realm, usuarios y AD](ch06-keycloak.md) · [📖 Índice](index.md) · [Capítulo 8: LiteLLM: verificación y caché →](ch08-litellm.md)

---

## 7.1 Asistente de instalación inicial (primera visita)

Al arrancar por primera vez, NewAPI muestra un asistente de configuración del sistema en 4 pasos:

1. **Comprobación de base de datos**: haz clic en «Verificar conexión de base de datos»; se espera una marca verde.

2. **Cuenta de administrador**: nombre de usuario `ai_all_in_one_admin`, correo `ai_all_in_one_admin@<dominio-empresa>`, contraseña = contraseña unificada de administrador.

> 📌 Por qué crear primero un administrador local: en este momento el OIDC aún no está configurado y NewAPI no conoce Keycloak; debe existir una cuenta local para «entrar» y completar la configuración antes de activar el OIDC en la configuración del sistema.

3. **Modo de uso**: elige «Uso personal» (uso interno de la empresa: los empleados pueden registrarse, el consumo se ve por separado y no hay módulo de recarga ni facturación).

4. **Confirmar inicialización**: crea las tablas de la base de datos → inicia sesión como administrador.

## 7.2 Configurar el canal de LLM (que apunta a LiteLLM)

1. **Canal** → añadir nuevo canal → tipo `OpenAI`;

2. En Base URL pon `http://litellm:4000` (nombre de contenedor, por la red de Docker, **no localhost**);

3. En clave pon el valor real de `LITELLM_MASTER_KEY` de `.env` (no el valor de ejemplo; de lo contrario da `No connected db`);

4. En modelo pon `deepseek-chat` (ejemplo; según tu configuración real);

5. Guarda → haz clic en «Probar» para verificar la conexión.

Si configuraste varios providers, repite el proceso: tipo Claude `Anthropic Claude`, tipo DeepSeek `OpenAI`; la Base URL siempre es `http://litellm:4000`.

## 7.3 Crear claves de API

Crea una para Dify y otra para DSH Desktop, para contabilizar el consumo por separado:

1. A la izquierda **API Keys** → nueva;

2. Nombre `dify-key` → guarda → copia `sk-xxx` (se rellena en el proveedor de modelos de Dify);

3. Crea otra `dsh-key` → copia `sk-xxx` (se distribuye a los usuarios de DSH Desktop).

## 7.4 Permitir que los usuarios normales soliciten Keys por su cuenta

Tras iniciar sesión, los empleados pueden crear sus propias Keys en la página «API Keys» por defecto. Para poder llamar realmente al modelo deben cumplirse dos condiciones (ya preconfiguradas en `.env`):

1. **Tener cuota**: `DEFAULT_QUOTA=100` (los nuevos usuarios reciben 100 dólares de cuota);

2. **Tener token**: `GENERATE_DEFAULT_TOKEN=true` (al registrarse se genera el token inicial).

> ⚠️ Solo se aplica a usuarios «recién registrados»: los que ya han iniciado sesión (como `aitest1`) no reciben el alta automática; el administrador debe fijar la cuota manualmente en la página «Usuarios».

## 7.5 Integrar Keycloak OIDC (para que los usuarios de AD inicien sesión directamente)

### ① Crear el OIDC Client de NewAPI en Keycloak

1. Realm enterprise-ai → **Clients** → Create client;

2. Client ID `newapi`, tipo OpenID Connect;

3. **Client authentication: On** (obligatorio; si no, no aparece la pestaña Credentials), Standard flow / Direct access grants: On;

4. Valid redirect URIs: `http://<IP-del-servidor>:3000/*` y `http://127.0.0.1:3000/*`;

5. Guarda → pestaña Credentials → copia el Client secret.

### ② Activar OIDC en NewAPI

Panel de NewAPI → **Configuración del sistema → Autenticación → OAuth personalizado → Añadir proveedor OAuth**, rellena:

| Grupo | Configuración | Valor |
| --- | --- | --- |
| Configuración rápida | Plantilla predefinida / Dirección API | `Keycloak` / `http://127.0.0.1:9090` |
| Información básica | Nombre del proveedor / Identificador | `Keycloak` / `keycloak` |
| Credenciales | Client ID / Secret | `newapi` / valor copiado de Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mapeo de campos | ID de usuario / nombre de usuario / correo | `sub` / `preferred_username` / `email` |

Tras hacer clic en «Descubrimiento automático» para rellenar los endpoints, **cambia el endpoint de token y el endpoint de información de usuario a `host.docker.internal:9090`** (el contenedor de NewAPI llama a Keycloak por dentro); el endpoint de autorización se mantiene en `<IP-del-servidor>:9090` (para el redireccionamiento del navegador). Ámbito: `openid profile email`.

> ⚠️ Dos cambios obligatorios; si no, falla el inicio de sesión:
> - **Tras guardar, vuelve a Keycloak a añadir la URL de callback**: añade `http://<IP-del-servidor>:3000/oauth/keycloak` y `http://127.0.0.1:3000/oauth/keycloak` a Valid redirect URIs;
> - **Pon la «dirección del servidor» de NewAPI como dirección de intranet**: Configuración del sistema → Configuración general → cambia la dirección del servidor a `http://<IP-del-servidor>:3000` (con localhost por defecto, el intercambio de token da `invalid_grant - Incorrect redirect_uri`). Tras cambiarlo, accede a NewAPI también con la IP de intranet desde esta máquina.

Método para modificar la base de datos:

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-del-servidor>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-del-servidor>:3000';"
docker compose restart new-api
```

> ⚠️ Resolución de problemas: el inicio de sesión devuelve **429 Too Many Requests** — se disparó el límite de tasa de las interfaces críticas de NewAPI (por defecto 20 veces / 20 minutos). Desbloqueo temporal: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; la solución permanente ya está preconfigurada en `.env` con cuatro grupos de variables como `CRITICAL_RATE_LIMIT_ENABLE=false`.

> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai · Repositorio de código abierto https://github.com/QuantumNous/new-api

---

[← Capítulo 6: Keycloak: Realm, usuarios y AD](ch06-keycloak.md) · [📖 Índice](index.md) · [Capítulo 8: LiteLLM: verificación y caché →](ch08-litellm.md)
