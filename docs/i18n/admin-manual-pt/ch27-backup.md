# Capítulo 27: Backup e recuperação

*Parte 3 · Operações*

> Backup em dois níveis, verificação de integridade, scripts independentes.

[← Capítulo 26: MailHog: receptor de e-mails](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificação de integridade e autoteste na inicialização →](ch28-healthcheck.md)

---

**Localização**: `C:\AIAllInOne\Backup\` — scripts PowerShell independentes da Central de Administração de IA.

| Script | Uso |
| --- | --- |
| `backup-docker.ps1` | Backup (dois níveis) |
| `restore-docker.ps1` | Recuperação (duas estratégias) |
| `check_backup.ps1` | Verificação de integridade (5 camadas) |
| `fix-backup-task.ps1` | Reparar tarefa agendada |

## 27.1 Níveis de backup

| Nível | Conteúdo | Uso |
| --- | --- | --- |
| **L1** (padrão) | Arquivos config + dumps DB | Snapshot diário |
| **L2** | L1 + `docker_data.vhdx` | Recuperação completa ante desastres |

## 27.2 Backup manual

```powershell
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 Backup agendado

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 Recuperação

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 Verificação

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 Armadilhas críticas

> ⚠️
> - Keycloak deve usar **realm export/import (JSON)**;
> - L2 para brevemente a plataforma;
> - Sempre verificar com `check_backup.ps1` antes de restaurar.

---

[← Capítulo 26: MailHog: receptor de e-mails](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificação de integridade e autoteste na inicialização →](ch28-healthcheck.md)
