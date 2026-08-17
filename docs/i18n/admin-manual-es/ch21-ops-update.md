# Capítulo 21: Administración del servidor de actualización

*Parte II · Administración (operaciones diarias de cada producto)*

> Alojamiento del instalador de DeepChat y actualización automática.

[← Capítulo 20: Administración diaria de MCP Gateway](ch20-ops-mcp.md) · [📖 Índice](index.md) · [Capítulo 22: Administración de monitoreo y alertas →](ch22-ops-monitoring.md)

---

**Entrada**: `http://<IP-del-servidor>:8091`; los datos están en `deepchat-updates/`.

## 21.1 Colocar una versión nueva manualmente

1. Descarga el instalador oficial de DeepChat a `deepchat-updates/deepchat/`;

2. Actualiza `version.txt` (escribe el nuevo número de versión);

3. En el lado del empleado, DeepChat comprueba `version.txt` en la actualización automática y descarga e instala al detectar la versión nueva.

## 21.2 Sincronización automática (recomendado)

Se apoya en las Gitea Actions del repositorio `deepchat-sync`, que cada día comprueba automáticamente las versiones nuevas en GitHub y las sincroniza (ver capítulo 10). Disparo manual:

```
curl -X POST "http://<IP-del-servidor>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<contraseña>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 Configuración de la sincronización (sync-config.json)

| Campo | Función |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Prefijo de aceleración de descarga (como ghproxy.com) |
| `keep_releases` | Número de versiones históricas que se conservan |
| `market_url` | Dirección del mercado del «administrador de habilidades» de la página de descargas |

> 📌 Si el cliente de DeepChat informa de «tiempo de conexión del modelo agotado», normalmente es porque el cliente pasa por un proxy del sistema caído (`ECONNREFUSED 127.0.0.1:33210`). Pide al usuario que en «Configuración → Red/Proxy» de DeepChat elija «No usar proxy / conexión directa».

> 📖 Documentación oficial:Inicio rápido de DeepChat https://deepchatai.cn/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/ThinkInAIXYZ/deepchat

---

[← Capítulo 20: Administración diaria de MCP Gateway](ch20-ops-mcp.md) · [📖 Índice](index.md) · [Capítulo 22: Administración de monitoreo y alertas →](ch22-ops-monitoring.md)
