# 第11章：MCP Gateway 与 Skill 市场

*第一部分 · 部署篇*

> 集中管理 Skill 和 MCP 工具的网关，DeepChat/Dify 连一个地址即可拿到所有工具。

[← 第10章：DeepChat 分发与 CI/CD](ch10-deepchat.md) · [📖 目录](index.md) · [第12章：AI 管理中心 →](ch12-admin-center.md)

---

> 📌 MCP Gateway 基于官方 `@modelcontextprotocol/sdk`，暴露标准 Streamable HTTP `/mcp` 端点，已并入主 `docker-compose.yml`（端口 3100），随核心服务一起启动。源码在 `mcp-gateway/`。

## 11.1 内置平台工具

| 工具 | 用途 |
| --- | --- |
| `platform_time` | 返回服务器当前时间 |
| `platform_echo` | 回显文本（连通性测试） |
| `platform_services` | 列出平台服务清单 |

## 11.2 聚合外部 MCP Server

编辑 `mcp-gateway/mcp-servers.json`，添加 stdio 或 http 类型，重启 `mcp-gateway` 生效：

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

聚合的工具自动加 `{serverName}_` 前缀避免重名。

## 11.3 客户端接入

1. DeepChat：设置 → MCP → 添加服务器 → 类型「可流式传输的 HTTP」，URL `http://<服务器IP>:3100/mcp`；

2. Dify 工作流：自定义工具 / MCP 工具配置指向同地址。

> 验证：`curl http://<服务器IP>:3100/health` 返回 `{"status":"ok"}`；`curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` 返回工具列表。

## 11.4 Skill 市场（内网技能包分发）

| 端点 | 作用 |
| --- | --- |
| `/market` | Skill 市场页（卡片浏览 + 下载 ZIP + 复制安装地址） |
| `/skills` | 技能清单 JSON（name/description/version） |
| `/skills/<名称>.zip` | 技能包下载（动态打包） |

技能放在 `mcp-gateway/skills/` 目录（含 SKILL.md 的子目录），**每次请求自动扫描，无需重启**。内置 `skill-market` 引导技能。

> 📌 DeepChat 里 MCP 和 Skill 是两个概念：MCP 是「工具」（function calling），Skill 是「智能体技能包」（SKILL.md + 脚本）。DeepChat 的 Skill 没有「自定义市场 URL」，只支持文件夹/ZIP/URL 三种安装，内网分发靠「URL 安装」变相实现。

## 11.5 ⚠️ Skill 市场主机名（部署参数，必须替换）

「技能管家」读 `config.json` 的 `market_url` 请求 `/skills` 清单。两个关键点：

- **用主机名，不能用 IP**：DeepChat 的 agent 环境会把 IP 脱敏成 `[IP_ADDRESS_REDACTED]`，导致读不到真实地址；

- **主机名是部署参数**：每套部署都不同，不能照抄。

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<市场主机名>:3100" }
```

#### 自动（用 Agent 部署）

Agent 在收集参数时会问「Skill 市场主机名」，自动替换 `config.json` 和 `SKILL.md` 里的 `<市场主机名>`。

#### 手动

1. 编辑 `config.json` + `SKILL.md` 兜底地址，替换 `<市场主机名>`；

2. 让主机名可解析：单机在 `C:\Windows\System32\drivers\etc\hosts` 加 `<服务器IP> <主机名>`；公司内网在 DNS 加 A 记录。

> ✅ 主机名建议用「服务名+公司域」FQDN，如 `skillmarket.你的公司域名`。DNS 加 A 记录：域控「DNS → 正向查找区域 → 你的域 → 新建主机(A)」，或用 `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "你的域" -IPv4Address "<服务器IP>"`。

## 11.6 管理 API（供 AI 管理中心增删改）

| 端点 | 作用 |
| --- | --- |
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server 增删改查（写回配置+自动重连） |
| `POST /api/skills/upload` | 上传技能 zip（校验 SKILL.md、防路径穿越） |
| `DELETE /api/skills/:name` | 删除技能 |

需 `X-Admin-Token` 头（`.env` 的 `MCP_ADMIN_TOKEN`）。由 AI 管理中心「MCP Gateway」页代理调用（`ai-platform-admin` 角色保护）。

> 📖 原厂文档：MCP 协议官方 https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← 第10章：DeepChat 分发与 CI/CD](ch10-deepchat.md) · [📖 目录](index.md) · [第12章：AI 管理中心 →](ch12-admin-center.md)
