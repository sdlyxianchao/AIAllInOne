# 第20章：MCP Gateway 日常管理

*第二部分 · 管理篇（各产品日常操作）*

> 增删 MCP Server、上传/删除 Skill、扩展内置工具。

[← 第19章：Gitea 日常管理](ch19-ops-gitea.md) · [📖 目录](index.md) · [第21章：更新服务器管理 →](ch21-ops-update.md)

---

**入口**：`http://<服务器IP>:3100`（市场页 `/market`）。管理经 AI 管理中心「MCP Gateway」页操作（`ai-platform-admin` 角色），也可直接调管理 API。

## 20.1 管理 MCP Server

1. 编辑 `mcp-gateway/mcp-servers.json` 增删服务器（stdio/http 两种）；

2. 重启 `docker compose restart mcp-gateway`；

3. 或在 AI 管理中心 MCP Gateway 页增删（写回配置 + 自动重连）。

## 20.2 管理 Skill（技能包）

1. **上传**：AI 管理中心 MCP Gateway 页 → 上传技能 zip（校验含 SKILL.md、防路径穿越）；

2. **删除**：对应技能删除；

3. 技能放 `mcp-gateway/skills/`（含 SKILL.md 的子目录），每次请求自动扫描，无需重启。

## 20.3 扩展内置工具

在 `mcp-gateway/gateway.js` 加两步：

```
// ① 工具定义（builtinTools 数组加一项）
{ name: 'platform_health', description: '查询服务健康状态',
  inputSchema: { type: 'object', properties: {} } }

// ② 执行逻辑（callBuiltin 加一个分支）
if (name === 'platform_health') { return '所有服务运行正常'; }
```

改完 `docker compose restart mcp-gateway`。

## 20.4 维护 skill-market 市场地址

「技能管家」的 `market_url` 在 `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`，必须用主机名（不能用 IP），是部署参数（详见第 11 章）。

> ⚠️ 管理 API 需 `X-Admin-Token` 头（`.env` 的 `MCP_ADMIN_TOKEN`）；未配返回 503、错 token 返回 401。

> 📖 原厂文档：MCP 协议官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第19章：Gitea 日常管理](ch19-ops-gitea.md) · [📖 目录](index.md) · [第21章：更新服务器管理 →](ch21-ops-update.md)
