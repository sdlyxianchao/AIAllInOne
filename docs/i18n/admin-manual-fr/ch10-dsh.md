# Chapitre 10 : Distribution de DSH Desktop et CI/CD

*Première partie · Déploiement*

> Distribuer les paquets d'installation DSH Desktop aux employés, et synchroniser automatiquement les nouvelles versions officielles avec Gitea Actions.

[← Chapitre 9 : Configuration de Dify / Ghost / Gitea](ch09-products.md) · [📖 Index](index.md) · [Chapitre 11 : MCP Gateway et marché de Skills →](ch11-mcp.md)

---

## 10.1 Chaîne de distribution

Chaîne de distribution = paquets GitHub Releases → Gitea Actions du dépôt `dsh-sync` → serveur de mise à jour (:8091) → page de téléchargement Ghost → téléchargement par les employés.

> 📌 Le dépôt mirror du code source `dsh` a été supprimé — le mirror ne synchronise que le code source git, pas les paquets de release, donc inutile pour la distribution. Recréez-le séparément si vous faites de l'audit de code source ou du développement secondaire.

## 10.2 Télécharger les paquets d'installation vers le serveur de mise à jour

```
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -L -o dsh-updates/dsh/dsh-desktop-mac-x64.dmg \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-mac-x64.dmg
```

Vérification : `curl -I http://<IP-du-serveur>:8091/dsh/dsh-desktop-windows-x64-setup.exe` → 200/206. Mettez ensuite à jour la page de téléchargement Ghost (voir chapitre 9).

## 10.3 Synchronisation automatique (Gitea Actions, recommandé)

| Composant | Description |
| --- | --- |
| Dépôt `dsh-sync` | Dépôt ordinaire (pas mirror), contenant `.gitea/workflows/sync.yml` + `update_ghost.py` |
| Déclenchement | `schedule` (tous les jours à 2 h UTC) + `workflow_dispatch` (manuel) |
| Logique | Vérifie le dernier tag GitHub → compare `version.txt` → si nouvelle version : télécharge + met à jour la page Ghost + écrit la version |

```
# Déclencher manuellement une fois
curl -X POST "http://<IP-du-serveur>:3002/api/v1/repos/ai_all_in_one_admin/dsh-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<mot-de-passe>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ Pièges clés : ① le `container.network` d'act_runner doit être configuré via `config.yaml` (+ variable d'environnement `CONFIG_FILE`), sinon le conteneur du job ne peut pas résoudre le nom d'hôte `gitea` ; ② docker.sock est monté automatiquement par le runner, ne le montez pas à nouveau dans les options (erreur Duplicate mount point).

## 10.4 Configuration de la source de téléchargement en Chine (sync-config.json)

Sur le site officiel `www.dshdesktop.com`, les paquets de la page de téléchargement pointent encore vers GitHub, souvent inaccessibles en Chine. La vraie solution repose sur `sync-config.json` :

| Champ | Rôle | Défaut |
| --- | --- | --- |
| `version_source` | `github` (API GitHub la plus fiable) ou `official` (cache du site officiel, accessible mais en retard) | `github` |
| `download_prefix` | Préfixe d'accélération de téléchargement, par exemple `https://ghproxy.com/` | `""` |
| `keep_releases` | Nombre d'historiques de versions conservés | `5` |
| `market_url` | Adresse intranet du marché de la page de téléchargement « installer d'abord le gestionnaire de skills » | `http://<IP-du-serveur>:3100` |

```
# Accès GitHub possible : ne rien changer par défaut
{ "version_source": "github", "download_prefix": "" }
# Proxy d'accélération GitHub (le plus courant)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```

> 📌 Le workflow intègre la comparaison de versions `version_cmp.py` : ne télécharge que si « dernière version > version locale » (évite que le retard du cache officiel fasse revenir le client à une ancienne version).

## 10.5 Méthode B : build Docker d'une version personnalisée (optionnel)

```
mkdir dsh-build
docker run -it --rm -v ${PWD}/dsh-build:/app -w /app node:20 bash
# Dans le conteneur
git clone https://github.com/dataelement/dsh-desktop.git .
npm ci
npx electron-builder --win --x64
# Les artefacts sont dans dist/, copiez-les dans dsh-updates/ après la sortie
```

## 10.6 Configurer le client DSH Desktop (côté employé)

1. DSH Desktop → Paramètres → Services de modèles → fournisseur personnalisé / compatible OpenAI ;

2. API Base URL : `http://<IP-du-serveur>:3000/v1` (IP intranet obligatoire) ;

3. Clé API : le `sk-xxx` de `dsh-key` ;

4. Modèle : `deepseek-chat`, enregistrez puis testez une conversation.

> 📖 Documentation officielle :démarrage rapide DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · dépôt open source https://github.com/dataelement/dsh-desktop

---

[← Chapitre 9 : Configuration de Dify / Ghost / Gitea](ch09-products.md) · [📖 Index](index.md) · [Chapitre 11 : MCP Gateway et marché de Skills →](ch11-mcp.md)
