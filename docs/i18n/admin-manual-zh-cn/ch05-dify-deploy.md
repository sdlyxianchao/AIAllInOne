# 第5章：Dify 独立部署

*第一部分 · 部署篇*

> Dify 用官方 compose（约 15 个容器）独立部署，避免端口冲突。

[← 第4章：启动核心服务](ch04-start.md) · [📖 目录](index.md) · [第6章：Keycloak：Realm、用户与 AD →](ch06-keycloak.md)

---

> 📌 Dify 使用官方 docker-compose（含 ~15 个容器），独立部署避免端口冲突，使用自己的默认网络（与核心服务的 `ai-platform` 网络不同）。

## 5.1 克隆 Dify

```
# 方案 A：GitHub（需能访问）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 方案 B：Gitee 官方镜像（国内推荐）
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 修复兼容性 + 复制环境变量

```
cd dify\docker

# 修复 env_file 格式（兼容旧版 Docker Compose）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 复制主环境变量
copy .env.example .env

# 复制所有子模板（sandbox.env 等）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# 修复 Dify 1.16.1 上游校验问题（必需）
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 验证
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ 为什么必须改 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`：Dify 1.16.1 把该字段从「允许 0」升级为「必须 > 0」，但 `shared.env` 模板还是 0。不改的话 `dify-api-1` / `worker` / `worker_beat` / `api_websocket` 4 个容器启动即崩，日志报 `ValidationError: Input should be greater than 0`。

## 5.3 启动 Dify

```
docker compose up -d
docker compose ps
```

> ✅ 所有容器 `Up`（`init_permissions` 显示 Exited 是正常的）。浏览器打开 `http://127.0.0.1/install` 初始化管理员账号。

## 5.4 修复 WebSocket 地址（不改会反复连 ws://localhost）

`.env` 里 `NEXT_PUBLIC_SOCKET_URL` 默认是 `ws://localhost`，内网部署时浏览器里的 localhost 指向用户自己电脑，导致前端反复连不上（创建应用/工作流调试会卡住）。

```
# .env 里改成内网 IP
NEXT_PUBLIC_SOCKET_URL=ws://<服务器IP>

# docker-compose.yaml 里 web 服务的 fallback 同步改
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<服务器IP>}

# 重建 web 容器生效
docker compose up -d web
```

> 📌 改完强刷浏览器（Ctrl+F5）。该变量是运行时读取，改 .env + 重启 web 即可，无需重建镜像。

## 5.5 踩坑速查

> ⚠️ **登录密码是 base64 传输**：Dify 1.16.x 登录接口 `POST /console/api/login` 的 `password` 是 base64 编码后的密码。脚本登录要先 `base64(密码)`；前端「点登录没反应」时 console 里 `GET /account/profile 401` 是未登录的正常现象。

> ⚠️ **忘记管理员密码重置**：Dify 密码哈希是 `pbkdf2_hmac('sha256', password, salt, 10000)`（迭代 10000），无法反解，用容器命令重置（新密码 ≥ 8 位）：

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<公司域名> \
  --new-password '<新密码>' \
  --password-confirm '<新密码>'
```

> 📖 原厂文档：Dify 官方文档 https://docs.dify.ai · 自托管部署 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第4章：启动核心服务](ch04-start.md) · [📖 目录](index.md) · [第6章：Keycloak：Realm、用户与 AD →](ch06-keycloak.md)
