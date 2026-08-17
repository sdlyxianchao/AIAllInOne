# 제2장: 사전 준비

*제1부 · 배포편*

> Docker Desktop 설치, 디렉터리 준비, 네트워크 연결, IP 고정——배포 전에 반드시 완료해야 할 일.

[← 제1장: 플랫폼 개요 및 아키텍처](ch01-overview.md) · [📖 목차](index.md) · [제3장: 설정 파일 및 환경 변수 →](ch03-env.md)

---

## 2.0 두 가지 배포 방식

본 매뉴얼은 **수동으로 장별 실행**할 수도, **AI Agent 도구에 맡겨 자동 실행**할 수도 있습니다. Agent 사용 시 본 디렉터리(본 매뉴얼, `docker-compose.yml`, `.env.example`, `scripts/` 포함)를 Agent에 제공하고 아래 프롬프트를 붙여넣으세요.

> **Agent에 복사할 배포 프롬프트:**
> 당신은 기업 내부망 AI 플랫폼의 배포 엔지니어입니다. 본 디렉터리의 《관리자 매뉴얼》 배포편, docker-compose.yml 및 .env.example에 따라 현재 이 머신에 「AI AllInOne」 플랫폼을 완전히 배포하고 검증하세요. 전체 과정을 한국어로 소통하세요.
>
> 첫 번째 단계 파라미터 수집 (항목별로 제게 묻고, 건너뛰거나 추측하지 마세요):
> 1) 외부 서비스용 내부망 IP; 2) Skill 마켓 호스트명 (도메인, mcp-gateway/skills/skill-market/config.json과 SKILL.md의 <마켓-호스트명>을 교체하고 hosts/DNS에서 해석); 3) 신원 소스 (AD 도메인 컨트롤러 연동 시 도메인/도메인 컨트롤러 IP/LDAP base DN/bind DN/bind 비밀번호/sAMAccountName 필요); 4) 통합 관리자 계정 비밀번호; 5) 대형 모델 API Key; 6) 필요에 따라 알림 webhook, HTTPS, 백업 보존 정책을 물어보세요.
>
> 두 번째 단계 진행 파일을 생성하고, 각 항목 완료 시마다, 문제 해결 시마다 업데이트하고 보고하세요.
>
> 세 번째 단계 본 매뉴얼 제1~13장 순서를 엄격히 따라 실행하고, 각 장의 「⚠️ 핵심 함정」에 주의하며 scripts/ 아래의 스크립트로 자동화를 우선하세요.
>
> 네 번째 단계 오류가 나면 먼저 로그(docker logs, 헬스 엔드포인트, 설정)를 확인해 근본 원인을 찾아 수정한 후, 무작정 재시도하지 마세요.
>
> 다섯 번째 단계 전체 흐름 검증: 컨테이너 전부 Up, Keycloak SSO, NewAPI/LiteLLM 경유 실제 대화로 PII 비식별화 검증, 신원 소스 로그인, 모니터링/로그/알림, 백업 복구를 항목별로 ✅/❌로 정리하세요.

> 💡 Agent를 사용하지 않아도 위 내용은 「배포 전 정보 확인 체크리스트」로 활용할 수 있습니다: 배포 전에 내부망 IP, 신원 소스, 관리자 비밀번호, 모델 Key 네 가지를 먼저 정리하세요.

## 2.1 Docker Desktop 설치 및 설정

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

## 2.2 디렉터리 구조 준비

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # 가정한 배포 루트 디렉터리
├─ docker-compose.yml           # 핵심 서비스 오케스트레이션
├─ .env.windows                 # 환경 변수 (API Key 입력 필요)
├─ litellm-config.yaml          # LiteLLM PII 비식별화 설정
├─ deepchat-updates\            # DeepChat 설치 패키지 호스팅 디렉터리
├─ admin-portal\                # AI 관리 센터 구현
├─ mcp-gateway\                 # Skill / MCP 게이트웨이
├─ monitoring\                  # Prometheus / Loki 설정
└─ scripts\                     # 백업 / 복구 / 상태 점검 / 초기화 스크립트
```

## 2.3 Docker 공유 네트워크 생성

```
docker network create ai-platform
docker network ls | findstr ai-platform   # 검증
```

> 모든 핵심 컨테이너는 `ai-platform` 네트워크를 통해 컨테이너 이름으로 서로 접근합니다 (예: NewAPI가 LiteLLM에 접근할 때 `http://litellm:4000` 사용, localhost 경유 안 함).

## 2.4 호스트 내부망 IP 고정 (중요)

호스트가 WiFi를 사용하면 IP가 DHCP로 동적 할당되어 재부팅이나 임대 만료 시 변경됩니다; 변경되면 직원이 각 제품에 접속하는 주소가 모두 무효화됩니다. 라우터에서 **DHCP 예약 (MAC 바인딩)**을 권장합니다:

1. WiFi 네트워크 카드 MAC 확인: `ipconfig /all`에서 「무선 LAN 어댑터 WLAN」의 물리적 주소 확인 (예: `60-A3-E3-41-8F-61`);

2. 라우터 관리 페이지 로그인 (예: `http://192.168.31.1`) → LAN 설정 / DHCP 정적 IP 할당;

3. 규칙 추가: MAC → IP (예: `192.168.31.117`), 저장;

4. WiFi 재연결 후 IP 고정 확인.

> ✅ DHCP 예약이 Windows에서 정적 IP를 설정하는 것보다 안정적입니다 (라우터가 통합 관리, 충돌 없음).

## 2.5 네트워크 연결 (가장 막히기 쉬운 단계)

- **Docker 이미지 레지스트리에 연결 가능**: Docker Hub / quay.io / ghcr.io. 안 되면 먼저 이미지 가속기(예: DaoCloud) 설정.

- **GitHub에 연결 가능**: 저장소 클론, 공개 의존성 다운로드. 안 되면 프록시 사용 또는 미리 소스 패키지 다운로드.

- **대상 머신이 내부망에서 접근 가능**: 노출할 네트워크 대역이 도달 가능한지 확인.

---

[← 제1장: 플랫폼 개요 및 아키텍처](ch01-overview.md) · [📖 목차](index.md) · [제3장: 설정 파일 및 환경 변수 →](ch03-env.md)
