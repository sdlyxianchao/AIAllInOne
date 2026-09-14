/* Corp Portal Theme — 交互脚本 */
(function () {
    "use strict";

    /* 移动端导航切换 */
    var toggle = document.getElementById("navToggle");
    var nav = document.querySelector(".site-nav");
    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    /* 内网产品入口：MCP/SKILL Market 部署在宿主机 3100 端口（去掉当前端口得到基础地址，再拼 :3100/market） */
    var productBase = window.location.origin.replace(/:\d+$/, "");
    document.querySelectorAll("[data-mcp-market-link]").forEach(function (el) {
        el.setAttribute("href", productBase + ":3100/market");
    });

    /* 回到顶部按钮 */
    var toTop = document.getElementById("toTopBtn");
    if (toTop) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 400) {
                toTop.classList.add("is-visible");
            } else {
                toTop.classList.remove("is-visible");
            }
        }, { passive: true });

        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
})();
