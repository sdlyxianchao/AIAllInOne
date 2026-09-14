# 제5장: API Key 신청

*빠른 시작*

> 회사 AI 능력을 서드파티 도구에 연결하려면 API Key가 필요합니다.

[← 제4장: 도구 2: Dify](ch04-dify.md) · [📖 목차](index.md) · [제6장: 데이터 보안 규정 →](ch06-security.md)

---

회사의 AI 능력을 **서드파티 도구** (본인 스크립트, 기타 OpenAI 인터페이스 지원 소프트웨어)에 연결하려면 API Key (`sk-`로 시작하는 키)가 필요합니다.

## 5.1 NewAPI 로그인

1. 브라우저에서 `http://IP:3000` 열기;

2. 통합 계정으로 로그인 (또는 「원클릭 로그인 / OIDC」로 도메인 계정 사용).

## 5.2 토큰 생성

1. 좌측 메뉴 「**API 키 / 토큰**」;

2. 「**새 토큰 생성**」 클릭, 이름 지정 (예: `내-스크립트`), 할당량, 만료 시간 설정 가능;

3. 저장 후 생성된 `sk-xxxx` 문자열 복사. **한 번만 표시되므로 반드시 즉시 저장**.

## 5.3 클라이언트에 입력

- **API Base URL**: `http://IP:3000/v1`

- **API Key**: 방금 복사한 `sk-xxxx`

## 5.4 자주 쓰는 사용 예시

> 💡 curl로 테스트:
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"안녕하세요"}]}'`

> ⚠️ 할당량 소진 시 「잔액 부족」 오류, 관리자에게 증액 요청. Key는 본인 계정 비밀번호와 같으므로 **다른 사람에게 주지 말고, 코드 저장소에 커밋하지 마세요**.

> 📖 원문 문서:NewAPI 공식 문서 https://docs.newapi.pro · 공식 웹사이트 https://www.newapi.ai

---

[← 제4장: 도구 2: Dify](ch04-dify.md) · [📖 목차](index.md) · [제6장: 데이터 보안 규정 →](ch06-security.md)
