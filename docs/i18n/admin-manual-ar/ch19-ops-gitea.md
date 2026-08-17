# الفصل 19: الإدارة اليومية لـ Gitea

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> Git داخلي + CI/CD: المستودعات والمنظمات وRunner وActions.

[← الفصل 18: الإدارة اليومية لـ Ghost](ch18-ops-ghost.md) · [📖 الفهرس](index.md) · [الفصل 20: الإدارة اليومية لـ MCP Gateway →](ch20-ops-mcp.md)

---

**المدخل**: الويب `http://<عنوان-IP-الخادم>:3002`؛ وSSH `ssh://git@<عنوان-IP-الخادم>:2222`.

## 19.1 المستودعات والمنظمات

1. **إنشاء مستودع**: علامة + أعلى اليمين ← New repository؛

2. **إنشاء منظمة**: + ← New organization، وأنشئ المستودعات وأدر الفرق تحت المنظمة؛

3. **ترحيل مستودع خارجي**: + ← New migration، واكتب عنوان GitHub لعمل mirror (مزامنة للمصدر للقراءة فقط).

## 19.2 المستخدمون والصلاحيات

- **إضافة مستخدم**: Site Administration ← User Accounts ← Create user؛

- **صلاحيات المستودع**: المستودع ← Settings ← Collaborators؛

- **فرق المنظمة**: المنظمة ← Teams ← أنشئ فريقًا ← أضف الأعضاء ← امنح صلاحيات المستودع.

## 19.3 إدارة Actions / Runner

1. **تفعيل Actions**: Site Administration ← Actions ← Enabled؛

2. **تسجيل Runner**: Runners ← Create new Runner ← انسخ الرمز ← اكتبه في `GITEA_RUNNER_TOKEN` داخل `.env` ← `docker compose up -d gitea-runner`؛

3. **الاطلاع على حالة Runner**: عرض صفحة Runners لحالة Idle (بالأخضر) التي تعني أنه سليم؛

4. **تشغيل سير العمل**: المستودع ← Actions ← التشغيل اليدوي أو التشغيل عند push.

> ⚠️ عند تغيير رمز Runner يجب استخدام `up -d` (لأن restart لا يعيد قراءة .env).

## 19.4 إعدادات الموقع

- **ROOT_URL**: يجب ضبط `GITEA__server__ROOT_URL` إلى العنوان الداخلي `http://<عنوان-IP-الخادم>:3002/` وإلا ستُولَّد روابط المستودعات بصيغة localhost؛

- **سياسة التسجيل**: Site Administration ← Config لضبط مفتاح التسجيل وإعداد البريد الإلكتروني.

> ⚠️ نقطة حرجة: خطأ `readonly database` غالبًا لأن مالك `gitea.db` هو root؛ احذف قاعدة البيانات التي يملكها root ليعاد إنشاؤها بحساب المستخدم git.

> 📖 الوثائق الرسمية:وثائق Gitea الرسمية (بالصينية) https://docs.gitea.com/zh-cn · الإدارة https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← الفصل 18: الإدارة اليومية لـ Ghost](ch18-ops-ghost.md) · [📖 الفهرس](index.md) · [الفصل 20: الإدارة اليومية لـ MCP Gateway →](ch20-ops-mcp.md)
