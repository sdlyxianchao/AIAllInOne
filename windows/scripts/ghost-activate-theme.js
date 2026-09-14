// 在 Ghost 容器内执行：把 active_theme 设为指定主题（默认 corp-portal-theme）
// 用法：node ghost-activate-theme.js [theme-name]
const fs = require('fs'), path = require('path');
let sp = null;
for (const d of fs.readdirSync('/var/lib/ghost/versions')) {
  const p = path.join('/var/lib/ghost/versions', d, 'node_modules', 'sqlite3');
  if (fs.existsSync(p)) { sp = p; break; }
}
if (!sp) { console.error('sqlite3 module not found'); process.exit(1); }
const D = require(sp);
const db = new D.Database('/var/lib/ghost/content/data/ghost.db');
const theme = process.argv[2] || 'corp-portal-theme';
db.run("UPDATE settings SET value=? WHERE key='active_theme'", [theme], (e) => {
  if (e) { console.error(e); process.exit(1); }
  console.log('OK active_theme=' + theme);
  db.close();
});
