# Capítulo 17: Administración diaria de Dify

*Parte II · Administración (operaciones diarias de cada producto)*

> Plataforma de aplicaciones de IA: aplicaciones, bases de conocimiento, proveedores de modelos, permisos de miembros y publicación.

[← Capítulo 16: Administración diaria de LiteLLM](ch16-ops-litellm.md) · [📖 Índice](index.md) · [Capítulo 18: Administración diaria de Ghost →](ch18-ops-ghost.md)

---

**Entrada**: `http://<IP-del-servidor>` (puerto 80, compose oficial independiente; la actualización y el mantenimiento se hacen por separado en `dify/docker/`).

## 17.1 Gestión de aplicaciones (Estudio)

1. **Crear aplicación**: Estudio → crear aplicación en blanco → elige el tipo (asistente de chat / Agente / flujo de trabajo / generación de texto);

2. **Orquestar**: arrastra y suelta nodos para orquestar prompts, herramientas, bases de conocimiento y variables;

3. **Depurar**: «Vista previa» en la esquina superior derecha para ejecutar la depuración;

4. **Publicar**: tras pasar la depuración, «Publicar» → genera un enlace compartido o incrusta la aplicación web.

## 17.2 Gestión de bases de conocimiento

1. Base de conocimiento → crear base de conocimiento;

2. Sube documentos (Word / PDF / Markdown / enlaces web), elige la regla de segmentación + el modo de indexado (alta calidad/económico);

3. «Añade» esa base de conocimiento en la aplicación y la IA podrá responder basándose en los documentos.

> 📌 El contenido de la base de conocimiento se usa para que la IA responda; no subas material confidencial (respeta la normativa de clasificación de datos).

## 17.3 Proveedores de modelos

- **Añadir modelo**: Configuración → Proveedor de modelos → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (pasa por NewAPI) + `dify-key`;

- **Configuración de modelos del sistema**: especifica el modelo por defecto de chat/razonamiento/embeddings.

## 17.4 Miembros y permisos

- **Miembros**: invita miembros al espacio de trabajo y asigna roles Owner/Admin/Editor/Normal;

- **Método de inicio de sesión**: Configuración → Método de inicio de sesión → se puede conectar OIDC (Keycloak) para SSO.

## 17.5 Actualización y mantenimiento

```
cd dify\docker
git pull                          # traer la última versión
docker compose pull               # traer imágenes nuevas
docker compose up -d              # reconstruir
```

> ⚠️ Puntos críticos: ① el WebSocket `NEXT_PUBLIC_SOCKET_URL` debe apuntar a la IP de intranet; ② la contraseña de inicio de sesión se codifica en base64; ③ si olvidas la contraseña usa `docker exec docker-api-1 flask reset-password` (≥ 8 caracteres).

> 📖 Documentación oficial:Documentación oficial de Dify https://docs.dify.ai · Autoalojada https://docs.dify.ai/getting-started/install-self-hosted

---

[← Capítulo 16: Administración diaria de LiteLLM](ch16-ops-litellm.md) · [📖 Índice](index.md) · [Capítulo 18: Administración diaria de Ghost →](ch18-ops-ghost.md)
