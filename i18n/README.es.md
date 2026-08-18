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

1. **Despliegue automático (recomendado)** — delega el despliegue a un agente de IA (WorkBuddy / OpenClaw / Microsoft Scout). Leerá la documentación y la configuración del despliegue, te pedirá los parámetros (IP del servidor, fuente de identidad, cuenta de administrador, claves de LLM) y completará toda la configuración paso a paso. [Ver el prompt de despliegue con un clic →](../windows/windows-deploy-guide-v2.md)

#### 🤖 Despliegue con IA — en un clic, dirigido por un agente de IA

> Copiado de la guía de despliegue (capítulo 0) : la guía puede ejecutarse **capítulo a capítulo manualmente**, o entregarse de extremo a extremo a un **agente de IA** (WorkBuddy / OpenClaw / Microsoft Scout). Dale a este directorio (la guía, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), pega la indicación siguiente y el agente : detectará la plataforma → recopilará tus parámetros uno a uno → generará un archivo de progreso local → configurará paso a paso según la guía → probará, depurará y reintentará en caso de fallo → actualizará el progreso en todo momento → ejecutará una verificación completa de extremo a extremo y te informará de los resultados.

**Indicación para copiar a tu agente** (plataforma Windows, en chino — el agente te guiará paso a paso) :

````text
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
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
