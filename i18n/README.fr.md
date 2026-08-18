# AI AllInOne — Plateforme IA d'entreprise open source et auto-hébergée

> 📖 **Langue** : [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · **Français** · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

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

**Invite à copier dans votre agent** (plateforme Windows, en chinois — l'agent vous guidera pas à pas) :

````text
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
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
