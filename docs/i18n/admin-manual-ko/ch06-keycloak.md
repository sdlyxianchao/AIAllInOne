# 제6장: Keycloak: Realm, 사용자 및 AD

*제1부 · 배포편*

> Realm 생성, 로컬 계정 생성, 또는 Active Directory에서 도메인 계정 가져오기——모든 제품 SSO의 기반.

[← 제5장: Dify 독립 배포](ch05-dify-deploy.md) · [📖 목차](index.md) · [제7장: NewAPI: 초기화, 채널 및 OIDC →](ch07-newapi.md)

---

> 📌 접속: 호스트 `http://127.0.0.1:9090`, 내부망 `http://<서버-IP>:9090`. 데이터는 명명 볼륨 `keycloak-data`에 저장되어 컨테이너 재생성 시에도 유지됩니다. 자격 증명은 `.env.windows`의 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` 참조.

## 6.1 Realm 생성

1. 브라우저에서 `http://127.0.0.1:9090` 열기 → Administration Console → 관리자 로그인;

2. 좌측 상단 드롭다운 → **Create Realm** → Realm name에 `enterprise-ai` 입력 → Create.

## 6.2 방식 A: 로컬 계정 생성 (AD 없는 소규모 팀/테스트)

1. **Groups** → Create Group → `ai-admin`; 이어서 `ai-user` 생성;

2. **Users** → Add user → 사용자명 → Create;

3. Credentials 탭 → 비밀번호 설정 → Temporary 끄기;

4. Groups 탭 → `ai-user` 그룹에 추가.

## 6.3 방식 B: Active Directory에서 계정 가져오기 (권장)

회사에 이미 Windows AD 도메인 컨트롤러가 있으면 직원이 도메인 계정으로 로그인하므로 Keycloak에 수동으로 계정을 만들 필요가 없습니다. 전제: Docker 컨테이너에서 도메인 컨트롤러 네트워크까지 연결되어야 함 (네트워크 토폴로지, Hyper-V Internal Switch, 포트 포워딩은 《Keycloak AD 통합 가이드》 `windows-ad-integration.html` 참조).

> 📌 필요한 AD 계정: 서비스 계정 `svc_keycloak` (비밀번호 만료 없음, LDAP 바인딩용) + 테스트 도메인 사용자 2명 (동기화 검증).

### LDAP 사용자 페더레이션 생성

1. enterprise-ai Realm → 좌측 **User Federation** → Add provider → **ldap**;

2. 아래 표대로 입력.

| 설정 항목 | 값 | 설명 |
| --- | --- | --- |
| Vendor | **Active Directory** | AD 선택, Other 선택 금지 (그렇지 않으면 objectGUID 미인식) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 경유 포트 포워딩; 운영 환경은 `ldap://dc.회사-도메인:389` 입력 |
| Enable StartTLS | **Off** | LDAP 389 또는 LDAPS 636 |
| Bind type | **simple** | 사용자명+비밀번호 인증 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **반드시 LDAP DN 형식**, ~~DOMAIN\사용자~~ 사용 금지 |
| Bind credentials | `svc_keycloak 비밀번호` | `.env.windows` 참조 |
| Edit mode | **READ_ONLY** | 읽기 전용, AD에 쓰기 금지 |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 하위 OU가 있으면 `DC=testcompany,DC=local`로 변경 |
| Username LDAP attribute | `sAMAccountName` | **cn 입력 금지** |
| RDN LDAP attribute | `cn` | 엔트리 명명 속성 |
| UUID LDAP attribute | `objectGUID` | AD 불변 고유 식별자 |
| User object classes | `person, organizationalPerson, user` | 쉼표 구분 |
| Search scope | **Subtree** | **One Level 선택 금지** (하위 OU 검색 불가) |
| Pagination | **On** | 사용자 많을 때 분할 가져오기 |
| Referral | **ignore** | 존재하지 않는 도메인 컨트롤러로 이어지는 것 방지 |
| Import users | **On** | 전체 동기화 가져오기 |
| Sync Registrations | **On** | 최초 로그인 즉시 동기화 |

Save → **Synchronize all users** → 동기화 완료 대기.

> ⚠️ 흔한 입력 오류:
> - Bind DN은 **LDAP 형식** (`CN=svc_keycloak,CN=Users,DC=xxx`), ~~DOMAIN\사용자~~ 아님;
> - Username LDAP attribute = `sAMAccountName`, `cn` 아님;
> - Search scope = **Subtree**;
> - **CN에 공백이 있으면 그대로 유지**: 표시 이름에 공백이 있으면 (예: `ai all in one admin` 가운데가 공백), Bind DN을 반드시 `CN=ai all in one admin,...`으로 써야 하며, 밑줄로 바꾸면 연결되지 않습니다.

### AD 로그인 검증

1. 시크릿 창에서 `http://127.0.0.1:9090/realms/enterprise-ai/account` 열기;

2. 도메인 계정으로 로그인 (사용자명 `aitest1` 또는 `aitest1@<회사-도메인>` UPN 모두 가능);

3. Account Console로 성공적으로 이동하면 통과.

## 6.4 기타 기업 신원 소스 (부록 N 요약)

Keycloak은 여러 신원 소스를 지원하며 모두 같은 `enterprise-ai` Realm에 연결합니다:

| 신원 소스 | 연동 방식 | 핵심 |
| --- | --- | --- |
| Microsoft Entra ID (구 Azure AD) | Identity Providers → OpenID Connect v1.0 | Azure 앱 등록으로 client id/secret 획득, redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (내장) | Mapper로 `hd=도메인` 추가해 도메인 제한 가능 |
| GitHub | Identity Providers → GitHub (내장) | OAuth App 콜백 `/broker/github/endpoint` |
| 범용 LDAP (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor는 Other 선택, Username attribute는 `uid` 사용 |
| 범용 SAML 2.0 (Okta/ADFS) | Identity Providers → SAML v2.0 | IdP 메타데이터 URL 붙여넣기로 자동 채움 |

> ✅ 다중 신원 소스 공존: Authentication → Browser flow에 Identity Provider Redirector를 추가해 이메일 도메인에 따라 자동으로 IdP 선택 (`@회사.com`→AD, `@회사.onmicrosoft.com`→Entra ID).

> 📖 원문 문서:Keycloak 공식 문서 https://www.keycloak.org/documentation · 서버 관리 가이드 https://www.keycloak.org/server/ · LDAP 페더레이션 https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← 제5장: Dify 독립 배포](ch05-dify-deploy.md) · [📖 목차](index.md) · [제7장: NewAPI: 초기화, 채널 및 OIDC →](ch07-newapi.md)
