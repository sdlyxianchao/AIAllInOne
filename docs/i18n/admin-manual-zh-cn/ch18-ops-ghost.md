# 第18章：Ghost 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> 企业门户 / Hub：文章、页面、导航、主题、成员。

[← 第17章：Dify 日常管理](ch17-ops-dify.md) · [📖 目录](index.md) · [第19章：Gitea 日常管理 →](ch19-ops-gitea.md)

---

**入口**：前台 `http://<服务器IP>:8090`；后台 `http://<服务器IP>:8090/ghost/`（注意 /ghost/ 后缀）。

## 18.1 登录后台

Ghost 5 后台是**免密登录**：输入邮箱 → Ghost 发 6 位验证码到 MailHog（`:8025`）。更快的方式：在 AI 管理中心点「Ghost 后台」的「打开」按钮，自动完成登录（本地算 TOTP 码，免翻邮件）。

## 18.2 发布内容

1. **文章**：Posts → New post → 写内容（Markdown 编辑器）→ Publish；

2. **页面**：Pages → New page（如「下载中心」slug `downloads`）；

3. **标签/分类**：Tags → 建分类（如 `news` / `docs`），文章归到分类下。

## 18.3 导航菜单

1. 后台 → 外观（Design）→ 菜单（Navigation）；

2. 编辑「Primary」主导航，添加首页/新闻/下载中心/AI 工作台/帮助文档（见第 9 章菜单表）。

## 18.4 主题

- **切换**：外观 → 主题，自带的 Casper / Source 直接激活；

- **安装**：主题市场（Design → Change theme）或上传 zip。

> ⚠️ 别从 GitHub 装最新版主题（可能适配 Ghost 6.x，5.x 报 incompatible），要装旧版 zip。

## 18.5 成员与订阅（如需）

- Members：管理订阅者；

- 若不需要订阅，可忽略此模块（内网门户通常用不到）。

## 18.6 集成（API Token）

1. 后台 → Settings → Integrations → 添加自定义集成；

2. 生成 Admin API Key（格式 `id:secret`），供 Gitea Actions 发布公告等自动化用。

> ⚠️ 关键坑：① 别在首页 `/` 点「注册」（那是访客订阅者注册）；② 6 位验证码本质是 TOTP，AI 管理中心能本地算出；③ 即使本地算码，Ghost 仍会真发邮件，所以 MailHog 必须保留（否则 `Failed to send email`）。

> 📖 原厂文档：Ghost 官方文档 https://ghost.org/docs/ · 管理后台 https://ghost.org/docs/admin/

---

[← 第17章：Dify 日常管理](ch17-ops-dify.md) · [📖 目录](index.md) · [第19章：Gitea 日常管理 →](ch19-ops-gitea.md)
