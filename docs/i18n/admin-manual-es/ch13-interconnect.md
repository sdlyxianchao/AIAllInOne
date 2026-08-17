# Capítulo 13: Lista de verificación de interconexión

*Parte I · Implementación*

> Una vez terminada la implementación, confirma uno a uno que las 12 cadenas de interconexión quedan operativas.

[← Capítulo 12: Centro de administración de IA](ch12-admin-center.md) · [📖 Índice](index.md) · [Capítulo 14: Administración diaria de Keycloak →](ch14-ops-keycloak.md)

---

Aquí termina la parte de implementación. Verifica por último los siguientes 12 puntos uno a uno; solo cuando todos estén ✅ se puede decir que la plataforma funciona de verdad.

| # | Interconexión | Forma de verificación |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | La prueba del canal de NewAPI recibe OK |
| 2 | Dify → NewAPI | La prueba del proveedor de modelos de Dify recibe respuesta |
| 3 | DeepChat → NewAPI | DeepChat envía un mensaje y recibe respuesta |
| 4 | Keycloak → NewAPI | La cuenta de Keycloak inicia sesión por OIDC en NewAPI |
| 5 | Keycloak → Dify | La cuenta de Keycloak inicia sesión por SSO en Dify |
| 6 | MCP Gateway → DeepChat | DeepChat obtiene la lista de herramientas MCP y las llama |
| 7 | MCP Gateway → Dify | El flujo de trabajo de Dify llama a herramientas MCP |
| 8 | Gitea Runner → Docker | El Runner puede ejecutar tareas CI/CD |
| 9 | Gitea → servidor de actualización | Los artefactos de CI pueden subirse al servidor de actualización |
| 10 | Ghost API → Gitea | Gitea Actions puede llamar a la API de Ghost para publicar anuncios |
| 11 | Ghost → salto a Dify | El «Banco de trabajo de IA» del portal salta correctamente a Dify |
| 12 | Centro de administración de IA | El Dashboard muestra todos los contenedores + el menú lateral accede a todos los productos |

> ✅ Una vez superado todo, sigue con la segunda parte «Administración» para aprender las operaciones diarias de cada producto, y con la tercera parte «Operaciones» para copias de seguridad, verificación de estado y resolución de problemas.

---

[← Capítulo 12: Centro de administración de IA](ch12-admin-center.md) · [📖 Índice](index.md) · [Capítulo 14: Administración diaria de Keycloak →](ch14-ops-keycloak.md)
