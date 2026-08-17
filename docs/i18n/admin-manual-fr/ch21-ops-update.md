# Chapitre 21 : Administration du serveur de mise à jour

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Hébergement des paquets d'installation DeepChat et mise à jour automatique.

[← Chapitre 20 : Administration quotidienne de MCP Gateway](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapitre 22 : Administration de la surveillance et des alertes →](ch22-ops-monitoring.md)

---

**Accès** : `http://<IP-du-serveur>:8091`, données dans `deepchat-updates/`.

## 21.1 Déposer manuellement une nouvelle version

1. Téléchargez le paquet d'installation officiel DeepChat dans `deepchat-updates/deepchat/` ;

2. Mettez à jour `version.txt` (écrivez le nouveau numéro de version) ;

3. Lors de la mise à jour automatique côté employé, DeepChat vérifie `version.txt`, détecte la nouvelle version et la télécharge/installe.

## 21.2 Synchronisation automatique (recommandé)

Repose sur les Gitea Actions du dépôt `deepchat-sync` qui vérifient et synchronisent quotidiennement les nouvelles versions GitHub (voir chapitre 10). Déclenchement manuel :

```
curl -X POST "http://<IP-du-serveur>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<mot-de-passe>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 Configuration de la synchronisation (sync-config.json)

| Champ | Rôle |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | Préfixe d'accélération de téléchargement (par exemple ghproxy.com) |
| `keep_releases` | Nombre d'historiques de versions conservés |
| `market_url` | Adresse du marché « gestionnaire de skills » de la page de téléchargement |

> 📌 Lorsque le client DeepChat signale « délai de connexion au modèle », c'est généralement qu'il est passé par un proxy système planté (`ECONNREFUSED 127.0.0.1:33210`). Demandez à l'utilisateur de régler DeepChat sur « Pas de proxy / connexion directe » dans « Paramètres → Réseau / proxy ».

> 📖 Documentation officielle :démarrage rapide DeepChat https://deepchatai.cn/docs/guide/getting-started/ · dépôt open source https://github.com/ThinkInAIXYZ/deepchat

---

[← Chapitre 20 : Administration quotidienne de MCP Gateway](ch20-ops-mcp.md) · [📖 Index](index.md) · [Chapitre 22 : Administration de la surveillance et des alertes →](ch22-ops-monitoring.md)
