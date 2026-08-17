# 제27장: 백업 및 복구

*제3부 · 운영편*

> 전체 데이터 매일 백업, 원클릭 복구.

[← 제26장: MailHog 메일 수신기](ch26-ops-mailhog.md) · [📖 목차](index.md) · [제28장: 상태 점검 및 부팅 자체 점검 →](ch28-healthcheck.md)

---

**진입점**: AI 관리 센터 「💾 백업 및 복구」 페이지, 또는 명령줄 `scripts/backup.ps1` / `restore.ps1`. 매일 02:00 예약 작업으로 자동 백업, 7일 보존.

## 27.1 백업 항목

| 백업 항목 | 방식 |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | 파일 복사 |
| Keycloak | **realm export (JSON)** |
| 설정 파일 | 파일 복사 |

## 27.2 수동 백업

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 예약 백업 (예약 작업)

예약 작업 `AI-Platform-Backup`이 등록되어 있습니다 (매일 02:00). 자동 등록되지 않았으면 수동 생성: 작업 스케줄러 → 새로 만들기 → 프로그램 `powershell.exe`, 인수 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, 트리거 매일 02:00.

> 📌 백업은 기본적으로 C 드라이브에 저장됩니다. 정기적으로 `C:\AIAllInOne\backups\`를 다른 디스크나 오브젝트 스토리지에 동기화해 오프사이트 재해 복구를 권장합니다.

## 27.4 복구

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

스크립트가 `yes` 입력을 요구합니다 (`-Force` 추가로 건너뜀, 스크립트/CI 전용). AI 관리 센터 「백업 및 복구」 페이지에서 특정 백업의 「복구」를 눌러 원클릭 복구할 수도 있습니다.

## 27.5 핵심 함정 (훈련으로 검증됨)

> ⚠️
> - Keycloak은 반드시 **realm export/import (JSON)** 사용, pg_dump 복원은 default role 연관이 손실되어 시작 실패;
> - SQLite 복원 후 소유자가 root이므로 해당 uid로 chown 필요 (grafana=472, gitea=1000), 아니면 readonly 오류;
> - pg_dump에 `--clean --if-exists` 포함해 복원 충돌 방지;
> - 구버전 backup.ps1이 `Copy-Item` 일괄 복사 시 점 파일 `.env` 때문에 전체가 조용히 실패했고, 파일별 `-LiteralPath`로 수정;
> - AI 관리 센터 백업은 base64 중계 + tar-fs로 바이너리 안전성 보장 (docker exec의 stdout이 utf8로 처리되어 SQLite .db 손상 방지).

---

[← 제26장: MailHog 메일 수신기](ch26-ops-mailhog.md) · [📖 목차](index.md) · [제28장: 상태 점검 및 부팅 자체 점검 →](ch28-healthcheck.md)
