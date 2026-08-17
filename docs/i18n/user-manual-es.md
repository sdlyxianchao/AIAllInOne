# AI AllInOne Manual del usuario

*v0.2 · Guía de uso para empleados*

**Inicio rápido**

## 1. Conoce la plataforma

> 📌 Nota: en este manual, `IP` se refiere a la dirección del servidor de la intranet de la empresa (ejemplo `192.168.31.117`; en la práctica, lo que indique el administrador). Todas las direcciones usan **IP de intranet**; no uses `localhost` ni `127.0.0.1`.
### 1.1 Qué es la plataforma
«AI AllInOne» es una plataforma corporativa de IA desplegada en la intranet de la empresa, que unifica en la intranet las capacidades de los modelos grandes (DeepSeek, GPT, Claude, etc.) para que los empleados puedan usarlos con **una sola cuenta**. No necesitas preocuparte por los servidores, modelos ni claves que hay detrás — solo recuerda tres puntos de entrada.
### 1.2 Qué puedo hacer con la plataforma
| Qué quieres hacer | Cuál usar | Dónde abrirlo |
| --- | --- | --- |
| Conversar a diario como con ChatGPT, redactar documentos, traducir, corregir código | 💬 DeepChat | Cliente de escritorio (primero descárgalo e instálalo desde el portal) |
| Usar aplicaciones de IA ya preparadas por la empresa (respuestas de atención al cliente, asistentes de aprobación, etc.) | 🤖 Dify | Navegador `http://IP` |
| Subir documentos para hacer «respuestas con base de conocimiento» (preguntar sobre material interno) | 🤖 Dify | Navegador `http://IP` |
| Ver noticias, anuncios de la empresa y descargar software | 📰 Portal (Hub) | Navegador `http://IP:8090` |
| Solicitar por tu cuenta una API Key para conectar herramientas de terceros | 🔑 NewAPI | Navegador `http://IP:3000` |
### 1.3 Cómo elegir entre los tres puntos de entrada
> ✅ **Para recordarlo en una frase**: **chatear/redactar/traducir → DeepChat**; **aplicaciones preparadas por la empresa / base de conocimiento → Dify**; **buscar cosas / ver anuncios / descargar software → portal Hub**. Los tres usan la misma cuenta para iniciar sesión.
Método de inicio de sesión: todos los productos usan la **cuenta unificada de Keycloak** (algunos admiten la cuenta de dominio AD de la empresa, es decir, la misma cuenta con la que enciendes tu equipo). Al hacer clic en «Iniciar sesión» salta automáticamente a la página de inicio unificado; introduces la cuenta una vez y después no hace falta volver a iniciar sesión en los demás productos.
### 1.4 Cómo usar este manual
- **Si eres nuevo**: lee en orden los capítulos 2~4 y empieza instalando DeepChat para usarlo;
- **Para conectar herramientas de terceros**: lee el capítulo 5 para solicitar la Key;
- **Si tienes dudas**: consulta primero el FAQ del capítulo 7 y luego pregunta al administrador;
- **Lectura obligatoria**: capítulo 6 (seguridad de datos) y capítulo 8 (código de conducta), que todos deben cumplir.

## 2. AI All In One Hub (portal)

### 2.1 Qué es el portal
Ghost**AI All In One Hub** es el portal corporativo de la empresa (construido con el software libre Ghost), dirección `http://IP:8090`. Es el **punto de partida** para entrar a la plataforma de IA.
### 2.2 Ver noticias / anuncios
1. Abre `http://IP:8090` en el navegador;
2. La portada es la lista de noticias y anuncios más recientes; haz clic en el título para leer el texto completo.
### 2.3 Centro de descargas (instalar DeepChat)
1. Haz clic en el menú «**Centro de descargas**» de la parte superior del portal, o abre directamente `http://IP:8090/downloads/`;
2. Elige el instalador **Windows** / **macOS** según tu sistema y descarga **DeepChat**;
3. Instalación: en Windows haz doble clic en el .exe y sigue el asistente; en macOS abre el .dmg y arrástralo a «Aplicaciones».
> ✅ El aviso de la parte superior de la página de descargas «Si es la primera vez, instala primero el administrador de habilidades» es un paquete de habilidades para usuarios avanzados; los usuarios normales pueden ignorarlo.
### 2.4 Saltar a Dify / ayuda
- Haz clic en el menú del portal «**Banco de trabajo de IA**» → salta directamente a Dify (plataforma de aplicaciones de IA);
- Haz clic en «**Documentación de ayuda**» → consulta los artículos de ayuda preparados por la empresa.
> 📖 Documentación oficial:El portal lo proporciona Ghost; documentación oficial https://ghost.org/docs/

## 3. Herramienta 1: DeepChat

### 3.1 Descarga e instalación
1. Abre el centro de descargas del portal `http://IP:8090/downloads/`;
2. Descarga e instala el instalador según tu sistema;
3. Inicia DeepChat.
### 3.2 Configurar el modelo (conectar con el gateway de la empresa)
La primera vez debes indicar a DeepChat dónde está el modelo. La empresa ya ha unificado los modelos en el gateway **NewAPI**; solo tienes que rellenar tres valores:
1Abre DeepChat → abajo a la izquierda **Configuración (⚙️)** → **Servicio de modelos / Proveedor de modelos**.
2Añade «**Provider personalizado**» o «**compatible con OpenAI**».
3Rellena los tres campos siguientes:
| Campo | Qué poner |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | La clave `sk-` solicitada en NewAPI (ver capítulo 5) |
| Modelo | `deepseek-chat` (por defecto en la empresa; puedes elegir otros modelos habilitados) |
4Guarda.
> ⚠️ **Clave**: la API Base URL debe usar la **IP de intranet** (`http://IP:3000/v1`); no uses `localhost`, o no conectarás con el servidor de la empresa.
### 3.3 Empezar a conversar
1. Haz clic en «**+ Nueva conversación**»;
2. Escribe en el cuadro de entrada y pulsa Enter para enviar;
3. Si recibes una respuesta, la cadena funciona.
### 💡 **Pruébalo**: envía «Escríbeme un correo de reclamación de pago para un cliente, con tono amable» y mira cómo responde la IA. Prueba también «Traduce el siguiente texto al inglés: …». DeepChat admite conversaciones de varias rondas; puedes seguir preguntando y pedir a la IA que modifique.

    3.4 Funciones y trucos habituales
| Función | Cómo usarla |
| --- | --- |
| Cambio de varios modelos | Elige modelos distintos en la parte superior de la conversación (si la empresa habilita varios) |
| Lectura/escritura de archivos / herramientas MCP | Configuración → MCP, habilita las herramientas de la empresa (como el sistema de archivos) para que la IA lea archivos locales |
| Tema oscuro/claro | Configuración → Apariencia |
| Problema de proxy de red | Si da «tiempo de conexión agotado» → Configuración → Red/Proxy → cambia a «No usar proxy / conexión directa» |
### 3.5 Técnicas para preguntar
> ✅ **Cuanto más concreto, mejor** — aporta contexto, aclara el requisito y da ejemplos; la calidad de la respuesta de la IA será mayor.
- 💡 Buen ejemplo: «Eres un redactor sénior; escríbeme una presentación de producto de 200 palabras, dirigida a lectores CTO, con un estilo profesional y sobrio» — es mucho mejor que «escribe una presentación».
    
      **Dale un rol**: «Eres un experto en finanzas, ayúdame a…»;
- **Dale restricciones**: «en 100 palabras como máximo / en tabla / en tres pasos»;
- **Dale ejemplos**: «reescribe siguiendo este formato…»;
- **Pregunta por pasos**: si no te convence, pide «modifícalo» o «cambia el tono».
> 📖 Documentación oficial:Inicio rápido de DeepChat https://deepchatai.cn/docs/guide/getting-started/ · Repositorio de código abierto https://github.com/ThinkInAIXYZ/deepchat

## 4. Herramienta 2: Dify

### 4.1 Iniciar sesión en Dify
1. Abre `http://IP` en el navegador (puerto 80, sin número de puerto; también puedes entrar desde «Banco de trabajo de IA» del portal);
2. Inicia sesión con la cuenta unificada (la primera vez puede que el administrador deba habilitarte la cuenta antes).
### 4.2 Usar aplicaciones de chat ya listas
El administrador prepara de antemano algunas aplicaciones (como «Preguntas sobre normativa de la empresa» o «Asistente de atención al cliente»); los usuarios normales solo tienen que «usarlas»:
1. Tras iniciar sesión, entra a la lista «**Estudio / Aplicaciones**»;
2. Encuentra la aplicación que quieras usar y haz clic en «**Ejecutar / Vista previa**» (botón de reproducción de la esquina superior derecha);
3. En la página de conversación abierta, haz preguntas directamente.
### 4.3 Respuestas con base de conocimiento
Si quieres «alimentar» a la IA con documentos internos para que responda, usa la **base de conocimiento** de Dify (requiere permiso del administrador):
1. «**Base de conocimiento**» → «Crear base de conocimiento»;
2. Sube documentos (Word / PDF / Markdown / enlaces web, etc.);
3. El sistema segmenta e indexa automáticamente;
4. «Referencia» esta base de conocimiento en la aplicación y la IA podrá responder basándose en tus documentos.
> 📌 El contenido de la base de conocimiento se usa para que la IA responda; cumple la normativa de seguridad de datos del capítulo 6 — **no subas material confidencial**.
### 4.4 Montar tú mismo una aplicación sencilla (avanzado)
1. Estudio → crear aplicación en blanco → elige «Asistente de chat»;
2. Escribe un «prompt» para indicar a la IA su rol (como «Eres el asistente de dudas sobre el sistema de asistencia de la empresa»);
3. Añade base de conocimiento → elige modelo → vista previa y prueba → publica.
> 📖 Documentación oficial:Documentación oficial de Dify https://docs.dify.ai

## 5. Solicitar una API Key

Si quieres conectar la capacidad de IA de la empresa a **herramientas de terceros** (tus propios scripts u otro software compatible con la interfaz de OpenAI), necesitas una API Key (clave que empieza por `sk-`).
### 5.1 Iniciar sesión en NewAPI
1. Abre `http://IP:3000` en el navegador;
2. Inicia sesión con la cuenta unificada (o haz clic en «Inicio de sesión de un clic / OIDC» para usar la cuenta de dominio).
### 5.2 Crear un token
1. Menú de la izquierda «**API Keys / Tokens**»;
2. Haz clic en «**Nuevo token**», ponle nombre (por ejemplo `mi-script`); puedes fijar cuota y fecha de expiración;
3. Tras guardar, copia la cadena `sk-xxxx` generada. **Solo se muestra una vez; guárdala de inmediato**.
### 5.3 Rellenar en el cliente
- **API Base URL**: `http://IP:3000/v1`
- **API Key**: la `sk-xxxx` que acabas de copiar
### 5.4 Ejemplo de uso frecuente
> 💡 Prueba con curl:  
> 
>     `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hola"}]}'`
> 
>     ⚠️ Si al agotarse la cuota aparece «saldo insuficiente», contacta con el administrador para solicitar un aumento. La Key equivale a tu usuario y contraseña; **no se la des a nadie ni la subas a un repositorio de código**.
> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai

## 6. Normativa de seguridad de datos

La plataforma ya **enmascara** automáticamente información sensible como **números de móvil, DNI, tarjetas bancarias y correos** (se ocultan automáticamente antes de enviarlos al modelo grande) e intercepta las palabras sensibles. Pero cumple por voluntad propia las líneas rojas siguientes.
### 6.1 Qué se puede enviar y qué no
#### ❌ Prohibido terminantemente enviar a la IA
- Secretos internos / secretos comerciales (código de producto, precios, listas de clientes o cláusulas de contrato no publicados);
- Privacidad personal (DNI, números de tarjeta bancaria, contraseñas, información de salud, privacidad de terceros);
- Código fuente / soluciones técnicas no publicadas.
#### ✅ Se puede usar con tranquilidad
- Material público, conocimiento general, redacción de documentos, traducción, resúmenes;
- Datos de negocio ya enmascarados (tras eliminar nombres/números/campos sensibles concretos).
### 6.2 Referencia rápida de clasificación de datos
| Nivel de datos | ¿Puede subirse al modelo externo? | Descripción |
| --- | --- | --- |
| Datos públicos | ✅ Sí | Material ya publicado, información general |
| Datos internos ordinarios | ⚠️ Se pueden usar tras enmascarar | Se pueden usar tras eliminar los campos sensibles |
| Secretos internos / privacidad personal | ❌ Prohibido | Prohibido enviarlos |
> > Principio de decisión: **«¿Habría problema si este contenido lo viera alguien ajeno?»** Si lo habría → no lo envíes.
### 6.3 Tres escenarios típicos
| Escenario | Qué hacer |
| --- | --- |
| Redactar un informe semanal que menciona clientes | Usa «cierto cliente» o «Cliente A» en lugar del nombre real |
| Pedir a la IA que analice una tabla de datos | Elimina primero las columnas de nombre, teléfono, DNI, etc. y deja solo los datos agregados |
| Traducir cláusulas de contrato | Elimina antes importes, nombre de la contraparte, etc., o sustitúyelos por «Parte A/Parte B» |

## 7. Preguntas frecuentes (FAQ)

### 7.1 Inicio de sesión / acceso
| Problema | Solución |
| --- | --- |
| ¿No puedes iniciar sesión en algún producto? | Confirma que usas la IP de intranet (no localhost) y la cuenta unificada; si sigue sin funcionar, contacta con el administrador |
| ¿La página de inicio no abre / se queda cargando? | Confirma que estás conectado a la intranet de la empresa (WiFi/cable) y usa `http://IP` en lugar de localhost |
| ¿Olvidaste la contraseña de la cuenta unificada? | Contacta con el administrador para restablecerla (o recupérala mediante la cuenta de dominio) |
### 7.2 Uso
| Problema | Solución |
| --- | --- |
| ¿Indica cuota insuficiente? | Consulta el saldo en el panel de NewAPI; si se agotó, contacta con el administrador para recargar o aumentar la cuota |
| ¿Se intercepta el contenido que envías? | Coincidió con una palabra sensible o contiene información sensible; ajústalo según la normativa del capítulo 6 y reintenta |
| ¿DeepChat da tiempo de conexión agotado? | Configuración → Red/Proxy → cambia a «No usar proxy / conexión directa» |
| ¿La calidad de la respuesta del modelo es mala? | Cambia de modelo u optimiza la pregunta (aporta contexto, aclara el requisito y da ejemplos) |
| ¿No recuerdas dónde descargar DeepChat? | Centro de descargas del portal `http://IP:8090/downloads/` |
| ¿Al crear una aplicación en Dify se queda cargando? | Suele ser un problema de red/WebSocket; contacta con el administrador; fuerza la recarga en el navegador con Ctrl+F5 |
### 7.3 Comprensión
| Problema | Solución |
| --- | --- |
| ¿Puedo fiarme de las respuestas de la IA? | No al 100%. La IA puede equivocarse (alucinaciones); los hechos, cifras y código importantes deben verificarse manualmente |
| ¿La IA recuerda lo que digo? | El contexto de la conversación actual se conserva para las respuestas de varias rondas; no introduzcas información confidencial (ver capítulo 6) |

## 8. Código de conducta

### 8.1 Normas de uso
- No usar la plataforma con fines ilegales; no generar contenido ilegal, dañino o que infrinja derechos;
- No eludir las restricciones de seguridad de la plataforma ni agotar la cuota en masa;
- Al enviar contenido generado por IA al exterior, verifica los hechos y cumple la normativa de publicación de la empresa;
- Guarda bien tu API Key; no se la prestes a otros ni la subas a un repositorio de código;
- Si detectas algo anómalo (cuenta o contenido anómalo), infórmalo a tiempo al administrador.
### 8.2 Resumen en una frase
> ✅ Usa bien la IA para ganar eficiencia, pero **no envíes información confidencial, verifica siempre los hechos y cumple las normas**. Si tienes dudas, contacta con el administrador de la plataforma.

