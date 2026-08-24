# 제28장: 상태 점검 및 부팅 자체 점검

*제3부 · 운영편*

> 전체 41개 컨테이너 + LLM 전체 링크 + 인증 링크 원클릭 점검.

[← 제27장: 백업 및 복구](ch27-backup.md) · [📖 목차](index.md) · [제29장: 문제 해결 매뉴얼 →](ch29-troubleshooting.md)

---

**스크립트**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, 출력 `health_check_<타임스탬프>.log`. 41개 컨테이너 (25 Windows 핵심 + 16 Dify) 커버, 자격 증명은 `.env`에서 읽고 비밀번호를 하드코딩하지 않음.

## 28.1 점검 범위 (9개 단계)

| 단계 | 점검 항목 |
| --- | --- |
| Stage 1 | Docker Daemon 실행 여부 (준비 대기, 부팅 자체 점검 대응) |
| Stage 2 | 41개 컨테이너 상태 (Up/Exited/Restarting) |
| Stage 3 | 10개 HTTP 엔드포인트 응답 |
| Stage 4 | LiteLLM readiness + 모델 등록, Dify API, 데이터베이스/Redis/Sandbox 상태 |
| Stage 5 | LLM 전체 링크 (NewAPI → LiteLLM → DeepSeek 실제 요청) |
| Stage 6 | AD 계정 인증 링크 + NewAPI 관리자 로그인 |
| Stage 7 | MCP Gateway + Skill 기능 |
| Stage 8 | DSH Desktop/Dify 로그인 전제 조건 |
| Stage 9 | 디스크 공간 |

## 28.2 수동 실행

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ 출력 끝에 `ALL CLEAR` 및 `Fail: 0`이면 전부 정상.

## 28.3 부팅 자동 시작 (예약 작업)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 로그인 후 2분 지연으로 Docker + 컨테이너 시작 대기
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 주의: 스크립트는 `127.0.0.1` 사용, localhost 사용 안 함; LiteLLM 내부 상태는 `/health/readiness` 사용 (인증 불필요); `docker-init_permissions-1` Exited(0) 정상; Update Server 403 반환 정상 (기본 index.html 없음); exit code 0=통과, 1=실패 있음.

---

[← 제27장: 백업 및 복구](ch27-backup.md) · [📖 목차](index.md) · [제29장: 문제 해결 매뉴얼 →](ch29-troubleshooting.md)
