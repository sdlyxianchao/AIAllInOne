# 第9章：Dify / Ghost / Gitea 配置

*第一部分 · 部署篇*

> 三个产品各自的初始化与互连配置。

[← 第8章：LiteLLM：验证与缓存](ch08-litellm.md) · [📖 目录](index.md) · [第10章：DSH Desktop 分发与 CI/CD →](ch10-dsh.md)

---

## 9.1 Dify：配置模型供应商

1. 打开 `http://<服务器IP>` → 首次设管理员邮箱/密码（邮箱 `ai_all_in_one_admin@<公司域名>`）；

2. **设置 → 模型供应商** → OpenAI-API-compatible → 添加模型：

- 模型名 `deepseek-chat`（按实际）；

- API Key：`dify-key` 的 `sk-xxx`；

- API endpoint：`http://host.docker.internal:3000/v1`。

3. 工作室 → 创建聊天助手 → 选模型 → 发消息验证。

> ⚠️ Dify 用 `host.docker.internal` 而不是容器名，因为 Dify 在自己网络里、与 NewAPI 不同网络。

## 9.2 Ghost：配置门户

1. 后台入口 `http://<服务器IP>:8090/ghost/`（**注意 /ghost/ 后缀**）。首次走 setup 向导建管理员（邮箱 `ai_all_in_one_admin@<公司域名>`，密码 ≥10 位）；

2. 自动化：直接跑 `scripts\ghost-setup.ps1` 用 setup API 一次建管理员，等效向导（已初始化自动跳过）；

3. **主题**：外观 → 主题，自带的 Casper/Source 直接激活即可；

4. **导航菜单**：外观 → 菜单 → 建「主导航」。

| 菜单项 | 类型 | URL |
| --- | --- | --- |
| 首页 | 页面 | `/` |
| 新闻动态 | 分类 | `/category/news` |
| 下载中心 | 页面 | `/downloads` |
| AI 工作台 | 自定义链接 | `http://<服务器IP>` |
| 帮助文档 | 分类 | `/category/docs` |

1. **下载中心页面**：页面 → 新建「下载中心」（slug `downloads`），内容放 DSH Desktop 安装包内网链接。

```
## DSH Desktop 企业版
### Windows
- [DSH Desktop v0.5.0（Windows x64）](http://<服务器IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe)
### macOS
- [DSH Desktop v0.5.0（macOS x64）](http://<服务器IP>:8091/dsh/dsh-desktop-mac-x64.dmg)
```

> ⚠️ 别在门户首页 `/` 点「注册」——那是访客订阅者注册（未配 SMTP 会 500）；管理员入口是 `/ghost/`。别从 GitHub 装最新版主题（可能适配 Ghost 6.x，5.x 报 incompatible）。

## 9.3 Gitea：初始化和 Runner 注册

1. 打开 `http://<服务器IP>:3002` → 安装向导（数据库 SQLite 已预配）→ 建管理员（用户名 `ai_all_in_one_admin`）；

2. 右上角头像 → **Site Administration → Actions** → 确认 Enabled Actions 开启；

3. **Runners → Create new Runner** → 复制 Registration Token；

4. 把 Token 填进 `.env` 的 `GITEA_RUNNER_TOKEN`，重建 Runner：

```
# ⚠️ 必须用 up -d，不能用 restart（restart 不重读 .env 的 token）
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

> ⚠️ 踩坑 1：报 `readonly database` 多为 `gitea.db` 被 root 属主，删掉那个 root 属主的 db 让它以 git 用户重建。
 ⚠️ 踩坑 2：`ROOT_URL` 要设成 `http://<服务器IP>:3002/`，否则生成的仓库链接是 localhost，员工点开失效。

> 📖 原厂文档：Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea（中文） https://docs.gitea.com/zh-cn

---

[← 第8章：LiteLLM：验证与缓存](ch08-litellm.md) · [📖 目录](index.md) · [第10章：DSH Desktop 分发与 CI/CD →](ch10-dsh.md)
