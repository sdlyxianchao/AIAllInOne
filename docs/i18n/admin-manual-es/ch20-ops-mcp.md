# Capítulo 20: Administración diaria de MCP Gateway

*Parte II · Administración (operaciones diarias de cada producto)*

> Altas y bajas de MCP Server, subir/eliminar Skills y ampliar las herramientas integradas.

[← Capítulo 19: Administración diaria de Gitea](ch19-ops-gitea.md) · [📖 Índice](index.md) · [Capítulo 21: Administración del servidor de actualización →](ch21-ops-update.md)

---

**Entrada**: `http://<IP-del-servidor>:3100` (página del mercado `/market`). La administración se hace desde la página «MCP Gateway» del Centro de administración de IA (rol `ai-platform-admin`), o directamente llamando a la API de administración.

## 20.1 Gestionar MCP Server

1. Edita `mcp-gateway/mcp-servers.json` para añadir o quitar servidores (tipos stdio/http);

2. Reinicia con `docker compose restart mcp-gateway`;

3. O hazlo desde la página MCP Gateway del Centro de administración de IA (escribe la configuración + reconexión automática).

## 20.2 Gestionar Skills (paquetes de habilidades)

1. **Subir**: página MCP Gateway del Centro de administración de IA → subir zip de habilidad (valida que contenga SKILL.md, evita path traversal);

2. **Eliminar**: elimina la habilidad correspondiente;

3. Las habilidades se colocan en `mcp-gateway/skills/` (subdirectorios con SKILL.md); se escanean automáticamente en cada petición, sin reiniciar.

## 20.3 Ampliar las herramientas integradas

En `mcp-gateway/gateway.js` añade dos pasos:

```
// ① Definición de herramienta (añade una entrada al array builtinTools)
{ name: 'platform_health', description: 'Consultar el estado de salud del servicio',
  inputSchema: { type: 'object', properties: {} } }

// ② Lógica de ejecución (añade una rama en callBuiltin)
if (name === 'platform_health') { return 'Todos los servicios funcionan correctamente'; }
```

Tras el cambio, `docker compose restart mcp-gateway`.

## 20.4 Mantener la dirección del mercado skill-market

El `market_url` del «administrador de habilidades» está en `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`; debe usar hostname (no IP) y es un parámetro de implementación (ver capítulo 11).

> ⚠️ La API de administración requiere la cabecera `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`); sin configurar devuelve 503 y con token incorrecto devuelve 401.

> 📖 Documentación oficial:Sitio oficial del protocolo MCP https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Capítulo 19: Administración diaria de Gitea](ch19-ops-gitea.md) · [📖 Índice](index.md) · [Capítulo 21: Administración del servidor de actualización →](ch21-ops-update.md)
