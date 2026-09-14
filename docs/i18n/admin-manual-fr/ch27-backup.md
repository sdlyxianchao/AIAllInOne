# Chapitre 27 : Sauvegarde et restauration

*Troisième partie · Exploitation*

> Sauvegarde à deux niveaux, vérification d'intégrité, scripts indépendants.

[← Chapitre 26 : MailHog, récepteur d'e-mails](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapitre 28 : Contrôle de santé et auto-vérification au démarrage →](ch28-healthcheck.md)

---

**Emplacement** : `C:\AIAllInOne\Backup\` — scripts PowerShell indépendants du Centre d'administration IA.

| Script | Usage |
| --- | --- |
| `backup-docker.ps1` | Sauvegarde (deux niveaux) |
| `restore-docker.ps1` | Restauration (deux stratégies) |
| `check_backup.ps1` | Vérification d'intégrité (5 couches) |
| `fix-backup-task.ps1` | Réparation de la tâche planifiée |

## 27.1 Niveaux de sauvegarde

| Niveau | Contenu | Usage |
| --- | --- | --- |
| **L1** (défaut) | Fichiers de config + dumps DB | Instantané quotidien |
| **L2** | L1 + `docker_data.vhdx` | Reprise complète après sinistre |

## 27.2 Sauvegarde manuelle

```powershell
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 Sauvegarde planifiée

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 Restauration

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 Vérification

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 Pièges clés

> ⚠️
> - Keycloak doit utiliser **l'export/import du realm (JSON)** ;
> - L2 arrête brièvement la plateforme ;
> - Toujours vérifier avec `check_backup.ps1` avant de restaurer.

---

[← Chapitre 26 : MailHog, récepteur d'e-mails](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapitre 28 : Contrôle de santé et auto-vérification au démarrage →](ch28-healthcheck.md)
