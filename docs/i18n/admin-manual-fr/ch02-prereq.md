# Chapitre 2 : Préparation préalable

*Première partie · Déploiement*

> Installer Docker Desktop, préparer les répertoires, ouvrir le réseau, fixer l'IP — ce qu'il faut faire avant le déploiement.

[← Chapitre 1 : Vue d'ensemble et architecture de la plateforme](ch01-overview.md) · [📖 Index](index.md) · [Chapitre 3 : Fichiers de configuration et variables d'environnement →](ch03-env.md)

---

## 2.0 Deux méthodes de déploiement

Ce manuel peut être exécuté **manuellement chapitre par chapitre**, ou **confié à un outil d'Agent IA pour une exécution automatique**. Avec un Agent, fournissez ce répertoire (comprenant ce manuel, `docker-compose.yml`, `.env.example`, `scripts/`) à l'Agent et collez le prompt ci-dessous.

> **Prompt de déploiement à copier pour l'Agent :**
> Vous êtes l'ingénieur de déploiement d'une plateforme IA d'intranet d'entreprise. Sur la base de la partie « Déploiement » du Manuel de l'administrateur, de docker-compose.yml et de .env.example du présent répertoire, déployez et vérifiez intégralement la plateforme « AI AllInOne » sur cette machine. Communiquez en français tout au long du processus.
>
> Première étape — Collecte des paramètres (demandez-les un par un, sans sauter ni deviner) :
> 1) L'IP intranet des services exposés ; 2) le nom d'hôte du marché de Skills (nom de domaine, à remplacer dans mcp-gateway/skills/skill-market/config.json et SKILL.md là où figure <hôte-marché>, puis à résoudre via hosts/DNS) ; 3) la source d'identité (en cas de connexion à un contrôleur de domaine AD : domaine / IP du contrôleur / base DN LDAP / bind DN / mot de passe de bind / sAMAccountName) ; 4) le mot de passe du compte administrateur unifié ; 5) la clé API du grand modèle ; 6) selon les besoins, le webhook d'alerte, HTTPS et la politique de rétention des sauvegardes.
>
> Deuxième étape — Générez un fichier de progression, mettez-le à jour et faites un rapport après chaque élément terminé et chaque problème résolu.
>
> Troisième étape — Exécutez strictement dans l'ordre des chapitres 1 à 13 de ce manuel, en prêtant attention aux « ⚠️ pièges clés » de chaque chapitre, et privilégiez l'automatisation par les scripts du dossier scripts/.
>
> Quatrième étape — En cas d'erreur, consultez d'abord les journaux (docker logs, points de terminaison de santé, configuration) pour localiser la cause racine avant de corriger ; ne relancez pas aveuglément.
>
> Cinquième étape — Vérification complète : tous les conteneurs Up, SSO Keycloak, envoi d'une vraie conversation via NewAPI/LiteLLM pour valider l'anonymisation PII, connexion à la source d'identité, surveillance/journaux/alertes, sauvegarde et restauration ; récapitulez chaque point par ✅/❌.

> 💡 Sans Agent, ce texte peut aussi servir de « liste de contrôle des informations avant déploiement » : réfléchissez d'abord à ces quatre éléments — IP intranet, source d'identité, mot de passe administrateur, clé du modèle.

## 2.1 Installer et configurer Docker Desktop

Docker Desktop utilise par défaut le backend WSL2 après installation ; en général aucune configuration supplémentaire n'est nécessaire. Pour ajuster manuellement la limite de ressources, créez `.wslconfig` dans le répertoire utilisateur :

```
# %UserProfile%\.wslconfig (par exemple C:\Users\votre_nom_utilisateur\.wslconfig)
[wsl2]
memory=24GB       # Mémoire maximale de Docker (minimum 16 Go, recommandé 24 à 32 Go)
processors=8      # Nombre de cœurs CPU (selon les cœurs physiques)
swap=4GB
```

Après enregistrement, exécutez `wsl --shutdown` dans PowerShell, puis redémarrez Docker Desktop pour appliquer.

> ✅ Vérification : la barre d'état de Docker Desktop affiche « Engine running » (en vert).

## 2.2 Préparer la structure des répertoires

```
# PowerShell
mkdir dsh-updates
```

```
C:\ai-platform\windows\          # Racine de déploiement supposée
├─ docker-compose.yml           # Orchestration des services principaux
├─ .env.windows                 # Variables d'environnement (à renseigner avec la clé API)
├─ litellm-config.yaml          # Configuration d'anonymisation PII de LiteLLM
├─ dsh-updates\            # Répertoire d'hébergement des paquets DSH Desktop
├─ admin-portal\                # Implémentation du Centre d'administration IA
├─ mcp-gateway\                 # Passerelle Skill / MCP
├─ monitoring\                  # Configuration Prometheus / Loki
└─ scripts\                     # Scripts de sauvegarde / restauration / contrôle de santé / initialisation
```

## 2.3 Créer le réseau partagé Docker

```
docker network create ai-platform
docker network ls | findstr ai-platform   # Vérification
```

> Tous les conteneurs principaux communiquent via le réseau `ai-platform` en utilisant les noms de conteneurs (par exemple, NewAPI accède à LiteLLM via `http://litellm:4000`, sans passer par localhost).

## 2.4 Fixer l'IP intranet de l'hôte (important)

En Wi-Fi, l'IP de l'hôte est attribuée dynamiquement par DHCP ; elle change au redémarrage ou à l'expiration du bail — alors toutes les adresses d'accès des employés aux produits deviennent invalides. Il est recommandé de configurer une **réservation DHCP (liaison MAC)** sur le routeur :

1. Trouvez l'adresse MAC de la carte Wi-Fi : `ipconfig /all`, cherchez l'adresse physique de « Wireless LAN adapter WLAN » (par exemple `60-A3-E3-41-8F-61`) ;

2. Connectez-vous à l'interface du routeur (par exemple `http://192.168.31.1`) → Paramètres LAN / attribution d'IP statique DHCP ;

3. Ajoutez la règle : MAC → IP (par exemple `192.168.31.117`), enregistrez ;

4. Reconnectez-vous au Wi-Fi pour confirmer que l'IP est fixe.

> ✅ La réservation DHCP est plus fiable qu'une IP statique configurée dans Windows (gestion centralisée par le routeur, sans conflit).

## 2.5 Ouvrir le réseau (l'étape où l'on bloque le plus souvent)

- **Pouvoir atteindre les registres d'images Docker** : Docker Hub / quay.io / ghcr.io. Sinon, configurez d'abord un accélérateur de miroir (comme DaoCloud).

- **Pouvoir atteindre GitHub** : cloner les dépôts, récupérer les dépendances publiques. Sinon, utilisez un proxy ou téléchargez à l'avance les paquets sources.

- **La machine cible doit être accessible depuis l'intranet** : vérifiez que le segment réseau à exposer est joignable.

---

[← Chapitre 1 : Vue d'ensemble et architecture de la plateforme](ch01-overview.md) · [📖 Index](index.md) · [Chapitre 3 : Fichiers de configuration et variables d'environnement →](ch03-env.md)
