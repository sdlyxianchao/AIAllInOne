/* AI AllInOne Manual del administrador · Datos del índice (libro electrónico multipágina) */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne Manual del administrador",
  subtitle: "v0.2 · Implementación · Administración · Operaciones",
  home: "index.html",
  parts: [
    { label: "Parte I · Implementación", items: [
      { id:"ch01", n:"1",  title:"Descripción general y arquitectura de la plataforma", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"Preparación previa", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"Archivos de configuración y variables de entorno", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"Iniciar los servicios principales", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Implementación independiente de Dify", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak: Realm, usuarios y AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI: inicialización, canales y OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM: verificación y caché", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Configuración de Dify / Ghost / Gitea", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"Distribución de DeepChat y CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway y el mercado de Skills", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"Centro de administración de IA", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"Lista de verificación de interconexión", file:"ch13-interconnect.html" }
    ]},
    { label: "Parte II · Administración (operaciones diarias de cada producto)", items: [
      { id:"ch14", n:"14", title:"Administración diaria de Keycloak", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"Administración diaria de NewAPI", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"Administración diaria de LiteLLM", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Administración diaria de Dify", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Administración diaria de Ghost", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Administración diaria de Gitea", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"Administración diaria de MCP Gateway", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"Administración del servidor de actualización", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"Administración de monitoreo y alertas", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"Observabilidad de LLM (Langfuse)", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"Registro unificado (Loki)", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"Enmascaramiento de PII (Presidio)", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"Receptor de correo MailHog", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "Parte III · Operaciones", items: [
      { id:"ch27", n:"27", title:"Copia de seguridad y restauración", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"Verificación de estado y autocomprobación de arranque", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"Manual de resolución de problemas", file:"ch29-troubleshooting.html" }
    ]},
    { label: "Apéndice", items: [
      { id:"ch30", n:"Apx.", title:"Índice de documentación oficial", file:"ch30-appendix.html" }
    ]}
  ]
};
