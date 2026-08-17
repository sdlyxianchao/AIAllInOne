# Chapitre 11 : MCP Gateway et marché de Skills

*Première partie · Déploiement*

> La passerelle qui centralise la gestion des Skills et des outils MCP ; DeepChat/Dify se connecte à une seule adresse pour obtenir tous les outils.

[← Chapitre 10 : Distribution de DeepChat et CI/CD](ch10-deepchat.md) · [📖 Index](index.md) · [Chapitre 12 : Centre d'administration IA →](ch12-admin-center.md)

---

> 📌 MCP Gateway est basé sur le SDK officiel `@modelcontextprotocol/sdk`, expose le point de terminaison Streamable HTTP standard `/mcp`, a été intégré au `docker-compose.yml` principal (port 3100) et démarre avec les services principaux. Le code source se trouve dans `mcp-gateway/`.

## 11.1 Outils intégrés de la plateforme

| Outil | Usage |
| --- | --- |
| `platform_time` | Renvoie l'heure actuelle du serveur |
| `platform_echo` | Renvoie le texte (test de connectivité) |
| `platform_services` | Liste l'inventaire des services de la plateforme |

## 11.2 Agréger des MCP Server externes

Modifiez `mcp-gateway/mcp-servers.json`, ajoutez des types stdio ou http, redémarrez `mcp-gateway` pour appliquer :

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

Les outils agrégés reçoivent automatiquement le préfixe `{serverName}_` pour éviter les doublons de noms.

## 11.3 Connexion des clients

1. DeepChat : Paramètres → MCP → ajouter un serveur → type « HTTP streamable », URL `http://<IP-du-serveur>:3100/mcp` ;

2. Workflow Dify : pointez la configuration d'outil personnalisé / d'outil MCP vers la même adresse.

> Vérification : `curl http://<IP-du-serveur>:3100/health` renvoie `{"status":"ok"}` ; `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` renvoie la liste des outils.

## 11.4 Marché de Skills (distribution intranet de paquets de skills)

| Point de terminaison | Rôle |
| --- | --- |
| `/market` | Page du marché de Skills (navigation par cartes + téléchargement ZIP + copie de l'adresse d'installation) |
| `/skills` | JSON de l'inventaire des skills (name/description/version) |
| `/skills/<nom>.zip` | Téléchargement du paquet de skill (empaquetage dynamique) |

Les skills sont placés dans le répertoire `mcp-gateway/skills/` (sous-répertoires contenant SKILL.md), **analysés automatiquement à chaque requête, sans redémarrage**. Le skill de démarrage `skill-market` est inclus.

> 📌 Dans DeepChat, MCP et Skill sont deux notions différentes : MCP est un « outil » (function calling), Skill est un « paquet de compétences d'agent intelligent » (SKILL.md + scripts). Le Skill de DeepChat ne dispose pas d'« URL de marché personnalisée » : il ne prend en charge que l'installation par dossier / ZIP / URL, la distribution intranet s'appuie donc sur l'« installation par URL ».

## 11.5 ⚠️ Nom d'hôte du marché de Skills (paramètre de déploiement, à remplacer impérativement)

« Le gestionnaire de skills » lit le `market_url` de `config.json` pour requêter l'inventaire `/skills`. Deux points clés :

- **Utiliser un nom d'hôte, pas une IP** : l'environnement d'agent de DeepChat anonymise l'IP en `[IP_ADDRESS_REDACTED]`, rendant l'adresse réelle illisible ;

- **Le nom d'hôte est un paramètre de déploiement** : différent pour chaque déploiement, à ne pas copier tel quel.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<hôte-marché>:3100" }
```

#### Automatique (déploiement par Agent)

Lors de la collecte des paramètres, l'Agent demande le « nom d'hôte du marché de Skills » et remplace automatiquement `<hôte-marché>` dans `config.json` et `SKILL.md`.

#### Manuel

1. Modifiez `config.json` + l'adresse de secours de `SKILL.md`, remplacez `<hôte-marché>` ;

2. Rendez le nom d'hôte résolvable : sur une machine isolée, ajoutez `<IP-du-serveur> <nom-d'hôte>` dans `C:\Windows\System32\drivers\etc\hosts` ; sur l'intranet de l'entreprise, ajoutez un enregistrement A dans le DNS.

> ✅ Pour le nom d'hôte, il est conseillé d'utiliser un FQDN « nom-de-service + domaine d'entreprise », par exemple `skillmarket.votre-domaine-entreprise`. Ajout d'un enregistrement A au DNS : contrôleur de domaine « DNS → zone de recherche directe → votre domaine → nouvel hôte (A) », ou `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "votre-domaine" -IPv4Address "<IP-du-serveur>"`.

## 11.6 API d'administration (pour les opérations CRUD du Centre d'administration IA)

| Point de terminaison | Rôle |
| --- | --- |
| `GET/POST /api/servers`, `PUT/DELETE /api/servers/:name` | CRUD des MCP Server (écriture de la configuration + reconnexion automatique) |
| `POST /api/skills/upload` | Téléverser un zip de skill (validation de SKILL.md, protection contre la traversée de chemin) |
| `DELETE /api/skills/:name` | Supprimer un skill |

En-tête `X-Admin-Token` requis (`MCP_ADMIN_TOKEN` de `.env`). Appelé par proxy via la page « MCP Gateway » du Centre d'administration IA (protégé par le rôle `ai-platform-admin`).

> 📖 Documentation officielle :protocole MCP officiel https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← Chapitre 10 : Distribution de DeepChat et CI/CD](ch10-deepchat.md) · [📖 Index](index.md) · [Chapitre 12 : Centre d'administration IA →](ch12-admin-center.md)
