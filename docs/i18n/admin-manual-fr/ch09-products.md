# Chapitre 9 : Configuration de Dify / Ghost / Gitea

*Première partie · Déploiement*

> L'initialisation et la configuration d'interconnexion de chacun des trois produits.

[← Chapitre 8 : LiteLLM : vérification et cache](ch08-litellm.md) · [📖 Index](index.md) · [Chapitre 10 : Distribution de DSH Desktop et CI/CD →](ch10-dsh.md)

---

## 9.1 Dify : configurer le fournisseur de modèles

1. Ouvrez `http://<IP-du-serveur>` → définissez d'abord l'e-mail/mot de passe administrateur (e-mail `ai_all_in_one_admin@<domaine-entreprise>`) ;

2. **Paramètres → Fournisseurs de modèles** → OpenAI-API-compatible → ajouter un modèle :

- Nom du modèle `deepseek-chat` (selon la réalité) ;

- Clé API : le `sk-xxx` de `dify-key` ;

- API endpoint : `http://host.docker.internal:3000/v1`.

3. Studio → créer un assistant de chat → choisir le modèle → envoyer un message pour valider.

> ⚠️ Dify utilise `host.docker.internal` et non le nom de conteneur, car Dify se trouve sur son propre réseau, différent de celui de NewAPI.

## 9.2 Ghost : configurer le portail

1. Interface d'administration `http://<IP-du-serveur>:8090/ghost/` (**attention au suffixe /ghost/**). La première visite suit l'assistant setup pour créer l'administrateur (e-mail `ai_all_in_one_admin@<domaine-entreprise>`, mot de passe ≥ 10 caractères) ;

2. Automatisation : lancez directement `scripts\ghost-setup.ps1` qui crée l'administrateur en une fois via l'API setup, équivalent à l'assistant (déjà initialisé, il passe automatiquement) ;

3. **Thème** : Apparence → Thèmes, activez directement Casper/Source inclus ;

4. **Menu de navigation** : Apparence → Menus → créez « Navigation principale ».

| Élément de menu | Type | URL |
| --- | --- | --- |
| Accueil | Page | `/` |
| Actualités | Catégorie | `/category/news` |
| Centre de téléchargement | Page | `/downloads` |
| Espace de travail IA | Lien personnalisé | `http://<IP-du-serveur>` |
| Documentation d'aide | Catégorie | `/category/docs` |

1. **Page du centre de téléchargement** : Pages → créer « Centre de téléchargement » (slug `downloads`), placez-y le lien intranet des paquets d'installation DSH Desktop.

```
## DSH Desktop Enterprise
### Windows
- [DSH Desktop v0.5.0 (Windows x64)](http://<IP-du-serveur>:8091/dsh/dsh-desktop-windows-x64-setup.exe)
### macOS
- [DSH Desktop v0.5.0 (macOS x64)](http://<IP-du-serveur>:8091/dsh/dsh-desktop-mac-x64.dmg)
```

> ⚠️ Ne cliquez pas sur « S'inscrire » sur la page d'accueil `/` — c'est l'inscription des abonnés visiteurs (sans SMTP configuré, cela renvoie 500) ; l'entrée administrateur est `/ghost/`. N'installez pas la dernière version d'un thème depuis GitHub (peut cibler Ghost 6.x, incompatible avec 5.x).

## 9.3 Gitea : initialisation et enregistrement du Runner

1. Ouvrez `http://<IP-du-serveur>:3002` → assistant d'installation (base SQLite déjà préconfigurée) → créez l'administrateur (nom d'utilisateur `ai_all_in_one_admin`) ;

2. Avatar en haut à droite → **Site Administration → Actions** → vérifiez que Enabled Actions est activé ;

3. **Runners → Create new Runner** → copiez le Registration Token ;

4. Renseignez le Token dans `GITEA_RUNNER_TOKEN` de `.env`, puis reconstruisez le Runner :

```
# ⚠️ Utilisez impérativement up -d, pas restart (restart ne relit pas le token de .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

> ⚠️ Piège 1 : l'erreur `readonly database` vient souvent de `gitea.db` appartenant à root ; supprimez cette base appartenant à root pour qu'elle soit reconstruite en tant qu'utilisateur git.
 ⚠️ Piège 2 : `ROOT_URL` doit être `http://<IP-du-serveur>:3002/`, sinon les liens de dépôt générés sont en localhost et deviennent invalides pour les employés.

> 📖 Documentation officielle :Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (en chinois) https://docs.gitea.com/zh-cn

---

[← Chapitre 8 : LiteLLM : vérification et cache](ch08-litellm.md) · [📖 Index](index.md) · [Chapitre 10 : Distribution de DSH Desktop et CI/CD →](ch10-dsh.md)
