# Chapitre 14 : Administration quotidienne de Keycloak

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Le centre d'authentification : gérer les utilisateurs, les rôles, les clients OIDC, la fédération AD et les sessions.

[← Chapitre 13 : Liste de vérification de l'interconnexion](ch13-interconnect.md) · [📖 Index](index.md) · [Chapitre 15 : Administration quotidienne de NewAPI →](ch15-ops-newapi.md)

---

**Accès** : `http://<IP-du-serveur>:9090` → Administration Console → connexion administrateur.

> 📌 Beaucoup de ces opérations peuvent aussi être faites depuis l'AI Admin Center → page Keycloak (admin global uniquement) : synchronisation LDAP complète/incrémentale, suppression d'utilisateurs, gestion des rôles (lister/créer/supprimer/voir les membres). Voir chapitre 12.6.

## 14.1 Gérer les utilisateurs

1. **Nouvel utilisateur** : Users → Add user → saisir le nom d'utilisateur → Create ;

2. **Définir le mot de passe** : onglet Credentials de l'utilisateur → définir le mot de passe → Temporary désactivé (sinon changement forcé à la première connexion) ;

3. **Réinitialiser le mot de passe** : Users → trouver l'utilisateur → Credentials → Set password ;

4. **Désactiver/activer** : commutateur Enabled en haut du détail utilisateur (une fois désactivé, tous les SSO de cet utilisateur cessent immédiatement) ;

5. **Supprimer** : détail utilisateur → Delete.

## 14.2 Rôles et autorisations

- **Realm Role** : Realm roles → Create role pour créer un rôle (par exemple `ai-platform-admin`) ;

- **Assigner un rôle** : utilisateur → Role mapping → Assign role ;

- **Groupes** : Groups → créer des groupes (`ai-admin` / `ai-user`) → ajouter des utilisateurs au groupe ; le rôle est attribué au groupe, les utilisateurs héritent des autorisations via le groupe.

> ✅ Les autorisations d'administration sont contrôlées de façon unifiée par le rôle `ai-platform-admin` ; les produits l'utilisent pour identifier les administrateurs lors de l'intégration SSO.

## 14.3 Clients OIDC (intégrer un nouveau produit en SSO)

1. Clients → Create client → Client ID = nom du produit (par exemple `newapi` / `grafana` / `langfuse`) ;

2. Client authentication : On (sinon pas d'onglet Credentials), Standard flow : On ;

3. Valid redirect URIs / Web origins : renseignez l'adresse de callback du produit (ajoutez l'IP intranet et 127.0.0.1) ;

4. Enregistrer → onglet Credentials, copiez le Client secret pour le produit.

## 14.4 Maintenance de la fédération AD / LDAP

- **Modifier contrôleur de domaine / mot de passe** : User Federation → cliquer sur le fournisseur LDAP → modifier Connection URL / Bind credentials → Save ;

- **Synchronisation manuelle** : Synchronize all users ;

- **Mappage de groupes** : onglet Mappers → group-ldap-mapper → définir le conteneur où se trouvent les groupes AD dans Groups DN, pour mapper les groupes AD en rôles Keycloak.

## 14.5 Gestion des sessions

- **Voir les sessions actives** : Users → un utilisateur → Sessions ;

- **Déconnexion forcée** : Sessions → Sign out all ;

- **Configuration globale des sessions / tokens** : Realm settings → onglets Sessions / Tokens pour régler les délais d'expiration.

> ⚠️ Rappel des pièges clés : ① les espaces du CN du bind DN sont conservés tels quels ; ② Username LDAP attribute = `sAMAccountName`, pas `cn` ; ③ Search scope = Subtree ; ④ une erreur SSO `unknown_error` vient souvent de l'arrêt d'iphlpsvc sur l'hôte, qui fait échouer la redirection de ports AD ; ⑤ lorsque la VM du contrôleur de domaine AD est éteinte, la connexion des comptes fédérés LDAP renvoie `LDAP Connection refused`.

> 📖 Documentation officielle :documentation officielle de Keycloak https://www.keycloak.org/documentation · guide d'administration du serveur https://www.keycloak.org/server/

---

[← Chapitre 13 : Liste de vérification de l'interconnexion](ch13-interconnect.md) · [📖 Index](index.md) · [Chapitre 15 : Administration quotidienne de NewAPI →](ch15-ops-newapi.md)
