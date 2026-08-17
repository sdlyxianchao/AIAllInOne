# Chapitre 19 : Administration quotidienne de Gitea

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Git interne + CI/CD : dépôts, organisations, Runners, Actions.

[← Chapitre 18 : Administration quotidienne de Ghost](ch18-ops-ghost.md) · [📖 Index](index.md) · [Chapitre 20 : Administration quotidienne de MCP Gateway →](ch20-ops-mcp.md)

---

**Accès** : Web `http://<IP-du-serveur>:3002` ; SSH `ssh://git@<IP-du-serveur>:2222`.

## 19.1 Dépôts et organisations

1. **Créer un dépôt** : + en haut à droite → New repository ;

2. **Créer une organisation** : + → New organization, créez des dépôts et gérez des équipes sous l'organisation ;

3. **Migrer un dépôt externe** : + → New migration, renseignez l'adresse GitHub pour faire un mirror (synchronisation du code source en lecture seule).

## 19.2 Utilisateurs et autorisations

- **Ajouter un utilisateur** : Site Administration → User Accounts → Create user ;

- **Autorisations de dépôt** : dépôt → Settings → Collaborators ;

- **Équipes d'organisation** : organisation → Teams → créer une équipe → ajouter des membres → attribuer des autorisations de dépôt.

## 19.3 Gestion des Actions / Runners

1. **Activer Actions** : Site Administration → Actions → Enabled ;

2. **Enregistrer un Runner** : Runners → Create new Runner → copier le Token → renseigner `GITEA_RUNNER_TOKEN` de `.env` → `docker compose up -d gitea-runner` ;

3. **Voir l'état du Runner** : la page Runners affiche Idle (vert) quand tout va bien ;

4. **Exécuter un workflow** : dépôt → Actions → exécution manuelle ou déclenchement par push.

> ⚠️ Pour changer le token du Runner, utilisez impérativement `up -d` (restart ne relit pas .env).

## 19.4 Paramètres du site

- **ROOT_URL** : `GITEA__server__ROOT_URL` doit être réglé sur l'adresse intranet `http://<IP-du-serveur>:3002/`, sinon les liens de dépôt générés sont en localhost ;

- **Politique d'inscription** : Site Administration → Config pour régler l'inscription et la configuration e-mail.

> ⚠️ Piège clé : l'erreur `readonly database` vient souvent de `gitea.db` appartenant à root ; supprimez cette base appartenant à root pour qu'elle soit reconstruite en tant qu'utilisateur git.

> 📖 Documentation officielle :documentation officielle de Gitea (en chinois) https://docs.gitea.com/zh-cn · administration https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← Chapitre 18 : Administration quotidienne de Ghost](ch18-ops-ghost.md) · [📖 Index](index.md) · [Chapitre 20 : Administration quotidienne de MCP Gateway →](ch20-ops-mcp.md)
