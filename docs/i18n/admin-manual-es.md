# AI AllInOne Manual del administrador

*v0.2 · Implementación · Administración · Operaciones*

**Parte I · Implementación**

## 1. Descripción general y arquitectura de la plataforma

### 1.1 Qué es esta plataforma
«AI AllInOne» es una **plataforma de IA para la intranet corporativa** que orquesta con Docker más de una docena de productos de código abierto en un todo unificado: autenticación unificada, enrutamiento de LLM, enmascaramiento de PII, aplicaciones de IA, portal corporativo, CI de código fuente, distribución de clientes, administración unificada, monitoreo y alertas, observabilidad, registro, copia de seguridad y restauración — todo funcionando, y con **una única cuenta de Keycloak para iniciar sesión (SSO) en todos los productos**.
| Capa | Componente | Función |
| --- | --- | --- |
| Autenticación unificada | Keycloak | SSO / OIDC; puede integrarse con AD/LDAP o cuentas locales |
| Enrutamiento de LLM | NewAPI | Canales, claves, cuotas, auditoría, costos |
| Enmascaramiento de PII | LiteLLM + Presidio | Enmascara automáticamente números de teléfono / DNI / correos antes de llamar al modelo |
| Aplicaciones de IA | Dify | Plataforma visual de aplicaciones de IA / Agentes / bases de conocimiento |
| Portal corporativo | Ghost | Anuncios, noticias, centro de descargas, Hub de empleados |
| Código fuente / CI | Gitea + Runner | Repositorio Git interno + automatización con Actions |
| Cliente | DeepChat | Cliente de escritorio local de IA (Win/macOS/Linux) |
| Distribución de clientes | Servidor de actualización | Alojamiento del instalador de DeepChat y actualización automática |
| Administración unificada | Centro de administración de IA | Punto de entrada único de administración: Dashboard + productos integrados + auditoría/costos/informes |
| Gateway | MCP Gateway | Gestión del mercado de Skills / MCP |
| Monitoreo y alertas | Prometheus + Grafana + Alertmanager | Monitoreo de recursos de contenedores + notificaciones de alerta |
| Observabilidad de LLM | Langfuse | Trace / latencia / tokens / costos de cada llamada al modelo |
| Registro unificado | Loki + Promtail | Agregación y búsqueda de registros de todos los contenedores |
| Copia de seguridad y restauración | Scripts backup / restore + página de administración | Copia de seguridad diaria de todos los datos + restauración con un clic |
### 1.2 Requisitos de software y hardware
| Elemento | Requisito mínimo | Configuración recomendada |
| --- | --- | --- |
| Sistema operativo | Windows 11 (Docker Desktop + backend WSL2) | Windows 11 Pro / Enterprise (con soporte adicional de Hyper-V para ejecutar el controlador de dominio AD) |
| CPU | 4 núcleos / 8 hilos | 8 núcleos / 16 hilos |
| Memoria | 16 GB | 32 GB |
| Disco | 60 GB de SSD disponible | 150 GB+ de SSD disponible |
| GPU | No se requiere tarjeta gráfica dedicada | No se requiere tarjeta gráfica dedicada |
> 📌 Según mediciones reales: unos 30 contenedores inactivos suman alrededor de 5 GB de memoria; los picos de procesamiento/indexado de Dify, la JVM de Keycloak y la caché de bases de datos añaden otros 3–5 GB, más la memoria virtual de WSL2. 16 GB es el mínimo y 32 GB el valor cómodo. Todos los modelos grandes pasan por API externa (deepseek-chat, etc.), no se hace inferencia local, por lo que **no se requiere GPU**.
### 1.3 Tabla de asignación de puertos
En adelante se usa `<IP-del-servidor>` para representar la dirección externa del host (en el entorno actual es `192.168.31.117`; al implementar, sustitúyela por tu propia IP de intranet o dominio).
| # | Producto | Uso | Acceso local | Acceso intranet (empleados) |
| --- | --- | --- | --- | --- |
| 1 | Centro de administración de IA | Portal unificado de administración | `127.0.0.1:10086` | `<IP-del-servidor>:10086` |
| 2 | Keycloak | Autenticación / SSO | `127.0.0.1:9090` | `<IP-del-servidor>:9090` |
| 3 | NewAPI | Gateway de enrutamiento de LLM | `127.0.0.1:3000` | `<IP-del-servidor>:3000` |
| 4 | LiteLLM | Proxy de enmascaramiento de PII | `<IP-del-servidor>:4001` | — (solo lo llama NewAPI) |
| 5 | Dify | Plataforma de aplicaciones de IA | `127.0.0.1` | `<IP-del-servidor>` (puerto 80) |
| 6 | Ghost | Portal corporativo | `127.0.0.1:8090` | `<IP-del-servidor>:8090` |
| 7 | Gitea | Código fuente + CI/CD | `127.0.0.1:3002` | `<IP-del-servidor>:3002` |
| 8 | Servidor de actualización | Instalador de DeepChat | `127.0.0.1:8091` | `<IP-del-servidor>:8091` |
| 9 | MCP Gateway | Gateway de Skill / MCP | `127.0.0.1:3100` | `<IP-del-servidor>:3100` |
| 10 | Grafana | Panel de monitoreo | `127.0.0.1:3030` | `<IP-del-servidor>:3030` |
| 11 | Prometheus | Recolección de métricas / alertas | `127.0.0.1:9091` | `<IP-del-servidor>:9091` |
| 12 | Langfuse | Observabilidad de LLM | `127.0.0.1:3010` | `<IP-del-servidor>:3010` |
| 13 | Loki | Agregación de registros (interno) | `127.0.0.1:3110` | — (se consulta desde la página de administración) |
| 14 | MailHog | Recepción local de correo | `127.0.0.1:8025` | `<IP-del-servidor>:8025` |
> ⚠️ Accede siempre por **IP de intranet**, no uses `localhost` (Docker Desktop WSL2 no soporta bien la IPv6 `::1`, lo que provoca fallos en el reenvío de puertos). Las bases de datos (MySQL/Redis/PostgreSQL) no se exponen a los usuarios; solo se comunican dentro de la red de Docker.
### 1.4 Flujo de datos principal
#### Flujo de peticiones LLM (la cadena más crítica)
1. **① Reenvío**: DeepChat / Dify envía la petición a NewAPI (`:3000/v1`);
2. **② Enmascarado**: NewAPI la reenvía a LiteLLM, que con expresiones regulares + Presidio sustituye números de teléfono / DNI / correos por `[xxx_REDACTED]`;
3. **③ Llamada al modelo externo**: la petición ya enmascarada se envía a DeepSeek / GPT / Claude;
4. **④ Restauración de PII**: al volver la respuesta, LiteLLM restaura la información sensible;
5. **⑤ Devolución**: el resultado final regresa al cliente.
#### Otros flujos
- **Flujo de autenticación**: SSO OIDC de Keycloak para iniciar sesión unificada en todos los productos web (realm compartido `ai_all_in_one_admin`);
- **Flujo de observabilidad**: `success_callback` de LiteLLM → Langfuse rastrea cada llamada;
- **Flujo de actualización automática**: Gitea Actions compila → servidor de actualización (:8091) → DeepChat comprueba `version.txt` y descarga e instala automáticamente;
- **Flujo de registro unificado**: Promtail recolecta los registros de cada contenedor → Loki los agrega → se consultan en la página «Registro unificado» del Centro de administración de IA.
### 1.5 Estructura y navegación de este libro
Este manual se divide en tres partes: **Implementación** (capítulos 1–13, poner la plataforma en marcha desde cero), **Administración** (capítulos 14–26, operaciones diarias de cada uno de los 13 productos) y **Operaciones** (capítulos 27–29, copia de seguridad / verificación de estado / resolución de problemas). La barra lateral permite saltar en cualquier momento, y al pie de cada página hay navegación de capítulo anterior/siguiente.
> ✅ Durante la implementación también puedes delegarla a una **herramienta de Agente de IA** (WorkBuddy / OpenClaw, etc.) para automatizarla: entrega este manual + `docker-compose.yml` + `.env.example` + `scripts/` al Agente y pídele que ejecute paso a paso la «Parte de implementación» (consulta el prompt de implementación del Agente al inicio del capítulo 2).

## 2. Preparación previa

### 2.0 Dos formas de implementar
Este manual puede ejecutarse **capítulo a capítulo de forma manual** o **delegarse a una herramienta de Agente de IA para su ejecución automática**. Al usar un Agente, proporciónale este directorio (incluido este manual, `docker-compose.yml`, `.env.example`, `scripts/`) y pega el siguiente prompt.
**Prompt de implementación para copiar al Agente:**
```
Eres el ingeniero de implementación de una plataforma de IA para la intranet corporativa. Según la parte de implementación del «Manual del administrador» de este directorio, docker-compose.yml y .env.example, implementa y verifica por completo la plataforma «AI AllInOne» en esta máquina. Comunícate siempre en español.

Paso 1 — Recopila los parámetros (pregúntame uno a uno, sin saltarte ninguno y sin adivinar):
1) la IP de intranet para los servicios externos; 2) el host del mercado de Skills (dominio; sustituye <host-del-mercado> en mcp-gateway/skills/skill-market/config.json y SKILL.md, y resuélvelo en hosts/DNS); 3) la fuente de identidad (si se conecta a un controlador de dominio AD, se necesitan dominio / IP del DC / base DN de LDAP / bind DN / contraseña de bind / sAMAccountName); 4) la contraseña unificada de la cuenta de administrador; 5) la API Key del modelo grande; 6) según sea necesario, pregunta por el webhook de alertas, HTTPS y la política de retención de copias de seguridad.

Paso 2 — Genera un archivo de progreso y actualízalo e informa cada vez que completes un elemento o resuelvas un problema.

Paso 3 — Ejecuta estrictamente en el orden de los capítulos 1~13 de este manual, prestando atención a los «⚠️ puntos críticos» de cada capítulo, y prioriza la automatización con los scripts de scripts/.

Paso 4 — Ante un error, revisa primero los registros (docker logs, endpoints de salud, configuración) para localizar la causa raíz antes de corregir; no reintentes a ciegas.

Paso 5 — Verificación de todo el flujo: todos los contenedores Up, SSO de Keycloak, enviar una conversación real a través de NewAPI/LiteLLM para verificar el enmascaramiento de PII, inicio de sesión con la fuente de identidad, monitoreo/registros/alertas, copia de seguridad y restauración; resume cada elemento con ✅/❌.
```
> 💡 Si no usas un Agente, el texto anterior también sirve como «lista de verificación de información antes de implementar»: define primero la IP de intranet, la fuente de identidad, la contraseña del administrador y la Key del modelo.
### 2.1 Instalar y configurar Docker Desktop
Tras instalar Docker Desktop, usa por defecto el backend WSL2 y normalmente no requiere configuración adicional. Si necesitas ajustar manualmente el límite de recursos, crea `.wslconfig` en el directorio de usuario:
```
# %UserProfile%\.wslconfig (por ejemplo C:\Users\tu-usuario\.wslconfig)
[wsl2]
memory=24GB       # Memoria máxima de Docker (mínimo 16GB, recomendado 24~32GB)
processors=8      # Número de núcleos de CPU (según los núcleos físicos)
swap=4GB
```
Tras guardar, ejecuta en PowerShell `wsl --shutdown` y reinicia Docker Desktop para que surta efecto.
> ✅ Verificación: la barra de estado de Docker Desktop muestra "Engine running" (verde).
### 2.2 Preparar la estructura de directorios
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Crear la red compartida de Docker
```
docker network create ai-platform
docker network ls | findstr ai-platform   # verificación
```
> Todos los contenedores principales se comunican entre sí por nombre de contenedor a través de la red `ai-platform` (por ejemplo, NewAPI accede a LiteLLM mediante `http://litellm:4000`, sin pasar por localhost).
### 2.4 Fijar la IP de intranet del host (importante)
Cuando el host usa WiFi, la IP la asigna dinámicamente el DHCP y cambia al reiniciar o al vencer la concesión; si cambia, las direcciones con las que los empleados acceden a cada producto dejan de funcionar. Se recomienda hacer una **reserva DHCP (vinculación de MAC)** en el router:
1. Consulta la MAC de la tarjeta WiFi: `ipconfig /all`, busca la dirección física de «Adaptador de LAN inalámbrica WLAN» (por ejemplo `60-A3-E3-41-8F-61`);
2. Entra al panel del router (por ejemplo `http://192.168.31.1`) → Configuración de LAN / Asignación de IP estática DHCP;
3. Añade la regla: MAC → IP (por ejemplo `192.168.31.117`) y guarda;
4. Reconecta el WiFi y confirma que la IP queda fija.
> ✅ La reserva DHCP es más estable que configurar una IP estática en Windows (gestión unificada por el router, sin conflictos).
### 2.5 Abrir la red (el paso donde más se atasca la gente)
- **Poder conectar con los registros de imágenes de Docker**: Docker Hub / quay.io / ghcr.io. Si no hay conexión, configura antes un acelerador de imágenes (como DaoCloud).
- **Poder conectar con GitHub**: clonar repositorios y descargar dependencias públicas. Si no hay conexión, usa un proxy o descarga previamente el paquete de código fuente.
- **Que la máquina destino sea accesible desde la intranet**: confirma que el segmento de red a exponer es alcanzable.

## 3. Archivos de configuración y variables de entorno

### 3.1 Los tres archivos de configuración principales
| Archivo | Uso | ¿Hay que modificarlo? |
| --- | --- | --- |
| `.env.windows` | Todas las contraseñas y API Keys externas | **Modificación obligatoria**: rellenar la API Key de DeepSeek; los demás providers según necesidad |
| `litellm-config.yaml` | Lista de modelos de LiteLLM + reglas de enmascaramiento de PII | Normalmente no se modifica (si solo usas DeepSeek, puedes eliminar las entradas de OpenAI/Claude) |
| `docker-compose.yml` | Orquestación de los servicios principales | Ya preconfigurado (incluye `KC_HOSTNAME` de Keycloak + volúmenes persistentes) |
### 3.2 Resumen de la clasificación de variables de entorno
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
### 3.3 🔴 Configuración inmediata (obligatoria antes del primer arranque)
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
#### Ejemplo de rellenar la API Key
```
# DeepSeek ya viene configurado por defecto (descomenta y rellena la Key)
DEEPSEEK_API_KEY=sk-tu-clave-real-de-deepseek

# Si necesitas OpenAI / Claude, descomenta y descomenta también el bloque de modelo correspondiente en litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 Política de modificación de contraseñas
> ⚠️ `NEWAPI_DB_PASSWORD` afecta a una base de datos ya creada; si la cambias tendrás que eliminar y recrear el volumen correspondiente (se pierden los datos), así que conviene fijarla bien desde el principio.  
> 
>     Las contraseñas de administración como `KEYCLOAK_ADMIN_PASSWORD` y `ADMIN_PASSWORD` pueden cambiarse en el panel de cada producto; tras cambiarlas, actualiza también `.env` (solo como recordatorio, no afecta a la ejecución).
### 3.5 Explicación de litellm-config.yaml
- `model_list` — define los modelos externos disponibles; NewAPI llama a través de LiteLLM. Por defecto solo está habilitado `deepseek-chat`;
- `general_settings.master_key` — clave de administrador de LiteLLM, lee `LITELLM_MASTER_KEY` de `.env`;
- El enmascaramiento de PII (Presidio) está actualmente **comentado temporalmente** (la API de guardrail de la nueva versión de LiteLLM cambió y es incompatible); para habilitarlo después, ver el capítulo 25;
- Usa la versión estable `v1.95.1` (`main-latest` tiene bugs conocidos).

## 4. Iniciar los servicios principales

### 4.1 Copiar .env
```
# PowerShell
copy .env.windows .env
```
Docker Compose lee `.env` por defecto.
### 4.2 Iniciar todos los servicios principales
```
docker compose -f docker-compose.yml up -d
```
La primera vez descargará todas las imágenes (unos 5–10 minutos, según la velocidad de red).
| Imagen | Contenedor | Tamaño |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 Comprobar el estado de los contenedores
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Se espera que los 10 contenedores principales estén todos `Up`. Si algún contenedor se mantiene en `Restarting`, ejecuta `docker logs nombre-del-contenedor` para ver la causa.
### 4.4 Corrección de un problema conocido: forzar SQLite en Ghost
Si `ghost` se reinicia continuamente y el registro muestra `Error: connect ECONNREFUSED <IP-del-servidor>:3306` — significa que en el volumen de datos quedó un `config.production.json` antiguo que apunta a MySQL. Corrección: declara SQLite explícitamente en el `environment` del servicio ghost del compose:
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ En Windows + Docker Desktop WSL2, los datos del volumen quedan sellados dentro del disco virtual de WSL2; el git bash del host no puede verlos, por lo que no se puede eliminar directamente el `config.production.json` del volumen; solo queda la vía de «sobrescribir mediante variables de entorno». Tampoco ejecutes `docker volume rm windows_ghost-data` (perderías los artículos ya publicados).
> ✅ Verificación: el registro muestra `Ghost database ready` + `Ghost booted`, y `curl.exe -I http://127.0.0.1:8090` devuelve 200.
### 4.5 Verificar la accesibilidad de cada servicio
```
# Keycloak — 302 significa OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redirige a la página de inicialización /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (directorio vacío, nginx en marcha)
curl.exe -I http://127.0.0.1:8091
# Centro de administración de IA — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM es una API pura sin interfaz web; verifícala desde dentro del contenedor:
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# Respuesta esperada: {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 El proxy HTTP de Docker Desktop WSL2 puede provocar que LiteLLM no sea accesible desde el host (HEART/respuesta vacía); es un bug conocido que no afecta a que NewAPI lo llame por nombre de contenedor.

## 5. Implementación independiente de Dify

> 📌 Dify usa el docker-compose oficial (con ~15 contenedores); se implementa de forma independiente para evitar conflictos de puertos y usa su propia red por defecto (distinta de la red `ai-platform` de los servicios principales).
### 5.1 Clonar Dify
```
# Opción A: GitHub (requiere acceso)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Opción B: espejo oficial de Gitee (recomendado en China)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 Corregir compatibilidad + copiar las variables de entorno
```
cd dify\docker

# Corregir el formato de env_file (compatibilidad con versiones antiguas de Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# Copiar las variables de entorno principales
copy .env.example .env

# Copiar todas las subplantillas (sandbox.env, etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Corregir el problema de validación upstream de Dify 1.16.1 (obligatorio)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# Verificación
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ Por qué hay que cambiar `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: Dify 1.16.1 elevó este campo de «permite 0» a «debe ser > 0», pero la plantilla de `shared.env` sigue en 0. Si no lo cambias, los 4 contenedores `docker-api-1` / `worker` / `worker_beat` / `api_websocket` se caen al arrancar con el registro `ValidationError: Input should be greater than 0`.
### 5.3 Iniciar Dify
```
docker compose up -d
docker compose ps
```
> ✅ Todos los contenedores `Up` (que `init_permissions` muestre Exited es normal). Abre `http://127.0.0.1/install` en el navegador para inicializar la cuenta de administrador.
### 5.4 Corregir la dirección WebSocket (si no, se conectará repetidamente a ws://localhost)
En `.env`, `NEXT_PUBLIC_SOCKET_URL` es por defecto `ws://localhost`; en una implementación de intranet, el localhost del navegador apunta al propio equipo del usuario, por lo que el frontend falla al conectarse repetidamente (la creación de aplicaciones y la depuración de flujos de trabajo se quedan bloqueadas).
```
# En .env cámbialo por la IP de intranet
NEXT_PUBLIC_SOCKET_URL=ws://<IP-del-servidor>

# En docker-compose.yaml cambia también el fallback del servicio web
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<IP-del-servidor>}

# Reconstruye el contenedor web para que surta efecto
docker compose up -d web
```
> 📌 Tras cambiarlo, fuerza la recarga del navegador (Ctrl+F5). Esta variable se lee en tiempo de ejecución; basta con cambiar .env + reiniciar web, sin necesidad de reconstruir la imagen.
### 5.5 Consulta rápida de escollos
> ⚠️ **La contraseña de inicio de sesión se transmite en base64**: en Dify 1.16.x, el `password` de la interfaz de inicio de sesión `POST /console/api/login` es la contraseña codificada en base64. En un script de inicio de sesión hay que hacer primero `base64(contraseña)`; si en el frontend «al hacer clic en iniciar sesión no pasa nada», el `GET /account/profile 401` de la consola es normal cuando no se ha iniciado sesión.
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<dominio-empresa> \
  --new-password '<nueva-contraseña>' \
  --password-confirm '<nueva-contraseña>'
```
> ⚠️ **Restablecer la contraseña de administrador olvidada**: el hash de contraseña de Dify es `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iteraciones) y no se puede invertir; restablécela con un comando del contenedor (la nueva contraseña debe tener ≥ 8 caracteres):
>     
>     📖 Documentación oficial:Documentación oficial de Dify https://docs.dify.ai · Implementación autoalojada https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak: Realm, usuarios y AD

> 📌 Acceso: host `http://127.0.0.1:9090`, intranet `http://<IP-del-servidor>:9090`. Los datos se guardan en el volumen con nombre `keycloak-data` y no se pierden al reconstruir el contenedor. Las credenciales están en `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` de `.env.windows`.
### 6.1 Crear el Realm
1. Abre `http://127.0.0.1:9090` en el navegador → Administration Console → iniciar sesión como administrador;
2. Menú desplegable de la esquina superior izquierda → **Create Realm** → en Realm name pon `enterprise-ai` → Create.
### 6.2 Opción A: crear cuentas localmente (equipos pequeños sin AD / pruebas)
1. **Groups** → Create Group → `ai-admin`; luego crea `ai-user`;
2. **Users** → Add user → nombre de usuario → Create;
3. Pestaña Credentials → establece la contraseña → desactiva Temporary;
4. Pestaña Groups → únelo al grupo `ai-user`.
### 6.3 Opción B: importar cuentas desde Active Directory (recomendado)
Si la empresa ya tiene un controlador de dominio Windows AD, los empleados inician sesión con su cuenta de dominio sin necesidad de crear cuentas manualmente en Keycloak. Requisito previo: que la red entre el contenedor Docker y el controlador de dominio esté interconectada (la topología de red, Hyper-V Internal Switch y el reenvío de puertos se explican en la «Guía de integración de Keycloak con AD» `windows-ad-integration.html`).
> 📌 Cuentas de AD necesarias: la cuenta de servicio `svc_keycloak` (contraseña sin caducidad, para el enlace LDAP) + 2 usuarios de dominio de prueba (para verificar la sincronización).
#### Crear la federación de usuarios LDAP
1. Realm enterprise-ai → a la izquierda **User Federation** → Add provider → **ldap**;
2. Rellena según la siguiente tabla.
| Configuración | Valor | Descripción |
| --- | --- | --- |
| Vendor | **Active Directory** | Elige AD, no Other (de lo contrario no se reconoce objectGUID) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V mediante reenvío de puertos; en producción pon `ldap://dc.dominio-empresa:389` |
| Enable StartTLS | **Off** | LDAP 389 o LDAPS 636 |
| Bind type | **simple** | Autenticación por usuario + contraseña |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Debe estar en formato LDAP DN**, no uses ~~DOMINIO\usuario~~ |
| Bind credentials | `contraseña de svc_keycloak` | Ver `.env.windows` |
| Edit mode | **READ_ONLY** | Solo lectura, no escribe en AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | Si hay sub-OU, cámbialo por `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **No pongas cn** |
| RDN LDAP attribute | `cn` | Atributo de nomenclatura de la entrada |
| UUID LDAP attribute | `objectGUID` | Identificador único inmutable de AD |
| User object classes | `person, organizationalPerson, user` | Separadas por comas |
| Search scope | **Subtree** | **No elijas One Level** (de lo contrario no encuentra las sub-OU) |
| Pagination | **On** | Descarga por lotes cuando hay muchos usuarios |
| Referral | **ignore** | Evita seguir a controladores de dominio inexistentes |
| Import users | **On** | Importación por sincronización completa |
| Sync Registrations | **On** | Sincronización inmediata en el primer inicio de sesión |
Save → **Synchronize all users** → espera a que termine la sincronización.
- ⚠️ Errores de rellenado frecuentes:
      
        El Bind DN usa **formato LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), no ~~DOMINIO\usuario~~;
- Username LDAP attribute = `sAMAccountName`, no `cn`;
- Search scope = **Subtree**;
- **El CN con espacios se conserva tal cual**: si el nombre mostrado lleva espacios (por ejemplo `ai all in one admin` tiene un espacio en medio), el Bind DN debe escribirse `CN=ai all in one admin,...`; si escribes guiones bajos no conectará.
#### Verificar el inicio de sesión con AD
1. Abre en una ventana de incógnito `http://127.0.0.1:9090/realms/enterprise-ai/account`;
2. Inicia sesión con una cuenta de dominio (sirve tanto el nombre de usuario `aitest1` como el UPN `aitest1@<dominio-empresa>`);
3. Si redirige correctamente a Account Console, ha pasado la prueba.
### 6.4 Otras fuentes de identidad corporativas (resumen del apéndice N)
Keycloak admite además múltiples fuentes de identidad, todas conectadas al mismo Realm `enterprise-ai`:
| Fuente de identidad | Forma de integración | Puntos clave |
| --- | --- | --- |
| Microsoft Entra ID (antes Azure AD) | Identity Providers → OpenID Connect v1.0 | Registra una aplicación en Azure para obtener client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (integrado) | Puedes usar un Mapper con `hd=dominio` para restringir el dominio |
| GitHub | Identity Providers → GitHub (integrado) | Callback de la OAuth App `/broker/github/endpoint` |
| LDAP genérico (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor Other; Username attribute con `uid` |
| SAML 2.0 genérico (Okta/ADFS) | Identity Providers → SAML v2.0 | Pega la URL de metadatos del IdP para que se rellene automáticamente |
> ✅ Convivencia de varias fuentes de identidad: puedes añadir Identity Provider Redirector en Authentication → Browser flow para seleccionar automáticamente el IdP por el dominio del correo (`@empresa.com`→AD, `@empresa.onmicrosoft.com`→Entra ID).
> 📖 Documentación oficial:Documentación oficial de Keycloak https://www.keycloak.org/documentation · Guía de administración del servidor https://www.keycloak.org/server/ · Federación LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI: inicialización, canales y OIDC

### 7.1 Asistente de instalación inicial (primera visita)
Al arrancar por primera vez, NewAPI muestra un asistente de configuración del sistema en 4 pasos:
1. **Comprobación de base de datos**: haz clic en «Verificar conexión de base de datos»; se espera una marca verde.
> **Cuenta de administrador**: nombre de usuario `ai_all_in_one_admin`, correo `ai_all_in_one_admin@<dominio-empresa>`, contraseña = contraseña unificada de administrador.
>         📌 Por qué crear primero un administrador local: en este momento el OIDC aún no está configurado y NewAPI no conoce Keycloak; debe existir una cuenta local para «entrar» y completar la configuración antes de activar el OIDC en la configuración del sistema.
3. **Modo de uso**: elige «Uso personal» (uso interno de la empresa: los empleados pueden registrarse, el consumo se ve por separado y no hay módulo de recarga ni facturación).
4. **Confirmar inicialización**: crea las tablas de la base de datos → inicia sesión como administrador.
### 7.2 Configurar el canal de LLM (que apunta a LiteLLM)
1. **Canal** → añadir nuevo canal → tipo `OpenAI`;
2. En Base URL pon `http://litellm:4000` (nombre de contenedor, por la red de Docker, **no localhost**);
3. En clave pon el valor real de `LITELLM_MASTER_KEY` de `.env` (no el valor de ejemplo; de lo contrario da `No connected db`);
4. En modelo pon `deepseek-chat` (ejemplo; según tu configuración real);
5. Guarda → haz clic en «Probar» para verificar la conexión.
Si configuraste varios providers, repite el proceso: tipo Claude `Anthropic Claude`, tipo DeepSeek `OpenAI`; la Base URL siempre es `http://litellm:4000`.
### 7.3 Crear claves de API
Crea una para Dify y otra para DeepChat, para contabilizar el consumo por separado:
1. A la izquierda **API Keys** → nueva;
2. Nombre `dify-key` → guarda → copia `sk-xxx` (se rellena en el proveedor de modelos de Dify);
3. Crea otra `deepchat-key` → copia `sk-xxx` (se distribuye a los usuarios de DeepChat).
### 7.4 Permitir que los usuarios normales soliciten Keys por su cuenta
Tras iniciar sesión, los empleados pueden crear sus propias Keys en la página «API Keys» por defecto. Para poder llamar realmente al modelo deben cumplirse dos condiciones (ya preconfiguradas en `.env`):
1. **Tener cuota**: `DEFAULT_QUOTA=100` (los nuevos usuarios reciben 100 dólares de cuota);
2. **Tener token**: `GENERATE_DEFAULT_TOKEN=true` (al registrarse se genera el token inicial).
> ⚠️ Solo se aplica a usuarios «recién registrados»: los que ya han iniciado sesión (como `aitest1`) no reciben el alta automática; el administrador debe fijar la cuota manualmente en la página «Usuarios».
### 7.5 Integrar Keycloak OIDC (para que los usuarios de AD inicien sesión directamente)
#### ① Crear el OIDC Client de NewAPI en Keycloak
1. Realm enterprise-ai → **Clients** → Create client;
2. Client ID `newapi`, tipo OpenID Connect;
3. **Client authentication: On** (obligatorio; si no, no aparece la pestaña Credentials), Standard flow / Direct access grants: On;
4. Valid redirect URIs: `http://<IP-del-servidor>:3000/*` y `http://127.0.0.1:3000/*`;
5. Guarda → pestaña Credentials → copia el Client secret.
#### ② Activar OIDC en NewAPI
Panel de NewAPI → **Configuración del sistema → Autenticación → OAuth personalizado → Añadir proveedor OAuth**, rellena:
| Grupo | Configuración | Valor |
| --- | --- | --- |
| Configuración rápida | Plantilla predefinida / Dirección API | `Keycloak` / `http://127.0.0.1:9090` |
| Información básica | Nombre del proveedor / Identificador | `Keycloak` / `keycloak` |
| Credenciales | Client ID / Secret | `newapi` / valor copiado de Keycloak |
| Endpoints | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mapeo de campos | ID de usuario / nombre de usuario / correo | `sub` / `preferred_username` / `email` |
Tras hacer clic en «Descubrimiento automático» para rellenar los endpoints, **cambia el endpoint de token y el endpoint de información de usuario a `host.docker.internal:9090`** (el contenedor de NewAPI llama a Keycloak por dentro); el endpoint de autorización se mantiene en `<IP-del-servidor>:9090` (para el redireccionamiento del navegador). Ámbito: `openid profile email`.
- ⚠️ Dos cambios obligatorios; si no, falla el inicio de sesión:
      
        **Tras guardar, vuelve a Keycloak a añadir la URL de callback**: añade `http://<IP-del-servidor>:3000/oauth/keycloak` y `http://127.0.0.1:3000/oauth/keycloak` a Valid redirect URIs;
- **Pon la «dirección del servidor» de NewAPI como dirección de intranet**: Configuración del sistema → Configuración general → cambia la dirección del servidor a `http://<IP-del-servidor>:3000` (con localhost por defecto, el intercambio de token da `invalid_grant - Incorrect redirect_uri`). Tras cambiarlo, accede a NewAPI también con la IP de intranet desde esta máquina.
Método para modificar la base de datos:
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-del-servidor>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-del-servidor>:3000';"
docker compose restart new-api
```
> ⚠️ Resolución de problemas: el inicio de sesión devuelve **429 Too Many Requests** — se disparó el límite de tasa de las interfaces críticas de NewAPI (por defecto 20 veces / 20 minutos). Desbloqueo temporal: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; la solución permanente ya está preconfigurada en `.env` con cuatro grupos de variables como `CRITICAL_RATE_LIMIT_ENABLE=false`.
> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai · Repositorio de código abierto https://github.com/QuantumNous/new-api

## 8. LiteLLM: verificación y caché

> ⚠️ El enmascaramiento de PII (guardrail de Presidio) está **desactivado temporalmente**: el formato de configuración del guardrail cambió en la nueva versión de LiteLLM, por lo que ese bloque de `litellm-config.yaml` está comentado y, por ahora, LiteLLM solo reenvía como proxy (sin enmascarar). El método de activación se describe en el capítulo 25.
### 8.1 Verificar que LiteLLM funciona básicamente
```
curl -X POST http://<IP-del-servidor>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` es la clave de administrador de LiteLLM; toma el valor real de `.env` (no el propio marcador, de lo contrario da 401). Y debe usarse la IP de intranet `<IP-del-servidor>:4001`, no `127.0.0.1:4001` (problema de reenvío de puertos de WSL2).
### 8.2 Caché de respuestas (ya integrada, ahorra tokens)
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
### 8.3 Añadir más proveedores de LLM
1. En `.env` descomenta `# OPENAI_API_KEY=` y rellena la Key;
2. En `litellm-config.yaml` descomenta el bloque del modelo correspondiente;
3. `docker compose up -d litellm`.
> 📖 Documentación oficial:Documentación oficial de LiteLLM https://docs.litellm.ai · Guardrail de Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Configuración de Dify / Ghost / Gitea

### 9.1 Dify: configurar el proveedor de modelos
1. Abre `http://<IP-del-servidor>` → en la primera vez configura el correo/contraseña del administrador (correo `ai_all_in_one_admin@<dominio-empresa>`);
  - **Configuración → Proveedor de modelos** → OpenAI-API-compatible → añadir modelo:
        
          Nombre del modelo `deepseek-chat` (según el real);
  - API Key: el `sk-xxx` de `dify-key`;
  - API endpoint: `http://host.docker.internal:3000/v1`.
3. Estudio → crear asistente de chat → elegir modelo → enviar un mensaje para verificar.
> ⚠️ Dify usa `host.docker.internal` y no el nombre de contenedor, porque Dify está en su propia red, distinta de la de NewAPI.
### 9.2 Ghost: configurar el portal
1. Entrada del panel: `http://<IP-del-servidor>:8090/ghost/` (**atención al sufijo /ghost/**). La primera vez se sigue el asistente de setup para crear el administrador (correo `ai_all_in_one_admin@<dominio-empresa>`, contraseña ≥ 10 caracteres);
2. Automatización: ejecuta directamente `scripts\ghost-setup.ps1` para crear el administrador de una vez mediante la API de setup, equivalente al asistente (si ya está inicializado se omite automáticamente);
3. **Tema**: Apariencia → Tema; activa directamente los incluidos Casper/Source;
4. **Menú de navegación**: Apariencia → Menú → crea la «Navegación principal».
| Elemento del menú | Tipo | URL |
| --- | --- | --- |
| Inicio | Página | `/` |
| Noticias | Categoría | `/category/news` |
| Centro de descargas | Página | `/downloads` |
| Banco de trabajo de IA | Enlace personalizado | `http://<IP-del-servidor>` |
| Documentación de ayuda | Categoría | `/category/docs` |
1. **Página del centro de descargas**: Página → crea «Centro de descargas» (slug `downloads`), con el enlace de intranet del instalador de DeepChat en el contenido.
```
## DeepChat Edición empresarial
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<IP-del-servidor>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<IP-del-servidor>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ No hagas clic en «Registrarse» en la portada del portal `/` — es el registro de suscriptores visitantes (sin SMTP configurado da 500); la entrada del administrador es `/ghost/`. No instales temas de última versión desde GitHub (pueden ser para Ghost 6.x y dar incompatible con 5.x).
### 9.3 Gitea: inicialización y registro del Runner
1. Abre `http://<IP-del-servidor>:3002` → asistente de instalación (la base de datos SQLite ya está preconfigurada) → crea el administrador (nombre de usuario `ai_all_in_one_admin`);
2. Avatar de la esquina superior derecha → **Site Administration → Actions** → confirma que Enabled Actions está activado;
3. **Runners → Create new Runner** → copia el Registration Token;
4. Rellena `GITEA_RUNNER_TOKEN` de `.env` con el Token y reconstruye el Runner:
```
# ⚠️ Debe usarse up -d, no restart (restart no relee el token de .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ Escollo 1: el error `readonly database` suele deberse a que `gitea.db` pertenece a root; elimina esa db de root para que se recree con el usuario git.  
> 
>     ⚠️ Escollo 2: `ROOT_URL` debe configurarse como `http://<IP-del-servidor>:3002/`; de lo contrario, los enlaces de repositorio generados son localhost y no funcionan para los empleados.
> 
>     📖 Documentación oficial:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (en chino) https://docs.gitea.com/zh-cn

## 10. Distribución de DeepChat y CI/CD

### 10.1 Cadena de distribución
Cadena de distribución = instalador de GitHub Releases → Gitea Actions del repositorio `deepchat-sync` → servidor de actualización (:8091) → página de descargas de Ghost → descarga por parte del empleado.
> 📌 Se eliminó el repositorio mirror del código fuente de `deepchat` — el mirror solo sincroniza el código fuente de git, no los instaladores de release, por lo que no sirve para la distribución. Si vas a hacer auditoría de código o desarrollo secundario, créalo aparte.
### 10.2 Descargar el instalador al servidor de actualización
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
Verificación: `curl -I http://<IP-del-servidor>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206. Después actualiza la página de descargas de Ghost (ver capítulo 9).
### 10.3 Sincronización automática (Gitea Actions, recomendado)
| Componente | Descripción |
| --- | --- |
| Repositorio `deepchat-sync` | Repositorio normal (no puede ser mirror); contiene `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Disparador | `schedule` (todos los días a las 2 UTC) + `workflow_dispatch` (manual) |
| Lógica | Consulta el último tag de GitHub → lo compara con `version.txt` → si hay versión nueva descarga + actualiza la página de descargas de Ghost + escribe la versión |
```
# Disparar una vez manualmente
curl -X POST "http://<IP-del-servidor>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<contraseña>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ Puntos críticos: ① el `container.network` del act_runner debe configurarse mediante `config.yaml` (+ la variable de entorno `CONFIG_FILE`); de lo contrario, el contenedor del job no resuelve el hostname `gitea`; ② el runner monta automáticamente docker.sock, no lo montes de nuevo en options (da Duplicate mount point).
### 10.4 Configuración de la fuente de descarga en China (sync-config.json)
Los instaladores de la página de descargas del sitio oficial `deepchatai.cn` siguen apuntando a GitHub y en China prácticamente no se descargan. La solución real está en `sync-config.json`:
| Campo | Función | Por defecto |
| --- | --- | --- |
| `version_source` | `github` (la API de GitHub es la más precisa) o `official` (caché del sitio oficial, accesible pero desactualizada) | `github` |
| `download_prefix` | Prefijo de aceleración de descarga, como `https://ghproxy.com/` | `""` |
| `keep_releases` | Número de versiones históricas que se conservan | `5` |
| `market_url` | Dirección de intranet del mercado del enlace «Instalar primero el administrador de habilidades» de la página de descargas | `http://<IP-del-servidor>:3100` |
```
# Con acceso a GitHub: dejar por defecto sin cambios
{ "version_source": "github", "download_prefix": "" }
# Proxy de aceleración de GitHub (el más usado)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 El workflow incluye la comparación de versiones `version_cmp.py`; solo descarga cuando «última versión > versión local» (evita que la caché desactualizada del sitio oficial haga retroceder al cliente a una versión antigua).
### 10.5 Opción B: compilar una versión personalizada con Docker (opcional)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# dentro del contenedor
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# el resultado está en dist/; al salir cópialo a deepchat-updates/
```
### 10.6 Configurar el cliente DeepChat (lado del empleado)
1. DeepChat → Configuración → Servicio de modelos → Provider personalizado / compatible con OpenAI;
2. API Base URL: `http://<IP-del-servidor>:3000/v1` (obligatorio con IP de intranet);
3. API Key: el `sk-xxx` de `deepchat-key`;
4. Modelo: `deepseek-chat`; guarda y prueba una conversación.
> 📖 Documentación oficial:Inicio rápido de DeepChat https://deepchatai.cn/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway y el mercado de Skills

> 📌 MCP Gateway se basa en el `@modelcontextprotocol/sdk` oficial, expone el endpoint estándar Streamable HTTP `/mcp`, ya está integrado en el `docker-compose.yml` principal (puerto 3100) y arranca junto a los servicios principales. El código fuente está en `mcp-gateway/`.
### 11.1 Herramientas integradas de la plataforma
| Herramienta | Uso |
| --- | --- |
| `platform_time` | Devuelve la hora actual del servidor |
| `platform_echo` | Hace eco del texto (prueba de conectividad) |
| `platform_services` | Lista el inventario de servicios de la plataforma |
### 11.2 Agregar servidores MCP externos
Edita `mcp-gateway/mcp-servers.json`, añade tipos stdio o http y reinicia `mcp-gateway` para que surta efecto:
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
Las herramientas agregadas reciben automáticamente el prefijo `{serverName}_` para evitar nombres duplicados.
### 11.3 Conexión de clientes
1. DeepChat: Configuración → MCP → añadir servidor → tipo «HTTP transmitible», URL `http://<IP-del-servidor>:3100/mcp`;
2. Flujo de trabajo de Dify: configura la herramienta personalizada / herramienta MCP apuntando a la misma dirección.
> Verificación: `curl http://<IP-del-servidor>:3100/health` devuelve `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` devuelve la lista de herramientas.
### 11.4 Mercado de Skills (distribución de paquetes de habilidades en la intranet)
| Endpoint | Función |
| --- | --- |
| `/market` | Página del mercado de Skills (navegación por tarjetas + descarga de ZIP + copiar dirección de instalación) |
| `/skills` | Inventario de habilidades en JSON (name/description/version) |
| `/skills/<nombre>.zip` | Descarga del paquete de habilidad (empaquetado dinámico) |
Las habilidades se colocan en el directorio `mcp-gateway/skills/` (subdirectorios que contienen SKILL.md) y **se escanean automáticamente en cada petición, sin necesidad de reiniciar**. Incluye la habilidad de arranque `skill-market`.
> 📌 En DeepChat, MCP y Skill son dos conceptos distintos: MCP es una «herramienta» (function calling) y Skill es un «paquete de habilidades de agente» (SKILL.md + scripts). La Skill de DeepChat no tiene una «URL de mercado personalizada»; solo admite tres formas de instalación: carpeta/ZIP/URL; la distribución en la intranet se logra de forma indirecta con la «instalación por URL».
### 11.5 ⚠️ Host del mercado de Skills (parámetro de implementación, debe sustituirse)
El «administrador de habilidades» lee el `market_url` de `config.json` para pedir el inventario `/skills`. Dos puntos clave:
- **Usar hostname, no IP**: el entorno de agente de DeepChat enmascara la IP como `[IP_ADDRESS_REDACTED]`, por lo que no se lee la dirección real;
- **El hostname es un parámetro de implementación**: cada despliegue es distinto; no se puede copiar tal cual.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<host-del-mercado>:3100" }
```
##### Automático (implementar con Agente)
Al recopilar parámetros, el Agente pregunta por el «host del mercado de Skills» y sustituye automáticamente `<host-del-mercado>` en `config.json` y `SKILL.md`.
##### Manual
1. Edita `config.json` + la dirección de respaldo de `SKILL.md` y sustituye `<host-del-mercado>`;
2. Haz que el hostname sea resoluble: en una sola máquina, añade `<IP-del-servidor>  <hostname>` en `C:\Windows\System32\drivers\etc\hosts`; en la intranet corporativa, añade un registro A en el DNS.
> ✅ Se recomienda usar un FQDN de «nombre de servicio + dominio de empresa» como hostname, por ejemplo `skillmarket.tu-dominio-empresa`. Para añadir el registro A en el DNS: controlador de dominio → «DNS → Zona de búsqueda directa → tu dominio → nuevo host (A)», o usa `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "tu-dominio" -IPv4Address "<IP-del-servidor>"`.
### 11.6 API de administración (para que el Centro de administración de IA haga altas, bajas y modificaciones)
| Endpoint | Función |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | Alta, baja, modificación y consulta de MCP Servers (escribe la configuración + reconexión automática) |
| `POST /api/skills/upload` | Subir un zip de habilidad (valida SKILL.md, evita path traversal) |
| `DELETE /api/skills/:name` | Eliminar una habilidad |
Requiere la cabecera `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`). El Centro de administración de IA lo llama por proxy desde la página «MCP Gateway» (protegida por el rol `ai-platform-admin`).
> 📖 Documentación oficial:Sitio oficial del protocolo MCP https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. Centro de administración de IA

> 📌 Posicionamiento: no es una plataforma de administración de Docker (1Panel/Portainer), sino un panel unificado orientado al administrador — autenticación con Keycloak + menú lateral con enlaces a todos los productos + estado del clúster en el Dashboard + cuenta unificada de administrador.
### 12.1 Capacidades principales
| Elemento del menú | Comportamiento | Descripción |
| --- | --- | --- |
| 📊 Panel general | Página integrada | 8 indicadores de negocio de productos + servicios Docker (agrupados por producto) + información del sistema |
| Ghost / Dify / Gitea / Keycloak | Página de estadísticas integrada | Primero ves estadísticas; solo al hacer clic en «Abrir panel» salta |
| 🔀 Administración de NewAPI | Página integrada | Canales/usuarios/claves + informe de costos + registro de auditoría |
| 🔌 MCP Gateway | Página de administración integrada | Altas y bajas de MCP Server, subir/eliminar Skills |
| 📈 Monitoreo / 🔍 Observabilidad | Nueva pestaña | Grafana :3030 / Langfuse :3010 |
| 📜 Registro unificado | Página integrada | Consultar Loki por contenedor + palabra clave + tiempo |
| 💾 Copia de seguridad y restauración | Página integrada | Lista de copias + copia inmediata + restauración con un clic |
| 🩺 Prueba de disponibilidad | Página integrada | Prueba de toda la cadena programada + manual |
| 📄 Generación de informes | Página integrada | Exportar .md con período personalizado |
| ⚙️ Configuración del sistema | Página integrada | 9 idiomas de interfaz + URL de entrada de productos |
### 12.2 Inicializar el Global Administrator
```
# Configuración en .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=ver la lista de cuentas y contraseñas
ADMIN_EMAIL=ai_all_in_one_admin@<dominio-empresa>
```
Tras arrancar, crea automáticamente el usuario `ai_all_in_one_admin` en Keycloak (si ya existe lo omite) y le asigna el Realm Role `ai-platform-admin`. Idea central: **una sola cuenta de Global Admin administra toda la plataforma**.
### 12.3 Implementación con Docker Compose
```
# Requisito previo: instalar dependencias primero (una vez)
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<IP-del-servidor>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<dominio-empresa>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<IP-del-servidor>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Configuración del cliente en Keycloak
1. Keycloak → enterprise-ai → Clients → Create;
2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow en On;
3. Valid Redirect URIs: `http://127.0.0.1:10086/*` y `http://<IP-del-servidor>:10086/*`;
4. Copia el Client Secret → rellena `KEYCLOAK_CLIENT_SECRET` de `.env` → `docker compose up -d admin-portal`;
5. Crea el Realm Role `ai-platform-admin` y asígnalo a `ai_all_in_one_admin`.
- ⚠️ Puntos clave de implementación / resolución de problemas:
      
        La sesión del admin-portal se guarda en memoria; reconstruir el contenedor con `up -d` **borra la sesión de inicio** (hay que volver a iniciar sesión);
- La portada `/` debe estar protegida por Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explícito); de lo contrario, sin iniciar sesión se renderiza un panel vacío;
- Para las estadísticas de Dify usa el correo real del administrador (`ai_all_in_one_admin@<dominio-empresa>`, igual al admin global de AD);
- **Tras modificar server.js debes ejecutar `docker restart admin-portal`**, no `up -d` (el cambio de contenido del archivo del volumen no dispara la reconstrucción).
### 12.5 Verificación
1. Abre `http://<IP-del-servidor>:10086` → salta automáticamente al inicio de sesión de Keycloak (sin iniciar sesión no muestra panel vacío);
2. Inicia sesión con `ai_all_in_one_admin` → entra al panel general;
3. El Dashboard muestra 8 indicadores de productos + grupos de contenedores;
4. Al hacer clic en cada producto ves primero las estadísticas y solo al hacer clic en «Abrir panel» salta;
5. En configuración del sistema puedes cambiar entre 9 idiomas.
### 12.6 Autorización de admin por módulo + gestión de la página Keycloak (v0.91)
El administrador global puede gestionar otros administradores y Keycloak desde el AI Admin Center:
- **Cuentas de administrador**: busca una cuenta existente en el IdP de Keycloak (usuarios AD/LDAP, sin cuenta nueva, sin contraseña) → elige módulos → confirma. El sistema asigna el Realm Role `admin:<producto>` y **aprovisiona realmente el producto** (SSO primero, API de respaldo): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revocar un módulo o eliminar un admin **elimina la cuenta del producto**. Los productos sin SSO generan una contraseña temporal, visible con el icono 🔑 (solo admin global). Los no-admins ven un diálogo «No eres administrador» y se cierran sesión.
- **Página Keycloak**: botones «Sincronizar todo / Sinc. cambios» para traer cambios AD en un clic; cada fila tiene «Editar» (a la consola Keycloak) y «Eliminar»; la sección de roles permite crear/eliminar roles y ver miembros. Acciones de sync/eliminación/roles solo para admin global.
> ⚠️ Nota: Keycloak no tiene endpoint de «sincronizar usuario único» — la sincronización incremental trae todas las cuentas AD modificadas. Los usuarios federados AD reaparecen tras la próxima sincronización completa o su próximo inicio SSO; para eliminarlos permanentemente, desactiva/elimina la cuenta en AD.

## 13. Lista de verificación de interconexión

Aquí termina la parte de implementación. Verifica por último los siguientes 12 puntos uno a uno; solo cuando todos estén ✅ se puede decir que la plataforma funciona de verdad.
| # | Interconexión | Forma de verificación |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | La prueba del canal de NewAPI recibe OK |
| 2 | Dify → NewAPI | La prueba del proveedor de modelos de Dify recibe respuesta |
| 3 | DeepChat → NewAPI | DeepChat envía un mensaje y recibe respuesta |
| 4 | Keycloak → NewAPI | La cuenta de Keycloak inicia sesión por OIDC en NewAPI |
| 5 | Keycloak → Dify | La cuenta de Keycloak inicia sesión por SSO en Dify |
| 6 | MCP Gateway → DeepChat | DeepChat obtiene la lista de herramientas MCP y las llama |
| 7 | MCP Gateway → Dify | El flujo de trabajo de Dify llama a herramientas MCP |
| 8 | Gitea Runner → Docker | El Runner puede ejecutar tareas CI/CD |
| 9 | Gitea → servidor de actualización | Los artefactos de CI pueden subirse al servidor de actualización |
| 10 | Ghost API → Gitea | Gitea Actions puede llamar a la API de Ghost para publicar anuncios |
| 11 | Ghost → salto a Dify | El «Banco de trabajo de IA» del portal salta correctamente a Dify |
| 12 | Centro de administración de IA | El Dashboard muestra todos los contenedores + el menú lateral accede a todos los productos |
> ✅ Una vez superado todo, sigue con la segunda parte «Administración» para aprender las operaciones diarias de cada producto, y con la tercera parte «Operaciones» para copias de seguridad, verificación de estado y resolución de problemas.

**Parte II · Administración (operaciones diarias de cada producto)**

## 14. Administración diaria de Keycloak

Keycloak**Entrada**: http://<IP-del-servidor>:9090 → Administration Console → iniciar sesión como administrador.
> 📌 Muchas de estas operaciones también pueden hacerse desde el AI Admin Center → página Keycloak (solo admin global): sincronización LDAP completa/incremental, eliminar usuarios y gestión de roles (listar/crear/eliminar/ver miembros). Ver capítulo 12.6.
### 14.1 Gestionar usuarios
1. **Nuevo usuario**: Users → Add user → rellena el nombre de usuario → Create;
2. **Establecer contraseña**: pestaña Credentials de ese usuario → establece la contraseña → desactiva Temporary (de lo contrario obliga a cambiarla en el primer inicio);
3. **Restablecer contraseña**: Users → busca el usuario → Credentials → Set password;
4. **Desactivar/activar**: interruptor Enabled en la parte superior del detalle del usuario (al desactivarlo, todos los SSO de ese usuario dejan de funcionar de inmediato);
5. **Eliminar**: detalle del usuario → Delete.
### 14.2 Roles y permisos
- **Realm Role**: Realm roles → Create role para crear un rol (como `ai-platform-admin`);
- **Asignar rol**: usuario → Role mapping → Assign role;
- **Grupos**: Groups → crea un grupo (`ai-admin` / `ai-user`) → añade usuarios al grupo; asigna el rol al grupo y los usuarios heredan los permisos del grupo.
> ✅ Los permisos de administración se controlan unificados por el rol `ai-platform-admin`; al conectar cada producto con SSO se usa este rol para identificar a los administradores.
### 14.3 Clientes OIDC (conectar un producto nuevo con SSO)
1. Clients → Create client → en Client ID pon el nombre del producto (como `newapi` / `grafana` / `langfuse`);
2. Client authentication: On (si no, no aparece la pestaña Credentials), Standard flow: On;
3. En Valid redirect URIs / Web origins pon la dirección de callback del producto (añade tanto la IP de intranet como 127.0.0.1);
4. Guarda → copia el Client secret en la pestaña Credentials y pásalo al lado del producto.
### 14.4 Mantenimiento de la federación AD / LDAP
- **Cambiar controlador de dominio/contraseña**: User Federation → haz clic en el LDAP Provider → cambia Connection URL / Bind credentials → Save;
- **Sincronización manual**: Synchronize all users;
- **Mapeo de grupos**: pestaña Mappers → group-ldap-mapper → en Groups DN pon el contenedor de los grupos de AD para mapear los grupos de AD a roles de Keycloak.
### 14.5 Gestión de sesiones
- **Ver sesiones activas**: Users → un usuario → Sessions;
- **Forzar cierre de sesión**: Sessions → Sign out all;
- **Configuración global de sesiones/tokens**: Realm settings → pestañas Sessions / Tokens para ajustar los tiempos de expiración.
> ⚠️ Repaso de puntos críticos: ① el CN del bind DN con espacios se conserva tal cual; ② Username LDAP attribute usa `sAMAccountName`, no `cn`; ③ Search scope en Subtree; ④ el SSO con `unknown_error` suele deberse a que el servicio iphlpsvc del host no está en marcha y falla el reenvío de puertos de AD; ⑤ si la VM del controlador de dominio AD está apagada, el inicio de sesión de las cuentas federadas LDAP da `LDAP Connection refused`.
> 📖 Documentación oficial:Documentación oficial de Keycloak https://www.keycloak.org/documentation · Guía de administración del servidor https://www.keycloak.org/server/

## 15. Administración diaria de NewAPI

NewAPI**Entrada**: http://<IP-del-servidor>:3000.
### 15.1 Gestión de canales (modelos upstream)
1. **Nuevo canal**: Canal → añadir nuevo canal → tipo OpenAI (o Claude, etc.) → Base URL `http://litellm:4000` → clave `LITELLM_MASTER_KEY` → rellena el nombre del modelo → guarda;
2. **Probar**: en la lista de canales haz clic en «Probar» y elige un modelo para verificar la conexión;
3. **Desactivar/activar**: interruptor de la lista de canales; al desactivarlo, el canal deja de recibir peticiones;
4. **Prioridad/peso**: con varios canales del mismo modelo se reparte por prioridad/peso.
### 15.2 Gestión de tokens (API Keys)
1. **Nuevo**: API Keys → nuevo token → ponle nombre (como `deepchat-key`) → puedes fijar cuota/fecha de expiración/restricción de modelos → guarda;
2. **Copiar Key**: empieza por `sk-`, **solo se muestra una vez, guárdala de inmediato**;
3. **Desactivar/eliminar**: operaciones de la lista de tokens (al desactivar, esa Key deja de funcionar de inmediato);
4. **Consultar consumo**: en el detalle del token se ve la cuota ya consumida.
### 15.3 Cuotas y usuarios
- **Cuota por defecto de nuevos usuarios**: `DEFAULT_QUOTA` (recomendado 100 dólares);
- **Subir la cuota a un usuario**: página Usuarios → edita ese usuario → establece la cuota;
- **Recargar/bloquear**: operaciones de la página Usuarios;
- **Gestión por grupos**: crea grupos por departamento, fija multiplicador/cuota de modelos y, al asignar el usuario al grupo, se controla por departamento.
### 15.4 Registros y costos
- **Página de registros**: consulta usuario/modelo/token/cuota/costo/IP de origen de cada llamada;
- **Informe de costos**: la página «Administración de NewAPI» del Centro de administración de IA tiene un informe de costos agregado por usuario/modelo/fecha + los últimos 100 registros de auditoría.
> 📌 El registro de la IP del cliente depende de la opción «Registrar IP del usuario» (`record_ip_log`, desactivada por defecto); actívala para el usuario correspondiente cuando necesites auditoría de IP.
### 15.5 Puntos clave de la configuración del sistema
- **Dirección del servidor**: debe ser la de intranet `http://<IP-del-servidor>:3000` (de lo contrario el OIDC da `invalid_grant - Incorrect redirect_uri`);
- **Autenticación → OAuth personalizado**: integración de Keycloak OIDC (ver capítulo 7);
- **Modo de uso**: se puede alternar entre uso personal ↔ operación externa.
> ⚠️ Repaso de puntos críticos: ① la Base URL del canal se rellena siempre con el nombre de contenedor `http://litellm:4000`; ② el límite de tasa 429 se controla con variables como `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ para modificar la base de datos usa directamente la variable de entorno `MYSQL_PWD`, para evitar que el aviso de contraseña por stderr se malinterprete como error.
> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai · Repositorio de código abierto https://github.com/QuantumNous/new-api

## 16. Administración diaria de LiteLLM

**Entrada**: http://<IP-del-servidor>:4001 (API pura, sin interfaz web; para depurar usa `/v1/models`). La configuración está en `litellm-config.yaml`.
### 16.1 Mantenimiento de la lista de modelos
Edita el `model_list` de `litellm-config.yaml` para añadir o quitar modelos y sus API Keys. Pasos para añadir un provider nuevo:
1. En `.env` descomenta `# OPENAI_API_KEY=` y rellena la Key;
2. En `litellm-config.yaml` descomenta el bloque del modelo correspondiente;
3. `docker compose up -d litellm`.
### 16.2 Caché de respuestas
Caché de coincidencia exacta de Redis; las peticiones idénticas se comparten entre usuarios. Ajusta `cache_params.ttl` (por defecto 3600 segundos). Para desactivarla: `cache: false` y reinicia.
### 16.3 Informes a Langfuse
Mediante `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` de `.env` se informa automáticamente de cada llamada.
### 16.4 Reinicio y resolución de problemas
```
docker compose restart litellm          # reiniciar tras cambiar la configuración
docker logs litellm --tail 50           # ver registros
```
> ⚠️ Puntos críticos: ① los guardrails necesitan `default_on: true` para aplicarse globalmente; ② el enmascaramiento de PII (Presidio) está comentado temporalmente por cambios en la API upstream y solo hace de proxy puro; ③ usa la versión estable `v1.95.1` (`main-latest` tiene bugs).
> 📖 Documentación oficial:Documentación oficial de LiteLLM https://docs.litellm.ai · Guardrail de Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Administración diaria de Dify

Dify**Entrada**: http://<IP-del-servidor> (puerto 80, compose oficial independiente; la actualización y el mantenimiento se hacen por separado en `dify/docker/`).
### 17.1 Gestión de aplicaciones (Estudio)
1. **Crear aplicación**: Estudio → crear aplicación en blanco → elige el tipo (asistente de chat / Agente / flujo de trabajo / generación de texto);
2. **Orquestar**: arrastra y suelta nodos para orquestar prompts, herramientas, bases de conocimiento y variables;
3. **Depurar**: «Vista previa» en la esquina superior derecha para ejecutar la depuración;
4. **Publicar**: tras pasar la depuración, «Publicar» → genera un enlace compartido o incrusta la aplicación web.
### 17.2 Gestión de bases de conocimiento
1. Base de conocimiento → crear base de conocimiento;
2. Sube documentos (Word / PDF / Markdown / enlaces web), elige la regla de segmentación + el modo de indexado (alta calidad/económico);
3. «Añade» esa base de conocimiento en la aplicación y la IA podrá responder basándose en los documentos.
> 📌 El contenido de la base de conocimiento se usa para que la IA responda; no subas material confidencial (respeta la normativa de clasificación de datos).
### 17.3 Proveedores de modelos
- **Añadir modelo**: Configuración → Proveedor de modelos → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (pasa por NewAPI) + `dify-key`;
- **Configuración de modelos del sistema**: especifica el modelo por defecto de chat/razonamiento/embeddings.
### 17.4 Miembros y permisos
- **Miembros**: invita miembros al espacio de trabajo y asigna roles Owner/Admin/Editor/Normal;
- **Método de inicio de sesión**: Configuración → Método de inicio de sesión → se puede conectar OIDC (Keycloak) para SSO.
### 17.5 Actualización y mantenimiento
```
cd dify\docker
git pull                          # traer la última versión
docker compose pull               # traer imágenes nuevas
docker compose up -d              # reconstruir
```
> ⚠️ Puntos críticos: ① el WebSocket `NEXT_PUBLIC_SOCKET_URL` debe apuntar a la IP de intranet; ② la contraseña de inicio de sesión se codifica en base64; ③ si olvidas la contraseña usa `docker exec docker-api-1 flask reset-password` (≥ 8 caracteres).
> 📖 Documentación oficial:Documentación oficial de Dify https://docs.dify.ai · Autoalojada https://docs.dify.ai/getting-started/install-self-hosted

## 18. Administración diaria de Ghost

Ghost**Entrada**: frontend http://<IP-del-servidor>:8090; panel http://<IP-del-servidor>:8090/ghost/ (atención al sufijo /ghost/).
### 18.1 Iniciar sesión en el panel
El panel de Ghost 5 usa **inicio de sesión sin contraseña**: introduce el correo → Ghost envía un código de 6 dígitos a MailHog (`:8025`). Forma más rápida: haz clic en el botón «Abrir» de «Panel de Ghost» en el Centro de administración de IA, que completa el inicio de sesión automáticamente (calcula el código TOTP localmente, sin revisar el correo).
### 18.2 Publicar contenido
1. **Artículos**: Posts → New post → escribe el contenido (editor Markdown) → Publish;
2. **Páginas**: Pages → New page (como «Centro de descargas», slug `downloads`);
3. **Etiquetas/categorías**: Tags → crea categorías (como `news` / `docs`) y asigna los artículos a una categoría.
### 18.3 Menú de navegación
1. Panel → Apariencia (Design) → Menú (Navigation);
2. Edita la navegación principal «Primary» y añade Inicio/Noticias/Centro de descargas/Banco de trabajo de IA/Documentación de ayuda (ver la tabla de menús del capítulo 9).
### 18.4 Temas
- **Cambiar**: Apariencia → Tema; activa directamente los incluidos Casper / Source;
- **Instalar**: mercado de temas (Design → Change theme) o sube un zip.
> ⚠️ No instales temas de última versión desde GitHub (pueden ser para Ghost 6.x y dar incompatible con 5.x); instala el zip de una versión antigua.
### 18.5 Miembros y suscripciones (si se necesitan)
- Members: gestiona suscriptores;
- Si no se necesita la suscripción, puedes ignorar este módulo (en un portal de intranet normalmente no se usa).
### 18.6 Integraciones (API Token)
1. Panel → Settings → Integrations → añadir una integración personalizada;
2. Genera una Admin API Key (formato `id:secret`) para automatizaciones como publicar anuncios con Gitea Actions.
> ⚠️ Puntos críticos: ① no hagas clic en «Registrarse» en la portada `/` (es el registro de suscriptores visitantes); ② el código de 6 dígitos es en esencia TOTP y el Centro de administración de IA puede calcularlo localmente; ③ aunque el código se calcule localmente, Ghost igualmente envía el correo, así que MailHog debe mantenerse (de lo contrario da `Failed to send email`).
> 📖 Documentación oficial:Documentación oficial de Ghost https://ghost.org/docs/ · Panel de administración https://ghost.org/docs/admin/

## 19. Administración diaria de Gitea

Gitea**Entrada**: Web http://<IP-del-servidor>:3002; SSH `ssh://git@<IP-del-servidor>:2222`.
### 19.1 Repositorios y organizaciones
1. **Crear repositorio**: + en la esquina superior derecha → New repository;
2. **Crear organización**: + → New organization; dentro de la organización crea repositorios y gestiona equipos;
3. **Migrar un repositorio externo**: + → New migration; rellena la dirección de GitHub para hacer mirror (sincroniza el código fuente en solo lectura).
### 19.2 Usuarios y permisos
- **Añadir usuario**: Site Administration → User Accounts → Create user;
- **Permisos de repositorio**: repositorio → Settings → Collaborators;
- **Equipos de organización**: organización → Teams → crea un equipo → añade miembros → asigna permisos de repositorio.
### 19.3 Gestión de Actions / Runner
1. **Activar Actions**: Site Administration → Actions → Enabled;
2. **Registrar Runner**: Runners → Create new Runner → copia el Token → rellena `GITEA_RUNNER_TOKEN` de `.env` → `docker compose up -d gitea-runner`;
3. **Ver el estado del Runner**: la página Runners muestra Idle (verde), que es lo normal;
4. **Ejecutar un workflow**: repositorio → Actions → ejecución manual o disparada por push.
> ⚠️ Para cambiar el token del Runner debe usarse `up -d` (restart no relee .env).
### 19.4 Configuración del sitio
- **ROOT_URL**: `GITEA__server__ROOT_URL` debe ser la de intranet `http://<IP-del-servidor>:3002/`; de lo contrario, los enlaces de repositorio generados son localhost;
- **Política de registro**: Site Administration → Config para ajustar el interruptor de registro y la configuración del correo.
> ⚠️ Punto crítico: el error `readonly database` suele deberse a que `gitea.db` pertenece a root; elimina esa db de root para que se recree con el usuario git.
> 📖 Documentación oficial:Documentación oficial de Gitea (en chino) https://docs.gitea.com/zh-cn · Administración https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. Administración diaria de MCP Gateway

**Entrada**: http://<IP-del-servidor>:3100 (página del mercado `/market`). La administración se hace desde la página «MCP Gateway» del Centro de administración de IA (rol `ai-platform-admin`), o directamente llamando a la API de administración.
### 20.1 Gestionar MCP Server
1. Edita `mcp-gateway/mcp-servers.json` para añadir o quitar servidores (tipos stdio/http);
2. Reinicia con `docker compose restart mcp-gateway`;
3. O hazlo desde la página MCP Gateway del Centro de administración de IA (escribe la configuración + reconexión automática).
### 20.2 Gestionar Skills (paquetes de habilidades)
1. **Subir**: página MCP Gateway del Centro de administración de IA → subir zip de habilidad (valida que contenga SKILL.md, evita path traversal);
2. **Eliminar**: elimina la habilidad correspondiente;
3. Las habilidades se colocan en `mcp-gateway/skills/` (subdirectorios con SKILL.md); se escanean automáticamente en cada petición, sin reiniciar.
### 20.3 Ampliar las herramientas integradas
En `mcp-gateway/gateway.js` añade dos pasos:
```
// ① Definición de herramienta (añade una entrada al array builtinTools)
{ name: 'platform_health', description: 'Consultar el estado de salud del servicio',
  inputSchema: { type: 'object', properties: {} } }

// ② Lógica de ejecución (añade una rama en callBuiltin)
if (name === 'platform_health') { return 'Todos los servicios funcionan correctamente'; }
```
Tras el cambio, `docker compose restart mcp-gateway`.
### 20.4 Mantener la dirección del mercado skill-market
El `market_url` del «administrador de habilidades» está en `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; debe usar hostname (no IP) y es un parámetro de implementación (ver capítulo 11).
> ⚠️ La API de administración requiere la cabecera `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`); sin configurar devuelve 503 y con token incorrecto devuelve 401.
> 📖 Documentación oficial:Sitio oficial del protocolo MCP https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. Administración del servidor de actualización

**Entrada**: http://<IP-del-servidor>:8091; los datos están en `deepchat-updates/`.
### 21.1 Colocar una versión nueva manualmente
1. Descarga el instalador oficial de DeepChat a `deepchat-updates/deepchat/`;
2. Actualiza `version.txt` (escribe el nuevo número de versión);
3. En el lado del empleado, DeepChat comprueba `version.txt` en la actualización automática y descarga e instala al detectar la versión nueva.
### 21.2 Sincronización automática (recomendado)
Se apoya en las Gitea Actions del repositorio `deepchat-sync`, que cada día comprueba automáticamente las versiones nuevas en GitHub y las sincroniza (ver capítulo 10). Disparo manual:
```
curl -X POST "http://<IP-del-servidor>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<contraseña>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 Configuración de la sincronización (sync-config.json)
| Campo | Función |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Prefijo de aceleración de descarga (como ghproxy.com) |
| `keep_releases` | Número de versiones históricas que se conservan |
| `market_url` | Dirección del mercado del «administrador de habilidades» de la página de descargas |
> 📌 Si el cliente de DeepChat informa de «tiempo de conexión del modelo agotado», normalmente es porque el cliente pasa por un proxy del sistema caído (`ECONNREFUSED 127.0.0.1:33210`). Pide al usuario que en «Configuración → Red/Proxy» de DeepChat elija «No usar proxy / conexión directa».
> 📖 Documentación oficial:Inicio rápido de DeepChat https://deepchatai.cn/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/ThinkInAIXYZ/deepchat

## 22. Administración de monitoreo y alertas

Grafana**Entrada**: Grafana http://<IP-del-servidor>:3030 (inicio de sesión automático por SSO); Prometheus :9091; Alertmanager :9093.
### 22.1 Componentes y puertos
| Componente | Puerto | Uso |
| --- | --- | --- |
| cadvisor | 8080 (interno) | Recolecta CPU/memoria/red/disco de cada contenedor |
| Prometheus | 9091 | Agrega métricas + reglas de alerta (`monitoring/alerts.yml`) |
| Grafana | 3030 | Panel de visualización (precargado «AI All In One — Monitoreo de contenedores») |
| Alertmanager | 9093 | Deduplicación/agrupación/enrutamiento/notificación de alertas |
### 22.2 Ver el panel
1. Inicia sesión en Grafana (`ai_all_in_one_admin` / contraseña unificada, SSO automático);
2. Abre el panel «AI All In One — Monitoreo de contenedores» para ver la CPU/memoria/red de cada contenedor.
### 22.3 Reglas de alerta
Reglas preconfiguradas (`monitoring/alerts.yml`): contenedor caído (critical), memoria del contenedor > 90% (warning), CPU del contenedor > 80% (warning).
> ⚠️ Escollo de falsas alertas: cadvisor informa de todos los cgroup del host (incluido systemd); las reglas de alerta deben filtrar con `{name!=""}`, y la alerta de memoria debe añadir además `container_spec_memory_limit_bytes > 0` (de lo contrario, con limit=0 se divide por cero y se dispara siempre).
### 22.4 Conectar canales de notificación de alertas (IM empresarial)
La ruta de alertas es **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM empresarial**. Configúralo en el menú **« Operaciones → Alertas IM empresariales »** (la configuración se guarda en Redis y sobrevive al reinicio):
- **Destinatarios**: añade varios. Tipo « DingTalk/WeCom/Feishu » = bot de grupo (URL de webhook, envía al grupo); tipo « DingTalk App (a una persona) » (AppKey/AppSecret/AgentId/userid) o « WeCom App (a una persona) » (corpId/secret/agentid/userid) = app empresarial, envía a personas.
- **Reglas de envío**: interruptor general, severidad mínima (crítica/advertencia/info), enviar o no notificaciones « firing » / « resolved ».
- **Historial de envío**: registra cada envío (hora/destinatario/tipo/nombre de alerta/severidad/resultado), con paginación, tamaño de página ajustable, búsqueda por palabra clave y filtrado por tipo/resultado/severidad.
- Cada destinatario tiene un botón « Probar » para enviar un mensaje de prueba y un interruptor de activación.
> ⚠️ Un webhook de bot de grupo solo puede enviar a un **grupo**, no a una persona. Para enviar a personas usa los tipos « app empresarial » (DingTalk/WeCom), que requieren una app interna creada en la consola de administración con permiso de mensajes. Los bots de grupo de DingTalk también necesitan « palabras clave personalizadas » (ej. « AI 平台 » / « 告警 ») o « firma », de lo contrario el mensaje se bloquea por la política de seguridad.
> 📌 Nota sobre conflictos de puertos: el 9090 por defecto de Prometheus lo ocupa Keycloak, por eso se cambió a 9091; el 3000/3001 por defecto de Grafana está ocupado, por eso se cambió a 3030.
> 📖 Documentación oficial:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. Observabilidad de LLM (Langfuse)

Langfuse**Entrada**: http://<IP-del-servidor>:3010 (inicio de sesión automático por SSO; la entrada del Centro de administración de IA apunta a `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 Componentes
| Componente | Uso |
| --- | --- |
| langfuse | Web UI + visualización de trazas (3010) |
| langfuse-worker | Procesamiento asíncrono de eventos |
| langfuse-postgres | Almacenamiento de metadatos |
| langfuse-clickhouse | Almacenamiento de eventos/trazas |
| langfuse-minio | Almacenamiento de adjuntos/medios S3 |
| langfuse-redis | Cola |
LiteLLM informa automáticamente mediante `success_callback: ["langfuse"]` (`LANGFUSE_*` de `.env`).
### 23.2 Ver trazas
1. Inicia sesión en Langfuse → elige la organización `AI All In One` / el proyecto `AI Platform`;
2. En la lista Traces ves cada llamada; haz clic para ver prompt/respuesta/modelo/latencia/tokens/costo;
3. Usa Session para relacionar conversaciones de varias rondas.
### 23.3 Resolución de problemas
- ⚠️ Puntos críticos:
      
        Debe configurarse `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (tanto en web como en worker); de lo contrario, el SDK antiguo falla al informar `trace-create` y no se ven los datos;
- Si con SSO no ves datos: la cuenta de SSO (correo de AD) es distinta de la cuenta de inicialización y Langfuse crea automáticamente una cuenta que no pertenece a ninguna organización. Corrección (añadir el usuario de SSO a la organización):
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<dominio-empresa>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 Documentación oficial:Documentación oficial de Langfuse https://langfuse.com/docs · Autoalojada https://langfuse.com/self-hosting

## 24. Registro unificado (Loki)

**Entrada**: página «📜 Registro unificado» del Centro de administración de IA (la más cómoda), o Loki http://<IP-del-servidor>:3110.
### 24.1 Componentes
| Componente | Puerto | Uso |
| --- | --- | --- |
| Loki | 3110 | Almacenamiento y consulta de registros (monomáquina, sistema de archivos local) |
| Promtail | — (interno) | Descubre contenedores mediante docker.sock, recolecta los registros json y los envía a Loki |
### 24.2 Consultar registros
1. Centro de administración de IA → Registro unificado;
2. Elige el contenedor (desplegable) → rellena la palabra clave → elige el rango de tiempo → consulta;
3. El backend `/api/logs/query` consulta Loki con LogQL.
### 24.3 Referencia rápida de LogQL
```
{container="new-api"} |= "error"              # líneas de un contenedor que contienen error
{container=~".+"} |~ "(?i)error|exception"      # coincide en todos los contenedores
{service="litellm"} |= "EMAIL"                  # consulta por servicio
```
> 📌 Las labels de Loki son `container / project / service`, **no hay `job`**. Consulta con `{container=~".+"}` y no con `{job="docker"}`.
> ⚠️ Punto crítico (montajes de Docker Desktop): Promtail debe montar `/var/run/docker.sock` y `/var/lib/docker/containers` (en WSL2 apuntan al interior de la VM de Docker Desktop, que es precisamente donde están los registros); no uses la ruta `C:\...\containers` del Windows host. Loki monomáquina usa `store: tsdb` + filesystem.
> 📖 Documentación oficial:Documentación oficial de Loki https://grafana.com/docs/loki/latest/

## 25. Enmascaramiento de PII (Presidio)

### 25.1 Enmascarado en dos capas
| Capa | Capacidad |
| --- | --- |
| Regex integrada de LiteLLM (`litellm_content_filter`) | Números de móvil, DNI, tarjetas bancarias, correos, código unificado de crédito social, pasaportes, IPv4, etc.; al coincidir se sustituyen por `[xxx_REDACTED]`; si coincide con la lista negra de palabras sensibles se rechaza con BLOCK |
| Microsoft Presidio | Entidades de granularidad más fina (nombres de personas en inglés, correos, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 Reglas de regex integradas
| Regla | Regex | Tipo |
| --- | --- | --- |
| Móvil de China | `\b1[3-9]\d{9}\b` | cn_mobile |
| Número de DNI | `\b\d{17}[\dXx]\b` | cn_id |
| Número de tarjeta bancaria | `\b\d{16,19}\b` | bank_card |
| Correo electrónico | prebuilt `email` | email |
| Código unificado de crédito social | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Número de pasaporte | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
La lista negra de palabras sensibles se ajusta en `blocked_words` de `litellm-config.yaml` según la empresa (`secreto interno`, `secreto comercial`, etc.).
### 25.3 Activar Presidio (actualmente comentado temporalmente)
Por el cambio de la API de guardrail de la nueva versión de LiteLLM, el bloque de Presidio está comentado actualmente. Puntos clave para activarlo:
- Los guardrails necesitan `default_on: true` para aplicarse globalmente;
- Las variables de entorno de endpoints `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` deben rellenarse con la base URL (LiteLLM añade automáticamente `/analyze` y `/anonymize`; con ruta incluida quedaría `/analyze/analyze` y daría 404).
> ⚠️ La imagen pesa unos 965MB y la descarga es muy lenta en China (medida en torno a 1 hora); si no se puede descargar, usa primero la regex integrada (ya cubre la PII central en chino).
### 25.4 Verificación
Envía una petición con un número de móvil/correo → en la respuesta del modelo el valor original se sustituye por `[REDACTED]`; envía una petición que contenga «secreto interno» → devuelve directamente `Content blocked`.
> 📖 Documentación oficial:Microsoft Presidio https://microsoft.github.io/presidio/ · Código fuente https://github.com/microsoft/presidio

## 26. Receptor de correo MailHog

**Entrada**: http://<IP-del-servidor>:8025 (buzón web; SMTP 1025 solo interno).
### 26.1 Por qué se necesita
El panel de Ghost 5 usa inicio de sesión sin contraseña: al introducir el correo, Ghost envía un correo con un código de 6 dígitos. Sin SMTP en la intranet el correo no sale y el inicio de sesión da `Failed to send email`. MailHog actúa como «salida de correo» para recibir esos correos.
### 26.2 Configuración del lado de Ghost
```
# Variables de entorno de Ghost en docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 Ver el correo
1. Abre `http://<IP-del-servidor>:8025` en el navegador;
2. En el buzón verás los códigos de verificación y los correos de notificación que envía Ghost.
### 26.4 Inicio de sesión sin contraseña de Ghost (inicio automático en el Centro de administración de IA)
El código de 6 dígitos de Ghost es en esencia un **TOTP** (`TOTP(admin_session_secret + userId)`, 6 dígitos / 60 segundos / HMAC-SHA1). El Centro de administración de IA puede calcular el código localmente; al hacer clic en «Panel de Ghost → Abrir» completa automáticamente: inicio con contraseña → cálculo local del código → verificación de sesión → escribe la cookie → entra al panel, todo sin fricción y sin revisar MailHog.
> ⚠️ Aunque calcules el código tú mismo, Ghost igualmente envía el correo, así que MailHog debe mantenerse; de lo contrario el inicio de sesión da `Failed to send email`.
> 📖 Documentación oficial:Repositorio de código fuente de MailHog https://github.com/mailhog/MailHog

**Parte III · Operaciones**

## 27. Copia de seguridad y restauración

**Entrada**: página «💾 Copia de seguridad y restauración» del Centro de administración de IA, o por línea de comandos `scripts/backup.ps1` / `restore.ps1`. La tarea programada hace una copia automática todos los días a las 02:00 y conserva 7 días.
### 27.1 Elementos de la copia
| Elemento | Método |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | Copia de archivos |
| Keycloak | **realm export (JSON)** |
| Archivos de configuración | Copia de archivos |
### 27.2 Copia manual
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 Copia programada (tarea programada)
Ya está registrada la tarea programada `AI-Platform-Backup` (todos los días a las 02:00). Si no se registró automáticamente, créala manualmente: Programador de tareas → Nueva → programa `powershell.exe`, argumentos `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, desencadenador todos los días a las 02:00.
> 📌 Las copias están por defecto en el disco C; se recomienda sincronizar periódicamente `C:\AIAllInOne\backups\` a otro disco o a almacenamiento de objetos para recuperación ante desastres en otra ubicación.
### 27.4 Restauración
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
El script pide confirmar escribiendo `yes` (añade `-Force` para saltarlo; solo para scripts/CI). También puedes hacer clic en «Restaurar» de una copia en la página «Copia de seguridad y restauración» del Centro de administración de IA para restaurar con un clic.
### 27.5 Puntos críticos (verificados en simulacros)
- ⚠️
      
        Keycloak debe usar **realm export/import (JSON)**; restaurar con pg_dump pierde la asociación del default role y no arranca;
- Tras restaurar SQLite, el propietario es root; hay que hacer chown al uid correspondiente (grafana=472, gitea=1000); de lo contrario da readonly;
- pg_dump con `--clean --if-exists` evita conflictos de restauración;
- El backup.ps1 antiguo, al copiar por lotes con `Copy-Item`, fallaba silenciosamente en toda la tanda por el archivo de punto `.env`; ya se cambió a copia archivo a archivo con `-LiteralPath`;
- La copia del Centro de administración de IA usa base64 como transporte + tar-fs para garantizar la seguridad binaria (la stdout de docker exec pasa por utf8 y corrompería los .db de SQLite).

## 28. Verificación de estado y autocomprobación de arranque

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`; genera `health_check_<marca-de-tiempo>.log`. Cubre 41 contenedores (25 principales de Windows + 16 de Dify); las credenciales se leen de `.env`, sin contraseñas en el código.
### 28.1 Alcance de la revisión (9 etapas)
| Etapa | Elemento de comprobación |
| --- | --- |
| Stage 1 | Si el Docker Daemon está en marcha (espera a que esté listo, apto para autocomprobación de arranque) |
| Stage 2 | Estado de los 41 contenedores (Up/Exited/Restarting) |
| Stage 3 | Respuesta de 10 endpoints HTTP |
| Stage 4 | Readiness de LiteLLM + registro de modelos, API de Dify, salud de base de datos/Redis/Sandbox |
| Stage 5 | Toda la cadena LLM (petición real NewAPI → LiteLLM → DeepSeek) |
| Stage 6 | Cadena de autenticación de la cuenta AD + inicio de sesión del administrador de NewAPI |
| Stage 7 | MCP Gateway + funcionalidad de Skill |
| Stage 8 | Condiciones previas del inicio de sesión de DeepChat/Dify |
| Stage 9 | Espacio en disco |
### 28.2 Ejecución manual
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ Si al final de la salida aparece `ALL CLEAR` y `Fail: 0`, todo está normal.
### 28.3 Arranque automático (tarea programada)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # retrasa 2 minutos tras el inicio de sesión para esperar a Docker + contenedores
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 Nota: el script usa `127.0.0.1` y no localhost; la salud interna de LiteLLM usa `/health/readiness` (sin autenticación); `docker-init_permissions-1` Exited(0) es normal; Update Server con 403 es normal (sin index.html por defecto); exit code 0 = aprobado, 1 = hay fallos.

## 29. Manual de resolución de problemas

### 29.1 Tres pasos de diagnóstico general
1. **Ver el estado de los contenedores**: `docker ps -a` para encontrar Exited/Restarting;
2. **Ver registros**: `docker logs <nombre-del-contenedor> --tail 30`;
3. **Ver la comprobación de salud**: ejecuta `health-check.ps1` para localizar la etapa que falla.
### 29.2 Tabla de referencia rápida de síntomas
| Síntoma | Causa raíz | Solución |
| --- | --- | --- |
| localhost no abre ningún producto | Problema de compatibilidad de IPv6 `::1` de WSL2 | Usa la IP de intranet o 127.0.0.1 |
| Ghost se reinicia continuamente, error ECONNREFUSED :3306 | Configuración de MySQL residual en el volumen | Forzar SQLite con variables de entorno (capítulo 4) |
| Los 4 contenedores de Dify se caen al arrancar con ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | Cambiar a 50 (capítulo 5) |
| La prueba del canal de NewAPI da No connected db | La clave del canal se rellenó con el valor de ejemplo | Rellenar el valor real de `LITELLM_MASTER_KEY` |
| OIDC de NewAPI da invalid_grant / Incorrect redirect_uri | La dirección del servidor es localhost | Configurar la dirección de intranet (capítulo 7) |
| Inicio de sesión de NewAPI 429 | Límite de tasa de las interfaces críticas | Limpiar redis rateLimit:* o cambiar .env |
| Dify se conecta repetidamente a ws://localhost al crear aplicaciones | Dirección WebSocket no cambiada | NEXT_PUBLIC_SOCKET_URL con IP de intranet |
| Al hacer clic en iniciar sesión en Dify no pasa nada | La contraseña requiere base64 / 401 sin sesión es normal | Haz base64 primero en el script; reintenta en el navegador |
| Gitea da readonly database | gitea.db pertenece a root | Elimina la db de root y recréala |
| Los enlaces de repositorio de Gitea son localhost | ROOT_URL no cambiado | Configurar la dirección de intranet |
| El inicio de sesión SSO da unknown_error | Fallo del reenvío de puertos de AD (iphlpsvc) | Revisa iphlpsvc + red de Hyper-V |
| Keycloak no ve los usuarios de dominio | Search scope = One Level | Cambiar a Subtree |
| Langfuse no muestra datos | V4_WRITE_MODE o cuenta SSO no añadida a la organización | Configurar dual; añadir organización por SQL (capítulo 23) |
| DeepChat: tiempo de conexión del modelo agotado | El cliente pasa por un proxy del sistema caído | Configurar sin proxy / conexión directa |
| Loki no encuentra registros | Se usó la label job | Usa `{container=~".+"}` |
| Presidio 404 /analyze/analyze | El endpoint llevaba ruta | Rellenar solo la base URL |
| Tras cambiar server.js, la interfaz nueva da 404 | up -d no relee los cambios del volumen | docker restart admin-portal |
### 29.3 Comandos frecuentes
```
docker ps -a                                        # estado de todos los contenedores
docker logs <contenedor> --tail 50                   # ver registros
docker compose up -d <servicio>                      # reconstruir un servicio
docker compose restart <servicio>                    # reiniciar un servicio (no relee .env)
docker system df                                     # uso de disco de Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # revisión con un clic
```

**Apéndice**

## Apx.. Índice de documentación oficial

### Documentación oficial de todos los productos
| Producto | Dirección de documentación oficial |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Administración del servidor de Keycloak | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| Sitio web de NewAPI | https://www.newapi.ai |
| Código fuente de NewAPI | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| Guardrail de Presidio de LiteLLM | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify autoalojado | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Panel de administración de Ghost | https://ghost.org/docs/admin/ |
| Gitea (en chino) | https://docs.gitea.com/zh-cn |
| Administración de Gitea | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| Código fuente de DeepChat | https://github.com/ThinkInAIXYZ/deepchat |
| Protocolo MCP | https://modelcontextprotocol.io |
| SDK de MCP | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse autoalojado | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Código fuente de Presidio | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ Al final de cada capítulo también se incluye la dirección de la documentación oficial del producto correspondiente, para consultar por capítulo.

