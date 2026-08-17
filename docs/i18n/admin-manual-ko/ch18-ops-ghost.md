# 제18장: Ghost 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> 기업 포털 / Hub: 글, 페이지, 내비게이션, 테마, 멤버.

[← 제17장: Dify 일상 관리](ch17-ops-dify.md) · [📖 목차](index.md) · [제19장: Gitea 일상 관리 →](ch19-ops-gitea.md)

---

**진입점**: 프런트 `http://<서버-IP>:8090`; 백오피스 `http://<서버-IP>:8090/ghost/` (/ghost/ 접미사 주의).

## 18.1 백오피스 로그인

Ghost 5 백오피스는 **비밀번호 없는 로그인**: 이메일 입력 → Ghost가 6자리 인증 코드를 MailHog (`:8025`)로 발송. 더 빠른 방법: AI 관리 센터에서 「Ghost 백오피스」의 「열기」 버튼을 누르면 자동 로그인됩니다 (로컬에서 TOTP 코드 계산, 메일 확인 불필요).

## 18.2 콘텐츠 게시

1. **글**: Posts → New post → 내용 작성 (Markdown 편집기) → Publish;

2. **페이지**: Pages → New page (예: 「다운로드 센터」 slug `downloads`);

3. **태그/카테고리**: Tags → 카테고리 생성 (예: `news` / `docs`), 글을 카테고리에 배치.

## 18.3 내비게이션 메뉴

1. 백오피스 → 디자인 (Design) → 메뉴 (Navigation);

2. 「Primary」 메인 내비게이션 편집, 홈/뉴스/다운로드 센터/AI 워크벤치/도움말 추가 (제9장 메뉴 표 참조).

## 18.4 테마

- **전환**: 디자인 → 테마, 기본 제공 Casper / Source 바로 활성화;

- **설치**: 테마 마켓 (Design → Change theme) 또는 zip 업로드.

> ⚠️ GitHub에서 최신 테마를 설치하지 마세요 (Ghost 6.x용일 수 있어 5.x에서 incompatible 오류), 구버전 zip을 설치하세요.

## 18.5 멤버 및 구독 (필요 시)

- Members: 구독자 관리;

- 구독이 필요 없으면 이 모듈을 무시해도 됩니다 (내부망 포털은 보통 사용 안 함).

## 18.6 통합 (API Token)

1. 백오피스 → Settings → Integrations → 사용자 지정 통합 추가;

2. Admin API Key 생성 (형식 `id:secret`), Gitea Actions의 공지 발행 등 자동화에 사용.

> ⚠️ 핵심 함정: ① 홈 `/`에서 「가입」을 누르지 마세요 (방문자 구독자 가입); ② 6자리 인증 코드는 사실 TOTP이며 AI 관리 센터가 로컬에서 계산 가능; ③ 로컬에서 계산해도 Ghost는 여전히 메일을 실제 발송하므로 MailHog를 반드시 유지해야 합니다 (아니면 `Failed to send email`).

> 📖 원문 문서:Ghost 공식 문서 https://ghost.org/docs/ · 관리 백오피스 https://ghost.org/docs/admin/

---

[← 제17장: Dify 일상 관리](ch17-ops-dify.md) · [📖 목차](index.md) · [제19장: Gitea 일상 관리 →](ch19-ops-gitea.md)
