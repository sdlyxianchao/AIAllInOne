# Capítulo 18: Administración diaria de Ghost

*Parte II · Administración (operaciones diarias de cada producto)*

> Portal corporativo / Hub: artículos, páginas, navegación, temas y miembros.

[← Capítulo 17: Administración diaria de Dify](ch17-ops-dify.md) · [📖 Índice](index.md) · [Capítulo 19: Administración diaria de Gitea →](ch19-ops-gitea.md)

---

**Entrada**: frontend `http://<IP-del-servidor>:8090`; panel `http://<IP-del-servidor>:8090/ghost/` (atención al sufijo /ghost/).

## 18.1 Iniciar sesión en el panel

El panel de Ghost 5 usa **inicio de sesión sin contraseña**: introduce el correo → Ghost envía un código de 6 dígitos a MailHog (`:8025`). Forma más rápida: haz clic en el botón «Abrir» de «Panel de Ghost» en el Centro de administración de IA, que completa el inicio de sesión automáticamente (calcula el código TOTP localmente, sin revisar el correo).

## 18.2 Publicar contenido

1. **Artículos**: Posts → New post → escribe el contenido (editor Markdown) → Publish;

2. **Páginas**: Pages → New page (como «Centro de descargas», slug `downloads`);

3. **Etiquetas/categorías**: Tags → crea categorías (como `news` / `docs`) y asigna los artículos a una categoría.

## 18.3 Menú de navegación

1. Panel → Apariencia (Design) → Menú (Navigation);

2. Edita la navegación principal «Primary» y añade Inicio/Noticias/Centro de descargas/Banco de trabajo de IA/Documentación de ayuda (ver la tabla de menús del capítulo 9).

## 18.4 Temas

- **Cambiar**: Apariencia → Tema; activa directamente los incluidos Casper / Source;

- **Instalar**: mercado de temas (Design → Change theme) o sube un zip.

> ⚠️ No instales temas de última versión desde GitHub (pueden ser para Ghost 6.x y dar incompatible con 5.x); instala el zip de una versión antigua.

## 18.5 Miembros y suscripciones (si se necesitan)

- Members: gestiona suscriptores;

- Si no se necesita la suscripción, puedes ignorar este módulo (en un portal de intranet normalmente no se usa).

## 18.6 Integraciones (API Token)

1. Panel → Settings → Integrations → añadir una integración personalizada;

2. Genera una Admin API Key (formato `id:secret`) para automatizaciones como publicar anuncios con Gitea Actions.

> ⚠️ Puntos críticos: ① no hagas clic en «Registrarse» en la portada `/` (es el registro de suscriptores visitantes); ② el código de 6 dígitos es en esencia TOTP y el Centro de administración de IA puede calcularlo localmente; ③ aunque el código se calcule localmente, Ghost igualmente envía el correo, así que MailHog debe mantenerse (de lo contrario da `Failed to send email`).

> 📖 Documentación oficial:Documentación oficial de Ghost https://ghost.org/docs/ · Panel de administración https://ghost.org/docs/admin/

---

[← Capítulo 17: Administración diaria de Dify](ch17-ops-dify.md) · [📖 Índice](index.md) · [Capítulo 19: Administración diaria de Gitea →](ch19-ops-gitea.md)
