# 제14장: Keycloak 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> 인증 허브: 사용자, 역할, OIDC 클라이언트, AD 페더레이션, 세션 관리.

[← 제13장: 상호 연결 검증 체크리스트](ch13-interconnect.md) · [📖 목차](index.md) · [제15장: NewAPI 일상 관리 →](ch15-ops-newapi.md)

---

**진입점**: `http://<서버-IP>:9090` → Administration Console → 관리자 로그인.

> 📌 이러한 작업 대부분은 AI 관리 센터 → Keycloak 페이지에서도 가능합니다(전역 관리자만): LDAP 전체/증분 동기화, 사용자 삭제, 역할 관리(목록/생성/삭제/멤버 확인). 12.6장 참조.

## 14.1 사용자 관리

1. **사용자 생성**: Users → Add user → 사용자명 입력 → Create;

2. **비밀번호 설정**: 해당 사용자 Credentials 탭 → 비밀번호 설정 → Temporary 끄기 (아니면 최초 로그인 시 강제 비밀번호 변경);

3. **비밀번호 재설정**: Users → 사용자 검색 → Credentials → Set password;

4. **비활성화/활성화**: 사용자 상세 상단 Enabled 스위치 (비활성화 시 해당 사용자의 모든 SSO가 즉시 무효화);

5. **삭제**: 사용자 상세 → Delete.

## 14.2 역할 및 권한

- **Realm Role**: Realm roles → Create role로 역할 생성 (예: `ai-platform-admin`);

- **역할 할당**: 사용자 → Role mapping → Assign role;

- **그룹**: Groups → 그룹 생성 (`ai-admin` / `ai-user`) → 그룹에 사용자 추가, 역할을 그룹에 부여하면 사용자가 그룹을 따라 권한 상속.

> ✅ 관리 권한은 `ai-platform-admin` 역할로 통합 제어하며, 각 제품이 SSO 연동 시 이 역할로 관리자를 식별합니다.

## 14.3 OIDC 클라이언트 (신규 제품 SSO 연동)

1. Clients → Create client → Client ID에 제품명 입력 (예: `newapi` / `grafana` / `langfuse`);

2. Client authentication: On (아니면 Credentials 탭 없음), Standard flow: On;

3. Valid redirect URIs / Web origins에 제품 콜백 주소 입력 (내부망 IP + 127.0.0.1 둘 다 추가);

4. 저장 → Credentials 탭에서 Client secret 복사해 제품 측에 제공.

## 14.4 AD / LDAP 페더레이션 유지보수

- **도메인 컨트롤러/비밀번호 변경**: User Federation → LDAP Provider 클릭 → Connection URL / Bind credentials 수정 → Save;

- **수동 동기화**: Synchronize all users;

- **그룹 매핑**: Mappers 탭 → group-ldap-mapper → Groups DN에 AD 그룹이 있는 컨테이너 설정, AD 그룹을 Keycloak 역할로 매핑.

## 14.5 세션 관리

- **활성 세션 조회**: Users → 특정 사용자 → Sessions;

- **강제 로그아웃**: Sessions → Sign out all;

- **전역 세션/토큰 설정**: Realm settings → Sessions / Tokens 탭에서 타임아웃 조정.

> ⚠️ 핵심 함정 복습: ① bind DN의 CN에 공백이 있으면 그대로 유지; ② Username LDAP attribute는 `sAMAccountName` 사용, `cn` 아님; ③ Search scope는 Subtree 선택; ④ SSO의 `unknown_error`는 대부분 호스트 iphlpsvc 미실행으로 AD 포트 포워딩이 무효화된 경우; ⑤ AD 도메인 컨트롤러 VM이 꺼져 있으면 LDAP 페더레이션 계정 로그인 시 `LDAP Connection refused` 오류.

> 📖 원문 문서:Keycloak 공식 문서 https://www.keycloak.org/documentation · 서버 관리 가이드 https://www.keycloak.org/server/

---

[← 제13장: 상호 연결 검증 체크리스트](ch13-interconnect.md) · [📖 목차](index.md) · [제15장: NewAPI 일상 관리 →](ch15-ops-newapi.md)
