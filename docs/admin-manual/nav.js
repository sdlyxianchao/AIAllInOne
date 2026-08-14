/* AI AllInOne Admin Manual · TOC data (multi-page e-book) */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne Admin Manual",
  subtitle: "v0.2 · Deployment · Administration · Operations",
  home: "index.html",
  parts: [
    { label: "Part 1 · Deployment", items: [
      { id:"ch01", n:"1",  title:"Platform Overview and Architecture", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"Prerequisites", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"Configuration Files and Environment Variables", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"Starting Core Services", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Standalone Dify Deployment", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak: Realm, Users, and AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI: Initialization, Channels, and OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM: Verification and Caching", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Dify / Ghost / Gitea Configuration", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"DeepChat Distribution and CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway and Skill Marketplace", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"AI Admin Center", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"Interconnect Verification Checklist", file:"ch13-interconnect.html" }
    ]},
    { label: "Part 2 · Administration (day-to-day operations for each product)", items: [
      { id:"ch14", n:"14", title:"Keycloak Day-to-Day Administration", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"NewAPI Day-to-Day Administration", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"LiteLLM Day-to-Day Administration", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Dify Day-to-Day Administration", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Ghost Day-to-Day Administration", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gitea Day-to-Day Administration", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"MCP Gateway Day-to-Day Administration", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"Update Server Administration", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"Monitoring and Alerting Administration", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"LLM Observability (Langfuse)", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"Unified Logging (Loki)", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"PII Redaction (Presidio)", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog Mail Catcher", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "Part 3 · Operations", items: [
      { id:"ch27", n:"27", title:"Backup and Restore", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"Health Checks and Startup Self-Checks", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"Troubleshooting Guide", file:"ch29-troubleshooting.html" }
    ]},
    { label: "Appendix", items: [
      { id:"ch30", n:"App.", title:"Vendor Documentation Index", file:"ch30-appendix.html" }
    ]}
  ]
};
