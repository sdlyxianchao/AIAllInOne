# 제27장: 백업 및 복구

*제3부 · 운영편*

> 2단계 백업, 무결성 검증, 독립 스크립트.

[← 제26장: MailHog 메일 수신기](ch26-ops-mailhog.md) · [📖 목차](index.md) · [제28장: 상태 점검 및 부팅 자체 점검 →](ch28-healthcheck.md)

---

**위치**: `C:\AIAllInOne\Backup\` — AI 관리 센터에서 독립된 PowerShell 스크립트.

| 스크립트 | 용도 |
| --- | --- |
| `backup-docker.ps1` | 백업 (2단계) |
| `restore-docker.ps1` | 복구 (2가지 전략) |
| `check_backup.ps1` | 백업 무결성 검증 (5층 검사) |
| `fix-backup-task.ps1` | 예약 작업 복구 |

## 27.1 백업 레벨

| 레벨 | 내용 | 용도 |
| --- | --- | --- |
| **L1** (기본) | 설정 파일 + DB dump | 매일 스냅샷 |
| **L2** | L1 + `docker_data.vhdx` | 완전 재해 복구 |

## 27.2 수동 백업

```powershell
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 예약 백업

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 복구

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 백업 검증

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 핵심 함정

> ⚠️
> - Keycloak은 **realm export/import (JSON)** 필수;
> - L2 백업 시 플랫폼 일시 중지;
> - 복구 전 `check_backup.ps1` 무결성 검증 필수.

---

[← 제26장: MailHog 메일 수신기](ch26-ops-mailhog.md) · [📖 목차](index.md) · [제28장: 상태 점검 및 부팅 자체 점검 →](ch28-healthcheck.md)
