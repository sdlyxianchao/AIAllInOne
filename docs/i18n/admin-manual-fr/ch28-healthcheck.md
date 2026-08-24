# Chapitre 28 : Contrôle de santé et auto-vérification au démarrage

*Troisième partie · Exploitation*

> Bilan de santé en un clic des 41 conteneurs + toute la chaîne LLM + la chaîne d'authentification.

[← Chapitre 27 : Sauvegarde et restauration](ch27-backup.md) · [📖 Index](index.md) · [Chapitre 29 : Manuel de dépannage →](ch29-troubleshooting.md)

---

**Script** : `C:\AIAllInOne\windows\scripts\health-check.ps1`, sortie `health_check_<horodatage>.log`. Couvre 41 conteneurs (25 cœurs Windows + 16 Dify), identifiants lus depuis `.env`, pas de mot de passe codé en dur.

## 28.1 Périmètre du contrôle (9 étapes)

| Étape | Élément contrôlé |
| --- | --- |
| Stage 1 | Le Docker Daemon est-il en cours d'exécution (attente de disponibilité, adaptée à l'auto-vérification au démarrage) |
| Stage 2 | État des 41 conteneurs (Up/Exited/Restarting) |
| Stage 3 | Réponse de 10 points de terminaison HTTP |
| Stage 4 | Readiness de LiteLLM + enregistrement des modèles, API Dify, santé base de données / Redis / Sandbox |
| Stage 5 | Chaîne LLM complète (requête réelle NewAPI → LiteLLM → DeepSeek) |
| Stage 6 | Chaîne d'authentification des comptes AD + connexion administrateur NewAPI |
| Stage 7 | MCP Gateway + fonctionnalités Skill |
| Stage 8 | Préconditions de connexion DSH Desktop/Dify |
| Stage 9 | Espace disque |

## 28.2 Exécution manuelle

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ En fin de sortie, `ALL CLEAR` et `Fail: 0` signifient que tout est normal.

## 28.3 Démarrage automatique (tâche planifiée)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # Délai de 2 minutes après la connexion pour attendre Docker + le démarrage des conteneurs
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 Remarque : le script utilise `127.0.0.1` et non localhost ; la santé interne de LiteLLM utilise `/health/readiness` (sans authentification) ; `docker-init_permissions-1` Exited(0) est normal ; le serveur de mise à jour renvoyant 403 est normal (pas d'index.html par défaut) ; exit code 0 = succès, 1 = échec.

---

[← Chapitre 27 : Sauvegarde et restauration](ch27-backup.md) · [📖 Index](index.md) · [Chapitre 29 : Manuel de dépannage →](ch29-troubleshooting.md)
