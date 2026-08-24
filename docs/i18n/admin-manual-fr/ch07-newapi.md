# Chapitre 7 : NewAPI : initialisation, canaux et OIDC

*Première partie · Déploiement*

> Terminer l'assistant d'installation initiale, configurer le canal pointant vers LiteLLM, distribuer les clés API, intégrer Keycloak OIDC.

[← Chapitre 6 : Keycloak : Realm, utilisateurs et AD](ch06-keycloak.md) · [📖 Index](index.md) · [Chapitre 8 : LiteLLM : vérification et cache →](ch08-litellm.md)

---

## 7.1 Assistant d'installation initiale (première visite)

Au premier démarrage, NewAPI affiche un assistant de configuration système en 4 étapes :

1. **Vérification de la base de données** : cliquez sur « Vérifier la connexion à la base de données », coche verte attendue.

2. **Compte administrateur** : nom d'utilisateur `ai_all_in_one_admin`, e-mail `ai_all_in_one_admin@<domaine-entreprise>`, mot de passe administrateur unifié.

> 📌 Pourquoi créer d'abord un administrateur local : OIDC n'est pas encore configuré, NewAPI ne connaît pas Keycloak ; il faut d'abord un compte local pour « entrer » et terminer la configuration, puis activer OIDC dans les paramètres système.

3. **Mode d'utilisation** : choisissez « Usage personnel » (en interne : les employés peuvent s'inscrire, la consommation est séparée, pas de module de facturation/recharge).

4. **Confirmer l'initialisation** : créer les tables de la base → connexion administrateur.

## 7.2 Configurer le canal LLM (pointant vers LiteLLM)

1. **Canaux** → ajouter un nouveau canal → type `OpenAI` ;

2. Base URL : `http://litellm:4000` (nom de conteneur, via le réseau Docker, **pas localhost**) ;

3. Clé : la valeur réelle de `LITELLM_MASTER_KEY` dans `.env` (pas la valeur d'exemple, sinon erreur `No connected db`) ;

4. Modèle : `deepseek-chat` (exemple, selon la configuration réelle) ;

5. Enregistrer → cliquez sur « Tester » pour vérifier la connectivité.

Si plusieurs fournisseurs sont configurés, répétez l'ajout : Claude type `Anthropic Claude`, DeepSeek type `OpenAI`, Base URL toujours `http://litellm:4000`.

## 7.3 Créer des clés API

Créez-en une pour Dify et une pour DSH Desktop, pour séparer la statistique de consommation :

1. À gauche **Clés API** → nouvelle ;

2. Nom `dify-key` → enregistrer → copier `sk-xxx` (à renseigner dans le fournisseur de modèles de Dify) ;

3. Puis `dsh-key` → copier `sk-xxx` (à distribuer aux utilisateurs DSH Desktop).

## 7.4 Autoriser les utilisateurs à demander une clé en libre-service

Après connexion, les employés peuvent par défaut créer leur propre clé dans la page « Clés API ». Pour pouvoir réellement appeler les modèles, deux conditions sont requises (déjà préréglées dans `.env`) :

1. **Un quota** : `DEFAULT_QUOTA=100` (100 dollars de quota offerts aux nouveaux utilisateurs) ;

2. **Un token** : `GENERATE_DEFAULT_TOKEN=true` (token initial généré à l'inscription).

> ⚠️ Ne s'applique qu'aux utilisateurs « nouvellement inscrits » : un utilisateur déjà connecté (comme `aitest1`) ne recevra pas automatiquement de token ; l'administrateur doit définir son quota manuellement dans la page « Utilisateurs ».

## 7.5 Intégrer Keycloak OIDC (pour que les utilisateurs AD se connectent directement)

### ① Créer un Client OIDC NewAPI dans Keycloak

1. Realm enterprise-ai → **Clients** → Create client ;

2. Client ID `newapi`, type OpenID Connect ;

3. **Client authentication : On** (obligatoire, sinon pas d'onglet Credentials), Standard flow / Direct access grants : On ;

4. Valid redirect URIs : `http://<IP-du-serveur>:3000/*` et `http://127.0.0.1:3000/*` ;

5. Enregistrer → onglet Credentials → copier le Client secret.

### ② Activer OIDC dans NewAPI

Interface NewAPI → **Paramètres système → Authentification → OAuth personnalisé → Ajouter un fournisseur OAuth**, renseignez :

| Groupe | Élément de configuration | Valeur |
| --- | --- | --- |
| Réglage rapide | Modèle prédéfini / Adresse API | `Keycloak` / `http://127.0.0.1:9090` |
| Informations de base | Nom du fournisseur / Identifiant | `Keycloak` / `keycloak` |
| Identifiants | Client ID / Secret | `newapi` / la valeur copiée depuis Keycloak |
| Points de terminaison | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| Mappage de champs | ID utilisateur / nom d'utilisateur / e-mail | `sub` / `preferred_username` / `email` |

Après avoir cliqué sur « Découverte automatique » pour renseigner les points de terminaison, **modifiez le point de terminaison de token et le point de terminaison d'informations utilisateur en `host.docker.internal:9090`** (appel interne de Keycloak par le conteneur NewAPI) ; le point de terminaison d'autorisation reste `<IP-du-serveur>:9090` (redirection du navigateur). Scope `openid profile email`.

> ⚠️ Deux modifications obligatoires, sinon la connexion échoue :
> - **Après l'enregistrement, revenez dans Keycloak pour compléter l'URL de callback** : ajoutez `http://<IP-du-serveur>:3000/oauth/keycloak` et `http://127.0.0.1:3000/oauth/keycloak` dans Valid redirect URIs ;
> - **Réglez l'« adresse du serveur » de NewAPI sur l'adresse intranet** : Paramètres système → Paramètres généraux → adresse du serveur `http://<IP-du-serveur>:3000` (par défaut localhost, ce qui provoque l'erreur `invalid_grant - Incorrect redirect_uri` lors de l'échange de token). Après modification, accédez aussi à NewAPI via l'IP intranet depuis la machine locale.

Méthode pour modifier la base de données :

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<IP-du-serveur>:3000') ON DUPLICATE KEY UPDATE value='http://<IP-du-serveur>:3000';"
docker compose restart new-api
```

> ⚠️ Dépannage : connexion renvoyant **429 Too Many Requests** — la limite de débit des interfaces critiques de NewAPI (20 fois / 20 minutes par défaut) est déclenchée. Levée temporaire : `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL` ; solution permanente déjà préréglée dans `.env` avec `CRITICAL_RATE_LIMIT_ENABLE=false` et trois autres groupes de variables.

> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai · dépôt open source https://github.com/QuantumNous/new-api

---

[← Chapitre 6 : Keycloak : Realm, utilisateurs et AD](ch06-keycloak.md) · [📖 Index](index.md) · [Chapitre 8 : LiteLLM : vérification et cache →](ch08-litellm.md)
