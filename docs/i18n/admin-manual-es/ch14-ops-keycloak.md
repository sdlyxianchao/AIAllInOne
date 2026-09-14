# Capítulo 14: Administración diaria de Keycloak

*Parte II · Administración (operaciones diarias de cada producto)*

> El centro de autenticación: gestiona usuarios, roles, clientes OIDC, federación AD y sesiones.

[← Capítulo 13: Lista de verificación de interconexión](ch13-interconnect.md) · [📖 Índice](index.md) · [Capítulo 15: Administración diaria de NewAPI →](ch15-ops-newapi.md)

---

**Entrada**: `http://<IP-del-servidor>:9090` → Administration Console → iniciar sesión como administrador.

> 📌 Muchas de estas operaciones también pueden hacerse desde el AI Admin Center → página Keycloak (solo admin global): sincronización LDAP completa/incremental, eliminar usuarios y gestión de roles (listar/crear/eliminar/ver miembros). Ver capítulo 12.6.

## 14.1 Gestionar usuarios

1. **Nuevo usuario**: Users → Add user → rellena el nombre de usuario → Create;

2. **Establecer contraseña**: pestaña Credentials de ese usuario → establece la contraseña → desactiva Temporary (de lo contrario obliga a cambiarla en el primer inicio);

3. **Restablecer contraseña**: Users → busca el usuario → Credentials → Set password;

4. **Desactivar/activar**: interruptor Enabled en la parte superior del detalle del usuario (al desactivarlo, todos los SSO de ese usuario dejan de funcionar de inmediato);

5. **Eliminar**: detalle del usuario → Delete.

## 14.2 Roles y permisos

- **Realm Role**: Realm roles → Create role para crear un rol (como `ai-platform-admin`);

- **Asignar rol**: usuario → Role mapping → Assign role;

- **Grupos**: Groups → crea un grupo (`ai-admin` / `ai-user`) → añade usuarios al grupo; asigna el rol al grupo y los usuarios heredan los permisos del grupo.

> ✅ Los permisos de administración se controlan unificados por el rol `ai-platform-admin`; al conectar cada producto con SSO se usa este rol para identificar a los administradores.

## 14.3 Clientes OIDC (conectar un producto nuevo con SSO)

1. Clients → Create client → en Client ID pon el nombre del producto (como `newapi` / `grafana` / `langfuse`);

2. Client authentication: On (si no, no aparece la pestaña Credentials), Standard flow: On;

3. En Valid redirect URIs / Web origins pon la dirección de callback del producto (añade tanto la IP de intranet como 127.0.0.1);

4. Guarda → copia el Client secret en la pestaña Credentials y pásalo al lado del producto.

## 14.4 Mantenimiento de la federación AD / LDAP

- **Cambiar controlador de dominio/contraseña**: User Federation → haz clic en el LDAP Provider → cambia Connection URL / Bind credentials → Save;

- **Sincronización manual**: Synchronize all users;

- **Mapeo de grupos**: pestaña Mappers → group-ldap-mapper → en Groups DN pon el contenedor de los grupos de AD para mapear los grupos de AD a roles de Keycloak.

## 14.5 Gestión de sesiones

- **Ver sesiones activas**: Users → un usuario → Sessions;

- **Forzar cierre de sesión**: Sessions → Sign out all;

- **Configuración global de sesiones/tokens**: Realm settings → pestañas Sessions / Tokens para ajustar los tiempos de expiración.

> ⚠️ Repaso de puntos críticos: ① el CN del bind DN con espacios se conserva tal cual; ② Username LDAP attribute usa `sAMAccountName`, no `cn`; ③ Search scope en Subtree; ④ el SSO con `unknown_error` suele deberse a que el servicio iphlpsvc del host no está en marcha y falla el reenvío de puertos de AD; ⑤ si la VM del controlador de dominio AD está apagada, el inicio de sesión de las cuentas federadas LDAP da `LDAP Connection refused`.

> 📖 Documentación oficial:Documentación oficial de Keycloak https://www.keycloak.org/documentation · Guía de administración del servidor https://www.keycloak.org/server/

---

[← Capítulo 13: Lista de verificación de interconexión](ch13-interconnect.md) · [📖 Índice](index.md) · [Capítulo 15: Administración diaria de NewAPI →](ch15-ops-newapi.md)
