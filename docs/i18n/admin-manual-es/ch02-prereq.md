# Capítulo 2: Preparación previa

*Parte I · Implementación*

> Instalar Docker Desktop, preparar los directorios, abrir la red y fijar la IP — lo que hay que completar antes de implementar.

[← Capítulo 1: Descripción general y arquitectura de la plataforma](ch01-overview.md) · [📖 Índice](index.md) · [Capítulo 3: Archivos de configuración y variables de entorno →](ch03-env.md)

---

## 2.0 Dos formas de implementar

Este manual puede ejecutarse **capítulo a capítulo de forma manual** o **delegarse a una herramienta de Agente de IA para su ejecución automática**. Al usar un Agente, proporciónale este directorio (incluido este manual, `docker-compose.yml`, `.env.example`, `scripts/`) y pega el siguiente prompt.

> **Prompt de implementación para copiar al Agente:**
> Eres el ingeniero de implementación de una plataforma de IA para la intranet corporativa. Según la parte de implementación del «Manual del administrador» de este directorio, docker-compose.yml y .env.example, implementa y verifica por completo la plataforma «AI AllInOne» en esta máquina. Comunícate siempre en español.
>
> Paso 1 — Recopila los parámetros (pregúntame uno a uno, sin saltarte ninguno y sin adivinar):
> 1) la IP de intranet para los servicios externos; 2) el host del mercado de Skills (dominio; sustituye <host-del-mercado> en mcp-gateway/skills/skill-market/config.json y SKILL.md, y resuélvelo en hosts/DNS); 3) la fuente de identidad (si se conecta a un controlador de dominio AD, se necesitan dominio / IP del DC / base DN de LDAP / bind DN / contraseña de bind / sAMAccountName); 4) la contraseña unificada de la cuenta de administrador; 5) la API Key del modelo grande; 6) según sea necesario, pregunta por el webhook de alertas, HTTPS y la política de retención de copias de seguridad.
>
> Paso 2 — Genera un archivo de progreso y actualízalo e informa cada vez que completes un elemento o resuelvas un problema.
>
> Paso 3 — Ejecuta estrictamente en el orden de los capítulos 1~13 de este manual, prestando atención a los «⚠️ puntos críticos» de cada capítulo, y prioriza la automatización con los scripts de scripts/.
>
> Paso 4 — Ante un error, revisa primero los registros (docker logs, endpoints de salud, configuración) para localizar la causa raíz antes de corregir; no reintentes a ciegas.
>
> Paso 5 — Verificación de todo el flujo: todos los contenedores Up, SSO de Keycloak, enviar una conversación real a través de NewAPI/LiteLLM para verificar el enmascaramiento de PII, inicio de sesión con la fuente de identidad, monitoreo/registros/alertas, copia de seguridad y restauración; resume cada elemento con ✅/❌.

> 💡 Si no usas un Agente, el texto anterior también sirve como «lista de verificación de información antes de implementar»: define primero la IP de intranet, la fuente de identidad, la contraseña del administrador y la Key del modelo.

## 2.1 Instalar y configurar Docker Desktop

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

## 2.2 Preparar la estructura de directorios

```
# PowerShell
mkdir dsh-updates
```

```
C:\ai-platform\windows\          # Directorio raíz de implementación supuesto
├─ docker-compose.yml           # Orquestación de los servicios principales
├─ .env.windows                 # Variables de entorno (hay que rellenar la API Key)
├─ litellm-config.yaml          # Configuración de enmascaramiento de PII de LiteLLM
├─ dsh-updates\            # Directorio de alojamiento del instalador de DSH Desktop
├─ admin-portal\                # Implementación del Centro de administración de IA
├─ mcp-gateway\                 # Gateway de Skill / MCP
├─ monitoring\                  # Configuración de Prometheus / Loki
└─ scripts\                     # Scripts de copia de seguridad / restauración / verificación de salud / inicialización
```

## 2.3 Crear la red compartida de Docker

```
docker network create ai-platform
docker network ls | findstr ai-platform   # verificación
```

> Todos los contenedores principales se comunican entre sí por nombre de contenedor a través de la red `ai-platform` (por ejemplo, NewAPI accede a LiteLLM mediante `http://litellm:4000`, sin pasar por localhost).

## 2.4 Fijar la IP de intranet del host (importante)

Cuando el host usa WiFi, la IP la asigna dinámicamente el DHCP y cambia al reiniciar o al vencer la concesión; si cambia, las direcciones con las que los empleados acceden a cada producto dejan de funcionar. Se recomienda hacer una **reserva DHCP (vinculación de MAC)** en el router:

1. Consulta la MAC de la tarjeta WiFi: `ipconfig /all`, busca la dirección física de «Adaptador de LAN inalámbrica WLAN» (por ejemplo `60-A3-E3-41-8F-61`);

2. Entra al panel del router (por ejemplo `http://192.168.31.1`) → Configuración de LAN / Asignación de IP estática DHCP;

3. Añade la regla: MAC → IP (por ejemplo `192.168.31.117`) y guarda;

4. Reconecta el WiFi y confirma que la IP queda fija.

> ✅ La reserva DHCP es más estable que configurar una IP estática en Windows (gestión unificada por el router, sin conflictos).

## 2.5 Abrir la red (el paso donde más se atasca la gente)

- **Poder conectar con los registros de imágenes de Docker**: Docker Hub / quay.io / ghcr.io. Si no hay conexión, configura antes un acelerador de imágenes (como DaoCloud).

- **Poder conectar con GitHub**: clonar repositorios y descargar dependencias públicas. Si no hay conexión, usa un proxy o descarga previamente el paquete de código fuente.

- **Que la máquina destino sea accesible desde la intranet**: confirma que el segmento de red a exponer es alcanzable.

---

[← Capítulo 1: Descripción general y arquitectura de la plataforma](ch01-overview.md) · [📖 Índice](index.md) · [Capítulo 3: Archivos de configuración y variables de entorno →](ch03-env.md)
