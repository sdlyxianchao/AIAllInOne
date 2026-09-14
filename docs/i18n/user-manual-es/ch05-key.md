# Capítulo 5: Solicitar una API Key

*Inicio rápido*

> Para conectar la capacidad de IA de la empresa a herramientas de terceros necesitas una API Key.

[← Capítulo 4: Herramienta 2: Dify](ch04-dify.md) · [📖 Índice](index.md) · [Capítulo 6: Normativa de seguridad de datos →](ch06-security.md)

---

Si quieres conectar la capacidad de IA de la empresa a **herramientas de terceros** (tus propios scripts u otro software compatible con la interfaz de OpenAI), necesitas una API Key (clave que empieza por `sk-`).

## 5.1 Iniciar sesión en NewAPI

1. Abre `http://IP:3000` en el navegador;

2. Inicia sesión con la cuenta unificada (o haz clic en «Inicio de sesión de un clic / OIDC» para usar la cuenta de dominio).

## 5.2 Crear un token

1. Menú de la izquierda «**API Keys / Tokens**»;

2. Haz clic en «**Nuevo token**», ponle nombre (por ejemplo `mi-script`); puedes fijar cuota y fecha de expiración;

3. Tras guardar, copia la cadena `sk-xxxx` generada. **Solo se muestra una vez; guárdala de inmediato**.

## 5.3 Rellenar en el cliente

- **API Base URL**: `http://IP:3000/v1`

- **API Key**: la `sk-xxxx` que acabas de copiar

## 5.4 Ejemplo de uso frecuente

> 💡 Prueba con curl:
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hola"}]}'`

> ⚠️ Si al agotarse la cuota aparece «saldo insuficiente», contacta con el administrador para solicitar un aumento. La Key equivale a tu usuario y contraseña; **no se la des a nadie ni la subas a un repositorio de código**.

> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai

---

[← Capítulo 4: Herramienta 2: Dify](ch04-dify.md) · [📖 Índice](index.md) · [Capítulo 6: Normativa de seguridad de datos →](ch06-security.md)
