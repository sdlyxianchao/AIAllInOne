# Capítulo 29: Manual de resolución de problemas

*Parte III · Operaciones*

> Consulta rápida por síntoma para localizar la causa raíz.

[← Capítulo 28: Verificación de estado y autocomprobación de arranque](ch28-healthcheck.md) · [📖 Índice](index.md) · [Capítulo Apx.: Índice de documentación oficial →](ch30-appendix.md)

---

## 29.1 Tres pasos de diagnóstico general

1. **Ver el estado de los contenedores**: `docker ps -a` para encontrar Exited/Restarting;

2. **Ver registros**: `docker logs <nombre-del-contenedor> --tail 30`;

3. **Ver la comprobación de salud**: ejecuta `health-check.ps1` para localizar la etapa que falla.

## 29.2 Tabla de referencia rápida de síntomas

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

## 29.3 Comandos frecuentes

```
docker ps -a                                        # estado de todos los contenedores
docker logs <contenedor> --tail 50                   # ver registros
docker compose up -d <servicio>                      # reconstruir un servicio
docker compose restart <servicio>                    # reiniciar un servicio (no relee .env)
docker system df                                     # uso de disco de Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # revisión con un clic
```

---

[← Capítulo 28: Verificación de estado y autocomprobación de arranque](ch28-healthcheck.md) · [📖 Índice](index.md) · [Capítulo Apx.: Índice de documentación oficial →](ch30-appendix.md)
