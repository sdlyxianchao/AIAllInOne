# 제22장: 모니터링 및 알림 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> Prometheus + Grafana + Alertmanager: 컨테이너 리소스 모니터링 및 알림 통지.

[← 제21장: 업데이트 서버 관리](ch21-ops-update.md) · [📖 목차](index.md) · [제23장: LLM 관측 (Langfuse) →](ch23-ops-langfuse.md)

---

**진입점**: Grafana `http://<서버-IP>:3030` (SSO 자동 로그인); Prometheus `:9091`; Alertmanager `:9093`.

## 22.1 컴포넌트 및 포트

| 컴포넌트 | 포트 | 용도 |
| --- | --- | --- |
| cadvisor | 8080 (내부) | 각 컨테이너 CPU/메모리/네트워크/디스크 수집 |
| Prometheus | 9091 | 지표 집계 + 알림 규칙 (`monitoring/alerts.yml`) |
| Grafana | 3030 | 시각화 대시보드 (사전 설정 「AI All In One — 컨테이너 모니터링」) |
| Alertmanager | 9093 | 알림 중복 제거/그룹화/라우팅/통지 |

## 22.2 대시보드 조회

1. Grafana 로그인 (`ai_all_in_one_admin` / 통합 비밀번호, SSO 자동 로그인);

2. 「AI All In One — 컨테이너 모니터링」 패널 열어 각 컨테이너 CPU/메모리/네트워크 확인.

## 22.3 알림 규칙

사전 설정 규칙 (`monitoring/alerts.yml`): 컨테이너 다운 (critical), 컨테이너 메모리 >90% (warning), 컨테이너 CPU >80% (warning).

> ⚠️ 알림 오탐 함정: cadvisor가 호스트의 모든 cgroup (systemd 포함)을 보고하므로, 알림 규칙에 반드시 `{name!=""}` 필터를 쓰고, 메모리 알림에는 `container_spec_memory_limit_bytes > 0`을 추가해야 합니다 (아니면 limit=0에서 0으로 나누어 항상 트리거).

## 22.4 알림 통지 연동 (기업 IM)

알림 경로는 **Prometheus → Alertmanager → AI 관리 센터 (`/api/alert-webhook`) → 기업 IM**입니다. AI 관리 센터의 **「시스템 운영 → 기업 IM 알림」** 메뉴에서 설정합니다 (설정은 Redis에 저장되어 재시작 후에도 유지):

- **수신자**: 여러 개 추가 가능. 유형 「DingTalk/WeCom/Feishu」 = 그룹 봇(Webhook URL 입력, 그룹으로 발송); 유형 「DingTalk 앱(개인 발송)」(AppKey/AppSecret/AgentId/userid) 또는 「WeCom 앱(개인 발송)」(corpId/secret/agentid/userid) = 기업 앱, 개인에게 발송.

- **전송 규칙**: 전체 스위치, 최소 심각도(심각/경고/정보), 「발화 firing」/「복구 resolved」 알림 전송 여부.

- **전송 이력**: 각 전송(시간/수신자/유형/알림 이름/심각도/결과)을 기록하며, 페이지 이동·페이지 크기 조정·키워드 검색·유형/결과/심각도별 분류 필터링을 지원.

- 각 수신자에는 테스트 메시지 전송용 「테스트」 버튼과 활성화 스위치가 있습니다.

> ⚠️ 그룹 봇 Webhook은 **그룹**에만 보낼 수 있고 개인에게는 보낼 수 없습니다. 개인에게 보내려면 「기업 앱」 유형(DingTalk/WeCom)을 사용해야 하며, 관리 콘솔에서 메시지 권한이 있는 내부 앱을 만들어야 합니다. DingTalk 그룹 봇은 「사용자 지정 키워드」(예: 「AI 平台」/「告警」) 또는 「서명」 설정도 필요하며, 없으면 보안 정책에 차단됩니다.

> 📌 포트 충돌 설명: Prometheus 기본 9090은 Keycloak이 사용 중이라 9091로 변경; Grafana 기본 3000/3001이 사용 중이라 3030으로 변경.

> 📖 원문 문서:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← 제21장: 업데이트 서버 관리](ch21-ops-update.md) · [📖 목차](index.md) · [제23장: LLM 관측 (Langfuse) →](ch23-ops-langfuse.md)
