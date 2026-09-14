# Capítulo 6: Keycloak: Realm, usuarios y AD

*Parte I · Implementación*

> Crear el Realm, crear cuentas locales o importar cuentas de dominio desde Active Directory — la base del SSO de todos los productos.

[← Capítulo 5: Implementación independiente de Dify](ch05-dify-deploy.md) · [📖 Índice](index.md) · [Capítulo 7: NewAPI: inicialización, canales y OIDC →](ch07-newapi.md)

---

> 📌 Acceso: host `http://127.0.0.1:9090`, intranet `http://<IP-del-servidor>:9090`. Los datos se guardan en el volumen con nombre `keycloak-data` y no se pierden al reconstruir el contenedor. Las credenciales están en `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` de `.env.windows`.

## 6.1 Crear el Realm

1. Abre `http://127.0.0.1:9090` en el navegador → Administration Console → iniciar sesión como administrador;

2. Menú desplegable de la esquina superior izquierda → **Create Realm** → en Realm name pon `enterprise-ai` → Create.

## 6.2 Opción A: crear cuentas localmente (equipos pequeños sin AD / pruebas)

1. **Groups** → Create Group → `ai-admin`; luego crea `ai-user`;

2. **Users** → Add user → nombre de usuario → Create;

3. Pestaña Credentials → establece la contraseña → desactiva Temporary;

4. Pestaña Groups → únelo al grupo `ai-user`.

## 6.3 Opción B: importar cuentas desde Active Directory (recomendado)

Si la empresa ya tiene un controlador de dominio Windows AD, los empleados inician sesión con su cuenta de dominio sin necesidad de crear cuentas manualmente en Keycloak. Requisito previo: que la red entre el contenedor Docker y el controlador de dominio esté interconectada (la topología de red, Hyper-V Internal Switch y el reenvío de puertos se explican en la «Guía de integración de Keycloak con AD» `windows-ad-integration.html`).

> 📌 Cuentas de AD necesarias: la cuenta de servicio `svc_keycloak` (contraseña sin caducidad, para el enlace LDAP) + 2 usuarios de dominio de prueba (para verificar la sincronización).

### Crear la federación de usuarios LDAP

1. Realm enterprise-ai → a la izquierda **User Federation** → Add provider → **ldap**;

2. Rellena según la siguiente tabla.

| Configuración | Valor | Descripción |
| --- | --- | --- |
| Vendor | **Active Directory** | Elige AD, no Other (de lo contrario no se reconoce objectGUID) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V mediante reenvío de puertos; en producción pon `ldap://dc.dominio-empresa:389` |
| Enable StartTLS | **Off** | LDAP 389 o LDAPS 636 |
| Bind type | **simple** | Autenticación por usuario + contraseña |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Debe estar en formato LDAP DN**, no uses ~~DOMINIO\usuario~~ |
| Bind credentials | `contraseña de svc_keycloak` | Ver `.env.windows` |
| Edit mode | **READ_ONLY** | Solo lectura, no escribe en AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | Si hay sub-OU, cámbialo por `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **No pongas cn** |
| RDN LDAP attribute | `cn` | Atributo de nomenclatura de la entrada |
| UUID LDAP attribute | `objectGUID` | Identificador único inmutable de AD |
| User object classes | `person, organizationalPerson, user` | Separadas por comas |
| Search scope | **Subtree** | **No elijas One Level** (de lo contrario no encuentra las sub-OU) |
| Pagination | **On** | Descarga por lotes cuando hay muchos usuarios |
| Referral | **ignore** | Evita seguir a controladores de dominio inexistentes |
| Import users | **On** | Importación por sincronización completa |
| Sync Registrations | **On** | Sincronización inmediata en el primer inicio de sesión |

Save → **Synchronize all users** → espera a que termine la sincronización.

> ⚠️ Errores de rellenado frecuentes:
> - El Bind DN usa **formato LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), no ~~DOMINIO\usuario~~;
> - Username LDAP attribute = `sAMAccountName`, no `cn`;
> - Search scope = **Subtree**;
> - **El CN con espacios se conserva tal cual**: si el nombre mostrado lleva espacios (por ejemplo `ai all in one admin` tiene un espacio en medio), el Bind DN debe escribirse `CN=ai all in one admin,...`; si escribes guiones bajos no conectará.

### Verificar el inicio de sesión con AD

1. Abre en una ventana de incógnito `http://127.0.0.1:9090/realms/enterprise-ai/account`;

2. Inicia sesión con una cuenta de dominio (sirve tanto el nombre de usuario `aitest1` como el UPN `aitest1@<dominio-empresa>`);

3. Si redirige correctamente a Account Console, ha pasado la prueba.

## 6.4 Otras fuentes de identidad corporativas (resumen del apéndice N)

Keycloak admite además múltiples fuentes de identidad, todas conectadas al mismo Realm `enterprise-ai`:

| Fuente de identidad | Forma de integración | Puntos clave |
| --- | --- | --- |
| Microsoft Entra ID (antes Azure AD) | Identity Providers → OpenID Connect v1.0 | Registra una aplicación en Azure para obtener client id/secret; redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (integrado) | Puedes usar un Mapper con `hd=dominio` para restringir el dominio |
| GitHub | Identity Providers → GitHub (integrado) | Callback de la OAuth App `/broker/github/endpoint` |
| LDAP genérico (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor Other; Username attribute con `uid` |
| SAML 2.0 genérico (Okta/ADFS) | Identity Providers → SAML v2.0 | Pega la URL de metadatos del IdP para que se rellene automáticamente |

> ✅ Convivencia de varias fuentes de identidad: puedes añadir Identity Provider Redirector en Authentication → Browser flow para seleccionar automáticamente el IdP por el dominio del correo (`@empresa.com`→AD, `@empresa.onmicrosoft.com`→Entra ID).

> 📖 Documentación oficial:Documentación oficial de Keycloak https://www.keycloak.org/documentation · Guía de administración del servidor https://www.keycloak.org/server/ · Federación LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← Capítulo 5: Implementación independiente de Dify](ch05-dify-deploy.md) · [📖 Índice](index.md) · [Capítulo 7: NewAPI: inicialización, canales y OIDC →](ch07-newapi.md)
