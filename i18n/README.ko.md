# AI AllInOne — 오픈소스 자가 호스팅 기업 AI 플랫폼

> 📖 **언어**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · **한국어** · [العربية](README.ar.md)

> ⭐ **이 프로젝트가 도움이 되셨다면 Star를 눌러주세요 — 무료이며 더 많은 사람들이 찾을 수 있게 됩니다.**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

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

#### 🤖 AI 배포 — 원클릭, AI 에이전트 주도

> 배포 가이드(0장)에서 가져온 내용 : 가이드는 **수동으로 장(chapter)별로 실행**할 수도 있고, **AI 에이전트**(WorkBuddy / OpenClaw / Microsoft Scout)에게 처음부터 끝까지 맡길 수도 있습니다. 이 디렉터리(가이드, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`)를 에이전트에 제공하고 아래 프롬프트를 붙여넣으면, 에이전트는 : 플랫폼 판별 → 파라미터를 하나씩 수집 → 로컬 진행 파일 생성 → 가이드에 따라 단계별 구성 → 실패 시 테스트·디버그·재시도 → 진행 상황을 계속 업데이트 → 엔드투엔드 전체 검증을 실행하고 결과를 보고합니다.

**에이전트에 복사할 프롬프트** (Windows 플랫폼, 한국어 — 에이전트가 단계별로 안내합니다) :

````text
당신은 기업 인트라넷 AI 플랫폼의 배포 엔지니어입니다. 이 디렉터리의 배포 가이드 "windows-deploy-guide-v2.html", 진행 체크리스트 windows-checklist.html, docker-compose.yml, .env.example을 기반으로 이 Windows 머신에서 "AI AllInOne" 플랫폼을 완전히 배포하고 검증하세요. 전체 과정에서 저와 한국어로 소통하세요.

## 1단계: 필요 파라미터 수집(하나씩 물어보세요. 건너뛰거나 추측하지 마세요)
시작 전에 저에게서 수집할 것: 1) 외부에 노출할 인트라넷 IP; 2) Skill 마켓 호스트 이름(도메인 — mcp-gateway/skills/skill-market/config.json 및 SKILL.md의 <market-hostname>을 교체하는 데 사용하며 hosts/DNS로 해석); 3) ID 공급원(AD 도메인 컨트롤러 연동 시 도메인/DC IP/LDAP base DN/bind DN/bind 비밀번호/sAMAccountName, 또는 다른 IdP 설정, 미연동 시 확인); 4) 통합 관리자 계정과 비밀번호; 5) LLM API 키(DeepSeek/OpenAI/Claude 등); 6) 필요 시 알림 webhook, HTTPS, 백업 보존 정책 질문.

## 2단계: 로컬 진행 파일 생성
windows-checklist.html의 내용을 기반으로 이 디렉터리에 "deployment-progress-<date>.md"를 생성하고 모든 항목을 미완료(- [ ])로 복사하세요. 항목을 완료하거나 문제를 해결할 때마다 업데이트하고 간단히 보고하세요.

## 3단계: 배포 가이드에 따라 단계별로 구성
windows-deploy-guide-v2.html을 정독하세요 — 이번 배포의 유일한 권위 있는 가이드입니다. 1~13장을 엄격히 순서대로 실행하고(windows-checklist.html이나 이전 문서로 대체하지 말 것), 각 장의 "⚠️ 핵심 함정"에 특히 주의하세요. scripts/ 아래의 자동화 스크립트(bootstrap.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, keycloak-realm-init.ps1, backup.ps1, restore.ps1 등)를 우선 사용하고, 자동화할 수 있는 것은 UI를 수동 클릭하지 마세요. Ghost 포털(6.5장) 필수사항: ①번들된 Corp Portal 테마를 배포하고 scripts\ghost-theme-setup.ps1을 실행해 자동 설치·활성화할 것, 공식 기본 테마에 머물지 말 것; ②샘플 콘텐츠 가져오기: 먼저 포털과 각 제품의 대외 공개 주소(인트라넷 IP 또는 도메인, 예: 192.168.1.10 또는 portal.company.com)를 저에게 물어보세요 — 그 주소로 seed의 <server-IP> 플레이스홀더를 교체하고(문서 본문의 NewAPI / MCP / Dify 등 접속 URL도 함께 교체, host.docker.internal 같은 컨테이너 내부 고정 주소는 변경하지 말 것); 다음으로 포털 샘플 콘텐츠의 언어를 물어보세요 — 중국어면 scripts\ghost-content-import.ps1 -ServerAddr "공개 주소"를 바로 실행; 다른 언어면 먼저 ghost-content-seed/content.json의 title / html / plaintext / custom_excerpt 필드를 대상 언어로 번역한 뒤(<server-IP> 플레이스홀더와 모든 URL 구조는 유지) 가져오세요.

## 4단계: 반복 테스트로 해결
오류 발생 시 먼저 로그(docker logs, 헬스 엔드포인트, 설정)를 확인해 근본 원인을 찾은 뒤 수정하고, 무작정 재시도하지 마세요. 관리자 권한이나 제 수동 확인이 필요하면 "무엇을, 왜" 명확히 알려주세요. 해결 후 진행 파일에 기록하고 간단히 보고하세요.

## 5단계: 전체 엔드투엔드 검증
모든 작업이 끝나면 엔드투엔드 테스트를 실행하세요: 전체 컨테이너 Up, Keycloak SSO 로그인, NewAPI/LiteLLM을 통한 실제 대화로 PII 마스킹 검증, ID 공급원 로그인, 모니터링/로그/알림, 백업/복원. 마지막으로 각 항목을 ✅/❌로 정리하고, 실패 항목에는 근본 원인과 제안을 제시하세요.
````

> 💡 에이전트를 **사용하지 않더라도** 이 프롬프트는 배포 전 체크리스트로 활용할 수 있습니다 — 시작 전에 준비해야 할 모든 파라미터가 나열되어 있습니다.

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

## 🎓 교육 프로그램

이 플랫폼에는 배포 및 운영을 위한 **완전한 교육 프로그램**(모듈 17개, 60시간, 영업일 10일)이 포함되어 있습니다:

| 패키지 | 언어 | 진입점 |
|---|---|---|
| **English** | EN | [training/training_eng/index.html](../training/training_eng/index.html) |
| **简体中文** | zh-CN | [training/training_chn/index.html](../training/training_chn/index.html) |

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

## ⭐ 프로젝트 지원하기

AI AllInOne이 시간이나 비용을 절약해 준다면, Star 하나는 비용이 들지 않으면서 프로젝트 성장에 도움이 됩니다:

- ⭐ **이 저장소에 Star 누르기** — 더 많은 사람들이 프로젝트를 발견하고 혜택을 받을 수 있습니다
- 🐛 **이슈 보고** — 버그, 기능 요청, 배포 문제 모두 환영합니다
- 🤝 **기여하기** — 코드, 문서, 번역(9개 언어) 모두 환영합니다
- 💬 **커뮤니티 참여** — 배포 경험과 아이디어를 공유하세요
- 📣 **공유하기** — 동료에게 알리거나 블로그 / 소셜 미디어에 소개해 주세요

오른쪽 위 Star를 누르는 것이 이 프로젝트에 대한 최고의 지원입니다.

## 📄 라이선스

[MIT](../LICENSE)——자유롭게 사용·수정·배포할 수 있습니다. 통합된 컴포넌트는 각자의 라이선스를 유지합니다(배포 가이드의 라이선스 검토 챕터 참조).

## 🤖 AI 에이전트 운영

이 플랫폼은 **AI 에이전트를 통한 운영·유지보수**를 염두에 두고 설계되었습니다 — WorkBuddy, OpenClaw, Microsoft Scout 또는 이와 동등한 도구입니다. 수십 개의 관리 콘솔을 클릭하는 대신, 에이전트에게 자연어로 원하는 것을 말하면 에이전트가 파일을 읽고, 명령을 실행하고, 서비스와 통신해 줍니다.

플랫폼을 구동하는 모든 것은 여러분의 머신에 **코드, 구성, 데이터**로 존재합니다 — Docker Compose 서비스, `.env` 파일, 관리 API, 실제 상태를 담은 DB/파일 — 따라서 에이전트는 이를 모두 보고 수정할 수 있습니다 :

| 任务 | Agent 的做法 |
|---|---|
| 상태 확인 / 개요 | `docker ps` + 헬스 엔드포인트 + 관리 API |
| 서비스 시작 / 재시작 / 중지 | `docker compose up -d <svc>` / `docker restart <svc>` |
| 로그 및 오류 확인 | `docker logs <svc> --tail N` + 로그 파일 |
| 구성 변경 | 구성 파일을 편집하고 해당 컨테이너 재시작 |
| AI 관리 센터 편집 | `admin-portal/public/index.html`(UI) 또는 `admin-portal/server.js`(API) 편집 후 재시작 |
| Gitea 및 동기화 관리 | Gitea API : 워크플로 트리거, 실행 상태/로그 조회, 리포지토리 파일 편집 |
| Ghost 포털 관리 | Ghost SQLite DB 읽기/쓰기, 테마 편집, 콘텐츠 시드 가져오기 |
| 백업 및 복원 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 릴리스 게시 | `publish.ps1`(빌드 + 커밋 + GitHub 푸시) |
| 문제 해결 | 포트 충돌, Docker Desktop 문제, DNS/프록시 등 |

예: *「모든 서비스가 실행 중이고 정상인지 확인해 줘」* — 에이전트가 `docker ps`를 실행하고 각 헬스 엔드포인트를 확인한 뒤 무엇이 잘못되었는지, 왜 그런지 보고합니다. 준비된 프롬프트, 모범 사례, 전체 명령어 레퍼런스는 **[AI 에이전트 운영 가이드](../AI-AGENT-OPS.md)**(9개 언어)를 참고하세요.

### 🛡️ AI 운영 — 원커맨드 헬스 체크 및 자동 시작

> 배포 가이드(12장)에서 가져온 내용 : 플랫폼에는 **원커맨드 상태 확인**(`health-check.ps1`)이 포함되어 있어 **41개 컨테이너를 9단계**로 검증합니다 — LLM 전체 체인, AD 인증 + 관리자 로그인, MCP/Skill 기능, 디스크 공간을 포함합니다. 자격 증명은 `.env`에서 읽어오며 스크립트에 비밀번호가 하드코딩되어 있지 않습니다. AI 에이전트에게 실행하라고 지시하면 됩니다(예: *「헬스 체크를 실행하고 무엇이 실패했는지 알려줘」*). 로그온 시 자동 실행으로 설정할 수도 있습니다 :

| 단계 | 확인 항목 | 방법 |
|---|---|---|
| Stage 1 | Docker 데몬 실행 여부(준비될 때까지 대기, 자동 시작 대응) | `docker info` |
| Stage 2 | 41개 컨테이너 상태(Up/Exited/Restarting) | `docker ps -a` |
| Stage 3 | HTTP 엔드포인트 10개 응답(MCP Gateway 포함) | `curl.exe 127.0.0.1:포트` |
| Stage 4 | LiteLLM /readiness + **모델 등록**, litellm-redis PING, Dify API /health, MySQL/PostgreSQL/Redis/Sandbox 상태 | `docker exec` + `docker inspect` |
| Stage 5 | **LLM 전체 체인** : NewAPI 채널 상태 + DeepChat 및 Dify 명의로 각 1건 실요청(NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **AD 인증 체인** : Keycloak well-known + AD 사용자 동기화(aitest1) + NewAPI OIDC 설정 + OIDC 클라이언트 무결성 + **NewAPI 관리자 로그인** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + 외부 Skill 집계 | curl(MCP 프로토콜) |
| Stage 8 | **DeepChat / Dify 로그인 전제조건** : NewAPI 사용 가능 + Dify 초기화됨 | curl + psql |
| Stage 9 | **디스크 공간** : 시스템 디스크 여유 + Docker 사용량 | `Get-PSDrive` + `docker system df` |

**수동 실행** (PowerShell) :

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**로그온 시 자동 실행** (예약 작업 — PowerShell을 관리자로 실행) :

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
