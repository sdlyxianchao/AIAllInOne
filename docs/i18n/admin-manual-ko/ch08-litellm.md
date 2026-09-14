# 제8장: LiteLLM: 검증 및 캐시

*제1부 · 배포편*

> LiteLLM 프록시 사용 가능 여부 검증, 응답 캐시 활성화로 token 절약.

[← 제7장: NewAPI: 초기화, 채널 및 OIDC](ch07-newapi.md) · [📖 목차](index.md) · [제9장: Dify / Ghost / Gitea 설정 →](ch09-products.md)

---

> ⚠️ PII 비식별화 (Presidio guardrail)는 현재 **임시 비활성화** 상태입니다: 새 LiteLLM의 guardrail 설정 형식이 변경되어 `litellm-config.yaml`의 해당 부분이 주석 처리되었고, 현재 LiteLLM은 프록시 전달만 합니다 (비식별화 안 함). 활성화 방법은 제25장 참조.

## 8.1 LiteLLM 기본 사용 가능 여부 검증

```
curl -X POST http://<서버-IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>`는 LiteLLM 관리자 키로, `.env`의 실제 값을 사용하세요 (플레이스홀더 자체가 아니면 401). 반드시 내부망 IP `<서버-IP>:4001`을 사용하고 `127.0.0.1:4001`은 사용하지 마세요 (WSL2 포트 포워딩 문제).

## 8.2 응답 캐시 (내장, token 절약)

LiteLLM은 Redis exact match 캐시가 활성화되어 있습니다: 완전히 동일한 요청 (모델+메시지+파라미터)은 캐시를 바로 반환하며, 사용자 간 공유되어 token을 절약합니다.

```
# litellm-config.yaml 끝부분
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 독립 캐시 Redis
    port: 6379
    ttl: 3600            # 캐시 1시간
```

> 검증: `curl http://<서버-IP>:4001/cache/ping -H "Authorization: Bearer <KEY>"`이 `ping_response: true`를 반환; 같은 요청을 연속 두 번 보내면 두 번째는 밀리초 단위로 줄어듭니다. 캐시 끄기: `cache: false` 후 litellm 재시작.

## 8.3 LLM 공급자 추가

1. `.env`에서 `# OPENAI_API_KEY=` 주석 해제 후 Key 입력;

2. `litellm-config.yaml`에서 해당 model 블록 주석 해제;

3. `docker compose up -d litellm`.

> 📖 원문 문서:LiteLLM 공식 문서 https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 제7장: NewAPI: 초기화, 채널 및 OIDC](ch07-newapi.md) · [📖 목차](index.md) · [제9장: Dify / Ghost / Gitea 설정 →](ch09-products.md)
