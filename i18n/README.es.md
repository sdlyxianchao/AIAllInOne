# AI AllInOne — Plataforma de IA empresarial autoalojada de código abierto

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · **Español** · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

> **Un solo servidor. Una sola cuenta. Todo el ecosistema de IA empresarial — de código abierto y gratuito, con los datos dentro de la intranet.**

AI AllInOne es una plataforma de IA para la intranet empresarial, **de código abierto y gratuita**, lista para usar: SSO unificado, enrutamiento de LLM, aplicaciones de IA, portal empresarial, código fuente/CI, administración unificada, monitoreo y alertas, observabilidad, registros, copia de seguridad y restauración — todo orquestado con Docker en una sola solución. **Con una sola cuenta y un único inicio de sesión, los empleados pueden usar todas las herramientas de IA.**

![AI Admin Center](<../pics/AI Admin.png>)

![Portal empresarial](<../pics/AI All In One Hub.png>)

---

## ✨ Por qué elegir AI AllInOne

| | |
|---|---|
| 🧩 **Todo en uno, sin montaje** | 8+ componentes de código abierto preintegrados: autenticación, gateway, aplicaciones, portal, Git, monitoreo, registros, copia de seguridad. Sin necesidad de "ensamblar" nada. |
| 🔐 **SSO unificado** | Una cuenta de Keycloak (con federación AD/LDAP) inicia sesión automáticamente en todos los productos, sin contraseñas repetidas. |
| 🔒 **Datos dentro de la intranet** | Totalmente autoalojado: las llamadas a modelos, los prompts, los documentos y los datos de los usuarios permanecen dentro de la empresa. |
| ⚡ **Despliegue en ~30 minutos** | `docker compose` + scripts automatizados, o deja que un agente de IA despliegue todo el entorno por ti. |
| 🛡️ **Redacción de PII** | La información sensible, como números de teléfono / DNI / correos electrónicos, se redacta automáticamente antes de llamar a los modelos externos (Presidio). |
| 📊 **Observabilidad integral** | Monitoreo con Prometheus + Grafana, seguimiento de LLM con Langfuse, registros unificados con Loki, alertas a IM empresariales (DingTalk / WeCom / Feishu). |
| 💾 **Copia de seguridad y restauración** | Copia de seguridad completa diaria y restauración con un clic desde el panel de administración. |
| 🌐 **9 idiomas** | Manuales e interfaz de administración multilingües (chino simplificado / chino tradicional / inglés / francés / español / portugués / japonés / coreano / árabe). |

## 📦 Lista de componentes

| Capa | Componente | Función |
|---|---|---|
| Autenticación | Keycloak | SSO / OIDC, federación AD/LDAP o cuentas locales |
| Enrutamiento de LLM | NewAPI | Canales, claves, cuotas, auditoría, costos |
| Redacción de PII | LiteLLM + Presidio | Redacta automáticamente información sensible antes de llamar al modelo |
| Aplicaciones de IA | Dify | Plataforma de aplicaciones de IA / agentes visuales + base de conocimiento unificada (RAG) |
| Portal empresarial | Ghost | Portal de anuncios y noticias de la empresa (con el tema Corp Portal personalizado integrado) |
| Código fuente / CI | Gitea + Runner | Git interno + automatización con Actions |
| Cliente | DeepChat | Cliente de escritorio de IA local (Windows / macOS / Linux) |
| Distribución de cliente | Update Server | Alojamiento de instaladores de DeepChat y actualización automática |
| Administración unificada | AI Admin Center | Punto de entrada único: panel + productos integrados + auditoría/costos/informes + autorización de administradores por niveles + sincronización/roles de Keycloak |
| Gateway | MCP Gateway | Mercado de skills / MCP + recuperación de conocimiento de Dify (RAG) |
| Monitoreo | Prometheus + Grafana + Alertmanager | Monitoreo de recursos de contenedores + notificaciones de alertas |
| Observabilidad de LLM | Langfuse | Rastrea latencia, tokens y costos de cada llamada al modelo |
| Registros unificados | Loki + Promtail | Agrega todos los registros de contenedores, consultables por contenedor / palabra clave / tiempo |
| Copia de seguridad y restauración | Scripts + página de administración | Copia de seguridad completa diaria + restauración con un clic |

### Arquitectura y flujo de datos

![Vista general de la arquitectura](<../pics/Architecture.png>)

![Flujo de datos](<../pics/DataFlow.png>)

---

## 🚀 Inicio rápido

**Requisitos previos**: una máquina con Docker instalado (Windows 11 + Docker Desktop, o Linux) y acceso al registro de imágenes de Docker.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# Inicia los servicios principales y luego inicializa la autenticación / los canales de LLM / los productos según la guía de despliegue
docker compose up -d
```

A continuación tienes dos opciones:

1. **Despliegue automático (recomendado)** — delega el despliegue a un agente de IA (WorkBuddy / OpenClaw / Microsoft Scout). Leerá la documentación y la configuración del despliegue, te pedirá los parámetros (IP del servidor, fuente de identidad, cuenta de administrador, claves de LLM) y completará toda la configuración paso a paso. [Ver el prompt de despliegue con un clic →](../windows/windows-deploy-guide-v2.html)

<details>
<summary>📋 Prompt de despliegue con un clic (haz clic para expandir)</summary>

````text
Eres el ingeniero de despliegue de la plataforma de IA para la intranet empresarial. Basándote en la documentación y los archivos de configuración de este proyecto, despliega y verifica por completo la plataforma «AI AllInOne» en la máquina actual. Comunícate conmigo en español durante todo el proceso y sigue estrictamente el flujo que se indica a continuación.

## Paso 1: Confirma el directorio de despliegue y la plataforma de destino
1. Pregúntame primero: ¿cuál es la ruta local de extracción/clonación de este proyecto? (por ejemplo, C:\AIAllInOne o /opt/AIAllInOne)
2. Una vez dentro de ese directorio, determina el directorio de la plataforma de destino según el sistema operativo de la máquina actual:
   - Windows → usa el directorio windows-github (o windows)
   - Linux / macOS → usa el directorio linux-github (o linux)
   - Servidor en línea / entorno solo con Docker → usa el directorio docker-github (o docker)
   Si no estás seguro, dime el sistema operativo detectado y confirma conmigo qué directorio usar.
3. Antes de empezar, lee el README.md de la raíz y el README del directorio de esa plataforma para entender la arquitectura y el método de despliegue.

## Paso 2: Recopila los parámetros necesarios uno por uno (pregúntame uno a uno, no los omitas ni los supongas)
1. La IP de intranet (o el dominio) que la plataforma expone al exterior, es decir, la dirección que usarán otras máquinas para acceder a ella (por ejemplo, 192.168.1.100 o portal.company.com).
2. Fuente de identidad (Identity Provider):
   - Controlador de dominio AD de la empresa: pregúntame por el dominio, la IP del DC, el LDAP base DN, el bind DN, la contraseña de la cuenta de bind, el sAMAccountName, etc.
   - Otros IdP (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk, etc.): pregúntame por la configuración correspondiente y la información de la cuenta.
   - Sin fuente de identidad externa (solo cuentas locales): confírmalo conmigo y omítelo.
3. Cuenta de administrador unificada: nombre de usuario, contraseña, correo electrónico (para el SSO de Keycloak y el inicio de sesión de administrador de cada producto).
4. Claves de API de LLM: qué proveedores de modelos y claves tengo realmente (DeepSeek / OpenAI / Claude / Qwen / Tongyi / ERNIE, etc.); si no hay, omítelos.
5. Idioma del contenido de ejemplo del portal Ghost: chino, o traducido a otro idioma antes de importarlo.
6. Pregunta según necesidad: hostname del mercado de skills de MCP (Windows), canales de notificación de alertas (webhook de DingTalk/WeCom/Feishu), certificados HTTPS, política de retención de copias de seguridad, etc.

## Paso 3: Genera un archivo de progreso local
1. Localiza el documento de «lista de verificación de progreso» (*-checklist*.html) y la «guía de integración de la fuente de identidad» (como *-ad-integration*.html o la documentación relacionada con el IdP) dentro del directorio de la plataforma.
2. Según el contenido de la lista, genera un archivo de progreso en el directorio del proyecto con un nombre como "deployment-progress-<platform>-<date>.md" y copia cada elemento de la lista como sin completar (- [ ]).
3. Después, cada vez que completes un elemento o resuelvas un problema, actualiza ese archivo de progreso y resúmeme brevemente el avance en la conversación.

## Paso 4: Configura paso a paso según la guía de despliegue
1. Lee atentamente el documento de «guía de despliegue» de la plataforma (como *-deploy-guide*.html) y síguelo estrictamente, prestando especial atención a los «⚠️ puntos críticos» marcados.
2. Orden aproximado: preparar las variables de entorno → iniciar los contenedores → inicializar la autenticación/IdP → configurar el enrutamiento de LLM y los canales de modelos → inicializar cada producto (portal Ghost: desplegar el tema Corp Portal integrado e importar el contenido de ejemplo) → configurar monitoreo/observabilidad/registros/redacción → configurar la copia de seguridad y restauración.
3. Prioriza los scripts de automatización del directorio (como bootstrap.ps1, keycloak-realm-init.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, health-check.ps1, etc.); para los pasos que se puedan automatizar, no uses la UI manualmente.

## Paso 5: Prueba de forma iterativa y resuelve los problemas conmigo
1. Cuando un paso falle o no cumpla lo esperado, consulta primero los registros (docker logs, los endpoints de salud de los servicios, los archivos de configuración) para localizar la causa raíz y luego arréglalo; no reintentes a ciegas.
2. Cuando necesites mi participación (por ejemplo, ejecutar comandos que requieren permisos de administrador, confirmar el inicio de sesión, completar información), dime claramente «qué hay que hacer y por qué».
3. Tras resolverlo, registra la causa raíz y la solución en el archivo de progreso y resúmeme brevemente lo ocurrido.

## Paso 6: Verificación completa de extremo a extremo
Cuando estén completados todos los elementos de la lista, realiza una prueba completa de extremo a extremo que cubra al menos:
- Salud de los servicios (todos los contenedores en estado Up, endpoints de salud normales);
- Inicio de sesión único (SSO) unificado (inicio de sesión en Keycloak → SSO/inicio de sesión automático en cada producto);
- Cadena de LLM (enviar una conversación real a través de NewAPI/LiteLLM y verificar la respuesta y que la redacción de PII esté activa);
- Inicio de sesión con la fuente de identidad (si AD/otro IdP ya está integrado, prueba el inicio de sesión con la cuenta correspondiente);
- Monitoreo/observabilidad/registros/alertas (confirmar que hay datos y que las alertas se pueden disparar);
- Copia de seguridad y restauración (realizar una copia de seguridad y verificar que se puede restaurar).

Por último, resume los resultados de la prueba elemento por elemento, marcando claramente ✅ aprobado / ❌ fallido; para los fallidos, indica la causa raíz y las sugerencias posteriores.
````

</details>

2. **Despliegue manual** — sigue paso a paso la [guía de despliegue de Windows](../windows/windows-deploy-guide-v2.html) (junto con la lista de verificación de progreso `windows-checklist.html`).

> **Estado de la plataforma**: Windows (Windows 11 + Docker Desktop) **en pruebas reales**. Linux/macOS (`linux/`) y los servidores en línea (`docker/`) están planificados — consulta la [hoja de ruta](#roadmap).

## 🖼️ Capturas de pantalla

**Dify** — plataforma de aplicaciones de IA · **Mercado de MCP/Skills** — herramientas y skills con un solo clic · **DeepChat** — cliente de IA de escritorio

![Dify](<../pics/Dify.png>) ![Mercado de MCP/Skills](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

Más capturas (48 capturas reales de la interfaz) están integradas en el [manual de administración](../docs/admin-manual/index.md).

## 📚 Manuales (en línea, en 9 idiomas)

| Manual | Idioma |
|---|---|
| **Manual de administración** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **Manual de usuario** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

Para la operación diaria con agentes de IA, consulta la **[guía de operaciones de agentes de IA](../AI-AGENT-OPS.md)**.

## 👥 Comunidad

> Grupo de WeChat: para intercambiar ideas, resolver dudas sobre el despliegue, dar feedback y **construir juntos**. Escanea el código para añadir amigos y te invitaremos al grupo.

<img src="../pics/wechat.png" alt="Código QR del grupo de WeChat" width="200" />

También te damos la bienvenida a [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions) (o a crear un [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues) directamente).

## 🤝 Contribuye

Este proyecto es **de código abierto y gratuito** y crece gracias a la comunidad. Sea cual sea tu nivel, hay una forma de participar para ti:

- ⭐ **Añade una estrella al repositorio** — la forma más sencilla y valiosa de apoyar
- 🐛 **Reporta bugs / solicita funciones** — abre un issue y describe claramente los pasos para reproducirlo
- 📝 **Escribe documentación y tutoriales** — guías de despliegue, experiencias de resolución de problemas, mejores prácticas
- 🌐 **Traduce** — los manuales ya están en 9 idiomas; ayúdanos a mejorarlos o añade más
- 🧪 **Prueba y comparte** — despliega una vez y cuéntanos qué funciona bien y qué problemas encontraste
- 💻 **Contribuye código** — la capa de integración (SSO unificado, portal de administración, monitoreo, copia de seguridad) es el mejor punto de partida

Consulta la guía completa en [CONTRIBUTING.md](../CONTRIBUTING.md); en la [hoja de ruta](#roadmap) pública puedes ver los próximos planes. **Cada colaborador aparecerá en la lista de colaboradores del README.**

<h2 id="roadmap">🗺️ Hoja de ruta</h2>

- ✅ v0.9x — Plataforma Windows: todo en uno + AI Admin Center + autorización de administradores por niveles + alertas de IM empresarial + caché semántica (redis-semantic de LiteLLM)
- 🚧 **Linux / macOS** — soporte para servidores Linux autoalojados (`linux/`)
- 🚧 **Servidores en línea** — despliegue de producción solo con Docker / en la nube (`docker/`)
- 🚧 **Programa de colaboradores** — tablero de tareas, reuniones semanales de sincronización, certificación de socios de despliegue

## 🔒 Notas de seguridad

- Este repositorio **no contiene ninguna clave real**; los valores reales solo existen en el `.env` de cada entorno de ejecución (el repositorio solo incluye la plantilla `.env.example`).
- Por defecto se usa HTTP sin cifrar en la intranet; la configuración de HTTPS se detalla en la guía de despliegue de cada plataforma.
- Los puntos críticos, la tabla de puertos y el flujo de datos de cada plataforma se encuentran en los documentos `*-deploy-guide*.html` correspondientes.

## 📄 Licencia

[MIT](../LICENSE) — de uso, modificación y distribución libres. Los componentes integrados conservan sus propias licencias (consulta la sección de revisión de licencias de la guía de despliegue).
