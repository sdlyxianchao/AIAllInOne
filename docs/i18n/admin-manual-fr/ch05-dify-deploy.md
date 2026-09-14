# Chapitre 5 : Déploiement autonome de Dify

*Première partie · Déploiement*

> Dify se déploie de façon autonome avec le compose officiel (environ 15 conteneurs) pour éviter les conflits de ports.

[← Chapitre 4 : Démarrage des services principaux](ch04-start.md) · [📖 Index](index.md) · [Chapitre 6 : Keycloak : Realm, utilisateurs et AD →](ch06-keycloak.md)

---

> 📌 Dify utilise le docker-compose officiel (environ 15 conteneurs), se déploie de façon autonome pour éviter les conflits de ports, et utilise son propre réseau par défaut (différent du réseau `ai-platform` des services principaux).

## 5.1 Cloner Dify

```
# Option A : GitHub (nécessite l'accès)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Option B : miroir officiel Gitee (recommandé en Chine)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 Corriger la compatibilité + copier les variables d'environnement

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

> ⚠️ Pourquoi il faut impérativement modifier `GRAPH_ENGINE_SCALE_UP_THRESHOLD` : Dify 1.16.1 a fait passer ce champ de « 0 autorisé » à « doit être > 0 », mais le modèle `shared.env` contient encore 0. Sans correction, les 4 conteneurs `dify-api-1` / `worker` / `worker_beat` / `api_websocket` crashent au démarrage avec le journal `ValidationError: Input should be greater than 0`.

## 5.3 Démarrer Dify

```
docker compose up -d
docker compose ps
```

> ✅ Tous les conteneurs sont `Up` (il est normal que `init_permissions` affiche Exited). Ouvrez `http://127.0.0.1/install` dans le navigateur pour initialiser le compte administrateur.

## 5.4 Corriger l'adresse WebSocket (sans quoi le client se reconnecte sans cesse à ws://localhost)

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

## 5.5 Récapitulatif des pièges

> ⚠️ **Le mot de passe de connexion est transmis en base64** : dans Dify 1.16.x, le champ `password` de l'API de connexion `POST /console/api/login` est le mot de passe encodé en base64. Un script doit d'abord faire `base64(mot_de_passe)` ; côté frontend, si « cliquer sur Connexion ne fait rien », un `GET /account/profile 401` dans la console est normal tant que l'on n'est pas connecté.

> ⚠️ **Réinitialisation du mot de passe administrateur oublié** : le hachage du mot de passe Dify est `pbkdf2_hmac('sha256', password, salt, 10000)` (10 000 itérations), irréversible ; réinitialisez via une commande de conteneur (nouveau mot de passe ≥ 8 caractères) :

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<domaine-entreprise> \
  --new-password '<nouveau-mot-de-passe>' \
  --password-confirm '<nouveau-mot-de-passe>'
```

> 📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai · déploiement auto-hébergé https://docs.dify.ai/getting-started/install-self-hosted

---

[← Chapitre 4 : Démarrage des services principaux](ch04-start.md) · [📖 Index](index.md) · [Chapitre 6 : Keycloak : Realm, utilisateurs et AD →](ch06-keycloak.md)
