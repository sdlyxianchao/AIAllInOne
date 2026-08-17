# Manuel de l'administrateur AI AllInOne

*v0.2 · Déploiement · Administration · Exploitation*

Ce manuel est divisé en trois parties : **Déploiement** (chapitres 1–13, mise en place de la plateforme depuis zéro), **Administration** (chapitres 14–26, opérations quotidiennes des 13 produits) et **Exploitation** (chapitres 27–29, sauvegarde / contrôles de santé / dépannage), plus une **Annexe** de liens vers la documentation des fournisseurs. Chaque chapitre dispose d'une navigation précédent/suivant en bas de page — lisez de bout en bout ou sautez directement au sujet souhaité.

## Première partie · Déploiement

| # | Chapitre | Description |
| --- | --- | --- |
| 1 | [Vue d'ensemble et architecture de la plateforme](ch01-overview.md) | Comprendre la composition, les ports et les flux de données de cette plateforme est le préalable à toutes les opérations de déploiement et d'administration qui suivent. |
| 2 | [Préparation préalable](ch02-prereq.md) | Installer Docker Desktop, préparer les répertoires, ouvrir le réseau, fixer l'IP — ce qu'il faut faire avant le déploiement. |
| 3 | [Fichiers de configuration et variables d'environnement](ch03-env.md) | Trois fichiers de configuration principaux + l'explication complète des variables d'environnement, celles à configurer maintenant et celles à configurer plus tard. |
| 4 | [Démarrage des services principaux](ch04-start.md) | Copier .env, démarrer les conteneurs, vérifier l'accessibilité service par service, traiter le problème SQLite connu de Ghost. |
| 5 | [Déploiement autonome de Dify](ch05-dify-deploy.md) | Dify se déploie de façon autonome avec le compose officiel (environ 15 conteneurs) pour éviter les conflits de ports. |
| 6 | [Keycloak : Realm, utilisateurs et AD](ch06-keycloak.md) | Créer un Realm, créer des comptes locaux, ou importer des comptes de domaine depuis Active Directory — le fondement du SSO de tous les produits. |
| 7 | [NewAPI : initialisation, canaux et OIDC](ch07-newapi.md) | Terminer l'assistant d'installation initiale, configurer le canal pointant vers LiteLLM, distribuer les clés API, intégrer Keycloak OIDC. |
| 8 | [LiteLLM : vérification et cache](ch08-litellm.md) | Vérifier que le proxy LiteLLM fonctionne et activer le cache de réponses pour économiser des tokens. |
| 9 | [Configuration de Dify / Ghost / Gitea](ch09-products.md) | L'initialisation et la configuration d'interconnexion de chacun des trois produits. |
| 10 | [Distribution de DeepChat et CI/CD](ch10-deepchat.md) | Distribuer les paquets d'installation DeepChat aux employés, et synchroniser automatiquement les nouvelles versions officielles avec Gitea Actions. |
| 11 | [MCP Gateway et marché de Skills](ch11-mcp.md) | La passerelle qui centralise la gestion des Skills et des outils MCP ; DeepChat/Dify se connecte à une seule adresse pour obtenir tous les outils. |
| 12 | [Centre d'administration IA](ch12-admin-center.md) | Portail d'administration unifié : authentification Keycloak, menu de gauche intégrant tous les produits, état du cluster dans le Dashboard. |
| 13 | [Liste de vérification de l'interconnexion](ch13-interconnect.md) | Après le déploiement, confirmez un à un que les 12 chaînes d'interconnexion sont toutes opérationnelles. |

## Deuxième partie · Administration (opérations quotidiennes de chaque produit)

| # | Chapitre | Description |
| --- | --- | --- |
| 14 | [Administration quotidienne de Keycloak](ch14-ops-keycloak.md) | Le centre d'authentification : gérer les utilisateurs, les rôles, les clients OIDC, la fédération AD et les sessions. |
| 15 | [Administration quotidienne de NewAPI](ch15-ops-newapi.md) | Passerelle LLM : gérer les canaux, les tokens, les quotas, les utilisateurs, les journaux et les coûts. |
| 16 | [Administration quotidienne de LiteLLM](ch16-ops-litellm.md) | Proxy d'anonymisation PII : liste des modèles, règles d'anonymisation, cache, remontée vers Langfuse. |
| 17 | [Administration quotidienne de Dify](ch17-ops-dify.md) | Plateforme d'applications IA : applications, bases de connaissances, fournisseurs de modèles, autorisations des membres, publication. |
| 18 | [Administration quotidienne de Ghost](ch18-ops-ghost.md) | Portail d'entreprise / Hub : articles, pages, navigation, thèmes, membres. |
| 19 | [Administration quotidienne de Gitea](ch19-ops-gitea.md) | Git interne + CI/CD : dépôts, organisations, Runners, Actions. |
| 20 | [Administration quotidienne de MCP Gateway](ch20-ops-mcp.md) | Ajouter/supprimer des MCP Server, téléverser/supprimer des Skills, étendre les outils intégrés. |
| 21 | [Administration du serveur de mise à jour](ch21-ops-update.md) | Hébergement des paquets d'installation DeepChat et mise à jour automatique. |
| 22 | [Administration de la surveillance et des alertes](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager : surveillance des ressources des conteneurs et notifications d'alerte. |
| 23 | [Observabilité LLM (Langfuse)](ch23-ops-langfuse.md) | Tracer le prompt, la réponse, la latence, les tokens et le coût de chaque appel au modèle. |
| 24 | [Journaux unifiés (Loki)](ch24-ops-loki.md) | Agréger les journaux de tous les conteneurs et les interroger par conteneur + mot-clé + temps. |
| 25 | [Anonymisation PII (Presidio)](ch25-ops-pii.md) | Les informations sensibles sont anonymisées automatiquement avant de sortir de l'intranet. |
| 26 | [MailHog, récepteur d'e-mails](ch26-ops-mailhog.md) | La « sortie e-mail » en l'absence de SMTP sur l'intranet, qui reçoit les codes de vérification / e-mails de notification de Ghost. |

## Troisième partie · Exploitation

| # | Chapitre | Description |
| --- | --- | --- |
| 27 | [Sauvegarde et restauration](ch27-backup.md) | Sauvegarde quotidienne complète des données et restauration en un clic. |
| 28 | [Contrôle de santé et auto-vérification au démarrage](ch28-healthcheck.md) | Bilan de santé en un clic des 41 conteneurs + toute la chaîne LLM + la chaîne d'authentification. |
| 29 | [Manuel de dépannage](ch29-troubleshooting.md) | Consultation rapide par symptôme pour localiser rapidement la cause racine. |

## Annexe

| # | Chapitre | Description |
| --- | --- | --- |
| Annexe | [Index de la documentation officielle](ch30-appendix.md) | Les adresses de documentation officielle de tous les produits tiers (URL en clair, consultables même après impression). |

---

> 🌐 Autres langues：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · [繁體中文](../admin-manual-zh-TW/index.md) · Français · [Español](../admin-manual-es/index.md) · [Português](../admin-manual-pt/index.md) · [日本語](../admin-manual-ja/index.md) · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
