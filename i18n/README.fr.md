# AI AllInOne — Plateforme IA d'intranet d'entreprise (multi-plateforme, auto-hébergée)

> 📖 **Langues** : [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

Une **suite IA d'intranet d'entreprise prête à l'emploi et multi-plateforme** : authentification unifiée, routage LLM, masquage PII, applications IA, portail d'entreprise, source/CI, distribution client, administration unifiée, supervision et alertes, observabilité, journalisation, et sauvegarde/restauration — le tout orchestré avec Docker en un système intégré, avec **connexion unique (SSO) à chaque produit via un seul compte Keycloak**.

Le dépôt prend en charge trois plateformes de déploiement :

| Plateforme | Dossier du dépôt (sur GitHub) | Cas d'usage typique |
|---|---|---|
| Windows | `windows/` | Windows 11 + Docker Desktop (machine unique) |
| Linux / macOS | `linux/` | Serveur Linux auto-hébergé / macOS (Docker) |
| Serveur en ligne | `docker/` | Hôte cloud / Docker nu (production) |

> Dans le répertoire de travail local, ces dossiers sont nommés `windows-github/`, `linux-github/` et `docker-github/` ; après publication sur GitHub, le suffixe `-github` est supprimé et ils deviennent `windows/`, `linux/` et `docker/`. Toute mise à jour future suit ce même mappage.

---

## 1. Contenu

| Couche | Composant | Rôle |
|---|---|---|
| Authentification | Keycloak | SSO / OIDC, intégrable avec AD/LDAP ou comptes locaux |
| Routage LLM | NewAPI | Canaux, clés, quotas, audit, coût |
| Masquage PII | LiteLLM + Presidio | Masquage automatique téléphones/identifiants/e-mails avant les appels modèle |
| Applications IA | Dify | Plateforme d'apps IA visuelles / Agents + base de connaissances unifiée (RAG) |
| Portail d'entreprise | Ghost | Annonces et actualités de l'entreprise |
| Source / CI | Gitea + Runner | Git interne + automatisation Actions |
| Client | DeepChat | Client IA de bureau local (Windows / macOS / Linux) |
| Distribution client | Update Server | Hébergement et mise à jour auto de l'installeur DeepChat |
| Administration unifiée | AI Admin Center | Point d'entrée unique : tableau de bord + produits intégrés + audit/coût/rapports + recherche RAG + autorisation d'admin par module + synchronisation/rôles Keycloak |
| Passerelle | MCP Gateway | Gestion du marché Skill / MCP + recherche de connaissances Dify (RAG) |
| Supervision | Prometheus + Grafana + Alertmanager | Supervision des ressources conteneurs + notifications d'alerte |
| Observabilité LLM | Langfuse | Trace / latence / tokens / coût de chaque appel modèle |
| Journalisation unifiée | Loki + Promtail | Journaux agrégés et interrogeables de tous les conteneurs |
| Sauvegarde/restauration | scripts backup/restore + page admin | Sauvegarde complète quotidienne + restauration en un clic |

Chaque dossier de plateforme contient : `docker-compose.yml`, `.env.example`, `*-deploy-guide*.html` (guide de déploiement), `*-checklist*.html` (liste de contrôle), le guide d'intégration du fournisseur d'identité, des scripts de déploiement en un clic, ainsi que le code source et la config assainis. **Aucun secret réel n'est versionné.**

### Architecture et flux de données

![Architecture](<../pics/Architecture.png>)

![Flux de données](<../pics/DataFlow.png>)

### Captures d’écran

**AI Admin Center** — portail d’administration unifié

![AI Admin Center](<../pics/AI Admin.png>)

**Dify** — plateforme d’applications IA

![Dify](<../pics/Dify.png>)

**Portail d’entreprise** — accueil (Ghost)

![Accueil du portail](<../pics/AI All In One Hub.png>)

**DeepChat** — client IA de bureau

![DeepChat](<../pics/DeepChat.png>)

**Marché MCP/SKILL** — accès MCP en un clic + téléchargement des packs de compétences

![Marché MCP/SKILL](<../pics/Market.png>)

---

## 2. Démarrage rapide : déploiement automatisé via un outil de type Harness (recommandé)

Les outils de type Harness (OpenClaw, Microsoft Scout, WorkBuddy, etc.) peuvent lire la documentation et la config de ce projet et construire tout l'environnement étape par étape sur votre machine. Voici le déroulé standard.

### 5 prérequis

**1. Installer un outil de type Harness**
Installez OpenClaw / Microsoft Scout / WorkBuddy (ou un équivalent). Ils savent tous lire/écrire des fichiers locaux, exécuter des commandes et faire des recherches web.

**2. Acheter un abonnement ou configurer votre propre API**
Souscrivez dans l'outil, ou renseignez votre propre clé API LLM (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.) afin que l'outil puisse converser normalement.

**3. Préparer l'environnement réseau**
C'est l'étape qui bloque le plus souvent :
- Assurez-vous que la machine peut joindre les **registres d'images Docker** (Docker Hub / quay.io, etc.). Sinon, configurez un miroir de registre (par ex. DaoCloud) au préalable.
- Assurez-vous qu'elle peut joindre **GitHub** (pour cloner le dépôt et récupérer certaines dépendances publiques). Sinon, utilisez un proxy ou téléchargez l'archive source à l'avance.
- Vérifiez que la machine cible est joignable sur le segment réseau que vous comptez exposer.

**4. Cloner ou télécharger le projet en local**
```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
# ou téléchargez l'archive et extrayez-la dans n'importe quel dossier local
```

**5. Collez le prompt ci-dessous dans l'outil pour lancer le déploiement automatisé**

Copiez l'**intégralité du prompt** ci-dessous dans la zone de saisie de l'outil Harness, puis répondez à ses questions une par une. L'outil va : détecter votre plateforme → collecter les paramètres → générer un fichier de progression local → configurer étape par étape selon le guide → itérer avec vous pour tester et corriger les problèmes → maintenir la progression à jour → exécuter un test complet à la fin et en rapporter les résultats.

### Prompt de déploiement en un clic (à copier dans l'outil)

````text
Vous êtes ingénieur de déploiement pour une plateforme IA d'intranet d'entreprise. À partir de la documentation et des fichiers de config de ce projet, déployez et vérifiez entièrement la plateforme « AI AllInOne » sur la machine actuelle. Communiquez avec moi en français tout au long et suivez strictement le processus ci-dessous.

## Étape 1 : Confirmer le répertoire de déploiement et la plateforme cible

1. Demandez-moi d'abord : quel est le chemin local d'extraction/clonage de ce projet ? (par ex. C:\AIAllInOne ou /opt/AIAllInOne)
2. Après être entré dans ce répertoire, déterminez le dossier de plateforme cible selon le système d'exploitation de la machine :
   - Windows → utiliser le dossier `windows-github` (ou `windows`)
   - Linux / macOS → utiliser le dossier `linux-github` (ou `linux`)
   - Serveur en ligne / environnement Docker pur → utiliser le dossier `docker-github` (ou `docker`)
   En cas de doute, indiquez-moi l'OS détecté et confirmez avec moi le dossier à utiliser.
3. Lisez le README.md racine et le README.md du dossier de plateforme pour comprendre l'architecture et l'approche de déploiement avant d'agir.

## Étape 2 : Collecter les paramètres requis (demandez-moi un par un ; ne sautez pas, ne devinez pas)

Avant de configurer, collectez les informations suivantes, en me demandant tout ce qui manque et en expliquant l'utilité de chaque élément :

1. L'IP intranet utilisée pour exposer la plateforme (l'adresse que les autres machines utilisent pour l'atteindre, par ex. 192.168.1.100).
2. Source d'identité (Identity Provider) :
   - Contrôleur de domaine AD d'entreprise (Active Directory) : demandez-moi le nom de domaine, l'IP du DC, la base DN LDAP, le bind DN, le mot de passe du compte de bind, sAMAccountName, etc.
   - Autre IdP (LDAP/OpenLDAP/OIDC/Feishu/WeCom/DingTalk, etc.) : demandez-moi la config et les infos de compte correspondantes.
   - Aucune source d'identité externe (comptes locaux uniquement) : confirmez avec moi puis passez.
3. Compte admin unifié : nom d'utilisateur, mot de passe, e-mail (pour le SSO Keycloak et la connexion admin à chaque produit).
4. Clés API LLM : quels fournisseurs de modèles et quelles clés je possède réellement (DeepSeek / OpenAI / Claude / Qwen / ERNIE, etc.) ; passez ceux que je n'ai pas.
5. Autres éléments à demander selon les besoins : canal de notification d'alerte (URL webhook DingTalk/WeCom/Feishu), certificats HTTPS, politique de rétention des sauvegardes, etc.

## Étape 3 : Générer un fichier de progression local

1. Localisez le document « liste de contrôle » dans le dossier de plateforme (par ex. *-checklist*.html) et le « guide d'intégration de la source d'identité » (par ex. *-ad-integration*.html ou docs liés à l'IdP).
2. À partir du contenu de la liste, générez un nouveau fichier de progression dans le répertoire du projet, nommé par ex. « progression-deploiement-<plateforme>-<date>.md », en copiant chaque élément comme non terminé (- [ ]).
3. Ensuite, mettez à jour ce fichier chaque fois que vous terminez un élément ou résolvez un problème, et rapportez brièvement l'avancement dans la conversation.

## Étape 4 : Configurer étape par étape selon le guide de déploiement

1. Lisez attentivement le « guide de déploiement » de la plateforme (par ex. *-deploy-guide*.html) et suivez-le strictement, en portant une attention particulière aux « ⚠️ pièges critiques / points d'achoppement » qu'il signale.
2. Ordre approximatif : préparer les variables d'environnement → démarrer les conteneurs → initialiser auth/IdP → configurer le routage LLM et les canaux de modèles → initialiser chaque produit → configurer supervision/observabilité/journalisation/masquage → configurer sauvegarde et restauration.
3. Privilégiez les scripts d'automatisation déjà présents dans le dossier (par ex. bootstrap.ps1, keycloak-realm-init.ps1, health-check, etc.) ; ne cliquez pas dans les UI pour les étapes automatisables.

## Étape 5 : Itérer avec moi pour tester et corriger les problèmes

1. Quand une étape échoue ou ne correspond pas aux attentes, inspectez d'abord les journaux (docker logs, points de terminaison de santé de chaque service, fichiers de config), localisez la cause racine, puis corrigez — ne réessayez pas à l'aveugle.
2. Quand vous avez besoin de mon intervention (exécuter une commande avec droits admin, confirmer une connexion, fournir des infos), dites-moi clairement « quoi faire et pourquoi ».
3. Après résolution, notez la cause racine et le correctif dans le fichier de progression et rapportez-moi brièvement.

## Étape 6 : Vérification complète de bout en bout

Une fois chaque élément de la liste terminé, exécutez un test de bout en bout couvrant au moins :
- Santé des services (tous les conteneurs Up, points de terminaison de santé normaux) ;
- Connexion unifiée SSO (connexion Keycloak → SSO/connexion auto dans chaque produit) ;
- Chaîne LLM (envoyer un vrai chat via NewAPI/LiteLLM, vérifier la réponse + le masquage PII) ;
- Connexion par source d'identité (si AD/autre IdP est connecté, tester la connexion avec le compte correspondant) ;
- Supervision/observabilité/journalisation/alertes (confirmer que les données existent et que les alertes se déclenchent) ;
- Sauvegarde et restauration (exécuter une sauvegarde et vérifier qu'elle peut être restaurée).

Enfin, résumez les résultats de test élément par élément, en marquant clairement ✅ réussi / ❌ échoué ; pour les échecs, donnez la cause racine et des suggestions de suivi.
````

---

## 3. Déploiement manuel (alternative)

Si vous préférez ne pas utiliser d'outil de type Harness, vous pouvez déployer manuellement en suivant le `README.md` et le `*-deploy-guide*.html` de chaque plateforme. Le déroulé principal est identique : démarrer les conteneurs → initialiser auth/IdP → configurer les canaux LLM → initialiser chaque produit → configurer supervision/sauvegarde.

---

## 4. Sécurité et remarques

- Ce dépôt ne contient **aucun secret réel** ; toutes les valeurs réelles vivent dans le `.env` de chaque environnement d'exécution (seuls les modèles `.env.example` sont versionnés).
- Par défaut, HTTP en clair sur l'intranet ; pour HTTPS, voir le chapitre correspondant du guide de déploiement de chaque plateforme.
- Les pièges, diagrammes d'architecture, tables de ports et flux de données de chaque plateforme figurent dans les documents `*-deploy-guide*.html` correspondants.

---

## 5. Exploiter avec un agent IA

Cette plateforme peut être entièrement exploitée et maintenue via un agent IA (WorkBuddy, OpenClaw, Microsoft Scout, etc.) : vérifications de santé, gestion des conteneurs, modifications de configuration, synchronisation Gitea, portail Ghost, sauvegardes, versions et dépannage.

Consultez le **[Guide d'exploitation par agent IA](AI-AGENT-OPS.fr.md)** (disponible en 9 langues).

---

## 7. Manuels (en ligne, toutes langues)

Manuel administrateur：[English](docs/admin-manual.md) · [简体中文](docs/i18n/admin-manual-zh-cn.md) · [繁體中文](docs/i18n/admin-manual-zh-TW.md) · [Français](docs/i18n/admin-manual-fr.md) · [Español](docs/i18n/admin-manual-es.md) · [Português](docs/i18n/admin-manual-pt.md) · [日本語](docs/i18n/admin-manual-ja.md) · [한국어](docs/i18n/admin-manual-ko.md) · [العربية](docs/i18n/admin-manual-ar.md)

Manuel utilisateur：[English](docs/user-manual.md) · [简体中文](docs/i18n/user-manual-zh-cn.md) · [繁體中文](docs/i18n/user-manual-zh-TW.md) · [Français](docs/i18n/user-manual-fr.md) · [Español](docs/i18n/user-manual-es.md) · [Português](docs/i18n/user-manual-pt.md) · [日本語](docs/i18n/user-manual-ja.md) · [한국어](docs/i18n/user-manual-ko.md) · [العربية](docs/i18n/user-manual-ar.md)
