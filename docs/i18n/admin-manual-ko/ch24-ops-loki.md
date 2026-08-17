# 제24장: 통합 로그 (Loki)

*제2부 · 관리편 (각 제품 일상 운영)*

> 모든 컨테이너 로그를 집계해 컨테이너 + 키워드 + 시간으로 검색.

[← 제23장: LLM 관측 (Langfuse)](ch23-ops-langfuse.md) · [📖 목차](index.md) · [제25장: PII 비식별화 (Presidio) →](ch25-ops-pii.md)

---

**진입점**: AI 관리 센터 「📜 통합 로그」 페이지 (가장 편리), 또는 Loki `http://<서버-IP>:3110`.

## 24.1 컴포넌트

| 컴포넌트 | 포트 | 용도 |
| --- | --- | --- |
| Loki | 3110 | 로그 저장 및 조회 (단일 머신, 로컬 파일 시스템) |
| Promtail | —(내부) | docker.sock 경유 컨테이너 발견, json 로그 수집해 Loki에 전송 |

## 24.2 로그 조회

1. AI 관리 센터 → 통합 로그;

2. 컨테이너 선택 (드롭다운) → 키워드 입력 → 시간 범위 선택 → 조회;

3. 백엔드 `/api/logs/query`가 LogQL로 Loki 조회.

## 24.3 LogQL 빠른 참조

```
{container="new-api"} |= "error"              # 특정 컨테이너에서 error 포함 줄
{container=~".+"} |~ "(?i)error|exception"      # 모든 컨테이너 일치
{service="litellm"} |= "EMAIL"                  # 서비스별 조회
```

> 📌 Loki의 label은 `container / project / service`이며, **`job`은 없습니다**. 조회는 `{container=~".+"}` 사용, `{job="docker"}` 아님.

> ⚠️ 핵심 함정 (Docker Desktop 마운트): Promtail은 `/var/run/docker.sock`과 `/var/lib/docker/containers`를 마운트해야 합니다 (WSL2에서는 Docker Desktop VM 내부를 가리키며, 로그가 있는 곳). 호스트 Windows의 `C:\...\containers` 경로를 쓰지 마세요. Loki 단일 머신은 `store: tsdb` + filesystem 사용.

> 📖 원문 문서:Loki 공식 문서 https://grafana.com/docs/loki/latest/

---

[← 제23장: LLM 관측 (Langfuse)](ch23-ops-langfuse.md) · [📖 목차](index.md) · [제25장: PII 비식별화 (Presidio) →](ch25-ops-pii.md)
