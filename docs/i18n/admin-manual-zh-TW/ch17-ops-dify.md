# 第17章：Dify 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> AI 應用平台：應用、知識庫、模型供應商、成員權限、釋出。

[← 第16章：LiteLLM 日常管理](ch16-ops-litellm.md) · [📖 目錄](index.md) · [第18章：Ghost 日常管理 →](ch18-ops-ghost.md)

---

**入口**：`http://<伺服器IP>`（80 埠，獨立官方 compose，升級維護在 `dify/docker/` 單獨操作）。

## 17.1 應用管理（工作室）

1. **建立應用**：工作室 → 建立空白應用 → 選型別（聊天助手 / Agent / 工作流 / 文字生成）；

2. **編排**：拖拽節點編排提示詞、工具、知識庫、變數；

3. **除錯**：右上角「預覽」執行除錯；

4. **釋出**：除錯透過後「釋出」→ 生成分享連結或嵌入 Web 應用。

## 17.2 知識庫管理

1. 知識庫 → 建立知識庫；

2. 上傳文件（Word / PDF / Markdown / 網頁連結），選分段規則 + 索引方式（高質量/經濟）；

3. 在應用裡「新增」該知識庫，AI 即可基於文件回答。

> 📌 知識庫內容會被 AI 用於回答，機密資料不要上傳（遵守資料分級規範）。

## 17.3 模型供應商

- **新增模型**：設定 → 模型供應商 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（走 NewAPI）+ `dify-key`；

- **系統模型設定**：指定預設聊天/推理/嵌入模型。

## 17.4 成員與權限

- **成員**：邀請成員進工作空間，設 Owner/Admin/Editor/Normal 角色；

- **登入方式**：設定 → 登入方式 → 可接 OIDC（Keycloak）實現 SSO。

## 17.5 升級與維護

```
cd dify\docker
git pull                          # 拉最新版
docker compose pull               # 拉新映像
docker compose up -d              # 重建
```

> ⚠️ 關鍵坑：① WebSocket `NEXT_PUBLIC_SOCKET_URL` 要設內網 IP；② 登入密碼是 base64 編碼；③ 忘密碼用 `docker exec docker-api-1 flask reset-password`（≥8 位）。

> 📖 原廠文件：Dify 官方文件 https://docs.dify.ai · 自託管 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第16章：LiteLLM 日常管理](ch16-ops-litellm.md) · [📖 目錄](index.md) · [第18章：Ghost 日常管理 →](ch18-ops-ghost.md)
