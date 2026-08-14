/* AI AllInOne 管理員手冊 · 目錄資料（多頁電子書） */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne 管理員手冊",
  subtitle: "v0.2 · 部署 · 管理 · 維運",
  home: "index.html",
  parts: [
    { label: "第一部分 · 部署篇", items: [
      { id:"ch01", n:"1",  title:"平台概覽與架構", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"前置準備", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"配置檔案與環境變數", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"啟動核心服務", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Dify 獨立部署", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak：Realm、使用者與 AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI：初始化、渠道與 OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM：驗證與快取", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Dify / Ghost / Gitea 配置", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"DeepChat 分發與 CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway 與 Skill 市場", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"AI 管理中心", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"互連驗證清單", file:"ch13-interconnect.html" }
    ]},
    { label: "第二部分 · 管理篇（各產品日常操作）", items: [
      { id:"ch14", n:"14", title:"Keycloak 日常管理", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"NewAPI 日常管理", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"LiteLLM 日常管理", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Dify 日常管理", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Ghost 日常管理", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gitea 日常管理", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"MCP Gateway 日常管理", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"更新伺服器管理", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"監控告警管理", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"LLM 可觀測（Langfuse）", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"統一日誌（Loki）", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"PII 遮蔽（Presidio）", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog 郵件接收器", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "第三部分 · 維運篇", items: [
      { id:"ch27", n:"27", title:"備份與恢復", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"健康檢查與開機自檢", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"疑難排解手冊", file:"ch29-troubleshooting.html" }
    ]},
    { label: "附錄", items: [
      { id:"ch30", n:"附", title:"原廠文件索引", file:"ch30-appendix.html" }
    ]}
  ]
};
