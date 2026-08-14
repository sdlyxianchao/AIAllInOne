/* Manual do Administrador do AI AllInOne · Dados do sumário (e-book multipágina) */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "Manual do Administrador do AI AllInOne",
  subtitle: "v0.2 · Implantação · Gestão · Operações",
  home: "index.html",
  parts: [
    { label: "Parte 1 · Implantação", items: [
      { id:"ch01", n:"1",  title:"Visão geral e arquitetura da plataforma", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"Preparação prévia", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"Arquivos de configuração e variáveis de ambiente", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"Iniciar serviços principais", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Implantação independente do Dify", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak: Realm, usuários e AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI: inicialização, canais e OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM: validação e cache", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Configuração do Dify / Ghost / Gitea", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"Distribuição e CI/CD do DeepChat", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway e Mercado de Skills", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"Central de Administração de IA", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"Lista de verificação de interconexão", file:"ch13-interconnect.html" }
    ]},
    { label: "Parte 2 · Gestão (operações diárias de cada produto)", items: [
      { id:"ch14", n:"14", title:"Gestão diária do Keycloak", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"Gestão diária do NewAPI", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"Gestão diária do LiteLLM", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Gestão diária do Dify", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Gestão diária do Ghost", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gestão diária do Gitea", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"Gestão diária do MCP Gateway", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"Gestão do Servidor de Atualização", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"Gestão de monitoramento e alertas", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"Observabilidade de LLM (Langfuse)", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"Logs unificados (Loki)", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"Anonimização de PII (Presidio)", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog: receptor de e-mails", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "Parte 3 · Operações", items: [
      { id:"ch27", n:"27", title:"Backup e recuperação", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"Verificação de integridade e autoteste na inicialização", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"Manual de solução de problemas", file:"ch29-troubleshooting.html" }
    ]},
    { label: "Apêndice", items: [
      { id:"ch30", n:"Ap", title:"Índice de documentação oficial", file:"ch30-appendix.html" }
    ]}
  ]
};
