# 제20장: MCP Gateway 일상 관리

*제2부 · 관리편 (각 제품 일상 운영)*

> MCP Server 증감, Skill 업로드/삭제, 내장 도구 확장.

[← 제19장: Gitea 일상 관리](ch19-ops-gitea.md) · [📖 목차](index.md) · [제21장: 업데이트 서버 관리 →](ch21-ops-update.md)

---

**진입점**: `http://<서버-IP>:3100` (마켓 페이지 `/market`). 관리는 AI 관리 센터 「MCP Gateway」 페이지로 작업 (`ai-platform-admin` 역할), 또는 관리 API 직접 호출.

## 20.1 MCP Server 관리

1. `mcp-gateway/mcp-servers.json` 편집해 서버 추가/삭제 (stdio/http 두 유형);

2. `docker compose restart mcp-gateway` 재시작;

3. 또는 AI 관리 센터 MCP Gateway 페이지에서 추가/삭제 (설정에 다시 쓰기 + 자동 재연결).

## 20.2 Skill (스킬 패키지) 관리

1. **업로드**: AI 관리 센터 MCP Gateway 페이지 → 스킬 zip 업로드 (SKILL.md 포함 검증, 경로 이탈 방지);

2. **삭제**: 해당 스킬 삭제;

3. 스킬은 `mcp-gateway/skills/`에 두고 (SKILL.md 포함 서브디렉터리), 매 요청마다 자동 스캔되어 재시작 불필요.

## 20.3 내장 도구 확장

`mcp-gateway/gateway.js`에 두 단계 추가:

```
// ① 도구 정의 (builtinTools 배열에 항목 추가)
{ name: 'platform_health', description: '서비스 상태 조회',
  inputSchema: { type: 'object', properties: {} } }

// ② 실행 로직 (callBuiltin에 분기 추가)
if (name === 'platform_health') { return '모든 서비스 정상 동작 중'; }
```

수정 후 `docker compose restart mcp-gateway`.

## 20.4 skill-market 마켓 주소 유지보수

「스킬 매니저」의 `market_url`은 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`에 있으며, 반드시 호스트명 사용 (IP 불가), 배포 파라미터입니다 (제11장 참조).

> ⚠️ 관리 API는 `X-Admin-Token` 헤더 필요 (`.env`의 `MCP_ADMIN_TOKEN`); 미설정 시 503, 잘못된 token 시 401 반환.

> 📖 원문 문서:MCP 프로토콜 공식 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 제19장: Gitea 일상 관리](ch19-ops-gitea.md) · [📖 목차](index.md) · [제21장: 업데이트 서버 관리 →](ch21-ops-update.md)
