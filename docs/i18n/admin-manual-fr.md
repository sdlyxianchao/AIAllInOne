# Manuel de l'administrateur AI AllInOne

*v0.2 · Déploiement · Administration · Exploitation*

**Première partie · Déploiement**

## 1. Vue d'ensemble et architecture de la plateforme

### 1.1 Ce qu'est cette plateforme
« AI AllInOne » est une **plateforme IA d'intranet d'entreprise** qui orchestre une douzaine de produits open source au moyen de Docker pour en faire un tout : authentification unifiée, routage LLM, anonymisation PII, applications IA, portail d'entreprise, CI du code source, distribution des clients, administration unifiée, surveillance et alertes, observabilité, journaux, sauvegarde et restauration — tout est opérationnel, et **un seul compte Keycloak assure la connexion unique (SSO) à tous les produits**.
| Couche | Composant | Rôle |
| --- | --- | --- |
| Authentification unifiée | Keycloak | SSO / OIDC, compatible AD/LDAP ou comptes locaux |
| Routage LLM | NewAPI | Canaux, clés, quotas, audit, coûts |
| Anonymisation PII | LiteLLM + Presidio | Anonymise automatiquement numéros de téléphone, cartes d'identité, e-mails, etc. avant l'appel au modèle |
| Applications IA | Dify | Plateforme visuelle d'applications IA / Agents / bases de connaissances |
| Portail d'entreprise | Ghost | Annonces, actualités, centre de téléchargement, Hub des employés |
| Code source / CI | Gitea + Runner | Dépôt Git interne + automatisation Actions |
| Client | DeepChat | Client de bureau IA local (Win/macOS/Linux) |
| Distribution du client | Serveur de mise à jour | Hébergement des paquets d'installation DeepChat et mise à jour automatique |
| Administration unifiée | Centre d'administration IA | Point d'accès d'administration unique : Dashboard + produits intégrés + audit/coûts/rapports |
| Passerelle | MCP Gateway | Gestion du marché Skill / MCP |
| Surveillance et alertes | Prometheus + Grafana + Alertmanager | Surveillance des ressources des conteneurs + notifications d'alerte |
| Observabilité LLM | Langfuse | Trace / latence / token / coût de chaque appel au modèle |
| Journaux unifiés | Loki + Promtail | Agrégation et recherche des journaux de tous les conteneurs |
| Sauvegarde et restauration | Scripts backup / restore + page d'administration | Sauvegarde quotidienne complète des données + restauration en un clic |
### 1.2 Exigences matérielles et logicielles
| Élément | Exigence minimale | Configuration recommandée |
| --- | --- | --- |
| Système d'exploitation | Windows 11 (Docker Desktop + backend WSL2) | Windows 11 Pro / Entreprise (prise en charge supplémentaire de Hyper-V pour exécuter un contrôleur de domaine AD) |
| CPU | 4 cœurs / 8 threads | 8 cœurs / 16 threads |
| Mémoire | 16 Go | 32 Go |
| Disque | 60 Go de SSD disponible | 150 Go ou plus de SSD disponible |
| GPU | Pas de carte graphique dédiée requise | Pas de carte graphique dédiée requise |
> 📌 Selon les mesures réelles : environ 30 conteneurs au repos consomment environ 5 Go de mémoire au total ; le traitement/l'indexation de Dify, la JVM de Keycloak, le cache des bases de données, etc. ajoutent 3 à 5 Go en pic, plus la mémoire virtuelle de WSL2 — 16 Go est le minimum, 32 Go la valeur confortable. Tous les grands modèles passent par des API externes (deepseek-chat, etc.), aucune inférence n'est effectuée localement : **aucun GPU n'est requis**.
### 1.3 Tableau d'attribution des ports
Dans la suite, `<IP-du-serveur>` désigne l'adresse externe de l'hôte (dans l'environnement actuel `192.168.31.117` ; remplacez-la par votre propre IP intranet ou votre nom de domaine lors du déploiement).
| # | Produit | Usage | Accès local | Accès intranet (employés) |
| --- | --- | --- | --- | --- |
| 1 | Centre d'administration IA | Portail d'administration unifié | `127.0.0.1:10086` | `<IP-du-serveur>:10086` |
| 2 | Keycloak | Authentification / SSO | `127.0.0.1:9090` | `<IP-du-serveur>:9090` |
| 3 | NewAPI | Passerelle de routage LLM | `127.0.0.1:3000` | `<IP-du-serveur>:3000` |
| 4 | LiteLLM | Proxy d'anonymisation PII | `<IP-du-serveur>:4001` | — (appelé uniquement par NewAPI) |
| 5 | Dify | Plateforme d'applications IA | `127.0.0.1` | `<IP-du-serveur>` (port 80) |
| 6 | Ghost | Portail d'entreprise | `127.0.0.1:8090` | `<IP-du-serveur>:8090` |
| 7 | Gitea | Code source + CI/CD | `127.0.0.1:3002` | `<IP-du-serveur>:3002` |
| 8 | Serveur de mise à jour | Paquets d'installation DeepChat | `127.0.0.1:8091` | `<IP-du-serveur>:8091` |
| 9 | MCP Gateway | Passerelle Skill / MCP | `127.0.0.1:3100` | `<IP-du-serveur>:3100` |
| 10 | Grafana | Tableau de bord de surveillance | `127.0.0.1:3030` | `<IP-du-serveur>:3030` |
| 11 | Prometheus | Collecte de métriques / alertes | `127.0.0.1:9091` | `<IP-du-serveur>:9091` |
| 12 | Langfuse | Observabilité LLM | `127.0.0.1:3010` | `<IP-du-serveur>:3010` |
| 13 | Loki | Agrégation des journaux (interne) | `127.0.0.1:3110` | — (consultable via la page d'administration) |
| 14 | MailHog | Réception locale des e-mails | `127.0.0.1:8025` | `<IP-du-serveur>:8025` |
> ⚠️ Utilisez toujours l'**IP intranet** pour accéder aux services, jamais `localhost` (Docker Desktop WSL2 gère mal l'IPv6 `::1`, ce qui fait échouer la redirection de ports). Les bases de données (MySQL/Redis/PostgreSQL) ne sont pas exposées aux utilisateurs et ne communiquent qu'en interne sur le réseau Docker.
### 1.4 Flux de données principaux
#### Flux de requêtes LLM (la chaîne la plus critique)
1. **① Transfert** : DeepChat / Dify envoie la requête à NewAPI (`:3000/v1`) ;
2. **② Anonymisation** : NewAPI transfère à LiteLLM, qui remplace les numéros de téléphone, cartes d'identité, e-mails, etc. par `[xxx_REDACTED]` au moyen d'expressions régulières + Presidio ;
3. **③ Requête au modèle externe** : la requête anonymisée est envoyée à DeepSeek / GPT / Claude ;
4. **④ Restauration des PII** : au retour de la réponse, LiteLLM restaure les informations sensibles ;
5. **⑤ Retour** : le résultat final revient au client.
#### Quelques autres flux
- **Flux d'authentification** : SSO OIDC de Keycloak pour tous les produits Web (partageant `ai_all_in_one_admin`) ;
- **Flux d'observabilité** : `success_callback` de LiteLLM → Langfuse trace chaque appel ;
- **Flux de mise à jour automatique** : build Gitea Actions → serveur de mise à jour (:8091) → DeepChat vérifie `version.txt` et télécharge/installe automatiquement ;
- **Flux de journaux unifiés** : Promtail collecte les journaux de chaque conteneur → agrégation par Loki → consultation via la page « Journaux unifiés » du Centre d'administration IA.
### 1.5 Structure et navigation de ce manuel
Ce manuel se divise en trois parties : **Déploiement** (chapitres 1 à 13, pour faire fonctionner la plateforme de zéro), **Administration** (chapitres 14 à 26, les opérations quotidiennes de chacun des 13 produits), **Exploitation** (chapitres 27 à 29, sauvegarde / contrôle de santé / dépannage). La barre latérale permet de naviguer à tout moment, et des liens page précédente / page suivante se trouvent en bas de page.
> ✅ Le déploiement peut aussi être confié directement à un **outil d'Agent IA** (WorkBuddy / OpenClaw, etc.) pour l'automatiser : fournissez ce manuel + `docker-compose.yml` + `.env.example` + `scripts/` à l'Agent et demandez-lui d'exécuter les étapes dans l'ordre de la partie « Déploiement » (voir le prompt de déploiement pour l'Agent au début du chapitre 2).

## 2. Préparation préalable

### 2.0 Deux méthodes de déploiement
Ce manuel peut être exécuté **manuellement chapitre par chapitre**, ou **confié à un outil d'Agent IA pour une exécution automatique**. Avec un Agent, fournissez ce répertoire (comprenant ce manuel, `docker-compose.yml`, `.env.example`, `scripts/`) à l'Agent et collez le prompt ci-dessous.
**Prompt de déploiement à copier pour l'Agent :**
```
Vous êtes l'ingénieur de déploiement d'une plateforme IA d'intranet d'entreprise. Sur la base de la partie « Déploiement » du Manuel de l'administrateur, de docker-compose.yml et de .env.example du présent répertoire, déployez et vérifiez intégralement la plateforme « AI AllInOne » sur cette machine. Communiquez en français tout au long du processus.

Première étape — Collecte des paramètres (demandez-les un par un, sans sauter ni deviner) :
1) L'IP intranet des services exposés ; 2) le nom d'hôte du marché de Skills (nom de domaine, à remplacer dans mcp-gateway/skills/skill-market/config.json et SKILL.md là où figure <hôte-marché>, puis à résoudre via hosts/DNS) ; 3) la source d'identité (en cas de connexion à un contrôleur de domaine AD : domaine / IP du contrôleur / base DN LDAP / bind DN / mot de passe de bind / sAMAccountName) ; 4) le mot de passe du compte administrateur unifié ; 5) la clé API du grand modèle ; 6) selon les besoins, le webhook d'alerte, HTTPS et la politique de rétention des sauvegardes.

Deuxième étape — Générez un fichier de progression, mettez-le à jour et faites un rapport après chaque élément terminé et chaque problème résolu.

Troisième étape — Exécutez strictement dans l'ordre des chapitres 1 à 13 de ce manuel, en prêtant attention aux « ⚠️ pièges clés » de chaque chapitre, et privilégiez l'automatisation par les scripts du dossier scripts/.

Quatrième étape — En cas d'erreur, consultez d'abord les journaux (docker logs, points de terminaison de santé, configuration) pour localiser la cause racine avant de corriger ; ne relancez pas aveuglément.

Cinquième étape — Vérification complète : tous les conteneurs Up, SSO Keycloak, envoi d'une vraie conversation via NewAPI/LiteLLM pour valider l'anonymisation PII, connexion à la source d'identité, surveillance/journaux/alertes, sauvegarde et restauration ; récapitulez chaque point par ✅/❌.
```
> 💡 Sans Agent, ce texte peut aussi servir de « liste de contrôle des informations avant déploiement » : réfléchissez d'abord à ces quatre éléments — IP intranet, source d'identité, mot de passe administrateur, clé du modèle.
### 2.1 Installer et configurer Docker Desktop
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
### 2.2 Préparer la structure des répertoires
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 Créer le réseau partagé Docker
```
docker network create ai-platform
docker network ls | findstr ai-platform   # Vérification
```
> Tous les conteneurs principaux communiquent via le réseau `ai-platform` en utilisant les noms de conteneurs (par exemple, NewAPI accède à LiteLLM via `http://litellm:4000`, sans passer par localhost).
### 2.4 Fixer l'IP intranet de l'hôte (important)
En Wi-Fi, l'IP de l'hôte est attribuée dynamiquement par DHCP ; elle change au redémarrage ou à l'expiration du bail — alors toutes les adresses d'accès des employés aux produits deviennent invalides. Il est recommandé de configurer une **réservation DHCP (liaison MAC)** sur le routeur :
1. Trouvez l'adresse MAC de la carte Wi-Fi : `ipconfig /all`, cherchez l'adresse physique de « Wireless LAN adapter WLAN » (par exemple `60-A3-E3-41-8F-61`) ;
2. Connectez-vous à l'interface du routeur (par exemple `http://192.168.31.1`) → Paramètres LAN / attribution d'IP statique DHCP ;
3. Ajoutez la règle : MAC → IP (par exemple `192.168.31.117`), enregistrez ;
4. Reconnectez-vous au Wi-Fi pour confirmer que l'IP est fixe.
> ✅ La réservation DHCP est plus fiable qu'une IP statique configurée dans Windows (gestion centralisée par le routeur, sans conflit).
### 2.5 Ouvrir le réseau (l'étape où l'on bloque le plus souvent)
- **Pouvoir atteindre les registres d'images Docker** : Docker Hub / quay.io / ghcr.io. Sinon, configurez d'abord un accélérateur de miroir (comme DaoCloud).
- **Pouvoir atteindre GitHub** : cloner les dépôts, récupérer les dépendances publiques. Sinon, utilisez un proxy ou téléchargez à l'avance les paquets sources.
- **La machine cible doit être accessible depuis l'intranet** : vérifiez que le segment réseau à exposer est joignable.

## 3. Fichiers de configuration et variables d'environnement

### 3.1 Les trois fichiers de configuration principaux
| Fichier | Usage | À modifier ? |
| --- | --- | --- |
| `.env.windows` | Tous les mots de passe et clés API externes | **À modifier impérativement** : renseigner la clé API DeepSeek, les autres fournisseurs selon les besoins |
| `litellm-config.yaml` | Liste des modèles de LiteLLM + règles d'anonymisation PII | En général inchangé (si vous n'utilisez que DeepSeek, vous pouvez supprimer les entrées OpenAI/Claude) |
| `docker-compose.yml` | Orchestration des services principaux | Déjà préconfiguré (y compris `KC_HOSTNAME` de Keycloak + volumes persistants) |
### 3.2 Vue d'ensemble des variables d'environnement par catégorie
Ouvrez `.env` (copié depuis `.env.windows`) et configurez par ordre de priorité.
| Variable | Priorité | Description |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 Immédiate | Clé API LLM externe ; sans elle, la chaîne ne fonctionne pas |
| `LITELLM_MASTER_KEY` | 🔴 Immédiate | Clé d'authentification interne de LiteLLM, utilisée par NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 Immédiate | Mot de passe root de MySQL, à ne plus modifier après la première création |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 Immédiate | Mot de passe administrateur de Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 Immédiate | Chiffrement de session de NewAPI, chaîne aléatoire |
| `NEWAPI_CRYPTO_SECRET` | 🔴 Immédiate | Chiffrement des données de NewAPI, chaîne aléatoire |
| `ADMIN_PASSWORD` | 🔴 Immédiate | Mot de passe Global Admin du Centre d'administration IA |
| `SESSION_SECRET` | 🔴 Immédiate | Chiffrement de session du Centre d'administration IA, chaîne aléatoire |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 Peut être configuré plus tard | À créer d'abord dans Keycloak pour obtenir le Secret du Client OIDC (voir chapitre 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 Peut être configuré plus tard | Démarrez d'abord Gitea pour obtenir le Token dans l'interface (voir chapitre 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 À la demande | Décommentez lorsque nécessaire et modifiez `litellm-config.yaml` en conséquence |
| `GLOBAL_WEB_RATE_LIMIT` et autres limites de débit | ⚪ Par défaut | Réglé à 999999 en phase de test, à réduire en production selon le cas |
| `DEFAULT_QUOTA` | ⚪ Par défaut | Quota par défaut des nouveaux utilisateurs (en dollars) ; 100 = 100 dollars offerts au nouvel utilisateur |
| `GENERATE_DEFAULT_TOKEN` | ⚪ Par défaut | Génère automatiquement une clé initiale à l'inscription ; mettre true pour que l'utilisateur soit opérationnel dès la connexion |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ Par défaut | Les valeurs par défaut suffisent |
### 3.3 🔴 Configuration immédiate (à terminer avant le premier démarrage)
| Variable | Description | Comment l'obtenir | Format |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Clé LLM cloud de DeepSeek | Inscription sur https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | Clé d'administrateur interne de LiteLLM (pas une clé LLM externe) | Génération aléatoire (voir ci-dessous) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | Mot de passe MySQL | À définir soi-même ; **à ne plus modifier** après la première création | Libre |
| `KEYCLOAK_ADMIN_PASSWORD` | Mot de passe administrateur de Keycloak | À définir soi-même, ≥ 8 caractères | Libre |
| `NEWAPI_SESSION_SECRET` | Chiffrement de session de NewAPI | Génération aléatoire | 32 caractères |
| `NEWAPI_CRYPTO_SECRET` | Chiffrement des données de NewAPI | Génération aléatoire | 32 caractères |
| `ADMIN_PASSWORD` | Mot de passe administrateur du Centre d'administration IA | À définir soi-même, ≥ 8 caractères | Libre |
| `SESSION_SECRET` | Chiffrement de session du Centre d'administration IA | Génération aléatoire | 64 caractères |
Générer une chaîne aléatoire (PowerShell) :
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### Exemple de saisie de la clé API
```
# DeepSeek est configuré par défaut (décommentez et renseignez la clé)
DEEPSEEK_API_KEY=sk-votre_clé_DeepSeek_réelle

# Décommentez pour OpenAI / Claude, et décommentez le bloc model correspondant dans litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 Politique de modification des mots de passe
> ⚠️ `NEWAPI_DB_PASSWORD` concerne une base déjà créée : après modification, il faut supprimer le volume correspondant et le reconstruire (les données seront perdues) ; mieux vaut le fixer dès le début.  
> 
>     Les mots de passe d'administration comme `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` peuvent être modifiés dans l'interface de chaque produit ; mettez ensuite à jour `.env` en conséquence (simple aide-mémoire, sans impact sur l'exécution).
### 3.5 Explication de litellm-config.yaml
- `model_list` — définit les modèles externes disponibles ; NewAPI appelle via LiteLLM. Par défaut, seul `deepseek-chat` est activé ;
- `general_settings.master_key` — clé d'administrateur de LiteLLM, lit `LITELLM_MASTER_KEY` depuis `.env` ;
- L'anonymisation PII (Presidio) est actuellement **commentée temporairement** (l'API guardrail de la nouvelle version de LiteLLM a changé et n'est pas compatible) ; pour l'activer plus tard, voir le chapitre 25 ;
- Utilisez la version stable `v1.95.1` (`main-latest` a des bugs connus).

## 4. Démarrage des services principaux

### 4.1 Copier .env
```
# PowerShell
copy .env.windows .env
```
Docker Compose lit `.env` par défaut.
### 4.2 Démarrer tous les services principaux
```
docker compose -f docker-compose.yml up -d
```
Le premier démarrage télécharge toutes les images (environ 5 à 10 minutes selon la connexion).
| Image | Conteneur | Taille |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600 Mo |
| `calciumion/new-api` | new-api | ~200 Mo |
| `mysql:8.0` | new-api-db | ~600 Mo |
| `redis:7-alpine` | new-api-redis | ~40 Mo |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1 Go |
| `ghost:5-alpine` | ghost | ~150 Mo |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400 Mo |
| `nginx:alpine` | update-server | ~50 Mo |
| `node:20-alpine` | admin-portal | ~50 Mo |
### 4.3 Vérifier l'état des conteneurs
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Attendu : les 10 conteneurs principaux sont tous `Up`. Si un conteneur reste en `Restarting`, faites `docker logs nom_du_conteneur` pour voir la raison.
### 4.4 Correction d'un problème connu : Ghost forcé en SQLite
Si `ghost` reste en Restarting et que les journaux indiquent `Error: connect ECONNREFUSED <IP-du-serveur>:3306` — cela signifie qu'un ancien `config.production.json` pointant vers MySQL est resté dans le volume de données. Correction : déclarez explicitement SQLite dans `environment` du service ghost du compose :
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ Sous Windows + Docker Desktop WSL2, les données de volume sont enfermées dans le disque virtuel WSL2 et invisibles depuis le git bash de l'hôte ; impossible de supprimer directement `config.production.json` dans le volume — la seule voie est « la surcharge par variables d'environnement ». Ne faites pas non plus `docker volume rm windows_ghost-data` (vous perdriez les articles déjà publiés).
> ✅ Vérification : les journaux affichent `Ghost database ready` + `Ghost booted`, et `curl.exe -I http://127.0.0.1:8090` renvoie 200.
### 4.5 Vérifier l'accessibilité service par service
```
# Keycloak — 302 signifie OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redirection vers la page d'initialisation /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Serveur de mise à jour — 403 (répertoire vide, nginx tourne)
curl.exe -I http://127.0.0.1:8091
# Centre d'administration IA — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM est une pure API sans interface Web ; vérifiez depuis l'intérieur du conteneur :
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# Réponse attendue {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 Le proxy HTTP de Docker Desktop WSL2 peut rendre LiteLLM inaccessible depuis l'hôte (HEART / réponse vide) : c'est un bug connu, qui n'empêche pas NewAPI de l'appeler via le nom de conteneur.

## 5. Déploiement autonome de Dify

> 📌 Dify utilise le docker-compose officiel (environ 15 conteneurs), se déploie de façon autonome pour éviter les conflits de ports, et utilise son propre réseau par défaut (différent du réseau `ai-platform` des services principaux).
### 5.1 Cloner Dify
```
# Option A : GitHub (nécessite l'accès)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Option B : miroir officiel Gitee (recommandé en Chine)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 Corriger la compatibilité + copier les variables d'environnement
```
cd dify\docker

# Corriger le format env_file (compatibilité avec les anciennes versions de Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# Copier la variable d'environnement principale
copy .env.example .env

# Copier tous les sous-modèles (sandbox.env, etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Corriger le problème de validation en amont de Dify 1.16.1 (obligatoire)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# Vérification
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ Pourquoi il faut impérativement modifier `GRAPH_ENGINE_SCALE_UP_THRESHOLD` : Dify 1.16.1 a fait passer ce champ de « 0 autorisé » à « doit être > 0 », mais le modèle `shared.env` contient encore 0. Sans correction, les 4 conteneurs `docker-api-1` / `worker` / `worker_beat` / `api_websocket` crashent au démarrage avec le journal `ValidationError: Input should be greater than 0`.
### 5.3 Démarrer Dify
```
docker compose up -d
docker compose ps
```
> ✅ Tous les conteneurs sont `Up` (il est normal que `init_permissions` affiche Exited). Ouvrez `http://127.0.0.1/install` dans le navigateur pour initialiser le compte administrateur.
### 5.4 Corriger l'adresse WebSocket (sans quoi le client se reconnecte sans cesse à ws://localhost)
Dans `.env`, `NEXT_PUBLIC_SOCKET_URL` vaut par défaut `ws://localhost` ; en déploiement intranet, localhost dans le navigateur pointe vers l'ordinateur de l'utilisateur, d'où des échecs répétés de connexion du frontend (création d'application / débogage de workflow bloqués).
```
# Dans .env, remplacez par l'IP intranet
NEXT_PUBLIC_SOCKET_URL=ws://<IP-du-serveur>

# Dans docker-compose.yaml, modifiez également le fallback du service web
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<IP-du-serveur>}

# Reconstruisez le conteneur web pour appliquer
docker compose up -d web
```
> 📌 Après modification, forcez l'actualisation du navigateur (Ctrl+F5). Cette variable est lue à l'exécution : modifier .env + redémarrer web suffit, pas besoin de reconstruire l'image.
### 5.5 Récapitulatif des pièges
> ⚠️ **Le mot de passe de connexion est transmis en base64** : dans Dify 1.16.x, le champ `password` de l'API de connexion `POST /console/api/login` est le mot de passe encodé en base64. Un script doit d'abord faire `base64(mot_de_passe)` ; côté frontend, si « cliquer sur Connexion ne fait rien », un `GET /account/profile 401` dans la console est normal tant que l'on n'est pas connecté.
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<domaine-entreprise> \
  --new-password '<nouveau-mot-de-passe>' \
  --password-confirm '<nouveau-mot-de-passe>'
```
> ⚠️ **Réinitialisation du mot de passe administrateur oublié** : le hachage du mot de passe Dify est `pbkdf2_hmac('sha256', password, salt, 10000)` (10 000 itérations), irréversible ; réinitialisez via une commande de conteneur (nouveau mot de passe ≥ 8 caractères) :
>     
>     📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai · déploiement auto-hébergé https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak : Realm, utilisateurs et AD

> 📌 Accès : hôte `http://127.0.0.1:9090`, intranet `http://<IP-du-serveur>:9090`. Les données sont stockées dans le volume nommé `keycloak-data`, conservées lors de la reconstruction du conteneur. Les identifiants figurent dans `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` de `.env.windows`.
### 6.1 Créer un Realm
1. Ouvrez `http://127.0.0.1:9090` dans le navigateur → Administration Console → connexion administrateur ;
2. Menu déroulant en haut à gauche → **Create Realm** → saisissez `enterprise-ai` dans Realm name → Create.
### 6.2 Méthode A : créer des comptes locaux (petite équipe sans AD / tests)
1. **Groups** → Create Group → `ai-admin` ; puis `ai-user` ;
2. **Users** → Add user → nom d'utilisateur → Create ;
3. Onglet Credentials → définir le mot de passe → Temporary désactivé ;
4. Onglet Groups → ajouter au groupe `ai-user`.
### 6.3 Méthode B : importer des comptes depuis Active Directory (recommandé)
Lorsque l'entreprise dispose déjà d'un contrôleur de domaine Windows AD, les employés se connectent avec leur compte de domaine, sans création manuelle dans Keycloak. Prérequis : la connectivité réseau entre le conteneur Docker et le contrôleur de domaine est établie (topologie réseau, Hyper-V Internal Switch, redirection de ports : voir le « Guide d'intégration Keycloak AD » `windows-ad-integration.html`).
> 📌 Comptes AD requis : le compte de service `svc_keycloak` (mot de passe sans expiration, utilisé pour la liaison LDAP) + 2 utilisateurs de domaine de test (pour valider la synchronisation).
#### Créer une fédération d'utilisateurs LDAP
1. Realm enterprise-ai → **User Federation** à gauche → Add provider → **ldap** ;
2. Remplissez selon le tableau ci-dessous.
| Élément de configuration | Valeur | Description |
| --- | --- | --- |
| Vendor | **Active Directory** | Choisissez AD, pas Other (sinon objectGUID n'est pas reconnu) |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V via redirection de ports ; en production, renseignez `ldap://dc.domaine-entreprise:389` |
| Enable StartTLS | **Off** | LDAP 389 ou LDAPS 636 |
| Bind type | **simple** | Authentification par nom d'utilisateur + mot de passe |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **Doit être au format DN LDAP**, pas ~~DOMAINE\utilisateur~~ |
| Bind credentials | `mot de passe de svc_keycloak` | Voir `.env.windows` |
| Edit mode | **READ_ONLY** | Lecture seule, sans réécriture dans AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | En cas de sous-OU, mettez `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **Ne renseignez pas cn** |
| RDN LDAP attribute | `cn` | Attribut de nommage de l'entrée |
| UUID LDAP attribute | `objectGUID` | Identifiant unique immuable d'AD |
| User object classes | `person, organizationalPerson, user` | Séparés par des virgules |
| Search scope | **Subtree** | **Ne choisissez pas One Level** (sinon les sous-OU ne sont pas trouvés) |
| Pagination | **On** | Récupération par lots lorsqu'il y a beaucoup d'utilisateurs |
| Referral | **ignore** | Éviter de suivre un contrôleur de domaine inexistant |
| Import users | **On** | Import par synchronisation complète |
| Sync Registrations | **On** | Synchronisation immédiate à la première connexion |
Save → **Synchronize all users** → attendez la fin de la synchronisation.
- ⚠️ Erreurs de saisie fréquentes :
      
        Bind DN au **format LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), pas ~~DOMAINE\utilisateur~~ ;
- Username LDAP attribute = `sAMAccountName`, pas `cn` ;
- Search scope = **Subtree** ;
- **Les espaces dans le CN sont conservés tels quels** : si le nom d'affichage contient des espaces (par exemple `ai all in one admin` avec des espaces), le Bind DN doit être `CN=ai all in one admin,...` ; écrire des underscores empêchera la connexion.
#### Vérifier la connexion AD
1. Ouvrez `http://127.0.0.1:9090/realms/enterprise-ai/account` dans une fenêtre privée ;
2. Connectez-vous avec un compte de domaine (nom d'utilisateur `aitest1` ou UPN `aitest1@<domaine-entreprise>` acceptés) ;
3. La redirection réussie vers l'Account Console signifie que c'est validé.
### 6.4 Autres sources d'identité d'entreprise (résumé de l'annexe N)
Keycloak prend en charge plusieurs sources d'identité, toutes rattachées au même Realm `enterprise-ai` :
| Source d'identité | Méthode de connexion | Points clés |
| --- | --- | --- |
| Microsoft Entra ID (anciennement Azure AD) | Identity Providers → OpenID Connect v1.0 | Inscrivez une application dans Azure pour obtenir client id/secret, redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google (intégré) | Utilisable avec un Mapper pour limiter le domaine via `hd=domaine` |
| GitHub | Identity Providers → GitHub (intégré) | Callback OAuth App `/broker/github/endpoint` |
| LDAP générique (OpenLDAP/FreeIPA) | User Federation → ldap | Vendor sur Other, Username attribute avec `uid` |
| SAML 2.0 générique (Okta/ADFS) | Identity Providers → SAML v2.0 | Collez l'URL de métadonnées IdP pour un remplissage automatique |
> ✅ Coexistence de plusieurs sources d'identité : ajoutez un Identity Provider Redirector dans Authentication → Browser flow pour sélectionner automatiquement l'IdP selon le domaine de l'e-mail (`@entreprise.com`→AD, `@entreprise.onmicrosoft.com`→Entra ID).
> 📖 Documentation officielle :documentation officielle de Keycloak https://www.keycloak.org/documentation · guide d'administration du serveur https://www.keycloak.org/server/ · fédération LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

## 7. NewAPI : initialisation, canaux et OIDC

### 7.1 Assistant d'installation initiale (première visite)
Au premier démarrage, NewAPI affiche un assistant de configuration système en 4 étapes :
1. **Vérification de la base de données** : cliquez sur « Vérifier la connexion à la base de données », coche verte attendue.
> **Compte administrateur** : nom d'utilisateur `ai_all_in_one_admin`, e-mail `ai_all_in_one_admin@<domaine-entreprise>`, mot de passe administrateur unifié.
>         📌 Pourquoi créer d'abord un administrateur local : OIDC n'est pas encore configuré, NewAPI ne connaît pas Keycloak ; il faut d'abord un compte local pour « entrer » et terminer la configuration, puis activer OIDC dans les paramètres système.
3. **Mode d'utilisation** : choisissez « Usage personnel » (en interne : les employés peuvent s'inscrire, la consommation est séparée, pas de module de facturation/recharge).
4. **Confirmer l'initialisation** : créer les tables de la base → connexion administrateur.
### 7.2 Configurer le canal LLM (pointant vers LiteLLM)
1. **Canaux** → ajouter un nouveau canal → type `OpenAI` ;
2. Base URL : `http://litellm:4000` (nom de conteneur, via le réseau Docker, **pas localhost**) ;
3. Clé : la valeur réelle de `LITELLM_MASTER_KEY` dans `.env` (pas la valeur d'exemple, sinon erreur `No connected db`) ;
4. Modèle : `deepseek-chat` (exemple, selon la configuration réelle) ;
5. Enregistrer → cliquez sur « Tester » pour vérifier la connectivité.
Si plusieurs fournisseurs sont configurés, répétez l'ajout : Claude type `Anthropic Claude`, DeepSeek type `OpenAI`, Base URL toujours `http://litellm:4000`.
### 7.3 Créer des clés API
Créez-en une pour Dify et une pour DeepChat, pour séparer la statistique de consommation :
1. À gauche **Clés API** → nouvelle ;
2. Nom `dify-key` → enregistrer → copier `sk-xxx` (à renseigner dans le fournisseur de modèles de Dify) ;
3. Puis `deepchat-key` → copier `sk-xxx` (à distribuer aux utilisateurs DeepChat).
### 7.4 Autoriser les utilisateurs à demander une clé en libre-service
Après connexion, les employés peuvent par défaut créer leur propre clé dans la page « Clés API ». Pour pouvoir réellement appeler les modèles, deux conditions sont requises (déjà préréglées dans `.env`) :
1. **Un quota** : `DEFAULT_QUOTA=100` (100 dollars de quota offerts aux nouveaux utilisateurs) ;
2. **Un token** : `GENERATE_DEFAULT_TOKEN=true` (token initial généré à l'inscription).
> ⚠️ Ne s'applique qu'aux utilisateurs « nouvellement inscrits » : un utilisateur déjà connecté (comme `aitest1`) ne recevra pas automatiquement de token ; l'administrateur doit définir son quota manuellement dans la page « Utilisateurs ».
### 7.5 Intégrer Keycloak OIDC (pour que les utilisateurs AD se connectent directement)
#### ① Créer un Client OIDC NewAPI dans Keycloak
1. Realm enterprise-ai → **Clients** → Create client ;
2. Client ID `newapi`, type OpenID Connect ;
3. **Client authentication : On** (obligatoire, sinon pas d'onglet Credentials), Standard flow / Direct access grants : On ;
4. Valid redirect URIs : `http://<IP-du-serveur>:3000/*` et `http://127.0.0.1:3000/*` ;
5. Enregistrer → onglet Credentials → copier le Client secret.
#### ② Activer OIDC dans NewAPI
Interface NewAPI → **Paramètres système → Authentification → OAuth personnalisé → Ajouter un fournisseur OAuth**, renseignez :
| Groupe | Élément de configuration | Valeur |
| --- | --- | --- |
| Réglage rapide | Modèle prédéfini / Adresse API | `Keycloak` / `http://127.0.0.1:9090` |
| Informations de base | Nom du fournisseur / Identifiant | `Keycloak` / `keycloak` |
| Identifiants | Client ID / Secret | `newapi` / la valeur copiée depuis Keycloak |
| Points de terminaison | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mappage de champs | ID utilisateur / nom d'utilisateur / e-mail | `sub` / `preferred_username` / `email` |
Après avoir cliqué sur « Découverte automatique » pour renseigner les points de terminaison, **modifiez le point de terminaison de token et le point de terminaison d'informations utilisateur en `host.docker.internal:9090`** (appel interne de Keycloak par le conteneur NewAPI) ; le point de terminaison d'autorisation reste `<IP-du-serveur>:9090` (redirection du navigateur). Scope `openid profile email`.
- ⚠️ Deux modifications obligatoires, sinon la connexion échoue :
      
        **Après l'enregistrement, revenez dans Keycloak pour compléter l'URL de callback** : ajoutez `http://<IP-du-serveur>:3000/oauth/keycloak` et `http://127.0.0.1:3000/oauth/keycloak` dans Valid redirect URIs ;
- **Réglez l'« adresse du serveur » de NewAPI sur l'adresse intranet** : Paramètres système → Paramètres généraux → adresse du serveur `http://<IP-du-serveur>:3000` (par défaut localhost, ce qui provoque l'erreur `invalid_grant - Incorrect redirect_uri` lors de l'échange de token). Après modification, accédez aussi à NewAPI via l'IP intranet depuis la machine locale.
Méthode pour modifier la base de données :
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-du-serveur>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-du-serveur>:3000';"
docker compose restart new-api
```
> ⚠️ Dépannage : connexion renvoyant **429 Too Many Requests** — la limite de débit des interfaces critiques de NewAPI (20 fois / 20 minutes par défaut) est déclenchée. Levée temporaire : `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL` ; solution permanente déjà préréglée dans `.env` avec `CRITICAL_RATE_LIMIT_ENABLE=false` et trois autres groupes de variables.
> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai · dépôt open source https://github.com/QuantumNous/new-api

## 8. LiteLLM : vérification et cache

> ⚠️ L'anonymisation PII (guardrail Presidio) est actuellement **temporairement désactivée** : le format de configuration guardrail de la nouvelle version de LiteLLM a changé, la section correspondante de `litellm-config.yaml` est commentée ; actuellement LiteLLM ne fait que du transfert de proxy (sans anonymisation). La méthode d'activation figure au chapitre 25.
### 8.1 Vérifier le fonctionnement de base de LiteLLM
```
curl -X POST http://<IP-du-serveur>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` est la clé d'administrateur de LiteLLM : prenez la valeur réelle de `.env` (pas le placeholder lui-même, sinon 401). Utilisez impérativement l'IP intranet `<IP-du-serveur>:4001`, pas `127.0.0.1:4001` (problème de redirection de ports WSL2).
### 8.2 Cache de réponses (intégré, économise des tokens)
LiteLLM a déjà activé le cache Redis exact match : les requêtes strictement identiques (modèle + messages + paramètres) renvoient directement le cache, partagé entre utilisateurs, économisant des tokens.
```
# Fin de litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis de cache dédié
    port: 6379
    ttl: 3600            # Cache pendant 1 heure
```
> Vérification : `curl http://<IP-du-serveur>:4001/cache/ping -H "Authorization: Bearer <KEY>"` renvoie `ping_response: true` ; deux requêtes identiques consécutives : la seconde tombe à l'échelle de la milliseconde. Désactivation du cache : `cache: false` puis redémarrage de litellm.
### 8.3 Ajouter d'autres fournisseurs LLM
1. Dans `.env`, décommentez `# OPENAI_API_KEY=` et renseignez la clé ;
2. Dans `litellm-config.yaml`, décommentez le bloc model correspondant ;
3. `docker compose up -d litellm`.
> 📖 Documentation officielle :documentation officielle de LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. Configuration de Dify / Ghost / Gitea

### 9.1 Dify : configurer le fournisseur de modèles
1. Ouvrez `http://<IP-du-serveur>` → définissez d'abord l'e-mail/mot de passe administrateur (e-mail `ai_all_in_one_admin@<domaine-entreprise>`) ;
  - **Paramètres → Fournisseurs de modèles** → OpenAI-API-compatible → ajouter un modèle :
        
          Nom du modèle `deepseek-chat` (selon la réalité) ;
  - Clé API : le `sk-xxx` de `dify-key` ;
  - API endpoint : `http://host.docker.internal:3000/v1`.
3. Studio → créer un assistant de chat → choisir le modèle → envoyer un message pour valider.
> ⚠️ Dify utilise `host.docker.internal` et non le nom de conteneur, car Dify se trouve sur son propre réseau, différent de celui de NewAPI.
### 9.2 Ghost : configurer le portail
1. Interface d'administration `http://<IP-du-serveur>:8090/ghost/` (**attention au suffixe /ghost/**). La première visite suit l'assistant setup pour créer l'administrateur (e-mail `ai_all_in_one_admin@<domaine-entreprise>`, mot de passe ≥ 10 caractères) ;
2. Automatisation : lancez directement `scripts\ghost-setup.ps1` qui crée l'administrateur en une fois via l'API setup, équivalent à l'assistant (déjà initialisé, il passe automatiquement) ;
3. **Thème** : Apparence → Thèmes, activez directement Casper/Source inclus ;
4. **Menu de navigation** : Apparence → Menus → créez « Navigation principale ».
| Élément de menu | Type | URL |
| --- | --- | --- |
| Accueil | Page | `/` |
| Actualités | Catégorie | `/category/news` |
| Centre de téléchargement | Page | `/downloads` |
| Espace de travail IA | Lien personnalisé | `http://<IP-du-serveur>` |
| Documentation d'aide | Catégorie | `/category/docs` |
1. **Page du centre de téléchargement** : Pages → créer « Centre de téléchargement » (slug `downloads`), placez-y le lien intranet des paquets d'installation DeepChat.
```
## DeepChat Enterprise
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<IP-du-serveur>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<IP-du-serveur>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ Ne cliquez pas sur « S'inscrire » sur la page d'accueil `/` — c'est l'inscription des abonnés visiteurs (sans SMTP configuré, cela renvoie 500) ; l'entrée administrateur est `/ghost/`. N'installez pas la dernière version d'un thème depuis GitHub (peut cibler Ghost 6.x, incompatible avec 5.x).
### 9.3 Gitea : initialisation et enregistrement du Runner
1. Ouvrez `http://<IP-du-serveur>:3002` → assistant d'installation (base SQLite déjà préconfigurée) → créez l'administrateur (nom d'utilisateur `ai_all_in_one_admin`) ;
2. Avatar en haut à droite → **Site Administration → Actions** → vérifiez que Enabled Actions est activé ;
3. **Runners → Create new Runner** → copiez le Registration Token ;
4. Renseignez le Token dans `GITEA_RUNNER_TOKEN` de `.env`, puis reconstruisez le Runner :
```
# ⚠️ Utilisez impérativement up -d, pas restart (restart ne relit pas le token de .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ Piège 1 : l'erreur `readonly database` vient souvent de `gitea.db` appartenant à root ; supprimez cette base appartenant à root pour qu'elle soit reconstruite en tant qu'utilisateur git.  
> 
>     ⚠️ Piège 2 : `ROOT_URL` doit être `http://<IP-du-serveur>:3002/`, sinon les liens de dépôt générés sont en localhost et deviennent invalides pour les employés.
> 
>     📖 Documentation officielle :Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (en chinois) https://docs.gitea.com/zh-cn

## 10. Distribution de DeepChat et CI/CD

### 10.1 Chaîne de distribution
Chaîne de distribution = paquets GitHub Releases → Gitea Actions du dépôt `deepchat-sync` → serveur de mise à jour (:8091) → page de téléchargement Ghost → téléchargement par les employés.
> 📌 Le dépôt mirror du code source `deepchat` a été supprimé — le mirror ne synchronise que le code source git, pas les paquets de release, donc inutile pour la distribution. Recréez-le séparément si vous faites de l'audit de code source ou du développement secondaire.
### 10.2 Télécharger les paquets d'installation vers le serveur de mise à jour
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
Vérification : `curl -I http://<IP-du-serveur>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206. Mettez ensuite à jour la page de téléchargement Ghost (voir chapitre 9).
### 10.3 Synchronisation automatique (Gitea Actions, recommandé)
| Composant | Description |
| --- | --- |
| Dépôt `deepchat-sync` | Dépôt ordinaire (pas mirror), contenant `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Déclenchement | `schedule` (tous les jours à 2 h UTC) + `workflow_dispatch` (manuel) |
| Logique | Vérifie le dernier tag GitHub → compare `version.txt` → si nouvelle version : télécharge + met à jour la page Ghost + écrit la version |
```
# Déclencher manuellement une fois
curl -X POST "http://<IP-du-serveur>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<mot-de-passe>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ Pièges clés : ① le `container.network` d'act_runner doit être configuré via `config.yaml` (+ variable d'environnement `CONFIG_FILE`), sinon le conteneur du job ne peut pas résoudre le nom d'hôte `gitea` ; ② docker.sock est monté automatiquement par le runner, ne le montez pas à nouveau dans les options (erreur Duplicate mount point).
### 10.4 Configuration de la source de téléchargement en Chine (sync-config.json)
Sur le site officiel `deepchatai.cn`, les paquets de la page de téléchargement pointent encore vers GitHub, souvent inaccessibles en Chine. La vraie solution repose sur `sync-config.json` :
| Champ | Rôle | Défaut |
| --- | --- | --- |
| `version_source` | `github` (API GitHub la plus fiable) ou `official` (cache du site officiel, accessible mais en retard) | `github` |
| `download_prefix` | Préfixe d'accélération de téléchargement, par exemple `https://ghproxy.com/` | `""` |
| `keep_releases` | Nombre d'historiques de versions conservés | `5` |
| `market_url` | Adresse intranet du marché de la page de téléchargement « installer d'abord le gestionnaire de skills » | `http://<IP-du-serveur>:3100` |
```
# Accès GitHub possible : ne rien changer par défaut
{ "version_source": "github", "download_prefix": "" }
# Proxy d'accélération GitHub (le plus courant)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 Le workflow intègre la comparaison de versions `version_cmp.py` : ne télécharge que si « dernière version > version locale » (évite que le retard du cache officiel fasse revenir le client à une ancienne version).
### 10.5 Méthode B : build Docker d'une version personnalisée (optionnel)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# Dans le conteneur
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# Les artefacts sont dans dist/, copiez-les dans deepchat-updates/ après la sortie
```
### 10.6 Configurer le client DeepChat (côté employé)
1. DeepChat → Paramètres → Services de modèles → fournisseur personnalisé / compatible OpenAI ;
2. API Base URL : `http://<IP-du-serveur>:3000/v1` (IP intranet obligatoire) ;
3. Clé API : le `sk-xxx` de `deepchat-key` ;
4. Modèle : `deepseek-chat`, enregistrez puis testez une conversation.
> 📖 Documentation officielle :démarrage rapide DeepChat https://deepchatai.cn/docs/guide/getting-started/ · dépôt open source https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway et marché de Skills

> 📌 MCP Gateway est basé sur le SDK officiel `@modelcontextprotocol/sdk`, expose le point de terminaison Streamable HTTP standard `/mcp`, a été intégré au `docker-compose.yml` principal (port 3100) et démarre avec les services principaux. Le code source se trouve dans `mcp-gateway/`.
### 11.1 Outils intégrés de la plateforme
| Outil | Usage |
| --- | --- |
| `platform_time` | Renvoie l'heure actuelle du serveur |
| `platform_echo` | Renvoie le texte (test de connectivité) |
| `platform_services` | Liste l'inventaire des services de la plateforme |
### 11.2 Agréger des MCP Server externes
Modifiez `mcp-gateway/mcp-servers.json`, ajoutez des types stdio ou http, redémarrez `mcp-gateway` pour appliquer :
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
Les outils agrégés reçoivent automatiquement le préfixe `{serverName}_` pour éviter les doublons de noms.
### 11.3 Connexion des clients
1. DeepChat : Paramètres → MCP → ajouter un serveur → type « HTTP streamable », URL `http://<IP-du-serveur>:3100/mcp` ;
2. Workflow Dify : pointez la configuration d'outil personnalisé / d'outil MCP vers la même adresse.
> Vérification : `curl http://<IP-du-serveur>:3100/health` renvoie `{"status":"ok"}` ; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` renvoie la liste des outils.
### 11.4 Marché de Skills (distribution intranet de paquets de skills)
| Point de terminaison | Rôle |
| --- | --- |
| `/market` | Page du marché de Skills (navigation par cartes + téléchargement ZIP + copie de l'adresse d'installation) |
| `/skills` | JSON de l'inventaire des skills (name/description/version) |
| `/skills/<nom>.zip` | Téléchargement du paquet de skill (empaquetage dynamique) |
Les skills sont placés dans le répertoire `mcp-gateway/skills/` (sous-répertoires contenant SKILL.md), **analysés automatiquement à chaque requête, sans redémarrage**. Le skill de démarrage `skill-market` est inclus.
> 📌 Dans DeepChat, MCP et Skill sont deux notions différentes : MCP est un « outil » (function calling), Skill est un « paquet de compétences d'agent intelligent » (SKILL.md + scripts). Le Skill de DeepChat ne dispose pas d'« URL de marché personnalisée » : il ne prend en charge que l'installation par dossier / ZIP / URL, la distribution intranet s'appuie donc sur l'« installation par URL ».
### 11.5 ⚠️ Nom d'hôte du marché de Skills (paramètre de déploiement, à remplacer impérativement)
« Le gestionnaire de skills » lit le `market_url` de `config.json` pour requêter l'inventaire `/skills`. Deux points clés :
- **Utiliser un nom d'hôte, pas une IP** : l'environnement d'agent de DeepChat anonymise l'IP en `[IP_ADDRESS_REDACTED]`, rendant l'adresse réelle illisible ;
- **Le nom d'hôte est un paramètre de déploiement** : différent pour chaque déploiement, à ne pas copier tel quel.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<hôte-marché>:3100" }
```
##### Automatique (déploiement par Agent)
Lors de la collecte des paramètres, l'Agent demande le « nom d'hôte du marché de Skills » et remplace automatiquement `<hôte-marché>` dans `config.json` et `SKILL.md`.
##### Manuel
1. Modifiez `config.json` + l'adresse de secours de `SKILL.md`, remplacez `<hôte-marché>` ;
2. Rendez le nom d'hôte résolvable : sur une machine isolée, ajoutez `<IP-du-serveur>  <nom-d'hôte>` dans `C:\Windows\System32\drivers\etc\hosts` ; sur l'intranet de l'entreprise, ajoutez un enregistrement A dans le DNS.
> ✅ Pour le nom d'hôte, il est conseillé d'utiliser un FQDN « nom-de-service + domaine d'entreprise », par exemple `skillmarket.votre-domaine-entreprise`. Ajout d'un enregistrement A au DNS : contrôleur de domaine « DNS → zone de recherche directe → votre domaine → nouvel hôte (A) », ou `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "votre-domaine" -IPv4Address "<IP-du-serveur>"`.
### 11.6 API d'administration (pour les opérations CRUD du Centre d'administration IA)
| Point de terminaison | Rôle |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | CRUD des MCP Server (écriture de la configuration + reconnexion automatique) |
| `POST /api/skills/upload` | Téléverser un zip de skill (validation de SKILL.md, protection contre la traversée de chemin) |
| `DELETE /api/skills/:name` | Supprimer un skill |
En-tête `X-Admin-Token` requis (`MCP_ADMIN_TOKEN` de `.env`). Appelé par proxy via la page « MCP Gateway » du Centre d'administration IA (protégé par le rôle `ai-platform-admin`).
> 📖 Documentation officielle :protocole MCP officiel https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. Centre d'administration IA

> 📌 Positionnement : ce n'est pas une plateforme de gestion Docker (1Panel/Portainer), mais une console d'administration unifiée destinée aux administrateurs — authentification Keycloak + menu de gauche liant tous les produits + état du cluster dans le Dashboard + compte administrateur unifié.
### 12.1 Capacités principales
| Élément de menu | Comportement | Description |
| --- | --- | --- |
| 📊 Tableau de bord général | Page intégrée | 8 indicateurs métier des produits + services Docker (groupés par produit) + informations système |
| Ghost / Dify / Gitea / Keycloak | Page de statistiques intégrée | Voir d'abord les statistiques, cliquer sur « Ouvrir l'interface » pour basculer |
| 🔀 Gestion NewAPI | Page intégrée | Canaux/utilisateurs/clés + rapports de coûts + journal d'audit |
| 🔌 MCP Gateway | Page d'administration intégrée | Ajouter/supprimer des MCP Server, téléverser/supprimer des Skills |
| 📈 Surveillance / 🔍 Observabilité | Nouvel onglet | Grafana :3030 / Langfuse :3010 |
| 📜 Journaux unifiés | Page intégrée | Interroger Loki par conteneur + mot-clé + temps |
| 💾 Sauvegarde et restauration | Page intégrée | Liste des sauvegardes + sauvegarde immédiate + restauration en un clic |
| 🩺 Test de disponibilité | Page intégrée | Test de toute la chaîne en planifié + manuel |
| 📄 Génération de rapports | Page intégrée | Export .md à période personnalisable |
| ⚙️ Paramètres système | Page intégrée | 9 langues d'interface + URL d'accès des produits |
### 12.2 Initialiser le Global Administrator
```
# Configuration dans .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=voir la liste des comptes et mots de passe
ADMIN_EMAIL=ai_all_in_one_admin@<domaine-entreprise>
```
Au démarrage, l'utilisateur `ai_all_in_one_admin` est créé automatiquement dans Keycloak (ignoré s'il existe déjà), avec le rôle Realm `ai-platform-admin`. Principe fondamental : **un seul compte Global Admin pour gérer toute la plateforme**.
### 12.3 Déploiement Docker Compose
```
# Prérequis : installer d'abord les dépendances (une fois)
cd admin-portal
npm install
cd ..
```
```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<IP-du-serveur>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<domaine-entreprise>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<IP-du-serveur>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```
### 12.4 Configuration du client Keycloak
1. Keycloak → enterprise-ai → Clients → Create ;
2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow : On ;
3. Valid Redirect URIs : `http://127.0.0.1:10086/*` et `http://<IP-du-serveur>:10086/*` ;
4. Copiez le Client Secret → renseignez `KEYCLOAK_CLIENT_SECRET` de `.env` → `docker compose up -d admin-portal` ;
5. Créez le rôle Realm `ai-platform-admin`, assignez-le à `ai_all_in_one_admin`.
- ⚠️ Points de déploiement / dépannage :
      
        La session d'admin-portal est stockée en mémoire ; `up -d` reconstruisant le conteneur **vide la session de connexion** (reconnexion nécessaire) ;
- La page d'accueil `/` doit être protégée par Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explicite), sinon un tableau de bord vide est rendu sans connexion ;
- Pour les statistiques Dify, utilisez l'e-mail administrateur réel (`ai_all_in_one_admin@<domaine-entreprise>`, identique à l'admin global AD) ;
- **Après modification de server.js, faites impérativement `docker restart admin-portal`**, pas `up -d` (le changement de contenu du volume ne déclenche pas la reconstruction).
### 12.5 Vérification
1. Ouvrez `http://<IP-du-serveur>:10086` → redirection automatique vers la connexion Keycloak (pas de tableau de bord vide sans connexion) ;
2. Connectez-vous avec `ai_all_in_one_admin` → entrez dans le tableau de bord général ;
3. Le Dashboard affiche 8 indicateurs de produits + regroupement des conteneurs ;
4. Cliquez sur chaque produit pour voir les statistiques, puis sur « Ouvrir l'interface » pour basculer ;
5. Les paramètres système permettent de changer de langue parmi 9 langues.
### 12.6 Autorisation d'admin par module + gestion de la page Keycloak (v0.91)
L'administrateur global peut gérer les autres administrateurs et Keycloak depuis l'AI Admin Center :
- **Comptes administrateurs** : recherchez un compte existant dans l'IdP Keycloak (utilisateurs AD/LDAP, pas de nouveau compte, pas de mot de passe) → choisissez les modules → confirmez. Le système attribue le rôle de domaine `admin:<produit>` et **provisionne réellement le produit** (SSO d'abord, API en secours) : Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Révoquer un module ou supprimer un admin **supprime le compte du produit**. Les produits sans SSO génèrent un mot de passe temporaire, visible via l'icône 🔑 (admin global uniquement). Les non-admins voient une boîte « Vous n'êtes pas administrateur » et sont déconnectés.
- **Page Keycloak** : boutons « Tout synchroniser / Sync. modifiés » pour récupérer les changements AD en un clic ; chaque ligne utilisateur a « Modifier » (vers la console Keycloak) et « Supprimer » ; la section rôles permet de créer/supprimer des rôles et de voir les membres. Actions sync/suppr/rôles réservées à l'admin global.
> ⚠️ Note : Keycloak n'a pas d'endpoint « sync utilisateur unique » — la sync incrémentale récupère tous les comptes AD modifiés. Les utilisateurs fédérés AD réapparaissent après la prochaine sync complète ou leur prochaine connexion SSO ; pour les supprimer définitivement, désactivez/supprimez le compte dans AD.

## 13. Liste de vérification de l'interconnexion

La partie Déploiement s'achève ici. Vérifiez enfin les 12 éléments ci-dessous un par un ; tous ✅ signifient que la plateforme fonctionne réellement de bout en bout.
| # | Interconnexion | Méthode de vérification |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | Le test de canal NewAPI reçoit OK |
| 2 | Dify → NewAPI | Le test du fournisseur de modèles Dify reçoit une réponse |
| 3 | DeepChat → NewAPI | DeepChat envoie un message et reçoit une réponse |
| 4 | Keycloak → NewAPI | Connexion OIDC à NewAPI avec un compte Keycloak |
| 5 | Keycloak → Dify | Connexion SSO à Dify avec un compte Keycloak |
| 6 | MCP Gateway → DeepChat | DeepChat obtient la liste des outils MCP et les appelle |
| 7 | MCP Gateway → Dify | Le workflow Dify appelle un outil MCP |
| 8 | Gitea Runner → Docker | Le Runner peut exécuter des tâches CI/CD |
| 9 | Gitea → Serveur de mise à jour | Les artefacts CI peuvent être téléversés vers le serveur de mise à jour |
| 10 | Ghost API → Gitea | Gitea Actions peut appeler l'API Ghost pour publier des annonces |
| 11 | Ghost → redirection Dify | L'« Espace de travail IA » du portail redirige correctement vers Dify |
| 12 | Centre d'administration IA | Le Dashboard affiche tous les conteneurs + le menu de gauche permet d'accéder à tous les produits |
> ✅ Une fois tous validés, poursuivez avec la deuxième partie « Administration » pour apprendre les opérations quotidiennes de chaque produit, puis la troisième partie « Exploitation » pour la sauvegarde, le contrôle de santé et le dépannage.

**Deuxième partie · Administration (opérations quotidiennes de chaque produit)**

## 14. Administration quotidienne de Keycloak

Keycloak**Accès** : http://<IP-du-serveur>:9090 → Administration Console → connexion administrateur.
> 📌 Beaucoup de ces opérations peuvent aussi être faites depuis l'AI Admin Center → page Keycloak (admin global uniquement) : synchronisation LDAP complète/incrémentale, suppression d'utilisateurs, gestion des rôles (lister/créer/supprimer/voir les membres). Voir chapitre 12.6.
### 14.1 Gérer les utilisateurs
1. **Nouvel utilisateur** : Users → Add user → saisir le nom d'utilisateur → Create ;
2. **Définir le mot de passe** : onglet Credentials de l'utilisateur → définir le mot de passe → Temporary désactivé (sinon changement forcé à la première connexion) ;
3. **Réinitialiser le mot de passe** : Users → trouver l'utilisateur → Credentials → Set password ;
4. **Désactiver/activer** : commutateur Enabled en haut du détail utilisateur (une fois désactivé, tous les SSO de cet utilisateur cessent immédiatement) ;
5. **Supprimer** : détail utilisateur → Delete.
### 14.2 Rôles et autorisations
- **Realm Role** : Realm roles → Create role pour créer un rôle (par exemple `ai-platform-admin`) ;
- **Assigner un rôle** : utilisateur → Role mapping → Assign role ;
- **Groupes** : Groups → créer des groupes (`ai-admin` / `ai-user`) → ajouter des utilisateurs au groupe ; le rôle est attribué au groupe, les utilisateurs héritent des autorisations via le groupe.
> ✅ Les autorisations d'administration sont contrôlées de façon unifiée par le rôle `ai-platform-admin` ; les produits l'utilisent pour identifier les administrateurs lors de l'intégration SSO.
### 14.3 Clients OIDC (intégrer un nouveau produit en SSO)
1. Clients → Create client → Client ID = nom du produit (par exemple `newapi` / `grafana` / `langfuse`) ;
2. Client authentication : On (sinon pas d'onglet Credentials), Standard flow : On ;
3. Valid redirect URIs / Web origins : renseignez l'adresse de callback du produit (ajoutez l'IP intranet et 127.0.0.1) ;
4. Enregistrer → onglet Credentials, copiez le Client secret pour le produit.
### 14.4 Maintenance de la fédération AD / LDAP
- **Modifier contrôleur de domaine / mot de passe** : User Federation → cliquer sur le fournisseur LDAP → modifier Connection URL / Bind credentials → Save ;
- **Synchronisation manuelle** : Synchronize all users ;
- **Mappage de groupes** : onglet Mappers → group-ldap-mapper → définir le conteneur où se trouvent les groupes AD dans Groups DN, pour mapper les groupes AD en rôles Keycloak.
### 14.5 Gestion des sessions
- **Voir les sessions actives** : Users → un utilisateur → Sessions ;
- **Déconnexion forcée** : Sessions → Sign out all ;
- **Configuration globale des sessions / tokens** : Realm settings → onglets Sessions / Tokens pour régler les délais d'expiration.
> ⚠️ Rappel des pièges clés : ① les espaces du CN du bind DN sont conservés tels quels ; ② Username LDAP attribute = `sAMAccountName`, pas `cn` ; ③ Search scope = Subtree ; ④ une erreur SSO `unknown_error` vient souvent de l'arrêt d'iphlpsvc sur l'hôte, qui fait échouer la redirection de ports AD ; ⑤ lorsque la VM du contrôleur de domaine AD est éteinte, la connexion des comptes fédérés LDAP renvoie `LDAP Connection refused`.
> 📖 Documentation officielle :documentation officielle de Keycloak https://www.keycloak.org/documentation · guide d'administration du serveur https://www.keycloak.org/server/

## 15. Administration quotidienne de NewAPI

NewAPI**Accès** : http://<IP-du-serveur>:3000.
### 15.1 Gestion des canaux (modèles en amont)
1. **Ajouter un canal** : Canaux → ajouter un nouveau canal → type OpenAI (ou Claude, etc.) → Base URL `http://litellm:4000` → clé `LITELLM_MASTER_KEY` → renseigner le nom du modèle → enregistrer ;
2. **Tester** : dans la liste des canaux, cliquez sur « Tester », choisissez un modèle pour vérifier la connectivité ;
3. **Désactiver/activer** : commutateur de la liste des canaux ; une fois désactivé, le canal ne reçoit plus de requêtes ;
4. **Priorité / poids** : avec plusieurs canaux pour un même modèle, répartissez par priorité/poids.
### 15.2 Gestion des tokens (clés API)
1. **Créer** : Clés API → nouveau token → nommer (par exemple `deepchat-key`) → définir éventuellement quota/expiration/restriction de modèles → enregistrer ;
2. **Copier la clé** : commence par `sk-`, **affichée une seule fois, sauvegardez immédiatement** ;
3. **Désactiver/supprimer** : opérations de la liste des tokens (une fois désactivée, la clé cesse immédiatement) ;
4. **Consulter la consommation** : le détail du token montre le quota déjà consommé.
### 15.3 Quotas et utilisateurs
- **Quota par défaut des nouveaux utilisateurs** : `DEFAULT_QUOTA` (100 dollars conseillés) ;
- **Augmenter le quota d'un utilisateur** : page Utilisateurs → modifier l'utilisateur → définir le quota ;
- **Recharger/bannir** : opérations de la page Utilisateurs ;
- **Gestion par groupes** : créez des groupes par service, définissez des multiplicateurs de modèles / quotas ; les utilisateurs rattachés à un groupe sont gérés selon le service.
### 15.4 Journaux et coûts
- **Page Journaux** : consulter utilisateur/modèle/token/quota/coût/IP source de chaque appel ;
- **Rapport de coûts** : la page « Gestion NewAPI » du Centre d'administration IA offre un rapport de coûts agrégé par utilisateur/modèle/date + les 100 derniers journaux d'audit.
> 📌 L'enregistrement de l'IP du client dépend du paramètre utilisateur « Enregistrer le journal IP » (`record_ip_log`, désactivé par défaut) ; activez-le pour l'utilisateur concerné lorsque l'audit d'IP est requis.
### 15.5 Points de réglage système
- **Adresse du serveur** : doit être réglée sur l'adresse intranet `http://<IP-du-serveur>:3000` (sinon OIDC renvoie `invalid_grant - Incorrect redirect_uri`) ;
- **Authentification → OAuth personnalisé** : intégration Keycloak OIDC (voir chapitre 7) ;
- **Mode d'utilisation** : commutable entre usage personnel et exploitation externe.
> ⚠️ Rappel des pièges clés : ① renseignez toujours le nom de conteneur `http://litellm:4000` dans la Base URL des canaux ; ② la limite de débit 429 se contrôle par `CRITICAL_RATE_LIMIT_ENABLE=false` et les variables associées ; ③ pour modifier la base, utilisez directement la variable d'environnement `MYSQL_PWD` afin d'éviter qu'un avertissement de mot de passe sur stderr soit pris pour une erreur.
> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai · dépôt open source https://github.com/QuantumNous/new-api

## 16. Administration quotidienne de LiteLLM

**Accès** : http://<IP-du-serveur>:4001 (pure API, sans interface Web ; pour le débogage, utilisez `/v1/models`). La configuration se trouve dans `litellm-config.yaml`.
### 16.1 Maintenance de la liste des modèles
Modifiez `model_list` de `litellm-config.yaml` pour ajouter/supprimer des modèles et les clés API correspondantes. Étapes pour ajouter un nouveau fournisseur :
1. Dans `.env`, décommentez `# OPENAI_API_KEY=` et renseignez la clé ;
2. Dans `litellm-config.yaml`, décommentez le bloc model correspondant ;
3. `docker compose up -d litellm`.
### 16.2 Cache de réponses
Cache Redis exact match, partagé entre utilisateurs pour les requêtes strictement identiques. Ajustez `cache_params.ttl` (3600 secondes par défaut). Désactivation : `cache: false` puis redémarrage.
### 16.3 Remontée vers Langfuse
Via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` de `.env`, chaque appel est automatiquement remonté.
### 16.4 Redémarrage et dépannage
```
docker compose restart litellm          # Redémarrer après modification de la configuration
docker logs litellm --tail 50           # Consulter les journaux
```
> ⚠️ Pièges clés : ① les guardrails nécessitent `default_on: true` pour s'appliquer globalement ; ② l'anonymisation PII (Presidio) est actuellement commentée en raison d'un changement d'API en amont, elle ne fait que du proxy pur ; ③ utilisez la version stable `v1.95.1` (`main-latest` a des bugs).
> 📖 Documentation officielle :documentation officielle de LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. Administration quotidienne de Dify

Dify**Accès** : http://<IP-du-serveur> (port 80, compose officiel autonome ; la montée de version et la maintenance s'effectuent séparément dans `dify/docker/`).
### 17.1 Gestion des applications (Studio)
1. **Créer une application** : Studio → créer une application vide → choisir le type (assistant de chat / Agent / workflow / génération de texte) ;
2. **Orchestration** : glisser-déposer des nœuds pour composer les prompts, outils, bases de connaissances, variables ;
3. **Débogage** : « Aperçu » en haut à droite pour lancer le débogage ;
4. **Publication** : après validation du débogage, « Publier » → générer un lien de partage ou intégrer l'application Web.
### 17.2 Gestion des bases de connaissances
1. Bases de connaissances → créer une base ;
2. Téléverser des documents (Word / PDF / Markdown / lien de page Web), choisir la règle de segmentation + le mode d'indexation (haute qualité / économique) ;
3. « Ajouter » cette base dans l'application pour que l'IA réponde à partir des documents.
> 📌 Le contenu de la base de connaissances est utilisé par l'IA pour répondre ; ne téléversez pas de documents confidentiels (respectez la politique de classification des données).
### 17.3 Fournisseurs de modèles
- **Ajouter un modèle** : Paramètres → Fournisseurs de modèles → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key` ;
- **Réglage des modèles système** : définir les modèles de chat / raisonnement / embedding par défaut.
### 17.4 Membres et autorisations
- **Membres** : inviter des membres dans l'espace de travail, définir les rôles Owner/Admin/Editor/Normal ;
- **Méthode de connexion** : Paramètres → Méthode de connexion → possibilité d'intégrer OIDC (Keycloak) pour le SSO.
### 17.5 Mise à niveau et maintenance
```
cd dify\docker
git pull                          # Récupérer la dernière version
docker compose pull               # Récupérer les nouvelles images
docker compose up -d              # Reconstruire
```
> ⚠️ Pièges clés : ① la WebSocket `NEXT_PUBLIC_SOCKET_URL` doit être réglée sur l'IP intranet ; ② le mot de passe de connexion est encodé en base64 ; ③ en cas de mot de passe oublié, utilisez `docker exec docker-api-1 flask reset-password` (≥ 8 caractères).
> 📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai · auto-hébergé https://docs.dify.ai/getting-started/install-self-hosted

## 18. Administration quotidienne de Ghost

Ghost**Accès** : frontal http://<IP-du-serveur>:8090 ; administration http://<IP-du-serveur>:8090/ghost/ (attention au suffixe /ghost/).
### 18.1 Connexion à l'administration
L'administration de Ghost 5 est **à connexion sans mot de passe** : saisissez l'e-mail → Ghost envoie un code de vérification à 6 chiffres vers MailHog (`:8025`). Méthode plus rapide : dans le Centre d'administration IA, cliquez sur « Ouvrir » du bouton « Administration Ghost », la connexion se fait automatiquement (calcul local du code TOTP, sans consulter les e-mails).
### 18.2 Publier du contenu
1. **Articles** : Posts → New post → écrire le contenu (éditeur Markdown) → Publish ;
2. **Pages** : Pages → New page (par exemple « Centre de téléchargement » slug `downloads`) ;
3. **Étiquettes / catégories** : Tags → créer des catégories (par exemple `news` / `docs`), classer les articles dans les catégories.
### 18.3 Menu de navigation
1. Administration → Apparence (Design) → Menus (Navigation) ;
2. Modifiez le menu principal « Primary », ajoutez Accueil / Actualités / Centre de téléchargement / Espace de travail IA / Documentation d'aide (voir le tableau des menus du chapitre 9).
### 18.4 Thèmes
- **Changer** : Apparence → Thèmes, activez directement Casper / Source inclus ;
- **Installer** : marché des thèmes (Design → Change theme) ou téléversement d'un zip.
> ⚠️ N'installez pas la dernière version d'un thème depuis GitHub (peut cibler Ghost 6.x, incompatible avec 5.x) ; installez plutôt l'ancienne version en zip.
### 18.5 Membres et abonnements (si nécessaire)
- Members : gérer les abonnés ;
- Si l'abonnement n'est pas nécessaire, ce module peut être ignoré (généralement inutile pour un portail intranet).
### 18.6 Intégrations (jeton API)
1. Administration → Settings → Integrations → ajouter une intégration personnalisée ;
2. Générez une clé API d'administration (format `id:secret`), utilisée par Gitea Actions pour publier des annonces et autres automatisations.
> ⚠️ Pièges clés : ① ne cliquez pas sur « S'inscrire » sur la page d'accueil `/` (c'est l'inscription des abonnés visiteurs) ; ② le code à 6 chiffres est essentiellement un TOTP, le Centre d'administration IA peut le calculer localement ; ③ même avec un calcul local du code, Ghost envoie réellement l'e-mail, donc MailHog doit être conservé (sinon `Failed to send email`).
> 📖 Documentation officielle :documentation officielle de Ghost https://ghost.org/docs/ · console d'administration https://ghost.org/docs/admin/

## 19. Administration quotidienne de Gitea

Gitea**Accès** : Web http://<IP-du-serveur>:3002 ; SSH `ssh://git@<IP-du-serveur>:2222`.
### 19.1 Dépôts et organisations
1. **Créer un dépôt** : + en haut à droite → New repository ;
2. **Créer une organisation** : + → New organization, créez des dépôts et gérez des équipes sous l'organisation ;
3. **Migrer un dépôt externe** : + → New migration, renseignez l'adresse GitHub pour faire un mirror (synchronisation du code source en lecture seule).
### 19.2 Utilisateurs et autorisations
- **Ajouter un utilisateur** : Site Administration → User Accounts → Create user ;
- **Autorisations de dépôt** : dépôt → Settings → Collaborators ;
- **Équipes d'organisation** : organisation → Teams → créer une équipe → ajouter des membres → attribuer des autorisations de dépôt.
### 19.3 Gestion des Actions / Runners
1. **Activer Actions** : Site Administration → Actions → Enabled ;
2. **Enregistrer un Runner** : Runners → Create new Runner → copier le Token → renseigner `GITEA_RUNNER_TOKEN` de `.env` → `docker compose up -d gitea-runner` ;
3. **Voir l'état du Runner** : la page Runners affiche Idle (vert) quand tout va bien ;
4. **Exécuter un workflow** : dépôt → Actions → exécution manuelle ou déclenchement par push.
> ⚠️ Pour changer le token du Runner, utilisez impérativement `up -d` (restart ne relit pas .env).
### 19.4 Paramètres du site
- **ROOT_URL** : `GITEA__server__ROOT_URL` doit être réglé sur l'adresse intranet `http://<IP-du-serveur>:3002/`, sinon les liens de dépôt générés sont en localhost ;
- **Politique d'inscription** : Site Administration → Config pour régler l'inscription et la configuration e-mail.
> ⚠️ Piège clé : l'erreur `readonly database` vient souvent de `gitea.db` appartenant à root ; supprimez cette base appartenant à root pour qu'elle soit reconstruite en tant qu'utilisateur git.
> 📖 Documentation officielle :documentation officielle de Gitea (en chinois) https://docs.gitea.com/zh-cn · administration https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. Administration quotidienne de MCP Gateway

**Accès** : http://<IP-du-serveur>:3100 (page du marché `/market`). La gestion s'effectue via la page « MCP Gateway » du Centre d'administration IA (rôle `ai-platform-admin`), ou directement par l'API d'administration.
### 20.1 Gérer les MCP Server
1. Modifiez `mcp-gateway/mcp-servers.json` pour ajouter/supprimer des serveurs (deux types stdio/http) ;
2. Redémarrez `docker compose restart mcp-gateway` ;
3. Ou ajoutez/supprimez via la page MCP Gateway du Centre d'administration IA (écriture de la configuration + reconnexion automatique).
### 20.2 Gérer les Skills (paquets de compétences)
1. **Téléverser** : page MCP Gateway du Centre d'administration IA → téléverser un zip de skill (validation de la présence de SKILL.md, protection contre la traversée de chemin) ;
2. **Supprimer** : supprimer le skill correspondant ;
3. Les skills sont placés dans `mcp-gateway/skills/` (sous-répertoires contenant SKILL.md), analysés automatiquement à chaque requête, sans redémarrage.
### 20.3 Étendre les outils intégrés
Ajoutez deux étapes dans `mcp-gateway/gateway.js` :
```
// ① Définition de l'outil (ajouter un élément au tableau builtinTools)
{ name: 'platform_health', description: 'Consulter l'état de santé du service',
  inputSchema: { type: 'object', properties: {} } }

// ② Logique d'exécution (ajouter une branche dans callBuiltin)
if (name === 'platform_health') { return 'Tous les services fonctionnent normalement'; }
```
Après modification, `docker compose restart mcp-gateway`.
### 20.4 Maintenir l'adresse du marché skill-market
Le `market_url` du « gestionnaire de skills » se trouve dans `mcp-gateway/skills/skill-market/config.json` + `SKILL.md` ; il doit utiliser un nom d'hôte (pas une IP), c'est un paramètre de déploiement (voir chapitre 11).
> ⚠️ L'API d'administration requiert l'en-tête `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`) ; non configuré → 503, mauvais token → 401.
> 📖 Documentation officielle :protocole MCP officiel https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. Administration du serveur de mise à jour

**Accès** : http://<IP-du-serveur>:8091, données dans `deepchat-updates/`.
### 21.1 Déposer manuellement une nouvelle version
1. Téléchargez le paquet d'installation officiel DeepChat dans `deepchat-updates/deepchat/` ;
2. Mettez à jour `version.txt` (écrivez le nouveau numéro de version) ;
3. Lors de la mise à jour automatique côté employé, DeepChat vérifie `version.txt`, détecte la nouvelle version et la télécharge/installe.
### 21.2 Synchronisation automatique (recommandé)
Repose sur les Gitea Actions du dépôt `deepchat-sync` qui vérifient et synchronisent quotidiennement les nouvelles versions GitHub (voir chapitre 10). Déclenchement manuel :
```
curl -X POST "http://<IP-du-serveur>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<mot-de-passe>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 Configuration de la synchronisation (sync-config.json)
| Champ | Rôle |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Préfixe d'accélération de téléchargement (par exemple ghproxy.com) |
| `keep_releases` | Nombre d'historiques de versions conservés |
| `market_url` | Adresse du marché « gestionnaire de skills » de la page de téléchargement |
> 📌 Lorsque le client DeepChat signale « délai de connexion au modèle », c'est généralement qu'il est passé par un proxy système planté (`ECONNREFUSED 127.0.0.1:33210`). Demandez à l'utilisateur de régler DeepChat sur « Pas de proxy / connexion directe » dans « Paramètres → Réseau / proxy ».
> 📖 Documentation officielle :démarrage rapide DeepChat https://deepchatai.cn/docs/guide/getting-started/ · dépôt open source https://github.com/ThinkInAIXYZ/deepchat

## 22. Administration de la surveillance et des alertes

Grafana**Accès** : Grafana http://<IP-du-serveur>:3030 (connexion SSO automatique) ; Prometheus :9091 ; Alertmanager :9093.
### 22.1 Composants et ports
| Composant | Port | Usage |
| --- | --- | --- |
| cadvisor | 8080 (interne) | Collecte le CPU/mémoire/réseau/disque de chaque conteneur |
| Prometheus | 9091 | Agrégation des métriques + règles d'alerte (`monitoring/alerts.yml`) |
| Grafana | 3030 | Tableau de bord de visualisation (préconfiguré « AI All In One — Surveillance des conteneurs ») |
| Alertmanager | 9093 | Dédoublonnage / regroupement / routage / notification des alertes |
### 22.2 Consulter le tableau de bord
1. Connectez-vous à Grafana (`ai_all_in_one_admin` / mot de passe unifié, connexion SSO automatique) ;
2. Ouvrez le panneau « AI All In One — Surveillance des conteneurs » pour voir le CPU/mémoire/réseau de chaque conteneur.
### 22.3 Règles d'alerte
Règles préconfigurées (`monitoring/alerts.yml`) : conteneur en panne (critical), mémoire du conteneur > 90 % (warning), CPU du conteneur > 80 % (warning).
> ⚠️ Piège des fausses alertes : cadvisor remonte tous les cgroups de l'hôte (y compris systemd), les règles d'alerte doivent filtrer avec `{name!=""}`, et l'alerte mémoire doit ajouter `container_spec_memory_limit_bytes > 0` (sinon limit=0 provoque une division par zéro et une alerte permanente).
### 22.4 Brancher la notification d'alerte (IM entreprise)
Le cheminement des alertes est **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM entreprise**. Configurez-le dans le menu **« Opérations → Alertes IM entreprise »** (configuration stockée dans Redis, survit au redémarrage) :
- **Destinataires** : ajoutez-en plusieurs. Type « DingTalk/WeCom/Feishu » = robot de groupe (URL webhook, envoi au groupe) ; type « DingTalk App (à une personne) » (AppKey/AppSecret/AgentId/userid) ou « WeCom App (à une personne) » (corpId/secret/agentid/userid) = application d'entreprise, envoi à des personnes.
- **Règles d'envoi** : interrupteur général, sévérité minimale (critique/avertissement/info), envoi ou non des notifications « firing » / « resolved ».
- **Historique d'envoi** : enregistre chaque envoi (heure/destinataire/type/nom d'alerte/sévérité/résultat), avec pagination, taille de page réglable, recherche par mot-clé et filtrage par type/résultat/sévérité.
- Chaque destinataire a un bouton « Test » pour envoyer un message de test, et un interrupteur d'activation.
> ⚠️ Un webhook de robot de groupe ne peut envoyer qu'à un **groupe**, pas à une personne. Pour envoyer à des personnes, utilisez les types « application d'entreprise » (DingTalk/WeCom), qui nécessitent une application interne créée dans la console d'administration avec l'autorisation d'envoyer des messages. Les robots de groupe DingTalk nécessitent aussi des « mots-clés personnalisés » (ex. « AI 平台 » / « 告警 ») ou la « signature », sinon le message est bloqué par la politique de sécurité.
> 📌 Explication des conflits de ports : le port Prometheus par défaut 9090 étant occupé par Keycloak, il est passé à 9091 ; les ports Grafana par défaut 3000/3001 étant occupés, il est passé à 3030.
> 📖 Documentation officielle :Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. Observabilité LLM (Langfuse)

Langfuse**Accès** : http://<IP-du-serveur>:3010 (connexion SSO automatique, l'entrée du Centre d'administration IA pointe vers `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 Composants
| Composant | Usage |
| --- | --- |
| langfuse | UI Web + affichage des traces (3010) |
| langfuse-worker | Traitement asynchrone des événements |
| langfuse-postgres | Stockage des métadonnées |
| langfuse-clickhouse | Stockage des événements / traces |
| langfuse-minio | Stockage des pièces jointes / médias S3 |
| langfuse-redis | File d'attente |
LiteLLM remonte automatiquement via `success_callback: ["langfuse"]` (`LANGFUSE_*` de `.env`).
### 23.2 Consulter les traces
1. Connectez-vous à Langfuse → choisissez l'organisation `AI All In One` / le projet `AI Platform` ;
2. La liste Traces montre chaque appel ; cliquez pour voir le prompt/réponse/modèle/latence/tokens/coût ;
3. Utilisez Session pour associer les conversations multi-tours.
### 23.3 Dépannage
- ⚠️ Pièges clés :
      
        Il faut définir `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (sur web et worker), sinon l'ancien SDK échoue à remonter `trace-create` et les données ne sont pas visibles ;
- Connexion SSO sans données visibles : le compte SSO (e-mail AD) diffère du compte d'initialisation ; Langfuse crée alors automatiquement un compte n'appartenant à aucune organisation. Correction (ajouter l'utilisateur SSO à l'organisation) :
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<domaine-entreprise>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 Documentation officielle :documentation officielle de Langfuse https://langfuse.com/docs · auto-hébergement https://langfuse.com/self-hosting

## 24. Journaux unifiés (Loki)

**Accès** : page « 📜 Journaux unifiés » du Centre d'administration IA (la plus pratique), ou Loki http://<IP-du-serveur>:3110.
### 24.1 Composants
| Composant | Port | Usage |
| --- | --- | --- |
| Loki | 3110 | Stockage et interrogation des journaux (machine unique, système de fichiers local) |
| Promtail | — (interne) | Découvre les conteneurs via docker.sock, collecte les journaux json et les envoie à Loki |
### 24.2 Interroger les journaux
1. Centre d'administration IA → Journaux unifiés ;
2. Choisir un conteneur (liste déroulante) → saisir un mot-clé → choisir une plage de temps → interroger ;
3. Le backend `/api/logs/query` interroge Loki avec LogQL.
### 24.3 Aide-mémoire LogQL
```
{container="new-api"} |= "error"              # Lignes contenant error dans un conteneur
{container=~".+"} |~ "(?i)error|exception"      # Correspondance sur tous les conteneurs
{service="litellm"} |= "EMAIL"                  # Interroger par service
```
> 📌 Les labels de Loki sont `container / project / service`, **il n'y a pas de `job`**. Interrogez avec `{container=~".+"}` et non `{job="docker"}`.
> ⚠️ Piège clé (montage sous Docker Desktop) : Promtail doit monter `/var/run/docker.sock` et `/var/lib/docker/containers` (sous WSL2, cela pointe vers l'intérieur de la VM Docker Desktop, là où se trouvent les journaux) ; n'utilisez pas le chemin Windows `C:\...\containers` de l'hôte. Loki en machine unique utilise `store: tsdb` + filesystem.
> 📖 Documentation officielle :documentation officielle de Loki https://grafana.com/docs/loki/latest/

## 25. Anonymisation PII (Presidio)

### 25.1 Deux couches d'anonymisation
| Couche | Capacité |
| --- | --- |
| Expressions régulières intégrées de LiteLLM (`litellm_content_filter`) | Numéros de téléphone mobile, cartes d'identité, cartes bancaires, e-mails, codes de crédit social unifiés, passeports, IPv4, etc. ; en cas de correspondance, remplacement par `[xxx_REDACTED]` ; en cas de correspondance à la liste noire de mots sensibles, rejet BLOCK |
| Microsoft Presidio | Entités plus fines (noms de personnes anglaises, e-mails, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 Règles d'expressions régulières intégrées
| Règle | Expression régulière | Type |
| --- | --- | --- |
| Numéro de téléphone mobile chinois | `\b1[3-9]\d{9}\b` | cn_mobile |
| Numéro de carte d'identité | `\b\d{17}[\dXx]\b` | cn_id |
| Numéro de carte bancaire | `\b\d{16,19}\b` | bank_card |
| E-mail | prebuilt `email` | email |
| Code de crédit social unifié | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Numéro de passeport | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
La liste noire de mots sensibles se gère dans `blocked_words` de `litellm-config.yaml` selon la réalité de l'entreprise (`confidentiel interne`, `secret commercial`, etc.).
### 25.3 Activer Presidio (actuellement commenté)
L'API guardrail de la nouvelle version de LiteLLM a changé, la section Presidio est actuellement commentée. Points d'activation :
- Les guardrails nécessitent `default_on: true` pour s'appliquer globalement ;
- Les variables d'environnement de point de terminaison `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` doivent contenir la base URL (LiteLLM ajoute automatiquement `/analyze`, `/anonymize` ; avec un chemin, cela donne `/analyze/analyze` → 404).
> ⚠️ L'image pèse environ 965 Mo, très lente à télécharger en Chine (environ 1 heure en pratique) ; si le téléchargement bloque, utilisez d'abord les expressions régulières intégrées (qui couvrent déjà les PII chinois de base).
### 25.4 Vérification
Envoyez une requête contenant un numéro de téléphone/e-mail → dans la réponse du modèle, la valeur d'origine est remplacée par `[REDACTED]` ; envoyez une requête contenant « confidentiel interne » → réponse directe `Content blocked`.
> 📖 Documentation officielle :Microsoft Presidio https://microsoft.github.io/presidio/ · code source https://github.com/microsoft/presidio

## 26. MailHog, récepteur d'e-mails

**Accès** : http://<IP-du-serveur>:8025 (boîte de réception Web, SMTP 1025 interne uniquement).
### 26.1 Pourquoi il est nécessaire
L'administration de Ghost 5 est à connexion sans mot de passe : après saisie de l'e-mail, Ghost envoie un e-mail avec un code de vérification à 6 chiffres. Sans SMTP sur l'intranet, l'e-mail ne peut pas partir et la connexion renvoie `Failed to send email`. MailHog sert de « sortie e-mail » pour recevoir ces messages.
### 26.2 Configuration côté Ghost
```
# Variables d'environnement de Ghost dans docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 Consulter les e-mails
1. Ouvrez `http://<IP-du-serveur>:8025` dans le navigateur ;
2. Dans la boîte de réception, vous voyez les codes de vérification / e-mails de notification envoyés par Ghost.
### 26.4 Connexion Ghost sans mot de passe (connexion automatique du Centre d'administration IA)
Le code à 6 chiffres de Ghost est essentiellement un **TOTP** (`TOTP(admin_session_secret + userId)`, 6 chiffres / 60 secondes / HMAC-SHA1). Le Centre d'administration IA peut calculer le code localement ; cliquez sur « Administration Ghost → Ouvrir » pour tout automatiser : connexion par mot de passe → calcul local du code → validation de la session → écriture du cookie → entrée dans l'administration, sans aucune intervention ni consultation de MailHog.
> ⚠️ Même en calculant le code soi-même, Ghost envoie réellement l'e-mail, donc MailHog doit être conservé, sinon la connexion renvoie `Failed to send email`.
> 📖 Documentation officielle :dépôt source de MailHog https://github.com/mailhog/MailHog

**Troisième partie · Exploitation**

## 27. Sauvegarde et restauration

**Accès** : page « 💾 Sauvegarde et restauration » du Centre d'administration IA, ou en ligne de commande `scripts/backup.ps1` / `restore.ps1`. Tâche planifiée automatique à 02:00 chaque jour, rétention de 7 jours.
### 27.1 Éléments de sauvegarde
| Élément de sauvegarde | Méthode |
| --- | --- |
| MySQL de NewAPI | `mysqldump` |
| PostgreSQL de Dify | `pg_dump` |
| PostgreSQL de Langfuse | `pg_dump` |
| SQLite de Ghost / Gitea / Grafana | Copie de fichiers |
| Keycloak | **export du realm (JSON)** |
| Fichiers de configuration | Copie de fichiers |
### 27.2 Sauvegarde manuelle
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 Sauvegarde planifiée (tâche planifiée)
La tâche planifiée `AI-Platform-Backup` est déjà enregistrée (tous les jours à 02:00). Si elle n'a pas été enregistrée automatiquement, créez-la manuellement : Planificateur de tâches → Nouvelle → programme `powershell.exe`, arguments `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, déclencheur tous les jours à 02:00.
> 📌 La sauvegarde se fait par défaut sur le disque C ; il est conseillé de synchroniser régulièrement `C:\AIAllInOne\backups\` vers un autre disque ou un stockage objet pour la reprise sur sinistre hors site.
### 27.4 Restauration
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
Le script demande la saisie de `yes` pour confirmer (ajoutez `-Force` pour l'ignorer, réservé aux scripts/CI). Vous pouvez aussi cliquer sur « Restaurer » d'une sauvegarde dans la page « Sauvegarde et restauration » du Centre d'administration IA.
### 27.5 Pièges clés (validés par exercice)
- ⚠️
      
        Keycloak doit utiliser **l'export/import du realm (JSON)** ; une restauration pg_dump perd l'association des rôles par défaut et empêche le démarrage ;
- Après restauration, SQLite appartient à root ; faites un chown vers l'uid correspondant (grafana=472, gitea=1000), sinon readonly ;
- pg_dump avec `--clean --if-exists` pour éviter les conflits de restauration ;
- L'ancien backup.ps1 utilisait `Copy-Item` en copie par lots ; le fichier pointé `.env` faisait échouer tout le lot en silence ; corrigé en copie fichier par fichier avec `-LiteralPath` ;
- La sauvegarde du Centre d'administration IA passe par base64 + tar-fs pour garantir la sécurité binaire (la stdout de docker exec en utf8 corromprait le SQLite .db).

## 28. Contrôle de santé et auto-vérification au démarrage

**Script** : `C:\AIAllInOne\windows\scripts\health-check.ps1`, sortie `health_check_<horodatage>.log`. Couvre 41 conteneurs (25 cœurs Windows + 16 Dify), identifiants lus depuis `.env`, pas de mot de passe codé en dur.
### 28.1 Périmètre du contrôle (9 étapes)
| Étape | Élément contrôlé |
| --- | --- |
| Stage 1 | Le Docker Daemon est-il en cours d'exécution (attente de disponibilité, adaptée à l'auto-vérification au démarrage) |
| Stage 2 | État des 41 conteneurs (Up/Exited/Restarting) |
| Stage 3 | Réponse de 10 points de terminaison HTTP |
| Stage 4 | Readiness de LiteLLM + enregistrement des modèles, API Dify, santé base de données / Redis / Sandbox |
| Stage 5 | Chaîne LLM complète (requête réelle NewAPI → LiteLLM → DeepSeek) |
| Stage 6 | Chaîne d'authentification des comptes AD + connexion administrateur NewAPI |
| Stage 7 | MCP Gateway + fonctionnalités Skill |
| Stage 8 | Préconditions de connexion DeepChat/Dify |
| Stage 9 | Espace disque |
### 28.2 Exécution manuelle
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ En fin de sortie, `ALL CLEAR` et `Fail: 0` signifient que tout est normal.
### 28.3 Démarrage automatique (tâche planifiée)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # Délai de 2 minutes après la connexion pour attendre Docker + le démarrage des conteneurs
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 Remarque : le script utilise `127.0.0.1` et non localhost ; la santé interne de LiteLLM utilise `/health/readiness` (sans authentification) ; `docker-init_permissions-1` Exited(0) est normal ; le serveur de mise à jour renvoyant 403 est normal (pas d'index.html par défaut) ; exit code 0 = succès, 1 = échec.

## 29. Manuel de dépannage

### 29.1 Trois étapes de dépannage général
1. **Voir l'état des conteneurs** : `docker ps -a` pour trouver Exited/Restarting ;
2. **Voir les journaux** : `docker logs <nom-du-conteneur> --tail 30` ;
3. **Voir le contrôle de santé** : exécutez `health-check.ps1` pour localiser l'étape en échec.
### 29.2 Tableau de consultation rapide par symptôme
| Symptôme | Cause racine | Solution |
| --- | --- | --- |
| localhost n'ouvre aucun produit | Problème de compatibilité IPv6 `::1` de WSL2 | Utilisez l'IP intranet ou 127.0.0.1 |
| Ghost reste en Restarting, erreur ECONNREFUSED :3306 | Config MySQL résiduelle dans le volume | Forcer SQLite par variables d'environnement (chapitre 4) |
| 4 conteneurs Dify crashent au démarrage ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | Passer à 50 (chapitre 5) |
| Le test de canal NewAPI renvoie No connected db | La clé du canal contient la valeur d'exemple | Renseigner la valeur réelle de `LITELLM_MASTER_KEY` |
| OIDC NewAPI renvoie invalid_grant / Incorrect redirect_uri | L'adresse du serveur est localhost | Régler l'adresse intranet (chapitre 7) |
| Connexion NewAPI 429 | Limite de débit des interfaces critiques | Vider redis rateLimit:* ou modifier .env |
| Dify se reconnecte sans cesse à ws://localhost lors de la création d'application | Adresse WebSocket non modifiée | Régler NEXT_PUBLIC_SOCKET_URL sur l'IP intranet |
| Dify : cliquer sur Connexion ne fait rien | Mot de passe à encoder en base64 / 401 normal sans connexion | base64 d'abord côté script ; réessayer dans le navigateur |
| Gitea renvoie readonly database | gitea.db appartenant à root | Supprimer la base appartenant à root et reconstruire |
| Les liens de dépôt Gitea sont en localhost | ROOT_URL non modifié | Régler l'adresse intranet |
| Connexion SSO renvoie unknown_error | Échec de redirection de ports AD (iphlpsvc) | Vérifier iphlpsvc + réseau Hyper-V |
| Keycloak ne voit pas les utilisateurs du domaine | Search scope = One Level | Passer à Subtree |
| Langfuse ne montre pas les données | V4_WRITE_MODE ou compte SSO non rattaché à l'organisation | Régler dual ; SQL pour ajouter à l'organisation (chapitre 23) |
| Délai de connexion au modèle dans DeepChat | Le client est passé par un proxy système planté | Régler sur Pas de proxy / connexion directe |
| Loki ne trouve pas les journaux | Utilisation du label job | Utiliser `{container=~".+"}` |
| Presidio 404 /analyze/analyze | Le point de terminaison contient un chemin | Ne renseigner que la base URL |
| Nouvelles interfaces 404 après modification de server.js | up -d ne relit pas les changements de volume | docker restart admin-portal |
### 29.3 Commandes courantes
```
docker ps -a                                        # État de tous les conteneurs
docker logs <conteneur> --tail 50                     # Consulter les journaux
docker compose up -d <service>                        # Reconstruire un service
docker compose restart <service>                      # Redémarrer un service (ne relit pas .env)
docker system df                                     # Occupation disque de Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # Bilan de santé en un clic
```

**Annexe**

## Ann.. Index de la documentation officielle

### Documentation officielle de tous les produits
| Produit | Adresse de documentation officielle |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| Administration du serveur Keycloak | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| Site officiel NewAPI | https://www.newapi.ai |
| Code source NewAPI | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| Guardrail Presidio de LiteLLM | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| Auto-hébergement de Dify | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| Console d'administration Ghost | https://ghost.org/docs/admin/ |
| Gitea (en chinois) | https://docs.gitea.com/zh-cn |
| Administration de Gitea | https://docs.gitea.com/zh-cn/category/administration |
| Actions de Gitea | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| Code source DeepChat | https://github.com/ThinkInAIXYZ/deepchat |
| Protocole MCP | https://modelcontextprotocol.io |
| SDK MCP | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| Auto-hébergement de Langfuse | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| Code source Presidio | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ Chaque chapitre comporte également en fin de page l'adresse de documentation officielle du produit concerné, pour une consultation au fil des chapitres.

