# Capítulo 15: Administración diaria de NewAPI

*Parte II · Administración (operaciones diarias de cada producto)*

> El gateway de LLM: gestiona canales, tokens, cuotas, usuarios, registros y costos.

[← Capítulo 14: Administración diaria de Keycloak](ch14-ops-keycloak.md) · [📖 Índice](index.md) · [Capítulo 16: Administración diaria de LiteLLM →](ch16-ops-litellm.md)

---

**Entrada**: `http://<IP-del-servidor>:3000`.

## 15.1 Gestión de canales (modelos upstream)

1. **Nuevo canal**: Canal → añadir nuevo canal → tipo OpenAI (o Claude, etc.) → Base URL `http://litellm:4000` → clave `LITELLM_MASTER_KEY` → rellena el nombre del modelo → guarda;

2. **Probar**: en la lista de canales haz clic en «Probar» y elige un modelo para verificar la conexión;

3. **Desactivar/activar**: interruptor de la lista de canales; al desactivarlo, el canal deja de recibir peticiones;

4. **Prioridad/peso**: con varios canales del mismo modelo se reparte por prioridad/peso.

## 15.2 Gestión de tokens (API Keys)

1. **Nuevo**: API Keys → nuevo token → ponle nombre (como `dsh-key`) → puedes fijar cuota/fecha de expiración/restricción de modelos → guarda;

2. **Copiar Key**: empieza por `sk-`, **solo se muestra una vez, guárdala de inmediato**;

3. **Desactivar/eliminar**: operaciones de la lista de tokens (al desactivar, esa Key deja de funcionar de inmediato);

4. **Consultar consumo**: en el detalle del token se ve la cuota ya consumida.

## 15.3 Cuotas y usuarios

- **Cuota por defecto de nuevos usuarios**: `DEFAULT_QUOTA` (recomendado 100 dólares);

- **Subir la cuota a un usuario**: página Usuarios → edita ese usuario → establece la cuota;

- **Recargar/bloquear**: operaciones de la página Usuarios;

- **Gestión por grupos**: crea grupos por departamento, fija multiplicador/cuota de modelos y, al asignar el usuario al grupo, se controla por departamento.

## 15.4 Registros y costos

- **Página de registros**: consulta usuario/modelo/token/cuota/costo/IP de origen de cada llamada;

- **Informe de costos**: la página «Administración de NewAPI» del Centro de administración de IA tiene un informe de costos agregado por usuario/modelo/fecha + los últimos 100 registros de auditoría.

> 📌 El registro de la IP del cliente depende de la opción «Registrar IP del usuario» (`record_ip_log`, desactivada por defecto); actívala para el usuario correspondiente cuando necesites auditoría de IP.

## 15.5 Puntos clave de la configuración del sistema

- **Dirección del servidor**: debe ser la de intranet `http://<IP-del-servidor>:3000` (de lo contrario el OIDC da `invalid_grant - Incorrect redirect_uri`);

- **Autenticación → OAuth personalizado**: integración de Keycloak OIDC (ver capítulo 7);

- **Modo de uso**: se puede alternar entre uso personal ↔ operación externa.

> ⚠️ Repaso de puntos críticos: ① la Base URL del canal se rellena siempre con el nombre de contenedor `http://litellm:4000`; ② el límite de tasa 429 se controla con variables como `CRITICAL_RATE_LIMIT_ENABLE=false`; ③ para modificar la base de datos usa directamente la variable de entorno `MYSQL_PWD`, para evitar que el aviso de contraseña por stderr se malinterprete como error.

> 📖 Documentación oficial:Documentación oficial de NewAPI https://docs.newapi.pro · Sitio web https://www.newapi.ai · Repositorio de código abierto https://github.com/QuantumNous/new-api

---

[← Capítulo 14: Administración diaria de Keycloak](ch14-ops-keycloak.md) · [📖 Índice](index.md) · [Capítulo 16: Administración diaria de LiteLLM →](ch16-ops-litellm.md)
