# Chapitre 6 : Keycloak : Realm, utilisateurs et AD

*Première partie · Déploiement*

> Créer un Realm, créer des comptes locaux, ou importer des comptes de domaine depuis Active Directory — le fondement du SSO de tous les produits.

[← Chapitre 5 : Déploiement autonome de Dify](ch05-dify-deploy.md) · [📖 Index](index.md) · [Chapitre 7 : NewAPI : initialisation, canaux et OIDC →](ch07-newapi.md)

---

> 📌 Accès : hôte `http://127.0.0.1:9090`, intranet `http://<IP-du-serveur>:9090`. Les données sont stockées dans le volume nommé `keycloak-data`, conservées lors de la reconstruction du conteneur. Les identifiants figurent dans `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` de `.env.windows`.

## 6.1 Créer un Realm

1. Ouvrez `http://127.0.0.1:9090` dans le navigateur → Administration Console → connexion administrateur ;

2. Menu déroulant en haut à gauche → **Create Realm** → saisissez `enterprise-ai` dans Realm name → Create.

## 6.2 Méthode A : créer des comptes locaux (petite équipe sans AD / tests)

1. **Groups** → Create Group → `ai-admin` ; puis `ai-user` ;

2. **Users** → Add user → nom d'utilisateur → Create ;

3. Onglet Credentials → définir le mot de passe → Temporary désactivé ;

4. Onglet Groups → ajouter au groupe `ai-user`.

## 6.3 Méthode B : importer des comptes depuis Active Directory (recommandé)

Lorsque l'entreprise dispose déjà d'un contrôleur de domaine Windows AD, les employés se connectent avec leur compte de domaine, sans création manuelle dans Keycloak. Prérequis : la connectivité réseau entre le conteneur Docker et le contrôleur de domaine est établie (topologie réseau, Hyper-V Internal Switch, redirection de ports : voir le « Guide d'intégration Keycloak AD » `windows-ad-integration.html`).

> 📌 Comptes AD requis : le compte de service `svc_keycloak` (mot de passe sans expiration, utilisé pour la liaison LDAP) + 2 utilisateurs de domaine de test (pour valider la synchronisation).

### Créer une fédération d'utilisateurs LDAP

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

> ⚠️ Erreurs de saisie fréquentes :
> - Bind DN au **format LDAP** (`CN=svc_keycloak,CN=Users,DC=xxx`), pas ~~DOMAINE\utilisateur~~ ;
> - Username LDAP attribute = `sAMAccountName`, pas `cn` ;
> - Search scope = **Subtree** ;
> - **Les espaces dans le CN sont conservés tels quels** : si le nom d'affichage contient des espaces (par exemple `ai all in one admin` avec des espaces), le Bind DN doit être `CN=ai all in one admin,...` ; écrire des underscores empêchera la connexion.

### Vérifier la connexion AD

1. Ouvrez `http://127.0.0.1:9090/realms/enterprise-ai/account` dans une fenêtre privée ;

2. Connectez-vous avec un compte de domaine (nom d'utilisateur `aitest1` ou UPN `aitest1@<domaine-entreprise>` acceptés) ;

3. La redirection réussie vers l'Account Console signifie que c'est validé.

## 6.4 Autres sources d'identité d'entreprise (résumé de l'annexe N)

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

---

[← Chapitre 5 : Déploiement autonome de Dify](ch05-dify-deploy.md) · [📖 Index](index.md) · [Chapitre 7 : NewAPI : initialisation, canaux et OIDC →](ch07-newapi.md)
