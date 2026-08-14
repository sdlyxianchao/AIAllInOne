/* AI AllInOne 管理者マニュアル · 目次データ（マルチページ電子書籍） */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne 管理者マニュアル",
  subtitle: "v0.2 · デプロイ · 管理 · 運用",
  home: "index.html",
  parts: [
    { label: "第一部 · デプロイ編", items: [
      { id:"ch01", n:"1",  title:"プラットフォーム概要とアーキテクチャ", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"事前準備", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"設定ファイルと環境変数", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"コアサービスの起動", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Dify の独立デプロイ", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak：Realm・ユーザー・AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI：初期化・チャネル・OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM：検証とキャッシュ", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Dify / Ghost / Gitea の設定", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"DeepChat の配布と CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway とスキルマーケット", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"AI 管理センター", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"相互接続検証チェックリスト", file:"ch13-interconnect.html" }
    ]},
    { label: "第二部 · 管理編（各製品の日常運用）", items: [
      { id:"ch14", n:"14", title:"Keycloak の日常管理", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"NewAPI の日常管理", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"LiteLLM の日常管理", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Dify の日常管理", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Ghost の日常管理", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gitea の日常管理", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"MCP Gateway の日常管理", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"更新サーバーの管理", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"監視・アラート管理", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"LLM 可観測性（Langfuse）", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"統合ログ（Loki）", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"PII マスキング（Presidio）", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog メール受信", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "第三部 · 運用編", items: [
      { id:"ch27", n:"27", title:"バックアップと復元", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"ヘルスチェックと起動時セルフチェック", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"トラブルシューティングマニュアル", file:"ch29-troubleshooting.html" }
    ]},
    { label: "付録", items: [
      { id:"ch30", n:"付", title:"公式ドキュメント索引", file:"ch30-appendix.html" }
    ]}
  ]
};
