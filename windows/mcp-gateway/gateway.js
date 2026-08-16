/**
 * AI All-in-One MCP Gateway
 *
 * 基于 @modelcontextprotocol/sdk 的标准 MCP 聚合网关：
 * - 对外暴露 Streamable HTTP /mcp 端点（DeepChat / Dify 连这一个地址即可）
 * - 内置平台工具（时间 / 回显 / 服务清单）
 * - 通过 mcp-servers.json 聚合外部 MCP Server（stdio 或 http）
 *
 * 客户端接入（DeepChat）：
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

// 生成 DeepChat 一键安装 MCP 的 DeepLink（deepchat://mcp/install?code=<base64 JSON>）
function buildDeepLink() {
  const base = PUBLIC_URL ? `${PUBLIC_URL}:${PORT}` : `http://<服务器IP>:${PORT}`;
  const cfg = {
    mcpServers: {
      'ai-platform': {
        // 注意：DeepChat 的 deepchat://mcp/install 处理器只接受 'stdio' 或 'sse'，
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
  // 否则在 URL 查询参数解析时 + 会被当成空格，导致 DeepChat 解码失败、静默不安装
  return { base, deepLink: `deepchat://mcp/install?code=${encodeURIComponent(code)}` };
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
// SSE 端点（DeepChat 一键接入 deepchat://mcp/install 只支持 stdio/sse，
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
    install: 'DeepChat 设置 → Skills → 从 URL 安装，填 http://<服务器IP>:3100/skills/<名称>.zip',
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
  const cards = skills.length
    ? skills.map(s => `
    <div class="skill-card">
      <div class="skill-head">
        <span class="skill-name">${s.name}</span>
        <span class="skill-ver">v${s.version || '—'}</span>
      </div>
      <p class="skill-desc">${s.description || '（无描述）'}</p>
      <div class="skill-meta">${(s.size / 1024).toFixed(1)} KB</div>
      <div class="skill-actions">
        <a class="btn" href="${s.zipUrl}" download>下载 ZIP</a>
        <button class="btn ghost" onclick="copyInstall('${s.name}')">复制安装地址</button>
      </div>
    </div>`).join('')
    : '<p class="empty">skills/ 目录下暂无技能，放入带 SKILL.md 的子目录即可。</p>';

  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 平台 Skill 市场</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; background: #0d1117; color: #c9d1d9; padding: 32px 20px; line-height: 1.6; }
  .wrap { max-width: 900px; margin: 0 auto; }
  h1 { color: #58a6ff; font-size: 24px; margin-bottom: 6px; }
  .sub { color: #8b949e; font-size: 14px; margin-bottom: 24px; }
  .howto { background: rgba(88,166,255,0.08); border: 1px solid rgba(88,166,255,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 14px; }
  .howto code { background: #161b22; color: #79c0ff; padding: 1px 6px; border-radius: 4px; }
  .mcp-box { background: rgba(57,197,207,0.08); border: 1px solid rgba(57,197,207,0.3); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .mcp-box strong { color: #39c5cf; font-size: 15px; }
  .mcp-desc { color: #8b949e; font-size: 13px; margin: 8px 0 12px; line-height: 1.6; }
  .mcp-desc code, .mcp-manual code { background: #161b22; color: #79c0ff; padding: 1px 6px; border-radius: 4px; }
  .mcp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .mcp-btn { background: #1f7a8a; }
  .mcp-btn:hover { background: #2394a6; }
  .mcp-manual { color: #8b949e; font-size: 12px; margin: 0; line-height: 1.6; }
  .section { border: 1px solid #30363d; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
  .section-head { display: flex; align-items: baseline; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #30363d; background: #161b22; }
  .section-head .tag { font-weight: 800; font-size: 14px; letter-spacing: 1.5px; }
  .section-head .hint { color: #8b949e; font-size: 12px; }
  .section-head.mcp .tag { color: #39c5cf; }
  .section-head.skill .tag { color: #58a6ff; }
  .section-body { padding: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .skill-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .skill-head { display: flex; align-items: center; gap: 8px; }
  .skill-name { color: #e6edf3; font-weight: 600; font-size: 15px; }
  .skill-ver { color: #8b949e; font-size: 12px; background: #21262d; padding: 1px 8px; border-radius: 999px; }
  .skill-desc { color: #8b949e; font-size: 13px; flex: 1; }
  .skill-meta { color: #6e7681; font-size: 12px; }
  .skill-actions { display: flex; gap: 8px; }
  .btn { background: #238636; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; text-decoration: none; display: inline-block; }
  .btn:hover { background: #2ea043; }
  .btn.ghost { background: #21262d; }
  .btn.ghost:hover { background: #30363d; }
  .empty { color: #8b949e; }
  .foot { color: #6e7681; font-size: 12px; margin-top: 28px; }
  #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #238636; color: #fff; padding: 8px 18px; border-radius: 6px; font-size: 13px; opacity: 0; transition: opacity .2s; pointer-events: none; }
</style>
</head>
<body>
<div class="wrap">
  <h1>AI 平台 Skill 市场</h1>
  <p class="sub">内网技能包分发中心 · 共 ${skills.length} 个技能</p>
  <div class="section">
    <div class="section-head mcp"><span class="tag">MCP</span><span class="hint">一键接入平台 MCP 网关（内置工具 + RAG 知识库检索）</span></div>
    <div class="section-body">
      <div class="mcp-box">
        <strong>🔌 一键接入 DeepChat MCP</strong>
        <p class="mcp-desc">把「AI 平台 MCP 网关」（内置工具 + 知识库检索 <code>search_knowledge</code>）一键加进 DeepChat，即可在对话里使用平台工具和 RAG 知识库检索。</p>
        <div class="mcp-actions">
          <a class="btn mcp-btn" href="${deepLink}">🔌 一键接入 DeepChat MCP</a>
          <button class="btn ghost" onclick="copyDeepLink()">📋 复制一键接入链接</button>
        </div>
        <p class="mcp-manual">手动配置：DeepChat → 设置 → MCP → 新增 → <b>跳过至手动配置</b> → 类型「可流式传输的 HTTP 请求」→ 基础 URL 填 <code>${mcpBase}/mcp</code></p>
        <p class="mcp-manual" style="margin-top:8px;color:#6e7681">⚠️ 一键接入走 <b>SSE</b>（DeepChat 的 deep link 只支持 SSE/stdio，不支持 Streamable HTTP），会显示「SSE is legacy-only」提示，<b>属正常、不影响使用</b>；想要 Streamable HTTP（无提示）请用上面手动配置填 <code>/mcp</code>。</p>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-head skill"><span class="tag">SKILL</span><span class="hint">内网技能包安装</span></div>
    <div class="section-body">
      <div class="howto">
        <strong>DeepChat 安装 Skill：</strong>设置 → Skills → 从 URL 安装，填
        <code>${mcpBase}/skills/&lt;名称&gt;.zip</code>（或点「下载 ZIP」后从 ZIP / 文件夹安装）。
      </div>
      <div class="grid">${cards}</div>
    </div>
  </div>
  <p class="foot">由 MCP Gateway 托管 · 技能来源：skills/ 目录</p>
</div>
<div id="toast">已复制</div>
<script>
function copyDeepLink() {
  const link = document.querySelector('.mcp-btn').getAttribute('href');
  const done = () => {
    const t = document.getElementById('toast');
    t.textContent = '已复制：' + link;
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(done).catch(() => fallbackCopy(link, done));
  } else {
    fallbackCopy(link, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { prompt('复制失败，请手动复制：', text); }
  document.body.removeChild(ta);
}
function copyInstall(name) {
  const url = location.origin + '/skills/' + name + '.zip';
  navigator.clipboard.writeText(url).then(() => {
    const t = document.getElementById('toast');
    t.textContent = '已复制：' + url;
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 2000);
  });
}
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
