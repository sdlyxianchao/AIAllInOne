# Chapitre 13 : Liste de vérification de l'interconnexion

*Première partie · Déploiement*

> Après le déploiement, confirmez un à un que les 12 chaînes d'interconnexion sont toutes opérationnelles.

[← Chapitre 12 : Centre d'administration IA](ch12-admin-center.md) · [📖 Index](index.md) · [Chapitre 14 : Administration quotidienne de Keycloak →](ch14-ops-keycloak.md)

---

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

---

[← Chapitre 12 : Centre d'administration IA](ch12-admin-center.md) · [📖 Index](index.md) · [Chapitre 14 : Administration quotidienne de Keycloak →](ch14-ops-keycloak.md)
