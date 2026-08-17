# Capítulo 12: Centro de administración de IA

*Parte I · Implementación*

> Portal unificado de administración: autenticación con Keycloak, menú lateral que integra todos los productos y estado del clúster en el Dashboard.

[← Capítulo 11: MCP Gateway y el mercado de Skills](ch11-mcp.md) · [📖 Índice](index.md) · [Capítulo 13: Lista de verificación de interconexión →](ch13-interconnect.md)

---

> 📌 Posicionamiento: no es una plataforma de administración de Docker (1Panel/Portainer), sino un panel unificado orientado al administrador — autenticación con Keycloak + menú lateral con enlaces a todos los productos + estado del clúster en el Dashboard + cuenta unificada de administrador.

## 12.1 Capacidades principales

| Elemento del menú | Comportamiento | Descripción |
| --- | --- | --- |
| 📊 Panel general | Página integrada | 8 indicadores de negocio de productos + servicios Docker (agrupados por producto) + información del sistema |
| Ghost / Dify / Gitea / Keycloak | Página de estadísticas integrada | Primero ves estadísticas; solo al hacer clic en «Abrir panel» salta |
| 🔀 Administración de NewAPI | Página integrada | Canales/usuarios/claves + informe de costos + registro de auditoría |
| 🔌 MCP Gateway | Página de administración integrada | Altas y bajas de MCP Server, subir/eliminar Skills |
| 📈 Monitoreo / 🔍 Observabilidad | Nueva pestaña | Grafana :3030 / Langfuse :3010 |
| 📜 Registro unificado | Página integrada | Consultar Loki por contenedor + palabra clave + tiempo |
| 💾 Copia de seguridad y restauración | Página integrada | Lista de copias + copia inmediata + restauración con un clic |
| 🩺 Prueba de disponibilidad | Página integrada | Prueba de toda la cadena programada + manual |
| 📄 Generación de informes | Página integrada | Exportar .md con período personalizado |
| ⚙️ Configuración del sistema | Página integrada | 9 idiomas de interfaz + URL de entrada de productos |

## 12.2 Inicializar el Global Administrator

```
# Configuración en .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=ver la lista de cuentas y contraseñas
ADMIN_EMAIL=ai_all_in_one_admin@<dominio-empresa>
```

Tras arrancar, crea automáticamente el usuario `ai_all_in_one_admin` en Keycloak (si ya existe lo omite) y le asigna el Realm Role `ai-platform-admin`. Idea central: **una sola cuenta de Global Admin administra toda la plataforma**.

## 12.3 Implementación con Docker Compose

```
# Requisito previo: instalar dependencias primero (una vez)
cd admin-portal
npm install
cd ..
```

```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<IP-del-servidor>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<dominio-empresa>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<IP-del-servidor>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```

## 12.4 Configuración del cliente en Keycloak

1. Keycloak → enterprise-ai → Clients → Create;

2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow en On;

3. Valid Redirect URIs: `http://127.0.0.1:10086/*` y `http://<IP-del-servidor>:10086/*`;

4. Copia el Client Secret → rellena `KEYCLOAK_CLIENT_SECRET` de `.env` → `docker compose up -d admin-portal`;

5. Crea el Realm Role `ai-platform-admin` y asígnalo a `ai_all_in_one_admin`.

> ⚠️ Puntos clave de implementación / resolución de problemas:
> - La sesión del admin-portal se guarda en memoria; reconstruir el contenedor con `up -d` **borra la sesión de inicio** (hay que volver a iniciar sesión);
> - La portada `/` debe estar protegida por Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explícito); de lo contrario, sin iniciar sesión se renderiza un panel vacío;
> - Para las estadísticas de Dify usa el correo real del administrador (`ai_all_in_one_admin@<dominio-empresa>`, igual al admin global de AD);
> - **Tras modificar server.js debes ejecutar `docker restart admin-portal`**, no `up -d` (el cambio de contenido del archivo del volumen no dispara la reconstrucción).

## 12.5 Verificación

1. Abre `http://<IP-del-servidor>:10086` → salta automáticamente al inicio de sesión de Keycloak (sin iniciar sesión no muestra panel vacío);

2. Inicia sesión con `ai_all_in_one_admin` → entra al panel general;

3. El Dashboard muestra 8 indicadores de productos + grupos de contenedores;

4. Al hacer clic en cada producto ves primero las estadísticas y solo al hacer clic en «Abrir panel» salta;

5. En configuración del sistema puedes cambiar entre 9 idiomas.

## 12.6 Autorización de admin por módulo + gestión de la página Keycloak (v0.91)

El administrador global puede gestionar otros administradores y Keycloak desde el AI Admin Center:

- **Cuentas de administrador**: busca una cuenta existente en el IdP de Keycloak (usuarios AD/LDAP, sin cuenta nueva, sin contraseña) → elige módulos → confirma. El sistema asigna el Realm Role `admin:<producto>` y **aprovisiona realmente el producto** (SSO primero, API de respaldo): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Revocar un módulo o eliminar un admin **elimina la cuenta del producto**. Los productos sin SSO generan una contraseña temporal, visible con el icono 🔑 (solo admin global). Los no-admins ven un diálogo «No eres administrador» y se cierran sesión.

- **Página Keycloak**: botones «Sincronizar todo / Sinc. cambios» para traer cambios AD en un clic; cada fila tiene «Editar» (a la consola Keycloak) y «Eliminar»; la sección de roles permite crear/eliminar roles y ver miembros. Acciones de sync/eliminación/roles solo para admin global.

> ⚠️ Nota: Keycloak no tiene endpoint de «sincronizar usuario único» — la sincronización incremental trae todas las cuentas AD modificadas. Los usuarios federados AD reaparecen tras la próxima sincronización completa o su próximo inicio SSO; para eliminarlos permanentemente, desactiva/elimina la cuenta en AD.

---

[← Capítulo 11: MCP Gateway y el mercado de Skills](ch11-mcp.md) · [📖 Índice](index.md) · [Capítulo 13: Lista de verificación de interconexión →](ch13-interconnect.md)
