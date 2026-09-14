# Chapitre 20 : Administration quotidienne de MCP Gateway

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Ajouter/supprimer des MCP Server, téléverser/supprimer des Skills, étendre les outils intégrés.

[← Chapitre 19 : Administration quotidienne de Gitea](ch19-ops-gitea.md) · [📖 Index](index.md) · [Chapitre 21 : Administration du serveur de mise à jour →](ch21-ops-update.md)

---

**Accès** : `http://<IP-du-serveur>:3100` (page du marché `/market`). La gestion s'effectue via la page « MCP Gateway » du Centre d'administration IA (rôle `ai-platform-admin`), ou directement par l'API d'administration.

## 20.1 Gérer les MCP Server

1. Modifiez `mcp-gateway/mcp-servers.json` pour ajouter/supprimer des serveurs (deux types stdio/http) ;

2. Redémarrez `docker compose restart mcp-gateway` ;

3. Ou ajoutez/supprimez via la page MCP Gateway du Centre d'administration IA (écriture de la configuration + reconnexion automatique).

## 20.2 Gérer les Skills (paquets de compétences)

1. **Téléverser** : page MCP Gateway du Centre d'administration IA → téléverser un zip de skill (validation de la présence de SKILL.md, protection contre la traversée de chemin) ;

2. **Supprimer** : supprimer le skill correspondant ;

3. Les skills sont placés dans `mcp-gateway/skills/` (sous-répertoires contenant SKILL.md), analysés automatiquement à chaque requête, sans redémarrage.

## 20.3 Étendre les outils intégrés

Ajoutez deux étapes dans `mcp-gateway/gateway.js` :

```
// ① Définition de l'outil (ajouter un élément au tableau builtinTools)
{ name: 'platform_health', description: 'Consulter l'état de santé du service',
  inputSchema: { type: 'object', properties: {} } }

// ② Logique d'exécution (ajouter une branche dans callBuiltin)
if (name === 'platform_health') { return 'Tous les services fonctionnent normalement'; }
```

Après modification, `docker compose restart mcp-gateway`.

## 20.4 Maintenir l'adresse du marché skill-market

Le `market_url` du « gestionnaire de skills » se trouve dans `mcp-gateway/skills/skill-market/config.json` + `SKILL.md` ; il doit utiliser un nom d'hôte (pas une IP), c'est un paramètre de déploiement (voir chapitre 11).

> ⚠️ L'API d'administration requiert l'en-tête `X-Admin-Token` (`MCP_ADMIN_TOKEN` de `.env`) ; non configuré → 503, mauvais token → 401.

> 📖 Documentation officielle :protocole MCP officiel https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Chapitre 19 : Administration quotidienne de Gitea](ch19-ops-gitea.md) · [📖 Index](index.md) · [Chapitre 21 : Administration du serveur de mise à jour →](ch21-ops-update.md)
