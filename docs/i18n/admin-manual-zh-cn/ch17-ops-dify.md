# 第17章：Dify 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> AI 应用平台：应用、知识库、模型供应商、成员权限、发布。

[← 第16章：LiteLLM 日常管理](ch16-ops-litellm.md) · [📖 目录](index.md) · [第18章：Ghost 日常管理 →](ch18-ops-ghost.md)

---

**入口**：`http://<服务器IP>`（80 端口，独立官方 compose，升级维护在 `dify/docker/` 单独操作）。

## 17.1 应用管理（工作室）

1. **创建应用**：工作室 → 创建空白应用 → 选类型（聊天助手 / Agent / 工作流 / 文本生成）；

2. **编排**：拖拽节点编排提示词、工具、知识库、变量；

3. **调试**：右上角「预览」运行调试；

4. **发布**：调试通过后「发布」→ 生成分享链接或嵌入 Web 应用。

## 17.2 知识库管理

1. 知识库 → 创建知识库；

2. 上传文档（Word / PDF / Markdown / 网页链接），选分段规则 + 索引方式（高质量/经济）；

3. 在应用里「添加」该知识库，AI 即可基于文档回答。

> 📌 知识库内容会被 AI 用于回答，机密资料不要上传（遵守数据分级规范）。

## 17.3 模型供应商

- **添加模型**：设置 → 模型供应商 → OpenAI-API-compatible → API endpoint `http://host.docker.internal:3000/v1`（走 NewAPI）+ `dify-key`；

- **系统模型设置**：指定默认聊天/推理/嵌入模型。

## 17.4 成员与权限

- **成员**：邀请成员进工作空间，设 Owner/Admin/Editor/Normal 角色；

- **登录方式**：设置 → 登录方式 → 可接 OIDC（Keycloak）实现 SSO。

## 17.5 升级与维护

```
cd dify\docker
git pull                          # 拉最新版
docker compose pull               # 拉新镜像
docker compose up -d              # 重建
```

> ⚠️ 关键坑：① WebSocket `NEXT_PUBLIC_SOCKET_URL` 要设内网 IP；② 登录密码是 base64 编码；③ 忘密码用 `docker exec docker-api-1 flask reset-password`（≥8 位）。

> 📖 原厂文档：Dify 官方文档 https://docs.dify.ai · 自托管 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 第16章：LiteLLM 日常管理](ch16-ops-litellm.md) · [📖 目录](index.md) · [第18章：Ghost 日常管理 →](ch18-ops-ghost.md)
