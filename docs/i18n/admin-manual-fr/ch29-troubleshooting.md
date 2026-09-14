# Chapitre 29 : Manuel de dépannage

*Troisième partie · Exploitation*

> Consultation rapide par symptôme pour localiser rapidement la cause racine.

[← Chapitre 28 : Contrôle de santé et auto-vérification au démarrage](ch28-healthcheck.md) · [📖 Index](index.md) · [Chapitre Ann. : Index de la documentation officielle →](ch30-appendix.md)

---

## 29.1 Trois étapes de dépannage général

1. **Voir l'état des conteneurs** : `docker ps -a` pour trouver Exited/Restarting ;

2. **Voir les journaux** : `docker logs <nom-du-conteneur> --tail 30` ;

3. **Voir le contrôle de santé** : exécutez `health-check.ps1` pour localiser l'étape en échec.

## 29.2 Tableau de consultation rapide par symptôme

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
| Délai de connexion au modèle dans DSH Desktop | Le client est passé par un proxy système planté | Régler sur Pas de proxy / connexion directe |
| Loki ne trouve pas les journaux | Utilisation du label job | Utiliser `{container=~".+"}` |
| Presidio 404 /analyze/analyze | Le point de terminaison contient un chemin | Ne renseigner que la base URL |
| Nouvelles interfaces 404 après modification de server.js | up -d ne relit pas les changements de volume | docker restart admin-portal |

## 29.3 Commandes courantes

```
docker ps -a                                        # État de tous les conteneurs
docker logs <conteneur> --tail 50                     # Consulter les journaux
docker compose up -d <service>                        # Reconstruire un service
docker compose restart <service>                      # Redémarrer un service (ne relit pas .env)
docker system df                                     # Occupation disque de Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # Bilan de santé en un clic
```

---

[← Chapitre 28 : Contrôle de santé et auto-vérification au démarrage](ch28-healthcheck.md) · [📖 Index](index.md) · [Chapitre Ann. : Index de la documentation officielle →](ch30-appendix.md)
