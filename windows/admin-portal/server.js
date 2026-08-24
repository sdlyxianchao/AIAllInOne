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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || '';
// 服务器对外地址（浏览器访问用）：IP 或域名，不含端口、不含尾斜杠。
// 所有产品入口 URL 都由它派生，将来换成域名（如 https://ai.example.com）只需改 SERVER_PUBLIC_URL 一处。
const SERVER_PUBLIC_URL = (process.env.SERVER_PUBLIC_URL || 'http://192.168.31.117').replace(/\/+$/, '');
const extUrl = (port) => port ? `${SERVER_PUBLIC_URL}:${port}` : SERVER_PUBLIC_URL;
const LITELLM_URL = process.env.LITELLM_URL || extUrl(4001);
const NEWAPI_URL = process.env.NEWAPI_URL || 'http://new-api:3000';
const NEWAPI_ADMIN_USER = process.env.NEWAPI_ADMIN_USERNAME || ADMIN_USER;
const NEWAPI_ADMIN_PASS = process.env.NEWAPI_ADMIN_PASSWORD || ADMIN_PASS;
const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://mcp-gateway:3100';
const MCP_ADMIN_TOKEN = process.env.MCP_ADMIN_TOKEN || '';
// 企业 IM 告警转发（钉钉/企微/飞书）：填机器人 webhook 地址后启用；不填则仅在 AI Admin 内展示
const ALERT_IM_WEBHOOK_URL = (process.env.ALERT_IM_WEBHOOK_URL || '').trim();
const ALERT_IM_TYPE = (process.env.ALERT_IM_TYPE || '').trim().toLowerCase(); // dingtalk | wecom | feishu（留空自动按 URL 识别）
const GITEA_URL = process.env.GITEA_URL || 'http://gitea:3000';
const GITEA_ADMIN_USER = process.env.GITEA_ADMIN_USERNAME || ADMIN_USER;
const GITEA_ADMIN_PASS = process.env.GITEA_ADMIN_PASSWORD || ADMIN_PASS;
const DIFY_URL = process.env.DIFY_URL || SERVER_PUBLIC_URL;
const DIFY_ADMIN_EMAIL = process.env.DIFY_ADMIN_EMAIL || ADMIN_EMAIL;
const DIFY_ADMIN_PASS = process.env.DIFY_ADMIN_PASSWORD || ADMIN_PASS;
const DIFY_KNOWLEDGE_API_KEY = process.env.DIFY_KNOWLEDGE_API_KEY || '';
const DIFY_DEFAULT_DATASET_ID = process.env.DIFY_DEFAULT_DATASET_ID || '';
const GHOST_CONTAINER = process.env.GHOST_CONTAINER || 'ghost';
const GHOST_INTERNAL_URL = process.env.GHOST_INTERNAL_URL || 'http://ghost:2368';
const GHOST_EXTERNAL_URL = process.env.GHOST_EXTERNAL_URL || extUrl(8090);
const GHOST_ADMIN_EMAIL = process.env.GHOST_ADMIN_EMAIL || 'admin@example.com';
const LITELLM_INTERNAL_URL = process.env.LITELLM_INTERNAL_URL || 'http://litellm:4000';
const UPDATE_CONTAINER = process.env.UPDATE_CONTAINER || 'update-server';
const REDIS_URL = process.env.REDIS_URL || 'redis://admin-session-redis:6379';
const NEWAPI_DB_CONTAINER = process.env.NEWAPI_DB_CONTAINER || 'new-api-db';
const NEWAPI_DB_PASSWORD = process.env.NEWAPI_DB_PASSWORD || 'CHANGE_ME_NEWAPI_DB_PASSWORD';
const GRAFANA_URL = process.env.GRAFANA_URL || extUrl(3030);
const LANGFUSE_URL = process.env.LANGFUSE_URL || extUrl(3010);
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
// 管理员权限模型：产品目录 + 分模块授权
// ═══════════════════════════════════════════
// 全局管理员：ai-platform-admin（realm role），可管理所有模块 + 管理员管理。
// 分模块管理员：admin:<key>（realm role，SSO 原生，令牌 realm_access.roles 可读），
//   仅管理被授权的模块。授权即添加/移除对应 Keycloak realm 角色。
const ADMIN_CATEGORIES = [
  { key: 'apps', labelKey: 'group_apps' },
  { key: 'ai',   labelKey: 'group_ai'   },
  { key: 'ops',  labelKey: 'group_ops'  },
];
const ADMIN_PRODUCTS = [
  // 产品应用
  { key: 'ghost',         labelKey: 'ghost',         category: 'apps', sso: false },
  { key: 'dify',          labelKey: 'dify',          category: 'apps', sso: false },
  { key: 'gitea',         labelKey: 'gitea',         category: 'apps', sso: true  },
  { key: 'newapi',        labelKey: 'newapi',        category: 'apps', sso: true  },
  { key: 'keycloak',      labelKey: 'keycloak',      category: 'apps', sso: true  },
  // AI 网关与集成
  { key: 'mcp-gateway',   labelKey: 'mcp',           category: 'ai',   sso: false },
  { key: 'litellm',       labelKey: 'litellm',       category: 'ai',   sso: true  },
  { key: 'update-server', labelKey: 'update',        category: 'ai',   sso: false },
  // 系统运维
  { key: 'availability',  labelKey: 'availability',  category: 'ops',  sso: false },
  { key: 'monitoring',    labelKey: 'monitoring',    category: 'ops',  sso: true  },
  { key: 'observability', labelKey: 'observability', category: 'ops',  sso: true  },
  { key: 'pii',           labelKey: 'pii',           category: 'ops',  sso: false },
  { key: 'logs',          labelKey: 'logs',          category: 'ops',  sso: false },
  { key: 'backup',        labelKey: 'backup',        category: 'ops',  sso: false },
  { key: 'report',        labelKey: 'report',        category: 'ops',  sso: false },
];
const GLOBAL_ADMIN_ROLE = 'ai-platform-admin';
const productRole = (key) => `admin:${key}`;
const isProductKey = (key) => ADMIN_PRODUCTS.some(p => p.key === key);

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
// 管理员守卫：AI Admin 仅允许「全局管理员」或「分模块管理员」访问业务接口。
// 普通登录用户（非管理员）只能访问 /api/me、/api/urls（供前端判断并展示「非管理员」提示）。
// ═══════════════════════════════════════════
app.use((req, res, next) => {
  const p = req.path;
  if (!p.startsWith('/api/')) return next();                       // 静态资源等不受影响
  if (p === '/api/me' || p === '/api/urls') return next();         // 前端判断/基础 UI 用
  if (p === '/api/alert-webhook') return next();                   // 外部告警回调（无认证）
  if (!req.kauth || !req.kauth.grant) return next();               // 未登录 → 交给后续 protect 重定向登录
  const roles = userRoles(req);
  const isAdmin = roles.includes(GLOBAL_ADMIN_ROLE) || roles.some(r => r.startsWith('admin:'));
  if (isAdmin) return next();
  return res.status(403).json({ error: '你不是平台管理员', message: '该账号没有管理员权限，无权访问此系统' });
});

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

// 产品目录（供前端渲染授权选择器；全局管理员可见）
app.get('/api/admin-products', keycloak.protect('realm:ai-platform-admin'), (req, res) => {
  res.json({ categories: ADMIN_CATEGORIES, products: ADMIN_PRODUCTS, globalRole: GLOBAL_ADMIN_ROLE });
});

// 管理员列表：全局管理员 + 分模块管理员（含各自授权的产品）
app.get('/api/admins', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const users = await kc.users.find({ realm: KC_REALM, max: 500 });
    const admins = [];
    for (const u of users) {
      try {
        const roles = await kc.users.listRealmRoleMappings({ id: u.id, realm: KC_REALM });
        const names = roles.map(r => r.name);
        const global = names.includes(GLOBAL_ADMIN_ROLE);
        const products = ADMIN_PRODUCTS.filter(p => names.includes(productRole(p.key))).map(p => p.key);
        if (global || products.length > 0) {
          const creds = await getProductCreds(u.id); // 有本地账号临时密码的产品
          admins.push({
            id: u.id,
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            enabled: u.enabled,
            createdTimestamp: u.createdTimestamp,
            global,
            products,
            credProducts: Object.keys(creds),
          });
        }
      } catch (e) { /* skip users we can't read roles for */ }
    }
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Keycloak API error', message: err.message });
  }
});

// 搜索 IdP 用户（供「搜索添加」使用；只返回已有账号，不新建、不涉密码）
app.get('/api/admins/search', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const kc = await getKcAdmin();
    const users = await kc.users.find({ realm: KC_REALM, search: q, max: 50 });
    const out = users
      .filter(u => u.username && u.username !== 'krbtgt')
      .map(u => ({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, enabled: u.enabled }))
      .slice(0, 20);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Keycloak API error', message: err.message });
  }
});

// 查看某管理员的本地账号临时密码（仅全局管理员；按产品 key 返回 { product: password }）
app.get('/api/admins/:id/credentials', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const uid = req.params.id;
    const creds = await getProductCreds(uid);
    res.json(creds);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 当前登录用户的 Keycloak sub（用于防止管理员操作自己）
function currentUserId(req) {
  try {
    return (req.kauth && req.kauth.grant && req.kauth.grant.access_token &&
      req.kauth.grant.access_token.content && req.kauth.grant.access_token.content.sub) || '';
  } catch (e) { return ''; }
}

// 读取当前登录用户的 realm roles（来自访问令牌 realm_access.roles）
function userRoles(req) {
  try {
    const c = (req.kauth && req.kauth.grant && req.kauth.grant.access_token && req.kauth.grant.access_token.content) || {};
    return (c.realm_access && c.realm_access.roles) || [];
  } catch (e) { return []; }
}

function isGlobalAdmin(req) {
  return userRoles(req).includes(GLOBAL_ADMIN_ROLE);
}

// 分模块访问控制：全局管理员放行；分模块管理员需拥有对应 admin:<key> 角色。
// 用法：app.get('/api/xxx', keycloak.protect(), protectAdmin('xxx'), handler)
function protectAdmin(productKey) {
  return (req, res, next) => {
    const roles = userRoles(req);
    if (roles.includes(GLOBAL_ADMIN_ROLE)) return next();
    if (productKey && roles.includes(productRole(productKey))) return next();
    return res.status(403).json({ error: '无权限访问此模块', message: '需要全局管理员或该模块的管理员权限' });
  };
}

// 确保各产品 admin:<key> 角色存在（幂等，启动时调用）
async function ensureProductRoles() {
  try {
    const kc = await getKcAdmin();
    for (const p of ADMIN_PRODUCTS) {
      const name = productRole(p.key);
      const existing = await kc.roles.findOneByName({ name, realm: KC_REALM });
      if (!existing) {
        await kc.roles.create({ name, realm: KC_REALM });
        console.log(`[init] Created product role: ${name}`);
      }
    }
  } catch (err) {
    console.warn('[init] Could not ensure product roles (Keycloak may not be ready):', err.message);
  }
}

// 给用户授予某产品管理权（添加 admin:<key> realm 角色）
async function grantProduct(kc, uid, productKey) {
  const name = productRole(productKey);
  const role = await kc.roles.findOneByName({ name, realm: KC_REALM });
  if (!role) throw new Error(`角色不存在：${name}`);
  await kc.users.addRealmRoleMappings({ id: uid, realm: KC_REALM, roles: [{ id: role.id, name }] });
}

// 撤销用户某产品管理权（移除 admin:<key> realm 角色）
async function revokeProduct(kc, uid, productKey) {
  const name = productRole(productKey);
  const role = await kc.roles.findOneByName({ name, realm: KC_REALM });
  if (!role) return;
  await kc.users.delRealmRoleMappings({ id: uid, realm: KC_REALM, roles: [{ id: role.id, name }] });
}

// 添加分模块管理员：从 IdP 已有用户中选择，授予若干产品管理权（添加 admin:<key> 角色）
app.post('/api/admins', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const userId = (req.body && req.body.userId || '').trim();
    const products = Array.isArray(req.body && req.body.products) ? req.body.products.map(s => String(s).trim()).filter(Boolean) : [];
    if (!userId) return res.status(400).json({ error: '请选择用户' });
    if (!products.length) return res.status(400).json({ error: '请至少选择一个模块' });
    for (const k of products) if (!isProductKey(k)) return res.status(400).json({ error: `未知模块：${k}` });
    if (userId === currentUserId(req)) return res.status(400).json({ error: '不能操作自己的账号' });
    const kc = await getKcAdmin();
    const u = await kc.users.findOne({ id: userId, realm: KC_REALM });
    if (!u) return res.status(404).json({ error: '用户不存在（请从 IdP 用户中搜索添加）' });
    const existingRoles = await kc.users.listRealmRoleMappings({ id: userId, realm: KC_REALM });
    if (existingRoles.some(r => r.name === GLOBAL_ADMIN_ROLE)) {
      return res.status(400).json({ error: '该用户是全局管理员，无需分模块授权' });
    }
    for (const k of products) await grantProduct(kc, userId, k);
    // 真正开到各产品：SSO 优先，API 兜底（逐个独立，失败不阻塞）
    const provisioning = [];
    for (const k of products) provisioning.push(await provisionProduct(k, { id: userId, username: u.username, email: u.email }));
    res.json({ ok: true, username: u.username, products, provisioning });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 给某管理员追加一个产品授权
app.post('/api/admins/:id/products', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const uid = req.params.id;
    const product = (req.body && req.body.product || '').trim();
    if (!product) return res.status(400).json({ error: '请指定模块' });
    if (!isProductKey(product)) return res.status(400).json({ error: `未知模块：${product}` });
    if (uid === currentUserId(req)) return res.status(400).json({ error: '不能操作自己的账号' });
    const kc = await getKcAdmin();
    const u = await kc.users.findOne({ id: uid, realm: KC_REALM });
    if (!u) return res.status(404).json({ error: '用户不存在' });
    await grantProduct(kc, uid, product);
    const provisioning = await provisionProduct(product, { id: uid, username: u.username, email: u.email });
    res.json({ ok: true, username: u.username, product, provisioning });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 撤销某管理员的单个产品授权
app.delete('/api/admins/:id/products/:product', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const uid = req.params.id;
    const product = req.params.product;
    if (!isProductKey(product)) return res.status(400).json({ error: `未知模块：${product}` });
    if (uid === currentUserId(req)) return res.status(400).json({ error: '不能操作自己的账号' });
    const kc = await getKcAdmin();
    await revokeProduct(kc, uid, product);
    const u = await kc.users.findOne({ id: uid, realm: KC_REALM });
    const deprovisioning = await deprovisionProduct(product, { id: uid, username: u && u.username, email: u && u.email });
    res.json({ ok: true, product, deprovisioning });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 删除管理员账号：移除其所有产品授权关系（admin:<key> 角色），不影响 Keycloak 账号本身
app.delete('/api/admins/:id', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const uid = req.params.id;
    if (uid === currentUserId(req)) return res.status(400).json({ error: '不能删除自己的账号' });
    const kc = await getKcAdmin();
    const u = await kc.users.findOne({ id: uid, realm: KC_REALM });
    if (!u) return res.status(404).json({ error: '用户不存在' });
    const existingRoles = await kc.users.listRealmRoleMappings({ id: uid, realm: KC_REALM });
    if (existingRoles.some(r => r.name === GLOBAL_ADMIN_ROLE)) {
      return res.status(400).json({ error: '不能删除全局管理员' });
    }
    const toRemove = existingRoles.filter(r => r.name.startsWith('admin:'));
    const removedKeys = toRemove.map(r => r.name.slice('admin:'.length));
    if (toRemove.length) {
      await kc.users.delRealmRoleMappings({ id: uid, realm: KC_REALM, roles: toRemove.map(r => ({ id: r.id, name: r.name })) });
    }
    // 撤销各产品的管理员权限（删除产品账号）
    const deprovisioning = [];
    for (const k of removedKeys) deprovisioning.push(await deprovisionProduct(k, { id: uid, username: u.username, email: u.email }));
    await delProductCreds(uid); // 清理该用户所有记录的临时密码
    res.json({ ok: true, username: u.username, removed: toRemove.length, deprovisioning });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 产品侧账号开通 / 撤销（SSO 优先，API 兜底）
// ═══════════════════════════════════════════
// 目的：把「管理员管理」的分模块授权真正开到各产品里，而不只是门户 Keycloak 角色。
//  - 有 SSO 的产品：用户已在 Keycloak，产品端登录时自动建号；这里用产品 API/DB 把角色设为管理员。
//  - 无 SSO 的产品：用产品 API 建号（临时密码）并设为管理员，临时密码随结果返回给操作者。
//  - 删除 = 从产品中删除该账号：SSO 产品撤销授权（移出产品）、直接授权产品删除账号。
//  - 内部功能（mcp-gateway/update-server/availability/pii/logs/backup/report）无独立产品账号，
//    Keycloak 的 admin:<key> 角色本身就是权限 → 返回 skipped。
const GRAFANA_INTERNAL_URL = process.env.GRAFANA_INTERNAL_URL || 'http://grafana:3000';
const GRAFANA_ADMIN_USER = process.env.GRAFANA_ADMIN_USER || ADMIN_USER;
const GRAFANA_ADMIN_PASS = process.env.GRAFANA_ADMIN_PASSWORD || ADMIN_PASS;
const GHOST_ADMIN_ROLE_ID = '6a7b481a3a1f3a0001fdbc59'; // Administrator（Ghost 固定 ObjectId）
// Langfuse（可观测）：OSS 版无组织级 API key，成员角色靠直接写 Postgres（同 NewAPI 的 DB 提权思路）
const LANGFUSE_DB_CONTAINER = process.env.LANGFUSE_DB_CONTAINER || 'langfuse-postgres';
const LANGFUSE_ORG_ID = process.env.LANGFUSE_ORG_ID || 'ai-all-in-one';

// Langfuse Postgres 查询（psql 走容器内 trust 认证，无需密码）
async function langfuseDbQuery(sql) {
  const { stdout, stderr } = await dockerExec(LANGFUSE_DB_CONTAINER, ['psql', '-U', 'langfuse', '-d', 'langfuse', '-t', '-A', '-c', sql]);
  if (stderr && stderr.trim() && !/NOTICE|WARNING/i.test(stderr)) throw new Error(stderr.trim());
  const rows = [];
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    rows.push(line.split('|'));
  }
  return rows;
}
// cuid 风格唯一 ID（Langfuse Prisma text 主键，任意唯一串即可）
function cuidLike() {
  return 'cm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
}

function genTempPassword() {
  return 'Ai' + Math.random().toString(36).slice(2, 8) + '!' + Math.floor(Math.random() * 90 + 10);
}
function cleanLogin(username) {
  const s = String(username || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 39);
  return s || ('u' + Math.random().toString(36).slice(2, 10));
}

// Gitea 请求（Basic auth）
async function giteaReq(method, path, body) {
  const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
  const opts = { method, headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(`${GITEA_URL}${path}`, opts);
  let data = null; try { data = await resp.json(); } catch (e) {}
  return { status: resp.status, data };
}

// NewAPI：按 email 或 username 找本地用户（SSO 用户用 email 对齐；API 建号用户 email 为空、按 username 对齐）
async function newapiFindUser(u) {
  const email = (u && u.email) || '';
  const login = (u && u.username) ? cleanLogin(u.username) : '';
  let rows = [];
  if (email) rows = await newapiDbQuery(`SELECT id, username FROM users WHERE email='${String(email).replace(/'/g, "''")}' LIMIT 1`);
  if (!rows.length && login) rows = await newapiDbQuery(`SELECT id, username FROM users WHERE username='${login.replace(/'/g, "''")}' LIMIT 1`);
  return rows.length ? { id: +rows[0][0], username: rows[0][1] } : null;
}

// Dify 请求（复用 difyLogin 的 cookie + CSRF，支持 POST/PATCH/DELETE）
async function difyReq(method, path, body) {
  const { token, csrf, refreshToken } = await difyLogin();
  const cookie = `access_token=${token}; csrf_token=${csrf}` + (refreshToken ? `; refresh_token=${refreshToken}` : '');
  const opts = { method, headers: { 'Cookie': cookie, 'X-CSRF-Token': csrf } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const resp = await fetch(`${DIFY_URL}${path}`, opts);
  let data = null; try { data = await resp.json(); } catch (e) {}
  return { status: resp.status, data };
}

// Ghost 已验证会话 cookie（密码登录 + 本地算 TOTP，复用 /api/ghost/auto-login 的流程）
// 会话有频率限制（登录端点 429），故缓存复用，避免连续操作时被限流。
let ghostSessionCache = { cookie: '', exp: 0 };
async function ghostSession() {
  if (ghostSessionCache.cookie && Date.now() < ghostSessionCache.exp) return ghostSessionCache.cookie;
  const { stdout } = await dockerExec(GHOST_CONTAINER, ['node', '-e', GHOST_AUTH_SCRIPT(GHOST_ADMIN_EMAIL)]);
  const authInfo = JSON.parse((stdout.match(/\{.*\}/s) || ['{}'])[0]);
  if (!authInfo.secret) throw new Error('未读取到 Ghost admin_session_secret');
  const loginRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/session/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: GHOST_ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const cm = (loginRes.headers.get('set-cookie') || '').match(/ghost-admin-api-session=([^;]+)/);
  if (!cm) throw new Error('Ghost 登录失败（HTTP ' + loginRes.status + '）');
  const code = ghostTotp(authInfo.secret, authInfo.userId);
  const verifyRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/session/verify`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Cookie': `ghost-admin-api-session=${cm[1]}` },
    body: JSON.stringify({ token: code }),
  });
  if (verifyRes.status !== 200) throw new Error('Ghost 会话验证失败（HTTP ' + verifyRes.status + '）');
  ghostSessionCache = { cookie: cm[1], exp: Date.now() + 24 * 60 * 60 * 1000 }; // 缓存 24 小时
  return cm[1];
}

const PRODUCT_PROVISIONERS = {
  // ---- Gitea（Keycloak OIDC SSO；预建号仅为立即授管理员，随机密码占位、不对外暴露）----
  gitea: {
    async provision(u) {
      const login = cleanLogin(u.username);
      const email = u.email || `${login}@company.com`;
      let r = await giteaReq('GET', `/api/v1/users/${encodeURIComponent(login)}`);
      if (r.status === 404) {
        const cr = await giteaReq('POST', '/api/v1/admin/users', {
          username: login, login_name: login, email,
          password: genTempPassword(), must_change_password: false, send_notify: false,
        });
        if (cr.status !== 201 && cr.status !== 200) throw new Error('Gitea 建号失败: ' + JSON.stringify(cr.data));
      } else if (r.status !== 200) {
        throw new Error('Gitea 查询失败: HTTP ' + r.status);
      }
      const ar = await giteaReq('PATCH', `/api/v1/admin/users/${encodeURIComponent(login)}`, { login_name: login, admin: true });
      if (ar.status !== 200) throw new Error('Gitea 设管理员失败: ' + JSON.stringify(ar.data));
      return { method: 'sso', detail: '已确保账号存在并设为管理员（用 Keycloak SSO 登录，无需密码）' };
    },
    async deprovision(u) {
      const login = cleanLogin(u.username);
      const r = await giteaReq('DELETE', `/api/v1/admin/users/${encodeURIComponent(login)}`);
      if (r.status === 404) return { detail: '账号不存在，无需删除' };
      if (r.status !== 204 && r.status !== 200) throw new Error('Gitea 删除账号失败: ' + JSON.stringify(r.data));
      return { detail: '已删除 Gitea 账号' };
    },
  },

  // ---- NewAPI（SSO 建号，角色靠 DB 提权/降权）----
  newapi: {
    async provision(u) {
      let user = await newapiFindUser(u);
      if (!user) {
        const pwd = genTempPassword();
        const token = await newapiGetToken();
        const login = cleanLogin(u.username);
        const resp = await fetch(`${NEWAPI_URL}/api/user/`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: login, password: pwd, display_name: u.username, role: 10, group: 'default' }),
        });
        const data = await resp.json();
        if (!data || data.success === false) throw new Error('NewAPI 建号失败: ' + ((data && data.message) || JSON.stringify(data)));
        // NewAPI 创建 API 不存 email，回填以便后续按 email 匹配
        if (u.email) await newapiDbQuery(`UPDATE users SET email='${String(u.email).replace(/'/g, "''")}' WHERE username='${login.replace(/'/g, "''")}'`);
        return { method: 'api', detail: '已建号并设为管理员', tempPassword: pwd };
      }
      await newapiDbQuery(`UPDATE users SET role=10 WHERE id=${user.id}`);
      return { method: 'sso', detail: '账号已存在，已提升为管理员' };
    },
    async deprovision(u) {
      const user = await newapiFindUser(u);
      if (!user) return { detail: '账号不存在，无需删除' };
      const token = await newapiGetToken();
      const resp = await fetch(`${NEWAPI_URL}/api/user/${user.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await resp.json().catch(() => null);
      if (resp.status !== 200 && resp.status !== 204) throw new Error('NewAPI 删除账号失败: ' + JSON.stringify(data));
      return { detail: '已删除 NewAPI 账号' };
    },
  },

  // ---- Keycloak（本身就是 SSO：授 realm-management 客户端的 realm-admin 复合角色）----
  keycloak: {
    async _role() {
      const kc = await getKcAdmin();
      const clients = await kc.clients.find({ realm: KC_REALM, clientId: 'realm-management' });
      if (!clients || !clients.length) throw new Error('Keycloak 缺少 realm-management 客户端');
      const clientId = clients[0].id;
      const role = await kc.clients.findRole({ realm: KC_REALM, id: clientId, roleName: 'realm-admin' });
      if (!role) throw new Error('Keycloak 缺少 realm-management 的 realm-admin 角色');
      return { clientId, role };
    },
    async provision(u) {
      const { clientId, role } = await this._role();
      const kc = await getKcAdmin();
      await kc.users.addClientRoleMappings({ id: u.id, realm: KC_REALM, clientUniqueId: clientId, roles: [{ id: role.id, name: 'realm-admin' }] });
      return { method: 'sso', detail: '已授予 realm-management 的 realm-admin（Keycloak 管理）' };
    },
    async deprovision(u) {
      const { clientId, role } = await this._role();
      const kc = await getKcAdmin();
      await kc.users.delClientRoleMappings({ id: u.id, realm: KC_REALM, clientUniqueId: clientId, roles: [{ id: role.id, name: 'realm-admin' }] });
      return { detail: '已撤销 Keycloak realm-admin 授权' };
    },
  },

  // ---- Grafana（监控模块；SSO，org API 设角色；建号走 /api/admin/users）----
  monitoring: {
    async _auth() { return 'Basic ' + Buffer.from(`${GRAFANA_ADMIN_USER}:${GRAFANA_ADMIN_PASS}`).toString('base64'); },
    async _users() {
      const resp = await fetch(`${GRAFANA_INTERNAL_URL}/api/orgs/1/users`, { headers: { 'Authorization': await this._auth() } });
      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error('Grafana 查询失败: ' + JSON.stringify(data).slice(0, 200));
      return data;
    },
    async provision(u) {
      const email = (u.email || '').toLowerCase();
      if (!email) throw new Error('缺少邮箱，无法在 Grafana 定位账号');
      const auth = await this._auth();
      let users = await this._users();
      let ex = users.find(x => (x.email && x.email.toLowerCase() === email) || (x.login && x.login.toLowerCase() === email));
      if (!ex) {
        // 创建全局用户（自动加入默认 org，角色 Viewer）
        const login = cleanLogin(u.username);
        const cr = await fetch(`${GRAFANA_INTERNAL_URL}/api/admin/users`, {
          method: 'POST', headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: u.username || login, email: email, login: login, password: genTempPassword() }),
        });
        if (cr.status !== 200 && cr.status !== 201) {
          let msg = 'HTTP ' + cr.status; try { msg += ' ' + JSON.stringify(await cr.json()); } catch (e) {}
          throw new Error('Grafana 建号失败: ' + msg);
        }
        users = await this._users();
        ex = users.find(x => (x.email && x.email.toLowerCase() === email));
        if (!ex) throw new Error('Grafana 建号后未在组织中找到该用户');
      }
      if (ex.role === 'Admin') return { method: 'sso', detail: '已是管理员' };
      const r = await fetch(`${GRAFANA_INTERNAL_URL}/api/orgs/1/users/${ex.userId}`, { method: 'PATCH', headers: { 'Authorization': auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'Admin' }) });
      if (r.status !== 200) throw new Error('Grafana 设管理员失败: HTTP ' + r.status);
      return { method: 'sso', detail: '已设为管理员（SSO 登录生效）' };
    },
    async deprovision(u) {
      const email = (u.email || '').toLowerCase();
      const auth = await this._auth();
      const resp = await fetch(`${GRAFANA_INTERNAL_URL}/api/users`, { headers: { 'Authorization': auth } });
      const gusers = await resp.json();
      if (!Array.isArray(gusers)) throw new Error('Grafana 查询全局用户失败: ' + JSON.stringify(gusers).slice(0, 200));
      const gu = gusers.find(x => (x.email && x.email.toLowerCase() === email) || (x.login && x.login.toLowerCase() === email));
      if (!gu) return { detail: '账号不存在，无需删除' };
      const r = await fetch(`${GRAFANA_INTERNAL_URL}/api/admin/users/${gu.id}`, { method: 'DELETE', headers: { 'Authorization': auth } });
      if (r.status !== 200 && r.status !== 204) throw new Error('Grafana 删除账号失败: HTTP ' + r.status);
      return { detail: '已删除 Grafana 账号（撤销 SSO 授权）' };
    },
  },

  // ---- LiteLLM（SSO / master key 用户管理）----
  litellm: {
    async provision(u) {
      const email = u.email || '';
      if (!email) throw new Error('缺少邮箱，无法在 LiteLLM 定位账号');
      const info = await fetch(`${LITELLM_INTERNAL_URL}/user/info?user_id=${encodeURIComponent(email)}`, { headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}` } });
      if (info.status === 200) {
        const r = await fetch(`${LITELLM_INTERNAL_URL}/user/update`, { method: 'POST', headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: email, user_role: 'proxy_admin' }) });
        if (r.status !== 200) throw new Error('LiteLLM 设管理员失败: HTTP ' + r.status);
        return { method: 'sso', detail: '已提升为管理员' };
      }
      const r = await fetch(`${LITELLM_INTERNAL_URL}/user/new`, { method: 'POST', headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: email, user_email: email, user_role: 'proxy_admin' }) });
      const data = await r.json().catch(() => null);
      if (r.status !== 200) throw new Error('LiteLLM 建号失败: ' + JSON.stringify(data || r.status));
      return { method: 'sso', detail: '已建号并设为管理员' };
    },
    async deprovision(u) {
      const email = u.email || '';
      if (!email) return { detail: '缺少邮箱，无法定位' };
      const r = await fetch(`${LITELLM_INTERNAL_URL}/user/delete`, { method: 'POST', headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_ids: [email] }) });
      const t = await r.text().catch(() => '');
      if (r.status !== 200) throw new Error('LiteLLM 删除账号失败: HTTP ' + r.status + ' ' + t.slice(0, 120));
      return { detail: '已删除 LiteLLM 账号' };
    },
  },

  // ---- Dify（无 SSO，console 成员管理 API）----
  dify: {
    async provision(u) {
      const email = u.email || '';
      if (!email) throw new Error('缺少邮箱，无法在 Dify 定位账号');
      const list = await difyReq('GET', '/console/api/workspaces/current/members');
      const accounts = (list.data && list.data.accounts) ? list.data.accounts : [];
      const ex = accounts.find(m => (m.email || '').toLowerCase() === email.toLowerCase());
      if (ex) {
        const r = await difyReq('PUT', `/console/api/workspaces/current/members/${ex.id}/update-role`, { role: 'admin' });
        if (r.status !== 200 && r.status !== 201) throw new Error('Dify 设管理员失败: ' + JSON.stringify(r.data));
        return { method: 'api', detail: '账号已存在，已设为管理员' };
      }
      const r = await difyReq('POST', '/console/api/workspaces/current/members/invite-email', { emails: [email], role: 'admin', language: 'zh-Hans' });
      if (r.status !== 200 && r.status !== 201) throw new Error('Dify 邀请失败: ' + JSON.stringify(r.data));
      return { method: 'api', detail: '已发送管理员邀请（对方需在邮件确认）' };
    },
    async deprovision(u) {
      const email = u.email || '';
      const list = await difyReq('GET', '/console/api/workspaces/current/members');
      const accounts = (list.data && list.data.accounts) ? list.data.accounts : [];
      const ex = accounts.find(m => (m.email || '').toLowerCase() === email.toLowerCase());
      if (!ex) return { detail: '账号不存在，无需删除' };
      const r = await difyReq('DELETE', `/console/api/workspaces/current/members/${ex.id}`);
      if (r.status !== 200 && r.status !== 204) throw new Error('Dify 删除成员失败: ' + JSON.stringify(r.data));
      return { detail: '已删除 Dify 成员账号' };
    },
  },

  // ---- Ghost（无 SSO，Admin API 邀请 staff）----
  ghost: {
    async provision(u) {
      const email = u.email || '';
      if (!email) throw new Error('缺少邮箱，无法在 Ghost 定位账号');
      const session = await ghostSession();
      const usersRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/users/?limit=all`, { headers: { 'Cookie': `ghost-admin-api-session=${session}` } });
      const usersData = await usersRes.json().catch(() => null);
      const staff = (usersData && usersData.users) ? usersData.users : [];
      const ex = staff.find(s => (s.email || '').toLowerCase() === email.toLowerCase());
      if (ex) return { method: 'api', detail: '已是 Ghost staff（如需提权请在后台调整角色）' };
      const inv = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/invites/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': `ghost-admin-api-session=${session}` },
        body: JSON.stringify({ invites: [{ email, role_id: GHOST_ADMIN_ROLE_ID }] }),
      });
      if (inv.status !== 200 && inv.status !== 201) throw new Error('Ghost 邀请失败: HTTP ' + inv.status);
      return { method: 'api', detail: '已发送管理员邀请（对方需在邮箱确认）' };
    },
    async deprovision(u) {
      const email = u.email || '';
      const session = await ghostSession();
      // 1. 已接受的 staff → 删除账号
      const usersRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/users/?limit=all`, { headers: { 'Cookie': `ghost-admin-api-session=${session}` } });
      const usersData = await usersRes.json().catch(() => null);
      const staff = (usersData && usersData.users) ? usersData.users : [];
      const ex = staff.find(s => (s.email || '').toLowerCase() === email.toLowerCase());
      if (ex) {
        const r = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/users/${ex.id}/`, { method: 'DELETE', headers: { 'Cookie': `ghost-admin-api-session=${session}` } });
        if (r.status !== 200 && r.status !== 204) throw new Error('Ghost 删除账号失败: HTTP ' + r.status);
        return { detail: '已删除 Ghost staff 账号' };
      }
      // 2. 未接受的邀请 → 撤销邀请
      const invRes = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/invites/?limit=all`, { headers: { 'Cookie': `ghost-admin-api-session=${session}` } });
      const invData = await invRes.json().catch(() => null);
      const invites = (invData && invData.invites) ? invData.invites : [];
      const inv = invites.find(i => (i.email || '').toLowerCase() === email.toLowerCase());
      if (inv) {
        const r = await fetch(`${GHOST_INTERNAL_URL}/ghost/api/admin/invites/${inv.id}/`, { method: 'DELETE', headers: { 'Cookie': `ghost-admin-api-session=${session}` } });
        if (r.status !== 200 && r.status !== 204) throw new Error('Ghost 撤销邀请失败: HTTP ' + r.status);
        return { detail: '已撤销 Ghost 邀请' };
      }
      return { detail: '账号不存在，无需删除' };
    },
  },

  // ---- Langfuse（可观测模块；OSS 无组织级 API key → 直接写 Postgres 成员表）----
  observability: {
    async provision(u) {
      const email = u.email || '';
      if (!email) throw new Error('缺少邮箱，无法在 Langfuse 定位账号');
      const eq = String(email).replace(/'/g, "''");
      const users = await langfuseDbQuery(`SELECT id FROM users WHERE email='${eq}' LIMIT 1`);
      if (users.length) {
        const userId = users[0][0];
        const m = await langfuseDbQuery(`SELECT id FROM organization_memberships WHERE org_id='${LANGFUSE_ORG_ID}' AND user_id='${userId}' LIMIT 1`);
        if (m.length) {
          await langfuseDbQuery(`UPDATE organization_memberships SET role='ADMIN', updated_at=NOW() WHERE id='${m[0][0]}'`);
        } else {
          await langfuseDbQuery(`INSERT INTO organization_memberships (id, org_id, user_id, role) VALUES ('${cuidLike()}', '${LANGFUSE_ORG_ID}', '${userId}', 'ADMIN')`);
        }
        return { method: 'sso', detail: '已设为 ADMIN' };
      }
      // 用户尚未登录过 → 插入邀请，SSO 首次登录后自动授予
      await langfuseDbQuery(`INSERT INTO membership_invitations (id, email, org_id, org_role) VALUES ('${cuidLike()}', '${eq}', '${LANGFUSE_ORG_ID}', 'ADMIN') ON CONFLICT (email, org_id) DO UPDATE SET org_role='ADMIN'`);
      return { method: 'sso', detail: '已发出邀请，SSO 登录后自动授予 ADMIN' };
    },
    async deprovision(u) {
      const email = u.email || '';
      const eq = String(email).replace(/'/g, "''");
      const users = await langfuseDbQuery(`SELECT id FROM users WHERE email='${eq}' LIMIT 1`);
      if (users.length) {
        const userId = users[0][0];
        // 删除项目成员关系（org membership 删除会级联 project_memberships，这里先显式删更稳）
        await langfuseDbQuery(`DELETE FROM project_memberships WHERE user_id='${userId}'`);
        await langfuseDbQuery(`DELETE FROM organization_memberships WHERE org_id='${LANGFUSE_ORG_ID}' AND user_id='${userId}'`);
      }
      await langfuseDbQuery(`DELETE FROM membership_invitations WHERE email='${eq}' AND org_id='${LANGFUSE_ORG_ID}'`);
      return { detail: '已撤销 Langfuse 授权（移出组织）' };
    },
  },
};

// 产品本地账号临时密码存取（Redis，供管理员列表里的 🔑 图标回看）
const pcredKey = (uid, product) => `pcred:${uid}:${product}`;
async function setProductCred(uid, product, pwd) {
  try { await redisClient.set(pcredKey(uid, product), pwd); } catch (e) { console.warn('[cred] 保存失败:', e.message); }
}
async function getProductCreds(uid) {
  try {
    const prefix = `pcred:${uid}:`;
    const keys = await redisClient.keys(prefix + '*');
    const out = {};
    for (const k of keys) {
      const v = await redisClient.get(k);
      if (v) out[k.slice(prefix.length)] = v;
    }
    return out;
  } catch (e) { return {}; }
}
async function delProductCred(uid, product) {
  try { await redisClient.del(pcredKey(uid, product)); } catch (e) {}
}
async function delProductCreds(uid) {
  try {
    const keys = await redisClient.keys(`pcred:${uid}:*`);
    if (keys.length) await redisClient.del(keys);
  } catch (e) {}
}

// 统一分发：开通某产品的管理员权限
async function provisionProduct(key, u) {
  const p = PRODUCT_PROVISIONERS[key];
  if (!p) return { key, ok: true, skipped: true, detail: '门户内置模块（Keycloak 角色即权限）' };
  try {
    const r = await p.provision(u);
    if (r.tempPassword && u && u.id) await setProductCred(u.id, key, r.tempPassword); // 记录临时密码供回看
    return { key, ok: true, method: r.method, detail: r.detail, tempPassword: r.tempPassword };
  } catch (e) {
    return { key, ok: false, error: e.message };
  }
}

// 统一分发：撤销某产品的管理员权限（删除产品账号）
async function deprovisionProduct(key, u) {
  const p = PRODUCT_PROVISIONERS[key];
  if (!p) return { key, ok: true, skipped: true, detail: '门户内置模块' };
  try {
    const r = await p.deprovision(u);
    if (u && u.id) await delProductCred(u.id, key); // 账号已删，清除记录的临时密码
    return { key, ok: true, detail: r.detail };
  } catch (e) {
    return { key, ok: false, error: e.message };
  }
}

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

// LiteLLM 可用模型列表（供 LiteLLM+PII 页展示）
app.get('/api/litellm/models', keycloak.protect(), async (req, res) => {
  try {
    const r = await fetch(`${LITELLM_INTERNAL_URL}/v1/models`, { headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}` } });
    const data = await r.json();
    const models = ((data && data.data) || []).map(m => m.id);
    res.json({ models, count: models.length });
  } catch (e) {
    res.json({ models: [], count: 0, error: e.message });
  }
});

// 当前登录用户信息（左下角账号名用）
app.get('/api/me', keycloak.protect(), (req, res) => {
  const c = (req.kauth && req.kauth.grant && req.kauth.grant.access_token && req.kauth.grant.access_token.content) || {};
  const roles = userRoles(req);
  const grants = ADMIN_PRODUCTS.filter(p => roles.includes(productRole(p.key))).map(p => p.key);
  res.json({
    username: c.preferred_username || c.name || '—',
    email: c.email || '',
    name: c.name || '',
    globalAdmin: roles.includes(GLOBAL_ADMIN_ROLE),
    grants,
  });
});

// 产品入口 URL（由 SERVER_PUBLIC_URL 派生，供前端动态渲染与跳转）
app.get('/api/urls', keycloak.protect(), (req, res) => {
  res.json({
    publicUrl: SERVER_PUBLIC_URL,
    products: {
      ghost: extUrl(8090),
      dify: SERVER_PUBLIC_URL,
      gitea: extUrl(3002),
      newapi: extUrl(3000),
      litellm: extUrl(4001),
      keycloak: extUrl(9090),
      mcp: extUrl(3100),
      update: extUrl(8091),
      grafana: extUrl(3030),
      prometheus: extUrl(9091),
      alertmanager: extUrl(9093),
      langfuse: extUrl(3010),
      mailhog: extUrl(8025),
    },
  });
});

// 「打开 Gitea」：清掉浏览器里遗留的 Gitea 会话，再走 Keycloak SSO 登录（顺滑优先）。
// 说明：Gitea 会话 cookie 按域名共享（与端口无关），故可从管理中心直接清掉；
// 保留 Keycloak SSO，正常情况（未用其它账号登录过）会免密直达当前账号；
// 若之前用别的账号登过 Gitea，则可能打开成那个旧账号（前端按钮旁已加小字提示）。
app.get('/api/gitea/open', keycloak.protect(), (req, res) => {
  res.setHeader('Set-Cookie', 'i_like_gitea=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.redirect(302, `${GITEA_URL}/user/oauth2/keycloak`);
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
  // NewAPI v1.0.0-rc.24 的 access_token 只有 15 分钟有效期，缓存必须短于 15 分钟，
  // 否则 15~60 分钟之间会用过期 token 调 API 全部 401（看不到数据）。
  newapiTokenExp = Date.now() + 10 * 60 * 1000; // 10 分钟缓存（留 5 分钟余量）
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
app.get('/api/newapi/channels', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
  try { res.json(await newapiApi('/api/channel/')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/users', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
  try { res.json(await newapiApi('/api/user/?p=0&page_size=100')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/tokens', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
  try { res.json(await newapiApi('/api/token/?p=0&page_size=100')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/newapi/overview', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
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
app.get('/api/newapi/audit', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
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
app.get('/api/newapi/cost', keycloak.protect(), protectAdmin('newapi'), async (req, res) => {
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

// 取 job 原始日志文本，提取关键错误行（当失败发生在 step 之前，如镜像拉取超时）
async function giteaJobError(jobId) {
  try {
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const resp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/jobs/${jobId}/logs`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const text = await resp.text();
    const lines = text.split('\n').filter(Boolean);
    // 取最后一条含 error/timeout/failed 关键字的行，去掉时间戳前缀
    const errLine = [...lines].reverse().find(l => /error|timeout|failed|denied|not found|cannot|unable/i.test(l));
    if (!errLine) return null;
    const cleaned = errLine.replace(/^\S+Z?\s+/, '').trim();
    return cleaned.length > 160 ? cleaned.slice(0, 160) + '…' : cleaned;
  } catch (e) { return null; }
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
    // dsh-sync 仓库最近一次 workflow 执行时间
    let sync_last_run = null;
    try {
      const runs = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/runs?limit=1`);
      const run = (runs.data && runs.data.workflow_runs && runs.data.workflow_runs[0]) || null;
      if (run) {
        let failure_reason = null;
        if (run.conclusion === 'failure' && run.id) {
          try {
            const jobs = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/runs/${run.id}/jobs`);
            const jobList = (jobs.data && jobs.data.jobs) || [];
            const failedJob = jobList.find(j => j.conclusion === 'failure');
            if (failedJob) {
              const failedStep = (failedJob.steps || []).find(s => s.conclusion === 'failure');
              // 优先从日志提取真实错误原因，再退回「job → step」
              failure_reason = await giteaJobError(failedJob.id)
                || (failedStep ? `${failedJob.name} → ${failedStep.name}` : failedJob.name);
            }
          } catch (e) { failure_reason = null; }
        }
        // Gitea 对进行中的 run 返回 completed_at='1970-01-01T00:00:00Z'（epoch 占位），
        // 这里规范化成 null；进行中时用 started_at（真实开始时间）作「上次更新」。
        const _norm = (t) => (t && !/^1970-01-01/.test(t) ? t : null);
        sync_last_run = {
          status: run.status,
          conclusion: run.conclusion,
          completed_at: _norm(run.completed_at) || _norm(run.started_at) || null,
          display_title: run.display_title || '',
          failure_reason,
        };
      }
    } catch (e) { sync_last_run = null; }
    // 同步进度（sync_download.py 写的 /dsh/sync-progress.json）
    let sync_progress = null;
    try {
      const pr = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/sync-progress.json']);
      sync_progress = JSON.parse(pr.stdout);
    } catch (e) { sync_progress = null; }
    res.json({
      version: (version.data && version.data.version) || '—',
      users: users.total,
      repos: repos.total,
      orgs: Array.isArray(orgs.data) ? orgs.data.length : 0,
      issues: issues.total,
      repos_list,
      sync_last_run,
      sync_progress,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 手动触发 dsh-sync 工作流（workflow_dispatch）
app.post('/api/gitea/sync/trigger', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const resp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/workflows/sync.yml/dispatches`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (resp.status === 204) {
      res.json({ ok: true });
    } else {
      const txt = await resp.text().catch(() => '');
      res.status(resp.status).json({ error: `触发失败 (HTTP ${resp.status}) ${txt}` });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 读取 dsh-sync 的自动同步计划（sync.yml 里的 cron）
app.get('/api/gitea/sync/schedule', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const r = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/.gitea/workflows/sync.yml?ref=main`);
    if (!r.data || !r.data.content) return res.status(404).json({ error: '无法读取 sync.yml' });
    const content = Buffer.from(r.data.content, 'base64').toString('utf8');
    const m = content.match(/cron:\s*["']([^"']+)["']/);
    res.json({ cron: m ? m[1] : '', sha: r.data.sha });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 更新 dsh-sync 的自动同步计划（改 sync.yml 里的 cron）
app.post('/api/gitea/sync/schedule', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const cron = ((req.body && req.body.cron) || '').trim();
    if (!cron) return res.status(400).json({ error: '请提供 cron 表达式' });
    if (cron.split(/\s+/).filter(Boolean).length !== 5) {
      return res.status(400).json({ error: 'cron 表达式必须是 5 段（分 时 日 月 周）' });
    }
    const r = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/.gitea/workflows/sync.yml?ref=main`);
    if (!r.data || !r.data.content) return res.status(404).json({ error: '无法读取 sync.yml' });
    const content = Buffer.from(r.data.content, 'base64').toString('utf8');
    const newContent = content.replace(/cron:\s*["'][^"']+["']/, `cron: "${cron}"`);
    if (newContent === content) return res.status(400).json({ error: '未找到 cron 配置行' });

    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const resp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/.gitea/workflows/sync.yml`, {
      method: 'PUT',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore: 调整同步计划为 ${cron}`,
        content: Buffer.from(newContent, 'utf8').toString('base64'),
        sha: r.data.sha,
        branch: 'main',
      }),
    });
    if (resp.status >= 200 && resp.status < 300) {
      res.json({ ok: true, cron });
    } else {
      const txt = await resp.text().catch(() => '');
      res.status(resp.status).json({ error: `更新失败 (HTTP ${resp.status}) ${txt}` });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 读取 sync-config.json（targets / keep_releases 等）
app.get('/api/gitea/sync/config', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const r = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/sync-config.json?ref=main`);
    if (!r.data || !r.data.content) return res.status(404).json({ error: '无法读取 sync-config.json' });
    const cfg = JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8'));
    res.json({ ...cfg, sha: r.data.sha });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 更新 sync-config.json（targets / keep_releases）
app.post('/api/gitea/sync/config', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const r = await giteaApi(`/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/sync-config.json?ref=main`);
    if (!r.data || !r.data.content) return res.status(404).json({ error: '无法读取 sync-config.json' });
    const cfg = JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8'));
    if (Array.isArray(req.body && req.body.targets)) cfg.targets = req.body.targets;
    if (req.body && req.body.keep_releases !== undefined) {
      const k = parseInt(req.body.keep_releases, 10);
      if (k >= 1 && k <= 20) cfg.keep_releases = k;
    }
    const newContent = JSON.stringify(cfg, null, 2) + '\n';
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const resp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/contents/sync-config.json`, {
      method: 'PUT',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'chore: 更新同步配置（平台/架构、保留版本数）',
        content: Buffer.from(newContent, 'utf8').toString('base64'),
        sha: r.data.sha,
        branch: 'main',
      }),
    });
    if (resp.status >= 200 && resp.status < 300) {
      res.json({ ok: true });
    } else {
      const txt = await resp.text().catch(() => '');
      res.status(resp.status).json({ error: `更新失败 (HTTP ${resp.status}) ${txt}` });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 追加一条同步历史到 update-server 的 sync-history.json（同步脚本与删除操作共用）
async function appendSyncHistory(status, detail) {
  try {
    let hist = { history: [] };
    try {
      const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/sync-history.json']);
      hist = JSON.parse(stdout || '{"history":[]}');
    } catch (e) { hist = { history: [] }; }
    if (!Array.isArray(hist.history)) hist.history = [];
    hist.history.push({ time: new Date().toISOString(), status, detail: detail || '' });
    hist.history = hist.history.slice(-200);
    const b64 = Buffer.from(JSON.stringify(hist, null, 2)).toString('base64');
    await dockerExec('update-server', ['sh', '-c', `echo ${b64} | base64 -d > /usr/share/nginx/html/dsh/sync-history.json`]);
  } catch (e) {
    console.error('记录同步历史失败:', e.message);
  }
}

// 读取 update-server 上的版本清单（versions.json）
app.get('/api/gitea/sync/versions', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/versions.json']);
    const d = JSON.parse(stdout || '{"versions":[]}');
    res.json({ versions: d.versions || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 读取同步历史（sync-history.json，由同步脚本维护）
app.get('/api/gitea/sync/history', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/sync-history.json']);
    const d = JSON.parse(stdout || '{"history":[]}');
    res.json({ history: d.history || [] });
  } catch (e) {
    res.json({ history: [] });
  }
});

// 删除某个版本（删目录 + 更新 versions.json + 触发重建页面）
app.delete('/api/gitea/sync/version/:ver', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const ver = (req.params.ver || '').replace(/[^a-zA-Z0-9.\-]/g, '');
    if (!ver) return res.status(400).json({ error: '无效版本号' });
    // 1. 删除版本目录
    await dockerExec('update-server', ['sh', '-c', `rm -rf "/usr/share/nginx/html/dsh/${ver}"`]);
    // 2. 更新 versions.json（移除该版本）
    let d;
    try {
      const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/versions.json']);
      d = JSON.parse(stdout || '{"versions":[]}');
    } catch (e) { d = { versions: [] }; }
    d.versions = (d.versions || []).filter(v => v.version !== ver);
    const b64 = Buffer.from(JSON.stringify(d, null, 2)).toString('base64');
    await dockerExec('update-server', ['sh', '-c', `echo ${b64} | base64 -d > /usr/share/nginx/html/dsh/versions.json`]);
    // 3. 记录删除历史（软件信息已变化）
    await appendSyncHistory('success', `删除版本 ${ver}`);
    // 4. 触发 rebuild_only 重建页面
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/workflows/sync.yml/dispatches`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { rebuild_only: 'true' } }),
    }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak（Admin REST API）----
app.get('/api/keycloak/overview', keycloak.protect(), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const [userCount, clientList, roleList] = await Promise.all([
      kc.users.count({ realm: KC_REALM }),
      kc.clients.find({ realm: KC_REALM }),
      kc.roles.find({ realm: KC_REALM }),
    ]);
    let idps = [];
    try { idps = await kc.identityProviders.find({ realm: KC_REALM }); } catch (e) { idps = []; }
    res.json({
      users: userCount,
      clients: (clientList || []).length,
      roles: (roleList || []).length,
      role_list: (roleList || []).map(r => r.name).filter(Boolean),
      idps: (idps || []).map(i => i.alias || i.displayName).filter(Boolean),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak 用户分页 + 检索 ----
app.get('/api/keycloak/users', keycloak.protect(), async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const search = (req.query.search || '').trim();
    const kc = await getKcAdmin();
    const opts = { realm: KC_REALM };
    if (search) opts.search = search;
    const [total, list] = await Promise.all([
      kc.users.count(opts),
      kc.users.find({ ...opts, first: page * pageSize, max: pageSize }),
    ]);
    res.json({
      total,
      page,
      pageSize,
      items: (list || []).map(u => ({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, enabled: u.enabled, ldap: !!u.federationLink })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak 客户端分页 + 检索 ----
app.get('/api/keycloak/clients', keycloak.protect(), async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const search = (req.query.search || '').trim();
    const kc = await getKcAdmin();
    const all = await kc.clients.find({ realm: KC_REALM });
    const filtered = search
      ? (all || []).filter(c => (c.clientId || '').toLowerCase().includes(search.toLowerCase()))
      : (all || []);
    const total = filtered.length;
    const items = filtered.slice(page * pageSize, (page + 1) * pageSize).map(c => ({ id: c.id, clientId: c.clientId, enabled: c.enabled }));
    res.json({ total, page, pageSize, items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak 认证：LDAP 全量/增量同步（全局管理员）----
// 动态定位 LDAP 用户存储提供程序（Company AD），避免硬编码组件 id。
async function getLdapProviderId(kc) {
  try {
    const comps = await kc.components.find({ realm: KC_REALM, type: 'org.keycloak.storage.UserStorageProvider' });
    const ldap = (comps || []).find(c => c.providerId === 'ldap');
    return ldap ? ldap.id : null;
  } catch (e) { return null; }
}

// action: 'full' = triggerFullSync（全量），'changed' = triggerChangedUsersSync（增量）。
// 说明：Keycloak 没有「单用户同步」端点，AD 里改了某个账号属性后，增量同步会同步所有有变更的账号。
app.post('/api/keycloak/sync', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const action = (req.body && req.body.action === 'changed') ? 'triggerChangedUsersSync' : 'triggerFullSync';
    const kc = await getKcAdmin();
    const providerId = await getLdapProviderId(kc);
    if (!providerId) throw new Error('未找到 LDAP 用户存储提供程序（Company AD）');
    const result = await kc.userStorageProvider.sync({ id: providerId, realm: KC_REALM, action });
    res.json({ ok: true, action: action === 'triggerFullSync' ? 'full' : 'changed', ...(result || {}) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak 认证：删除用户（全局管理员）----
// 注意：AD 联邦（READ_ONLY + import）用户删除后，下次全量同步或该用户再次 SSO 登录会重新出现；
// 要彻底移除需在 AD 里禁用/删除该账号。返回 ldap 标志供前端提示。
app.delete('/api/keycloak/users/:id', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const u = await kc.users.findOne({ id: req.params.id, realm: KC_REALM });
    if (!u) return res.status(404).json({ error: '用户不存在' });
    await kc.users.del({ id: req.params.id, realm: KC_REALM });
    res.json({ ok: true, username: u.username, ldap: !!u.federationLink });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Keycloak 认证：角色管理（全局管理员）----
// 列表（带各角色用户数）
app.get('/api/keycloak/roles', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const roles = await kc.roles.find({ realm: KC_REALM });
    const items = await Promise.all((roles || []).map(async r => {
      let users = 0;
      try { users = ((await kc.roles.findUsersWithRole({ name: r.name, realm: KC_REALM })) || []).length; } catch (e) {}
      return { name: r.name, description: r.description || '', composite: !!r.composite, users };
    }));
    res.json({ items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 新建 realm 角色
app.post('/api/keycloak/roles', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const name = ((req.body && req.body.name) || '').trim();
    const description = ((req.body && req.body.description) || '').trim();
    if (!name) return res.status(400).json({ error: '角色名不能为空' });
    const kc = await getKcAdmin();
    await kc.roles.create({ realm: KC_REALM, name, description });
    res.json({ ok: true, name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 删除 realm 角色
app.delete('/api/keycloak/roles/:name', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    await kc.roles.delByName({ name: req.params.name, realm: KC_REALM });
    res.json({ ok: true, name: req.params.name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 角色成员列表
app.get('/api/keycloak/roles/:name/users', keycloak.protect('realm:ai-platform-admin'), async (req, res) => {
  try {
    const kc = await getKcAdmin();
    const users = (await kc.roles.findUsersWithRole({ name: req.params.name, realm: KC_REALM })) || [];
    res.json({ items: users.map(u => ({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName })) });
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
const qa=(sql)=>new Promise((res,rej)=>db.all(sql,(e,r)=>e?rej(e):res(r)));
(async()=>{
  const posts=await q("SELECT COUNT(*) c FROM posts WHERE type='post'");
  const pages=await q("SELECT COUNT(*) c FROM posts WHERE type='page'");
  const members=await q("SELECT COUNT(*) c FROM members");
  const tags=await q("SELECT COUNT(*) c FROM tags");
  const recent_posts=await qa("SELECT id, title, slug, status, updated_at FROM posts WHERE type='post' ORDER BY updated_at DESC LIMIT 5");
  const recent_pages=await qa("SELECT id, title, slug, status, updated_at FROM posts WHERE type='page' ORDER BY updated_at DESC LIMIT 5");
  console.log(JSON.stringify({posts:posts.c,pages:pages.c,members:members.c,tags:tags.c,recent_posts,recent_pages}));
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
    const [apps, workspaces, datasets] = await Promise.all([
      difyApi('/console/api/apps?page=1&limit=50'),
      difyApi('/console/api/workspaces'),
      difyApi('/console/api/datasets?page=1&limit=30'),
    ]);
    const appItems = (apps.data && apps.data.data) ? apps.data.data : [];
    const wsItems = (workspaces.data && workspaces.data.workspaces) ? workspaces.data.workspaces : [];
    const dsItems = (datasets.data && datasets.data.data) ? datasets.data.data : [];
    res.json({
      apps: (apps.data && apps.data.total) ?? appItems.length,
      workspaces: wsItems.length,
      app_list: appItems.map(a => ({ id: a.id, name: a.name, mode: a.mode })),
      workspace_list: wsItems.map(w => ({ id: w.id, name: w.name })),
      dataset_list: dsItems.map(k => ({ id: k.id, name: k.name, docs: k.document_count, indexing: k.indexing_technique })),
      rag_ready: !!(DIFY_KNOWLEDGE_API_KEY && DIFY_DEFAULT_DATASET_ID),
      version: '1.16.1',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Dify RAG 检索（Knowledge API hit-testing）----
app.post('/api/dify/retrieve', keycloak.protect(), async (req, res) => {
  try {
    const query = String((req.body && req.body.query) || '').trim();
    if (!query) return res.status(400).json({ error: 'query 不能为空' });
    if (!DIFY_KNOWLEDGE_API_KEY) return res.status(503).json({ error: '未配置 DIFY_KNOWLEDGE_API_KEY' });
    const ds = (req.body && req.body.dataset_id) || DIFY_DEFAULT_DATASET_ID;
    if (!ds) return res.status(503).json({ error: '未配置知识库 ID' });
    const topK = Number(req.body && req.body.top_k) || 3;
    const resp = await fetch(`${DIFY_URL}/v1/datasets/${ds}/hit-testing`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${DIFY_KNOWLEDGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        retrieval_model: { search_method: 'hybrid_search', reranking_enable: false, top_k: topK, score_threshold_enabled: false },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      return res.status(resp.status).json({ error: `检索失败（HTTP ${resp.status}）：${t.slice(0, 300)}` });
    }
    const data = await resp.json();
    const records = (data.records || []).map(r => ({
      score: typeof r.score === 'number' ? r.score : null,
      content: ((r.segment && r.segment.content) || r.content || '').trim(),
      doc: (r.segment && r.segment.document && r.segment.document.name) || (r.document && r.document.name) || '',
    }));
    res.json({ records });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Update Server（DSH Desktop 分发：安装包清单 + 更新时间）----
app.get('/api/update/overview', keycloak.protect(), async (req, res) => {
  try {
    const [verRes, statRes] = await Promise.all([
      dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']),
      dockerExec(UPDATE_CONTAINER, ['sh', '-c', 'for f in /usr/share/nginx/html/dsh/*; do stat -c "%n|%s|%Y" "$f" 2>/dev/null; done']),
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
    const ck = (sql) => dockerExec('langfuse-clickhouse', [
      'clickhouse-client', '-u', 'langfuse', '--password', LANGFUSE_CLICKHOUSE_PASSWORD,
      '--query', sql,
    ]).then(r => (r.stdout || '').trim());
    let traces = null, recent_traces = [], model_stats = [], projects = [];
    try {
      const countStr = await ck('SELECT count() FROM default.traces WHERE is_deleted = 0');
      traces = parseInt(countStr, 10);
      if (isNaN(traces)) traces = 0;
    } catch (e) { traces = null; }
    try {
      const recentStr = await ck("SELECT toString(timestamp), name, coalesce(user_id, ''), environment FROM default.traces WHERE is_deleted = 0 ORDER BY timestamp DESC LIMIT 5 FORMAT TSV");
      recent_traces = recentStr.split('\n').filter(Boolean).map(line => {
        const [ts, name, userId, env] = line.split('\t');
        return { ts, name, userId, env };
      });
    } catch (e) { recent_traces = []; }
    try {
      const projStr = await ck('SELECT project_id FROM default.traces WHERE is_deleted = 0 GROUP BY project_id ORDER BY count() DESC LIMIT 10 FORMAT TSV');
      projects = projStr.split('\n').filter(Boolean);
    } catch (e) { projects = []; }
    try {
      const modelStr = await ck("SELECT provided_model_name, count(), sum(usage_details['total']), round(sum(total_cost), 4) FROM default.observations WHERE type = 'GENERATION' AND provided_model_name != '' AND is_deleted = 0 GROUP BY provided_model_name ORDER BY count() DESC LIMIT 20 FORMAT TSV");
      model_stats = modelStr.split('\n').filter(Boolean).map(line => {
        const [model, calls, tokens, cost] = line.split('\t');
        return { model, calls: parseInt(calls, 10) || 0, tokens: parseInt(tokens, 10) || 0, cost: parseFloat(cost) || 0 };
      });
    } catch (e) { model_stats = []; }
    res.json({ version: health.version || '—', traces, recent_traces, model_stats, projects });
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

app.get('/api/mcp-gateway/servers', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch('/api/servers');
  res.status(r.status).json(r.data);
});

app.post('/api/mcp-gateway/servers', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch('/api/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) });
  res.status(r.status).json(r.data);
});

app.put('/api/mcp-gateway/servers/:name', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch(`/api/servers/${req.params.name}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) });
  res.status(r.status).json(r.data);
});

app.delete('/api/mcp-gateway/servers/:name', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch(`/api/servers/${req.params.name}`, { method: 'DELETE' });
  res.status(r.status).json(r.data);
});

app.get('/api/mcp-gateway/skills', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch('/skills');
  res.status(r.status).json(r.data);
});

app.get('/api/mcp-gateway/tools', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
  const r = await gwFetch('/api/tools');
  res.status(r.status).json(r.data);
});

app.post('/api/mcp-gateway/skills/upload', keycloak.protect(), protectAdmin('mcp-gateway'), express.raw({ type: ['application/zip', 'application/octet-stream'], limit: '200mb' }), async (req, res) => {
  const buf = req.body;
  if (!buf || !buf.length) return res.status(400).json({ error: '空文件' });
  const r = await gwFetch('/api/skills/upload', { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: buf });
  res.status(r.status).json(r.data);
});

app.delete('/api/mcp-gateway/skills/:name', keycloak.protect(), protectAdmin('mcp-gateway'), async (req, res) => {
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
    // LiteLLM（模型数 + 名称）
    (async () => {
      try {
        const resp = await fetch(`${LITELLM_INTERNAL_URL}/v1/models`, {
          headers: { 'Authorization': `Bearer ${LITELLM_MASTER_KEY}` },
        });
        const data = await resp.json();
        const names = (data.data || []).map(m => m.id);
        metrics.litellm = ok({ models: names.length, model_names: names });
      } catch (e) { metrics.litellm = err(e); }
    })(),
    // Update Server（DSH Desktop 版本 + 更新时间）
    (async () => {
      try {
        const [verRes, statRes] = await Promise.all([
          dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']),
          dockerExec(UPDATE_CONTAINER, ['sh', '-c', 'for f in /usr/share/nginx/html/dsh/*; do stat -c "%Y" "$f" 2>/dev/null; done']),
        ]);
        const version = (verRes.stdout || '').trim() || '—';
        let last_updated = 0;
        for (const line of (statRes.stdout || '').split('\n').map(s => s.trim()).filter(Boolean)) {
          const t = parseInt(line, 10);
          if (t > last_updated) last_updated = t;
        }
        metrics.update = ok({ version, last_updated });
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
    // LLM 可观测（Langfuse — trace 数量 + 健康）
    (async () => {
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
        metrics.langfuse = ok({ traces, version: health.version || '—' });
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
app.get('/api/backup/list', keycloak.protect(), protectAdmin('backup'), async (req, res) => {
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
app.post('/api/backup/run', keycloak.protect(), protectAdmin('backup'), async (req, res) => {
  try {
    const r = await performBackup();
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 触发恢复
app.post('/api/backup/restore', keycloak.protect(), protectAdmin('backup'), async (req, res) => {
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
    const level = (req.query.level || '').replace(/[^a-z]/g, '');
    const m = since.match(/^(\d+)([smhd])$/);
    const sec = m ? (m[2] === 's' ? +m[1] : m[2] === 'm' ? +m[1] * 60 : m[2] === 'h' ? +m[1] * 3600 : +m[1] * 86400) : 3600;

    let selector = '{container=~".+"}';
    if (container) selector = `{container="${container}"}`;
    else if (service) selector = `{service="${service}"}`;

    let logql = selector;
    if (keyword) logql += ` |= \`${keyword.replace(/`/g, '')}\``;
    const levelPatterns = {
      error: '(?i)(error|exception|fatal|panic|traceback|failed|ERR!)',
      warn: '(?i)(warn|warning|deprecated)',
      info: '(?i)(info|INFO)',
    };
    if (levelPatterns[level]) logql += ` |~ \`${levelPatterns[level]}\``;
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
// 覆盖：Keycloak 认证 / NewAPI / LiteLLM / DSH Desktop·Dify 聊天 / Ghost / Gitea / MCP /
//       Prometheus / Grafana / Langfuse / Loki / Presidio / SSO / 更新服务器 / 备份 / Docker / Redis
// ═══════════════════════════════════════════
const AVAILABILITY_INTERVAL_MIN = parseInt(process.env.AVAILABILITY_INTERVAL_MIN || '10', 10);

// 从 NewAPI DB 取 dsh / dify 的完整 token key（base64 中转避免 shell 转义）
async function getNewApiTokens() {
  const sql = "SELECT name, `key` FROM `new-api`.tokens WHERE status=1";
  const b64 = Buffer.from(sql).toString('base64');
  const { stdout } = await dockerExec(NEWAPI_DB_CONTAINER, [
    'sh', '-c',
    `MYSQL_PWD="${NEWAPI_DB_PASSWORD}" mysql -uroot -N -B -e "$(echo ${b64} | base64 -d)" 2>/dev/null`,
  ]);
  const out = { dsh: null, dify: null };
  for (const line of stdout.split('\n')) {
    const [name, key] = line.split('\t');
    if (name === 'dsh-key' && key) out.dsh = 'sk-' + key.trim();
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
  { id: 'chat-dsh', name: 'DSH Desktop 聊天（经 NewAPI）', run: async () => {
      const tokens = await getNewApiTokens();
      if (!tokens.dsh) throw new Error('未找到 dsh-key token');
      // 查询 NewAPI 实际可用的模型，不假定后端是 DeepSeek 或其他特定渠道
      const modelsR = await fetch(`${NEWAPI_URL}/v1/models`, { headers: { Authorization: `Bearer ${tokens.dsh}` } });
      if (!modelsR.ok) throw new Error('获取模型列表失败 HTTP ' + modelsR.status);
      const modelsD = await modelsR.json();
      const models = (modelsD.data || []).map(m => m.id);
      if (!models.length) throw new Error('无可用模型（请在 NewAPI 中配置渠道）');
      const model = models[0];
      const r = await fetch(`${NEWAPI_URL}/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.dsh}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + ((await r.text()).slice(0, 120)));
      const d = await r.json();
      const u = d.usage || {};
      return `模型 ${model} · tokens ${u.total_tokens ?? '—'} · ${((d.choices || [{}])[0].message || {}).content ? '有回复' : '无回复'}`;
    } },
  { id: 'chat-dify', name: 'Dify 聊天（经 NewAPI）', run: async () => {
      const tokens = await getNewApiTokens();
      if (!tokens.dify) throw new Error('未找到 dify-key token');
      // 查询 NewAPI 实际可用的模型，不假定后端是 DeepSeek 或其他特定渠道
      const modelsR = await fetch(`${NEWAPI_URL}/v1/models`, { headers: { Authorization: `Bearer ${tokens.dify}` } });
      if (!modelsR.ok) throw new Error('获取模型列表失败 HTTP ' + modelsR.status);
      const modelsD = await modelsR.json();
      const models = (modelsD.data || []).map(m => m.id);
      if (!models.length) throw new Error('无可用模型（请在 NewAPI 中配置渠道）');
      const model = models[0];
      const r = await fetch(`${NEWAPI_URL}/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.dify}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + ((await r.text()).slice(0, 120)));
      const d = await r.json();
      const u = d.usage || {};
      return `模型 ${model} · tokens ${u.total_tokens ?? '—'} · ${((d.choices || [{}])[0].message || {}).content ? '有回复' : '无回复'}`;
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
      return `DSH Desktop 版本 ${(stdout || '').trim() || '—'}`;
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

// 根据结果列表重算统计（全测、单测回写缓存共用）
function computeAvailSummary(results) {
  return {
    total: results.length,
    ok: results.filter(r => r.status === 'ok').length,
    fail: results.filter(r => r.status === 'fail').length,
    degraded: results.filter(r => r.status === 'degraded').length,
  };
}

// 运行全部测试
async function runAllAvailability() {
  const results = await Promise.all(availabilityTestDefs.map(d => runAvailabilityTest(d.id, d.name, d.run)));
  return { runAt: Date.now(), summary: computeAvailSummary(results), results };
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

// 结果（含配置 + 测试项清单，前端用于逐个测试的卡片渲染）
app.get('/api/availability', keycloak.protect(), async (req, res) => {
  res.json({
    interval_min: AVAILABILITY_INTERVAL_MIN,
    defs: availabilityTestDefs.map(d => ({ id: d.id, name: d.name })),
    last: lastAvailability,
  });
});

// 全测
app.post('/api/availability/run', keycloak.protect(), protectAdmin('availability'), async (req, res) => {
  res.json(await refreshAvailability());
});

// 单测
app.post('/api/availability/test/:id', keycloak.protect(), protectAdmin('availability'), async (req, res) => {
  const def = availabilityTestDefs.find(d => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: '未知测试项 ' + req.params.id });
  const r = await runAvailabilityTest(def.id, def.name, def.run);
  // 回写缓存对应项并重算统计（首次单测也建缓存），dashboard / 统计随之更新
  if (lastAvailability) {
    const i = lastAvailability.results.findIndex(x => x.id === def.id);
    if (i >= 0) lastAvailability.results[i] = r; else lastAvailability.results.push(r);
    lastAvailability.summary = computeAvailSummary(lastAvailability.results);
    lastAvailability.runAt = Date.now();
  } else {
    lastAvailability = { runAt: Date.now(), summary: computeAvailSummary([r]), results: [r] };
  }
  res.json({ ...r, summary: lastAvailability.summary });
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
    add('update', async () => { const { stdout } = await dockerExec(UPDATE_CONTAINER, ['cat', '/usr/share/nginx/html/version.txt']); return `DSH Desktop ${(stdout || '').trim() || '—'}`; }),
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
app.get('/api/report', keycloak.protect(), protectAdmin('report'), async (req, res) => {
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
app.get('/api/report/list', keycloak.protect(), protectAdmin('report'), (req, res) => {
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
app.get('/api/report/settings', keycloak.protect(), protectAdmin('report'), (req, res) => {
  res.json(getReportSettings());
});

// 更新保留设置
app.post('/api/report/settings', keycloak.protect(), protectAdmin('report'), (req, res) => {
  try {
    const settings = saveReportSettings(req.body || {});
    const removed = cleanupReports();
    res.json({ settings, removed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 查看单个历史报告内容
app.get('/api/report/file/:name', keycloak.protect(), protectAdmin('report'), (req, res) => {
  try {
    const name = path.basename(req.params.name);
    if (!name.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const p = path.join(REPORT_DIR, name);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
    res.json({ name, markdown: fs.readFileSync(p, 'utf8').replace(/^\ufeff/, '') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 下载单个历史报告
app.get('/api/report/file/:name/download', keycloak.protect(), protectAdmin('report'), (req, res) => {
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
app.delete('/api/report/file/:name', keycloak.protect(), protectAdmin('report'), (req, res) => {
  try {
    const name = path.basename(req.params.name);
    if (!name.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const p = path.join(REPORT_DIR, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 企业 IM 告警（多个接收人 + 发送规则 + 发送历史，Redis 持久化）
// ═══════════════════════════════════════════
// Redis key：imalert:receivers（JSON 数组）、imalert:rules（JSON 对象）、imalert:history（list，最新在前）
const IM_HISTORY_LIMIT = 500;                       // 最多保留的发送历史条数
const IM_SEV_RANK = { info: 1, warning: 2, critical: 3 };

async function imGetReceivers() {
  try { const v = await redisClient.get('imalert:receivers'); return v ? JSON.parse(v) : []; } catch (e) { return []; }
}
async function imSetReceivers(list) {
  try { await redisClient.set('imalert:receivers', JSON.stringify(list || [])); } catch (e) { console.warn('[imalert] 保存接收人失败:', e.message); }
}
async function imGetRules() {
  const dft = { enabled: false, minSeverity: 'warning', sendFiring: true, sendResolved: true };
  try {
    const v = await redisClient.get('imalert:rules');
    if (!v) return dft;
    return Object.assign({}, dft, JSON.parse(v));
  } catch (e) { return dft; }
}
async function imSetRules(rules) {
  try { await redisClient.set('imalert:rules', JSON.stringify(rules || {})); } catch (e) { console.warn('[imalert] 保存规则失败:', e.message); }
}
async function imPushHistory(entry) {
  try {
    await redisClient.lPush('imalert:history', JSON.stringify(entry));
    await redisClient.lTrim('imalert:history', 0, IM_HISTORY_LIMIT - 1);
  } catch (e) { console.warn('[imalert] 记录历史失败:', e.message); }
}

// 按 webhook URL 识别企业 IM 类型（钉钉/企微/飞书）
function detectImType(url) {
  if (/oapi\.dingtalk\.com/.test(url)) return 'dingtalk';
  if (/qyapi\.weixin\.qq\.com/.test(url)) return 'wecom';
  if (/feishu\.cn/.test(url)) return 'feishu';
  return '';
}

// 组装各 IM 的消息体（群机器人 webhook 用）
function imAlertPayload(type, lines) {
  const text = lines.join('\n');
  if (type === 'dingtalk') return { msgtype: 'markdown', markdown: { title: 'AI 平台告警', text } };
  if (type === 'wecom') return { msgtype: 'markdown', markdown: { content: text } };
  if (type === 'feishu') return { msg_type: 'text', content: { text } };
  return null;
}

// ─── 企业应用「发个人」：钉钉 / 企微 access_token 缓存与获取 ───
const _imAppTokenCache = {}; // { cacheKey: { token, exp } }
async function imGetAppToken(kind, rc) {
  const now = Date.now();
  const cacheKey = kind === 'dingtalk' ? ('dd:' + rc.appKey) : ('wc:' + rc.corpId + ':' + rc.secret);
  const c = _imAppTokenCache[cacheKey];
  if (c && c.exp > now) return c.token;
  const url = kind === 'dingtalk'
    ? `https://oapi.dingtalk.com/gettoken?appkey=${encodeURIComponent(rc.appKey)}&appsecret=${encodeURIComponent(rc.appSecret)}`
    : `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(rc.corpId)}&corpsecret=${encodeURIComponent(rc.secret)}`;
  const r = await fetch(url);
  const d = await r.json().catch(() => ({}));
  if (d.errcode !== 0) throw new Error((kind === 'dingtalk' ? '钉钉' : '企微') + ' 获取 access_token 失败: ' + (d.errmsg || JSON.stringify(d)) + ' (errcode ' + d.errcode + ')');
  const exp = now + ((d.expires_in || 7200) - 300) * 1000; // 提前 5 分钟过期
  _imAppTokenCache[cacheKey] = { token: d.access_token, exp };
  return d.access_token;
}

// 钉钉企业应用「发个人」：工作通知（corpconversation/asyncsend_v2），markdown
async function imSendDingtalkApp(rc, text) {
  const token = await imGetAppToken('dingtalk', rc);
  const body = {
    agent_id: Number(rc.agentId),
    userid_list: String(rc.userIds || '').trim(),
    msg: { msgtype: 'markdown', markdown: { title: 'AI 平台告警', text } },
  };
  const r = await fetch(`https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (d.errcode !== 0) throw new Error('钉钉工作通知发送失败: ' + (d.errmsg || JSON.stringify(d)) + ' (errcode ' + d.errcode + ')');
  return d;
}

// 企微企业应用「发个人」：应用消息（message/send），markdown
async function imSendWecomApp(rc, text) {
  const token = await imGetAppToken('wecom', rc);
  const body = {
    touser: String(rc.toUsers || '').trim().replace(/,/g, '|'),
    msgtype: 'markdown',
    agentid: Number(rc.agentId),
    markdown: { content: text },
  };
  const r = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (d.errcode !== 0) throw new Error('企微应用消息发送失败: ' + (d.errmsg || JSON.stringify(d)) + ' (errcode ' + d.errcode + ')');
  return d;
}

// 判断某条告警是否满足发送规则
function imAlertPasses(alert, rules) {
  const resolved = alert.status === 'resolved';
  if (resolved && !rules.sendResolved) return false;
  if (!resolved && !rules.sendFiring) return false;
  const sev = String((alert.labels && alert.labels.severity) || 'warning').toLowerCase();
  const rank = IM_SEV_RANK[sev] != null ? IM_SEV_RANK[sev] : 2;
  const minRank = IM_SEV_RANK[rules.minSeverity] != null ? IM_SEV_RANK[rules.minSeverity] : 2;
  return rank >= minRank;
}

// 把告警转发到所有启用的接收人（不阻塞主流程；逐接收人发送、逐告警记历史）
async function forwardAlertToIM(alerts) {
  if (!alerts || !alerts.length) return;
  const rules = await imGetRules();
  let receivers = await imGetReceivers();
  // 向后兼容：Redis 无接收人、但 .env 配了单 webhook，则视为一个默认接收人
  if (!receivers.length && ALERT_IM_WEBHOOK_URL) {
    receivers = [{ id: 'default', name: '默认接收人', type: ALERT_IM_TYPE || detectImType(ALERT_IM_WEBHOOK_URL), webhookUrl: ALERT_IM_WEBHOOK_URL, enabled: true }];
  }
  if (!receivers.length) return;
  for (const rc of receivers) {
    if (!rc || !rc.enabled) continue;
    // 群机器人需要 webhookUrl；企业应用（发个人）需要各自凭据，由 imSendToReceiver 内校验
    if (!rc.webhookUrl && rc.type !== 'dingtalk_app' && rc.type !== 'wecom_app') continue;
    await imSendToReceiver(rc, alerts, rules);
  }
}

async function imSendToReceiver(rc, alerts, rules) {
  const type = rc.type || detectImType(rc.webhookUrl);
  if (!type) { console.warn('[imalert] 无法识别 IM 类型，跳过接收人:', rc.name || rc.webhookUrl); return; }
  const filtered = alerts.filter(a => imAlertPasses(a, rules));
  if (!filtered.length) return;
  const lines = [];
  for (const a of filtered) {
    const status = a.status === 'resolved' ? '✅ 恢复' : '🔴 告警';
    const name = (a.labels && a.labels.alertname) || 'unknown';
    const sev = (a.labels && a.labels.severity) || '';
    const summary = (a.annotations && a.annotations.summary) || '';
    const desc = (a.annotations && a.annotations.description) || '';
    lines.push(`${status} ${name}${sev ? ' [' + sev + ']' : ''}`);
    if (summary) lines.push(summary);
    if (desc) lines.push(desc);
  }
  const text = lines.join('\n');
  const time = new Date().toISOString();
  let result = 'fail', detail = '发送异常';
  try {
    if (type === 'dingtalk_app') {
      await imSendDingtalkApp(rc, text);
      result = 'success';
      detail = '钉钉工作通知已发送';
      console.log(`[imalert] ✓ dingtalk_app/${rc.name || rc.id}: 发个人 ${rc.userIds}`);
    } else if (type === 'wecom_app') {
      await imSendWecomApp(rc, text);
      result = 'success';
      detail = '企微应用消息已发送';
      console.log(`[imalert] ✓ wecom_app/${rc.name || rc.id}: 发个人 ${rc.toUsers}`);
    } else {
      const payload = imAlertPayload(type, lines);
      if (!payload) return;
      const r = await fetch(rc.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const respText = await r.text();
      const ok = r.status >= 200 && r.status < 300;
      result = ok ? 'success' : 'fail';
      detail = ok ? ('HTTP ' + r.status) : ('HTTP ' + r.status + ' ' + String(respText).slice(0, 120));
      console.log(`[imalert] ${ok ? '✓' : '✗'} ${type}/${rc.name || rc.id}: HTTP ${r.status}`);
    }
  } catch (e) {
    result = 'fail';
    detail = e.message;
    console.warn('[imalert] 转发失败:', e.message);
  }
  // 逐条告警记历史（细粒度，便于检索与分类筛选），共享本次发送结果
  for (const a of filtered) {
    const name = (a.labels && a.labels.alertname) || 'unknown';
    const sev = String((a.labels && a.labels.severity) || 'warning').toLowerCase();
    const summary = (a.annotations && a.annotations.summary) || '';
    await imPushHistory({
      id: cuidLike(), time, receiverId: rc.id, receiverName: rc.name || rc.id, type,
      alertname: name, severity: sev, status: a.status || 'firing', summary,
      result, detail,
    });
  }
}

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
    forwardAlertToIM(alerts); // 异步转发到企业 IM（不阻塞响应）
    res.json({ ok: true, received: alerts.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 最近告警（AI Admin 监控页展示）
app.get('/api/alerts', keycloak.protect(), (req, res) => {
  res.json({ alerts: recentAlerts });
});

// ─── 企业 IM 告警配置端点（monitoring 模块管理员或全局管理员）───
// 配置总览（接收人 + 规则 + 历史条数）
app.get('/api/imalert/config', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const receivers = await imGetReceivers();
    const rules = await imGetRules();
    let historyTotal = 0;
    try { historyTotal = await redisClient.lLen('imalert:history'); } catch (e) {}
    res.json({ receivers, rules, historyTotal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 添加接收人
app.post('/api/imalert/receivers', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const b = req.body || {};
    const name = b.name, type = b.type, webhookUrl = b.webhookUrl, enabled = b.enabled;
    const isApp = type === 'dingtalk_app' || type === 'wecom_app';
    if (isApp) {
      if (type === 'dingtalk_app' && (!b.appKey || !b.appSecret || !b.agentId || !b.userIds)) return res.status(400).json({ error: '钉钉企业应用需填写 AppKey、AppSecret、AgentId、用户 userid' });
      if (type === 'wecom_app' && (!b.corpId || !b.secret || !b.agentId || !b.toUsers)) return res.status(400).json({ error: '企微企业应用需填写 corpId、secret、agentid、用户 userid' });
    } else if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl 必填' });
    }
    const receivers = await imGetReceivers();
    const rc = { id: cuidLike(), name: name || '接收人', type: type || detectImType(webhookUrl) || 'dingtalk', enabled: enabled !== false };
    if (isApp) {
      if (type === 'dingtalk_app') { rc.appKey = b.appKey; rc.appSecret = b.appSecret; rc.agentId = b.agentId; rc.userIds = b.userIds; }
      else { rc.corpId = b.corpId; rc.secret = b.secret; rc.agentId = b.agentId; rc.toUsers = b.toUsers; }
    } else {
      rc.webhookUrl = webhookUrl;
    }
    receivers.push(rc);
    await imSetReceivers(receivers);
    res.json({ ok: true, receiver: rc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 更新接收人
app.put('/api/imalert/receivers/:id', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const receivers = await imGetReceivers();
    const i = receivers.findIndex(r => r.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: '接收人不存在' });
    const b = req.body || {};
    const cur = receivers[i];
    if (b.name !== undefined) cur.name = b.name;
    if (b.type !== undefined) cur.type = b.type;
    if (b.enabled !== undefined) cur.enabled = !!b.enabled;
    if (b.webhookUrl !== undefined) cur.webhookUrl = b.webhookUrl;
    // 企业应用凭据字段
    ['appKey', 'appSecret', 'agentId', 'userIds', 'corpId', 'secret', 'toUsers'].forEach(k => { if (b[k] !== undefined) cur[k] = b[k]; });
    if (!cur.type) cur.type = detectImType(cur.webhookUrl) || 'dingtalk';
    receivers[i] = cur;
    await imSetReceivers(receivers);
    res.json({ ok: true, receiver: cur });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 删除接收人
app.delete('/api/imalert/receivers/:id', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    let receivers = await imGetReceivers();
    receivers = receivers.filter(r => r.id !== req.params.id);
    await imSetReceivers(receivers);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 更新发送规则
app.put('/api/imalert/rules', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const rules = await imGetRules();
    const b = req.body || {};
    if (b.enabled !== undefined) rules.enabled = !!b.enabled;
    if (b.minSeverity !== undefined) rules.minSeverity = b.minSeverity;
    if (b.sendFiring !== undefined) rules.sendFiring = !!b.sendFiring;
    if (b.sendResolved !== undefined) rules.sendResolved = !!b.sendResolved;
    await imSetRules(rules);
    res.json({ ok: true, rules });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 发送测试消息到指定接收人
app.post('/api/imalert/test/:id', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const receivers = await imGetReceivers();
    const rc = receivers.find(r => r.id === req.params.id);
    if (!rc) return res.status(404).json({ error: '接收人不存在' });
    const type = rc.type || detectImType(rc.webhookUrl);
    if (!type) return res.status(400).json({ error: '无法识别 IM 类型' });
    const testText = '🔔 测试消息\n这是一条来自 AI 管理中心的 IM 告警测试消息。';
    const time = new Date().toISOString();
    const record = (result, detail) => imPushHistory({ id: cuidLike(), time, receiverId: rc.id, receiverName: rc.name || rc.id, type, alertname: '测试消息', severity: 'info', status: 'firing', summary: 'IM 告警测试', result, detail });
    try {
      if (type === 'dingtalk_app') {
        await imSendDingtalkApp(rc, testText);
        await record('success', '钉钉工作通知已发送');
        return res.json({ ok: true, detail: '钉钉工作通知已发送' });
      }
      if (type === 'wecom_app') {
        await imSendWecomApp(rc, testText);
        await record('success', '企微应用消息已发送');
        return res.json({ ok: true, detail: '企微应用消息已发送' });
      }
      const payload = imAlertPayload(type, [testText]);
      if (!payload) return res.status(400).json({ error: '不支持的类型' });
      const r = await fetch(rc.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const respText = await r.text();
      const ok = r.status >= 200 && r.status < 300;
      await record(ok ? 'success' : 'fail', ok ? ('HTTP ' + r.status) : ('HTTP ' + r.status + ' ' + String(respText).slice(0, 120)));
      res.json({ ok, status: r.status, detail: String(respText).slice(0, 160) });
    } catch (e) {
      await record('fail', e.message);
      res.json({ ok: false, detail: e.message });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 发送历史（分页 + 检索 + 分类筛选）
app.get('/api/imalert/history', keycloak.protect(), protectAdmin('monitoring'), async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const q = String(req.query.q || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim();        // dingtalk | wecom | feishu
    const result = String(req.query.result || '').trim();    // success | fail
    const severity = String(req.query.severity || '').trim();// critical | warning | info
    let raw = [];
    try { raw = await redisClient.lRange('imalert:history', 0, -1); } catch (e) {}
    let items = raw.map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
    if (q) items = items.filter(h =>
      (h.alertname || '').toLowerCase().includes(q) ||
      (h.receiverName || '').toLowerCase().includes(q) ||
      (h.summary || '').toLowerCase().includes(q));
    if (type) items = items.filter(h => h.type === type);
    if (result) items = items.filter(h => h.result === result);
    if (severity) items = items.filter(h => h.severity === severity);
    const total = items.length;
    const paged = items.slice(page * pageSize, (page + 1) * pageSize);
    res.json({ items: paged, total, page, pageSize });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// Ghost 免登录：密码登录 + 本地算 TOTP 验证码，把已验证会话 cookie 写进浏览器
// ═══════════════════════════════════════════
app.post('/api/ghost/auto-login', keycloak.protect(), protectAdmin('ghost'), async (req, res) => {
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
  await ensureProductRoles();
  startAvailabilityScheduler();
});
