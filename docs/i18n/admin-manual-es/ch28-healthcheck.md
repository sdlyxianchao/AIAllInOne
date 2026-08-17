# Capítulo 28: Verificación de estado y autocomprobación de arranque

*Parte III · Operaciones*

> Revisión con un clic de los 41 contenedores + toda la cadena LLM + la cadena de autenticación.

[← Capítulo 27: Copia de seguridad y restauración](ch27-backup.md) · [📖 Índice](index.md) · [Capítulo 29: Manual de resolución de problemas →](ch29-troubleshooting.md)

---

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`; genera `health_check_<marca-de-tiempo>.log`. Cubre 41 contenedores (25 principales de Windows + 16 de Dify); las credenciales se leen de `.env`, sin contraseñas en el código.

## 28.1 Alcance de la revisión (9 etapas)

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

## 28.2 Ejecución manual

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ Si al final de la salida aparece `ALL CLEAR` y `Fail: 0`, todo está normal.

## 28.3 Arranque automático (tarea programada)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # retrasa 2 minutos tras el inicio de sesión para esperar a Docker + contenedores
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 Nota: el script usa `127.0.0.1` y no localhost; la salud interna de LiteLLM usa `/health/readiness` (sin autenticación); `docker-init_permissions-1` Exited(0) es normal; Update Server con 403 es normal (sin index.html por defecto); exit code 0 = aprobado, 1 = hay fallos.

---

[← Capítulo 27: Copia de seguridad y restauración](ch27-backup.md) · [📖 Índice](index.md) · [Capítulo 29: Manual de resolución de problemas →](ch29-troubleshooting.md)
