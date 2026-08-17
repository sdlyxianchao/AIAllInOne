# AI AllInOne — 기업 인트라넷 AI 플랫폼 (멀티플랫폼, 셀프호스팅)

> 📖 **언어**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

**바로 사용 가능한 멀티플랫폼** 기업 인트라넷 AI 스위트입니다. 통합 인증, LLM 라우팅, PII 마스킹, AI 애플리케이션, 기업 포털, 소스/CI, 클라이언트 배포, 통합 관리, 모니터링·알림, 옵저버빌리티, 로깅, 백업/복원을 모두 Docker로 오케스트레이션하여 하나의 통합 시스템으로 만들고, **Keycloak 계정 하나로 모든 제품에 싱글 사인온(SSO)**을 제공합니다.

이 저장소는 세 가지 배포 플랫폼을 지원합니다.

| 플랫폼 | 저장소 디렉터리 (GitHub 기준) | 대표 사용 사례 |
|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop (단일 머신) |
| Linux / macOS | `linux/` | 자체 호스팅 Linux 서버 / macOS (Docker) |
| 온라인 서버 | `docker/` | 클라우드 / 베어 Docker 호스트 (프로덕션) |

> 로컬 작업 디렉터리에서 이 폴더들은 `windows-github/`, `linux-github/`, `docker-github/`로 명명됩니다. GitHub에 업로드하면 `-github` 접미사가 제거되어 `windows/`, `linux/`, `docker/`가 됩니다. 향후 모든 업데이트도 동일한 매핑을 따릅니다.

---

## 1. 포함된 구성

| 계층 | 구성 요소 | 역할 |
|---|---|---|
| 인증 | Keycloak | SSO / OIDC, AD/LDAP 또는 로컬 계정과 통합 가능 |
| LLM 라우팅 | NewAPI | 채널, 키, 할당량, 감사, 비용 |
| PII 마스킹 | LiteLLM + Presidio | 모델 호출 전 전화번호/신분증/이메일 자동 마스킹 |
| AI 애플리케이션 | Dify | 비주얼 AI 앱 / 에이전트 플랫폼 + 통합 지식 베이스(RAG) |
| 기업 포털 | Ghost | 회사 공지 및 뉴스 포털 |
| 소스 / CI | Gitea + Runner | 내부 Git + Actions 자동화 |
| 클라이언트 | DeepChat | 로컬 AI 데스크톱 클라이언트 (Windows / macOS / Linux) |
| 클라이언트 배포 | Update Server | DeepChat 설치 프로그램 호스팅 및 자동 업데이트 |
| 통합 관리 | AI 관리 센터 | 단일 진입점: 대시보드 + 제품 임베드 + 감사/비용/보고서 + RAG 검색 + 모듈별 관리자 권한 + Keycloak 동기화/역할 관리 |
| 게이트웨이 | MCP Gateway | 스킬 / MCP 마켓 관리 + Dify 지식 검색(RAG) |
| 모니터링 | Prometheus + Grafana + Alertmanager | 컨테이너 리소스 모니터링 + 알림 통지 |
| LLM 옵저버빌리티 | Langfuse | 모든 모델 호출의 트레이스 / 지연 / 토큰 / 비용 |
| 통합 로깅 | Loki + Promtail | 모든 컨테이너 로그 집계·검색 |
| 백업/복원 | backup/restore 스크립트 + 관리 페이지 | 매일 전체 백업 + 원클릭 복원 |

각 플랫폼 디렉터리에는 `docker-compose.yml`, `.env.example`, `*-deploy-guide*.html`(배포 가이드), `*-checklist*.html`(진행 체크리스트), ID 공급자 통합 가이드, 원클릭 배포 스크립트, 그리고 정화된 소스 코드와 설정이 포함됩니다. **실제 시크릿은 커밋되지 않습니다.**

### 아키텍처와 데이터 흐름

![아키텍처](<../pics/Architecture.png>)

![데이터 흐름](<../pics/DataFlow.png>)

### 스크린샷

**AI 관리 센터** — 통합 관리 포털

![AI 관리 센터](<../pics/AI Admin.png>)

**Dify** — AI 애플리케이션 플랫폼

![Dify](<../pics/Dify.png>)

**기업 포털** — 홈 (Ghost)

![기업 포털 홈](<../pics/AI All In One Hub.png>)

**DeepChat** — 데스크톱 AI 클라이언트

![DeepChat](<../pics/DeepChat.png>)

**MCP/SKILL 마켓** — MCP 원클릭 연결 + 스킬 패키지 다운로드

![MCP/SKILL 마켓](<../pics/Market.png>)

---

## 2. 빠른 시작: Harness형 도구를 통한 자동 배포 (권장)

Harness형 도구(OpenClaw, Microsoft Scout, WorkBuddy 등)는 이 프로젝트의 문서와 설정을 읽고 머신에서 전체 환경을 단계별로 구축할 수 있습니다. 아래는 표준 흐름입니다.

### 5가지 사전 준비

**1. Harness형 도구 설치**
OpenClaw / Microsoft Scout / WorkBuddy(또는 동급 도구) 중 하나를 설치합니다. 모두 로컬 파일 읽기/쓰기, 명령 실행, 웹 검색이 가능합니다.

**2. 구독 구매 또는 자체 API 설정**
도구에서 구독을 완료하거나, 자신의 LLM API 키(DeepSeek / OpenAI / Claude / Qwen / ERNIE 등)를 입력하여 도구가 정상적으로 대화할 수 있게 합니다.

**3. 네트워크 환경 준비**
가장 자주 막히는 단계입니다.
- 머신이 **Docker 이미지 레지스트리**(Docker Hub / quay.io 등)에 접근할 수 있는지 확인합니다. 직접 접근이 안 되면 사전에 레지스트리 미러(예: DaoCloud)를 구성합니다.
- **GitHub**(저장소 클론 및 일부 공개 의존성 내려받기)에 접근할 수 있는지 확인합니다. 직접 접근이 안 되면 프록시를 사용하거나 소스 아카이브를 미리 다운로드합니다.
- 노출하려는 네트워크 세그먼트에서 대상 머신에 도달할 수 있는지 확인합니다.

**4. 프로젝트를 로컬에 Git clone 또는 다운로드**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# 또는 아카이브를 다운로드하여 임의의 로컬 폴더에 압축 해제
```

**5. 아래 프롬프트를 도구에 붙여넣어 자동 배포 시작**

아래 **프롬프트 전체**를 Harness 도구의 입력란에 복사한 뒤 질문에 하나씩 답하면 됩니다. 도구는: 플랫폼 감지 → 매개변수 수집 → 로컬 진행 파일 생성 → 배포 가이드에 따라 단계별 설정 → 문제 테스트·수정 반복 → 진행 상황 지속 갱신 → 마지막에 전체 테스트 및 결과 보고를 수행합니다.

### 원클릭 배포 프롬프트 (도구에 복사)

````text
당신은 기업 인트라넷 AI 플랫폼의 배포 엔지니어입니다. 이 프로젝트의 문서와 설정 파일을 바탕으로 현재 머신에 "AI AllInOne" 플랫폼을 완전히 배포하고 검증하세요. 전 과정에서 한국어로 저와 소통하고 아래 절차를 엄격히 따르세요.

## 1단계: 배포 디렉터리와 대상 플랫폼 확인

1. 먼저 저에게 물어보세요: 이 프로젝트의 로컬 압축해제/클론 경로는 무엇인가요? (예: C:\AIAllInOne 또는 /opt/AIAllInOne)
2. 해당 디렉터리에 들어간 뒤 현재 머신의 운영체제에 따라 대상 플랫폼 폴더를 판단하세요.
   - Windows → `windows-github`(또는 `windows`) 폴더 사용
   - Linux / macOS → `linux-github`(또는 `linux`) 폴더 사용
   - 온라인 서버 / 순수 Docker 환경 → `docker-github`(또는 `docker`) 폴더 사용
   확실하지 않으면 감지한 OS를 저에게 알리고 어떤 폴더를 사용할지 확인하세요.
3. 루트 README.md와 해당 플랫폼 폴더 내 README.md를 읽고, 행동하기 전에 전체 아키텍처와 배포 방식을 이해하세요.

## 2단계: 필요한 매개변수 수집 (하나씩 물어보세요. 건너뛰거나 추측하지 마세요)

설정 전에 아래 정보를 수집하고, 빠진 항목은 저에게 물어보며 각 항목의 용도를 설명하세요.

1. 플랫폼 노출에 사용할 인트라넷 IP (다른 머신이 접근하는 주소, 예: 192.168.1.100).
2. 신원 소스(Identity Provider):
   - 회사 AD 도메인 컨트롤러(Active Directory): 도메인명, DC IP, LDAP base DN, bind DN, bind 계정 비밀번호, sAMAccountName 등을 물어보세요.
   - 기타 IdP(LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk 등): 해당 설정과 계정 정보를 물어보세요.
   - 외부 신원 소스 없음(로컬 계정만): 저와 확인 후 건너뛰세요.
3. 통합 관리자 계정: 사용자 이름, 비밀번호, 이메일(Keycloak SSO 및 각 제품 관리자 로그인용).
4. LLM API 키: 제가 실제로 보유한 모델 제공자와 키(DeepSeek / OpenAI / Claude / Qwen / ERNIE 등). 없는 것은 건너뛰세요.
5. 필요에 따라 물어볼 기타 항목: 알림 통지 채널(DingTalk/WeCom/Feishu 웹훅 URL), HTTPS 인증서, 백업 보존 정책 등.

## 3단계: 로컬 진행 파일 생성

1. 플랫폼 폴더에서 "진행 체크리스트" 문서(예: *-checklist*.html)와 "신원 소스 통합 가이드"(예: *-ad-integration*.html 또는 IdP 관련 문서)를 찾으세요.
2. 체크리스트 내용을 바탕으로 프로젝트 디렉터리에 새 진행 파일(예: "deployment-progress-<플랫폼>-<날짜>.md")을 생성하고, 체크리스트의 모든 항목을 미완료(- [ ])로 복사하세요.
3. 이후 항목을 완료하거나 문제를 해결할 때마다 이 진행 파일을 즉시 갱신하고 대화에서 진행 상황을 간략히 보고하세요.

## 4단계: 배포 가이드에 따라 단계별 설정

1. 플랫폼의 "배포 가이드" 문서(예: *-deploy-guide*.html)를 꼼꼼히 읽고 엄격히 따르며, 문서에 표시된 "⚠️ 중요 함정 / 주의점"에 특히 유의하세요.
2. 대략적 순서: 환경 변수 준비 → 컨테이너 시작 → 인증/IdP 초기화 → LLM 라우팅 및 모델 채널 설정 → 각 제품 초기화 → 모니터링/옵저버빌리티/로깅/마스킹 설정 → 백업·복원 설정.
3. 디렉터리에 이미 있는 자동화 스크립트(예: bootstrap.ps1, keycloak-realm-init.ps1, health-check 등)를 우선 사용하고, 자동화할 수 있는 단계는 UI를 수동으로 클릭하지 마세요.

## 5단계: 저와 반복하며 문제 테스트·수정

1. 단계가 실패하거나 기대와 다르면 먼저 로그(docker logs, 각 서비스의 헬스 엔드포인트, 설정 파일)를 확인해 근본 원인을 찾은 뒤 수정하세요. 무작정 재시도하지 마세요.
2. 제 개입이 필요하면(관리자 권한으로 명령 실행, 로그인 확인, 추가 정보 제공 등) "무엇을, 왜" 해야 하는지 명확히 알려주세요.
3. 해결 후 근본 원인과 수정 방법을 진행 파일에 기록하고 간략히 보고하세요.

## 6단계: 전체 엔드투엔드 검증

체크리스트의 모든 항목이 완료되면 최소 다음을 포함하는 전체 엔드투엔드 테스트를 실행하세요.
- 서비스 헬스(모든 컨테이너 Up, 헬스 엔드포인트 정상);
- SSO 통합 로그인(Keycloak 로그인 → 각 제품 SSO/자동 로그인);
- LLM 체인(NewAPI/LiteLLM을 통해 실제 채팅 1회 전송, 응답 + PII 마스킹 검증);
- 신원 소스 로그인(AD/기타 IdP 연결 시 해당 계정으로 로그인 테스트);
- 모니터링/옵저버빌리티/로깅/알림(데이터가 있고 알림이 발화하는지 확인);
- 백업·복원(백업 1회 실행 후 복원 가능 여부 검증).

마지막으로 테스트 결과를 항목별로 요약하여 ✅통과 / ❌실패를 명확히 표시하고, 실패 항목은 근본 원인과 후속 제안을 제시하세요.
````

---

## 3. 수동 배포 (대안)

Harness형 도구를 사용하지 않으려면 각 플랫폼의 `README.md`와 `*-deploy-guide*.html`을 따라 수동으로 배포할 수 있습니다. 주요 흐름은 동일합니다: 컨테이너 시작 → 인증/IdP 초기화 → LLM 채널 설정 → 각 제품 초기화 → 모니터링/백업 설정.

---

## 4. 보안 및 참고 사항

- 이 저장소에는 **실제 시크릿이 없습니다**. 모든 실제 값은 각 실행 환경의 `.env`에 있습니다(커밋되는 것은 `.env.example` 템플릿뿐).
- 기본값은 인트라넷의 평문 HTTP입니다. HTTPS는 각 플랫폼 배포 가이드의 해당 장을 참고하세요.
- 각 플랫폼의 주의점, 아키텍처 다이어그램, 포트 표, 데이터 흐름은 해당 `*-deploy-guide*.html` 문서에 있습니다.

---

## 5. AI 에이전트로 운영하기

이 플랫폼은 AI 에이전트(WorkBuddy, OpenClaw, Microsoft Scout 등)로 완전히 운영·유지보수할 수 있습니다. 상태 점검, 컨테이너 관리, 설정 변경, Gitea 동기화, Ghost 포털, 백업, 릴리스, 문제 해결.

전체 안내는 **[AI 에이전트 운영 가이드](AI-AGENT-OPS.ko.md)**(9개 언어 제공)를 참고하세요.

---

## 7. 매뉴얼 (온라인, 모든 언어)

관리자 매뉴얼：[English](docs/admin-manual.md) · [简体中文](docs/i18n/admin-manual-zh-cn.md) · [繁體中文](docs/i18n/admin-manual-zh-TW.md) · [Français](docs/i18n/admin-manual-fr.md) · [Español](docs/i18n/admin-manual-es.md) · [Português](docs/i18n/admin-manual-pt.md) · [日本語](docs/i18n/admin-manual-ja.md) · [한국어](docs/i18n/admin-manual-ko.md) · [العربية](docs/i18n/admin-manual-ar.md)

사용자 매뉴얼：[English](docs/user-manual.md) · [简体中文](docs/i18n/user-manual-zh-cn.md) · [繁體中文](docs/i18n/user-manual-zh-TW.md) · [Français](docs/i18n/user-manual-fr.md) · [Español](docs/i18n/user-manual-es.md) · [Português](docs/i18n/user-manual-pt.md) · [日本語](docs/i18n/user-manual-ja.md) · [한국어](docs/i18n/user-manual-ko.md) · [العربية](docs/i18n/user-manual-ar.md)
