# 제21장: 업데이트 서버 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> DeepChat 설치 패키지 호스팅 및 자동 업데이트.

[← 제20장: MCP Gateway 일상 관리](ch20-ops-mcp.md) · [📖 목차](index.md) · [제22장: 모니터링 및 알림 관리 →](ch22-ops-monitoring.md)

---

**진입점**: `http://<서버-IP>:8091`, 데이터는 `deepchat-updates/`에.

## 21.1 수동으로 새 버전 배치

1. DeepChat 공식 설치 패키지를 `deepchat-updates/deepchat/`에 다운로드;

2. `version.txt` 갱신 (새 버전 번호 기록);

3. 직원 측 DeepChat이 자동 업데이트 시 `version.txt`를 확인해 새 버전 발견 시 다운로드 설치.

## 21.2 자동 동기화 (권장)

`deepchat-sync` 저장소의 Gitea Actions로 매일 GitHub 새 버전을 자동 확인 및 동기화 (제10장 참조). 수동 트리거:

```
curl -X POST "http://<서버-IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<비밀번호>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 동기화 설정 (sync-config.json)

| 필드 | 역할 |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | 다운로드 가속 프리픽스 (예: ghproxy.com) |
| `keep_releases` | 버전 이력 보존 수 |
| `market_url` | 다운로드 페이지 「스킬 매니저」 마켓 주소 |

> 📌 DeepChat 클라이언트가 「모델 연결 타임아웃」 오류를 낼 때는 보통 클라이언트가 죽은 시스템 프록시를 탄 경우입니다 (`ECONNREFUSED 127.0.0.1:33210`). 사용자에게 DeepChat 「설정 → 네트워크/프록시」를 「프록시 사용 안 함/직접 연결」로 바꾸게 하세요.

> 📖 원문 문서:DeepChat 빠른 시작 https://deepchatai.cn/docs/guide/getting-started/ · 오픈소스 저장소 https://github.com/ThinkInAIXYZ/deepchat

---

[← 제20장: MCP Gateway 일상 관리](ch20-ops-mcp.md) · [📖 목차](index.md) · [제22장: 모니터링 및 알림 관리 →](ch22-ops-monitoring.md)
