# AI AllInOne — Plateforme IA d'entreprise open source et auto-hébergée

> 📖 **Langue** : [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · **Français** · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

> ⭐ **Si ce projet vous aide, laissez-lui une étoile — c'est gratuit et aide plus de gens à le trouver.**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)
[![Star us](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)

> **Un serveur. Un compte. Toute la suite IA d'entreprise — open source et gratuite, vos données ne quittent jamais l'intranet.**

AI AllInOne est une plateforme IA d'intranet d'entreprise **open source et gratuite**, prête à l'emploi : authentification unique (SSO) unifiée, routage LLM, applications IA, portail d'entreprise, code source/CI, administration unifiée, supervision et alertes, observabilité, journaux, sauvegarde et restauration — le tout orchestré avec Docker en un ensemble cohérent. **Les employés se connectent une seule fois avec un compte et ont accès à tous les outils IA.**

![Centre d'administration IA](<../pics/AI Admin.png>)

![Portail d'entreprise](<../pics/AI All In One Hub.png>)

---

## ✨ Pourquoi choisir AI AllInOne

| | |
|---|---|
| 🧩 **Suite complète, zéro assemblage** | Plus de 8 composants open source pré-intégrés : authentification, passerelle, applications, portail, Git, supervision, journaux, sauvegarde. Aucun assemblage manuel nécessaire. |
| 🔐 **SSO unifié** | Un seul compte Keycloak (avec fédération AD/LDAP) connecte automatiquement à tous les produits, sans saisie de mot de passe. |
| 🔒 **Données confinées à l'intranet** | Entièrement auto-hébergé — les appels de modèles, prompts, documents et données utilisateurs restent au sein de l'entreprise. |
| ⚡ **Déploiement en ~30 minutes** | `docker compose` + scripts automatisés, ou laissez un AI Agent déployer tout l'environnement pour vous. |
| 🛡️ **Désidentification PII** | Les informations sensibles (numéros de téléphone, numéros de carte d'identité, e-mails, etc.) sont automatiquement masquées avant l'appel aux grands modèles externes (Presidio). |
| 📊 **Observabilité de bout en bout** | Supervision Prometheus + Grafana, traçage LLM Langfuse, journaux unifiés Loki, alertes IM d'entreprise (DingTalk / WeCom / Feishu). |
| 💾 **Sauvegarde et restauration** | Sauvegarde complète quotidienne en un clic et restauration en un clic depuis le panneau d'administration. |
| 🌐 **9 langues** | Manuels et interface d'administration multilingues (zh-CN / zh-TW / EN / FR / ES / PT / JA / KO / AR). |

## 📦 Liste des composants

| Couche | Composant | Rôle |
|---|---|---|
| Authentification | Keycloak | SSO / OIDC, fédération AD/LDAP ou comptes locaux |
| Routage LLM | NewAPI | Canaux, clés, quotas, audit, coûts |
| Désidentification PII | LiteLLM + Presidio | Masquage automatique des informations sensibles avant l'appel aux modèles |
| Applications IA | Dify | Plateforme d'applications IA / Agents visuels + base de connaissances unifiée (RAG) |
| Portail d'entreprise | Ghost | Portail d'annonces et d'actualités de l'entreprise (thème Corp Portal personnalisé intégré) |
| Code source / CI | Gitea + Runner | Git interne + automatisation Actions |
| Client | DeepChat | Client IA de bureau local (Windows / macOS / Linux) |
| Distribution client | Update Server | Hébergement des installateurs DeepChat et mises à jour automatiques |
| Administration unifiée | AI Admin Center | Point d'entrée unique : tableau de bord + produits intégrés + audit / coûts / rapports + autorisations administrateur hiérarchisées + synchronisation / rôles Keycloak |
| Passerelle | MCP Gateway | Marché de compétences / MCP + recherche dans la base de connaissances Dify (RAG) |
| Supervision | Prometheus + Grafana + Alertmanager | Supervision des ressources des conteneurs + notifications d'alerte |
| Observabilité LLM | Langfuse | Suivi de la latence, des tokens et des coûts de chaque appel de modèle |
| Journaux unifiés | Loki + Promtail | Agrégation des journaux de tous les conteneurs, filtrables par conteneur / mot-clé / période |
| Sauvegarde et restauration | Scripts + page d'administration | Sauvegarde complète quotidienne + restauration en un clic |

### Architecture et flux de données

![Vue d'ensemble de l'architecture](<../pics/Architecture.png>)

![Flux de données](<../pics/DataFlow.png>)

---

## 🚀 Démarrage rapide

**Prérequis** : une machine avec Docker (Windows 11 + Docker Desktop, ou Linux), capable d'accéder au registre d'images Docker.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# Démarrez les services principaux, puis initialisez l'authentification / les canaux LLM / chaque produit conformément au guide de déploiement
docker compose up -d
```

Deux options s'offrent à vous :

1. **Déploiement automatisé (recommandé)** — confiez le déploiement à un AI Agent (WorkBuddy / OpenClaw / Microsoft Scout). Il lit la documentation de déploiement et la configuration, recueille vos paramètres (IP du serveur, source d'identité, compte administrateur, clés LLM), puis réalise toute la configuration étape par étape. [Voir le prompt de déploiement en un clic →](../windows/windows-deploy-guide-v2.md)

#### 🤖 Déploiement IA — en un clic, piloté par un agent IA

> Copié du guide de déploiement (chapitre 0) : le guide peut être exécuté **chapitre par chapitre à la main**, ou confié de bout en bout à un **agent IA** (WorkBuddy / OpenClaw / Microsoft Scout). Donnez à l'agent ce répertoire (le guide, `windows-checklist.html`, `docker-compose.yml`, `.env.example`, `scripts/`), collez l'invite ci-dessous et il : détectera la plateforme → collectera vos paramètres un par un → générera un fichier de progression local → configurera étape par étape selon le guide → testera, déboguera et réessaiera en cas d'échec → mettra à jour la progression en continu → exécutera une vérification complète de bout en bout et vous rapportera les résultats.

**Invite à copier dans votre agent** (plateforme Windows, en français — l'agent vous guidera pas à pas) :

````text
Vous êtes ingénieur de déploiement pour une plateforme IA d'entreprise en intranet. Sur la base du guide de déploiement « windows-deploy-guide-v2.html », de la liste de contrôle windows-checklist.html, de docker-compose.yml et de .env.example de ce répertoire, déployez et vérifiez complètement la plateforme « AI AllInOne » sur cette machine Windows. Communiquez avec moi en français tout au long.

## Étape 1 : Collecter les paramètres requis (demandez-moi un par un — ne sautez ni ne devinez rien)
Avant de commencer, collectez auprès de moi : 1) l'IP intranet exposée par la plateforme ; 2) le nom d'hôte du marché Skill (domaine — utilisé pour remplacer <market-hostname> dans mcp-gateway/skills/skill-market/config.json et SKILL.md, et résolu via hosts/DNS) ; 3) la source d'identité (si connexion à un contrôleur de domaine AD : domaine / IP du DC / base DN LDAP / bind DN / mot de passe de bind / sAMAccountName ; ou la configuration d'un autre IdP ; confirmez si aucune) ; 4) le compte et mot de passe administrateur unifié ; 5) les clés API LLM (DeepSeek / OpenAI / Claude, etc.) ; 6) demandez si besoin les webhooks d'alerte, HTTPS et la politique de rétention des sauvegardes.

## Étape 2 : Générer un fichier de progression local
À partir du contenu de windows-checklist.html, générez « deployment-progress-<date>.md » dans ce répertoire avec chaque élément marqué incomplet (- [ ]). Mettez-le à jour et faites un point bref après chaque élément terminé ou problème résolu.

## Étape 3 : Configurer étape par étape selon le guide
Lisez attentivement windows-deploy-guide-v2.html — c'est la seule référence faisant autorité pour ce déploiement. Exécutez strictement ses chapitres 1 à 13 dans l'ordre (ne le remplacez pas par windows-checklist.html ni aucun document plus ancien), en portant une attention particulière aux « ⚠️ pièges critiques » de chaque chapitre. Privilégiez les scripts d'automatisation de scripts/ (bootstrap.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, keycloak-realm-init.ps1, backup.ps1, restore.ps1, etc.) ; automatisez plutôt que de cliquer dans les interfaces. Le portail Ghost (section 6.5) doit : ① déployer le thème Corp Portal fourni — lancez scripts\ghost-theme-setup.ps1 pour l'installer et l'activer, ne restez pas sur le thème officiel par défaut ; ② importer le contenu d'exemple : demandez d'abord l'adresse publique du portail et de tous les produits (IP intranet ou domaine, ex. 192.168.1.10 ou portal.company.com) — utilisez-la pour remplacer les espaces réservés <server-IP> du seed (remplacez aussi les URL d'accès NewAPI / MCP / Dify dans les articles ; ne modifiez pas les adresses internes fixes telles que host.docker.internal) ; demandez ensuite dans quelle langue doit être le contenu du portail — pour le chinois, lancez directement scripts\ghost-content-import.ps1 -ServerAddr "<adresse publique>" ; pour une autre langue, traduisez d'abord les champs title / html / plaintext / custom_excerpt de ghost-content-seed/content.json vers la langue cible (conservez les espaces réservés <server-IP> et toutes les structures d'URL inchangées), puis importez.

## Étape 4 : Tester et résoudre en itérant
En cas d'échec, inspectez d'abord les journaux (docker logs, points de contrôle, configurations) pour trouver la cause racine avant de corriger — ne réessayez pas à l'aveugle. Quand des droits administrateur ou ma confirmation manuelle sont nécessaires, dites-moi clairement « quoi faire et pourquoi ». Après résolution, mettez à jour le fichier de progression et faites un point bref.

## Étape 5 : Vérification complète de bout en bout
Une fois tout terminé, exécutez des tests de bout en bout : tous les conteneurs Up, connexion SSO Keycloak, une vraie conversation via NewAPI/LiteLLM pour vérifier le masquage PII, connexion via la source d'identité, supervision / journalisation / alertes, sauvegarde et restauration. Enfin, résumez chaque élément en ✅/❌, avec la cause racine et une suggestion pour les échecs.
````

> 💡 Même si vous **n'utilisez pas d'agent**, cette invite sert aussi de liste de contrôle pré-déploiement — elle énumère tous les paramètres à préparer avant de commencer.

2. **Déploiement manuel** — suivez pas à pas le [guide de déploiement Windows](../windows/windows-deploy-guide-v2.md) (avec la liste de contrôle de progression `windows-checklist.html`).

> **État de la plateforme** : Windows (Windows 11 + Docker Desktop) **en cours de test réel**. Linux/macOS (`linux/`) et serveur en ligne (`docker/`) sont prévus — voir la [feuille de route](#roadmap).

## 🖼️ Captures d'écran

**Dify** — plateforme d'applications IA · **Marché MCP / Skills** — branchez outils et compétences en un clic · **DeepChat** — client IA de bureau

![Dify](<../pics/Dify.png>) ![Marché MCP/SKILL](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

D'autres captures d'écran (48 captures d'interface réelles) sont intégrées au [manuel de l'administrateur](../docs/admin-manual/index.md).

## 📚 Manuels (en ligne, 9 langues)

| Manuel | Langue |
|---|---|
| **Manuel de l'administrateur** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **Manuel de l'utilisateur** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

## 🎓 Programme de formation

La plateforme inclut un **programme de formation complet** (17 modules, 60 heures, 10 jours ouvrés) pour la prise en main du déploiement et de l'exploitation :

| Pack | Langue | Entrée |
|---|---|---|
| **English** | EN | [training/training_eng/index.md](../training/training_eng/index.md) |
| **简体中文** | zh-CN | [training/training_chn/index.md](../training/training_chn/index.md) |

Pour l'exploitation quotidienne de l'IA par agent, voir le **[guide d'exploitation AI Agent](../AI-AGENT-OPS.md)**.

## 👥 Communauté

> Groupe WeChat — pour échanger, obtenir de l'aide sur le déploiement, donner des retours et **construire ensemble**. Scannez le code QR pour ajouter un ami et rejoindre le groupe.

<img src="../pics/wechat.png" alt="QR code du groupe WeChat" width="200" />

Vous pouvez également utiliser [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions) (ou ouvrir directement une [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues)).

## 🤝 Contribuer

Ce projet est **open source et gratuit**, et il se développe grâce à la communauté. Quel que soit votre niveau, il existe une façon de contribuer adaptée à vous :

- ⭐ **Mettre une étoile au dépôt** — le soutien le plus simple et le plus précieux
- 🐛 **Signaler un bug / proposer une fonctionnalité** — ouvrez une issue en décrivant clairement les étapes de reproduction
- 📝 **Rédiger de la documentation et des tutoriels** — guides de déploiement, retours d'expérience de dépannage, bonnes pratiques
- 🌐 **Traduire** — les manuels sont déjà disponibles en 9 langues ; aidez à les améliorer ou à en ajouter davantage
- 🧪 **Tester et partager** — déployez une fois et dites-nous ce qui fonctionne bien et les pièges rencontrés
- 💻 **Contribuer au code** — la couche d'intégration (SSO unifié, portail d'administration, supervision, sauvegarde) est le meilleur endroit pour commencer

Le guide complet figure dans [CONTRIBUTING.md](../CONTRIBUTING.md) ; la [feuille de route](#roadmap) publique montre les prochaines étapes. **Chaque contributeur est inscrit dans la liste des contributeurs du README.**

<h2 id="roadmap">🗺️ Feuille de route</h2>

- ✅ v0.9x — Plateforme Windows : suite complète + centre d'administration IA + autorisations administrateur hiérarchisées + alertes IM d'entreprise + cache sémantique (LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — prise en charge des serveurs Linux auto-hébergés (`linux/`)
- 🚧 **Serveur en ligne** — déploiement de production en Docker pur / cloud (`docker/`)
- 🚧 **Programme de co-construction** — tableau de tâches, réunion de synchronisation hebdomadaire, certification des partenaires de déploiement

## 🔒 Considérations de sécurité

- Ce dépôt **ne contient aucune clé réelle** ; les valeurs réelles ne sont conservées que dans le `.env` de chaque environnement d'exécution (le dépôt ne contient que le modèle `.env.example`).
- HTTP en clair par défaut sur l'intranet ; la configuration HTTPS est décrite dans le guide de déploiement de chaque plateforme.
- Les pièges, tables de ports et flux de données de chaque plateforme figurent dans les documents `*-deploy-guide*.html` correspondants.

## ⭐ Soutenez le projet

Si AI AllInOne vous fait gagner du temps ou de l'argent, une étoile ne vous coûte rien et aide le projet à grandir :

- ⭐ **Mettez une étoile au dépôt** — aide plus de gens à découvrir et bénéficier du projet
- 🐛 **Signalez des problèmes** — bugs, demandes de fonctionnalités et problèmes de déploiement bienvenus
- 🤝 **Contribuez** — code, documentation et traductions (9 langues) bienvenus
- 💬 **Rejoignez la communauté** — partagez vos expériences de déploiement et vos idées
- 📣 **Partagez** — parlez-en à vos collègues ou sur votre blog / réseaux sociaux

Une étoile en haut à droite est le plus grand soutien pour ce projet.

## 📄 Licence

[MIT](../LICENSE) — libre d'utilisation, de modification et de redistribution. Les composants intégrés conservent leurs licences respectives (voir la section de revue des licences du guide de déploiement).

## 🤖 Opérations IA par agent

La plateforme est conçue pour être **exploitée et maintenue via un agent IA** — WorkBuddy, OpenClaw, Microsoft Scout ou tout outil équivalent. Au lieu de cliquer dans une dizaine de consoles d'administration, vous dites à l'agent ce que vous voulez en langage naturel ; il lit les fichiers, exécute les commandes et dialogue avec les services pour vous.

Tout ce qui fait tourner la plateforme vit sur votre machine sous forme de **code, configuration et données** — services Docker Compose, fichiers `.env`, API d'administration et bases/fichiers qui contiennent l'état réel — l'agent peut donc tout voir et tout modifier :

| 任务 | Agent 的做法 |
|---|---|
| Vérification de santé / état général | `docker ps` + points de contrôle + API d'administration |
| Démarrer / redémarrer / arrêter les services | `docker compose up -d <svc>` / `docker restart <svc>` |
| Consulter les journaux et erreurs | `docker logs <svc> --tail N` + fichiers journaux |
| Modifier la configuration | modifier les fichiers de config, puis redémarrer le conteneur concerné |
| Modifier le Centre d'administration IA | modifier `admin-portal/public/index.html` (UI) ou `admin-portal/server.js` (API), puis redémarrer |
| Gérer Gitea et la synchronisation | API Gitea : déclencher les workflows, lire l'état/logs, éditer les fichiers du dépôt |
| Gérer le portail Ghost | lire/écrire la base SQLite de Ghost, modifier les thèmes, importer le contenu |
| Sauvegarde et restauration | `scripts/backup.ps1` / `scripts/restore.ps1` |
| Publier une version | `publish.ps1` (build + commit + push vers GitHub) |
| Dépannage | conflits de ports, problèmes Docker Desktop, DNS/proxy, etc. |

Exemple : *« Vérifie que tous les services tournent et sont en bonne santé »* — l'agent exécute `docker ps`, interroge chaque point de contrôle et vous rapporte ce qui ne va pas et pourquoi. Invites prêtes à l'emploi, bonnes pratiques et référence complète de commandes : voir le **[Guide des opérations IA par agent](../AI-AGENT-OPS.md)** (9 langues).

### 🛡️ Opérations IA — vérification de santé en une commande et démarrage automatique

> Copié du guide de déploiement (chapitre 12) : la plateforme fournit une **vérification de santé en une commande** (`health-check.ps1`) qui contrôle les **41 conteneurs en 9 étapes** — dont la chaîne LLM complète, l'authentification AD + connexion admin, les fonctions MCP/Skill et l'espace disque. Les identifiants sont lus depuis `.env` ; le script n'encode aucun mot de passe. Demandez simplement à votre agent IA de l'exécuter (ex. *« Lance la vérification de santé et dis-moi ce qui échoue »*), ou laissez-la s'exécuter automatiquement à chaque connexion :

| Étape | Vérification | Méthode |
|---|---|---|
| Stage 1 | Le daemon Docker tourne-t-il (attend le prêt, pour le démarrage auto) | `docker info` |
| Stage 2 | État des 41 conteneurs (Up/Exited/Restarting) | `docker ps -a` |
| Stage 3 | Réponse de 10 points de contrôle HTTP (dont MCP Gateway) | `curl.exe 127.0.0.1:port` |
| Stage 4 | LiteLLM /readiness + **enregistrement des modèles**, litellm-redis PING, Dify API /health, santé MySQL/PostgreSQL/Redis/Sandbox | `docker exec` + `docker inspect` |
| Stage 5 | **Chaîne LLM complète** : état des canaux NewAPI + une vraie requête au nom de DeepChat et de Dify (NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **Chaîne d'authentification AD** : Keycloak well-known + synchro utilisateurs AD (aitest1) + config OIDC NewAPI + intégrité des clients OIDC + **login admin NewAPI** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + agrégation de Skills externes | curl (protocole MCP) |
| Stage 8 | **Prérequis de connexion DeepChat / Dify** : NewAPI dispo + Dify initialisé | curl + psql |
| Stage 9 | **Espace disque** : reste sur le disque système + occupation Docker | `Get-PSDrive` + `docker system df` |

**Exécution manuelle** (PowerShell) :

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**Exécution automatique à l'ouverture de session** (tâche planifiée — exécutez PowerShell en administrateur) :

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
