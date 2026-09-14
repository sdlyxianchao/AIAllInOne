# AI AllInOne 관리자 매뉴얼

*v0.2 · 배포 · 관리 · 운영*

이 매뉴얼은 세 부분으로 나뉩니다: **배포** (1~13장, 플랫폼을 처음부터 구축), **관리** (14~26장, 13개 제품의 일상 운영), **운영** (27~29장, 백업 / 헬스 체크 / 문제 해결), 그리고 **부록** (벤더 공식 문서 링크). 각 장 페이지 하단에 이전/다음 내비게이션이 있습니다. 처음부터 끝까지 읽거나 필요한 장으로 바로 이동할 수 있습니다.

## 제1부 · 배포편

| # | 장 | 설명 |
| --- | --- | --- |
| 1 | [플랫폼 개요 및 아키텍처](ch01-overview.md) | 이 플랫폼의 구성, 포트, 데이터 흐름을 이해하는 것이 이후 모든 배포 및 관리 작업의 전제입니다. |
| 2 | [사전 준비](ch02-prereq.md) | Docker Desktop 설치, 디렉터리 준비, 네트워크 연결, IP 고정——배포 전에 반드시 완료해야 할 일. |
| 3 | [설정 파일 및 환경 변수](ch03-env.md) | 세 가지 핵심 설정 파일 + 전체 환경 변수 설명, 지금 설정할 것과 나중에 설정할 것. |
| 4 | [핵심 서비스 시작](ch04-start.md) | .env 복사, 컨테이너 기동, 서비스별 접근 가능 여부 검증, Ghost의 SQLite 알려진 문제 처리. |
| 5 | [Dify 독립 배포](ch05-dify-deploy.md) | Dify는 공식 compose(약 15개 컨테이너)로 독립 배포하여 포트 충돌을 피합니다. |
| 6 | [Keycloak: Realm, 사용자 및 AD](ch06-keycloak.md) | Realm 생성, 로컬 계정 생성, 또는 Active Directory에서 도메인 계정 가져오기——모든 제품 SSO의 기반. |
| 7 | [NewAPI: 초기화, 채널 및 OIDC](ch07-newapi.md) | 초기 설치 마법사 완료, LiteLLM을 가리키는 채널 설정, API Key 발급, Keycloak OIDC 연동. |
| 8 | [LiteLLM: 검증 및 캐시](ch08-litellm.md) | LiteLLM 프록시 사용 가능 여부 검증, 응답 캐시 활성화로 token 절약. |
| 9 | [Dify / Ghost / Gitea 설정](ch09-products.md) | 세 제품 각각의 초기화 및 상호 연결 설정. |
| 10 | [DSH Desktop 배포 및 CI/CD](ch10-dsh.md) | DSH Desktop 설치 패키지를 직원에게 배포하고, Gitea Actions로 공식 새 버전을 자동 동기화. |
| 11 | [MCP Gateway 및 Skill 마켓](ch11-mcp.md) | Skill과 MCP 도구를 중앙에서 관리하는 게이트웨이, DSH Desktop/Dify가 주소 하나만 연결하면 모든 도구를 얻을 수 있습니다. |
| 12 | [AI 관리 센터](ch12-admin-center.md) | 통합 관리자 포털: Keycloak 인증, 좌측 메뉴에 모든 제품 임베드, Dashboard 클러스터 상태. |
| 13 | [상호 연결 검증 체크리스트](ch13-interconnect.md) | 배포 완료 후 12개 상호 연결 링크를 항목별로 모두 연결되었는지 확인. |

## 제2부 · 관리편 (각 제품 일상 운영)

| # | 장 | 설명 |
| --- | --- | --- |
| 14 | [Keycloak 일상 관리](ch14-ops-keycloak.md) | 인증 허브: 사용자, 역할, OIDC 클라이언트, AD 페더레이션, 세션 관리. |
| 15 | [NewAPI 일상 관리](ch15-ops-newapi.md) | LLM 게이트웨이: 채널, 토큰, 할당량, 사용자, 로그, 비용 관리. |
| 16 | [LiteLLM 일상 관리](ch16-ops-litellm.md) | PII 비식별화 프록시: 모델 목록, 비식별화 규칙, 캐시, Langfuse 보고. |
| 17 | [Dify 일상 관리](ch17-ops-dify.md) | AI 앱 플랫폼: 앱, 지식베이스, 모델 공급자, 멤버 권한, 게시. |
| 18 | [Ghost 일상 관리](ch18-ops-ghost.md) | 기업 포털 / Hub: 글, 페이지, 내비게이션, 테마, 멤버. |
| 19 | [Gitea 일상 관리](ch19-ops-gitea.md) | 내부 Git + CI/CD: 저장소, 조직, Runner, Actions. |
| 20 | [MCP Gateway 일상 관리](ch20-ops-mcp.md) | MCP Server 증감, Skill 업로드/삭제, 내장 도구 확장. |
| 21 | [업데이트 서버 관리](ch21-ops-update.md) | DSH Desktop 설치 패키지 호스팅 및 자동 업데이트. |
| 22 | [모니터링 및 알림 관리](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager: 컨테이너 리소스 모니터링 및 알림 통지. |
| 23 | [LLM 관측 (Langfuse)](ch23-ops-langfuse.md) | 매 모델 호출의 프롬프트, 응답, 지연시간, token, 비용 추적. |
| 24 | [통합 로그 (Loki)](ch24-ops-loki.md) | 모든 컨테이너 로그를 집계해 컨테이너 + 키워드 + 시간으로 검색. |
| 25 | [PII 비식별화 (Presidio)](ch25-ops-pii.md) | 민감 정보가 내부망을 나가기 전에 자동 비식별화. |
| 26 | [MailHog 메일 수신기](ch26-ops-mailhog.md) | 내부망에 SMTP가 없을 때의 「메일 출구」, Ghost 인증 코드/통지 메일 수신. |

## 제3부 · 운영편

| # | 장 | 설명 |
| --- | --- | --- |
| 27 | [백업 및 복구](ch27-backup.md) | 전체 데이터 매일 백업, 원클릭 복구. |
| 28 | [상태 점검 및 부팅 자체 점검](ch28-healthcheck.md) | 전체 41개 컨테이너 + LLM 전체 링크 + 인증 링크 원클릭 점검. |
| 29 | [문제 해결 매뉴얼](ch29-troubleshooting.md) | 증상별 빠른 조회로 근본 원인 신속 파악. |

## 부록

| # | 장 | 설명 |
| --- | --- | --- |
| 부록 | [원문 문서 색인](ch30-appendix.md) | 모든 서드파티 제품의 공식 문서 주소 (평문 URL, 인쇄 후에도 대조 가능). |

---

> 🌐 다른 언어：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · [繁體中文](../admin-manual-zh-TW/index.md) · [Français](../admin-manual-fr/index.md) · [Español](../admin-manual-es/index.md) · [Português](../admin-manual-pt/index.md) · [日本語](../admin-manual-ja/index.md) · 한국어 · [العربية](../admin-manual-ar/index.md)
