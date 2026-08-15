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
