# AI AllInOne — Plataforma de IA empresarial autoalojada de código abierto

> 📖 **Idiomas**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · **Español** · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

> ⭐ **Si este proyecto te ayuda, dale una estrella — es gratis y ayuda a que más gente lo encuentre.**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

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

1. **Despliegue automático (recomendado)** — delega el despliegue a un agente de IA (WorkBuddy / OpenClaw / Microsoft Scout). Leerá la documentación y la configuración del despliegue, te pedirá los parámetros (IP del servidor, fuente de identidad, cuenta de administrador, claves de LLM) y completará toda la configuración paso a paso. [Ver el prompt de despliegue con un clic →](../windows/windows-deploy-guide-v2.md)

#### 🤖 Despliegue con IA — en un clic, dirigido por un agente de IA

> Copiado de la guía de despliegue (capítulo 0) : la guía puede ejecutarse **capítulo a capítulo manualmente**, o entregarse de extremo a extremo a un **agente de IA** (WorkBuddy / OpenClaw / Microsoft Scout). Dale a este directorio (la guía, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), pega la indicación siguiente y el agente : detectará la plataforma → recopilará tus parámetros uno a uno → generará un archivo de progreso local → configurará paso a paso según la guía → probará, depurará y reintentará en caso de fallo → actualizará el progreso en todo momento → ejecutará una verificación completa de extremo a extremo y te informará de los resultados.

**Indicación para copiar a tu agente** (plataforma Windows, en español — el agente te guiará paso a paso) :

````text
Eres ingeniero de despliegue de una plataforma de IA empresarial en intranet. Con la guía de despliegue « windows-deploy-guide-v2.html », la lista de verificación windows-checklist.html, docker-compose.yml y .env.example de este directorio, despliega y verifica por completo la plataforma « AI AllInOne » en esta máquina Windows. Comunícate conmigo en español durante todo el proceso.

## Paso 1: Recopilar los parámetros necesarios (pregúntame uno a uno — no te saltes ni adivines nada)
Antes de empezar, recopila de mí: 1) la IP de intranet expuesta por la plataforma; 2) el nombre de host del mercado Skill (dominio — se usa para reemplazar <market-hostname> en mcp-gateway/skills/skill-market/config.json y SKILL.md, y se resuelve mediante hosts/DNS); 3) la fuente de identidad (si se conecta un controlador de dominio AD: dominio / IP del DC / base DN LDAP / bind DN / contraseña de bind / sAMAccountName; o la configuración de otro IdP; confirma si no hay ninguna); 4) la cuenta y contraseña de administrador unificada; 5) las claves API de LLM (DeepSeek / OpenAI / Claude, etc.); 6) pregunta según sea necesario sobre webhook de alertas, HTTPS y política de retención de copias de seguridad.

## Paso 2: Generar un archivo de progreso local
Según el contenido de windows-checklist.html, genera « deployment-progress-<date>.md » en este directorio con cada elemento marcado como incompleto (- [ ]). Actualízalo y reporta brevemente tras completar cada elemento o resolver cada problema.

## Paso 3: Configurar paso a paso según la guía
Lee con atención windows-deploy-guide-v2.html — es la única guía autorizada para este despliegue. Ejecuta estrictamente sus capítulos 1~13 en orden (no lo sustituyas por windows-checklist.html ni por ningún documento más antiguo), prestando especial atención a los « ⚠️ escollos críticos » de cada capítulo. Prefiere los scripts de automatización de scripts/ (bootstrap.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, keycloak-realm-init.ps1, backup.ps1, restore.ps1, etc.); automatiza en lugar de hacer clic en las interfaces. El portal Ghost (sección 6.5) debe: ① desplegar el tema Corp Portal incluido — ejecuta scripts\ghost-theme-setup.ps1 para instalarlo y activarlo, no te quedes con el tema oficial por defecto; ② importar el contenido de ejemplo: primero pregúntame la dirección pública del portal y de todos los productos (IP de intranet o dominio, p. ej. 192.168.1.10 o portal.company.com) — úsala para reemplazar los marcadores <server-IP> del seed (también reemplaza las URLs de acceso NewAPI / MCP / Dify de los artículos; no cambies las direcciones internas fijas como host.docker.internal); luego pregúntame qué idioma debe tener el contenido del portal — para chino, ejecuta directamente scripts\ghost-content-import.ps1 -ServerAddr "<dirección pública>" ; para otros idiomas, traduce primero los campos title / html / plaintext / custom_excerpt de ghost-content-seed/content.json al idioma de destino (mantén los marcadores <server-IP> y todas las estructuras de URL sin cambios) y luego importa.

## Paso 4: Probar y resolver de forma iterativa
Ante un fallo, inspecciona primero los registros (docker logs, puntos de salud, configuraciones) para encontrar la causa raíz antes de corregir — no reintentes a ciegas. Cuando se necesiten derechos de administrador o mi confirmación manual, dime claramente « qué hacer y por qué ». Tras resolverlo, actualiza el archivo de progreso y reporta brevemente.

## Paso 5: Verificación completa de extremo a extremo
Cuando todo esté hecho, ejecuta pruebas de extremo a extremo: todos los contenedores Up, inicio de sesión SSO de Keycloak, una conversación real a través de NewAPI/LiteLLM para verificar el enmascaramiento de PII, inicio de sesión con la fuente de identidad, monitorización / registro / alertas, copia de seguridad y restauración. Finalmente, resume cada elemento como ✅/❌, dando la causa raíz y una sugerencia para los fallos.
````

> 💡 Aunque **no uses un agente**, esta indicación también sirve como lista de verificación previa al despliegue : enumera todos los parámetros que debes preparar antes de empezar.

2. **Despliegue manual** — sigue paso a paso la [guía de despliegue de Windows](../windows/windows-deploy-guide-v2.md) (junto con la lista de verificación de progreso `windows-checklist.html`).

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

## 🎓 Programa de formación

La plataforma incluye un **programa de formación completo** (17 módulos, 60 horas, 10 días laborables) para incorporación en despliegue y operación:

| Paquete | Idioma | Entrada |
|---|---|---|
| **English** | EN | [training/training_eng/index.md](../training/training_eng/index.md) |
| **简体中文** | zh-CN | [training/training_chn/index.md](../training/training_chn/index.md) |

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

## ⭐ Apoya el proyecto

Si AI AllInOne te ahorra tiempo o dinero, una estrella no te cuesta nada y ayuda al proyecto a crecer:

- ⭐ **Da una estrella al repositorio** — ayuda a que más gente descubra y se beneficie del proyecto
- 🐛 **Reporta problemas** — bugs, peticiones de funciones y problemas de despliegue son bienvenidos
- 🤝 **Contribuye** — código, documentación y traducciones (9 idiomas) son bienvenidos
- 💬 **Únete a la comunidad** — comparte tus experiencias de despliegue e ideas
- 📣 **Compártelo** — cuéntaselo a tus compañeros o publícalo en tu blog / redes sociales

Una estrella en la esquina superior derecha es el mayor apoyo para este proyecto.

## 📄 Licencia

[MIT](../LICENSE) — de uso, modificación y distribución libres. Los componentes integrados conservan sus propias licencias (consulta la sección de revisión de licencias de la guía de despliegue).

## 🤖 Operaciones con agentes de IA

La plataforma está diseñada para **operarse y mantenerse mediante un agente de IA** — WorkBuddy, OpenClaw, Microsoft Scout o cualquier herramienta equivalente. En lugar de hacer clic en una docena de consolas de administración, le dices al agente lo que quieres en lenguaje natural ; él lee archivos, ejecuta comandos y habla con los servicios por ti.

Todo lo que hace funcionar la plataforma vive en tu máquina como **código, configuración y datos** — servicios de Docker Compose, archivos `.env`, APIs de administración y las bases/archivos con el estado real — así que un agente puede verlo y cambiarlo todo :

| 任务 | Agent 的做法 |
|---|---|
| Comprobación de salud / estado general | `docker ps` + endpoints de salud + API de administración |
| Iniciar / reiniciar / detener servicios | `docker compose up -d <svc>` / `docker restart <svc>` |
| Ver registros y errores | `docker logs <svc> --tail N` + archivos de registro |
| Cambiar configuración | editar archivos de configuración y reiniciar el contenedor afectado |
| Editar el Centro de Administración IA | editar `admin-portal/public/index.html` (UI) o `admin-portal/server.js` (API), luego reiniciar |
| Gestionar Gitea y sincronización | API de Gitea : disparar workflows, leer estado/registros, editar archivos del repo |
| Gestionar el portal Ghost | leer/escribir la BD SQLite de Ghost, editar temas, importar el contenido semilla |
| Copia de seguridad y restauración | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publicar una versión | `publish.ps1` (build + commit + push a GitHub) |
| Solucionar problemas | conflictos de puertos, problemas de Docker Desktop, DNS/proxy, etc. |

Ejemplo : *« Comprueba que todos los servicios están en funcionamiento y son saludables »* — el agente ejecuta `docker ps`, consulta cada endpoint de salud e informa qué falla y por qué. Indicaciones listas, buenas prácticas y referencia completa de comandos en la **[Guía de operaciones con agentes de IA](../AI-AGENT-OPS.md)** (9 idiomas).

### 🛡️ Operaciones IA — comprobación de salud en un comando y arranque automático

> Copiado de la guía de despliegue (capítulo 12) : la plataforma incluye una **comprobación de salud con un solo comando** (`health-check.ps1`) que verifica los **41 contenedores en 9 etapas** — incluida la cadena LLM completa, la autenticación AD + inicio de sesión de administrador, las funciones MCP/Skill y el espacio en disco. Las credenciales se leen de `.env` ; el script no contiene contraseñas fijas. Solo dile a tu agente de IA que lo ejecute (p. ej. *« Ejecuta la comprobación de salud y dime qué está fallando »*), o déjalo correr automáticamente en cada inicio de sesión :

| Fase | Verificación | Método |
|---|---|---|
| Stage 1 | ¿El daemon de Docker está en ejecución (espera lista, para autoarranque)? | `docker info` |
| Stage 2 | Estado de los 41 contenedores (Up/Exited/Restarting) | `docker ps -a` |
| Stage 3 | Respuesta de 10 endpoints HTTP (incluido MCP Gateway) | `curl.exe 127.0.0.1:puerto` |
| Stage 4 | LiteLLM /readiness + **registro de modelos**, litellm-redis PING, Dify API /health, salud de MySQL/PostgreSQL/Redis/Sandbox | `docker exec` + `docker inspect` |
| Stage 5 | **Cadena LLM completa** : estado de canales NewAPI + una petición real en nombre de DeepChat y Dify (NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **Cadena de autenticación AD** : Keycloak well-known + sincronización de usuarios AD (aitest1) + configuración OIDC de NewAPI + integridad de clientes OIDC + **login admin de NewAPI** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + agregación de Skills externos | curl (protocolo MCP) |
| Stage 8 | **Prerrequisitos de login DeepChat / Dify** : NewAPI disponible + Dify inicializado | curl + psql |
| Stage 9 | **Espacio en disco** : restante en el disco del sistema + uso de Docker | `Get-PSDrive` + `docker system df` |

**Ejecución manual** (PowerShell) :

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**Ejecución automática al iniciar sesión** (tarea programada — ejecuta PowerShell como administrador) :

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
