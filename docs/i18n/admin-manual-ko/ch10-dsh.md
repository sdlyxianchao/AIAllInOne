# 제10장: DSH Desktop 배포 및 CI/CD

*제1부 · 배포편*

> DSH Desktop 설치 패키지를 직원에게 배포하고, Gitea Actions로 공식 새 버전을 자동 동기화.

[← 제9장: Dify / Ghost / Gitea 설정](ch09-products.md) · [📖 목차](index.md) · [제11장: MCP Gateway 및 Skill 마켓 →](ch11-mcp.md)

---

## 10.1 배포 링크

배포 링크 = GitHub Releases 설치 패키지 → `dsh-sync` 저장소의 Gitea Actions → 업데이트 서버 (:8091) → Ghost 다운로드 페이지 → 직원 다운로드.

> 📌 `dsh` 소스 mirror 저장소는 삭제되었습니다——mirror는 git 소스만 동기화하고 release 설치 패키지는 동기화하지 않아 배포에 쓸모없습니다. 소스 감사/2차 개발이 필요하면 별도로 만드세요.

## 10.2 설치 패키지를 업데이트 서버에 다운로드

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

검증: `curl -I http://<서버-IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206. 이어서 Ghost 다운로드 페이지 갱신 (제9장 참조).

## 10.3 자동 동기화 (Gitea Actions, 권장)

| 컴포넌트 | 설명 |
| --- | --- |
| `dsh-sync` 저장소 | 일반 저장소 (mirror 불가), `.gitea/workflows/sync.yml` + `update_ghost.py` 배치 |
| 트리거 | `schedule` (매일 UTC 2시) + `workflow_dispatch` (수동) |
| 로직 | GitHub 최신 tag 확인 → `version.txt` 비교 → 새 버전이면 다운로드 + Ghost 다운로드 페이지 갱신 + 버전 기록 |

```
# 수동 트리거 1회
curl -X POST "http://<서버-IP>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<비밀번호>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ 핵심 함정: ① act_runner의 `container.network`는 반드시 `config.yaml`(+`CONFIG_FILE` 환경 변수)로 설정해야 하며, 아니면 job 컨테이너가 `gitea` 호스트명을 해석할 수 없습니다; ② docker.sock은 runner가 자동 마운트하므로 options에서 다시 마운트하지 마세요 (Duplicate mount point 오류).

## 10.4 국내 다운로드 소스 설정 (sync-config.json)

공식 사이트 `www.dshdesktop.com` 다운로드 페이지의 설치 패키지는 여전히 GitHub를 가리켜 국내에서 거의 통하지 않습니다. 실제 해결은 `sync-config.json`으로:

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

## 10.5 방식 B: Docker로 커스텀 버전 빌드 (선택)

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# 컨테이너 내부
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# 산출물은 dist/에 있으며, 종료 후 dsh-updates/로 복사
```

## 10.6 DSH Desktop 클라이언트 설정 (직원 측)

1. DSH Desktop → 설정 → 모델 서비스 → 사용자 지정 Provider / OpenAI 호환;

2. API Base URL: `http://<서버-IP>:3000/v1` (반드시 내부망 IP);

3. API Key: `dsh-key`의 `sk-xxx`;

4. 모델: `deepseek-chat`, 저장 후 테스트 대화.

> 📖 원문 문서:DSH Desktop 빠른 시작 https://www.dshdesktop.com/docs/guide/getting-started/ · 오픈소스 저장소 https://github.com/dataelement/dsh-desktop

---

[← 제9장: Dify / Ghost / Gitea 설정](ch09-products.md) · [📖 목차](index.md) · [제11장: MCP Gateway 및 Skill 마켓 →](ch11-mcp.md)
