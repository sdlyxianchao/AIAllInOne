# AI AllInOne — منصة ذكاء اصطناعي مؤسسية مفتوحة المصدر للاستضافة الذاتية

> 📖 **اللغة**: [English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **العربية**

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

> **خادم واحد. حساب واحد. حزمة ذكاء اصطناعي مؤسسية متكاملة — مفتوحة المصدر ومجانية، والبيانات لا تغادر الإنترانت.**

AI AllInOne هي منصة ذكاء اصطناعي **مفتوحة المصدر ومجانية** وجاهزة للاستخدام داخل إنترانت المؤسسة: دخول موحّد (SSO)، توجيه نماذج LLM، تطبيقات ذكاء اصطناعي، بوابة المؤسسة، الشيفرة المصدرية/CI، إدارة موحّدة، مراقبة وتنبيهات، قابلية الملاحظة، سجلات، ونسخ احتياطي واستعادة — كل ذلك مُنسّق معًا بواسطة Docker في حزمة واحدة. **يستطيع الموظف تسجيل الدخول مرة واحدة بحساب واحد لاستخدام جميع أدوات الذكاء الاصطناعي.**

![مركز إدارة الذكاء الاصطناعي (AI Admin Center)](<../pics/AI Admin.png>)

![بوابة المؤسسة](<../pics/AI All In One Hub.png>)

---

## ✨ لماذا تختار AI AllInOne

| | |
|---|---|
| 🧩 **حزمة متكاملة بلا تجميع** | أكثر من 8 مكونات مفتوحة المصدر مدمجة مسبقًا: المصادقة، البوابة، التطبيقات، بوابة المؤسسة، Git، المراقبة، السجلات، النسخ الاحتياطي. لا حاجة إلى "تجميع" يدوي. |
| 🔐 **دخول موحّد (SSO)** | حساب واحد في Keycloak (يدعم الاتحاد مع AD/LDAP) يسجّل الدخول تلقائيًا إلى جميع المنتجات دون الحاجة إلى كلمة مرور إضافية. |
| 🔒 **البيانات لا تغادر الإنترانت** | استضافة ذاتية بالكامل — استدعاءات النماذج والوعود والوثائق وبيانات المستخدمين تبقى داخل المؤسسة. |
| ⚡ **نشر في نحو 30 دقيقة** | `docker compose` + نصوص برمجية آلية، أو دع وكيل الذكاء الاصطناعي ينشر لك البيئة كاملة. |
| 🛡️ **إخفاء PII** | المعلومات الحساسة مثل رقم الهاتف/رقم الهوية/البريد الإلكتروني تُخفى تلقائيًا قبل استدعاء النماذج الخارجية (Presidio). |
| 📊 **قابلية ملاحظة على كامل المسار** | مراقبة عبر Prometheus + Grafana، تتبّع LLM عبر Langfuse، سجلات موحّدة عبر Loki، وتنبيهات عبر تراسل المؤسسة (DingTalk/WeCom/Feishu). |
| 💾 **نسخ احتياطي واستعادة** | نسخ احتياطي كامل يومي واستعادة بنقرة واحدة من لوحة الإدارة. |
| 🌐 **9 لغات** | الأدلة وواجهة الإدارة متعددة اللغات (صينية مبسطة/صينية تقليدية/إنجليزية/فرنسية/إسبانية/برتغالية/يابانية/كورية/عربية). |

## 📦 قائمة المكونات

| الطبقة | المكوّن | الوظيفة |
|---|---|---|
| المصادقة | Keycloak | SSO / OIDC، اتحاد AD/LDAP أو حسابات محلية |
| توجيه LLM | NewAPI | القنوات والمفاتيح والحصص والتدقيق والتكاليف |
| إخفاء PII | LiteLLM + Presidio | إخفاء المعلومات الحساسة تلقائيًا قبل استدعاء النماذج |
| تطبيقات الذكاء الاصطناعي | Dify | تطبيقات ذكاء اصطناعي مرئية / منصة وكلاء + قاعدة معرفة موحّدة (RAG) |
| بوابة المؤسسة | Ghost | بوابة إعلانات وأخبار الشركة (تتضمن قالب Corp Portal مخصصًا مدمجًا) |
| الشيفرة المصدرية / CI | Gitea + Runner | Git داخلي + أتمتة Actions |
| العميل | DeepChat | عميل ذكاء اصطناعي محلي لسطح المكتب (Windows / macOS / Linux) |
| توزيع العميل | Update Server | استضافة حزم تثبيت DeepChat وتحديثها تلقائيًا |
| الإدارة الموحّدة | AI Admin Center | نقطة دخول موحّدة: لوحة تحكم + منتجات مدمجة + تدقيق/تكاليف/تقارير + تفويض إداري متدرج + مزامنة/أدوار Keycloak |
| البوابة | MCP Gateway | سوق المهارات/MCP + استرجاع معرفة Dify (RAG) |
| المراقبة | Prometheus + Grafana + Alertmanager | مراقبة موارد الحاويات + إشعارات التنبيه |
| قابلية ملاحظة LLM | Langfuse | تتبّع زمن الاستجابة والرموز (tokens) وتكلفة كل استدعاء للنموذج |
| السجلات الموحّدة | Loki + Promtail | تجميع سجلات جميع الحاويات، قابلة للبحث حسب الحاوية/الكلمة المفتاحية/الوقت |
| النسخ الاحتياطي والاستعادة | نصوص برمجية + صفحة إدارة | نسخ احتياطي كامل يومي + استعادة بنقرة واحدة |

### البنية وتدفق البيانات

![نظرة عامة على البنية](<../pics/Architecture.png>)

![تدفق البيانات](<../pics/DataFlow.png>)

---

## 🚀 البداية السريعة

**المتطلبات المسبقة**: جهاز مثبّت عليه Docker (Windows 11 + Docker Desktop، أو Linux) مع إمكانية الوصول إلى مستودع صور Docker.

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# شغّل الخدمات الأساسية، ثم ابدأ تهيئة المصادقة / قنوات LLM / المنتجات وفق دليل النشر
docker compose up -d
```

بعد ذلك لديك خياران:

1. **النشر التلقائي (موصى به)** — فوّض النشر إلى وكيل الذكاء الاصطناعي (WorkBuddy / OpenClaw / Microsoft Scout). سيقرأ وثائق النشر وملفات الإعدادات، ويجمع منك المعاملات (عنوان IP الخادم، مصدر الهوية، حساب المسؤول، مفاتيح LLM)، ثم يُنجز جميع الإعدادات خطوة بخطوة. [عرض نص موجّه النشر بنقرة واحدة ←](../windows/windows-deploy-guide-v2.md)

#### 🤖 النشر بالذكاء الاصطناعي — بضغطة واحدة، بقيادة وكيل ذكاء اصطناعي

> منقولة من دليل النشر (الفصل 0) : يمكن تنفيذ الدليل **فصلاً بفصل يدوياً**، أو تسليمه بالكامل إلى **وكيل ذكاء اصطناعي** (WorkBuddy / OpenClaw / Microsoft Scout). أعطِ هذا المجلد (الدليل، `windows-checklist.html`، `docker-compose.yml`، `.env.example`، `scripts/`)، والصق المطالبة أدناه، وسيقوم الوكيل بـ : تحديد المنصة ← جمع معاملاتك واحداً تلو الآخر ← إنشاء ملف تقدم محلي ← التهيئة خطوة بخطوة وفق الدليل ← الاختبار والتصحيح وإعادة المحاولة عند الفشل ← تحديث التقدم باستمرار ← تنفيذ تحقق كامل من البداية إلى النهاية والإبلاغ بالنتائج.

**المطالبة التي يجب نسخها إلى وكيلك** (منصة Windows، بالصينية — سيقوم الوكيل بإرشادك خطوة بخطوة) :

````text
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
````

> 💡 حتى لو **لم تستخدم وكيلاً**، تصلح هذه المطالبة كقائمة تحقق قبل النشر — فهي تسرد جميع المعاملات التي تحتاج إلى تجهيزها قبل البدء.

2. **النشر اليدوي** — اتبع [دليل نشر Windows](../windows/windows-deploy-guide-v2.md) خطوة بخطوة (بالتزامن مع قائمة التقدم `windows-checklist.html`).

> **حالة المنصة**: Windows (Windows 11 + Docker Desktop) **قيد الاختبار الفعلي**. أما Linux/macOS (`linux/`) والخوادم عبر الإنترنت (`docker/`) ففي طور التخطيط — راجع [خارطة الطريق](#roadmap).

## 🖼️ لقطات الشاشة

**Dify** — منصة تطبيقات الذكاء الاصطناعي · **سوق MCP/المهارات** — دمج الأدوات والمهارات بنقرة واحدة · **DeepChat** — عميل ذكاء اصطناعي لسطح المكتب

![Dify](<../pics/Dify.png>) ![سوق MCP/SKILL](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

لقطات شاشة إضافية (48 لقطة شاشة حقيقية للواجهة) مدمجة في [دليل المسؤول](../docs/admin-manual/index.md).

## 📚 الأدلة (متاحة عبر الإنترنت، 9 لغات)

| الدليل | اللغة |
|---|---|
| **دليل المسؤول** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **دليل المستخدم** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

للصيانة اليومية عبر وكيل الذكاء الاصطناعي راجع **[دليل تشغيل وكيل الذكاء الاصطناعي](../AI-AGENT-OPS.md)**.

## 👥 المجتمع

> مجموعة WeChat — للتواصل والاستفسار عن النشر وتقديم الملاحظات و**البناء المشترك**. امسح رمز QR لإضافة صديق وسيتم إضافتك إلى المجموعة.

<img src="../pics/wechat.png" alt="رمز QR لمجموعة WeChat" width="200" />

كما نرحب باستخدام [مناقشات GitHub](https://github.com/sdlyxianchao/AIAllInOne/discussions) (أو فتح [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues) مباشرة).

## 🤝 المشاركة في البناء

هذا المشروع **مفتوح المصدر ومجاني**، وينمو بفضل المجتمع. مهما كان مستواك، هناك طريقة تناسبك:

- ⭐ **أضف نجمة إلى المستودع** — أبسط دعم وأكثرها قيمة
- 🐛 **الإبلاغ عن أخطاء / طلب ميزات** — افتح issue واكتب خطوات إعادة الإنتاج بوضوح
- 📝 **كتابة الوثائق والدروس** — أدلة النشر وخبرات حل المشكلات وأفضل الممارسات
- 🌐 **الترجمة** — الأدلة متوفرة بـ9 لغات، ساعدنا في تحسينها أو إضافة المزيد
- 🧪 **الاختبار والمشاركة** — انشر مرة واحدة وأخبرنا بما يعمل جيدًا وما هي العثرات
- 💻 **المساهمة في الكود** — طبقة التكامل (الدخول الموحّد SSO وبوابة الإدارة والمراقبة والنسخ الاحتياطي) هي أفضل نقطة للبدء

الدليل الكامل في [CONTRIBUTING.md](../CONTRIBUTING.md)، ويمكن الاطلاع على الخطط القادمة في [خارطة الطريق](#roadmap) المعلنة. **كل مساهم سيُدرج اسمه في قائمة المساهمين في README.**

<h2 id="roadmap">🗺️ خارطة الطريق</h2>

- ✅ v0.9x — منصة Windows: الحزمة المتكاملة + مركز إدارة الذكاء الاصطناعي + تفويض إداري متدرج + تنبيهات التراسل المؤسسي + التخزين المؤقت الدلالي (LiteLLM redis-semantic)
- 🚧 **Linux / macOS** — دعم خوادم Linux للاستضافة الذاتية (`linux/`)
- 🚧 **الخادم عبر الإنترنت** — نشر إنتاجي عبر Docker نقي / السحابة (`docker/`)
- 🚧 **برنامج البنّائين المشتركين** — لوحة مهام واجتماع مزامنة أسبوعي وشهادة شركاء النشر

## 🔒 ملاحظات الأمان

- لا يحتوي هذا المستودع على **أي مفاتيح حقيقية**؛ القيم الحقيقية موجودة فقط في ملف `.env` لكل بيئة تشغيل (لا يُرفع في المستودع سوى قالب `.env.example`).
- HTTP نصي افتراضيًا داخل الإنترانت؛ راجع أدلة نشر كل منصة لإعداد HTTPS.
- المخاطر وجداول المنافذ وتدفق البيانات لكل منصة موجودة في وثائق `*-deploy-guide*.html` المقابلة.

## 📄 الترخيص

[MIT](../LICENSE) — حر في الاستخدام والتعديل والتوزيع. تحتفظ المكونات المدمجة بتراخيصها الخاصة (راجع فصل مراجعة التراخيص في دليل النشر).

## 🤖 عمليات وكيل الذكاء الاصطناعي

صُممت المنصة لتُدار وتُصان **عبر وكيل ذكاء اصطناعي** — WorkBuddy أو OpenClaw أو Microsoft Scout أو أي أداة مكافئة. بدلاً من النقر عبر عشرات لوحات الإدارة، تخبر الوكيل بما تريده بلغة طبيعية؛ فيقرأ الملفات وينفذ الأوامر ويتواصل مع الخدمات نيابة عنك.

كل ما يشغّل المنصة يعيش على جهازك كـ**كود وإعدادات وبيانات** — خدمات Docker Compose، ملفات `.env`، واجهات الإدارة، وقواعد البيانات/الملفات التي تحفظ الحالة الفعلية — لذلك يستطيع الوكيل رؤية كل ذلك وتغييره :

| 任务 | Agent 的做法 |
|---|---|
| فحص الصحة / نظرة عامة على الحالة | `docker ps` + نقاط الصحة + واجهات الإدارة |
| بدء / إعادة تشغيل / إيقاف الخدمات | `docker compose up -d <svc>` / `docker restart <svc>` |
| فحص السجلات والأخطاء | `docker logs <svc> --tail N` + ملفات السجل |
| تغيير الإعدادات | تعديل ملفات الإعداد ثم إعادة تشغيل الحاوية المعنية |
| تعديل مركز الإدارة الذكي | تعديل `admin-portal/public/index.html` (الواجهة) أو `admin-portal/server.js` (API) ثم إعادة التشغيل |
| إدارة Gitea والمزامنة | واجهة Gitea : تشغيل سير العمل، قراءة الحالة/السجلات، تعديل ملفات المستودع |
| إدارة بوابة Ghost | قراءة/كتابة قاعدة بيانات Ghost SQLite، تعديل القوالب، استيراد المحتوى |
| النسخ الاحتياطي والاستعادة | `scripts/backup.ps1` / `scripts/restore.ps1` |
| نشر إصدار | `publish.ps1` (بناء + التزام + دفع إلى GitHub) |
| استكشاف الأخطاء | تعارض المنافذ، مشاكل Docker Desktop، DNS/الوكيل، إلخ. |

مثال : *« تحقق من أن جميع الخدمات تعمل وبصحة جيدة »* — ينفذ الوكيل `docker ps`، ويستعلم كل نقطة صحة، ويخبرك بما هو معطل ولماذا. للمطالبات الجاهزة وأفضل الممارسات والمرجع الكامل للأوامر، انظر **[دليل عمليات وكيل الذكاء الاصطناعي](../AI-AGENT-OPS.md)** (9 لغات).

### 🛡️ عمليات الذكاء الاصطناعي — فحص الصحة بأمر واحد والتشغيل التلقائي

> منقولة من دليل النشر (الفصل 12) : تتضمن المنصة **فحص صحة بأمر واحد** (`health-check.ps1`) يتحقق من **41 حاوية في 9 مراحل** — بما في ذلك سلسلة LLM الكاملة، ومصادقة AD + تسجيل دخول المسؤول، ووظائف MCP/Skill، ومساحة القرص. تُقرأ بيانات الاعتماد من `.env`؛ ولا يحتوي السكربت على كلمات مرور ثابتة. فقط اطلب من وكيل الذكاء الاصطناعي تشغيله (مثل : *« نفّذ فحص الصحة وأخبرني ما الذي يفشل »*)، أو اتركه يعمل تلقائياً عند كل تسجيل دخول :

| المرحلة | عنصر الفحص | الطريقة |
|---|---|---|
| Stage 1 | هل يعمل daemon الخاص بـ Docker (ينتظر الجاهزية، ليفي بمتطلبات بدء التشغيل التلقائي) | `docker info` |
| Stage 2 | حالة 41 حاوية (Up/Exited/Restarting) | `docker ps -a` |
| Stage 3 | استجابة 10 نقاط HTTP (بما فيها MCP Gateway) | `curl.exe 127.0.0.1:المنفذ` |
| Stage 4 | LiteLLM /readiness + **تسجيل النماذج**، litellm-redis PING، Dify API /health، حالة MySQL/PostgreSQL/Redis/Sandbox | `docker exec` + `docker inspect` |
| Stage 5 | **سلسلة LLM كاملة** : حالة قنوات NewAPI + طلب حقيقي واحد باسم DeepChat و Dify (NewAPI → LiteLLM → DeepSeek) | `curl /v1/chat/completions` |
| Stage 6 | **سلسلة مصادقة AD** : Keycloak well-known + مزامنة مستخدمي AD (aitest1) + إعداد OIDC في NewAPI + سلامة عملاء OIDC + **تسجيل دخول مدير NewAPI** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill** : /health + tools/list + tools/call + تجميع Skills الخارجية | curl (بروتوكول MCP) |
| Stage 8 | **متطلبات تسجيل دخول DeepChat / Dify** : توفر NewAPI + تهيئة Dify | curl + psql |
| Stage 9 | **مساحة القرص** : المتبقي في قرص النظام + استخدام Docker | `Get-PSDrive` + `docker system df` |

**التشغيل اليدوي** (PowerShell) :

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**التشغيل التلقائي عند تسجيل الدخول** (مهمة مجدولة — شغّل PowerShell كمسؤول) :

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
