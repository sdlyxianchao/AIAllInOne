/**
 * AI All-in-One MCP Gateway
 *
 * 基于 @modelcontextprotocol/sdk 的标准 MCP 聚合网关：
 * - 对外暴露 Streamable HTTP /mcp 端点（DSH Desktop / Dify 连这一个地址即可）
 * - 内置平台工具（时间 / 回显 / 服务清单）
 * - 通过 mcp-servers.json 聚合外部 MCP Server（stdio 或 http）
 *
 * 客户端接入（DSH Desktop）：
 *   服务器类型: Streamable HTTP (http)
 *   基础 URL:   http://<服务器IP>:3100/mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const PORT = process.env.PORT || 3100;
const SERVERS_FILE = process.env.MCP_SERVERS_FILE || '/app/mcp-servers.json';
const SKILLS_DIR = process.env.SKILLS_DIR || '/app/skills';
const ADMIN_TOKEN = process.env.MCP_ADMIN_TOKEN || '';
const PUBLIC_URL = (process.env.SERVER_PUBLIC_URL || '').replace(/\/+$/, '');  // 如 http://192.168.31.117

// 生成 DSH Desktop 一键安装 MCP 的 DeepLink（dsh://mcp/install?code=<base64 JSON>）
function buildDeepLink() {
  const base = PUBLIC_URL ? `${PUBLIC_URL}:${PORT}` : `http://<服务器IP>:${PORT}`;
  const cfg = {
    mcpServers: {
      'ai-platform': {
        // 注意：DSH Desktop 的 dsh://mcp/install 处理器只接受 'stdio' 或 'sse'，
        // 不接受 'http'（Streamable HTTP），所以一键接入走 /sse，手动配置仍走 /mcp
        type: 'sse',
        url: `${base}/sse`,
        descriptions: 'AI 平台 MCP 网关（内置工具 + 知识库检索 search_knowledge）',
        icons: '🔌',
        autoApprove: ['all'],
      },
    },
  };
  const code = Buffer.from(JSON.stringify(cfg), 'utf8').toString('base64');
  // base64 里可能含 + / =（如 emoji 图标 🔌），必须 URL 编码，
  // 否则在 URL 查询参数解析时 + 会被当成空格，导致 DSH Desktop 解码失败、静默不安装
  return { base, deepLink: `dsh://mcp/install?code=${encodeURIComponent(code)}` };
}

// ═══════════════════════════════════════════
// 内置平台工具
// ═══════════════════════════════════════════
const builtinTools = [
  {
    name: 'platform_time',
    description: '返回 AI 平台服务器的当前时间（ISO 格式）',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'platform_echo',
    description: '回显输入文本，用于 MCP 连通性测试',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要回显的文本' },
      },
      required: ['text'],
    },
  },
  {
    name: 'platform_services',
    description: '列出 AI 平台已部署的服务清单（名称 / 端口 / 用途）',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search_knowledge',
    description: '在 Dify 知识库中检索相关内容，返回最相关的文本片段（chunks）。用于查询企业制度、文档、知识等内网知识库。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '要检索的问题或关键词' },
        dataset_id: { type: 'string', description: '目标知识库 ID（可选，缺省用默认知识库）' },
        top_k: { type: 'number', description: '返回片段数，默认 3' },
      },
      required: ['query'],
    },
  },
];

const PLATFORM_SERVICES = [
  { name: 'Keycloak', port: 9090, note: 'SSO 认证' },
  { name: 'NewAPI', port: 3000, note: 'LLM 路由网关' },
  { name: 'LiteLLM', port: 4001, note: 'PII 脱敏代理' },
  { name: 'Dify', port: 80, note: 'AI 应用平台' },
  { name: 'Ghost', port: 8090, note: '企业门户' },
  { name: 'Gitea', port: 3002, note: '源码管理' },
  { name: 'Update Server', port: 8091, note: '安装包分发' },
  { name: 'AI Admin Center', port: 10086, note: '统一管理门户' },
  { name: 'MCP Gateway', port: 3100, note: 'MCP 工具网关' },
];

async function callBuiltin(name, args) {
  if (name === 'platform_time') {
    return `服务器当前时间：${new Date().toISOString()}`;
  }
  if (name === 'platform_echo') {
    return `回显：${args?.text ?? ''}`;
  }
  if (name === 'platform_services') {
    return 'AI 平台服务清单：\n' + PLATFORM_SERVICES.map(s => `- ${s.name} :${s.port}（${s.note}）`).join('\n');
  }
  if (name === 'search_knowledge') {
    const base = process.env.DIFY_API_BASE || 'http://host.docker.internal/v1';
    const key = process.env.DIFY_KNOWLEDGE_API_KEY || '';
    const ds = args?.dataset_id || process.env.DIFY_DEFAULT_DATASET_ID || '';
    const topK = Number(args?.top_k) || 3;
    if (!key) return '错误：未配置 DIFY_KNOWLEDGE_API_KEY 环境变量';
    if (!ds) return '错误：未指定知识库（请传 dataset_id 或配置 DIFY_DEFAULT_DATASET_ID）';
    try {
      const resp = await fetch(`${base}/datasets/${ds}/hit-testing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: String(args?.query ?? ''),
          retrieval_model: {
            search_method: 'hybrid_search',
            reranking_enable: false,
            top_k: topK,
            score_threshold_enabled: false,
          },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        return `检索失败（HTTP ${resp.status}）：${t.slice(0, 400)}`;
      }
      const data = await resp.json();
      const records = Array.isArray(data.records) ? data.records : [];
      if (!records.length) return '未检索到相关内容。';
      const lines = records.map((r, i) => {
        const score = typeof r.score === 'number' ? r.score.toFixed(4) : '';
        const seg = r.segment || {};
        const content = String(seg.content || r.content || '').trim();
        const doc = (seg.document && seg.document.name) || (r.document && r.document.name) || '';
        return `[${i + 1}]${doc ? ` 来源：${doc}` : ''}${score ? `（score=${score}）` : ''}\n${content}`;
      });
      return `检索结果（${lines.length} 条）：\n\n` + lines.join('\n\n');
    } catch (e) {
      return `检索出错：${e.message}`;
    }
  }
  return `未知内置工具：${name}`;
}

// ═══════════════════════════════════════════
// 聚合外部 MCP Server（来自 mcp-servers.json）
// ═══════════════════════════════════════════
function loadServers() {
  try {
    const data = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8'));
    return Array.isArray(data?.servers) ? data.servers : [];
  } catch {
    return [];
  }
}

const clientCache = new Map();
async function getClient(srv) {
  const key = srv.name;
  if (clientCache.has(key)) return clientCache.get(key);
  const client = new Client({ name: `proxy-${srv.name}`, version: '1.0.0' });
  if (srv.type === 'stdio') {
    const transport = new StdioClientTransport({
      command: srv.command,
      args: srv.args || [],
      env: { ...process.env, ...(srv.env || {}) },
    });
    await client.connect(transport);
  } else if (srv.type === 'http') {
    const transport = new StreamableHTTPClientTransport(new URL(srv.url));
    await client.connect(transport);
  } else {
    throw new Error(`未知 server 类型：${srv.type}（仅支持 stdio / http）`);
  }
  clientCache.set(key, client);
  return client;
}

// ═══════════════════════════════════════════
// MCP Gateway Server
// ═══════════════════════════════════════════
function createGateway() {
  const gateway = new Server(
    { name: 'AI-All-in-One MCP Gateway', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

// 聚合：内置工具 + 所有下游 server 的工具（下游工具加 {serverName}_ 前缀避免冲突）
gateway.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [...builtinTools];
  for (const srv of loadServers()) {
    try {
      const client = await getClient(srv);
      const { tools: remote } = await client.listTools();
      for (const t of remote) {
        tools.push({ ...t, name: `${srv.name}_${t.name}` });
      }
    } catch (e) {
      console.warn(`[mcp] 聚合 ${srv.name} 失败: ${e.message}`);
    }
  }
  return { tools };
});

gateway.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // 内置工具
  if (builtinTools.some(t => t.name === name)) {
    const text = await callBuiltin(name, args);
    return { content: [{ type: 'text', text }] };
  }
  // 下游工具（带 server 前缀）
  for (const srv of loadServers()) {
    const prefix = `${srv.name}_`;
    if (name.startsWith(prefix)) {
      try {
        const client = await getClient(srv);
        return await client.callTool({ name: name.slice(prefix.length), arguments: args });
      } catch (e) {
        return { content: [{ type: 'text', text: `调用 ${name} 失败：${e.message}` }], isError: true };
      }
    }
  }
  return { content: [{ type: 'text', text: `工具 ${name} 不存在` }], isError: true };
  });

  return gateway;
}

// ═══════════════════════════════════════════
// HTTP 服务（Streamable HTTP）
// ═══════════════════════════════════════════
const app = express();
app.use(express.json());

// 无状态模式：每个请求新建 transport（官方推荐做法）
app.all('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // 无状态模式
    enableJsonResponse: true,      // 纯 JSON 响应，无需 SSE
  });
  res.on('close', () => transport.close());
  try {
    const gateway = createGateway();
    await gateway.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error('[mcp] handleRequest 错误:', e && e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e && e.message });
    }
  }
});

// ═══════════════════════════════════════════
// SSE 端点（DSH Desktop 一键接入 dsh://mcp/install 只支持 stdio/sse，
// 故额外暴露 /sse 供 deep link 使用；Dify/手动配置仍用 /mcp Streamable HTTP）
// ═══════════════════════════════════════════
const sseTransports = new Map(); // sessionId -> SSEServerTransport

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  sseTransports.set(transport.sessionId, transport);
  res.on('close', () => {
    sseTransports.delete(transport.sessionId);
    transport.close().catch(() => {});
  });
  const gateway = createGateway();
  // 注意：Server.connect() 会自动调用 transport.start()，不能重复调用
  await gateway.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = typeof sessionId === 'string' ? sseTransports.get(sessionId) : undefined;
  if (!transport) {
    res.status(400).json({ error: 'Invalid or expired sessionId' });
    return;
  }
  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (e) {
    console.error('[sse] handlePostMessage 错误:', e && e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e && e.message });
    }
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (req, res) => res.json({
  name: 'AI-All-in-One MCP Gateway',
  endpoint: '/mcp',
  sse: '/sse',
  health: '/health',
  skills: '/skills',
  market: '/market',
}));

// ═══════════════════════════════════════════
// 内网 Skill 市场（Skill 分发）
// ═══════════════════════════════════════════
function parseFrontmatter(md) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return meta;
}

function dirSize(dir) {
  let size = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else size += fs.statSync(p).size;
    }
  };
  walk(dir);
  return size;
}

function discoverSkills() {
  const skills = [];
  if (!fs.existsSync(SKILLS_DIR)) return skills;
  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(SKILLS_DIR, entry.name);
    const mdPath = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(mdPath)) continue;
    const meta = parseFrontmatter(fs.readFileSync(mdPath, 'utf8'));
    skills.push({
      name: meta.name || entry.name,
      folder: entry.name,
      description: meta.description || '',
      version: meta.version || '',
      size: dirSize(dir),
      zipUrl: `/skills/${entry.name}.zip`,
    });
  }
  return skills;
}

app.get('/skills', (req, res) => {
  res.json({
    skills: discoverSkills(),
    install: 'DSH Desktop 设置 → Skills → 从 URL 安装，填 http://<服务器IP>:3100/skills/<名称>.zip',
  });
});

// 内置工具清单（公开，与 /mcp 的 tools/list 一致，供 AI 管理中心展示）
app.get('/api/tools', (req, res) => {
  res.json({
    tools: builtinTools.map(t => ({
      name: t.name,
      description: t.description,
      params: Object.keys(t.inputSchema?.properties || {}),
    })),
  });
});

app.get('/skills/:name.zip', (req, res) => {
  const name = req.params.name;
  const dir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(path.join(dir, 'SKILL.md'))) {
    return res.status(404).json({ error: `技能 ${name} 不存在` });
  }
  const zip = new AdmZip();
  zip.addLocalFolder(dir, name);
  const buf = zip.toBuffer();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${name}.zip"`);
  res.send(buf);
});

app.get('/market', (req, res) => {
  const { base: mcpBase, deepLink } = buildDeepLink();
  const skills = discoverSkills();
  const SKILL_EMOJI = { 'platform-report': '📊', 'skill-market': '🧩' };

  // 内置工具（含参数）序列化，供前端卡片/列表渲染
  const tools = builtinTools.map(t => {
    const props = (t.inputSchema && t.inputSchema.properties) || {};
    const required = (t.inputSchema && t.inputSchema.required) || [];
    return {
      name: t.name,
      description: t.description,
      params: Object.keys(props).map(k => ({
        name: k,
        required: required.indexOf(k) >= 0,
        desc: (props[k] && props[k].description) || '',
      })),
    };
  });
  const toolsJson = JSON.stringify(tools).replace(/</g, '\\u003c');
  const skillsJson = JSON.stringify(skills.map(s => ({
    name: s.name,
    description: s.description || '',
    version: s.version || '',
    size: (s.size / 1024).toFixed(1),
    zipUrl: s.zipUrl,
    emoji: SKILL_EMOJI[s.folder] || '🧩',
  }))).replace(/</g, '\\u003c');

  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 平台 Skill 市场</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700;900&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #1a2b4a;
    --navy-deep: #101d33;
    --navy-soft: #2a3f66;
    --gold: #c9a227;
    --gold-soft: #e6c96a;
    --ink: #232a33;
    --body: #f5f6f8;
    --surface: #ffffff;
    --line: #e2e5ea;
    --serif: "Noto Serif SC", "Songti SC", "SimSun", serif;
    --sans: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--sans); color: var(--ink); background: var(--body); line-height: 1.7; -webkit-font-smoothing: antialiased; }
  a { color: var(--navy); text-decoration: none; }

  /* 顶部导航（同 AI All In One Hub） */
  .site-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
  .header-inner { display: flex; align-items: center; height: 68px; max-width: 1180px; margin: 0 auto; padding: 0 24px; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 12px; color: var(--navy); }
  .brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: var(--gold-soft); }
  .brand-name { font-family: var(--serif); font-weight: 700; font-size: 20px; letter-spacing: .5px; color: var(--navy); }
  .header-divider { width: 1px; height: 24px; background: var(--line); }
  .page-name { font-size: 14px; color: #6b7280; }

  /* 英雄区（深藏青渐变，左对齐） */
  .hero { position: relative; padding: 88px 0 96px; min-height: 484px; display: flex; align-items: center; background: radial-gradient(1200px 500px at 80% -10%, rgba(201,162,39,.14), transparent 60%), linear-gradient(160deg, var(--navy-deep), var(--navy) 55%, var(--navy-soft)); color: #fff; overflow: hidden; }
  .hero::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px); background-size: 44px 44px; pointer-events: none; }
  .hero-inner { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; padding: 0 24px; width: 100%; }
  .hero-eyebrow { display: inline-block; font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: var(--gold-soft); margin-bottom: 18px; border: 1px solid rgba(230,201,106,.35); padding: 5px 14px; border-radius: 999px; }
  .hero-title { font-family: var(--serif); font-size: clamp(30px, 5vw, 44px); font-weight: 700; line-height: 1.25; margin: 0 0 14px; }
  .hero-sub { font-size: 16px; color: rgba(255,255,255,.82); margin: 0; }

  /* 主体 */
  .wrap { max-width: 1180px; margin: 0 auto; padding: 32px 24px 48px; }
  .section { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 6px 20px rgba(26,43,74,.08); }
  .section-head { display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-bottom: 1px solid var(--line); background: #fafbfc; }
  .section-head .ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex: 0 0 auto; }
  .section-head .title { font-weight: 700; font-size: 16px; color: var(--navy); letter-spacing: 1px; }
  .section-head .hint { color: #8b949e; font-size: 12px; margin-left: auto; text-align: right; }
  .section-head.mcp { border-top: 3px solid var(--gold); }
  .section-head.mcp .ico { background: rgba(201,162,39,.12); }
  .section-head.skill { border-top: 3px solid var(--navy); }
  .section-head.skill .ico { background: rgba(26,43,74,.08); }
  .section-body { padding: 22px; }

  .howto { background: rgba(26,43,74,.04); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; color: var(--ink); }
  .howto code, .mcp-desc code, .mcp-manual code { background: rgba(26,43,74,.06); color: var(--navy); padding: 1px 6px; border-radius: 4px; font-size: 12px; }

  .mcp-box { background: linear-gradient(135deg, rgba(201,162,39,.08), rgba(26,43,74,.03)); border: 1px solid rgba(201,162,39,.28); border-radius: 12px; padding: 20px; }
  .mcp-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 8px; }
  .mcp-desc { color: #4b5563; font-size: 13px; margin-bottom: 16px; line-height: 1.6; }
  .mcp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .mcp-manual { color: #6b7280; font-size: 12px; margin: 0; line-height: 1.7; }
  .mcp-note { color: #8b949e; font-size: 12px; margin-top: 8px; line-height: 1.7; }
  .subhead { font-size: 14px; font-weight: 700; color: var(--navy); margin: 24px 0 12px; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .skill-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease; }
  .skill-card:hover { transform: translateY(-3px); border-color: var(--gold); box-shadow: 0 8px 24px rgba(26,43,74,.10); }
  .skill-head { display: flex; align-items: center; gap: 12px; }
  .skill-icon { width: 42px; height: 42px; border-radius: 11px; background: linear-gradient(135deg, rgba(26,43,74,.08), rgba(201,162,39,.10)); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 20px; flex: 0 0 auto; }
  .skill-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .skill-name { color: var(--ink); font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .skill-ver { color: #8b949e; font-size: 11px; }
  .skill-desc { color: #6b7280; font-size: 13px; flex: 1; line-height: 1.6; }
  .skill-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--line); padding-top: 12px; }
  .skill-meta { color: #8b949e; font-size: 12px; }
  .skill-actions { display: flex; gap: 8px; }
  .btn { background: var(--navy); color: #fff; border: none; padding: 7px 14px; border-radius: 7px; cursor: pointer; font-size: 13px; text-decoration: none; display: inline-block; font-weight: 600; transition: background .15s ease, transform .15s ease; }
  .btn:hover { background: var(--navy-soft); }
  .btn.ghost { background: #fff; color: var(--navy); border: 1px solid var(--line); }
  .btn.ghost:hover { background: #f5f6f8; }
  .mcp-btn { background: var(--gold); color: var(--navy-deep); font-size: 14px; padding: 9px 18px; }
  .mcp-btn:hover { background: var(--gold-soft); }
  .empty { color: #8b949e; }
  .foot { color: #8b949e; font-size: 12px; text-align: center; margin-top: 28px; }
  #toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--navy); color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; opacity: 0; transition: opacity .2s; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,.2); }

  /* 工具条（搜索 + 视图切换 + 每页条数） */
  .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .toolbar .search { flex: 1 1 180px; min-width: 150px; }
  .toolbar input[type=search] { width: 100%; background: #fff; border: 1px solid var(--line); color: var(--ink); border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color .15s ease; }
  .toolbar input[type=search]:focus { border-color: var(--navy); }
  .count { color: #8b949e; font-size: 12px; white-space: nowrap; }
  .view-toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }
  .view-btn { background: #fff; color: #6b7280; border: none; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: background .15s ease, color .15s ease; }
  .view-btn.active { background: var(--navy); color: #fff; }
  .page-size select { background: #fff; border: 1px solid var(--line); color: var(--ink); border-radius: 8px; padding: 6px 8px; font-size: 12px; }

  /* 列表视图：把 grid 变单列 */
  .grid.list { display: flex; flex-direction: column; gap: 10px; }

  /* 工具卡片 / 行 */
  .tool-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; transition: transform .15s ease, border-color .15s ease; }
  .tool-card:hover { transform: translateY(-3px); border-color: var(--gold); }
  .tool-name code { background: rgba(201,162,39,.12); color: #8a6d1a; padding: 2px 8px; border-radius: 6px; font-size: 13px; font-weight: 700; }
  .tool-desc { color: #6b7280; font-size: 13px; line-height: 1.6; }
  .tool-params { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .param { background: #f0f2f5; color: #6b7280; font-size: 11px; padding: 2px 8px; border-radius: 999px; }
  .param.req { color: #b0761a; border: 1px solid rgba(201,162,39,.5); background: #fdf6e3; }
  .param.none { color: #9ca3af; }
  .tool-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
  .tool-row-main { flex: 1; min-width: 0; }
  .tool-row-main code { color: #8a6d1a; font-weight: 700; font-size: 13px; }
  .tool-row .tool-desc { font-size: 12px; margin: 2px 0 0; }

  /* 技能行（列表） */
  .skill-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
  .skill-row .skill-icon { width: 40px; height: 40px; font-size: 18px; }
  .skill-row-main { flex: 1; min-width: 0; }
  .skill-row-title { display: flex; align-items: center; gap: 8px; }
  .skill-row .skill-desc { margin: 2px 0 0; font-size: 12px; }
  .skill-row .skill-meta { flex: 0 0 auto; }

  /* 分页 */
  .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; }
  .pg-btn { background: #fff; color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; transition: background .15s ease; }
  .pg-btn:hover:not(:disabled) { background: #f0f2f5; }
  .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pg-info { color: #8b949e; font-size: 12px; }
  @media (max-width: 640px) {
    .hero { padding: 40px 0 48px; min-height: 0; }
    .hero-title { font-size: 28px; }
    .section-head .hint { display: none; }
  }
</style>
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${mcpBase}/market">
      <span class="brand-mark">
        <svg viewBox="0 0 32 32" width="22" height="22" fill="none"><rect x="4" y="4" width="24" height="24" rx="6" fill="currentColor" opacity="0.15"/><path d="M10 22V10l12 12V10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="brand-name">AI All In One</span>
    </a>
    <span class="header-divider"></span>
    <span class="page-name">Skill 市场</span>
  </div>
</header>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">内部工作平台</div>
    <h1 class="hero-title">AI 平台 Skill 市场</h1>
    <p class="hero-sub">一键接入 MCP 网关 · 下载内网技能包 · 共 ${skills.length} 个技能</p>
  </div>
</div>

<div class="wrap">
  <div class="section">
    <div class="section-head mcp"><span class="ico">🔌</span><span class="title">MCP</span><span class="hint">一键接入平台 MCP 网关</span></div>
    <div class="section-body">
      <div class="mcp-box">
        <div class="mcp-title">🔌 一键接入 DSH Desktop MCP</div>
        <p class="mcp-desc">把「AI 平台 MCP 网关」（内置工具 + 知识库检索 <code>search_knowledge</code>）加进 DSH Desktop，即可在对话里使用平台工具和 RAG 知识库检索。</p>
        <div class="mcp-actions">
          <a class="btn mcp-btn" href="${deepLink}">🔌 一键接入 DSH Desktop MCP</a>
          <button class="btn ghost" onclick="copyDeepLink()">📋 复制一键接入链接</button>
        </div>
        <p class="mcp-manual">手动配置：DSH Desktop → 设置 → MCP → 新增 → <b>跳过至手动配置</b> → 类型「可流式传输的 HTTP 请求」→ 基础 URL 填 <code>${mcpBase}/mcp</code></p>
        <p class="mcp-note">⚠️ 一键接入走 <b>SSE</b>（DSH Desktop 的 deep link 只支持 SSE/stdio，不支持 Streamable HTTP），会显示「SSE is legacy-only」提示，属正常、不影响使用；想要 Streamable HTTP（无提示）请用上面手动配置填 <code>/mcp</code>。</p>
      </div>

      <div class="subhead">🛠️ 网关内置工具</div>
      <div class="toolbar">
        <input type="search" id="tools-search" class="search" placeholder="搜索工具名或描述…">
        <span class="count" id="tools-count"></span>
        <div class="view-toggle" id="tools-toggle">
          <button type="button" class="view-btn active" data-view="card">卡片</button>
          <button type="button" class="view-btn" data-view="list">列表</button>
        </div>
        <label class="page-size">每页
          <select id="tools-page-size"><option value="10" selected>10</option><option value="20">20</option><option value="50">50</option></select> 条
        </label>
      </div>
      <div class="grid" id="tools-container"></div>
      <div class="pagination" id="tools-pagination">
        <button type="button" class="pg-btn" id="tools-pg-prev">上一页</button>
        <span class="pg-info" id="tools-pg-info"></span>
        <button type="button" class="pg-btn" id="tools-pg-next">下一页</button>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head skill"><span class="ico">🧩</span><span class="title">SKILL</span><span class="hint">内网技能包安装</span></div>
    <div class="section-body">
      <div class="howto">
        <strong>DSH Desktop 安装 Skill：</strong>设置 → Skills → 从 URL 安装，填
        <code>${mcpBase}/skills/&lt;名称&gt;.zip</code>（或点「下载 ZIP」后从 ZIP / 文件夹安装）。
      </div>
      <div class="toolbar">
        <input type="search" id="skills-search" class="search" placeholder="搜索技能名或描述…">
        <span class="count" id="skills-count"></span>
        <div class="view-toggle" id="skills-toggle">
          <button type="button" class="view-btn active" data-view="card">卡片</button>
          <button type="button" class="view-btn" data-view="list">列表</button>
        </div>
        <label class="page-size">每页
          <select id="skills-page-size"><option value="10" selected>10</option><option value="20">20</option><option value="50">50</option></select> 条
        </label>
      </div>
      <div class="grid" id="skills-container"></div>
      <div class="pagination" id="skills-pagination">
        <button type="button" class="pg-btn" id="skills-pg-prev">上一页</button>
        <span class="pg-info" id="skills-pg-info"></span>
        <button type="button" class="pg-btn" id="skills-pg-next">下一页</button>
      </div>
    </div>
  </div>

  <p class="foot">由 MCP Gateway 托管 · 技能来源：skills/ 目录</p>
</div>
<div id="toast">已复制</div>
<script>
window.__TOOLS__ = ${toolsJson};
window.__SKILLS__ = ${skillsJson};

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(function () { t.style.opacity = '0'; }, 2000);
}
function copyText(text) {
  var done = function () { showToast('已复制：' + text); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
  } else {
    fallbackCopy(text, done);
  }
}
function copyDeepLink() {
  copyText(document.querySelector('.mcp-btn').getAttribute('href'));
}
function fallbackCopy(text, done) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { prompt('复制失败，请手动复制：', text); }
  document.body.removeChild(ta);
}

function paramChips(params) {
  if (!params || !params.length) return '<span class="param none">无参数</span>';
  return params.map(function (p) {
    return '<span class="param' + (p.required ? ' req' : '') + '" title="' + esc(p.desc) + '">' + esc(p.name) + (p.required ? ' *' : '') + '</span>';
  }).join('');
}
function toolCard(t) {
  return '<div class="tool-card">'
    + '<div class="tool-name"><code>' + esc(t.name) + '</code></div>'
    + '<p class="tool-desc">' + esc(t.description) + '</p>'
    + '<div class="tool-params">' + paramChips(t.params) + '</div>'
    + '</div>';
}
function toolRow(t) {
  return '<div class="tool-row">'
    + '<div class="tool-row-main"><code>' + esc(t.name) + '</code>'
    + '<p class="tool-desc">' + esc(t.description) + '</p></div>'
    + '<div class="tool-params">' + paramChips(t.params) + '</div>'
    + '</div>';
}
function skillCard(s) {
  return '<div class="skill-card">'
    + '<div class="skill-head"><span class="skill-icon">' + esc(s.emoji) + '</span>'
    + '<div class="skill-title"><span class="skill-name">' + esc(s.name) + '</span><span class="skill-ver">v' + esc(s.version || '—') + '</span></div></div>'
    + '<p class="skill-desc">' + esc(s.description || '（无描述）') + '</p>'
    + '<div class="skill-foot"><span class="skill-meta">' + esc(s.size) + ' KB</span>'
    + '<div class="skill-actions">'
    + '<a class="btn" href="' + s.zipUrl + '" download>下载 ZIP</a>'
    + '<button class="btn ghost" data-copy="' + s.zipUrl + '">复制安装地址</button>'
    + '</div></div></div>';
}
function skillRow(s) {
  return '<div class="skill-row">'
    + '<span class="skill-icon">' + esc(s.emoji) + '</span>'
    + '<div class="skill-row-main"><div class="skill-row-title"><span class="skill-name">' + esc(s.name) + '</span><span class="skill-ver">v' + esc(s.version || '—') + '</span></div>'
    + '<p class="skill-desc">' + esc(s.description || '（无描述）') + '</p></div>'
    + '<span class="skill-meta">' + esc(s.size) + ' KB</span>'
    + '<div class="skill-actions">'
    + '<a class="btn" href="' + s.zipUrl + '" download>下载 ZIP</a>'
    + '<button class="btn ghost" data-copy="' + s.zipUrl + '">复制安装地址</button>'
    + '</div></div>';
}

// 通用集合渲染器：搜索 + 卡片/列表切换 + 分页
function createCollection(cfg) {
  var view = 'card', page = 1;
  var pageSize = parseInt(cfg.pageSize.value, 10) || 10;
  var filtered = cfg.items.slice();

  function render() {
    var total = filtered.length;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) page = pages;
    var start = (page - 1) * pageSize;
    var slice = filtered.slice(start, start + pageSize);
    cfg.container.classList.toggle('list', view === 'list');
    cfg.container.innerHTML = slice.length
      ? slice.map(function (it) { return view === 'list' ? cfg.renderRow(it) : cfg.renderCard(it); }).join('')
      : '<p class="empty">无匹配结果</p>';
    cfg.count.textContent = '共 ' + total + ' 项';
    if (cfg.pg) {
      cfg.pg.style.display = pages > 1 ? '' : 'none';
      cfg.pgInfo.textContent = '第 ' + page + ' / ' + pages + ' 页';
      cfg.pgPrev.disabled = page <= 1;
      cfg.pgNext.disabled = page >= pages;
    }
  }

  cfg.search.addEventListener('input', function () {
    var q = cfg.search.value.trim().toLowerCase();
    filtered = cfg.items.filter(function (it) { return cfg.match(it, q); });
    page = 1;
    render();
  });
  cfg.toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      view = b.getAttribute('data-view');
      cfg.toggles.forEach(function (x) { x.classList.toggle('active', x === b); });
      render();
    });
  });
  cfg.pageSize.addEventListener('change', function () {
    pageSize = parseInt(cfg.pageSize.value, 10) || 10;
    page = 1;
    render();
  });
  cfg.pgPrev.addEventListener('click', function () { if (page > 1) { page--; render(); } });
  cfg.pgNext.addEventListener('click', function () { if (page < Math.ceil(filtered.length / pageSize)) { page++; render(); } });
  render();
}

// 「复制安装地址」按钮（data-copy 属性）事件委托
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-copy]') : null;
  if (b) copyText(b.getAttribute('data-copy'));
});

createCollection({
  items: window.__TOOLS__,
  container: document.getElementById('tools-container'),
  count: document.getElementById('tools-count'),
  search: document.getElementById('tools-search'),
  toggles: Array.prototype.slice.call(document.querySelectorAll('#tools-toggle .view-btn')),
  pageSize: document.getElementById('tools-page-size'),
  pg: document.getElementById('tools-pagination'),
  pgInfo: document.getElementById('tools-pg-info'),
  pgPrev: document.getElementById('tools-pg-prev'),
  pgNext: document.getElementById('tools-pg-next'),
  renderCard: toolCard,
  renderRow: toolRow,
  match: function (t, q) { return !q || t.name.toLowerCase().indexOf(q) >= 0 || t.description.toLowerCase().indexOf(q) >= 0; }
});

createCollection({
  items: window.__SKILLS__,
  container: document.getElementById('skills-container'),
  count: document.getElementById('skills-count'),
  search: document.getElementById('skills-search'),
  toggles: Array.prototype.slice.call(document.querySelectorAll('#skills-toggle .view-btn')),
  pageSize: document.getElementById('skills-page-size'),
  pg: document.getElementById('skills-pagination'),
  pgInfo: document.getElementById('skills-pg-info'),
  pgPrev: document.getElementById('skills-pg-prev'),
  pgNext: document.getElementById('skills-pg-next'),
  renderCard: skillCard,
  renderRow: skillRow,
  match: function (s, q) { return !q || s.name.toLowerCase().indexOf(q) >= 0 || s.description.toLowerCase().indexOf(q) >= 0; }
});
</script>
</body>
</html>`);
});

// ═══════════════════════════════════════════
// 管理 API（增删改 MCP server / Skill，需 X-Admin-Token 鉴权）
// ═══════════════════════════════════════════
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'MCP_ADMIN_TOKEN 未配置，管理 API 不可用' });
  }
  if ((req.headers['x-admin-token'] || '') !== ADMIN_TOKEN) {
    return res.status(401).json({ error: '未授权' });
  }
  next();
}

function saveServers(servers) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify({ servers }, null, 2));
  for (const [k, c] of clientCache) {
    try { c.close(); } catch {}
  }
  clientCache.clear();
}

function validServer(s) {
  if (!s || !s.name || !['stdio', 'http'].includes(s.type)) return 'name 必填，type 仅支持 stdio / http';
  if (s.type === 'stdio' && !s.command) return 'stdio 类型需要 command';
  if (s.type === 'http' && !s.url) return 'http 类型需要 url';
  return null;
}

app.get('/api/servers', requireAdmin, (req, res) => {
  res.json({ servers: loadServers() });
});

app.post('/api/servers', requireAdmin, (req, res) => {
  const s = req.body || {};
  const err = validServer(s);
  if (err) return res.status(400).json({ error: err });
  const servers = loadServers();
  if (servers.some(x => x.name === s.name)) return res.status(409).json({ error: `server ${s.name} 已存在` });
  servers.push(s);
  saveServers(servers);
  res.json({ ok: true, servers });
});

app.put('/api/servers/:name', requireAdmin, (req, res) => {
  const servers = loadServers();
  const idx = servers.findIndex(x => x.name === req.params.name);
  if (idx < 0) return res.status(404).json({ error: 'server 不存在' });
  const s = { ...servers[idx], ...(req.body || {}) };
  const err = validServer(s);
  if (err) return res.status(400).json({ error: err });
  servers[idx] = s;
  saveServers(servers);
  res.json({ ok: true, servers });
});

app.delete('/api/servers/:name', requireAdmin, (req, res) => {
  const servers = loadServers().filter(x => x.name !== req.params.name);
  saveServers(servers);
  res.json({ ok: true, servers });
});

app.post('/api/skills/upload', requireAdmin, express.raw({ type: ['application/zip', 'application/octet-stream'], limit: '200mb' }), (req, res) => {
  const buf = req.body;
  if (!buf || !buf.length) return res.status(400).json({ error: '空文件' });
  let zip;
  try { zip = new AdmZip(buf); } catch { return res.status(400).json({ error: '无效的 zip 文件' }); }
  const entries = zip.getEntries().filter(e => !e.isDirectory);
  if (entries.some(e => e.entryName.includes('..'))) return res.status(400).json({ error: 'zip 路径非法' });
  const md = entries.find(e => e.entryName.endsWith('SKILL.md'));
  if (!md) return res.status(400).json({ error: 'zip 中未找到 SKILL.md' });
  const parts = md.entryName.split('/');
  const skillName = parts.length >= 2 ? parts[parts.length - 2] : 'skill';
  if (!/^[\w.-]+$/.test(skillName)) return res.status(400).json({ error: '非法的技能目录名' });
  zip.extractAllTo(SKILLS_DIR, true);
  res.json({ ok: true, name: skillName, url: `/skills/${skillName}.zip` });
});

app.delete('/api/skills/:name', requireAdmin, (req, res) => {
  const name = req.params.name;
  if (!name || name.includes('..') || name.includes('/')) return res.status(400).json({ error: '非法名称' });
  const dir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(path.join(dir, 'SKILL.md'))) return res.status(404).json({ error: '技能不存在' });
  fs.rmSync(dir, { recursive: true, force: true });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[mcp] MCP Gateway 运行于 :${PORT}`);
  console.log(`[mcp] MCP 端点: http://<服务器IP>:${PORT}/mcp`);
  console.log(`[mcp] Skill 市场: http://<服务器IP>:${PORT}/market`);
  console.log(`[mcp] 管理 API: http://<服务器IP>:${PORT}/api/servers（需 X-Admin-Token）`);
  console.log(`[mcp] 内置工具: ${builtinTools.map(t => t.name).join(', ')}`);
  console.log(`[mcp] 聚合 server: ${loadServers().map(s => s.name).join(', ') || '（无）'}`);
  console.log(`[mcp] 分发技能: ${discoverSkills().map(s => s.name).join(', ') || '（无）'}`);
});
