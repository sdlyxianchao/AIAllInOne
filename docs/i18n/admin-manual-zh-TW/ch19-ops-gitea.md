# 第19章：Gitea 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> 內部 Git + CI/CD：倉庫、組織、Runner、Actions。

[← 第18章：Ghost 日常管理](ch18-ops-ghost.md) · [📖 目錄](index.md) · [第20章：MCP Gateway 日常管理 →](ch20-ops-mcp.md)

---

**入口**：Web `http://<伺服器IP>:3002`；SSH `ssh://git@<伺服器IP>:2222`。

## 19.1 倉庫與組織

1. **建倉庫**：右上角 + → New repository；

2. **建組織**：+ → New organization，組織下建倉庫、管理團隊；

3. **遷移外部倉庫**：+ → New migration，填 GitHub 地址可 mirror（只讀同步原始碼）。

## 19.2 使用者與權限

- **新增使用者**：Site Administration → User Accounts → Create user；

- **倉庫權限**：倉庫 → Settings → Collaborators；

- **組織團隊**：組織 → Teams → 建團隊 → 加成員 → 賦倉庫權限。

## 19.3 Actions / Runner 管理

1. **啟用 Actions**：Site Administration → Actions → Enabled；

2. **註冊 Runner**：Runners → Create new Runner → 複製 Token → 填 `.env` 的 `GITEA_RUNNER_TOKEN` → `docker compose up -d gitea-runner`；

3. **看 Runner 狀態**：Runners 頁顯示 Idle（綠色）即正常；

4. **跑工作流**：倉庫 → Actions → 手動執行或 push 觸發。

> ⚠️ 改 Runner token 必須 `up -d`（restart 不重讀 .env）。

## 19.4 站點設定

- **ROOT_URL**：`GITEA__server__ROOT_URL` 要設內網 `http://<伺服器IP>:3002/`，否則生成的倉庫連結是 localhost；

- **註冊策略**：Site Administration → Config 調註冊開關、郵箱配置。

> ⚠️ 關鍵坑：報 `readonly database` 多為 `gitea.db` 被 root 屬主，刪掉那個 root 屬主的 db 讓它以 git 使用者重建。

> 📖 原廠文件：Gitea 官方文件（中文） https://docs.gitea.com/zh-cn · 管理 https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← 第18章：Ghost 日常管理](ch18-ops-ghost.md) · [📖 目錄](index.md) · [第20章：MCP Gateway 日常管理 →](ch20-ops-mcp.md)
