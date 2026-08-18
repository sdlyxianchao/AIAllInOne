# AI AllInOne — 오픈소스 자가 호스팅 기업 AI 플랫폼

> 📖 **언어**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · **한국어** · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

> **서버 한 대. 계정 하나. 기업용 AI 올인원——오픈소스 무료, 데이터는 인트라넷 밖으로 나가지 않습니다.**

AI AllInOne은 **오픈소스 무료**이며 바로 사용 가능한 기업 인트라넷 AI 플랫폼입니다. 통합 단일 로그인(SSO), LLM 라우팅, AI 애플리케이션, 기업 포털, 소스코드/CI, 통합 관리, 모니터링·알림, 옵저버빌리티, 로깅, 백업 및 복원——모든 것을 Docker로 오케스트레이션하여 하나로 묶습니다. **직원은 계정 하나로 한 번만 로그인하면 모든 AI 도구를 사용할 수 있습니다.**

![AI 관리 센터](<../pics/AI Admin.png>)

![기업 포털](<../pics/AI All In One Hub.png>)

---

## ✨ AI AllInOne을 선택해야 하는 이유

| | |
|---|---|
| 🧩 **올인원, 조립 불필요** | 8개 이상의 오픈소스 컴포넌트가 사전 통합: 인증, 게이트웨이, 애플리케이션, 포털, Git, 모니터링, 로깅, 백업. 직접 "조립"할 필요가 없습니다. |
| 🔐 **통합 단일 로그인(SSO)** | Keycloak 계정 하나(AD/LDAP 페더레이션 지원)로 모든 제품에 자동 로그인하여 비밀번호 입력 없이 진입합니다. |
| 🔒 **데이터가 인트라넷 밖으로 나가지 않음** | 완전 자가 호스팅——모델 호출, 프롬프트, 문서, 사용자 데이터가 모두 기업 내부에 남습니다. |
| ⚡ **약 30분 만에 배포 완료** | `docker compose` + 자동화 스크립트, 또는 AI Agent가 전체 환경 배포를 직접 도와줍니다. |
| 🛡️ **PII 비식별화(마스킹)** | 휴대폰 번호 / 주민등록번호 / 이메일 등 민감 정보를 외부 LLM 호출 전에 자동으로 마스킹합니다(Presidio). |
| 📊 **전 구간 옵저버빌리티** | Prometheus + Grafana 모니터링, Langfuse LLM 추적, Loki 통합 로깅, 기업 IM 알림(DingTalk/WeCom/Feishu). |
| 💾 **백업 및 복원** | 관리 콘솔에서 원클릭으로 매일 전체 백업과 복원을 수행할 수 있습니다. |
| 🌐 **9개 언어** | 매뉴얼과 관리 인터페이스 다국어 지원(간체 / 번체 / 영어 / 프랑스어 / 스페인어 / 포르투갈어 / 일본어 / 한국어 / 아랍어). |

## 📦 컴포넌트 목록

| 계층 | 컴포넌트 | 용도 |
|---|---|---|
| 인증 | Keycloak | SSO / OIDC, AD/LDAP 페더레이션 또는 로컬 계정 |
| LLM 라우팅 | NewAPI | 채널, API 키, 할당량, 감사, 비용 |
| PII 비식별화 | LiteLLM + Presidio | 모델 호출 전 민감 정보 자동 마스킹 |
| AI 애플리케이션 | Dify | 비주얼 AI 애플리케이션 / Agent 플랫폼 + 통합 지식 베이스(RAG) |
| 기업 포털 | Ghost | 사내 공지 및 뉴스 포털(커스텀 Corp Portal 테마 내장) |
| 소스코드 / CI | Gitea + Runner | 사내 Git + Actions 자동화 |
| 클라이언트 | DeepChat | 로컬 AI 데스크톱 클라이언트(Windows / macOS / Linux) |
| 클라이언트 배포 | Update Server | DeepChat 설치 패키지 호스팅 및 자동 업데이트 |
| 통합 관리 | AI Admin Center | 통합 진입점: 대시보드 + 내장 제품 + 감사/비용/리포트 + 등급별 관리자 권한 + Keycloak 동기화/역할 |
| 게이트웨이 | MCP Gateway | 스킬 / MCP 마켓 + Dify 지식 검색(RAG) |
| 모니터링 | Prometheus + Grafana + Alertmanager | 컨테이너 리소스 모니터링 + 알림 통지 |
| LLM 옵저버빌리티 | Langfuse | 매 모델 호출의 지연 시간, token, 비용 추적 |
| 통합 로깅 | Loki + Promtail | 모든 컨테이너 로그 집계, 컨테이너/키워드/시간별 검색 지원 |
| 백업 및 복원 | 스크립트 + 관리 페이지 | 매일 전체 백업 + 원클릭 복원 |

### 아키텍처와 데이터 흐름

![아키텍처 개요](<../pics/Architecture.png>)

![데이터 흐름](<../pics/DataFlow.png>)

---

## 🚀 빠른 시작

**사전 요구 사항**: Docker가 설치된 머신(Windows 11 + Docker Desktop, 또는 Linux)과 Docker 이미지 레지스트리 접근 권한.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# 핵심 서비스를 시작한 뒤, 배포 가이드에 따라 인증 / LLM 채널 / 각 제품을 초기화합니다
docker compose up -d
```

이제 두 가지 방법이 있습니다:

1. **자동 배포(권장)**——배포를 AI Agent(WorkBuddy / OpenClaw / Microsoft Scout)에게 맡깁니다. 배포 문서와 구성을 읽고, 필요한 파라미터(서버 IP, 신원 공급자, 관리자 계정, LLM API 키)를 수집한 다음 단계별로 전체 구성을 완료합니다. [원클릭 배포 프롬프트 보기 →](../windows/windows-deploy-guide-v2.md)

<details>
<summary>📋 원클릭 배포 프롬프트(클릭하여 펼치기)</summary>

````text
당신은 기업 인트라넷 AI 플랫폼의 배포 엔지니어입니다. 본 프로젝트의 문서와 설정 파일을 바탕으로 현재 머신에 「AI AllInOne」 플랫폼을 완전히 배포하고 검증하세요. 전 과정에서 한국어로 저와 소통하며, 아래 절차를 엄격히 따르세요.

## 1단계: 배포 디렉터리와 대상 플랫폼 확인
1. 먼저 저에게 물어보세요: 본 프로젝트의 로컬 압축 해제/클론 경로는 무엇인가요? (예: C:\AIAllInOne 또는 /opt/AIAllInOne)
2. 해당 디렉터리로 이동한 후, 현재 머신의 운영체제에 따라 대상 플랫폼 디렉터리를 결정하세요:
   - Windows → windows-github(또는 windows) 디렉터리 사용
   - Linux / macOS → linux-github(또는 linux) 디렉터리 사용
   - 온라인 서버 / 순수 Docker 환경 → docker-github(또는 docker) 디렉터리 사용
   확실하지 않으면, 감지된 운영체제를 알려주고 어떤 디렉터리를 사용할지 저와 확인하세요.
3. 작업을 시작하기 전에 루트 디렉터리의 README.md와 해당 플랫폼 디렉터리 내의 README를 읽고 아키텍처와 배포 방식을 이해하세요.

## 2단계: 필요한 파라미터를 항목별로 수집(하나씩 물어보고, 건너뛰거나 추측하지 말 것)
1. 플랫폼이 외부에 노출하는 인트라넷 IP(또는 도메인), 즉 다른 머신이 접속하는 주소(예: 192.168.1.100 또는 portal.company.com).
2. 신원 공급자(Identity Provider):
   - 회사 AD 도메인 컨트롤러: 도메인, DC IP, LDAP base DN, bind DN, bind 계정 비밀번호, sAMAccountName 등을 저에게 물어보세요.
   - 기타 IdP(LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk 등): 해당 구성과 계정 정보를 물어보세요.
   - 외부 신원 공급자가 없는 경우(로컬 계정만): 저와 확인한 후 건너뜁니다.
3. 통합 관리자 계정: 사용자 이름, 비밀번호, 이메일(Keycloak 단일 로그인(SSO)과 각 제품 관리자 로그인에 사용).
4. LLM API 키: 실제로 어떤 모델 공급자와 키를 보유하고 있나요(DeepSeek / OpenAI / Claude / Qwen / Tongyi / ERNIE 등)? 없는 것은 건너뜁니다.
5. Ghost 포털 예시 콘텐츠의 언어: 한국어, 또는 다른 언어로 번역한 후 가져옵니다.
6. 그 외 필요에 따라 질문: MCP 스킬 마켓 호스트 이름(Windows), 알림 통지 채널(DingTalk/WeCom/Feishu webhook), HTTPS 인증서, 백업 보존 정책 등.

## 3단계: 로컬 진행 상황 파일 생성
1. 플랫폼 디렉터리에서 「진행 체크리스트」 문서(*-checklist*.html)와 「신원 공급자 연동 가이드」(예: *-ad-integration*.html 또는 IdP 관련 문서)를 찾으세요.
2. 체크리스트 내용에 따라 프로젝트 디렉터리에 "deployment-progress-<platform>-<date>.md"와 같은 이름의 진행 파일을 생성하고, 각 체크리스트 항목을 미완료(- [ ]) 상태로 복사하세요.
3. 이후 항목 하나를 완료하거나 문제를 해결할 때마다 진행 파일을 즉시 업데이트하고, 대화에서 저에게 진행 상황을 간단히 보고하세요.

## 4단계: 배포 가이드에 따라 단계별로 구성
1. 플랫폼의 「배포 가이드」 문서(예: *-deploy-guide*.html)를 꼼꼼히 읽고 엄격히 준수하세요. 특히 표시된 「⚠️ 핵심 함정」을 주의하세요.
2. 대략적인 순서: 환경 변수 준비 → 컨테이너 시작 → 인증/IdP 초기화 → LLM 라우팅 및 모델 채널 구성 → 각 제품 초기화(Ghost 포털: 내장 Corp Portal 테마 배포 및 예시 콘텐츠 가져오기) → 모니터링/옵저버빌리티/로깅/비식별화 구성 → 백업 및 복원 구성.
3. 디렉터리 내의 자동화 스크립트(예: bootstrap.ps1, keycloak-realm-init.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, health-check.ps1 등)를 우선 사용하세요. 스크립트로 처리할 수 있는 단계는 UI를 수동으로 조작하지 마세요.

## 5단계: 저와 함께 반복 테스트하며 문제 해결
1. 특정 단계가 실패하거나 예상과 다를 때는 먼저 로그(docker logs, 각 서비스 헬스 엔드포인트, 설정 파일)를 확인해 근본 원인을 파악한 후 수정하고, 무작정 재시도하지 마세요.
2. 제 참여가 필요할 때(예: 관리자 권한이 필요한 명령 실행, 로그인 확인, 정보 보충)에는 「무엇을, 왜 해야 하는지」를 명확히 알려주세요.
3. 해결한 후에는 근본 원인과 수정 내용을 진행 파일에 기록하고 저에게 간단히 보고하세요.

## 6단계: 완전한 엔드투엔드 검증
모든 체크리스트 항목이 완료되면 완전한 엔드투엔드 테스트를 한 번 수행하세요. 최소한 다음을 포함해야 합니다:
- 서비스 상태(모든 컨테이너 Up, 헬스 엔드포인트 정상);
- 단일 로그인(SSO) 통합 로그인(Keycloak 로그인 → 각 제품 SSO/자동 로그인);
- LLM 체인(NewAPI/LiteLLM을 통해 실제 대화를 한 번 보내 응답과 PII 비식별화가 동작하는지 검증);
- 신원 공급자 로그인(AD/기타 IdP 연동 시, 해당 계정으로 로그인 테스트);
- 모니터링/옵저버빌리티/로깅/알림(데이터가 있고 알림이 트리거되는지 확인);
- 백업 및 복원(백업을 한 번 실행하고 복원 가능 여부를 검증).

마지막으로 테스트 결과를 항목별로 종합하고 ✅ 통과 / ❌ 실패를 명확히 표시하세요. 실패 항목에는 근본 원인과 후속 제안을 제공하세요.
````

</details>

2. **수동 배포**——[Windows 배포 가이드](../windows/windows-deploy-guide-v2.md)에 따라 단계별로 진행합니다(`windows-checklist.html` 진행 체크리스트 활용).

> **플랫폼 상태**: Windows(Windows 11 + Docker Desktop)는 **실측 테스트 중**입니다. Linux/macOS(`linux/`) 및 온라인 서버(`docker/`)는 계획 중입니다——[로드맵](#roadmap) 참조.

## 🖼️ 인터페이스 스크린샷

**Dify** — AI 애플리케이션 플랫폼 · **MCP/스킬 마켓** — 도구와 스킬을 원클릭으로 연동 · **DeepChat** — 데스크톱 AI 클라이언트

![Dify](<../pics/Dify.png>) ![MCP/스킬 마켓](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

더 많은 스크린샷(48장의 실제 인터페이스 화면)이 [관리자 매뉴얼](../docs/admin-manual/index.md)에 포함되어 있습니다.

## 📚 매뉴얼(온라인, 9개 언어)

| 매뉴얼 | 언어 |
|---|---|
| **관리자 매뉴얼** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **사용자 매뉴얼** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

일상적인 AI Agent 운영은 **[AI Agent 운영 가이드](../AI-AGENT-OPS.md)**를 참조하세요.

## 👥 커뮤니티

> 위챗(WeChat) 그룹——소통, 배포 문의, 피드백 및 **공동 구축**을 위한 공간입니다. QR코드를 스캔하여 친구를 추가하면 그룹으로 초대합니다.

<img src="../pics/wechat.png" alt="위챗 그룹 QR 코드" width="200" />

또한 [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions)를 자유롭게 이용해 주세요(또는 [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues)를 직접 등록할 수도 있습니다).

## 🤝 함께 기여하기

이 프로젝트는 **오픈소스 무료**이며 커뮤니티와 함께 성장합니다. 실력과 관계없이 누구에게나 맞는 방법이 있습니다:

- ⭐ **저장소에 스타(Star) 달기**——가장 간단하면서도 가장 가치 있는 지원
- 🐛 **버그 신고 / 요구사항 제안**——issue를 열고 재현 단계를 명확히 작성
- 📝 **문서와 튜토리얼 작성**——배포 가이드, 트러블슈팅 경험, 모범 사례
- 🌐 **번역**——매뉴얼이 이미 9개 언어를 지원하니 개선하거나 새로운 언어를 추가
- 🧪 **테스트 및 공유**——한 번 배포하고 어떤 점이 좋고 어떤 함정이 있었는지 알려주기
- 💻 **코드 기여**——통합 레이어(통합 단일 로그인(SSO), 관리 포털, 모니터링, 백업)가 시작하기 가장 좋은 곳

전체 가이드는 [CONTRIBUTING.md](../CONTRIBUTING.md)를 참조하고, 공개 [로드맵](#roadmap)에서 다음 계획을 확인할 수 있습니다. **모든 기여자는 README의 기여자 명단에 포함됩니다.**

<h2 id="roadmap">🗺️ 로드맵</h2>

- ✅ v0.9x — Windows 플랫폼: 올인원 + AI 관리 센터 + 등급별 관리자 권한 + 기업 IM 알림 + 시맨틱 캐시(LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — 자가 호스팅 Linux 서버 지원(`linux/`)
- 🚧 **온라인 서버** — 순수 Docker / 클라우드 프로덕션 배포(`docker/`)
- 🚧 **공동 구축 프로그램** — 작업 보드, 주간 동기화 미팅, 배포 파트너 인증

## 🔒 보안 안내

- 이 저장소에는 **실제 키가 전혀 포함되어 있지 않습니다**. 실제 값은 각 실행 환경의 `.env`에만 존재합니다(저장소에는 `.env.example` 템플릿만 커밋됨).
- 기본적으로 인트라넷 내 평문 HTTP를 사용합니다. HTTPS 구성은 각 플랫폼 배포 가이드를 참조하세요.
- 각 플랫폼의 함정, 포트 표, 데이터 흐름은 해당 `*-deploy-guide*.html` 문서를 참조하세요.

## 📄 라이선스

[MIT](../LICENSE)——자유롭게 사용·수정·배포할 수 있습니다. 통합된 컴포넌트는 각자의 라이선스를 유지합니다(배포 가이드의 라이선스 검토 챕터 참조).
