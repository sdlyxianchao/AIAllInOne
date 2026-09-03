# 第5章：Dify 獨立部署

*第一部分 · 部署篇*

> Dify 用官方 compose（約 15 個容器）獨立部署，避免埠衝突。

[← 第4章：啟動核心服務](ch04-start.md) · [📖 目錄](index.md) · [第6章：Keycloak：Realm、使用者與 AD →](ch06-keycloak.md)

---

> 📌 Dify 使用官方 docker-compose（含 ~15 個容器），獨立部署避免埠衝突，使用自己的預設網路（與核心服務的 `ai-platform` 網路不同）。

## 5.1 克隆 Dify

```
# 方案 A：GitHub（需能訪問）
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 方案 B：Gitee 官方映像（國內推薦）
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 修復相容性 + 複製環境變數

```
cd dify\docker

# 修復 env_file 格式（相容舊版 Docker Compose）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 複製主環境變數
copy .env.example .env

# 複製所有子模板（sandbox.env 等）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# 修復 Dify 1.16.1 上游校驗問題（必需）
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 驗證
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ 為什麼必須改 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`：Dify 1.16.1 把該欄位從「允許 0」升級為「必須 > 0」，但 `shared.env` 模板還是 0。不改的話 `dify-api-1` / `worker` / `worker_beat` / `api_websocket` 4 個容器啟動即崩，日誌報 `ValidationError: Input should be greater than 0`。

## 5.3 啟動 Dify

```
docker compose up -d
docker compose ps
```

> ✅ 所有容器 `Up`（`init_permissions` 顯示 Exited 是正常的）。瀏覽器開啟 `http://127.0.0.1/install` 初始化管理員帳號。

## 5.4 修復 WebSocket 地址（不改會反覆連 ws://localhost）

`.env` 裡 `NEXT_PUBLIC_SOCKET_URL` 預設是 `ws://localhost`，內網部署時瀏覽器裡的 localhost 指向使用者自己電腦，導致前端反覆連不上（建立應用/工作流除錯會卡住）。

```
# .env 裡改成內網 IP
NEXT_PUBLIC_SOCKET_URL=ws://<伺服器IP>

# docker-compose.yaml 裡 web 服務的 fallback 同步改
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<伺服器IP>}

# 重建 web 容器生效
docker compose up -d web
```

> 📌 改完強刷瀏覽器（Ctrl+F5）。該變數是執行時讀取，改 .env + 重啟 web 即可，無需重建映像。

## 5.5 踩坑速查

> ⚠️ **登入密碼是 base64 傳輸**：Dify 1.16.x 登入介面 `POST /console/api/login` 的 `password` 是 base64 編碼後的密碼。指令碼登入要先 `base64(密碼)`；前端「點登入沒反應」時 console 裡 `GET /account/profile 401` 是未登入的正常現象。

> ⚠️ **忘記管理員密碼重置**：Dify 密碼雜湊是 `pbkdf2_hmac('sha256', password, salt, 10000)`（迭代 10000），無法反解，用容器命令重置（新密碼 ≥ 8 位）：

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<公司網域> \
  --new-password '<新密碼>' \
  --password-confirm '<新密碼>'
```

> 📖 原廠文件：Dify 官方文件 https://docs.dify.ai · 自託管部署 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第4章：啟動核心服務](ch04-start.md) · [📖 目錄](index.md) · [第6章：Keycloak：Realm、使用者與 AD →](ch06-keycloak.md)
