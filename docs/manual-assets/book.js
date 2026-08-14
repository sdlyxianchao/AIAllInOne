/* ============================================================
   AI AllInOne 手册电子书 · 共享导航脚本
   依赖：先加载 nav-admin.js / nav-user.js（定义 window.BOOK_TOC）
   再加载本脚本。页面内需先设置 window.CURRENT_ID。
   ============================================================ */
(function () {
  var TOC = window.BOOK_TOC;
  var current = window.CURRENT_ID || '';
  if (!TOC) return;

  /* ---------- 渲染侧边栏 ---------- */
  function renderSidebar() {
    var sb = document.getElementById('sidebar');
    if (!sb) return;

    var html = '<div class="brand">';
    html += '<a class="home-link" href="' + TOC.home + '"><h1>' + TOC.icon + ' ' + TOC.title + '</h1></a>';
    html += '<div class="ver">' + TOC.subtitle + '</div></div>';

    (TOC.parts || []).forEach(function (part) {
      if (part.label) html += '<div class="toc-part-label">' + part.label + '</div>';
      html += '<div class="toc-items">';
      (part.items || []).forEach(function (it) {
        var cls = (it.id === current) ? ' class="active"' : '';
        html += '<a href="' + it.file + '"' + cls + '><span class="num">' + it.n + '</span>' + it.title + '</a>';
      });
      html += '</div>';
    });

    sb.innerHTML = html;
  }

  /* ---------- 渲染上一页 / 下一页 ---------- */
  function flatten() {
    var list = [];
    (TOC.parts || []).forEach(function (p) {
      (p.items || []).forEach(function (it) { list.push(it); });
    });
    return list;
  }
  function renderPager() {
    var pager = document.getElementById('pager');
    if (!pager) return;
    var list = flatten();
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === current) { idx = i; break; }

    var prev = idx > 0 ? list[idx - 1] : null;
    var next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

    var html = '';
    if (prev) {
      html += '<a class="prev" href="' + prev.file + '"><span class="dir">← 上一章</span><span class="ttl">' + prev.n + ' ' + prev.title + '</span></a>';
    } else {
      html += '<a class="prev" href="' + TOC.home + '"><span class="dir">← 返回封面</span><span class="ttl">目录</span></a>';
    }
    if (next) {
      html += '<a class="next" href="' + next.file + '"><span class="dir">下一章 →</span><span class="ttl">' + next.n + ' ' + next.title + '</span></a>';
    } else {
      html += '<a class="next" href="' + TOC.home + '"><span class="dir">全书完 · 返回封面</span><span class="ttl">目录</span></a>';
    }
    pager.innerHTML = html;
  }

  renderSidebar();
  renderPager();
})();
