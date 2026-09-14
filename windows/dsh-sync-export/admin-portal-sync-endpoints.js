// ============================================================
// AI Admin Center - DSH Sync 相关 API 端点
// 从 server.js 提取，部署时需要合并到 admin-portal/server.js
// ============================================================

// ---- 配置变量（已在 server.js 顶部定义）----
// const GITEA_URL = 'http://gitea:3000';
// const GITEA_ADMIN_USER = 'ai_all_in_one_admin';
// const GITEA_ADMIN_PASS = '!QAZ@WSX123456';

// ═══════════════════════════════════════════
// 1. 同步触发端点
// ═══════════════════════════════════════════

// 触发同步（立即同步按钮）
app.post('/api/gitea/sync/trigger', async (req, res) => {
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

// 强制停止当前同步任务
app.post('/api/gitea/sync/force-stop', async (req, res) => {
  try {
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const runsResp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/runs?limit=10`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const runsData = await runsResp.json();
    const runs = (runsData.workflow_runs || []).filter(r => !r.conclusion && r.status !== 'completed');
    if (runs.length === 0) {
      return res.json({ ok: true, message: '没有正在运行的同步任务' });
    }
    const stopped = [];
    for (const run of runs) {
      try {
        const cancelResp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/runs/${run.id}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}` },
        });
        if (cancelResp.ok) stopped.push(run.id);
        else stopped.push(run.id);
      } catch (e) {
        console.error(`[gitea] Failed to cancel run ${run.id}:`, e.message);
      }
    }
    try {
      const container = docker.getContainer('gitea-runner');
      await container.restart({ t: 5 });
    } catch (e) {
      console.error('[gitea] Failed to restart runner:', e.message);
    }
    res.json({ ok: true, message: stopped.length > 0 ? `已停止 ${stopped.length} 个同步任务` : '没有需要停止的任务', stopped });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 重新同步指定版本（触发 Gitea Action）
app.post('/api/gitea/sync/resync-version', async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) return res.status(400).json({ error: '请提供版本号' });
    const ver = version.startsWith('v') ? version : `v${version}`;
    console.log(`[gitea] Triggering re-sync for version ${ver} via Gitea Action...`);
    const auth = Buffer.from(`${GITEA_ADMIN_USER}:${GITEA_ADMIN_PASS}`).toString('base64');
    const resp = await fetch(`${GITEA_URL}/api/v1/repos/${GITEA_ADMIN_USER}/dsh-sync/actions/workflows/sync.yml/dispatches`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { resync_version: ver } }),
    });
    if (resp.status === 204) {
      res.json({ ok: true, message: `已触发 ${ver} 重新同步任务，请在 Gitea Actions 中查看执行进度` });
    } else {
      const txt = await resp.text().catch(() => '');
      res.status(resp.status).json({ error: `触发失败 (HTTP ${resp.status}) ${txt}` });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// 2. 版本和历史读取端点
// ═══════════════════════════════════════════

// 读取版本列表（需要认证）
app.get('/api/gitea/sync/versions', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/versions.json']);
    const d = JSON.parse(stdout || '{"versions":[]}');
    res.json({ versions: d.versions || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 同步脚本用的版本读取端点（不需要认证）
app.get('/api/gitea/sync/versions-internal', async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/versions.json']);
    const d = JSON.parse(stdout || '{"versions":[]}');
    res.json({ versions: d.versions || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 读取同步历史（需要认证）
app.get('/api/gitea/sync/history', keycloak.protect(), protectAdmin('gitea'), async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/sync-history.json']);
    const d = JSON.parse(stdout || '[]');
    res.json({ history: Array.isArray(d) ? d : (d.history || []) });
  } catch (e) { res.json({ history: [] }); }
});

// 同步脚本用的历史读取端点（不需要认证）
app.get('/api/gitea/sync/history-internal', async (req, res) => {
  try {
    const { stdout } = await dockerExec('update-server', ['cat', '/usr/share/nginx/html/dsh/sync-history.json']);
    const d = JSON.parse(stdout || '[]');
    res.json({ history: Array.isArray(d) ? d : (d.history || []) });
  } catch (e) { res.json({ history: [] }); }
});

// ═══════════════════════════════════════════
// 3. Ghost 页面更新端点
// ═══════════════════════════════════════════

// 更新 Ghost DSH Desktop 页面
app.post('/api/ghost/update-dsh-page', async (req, res) => {
  try {
    const { version, date, files, all_versions } = req.body;
    if (!version) return res.status(400).json({ error: 'Missing version' });
    const UPDATE_BASE = 'http://192.168.31.117:8091/dsh';
    const SLUG = 'dsh';
    
    // 构建 HTML 内容（包含下载卡片和版本历史）
    // ... 完整代码见 server.js 第 3899-4129 行
    
    // 使用 Python + sqlite3 直接更新 Ghost 数据库
    // 1. 用 Docker API 从 Ghost 容器复制数据库
    // 2. 在 admin-portal 容器中用 Python 更新
    // 3. 复制回 Ghost 容器
    // 4. 重启 Ghost
  } catch (e) { res.status(500).json({ error: e.message }); }
});
