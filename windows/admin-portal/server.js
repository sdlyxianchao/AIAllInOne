/**
 * AI Admin Center — Server
 *
 * Features:
 * - Keycloak OIDC authentication
 * - Docker container status monitoring (via docker.sock)
 * - Keycloak admin user management (via Admin REST API)
 * - Global Admin auto-creation on first start
 * - Static frontend serving
 */

const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const Docker = require('dockerode');
const { default: KcAdminClient } = require('@keycloak/keycloak-admin-client');
const { Writable } = require('stream');
const path = require('path');
const app = express();

// ═══════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-to-a-random-64-char-string';
const KC_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KC_REALM = process.env.KEYCLOAK_REALM || 'ai-platform';
const KC_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'admin-portal';
const KC_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || '';
const LITELLM_URL = process.env.LITELLM_URL || 'http://127.0.0.1:4001';
const NEWAPI_URL = process.env.NEWAPI_URL || 'http://new-api:3000';
const NEWAPI_ADMIN_USER = process.env.NEWAPI_ADMIN_USERNAME || ADMIN_USER;
const NEWAPI_ADMIN_PASS = process.env.NEWAPI_ADMIN_PASSWORD || ADMIN_PASS;
const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://mcp-gateway:3100';
const MCP_ADMIN_TOKEN = process.env.MCP_ADMIN_TOKEN || '';
const GITEA_URL = process.env.GITEA_URL || 'http://gitea:3000';
const GITEA_ADMIN_USER = process.env.GITEA_ADMIN_USERNAME || ADMIN_USER;
const GITEA_ADMIN_PASS = process.env.GITEA_ADMIN_PASSWORD || ADMIN_PASS;
const DIFY_URL = process.env.DIFY_URL || 'http://192.168.31.117';
const DIFY_ADMIN_EMAIL = process.env.DIFY_ADMIN_EMAIL || ADMIN_EMAIL;
const DIFY_ADMIN_PASS = process.env.DIFY_ADMIN_PASSWORD || ADMIN_PASS;
const GHOST_CONTAINER = process.env.GHOST_CONTAINER || 'ghost';
const GHOST_INTERNAL_URL = process.env.GHOST_INTERNAL_URL || 'http://ghost:2368';
const GHOST_EXTERNAL_URL = process.env.GHOST_EXTERNAL_URL || 'http://192.168.31.117:8090';
const GHOST_ADMIN_EMAIL = process.env.GHOST_ADMIN_EMAIL || 'ai_all_in_one_admin@company.com';
const LITELLM_INTERNAL_URL = process.env.LITELLM_INTERNAL_URL || 'http://litellm:4000';
const UPDATE_CONTAINER = process.env.UPDATE_CONTAINER || 'update-server';
const REDIS_URL = process.env.REDIS_URL || 'redis://admin-session-redis:6379';
const NEWAPI_DB_CONTAINER = process.env.NEWAPI_DB_CONTAINER || 'new-api-db';
const NEWAPI_DB_PASSWORD = process.env.NEWAPI_DB_PASSWORD || 'CHANGE_ME_NEWAPI_DB_PASSWORD';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://192.168.31.117:3030';
const LANGFUSE_URL = process.env.LANGFUSE_URL || 'http://192.168.31.117:3010';
const PROMETHEUS_INTERNAL_URL = process.env.PROMETHEUS_INTERNAL_URL || 'http://prometheus:9090';
const LANGFUSE_INTERNAL_URL = process.env.LANGFUSE_INTERNAL_URL || 'http://langfuse:3000';
const PRESIDIO_ANALYZER_URL = process.env.PRESIDIO_ANALYZER_URL || 'http://presidio-analyzer:3000';
const PRESIDIO_ANONYMIZER_URL = process.env.PRESIDIO_ANONYMIZER_URL || 'http://presidio-anonymizer:3000';
const LANGFUSE_CLICKHOUSE_PASSWORD = process.env.LANGFUSE_CLICKHOUSE_PASSWORD || 'CHANGE_ME_CLICKHOUSE_PASSWORD';
// 备份 / 日志
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';          // 宿主机备份目录挂载点
const REPORT_DIR = process.env.REPORT_DIR || '/backups/reports';  // 历史报告保存目录（在 backups 卷内）
const DEPLOY_DIR = process.env.DEPLOY_DIR || '/deploy';            // 部署目录（配置/脚本）只读挂载
const LOKI_URL = process.env.LOKI_URL || 'http://loki:3100';       // Loki 统一日志
const DIFY_DB_CONTAINER = process.env.DIFY_DB_CONTAINER || 'docker-db_postgres-1';
const GITEA_CONTAINER = process.env.GITEA_CONTAINER || 'gitea';

// ═══════════════════════════════════════════
// Keycloak OIDC Setup
// ═══════════════════════════════════════════
// 会话存 Redis（容器重建不丢登录）；Redis 不可用时回退内存存储，保证可用性
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const redisClient = createClient({ url: REDIS_URL, socket: { reconnectStrategy: () => 2000 } });
redisClient.on('error', (e) => console.warn('[session] Redis 连接异常，回退内存存储:', e.message));
redisClient.connect().catch((e) => console.warn('[session] Redis 连接失败，回退内存存储:', e.message));
const redisStore = new RedisStore({ client: redisClient });
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: redisStore,
}));

const kcConfig = {
  realm: KC_REALM,
  'auth-server-url': KC_URL,
  resource: KC_CLIENT_ID,
  'confidential-port': 0,
};

if (KC_CLIENT_SECRET) {
  kcConfig.credentials = { secret: KC_CLIENT_SECRET };
  kcConfig['confidential-port'] = 443;
}

const keycloak = new Keycloak({ store: redisStore }, kcConfig);
app.use(keycloak.middleware());
app.use(express.json({ limit: '2mb' }));

// ═══════════════════════════════════════════
// Docker API
// ═══════════════════════════════════════════
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// ═══════════════════════════════════════════
// Keycloak Admin API helper
// ═══════════════════════════════════════════
async function getKcAdmin() {
  const kcAdmin = new KcAdminClient({
    baseUrl: KC_URL,
    realmName: 'master', // admin-cli 是 master realm 的客户端，管理员账号也在 master realm
  });
  await kcAdmin.auth({
    username: ADMIN_USER,
    password: ADMIN_PASS,
    grantType: 'password',
    clientId: 'admin-cli',
  });
  // 后续对 enterprise-ai realm 的操作都在调用处显式传 realm
  return kcAdmin;
}

// ═══════════════════════════════════════════
// Startup: ensure Global Admin exists
// ═══════════════════════════════════════════
async function ensureGlobalAdmin() {
  try {
    const kc = await getKcAdmin();
    const existing = await kc.users.find({ username: ADMIN_USER, realm: KC_REALM });
    if (existing.length === 0) {
      const user = await kc.users.create({
        username: ADMIN_USER,
        email: ADMIN_EMAIL,
        emailVerified: true,
        enabled: true,
        credentials: [{ type: 'password', value: ADMIN_PASS, temporary: false }],
      });
      // Assign admin role
      let role = await kc.roles.findOneByName({ name: 'ai-platform-admin' });
      if (!role) {
        await kc.roles.create({ name: 'ai-platform-admin' });
        role = await kc.roles.findOneByName({ name: 'ai-platform-admin' });
      }
      if (role) {
        await kc.users.addRealmRoleMappings({ id: user.id, roles: [{ id: role.id, name: 'ai-platform-admin' }] });
      }
      console.log(`[init] Created Global Admin user: ${ADMIN_USER}`);
    } else {
      console.log(`[init] Global Admin user exists: ${ADMIN_USER}`);
    }
  } catch (err) {
    console.warn('[init] Could not verify/create Global Admin (Keycloak may not be ready yet):', err.message);
  }
}

// ═══════════════════════════════════════════
// API Routes (all require Keycloak auth)
// ═══════════════════════════════════════════

// Health — basic auth check
app.get('/api/health', keycloak.protect(), async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const services = containers
      .filter(c => !c.Names[0].startsWith('/admin-portal'))
      .map(c => ({
        name: c.Names[0].replace('/', ''),
        status: c.State,
        image: c.Image,
        ports: c.Ports ? c.Ports.map(p => p.PublicPort).filter(Boolean) : [],
        created: new Date(c.Created * 1000).toISOString(),
      }));
    res.json({
      services,
      total: services.length,
      running: services.filter(s => s.status === 'running').length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Docker socket not available', message: err.message });
  }
});

// Service detail — check a specific service health
app.get('/api/health/:name', keycloak.protect(), async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const container = containers.find(c => c.Names[0] === '/' + req.params.name);
    if (!container) return res.status(404).json({ error: 'Not found' });
    const c = docker.getContainer(container.Id);
    const info = await c.inspect();
    res.json({
      name: req.params.name,
      status: container.State,
      uptime: container.Status,
      image: container.Image,
      memory: info.State ? info.State.Memory : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin users list (requires ai-platform-admin role)
app.get('/api/admins', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const users = await kc.users.find({ realm: KC_REALM, max: 200 });
    const admins = [];
    for (const u of users) {
      try {
        const roles = await kc.users.listRealmRoleMappings({ id: u.id });
        if (roles.some(r => r.name === 'ai-platform-admin')) {
          admins.push({
            id: u.id,
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            enabled: u.enabled,
            createdTimestamp: u.createdTimestamp,
          });
        }
      } catch (e) { /* skip users we can't read roles for */ }
    }
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Keycloak API error', message: err.message });
  }
});

// System info
app.get('/api/system', keycloak.protect(), async (req, res) => {
  try {
    const info = await docker.info();
    res.json({
      containers: info.Containers,
      images: info.Images,
      osType: info.OSType,
      architecture: info.Architecture,
      cpuCount: info.NCPU,
      memory: info.MemTotal,
      dockerVersion: info.ServerVersion,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LiteLLM credentials — return master key + URL for copy-to-login
app.get('/api/litellm', keycloak.protect(), (req, res) => {
  res.json({ masterKey: LITELLM_MASTER_KEY, url: LITELLM_URL });
});

// 当前登录用户信息（左下角账号名用）
app.get('/api/me', keycloak.protect(), (req, res) => {
  const c = (req.kauth && req.kauth.grant && req.kauth.grant.access_token && req.kauth.grant.access_token.content) || {};
  res.json({ username: c.preferred_username || c.name || '—', email: c.email || '', name: c.name || '' });
});

// Unified authentication overview (admin only — contains credentials)
// 集中认证概览：统一账号体系、SSO 机制、各平台登录方式、LiteLLM 例外
app.get('/api/auth/overview', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  res.json({
    unified: {
      username: ADMIN_USER,
      password: ADMIN_PASS,
    },
    ldap: {
      username: ADMIN_USER,
      bindDn: process.env.LDAP_BIND_DN || 'CN=ai all in one admin,CN=Users,DC=chxia,DC=lab',
    },
    litellm: {
      masterKey: LITELLM_MASTER_KEY,
      url: LITELLM_URL,
    },
  });
});

// ═══════════════════════════════════════════
// NewAPI Admin API client
// ═══════════════════════════════════════════
let newapiToken = null;
let newapiTokenExp = 0;

async function newapiLogin() {
  const resp = await fetch(`${NEWAPI_URL}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: NEWAPI_ADMIN_USER, password: NEWAPI_ADMIN_PASS }),
  });
  const data = await resp.json();
  if (!data || !data.data || !data.data.access_token) {
    throw new Error('NewAPI 登录失败: ' + ((data && data.message) || '未知错误'));
  }
  newapiToken = data.data.access_token;
  newapiTokenExp = Date.now() + 60 * 60 * 1000; // 60 分钟缓存（减少重复登录，避免会话堆积）
  return newapiToken;
}

async function newapiGetToken() {
  if (newapiToken && Date.now() < newapiTokenExp) return newapiToken;
  return newapiLogin();
}

async function newapiApi(path) {
  const token = await newapiGetToken();
  const resp = await fetch(`${NEWAPI_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return resp.json();
}

// NewAPI 管理端点（仅 ai-platform-admin 角色可见）
app.get('/api/newapi/channels', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try { res.json(await newapiApi('/api/channel/')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/users', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try { res.json(await newapiApi('/api/user/?p=0&page_size=100')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/tokens', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try { res.json(await newapiApi('/api/token/?p=0&page_size=100')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/overview', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const [channels, users, tokens] = await Promise.all([
      newapiApi('/api/channel/'),
      newapiApi('/api/user/?p=0&page_size=1'),
      newapiApi('/api/token/?p=0&page_size=1'),
    ]);
    res.json({
      channels: (channels?.data?.items || []).length,
      users: users?.data?.total ?? 0,
      tokens: tokens?.data?.total ?? 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// NewAPI 审计日志 + 成本报表（直接查 new-api-db 的 logs 表）
// ═══════════════════════════════════════════
// NewAPI 额度换算：默认 500000 quota = 1 美元
const QUOTA_PER_USD = 500000;

async function newapiDbQuery(sql) {
  const { stdout, stderr } = await dockerExec(NEWAPI_DB_CONTAINER, [
    'sh', '-c',
    `MYSQL_PWD="${NEWAPI_DB_PASSWORD}" mysql -uroot -N -B -e "${sql.replace(/"/g, '\\"')}" new-api 2>/dev/null`,
  ]);
  if (stderr && stderr.trim() && !/Warning/i.test(stderr)) throw new Error(stderr.trim());
  const rows = [];
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    rows.push(line.split('\t'));
  }
  return rows;
}

// 审计日志：最近 N 条对话（type=2）
app.get('/api/newapi/audit', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const user = (req.query.user || '').replace(/[^a-zA-Z0-9_@.\-]/g, '');
    let where = "type=2";
    if (user) where += ` AND username='${user}'`;
    const rows = await newapiDbQuery(
      `SELECT id,username,token_name,model_name,prompt_tokens,completion_tokens,quota,ip,created_at,is_stream FROM logs WHERE ${where} ORDER BY id DESC LIMIT ${limit}`
    );
    res.json({
      items: rows.map(r => ({
        id: r[0], username: r[1], token_name: r[2], model_name: r[3],
        prompt_tokens: +r[4] || 0, completion_tokens: +r[5] || 0, quota: +r[6] || 0,
        ip: r[7], created_at: +r[8] || 0, is_stream: r[9] === '1',
        cost_usd: ((+r[6] || 0) / QUOTA_PER_USD).toFixed(4),
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 成本报表：总计 + 按用户 + 按模型 + 按天趋势
app.get('/api/newapi/cost', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = `created_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL ${days} DAY))`;
    const [tot, byUser, byModel, byDay] = await Promise.all([
      newapiDbQuery(`SELECT COUNT(*),SUM(prompt_tokens),SUM(completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since}`),
      newapiDbQuery(`SELECT username,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY username ORDER BY SUM(quota) DESC`),
      newapiDbQuery(`SELECT model_name,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY model_name ORDER BY SUM(quota) DESC`),
      newapiDbQuery(`SELECT DATE_FORMAT(FROM_UNIXTIME(created_at),'%Y-%m-%d'),COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY 1 ORDER BY 1`),
    ]);
    const c = tot[0] || ['0', '0', '0', '0'];
    res.json({
      days,
      total: { calls: +c[0] || 0, prompt_tokens: +c[1] || 0, completion_tokens: +c[2] || 0, cost_quota: +c[3] || 0, cost_usd: ((+c[3] || 0) / QUOTA_PER_USD).toFixed(2) },
      by_user: byUser.map(r => ({ username: r[0], calls: +r[1] || 0, tokens: +r[2] || 0, cost_quota: +r[3] || 0, cost_usd: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
      by_model: byModel.map(r => ({ model: r[0], calls: +r[1] || 0, tokens: +r[2] || 0, cost_quota: +r[3] || 0, cost_usd: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
      by_day: byDay.map(r => ({ date: r[0], calls: +r[1] || 0, tokens: +r[2] || 0, cost_quota: +r[3] || 0, cost_usd: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 产品概览统计（登录即可看，供侧边栏「产品」菜单展示关键数据 + 跳转）
// ═══════════════════════════════════════════

// ---- Gitea（Basic Auth REST API）----
async function giteaApi(path) {
  const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
  const resp = await fetch(`${GITEA_URL}${path}`, {
    headers: { 'Authorization': `Basic ${auth}` },
  });
  let data = null;
  try { data = await resp.json(); } catch (e) { data = null; }
  return { status: resp.status, data, total: parseInt(resp.headers.get('x-total-count') || '0', 10) };
}

app.get('/api/gitea/overview', keycloak.protect(), async (req, res) => {
  try {
    const [version, users, repos, orgs, issues, reposList] = await Promise.all([
      giteaApi('/api/v1/version'),
      giteaApi('/api/v1/admin/users?limit=1'),
      giteaApi('/api/v1/repos/search?limit=1'),
      giteaApi('/api/v1/orgs'),
      giteaApi('/api/v1/repos/issues/search?limit=1'),
      giteaApi('/api/v1/user/repos?limit=50'),
    ]);
    const repos_list = (reposList.data || []).map(r => ({
      name: r.full_name || r.name,
      description: r.description || '',
      language: r.language || '',
      size_kb: r.size || 0,
      updated_at: r.updated_at || null,
      default_branch: r.default_branch || '',
      html_url: r.html_url || '',
    }));
    // deepchat-sync 仓库最近一次 workflow 执行时间
    let sync_last_run = null;
    try {
      const runs = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/deepchat-sync/actions/runs?limit=1`);
      const run = (runs.data && runs.data.workflow_runs && runs.data.workflow_runs[0]) || null;
      if (run) {
        sync_last_run = {
          status: run.status,
          conclusion: run.conclusion,
          completed_at: run.completed_at || run.started_at || null,
          display_title: run.display_title || '',
        };
      }
    } catch (e) { sync_last_run = null; }
    res.json({
      version: (version.data && version.data.version) || '—',
      users: users.total,
      repos: repos.total,
      orgs: Array.isArray(orgs.data) ? orgs.data.length : 0,
      issues: issues.total,
      repos_list,
      sync_last_run,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak（Admin REST API）----
app.get('/api/keycloak/overview', keycloak.protect(), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const [users, clients, roles] = await Promise.all([
      kc.users.count({ realm: KC_REALM }),
      kc.clients.find({ realm: KC_REALM }),
      kc.roles.find({ realm: KC_REALM }),
    ]);
    let idps = [];
    try { idps = await kc.identityProviders.find({ realm: KC_REALM }); } catch (e) { idps = []; }
    res.json({
      users,
      clients: (clients || []).length,
      roles: (roles || []).length,
      idps: (idps || []).map(i => i.alias || i.displayName).filter(Boolean),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Ghost（docker exec 容器内 sqlite 查库）----
function dockerExec(containerName, cmd) {
  return new Promise(async (resolve, reject) => {
    try {
      const container = docker.getContainer(containerName);
      const exec = await container.exec({ Cmd: cmd, AttachStdout: true, AttachStderr: true });
      const stream = await exec.start({ hijack: true });
      let stdout = '', stderr = '';
      docker.modem.demuxStream(stream,
        new Writable({ write(c, e, cb) { stdout += c.toString('utf8'); cb(); } }),
        new Writable({ write(c, e, cb) { stderr += c.toString('utf8'); cb(); } })
      );
      stream.on('end', () => resolve({ stdout, stderr }));
      stream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

const GHOST_STATS_SCRIPT = `const fs=require('fs'),path=require('path');
let sp=null;
for(const d of fs.readdirSync('/var/lib/ghost/versions')){
  const p=path.join('/var/lib/ghost/versions',d,'node_modules','sqlite3');
  if(fs.existsSync(p)){sp=p;break;}
}
const D=require(sp);
const db=new D.Database('/var/lib/ghost/content/data/ghost.db',D.OPEN_READONLY);
const q=(sql)=>new Promise((res,rej)=>db.get(sql,(e,r)=>e?rej(e):res(r)));
(async()=>{
  const posts=await q("SELECT COUNT(*) c FROM posts WHERE type='post'");
  const pages=await q("SELECT COUNT(*) c FROM posts WHERE type='page'");
  const members=await q("SELECT COUNT(*) c FROM members");
  const tags=await q("SELECT COUNT(*) c FROM tags");
  console.log(JSON.stringify({posts:posts.c,pages:pages.c,members:members.c,tags:tags.c}));
  db.close();
})();`;

// 读 Ghost 的 admin_session_secret + 管理员 userId（用于本地算 TOTP 验证码，免读 MailHog）
const GHOST_AUTH_SCRIPT = (email) => `const fs=require('fs'),path=require('path');
let sp=null;
for(const d of fs.readdirSync('/var/lib/ghost/versions')){
  const p=path.join('/var/lib/ghost/versions',d,'node_modules','sqlite3');
  if(fs.existsSync(p)){sp=p;break;}
}
const D=require(sp);
const db=new D.Database('/var/lib/ghost/content/data/ghost.db',D.OPEN_READONLY);
db.get("SELECT value FROM settings WHERE key='admin_session_secret'",(e,sec)=>{
  if(e){console.error(e);process.exit(1);}
  db.get("SELECT id FROM users WHERE email=? AND status='active' LIMIT 1",["${email}"],(e2,u)=>{
    if(e2){console.error(e2);process.exit(1);}
    console.log(JSON.stringify({secret:sec.value,userId:String(u?u.id:1)}));
    db.close();
  });
});`;

// Ghost 6 位验证码 = TOTP(admin_session_secret + userId)，6位/60秒/HMAC-SHA1（与 Ghost otplib 一致）
function ghostTotp(secret, userId) {
  const crypto = require('crypto');
  const key = secret + String(userId);
  const counter = Math.floor(Date.now() / 1000 / 60);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = h[h.length - 1] & 0x0f;
  const code = ((h.readUInt32BE(offset) & 0x7fffffff) % 1000000);
  return String(code).padStart(6, '0');
}

app.get('/api/ghost/overview', keycloak.protect(), async (req, res) => {
  try {
    const { stdout, stderr } = await dockerExec(GHOST_CONTAINER, ['node', '-e', GHOST_STATS_SCRIPT]);
    const m = stdout.trim().match(/\{.*\}/s);
    if (!m) throw new Error('Ghost 统计解析失败: ' + (stderr || stdout).slice(0, 200));
    const d = JSON.parse(m[0]);
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Dify（console API，base64 密码 + cookie/CSRF）----
let difyCache = { token: '', csrf: '', exp: 0 };
async function difyLogin() {
  if (difyCache.token && Date.now() < difyCache.exp) return difyCache;
  const resp = await fetch(`${DIFY_URL}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DIFY_ADMIN_EMAIL,
      password: Buffer.from(DIFY_ADMIN_PASS).toString('base64'),
      language: 'zh-Hans',
    }),
  });
  const setCookies = (resp.headers.getSetCookie && resp.headers.getSetCookie()) || [];
  let accessToken = '', csrf = '', refreshToken = '';
  for (const c of setCookies) {
    const [pair] = c.split(';');
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k === 'access_token') accessToken = v;
    else if (k === 'csrf_token') csrf = v;
    else if (k === 'refresh_token') refreshToken = v;
  }
  if (!accessToken) throw new Error('Dify 登录失败（未获取到 access_token）');
  difyCache = { token: accessToken, csrf, refreshToken, exp: Date.now() + 50 * 60 * 1000 };
  return difyCache;
}

async function difyApi(path) {
  const { token, csrf, refreshToken } = await difyLogin();
  const cookie = `access_token=${token}; csrf_token=${csrf}` + (refreshToken ? `; refresh_token=${refreshToken}` : '');
  const resp = await fetch(`${DIFY_URL}${path}`, {
    headers: { 'Cookie': cookie, 'X-CSRF-Token': csrf },
  });
  let data = null;
  try { data = await resp.json(); } catch (e) { data = null; }
  return { status: resp.status, data };
}

app.get('/api/dify/overview', keycloak.protect(), async (req, res) => {
  try {
    const [apps, workspaces] = await Promise.all([
      difyApi('/console/api/apps?page=1&limit=1'),
      difyApi('/console/api/workspaces'),
    ]);
    res.json({
      apps: (apps.data && apps.data.total) ?? 0,
      workspaces: (workspaces.data && workspaces.data.workspaces) ? workspaces.data.workspaces.length : 0,
      version: '1.16.1',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Update Server（DeepChat 分发：安装包清单 + 更新时间）----
app.get('/api/update/overview', keycloak.protect(), async (req, res) => {
  try {
    const [verRes, statRes] = await Promise.all([
      dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']),
      dockerExec(UPDATE_CONTAINER, ['sh', '-c', 'for f in /usr/share/nginx/html/deepchat/*; do stat -c "%n|%s|%Y" "$f" 2>/dev/null; done']),
    ]);
    const version = (verRes.stdout || '').trim() || '—';
    const files = [];
    let last_updated = 0;
    for (const line of statRes.stdout.split('\n').map(s => s.trim()).filter(Boolean)) {
      const parts = line.split('|');
      if (parts.length < 3) continue;
      const name = parts[0].split('/').pop();
      const size = parseInt(parts[1], 10) || 0;
      const mtime = parseInt(parts[2], 10) || 0;
      if (mtime > last_updated) last_updated = mtime;
      files.push({ name, size, mtime });
    }
    files.sort((a, b) => b.mtime - a.mtime);
    res.json({ version, files, last_updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 监控概览（Prometheus + Grafana + cadvisor）
app.get('/api/monitoring/overview', keycloak.protect(), async (req, res) => {
  try {
    const [targetsRes, alertsRes, grafanaRes, cadvisorRes] = await Promise.all([
      fetch(`${PROMETHEUS_INTERNAL_URL}/api/v1/targets`).then(r => r.json()),
      fetch(`${PROMETHEUS_INTERNAL_URL}/api/v1/alerts`).then(r => r.json()),
      fetch('http://grafana:3000/api/health').then(r => r.json()).catch(() => null),
      fetch('http://cadvisor:8080/healthz').then(r => r.ok).catch(() => false),
    ]);
    const targets = targetsRes?.data?.activeTargets || [];
    const alerts = alertsRes?.data?.alerts || [];
    const firing = alerts.filter(a => a.state === 'firing').length;
    res.json({
      prometheus: { up: targets.filter(t => t.health === 'up').length, total: targets.length },
      alerts_firing: firing,
      grafana: grafanaRes ? 'up' : 'down',
      cadvisor: cadvisorRes ? 'up' : 'down',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LLM 可观测概览（Langfuse）
app.get('/api/langfuse/overview', keycloak.protect(), async (req, res) => {
  try {
    const health = await fetch(`${LANGFUSE_INTERNAL_URL}/api/public/health`).then(r => r.json());
    let traces = null;
    try {
      const { stdout } = await dockerExec('langfuse-clickhouse', [
        'clickhouse-client', '-u', 'langfuse', '--password', LANGFUSE_CLICKHOUSE_PASSWORD,
        '--query', 'SELECT count() FROM default.traces',
      ]);
      traces = parseInt((stdout || '').trim(), 10);
      if (isNaN(traces)) traces = 0;
    } catch (e) { traces = null; }
    res.json({ version: health.version || '—', traces });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// MCP Gateway 管理 API 代理（仅 ai-platform-admin）
// 网关侧需 X-Admin-Token 鉴权，这里注入
// ═══════════════════════════════════════════
async function gwFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (MCP_ADMIN_TOKEN) headers['X-Admin-Token'] = MCP_ADMIN_TOKEN;
  const resp = await fetch(`${MCP_GATEWAY_URL}${path}`, { ...opts, headers });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: resp.status, data };
}

app.get('/api/mcp-gateway/servers', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch('/api/servers');
  res.status(r.status).json(r.data);
});

app.post('/api/mcp-gateway/servers', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch('/api/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) });
  res.status(r.status).json(r.data);
});

app.put('/api/mcp-gateway/servers/:name', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch(`/api/servers/${req.params.name}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) });
  res.status(r.status).json(r.data);
});

app.delete('/api/mcp-gateway/servers/:name', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch(`/api/servers/${req.params.name}`, { method: 'DELETE' });
  res.status(r.status).json(r.data);
});

app.get('/api/mcp-gateway/skills', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch('/skills');
  res.status(r.status).json(r.data);
});

app.post('/api/mcp-gateway/skills/upload', keycloak.protect('realm:ai-platform-admin'), express.raw({ type: ['application/zip', 'application/octet-stream'], limit: '200mb' }), async (req, res) => {
  const buf = req.body;
  if (!buf || !buf.length) return res.status(400).json({ error: '空文件' });
  const r = await gwFetch('/api/skills/upload', { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: buf });
  res.status(r.status).json(r.data);
});

app.delete('/api/mcp-gateway/skills/:name', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const r = await gwFetch(`/api/skills/${req.params.name}`, { method: 'DELETE' });
  res.status(r.status).json(r.data);
});

// 统一看板 — 聚合各产品关键指标（登录即可看，只返回数量）
app.get('/api/metrics', keycloak.protect(), async (req, res) => {
  const metrics = {};
  const ok = (obj) => ({ status: 'ok', ...obj });
  const err = (e) => ({ status: 'error', message: e.message });

  await Promise.all([
    // NewAPI
    (async () => {
      try {
        const [channels, users, tokens] = await Promise.all([
          newapiApi('/api/channel/'),
          newapiApi('/api/user/?p=0&page_size=1'),
          newapiApi('/api/token/?p=0&page_size=1'),
        ]);
        metrics.newapi = ok({
          channels: (channels?.data?.items || []).length,
          users: users?.data?.total ?? 0,
          tokens: tokens?.data?.total ?? 0,
        });
      } catch (e) { metrics.newapi = err(e); }
    })(),
    // Gitea
    (async () => {
      try {
        const [repos, users, issues] = await Promise.all([
          giteaApi('/api/v1/repos/search?limit=1'),
          giteaApi('/api/v1/admin/users?limit=1'),
          giteaApi('/api/v1/repos/issues/search?limit=1'),
        ]);
        metrics.gitea = ok({ repos: repos.total, users: users.total, issues: issues.total });
      } catch (e) { metrics.gitea = err(e); }
    })(),
    // Ghost
    (async () => {
      try {
        const { stdout } = await dockerExec(GHOST_CONTAINER, ['node', '-e', GHOST_STATS_SCRIPT]);
        const m = stdout.trim().match(/\{.*\}/s);
        if (!m) throw new Error('Ghost 统计解析失败');
        metrics.ghost = ok(JSON.parse(m[0]));
      } catch (e) { metrics.ghost = err(e); }
    })(),
    // Dify
    (async () => {
      try {
        const [apps, workspaces] = await Promise.all([
          difyApi('/console/api/apps?page=1&limit=1'),
          difyApi('/console/api/workspaces'),
        ]);
        metrics.dify = ok({
          apps: (apps.data && apps.data.total) ?? 0,
          workspaces: (workspaces.data && workspaces.data.workspaces) ? workspaces.data.workspaces.length : 0,
        });
      } catch (e) { metrics.dify = err(e); }
    })(),
    // Keycloak
    (async () => {
      try {
        const kc = await getKcAdmin();
        const [users, clients, roles] = await Promise.all([
          kc.users.count({ realm: KC_REALM }),
          kc.clients.find({ realm: KC_REALM }),
          kc.roles.find({ realm: KC_REALM }),
        ]);
        metrics.keycloak = ok({ users, clients: (clients || []).length, roles: (roles || []).length });
      } catch (e) { metrics.keycloak = err(e); }
    })(),
    // MCP Gateway
    (async () => {
      try {
        const [servers, skills] = await Promise.all([
          gwFetch('/api/servers'),
          gwFetch('/skills'),
        ]);
        metrics.mcp = ok({
          servers: (servers.data && servers.data.servers ? servers.data.servers.length : 0),
          skills: (skills.data && skills.data.skills ? skills.data.skills.length : 0),
        });
      } catch (e) { metrics.mcp = err(e); }
    })(),
    // LiteLLM（模型数）
    (async () => {
      try {
        const resp = await fetch(`${LITELLM_INTERNAL_URL}/v1/models`, {
          headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}` },
        });
        const data = await resp.json();
        metrics.litellm = ok({ models: (data.data || []).length });
      } catch (e) { metrics.litellm = err(e); }
    })(),
    // Update Server（DeepChat 版本）
    (async () => {
      try {
        const { stdout } = await dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']);
        metrics.update = ok({ version: (stdout || '').trim() || '—' });
      } catch (e) { metrics.update = err(e); }
    })(),
    // 监控（Prometheus + Grafana）
    (async () => {
      try {
        const r = await fetch(`${PROMETHEUS_INTERNAL_URL}/api/v1/targets`);
        const d = await r.json();
        const targets = d?.data?.activeTargets || [];
        const up = targets.filter(t => t.health === 'up').length;
        metrics.monitoring = ok({ targets: up, total: targets.length });
      } catch (e) { metrics.monitoring = err(e); }
    })(),
    // PII 脱敏（Presidio analyzer + anonymizer 健康；用 state 字段避免与 status:'ok' 冲突）
    (async () => {
      try {
        const [a, an] = await Promise.all([
          fetch(`${PRESIDIO_ANALYZER_URL}/health`),
          fetch(`${PRESIDIO_ANONYMIZER_URL}/health`),
        ]);
        const analyzer = a.ok ? 'up' : 'down';
        const anonymizer = an.ok ? 'up' : 'down';
        const allUp = a.ok && an.ok;
        metrics.presidio = allUp
          ? ok({ state: 'up', analyzer, anonymizer })
          : ok({ state: 'degraded', analyzer, anonymizer });
      } catch (e) { metrics.presidio = err(e); }
    })(),
    // LLM 可观测（Langfuse 健康）
    (async () => {
      try {
        const r = await fetch(`${LANGFUSE_INTERNAL_URL}/api/public/health`);
        const d = await r.json();
        metrics.langfuse = ok({ version: d.version || '—' });
      } catch (e) { metrics.langfuse = err(e); }
    })(),
  ]);

  res.json(metrics);
});

// ═══════════════════════════════════════════
// 备份与恢复（Node 原生实现，与 scripts\backup.ps1 产出同格式备份）
// ═══════════════════════════════════════════
const fs = require('fs');

function tsStr(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 从部署目录挂载读取配置（dify .env 等）
function readDeployEnv(relPath, key, fallback) {
  try {
    const content = fs.readFileSync(path.join(DEPLOY_DIR, relPath), 'utf8');
    const m = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return m ? m[1].trim() : fallback;
  } catch { return fallback; }
}
const DIFY_DB_PASSWORD = readDeployEnv('dify/docker/.env', 'DB_PASSWORD', 'difyai123456');

// 读取容器内文件 → Buffer（base64 中转，二进制安全）
async function readContainerFile(containerName, filePath) {
  const { stdout, stderr } = await dockerExec(containerName, ['sh', '-c', `base64 "${filePath}" 2>/dev/null`]);
  if (stderr && stderr.trim() && !/base64/i.test(stderr)) throw new Error(stderr.trim());
  return Buffer.from(stdout.replace(/\s/g, ''), 'base64');
}

// 容器内执行 dump 命令 → Buffer（stdout 走 base64，避免 UTF-8/二进制损坏）
async function dumpFromContainer(containerName, dumpCmd) {
  const { stdout } = await dockerExec(containerName, ['sh', '-c', `${dumpCmd} | base64`]);
  return Buffer.from(stdout.replace(/\s/g, ''), 'base64');
}

// 把本地 Buffer 写入容器内指定路径（tar-fs.pack + putArchive，二进制安全）
const tarfs = require('tar-fs');
function writeContainerFile(containerName, containerPath, buffer, entryName) {
  return new Promise(async (resolve, reject) => {
    try {
      const tmp = fs.mkdtempSync('/tmp/restore-');
      fs.writeFileSync(path.join(tmp, entryName), buffer);
      const pack = tarfs.pack(tmp, { entries: [entryName] });
      const container = docker.getContainer(containerName);
      await container.putArchive(pack, { path: containerPath });
      fs.rmSync(tmp, { recursive: true, force: true });
      resolve();
    } catch (e) { reject(e); }
  });
}

const GHOST_CHECKPOINT_SCRIPT = `const fs=require('fs'),path=require('path');
let sp=null;
for(const d of fs.readdirSync('/var/lib/ghost/versions')){
  const p=path.join('/var/lib/ghost/versions',d,'node_modules','sqlite3');
  if(fs.existsSync(p)){sp=p;break;}
}
if(!sp){console.log('no-sqlite3');process.exit(0);}
const D=require(sp);
const db=new D.Database('/var/lib/ghost/content/data/ghost.db');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
console.log('checkpoint-ok');`;

async function performBackup() {
  const results = [];
  const add = (name, ok, detail) => results.push({ name, ok, detail: detail || '' });
  const stamp = tsStr(new Date());
  const dir = path.join(BACKUP_DIR, `backup_${stamp}`);
  fs.mkdirSync(dir, { recursive: true });

  // 1. NewAPI MySQL
  try {
    const buf = await dumpFromContainer(NEWAPI_DB_CONTAINER, `mysqldump -uroot -p"${NEWAPI_DB_PASSWORD}" --single-transaction --routines --triggers new-api 2>/dev/null`);
    fs.writeFileSync(path.join(dir, 'newapi-mysql.sql'), buf);
    add('NewAPI MySQL', buf.length > 1024, `${(buf.length / 1024).toFixed(1)} KB`);
  } catch (e) { add('NewAPI MySQL', false, e.message); }

  // 2. Dify PostgreSQL
  try {
    const buf = await dumpFromContainer(DIFY_DB_CONTAINER, `PGPASSWORD="${DIFY_DB_PASSWORD}" pg_dump -U postgres -d dify 2>/dev/null`);
    fs.writeFileSync(path.join(dir, 'dify-postgres.sql'), buf);
    add('Dify PostgreSQL', buf.length > 1024, `${(buf.length / 1024).toFixed(1)} KB`);
  } catch (e) { add('Dify PostgreSQL', false, e.message); }

  // 3. SQLite（Ghost / Gitea）
  try {
    await dockerExec(GHOST_CONTAINER, ['node', '-e', GHOST_CHECKPOINT_SCRIPT]);
    const buf = await readContainerFile(GHOST_CONTAINER, '/var/lib/ghost/content/data/ghost.db');
    fs.writeFileSync(path.join(dir, 'ghost.db'), buf);
    add('Ghost SQLite', buf.length > 0, `${(buf.length / 1024).toFixed(1)} KB`);
  } catch (e) { add('Ghost SQLite', false, e.message); }
  try {
    await dockerExec(GITEA_CONTAINER, ['sh', '-c', 'sqlite3 /data/gitea/gitea.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null']);
    const buf = await readContainerFile(GITEA_CONTAINER, '/data/gitea/gitea.db');
    fs.writeFileSync(path.join(dir, 'gitea.db'), buf);
    add('Gitea SQLite', buf.length > 0, `${(buf.length / 1024).toFixed(1)} KB`);
  } catch (e) { add('Gitea SQLite', false, e.message); }

  // 4. 配置文件（从 /deploy 只读挂载复制）
  try {
    const cfgDir = path.join(dir, 'config');
    fs.mkdirSync(cfgDir, { recursive: true });
    const cfgFiles = [
      ['.env', '.env'], ['.env.windows', '.env.windows'], ['docker-compose.yml', 'docker-compose.yml'],
      ['litellm-config.yaml', 'litellm-config.yaml'], ['gitea-runner-config.yaml', 'gitea-runner-config.yaml'],
      ['mcp-gateway/mcp-servers.json', 'mcp-servers.json'], ['dify/docker/.env', 'dify.env'],
    ];
    let n = 0;
    for (const [src, dst] of cfgFiles) {
      try { fs.copyFileSync(path.join(DEPLOY_DIR, src), path.join(cfgDir, dst)); n++; }
      catch (e) { add(`配置 ${dst}`, false, e.message); }
    }
    add('配置文件', n > 0, `${n} 个`);
  } catch (e) { add('配置文件', false, e.message); }

  // 写 backup.log
  const logLine = `[${new Date().toLocaleString('sv-SE')}] ========== 备份 -> ${dir}（AI 管理中心触发）==========\n` +
    results.map(r => `  ${r.ok ? '[OK]' : '[FAIL]'} ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`).join('\n') + '\n';
  try { fs.appendFileSync(path.join(BACKUP_DIR, 'backup.log'), logLine); } catch (e) {}

  return { dir: path.basename(dir), results, pass: results.filter(r => r.ok).length, fail: results.filter(r => !r.ok).length };
}

async function performRestore(dirName) {
  if (!/^backup_[0-9_]+$/.test(dirName)) throw new Error('非法备份目录名');
  const dir = path.join(BACKUP_DIR, dirName);
  if (!fs.existsSync(dir)) throw new Error('备份目录不存在');
  const results = [];
  const add = (name, ok, detail) => results.push({ name, ok, detail: detail || '' });

  // 1. 配置
  const cfgDir = path.join(dir, 'config');
  if (fs.existsSync(cfgDir)) {
    for (const f of ['.env', '.env.windows', 'docker-compose.yml', 'litellm-config.yaml', 'gitea-runner-config.yaml']) {
      const src = path.join(cfgDir, f);
      if (fs.existsSync(src)) {
        try { fs.copyFileSync(src, path.join(DEPLOY_DIR, f)); add(`配置 ${f}`, true); }
        catch (e) { add(`配置 ${f}`, false, e.message); }
      }
    }
  }

  // 2. NewAPI MySQL
  const mysqlDump = path.join(dir, 'newapi-mysql.sql');
  if (fs.existsSync(mysqlDump)) {
    try {
      await writeContainerFile(NEWAPI_DB_CONTAINER, '/tmp', fs.readFileSync(mysqlDump), 'restore.sql');
      await dockerExec(NEWAPI_DB_CONTAINER, ['sh', '-c', `MYSQL_PWD="${NEWAPI_DB_PASSWORD}" mysql -uroot new-api < /tmp/restore.sql 2>/dev/null`]);
      add('NewAPI MySQL', true);
    } catch (e) { add('NewAPI MySQL', false, e.message); }
  }

  // 3. Dify PostgreSQL
  const pgDump = path.join(dir, 'dify-postgres.sql');
  if (fs.existsSync(pgDump)) {
    try {
      await writeContainerFile(DIFY_DB_CONTAINER, '/tmp', fs.readFileSync(pgDump), 'restore.sql');
      await dockerExec(DIFY_DB_CONTAINER, ['sh', '-c', `PGPASSWORD="${DIFY_DB_PASSWORD}" psql -U postgres -d dify < /tmp/restore.sql 2>/dev/null`]);
      add('Dify PostgreSQL', true);
    } catch (e) { add('Dify PostgreSQL', false, e.message); }
  }

  // 4. SQLite
  const ghostDb = path.join(dir, 'ghost.db');
  if (fs.existsSync(ghostDb)) {
    try {
      await writeContainerFile(GHOST_CONTAINER, '/var/lib/ghost/content/data', fs.readFileSync(ghostDb), 'ghost.db');
      await docker.getContainer(GHOST_CONTAINER).restart();
      add('Ghost SQLite', true);
    } catch (e) { add('Ghost SQLite', false, e.message); }
  }
  const giteaDb = path.join(dir, 'gitea.db');
  if (fs.existsSync(giteaDb)) {
    try {
      await writeContainerFile(GITEA_CONTAINER, '/data/gitea', fs.readFileSync(giteaDb), 'gitea.db');
      await docker.getContainer(GITEA_CONTAINER).restart();
      add('Gitea SQLite', true);
    } catch (e) { add('Gitea SQLite', false, e.message); }
  }

  return { dir: dirName, results, pass: results.filter(r => r.ok).length, fail: results.filter(r => !r.ok).length };
}

// 备份列表
app.get('/api/backup/list', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const dirs = [];
    if (fs.existsSync(BACKUP_DIR)) {
      for (const name of fs.readdirSync(BACKUP_DIR)) {
        if (!name.startsWith('backup_')) continue;
        const full = path.join(BACKUP_DIR, name);
        const st = fs.statSync(full);
        if (!st.isDirectory()) continue;
        const files = fs.readdirSync(full).filter(f => f !== 'config').map(f => {
          const s = fs.statSync(path.join(full, f));
          return { name: f, size: s.size, mtime: s.mtimeMs };
        });
        dirs.push({ name, mtime: st.mtimeMs, files });
      }
    }
    dirs.sort((a, b) => b.mtime - a.mtime);
    let logTail = '';
    try { logTail = fs.readFileSync(path.join(BACKUP_DIR, 'backup.log'), 'utf8').split('\n').slice(-40).join('\n'); } catch (e) {}
    res.json({ dirs, logTail });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 触发备份
app.post('/api/backup/run', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const r = await performBackup();
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 触发恢复
app.post('/api/backup/restore', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const dirName = (req.body && req.body.dir) || '';
    if (!dirName) return res.status(400).json({ error: '缺少备份目录名' });
    const r = await performRestore(dirName);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// PII 脱敏概览
// ═══════════════════════════════════════════
app.get('/api/pii/overview', keycloak.protect(), async (req, res) => {
  try {
    const [analyzer, anonymizer, litellmRes] = await Promise.all([
      fetch(`${PRESIDIO_ANALYZER_URL}/health`).then(async r => ({ up: r.ok, detail: (await r.text()).trim() })).catch(e => ({ up: false, detail: e.message })),
      fetch(`${PRESIDIO_ANONYMIZER_URL}/health`).then(async r => ({ up: r.ok, detail: (await r.text()).trim() })).catch(e => ({ up: false, detail: e.message })),
      fetch(`${LITELLM_INTERNAL_URL}/v1/models`, { headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}` } }).then(r => r.json()).catch(() => null),
    ]);
    res.json({
      presidio: {
        analyzer,
        anonymizer,
      },
      litellm: { models: ((litellmRes && litellmRes.data) || []).map(m => m.id) },
      guardrails: [
        { name: 'content-safety-filter', type: '内置正则（default_on）', on: true, note: '手机号 / 身份证 / 银行卡 / 邮箱 / 信用代码 / 护照 / IP 脱敏 + 敏感词拦截' },
        { name: 'presidio-pii-mask', type: 'Presidio 实体识别（default_on）', on: true, note: 'EMAIL_ADDRESS / PHONE_NUMBER / CREDIT_CARD / PERSON 脱敏' },
      ],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 统一日志（Loki 查询）
// ═══════════════════════════════════════════
app.get('/api/logs/query', keycloak.protect(), async (req, res) => {
  try {
    const container = (req.query.container || '').replace(/[^a-zA-Z0-9_.\-]/g, '');
    const service = (req.query.service || '').replace(/[^a-zA-Z0-9_.\-]/g, '');
    const keyword = (req.query.keyword || '').slice(0, 200);
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
    const since = req.query.since || '1h'; // 1h / 6h / 24h / 7d
    const m = since.match(/^(\d+)([smhd])$/);
    const sec = m ? (m[2] === 's' ? +m[1] : m[2] === 'm' ? +m[1] * 60 : m[2] === 'h' ? +m[1] * 3600 : +m[1] * 86400) : 3600;

    let selector = '{container=~".+"}';
    if (container) selector = `{container="${container}"}`;
    else if (service) selector = `{service="${service}"}`;

    const logql = keyword ? `${selector} |= \`${keyword.replace(/`/g, '')}\`` : selector;
    const end = Date.now();
    const start = end - sec * 1000;
    const url = `${LOKI_URL}/loki/api/v1/query_range?query=${encodeURIComponent(logql)}&limit=${limit}&start=${start * 1000000}&end=${end * 1000000}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status !== 'success') throw new Error((data.error || data.message || 'Loki 查询失败'));
    const streams = (data.data && data.data.result) || [];
    const entries = [];
    for (const s of streams) {
      const labels = s.stream || {};
      for (const [ts, line] of (s.values || [])) {
        entries.push({ ts: parseInt(ts, 10) / 1000000, container: labels.container || '', service: labels.service || '', line });
      }
    }
    entries.sort((a, b) => b.ts - a.ts);
    res.json({ logql, entries: entries.slice(0, limit), total: entries.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 可用性测试（Availability Check）
// 覆盖：Keycloak 认证 / NewAPI / LiteLLM / DeepChat·Dify 聊天 / Ghost / Gitea / MCP /
//       Prometheus / Grafana / Langfuse / Loki / Presidio / SSO / 更新服务器 / 备份 / Docker / Redis
// ═══════════════════════════════════════════
const AVAILABILITY_INTERVAL_MIN = parseInt(process.env.AVAILABILITY_INTERVAL_MIN || '10', 10);

// 从 NewAPI DB 取 deepchat / dify 的完整 token key（base64 中转避免 shell 转义）
async function getNewApiTokens() {
  const sql = "SELECT name, `key` FROM `new-api`.tokens WHERE status=1";
  const b64 = Buffer.from(sql).toString('base64');
  const { stdout } = await dockerExec(NEWAPI_DB_CONTAINER, [
    'sh', '-c',
    `MYSQL_PWD="${NEWAPI_DB_PASSWORD}" mysql -uroot -N -B -e "$(echo ${b64} | base64 -d)" 2>/dev/null`,
  ]);
  const out = { deepchat: null, dify: null };
  for (const line of stdout.split('\n')) {
    const [name, key] = line.split('\t');
    if (name === 'deepchat-key' && key) out.deepchat = 'sk-' + key.trim();
    if (name === 'dify-key' && key) out.dify = 'sk-' + key.trim();
  }
  return out;
}

// 单个测试包装：计时 + 异常捕获
async function runAvailabilityTest(id, name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    return { id, name, status: 'ok', latency_ms: Date.now() - start, detail };
  } catch (e) {
    return { id, name, status: 'fail', latency_ms: Date.now() - start, detail: (e && e.message) ? e.message : String(e) };
  }
}

// 各测试实现（返回 detail 字符串，失败抛异常）
const availabilityTestDefs = [
  { id: 'keycloak', name: 'Keycloak 认证', run: async () => {
      const r = await fetch(`${KC_URL}/realms/${KC_REALM}`);
      if (!r.ok) throw new Error('realm HTTP ' + r.status);
      const d = await r.json().catch(() => ({}));
      return `realm=${d.realm || KC_REALM} enabled=${d.enabled}`;
    } },
  { id: 'newapi', name: 'NewAPI 网关', run: async () => {
      const r = await fetch(`${NEWAPI_URL}/api/status`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return '状态接口正常';
    } },
  { id: 'litellm', name: 'LiteLLM 脱敏代理', run: async () => {
      const r = await fetch(`${LITELLM_INTERNAL_URL}/v1/models`, { headers: { Authorization: `Bearer ${LITELLM_MASTER_KEY}` } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      return `模型 ${((d.data || []).map(m => m.id).join(', ') || '无')}`;
    } },
  { id: 'chat-deepchat', name: 'DeepChat 聊天（经 NewAPI）', run: async () => {
      const tokens = await getNewApiTokens();
      if (!tokens.deepchat) throw new Error('未找到 deepchat-key token');
      const r = await fetch(`${NEWAPI_URL}/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.deepchat}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + ((await r.text()).slice(0, 120)));
      const d = await r.json();
      const u = d.usage || {};
      return `模型 deepseek-chat · tokens ${u.total_tokens ?? '—'} · ${((d.choices || [{}])[0].message || {}).content ? '有回复' : '无回复'}`;
    } },
  { id: 'chat-dify', name: 'Dify 聊天（经 NewAPI）', run: async () => {
      const tokens = await getNewApiTokens();
      if (!tokens.dify) throw new Error('未找到 dify-key token');
      const r = await fetch(`${NEWAPI_URL}/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.dify}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + ((await r.text()).slice(0, 120)));
      const d = await r.json();
      const u = d.usage || {};
      return `模型 deepseek-chat · tokens ${u.total_tokens ?? '—'} · ${((d.choices || [{}])[0].message || {}).content ? '有回复' : '无回复'}`;
    } },
  { id: 'dify', name: 'Dify 平台', run: async () => {
      const r = await fetch(`${DIFY_URL}/`, { redirect: 'manual' });
      if (r.status >= 400) throw new Error('HTTP ' + r.status);
      return `入口可达 (HTTP ${r.status})`;
    } },
  { id: 'ghost', name: 'Ghost 门户', run: async () => {
      const r = await fetch('http://ghost:2368/');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return '门户首页正常';
    } },
  { id: 'gitea', name: 'Gitea 源码', run: async () => {
      const r = await fetch(`${GITEA_URL}/api/v1/version`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json().catch(() => ({}));
      return `version=${d.version || '—'}`;
    } },
  { id: 'mcp', name: 'MCP Gateway', run: async () => {
      const r = await fetch(`${MCP_GATEWAY_URL}/api/servers`, { headers: { 'X-Admin-Token': MCP_ADMIN_TOKEN } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json().catch(() => ({}));
      const n = (d.servers || []).length;
      return `MCP server 数 ${n}`;
    } },
  { id: 'prometheus', name: 'Prometheus 监控', run: async () => {
      const r = await fetch(`${PROMETHEUS_INTERNAL_URL}/api/v1/targets`);
      const d = await r.json();
      const t = d?.data?.activeTargets || [];
      const up = t.filter(x => x.health === 'up').length;
      if (t.length === 0) throw new Error('无抓取目标');
      return `目标 ${up}/${t.length} 存活`;
    } },
  { id: 'grafana', name: 'Grafana 大盘', run: async () => {
      const r = await fetch('http://grafana:3000/api/health');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return 'health ok';
    } },
  { id: 'langfuse', name: 'Langfuse 可观测', run: async () => {
      const r = await fetch(`${LANGFUSE_INTERNAL_URL}/api/public/health`);
      const d = await r.json();
      if (d.status !== 'OK') throw new Error('status ' + (d.status || 'unknown'));
      return `version=${d.version || '—'}`;
    } },
  { id: 'loki', name: 'Loki 统一日志', run: async () => {
      const r = await fetch(`${LOKI_URL}/ready`);
      const txt = await r.text();
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + txt.slice(0, 80));
      return 'ready';
    } },
  { id: 'presidio', name: 'Presidio PII 脱敏', run: async () => {
      const [a, an] = await Promise.all([
        fetch(`${PRESIDIO_ANALYZER_URL}/health`),
        fetch(`${PRESIDIO_ANONYMIZER_URL}/health`),
      ]);
      if (!a.ok || !an.ok) throw new Error(`analyzer=${a.status} anonymizer=${an.status}`);
      return 'analyzer + anonymizer 均正常';
    } },
  { id: 'sso-grafana', name: 'Grafana SSO', run: async () => {
      const r = await fetch(`${GRAFANA_URL}/login/generic_oauth`, { redirect: 'manual' });
      const loc = r.headers.get('location') || '';
      if (r.status >= 400) throw new Error('HTTP ' + r.status);
      if (!loc.includes('realms/enterprise-ai')) throw new Error('未跳转 Keycloak');
      return 'OIDC 跳转 Keycloak 正常';
    } },
  { id: 'sso-langfuse', name: 'Langfuse SSO', run: async () => {
      const r = await fetch(`${LANGFUSE_URL}/auth/sso-initiate?provider=KEYCLOAK`);
      if (r.status >= 500) throw new Error('HTTP ' + r.status);
      return 'SSO 发起端点可达';
    } },
  { id: 'update-server', name: '更新服务器', run: async () => {
      const { stdout } = await dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']);
      return `DeepChat 版本 ${(stdout || '').trim() || '—'}`;
    } },
  { id: 'backup', name: '备份', run: async () => {
      if (!fs.existsSync(BACKUP_DIR)) throw new Error('备份目录不存在');
      const dirs = fs.readdirSync(BACKUP_DIR).filter(n => n.startsWith('backup_'));
      if (!dirs.length) return '暂无备份（未执行过）';
      const latest = dirs.map(n => ({ n, t: fs.statSync(path.join(BACKUP_DIR, n)).mtimeMs })).sort((a, b) => b.t - a.t)[0];
      const ageH = ((Date.now() - latest.t) / 3600000).toFixed(1);
      return `最近备份 ${latest.n}（${ageH} 小时前）`;
    } },
  { id: 'docker', name: 'Docker 容器', run: async () => {
      const containers = await docker.listContainers({ all: true });
      const running = containers.filter(c => c.State === 'running').length;
      if (running === 0) throw new Error('无运行容器');
      return `运行 ${running}/${containers.length}`;
    } },
  { id: 'redis', name: 'Redis 会话', run: async () => {
      const { stdout } = await dockerExec('admin-session-redis', ['redis-cli', 'ping']);
      if (!/PONG/i.test(stdout)) throw new Error('响应 ' + (stdout || '').trim());
      return 'PONG';
    } },
];

// 运行全部测试
async function runAllAvailability() {
  const results = await Promise.all(availabilityTestDefs.map(d => runAvailabilityTest(d.id, d.name, d.run)));
  const ok = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  return { runAt: Date.now(), summary: { total: results.length, ok, fail, degraded }, results };
}

// 最近一次结果缓存
let lastAvailability = null;
let availabilityRunning = false;
async function refreshAvailability() {
  if (availabilityRunning) return lastAvailability;
  availabilityRunning = true;
  try { lastAvailability = await runAllAvailability(); }
  catch (e) { lastAvailability = { runAt: Date.now(), summary: { total: 0, ok: 0, fail: 1, degraded: 0 }, results: [{ id: '_', name: '可用性测试', status: 'fail', detail: e.message }] }; }
  finally { availabilityRunning = false; }
  return lastAvailability;
}

function startAvailabilityScheduler() {
  refreshAvailability(); // 启动即跑一次
  const ms = AVAILABILITY_INTERVAL_MIN * 60 * 1000;
  setInterval(refreshAvailability, ms);
  console.log(`[availability] 定时可用性测试每 ${AVAILABILITY_INTERVAL_MIN} 分钟运行一次`);
}

// 结果（含配置）
app.get('/api/availability', keycloak.protect(), async (req, res) => {
  res.json({ interval_min: AVAILABILITY_INTERVAL_MIN, last: lastAvailability });
});

// 全测
app.post('/api/availability/run', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  res.json(await refreshAvailability());
});

// 单测
app.post('/api/availability/test/:id', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  const def = availabilityTestDefs.find(d => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: '未知测试项 ' + req.params.id });
  const r = await runAvailabilityTest(def.id, def.name, def.run);
  // 回写缓存对应项
  if (lastAvailability) {
    const i = lastAvailability.results.findIndex(x => x.id === def.id);
    if (i >= 0) lastAvailability.results[i] = r; else lastAvailability.results.push(r);
    lastAvailability.runAt = Date.now();
  }
  res.json(r);
});

// ═══════════════════════════════════════════
// 报告生成（Report Generation）
// 聚合：系统状态 / 使用统计(NewAPI) / 客户端(IP·Token) / 最近问题(Loki) / 可用性 / 备份 / PII
// ═══════════════════════════════════════════

// 报告文案（zh / en；其他语言回退英文）
const REPORT_L = {
  zh: {
    title: 'AI 平台系统报告', metaGen: '报告生成时间', metaPeriod: '统计周期', metaDays: '天',
    secSystem: '一、系统总览', secProducts: '产品健康状态', secUsage: '二、使用统计',
    secClient: '三、客户端统计', secIssues: '四、最近问题', secAvail: '五、可用性测试',
    secBackup: '六、备份状态', secPii: '七、PII 脱敏状态',
    kRunning: '运行容器 / 总容器', kDocker: 'Docker 版本', kCpu: 'CPU 核数', kMemory: '内存(GB)', kImages: '镜像数', kArch: '架构',
    kProduct: '产品', kStatus: '状态', kDetail: '详情', kUp: '正常', kDown: '异常',
    kTotalCalls: '总调用次数', kTotalTokens: '总 Token', kTotalCost: '总成本(USD)',
    kByUser: '按用户', kByModel: '按模型', kByDay: '按天趋势',
    kUser: '用户', kCalls: '调用', kTokens: 'Token', kCost: '成本', kModel: '模型', kDate: '日期',
    kByIp: '按 IP 地址', kByToken: '按客户端应用(API Key)', kIp: 'IP', kLastSeen: '最后活跃',
    kErrLogs: '错误日志汇总(按容器)', kErrSample: '错误日志样例', kNoErr: '统计周期内未发现错误日志', kContainer: '容器', kErrCount: '错误数',
    kAvailFail: '可用性测试失败项', kStopped: '异常/停止的容器', kNone: '无',
    kAvailSummary: '可用性测试汇总', kTotal: '总计', kPass: '通过', kFail: '失败',
    kBackupLatest: '最近备份', kBackupCount: '备份数量', kBackupList: '备份列表', kBackupNo: '暂无备份',
    kPresidio: 'Presidio 服务', kAnalyzer: '识别(analyzer)', kAnonymizer: '脱敏(anonymizer)',
    footer: '本报告由 AI 管理中心自动生成。', noData: '无数据', errLabel: '获取失败',
    pnames: { newapi: 'NewAPI 网关', litellm: 'LiteLLM 脱敏代理', keycloak: 'Keycloak 认证', dify: 'Dify 平台', ghost: 'Ghost 门户', gitea: 'Gitea 源码', mcp: 'MCP Gateway', prometheus: 'Prometheus 监控', grafana: 'Grafana 大盘', langfuse: 'Langfuse 可观测', loki: 'Loki 日志', presidio: 'Presidio PII 脱敏', update: '更新服务器', redis: 'Redis 会话' },
  },
  en: {
    title: 'AI Platform System Report', metaGen: 'Generated at', metaPeriod: 'Period', metaDays: 'days',
    secSystem: '1. System Overview', secProducts: 'Product Health', secUsage: '2. Usage Statistics',
    secClient: '3. Client Statistics', secIssues: '4. Recent Issues', secAvail: '5. Availability Test',
    secBackup: '6. Backup Status', secPii: '7. PII Redaction',
    kRunning: 'Running / Total containers', kDocker: 'Docker version', kCpu: 'CPU cores', kMemory: 'Memory(GB)', kImages: 'Images', kArch: 'Architecture',
    kProduct: 'Product', kStatus: 'Status', kDetail: 'Detail', kUp: 'Up', kDown: 'Down',
    kTotalCalls: 'Total calls', kTotalTokens: 'Total tokens', kTotalCost: 'Total cost(USD)',
    kByUser: 'By user', kByModel: 'By model', kByDay: 'Daily trend',
    kUser: 'User', kCalls: 'Calls', kTokens: 'Tokens', kCost: 'Cost', kModel: 'Model', kDate: 'Date',
    kByIp: 'By IP address', kByToken: 'By client app (API Key)', kIp: 'IP', kLastSeen: 'Last seen',
    kErrLogs: 'Error log summary (by container)', kErrSample: 'Error log samples', kNoErr: 'No error logs in this period', kContainer: 'Container', kErrCount: 'Errors',
    kAvailFail: 'Failed availability tests', kStopped: 'Stopped/unhealthy containers', kNone: 'None',
    kAvailSummary: 'Availability summary', kTotal: 'Total', kPass: 'Passed', kFail: 'Failed',
    kBackupLatest: 'Latest backup', kBackupCount: 'Backup count', kBackupList: 'Backup list', kBackupNo: 'No backups',
    kPresidio: 'Presidio service', kAnalyzer: 'Analyzer', kAnonymizer: 'Anonymizer',
    footer: 'This report was auto-generated by AI Admin Center.', noData: 'No data', errLabel: 'Failed',
    pnames: { newapi: 'NewAPI Gateway', litellm: 'LiteLLM Proxy', keycloak: 'Keycloak Auth', dify: 'Dify Platform', ghost: 'Ghost Portal', gitea: 'Gitea Source', mcp: 'MCP Gateway', prometheus: 'Prometheus', grafana: 'Grafana', langfuse: 'Langfuse', loki: 'Loki Logs', presidio: 'Presidio PII', update: 'Update Server', redis: 'Redis Session' },
  },
};

// 产品健康状态收集（返回 [{id, ok, detail}]，name 由 pnames 翻译）
async function collectProductStatus() {
  const items = [];
  const add = async (id, fn) => {
    try { items.push({ id, ok: true, detail: await fn() }); }
    catch (e) { items.push({ id, ok: false, detail: (e && e.message) ? e.message : String(e) }); }
  };
  await Promise.all([
    add('newapi', async () => { const r = await fetch(`${NEWAPI_URL}/api/status`); if (!r.ok) throw new Error('HTTP ' + r.status); return 'OK'; }),
    add('litellm', async () => { const r = await fetch(`${LITELLM_INTERNAL_URL}/v1/models`, { headers: { Authorization: `Bearer ${LITELLM_MASTER_KEY}` } }); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json(); return `models=${(d.data || []).length}`; }),
    add('keycloak', async () => { const kc = await getKcAdmin(); const n = await kc.users.count({ realm: KC_REALM }); return `users=${n}`; }),
    add('dify', async () => { const r = await fetch(`${DIFY_URL}/`, { redirect: 'manual' }); if (r.status >= 400) throw new Error('HTTP ' + r.status); return `reachable(${r.status})`; }),
    add('ghost', async () => { const r = await fetch('http://ghost:2368/'); if (!r.ok) throw new Error('HTTP ' + r.status); return 'OK'; }),
    add('gitea', async () => { const r = await fetch(`${GITEA_URL}/api/v1/version`); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json().catch(() => ({})); return `v${d.version || '—'}`; }),
    add('mcp', async () => { const r = await fetch(`${MCP_GATEWAY_URL}/api/servers`, { headers: { 'X-Admin-Token': MCP_ADMIN_TOKEN } }); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json().catch(() => ({})); return `servers=${(d.servers || []).length}`; }),
    add('prometheus', async () => { const r = await fetch(`${PROMETHEUS_INTERNAL_URL}/api/v1/targets`); const d = await r.json(); const t = d?.data?.activeTargets || []; const up = t.filter(x => x.health === 'up').length; return `targets=${up}/${t.length}`; }),
    add('grafana', async () => { const r = await fetch('http://grafana:3000/api/health'); if (!r.ok) throw new Error('HTTP ' + r.status); return 'OK'; }),
    add('langfuse', async () => { const r = await fetch(`${LANGFUSE_INTERNAL_URL}/api/public/health`); const d = await r.json(); return `v${d.version || '—'}`; }),
    add('loki', async () => { const r = await fetch(`${LOKI_URL}/ready`); if (!r.ok) throw new Error('HTTP ' + r.status); return 'ready'; }),
    add('presidio', async () => { const [a, an] = await Promise.all([fetch(`${PRESIDIO_ANALYZER_URL}/health`), fetch(`${PRESIDIO_ANONYMIZER_URL}/health`)]); if (!a.ok || !an.ok) throw new Error(`analyzer=${a.status} anonymizer=${an.status}`); return 'OK'; }),
    add('update', async () => { const { stdout } = await dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']); return `DeepChat ${(stdout || '').trim() || '—'}`; }),
    add('redis', async () => { const { stdout } = await dockerExec('admin-session-redis', ['redis-cli', 'ping']); if (!/PONG/i.test(stdout)) throw new Error('no PONG'); return 'PONG'; }),
  ]);
  return items.sort((a, b) => Number(b.ok) - Number(a.ok));
}

// 汇总报告数据
async function collectReport(days) {
  const now = Date.now();
  const from = now - days * 86400 * 1000;
  const since = `created_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL ${days} DAY))`;

  // 1. 系统总览
  let system = null;
  try {
    const info = await docker.info();
    const containers = await docker.listContainers({ all: true });
    const running = containers.filter(c => c.State === 'running').length;
    const stopped = containers.filter(c => c.State !== 'running').map(c => c.Names[0].replace('/', ''));
    system = {
      running, total: containers.length, stopped,
      dockerVersion: info.ServerVersion, cpuCount: info.NCPU,
      memoryGB: ((info.MemTotal || 0) / 1024 / 1024 / 1024).toFixed(1),
      images: info.Images, architecture: info.Architecture, osType: info.OSType,
    };
  } catch (e) { system = { error: e.message }; }

  // 2. 产品健康状态
  const products = await collectProductStatus();

  // 3. 使用统计（NewAPI 审计日志）
  let usage = null;
  try {
    const [tot, byUser, byModel, byDay, byIp, byToken] = await Promise.all([
      newapiDbQuery(`SELECT COUNT(*),SUM(prompt_tokens),SUM(completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since}`),
      newapiDbQuery(`SELECT username,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY username ORDER BY SUM(quota) DESC LIMIT 20`),
      newapiDbQuery(`SELECT model_name,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY model_name ORDER BY SUM(quota) DESC LIMIT 20`),
      newapiDbQuery(`SELECT DATE_FORMAT(FROM_UNIXTIME(created_at),'%Y-%m-%d'),COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY 1 ORDER BY 1`),
      newapiDbQuery(`SELECT ip,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota),MAX(created_at) FROM logs WHERE type=2 AND ${since} GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 20`),
      newapiDbQuery(`SELECT token_name,COUNT(*),SUM(prompt_tokens+completion_tokens),SUM(quota) FROM logs WHERE type=2 AND ${since} GROUP BY token_name ORDER BY COUNT(*) DESC LIMIT 20`),
    ]);
    const c = tot[0] || ['0', '0', '0', '0'];
    usage = {
      total: { calls: +c[0] || 0, prompt: +c[1] || 0, completion: +c[2] || 0, quota: +c[3] || 0, cost_usd: ((+c[3] || 0) / QUOTA_PER_USD).toFixed(2) },
      by_user: byUser.map(r => ({ user: r[0] || '—', calls: +r[1] || 0, tokens: +r[2] || 0, cost: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
      by_model: byModel.map(r => ({ model: r[0] || '—', calls: +r[1] || 0, tokens: +r[2] || 0, cost: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
      by_day: byDay.map(r => ({ date: r[0] || '—', calls: +r[1] || 0, tokens: +r[2] || 0, cost: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
      by_ip: byIp.map(r => ({ ip: r[0] || '—', calls: +r[1] || 0, tokens: +r[2] || 0, cost: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2), last: r[4] ? +r[4] : 0 })),
      by_token: byToken.map(r => ({ token: r[0] || '—', calls: +r[1] || 0, tokens: +r[2] || 0, cost: ((+r[3] || 0) / QUOTA_PER_USD).toFixed(2) })),
    };
  } catch (e) { usage = { error: e.message }; }

  // 4. 最近问题（Loki 错误日志）
  let errors = null;
  try {
    const logql = '{container=~".+"} |~ "(?i)(error|exception|fail|refused|timeout|panic|fatal|econnrefused)"';
    const url = `${LOKI_URL}/loki/api/v1/query_range?query=${encodeURIComponent(logql)}&limit=300&start=${from * 1000000}&end=${now * 1000000}`;
    const resp = await fetch(url);
    const d = await resp.json();
    const streams = (d.data && d.data.result) || [];
    const byContainer = {};
    const samples = [];
    for (const s of streams) {
      const name = (s.stream && (s.stream.container || s.stream.service)) || '—';
      byContainer[name] = (byContainer[name] || 0) + (s.values || []).length;
      for (const [ts, line] of (s.values || [])) {
        if (samples.length < 20) samples.push({ ts: parseInt(ts, 10) / 1000000, container: name, line: (line || '').slice(0, 200) });
      }
    }
    errors = { byContainer: Object.entries(byContainer).sort((a, b) => b[1] - a[1]).slice(0, 15), samples };
  } catch (e) { errors = { error: e.message }; }

  // 5. 可用性测试
  let availability = lastAvailability;
  if (!availability) { try { availability = await refreshAvailability(); } catch (e) { availability = null; } }

  // 6. 备份
  let backup = null;
  try {
    const dirs = fs.readdirSync(BACKUP_DIR).filter(n => n.startsWith('backup_'));
    const list = dirs.map(n => ({ name: n, mtime: fs.statSync(path.join(BACKUP_DIR, n)).mtimeMs })).sort((a, b) => b.mtime - a.mtime);
    backup = { latest: list[0] || null, count: list.length, list: list.slice(0, 10).map(x => x.name) };
  } catch (e) { backup = { error: e.message }; }

  // 7. PII
  let pii = null;
  try {
    const [a, an] = await Promise.all([fetch(`${PRESIDIO_ANALYZER_URL}/health`), fetch(`${PRESIDIO_ANONYMIZER_URL}/health`)]);
    pii = { analyzer: a.ok, anonymizer: an.ok };
  } catch (e) { pii = { error: e.message }; }

  return { generatedAt: now, from, to: now, days, system, products, usage, errors, availability, backup, pii };
}

// markdown 单元格转义
function mdCell(s) { return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }
function tsFmt(ts) { const d = new Date(ts); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }

function renderReportMarkdown(data, lang, sections) {
  const L = REPORT_L[lang] || REPORT_L.en;
  const on = key => !sections || sections.size === 0 || sections.has(key);
  const nameOf = id => (L.pnames[id] || id);
  const lines = [];
  lines.push(`# ${L.title}`);
  lines.push('');
  lines.push(`> ${L.metaGen}：${tsFmt(data.generatedAt)}`);
  lines.push(`> ${L.metaPeriod}：${tsFmt(data.from)} ~ ${tsFmt(data.to)}（${data.days} ${L.metaDays}）`);
  lines.push('');

  // 一、系统总览
  if (on('system') && data.system) {
    lines.push(`## ${L.secSystem}`);
    lines.push('');
    if (data.system.error) {
      lines.push(`- ${L.errLabel}：${data.system.error}`);
    } else {
      lines.push(`| ${L.kRunning} | ${L.kDocker} | ${L.kCpu} | ${L.kMemory} | ${L.kImages} | ${L.kArch} |`);
      lines.push('| --- | --- | --- | --- | --- | --- |');
      lines.push(`| ${data.system.running} / ${data.system.total} | ${data.system.dockerVersion || '—'} | ${data.system.cpuCount || '—'} | ${data.system.memoryGB || '—'} | ${data.system.images || '—'} | ${data.system.architecture || '—'} |`);
      lines.push('');
    }
  }

  // 产品健康状态
  if (on('system') && Array.isArray(data.products) && data.products.length) {
    lines.push(`### ${L.secProducts}`);
    lines.push('');
    lines.push(`| ${L.kProduct} | ${L.kStatus} | ${L.kDetail} |`);
    lines.push('| --- | --- | --- |');
    for (const p of data.products) {
      lines.push(`| ${nameOf(p.id)} | ${p.ok ? '✅ ' + L.kUp : '❌ ' + L.kDown} | ${mdCell(p.detail)} |`);
    }
    lines.push('');
  }

  // 二、使用统计
  if (on('usage') && data.usage) {
    lines.push(`## ${L.secUsage}`);
    lines.push('');
    if (data.usage.error) {
      lines.push(`- ${L.errLabel}：${data.usage.error}`);
    } else {
      const t = data.usage.total;
      lines.push(`| ${L.kTotalCalls} | ${L.kTotalTokens} | ${L.kTotalCost} |`);
      lines.push('| --- | --- | --- |');
      lines.push(`| ${t.calls} | ${t.prompt + t.completion} | $${t.cost_usd} |`);
      lines.push('');
      if (data.usage.by_user && data.usage.by_user.length) {
        lines.push(`### ${L.kByUser}`);
        lines.push('');
        lines.push(`| ${L.kUser} | ${L.kCalls} | ${L.kTokens} | ${L.kCost} |`);
        lines.push('| --- | --- | --- | --- |');
        for (const r of data.usage.by_user) lines.push(`| ${mdCell(r.user)} | ${r.calls} | ${r.tokens} | $${r.cost} |`);
        lines.push('');
      }
      if (data.usage.by_model && data.usage.by_model.length) {
        lines.push(`### ${L.kByModel}`);
        lines.push('');
        lines.push(`| ${L.kModel} | ${L.kCalls} | ${L.kTokens} | ${L.kCost} |`);
        lines.push('| --- | --- | --- | --- |');
        for (const r of data.usage.by_model) lines.push(`| ${mdCell(r.model)} | ${r.calls} | ${r.tokens} | $${r.cost} |`);
        lines.push('');
      }
      if (data.usage.by_day && data.usage.by_day.length) {
        lines.push(`### ${L.kByDay}`);
        lines.push('');
        lines.push(`| ${L.kDate} | ${L.kCalls} | ${L.kTokens} | ${L.kCost} |`);
        lines.push('| --- | --- | --- | --- |');
        for (const r of data.usage.by_day) lines.push(`| ${r.date} | ${r.calls} | ${r.tokens} | $${r.cost} |`);
        lines.push('');
      }
    }
  }

  // 三、客户端统计
  if (on('client') && data.usage && !data.usage.error) {
    lines.push(`## ${L.secClient}`);
    lines.push('');
    if (data.usage.by_ip && data.usage.by_ip.length) {
      lines.push(`### ${L.kByIp}`);
      lines.push('');
      lines.push(`| ${L.kIp} | ${L.kCalls} | ${L.kTokens} | ${L.kCost} | ${L.kLastSeen} |`);
      lines.push('| --- | --- | --- | --- | --- |');
      for (const r of data.usage.by_ip) lines.push(`| ${mdCell(r.ip)} | ${r.calls} | ${r.tokens} | $${r.cost} | ${r.last ? tsFmt(r.last * 1000) : '—'} |`);
      lines.push('');
    }
    if (data.usage.by_token && data.usage.by_token.length) {
      lines.push(`### ${L.kByToken}`);
      lines.push('');
      lines.push(`| ${L.kUser} | ${L.kCalls} | ${L.kTokens} | ${L.kCost} |`);
      lines.push('| --- | --- | --- | --- |');
      for (const r of data.usage.by_token) lines.push(`| ${mdCell(r.token)} | ${r.calls} | ${r.tokens} | $${r.cost} |`);
      lines.push('');
    }
  }

  // 四、最近问题
  if (on('issues')) {
    lines.push(`## ${L.secIssues}`);
    lines.push('');
    const errItems = [];
    if (data.errors && !data.errors.error) {
      if (data.errors.byContainer && data.errors.byContainer.length) {
        lines.push(`### ${L.kErrLogs}`);
        lines.push('');
        lines.push(`| ${L.kContainer} | ${L.kErrCount} |`);
        lines.push('| --- | --- |');
        for (const [name, cnt] of data.errors.byContainer) lines.push(`| ${mdCell(name)} | ${cnt} |`);
        lines.push('');
        if (data.errors.samples && data.errors.samples.length) {
          lines.push(`### ${L.kErrSample}`);
          lines.push('');
          lines.push('```');
          for (const s of data.errors.samples) lines.push(`[${tsFmt(s.ts)}] ${s.container}: ${s.line}`);
          lines.push('```');
          lines.push('');
        }
      } else {
        lines.push(`- ${L.kNoErr}`);
        lines.push('');
      }
    }
    // 可用性失败项
    const av = data.availability;
    if (av && av.results) {
      const fails = av.results.filter(r => r.status !== 'ok');
      if (fails.length) {
        lines.push(`### ${L.kAvailFail}`);
        lines.push('');
        for (const f of fails) lines.push(`- ❌ ${f.name}：${mdCell(f.detail || '')}`);
        lines.push('');
      }
    }
    // 停止的容器
    if (data.system && !data.system.error && data.system.stopped && data.system.stopped.length) {
      lines.push(`### ${L.kStopped}`);
      lines.push('');
      lines.push(`- ${data.system.stopped.map(mdCell).join('、')}`);
      lines.push('');
    }
  }

  // 五、可用性测试
  if (on('avail') && data.availability && data.availability.summary) {
    const s = data.availability.summary;
    lines.push(`## ${L.secAvail}`);
    lines.push('');
    lines.push(`| ${L.kTotal} | ${L.kPass} | ${L.kFail} |`);
    lines.push('| --- | --- | --- |');
    lines.push(`| ${s.total} | ${s.ok ?? 0} | ${s.fail ?? 0} |`);
    lines.push('');
  }

  // 六、备份状态
  if (on('backup') && data.backup) {
    lines.push(`## ${L.secBackup}`);
    lines.push('');
    if (data.backup.error) {
      lines.push(`- ${L.errLabel}：${data.backup.error}`);
    } else {
      lines.push(`- ${L.kBackupLatest}：${data.backup.latest ? mdCell(data.backup.latest.name) + '（' + tsFmt(data.backup.latest.mtime) + '）' : L.kBackupNo}`);
      lines.push(`- ${L.kBackupCount}：${data.backup.count}`);
      if (data.backup.list && data.backup.list.length) {
        lines.push(`- ${L.kBackupList}：${data.backup.list.map(mdCell).join('、')}`);
      }
    }
    lines.push('');
  }

  // 七、PII 脱敏
  if (on('pii') && data.pii) {
    lines.push(`## ${L.secPii}`);
    lines.push('');
    if (data.pii.error) {
      lines.push(`- ${L.errLabel}：${data.pii.error}`);
    } else {
      lines.push(`| ${L.kPresidio} | ${L.kStatus} |`);
      lines.push('| --- | --- |');
      lines.push(`| ${L.kAnalyzer} | ${data.pii.analyzer ? '✅ ' + L.kUp : '❌ ' + L.kDown} |`);
      lines.push(`| ${L.kAnonymizer} | ${data.pii.anonymizer ? '✅ ' + L.kUp : '❌ ' + L.kDown} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`_${L.footer}_`);
  lines.push('');
  return lines.join('\n');
}

// ═══════════════════════════════════════════
// 报告设置（保留策略）— 存 JSON 到 REPORT_DIR
// ═══════════════════════════════════════════
const REPORT_SETTINGS_FILE = path.join(REPORT_DIR, 'settings.json');
const DEFAULT_REPORT_SETTINGS = { retentionMode: 'count', retentionValue: 20 }; // count=按份数, days=按天数

function ensureReportDir() {
  try { if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true }); } catch (e) {}
}
function getReportSettings() {
  ensureReportDir();
  try {
    const s = JSON.parse(fs.readFileSync(REPORT_SETTINGS_FILE, 'utf8'));
    const v = parseInt(s.retentionValue, 10);
    return {
      retentionMode: s.retentionMode === 'days' ? 'days' : 'count',
      retentionValue: Number.isFinite(v) ? Math.min(Math.max(v, 1), 3650) : 20,
    };
  } catch (e) { return { ...DEFAULT_REPORT_SETTINGS }; }
}
function saveReportSettings(s) {
  ensureReportDir();
  const v = parseInt(s && s.retentionValue, 10);
  const next = {
    retentionMode: (s && s.retentionMode === 'days') ? 'days' : 'count',
    retentionValue: Number.isFinite(v) ? Math.min(Math.max(v, 1), 3650) : 20,
  };
  fs.writeFileSync(REPORT_SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
// 按保留策略清理旧报告，返回删除数量
function cleanupReports() {
  ensureReportDir();
  const s = getReportSettings();
  try {
    const files = fs.readdirSync(REPORT_DIR)
      .filter(n => n.endsWith('.md'))
      .map(n => ({ name: n, mtime: fs.statSync(path.join(REPORT_DIR, n)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    const toDelete = (s.retentionMode === 'days')
      ? files.filter(f => f.mtime < Date.now() - s.retentionValue * 86400 * 1000)
      : files.slice(s.retentionValue);
    for (const f of toDelete) { try { fs.unlinkSync(path.join(REPORT_DIR, f.name)); } catch (e) {} }
    return toDelete.length;
  } catch (e) { return 0; }
}

// 生成报告（数据 + markdown，保存到历史）
app.get('/api/report', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365);
    const lang = (req.query.lang || 'zh').slice(0, 8).replace(/[^a-zA-Z-]/g, '');
    const sections = new Set(((req.query.sections || '') || '').split(',').filter(Boolean));
    const data = await collectReport(days);
    const markdown = renderReportMarkdown(data, lang, sections);
    const ts = new Date(data.generatedAt);
    const p = n => String(n).padStart(2, '0');
    const filename = `AI-platform-report-${ts.getFullYear()}${p(ts.getMonth() + 1)}${p(ts.getDate())}-${p(ts.getHours())}${p(ts.getMinutes())}${p(ts.getSeconds())}.md`;
    ensureReportDir();
    fs.writeFileSync(path.join(REPORT_DIR, filename), '\ufeff' + markdown, 'utf8');
    const removed = cleanupReports();
    res.json({ markdown, generatedAt: data.generatedAt, days, lang, filename, saved: true, removed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 历史报告列表 + 当前保留设置
app.get('/api/report/list', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  try {
    ensureReportDir();
    const items = fs.readdirSync(REPORT_DIR)
      .filter(n => n.endsWith('.md'))
      .map(n => { const st = fs.statSync(path.join(REPORT_DIR, n)); return { name: n, size: st.size, mtime: st.mtimeMs }; })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ items, settings: getReportSettings() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 读取保留设置
app.get('/api/report/settings', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  res.json(getReportSettings());
});

// 更新保留设置
app.post('/api/report/settings', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  try {
    const settings = saveReportSettings(req.body || {});
    const removed = cleanupReports();
    res.json({ settings, removed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 查看单个历史报告内容
app.get('/api/report/file/:name', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  try {
    const name = path.basename(req.params.name);
    if (!name.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const p = path.join(REPORT_DIR, name);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
    res.json({ name, markdown: fs.readFileSync(p, 'utf8').replace(/^\ufeff/, '') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 下载单个历史报告
app.get('/api/report/file/:name/download', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  try {
    const name = path.basename(req.params.name);
    if (!name.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const p = path.join(REPORT_DIR, name);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
    res.sendFile(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 删除单个历史报告
app.delete('/api/report/file/:name', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  try {
    const name = path.basename(req.params.name);
    if (!name.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const p = path.join(REPORT_DIR, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 告警通知（Alertmanager webhook 接收 + 最近告警查询）
// ═══════════════════════════════════════════
const recentAlerts = [];
app.post('/api/alert-webhook', (req, res) => {
  try {
    const alerts = (req.body && req.body.alerts) || [];
    for (const a of alerts) {
      recentAlerts.unshift({
        status: a.status || 'firing',
        alertname: (a.labels && a.labels.alertname) || 'unknown',
        summary: (a.annotations && a.annotations.summary) || '',
        description: (a.annotations && a.annotations.description) || '',
        startsAt: a.startsAt || null,
        receivedAt: new Date().toISOString(),
      });
      console.log(`[alert] ${a.status || 'firing'}: ${(a.labels && a.labels.alertname) || 'unknown'} - ${(a.annotations && a.annotations.summary) || ''}`);
    }
    if (recentAlerts.length > 200) recentAlerts.length = 200;
    res.json({ ok: true, received: alerts.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 最近告警（AI Admin 监控页展示）
app.get('/api/alerts', keycloak.protect(), (req, res) => {
  res.json({ alerts: recentAlerts });
});

// ═══════════════════════════════════════════
// Ghost 免登录：密码登录 + 本地算 TOTP 验证码，把已验证会话 cookie 写进浏览器
// ═══════════════════════════════════════════
app.post('/api/ghost/auto-login', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    // 1. 读 admin_session_secret + userId
    const { stdout: authOut, stderr: authErr } = await dockerExec(GHOST_CONTAINER, ['node', '-e', GHOST_AUTH_SCRIPT(GHOST_ADMIN_EMAIL)]);
    let authInfo;
    try { authInfo = JSON.parse((authOut.match(/\{.*\}/s) || ['{}'])[0]); }
    catch (e) { throw new Error('解析 Ghost 鉴权信息失败: ' + (authErr || authOut).slice(0, 200)); }
    const secret = authInfo.secret, userId = authInfo.userId;
    if (!secret) throw new Error('未读取到 admin_session_secret');

    // 2. 密码登录 → 触发新设备 2FA（403）并返回未验证的会话 cookie
    const loginRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/session/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: GHOST_ADMIN_EMAIL, password: ADMIN_PASS }),
    });
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const cm = setCookie.match(/ghost-admin-api-session=([^;]+)/);
    if (!cm) throw new Error('密码登录未返回会话 cookie（HTTP ' + loginRes.status + '，可能是密码错误或发信失败）');
    const sessionCookie = cm[1];

    // 3. 本地算 6 位验证码（TOTP，与 Ghost 邮件里的一致）
    const code = ghostTotp(secret, userId);

    // 4. 用验证码 verify，会话转正
    const verifyRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/session/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': `ghost-admin-api-session=${sessionCookie}` },
      body: JSON.stringify({ token: code }),
    });
    if (verifyRes.status !== 200) {
      let detail = '';
      try { detail = (await verifyRes.json()).errors?.[0]?.message || ''; } catch (e) {}
      throw new Error('验证码校验失败（HTTP ' + verifyRes.status + '）' + (detail ? '：' + detail : ''));
    }

    // 5. 把会话 cookie 写进浏览器（同 host 不同端口 cookie 按域名共享；Path=/ghost）
    res.setHeader('Set-Cookie', `ghost-admin-api-session=${sessionCookie}; Path=/ghost; Max-Age=15552000; HttpOnly; SameSite=Lax`);
    res.json({ ok: true, url: `${GHOST_EXTERNAL_URL}/ghost/` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════
// Serve static frontend
// ═══════════════════════════════════════════
// 只放行静态资源，不放行 index.html —— 首页必须登录（否则未登录时直接渲染空看板、接口全 401）
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// 首页 → Keycloak protect
app.get('/', keycloak.protect(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// All other frontend routes → Keycloak protect + serve index
app.get('*', keycloak.protect(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════
app.listen(PORT, async () => {
  console.log(`[server] AI Admin Center running on port ${PORT}`);
  console.log(`[server] Keycloak: ${KC_URL}/realms/${KC_REALM}`);
  await ensureGlobalAdmin();
  startAvailabilityScheduler();
});
