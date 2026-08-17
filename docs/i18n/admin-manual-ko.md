# AI AllInOne 관리자 매뉴얼

*v0.2 · 배포 · 관리 · 운영*

**제1부 · 배포편**

## 1. 플랫폼 개요 및 아키텍처

### 1.1 이 플랫폼이란 무엇인가
「AI AllInOne」은 **기업 내부망 AI 플랫폼**으로, 10여 개의 오픈소스 제품을 Docker로 하나의 통합체로 오케스트레이션합니다: 통합 인증, LLM 라우팅, PII 비식별화, AI 애플리케이션, 기업 포털, 소스 CI, 클라이언트 배포, 통합 관리, 모니터링 알림, 옵저버빌리티, 로그, 백업 복구——모두 연동되며, **하나의 Keycloak 계정으로 모든 제품에 SSO 로그인**됩니다.
| 계층 | 컴포넌트 | 역할 |
| --- | --- | --- |
| 통합 인증 | Keycloak | SSO / OIDC, AD/LDAP 또는 로컬 계정 연동 가능 |
| LLM 라우팅 | NewAPI | 채널, 키, 할당량, 감사, 비용 |
| PII 비식별화 | LiteLLM + Presidio | 모델 호출 전 휴대폰번호/주민등록번호/이메일 등 자동 비식별화 |
| AI 애플리케이션 | Dify | 비주얼 AI 앱 / Agent / 지식베이스 플랫폼 |
| 기업 포털 | Ghost | 공지, 뉴스, 다운로드 센터, 직원 Hub |
| 소스 / CI | Gitea + Runner | 내부 Git 저장소 + Actions 자동화 |
| 클라이언트 | DeepChat | 로컬 AI 데스크톱 클라이언트 (Win/macOS/Linux) |
| 클라이언트 배포 | 업데이트 서버 | DeepChat 설치 패키지 호스팅 및 자동 업데이트 |
| 통합 관리 | AI 관리 센터 | 유일한 관리 진입점: Dashboard + 제품 임베드 + 감사/비용/보고서 |
| 게이트웨이 | MCP Gateway | Skill / MCP 마켓 관리 |
| 모니터링 알림 | Prometheus + Grafana + Alertmanager | 컨테이너 리소스 모니터링 + 알림 통지 |
| LLM 옵저버빌리티 | Langfuse | 매 모델 호출의 trace / 지연시간 / token / 비용 |
| 통합 로그 | Loki + Promtail | 모든 컨테이너 로그 집계 검색 |
| 백업 복구 | backup / restore 스크립트 + 관리 페이지 | 전체 데이터 매일 백업 + 원클릭 복구 |
### 1.2 소프트웨어/하드웨어 요구사항
| 항목 | 최소 요구사항 | 권장 사양 |
| --- | --- | --- |
| 운영체제 | Windows 11 (Docker Desktop + WSL2 백엔드) | Windows 11 Pro / Enterprise (추가로 Hyper-V로 AD 도메인 컨트롤러 실행 지원) |
| CPU | 4코어 / 8스레드 | 8코어 / 16스레드 |
| 메모리 | 16 GB | 32 GB |
| 디스크 | 60 GB 여유 SSD | 150 GB+ 여유 SSD |
| GPU | 별도 그래픽 카드 불필요 | 별도 그래픽 카드 불필요 |
> 📌 실측 기준: 약 30개 컨테이너가 유휴 상태일 때 합계 약 5 GB 메모리, Dify 처리/인덱싱, Keycloak JVM, 데이터베이스 캐시 등 피크 시 3–5 GB 추가, WSL2 가상 메모리까지 더하면 16 GB가 최소, 32 GB가 여유 있는 값입니다. 모든 대형 모델은 외부 API(deepseek-chat 등)를 사용하며 로컬에서 추론하지 않으므로 **GPU가 필요 없습니다**.
### 1.3 포트 할당표
아래에서는 호스트의 외부 주소를 `<서버-IP>`로 표기합니다 (현재 환경은 `192.168.31.117`이며, 배포 시 본인의 내부망 IP 또는 도메인으로 교체하세요).
| # | 제품 | 용도 | 로컬 접근 | 내부망 접근 (직원) |
| --- | --- | --- | --- | --- |
| 1 | AI 관리 센터 | 통합 관리자 포털 | `127.0.0.1:10086` | `<서버-IP>:10086` |
| 2 | Keycloak | 인증 / SSO | `127.0.0.1:9090` | `<서버-IP>:9090` |
| 3 | NewAPI | LLM 라우팅 게이트웨이 | `127.0.0.1:3000` | `<서버-IP>:3000` |
| 4 | LiteLLM | PII 비식별화 프록시 | `<서버-IP>:4001` | —(NewAPI에서만 호출) |
| 5 | Dify | AI 앱 플랫폼 | `127.0.0.1` | `<서버-IP>`(80 포트) |
| 6 | Ghost | 기업 포털 | `127.0.0.1:8090` | `<서버-IP>:8090` |
| 7 | Gitea | 소스 + CI/CD | `127.0.0.1:3002` | `<서버-IP>:3002` |
| 8 | 업데이트 서버 | DeepChat 설치 패키지 | `127.0.0.1:8091` | `<서버-IP>:8091` |
| 9 | MCP Gateway | Skill / MCP 게이트웨이 | `127.0.0.1:3100` | `<서버-IP>:3100` |
| 10 | Grafana | 모니터링 대시보드 | `127.0.0.1:3030` | `<서버-IP>:3030` |
| 11 | Prometheus | 지표 수집 / 알림 | `127.0.0.1:9091` | `<서버-IP>:9091` |
| 12 | Langfuse | LLM 옵저버빌리티 | `127.0.0.1:3010` | `<서버-IP>:3010` |
| 13 | Loki | 로그 집계 (내부) | `127.0.0.1:3110` | —(관리 페이지로 조회) |
| 14 | MailHog | 로컬 메일 수신 | `127.0.0.1:8025` | `<서버-IP>:8025` |
> ⚠️ 반드시 **내부망 IP**로 접속하고 `localhost`는 사용하지 마세요 (Docker Desktop WSL2는 IPv6 `::1` 지원이 불안정하여 포트 포워딩이 실패할 수 있습니다). 데이터베이스(MySQL/Redis/PostgreSQL)는 사용자에게 개방하지 않으며 Docker 네트워크 내부에서만 통신합니다.
### 1.4 핵심 데이터 흐름
#### LLM 요청 흐름 (가장 중요한 링크)
1. **① 전달**: DeepChat / Dify가 요청을 NewAPI에 전송 (`:3000/v1`);
2. **② 비식별화**: NewAPI가 LiteLLM으로 전달, LiteLLM이 정규식 + Presidio로 휴대폰번호/주민등록번호/이메일 등을 `[xxx_REDACTED]`로 대체;
3. **③ 외부 모델 요청**: 비식별화된 요청을 DeepSeek / GPT / Claude로 전송;
4. **④ PII 복원**: 응답이 돌아올 때 LiteLLM이 민감 정보를 복원;
5. **⑤ 반환**: 최종 결과가 클라이언트로 돌아갑니다.
#### 기타 흐름
- **인증 흐름**: Keycloak OIDC SSO로 모든 웹 제품에 통합 로그인 (공용 `ai_all_in_one_admin`);
- **옵저버빌리티 흐름**: LiteLLM `success_callback` → Langfuse가 매 호출을 추적;
- **자동 업데이트 흐름**: Gitea Actions 빌드 → 업데이트 서버 (:8091) → DeepChat이 `version.txt` 확인 후 자동 다운로드 설치;
- **통합 로그 흐름**: Promtail이 각 컨테이너 로그 수집 → Loki 집계 → AI 관리 센터 「통합 로그」 페이지에서 조회.
### 1.5 본서 구조 내비게이션
본 매뉴얼은 세 부분으로 구성됩니다: **배포편** (제1–13장, 처음부터 플랫폼 실행), **관리편** (제14–26장, 13개 제품 각각의 일상 운영), **운영편** (제27–29장, 백업/상태 점검/문제 해결). 사이드바로 언제든 이동할 수 있고 페이지 하단에 이전 장/다음 장 페이지 넘김이 있습니다.
> ✅ 배포 시 **AI Agent 도구**(WorkBuddy / OpenClaw 등)에 직접 맡겨 자동화할 수도 있습니다: 본 매뉴얼 + `docker-compose.yml` + `.env.example` + `scripts/`를 Agent에 넘기고 「배포편」 순서대로 단계적으로 실행하도록 하세요 (자세한 내용은 제2장 시작의 Agent 배포 프롬프트 참조).

## 2. 사전 준비

### 2.0 두 가지 배포 방식
본 매뉴얼은 **수동으로 장별 실행**할 수도, **AI Agent 도구에 맡겨 자동 실행**할 수도 있습니다. Agent 사용 시 본 디렉터리(본 매뉴얼, `docker-compose.yml`, `.env.example`, `scripts/` 포함)를 Agent에 제공하고 아래 프롬프트를 붙여넣으세요.
**Agent에 복사할 배포 프롬프트:**
```
당신은 기업 내부망 AI 플랫폼의 배포 엔지니어입니다. 본 디렉터리의 《관리자 매뉴얼》 배포편, docker-compose.yml 및 .env.example에 따라 현재 이 머신에 「AI AllInOne」 플랫폼을 완전히 배포하고 검증하세요. 전체 과정을 한국어로 소통하세요.

첫 번째 단계 파라미터 수집 (항목별로 제게 묻고, 건너뛰거나 추측하지 마세요):
1) 외부 서비스용 내부망 IP; 2) Skill 마켓 호스트명 (도메인, mcp-gateway/skills/skill-market/config.json과 SKILL.md의 <마켓-호스트명>을 교체하고 hosts/DNS에서 해석); 3) 신원 소스 (AD 도메인 컨트롤러 연동 시 도메인/도메인 컨트롤러 IP/LDAP base DN/bind DN/bind 비밀번호/sAMAccountName 필요); 4) 통합 관리자 계정 비밀번호; 5) 대형 모델 API Key; 6) 필요에 따라 알림 webhook, HTTPS, 백업 보존 정책을 물어보세요.

두 번째 단계 진행 파일을 생성하고, 각 항목 완료 시마다, 문제 해결 시마다 업데이트하고 보고하세요.

세 번째 단계 본 매뉴얼 제1~13장 순서를 엄격히 따라 실행하고, 각 장의 「⚠️ 핵심 함정」에 주의하며 scripts/ 아래의 스크립트로 자동화를 우선하세요.

네 번째 단계 오류가 나면 먼저 로그(docker logs, 헬스 엔드포인트, 설정)를 확인해 근본 원인을 찾아 수정한 후, 무작정 재시도하지 마세요.

다섯 번째 단계 전체 흐름 검증: 컨테이너 전부 Up, Keycloak SSO, NewAPI/LiteLLM 경유 실제 대화로 PII 비식별화 검증, 신원 소스 로그인, 모니터링/로그/알림, 백업 복구를 항목별로 ✅/❌로 정리하세요.
```
> 💡 Agent를 사용하지 않아도 위 내용은 「배포 전 정보 확인 체크리스트」로 활용할 수 있습니다: 배포 전에 내부망 IP, 신원 소스, 관리자 비밀번호, 모델 Key 네 가지를 먼저 정리하세요.
### 2.1 Docker Desktop 설치 및 설정
Docker Desktop 설치 후 기본적으로 WSL2 백엔드를 사용하므로 보통 추가 설정이 필요 없습니다. 리소스 상한을 수동 조정하려면 사용자 디렉터리에 `.wslconfig`를 생성하세요:
```
# %UserProfile%\.wslconfig (예: C:\Users\사용자명\.wslconfig)
[wsl2]
memory=24GB       # Docker 최대 메모리 (최소 16GB, 권장 24~32GB)
processors=8      # CPU 코어 수 (물리 코어 수 기준)
swap=4GB
```
저장 후 PowerShell에서 `wsl --shutdown`을 실행하고 Docker Desktop을 재시작하면 적용됩니다.
> ✅ 검증: Docker Desktop 상태 표시줄에 "Engine running"(초록색)이 표시됩니다.
### 2.2 디렉터리 구조 준비
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Docker 공유 네트워크 생성
```
docker network create ai-platform
docker network ls | findstr ai-platform   # 검증
```
> 모든 핵심 컨테이너는 `ai-platform` 네트워크를 통해 컨테이너 이름으로 서로 접근합니다 (예: NewAPI가 LiteLLM에 접근할 때 `http://litellm:4000` 사용, localhost 경유 안 함).
### 2.4 호스트 내부망 IP 고정 (중요)
호스트가 WiFi를 사용하면 IP가 DHCP로 동적 할당되어 재부팅이나 임대 만료 시 변경됩니다; 변경되면 직원이 각 제품에 접속하는 주소가 모두 무효화됩니다. 라우터에서 **DHCP 예약 (MAC 바인딩)**을 권장합니다:
1. WiFi 네트워크 카드 MAC 확인: `ipconfig /all`에서 「무선 LAN 어댑터 WLAN」의 물리적 주소 확인 (예: `60-A3-E3-41-8F-61`);
2. 라우터 관리 페이지 로그인 (예: `http://192.168.31.1`) → LAN 설정 / DHCP 정적 IP 할당;
3. 규칙 추가: MAC → IP (예: `192.168.31.117`), 저장;
4. WiFi 재연결 후 IP 고정 확인.
> ✅ DHCP 예약이 Windows에서 정적 IP를 설정하는 것보다 안정적입니다 (라우터가 통합 관리, 충돌 없음).
### 2.5 네트워크 연결 (가장 막히기 쉬운 단계)
- **Docker 이미지 레지스트리에 연결 가능**: Docker Hub / quay.io / ghcr.io. 안 되면 먼저 이미지 가속기(예: DaoCloud) 설정.
- **GitHub에 연결 가능**: 저장소 클론, 공개 의존성 다운로드. 안 되면 프록시 사용 또는 미리 소스 패키지 다운로드.
- **대상 머신이 내부망에서 접근 가능**: 노출할 네트워크 대역이 도달 가능한지 확인.

## 3. 설정 파일 및 환경 변수

### 3.1 세 가지 핵심 설정 파일
| 파일 | 용도 | 수정 필요 여부 |
| --- | --- | --- |
| `.env.windows` | 모든 비밀번호와 외부 API Key | **반드시 수정**: DeepSeek API Key 입력, 기타 provider는 필요 시 |
| `litellm-config.yaml` | LiteLLM 모델 목록 + PII 비식별화 규칙 | 보통 수정 안 함 (DeepSeek만 사용 시 OpenAI/Claude 항목 삭제 가능) |
| `docker-compose.yml` | 핵심 서비스 오케스트레이션 | 사전 설정됨 (Keycloak `KC_HOSTNAME` + 영속 볼륨 포함) |
### 3.2 환경 변수 분류 개요
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
### 3.3 🔴 즉시 설정 (최초 시작 전 반드시 완료)
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
#### API Key 입력 예시
```
# 기본적으로 DeepSeek가 설정되어 있습니다 (주석 해제 후 Key 입력)
DEEPSEEK_API_KEY=sk-당신의-실제-DeepSeek-키

# OpenAI / Claude가 필요하면 주석 해제하고 litellm-config.yaml의 해당 model 블록 주석도 함께 해제하세요
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 비밀번호 변경 정책
> ⚠️ `NEWAPI_DB_PASSWORD`는 이미 생성된 데이터베이스와 관련되어 있어 변경 시 해당 volume을 삭제하고 다시 만들어야 합니다 (데이터 손실). 최초에 잘 정하는 것을 권장합니다.  
> 
>     `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` 등 관리 비밀번호는 각 제품 관리 페이지에서 변경할 수 있으며, 변경 후 `.env`를 동기화 업데이트하세요 (참고용일 뿐 실행에는 영향 없음).
### 3.5 litellm-config.yaml 설명
- `model_list` — 사용 가능한 외부 모델 정의, NewAPI가 LiteLLM을 경유해 호출. 기본적으로 `deepseek-chat`만 활성화;
- `general_settings.master_key` — LiteLLM 관리자 키, `.env`의 `LITELLM_MASTER_KEY`를 읽음;
- PII 비식별화 (Presidio)는 현재 **임시 주석 처리** (새 LiteLLM guardrail API 변경으로 호환 불가), 이후 활성화는 제25장 참조;
- 안정 버전 `v1.95.1` 사용 (`main-latest`는 알려진 버그 있음).

## 4. 핵심 서비스 시작

### 4.1 .env 복사
```
# PowerShell
copy .env.windows .env
```
Docker Compose는 기본적으로 `.env`를 읽습니다.
### 4.2 전체 핵심 서비스 시작
```
docker compose -f docker-compose.yml up -d
```
최초 실행 시 모든 이미지를 풀링합니다 (약 5–10분, 네트워크 속도에 따라 다름).
| 이미지 | 컨테이너 | 크기 |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 컨테이너 상태 확인
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
예상되는 10개 핵심 컨테이너 모두 `Up`. 컨테이너가 계속 `Restarting`이면 `docker logs 컨테이너명`으로 원인을 확인하세요.
### 4.4 알려진 문제 수정: Ghost의 SQLite 강제
`ghost`가 계속 Restarting이고 로그에 `Error: connect ECONNREFUSED <서버-IP>:3306`이 나타나면——데이터 볼륨에 MySQL을 가리키는 이전 `config.production.json`이 남아 있다는 뜻입니다. 수정: compose의 ghost 서비스 `environment`에 SQLite를 명시적으로 선언하세요:
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ Windows + Docker Desktop WSL2 환경에서는 볼륨 데이터가 WSL2 가상 디스크 안에 있어 호스트 git bash에서 보이지 않으므로 볼륨 내 `config.production.json`을 직접 삭제할 수 없고, 「환경 변수 덮어쓰기」 방식으로만 해결할 수 있습니다. `docker volume rm windows_ghost-data`도 실행하지 마세요 (이미 게시된 글이 손실됩니다).
> ✅ 검증: 로그에 `Ghost database ready` + `Ghost booted`가 나타나고, `curl.exe -I http://127.0.0.1:8090`이 200을 반환.
### 4.5 서비스별 접근 가능 여부 검증
```
# Keycloak — 302이면 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (/ghost/ 초기화 페이지로 리다이렉트)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (빈 디렉터리, nginx 실행 중)
curl.exe -I http://127.0.0.1:8091
# AI 관리 센터 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM은 순수 API로 웹 인터페이스가 없어 컨테이너 내부에서 검증합니다:
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 예상 반환 {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 Docker Desktop WSL2의 HTTP 프록시 때문에 LiteLLM이 호스트에서 접근 불가할 수 있습니다 (HEART/빈 응답). 이는 알려진 버그이며 NewAPI가 컨테이너 이름으로 호출하는 데는 영향을 주지 않습니다.

## 5. Dify 독립 배포

> 📌 Dify는 공식 docker-compose(~15개 컨테이너 포함)를 사용하며, 독립 배포로 포트 충돌을 피하고 자체 기본 네트워크(핵심 서비스의 `ai-platform` 네트워크와 다름)를 사용합니다.
### 5.1 Dify 클론
```
# 방안 A: GitHub (접근 가능해야 함)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 방안 B: Gitee 공식 미러 (국내 권장)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 호환성 수정 + 환경 변수 복사
```
cd dify\docker

# env_file 형식 수정 (구버전 Docker Compose 호환)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 메인 환경 변수 복사
copy .env.example .env

# 모든 서브 템플릿 복사 (sandbox.env 등)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Dify 1.16.1 업스트림 검증 문제 수정 (필수)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 검증
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ 왜 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`를 반드시 바꿔야 하는가: Dify 1.16.1이 해당 필드를 「0 허용」에서 「반드시 > 0」으로 업그레이드했지만 `shared.env` 템플릿은 여전히 0입니다. 바꾸지 않으면 `docker-api-1` / `worker` / `worker_beat` / `api_websocket` 4개 컨테이너가 시작하자마자 크래시되고 로그에 `ValidationError: Input should be greater than 0`이 나타납니다.
### 5.3 Dify 시작
```
docker compose up -d
docker compose ps
```
> ✅ 모든 컨테이너 `Up` (`init_permissions`이 Exited로 표시되는 것은 정상). 브라우저에서 `http://127.0.0.1/install`을 열어 관리자 계정을 초기화하세요.
### 5.4 WebSocket 주소 수정 (안 고치면 계속 ws://localhost에 연결)
`.env`의 `NEXT_PUBLIC_SOCKET_URL` 기본값은 `ws://localhost`인데, 내부망 배포 시 브라우저의 localhost는 사용자 본인 컴퓨터를 가리켜 프런트엔드가 계속 연결되지 않습니다 (앱 생성/워크플로 디버깅이 멈춥니다).
```
# .env에서 내부망 IP로 변경
NEXT_PUBLIC_SOCKET_URL=ws://<서버-IP>

# docker-compose.yaml의 web 서비스 fallback도 함께 변경
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<서버-IP>}

# web 컨테이너 재빌드로 적용
docker compose up -d web
```
> 📌 변경 후 브라우저를 강력 새로고침하세요 (Ctrl+F5). 이 변수는 런타임에 읽히므로 .env 변경 + web 재시작으로 충분하며 이미지 재빌드는 필요 없습니다.
### 5.5 함정 빠른 참조
> ⚠️ **로그인 비밀번호는 base64로 전송**: Dify 1.16.x 로그인 API `POST /console/api/login`의 `password`는 base64로 인코딩된 비밀번호입니다. 스크립트 로그인 시 먼저 `base64(비밀번호)`를 해야 합니다; 프런트엔드에서 「로그인 클릭 시 반응 없음」은 console의 `GET /account/profile 401`이 미로그인 상태의 정상 현상입니다.
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<회사-도메인> \
  --new-password '<새-비밀번호>' \
  --password-confirm '<새-비밀번호>'
```
> ⚠️ **관리자 비밀번호 분실 시 재설정**: Dify 비밀번호 해시는 `pbkdf2_hmac('sha256', password, salt, 10000)`(반복 10000)이므로 역산할 수 없습니다. 컨테이너 명령으로 재설정하세요 (새 비밀번호 8자 이상):
>     
>     📖 원문 문서:Dify 공식 문서 https://docs.dify.ai · 자체 호스팅 배포 https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak: Realm, 사용자 및 AD

> 📌 접속: 호스트 `http://127.0.0.1:9090`, 내부망 `http://<서버-IP>:9090`. 데이터는 명명 볼륨 `keycloak-data`에 저장되어 컨테이너 재생성 시에도 유지됩니다. 자격 증명은 `.env.windows`의 `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` 참조.
### 6.1 Realm 생성
1. 브라우저에서 `http://127.0.0.1:9090` 열기 → Administration Console → 관리자 로그인;
2. 좌측 상단 드롭다운 → **Create Realm** → Realm name에 `enterprise-ai` 입력 → Create.
### 6.2 방식 A: 로컬 계정 생성 (AD 없는 소규모 팀/테스트)
1. **Groups** → Create Group → `ai-admin`; 이어서 `ai-user` 생성;
2. **Users** → Add user → 사용자명 → Create;
3. Credentials 탭 → 비밀번호 설정 → Temporary 끄기;
4. Groups 탭 → `ai-user` 그룹에 추가.
### 6.3 방식 B: Active Directory에서 계정 가져오기 (권장)
회사에 이미 Windows AD 도메인 컨트롤러가 있으면 직원이 도메인 계정으로 로그인하므로 Keycloak에 수동으로 계정을 만들 필요가 없습니다. 전제: Docker 컨테이너에서 도메인 컨트롤러 네트워크까지 연결되어야 함 (네트워크 토폴로지, Hyper-V Internal Switch, 포트 포워딩은 《Keycloak AD 통합 가이드》 `windows-ad-integration.html` 참조).
> 📌 필요한 AD 계정: 서비스 계정 `svc_keycloak` (비밀번호 만료 없음, LDAP 바인딩용) + 테스트 도메인 사용자 2명 (동기화 검증).
#### LDAP 사용자 페더레이션 생성
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
- ⚠️ 흔한 입력 오류:
      
        Bind DN은 **LDAP 형식** (`CN=svc_keycloak,CN=Users,DC=xxx`), ~~DOMAIN\사용자~~ 아님;
- Username LDAP attribute = `sAMAccountName`, `cn` 아님;
- Search scope = **Subtree**;
- **CN에 공백이 있으면 그대로 유지**: 표시 이름에 공백이 있으면 (예: `ai all in one admin` 가운데가 공백), Bind DN을 반드시 `CN=ai all in one admin,...`으로 써야 하며, 밑줄로 바꾸면 연결되지 않습니다.
#### AD 로그인 검증
1. 시크릿 창에서 `http://127.0.0.1:9090/realms/enterprise-ai/account` 열기;
2. 도메인 계정으로 로그인 (사용자명 `aitest1` 또는 `aitest1@<회사-도메인>` UPN 모두 가능);
3. Account Console로 성공적으로 이동하면 통과.
### 6.4 기타 기업 신원 소스 (부록 N 요약)
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

## 7. NewAPI: 초기화, 채널 및 OIDC

### 7.1 초기 설치 마법사 (최초 접속)
NewAPI 최초 실행 시 4단계 시스템 설정 마법사가 표시됩니다:
1. **데이터베이스 확인**: 「데이터베이스 연결 검증」 클릭, 초록 체크 예상.
> **관리자 계정**: 사용자명 `ai_all_in_one_admin`, 이메일 `ai_all_in_one_admin@<회사-도메인>`, 비밀번호는 통합 관리자 비밀번호.
>         📌 왜 로컬 관리자를 먼저 만드는가: 이 시점에 OIDC가 아직 설정되지 않아 NewAPI가 Keycloak을 인식하지 못하므로, 먼저 로컬 계정으로 「문을 열고」 들어가 설정을 완료한 뒤 시스템 설정에서 OIDC를 켜야 합니다.
3. **사용 모드**: 「개인 사용」 선택 (회사 내부: 직원 가입 가능, 사용량 분리 조회, 충전/과금 모듈 없음).
4. **초기화 확인**: 데이터베이스 테이블 생성 → 관리자로 로그인.
### 7.2 LLM 채널 설정 (LiteLLM 가리킴)
1. **채널** → 새 채널 추가 → 유형 `OpenAI`;
2. Base URL에 `http://litellm:4000` 입력 (컨테이너 이름, Docker 네트워크 경유, **localhost 아님**);
3. 키에 `.env`의 `LITELLM_MASTER_KEY` 실제 값 입력 (예시 값 아님, 아니면 `No connected db` 오류);
4. 모델에 `deepseek-chat` 입력 (예시, 실제 설정에 따름);
5. 저장 → 「테스트」 클릭해 연결 확인.
여러 provider를 설정했다면 반복 추가: Claude 유형 `Anthropic Claude`, DeepSeek 유형 `OpenAI`, Base URL은 모두 `http://litellm:4000` 입력.
### 7.3 API 키 생성
Dify와 DeepChat용으로 각각 만들어 사용량을 분리 집계합니다:
1. 좌측 **API 키** → 새로 만들기;
2. 이름 `dify-key` → 저장 → `sk-xxx` 복사 (Dify 모델 공급자에 입력);
3. 이어서 `deepchat-key` 생성 → `sk-xxx` 복사 (DeepChat 사용자에게 배포).
### 7.4 일반 사용자 셀프 Key 신청 허용
직원 로그인 후 기본적으로 「API 키」 페이지에서 직접 Key를 만들 수 있습니다. 실제로 모델을 호출하려면 두 가지를 충족해야 합니다 (이미 `.env`에 사전 설정됨):
1. **할당량 있음**: `DEFAULT_QUOTA=100` (신규 사용자에게 100달러 할당량 제공);
2. **token 있음**: `GENERATE_DEFAULT_TOKEN=true` (가입 즉시 초기 token 생성).
> ⚠️ 「신규 가입」 사용자에게만 적용: 이미 로그인한 사용자 (예: `aitest1`)는 자동 지급되지 않으며, 관리자가 「사용자」 페이지에서 수동으로 할당량을 설정해야 합니다.
### 7.5 Keycloak OIDC 연동 (AD 사용자가 바로 로그인하도록)
#### ① Keycloak에서 NewAPI OIDC Client 생성
1. enterprise-ai Realm → **Clients** → Create client;
2. Client ID `newapi`, 유형 OpenID Connect;
3. **Client authentication: On** (반드시 켜야 함, 아니면 Credentials 탭 없음), Standard flow / Direct access grants: On;
4. Valid redirect URIs: `http://<서버-IP>:3000/*` 및 `http://127.0.0.1:3000/*`;
5. 저장 → Credentials 탭 → Client secret 복사.
#### ② NewAPI에서 OIDC 활성화
NewAPI 관리 페이지 → **시스템 설정 → 인증 → 사용자 지정 OAuth → OAuth 공급자 추가**, 입력:
| 그룹 | 설정 항목 | 값 |
| --- | --- | --- |
| 빠른 설정 | 프리셋 템플릿 / API 주소 | `Keycloak` / `http://127.0.0.1:9090` |
| 기본 정보 | 공급자 이름 / 식별자 | `Keycloak` / `keycloak` |
| 자격 증명 | Client ID / Secret | `newapi` / Keycloak에서 복사한 값 |
| 엔드포인트 | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 필드 매핑 | 사용자 ID / 사용자명 / 이메일 | `sub` / `preferred_username` / `email` |
「자동 검색」을 눌러 엔드포인트를 채운 후, **토큰 엔드포인트와 사용자 정보 엔드포인트를 `host.docker.internal:9090`으로 변경**하세요 (NewAPI 컨테이너 내부에서 Keycloak 호출용). 인가 엔드포인트는 `<서버-IP>:9090` 유지 (브라우저 리다이렉트용). 스코프 `openid profile email`.
- ⚠️ 두 가지를 반드시 수정해야 하며, 아니면 로그인 실패:
      
        **저장 후 Keycloak에 콜백 URL 추가**: `http://<서버-IP>:3000/oauth/keycloak` 및 `http://127.0.0.1:3000/oauth/keycloak`을 Valid redirect URIs에 추가;
- **NewAPI 「서버 주소」를 내부망 주소로 설정**: 시스템 설정 → 일반 설정 → 서버 주소를 `http://<서버-IP>:3000`으로 변경 (기본 localhost는 token 교환 시 `invalid_grant - Incorrect redirect_uri` 오류 발생). 변경 후 본인도 내부망 IP로 NewAPI에 접속해야 합니다.
데이터베이스 수정 방법:
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<서버-IP>:3000') ON DUPLICATE KEY UPDATE value='http://<서버-IP>:3000';"
docker compose restart new-api
```
> ⚠️ 문제 해결: 로그인 시 **429 Too Many Requests** 반환——NewAPI 핵심 API 속도 제한 (기본 20회/20분) 트리거. 임시 해제: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`; 영구 해결은 이미 `.env`에 `CRITICAL_RATE_LIMIT_ENABLE=false` 등 4개 변수 그룹이 사전 설정되어 있습니다.
> 📖 원문 문서:NewAPI 공식 문서 https://docs.newapi.pro · 공식 웹사이트 https://www.newapi.ai · 오픈소스 저장소 https://github.com/QuantumNous/new-api

## 8. LiteLLM: 검증 및 캐시

> ⚠️ PII 비식별화 (Presidio guardrail)는 현재 **임시 비활성화** 상태입니다: 새 LiteLLM의 guardrail 설정 형식이 변경되어 `litellm-config.yaml`의 해당 부분이 주석 처리되었고, 현재 LiteLLM은 프록시 전달만 합니다 (비식별화 안 함). 활성화 방법은 제25장 참조.
### 8.1 LiteLLM 기본 사용 가능 여부 검증
```
curl -X POST http://<서버-IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>`는 LiteLLM 관리자 키로, `.env`의 실제 값을 사용하세요 (플레이스홀더 자체가 아니면 401). 반드시 내부망 IP `<서버-IP>:4001`을 사용하고 `127.0.0.1:4001`은 사용하지 마세요 (WSL2 포트 포워딩 문제).
### 8.2 응답 캐시 (내장, token 절약)
LiteLLM은 Redis exact match 캐시가 활성화되어 있습니다: 완전히 동일한 요청 (모델+메시지+파라미터)은 캐시를 바로 반환하며, 사용자 간 공유되어 token을 절약합니다.
```
# litellm-config.yaml 끝부분
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 독립 캐시 Redis
    port: 6379
    ttl: 3600            # 캐시 1시간
```
> 검증: `curl http://<서버-IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"`이 `ping_response: true`를 반환; 같은 요청을 연속 두 번 보내면 두 번째는 밀리초 단위로 줄어듭니다. 캐시 끄기: `cache: false` 후 litellm 재시작.
### 8.3 LLM 공급자 추가
1. `.env`에서 `# OPENAI_API_KEY=` 주석 해제 후 Key 입력;
2. `litellm-config.yaml`에서 해당 model 블록 주석 해제;
3. `docker compose up -d litellm`.
> 📖 원문 문서:LiteLLM 공식 문서 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Dify / Ghost / Gitea 설정

### 9.1 Dify: 모델 공급자 설정
1. `http://<서버-IP>` 열기 → 최초 관리자 이메일/비밀번호 설정 (이메일 `ai_all_in_one_admin@<회사-도메인>`);
  - **설정 → 모델 공급자** → OpenAI-API-compatible → 모델 추가:
        
          모델명 `deepseek-chat` (실제에 따름);
  - API Key: `dify-key`의 `sk-xxx`;
  - API endpoint: `http://host.docker.internal:3000/v1`.
3. 스튜디오 → 채팅 어시스턴트 생성 → 모델 선택 → 메시지 전송 검증.
> ⚠️ Dify는 `host.docker.internal`을 사용하며 컨테이너 이름을 쓰지 않습니다. Dify가 자체 네트워크에 있어 NewAPI와 네트워크가 다르기 때문입니다.
### 9.2 Ghost: 포털 설정
1. 관리 페이지 `http://<서버-IP>:8090/ghost/` (**/ghost/ 접미사 주의**). 최초 setup 마법사로 관리자 생성 (이메일 `ai_all_in_one_admin@<회사-도메인>`, 비밀번호 10자 이상);
2. 자동화: `scripts\ghost-setup.ps1`을 직접 실행해 setup API로 한 번에 관리자 생성, 마법사와 동일 (이미 초기화된 경우 자동 건너뜀);
3. **테마**: 디자인 → 테마, 기본 제공 Casper/Source를 바로 활성화;
4. **내비게이션 메뉴**: 디자인 → 메뉴 → 「메인 내비게이션」 생성.
| 메뉴 항목 | 유형 | URL |
| --- | --- | --- |
| 홈 | 페이지 | `/` |
| 뉴스 | 카테고리 | `/category/news` |
| 다운로드 센터 | 페이지 | `/downloads` |
| AI 워크벤치 | 사용자 지정 링크 | `http://<서버-IP>` |
| 도움말 | 카테고리 | `/category/docs` |
1. **다운로드 센터 페이지**: 페이지 → 「다운로드 센터」 새로 만들기 (slug `downloads`), 내용에 DeepChat 설치 패키지 내부망 링크.
```
## DeepChat 엔터프라이즈
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<서버-IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<서버-IP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ 포털 홈 `/`에서 「가입」을 누르지 마세요——방문자 구독자 가입입니다 (SMTP 미설정 시 500). 관리자 진입점은 `/ghost/`입니다. GitHub에서 최신 테마를 설치하지 마세요 (Ghost 6.x용일 수 있어 5.x에서 incompatible 오류).
### 9.3 Gitea: 초기화 및 Runner 등록
1. `http://<서버-IP>:3002` 열기 → 설치 마법사 (데이터베이스 SQLite 사전 설정됨) → 관리자 생성 (사용자명 `ai_all_in_one_admin`);
2. 우측 상단 아바타 → **Site Administration → Actions** → Enabled Actions 켜짐 확인;
3. **Runners → Create new Runner** → Registration Token 복사;
4. Token을 `.env`의 `GITEA_RUNNER_TOKEN`에 입력, Runner 재생성:
```
# ⚠️ 반드시 up -d 사용, restart 사용 금지 (restart는 .env의 token을 다시 읽지 않음)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ 함정 1: `readonly database` 오류는 대부분 `gitea.db`가 root 소유자이기 때문입니다. root 소유 db를 삭제해 git 사용자로 재생성하세요.  
> 
>     ⚠️ 함정 2: `ROOT_URL`을 `http://<서버-IP>:3002/`로 설정해야 하며, 아니면 생성된 저장소 링크가 localhost가 되어 직원이 열어도 무효화됩니다.
> 
>     📖 원문 문서:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (중국어) https://docs.gitea.com/zh-cn

## 10. DeepChat 배포 및 CI/CD

### 10.1 배포 링크
배포 링크 = GitHub Releases 설치 패키지 → `deepchat-sync` 저장소의 Gitea Actions → 업데이트 서버 (:8091) → Ghost 다운로드 페이지 → 직원 다운로드.
> 📌 `deepchat` 소스 mirror 저장소는 삭제되었습니다——mirror는 git 소스만 동기화하고 release 설치 패키지는 동기화하지 않아 배포에 쓸모없습니다. 소스 감사/2차 개발이 필요하면 별도로 만드세요.
### 10.2 설치 패키지를 업데이트 서버에 다운로드
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
검증: `curl -I http://<서버-IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206. 이어서 Ghost 다운로드 페이지 갱신 (제9장 참조).
### 10.3 자동 동기화 (Gitea Actions, 권장)
| 컴포넌트 | 설명 |
| --- | --- |
| `deepchat-sync` 저장소 | 일반 저장소 (mirror 불가), `.gitea/workflows/sync.yml` + `update_ghost.py` 배치 |
| 트리거 | `schedule` (매일 UTC 2시) + `workflow_dispatch` (수동) |
| 로직 | GitHub 최신 tag 확인 → `version.txt` 비교 → 새 버전이면 다운로드 + Ghost 다운로드 페이지 갱신 + 버전 기록 |
```
# 수동 트리거 1회
curl -X POST "http://<서버-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<비밀번호>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ 핵심 함정: ① act_runner의 `container.network`는 반드시 `config.yaml`(+`CONFIG_FILE` 환경 변수)로 설정해야 하며, 아니면 job 컨테이너가 `gitea` 호스트명을 해석할 수 없습니다; ② docker.sock은 runner가 자동 마운트하므로 options에서 다시 마운트하지 마세요 (Duplicate mount point 오류).
### 10.4 국내 다운로드 소스 설정 (sync-config.json)
공식 사이트 `deepchatai.cn` 다운로드 페이지의 설치 패키지는 여전히 GitHub를 가리켜 국내에서 거의 통하지 않습니다. 실제 해결은 `sync-config.json`으로:
| 필드 | 역할 | 기본값 |
| --- | --- | --- |
| `version_source` | `github` (GitHub API가 가장 정확) 또는 `official` (공식 캐시, 도달 가능하나 지연) | `github` |
| `download_prefix` | 다운로드 가속 프리픽스, 예: `https://ghproxy.com/` | `""` |
| `keep_releases` | 버전 이력 보존 수 | `5` |
| `market_url` | 다운로드 페이지 「먼저 스킬 매니저 설치」의 내부망 마켓 주소 | `http://<서버-IP>:3100` |
```
# GitHub 접근 가능: 기본값 유지
{ "version_source": "github", "download_prefix": "" }
# GitHub 가속 프록시 (가장 흔히 사용)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 워크플로에 내장된 `version_cmp.py` 버전 비교로, 「최신 버전 > 로컬 버전」일 때만 다운로드합니다 (공식 캐시 지연으로 클라이언트가 구버전으로 회귀하는 것 방지).
### 10.5 방식 B: Docker로 커스텀 버전 빌드 (선택)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# 컨테이너 내부
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# 산출물은 dist/에 있으며, 종료 후 deepchat-updates/로 복사
```
### 10.6 DeepChat 클라이언트 설정 (직원 측)
1. DeepChat → 설정 → 모델 서비스 → 사용자 지정 Provider / OpenAI 호환;
2. API Base URL: `http://<서버-IP>:3000/v1` (반드시 내부망 IP);
3. API Key: `deepchat-key`의 `sk-xxx`;
4. 모델: `deepseek-chat`, 저장 후 테스트 대화.
> 📖 원문 문서:DeepChat 빠른 시작 https://deepchatai.cn/docs/guide/getting-started/ · 오픈소스 저장소 https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway 및 Skill 마켓

> 📌 MCP Gateway는 공식 `@modelcontextprotocol/sdk` 기반이며 표준 Streamable HTTP `/mcp` 엔드포인트를 노출하고, 이미 메인 `docker-compose.yml` (포트 3100)에 통합되어 핵심 서비스와 함께 시작됩니다. 소스는 `mcp-gateway/`에 있습니다.
### 11.1 내장 플랫폼 도구
| 도구 | 용도 |
| --- | --- |
| `platform_time` | 서버 현재 시간 반환 |
| `platform_echo` | 텍스트 에코 (연결성 테스트) |
| `platform_services` | 플랫폼 서비스 목록 나열 |
### 11.2 외부 MCP Server 집계
`mcp-gateway/mcp-servers.json`을 편집해 stdio 또는 http 유형을 추가하고 `mcp-gateway`를 재시작하면 적용됩니다:
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
집계된 도구에는 중복 방지를 위해 자동으로 `{serverName}_` 프리픽스가 붙습니다.
### 11.3 클라이언트 연동
1. DeepChat: 설정 → MCP → 서버 추가 → 유형 「스트리밍 가능 HTTP」, URL `http://<서버-IP>:3100/mcp`;
2. Dify 워크플로: 사용자 지정 도구 / MCP 도구 설정을 같은 주소로 지정.
> 검증: `curl http://<서버-IP>:3100/health`이 `{"status":"ok"}` 반환; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`이 도구 목록 반환.
### 11.4 Skill 마켓 (내부망 스킬 패키지 배포)
| 엔드포인트 | 역할 |
| --- | --- |
| `/market` | Skill 마켓 페이지 (카드 브라우징 + ZIP 다운로드 + 설치 주소 복사) |
| `/skills` | 스킬 목록 JSON (name/description/version) |
| `/skills/<이름>.zip` | 스킬 패키지 다운로드 (동적 패키징) |
스킬은 `mcp-gateway/skills/` 디렉터리에 둡니다 (SKILL.md 포함 서브디렉터리), **매 요청마다 자동 스캔되어 재시작 불필요**. 내장 `skill-market` 가이드 스킬 포함.
> 📌 DeepChat에서 MCP와 Skill은 서로 다른 개념입니다: MCP는 「도구」 (function calling), Skill은 「에이전트 스킬 패키지」 (SKILL.md + 스크립트). DeepChat의 Skill에는 「사용자 지정 마켓 URL」이 없고 폴더/ZIP/URL 세 가지 설치만 지원하므로, 내부망 배포는 「URL 설치」로 우회 구현합니다.
### 11.5 ⚠️ Skill 마켓 호스트명 (배포 파라미터, 반드시 교체)
「스킬 매니저」는 `config.json`의 `market_url`을 읽어 `/skills` 목록을 요청합니다. 두 가지 핵심:
- **호스트명 사용, IP 사용 금지**: DeepChat의 agent 환경이 IP를 `[IP_ADDRESS_REDACTED]`로 비식별화하여 실제 주소를 읽지 못합니다;
- **호스트명은 배포 파라미터**: 배포마다 다르므로 복사해 쓰면 안 됩니다.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<마켓-호스트명>:3100" }
```
##### 자동 (Agent로 배포)
Agent가 파라미터 수집 시 「Skill 마켓 호스트명」을 물어보고 `config.json`과 `SKILL.md`의 `<마켓-호스트명>`을 자동 교체합니다.
##### 수동
1. `config.json` + `SKILL.md` 폴백 주소를 편집해 `<마켓-호스트명>` 교체;
2. 호스트명을 해석 가능하게: 단일 머신은 `C:\Windows\System32\drivers\etc\hosts`에 `<서버-IP>  <호스트명>` 추가; 회사 내부망은 DNS에 A 레코드 추가.
> ✅ 호스트명은 「서비스명+회사 도메인」 FQDN을 권장, 예: `skillmarket.당신의-회사-도메인`. DNS A 레코드 추가: 도메인 컨트롤러 「DNS → 정방향 조회 영역 → 당신의 도메인 → 새 호스트(A)」, 또는 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "당신의-도메인" -IPv4Address "<서버-IP>"`.
### 11.6 관리 API (AI 관리 센터의 증감 수정용)
| 엔드포인트 | 역할 |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP Server 증감 수정 조회 (설정에 다시 쓰기 + 자동 재연결) |
| `POST /api/skills/upload` | 스킬 zip 업로드 (SKILL.md 검증, 경로 이탈 방지) |
| `DELETE /api/skills/:name` | 스킬 삭제 |
`X-Admin-Token` 헤더 필요 (`.env`의 `MCP_ADMIN_TOKEN`). AI 관리 센터 「MCP Gateway」 페이지가 프록시로 호출합니다 (`ai-platform-admin` 역할 보호).
> 📖 원문 문서:MCP 프로토콜 공식 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. AI 관리 센터

> 📌 포지셔닝: Docker 관리 플랫폼 (1Panel/Portainer)이 아니라 관리자를 위한 통합 백오피스——Keycloak 인증 + 좌측 메뉴로 모든 제품 연결 + Dashboard 클러스터 상태 + 통합 관리자 계정.
### 12.1 핵심 기능
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
### 12.2 Global Administrator 초기화
```
# .env에 설정
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=계정 비밀번호 목록 참조
ADMIN_EMAIL=ai_all_in_one_admin@<회사-도메인>
```
시작 후 자동으로 Keycloak에 `ai_all_in_one_admin` 사용자를 생성하고 (이미 있으면 건너뜀) `ai-platform-admin` Realm Role을 할당합니다. 핵심 이념: **하나의 Global Admin 계정으로 모든 플랫폼 관리**.
### 12.3 Docker Compose 배포
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
### 12.4 Keycloak 클라이언트 설정
1. Keycloak → enterprise-ai → Clients → Create;
2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow 모두 On;
3. Valid Redirect URIs: `http://127.0.0.1:10086/*` 및 `http://<서버-IP>:10086/*`;
4. Client Secret 복사 → `.env`의 `KEYCLOAK_CLIENT_SECRET`에 입력 → `docker compose up -d admin-portal`;
5. Realm Role `ai-platform-admin` 생성, `ai_all_in_one_admin`에 할당.
- ⚠️ 배포/문제 해결 핵심:
      
        admin-portal 세션은 메모리에 저장되어 `up -d`로 컨테이너 재생성 시 **로그인 세션이 초기화**됩니다 (재로그인 필요);
- 홈 `/`은 반드시 Keycloak 보호를 거쳐야 합니다 (`express.static(..., {index:false})` + 명시적 `app.get('/', keycloak.protect())`), 아니면 미로그인 시 빈 대시보드가 바로 렌더링됩니다;
- Dify 통계는 실제 관리자 이메일 (`ai_all_in_one_admin@<회사-도메인>`, AD 전역 관리자와 동일) 사용;
- **server.js 수정 후 반드시 `docker restart admin-portal`**, `up -d` 사용 금지 (volume 파일 내용 변경은 재빌드를 트리거하지 않음).
### 12.5 검증
1. `http://<서버-IP>:10086` 열기 → 자동으로 Keycloak 로그인 이동 (미로그인 시 빈 대시보드 표시 안 됨);
2. `ai_all_in_one_admin`으로 로그인 → 개요 대시보드 진입;
3. Dashboard에 8개 제품 지표 + 컨테이너 그룹 표시;
4. 각 제품 클릭 시 먼저 통계 표시, 「백오피스 열기」 클릭 시에만 이동;
5. 시스템 설정에서 9개 언어 전환 가능.
### 12.6 모듈별 관리자 권한 + Keycloak 페이지 관리 (v0.91)
전역 관리자는 AI 관리 센터에서 다른 관리자와 Keycloak을 직접 관리할 수 있습니다:
- **관리자 계정 관리**: Keycloak 연동 IdP에서 기존 계정 검색(AD/LDAP 사용자, 신규 생성 없음·비밀번호 불필요) → 모듈 선택 → 확인. 시스템은 `admin:<제품>` Realm Role을 부여하고 **실제로 제품에 프로비저닝**(SSO 우선·API 폴백): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. 모듈 취소 또는 관리자 삭제는 **제품에서 계정을 삭제**합니다. SSO 없는 제품은 임시 비밀번호를 생성하며 🔑 아이콘으로 확인 가능(전역 관리자만). 비관리자는 「관리자가 아닙니다」 대화상자가 표시되고 로그아웃됩니다.
- **Keycloak 페이지**: 「전체 동기화 / 변경 동기화」 버튼으로 AD 속성 변경을 한 번에 반영; 각 사용자 행에 「편집」(Keycloak 콘솔로)과 「삭제」; 역할 섹션에서 역할 생성/삭제·멤버 확인 가능. 동기화/삭제/역할 작업은 전역 관리자만.
> ⚠️ 참고: Keycloak에는 「단일 사용자 동기화」 엔드포인트가 없으며 증분 동기화는 AD의 변경된 계정을 모두 가져옵니다. AD 페더레이션 사용자는 다음 전체 동기화 또는 SSO 로그인 시 다시 나타납니다. 영구 제거하려면 AD에서 비활성화/삭제하세요.

## 13. 상호 연결 검증 체크리스트

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

**제2부 · 관리편 (각 제품 일상 운영)**

## 14. Keycloak 일상 관리

Keycloak**진입점**: http://<서버-IP>:9090 → Administration Console → 관리자 로그인.
> 📌 이러한 작업 대부분은 AI 관리 센터 → Keycloak 페이지에서도 가능합니다(전역 관리자만): LDAP 전체/증분 동기화, 사용자 삭제, 역할 관리(목록/생성/삭제/멤버 확인). 12.6장 참조.
### 14.1 사용자 관리
1. **사용자 생성**: Users → Add user → 사용자명 입력 → Create;
2. **비밀번호 설정**: 해당 사용자 Credentials 탭 → 비밀번호 설정 → Temporary 끄기 (아니면 최초 로그인 시 강제 비밀번호 변경);
3. **비밀번호 재설정**: Users → 사용자 검색 → Credentials → Set password;
4. **비활성화/활성화**: 사용자 상세 상단 Enabled 스위치 (비활성화 시 해당 사용자의 모든 SSO가 즉시 무효화);
5. **삭제**: 사용자 상세 → Delete.
### 14.2 역할 및 권한
- **Realm Role**: Realm roles → Create role로 역할 생성 (예: `ai-platform-admin`);
- **역할 할당**: 사용자 → Role mapping → Assign role;
- **그룹**: Groups → 그룹 생성 (`ai-admin` / `ai-user`) → 그룹에 사용자 추가, 역할을 그룹에 부여하면 사용자가 그룹을 따라 권한 상속.
> ✅ 관리 권한은 `ai-platform-admin` 역할로 통합 제어하며, 각 제품이 SSO 연동 시 이 역할로 관리자를 식별합니다.
### 14.3 OIDC 클라이언트 (신규 제품 SSO 연동)
1. Clients → Create client → Client ID에 제품명 입력 (예: `newapi` / `grafana` / `langfuse`);
2. Client authentication: On (아니면 Credentials 탭 없음), Standard flow: On;
3. Valid redirect URIs / Web origins에 제품 콜백 주소 입력 (내부망 IP + 127.0.0.1 둘 다 추가);
4. 저장 → Credentials 탭에서 Client secret 복사해 제품 측에 제공.
### 14.4 AD / LDAP 페더레이션 유지보수
- **도메인 컨트롤러/비밀번호 변경**: User Federation → LDAP Provider 클릭 → Connection URL / Bind credentials 수정 → Save;
- **수동 동기화**: Synchronize all users;
- **그룹 매핑**: Mappers 탭 → group-ldap-mapper → Groups DN에 AD 그룹이 있는 컨테이너 설정, AD 그룹을 Keycloak 역할로 매핑.
### 14.5 세션 관리
- **활성 세션 조회**: Users → 특정 사용자 → Sessions;
- **강제 로그아웃**: Sessions → Sign out all;
- **전역 세션/토큰 설정**: Realm settings → Sessions / Tokens 탭에서 타임아웃 조정.
> ⚠️ 핵심 함정 복습: ① bind DN의 CN에 공백이 있으면 그대로 유지; ② Username LDAP attribute는 `sAMAccountName` 사용, `cn` 아님; ③ Search scope는 Subtree 선택; ④ SSO의 `unknown_error`는 대부분 호스트 iphlpsvc 미실행으로 AD 포트 포워딩이 무효화된 경우; ⑤ AD 도메인 컨트롤러 VM이 꺼져 있으면 LDAP 페더레이션 계정 로그인 시 `LDAP Connection refused` 오류.
> 📖 원문 문서:Keycloak 공식 문서 https://www.keycloak.org/documentation · 서버 관리 가이드 https://www.keycloak.org/server/

## 15. NewAPI 일상 관리

NewAPI**진입점**: http://<서버-IP>:3000.
### 15.1 채널 관리 (업스트림 모델)
1. **채널 추가**: 채널 → 새 채널 추가 → 유형 OpenAI (또는 Claude 등) → Base URL `http://litellm:4000` → 키 `LITELLM_MASTER_KEY` → 모델명 입력 → 저장;
2. **테스트**: 채널 목록에서 「테스트」 클릭, 모델 선택해 연결 확인;
3. **비활성화/활성화**: 채널 목록 스위치, 비활성화 시 해당 채널이 더 이상 요청을 받지 않음;
4. **우선순위/가중치**: 여러 채널이 같은 모델일 때 우선순위/가중치로 분산.
### 15.2 토큰 (API Key) 관리
1. **생성**: API 키 → 새 토큰 생성 → 이름 지정 (예: `deepchat-key`) → 할당량/만료 시간/모델 제한 설정 가능 → 저장;
2. **Key 복사**: `sk-`로 시작, **한 번만 표시되므로 즉시 저장**;
3. **비활성화/삭제**: 토큰 목록 조작 (비활성화 시 해당 Key가 즉시 무효화);
4. **사용량 조회**: 토큰 상세에서 소모된 할당량 확인.
### 15.3 할당량 및 사용자
- **신규 사용자 기본 할당량**: `DEFAULT_QUOTA` (100달러 권장);
- **개별 사용자 할당량 증액**: 사용자 페이지 → 해당 사용자 편집 → 할당량 설정;
- **충전/차단**: 사용자 페이지 조작;
- **그룹 관리**: 부서별 그룹 생성, 모델 배율/할당량 설정, 사용자가 그룹에 속하면 부서별로 통제.
### 15.4 로그 및 비용
- **로그 페이지**: 매 호출의 사용자/모델/token/할당량/비용/출처 IP 조회;
- **비용 보고서**: AI 관리 센터 「NewAPI 관리」 페이지에 사용자/모델/날짜별 집계 비용 보고서 + 최근 100건 감사 로그.
> 📌 클라이언트 IP 기록은 사용자의 「IP 로그 기록」 설정 (`record_ip_log`, 기본 꺼짐)에 의존하며, IP 감사가 필요하면 해당 사용자에게 활성화하세요.
### 15.5 시스템 설정 핵심
- **서버 주소**: 반드시 내부망 `http://<서버-IP>:3000`으로 설정 (아니면 OIDC가 `invalid_grant - Incorrect redirect_uri` 오류);
- **인증 → 사용자 지정 OAuth**: Keycloak OIDC 연동 (제7장 참조);
- **사용 모드**: 개인 사용 ↔ 대외 운영 전환 가능.
> ⚠️ 핵심 함정 복습: ① 채널 Base URL은 모두 컨테이너 이름 `http://litellm:4000` 사용; ② 속도 제한 429는 `CRITICAL_RATE_LIMIT_ENABLE=false` 등 변수로 제어; ③ 데이터베이스 수정은 `MYSQL_PWD` 환경 변수를 직접 사용해 stderr 비밀번호 경고가 오류로 오인되는 것을 방지.
> 📖 원문 문서:NewAPI 공식 문서 https://docs.newapi.pro · 공식 웹사이트 https://www.newapi.ai · 오픈소스 저장소 https://github.com/QuantumNous/new-api

## 16. LiteLLM 일상 관리

**진입점**: http://<서버-IP>:4001 (순수 API, 웹 인터페이스 없음, 디버깅은 `/v1/models`). 설정은 `litellm-config.yaml`에.
### 16.1 모델 목록 유지보수
`litellm-config.yaml`의 `model_list`를 편집해 모델과 해당 API Key를 추가/삭제. 새 provider 추가 단계:
1. `.env`에서 `# OPENAI_API_KEY=` 주석 해제 후 Key 입력;
2. `litellm-config.yaml`에서 해당 model 블록 주석 해제;
3. `docker compose up -d litellm`.
### 16.2 응답 캐시
Redis exact match 캐시, 완전히 같은 요청을 사용자 간 공유. `cache_params.ttl` 조정 (기본 3600초). 끄기: `cache: false` 후 재시작.
### 16.3 Langfuse 보고
`success_callback: ["langfuse"]` + `.env`의 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST`를 통해 매 호출을 자동 보고.
### 16.4 재시작 및 문제 해결
```
docker compose restart litellm          # 설정 변경 후 재시작
docker logs litellm --tail 50           # 로그 확인
```
> ⚠️ 핵심 함정: ① guardrails에 `default_on: true`를 추가해야 전역 적용; ② PII 비식별화 (Presidio)는 현재 업스트림 API 변경으로 잠시 주석 처리되어 순수 프록시만 수행; ③ 안정 버전 `v1.95.1` 사용 (`main-latest`는 버그 있음).
> 📖 원문 문서:LiteLLM 공식 문서 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Dify 일상 관리

Dify**진입점**: http://<서버-IP> (80 포트, 독립 공식 compose, 업그레이드/유지보수는 `dify/docker/`에서 별도 작업).
### 17.1 앱 관리 (스튜디오)
1. **앱 생성**: 스튜디오 → 빈 앱 생성 → 유형 선택 (채팅 어시스턴트 / Agent / 워크플로 / 텍스트 생성);
2. **오케스트레이션**: 노드를 끌어 프롬프트, 도구, 지식베이스, 변수 구성;
3. **디버깅**: 우측 상단 「미리보기」로 실행 디버깅;
4. **게시**: 디버깅 통과 후 「게시」 → 공유 링크 생성 또는 웹 앱 임베드.
### 17.2 지식베이스 관리
1. 지식베이스 → 지식베이스 생성;
2. 문서 업로드 (Word / PDF / Markdown / 웹 링크), 분할 규칙 + 인덱스 방식 선택 (고품질/경제);
3. 앱에서 해당 지식베이스를 「추가」하면 AI가 문서 기반으로 답변.
> 📌 지식베이스 내용은 AI 답변에 사용되므로 기밀 자료는 업로드하지 마세요 (데이터 등급 규정 준수).
### 17.3 모델 공급자
- **모델 추가**: 설정 → 모델 공급자 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (NewAPI 경유) + `dify-key`;
- **시스템 모델 설정**: 기본 채팅/추론/임베딩 모델 지정.
### 17.4 멤버 및 권한
- **멤버**: 워크스페이스에 멤버 초대, Owner/Admin/Editor/Normal 역할 설정;
- **로그인 방식**: 설정 → 로그인 방식 → OIDC (Keycloak) 연동으로 SSO 구현.
### 17.5 업그레이드 및 유지보수
```
cd dify\docker
git pull                          # 최신 버전 가져오기
docker compose pull               # 새 이미지 가져오기
docker compose up -d              # 재빌드
```
> ⚠️ 핵심 함정: ① WebSocket `NEXT_PUBLIC_SOCKET_URL`을 내부망 IP로 설정; ② 로그인 비밀번호는 base64 인코딩; ③ 비밀번호 분실 시 `docker exec docker-api-1 flask reset-password` 사용 (8자 이상).
> 📖 원문 문서:Dify 공식 문서 https://docs.dify.ai · 자체 호스팅 https://docs.dify.ai/getting-started/install-self-hosted

## 18. Ghost 일상 관리

Ghost**진입점**: 프런트 http://<서버-IP>:8090; 백오피스 http://<서버-IP>:8090/ghost/ (/ghost/ 접미사 주의).
### 18.1 백오피스 로그인
Ghost 5 백오피스는 **비밀번호 없는 로그인**: 이메일 입력 → Ghost가 6자리 인증 코드를 MailHog (`:8025`)로 발송. 더 빠른 방법: AI 관리 센터에서 「Ghost 백오피스」의 「열기」 버튼을 누르면 자동 로그인됩니다 (로컬에서 TOTP 코드 계산, 메일 확인 불필요).
### 18.2 콘텐츠 게시
1. **글**: Posts → New post → 내용 작성 (Markdown 편집기) → Publish;
2. **페이지**: Pages → New page (예: 「다운로드 센터」 slug `downloads`);
3. **태그/카테고리**: Tags → 카테고리 생성 (예: `news` / `docs`), 글을 카테고리에 배치.
### 18.3 내비게이션 메뉴
1. 백오피스 → 디자인 (Design) → 메뉴 (Navigation);
2. 「Primary」 메인 내비게이션 편집, 홈/뉴스/다운로드 센터/AI 워크벤치/도움말 추가 (제9장 메뉴 표 참조).
### 18.4 테마
- **전환**: 디자인 → 테마, 기본 제공 Casper / Source 바로 활성화;
- **설치**: 테마 마켓 (Design → Change theme) 또는 zip 업로드.
> ⚠️ GitHub에서 최신 테마를 설치하지 마세요 (Ghost 6.x용일 수 있어 5.x에서 incompatible 오류), 구버전 zip을 설치하세요.
### 18.5 멤버 및 구독 (필요 시)
- Members: 구독자 관리;
- 구독이 필요 없으면 이 모듈을 무시해도 됩니다 (내부망 포털은 보통 사용 안 함).
### 18.6 통합 (API Token)
1. 백오피스 → Settings → Integrations → 사용자 지정 통합 추가;
2. Admin API Key 생성 (형식 `id:secret`), Gitea Actions의 공지 발행 등 자동화에 사용.
> ⚠️ 핵심 함정: ① 홈 `/`에서 「가입」을 누르지 마세요 (방문자 구독자 가입); ② 6자리 인증 코드는 사실 TOTP이며 AI 관리 센터가 로컬에서 계산 가능; ③ 로컬에서 계산해도 Ghost는 여전히 메일을 실제 발송하므로 MailHog를 반드시 유지해야 합니다 (아니면 `Failed to send email`).
> 📖 원문 문서:Ghost 공식 문서 https://ghost.org/docs/ · 관리 백오피스 https://ghost.org/docs/admin/

## 19. Gitea 일상 관리

Gitea**진입점**: Web http://<서버-IP>:3002; SSH `ssh://git@<서버-IP>:2222`.
### 19.1 저장소 및 조직
1. **저장소 생성**: 우측 상단 + → New repository;
2. **조직 생성**: + → New organization, 조직 아래 저장소 생성, 팀 관리;
3. **외부 저장소 마이그레이션**: + → New migration, GitHub 주소 입력 시 mirror 가능 (소스 읽기 전용 동기화).
### 19.2 사용자 및 권한
- **사용자 추가**: Site Administration → User Accounts → Create user;
- **저장소 권한**: 저장소 → Settings → Collaborators;
- **조직 팀**: 조직 → Teams → 팀 생성 → 멤버 추가 → 저장소 권한 부여.
### 19.3 Actions / Runner 관리
1. **Actions 활성화**: Site Administration → Actions → Enabled;
2. **Runner 등록**: Runners → Create new Runner → Token 복사 → `.env`의 `GITEA_RUNNER_TOKEN`에 입력 → `docker compose up -d gitea-runner`;
3. **Runner 상태 확인**: Runners 페이지에 Idle (초록색) 표시되면 정상;
4. **워크플로 실행**: 저장소 → Actions → 수동 실행 또는 push 트리거.
> ⚠️ Runner token 변경은 반드시 `up -d` 사용 (restart는 .env를 다시 읽지 않음).
### 19.4 사이트 설정
- **ROOT_URL**: `GITEA__server__ROOT_URL`을 내부망 `http://<서버-IP>:3002/`로 설정, 아니면 생성된 저장소 링크가 localhost가 됨;
- **가입 정책**: Site Administration → Config에서 가입 스위치, 이메일 설정 조정.
> ⚠️ 핵심 함정: `readonly database` 오류는 대부분 `gitea.db`가 root 소유자이기 때문입니다. root 소유 db를 삭제해 git 사용자로 재생성하세요.
> 📖 원문 문서:Gitea 공식 문서 (중국어) https://docs.gitea.com/zh-cn · 관리 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. MCP Gateway 일상 관리

**진입점**: http://<서버-IP>:3100 (마켓 페이지 `/market`). 관리는 AI 관리 센터 「MCP Gateway」 페이지로 작업 (`ai-platform-admin` 역할), 또는 관리 API 직접 호출.
### 20.1 MCP Server 관리
1. `mcp-gateway/mcp-servers.json` 편집해 서버 추가/삭제 (stdio/http 두 유형);
2. `docker compose restart mcp-gateway` 재시작;
3. 또는 AI 관리 센터 MCP Gateway 페이지에서 추가/삭제 (설정에 다시 쓰기 + 자동 재연결).
### 20.2 Skill (스킬 패키지) 관리
1. **업로드**: AI 관리 센터 MCP Gateway 페이지 → 스킬 zip 업로드 (SKILL.md 포함 검증, 경로 이탈 방지);
2. **삭제**: 해당 스킬 삭제;
3. 스킬은 `mcp-gateway/skills/`에 두고 (SKILL.md 포함 서브디렉터리), 매 요청마다 자동 스캔되어 재시작 불필요.
### 20.3 내장 도구 확장
`mcp-gateway/gateway.js`에 두 단계 추가:
```
// ① 도구 정의 (builtinTools 배열에 항목 추가)
{ name: 'platform_health', description: '서비스 상태 조회',
  inputSchema: { type: 'object', properties: {} } }

// ② 실행 로직 (callBuiltin에 분기 추가)
if (name === 'platform_health') { return '모든 서비스 정상 동작 중'; }
```
수정 후 `docker compose restart mcp-gateway`.
### 20.4 skill-market 마켓 주소 유지보수
「스킬 매니저」의 `market_url`은 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`에 있으며, 반드시 호스트명 사용 (IP 불가), 배포 파라미터입니다 (제11장 참조).
> ⚠️ 관리 API는 `X-Admin-Token` 헤더 필요 (`.env`의 `MCP_ADMIN_TOKEN`); 미설정 시 503, 잘못된 token 시 401 반환.
> 📖 원문 문서:MCP 프로토콜 공식 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. 업데이트 서버 관리

**진입점**: http://<서버-IP>:8091, 데이터는 `deepchat-updates/`에.
### 21.1 수동으로 새 버전 배치
1. DeepChat 공식 설치 패키지를 `deepchat-updates/deepchat/`에 다운로드;
2. `version.txt` 갱신 (새 버전 번호 기록);
3. 직원 측 DeepChat이 자동 업데이트 시 `version.txt`를 확인해 새 버전 발견 시 다운로드 설치.
### 21.2 자동 동기화 (권장)
`deepchat-sync` 저장소의 Gitea Actions로 매일 GitHub 새 버전을 자동 확인 및 동기화 (제10장 참조). 수동 트리거:
```
curl -X POST "http://<서버-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<비밀번호>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 동기화 설정 (sync-config.json)
| 필드 | 역할 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 다운로드 가속 프리픽스 (예: ghproxy.com) |
| `keep_releases` | 버전 이력 보존 수 |
| `market_url` | 다운로드 페이지 「스킬 매니저」 마켓 주소 |
> 📌 DeepChat 클라이언트가 「모델 연결 타임아웃」 오류를 낼 때는 보통 클라이언트가 죽은 시스템 프록시를 탄 경우입니다 (`ECONNREFUSED 127.0.0.1:33210`). 사용자에게 DeepChat 「설정 → 네트워크/프록시」를 「프록시 사용 안 함/직접 연결」로 바꾸게 하세요.
> 📖 원문 문서:DeepChat 빠른 시작 https://deepchatai.cn/docs/guide/getting-started/ · 오픈소스 저장소 https://github.com/ThinkInAIXYZ/deepchat

## 22. 모니터링 및 알림 관리

Grafana**진입점**: Grafana http://<서버-IP>:3030 (SSO 자동 로그인); Prometheus :9091; Alertmanager :9093.
### 22.1 컴포넌트 및 포트
| 컴포넌트 | 포트 | 용도 |
| --- | --- | --- |
| cadvisor | 8080 (내부) | 각 컨테이너 CPU/메모리/네트워크/디스크 수집 |
| Prometheus | 9091 | 지표 집계 + 알림 규칙 (`monitoring/alerts.yml`) |
| Grafana | 3030 | 시각화 대시보드 (사전 설정 「AI All In One — 컨테이너 모니터링」) |
| Alertmanager | 9093 | 알림 중복 제거/그룹화/라우팅/통지 |
### 22.2 대시보드 조회
1. Grafana 로그인 (`ai_all_in_one_admin` / 통합 비밀번호, SSO 자동 로그인);
2. 「AI All In One — 컨테이너 모니터링」 패널 열어 각 컨테이너 CPU/메모리/네트워크 확인.
### 22.3 알림 규칙
사전 설정 규칙 (`monitoring/alerts.yml`): 컨테이너 다운 (critical), 컨테이너 메모리 >90% (warning), 컨테이너 CPU >80% (warning).
> ⚠️ 알림 오탐 함정: cadvisor가 호스트의 모든 cgroup (systemd 포함)을 보고하므로, 알림 규칙에 반드시 `{name!=""}` 필터를 쓰고, 메모리 알림에는 `container_spec_memory_limit_bytes > 0`을 추가해야 합니다 (아니면 limit=0에서 0으로 나누어 항상 트리거).
### 22.4 알림 통지 연동 (기업 IM)
알림 경로는 **Prometheus → Alertmanager → AI 관리 센터 (`/api/alert-webhook`) → 기업 IM**입니다. AI 관리 센터의 **「시스템 운영 → 기업 IM 알림」** 메뉴에서 설정합니다 (설정은 Redis에 저장되어 재시작 후에도 유지):
- **수신자**: 여러 개 추가 가능. 유형 「DingTalk/WeCom/Feishu」 = 그룹 봇(Webhook URL 입력, 그룹으로 발송); 유형 「DingTalk 앱(개인 발송)」(AppKey/AppSecret/AgentId/userid) 또는 「WeCom 앱(개인 발송)」(corpId/secret/agentid/userid) = 기업 앱, 개인에게 발송.
- **전송 규칙**: 전체 스위치, 최소 심각도(심각/경고/정보), 「발화 firing」/「복구 resolved」 알림 전송 여부.
- **전송 이력**: 각 전송(시간/수신자/유형/알림 이름/심각도/결과)을 기록하며, 페이지 이동·페이지 크기 조정·키워드 검색·유형/결과/심각도별 분류 필터링을 지원.
- 각 수신자에는 테스트 메시지 전송용 「테스트」 버튼과 활성화 스위치가 있습니다.
> ⚠️ 그룹 봇 Webhook은 **그룹**에만 보낼 수 있고 개인에게는 보낼 수 없습니다. 개인에게 보내려면 「기업 앱」 유형(DingTalk/WeCom)을 사용해야 하며, 관리 콘솔에서 메시지 권한이 있는 내부 앱을 만들어야 합니다. DingTalk 그룹 봇은 「사용자 지정 키워드」(예: 「AI 平台」/「告警」) 또는 「서명」 설정도 필요하며, 없으면 보안 정책에 차단됩니다.
> 📌 포트 충돌 설명: Prometheus 기본 9090은 Keycloak이 사용 중이라 9091로 변경; Grafana 기본 3000/3001이 사용 중이라 3030으로 변경.
> 📖 원문 문서:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. LLM 관측 (Langfuse)

Langfuse**진입점**: http://<서버-IP>:3010 (SSO 자동 로그인, AI 관리 센터 진입점은 `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 컴포넌트
| 컴포넌트 | 용도 |
| --- | --- |
| langfuse | Web UI + 추적 표시 (3010) |
| langfuse-worker | 비동기 이벤트 처리 |
| langfuse-postgres | 메타데이터 저장 |
| langfuse-clickhouse | 이벤트/추적 데이터 저장 |
| langfuse-minio | S3 첨부파일/미디어 저장 |
| langfuse-redis | 큐 |
LiteLLM이 `success_callback: ["langfuse"]`로 자동 보고 (`.env`의 `LANGFUSE_*`).
### 23.2 추적 조회
1. Langfuse 로그인 → 조직 `AI All In One` / 프로젝트 `AI Platform` 선택;
2. Traces 목록에서 매 호출 확인, 클릭해 프롬프트/응답/모델/지연시간/token/비용 확인;
3. Session으로 다중 턴 대화 연결.
### 23.3 문제 해결
- ⚠️ 핵심 함정:
      
        `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`을 반드시 설정해야 합니다 (web과 worker 모두), 아니면 구 SDK가 `trace-create` 보고에 실패해 데이터가 보이지 않습니다;
- SSO 로그인 시 데이터가 안 보임: SSO 계정 (AD 이메일)이 초기화 계정과 달라 Langfuse가 자동으로 어떤 조직에도 속하지 않는 새 계정을 만듭니다. 수정 (SSO 사용자를 조직에 추가):
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<회사-도메인>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 원문 문서:Langfuse 공식 문서 https://langfuse.com/docs · 자체 호스팅 https://langfuse.com/self-hosting

## 24. 통합 로그 (Loki)

**진입점**: AI 관리 센터 「📜 통합 로그」 페이지 (가장 편리), 또는 Loki http://<서버-IP>:3110.
### 24.1 컴포넌트
| 컴포넌트 | 포트 | 용도 |
| --- | --- | --- |
| Loki | 3110 | 로그 저장 및 조회 (단일 머신, 로컬 파일 시스템) |
| Promtail | —(내부) | docker.sock 경유 컨테이너 발견, json 로그 수집해 Loki에 전송 |
### 24.2 로그 조회
1. AI 관리 센터 → 통합 로그;
2. 컨테이너 선택 (드롭다운) → 키워드 입력 → 시간 범위 선택 → 조회;
3. 백엔드 `/api/logs/query`가 LogQL로 Loki 조회.
### 24.3 LogQL 빠른 참조
```
{container="new-api"} |= "error"              # 특정 컨테이너에서 error 포함 줄
{container=~".+"} |~ "(?i)error|exception"      # 모든 컨테이너 일치
{service="litellm"} |= "EMAIL"                  # 서비스별 조회
```
> 📌 Loki의 label은 `container / project / service`이며, **`job`은 없습니다**. 조회는 `{container=~".+"}` 사용, `{job="docker"}` 아님.
> ⚠️ 핵심 함정 (Docker Desktop 마운트): Promtail은 `/var/run/docker.sock`과 `/var/lib/docker/containers`를 마운트해야 합니다 (WSL2에서는 Docker Desktop VM 내부를 가리키며, 로그가 있는 곳). 호스트 Windows의 `C:\...\containers` 경로를 쓰지 마세요. Loki 단일 머신은 `store: tsdb` + filesystem 사용.
> 📖 원문 문서:Loki 공식 문서 https://grafana.com/docs/loki/latest/

## 25. PII 비식별화 (Presidio)

### 25.1 2단계 비식별화
| 계층 | 기능 |
| --- | --- |
| LiteLLM 내장 정규식 (`litellm_content_filter`) | 휴대폰번호, 주민등록번호, 은행카드, 이메일, 통일사회신용코드, 여권, IPv4 등, 일치 시 `[xxx_REDACTED]`로 대체; 민감어 블랙리스트 일치 시 BLOCK 거부 |
| Microsoft Presidio | 더 세밀한 엔티티 (영문 인명, 이메일 등), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 내장 정규식 규칙
| 규칙 | 정규식 | 유형 |
| --- | --- | --- |
| 중국 휴대폰번호 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 주민등록번호 | `\b\d{17}[\dXx]\b` | cn_id |
| 은행카드 번호 | `\b\d{16,19}\b` | bank_card |
| 이메일 | prebuilt `email` | email |
| 통일사회신용코드 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 여권 번호 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
민감어 블랙리스트는 `litellm-config.yaml`의 `blocked_words`에서 회사 실정에 맞게 추가/삭제 (`내부 기밀`, `영업 기밀` 등).
### 25.3 Presidio 활성화 (현재 잠시 주석 처리)
새 LiteLLM guardrail API 변경으로 Presidio 부분이 현재 주석 처리되어 있습니다. 활성화 핵심:
- guardrails에 `default_on: true`를 추가해야 전역 적용;
- 엔드포인트 환경 변수 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE`에 반드시 base URL 입력 (LiteLLM이 자동으로 `/analyze`, `/anonymize`를 붙이므로, 경로를 포함하면 `/analyze/analyze`가 되어 404).
> ⚠️ 이미지 약 965MB로 국내 다운로드가 매우 느립니다 (실측 약 1시간). 다운로드가 안 되면 먼저 내장 정규식을 사용하세요 (이미 중국어 핵심 PII 커버).
### 25.4 검증
휴대폰번호/이메일이 포함된 요청 전송 → 모델 응답에서 원본 값이 `[REDACTED]`로 대체; 「내부 기밀」 포함 요청 전송 → 바로 `Content blocked` 반환.
> 📖 원문 문서:Microsoft Presidio https://microsoft.github.io/presidio/ · 소스 https://github.com/microsoft/presidio

## 26. MailHog 메일 수신기

**진입점**: http://<서버-IP>:8025 (Web 받은편지함, SMTP 1025는 내부 전용).
### 26.1 왜 필요한가
Ghost 5 백오피스는 비밀번호 없는 로그인입니다: 이메일 입력 후 Ghost가 6자리 인증 코드가 담긴 메일을 보냅니다. 내부망에 SMTP가 없으면 메일이 발송되지 않아 로그인 시 `Failed to send email` 오류가 납니다. MailHog가 「메일 출구」 역할로 이 메일을 받아줍니다.
### 26.2 Ghost 측 설정
```
# docker-compose.yml의 Ghost 환경 변수
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 메일 조회
1. 브라우저에서 `http://<서버-IP>:8025` 열기;
2. 받은편지함에서 Ghost가 보낸 인증 코드/통지 메일 확인.
### 26.4 Ghost 비밀번호 없는 로그인 (AI 관리 센터 자동 로그인)
Ghost의 6자리 인증 코드는 사실상 **TOTP**입니다 (`TOTP(admin_session_secret + userId)`, 6자리/60초/HMAC-SHA1). AI 관리 센터가 로컬에서 인증 코드를 계산할 수 있어, 「Ghost 백오피스 → 열기」 클릭 시 자동 완료됩니다: 비밀번호 로그인 → 로컬 코드 계산 → 세션 검증 → cookie 기록 → 백오피스 진입, 전 과정 무감각, MailHog 확인 불필요.
> ⚠️ 스스로 코드를 계산해도 Ghost는 여전히 메일을 실제 발송하므로 MailHog를 반드시 유지해야 하며, 아니면 로그인 시 `Failed to send email` 오류.
> 📖 원문 문서:MailHog 소스 저장소 https://github.com/mailhog/MailHog

**제3부 · 운영편**

## 27. 백업 및 복구

**진입점**: AI 관리 센터 「💾 백업 및 복구」 페이지, 또는 명령줄 `scripts/backup.ps1` / `restore.ps1`. 매일 02:00 예약 작업으로 자동 백업, 7일 보존.
### 27.1 백업 항목
| 백업 항목 | 방식 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 파일 복사 |
| Keycloak | **realm export (JSON)** |
| 설정 파일 | 파일 복사 |
### 27.2 수동 백업
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 예약 백업 (예약 작업)
예약 작업 `AI-Platform-Backup`이 등록되어 있습니다 (매일 02:00). 자동 등록되지 않았으면 수동 생성: 작업 스케줄러 → 새로 만들기 → 프로그램 `powershell.exe`, 인수 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, 트리거 매일 02:00.
> 📌 백업은 기본적으로 C 드라이브에 저장됩니다. 정기적으로 `C:\AIAllInOne\backups\`를 다른 디스크나 오브젝트 스토리지에 동기화해 오프사이트 재해 복구를 권장합니다.
### 27.4 복구
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
스크립트가 `yes` 입력을 요구합니다 (`-Force` 추가로 건너뜀, 스크립트/CI 전용). AI 관리 센터 「백업 및 복구」 페이지에서 특정 백업의 「복구」를 눌러 원클릭 복구할 수도 있습니다.
### 27.5 핵심 함정 (훈련으로 검증됨)
- ⚠️
      
        Keycloak은 반드시 **realm export/import (JSON)** 사용, pg_dump 복원은 default role 연관이 손실되어 시작 실패;
- SQLite 복원 후 소유자가 root이므로 해당 uid로 chown 필요 (grafana=472, gitea=1000), 아니면 readonly 오류;
- pg_dump에 `--clean --if-exists` 포함해 복원 충돌 방지;
- 구버전 backup.ps1이 `Copy-Item` 일괄 복사 시 점 파일 `.env` 때문에 전체가 조용히 실패했고, 파일별 `-LiteralPath`로 수정;
- AI 관리 센터 백업은 base64 중계 + tar-fs로 바이너리 안전성 보장 (docker exec의 stdout이 utf8로 처리되어 SQLite .db 손상 방지).

## 28. 상태 점검 및 부팅 자체 점검

**스크립트**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, 출력 `health_check_<타임스탬프>.log`. 41개 컨테이너 (25 Windows 핵심 + 16 Dify) 커버, 자격 증명은 `.env`에서 읽고 비밀번호를 하드코딩하지 않음.
### 28.1 점검 범위 (9개 단계)
| 단계 | 점검 항목 |
| --- | --- |
| Stage 1 | Docker Daemon 실행 여부 (준비 대기, 부팅 자체 점검 대응) |
| Stage 2 | 41개 컨테이너 상태 (Up/Exited/Restarting) |
| Stage 3 | 10개 HTTP 엔드포인트 응답 |
| Stage 4 | LiteLLM readiness + 모델 등록, Dify API, 데이터베이스/Redis/Sandbox 상태 |
| Stage 5 | LLM 전체 링크 (NewAPI → LiteLLM → DeepSeek 실제 요청) |
| Stage 6 | AD 계정 인증 링크 + NewAPI 관리자 로그인 |
| Stage 7 | MCP Gateway + Skill 기능 |
| Stage 8 | DeepChat/Dify 로그인 전제 조건 |
| Stage 9 | 디스크 공간 |
### 28.2 수동 실행
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ 출력 끝에 `ALL CLEAR` 및 `Fail: 0`이면 전부 정상.
### 28.3 부팅 자동 시작 (예약 작업)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 로그인 후 2분 지연으로 Docker + 컨테이너 시작 대기
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 주의: 스크립트는 `127.0.0.1` 사용, localhost 사용 안 함; LiteLLM 내부 상태는 `/health/readiness` 사용 (인증 불필요); `docker-init_permissions-1` Exited(0) 정상; Update Server 403 반환 정상 (기본 index.html 없음); exit code 0=통과, 1=실패 있음.

## 29. 문제 해결 매뉴얼

### 29.1 공통 문제 해결 3단계
1. **컨테이너 상태 확인**: `docker ps -a`에서 Exited/Restarting 확인;
2. **로그 확인**: `docker logs <컨테이너명> --tail 30`;
3. **상태 점검 확인**: `health-check.ps1` 실행해 실패 단계 파악.
### 29.2 증상 빠른 조회표
| 증상 | 근본 원인 | 해결 |
| --- | --- | --- |
| localhost에서 어떤 제품도 열리지 않음 | WSL2 IPv6 `::1` 호환 문제 | 내부망 IP 또는 127.0.0.1 사용 |
| Ghost가 계속 Restarting, ECONNREFUSED :3306 오류 | 볼륨 내 MySQL config 잔존 | 환경 변수로 SQLite 강제 (제4장) |
| Dify 4개 컨테이너 시작 즉시 크래시 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 50으로 변경 (제5장) |
| NewAPI 채널 테스트 No connected db 오류 | 채널 키에 예시 값 입력 | `LITELLM_MASTER_KEY` 실제 값 입력 |
| NewAPI OIDC invalid_grant / Incorrect redirect_uri 오류 | 서버 주소가 localhost | 내부망 주소 설정 (제7장) |
| NewAPI 로그인 429 | 핵심 API 속도 제한 | redis rateLimit:* 삭제 또는 .env 변경 |
| Dify 앱 생성 시 계속 ws://localhost 연결 | WebSocket 주소 미변경 | NEXT_PUBLIC_SOCKET_URL 내부망 IP 설정 |
| Dify 로그인 클릭 시 반응 없음 | 비밀번호 base64 필요 / 미로그인 401 정상 | 스크립트 먼저 base64; 브라우저 재시도 |
| Gitea readonly database 오류 | gitea.db가 root 소유 | root 소유 db 삭제 후 재생성 |
| Gitea 저장소 링크가 localhost | ROOT_URL 미변경 | 내부망 주소 설정 |
| SSO 로그인 unknown_error | AD 포트 포워딩 무효 (iphlpsvc) | iphlpsvc + Hyper-V 네트워크 확인 |
| Keycloak에서 도메인 사용자가 안 보임 | Search scope = One Level | Subtree로 변경 |
| Langfuse 데이터가 안 보임 | V4_WRITE_MODE 또는 SSO 계정 미가입 조직 | dual 설정; SQL로 조직 추가 (제23장) |
| DeepChat 모델 연결 타임아웃 | 클라이언트가 죽은 시스템 프록시 경유 | 프록시 사용 안 함/직접 연결로 설정 |
| Loki 로그 조회 안 됨 | job 라벨 사용 | `{container=~".+"}` 사용 |
| Presidio 404 /analyze/analyze | 엔드포인트에 경로 포함 | base URL만 입력 |
| server.js 수정 후 새 API 404 | up -d는 volume 변화를 다시 읽지 않음 | docker restart admin-portal |
### 29.3 자주 쓰는 명령
```
docker ps -a                                        # 모든 컨테이너 상태
docker logs <컨테이너> --tail 50                     # 로그 확인
docker compose up -d <서비스>                        # 특정 서비스 재빌드
docker compose restart <서비스>                      # 특정 서비스 재시작 (.env 다시 읽지 않음)
docker system df                                     # Docker 디스크 사용량
C:\AIAllInOne\windows\scripts\health-check.ps1       # 원클릭 점검
```

**부록**

## 부. 원문 문서 색인

### 전체 제품 원문 문서
| 제품 | 공식 문서 주소 |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Keycloak 서버 관리 | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| NewAPI 공식 웹사이트 | https://www.newapi.ai |
| NewAPI 소스 | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Dify 자체 호스팅 | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Ghost 관리 백오피스 | https://ghost.org/docs/admin/ |
| Gitea (중국어) | https://docs.gitea.com/zh-cn |
| Gitea 관리 | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| DeepChat 소스 | https://github.com/ThinkInAIXYZ/deepchat |
| MCP 프로토콜 | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Langfuse 자체 호스팅 | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Presidio 소스 | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ 각 장 끝에도 해당 제품의 원문 문서 주소가 있어 장별로 편리하게 조회할 수 있습니다.

