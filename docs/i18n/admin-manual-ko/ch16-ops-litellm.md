# 제16장: LiteLLM 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> PII 비식별화 프록시: 모델 목록, 비식별화 규칙, 캐시, Langfuse 보고.

[← 제15장: NewAPI 일상 관리](ch15-ops-newapi.md) · [📖 목차](index.md) · [제17장: Dify 일상 관리 →](ch17-ops-dify.md)

---

**진입점**: `http://<서버-IP>:4001` (순수 API, 웹 인터페이스 없음, 디버깅은 `/v1/models`). 설정은 `litellm-config.yaml`에.

## 16.1 모델 목록 유지보수

`litellm-config.yaml`의 `model_list`를 편집해 모델과 해당 API Key를 추가/삭제. 새 provider 추가 단계:

1. `.env`에서 `# OPENAI_API_KEY=` 주석 해제 후 Key 입력;

2. `litellm-config.yaml`에서 해당 model 블록 주석 해제;

3. `docker compose up -d litellm`.

## 16.2 응답 캐시

Redis exact match 캐시, 완전히 같은 요청을 사용자 간 공유. `cache_params.ttl` 조정 (기본 3600초). 끄기: `cache: false` 후 재시작.

## 16.3 Langfuse 보고

`success_callback: ["langfuse"]` + `.env`의 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST`를 통해 매 호출을 자동 보고.

## 16.4 재시작 및 문제 해결

```
docker compose restart litellm          # 설정 변경 후 재시작
docker logs litellm --tail 50           # 로그 확인
```

> ⚠️ 핵심 함정: ① guardrails에 `default_on: true`를 추가해야 전역 적용; ② PII 비식별화 (Presidio)는 현재 업스트림 API 변경으로 잠시 주석 처리되어 순수 프록시만 수행; ③ 안정 버전 `v1.95.1` 사용 (`main-latest`는 버그 있음).

> 📖 원문 문서:LiteLLM 공식 문서 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 제15장: NewAPI 일상 관리](ch15-ops-newapi.md) · [📖 목차](index.md) · [제17장: Dify 일상 관리 →](ch17-ops-dify.md)
