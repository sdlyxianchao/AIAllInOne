// 在 Ghost 容器内执行：把示例内容种子（content.json）导入当前 Ghost
// 用法：node ghost-content-import.js <seed.json 路径> <服务器IP> [--skip-existing]
//   - seed.json：windows/ghost-content-seed/content.json（或 Agent 翻译后的版本）
//   - 服务器IP：把 seed 里的 <服务器IP> 占位符替换成实际内网 IP
//   - --skip-existing：slug 已存在时跳过（默认跳过，幂等）
const fs = require('fs'), path = require('path');
const crypto = require('crypto');

// 1. 加载 Ghost 自带的 sqlite3 模块
let sp = null;
for (const d of fs.readdirSync('/var/lib/ghost/versions')) {
  const p = path.join('/var/lib/ghost/versions', d, 'node_modules', 'sqlite3');
  if (fs.existsSync(p)) { sp = p; break; }
}
if (!sp) { console.error('sqlite3 module not found'); process.exit(1); }
const D = require(sp);
const db = new D.Database('/var/lib/ghost/content/data/ghost.db');

const seedPath = process.argv[2] || '/tmp/content.json';
const serverAddr = process.argv[3] || '127.0.0.1';

if (!fs.existsSync(seedPath)) { console.error('seed 文件不存在: ' + seedPath); process.exit(1); }
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

// 替换 <服务器IP> 占位符；同时兼容 html 字段里被 HTML 转义成的 &lt;服务器IP&gt;
function repl(s) {
  if (s == null) return s;
  return String(s)
    .split('<服务器IP>').join(serverAddr)
    .split('&lt;服务器IP&gt;').join(serverAddr);
}
function genId() { return crypto.randomBytes(12).toString('hex'); }
function genUuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

function run(sql, params) {
  return new Promise((res, rej) => db.run(sql, params, (e) => e ? rej(e) : res()));
}
function get(sql, params) {
  return new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r)));
}

(async () => {
  try {
    // 2. 找管理员作者
    const u = await get("SELECT id FROM users WHERE status='active' ORDER BY created_at ASC LIMIT 1");
    const authorId = String(u ? u.id : 1);

    // 3. 导入 posts / pages
    let created = 0, skipped = 0;
    for (const p of (seed.posts || [])) {
      const exists = await get("SELECT id FROM posts WHERE slug=?", [p.slug]);
      if (exists) { skipped++; continue; }

      const id = genId();
      const uuid = genUuid();
      const ts = now();
      await run(
        `INSERT INTO posts (id, uuid, title, slug, mobiledoc, lexical, html, plaintext,
           feature_image, type, status, locale, created_at, created_by, updated_at, updated_by,
           published_at, published_by, custom_excerpt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, uuid, repl(p.title), p.slug, repl(p.mobiledoc), repl(p.lexical), repl(p.html),
         repl(p.plaintext), repl(p.feature_image), p.type, p.status || 'published', 'en',
         ts, authorId, ts, authorId, ts, authorId, repl(p.custom_excerpt)]
      );
      await run("INSERT INTO posts_authors (id, post_id, author_id, sort_order) VALUES (?,?,?,?)",
        [genId(), id, authorId, 0]);
      created++;
    }

    // 4. 导入站点标题 / 描述
    if (seed.site) {
      if (seed.site.title) await run("UPDATE settings SET value=? WHERE key='title'", [repl(seed.site.title)]);
      if (seed.site.description) await run("UPDATE settings SET value=? WHERE key='description'", [repl(seed.site.description)]);
    }

    // 5. 导入导航
    if (Array.isArray(seed.navigation) && seed.navigation.length) {
      const nav = seed.navigation.map(n => ({ url: repl(n.url), label: n.label }));
      await run("UPDATE settings SET value=? WHERE key='navigation'", [JSON.stringify(nav)]);
    }

    console.log(JSON.stringify({ created, skipped, authorId }));
    db.close();
  } catch (e) {
    console.error(e);
    db.close();
    process.exit(1);
  }
})();
