# 第10章：DeepChat 分发与 CI/CD

*第一部分 · 部署篇*

> 把 DeepChat 安装包分发给员工，以及用 Gitea Actions 自动同步官方新版本。

[← 第9章：Dify / Ghost / Gitea 配置](ch09-products.md) · [📖 目录](index.md) · [第11章：MCP Gateway 与 Skill 市场 →](ch11-mcp.md)

---

## 10.1 分发链路

分发链路 = GitHub Releases 安装包 → `deepchat-sync` 仓库的 Gitea Actions → 更新服务器（:8091）→ Ghost 下载页 → 员工下载。

> 📌 已删除 `deepchat` 源码 mirror 仓库——mirror 只同步 git 源码、不同步 release 安装包，对分发无用。若要做源码审计/二次开发再单独建。

## 10.2 下载安装包到更新服务器

```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```

验证：`curl -I http://<服务器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → 200/206。再更新 Ghost 下载页（见第 9 章）。

## 10.3 自动同步（Gitea Actions，推荐）

| 组件 | 说明 |
| --- | --- |
| `deepchat-sync` 仓库 | 普通仓库（不能用 mirror），放 `.gitea/workflows/sync.yml` + `update_ghost.py` |
| 触发 | `schedule`（每天 UTC 2 点）+ `workflow_dispatch`（手动） |
| 逻辑 | 查 GitHub 最新 tag → 对比 `version.txt` → 有新版则下载 + 更新 Ghost 下载页 + 写版本 |

```
# 手动触发一次
curl -X POST "http://<服务器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密码>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

> ⚠️ 关键坑：① act_runner 的 `container.network` 必须通过 `config.yaml`（+`CONFIG_FILE` 环境变量）配，否则 job 容器解析不了 `gitea` 主机名；② docker.sock 由 runner 自动挂载，别在 options 里再挂（报 Duplicate mount point）。

## 10.4 国内下载源配置（sync-config.json）

官网 `deepchatai.cn` 下载页的安装包仍指向 GitHub，国内基本不通。真正解决靠 `sync-config.json`：

| 字段 | 作用 | 默认 |
| --- | --- | --- |
| `version_source` | `github`（GitHub API 最准）或 `official`（官网缓存，可达但滞后） | `github` |
| `download_prefix` | 下载加速前缀，如 `https://ghproxy.com/` | `""` |
| `keep_releases` | 版本历史保留数 | `5` |
| `market_url` | 下载页「先装技能管家」的内网市场地址 | `http://<服务器IP>:3100` |

```
# 能连 GitHub：默认不改
{ "version_source": "github", "download_prefix": "" }
# GitHub 加速代理（最常用）
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```

> 📌 工作流内置 `version_cmp.py` 版本比较，只有「最新版 > 本地版」才下载（避免官网缓存滞后把客户端回退旧版）。

## 10.5 方式 B：Docker 构建自定义版本（可选）

```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# 容器内
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# 产物在 dist/，退出后 copy 到 deepchat-updates/
```

## 10.6 配置 DeepChat 客户端（员工侧）

1. DeepChat → 设置 → 模型服务 → 自定义 Provider / OpenAI 兼容；

2. API Base URL：`http://<服务器IP>:3000/v1`（必须内网 IP）；

3. API Key：`deepchat-key` 的 `sk-xxx`；

4. 模型：`deepseek-chat`，保存后测试对话。

> 📖 原厂文档：DeepChat 快速开始 https://deepchatai.cn/docs/guide/getting-started/ · 开源仓库 https://github.com/ThinkInAIXYZ/deepchat

---

[← 第9章：Dify / Ghost / Gitea 配置](ch09-products.md) · [📖 目录](index.md) · [第11章：MCP Gateway 与 Skill 市场 →](ch11-mcp.md)
