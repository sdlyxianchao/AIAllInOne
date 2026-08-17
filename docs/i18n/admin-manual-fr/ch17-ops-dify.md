# Chapitre 17 : Administration quotidienne de Dify

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Plateforme d'applications IA : applications, bases de connaissances, fournisseurs de modèles, autorisations des membres, publication.

[← Chapitre 16 : Administration quotidienne de LiteLLM](ch16-ops-litellm.md) · [📖 Index](index.md) · [Chapitre 18 : Administration quotidienne de Ghost →](ch18-ops-ghost.md)

---

**Accès** : `http://<IP-du-serveur>` (port 80, compose officiel autonome ; la montée de version et la maintenance s'effectuent séparément dans `dify/docker/`).

## 17.1 Gestion des applications (Studio)

1. **Créer une application** : Studio → créer une application vide → choisir le type (assistant de chat / Agent / workflow / génération de texte) ;

2. **Orchestration** : glisser-déposer des nœuds pour composer les prompts, outils, bases de connaissances, variables ;

3. **Débogage** : « Aperçu » en haut à droite pour lancer le débogage ;

4. **Publication** : après validation du débogage, « Publier » → générer un lien de partage ou intégrer l'application Web.

## 17.2 Gestion des bases de connaissances

1. Bases de connaissances → créer une base ;

2. Téléverser des documents (Word / PDF / Markdown / lien de page Web), choisir la règle de segmentation + le mode d'indexation (haute qualité / économique) ;

3. « Ajouter » cette base dans l'application pour que l'IA réponde à partir des documents.

> 📌 Le contenu de la base de connaissances est utilisé par l'IA pour répondre ; ne téléversez pas de documents confidentiels (respectez la politique de classification des données).

## 17.3 Fournisseurs de modèles

- **Ajouter un modèle** : Paramètres → Fournisseurs de modèles → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1` (via NewAPI) + `dify-key` ;

- **Réglage des modèles système** : définir les modèles de chat / raisonnement / embedding par défaut.

## 17.4 Membres et autorisations

- **Membres** : inviter des membres dans l'espace de travail, définir les rôles Owner/Admin/Editor/Normal ;

- **Méthode de connexion** : Paramètres → Méthode de connexion → possibilité d'intégrer OIDC (Keycloak) pour le SSO.

## 17.5 Mise à niveau et maintenance

```
cd dify\docker
git pull                          # Récupérer la dernière version
docker compose pull               # Récupérer les nouvelles images
docker compose up -d              # Reconstruire
```

> ⚠️ Pièges clés : ① la WebSocket `NEXT_PUBLIC_SOCKET_URL` doit être réglée sur l'IP intranet ; ② le mot de passe de connexion est encodé en base64 ; ③ en cas de mot de passe oublié, utilisez `docker exec docker-api-1 flask reset-password` (≥ 8 caractères).

> 📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai · auto-hébergé https://docs.dify.ai/getting-started/install-self-hosted

---

[← Chapitre 16 : Administration quotidienne de LiteLLM](ch16-ops-litellm.md) · [📖 Index](index.md) · [Chapitre 18 : Administration quotidienne de Ghost →](ch18-ops-ghost.md)
