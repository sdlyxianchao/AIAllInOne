# dsh-sync

DSH Desktop 自动同步工具 — 从 GitHub 自动下载 DSH Desktop 安装包，管理多版本，更新下载页面。

## 功能

- **自动同步** — 定时从 GitHub 检查新版本并下载安装包
- **多版本管理** — 保留多个历史版本，支持版本清理
- **多平台支持** — Windows x64、macOS x64 (Intel)、macOS ARM64 (Apple Silicon)
- **下载页面** — 自动更新 Ghost 页面，展示版本历史和下载链接
- **同步历史** — 记录每次同步操作，无论成功或失败
- **手动触发** — 通过 AI Admin Center 手动触发同步或重新同步指定版本

## 架构

```
GitHub (dataelement/dsh-desktop)
    │
    ▼
Gitea Actions (sync.yml) ──▶ sync_download.py
    │                              │
    │                              ├─ 读取已有版本 (admin-portal API)
    │                              ├─ 下载新版本安装包
    │                              ├─ 更新 versions.json
    │                              ├─ 更新 sync-history.json
    │                              ├─ 复制到 update-server
    │                              └─ 更新 Ghost 页面
    ▼                                     ▼
Update Server (:8091)              Ghost (:8090)
(安装包文件服务)                     (下载页面)
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `sync_download.py` | 主同步脚本 |
| `sync-config.json` | 同步配置（仓库、平台、保留版本数） |
| `.gitea/workflows/sync.yml` | Gitea Actions 工作流定义 |
| `version_cmp.py` | 版本比较工具 |

## 配置

### sync-config.json

```json
{
  "product": "DSH Desktop",
  "repo": "dataelement/dsh-desktop",
  "version_source": "github",
  "download_prefix": "",
  "keep_releases": 5,
  "platforms": {
    "windows-x64": "dsh-desktop-windows-x64-setup.exe",
    "mac-x64": "dsh-desktop-mac-x64.dmg",
    "mac-arm64": "dsh-desktop-mac-arm64.dmg"
  },
  "targets": ["windows-x64", "mac-x64", "mac-arm64"]
}
```

| 字段 | 说明 |
|------|------|
| `repo` | GitHub 仓库（owner/repo） |
| `keep_releases` | 保留的历史版本数 |
| `platforms` | 平台标识 → 安装包文件名映射 |
| `download_prefix` | 下载 URL 前缀（代理用） |

### 定时同步

在 `.gitea/workflows/sync.yml` 中配置 cron：

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点
  workflow_dispatch: {}   # 支持手动触发
```

## 依赖

- **Gitea** — 代码托管 + Actions 执行
- **Gitea Runner** — 执行工作流（需挂载 Docker socket）
- **AI Admin Center** — 提供 API 端点（版本读取、历史读取、Ghost 更新）
- **Update Server** — Nginx 文件服务，托管安装包
- **Ghost** — 下载页面展示

## API 端点

同步脚本依赖 AI Admin Center 提供的以下端点：

| 端点 | 说明 |
|------|------|
| `GET /api/gitea/sync/versions-internal` | 读取已有版本 |
| `GET /api/gitea/sync/history-internal` | 读取同步历史 |
| `POST /api/ghost/update-dsh-page` | 更新 Ghost 页面 |

## 数据格式

### versions.json

```json
{
  "versions": [
    {
      "version": "v0.6.3",
      "date": "2026-08-27",
      "files": {
        "windows-x64": "dsh-desktop-windows-x64-setup.exe",
        "mac-x64": "dsh-desktop-mac-x64.dmg",
        "mac-arm64": "dsh-desktop-mac-arm64.dmg"
      }
    }
  ]
}
```

### sync-history.json

```json
[
  {
    "time": "2026-08-27T21:27:00",
    "status": "success",
    "detail": "Synced v0.6.3 (3 files)",
    "version": "v0.6.3",
    "date": "2026-08-27"
  }
]
```

## 许可证

内部使用。
