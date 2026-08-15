# AI 에이전트 운영 가이드

> 📖 **언어**: [English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

이 플랫폼은 **AI 에이전트로 운영·유지보수**하도록 설계되었습니다. WorkBuddy, OpenClaw, Microsoft Scout 등 동급의 어떤 도구든 사용할 수 있습니다. 수십 개의 관리 콘솔에 로그인해 UI를 일일이 클릭하는 대신, 자연어로 에이전트에게 원하는 것을 말하면 에이전트가 파일을 읽고, 명령을 실행하고, 각 서비스와 통신해 줍니다.

이 가이드는 AI 에이전트를 활용한 일상 운영 방법을 설명합니다: 상태 점검, 컨테이너 관리, 설정 변경, AI 관리 센터, Gitea/동기화, Ghost 포털, 백업, 릴리스, 문제 해결.

---

## 1. 작동 원리

플랫폼을 구동하는 모든 것은 로컬 머신에 **코드·설정·데이터**로 존재합니다:

- **Docker Compose**가 모든 컨테이너를 정의합니다.
- **`.env` 파일**(예: `windows/.env.windows`)이 서비스가 사용하는 자격 증명을 보관합니다.
- **관리 API**가 관리 엔드포인트를 노출합니다(Keycloak, Gitea, NewAPI 등).
- **파일과 데이터베이스**(Ghost SQLite DB, DeepChat 설치 파일, 동기화 이력 JSON 등)가 실제 상태입니다.

에이전트가 할 수 있는 일:

- **임의 파일 읽기·편집** — 설정, 스크립트, AI 관리 센터의 `index.html` / `server.js`, 문서.
- **명령 실행** — `docker`, `docker compose`, `git`, PowerShell, Node.js, Python.
- **HTTP로 서비스 호출** — 관리 API, 헬스 엔드포인트, 다운로드 링크.
- 필요 시 **웹 검색**으로 제품 문서 조회.

모든 것이 '파일 + 명령 + API'이므로 에이전트는 그 전부를 보고 변경할 수 있습니다. 그래서 플랫폼 전체를 에이전트로 운영할 수 있는 것입니다.

---

## 2. 준비(1회)

1. **에이전트에서 프로젝트 폴더를 연다.** 에이전트의 작업 디렉터리를 프로젝트 루트(예: `C:\AIAllInOne`)로 지정합니다. 여기서 `docker-compose.yml`, `.env` 파일, 스크립트, 문서를 읽습니다.
2. **Docker Desktop이 실행 중인지 확인한다.** 대부분의 작업은 `docker` / `docker compose` 명령입니다. Docker Desktop이 멈춰 있으면 에이전트의 첫 단계는 보통 확인 후 시작하는 것입니다.
3. **자격 증명은 `.env`에 두고, 대화에는 두지 않는다.** 에이전트는 `windows/.env.windows`에서 서비스 암호를 읽습니다. 실제 암호를 대화나 커밋된 파일에 붙여넣지 마세요.
4. **사용할 플랫폼 폴더를 알려준다**(불명확한 경우. 단일 머신이면 보통 `windows/`).

---

## 3. 에이전트가 할 수 있는 일

| 작업 | 에이전트의 방법 |
|---|---|
| 상태 점검 / 현황 요약 | `docker ps` + 헬스 엔드포인트 + 관리 API |
| 서비스 시작/재시작/중지 | `docker compose up -d <svc>` / `docker restart <svc>` |
| 로그·오류 확인 | `docker logs <svc> --tail N`, 로그 파일 읽기 |
| 설정 변경 | 파일 편집 후 영향 받는 컨테이너 재시작 |
| AI 관리 센터 편집 | `admin-portal/public/index.html`(UI) 또는 `admin-portal/server.js`(API) 편집 |
| Gitea + 동기화 관리 | Gitea API: 워크플로 트리거, 실행 상태/로그 조회, 저장소 파일 편집 |
| Ghost 포털 관리 | Ghost SQLite DB 읽기/쓰기, 테마 템플릿 편집, 샘플 콘텐츠 임포트 |
| 백업·복원 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| 릴리스 게시 | `publish.ps1`(빌드 + 커밋 + GitHub 푸시) |
| 정리 | `docker image prune`, 오래된 백업 삭제 등(확인 필요) |
| 문제 해결 | 포트 충돌, Docker Desktop 문제, DNS/프록시 등 |

---

## 4. 자주 하는 작업과 예시 지시

아래는 가장 자주 하는 작업과 각각의 예시 지시입니다. 자신의 언어로 말해도 됩니다. 에이전트가 알아듣습니다. `<…>`는 실제 값으로 바꾸세요.

### 4.1 전체 상태 점검

> "모든 서비스가 실행 중이고 정상인지 확인해. 중지됐거나 재시작을 반복하는 컨테이너를 나열하고 이유를 알려줘."

에이전트는 `docker ps`를 실행하고 각 헬스 엔드포인트를 호출해 상태를 보고합니다.

### 4.2 중지·오류 중인 서비스 조사

> "LiteLLM이 중지됐어. 원인을 찾아 고치고, 복구됐는지 확인해줘."

에이전트는 컨테이너 상태를 살피고, 로그를 읽고, 근본 원인(예: 포트 충돌)을 찾아 수정합니다.

### 4.3 서비스 재시작

> "server.js 변경을 반영하도록 admin portal을 재시작해줘."

에이전트는 `docker restart admin-portal`을 실행합니다. 참고: **백엔드** 코드(`server.js`) 변경은 컨테이너 재시작이 필요하지만, **프론트엔드**(`index.html`) 변경은 브라우저 새로고침만으로 충분합니다.

### 4.4 로그 확인

> "Gitea runner 로그의 마지막 50줄을 보여주고 오류가 있는지 알려줘."

### 4.5 DeepChat 동기화 관리(Gitea)

> "deepchat-sync 워크플로를 트리거하고 진행 상황을 보여줘 — 단계, 다운로드된 파일 수, MB, 남은 시간."

에이전트는 Gitea API를 호출해 워크플로를 트리거한 뒤, 실행 상태를 폴링하고 `sync-progress.json`을 읽습니다.

### 4.6 AI 관리 센터 변경

> "Gitea 저장소 목록에 페이지네이션을 추가해줘 — 페이지당 10개, 조절 가능하게."

에이전트는 `index.html`을 편집하고, JavaScript를 검증하고, (백엔드 변경 시) 컨테이너를 재시작합니다. 그런 다음 브라우저를 강력 새로고침(Ctrl+F5)합니다.

### 4.7 Ghost 포털 관리

> "샘플 콘텐츠를 포털에 임포트해줘. 주소 192.168.1.100, 중국어로."

에이전트는 게시 주소와 언어를 묻고 `ghost-content-import.ps1`을 실행합니다. 테마 수정, 페이지 편집, 내비게이션 DB 직접 변경도 가능합니다.

### 4.8 백업·복원

> "지금 전체 백업을 실행하고 성공했는지 확인해줘."

### 4.9 GitHub 릴리스 게시

> "새 릴리스 v0.7을 게시해줘. 커밋 메시지는 'feat: …'."

에이전트는 `publish.ps1 -Version v0.7 -CommitMessage "…"`을 실행합니다. 참고: `git push`는 프록시나 GitHub 자격 증명이 필요합니다. 네트워크로 푸시가 실패하면 에이전트가 프록시를 열라고 안내합니다.

### 4.10 디스크 공간 정리

> "Docker 디스크 사용량 내역과 안전하게 삭제할 수 있는 것을 알려줘."

에이전트는 스캔하고(`docker system df`, 미사용 이미지, 볼륨, 오래된 백업) 후보를 나열합니다 — **삭제는 당신이 어느 것을 삭제할지 확인한 뒤에만 수행합니다.**

---

## 5. 모범 사례와 주의점

- **프론트엔드 vs 백엔드 반영.** AI 관리 센터에서 `index.html` 변경은 브라우저 새로고침으로 반영됩니다(파일은 볼륨 마운트). `server.js` 변경은 `docker restart admin-portal`이 필요하며, 단순한 `docker compose up -d`는 볼륨 마운트된 코드를 **다시 로드하지 않습니다**.
- **브라우저 강력 새로고침**(Ctrl+F5): UI가 변하지 않는 듯 보일 때는 대개 오래된 JavaScript가 캐시된 경우입니다.
- **실제 시크릿이나 IP를 커밋하지 않는다.** 플레이스홀더(예: `<服务器IP>`, `CHANGE_ME_*`)를 사용합니다. `publish.ps1`은 `server.js`의 암호를 자동으로 정리합니다.
- **검증하라, 맹신하지 말라.** 에이전트가 명령으로 결과를 입증하게 하세요(HTTP 상태 코드, `ls`, 로그 줄). 특히 "고쳤습니다"라는 보고일 때.
- **파괴적 변경 전 백업.** 에이전트는 Ghost DB나 설정을 편집하기 전에 백업하고, 무엇이든 삭제하기 전에 확인을 받아야 합니다.
- **콘텐츠 임포트 전 언어와 주소 확인.** 포털 콘텐츠를 임포트할 때 에이전트는 먼저 게시 주소와 대상 언어를 물어야 합니다.
- **네트워크와 프록시.** 일부 단계(GitHub 푸시, 웹 검색)는 프록시(예: `127.0.0.1:33210`)나 외부 네트워크가 필요합니다. 네트워크 단계가 실패하면 프록시를 열고 재시도하세요.

---

## 6. 명령 빠른 참조

| 동작 | 명령 |
|---|---|
| 컨테이너 나열 | `docker ps -a` |
| 컨테이너 로그 | `docker logs <이름> --tail 100` |
| 서비스 재시작 | `docker restart <이름>` |
| 모든 서비스 시작 | `docker compose up -d` |
| Compose 상태 | `docker compose ps` |
| Gitea 동기화 트리거 | `POST /api/v1/repos/<user>/deepchat-sync/actions/workflows/sync.yml/dispatches` |
| 백업 실행 | `powershell .\scripts\backup.ps1` |
| 릴리스 게시 | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
