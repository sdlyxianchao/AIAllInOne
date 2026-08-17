# 第19章：Gitea 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> 内部 Git + CI/CD：仓库、组织、Runner、Actions。

[← 第18章：Ghost 日常管理](ch18-ops-ghost.md) · [📖 目录](index.md) · [第20章：MCP Gateway 日常管理 →](ch20-ops-mcp.md)

---

**入口**：Web `http://<服务器IP>:3002`；SSH `ssh://git@<服务器IP>:2222`。

## 19.1 仓库与组织

1. **建仓库**：右上角 + → New repository；

2. **建组织**：+ → New organization，组织下建仓库、管理团队；

3. **迁移外部仓库**：+ → New migration，填 GitHub 地址可 mirror（只读同步源码）。

## 19.2 用户与权限

- **添加用户**：Site Administration → User Accounts → Create user；

- **仓库权限**：仓库 → Settings → Collaborators；

- **组织团队**：组织 → Teams → 建团队 → 加成员 → 赋仓库权限。

## 19.3 Actions / Runner 管理

1. **启用 Actions**：Site Administration → Actions → Enabled；

2. **注册 Runner**：Runners → Create new Runner → 复制 Token → 填 `.env` 的 `GITEA_RUNNER_TOKEN` → `docker compose up -d gitea-runner`；

3. **看 Runner 状态**：Runners 页显示 Idle（绿色）即正常；

4. **跑工作流**：仓库 → Actions → 手动运行或 push 触发。

> ⚠️ 改 Runner token 必须 `up -d`（restart 不重读 .env）。

## 19.4 站点设置

- **ROOT_URL**：`GITEA__server__ROOT_URL` 要设内网 `http://<服务器IP>:3002/`，否则生成的仓库链接是 localhost；

- **注册策略**：Site Administration → Config 调注册开关、邮箱配置。

> ⚠️ 关键坑：报 `readonly database` 多为 `gitea.db` 被 root 属主，删掉那个 root 属主的 db 让它以 git 用户重建。

> 📖 原厂文档：Gitea 官方文档（中文） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← 第18章：Ghost 日常管理](ch18-ops-ghost.md) · [📖 目录](index.md) · [第20章：MCP Gateway 日常管理 →](ch20-ops-mcp.md)
