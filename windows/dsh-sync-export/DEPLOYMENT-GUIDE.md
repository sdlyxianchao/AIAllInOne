# DSH Desktop 同步系统部署指南

## 系统架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub        │     │   Gitea          │     │   Gitea Runner  │
│   (源码仓库)     │────▶│   (代码托管)      │────▶│   (执行同步)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼──────────────┐
                        │                                 ▼              │
                        │  ┌──────────────────┐  ┌──────────────────┐   │
                        │  │   AI Admin Center │  │  Update Server   │   │
                        │  │   (管理面板)       │◀─│  (Nginx 文件服务) │   │
                        │  └────────┬─────────┘  └──────────────────┘   │
                        │           │                                    │
                        │           ▼                                    │
                        │  ┌──────────────────┐                         │
                        │  │   Ghost           │                         │
                        │  │   (下载页面)       │                         │
                        │  └──────────────────┘                         │
                        │                                              │
                        │  192.168.31.117                               │
                        └──────────────────────────────────────────────┘
```

## 组件说明

| 组件 | 容器名 | 端口 | 作用 |
|------|--------|------|------|
| Gitea | gitea | 3002 | 代码托管，存储同步脚本 |
| Gitea Runner | gitea-runner | - | 执行 GitHub Actions 工作流 |
| AI Admin Center | admin-portal | 10086 | 管理面板，触发同步，更新 Ghost |
| Update Server | update-server | 8091 | Nginx 文件服务，托管安装包 |
| Ghost | ghost | 8090 | 下载页面，展示版本和下载链接 |

## 文件结构

```
update-server:/usr/share/nginx/html/
├── dsh/
│   ├── versions.json          # 版本清单
│   ├── sync-history.json      # 同步历史
│   ├── sync-progress.json     # 同步进度
│   ├── v0.6.3/                # 版本目录
│   │   ├── dsh-desktop-windows-x64-setup.exe
│   │   ├── dsh-desktop-mac-x64.dmg
│   │   └── dsh-desktop-mac-arm64.dmg
│   └── v0.5.0/
│       └── ...
└── version.txt                # 最新版本号
```

## 部署步骤

### 1. 创建 Gitea 仓库

```bash
# 在 Gitea 中创建 dsh-sync 仓库
# 上传以下文件：
# - .gitea/workflows/sync.yml
# - sync_download.py
# - sync-config.json
# - version_cmp.py
```

### 2. 配置 Gitea Runner

```bash
# 注册 Runner 到 Gitea
# 确保 Runner 可以访问 Docker socket
docker run -d --name gitea-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e GITEA_INSTANCE_URL=http://gitea:3000 \
  -e GITEA_RUNNER_REGISTRATION_TOKEN=<token> \
  gitea/act_runner:latest
```

### 3. 部署 Update Server

```bash
docker run -d --name update-server \
  -p 8091:80 \
  -v /path/to/dsh-data:/usr/share/nginx/html/dsh \
  nginx:alpine
```

### 4. 部署 Ghost

```bash
docker run -d --name ghost \
  -p 8090:2368 \
  -v /path/to/ghost-data:/var/lib/ghost/content \
  ghost:5
```

### 5. 配置 AI Admin Center

在 `admin-portal/server.js` 中添加同步相关端点（见 `admin-portal-sync-endpoints.js`）。

关键配置：
```javascript
const GITEA_URL = 'http://gitea:3000';
const GITEA_ADMIN_USER = 'ai_all_in_one_admin';
const GITEA_ADMIN_PASS = '<password>';
```

### 6. 安装 Python 依赖

```bash
# 在 admin-portal 容器中安装 Python（用于更新 Ghost 数据库）
docker exec admin-portal apk add --no-cache python3 py3-pip
```

## 同步脚本功能说明

### sync_download.py

主同步脚本，功能包括：

1. **检查新版本** - 从 GitHub API 获取最新 release
2. **读取已有版本** - 从 admin-portal API 读取（无需认证的 internal 端点）
3. **下载安装包** - 下载 Windows/macOS 安装包
4. **更新 versions.json** - 保留所有历史版本
5. **更新 sync-history.json** - 记录每次同步（无论是否有新版本）
6. **更新 Ghost 页面** - 调用 admin-portal API 更新下载页面
7. **复制到 update-server** - 使用 Docker API 复制文件

### sync-config.json

```json
{
  "repo": "dataelement/dsh-desktop",
  "platforms": {
    "windows-x64": "dsh-desktop-windows-x64-setup.exe",
    "mac-x64": "dsh-desktop-mac-x64.dmg",
    "mac-arm64": "dsh-desktop-mac-arm64.dmg"
  },
  "keep_releases": 5,
  "download_prefix": ""
}
```

### sync.yml (Gitea Actions)

```yaml
name: DSH Desktop Sync
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch: {}
jobs:
  sync:
    runs-on: ubuntu-latest
    container:
      image: python:3-alpine
    steps:
      - name: Download sync script
        run: |
          wget -O sync_download.py "http://gitea:3000/ai_all_in_one_admin/dsh-sync/raw/branch/main/sync_download.py"
          wget -O sync-config.json "http://gitea:3000/ai_all_in_one_admin/dsh-sync/raw/branch/main/sync-config.json"
      - name: Run sync
        run: PYTHONUNBUFFERED=1 python3 sync_download.py
```

## API 端点

### 同步控制

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/gitea/sync/trigger` | POST | 否 | 触发同步 |
| `/api/gitea/sync/force-stop` | POST | 否 | 强制停止同步 |
| `/api/gitea/sync/resync-version` | POST | 否 | 重新同步指定版本 |

### 数据读取

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/gitea/sync/versions` | GET | 是 | 读取版本列表 |
| `/api/gitea/sync/versions-internal` | GET | 否 | 同步脚本用 |
| `/api/gitea/sync/history` | GET | 是 | 读取同步历史 |
| `/api/gitea/sync/history-internal` | GET | 否 | 同步脚本用 |

### Ghost 更新

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/ghost/update-dsh-page` | POST | 否 | 更新 Ghost 页面 |

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
    "detail": "No update (latest: v0.6.3)",
    "version": "v0.6.3",
    "date": "2026-08-27"
  }
]
```

## 故障排查

### 1. 同步后版本列表为空

**原因**：同步脚本无法从 admin-portal API 读取已有版本

**解决**：检查 admin-portal 容器是否正常运行，`/api/gitea/sync/versions-internal` 端点是否可访问

### 2. Ghost 页面不更新

**原因**：admin-portal 容器没有安装 Python

**解决**：
```bash
docker exec admin-portal apk add --no-cache python3 py3-pip
```

### 3. 同步历史不显示

**原因**：sync-history.json 格式不正确

**解决**：确保格式为数组，每个元素包含 `time`, `status`, `detail` 字段

### 4. Gitea Action 不触发

**原因**：Keycloak 会话过期

**解决**：sync/trigger 端点已移除 Keycloak 认证要求，直接调用 Gitea API

## 新机器迁移清单

1. [ ] 部署 Gitea 并创建 dsh-sync 仓库
2. [ ] 注册 Gitea Runner
3. [ ] 部署 update-server (Nginx)
4. [ ] 部署 Ghost
5. [ ] 部署 admin-portal 并添加同步端点
6. [ ] 在 admin-portal 中安装 Python
7. [ ] 配置 sync-config.json
8. [ ] 测试手动触发同步
9. [ ] 验证 Ghost 页面更新
10. [ ] 配置定时同步 (cron)
