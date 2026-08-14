/* Manuel de l'administrateur AI AllInOne · Données de la table des matières (e-book multipage) */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "Manuel de l'administrateur AI AllInOne",
  subtitle: "v0.2 · Déploiement · Administration · Exploitation",
  home: "index.html",
  parts: [
    { label: "Première partie · Déploiement", items: [
      { id:"ch01", n:"1",  title:"Vue d'ensemble et architecture de la plateforme", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"Préparation préalable", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"Fichiers de configuration et variables d'environnement", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"Démarrage des services principaux", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Déploiement autonome de Dify", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak : Realm, utilisateurs et AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI : initialisation, canaux et OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM : vérification et cache", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Configuration de Dify / Ghost / Gitea", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"Distribution de DeepChat et CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway et marché de Skills", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"Centre d'administration IA", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"Liste de vérification de l'interconnexion", file:"ch13-interconnect.html" }
    ]},
    { label: "Deuxième partie · Administration (opérations quotidiennes de chaque produit)", items: [
      { id:"ch14", n:"14", title:"Administration quotidienne de Keycloak", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"Administration quotidienne de NewAPI", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"Administration quotidienne de LiteLLM", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Administration quotidienne de Dify", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Administration quotidienne de Ghost", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Administration quotidienne de Gitea", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"Administration quotidienne de MCP Gateway", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"Administration du serveur de mise à jour", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"Administration de la surveillance et des alertes", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"Observabilité LLM (Langfuse)", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"Journaux unifiés (Loki)", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"Anonymisation PII (Presidio)", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog, récepteur d'e-mails", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "Troisième partie · Exploitation", items: [
      { id:"ch27", n:"27", title:"Sauvegarde et restauration", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"Contrôle de santé et auto-vérification au démarrage", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"Manuel de dépannage", file:"ch29-troubleshooting.html" }
    ]},
    { label: "Annexe", items: [
      { id:"ch30", n:"Ann.", title:"Index de la documentation officielle", file:"ch30-appendix.html" }
    ]}
  ]
};
