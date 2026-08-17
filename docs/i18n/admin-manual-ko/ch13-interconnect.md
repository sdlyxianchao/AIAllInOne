# 제13장: 상호 연결 검증 체크리스트

*제1부 · 배포편*

> 배포 완료 후 12개 상호 연결 링크를 항목별로 모두 연결되었는지 확인.

[← 제12장: AI 관리 센터](ch12-admin-center.md) · [📖 목차](index.md) · [제14장: Keycloak 일상 관리 →](ch14-ops-keycloak.md)

---

배포편은 여기까지입니다. 마지막으로 아래 12개 항목을 차례로 검증하고, 전부 ✅이어야 플랫폼이 실제로 정상 동작하는 것입니다.

| # | 상호 연결 | 검증 방법 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI 채널 테스트에서 OK 수신 |
| 2 | Dify → NewAPI | Dify 모델 공급자 테스트에서 응답 수신 |
| 3 | DeepChat → NewAPI | DeepChat 메시지 전송 시 응답 수신 |
| 4 | Keycloak → NewAPI | Keycloak 계정으로 OIDC 로그인 NewAPI |
| 5 | Keycloak → Dify | Keycloak 계정으로 SSO 로그인 Dify |
| 6 | MCP Gateway → DeepChat | DeepChat이 MCP 도구 목록 조회 및 호출 |
| 7 | MCP Gateway → Dify | Dify 워크플로에서 MCP 도구 호출 |
| 8 | Gitea Runner → Docker | Runner가 CI/CD 작업 실행 가능 |
| 9 | Gitea → 업데이트 서버 | CI 산출물을 업데이트 서버에 업로드 가능 |
| 10 | Ghost API → Gitea | Gitea Actions가 Ghost API 호출로 공지 발행 가능 |
| 11 | Ghost → Dify 이동 | 포털 「AI 워크벤치」가 Dify로 정상 이동 |
| 12 | AI 관리 센터 | Dashboard에 전체 컨테이너 표시 + 좌측 메뉴로 모든 제품 접근 가능 |

> ✅ 전체 통과 후, 제2부 「관리편」에서 각 제품의 일상 운영을, 제3부 「운영편」에서 백업, 상태 점검, 문제 해결을 계속 학습하세요.

---

[← 제12장: AI 관리 센터](ch12-admin-center.md) · [📖 목차](index.md) · [제14장: Keycloak 일상 관리 →](ch14-ops-keycloak.md)
