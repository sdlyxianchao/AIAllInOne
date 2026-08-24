# Capítulo 10: Distribución de DSH Desktop y CI/CD

*Parte I · Implementación*

> Distribuir el instalador de DSH Desktop a los empleados y sincronizar automáticamente las nuevas versiones oficiales con Gitea Actions.

[← Capítulo 9: Configuración de Dify / Ghost / Gitea](ch09-products.md) · [📖 Índice](index.md) · [Capítulo 11: MCP Gateway y el mercado de Skills →](ch11-mcp.md)

---

## 10.1 Cadena de distribución

Cadena de distribución = instalador de GitHub Releases → Gitea Actions del repositorio `dsh-sync` → servidor de actualización (:8091) → página de descargas de Ghost → descarga por parte del empleado.

> 📌 Se eliminó el repositorio mirror del código fuente de `dsh` — el mirror solo sincroniza el código fuente de git, no los instaladores de release, por lo que no sirve para la distribución. Si vas a hacer auditoría de código o desarrollo secundario, créalo aparte.

## 10.2 Descargar el instalador al servidor de actualización

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

Verificación: `curl -I http://<IP-del-servidor>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206. Después actualiza la página de descargas de Ghost (ver capítulo 9).

## 10.3 Sincronización automática (Gitea Actions, recomendado)

| Componente | Descripción |
| --- | --- |
| Repositorio `dsh-sync` | Repositorio normal (no puede ser mirror); contiene `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Disparador | `schedule` (todos los días a las 2 UTC) + `workflow_dispatch` (manual) |
| Lógica | Consulta el último tag de GitHub → lo compara con `version.txt` → si hay versión nueva descarga + actualiza la página de descargas de Ghost + escribe la versión |

```
# Disparar una vez manualmente
curl -X POST "http://<IP-del-servidor>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<contraseña>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ Puntos críticos: ① el `container.network` del act_runner debe configurarse mediante `config.yaml` (+ la variable de entorno `CONFIG_FILE`); de lo contrario, el contenedor del job no resuelve el hostname `gitea`; ② el runner monta automáticamente docker.sock, no lo montes de nuevo en options (da Duplicate mount point).

## 10.4 Configuración de la fuente de descarga en China (sync-config.json)

Los instaladores de la página de descargas del sitio oficial `www.dshdesktop.com` siguen apuntando a GitHub y en China prácticamente no se descargan. La solución real está en `sync-config.json`:

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

## 10.5 Opción B: compilar una versión personalizada con Docker (opcional)

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# dentro del contenedor
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# el resultado está en dist/; al salir cópialo a dsh-updates/
```

## 10.6 Configurar el cliente DSH Desktop (lado del empleado)

1. DSH Desktop → Configuración → Servicio de modelos → Provider personalizado / compatible con OpenAI;

2. API Base URL: `http://<IP-del-servidor>:3000/v1` (obligatorio con IP de intranet);

3. API Key: el `sk-xxx` de `dsh-key`;

4. Modelo: `deepseek-chat`; guarda y prueba una conversación.

> 📖 Documentación oficial:Inicio rápido de DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/dataelement/dsh-desktop

---

[← Capítulo 9: Configuración de Dify / Ghost / Gitea](ch09-products.md) · [📖 Índice](index.md) · [Capítulo 11: MCP Gateway y el mercado de Skills →](ch11-mcp.md)
