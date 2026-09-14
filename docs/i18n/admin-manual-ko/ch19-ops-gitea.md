# 제19장: Gitea 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> 내부 Git + CI/CD: 저장소, 조직, Runner, Actions.

[← 제18장: Ghost 일상 관리](ch18-ops-ghost.md) · [📖 목차](index.md) · [제20장: MCP Gateway 일상 관리 →](ch20-ops-mcp.md)

---

**진입점**: Web `http://<서버-IP>:3002`; SSH `ssh://git@<서버-IP>:2222`.

## 19.1 저장소 및 조직

1. **저장소 생성**: 우측 상단 + → New repository;

2. **조직 생성**: + → New organization, 조직 아래 저장소 생성, 팀 관리;

3. **외부 저장소 마이그레이션**: + → New migration, GitHub 주소 입력 시 mirror 가능 (소스 읽기 전용 동기화).

## 19.2 사용자 및 권한

- **사용자 추가**: Site Administration → User Accounts → Create user;

- **저장소 권한**: 저장소 → Settings → Collaborators;

- **조직 팀**: 조직 → Teams → 팀 생성 → 멤버 추가 → 저장소 권한 부여.

## 19.3 Actions / Runner 관리

1. **Actions 활성화**: Site Administration → Actions → Enabled;

2. **Runner 등록**: Runners → Create new Runner → Token 복사 → `.env`의 `GITEA_RUNNER_TOKEN`에 입력 → `docker compose up -d gitea-runner`;

3. **Runner 상태 확인**: Runners 페이지에 Idle (초록색) 표시되면 정상;

4. **워크플로 실행**: 저장소 → Actions → 수동 실행 또는 push 트리거.

> ⚠️ Runner token 변경은 반드시 `up -d` 사용 (restart는 .env를 다시 읽지 않음).

## 19.4 사이트 설정

- **ROOT_URL**: `GITEA__server__ROOT_URL`을 내부망 `http://<서버-IP>:3002/`로 설정, 아니면 생성된 저장소 링크가 localhost가 됨;

- **가입 정책**: Site Administration → Config에서 가입 스위치, 이메일 설정 조정.

> ⚠️ 핵심 함정: `readonly database` 오류는 대부분 `gitea.db`가 root 소유자이기 때문입니다. root 소유 db를 삭제해 git 사용자로 재생성하세요.

> 📖 원문 문서:Gitea 공식 문서 (중국어) https://docs.gitea.com/zh-cn · 관리 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← 제18장: Ghost 일상 관리](ch18-ops-ghost.md) · [📖 목차](index.md) · [제20장: MCP Gateway 일상 관리 →](ch20-ops-mcp.md)
