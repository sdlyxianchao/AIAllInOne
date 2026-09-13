# Capítulo 27: Copia de seguridad y restauración

*Parte III · Operaciones*

> Copia de seguridad en dos niveles, verificación de integridad, scripts independientes.

[← Capítulo 26: Receptor de correo MailHog](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificación de estado y autocomprobación de arranque →](ch28-healthcheck.md)

---

**Ubicación**: `C:\AIAllInOne\Backup\` — scripts PowerShell independientes del Centro de administración de IA.

| Script | Uso |
| --- | --- |
| `backup-docker.ps1` | Copia de seguridad (dos niveles) |
| `restore-docker.ps1` | Restauración (dos estrategias) |
| `check_backup.ps1` | Verificación de integridad (5 capas) |
| `fix-backup-task.ps1` | Reparar tarea programada |

## 27.1 Niveles de copia

| Nivel | Contenido | Uso |
| --- | --- | --- |
| **L1** (predeterminado) | Archivos config + dumps DB | Instantáneo diario |
| **L2** | L1 + `docker_data.vhdx` | Recuperación completa ante desastres |

## 27.2 Copia manual

```powershell
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 Copia programada

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 Restauración

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 Verificación

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 Puntos críticos

> ⚠️
> - Keycloak debe usar **realm export/import (JSON)**;
> - L2 detiene brevemente la plataforma;
> - Siempre verificar con `check_backup.ps1` antes de restaurar.

---

[← Capítulo 26: Receptor de correo MailHog](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificación de estado y autocomprobación de arranque →](ch28-healthcheck.md)
