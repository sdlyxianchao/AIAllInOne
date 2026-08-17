# 제3장: 설정 파일 및 환경 변수

*제1부 · 배포편*

> 세 가지 핵심 설정 파일 + 전체 환경 변수 설명, 지금 설정할 것과 나중에 설정할 것.

[← 제2장: 사전 준비](ch02-prereq.md) · [📖 목차](index.md) · [제4장: 핵심 서비스 시작 →](ch04-start.md)

---

## 3.1 세 가지 핵심 설정 파일

| 파일 | 용도 | 수정 필요 여부 |
| --- | --- | --- |
| `.env.windows` | 모든 비밀번호와 외부 API Key | **반드시 수정**: DeepSeek API Key 입력, 기타 provider는 필요 시 |
| `litellm-config.yaml` | LiteLLM 모델 목록 + PII 비식별화 규칙 | 보통 수정 안 함 (DeepSeek만 사용 시 OpenAI/Claude 항목 삭제 가능) |
| `docker-compose.yml` | 핵심 서비스 오케스트레이션 | 사전 설정됨 (Keycloak `KC_HOSTNAME` + 영속 볼륨 포함) |

## 3.2 환경 변수 분류 개요

`.env`를 열어 (`.env.windows`를 복사해 온 것) 우선순위에 따라 설정하세요.

| 변수 | 우선순위 | 설명 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 즉시 | 외부 LLM API Key, 미설정 시 링크가 연결되지 않음 |
| `LITELLM_MASTER_KEY` | 🔴 즉시 | LiteLLM 내부 인증 키, NewAPI가 사용 |
| `NEWAPI_DB_PASSWORD` | 🔴 즉시 | MySQL root 비밀번호, 최초 생성 후 변경 지양 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 즉시 | Keycloak 관리자 비밀번호 |
| `NEWAPI_SESSION_SECRET` | 🔴 즉시 | NewAPI 세션 암호화, 무작위 문자열 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 즉시 | NewAPI 데이터 암호화, 무작위 문자열 |
| `ADMIN_PASSWORD` | 🔴 즉시 | AI 관리 센터 Global Admin 비밀번호 |
| `SESSION_SECRET` | 🔴 즉시 | AI 관리 센터 세션 암호화, 무작위 문자열 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 나중에 설정 가능 | 먼저 Keycloak에서 OIDC Client 생성 후 Secret 획득 필요 (제12장 참조) |
| `GITEA_RUNNER_TOKEN` | 🟡 나중에 설정 가능 | 먼저 Gitea를 시작하고 관리 페이지에서 Token 획득 (제9장 참조) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 필요 시 | 사용 시 주석 해제하고 `litellm-config.yaml`도 동시에 수정 |
| `GLOBAL_WEB_RATE_LIMIT` 등 속도 제한 항목 | ⚪ 기본값 | 테스트 기간 999999 설정, 운영 시 적절히 낮춤 |
| `DEFAULT_QUOTA` | ⚪ 기본값 | 신규 사용자 기본 할당량 (달러), 100 설정 시 신규 사용자에게 100달러 제공 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ 기본값 | 신규 사용자 등록 시 초기 Key 자동 생성, true 설정 시 사용자 로그인 즉시 사용 가능 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ 기본값 | 기본값 사용 |

## 3.3 🔴 즉시 설정 (최초 시작 전 반드시 완료)

| 변수 | 설명 | 획득 방법 | 형식 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 클라우드 LLM Key | https://platform.deepseek.com 가입 → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM 내부 관리자 키 (외부 LLM Key 아님) | 무작위 생성 (아래 참조) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL 비밀번호 | 직접 지정, 최초 생성 후 **변경 지양** | 임의 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 관리자 비밀번호 | 직접 지정, 8자 이상 | 임의 |
| `NEWAPI_SESSION_SECRET` | NewAPI 세션 암호화 | 무작위 생성 | 32자 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI 데이터 암호화 | 무작위 생성 | 32자 |
| `ADMIN_PASSWORD` | AI 관리 센터 관리자 비밀번호 | 직접 지정, 8자 이상 | 임의 |
| `SESSION_SECRET` | AI 관리 센터 세션 암호화 | 무작위 생성 | 64자 |

무작위 문자열 생성 (PowerShell):

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### API Key 입력 예시

```
# 기본적으로 DeepSeek가 설정되어 있습니다 (주석 해제 후 Key 입력)
DEEPSEEK_API_KEY=sk-당신의-실제-DeepSeek-키

# OpenAI / Claude가 필요하면 주석 해제하고 litellm-config.yaml의 해당 model 블록 주석도 함께 해제하세요
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 비밀번호 변경 정책

> ⚠️ `NEWAPI_DB_PASSWORD`는 이미 생성된 데이터베이스와 관련되어 있어 변경 시 해당 volume을 삭제하고 다시 만들어야 합니다 (데이터 손실). 최초에 잘 정하는 것을 권장합니다.
 `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` 등 관리 비밀번호는 각 제품 관리 페이지에서 변경할 수 있으며, 변경 후 `.env`를 동기화 업데이트하세요 (참고용일 뿐 실행에는 영향 없음).

## 3.5 litellm-config.yaml 설명

- `model_list` — 사용 가능한 외부 모델 정의, NewAPI가 LiteLLM을 경유해 호출. 기본적으로 `deepseek-chat`만 활성화;

- `general_settings.master_key` — LiteLLM 관리자 키, `.env`의 `LITELLM_MASTER_KEY`를 읽음;

- PII 비식별화 (Presidio)는 현재 **임시 주석 처리** (새 LiteLLM guardrail API 변경으로 호환 불가), 이후 활성화는 제25장 참조;

- 안정 버전 `v1.95.1` 사용 (`main-latest`는 알려진 버그 있음).

---

[← 제2장: 사전 준비](ch02-prereq.md) · [📖 목차](index.md) · [제4장: 핵심 서비스 시작 →](ch04-start.md)
