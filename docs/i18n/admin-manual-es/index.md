# AI AllInOne Manual del administrador

*v0.2 · Implementación · Administración · Operaciones*

Este manual se divide en tres partes: **Implementación** (capítulos 1–13, puesta en marcha de la plataforma desde cero), **Administración** (capítulos 14–26, operaciones diarias de los 13 productos) y **Operaciones** (capítulos 27–29, copias de seguridad / comprobaciones de salud / resolución de problemas), además de un **Apéndice** con enlaces a la documentación de los proveedores. Cada capítulo tiene navegación anterior/siguiente al final de la página: léalo de principio a fin o salte directamente al tema que necesite.

## Parte I · Implementación

| # | Capítulo | Descripción |
| --- | --- | --- |
| 1 | [Descripción general y arquitectura de la plataforma](ch01-overview.md) | Entender la composición, los puertos y el flujo de datos de esta plataforma es la base de todas las operaciones posteriores de implementación y administración. |
| 2 | [Preparación previa](ch02-prereq.md) | Instalar Docker Desktop, preparar los directorios, abrir la red y fijar la IP — lo que hay que completar antes de implementar. |
| 3 | [Archivos de configuración y variables de entorno](ch03-env.md) | Tres archivos de configuración principales + la explicación completa de las variables de entorno: cuáles se configuran ahora y cuáles después. |
| 4 | [Iniciar los servicios principales](ch04-start.md) | Copiar .env, levantar los contenedores, verificar la accesibilidad de cada servicio y resolver el problema conocido de SQLite de Ghost. |
| 5 | [Implementación independiente de Dify](ch05-dify-deploy.md) | Dify se implementa de forma independiente con el compose oficial (unos 15 contenedores) para evitar conflictos de puertos. |
| 6 | [Keycloak: Realm, usuarios y AD](ch06-keycloak.md) | Crear el Realm, crear cuentas locales o importar cuentas de dominio desde Active Directory — la base del SSO de todos los productos. |
| 7 | [NewAPI: inicialización, canales y OIDC](ch07-newapi.md) | Completar el asistente de instalación inicial, configurar el canal que apunta a LiteLLM, emitir API Keys e integrar Keycloak OIDC. |
| 8 | [LiteLLM: verificación y caché](ch08-litellm.md) | Verificar que el proxy de LiteLLM funciona y activar la caché de respuestas para ahorrar tokens. |
| 9 | [Configuración de Dify / Ghost / Gitea](ch09-products.md) | Inicialización y configuración de interconexión de cada uno de los tres productos. |
| 10 | [Distribución de DSH Desktop y CI/CD](ch10-dsh.md) | Distribuir el instalador de DSH Desktop a los empleados y sincronizar automáticamente las nuevas versiones oficiales con Gitea Actions. |
| 11 | [MCP Gateway y el mercado de Skills](ch11-mcp.md) | Gateway para gestionar de forma centralizada las Skills y las herramientas MCP; DSH Desktop/Dify obtienen todas las herramientas conectando una única dirección. |
| 12 | [Centro de administración de IA](ch12-admin-center.md) | Portal unificado de administración: autenticación con Keycloak, menú lateral que integra todos los productos y estado del clúster en el Dashboard. |
| 13 | [Lista de verificación de interconexión](ch13-interconnect.md) | Una vez terminada la implementación, confirma uno a uno que las 12 cadenas de interconexión quedan operativas. |

## Parte II · Administración (operaciones diarias de cada producto)

| # | Capítulo | Descripción |
| --- | --- | --- |
| 14 | [Administración diaria de Keycloak](ch14-ops-keycloak.md) | El centro de autenticación: gestiona usuarios, roles, clientes OIDC, federación AD y sesiones. |
| 15 | [Administración diaria de NewAPI](ch15-ops-newapi.md) | El gateway de LLM: gestiona canales, tokens, cuotas, usuarios, registros y costos. |
| 16 | [Administración diaria de LiteLLM](ch16-ops-litellm.md) | Proxy de enmascaramiento de PII: lista de modelos, reglas de enmascarado, caché e informes a Langfuse. |
| 17 | [Administración diaria de Dify](ch17-ops-dify.md) | Plataforma de aplicaciones de IA: aplicaciones, bases de conocimiento, proveedores de modelos, permisos de miembros y publicación. |
| 18 | [Administración diaria de Ghost](ch18-ops-ghost.md) | Portal corporativo / Hub: artículos, páginas, navegación, temas y miembros. |
| 19 | [Administración diaria de Gitea](ch19-ops-gitea.md) | Git interno + CI/CD: repositorios, organizaciones, Runners y Actions. |
| 20 | [Administración diaria de MCP Gateway](ch20-ops-mcp.md) | Altas y bajas de MCP Server, subir/eliminar Skills y ampliar las herramientas integradas. |
| 21 | [Administración del servidor de actualización](ch21-ops-update.md) | Alojamiento del instalador de DSH Desktop y actualización automática. |
| 22 | [Administración de monitoreo y alertas](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager: monitoreo de recursos de contenedores y notificaciones de alerta. |
| 23 | [Observabilidad de LLM (Langfuse)](ch23-ops-langfuse.md) | Rastrear el prompt, la respuesta, la latencia, los tokens y el costo de cada llamada al modelo. |
| 24 | [Registro unificado (Loki)](ch24-ops-loki.md) | Agrega los registros de todos los contenedores y permite buscar por contenedor + palabra clave + tiempo. |
| 25 | [Enmascaramiento de PII (Presidio)](ch25-ops-pii.md) | La información sensible se enmascara automáticamente antes de salir de la intranet. |
| 26 | [Receptor de correo MailHog](ch26-ops-mailhog.md) | La «salida de correo» cuando la intranet no tiene SMTP, para recibir los códigos de verificación y los correos de notificación de Ghost. |

## Parte III · Operaciones

| # | Capítulo | Descripción |
| --- | --- | --- |
| 27 | [Copia de seguridad y restauración](ch27-backup.md) | Copia de seguridad diaria de todos los datos y restauración con un clic. |
| 28 | [Verificación de estado y autocomprobación de arranque](ch28-healthcheck.md) | Revisión con un clic de los 41 contenedores + toda la cadena LLM + la cadena de autenticación. |
| 29 | [Manual de resolución de problemas](ch29-troubleshooting.md) | Consulta rápida por síntoma para localizar la causa raíz. |

## Apéndice

| # | Capítulo | Descripción |
| --- | --- | --- |
| Apéndice | [Índice de documentación oficial](ch30-appendix.md) | Direcciones de la documentación oficial de todos los productos de terceros (URL en texto plano, para poder acceder incluso tras imprimir). |

---

> 🌐 Otros idiomas：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · [繁體中文](../admin-manual-zh-TW/index.md) · [Français](../admin-manual-fr/index.md) · Español · [Português](../admin-manual-pt/index.md) · [日本語](../admin-manual-ja/index.md) · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
