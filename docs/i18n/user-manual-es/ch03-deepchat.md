# Capítulo 3: Herramienta 1: DeepChat

*Inicio rápido*

> Cliente de escritorio de conversación con IA: descarga, configuración, conversación y trucos avanzados.

[← Capítulo 2: AI All In One Hub (portal)](ch02-hub.md) · [📖 Índice](index.md) · [Capítulo 4: Herramienta 2: Dify →](ch04-dify.md)

---

## 3.1 Descarga e instalación

1. Abre el centro de descargas del portal `http://IP:8090/downloads/`;

2. Descarga e instala el instalador según tu sistema;

3. Inicia DeepChat.

## 3.2 Configurar el modelo (conectar con el gateway de la empresa)

La primera vez debes indicar a DeepChat dónde está el modelo. La empresa ya ha unificado los modelos en el gateway **NewAPI**; solo tienes que rellenar tres valores:

**1.** Abre DeepChat → abajo a la izquierda **Configuración (⚙️)** → **Servicio de modelos / Proveedor de modelos**.

**2.** Añade «**Provider personalizado**» o «**compatible con OpenAI**».

**3.** Rellena los tres campos siguientes:

| Campo | Qué poner |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | La clave `sk-` solicitada en NewAPI (ver capítulo 5) |
| Modelo | `deepseek-chat` (por defecto en la empresa; puedes elegir otros modelos habilitados) |

**4.** Guarda.

> ⚠️ **Clave**: la API Base URL debe usar la **IP de intranet** (`http://IP:3000/v1`); no uses `localhost`, o no conectarás con el servidor de la empresa.

## 3.3 Empezar a conversar

1. Haz clic en «**+ Nueva conversación**»;

2. Escribe en el cuadro de entrada y pulsa Enter para enviar;

3. Si recibes una respuesta, la cadena funciona.

> 💡 **Pruébalo**: envía «Escríbeme un correo de reclamación de pago para un cliente, con tono amable» y mira cómo responde la IA. Prueba también «Traduce el siguiente texto al inglés: …». DeepChat admite conversaciones de varias rondas; puedes seguir preguntando y pedir a la IA que modifique.

## 3.4 Funciones y trucos habituales

| Función | Cómo usarla |
| --- | --- |
| Cambio de varios modelos | Elige modelos distintos en la parte superior de la conversación (si la empresa habilita varios) |
| Lectura/escritura de archivos / herramientas MCP | Configuración → MCP, habilita las herramientas de la empresa (como el sistema de archivos) para que la IA lea archivos locales |
| Tema oscuro/claro | Configuración → Apariencia |
| Problema de proxy de red | Si da «tiempo de conexión agotado» → Configuración → Red/Proxy → cambia a «No usar proxy / conexión directa» |

## 3.5 Técnicas para preguntar

> ✅ **Cuanto más concreto, mejor** — aporta contexto, aclara el requisito y da ejemplos; la calidad de la respuesta de la IA será mayor.

> 💡 Buen ejemplo: «Eres un redactor sénior; escríbeme una presentación de producto de 200 palabras, dirigida a lectores CTO, con un estilo profesional y sobrio» — es mucho mejor que «escribe una presentación».

- **Dale un rol**: «Eres un experto en finanzas, ayúdame a…»;

- **Dale restricciones**: «en 100 palabras como máximo / en tabla / en tres pasos»;

- **Dale ejemplos**: «reescribe siguiendo este formato…»;

- **Pregunta por pasos**: si no te convence, pide «modifícalo» o «cambia el tono».

> 📖 Documentación oficial:Inicio rápido de DeepChat https://deepchatai.cn/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/ThinkInAIXYZ/deepchat

---

[← Capítulo 2: AI All In One Hub (portal)](ch02-hub.md) · [📖 Índice](index.md) · [Capítulo 4: Herramienta 2: Dify →](ch04-dify.md)
