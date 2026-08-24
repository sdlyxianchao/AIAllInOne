# Guía de operación con agentes de IA

> 📖 **Idiomas**: [English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

Esta plataforma está diseñada para **operarse y mantenerse mediante un agente de IA**: WorkBuddy, OpenClaw, Microsoft Scout o cualquier herramienta equivalente. En lugar de iniciar sesión en una docena de consolas de administración y hacer clic en interfaces, le dices al agente lo que quieres en lenguaje natural, y él lee archivos, ejecuta comandos y se comunica con los servicios por ti.

Esta guía explica cómo usar un agente de IA para las operaciones diarias: comprobaciones de estado, gestión de contenedores, cambios de configuración, el Centro de Administración de IA, Gitea/sincronización, el portal Ghost, copias de seguridad, versiones y resolución de problemas.

---

## 1. Cómo funciona

Todo lo que hace funcionar la plataforma vive en tu máquina como **código, configuración y datos**:

- **Docker Compose** define todos los contenedores.
- Los **archivos `.env`** (p. ej. `windows/.env.windows`) contienen las credenciales que usan los servicios.
- Las **API de administración** exponen los endpoints de gestión (Keycloak, Gitea, NewAPI, etc.).
- Los **archivos y bases de datos** (la base SQLite de Ghost, los instaladores de DSH Desktop, el JSON del historial de sincronización, etc.) son el estado real.

El agente puede:

- **Leer y editar** cualquier archivo: configuraciones, scripts, el `index.html` / `server.js` del Centro de Administración de IA y la documentación.
- **Ejecutar comandos**: `docker`, `docker compose`, `git`, PowerShell, Node.js y Python.
- **Llamar a servicios por HTTP**: API de administración, endpoints de salud, enlaces de descarga.
- **Buscar en la web** documentación de productos cuando lo necesite.

Como todo son archivos + comandos + API, el agente puede verlo y cambiarlo todo — por eso puedes operar toda la plataforma a través de él.

---

## 2. Preparación (una sola vez)

1. **Abre la carpeta del proyecto en el agente.** Apunta el directorio de trabajo del agente a la raíz del proyecto (p. ej. `C:\AIAllInOne`). Ahí es donde lee `docker-compose.yml`, los archivos `.env`, los scripts y la documentación.
2. **Asegúrate de que Docker Desktop esté en marcha.** La mayoría de las operaciones son comandos `docker` / `docker compose`. Si Docker Desktop está detenido, el primer paso del agente suele ser comprobarlo y arrancarlo.
3. **Deja las credenciales en `.env`, no en el chat.** El agente lee `windows/.env.windows` para las contraseñas de los servicios. No pegues contraseñas reales en la conversación ni en archivos versionados.
4. **Dile qué carpeta de plataforma usar** si no es obvio (`windows/` en la mayoría de casos de una sola máquina).

---

## 3. Qué puede hacer el agente

| Tarea | Cómo la hace el agente |
|---|---|
| Comprobación de salud / resumen | `docker ps` + endpoints de salud + API de administración |
| Iniciar / reiniciar / detener servicios | `docker compose up -d <svc>` / `docker restart <svc>` |
| Revisar registros y errores | `docker logs <svc> --tail N`, leer archivos de registro |
| Cambiar la configuración | editar archivos y luego reiniciar el contenedor afectado |
| Editar el Centro de Administración de IA | editar `admin-portal/public/index.html` (UI) o `admin-portal/server.js` (API) |
| Gestionar Gitea + sincronización | API de Gitea: disparar workflows, leer estado/registros, editar archivos del repo |
| Gestionar el portal Ghost | leer/escribir la base SQLite de Ghost, editar plantillas del tema, importar el contenido de ejemplo |
| Copias de seguridad y restauración | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publicar una versión | `publish.ps1` (compilar + commit + push a GitHub) |
| Limpiar | `docker image prune`, eliminar copias antiguas, etc. (con tu confirmación) |
| Resolver problemas | conflictos de puertos, problemas de Docker Desktop, DNS/proxy, etc. |

---

## 4. Tareas comunes y ejemplos de instrucciones

Estas son las tareas que harás con más frecuencia, cada una con un ejemplo. Puedes decirlas en tu idioma: el agente te seguirá. Sustituye `<…>` por los valores reales.

### 4.1 Comprobar la salud de todo

> "Comprueba que todos los servicios están en marcha y sanos. Enumera cualquier contenedor detenido o reiniciándose, y dime por qué."

El agente ejecuta `docker ps`, consulta cada endpoint de salud e informa del estado.

### 4.2 Investigar un servicio detenido o con errores

> "LiteLLM está detenido. Averigua por qué y arréglalo; luego confirma que ha vuelto."

El agente inspecciona el estado del contenedor, lee los registros, encuentra la causa raíz (p. ej. un conflicto de puerto) y la corrige.

### 4.3 Reiniciar un servicio

> "Reinicia el portal de administración para que mi cambio en server.js surta efecto."

El agente ejecuta `docker restart admin-portal`. Nota: un cambio en el **backend** (`server.js`) requiere reiniciar el contenedor; un cambio en el **frontend** (`index.html`) solo requiere refrescar el navegador.

### 4.4 Revisar registros

> "Muéstrame las últimas 50 líneas del registro del runner de Gitea y dime si hay errores."

### 4.5 Gestionar la sincronización de DSH Desktop (Gitea)

> "Dispara el workflow dsh-sync y muéstrame su progreso: fase, archivos descargados, MB, ETA."

El agente llama a la API de Gitea para disparar el workflow, luego consulta el estado de ejecución y lee `sync-progress.json`.

### 4.6 Cambiar el Centro de Administración de IA

> "Añade paginación a la lista de repositorios de Gitea: 10 por página, ajustable."

El agente edita `index.html`, valida el JavaScript y (para cambios de backend) reinicia el contenedor. Luego tú haces un refresco forzado (Ctrl+F5).

### 4.7 Gestionar el portal Ghost

> "Importa el contenido de ejemplo en el portal, con la dirección 192.168.1.100 y en chino."

El agente pregunta la dirección de publicación y el idioma, y luego ejecuta `ghost-content-import.ps1`. También puede corregir temas, editar páginas y cambiar la navegación directamente en la base.

### 4.8 Copias de seguridad y restauración

> "Ejecuta una copia de seguridad completa ahora y confirma que se ha realizado."

### 4.9 Publicar una versión en GitHub

> "Publica una nueva versión v0.7 con el mensaje 'feat: …'."

El agente ejecuta `publish.ps1 -Version v0.7 -CommitMessage "…"`. Nota: `git push` necesita que el proxy o la credencial de GitHub estén disponibles; si el push falla por red, el agente te pedirá abrir el proxy.

### 4.10 Limpiar espacio en disco

> "Muéstrame qué ocupa el espacio en disco de Docker y qué se puede eliminar sin riesgo."

El agente escanea (`docker system df`, imágenes no usadas, volúmenes, copias antiguas) y lista los candidatos — **solo elimina después de que confirmes cuáles.**

---

## 5. Buenas prácticas y trampas

- **Recarga frontend vs backend.** En el Centro de Administración de IA, los cambios de `index.html` surten efecto al refrescar el navegador (el archivo está montado como volumen); los cambios de `server.js` requieren `docker restart admin-portal` — un simple `docker compose up -d` **no** recarga el código montado como volumen.
- **Fuerza el refresco** (Ctrl+F5) cuando la interfaz parezca no cambiar: a menudo hay JavaScript antiguo en caché.
- **Nunca versiones secretos ni IPs reales.** Usa marcadores (p. ej. `<服务器IP>`, `CHANGE_ME_*`). `publish.ps1` limpia automáticamente las contraseñas de `server.js`.
- **Verifica, no creas a ciegas.** Pide al agente que demuestre los resultados con comandos (códigos HTTP, `ls`, líneas de registro), sobre todo si dice «ya está arreglado».
- **Haz copia antes de cambios destructivos.** El agente debe respaldar la base de Ghost o la configuración antes de editarla, y confirmar contigo antes de borrar nada.
- **Pregunta idioma y dirección antes de importar contenido.** El agente debe preguntar primero la dirección de publicación y el idioma objetivo.
- **Red y proxy.** Algunos pasos (push a GitHub, búsquedas web) necesitan el proxy (p. ej. `127.0.0.1:33210`) o salida a internet. Si falla un paso de red, abre el proxy y reintenta.

---

## 6. Referencia rápida de comandos

| Acción | Comando |
|---|---|
| Listar contenedores | `docker ps -a` |
| Registros de un contenedor | `docker logs <nombre> --tail 100` |
| Reiniciar un servicio | `docker restart <nombre>` |
| Iniciar todos los servicios | `docker compose up -d` |
| Estado de Compose | `docker compose ps` |
| Disparar la sincronización de Gitea | `POST /api/v1/repos/<user>/dsh-sync/actions/workflows/sync.yml/dispatches` |
| Ejecutar una copia | `powershell .\scripts\backup.ps1` |
| Publicar una versión | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
