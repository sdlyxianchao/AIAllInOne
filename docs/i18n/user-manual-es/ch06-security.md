# Capítulo 6: Normativa de seguridad de datos

*Inicio rápido*

> Qué se puede enviar a la IA y qué está terminantemente prohibido — la línea roja que todos deben cumplir.

[← Capítulo 5: Solicitar una API Key](ch05-key.md) · [📖 Índice](index.md) · [Capítulo 7: Preguntas frecuentes (FAQ) →](ch07-faq.md)

---

La plataforma ya **enmascara** automáticamente información sensible como **números de móvil, DNI, tarjetas bancarias y correos** (se ocultan automáticamente antes de enviarlos al modelo grande) e intercepta las palabras sensibles. Pero cumple por voluntad propia las líneas rojas siguientes.

## 6.1 Qué se puede enviar y qué no

### ❌ Prohibido terminantemente enviar a la IA

- Secretos internos / secretos comerciales (código de producto, precios, listas de clientes o cláusulas de contrato no publicados);

- Privacidad personal (DNI, números de tarjeta bancaria, contraseñas, información de salud, privacidad de terceros);

- Código fuente / soluciones técnicas no publicadas.

### ✅ Se puede usar con tranquilidad

- Material público, conocimiento general, redacción de documentos, traducción, resúmenes;

- Datos de negocio ya enmascarados (tras eliminar nombres/números/campos sensibles concretos).

## 6.2 Referencia rápida de clasificación de datos

| Nivel de datos | ¿Puede subirse al modelo externo? | Descripción |
| --- | --- | --- |
| Datos públicos | ✅ Sí | Material ya publicado, información general |
| Datos internos ordinarios | ⚠️ Se pueden usar tras enmascarar | Se pueden usar tras eliminar los campos sensibles |
| Secretos internos / privacidad personal | ❌ Prohibido | Prohibido enviarlos |

Principio de decisión: **«¿Habría problema si este contenido lo viera alguien ajeno?»** Si lo habría → no lo envíes.

## 6.3 Tres escenarios típicos

| Escenario | Qué hacer |
| --- | --- |
| Redactar un informe semanal que menciona clientes | Usa «cierto cliente» o «Cliente A» en lugar del nombre real |
| Pedir a la IA que analice una tabla de datos | Elimina primero las columnas de nombre, teléfono, DNI, etc. y deja solo los datos agregados |
| Traducir cláusulas de contrato | Elimina antes importes, nombre de la contraparte, etc., o sustitúyelos por «Parte A/Parte B» |

---

[← Capítulo 5: Solicitar una API Key](ch05-key.md) · [📖 Índice](index.md) · [Capítulo 7: Preguntas frecuentes (FAQ) →](ch07-faq.md)
