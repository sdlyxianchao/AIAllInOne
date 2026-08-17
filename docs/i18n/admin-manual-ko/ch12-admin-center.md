# 제12장: AI 관리 센터

*제1부 · 배포편*

> 통합 관리자 포털: Keycloak 인증, 좌측 메뉴에 모든 제품 임베드, Dashboard 클러스터 상태.

[← 제11장: MCP Gateway 및 Skill 마켓](ch11-mcp.md) · [📖 목차](index.md) · [제13장: 상호 연결 검증 체크리스트 →](ch13-interconnect.md)

---

> 📌 포지셔닝: Docker 관리 플랫폼 (1Panel/Portainer)이 아니라 관리자를 위한 통합 백오피스——Keycloak 인증 + 좌측 메뉴로 모든 제품 연결 + Dashboard 클러스터 상태 + 통합 관리자 계정.

## 12.1 핵심 기능

| 메뉴 항목 | 동작 | 설명 |
| --- | --- | --- |
| 📊 개요 대시보드 | 임베드 페이지 | 8개 제품 비즈니스 지표 + Docker 서비스 (제품별 그룹) + 시스템 정보 |
| Ghost / Dify / Gitea / Keycloak | 임베드 통계 페이지 | 먼저 통계를 보고, 「백오피스 열기」 클릭 시에만 이동 |
| 🔀 NewAPI 관리 | 임베드 페이지 | 채널/사용자/키 + 비용 보고서 + 감사 로그 |
| 🔌 MCP Gateway | 임베드 관리 페이지 | MCP Server 증감, Skill 업로드/삭제 |
| 📈 모니터링 / 🔍 옵저버빌리티 | 새 탭 | Grafana :3030 / Langfuse :3010 |
| 📜 통합 로그 | 임베드 페이지 | 컨테이너+키워드+시간으로 Loki 조회 |
| 💾 백업 복구 | 임베드 페이지 | 백업 목록 + 즉시 백업 + 원클릭 복구 |
| 🩺 가용성 테스트 | 임베드 페이지 | 정기+수동 전체 링크 테스트 |
| 📄 보고서 생성 | 임베드 페이지 | 사용자 지정 주기로 .md 내보내기 |
| ⚙️ 시스템 설정 | 임베드 페이지 | 인터페이스 언어 9종 + 제품 진입 URL |

## 12.2 Global Administrator 초기화

```
# .env에 설정
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=계정 비밀번호 목록 참조
ADMIN_EMAIL=ai_all_in_one_admin@<회사-도메인>
```

시작 후 자동으로 Keycloak에 `ai_all_in_one_admin` 사용자를 생성하고 (이미 있으면 건너뜀) `ai-platform-admin` Realm Role을 할당합니다. 핵심 이념: **하나의 Global Admin 계정으로 모든 플랫폼 관리**.

## 12.3 Docker Compose 배포

```
# 전제: 먼저 의존성 설치 (1회)
cd admin-portal
npm install
cd ..
```

```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<서버-IP>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<회사-도메인>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<서버-IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```

## 12.4 Keycloak 클라이언트 설정

1. Keycloak → enterprise-ai → Clients → Create;

2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow 모두 On;

3. Valid Redirect URIs: `http://127.0.0.1:10086/*` 및 `http://<서버-IP>:10086/*`;

4. Client Secret 복사 → `.env`의 `KEYCLOAK_CLIENT_SECRET`에 입력 → `docker compose up -d admin-portal`;

5. Realm Role `ai-platform-admin` 생성, `ai_all_in_one_admin`에 할당.

> ⚠️ 배포/문제 해결 핵심:
> - admin-portal 세션은 메모리에 저장되어 `up -d`로 컨테이너 재생성 시 **로그인 세션이 초기화**됩니다 (재로그인 필요);
> - 홈 `/`은 반드시 Keycloak 보호를 거쳐야 합니다 (`express.static(..., {index:false})` + 명시적 `app.get('/', keycloak.protect())`), 아니면 미로그인 시 빈 대시보드가 바로 렌더링됩니다;
> - Dify 통계는 실제 관리자 이메일 (`ai_all_in_one_admin@<회사-도메인>`, AD 전역 관리자와 동일) 사용;
> - **server.js 수정 후 반드시 `docker restart admin-portal`**, `up -d` 사용 금지 (volume 파일 내용 변경은 재빌드를 트리거하지 않음).

## 12.5 검증

1. `http://<서버-IP>:10086` 열기 → 자동으로 Keycloak 로그인 이동 (미로그인 시 빈 대시보드 표시 안 됨);

2. `ai_all_in_one_admin`으로 로그인 → 개요 대시보드 진입;

3. Dashboard에 8개 제품 지표 + 컨테이너 그룹 표시;

4. 각 제품 클릭 시 먼저 통계 표시, 「백오피스 열기」 클릭 시에만 이동;

5. 시스템 설정에서 9개 언어 전환 가능.

## 12.6 모듈별 관리자 권한 + Keycloak 페이지 관리 (v0.91)

전역 관리자는 AI 관리 센터에서 다른 관리자와 Keycloak을 직접 관리할 수 있습니다:

- **관리자 계정 관리**: Keycloak 연동 IdP에서 기존 계정 검색(AD/LDAP 사용자, 신규 생성 없음·비밀번호 불필요) → 모듈 선택 → 확인. 시스템은 `admin:<제품>` Realm Role을 부여하고 **실제로 제품에 프로비저닝**(SSO 우선·API 폴백): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. 모듈 취소 또는 관리자 삭제는 **제품에서 계정을 삭제**합니다. SSO 없는 제품은 임시 비밀번호를 생성하며 🔑 아이콘으로 확인 가능(전역 관리자만). 비관리자는 「관리자가 아닙니다」 대화상자가 표시되고 로그아웃됩니다.

- **Keycloak 페이지**: 「전체 동기화 / 변경 동기화」 버튼으로 AD 속성 변경을 한 번에 반영; 각 사용자 행에 「편집」(Keycloak 콘솔로)과 「삭제」; 역할 섹션에서 역할 생성/삭제·멤버 확인 가능. 동기화/삭제/역할 작업은 전역 관리자만.

> ⚠️ 참고: Keycloak에는 「단일 사용자 동기화」 엔드포인트가 없으며 증분 동기화는 AD의 변경된 계정을 모두 가져옵니다. AD 페더레이션 사용자는 다음 전체 동기화 또는 SSO 로그인 시 다시 나타납니다. 영구 제거하려면 AD에서 비활성화/삭제하세요.

---

[← 제11장: MCP Gateway 및 Skill 마켓](ch11-mcp.md) · [📖 목차](index.md) · [제13장: 상호 연결 검증 체크리스트 →](ch13-interconnect.md)
