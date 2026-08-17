# Chapitre 12 : Centre d'administration IA

*Première partie · Déploiement*

> Portail d'administration unifié : authentification Keycloak, menu de gauche intégrant tous les produits, état du cluster dans le Dashboard.

[← Chapitre 11 : MCP Gateway et marché de Skills](ch11-mcp.md) · [📖 Index](index.md) · [Chapitre 13 : Liste de vérification de l'interconnexion →](ch13-interconnect.md)

---

> 📌 Positionnement : ce n'est pas une plateforme de gestion Docker (1Panel/Portainer), mais une console d'administration unifiée destinée aux administrateurs — authentification Keycloak + menu de gauche liant tous les produits + état du cluster dans le Dashboard + compte administrateur unifié.

## 12.1 Capacités principales

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

## 12.2 Initialiser le Global Administrator

```
# Configuration dans .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=voir la liste des comptes et mots de passe
ADMIN_EMAIL=ai_all_in_one_admin@<domaine-entreprise>
```

Au démarrage, l'utilisateur `ai_all_in_one_admin` est créé automatiquement dans Keycloak (ignoré s'il existe déjà), avec le rôle Realm `ai-platform-admin`. Principe fondamental : **un seul compte Global Admin pour gérer toute la plateforme**.

## 12.3 Déploiement Docker Compose

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

## 12.4 Configuration du client Keycloak

1. Keycloak → enterprise-ai → Clients → Create ;

2. Client ID `AI-all-in-one-admin-portal`, Client authentication / Standard flow : On ;

3. Valid Redirect URIs : `http://127.0.0.1:10086/*` et `http://<IP-du-serveur>:10086/*` ;

4. Copiez le Client Secret → renseignez `KEYCLOAK_CLIENT_SECRET` de `.env` → `docker compose up -d admin-portal` ;

5. Créez le rôle Realm `ai-platform-admin`, assignez-le à `ai_all_in_one_admin`.

> ⚠️ Points de déploiement / dépannage :
> - La session d'admin-portal est stockée en mémoire ; `up -d` reconstruisant le conteneur **vide la session de connexion** (reconnexion nécessaire) ;
> - La page d'accueil `/` doit être protégée par Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` explicite), sinon un tableau de bord vide est rendu sans connexion ;
> - Pour les statistiques Dify, utilisez l'e-mail administrateur réel (`ai_all_in_one_admin@<domaine-entreprise>`, identique à l'admin global AD) ;
> - **Après modification de server.js, faites impérativement `docker restart admin-portal`**, pas `up -d` (le changement de contenu du volume ne déclenche pas la reconstruction).

## 12.5 Vérification

1. Ouvrez `http://<IP-du-serveur>:10086` → redirection automatique vers la connexion Keycloak (pas de tableau de bord vide sans connexion) ;

2. Connectez-vous avec `ai_all_in_one_admin` → entrez dans le tableau de bord général ;

3. Le Dashboard affiche 8 indicateurs de produits + regroupement des conteneurs ;

4. Cliquez sur chaque produit pour voir les statistiques, puis sur « Ouvrir l'interface » pour basculer ;

5. Les paramètres système permettent de changer de langue parmi 9 langues.

## 12.6 Autorisation d'admin par module + gestion de la page Keycloak (v0.91)

L'administrateur global peut gérer les autres administrateurs et Keycloak depuis l'AI Admin Center :

- **Comptes administrateurs** : recherchez un compte existant dans l'IdP Keycloak (utilisateurs AD/LDAP, pas de nouveau compte, pas de mot de passe) → choisissez les modules → confirmez. Le système attribue le rôle de domaine `admin:<produit>` et **provisionne réellement le produit** (SSO d'abord, API en secours) : Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. Révoquer un module ou supprimer un admin **supprime le compte du produit**. Les produits sans SSO génèrent un mot de passe temporaire, visible via l'icône 🔑 (admin global uniquement). Les non-admins voient une boîte « Vous n'êtes pas administrateur » et sont déconnectés.

- **Page Keycloak** : boutons « Tout synchroniser / Sync. modifiés » pour récupérer les changements AD en un clic ; chaque ligne utilisateur a « Modifier » (vers la console Keycloak) et « Supprimer » ; la section rôles permet de créer/supprimer des rôles et de voir les membres. Actions sync/suppr/rôles réservées à l'admin global.

> ⚠️ Note : Keycloak n'a pas d'endpoint « sync utilisateur unique » — la sync incrémentale récupère tous les comptes AD modifiés. Les utilisateurs fédérés AD réapparaissent après la prochaine sync complète ou leur prochaine connexion SSO ; pour les supprimer définitivement, désactivez/supprimez le compte dans AD.

---

[← Chapitre 11 : MCP Gateway et marché de Skills](ch11-mcp.md) · [📖 Index](index.md) · [Chapitre 13 : Liste de vérification de l'interconnexion →](ch13-interconnect.md)
