# AI AllInOne — Plataforma de IA de intranet empresarial (multiplataforma, autoalojada)

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

Una **suite de IA de intranet empresarial lista para usar y multiplataforma**: autenticación unificada, enrutamiento LLM, redacción de PII, aplicaciones de IA, portal empresarial, código/CI, distribución de clientes, administración unificada, monitoreo y alertas, observabilidad, registro, y respaldo/restauración — todo orquestado con Docker en un solo sistema integrado, con **inicio de sesión único (SSO) en todos los productos mediante una sola cuenta de Keycloak**.

El repositorio admite tres plataformas de despliegue:

| Plataforma | Carpeta del repositorio (en GitHub) | Caso de uso típico |
|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop (máquina única) |
| Linux / macOS | `linux/` | Servidor Linux propio / macOS (Docker) |
| Servidor en línea | `docker/` | Host en la nube / Docker puro (producción) |

> En el directorio de trabajo local, estas carpetas se llaman `windows-github/`, `linux-github/` y `docker-github/`; tras publicarlas en GitHub se elimina el sufijo `-github` y pasan a ser `windows/`, `linux/` y `docker/`. Toda actualización futura sigue este mismo mapeo.

---

## 1. Qué incluye

| Capa | Componente | Función |
|---|---|---|
| Autenticación | Keycloak | SSO / OIDC, integrable con AD/LDAP o cuentas locales |
| Enrutamiento LLM | NewAPI | Canales, claves, cuotas, auditoría, coste |
| Redacción de PII | LiteLLM + Presidio | Redacción automática de teléfonos/identificaciones/correos antes de las llamadas al modelo |
| Aplicaciones de IA | Dify | Plataforma visual de apps de IA / Agentes + base de conocimiento unificada (RAG) |
| Portal empresarial | Ghost | Anuncios y noticias de la empresa |
| Código / CI | Gitea + Runner | Git interno + automatización Actions |
| Cliente | DeepChat | Cliente IA de escritorio local (Windows / macOS / Linux) |
| Distribución de clientes | Update Server | Alojamiento y autoactualización del instalador de DeepChat |
| Administración unificada | AI Admin Center | Entrada única: panel + productos integrados + auditoría/coste/informes + búsqueda RAG |
| Puerta de enlace | MCP Gateway | Gestión del mercado Skill / MCP + búsqueda de conocimiento Dify (RAG) |
| Monitoreo | Prometheus + Grafana + Alertmanager | Monitoreo de recursos de contenedores + notificaciones de alerta |
| Observabilidad LLM | Langfuse | Traza / latencia / tokens / coste de cada llamada al modelo |
| Registro unificado | Loki + Promtail | Registros agregados y consultables de todos los contenedores |
| Respaldo/restauración | scripts backup/restore + página admin | Respaldo completo diario + restauración en un clic |

Cada carpeta de plataforma contiene: `docker-compose.yml`, `.env.example`, `*-deploy-guide*.html` (guía de despliegue), `*-checklist*.html` (lista de verificación), la guía de integración del proveedor de identidad, scripts de despliegue en un clic, además del código fuente y la configuración saneados. **No se versiona ningún secreto real.**

### Arquitectura y flujo de datos

![Arquitectura](<../pics/Architecture.png>)

![Flujo de datos](<../pics/DataFlow.png>)

### Capturas de pantalla

**AI Admin Center** — portal de administración unificado

![AI Admin Center](<../pics/AI Admin.png>)

**Dify** — plataforma de aplicaciones IA

![Dify](<../pics/Dify.png>)

**Portal empresarial** — inicio (Ghost)

![Inicio del portal](<../pics/AI All In One Hub.png>)

**Página DeepChat** — Descargar los instaladores de DeepChat

![Página DeepChat](<../pics/AI All In One Hub Download.png>)

**DeepChat** — cliente IA de escritorio

![DeepChat](<../pics/DeepChat.png>)
---

## 2. Inicio rápido: despliegue automatizado mediante una herramienta tipo Harness (recomendado)

Las herramientas tipo Harness (OpenClaw, Microsoft Scout, WorkBuddy y similares) pueden leer la documentación y la configuración de este proyecto y construir todo el entorno paso a paso en tu máquina. A continuación se describe el flujo estándar.

### 5 requisitos previos

**1. Instalar una herramienta tipo Harness**
Instala OpenClaw / Microsoft Scout / WorkBuddy (o un equivalente). Todas pueden leer/escribir archivos locales, ejecutar comandos y buscar en la web.

**2. Comprar una suscripción o configurar tu propia API**
Completa la suscripción en la herramienta, o introduce tu propia clave de API de LLM (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.) para que la herramienta pueda conversar con normalidad.

**3. Preparar el entorno de red**
Este es el paso que más suele bloquear:
- Asegúrate de que la máquina puede acceder a los **registros de imágenes de Docker** (Docker Hub / quay.io, etc.). Si no hay acceso directo, configura un espejo de registro (p. ej. DaoCloud) de antemano.
- Asegúrate de que puede acceder a **GitHub** (para clonar el repositorio y descargar algunas dependencias públicas). Si no hay acceso directo, usa un proxy o descarga el archivo fuente con antelación.
- Confirma que la máquina de destino es alcanzable en el segmento de red que pretendes exponer.

**4. Clonar o descargar el proyecto localmente**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# o descarga el archivo y extráelo en cualquier carpeta local
```

**5. Pegar el siguiente prompt en la herramienta para iniciar el despliegue automatizado**

Copia el **prompt completo** de abajo en el cuadro de entrada de la herramienta Harness y responde a sus preguntas una por una. La herramienta: detectará tu plataforma → recopilará parámetros → generará un archivo de progreso local → configurará paso a paso según la guía → iterará contigo para probar y corregir problemas → mantendrá el progreso actualizado → ejecutará una prueba completa al final y te informará de los resultados.

### Prompt de despliegue en un clic (copiar en la herramienta)

````text
Eres ingeniero de despliegue de una plataforma de IA de intranet empresarial. Basándote en la documentación y los archivos de configuración de este proyecto, despliega y verifica por completo la plataforma "AI AllInOne" en la máquina actual. Comunícate conmigo en español durante todo el proceso y sigue estrictamente el procedimiento siguiente.

## Paso 1: Confirmar el directorio de despliegue y la plataforma de destino

1. Primero pregúntame: ¿cuál es la ruta local de extracción/clonación de este proyecto? (p. ej. C:\AIAllInOne o /opt/AIAllInOne)
2. Tras entrar en ese directorio, determina la carpeta de plataforma de destino según el sistema operativo de la máquina:
   - Windows → usar la carpeta `windows-github` (o `windows`)
   - Linux / macOS → usar la carpeta `linux-github` (o `linux`)
   - Servidor en línea / entorno Docker puro → usar la carpeta `docker-github` (o `docker`)
   Si no estás seguro, dime qué SO detectaste y confirma conmigo qué carpeta usar.
3. Lee el README.md raíz y el README.md dentro de esa carpeta de plataforma para entender la arquitectura y el enfoque de despliegue antes de actuar.

## Paso 2: Recopilar los parámetros necesarios (pregúntame uno por uno; no omitas ni adivines)

Antes de configurar, recopila la siguiente información, preguntándome lo que falte y explicando la utilidad de cada elemento:

1. La IP de intranet utilizada para exponer la plataforma (la dirección que usan otras máquinas para alcanzarla, p. ej. 192.168.1.100).
2. Fuente de identidad (Identity Provider):
   - Controlador de dominio AD de empresa (Active Directory): pídeme el nombre de dominio, la IP del DC, la base DN de LDAP, el bind DN, la contraseña de la cuenta de bind, sAMAccountName, etc.
   - Otro IdP (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk, etc.): pídeme la configuración y los datos de cuenta correspondientes.
   - Sin fuente de identidad externa (solo cuentas locales): confírmalo conmigo y omite.
3. Cuenta de administrador unificada: nombre de usuario, contraseña, correo (para el SSO de Keycloak y el acceso de administrador a cada producto).
4. Claves de API de LLM: qué proveedores de modelos y qué claves tengo realmente (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.); omite los que no tenga.
5. Otros elementos a preguntar según sea necesario: canal de notificación de alertas (URL de webhook de DingTalk/WeCom/Feishu), certificados HTTPS, política de retención de respaldos, etc.

## Paso 3: Generar un archivo de progreso local

1. Localiza el documento de "lista de verificación" en la carpeta de plataforma (p. ej. *-checklist*.html) y la "guía de integración de la fuente de identidad" (p. ej. *-ad-integration*.html o documentos relacionados con el IdP).
2. Basándote en el contenido de la lista, genera un nuevo archivo de progreso en el directorio del proyecto, llamado p. ej. "progreso-despliegue-<plataforma>-<fecha>.md", copiando cada elemento de la lista como incompleto (- [ ]).
3. A partir de entonces, actualiza este archivo cada vez que completes un elemento o resuelvas un problema, e informa brevemente del avance en la conversación.

## Paso 4: Configurar paso a paso según la guía de despliegue

1. Lee con atención la "guía de despliegue" de la plataforma (p. ej. *-deploy-guide*.html) y síguela estrictamente, prestando especial atención a los "⚠️ escollos críticos / trampas" que señala.
2. Orden aproximado: preparar variables de entorno → iniciar contenedores → inicializar auth/IdP → configurar el enrutamiento LLM y los canales de modelos → inicializar cada producto → configurar monitoreo/observabilidad/registro/redacción → configurar respaldo y restauración.
3. Prioriza los scripts de automatización ya presentes en la carpeta (p. ej. bootstrap.ps1, keycloak-realm-init.ps1, health-check, etc.); no hagas clic en las UI para pasos que se pueden automatizar.

## Paso 5: Iterar conmigo para probar y corregir problemas

1. Cuando un paso falle o no coincida con lo esperado, inspecciona primero los registros (docker logs, los endpoints de salud de cada servicio, los archivos de configuración), localiza la causa raíz y luego corrige; no reintentes a ciegas.
2. Cuando necesites mi intervención (ejecutar un comando con permisos de administrador, confirmar un inicio de sesión, aportar información), dime claramente "qué hacer y por qué".
3. Tras resolverlo, anota la causa raíz y la corrección en el archivo de progreso e infórmame brevemente.

## Paso 6: Verificación completa de extremo a extremo

Una vez completados todos los elementos de la lista, ejecuta una prueba completa de extremo a extremo que cubra al menos:
- Salud de los servicios (todos los contenedores activos, endpoints de salud normales);
- Inicio de sesión unificado SSO (inicio de sesión en Keycloak → SSO/inicio automático en cada producto);
- Cadena LLM (envía un chat real a través de NewAPI/LiteLLM, verifica la respuesta + la redacción de PII);
- Inicio de sesión por fuente de identidad (si AD/otro IdP está conectado, prueba el inicio con la cuenta correspondiente);
- Monitoreo/observabilidad/registro/alertas (confirma que hay datos y que las alertas se disparan);
- Respaldo y restauración (ejecuta un respaldo y verifica que se puede restaurar).

Por último, resume los resultados de la prueba elemento por elemento, marcando claramente ✅ superado / ❌ fallido; para los fallos, da la causa raíz y sugerencias de seguimiento.
````

---

## 3. Despliegue manual (alternativa)

Si prefieres no usar una herramienta tipo Harness, puedes desplegar manualmente siguiendo el `README.md` y el `*-deploy-guide*.html` de cada plataforma. El flujo principal es el mismo: iniciar contenedores → inicializar auth/IdP → configurar canales LLM → inicializar cada producto → configurar monitoreo/respaldo.

---

## 4. Seguridad y notas

- Este repositorio no contiene **ningún secreto real**; todos los valores reales viven en el `.env` de cada entorno de ejecución (solo se versionan las plantillas `.env.example`).
- Por defecto se usa HTTP en claro en la intranet; para HTTPS, consulta el capítulo correspondiente de la guía de despliegue de cada plataforma.
- Los escollos, diagramas de arquitectura, tablas de puertos y flujos de datos de cada plataforma figuran en los documentos `*-deploy-guide*.html` correspondientes.

---

## 5. Operar con un agente de IA

Esta plataforma se puede operar y mantener por completo mediante un agente de IA (WorkBuddy, OpenClaw, Microsoft Scout, etc.): comprobaciones de salud, gestión de contenedores, cambios de configuración, sincronización de Gitea, el portal Ghost, copias de seguridad, versiones y resolución de problemas.

Consulta la **[Guía de operación con agentes de IA](AI-AGENT-OPS.es.md)** (disponible en 9 idiomas).
