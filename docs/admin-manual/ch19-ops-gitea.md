# Chapter 19: Gitea Day-to-Day Administration

*Part 2 · Administration*

> Internal Git + CI/CD: repositories, organizations, Runners, Actions.

[← Chapter 18: Ghost Day-to-Day Administration](ch18-ops-ghost.md) · [📖 Index](index.md) · [Chapter 20: MCP Gateway Day-to-Day Administration →](ch20-ops-mcp.md)

---

**Entry**: Web `http://<server-IP>:3002`; SSH `ssh://git@<server-IP>:2222`.

## 19.1 Repositories and Organizations

1. **Create repo**: top-right + → New repository;

2. **Create org**: + → New organization, create repos and manage teams under it;

3. **Migrate external repo**: + → New migration, enter a GitHub address to mirror (read-only source sync).

## 19.2 Users and Permissions

- **Add user**: Site Administration → User Accounts → Create user;

- **Repo permissions**: repo → Settings → Collaborators;

- **Org teams**: organization → Teams → create team → add members → grant repo permissions.

## 19.3 Actions / Runner Management

1. **Enable Actions**: Site Administration → Actions → Enabled;

2. **Register Runner**: Runners → Create new Runner → copy Token → fill `GITEA_RUNNER_TOKEN` in `.env` → `docker compose up -d gitea-runner`;

3. **Check Runner status**: the Runners page showing Idle (green) means normal;

4. **Run workflows**: repo → Actions → run manually or trigger via push.

> ⚠️ Changing the Runner token requires `up -d` (restart does not re-read .env).

## 19.4 Site Settings

- **ROOT_URL**: `GITEA__server__ROOT_URL` must be set to the intranet `http://<server-IP>:3002/`, otherwise generated repo links are localhost;

- **Registration policy**: Site Administration → Config to adjust registration switch and email config.

> ⚠️ Key pitfall: `readonly database` is usually because `gitea.db` is owned by root; delete that root-owned db and let it be recreated as the git user.

> 📖 Vendor docs:Gitea official docs (Chinese) https://docs.gitea.com/zh-cn · administration https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← Chapter 18: Ghost Day-to-Day Administration](ch18-ops-ghost.md) · [📖 Index](index.md) · [Chapter 20: MCP Gateway Day-to-Day Administration →](ch20-ops-mcp.md)
