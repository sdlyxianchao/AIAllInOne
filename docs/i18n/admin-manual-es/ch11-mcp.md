# Capítulo 11: MCP Gateway y el mercado de Skills

*Parte I · Implementación*

> Gateway para gestionar de forma centralizada las Skills y las herramientas MCP; DeepChat/Dify obtienen todas las herramientas conectando una única dirección.

[← Capítulo 10: Distribución de DeepChat y CI/CD](ch10-deepchat.md) · [📖 Índice](index.md) · [Capítulo 12: Centro de administración de IA →](ch12-admin-center.md)

---

> 📌 MCP Gateway se basa en el `@modelcontextprotocol/sdk` oficial, expone el endpoint estándar Streamable HTTP `/mcp`, ya está integrado en el `docker-compose.yml` principal (puerto 3100) y arranca junto a los servicios principales. El código fuente está en `mcp-gateway/`.

## 11.1 Herramientas integradas de la plataforma

| Herramienta | Uso |
| --- | --- |
| `platform_time` | Devuelve la hora actual del servidor |
| `platform_echo` | Hace eco del texto (prueba de conectividad) |
| `platform_services` | Lista el inventario de servicios de la plataforma |

## 11.2 Agregar servidores MCP externos

Edita `mcp-gateway/mcp-servers.json`, añade tipos stdio o http y reinicia `mcp-gateway` para que surta efecto:

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

Las herramientas agregadas reciben automáticamente el prefijo `{serverName}_` para evitar nombres duplicados.

## 11.3 Conexión de clientes

1. DeepChat: Configuración → MCP → añadir servidor → tipo «HTTP transmitible», URL `http://<IP-del-servidor>:3100/mcp`;

2. Flujo de trabajo de Dify: configura la herramienta personalizada / herramienta MCP apuntando a la misma dirección.

> Verificación: `curl http://<IP-del-servidor>:3100/health` devuelve `{"status":"ok"}`; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` devuelve la lista de herramientas.

## 11.4 Mercado de Skills (distribución de paquetes de habilidades en la intranet)

| Endpoint | Función |
| --- | --- |
| `/market` | Página del mercado de Skills (navegación por tarjetas + descarga de ZIP + copiar dirección de instalación) |
| `/skills` | Inventario de habilidades en JSON (name/description/version) |
| `/skills/<nombre>.zip` | Descarga del paquete de habilidad (empaquetado dinámico) |

Las habilidades se colocan en el directorio `mcp-gateway/skills/` (subdirectorios que contienen SKILL.md) y **se escanean automáticamente en cada petición, sin necesidad de reiniciar**. Incluye la habilidad de arranque `skill-market`.

> 📌 En DeepChat, MCP y Skill son dos conceptos distintos: MCP es una «herramienta» (function calling) y Skill es un «paquete de habilidades de agente» (SKILL.md + scripts). La Skill de DeepChat no tiene una «URL de mercado personalizada»; solo admite tres formas de instalación: carpeta/ZIP/URL; la distribución en la intranet se logra de forma indirecta con la «instalación por URL».

## 11.5 ⚠️ Host del mercado de Skills (parámetro de implementación, debe sustituirse)

El «administrador de habilidades» lee el `market_url` de `config.json` para pedir el inventario `/skills`. Dos puntos clave:

- **Usar hostname, no IP**: el entorno de agente de DeepChat enmascara la IP como `[IP_ADDRESS_REDACTED]`, por lo que no se lee la dirección real;

- **El hostname es un parámetro de implementación**: cada despliegue es distinto; no se puede copiar tal cual.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<host-del-mercado>:3100" }
```

#### Automático (implementar con Agente)

Al recopilar parámetros, el Agente pregunta por el «host del mercado de Skills» y sustituye automáticamente `<host-del-mercado>` en `config.json` y `SKILL.md`.

#### Manual

1. Edita `config.json` + la dirección de respaldo de `SKILL.md` y sustituye `<host-del-mercado>`;

2. Haz que el hostname sea resoluble: en una sola máquina, añade `<IP-del-servidor> <hostname>` en `C:\Windows\System32\drivers\etc\hosts`; en la intranet corporativa, añade un registro A en el DNS.

> ✅ Se recomienda usar un FQDN de «nombre de servicio + dominio de empresa» como hostname, por ejemplo `skillmarket.tu-dominio-empresa`. Para añadir el registro A en el DNS: controlador de dominio → «DNS → Zona de búsqueda directa → tu dominio → nuevo host (A)», o usa `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "tu-dominio" -IPv4Address "<IP-del-servidor>"`.

## 11.6 API de administración (para que el Centro de administración de IA haga altas, bajas y modificaciones)

| Endpoint | Función |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | Alta, baja, modificación y consulta de MCP Servers (escribe la configuración + reconexión automática) |
| `POST /api/skills/upload` | Subir un zip de habilidad (valida SKILL.md, evita path traversal) |
| `DELETE /api/skills/:name` | Eliminar una habilidad |

Requiere la cabecera `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`). El Centro de administración de IA lo llama por proxy desde la página «MCP Gateway» (protegida por el rol `ai-platform-admin`).

> 📖 Documentación oficial:Sitio oficial del protocolo MCP https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Capítulo 10: Distribución de DeepChat y CI/CD](ch10-deepchat.md) · [📖 Índice](index.md) · [Capítulo 12: Centro de administración de IA →](ch12-admin-center.md)
