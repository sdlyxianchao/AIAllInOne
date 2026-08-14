/* AI AllInOne 管理员手册 · 目录数据（多页电子书） */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne 管理员手册",
  subtitle: "v0.2 · 部署 · 管理 · 运维",
  home: "index.html",
  parts: [
    { label: "第一部分 · 部署篇", items: [
      { id:"ch01", n:"1",  title:"平台概览与架构", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"前置准备", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"配置文件与环境变量", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"启动核心服务", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Dify 独立部署", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak：Realm、用户与 AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI：初始化、渠道与 OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM：验证与缓存", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Dify / Ghost / Gitea 配置", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"DeepChat 分发与 CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway 与 Skill 市场", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"AI 管理中心", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"互连验证清单", file:"ch13-interconnect.html" }
    ]},
    { label: "第二部分 · 管理篇（各产品日常操作）", items: [
      { id:"ch14", n:"14", title:"Keycloak 日常管理", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"NewAPI 日常管理", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"LiteLLM 日常管理", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Dify 日常管理", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Ghost 日常管理", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gitea 日常管理", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"MCP Gateway 日常管理", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"更新服务器管理", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"监控告警管理", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"LLM 可观测（Langfuse）", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"统一日志（Loki）", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"PII 脱敏（Presidio）", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog 邮件接收器", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "第三部分 · 运维篇", items: [
      { id:"ch27", n:"27", title:"备份与恢复", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"健康检查与开机自检", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"故障排查手册", file:"ch29-troubleshooting.html" }
    ]},
    { label: "附录", items: [
      { id:"ch30", n:"附", title:"原厂文档索引", file:"ch30-appendix.html" }
    ]}
  ]
};
