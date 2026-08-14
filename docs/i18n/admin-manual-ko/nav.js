/* AI AllInOne 관리자 매뉴얼 · 목차 데이터 (다중 페이지 전자책) */
window.BOOK_TOC = {
  icon: "🛠️",
  title: "AI AllInOne 관리자 매뉴얼",
  subtitle: "v0.2 · 배포 · 관리 · 운영",
  home: "index.html",
  parts: [
    { label: "제1부 · 배포편", items: [
      { id:"ch01", n:"1",  title:"플랫폼 개요 및 아키텍처", file:"ch01-overview.html" },
      { id:"ch02", n:"2",  title:"사전 준비", file:"ch02-prereq.html" },
      { id:"ch03", n:"3",  title:"설정 파일 및 환경 변수", file:"ch03-env.html" },
      { id:"ch04", n:"4",  title:"핵심 서비스 시작", file:"ch04-start.html" },
      { id:"ch05", n:"5",  title:"Dify 독립 배포", file:"ch05-dify-deploy.html" },
      { id:"ch06", n:"6",  title:"Keycloak: Realm, 사용자 및 AD", file:"ch06-keycloak.html" },
      { id:"ch07", n:"7",  title:"NewAPI: 초기화, 채널 및 OIDC", file:"ch07-newapi.html" },
      { id:"ch08", n:"8",  title:"LiteLLM: 검증 및 캐시", file:"ch08-litellm.html" },
      { id:"ch09", n:"9",  title:"Dify / Ghost / Gitea 설정", file:"ch09-products.html" },
      { id:"ch10", n:"10", title:"DeepChat 배포 및 CI/CD", file:"ch10-deepchat.html" },
      { id:"ch11", n:"11", title:"MCP Gateway 및 Skill 마켓", file:"ch11-mcp.html" },
      { id:"ch12", n:"12", title:"AI 관리 센터", file:"ch12-admin-center.html" },
      { id:"ch13", n:"13", title:"상호 연결 검증 체크리스트", file:"ch13-interconnect.html" }
    ]},
    { label: "제2부 · 관리편 (각 제품 일상 운영)", items: [
      { id:"ch14", n:"14", title:"Keycloak 일상 관리", file:"ch14-ops-keycloak.html" },
      { id:"ch15", n:"15", title:"NewAPI 일상 관리", file:"ch15-ops-newapi.html" },
      { id:"ch16", n:"16", title:"LiteLLM 일상 관리", file:"ch16-ops-litellm.html" },
      { id:"ch17", n:"17", title:"Dify 일상 관리", file:"ch17-ops-dify.html" },
      { id:"ch18", n:"18", title:"Ghost 일상 관리", file:"ch18-ops-ghost.html" },
      { id:"ch19", n:"19", title:"Gitea 일상 관리", file:"ch19-ops-gitea.html" },
      { id:"ch20", n:"20", title:"MCP Gateway 일상 관리", file:"ch20-ops-mcp.html" },
      { id:"ch21", n:"21", title:"업데이트 서버 관리", file:"ch21-ops-update.html" },
      { id:"ch22", n:"22", title:"모니터링 및 알림 관리", file:"ch22-ops-monitoring.html" },
      { id:"ch23", n:"23", title:"LLM 관측 (Langfuse)", file:"ch23-ops-langfuse.html" },
      { id:"ch24", n:"24", title:"통합 로그 (Loki)", file:"ch24-ops-loki.html" },
      { id:"ch25", n:"25", title:"PII 비식별화 (Presidio)", file:"ch25-ops-pii.html" },
      { id:"ch26", n:"26", title:"MailHog 메일 수신기", file:"ch26-ops-mailhog.html" }
    ]},
    { label: "제3부 · 운영편", items: [
      { id:"ch27", n:"27", title:"백업 및 복구", file:"ch27-backup.html" },
      { id:"ch28", n:"28", title:"상태 점검 및 부팅 자체 점검", file:"ch28-healthcheck.html" },
      { id:"ch29", n:"29", title:"문제 해결 매뉴얼", file:"ch29-troubleshooting.html" }
    ]},
    { label: "부록", items: [
      { id:"ch30", n:"부", title:"원문 문서 색인", file:"ch30-appendix.html" }
    ]}
  ]
};
