# Guide d'exploitation par agent IA

> 📖 **Langues** : [English](../AI-AGENT-OPS.md) · [简体中文](AI-AGENT-OPS.zh.md) · [繁體中文](AI-AGENT-OPS.zh-TW.md) · [Français](AI-AGENT-OPS.fr.md) · [Español](AI-AGENT-OPS.es.md) · [Português](AI-AGENT-OPS.pt.md) · [日本語](AI-AGENT-OPS.ja.md) · [한국어](AI-AGENT-OPS.ko.md) · [العربية](AI-AGENT-OPS.ar.md)

Cette plateforme est conçue pour être **exploitée et maintenue via un agent IA** — WorkBuddy, OpenClaw, Microsoft Scout ou tout outil équivalent. Au lieu de vous connecter à une douzaine de consoles d'administration et de cliquer dans des interfaces, vous dites à l'agent ce que vous voulez en langage naturel, et il lit les fichiers, exécute les commandes et dialogue avec les services à votre place.

Ce guide explique comment utiliser un agent IA pour l'exploitation quotidienne : vérifications de santé, gestion des conteneurs, modifications de configuration, le centre d'administration IA, Gitea/synchronisation, le portail Ghost, les sauvegardes, les versions et le dépannage.

---

## 1. Comment ça marche

Tout ce qui fait tourner la plateforme vit sur votre machine sous forme de **code, de configuration et de données** :

- **Docker Compose** définit tous les conteneurs.
- Les **fichiers `.env`** (ex. `windows/.env.windows`) contiennent les identifiants utilisés par les services.
- Les **API d'administration** exposent les points de gestion (Keycloak, Gitea, NewAPI, etc.).
- Les **fichiers et bases de données** (la base SQLite de Ghost, les installeurs DSH Desktop, le JSON d'historique de synchronisation, etc.) constituent l'état réel.

L'agent peut :

- **Lire et modifier** n'importe quel fichier — configurations, scripts, `index.html` / `server.js` du centre d'administration IA, et documentation.
- **Exécuter des commandes** — `docker`, `docker compose`, `git`, PowerShell, Node.js et Python.
- **Appeler des services en HTTP** — API d'administration, points de santé, liens de téléchargement.
- **Rechercher sur le web** la documentation des produits si nécessaire.

Comme tout n'est que fichiers + commandes + API, l'agent peut tout voir et tout modifier — c'est pourquoi vous pouvez exploiter toute la plateforme à travers lui.

---

## 2. Préparation (une seule fois)

1. **Ouvrez le dossier du projet dans l'agent.** Pointez le répertoire de travail de l'agent vers la racine du projet (ex. `C:\AIAllInOne`). C'est là qu'il lit `docker-compose.yml`, les fichiers `.env`, les scripts et la documentation.
2. **Assurez-vous que Docker Desktop tourne.** La plupart des opérations sont des commandes `docker` / `docker compose`. Si Docker Desktop est arrêté, la première étape de l'agent est généralement de vérifier et de le démarrer.
3. **Laissez les identifiants dans `.env`, pas dans la conversation.** L'agent lit `windows/.env.windows` pour les mots de passe des services. Ne collez pas de vrais mots de passe dans la conversation ou dans des fichiers versionnés.
4. **Indiquez-lui quel dossier de plateforme utiliser** si ce n'est pas évident (`windows/` dans la plupart des cas sur une seule machine).

---

## 3. Ce que l'agent peut faire

| Tâche | Comment l'agent s'y prend |
|---|---|
| Vérification de santé / vue d'ensemble | `docker ps` + points de santé + API d'administration |
| Démarrer / redémarrer / arrêter des services | `docker compose up -d <svc>` / `docker restart <svc>` |
| Consulter les journaux et erreurs | `docker logs <svc> --tail N`, lire les fichiers de journal |
| Modifier la configuration | modifier les fichiers, puis redémarrer le conteneur concerné |
| Modifier le centre d'administration IA | modifier `admin-portal/public/index.html` (UI) ou `admin-portal/server.js` (API) |
| Gérer Gitea + synchronisation | API Gitea : déclencher des workflows, lire l'état/les journaux, modifier les fichiers du dépôt |
| Gérer le portail Ghost | lire/écrire la base SQLite de Ghost, modifier les templates du thème, importer le contenu d'exemple |
| Sauvegarde et restauration | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publier une version | `publish.ps1` (build + commit + push vers GitHub) |
| Nettoyer | `docker image prune`, supprimer d'anciennes sauvegardes, etc. (avec votre confirmation) |
| Dépanner | conflits de ports, problèmes Docker Desktop, DNS/proxy, etc. |

---

## 4. Tâches courantes et exemples d'instructions

Voici les tâches que vous ferez le plus souvent, chacune avec un exemple. Vous pouvez les formuler dans votre langue — l'agent suivra. Remplacez `<…>` par les valeurs réelles.

### 4.1 Vérifier la santé de l'ensemble

> "Vérifie que tous les services tournent et sont sains. Liste tout conteneur arrêté ou en boucle de redémarrage, et explique pourquoi."

L'agent exécute `docker ps`, interroge chaque point de santé et rapporte l'état.

### 4.2 Enquêter sur un service arrêté ou en erreur

> "LiteLLM est arrêté. Trouve pourquoi et corrige-le, puis confirme qu'il est reparti."

L'agent inspecte l'état du conteneur, lit les journaux, trouve la cause racine (ex. un conflit de port) et la corrige.

### 4.3 Redémarrer un service

> "Redémarre le portail d'administration pour que ma modification de server.js prenne effet."

L'agent exécute `docker restart admin-portal`. Note : une modification du **backend** (`server.js`) nécessite un redémarrage du conteneur ; une modification du **frontend** (`index.html`) ne nécessite qu'un rafraîchissement du navigateur.

### 4.4 Consulter les journaux

> "Montre-moi les 50 dernières lignes du journal du runner Gitea et dis-moi s'il y a des erreurs."

### 4.5 Gérer la synchronisation DSH Desktop (Gitea)

> "Déclenche le workflow dsh-sync et montre-moi sa progression — phase, fichiers téléchargés, Mo, ETA."

L'agent appelle l'API Gitea pour déclencher le workflow, puis interroge l'état d'exécution et lit `sync-progress.json`.

### 4.6 Modifier le centre d'administration IA

> "Ajoute la pagination à la liste des dépôts Gitea — 10 par page, ajustable."

L'agent modifie `index.html`, valide le JavaScript et (pour les changements backend) redémarre le conteneur. Puis vous faites un rafraîchissement forcé (Ctrl+F5).

### 4.7 Gérer le portail Ghost

> "Importe le contenu d'exemple dans le portail, avec l'adresse 192.168.1.100 et en chinois."

L'agent demande l'adresse de publication et la langue, puis exécute `ghost-content-import.ps1`. Il peut aussi corriger les thèmes, modifier les pages et changer la navigation directement dans la base.

### 4.8 Sauvegarde et restauration

> "Lance une sauvegarde complète maintenant et confirme qu'elle a réussi."

### 4.9 Publier une version sur GitHub

> "Publie une nouvelle version v0.7 avec le message 'feat: …'."

L'agent exécute `publish.ps1 -Version v0.7 -CommitMessage "…"`. Note : `git push` nécessite que le proxy ou l'identifiant GitHub soit disponible — si le push échoue sur le réseau, l'agent vous demandera d'ouvrir le proxy.

### 4.10 Nettoyer l'espace disque

> "Montre-moi ce qui occupe l'espace disque de Docker et ce qui peut être supprimé sans risque."

L'agent scanne (`docker system df`, images inutilisées, volumes, anciennes sauvegardes) et liste les candidats — **il ne supprime qu'après votre confirmation.**

---

## 5. Bonnes pratiques et pièges

- **Rechargement frontend vs backend.** Dans le centre d'administration IA, les modifications de `index.html` prennent effet au rafraîchissement du navigateur (le fichier est monté en volume) ; les modifications de `server.js` nécessitent `docker restart admin-portal` — un simple `docker compose up -d` ne **recharge pas** le code monté en volume.
- **Forcez le rafraîchissement** (Ctrl+F5) quand l'interface semble inchangée — le vieux JavaScript est souvent mis en cache.
- **Ne versionnez jamais de vrais secrets ni d'adresses IP.** Utilisez des espaces réservés (ex. `<服务器IP>`, `CHANGE_ME_*`). `publish.ps1` nettoie automatiquement les mots de passe de `server.js`.
- **Vérifiez, ne croyez pas sur parole.** Demandez à l'agent de prouver les résultats par des commandes (codes HTTP, `ls`, lignes de journal), surtout pour les affirmations « c'est réglé ».
- **Sauvegardez avant toute modification destructive.** L'agent doit sauvegarder la base Ghost ou la configuration avant de les modifier, et confirmer avec vous avant toute suppression.
- **Demandez la langue et l'adresse avant l'import de contenu.** L'agent doit d'abord demander l'adresse de publication et la langue cible.
- **Réseau et proxy.** Certaines étapes (push vers GitHub, recherches web) nécessitent le proxy (ex. `127.0.0.1:33210`) ou un accès sortant. Si une étape réseau échoue, ouvrez le proxy et réessayez.

---

## 6. Aide-mémoire des commandes

| Action | Commande |
|---|---|
| Lister les conteneurs | `docker ps -a` |
| Journaux d'un conteneur | `docker logs <nom> --tail 100` |
| Redémarrer un service | `docker restart <nom>` |
| Démarrer tous les services | `docker compose up -d` |
| État de Compose | `docker compose ps` |
| Déclencher la synchro Gitea | `POST /api/v1/repos/<user>/dsh-sync/actions/workflows/sync.yml/dispatches` |
| Lancer une sauvegarde | `powershell .\scripts\backup.ps1` |
| Publier une version | `powershell .\publish.ps1 -Version v0.x -CommitMessage "…"` |
