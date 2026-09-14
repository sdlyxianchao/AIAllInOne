# Capítulo 25: Enmascaramiento de PII (Presidio)

*Parte II · Administración (operaciones diarias de cada producto)*

> La información sensible se enmascara automáticamente antes de salir de la intranet.

[← Capítulo 24: Registro unificado (Loki)](ch24-ops-loki.md) · [📖 Índice](index.md) · [Capítulo 26: Receptor de correo MailHog →](ch26-ops-mailhog.md)

---

## 25.1 Enmascarado en dos capas

| Capa | Capacidad |
| --- | --- |
| Regex integrada de LiteLLM (`litellm_content_filter`) | Números de móvil, DNI, tarjetas bancarias, correos, código unificado de crédito social, pasaportes, IPv4, etc.; al coincidir se sustituyen por `[xxx_REDACTED]`; si coincide con la lista negra de palabras sensibles se rechaza con BLOCK |
| Microsoft Presidio | Entidades de granularidad más fina (nombres de personas en inglés, correos, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 Reglas de regex integradas

| Regla | Regex | Tipo |
| --- | --- | --- |
| Móvil de China | `\b1[3-9]\d{9}\b` | cn_mobile |
| Número de DNI | `\b\d{17}[\dXx]\b` | cn_id |
| Número de tarjeta bancaria | `\b\d{16,19}\b` | bank_card |
| Correo electrónico | prebuilt `email` | email |
| Código unificado de crédito social | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Número de pasaporte | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

La lista negra de palabras sensibles se ajusta en `blocked_words` de `litellm-config.yaml` según la empresa (`secreto interno`, `secreto comercial`, etc.).

## 25.3 Activar Presidio (actualmente comentado temporalmente)

Por el cambio de la API de guardrail de la nueva versión de LiteLLM, el bloque de Presidio está comentado actualmente. Puntos clave para activarlo:

- Los guardrails necesitan `default_on: true` para aplicarse globalmente;

- Las variables de entorno de endpoints `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` deben rellenarse con la base URL (LiteLLM añade automáticamente `/analyze` y `/anonymize`; con ruta incluida quedaría `/analyze/analyze` y daría 404).

> ⚠️ La imagen pesa unos 965MB y la descarga es muy lenta en China (medida en torno a 1 hora); si no se puede descargar, usa primero la regex integrada (ya cubre la PII central en chino).

## 25.4 Verificación

Envía una petición con un número de móvil/correo → en la respuesta del modelo el valor original se sustituye por `[REDACTED]`; envía una petición que contenga «secreto interno» → devuelve directamente `Content blocked`.

> 📖 Documentación oficial:Microsoft Presidio https://microsoft.github.io/presidio/ · Código fuente https://github.com/microsoft/presidio

---

[← Capítulo 24: Registro unificado (Loki)](ch24-ops-loki.md) · [📖 Índice](index.md) · [Capítulo 26: Receptor de correo MailHog →](ch26-ops-mailhog.md)
