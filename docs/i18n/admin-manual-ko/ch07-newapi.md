# 제7장: NewAPI: 초기화, 채널 및 OIDC

*제1부 · 배포편*

> 초기 설치 마법사 완료, LiteLLM을 가리키는 채널 설정, API Key 발급, Keycloak OIDC 연동.

[← 제6장: Keycloak: Realm, 사용자 및 AD](ch06-keycloak.md) · [📖 목차](index.md) · [제8장: LiteLLM: 검증 및 캐시 →](ch08-litellm.md)

---

## 7.1 초기 설치 마법사 (최초 접속)

NewAPI 최초 실행 시 4단계 시스템 설정 마법사가 표시됩니다:

1. **데이터베이스 확인**: 「데이터베이스 연결 검증」 클릭, 초록 체크 예상.

2. **관리자 계정**: 사용자명 `ai_all_in_one_admin`, 이메일 `ai_all_in_one_admin@<회사-도메인>`, 비밀번호는 통합 관리자 비밀번호.

> 📌 왜 로컬 관리자를 먼저 만드는가: 이 시점에 OIDC가 아직 설정되지 않아 NewAPI가 Keycloak을 인식하지 못하므로, 먼저 로컬 계정으로 「문을 열고」 들어가 설정을 완료한 뒤 시스템 설정에서 OIDC를 켜야 합니다.

3. **사용 모드**: 「개인 사용」 선택 (회사 내부: 직원 가입 가능, 사용량 분리 조회, 충전/과금 모듈 없음).

4. **초기화 확인**: 데이터베이스 테이블 생성 → 관리자로 로그인.

## 7.2 LLM 채널 설정 (LiteLLM 가리킴)

1. **채널** → 새 채널 추가 → 유형 `OpenAI`;

2. Base URL에 `http://litellm:4000` 입력 (컨테이너 이름, Docker 네트워크 경유, **localhost 아님**);

3. 키에 `.env`의 `LITELLM_MASTER_KEY` 실제 값 입력 (예시 값 아님, 아니면 `No connected db` 오류);

4. 모델에 `deepseek-chat` 입력 (예시, 실제 설정에 따름);

5. 저장 → 「테스트」 클릭해 연결 확인.

여러 provider를 설정했다면 반복 추가: Claude 유형 `Anthropic Claude`, DeepSeek 유형 `OpenAI`, Base URL은 모두 `http://litellm:4000` 입력.

## 7.3 API 키 생성

Dify와 DeepChat용으로 각각 만들어 사용량을 분리 집계합니다:

1. 좌측 **API 키** → 새로 만들기;

2. 이름 `dify-key` → 저장 → `sk-xxx` 복사 (Dify 모델 공급자에 입력);

3. 이어서 `deepchat-key` 생성 → `sk-xxx` 복사 (DeepChat 사용자에게 배포).

## 7.4 일반 사용자 셀프 Key 신청 허용

직원 로그인 후 기본적으로 「API 키」 페이지에서 직접 Key를 만들 수 있습니다. 실제로 모델을 호출하려면 두 가지를 충족해야 합니다 (이미 `.env`에 사전 설정됨):

1. **할당량 있음**: `DEFAULT_QUOTA=100` (신규 사용자에게 100달러 할당량 제공);

2. **token 있음**: `GENERATE_DEFAULT_TOKEN=true` (가입 즉시 초기 token 생성).

> ⚠️ 「신규 가입」 사용자에게만 적용: 이미 로그인한 사용자 (예: `aitest1`)는 자동 지급되지 않으며, 관리자가 「사용자」 페이지에서 수동으로 할당량을 설정해야 합니다.

## 7.5 Keycloak OIDC 연동 (AD 사용자가 바로 로그인하도록)

### ① Keycloak에서 NewAPI OIDC Client 생성

1. enterprise-ai Realm → **Clients** → Create client;

2. Client ID `newapi`, 유형 OpenID Connect;

3. **Client authentication: On** (반드시 켜야 함, 아니면 Credentials 탭 없음), Standard flow / Direct access grants: On;

4. Valid redirect URIs: `http://<서버-IP>:3000/*` 및 `http://127.0.0.1:3000/*`;

5. 저장 → Credentials 탭 → Client secret 복사.

### ② NewAPI에서 OIDC 활성화

NewAPI 관리 페이지 → **시스템 설정 → 인증 → 사용자 지정 OAuth → OAuth 공급자 추가**, 입력:

| 그룹 | 설정 항목 | 값 |
| --- | --- | --- |
| 빠른 설정 | 프리셋 템플릿 / API 주소 | `Keycloak` / `http://127.0.0.1:9090` |
| 기본 정보 | 공급자 이름 / 식별자 | `Keycloak` / `keycloak` |
| 자격 증명 | Client ID / Secret | `newapi` / Keycloak에서 복사한 값 |
| 엔드포인트 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 필드 매핑 | 사용자 ID / 사용자명 / 이메일 | `sub` / `preferred_username` / `email` |

「자동 검색」을 눌러 엔드포인트를 채운 후, **토큰 엔드포인트와 사용자 정보 엔드포인트를 `host.docker.internal:9090`으로 변경**하세요 (NewAPI 컨테이너 내부에서 Keycloak 호출용). 인가 엔드포인트는 `<서버-IP>:9090` 유지 (브라우저 리다이렉트용). 스코프 `openid profile email`.

> ⚠️ 두 가지를 반드시 수정해야 하며, 아니면 로그인 실패:
> - **저장 후 Keycloak에 콜백 URL 추가**: `http://<서버-IP>:3000/oauth/keycloak` 및 `http://127.0.0.1:3000/oauth/keycloak`을 Valid redirect URIs에 추가;
> - **NewAPI 「서버 주소」를 내부망 주소로 설정**: 시스템 설정 → 일반 설정 → 서버 주소를 `http://<서버-IP>:3000`으로 변경 (기본 localhost는 token 교환 시 `invalid_grant - Incorrect redirect_uri` 오류 발생). 변경 후 본인도 내부망 IP로 NewAPI에 접속해야 합니다.

데이터베이스 수정 방법:

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<서버-IP>:3000') ON DUPLICATE KEY UPDATE value='http://<서버-IP>:3000';"
docker compose restart new-api
```

> ⚠️ 문제 해결: 로그인 시 **429 Too Many Requests** 반환——NewAPI 핵심 API 속도 제한 (기본 20회/20분) 트리거. 임시 해제: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; 영구 해결은 이미 `.env`에 `CRITICAL_RATE_LIMIT_ENABLE=false` 등 4개 변수 그룹이 사전 설정되어 있습니다.

> 📖 원문 문서:NewAPI 공식 문서 https://docs.newapi.pro · 공식 웹사이트 https://www.newapi.ai · 오픈소스 저장소 https://github.com/QuantumNous/new-api

---

[← 제6장: Keycloak: Realm, 사용자 및 AD](ch06-keycloak.md) · [📖 목차](index.md) · [제8장: LiteLLM: 검증 및 캐시 →](ch08-litellm.md)
