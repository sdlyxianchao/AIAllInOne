# Capítulo 4: Iniciar los servicios principales

*Parte I · Implementación*

> Copiar .env, levantar los contenedores, verificar la accesibilidad de cada servicio y resolver el problema conocido de SQLite de Ghost.

[← Capítulo 3: Archivos de configuración y variables de entorno](ch03-env.md) · [📖 Índice](index.md) · [Capítulo 5: Implementación independiente de Dify →](ch05-dify-deploy.md)

---

## 4.1 Copiar .env

```
# PowerShell
copy .env.windows .env
```

Docker Compose lee `.env` por defecto.

## 4.2 Iniciar todos los servicios principales

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

## 4.3 Comprobar el estado de los contenedores

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Se espera que los 10 contenedores principales estén todos `Up`. Si algún contenedor se mantiene en `Restarting`, ejecuta `docker logs nombre-del-contenedor` para ver la causa.

## 4.4 Corrección de un problema conocido: forzar SQLite en Ghost

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

## 4.5 Verificar la accesibilidad de cada servicio

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

---

[← Capítulo 3: Archivos de configuración y variables de entorno](ch03-env.md) · [📖 Índice](index.md) · [Capítulo 5: Implementación independiente de Dify →](ch05-dify-deploy.md)
