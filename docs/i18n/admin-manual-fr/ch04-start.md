# Chapitre 4 : Démarrage des services principaux

*Première partie · Déploiement*

> Copier .env, démarrer les conteneurs, vérifier l'accessibilité service par service, traiter le problème SQLite connu de Ghost.

[← Chapitre 3 : Fichiers de configuration et variables d'environnement](ch03-env.md) · [📖 Index](index.md) · [Chapitre 5 : Déploiement autonome de Dify →](ch05-dify-deploy.md)

---

## 4.1 Copier .env

```
# PowerShell
copy .env.windows .env
```

Docker Compose lit `.env` par défaut.

## 4.2 Démarrer tous les services principaux

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

## 4.3 Vérifier l'état des conteneurs

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Attendu : les 10 conteneurs principaux sont tous `Up`. Si un conteneur reste en `Restarting`, faites `docker logs nom_du_conteneur` pour voir la raison.

## 4.4 Correction d'un problème connu : Ghost forcé en SQLite

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

## 4.5 Vérifier l'accessibilité service par service

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

---

[← Chapitre 3 : Fichiers de configuration et variables d'environnement](ch03-env.md) · [📖 Index](index.md) · [Chapitre 5 : Déploiement autonome de Dify →](ch05-dify-deploy.md)
