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

<details>
<summary>📋 Prompt de déploiement en un clic (cliquer pour déplier)</summary>

````text
Vous êtes un ingénieur de déploiement pour une plateforme IA d'intranet d'entreprise. Sur la base de la documentation et des fichiers de configuration de ce projet, déployez et validez entièrement la plateforme « AI AllInOne » sur la machine actuelle. Communiquez avec moi en français tout au long du processus et suivez strictement la procédure ci-dessous.

## Étape 1 : Confirmer le répertoire de déploiement et la plateforme cible
1. Demandez-moi d'abord : quel est le chemin local d'extraction/clonage de ce projet ? (par exemple C:\AIAllInOne ou /opt/AIAllInOne)
2. Après être entré dans ce répertoire, déterminez le répertoire de la plateforme cible en fonction du système d'exploitation de la machine :
   - Windows → utilisez le répertoire windows-github (ou windows)
   - Linux / macOS → utilisez le répertoire linux-github (ou linux)
   - Serveur en ligne / environnement Docker pur → utilisez le répertoire docker-github (ou docker)
   En cas de doute, indiquez-moi le système d'exploitation détecté et confirmez avec moi le répertoire à utiliser.
3. Avant de commencer, lisez le README.md à la racine et le README du répertoire de la plateforme pour comprendre l'architecture et la méthode de déploiement.

## Étape 2 : Collecter les paramètres requis un par un (demandez-moi chacun, ne sautez ni ne devinez)
1. L'IP intranet (ou nom de domaine) exposée par la plateforme, c'est-à-dire l'adresse à laquelle les autres machines accèdent (par exemple 192.168.1.100 ou portal.company.com).
2. Source d'identité (Identity Provider) :
   - Contrôleur de domaine AD de l'entreprise : demandez-moi le nom de domaine, l'IP du DC, la base DN LDAP, le bind DN, le mot de passe du compte de liaison (bind), le sAMAccountName, etc.
   - Autre IdP (LDAP / OpenLDAP / OIDC / Feishu / WeCom / DingTalk, etc.) : demandez-moi la configuration et les informations de compte correspondantes.
   - Aucune source d'identité externe (comptes locaux uniquement) : confirmez avec moi puis passez à la suite.
3. Compte administrateur unifié : nom d'utilisateur, mot de passe, e-mail (pour la connexion SSO Keycloak et les connexions administrateur de chaque produit).
4. Clés API LLM : quels fournisseurs de modèles et clés sont réellement disponibles (DeepSeek / OpenAI / Claude / Qwen / Tongyi / ERNIE, etc.) ; passez ce qui n'est pas disponible.
5. Langue du contenu d'exemple du portail Ghost : chinois, ou à traduire dans une autre langue avant l'importation.
6. Autres demandes selon les besoins : nom d'hôte du marché de compétences MCP (Windows), canaux de notification d'alerte (webhook DingTalk / WeCom / Feishu), certificats HTTPS, stratégie de conservation des sauvegardes, etc.

## Étape 3 : Générer le fichier de progression local
1. Recherchez le document « liste de contrôle de progression » (*-checklist*.html) et le « guide d'intégration de la source d'identité » (par exemple *-ad-integration*.html ou les documents relatifs à l'IdP) dans le répertoire de la plateforme.
2. À partir du contenu de la liste, générez un fichier de progression dans le répertoire du projet, nommé par exemple « deployment-progress-<platform>-<date>.md », et copiez chaque élément de la liste en tant qu'inachevé (- [ ]).
3. Ensuite, après chaque tâche accomplie ou problème résolu, mettez à jour ce fichier de progression et rapportez-moi brièvement l'avancement dans la conversation.

## Étape 4 : Configurer progressivement selon le guide de déploiement
1. Lisez attentivement le document « guide de déploiement » de la plateforme (par exemple *-deploy-guide*.html) et suivez-le strictement, en accordant une attention particulière aux « ⚠️ pièges clés » qu'il signale.
2. Ordre général : préparer les variables d'environnement → démarrer les conteneurs → initialiser l'authentification / l'IdP → configurer le routage LLM et les canaux de modèles → initialiser chaque produit (portail Ghost : déployer le thème Corp Portal intégré et importer le contenu d'exemple) → configurer la supervision / l'observabilité / les journaux / la désidentification → configurer la sauvegarde et la restauration.
3. Privilégiez les scripts d'automatisation du répertoire (comme bootstrap.ps1, keycloak-realm-init.ps1, ghost-setup.ps1, ghost-theme-setup.ps1, ghost-content-import.ps1, health-check.ps1, etc.) ; pour les étapes scriptables, n'utilisez pas l'interface graphique manuellement.

## Étape 5 : Tester de façon itérative avec moi et résoudre les problèmes
1. Si une étape échoue ou ne correspond pas aux attentes, consultez d'abord les journaux (docker logs, points de terminaison de santé des services, fichiers de configuration) pour identifier la cause racine avant de corriger ; ne réessayez pas à l'aveugle.
2. Lorsque ma participation est nécessaire (par exemple exécuter des commandes nécessitant des droits administrateur, confirmer une connexion, fournir des informations complémentaires), indiquez-moi clairement « quoi faire et pourquoi ».
3. Après résolution, consignez la cause racine et le correctif dans le fichier de progression, puis faites-en un bref rapport.

## Étape 6 : Validation de bout en bout complète
Une fois tous les éléments de la liste terminés, effectuez un test de bout en bout complet couvrant au minimum :
- Santé des services (tous les conteneurs Up, points de terminaison de santé opérationnels) ;
- Connexion SSO unifiée (connexion Keycloak → SSO / connexion automatique à chaque produit) ;
- Chaîne LLM (envoyer une vraie conversation via NewAPI/LiteLLM, vérifier la réponse et l'efficacité de la désidentification PII) ;
- Connexion par source d'identité (si AD / autre IdP intégré, tester la connexion avec le compte correspondant) ;
- Supervision / observabilité / journaux / alertes (vérifier que des données sont présentes et que les alertes peuvent se déclencher) ;
- Sauvegarde et restauration (effectuer une sauvegarde et vérifier qu'elle est restaurable).

Enfin, récapitulez les résultats des tests point par point, en marquant clairement ✅ Réussi / ❌ Échec ; pour les échecs, indiquez la cause racine et des recommandations ultérieures.
````

</details>

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
