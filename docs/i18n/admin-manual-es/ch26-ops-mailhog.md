# Capítulo 26: Receptor de correo MailHog

*Parte II · Administración (operaciones diarias de cada producto)*

> La «salida de correo» cuando la intranet no tiene SMTP, para recibir los códigos de verificación y los correos de notificación de Ghost.

[← Capítulo 25: Enmascaramiento de PII (Presidio)](ch25-ops-pii.md) · [📖 Índice](index.md) · [Capítulo 27: Copia de seguridad y restauración →](ch27-backup.md)

---

**Entrada**: `http://<IP-del-servidor>:8025` (buzón web; SMTP 1025 solo interno).

## 26.1 Por qué se necesita

El panel de Ghost 5 usa inicio de sesión sin contraseña: al introducir el correo, Ghost envía un correo con un código de 6 dígitos. Sin SMTP en la intranet el correo no sale y el inicio de sesión da `Failed to send email`. MailHog actúa como «salida de correo» para recibir esos correos.

## 26.2 Configuración del lado de Ghost

```
# Variables de entorno de Ghost en docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 Ver el correo

1. Abre `http://<IP-del-servidor>:8025` en el navegador;

2. En el buzón verás los códigos de verificación y los correos de notificación que envía Ghost.

## 26.4 Inicio de sesión sin contraseña de Ghost (inicio automático en el Centro de administración de IA)

El código de 6 dígitos de Ghost es en esencia un **TOTP** (`TOTP(admin_session_secret + userId)`, 6 dígitos / 60 segundos / HMAC-SHA1). El Centro de administración de IA puede calcular el código localmente; al hacer clic en «Panel de Ghost → Abrir» completa automáticamente: inicio con contraseña → cálculo local del código → verificación de sesión → escribe la cookie → entra al panel, todo sin fricción y sin revisar MailHog.

> ⚠️ Aunque calcules el código tú mismo, Ghost igualmente envía el correo, así que MailHog debe mantenerse; de lo contrario el inicio de sesión da `Failed to send email`.

> 📖 Documentación oficial:Repositorio de código fuente de MailHog https://github.com/mailhog/MailHog

---

[← Capítulo 25: Enmascaramiento de PII (Presidio)](ch25-ops-pii.md) · [📖 Índice](index.md) · [Capítulo 27: Copia de seguridad y restauración →](ch27-backup.md)
