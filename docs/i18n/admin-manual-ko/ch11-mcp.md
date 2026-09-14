# 제11장: MCP Gateway 및 Skill 마켓

*제1부 · 배포편*

> Skill과 MCP 도구를 중앙에서 관리하는 게이트웨이, DSH Desktop/Dify가 주소 하나만 연결하면 모든 도구를 얻을 수 있습니다.

[← 제10장: DSH Desktop 배포 및 CI/CD](ch10-dsh.md) · [📖 목차](index.md) · [제12장: AI 관리 센터 →](ch12-admin-center.md)

---

> 📌 MCP Gateway는 공식 `@modelcontextprotocol/sdk` 기반이며 표준 Streamable HTTP `/mcp` 엔드포인트를 노출하고, 이미 메인 `docker-compose.yml` (포트 3100)에 통합되어 핵심 서비스와 함께 시작됩니다. 소스는 `mcp-gateway/`에 있습니다.

## 11.1 내장 플랫폼 도구

| 도구 | 용도 |
| --- | --- |
| `platform_time` | 서버 현재 시간 반환 |
| `platform_echo` | 텍스트 에코 (연결성 테스트) |
| `platform_services` | 플랫폼 서비스 목록 나열 |

## 11.2 외부 MCP Server 집계

`mcp-gateway/mcp-servers.json`을 편집해 stdio 또는 http 유형을 추가하고 `mcp-gateway`를 재시작하면 적용됩니다:

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

집계된 도구에는 중복 방지를 위해 자동으로 `{serverName}_` 프리픽스가 붙습니다.

## 11.3 클라이언트 연동

1. DSH Desktop: 설정 → MCP → 서버 추가 → 유형 「스트리밍 가능 HTTP」, URL `http://<서버-IP>:3100/mcp`;

2. Dify 워크플로: 사용자 지정 도구 / MCP 도구 설정을 같은 주소로 지정.

> 검증: `curl http://<서버-IP>:3100/health`이 `{"status":"ok"}` 반환; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`이 도구 목록 반환.

## 11.4 Skill 마켓 (내부망 스킬 패키지 배포)

| 엔드포인트 | 역할 |
| --- | --- |
| `/market` | Skill 마켓 페이지 (카드 브라우징 + ZIP 다운로드 + 설치 주소 복사) |
| `/skills` | 스킬 목록 JSON (name/description/version) |
| `/skills/<이름>.zip` | 스킬 패키지 다운로드 (동적 패키징) |

스킬은 `mcp-gateway/skills/` 디렉터리에 둡니다 (SKILL.md 포함 서브디렉터리), **매 요청마다 자동 스캔되어 재시작 불필요**. 내장 `skill-market` 가이드 스킬 포함.

> 📌 DSH Desktop에서 MCP와 Skill은 서로 다른 개념입니다: MCP는 「도구」 (function calling), Skill은 「에이전트 스킬 패키지」 (SKILL.md + 스크립트). DSH Desktop의 Skill에는 「사용자 지정 마켓 URL」이 없고 폴더/ZIP/URL 세 가지 설치만 지원하므로, 내부망 배포는 「URL 설치」로 우회 구현합니다.

## 11.5 ⚠️ Skill 마켓 호스트명 (배포 파라미터, 반드시 교체)

「스킬 매니저」는 `config.json`의 `market_url`을 읽어 `/skills` 목록을 요청합니다. 두 가지 핵심:

- **호스트명 사용, IP 사용 금지**: DSH Desktop의 agent 환경이 IP를 `[IP_ADDRESS_REDACTED]`로 비식별화하여 실제 주소를 읽지 못합니다;

- **호스트명은 배포 파라미터**: 배포마다 다르므로 복사해 쓰면 안 됩니다.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<마켓-호스트명>:3100" }
```

#### 자동 (Agent로 배포)

Agent가 파라미터 수집 시 「Skill 마켓 호스트명」을 물어보고 `config.json`과 `SKILL.md`의 `<마켓-호스트명>`을 자동 교체합니다.

#### 수동

1. `config.json` + `SKILL.md` 폴백 주소를 편집해 `<마켓-호스트명>` 교체;

2. 호스트명을 해석 가능하게: 단일 머신은 `C:\Windows\System32\drivers\etc\hosts`에 `<서버-IP> <호스트명>` 추가; 회사 내부망은 DNS에 A 레코드 추가.

> ✅ 호스트명은 「서비스명+회사 도메인」 FQDN을 권장, 예: `skillmarket.당신의-회사-도메인`. DNS A 레코드 추가: 도메인 컨트롤러 「DNS → 정방향 조회 영역 → 당신의 도메인 → 새 호스트(A)」, 또는 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "당신의-도메인" -IPv4Address "<서버-IP>"`.

## 11.6 관리 API (AI 관리 센터의 증감 수정용)

| 엔드포인트 | 역할 |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | MCP Server 증감 수정 조회 (설정에 다시 쓰기 + 자동 재연결) |
| `POST /api/skills/upload` | 스킬 zip 업로드 (SKILL.md 검증, 경로 이탈 방지) |
| `DELETE /api/skills/:name` | 스킬 삭제 |

`X-Admin-Token` 헤더 필요 (`.env`의 `MCP_ADMIN_TOKEN`). AI 관리 센터 「MCP Gateway」 페이지가 프록시로 호출합니다 (`ai-platform-admin` 역할 보호).

> 📖 원문 문서:MCP 프로토콜 공식 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 제10장: DSH Desktop 배포 및 CI/CD](ch10-dsh.md) · [📖 목차](index.md) · [제12장: AI 관리 센터 →](ch12-admin-center.md)
