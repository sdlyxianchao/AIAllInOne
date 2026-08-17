# 제17장: Dify 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> AI 앱 플랫폼: 앱, 지식베이스, 모델 공급자, 멤버 권한, 게시.

[← 제16장: LiteLLM 일상 관리](ch16-ops-litellm.md) · [📖 목차](index.md) · [제18장: Ghost 일상 관리 →](ch18-ops-ghost.md)

---

**진입점**: `http://<서버-IP>` (80 포트, 독립 공식 compose, 업그레이드/유지보수는 `dify/docker/`에서 별도 작업).

## 17.1 앱 관리 (스튜디오)

1. **앱 생성**: 스튜디오 → 빈 앱 생성 → 유형 선택 (채팅 어시스턴트 / Agent / 워크플로 / 텍스트 생성);

2. **오케스트레이션**: 노드를 끌어 프롬프트, 도구, 지식베이스, 변수 구성;

3. **디버깅**: 우측 상단 「미리보기」로 실행 디버깅;

4. **게시**: 디버깅 통과 후 「게시」 → 공유 링크 생성 또는 웹 앱 임베드.

## 17.2 지식베이스 관리

1. 지식베이스 → 지식베이스 생성;

2. 문서 업로드 (Word / PDF / Markdown / 웹 링크), 분할 규칙 + 인덱스 방식 선택 (고품질/경제);

3. 앱에서 해당 지식베이스를 「추가」하면 AI가 문서 기반으로 답변.

> 📌 지식베이스 내용은 AI 답변에 사용되므로 기밀 자료는 업로드하지 마세요 (데이터 등급 규정 준수).

## 17.3 모델 공급자

- **모델 추가**: 설정 → 모델 공급자 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (NewAPI 경유) + `dify-key`;

- **시스템 모델 설정**: 기본 채팅/추론/임베딩 모델 지정.

## 17.4 멤버 및 권한

- **멤버**: 워크스페이스에 멤버 초대, Owner/Admin/Editor/Normal 역할 설정;

- **로그인 방식**: 설정 → 로그인 방식 → OIDC (Keycloak) 연동으로 SSO 구현.

## 17.5 업그레이드 및 유지보수

```
cd dify\docker
git pull                          # 최신 버전 가져오기
docker compose pull               # 새 이미지 가져오기
docker compose up -d              # 재빌드
```

> ⚠️ 핵심 함정: ① WebSocket `NEXT_PUBLIC_SOCKET_URL`을 내부망 IP로 설정; ② 로그인 비밀번호는 base64 인코딩; ③ 비밀번호 분실 시 `docker exec docker-api-1 flask reset-password` 사용 (8자 이상).

> 📖 원문 문서:Dify 공식 문서 https://docs.dify.ai · 자체 호스팅 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 제16장: LiteLLM 일상 관리](ch16-ops-litellm.md) · [📖 목차](index.md) · [제18장: Ghost 일상 관리 →](ch18-ops-ghost.md)
