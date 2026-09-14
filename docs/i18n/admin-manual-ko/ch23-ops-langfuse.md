# 제23장: LLM 관측 (Langfuse)

*제2부 · 관리편 (각 제품 일상 운영)*

> 매 모델 호출의 프롬프트, 응답, 지연시간, token, 비용 추적.

[← 제22장: 모니터링 및 알림 관리](ch22-ops-monitoring.md) · [📖 목차](index.md) · [제24장: 통합 로그 (Loki) →](ch24-ops-loki.md)

---

**진입점**: `http://<서버-IP>:3010` (SSO 자동 로그인, AI 관리 센터 진입점은 `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 컴포넌트

| 컴포넌트 | 용도 |
| --- | --- |
| langfuse | Web UI + 추적 표시 (3010) |
| langfuse-worker | 비동기 이벤트 처리 |
| langfuse-postgres | 메타데이터 저장 |
| langfuse-clickhouse | 이벤트/추적 데이터 저장 |
| langfuse-minio | S3 첨부파일/미디어 저장 |
| langfuse-redis | 큐 |

LiteLLM이 `success_callback: ["langfuse"]`로 자동 보고 (`.env`의 `LANGFUSE_*`).

## 23.2 추적 조회

1. Langfuse 로그인 → 조직 `AI All In One` / 프로젝트 `AI Platform` 선택;

2. Traces 목록에서 매 호출 확인, 클릭해 프롬프트/응답/모델/지연시간/token/비용 확인;

3. Session으로 다중 턴 대화 연결.

## 23.3 문제 해결

> ⚠️ 핵심 함정:
> - `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`을 반드시 설정해야 합니다 (web과 worker 모두), 아니면 구 SDK가 `trace-create` 보고에 실패해 데이터가 보이지 않습니다;
> - SSO 로그인 시 데이터가 안 보임: SSO 계정 (AD 이메일)이 초기화 계정과 달라 Langfuse가 자동으로 어떤 조직에도 속하지 않는 새 계정을 만듭니다. 수정 (SSO 사용자를 조직에 추가):

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<회사-도메인>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 원문 문서:Langfuse 공식 문서 https://langfuse.com/docs · 자체 호스팅 https://langfuse.com/self-hosting

---

[← 제22장: 모니터링 및 알림 관리](ch22-ops-monitoring.md) · [📖 목차](index.md) · [제24장: 통합 로그 (Loki) →](ch24-ops-loki.md)
