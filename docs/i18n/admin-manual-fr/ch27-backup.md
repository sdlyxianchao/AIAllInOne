# Chapitre 27 : Sauvegarde et restauration

*Troisième partie · Exploitation*

> Sauvegarde quotidienne complète des données et restauration en un clic.

[← Chapitre 26 : MailHog, récepteur d'e-mails](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapitre 28 : Contrôle de santé et auto-vérification au démarrage →](ch28-healthcheck.md)

---

**Accès** : page « 💾 Sauvegarde et restauration » du Centre d'administration IA, ou en ligne de commande `scripts/backup.ps1` / `restore.ps1`. Tâche planifiée automatique à 02:00 chaque jour, rétention de 7 jours.

## 27.1 Éléments de sauvegarde

| Élément de sauvegarde | Méthode |
| --- | --- |
| MySQL de NewAPI | `mysqldump` |
| PostgreSQL de Dify | `pg_dump` |
| PostgreSQL de Langfuse | `pg_dump` |
| SQLite de Ghost / Gitea / Grafana | Copie de fichiers |
| Keycloak | **export du realm (JSON)** |
| Fichiers de configuration | Copie de fichiers |

## 27.2 Sauvegarde manuelle

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 Sauvegarde planifiée (tâche planifiée)

La tâche planifiée `AI-Platform-Backup` est déjà enregistrée (tous les jours à 02:00). Si elle n'a pas été enregistrée automatiquement, créez-la manuellement : Planificateur de tâches → Nouvelle → programme `powershell.exe`, arguments `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, déclencheur tous les jours à 02:00.

> 📌 La sauvegarde se fait par défaut sur le disque C ; il est conseillé de synchroniser régulièrement `C:\AIAllInOne\backups\` vers un autre disque ou un stockage objet pour la reprise sur sinistre hors site.

## 27.4 Restauration

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

Le script demande la saisie de `yes` pour confirmer (ajoutez `-Force` pour l'ignorer, réservé aux scripts/CI). Vous pouvez aussi cliquer sur « Restaurer » d'une sauvegarde dans la page « Sauvegarde et restauration » du Centre d'administration IA.

## 27.5 Pièges clés (validés par exercice)

> ⚠️
> - Keycloak doit utiliser **l'export/import du realm (JSON)** ; une restauration pg_dump perd l'association des rôles par défaut et empêche le démarrage ;
> - Après restauration, SQLite appartient à root ; faites un chown vers l'uid correspondant (grafana=472, gitea=1000), sinon readonly ;
> - pg_dump avec `--clean --if-exists` pour éviter les conflits de restauration ;
> - L'ancien backup.ps1 utilisait `Copy-Item` en copie par lots ; le fichier pointé `.env` faisait échouer tout le lot en silence ; corrigé en copie fichier par fichier avec `-LiteralPath` ;
> - La sauvegarde du Centre d'administration IA passe par base64 + tar-fs pour garantir la sécurité binaire (la stdout de docker exec en utf8 corromprait le SQLite .db).

---

[← Chapitre 26 : MailHog, récepteur d'e-mails](ch26-ops-mailhog.md) · [📖 Index](index.md) · [Chapitre 28 : Contrôle de santé et auto-vérification au démarrage →](ch28-healthcheck.md)
