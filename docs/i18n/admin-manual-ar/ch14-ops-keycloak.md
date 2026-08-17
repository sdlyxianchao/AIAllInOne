# الفصل 14: الإدارة اليومية لـ Keycloak

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> مركز المصادقة: إدارة المستخدمين والأدوار وعملاء OIDC واتحاد AD والجلسات.

[← الفصل 13: قائمة التحقق من الترابط](ch13-interconnect.md) · [📖 الفهرس](index.md) · [الفصل 15: الإدارة اليومية لـ NewAPI →](ch15-ops-newapi.md)

---

**المدخل**: `http://<عنوان-IP-الخادم>:9090` ← Administration Console ← تسجيل دخول المدير.

> 📌 يمكن تنفيذ كثير من هذه العمليات أيضاً من مركز إدارة AI → صفحة Keycloak (للمسؤول العام فقط): مزامنة LDAP الكاملة/التزايدية، حذف المستخدمين، وإدارة الأدوار (عرض/إنشاء/حذف/عرض الأعضاء). انظر الفصل 12.6.

## 14.1 إدارة المستخدمين

1. **إنشاء مستخدم**: Users ← Add user ← اكتب اسم المستخدم ← Create؛

2. **تعيين كلمة المرور**: من تبويب Credentials الخاص بالمستخدم ← عيّن كلمة المرور ← أوقف خيار Temporary (وإلا سيُجبر على تغييرها عند أول تسجيل دخول)؛

3. **إعادة تعيين كلمة المرور**: Users ← ابحث عن المستخدم ← Credentials ← Set password؛

4. **التعطيل/التفعيل**: مفتاح Enabled أعلى تفاصيل المستخدم (عند التعطيل تتوقف جميع جلسات SSO الخاصة به فورًا)؛

5. **الحذف**: تفاصيل المستخدم ← Delete.

## 14.2 الأدوار والصلاحيات

- **دور Realm**: Realm roles ← Create role لإنشاء دور (مثل `ai-platform-admin`)؛

- **تخصيص الدور**: المستخدم ← Role mapping ← Assign role؛

- **المجموعات**: Groups ← أنشئ مجموعة (`ai-admin` / `ai-user`) ← أضف المستخدمين إلى المجموعة، وخصّص الأدوار للمجموعة ليرث المستخدمون الصلاحيات عبر المجموعة.

> ✅ تُدار صلاحيات الإدارة بشكل موحد عبر دور `ai-platform-admin`، وتستخدم المنتجات هذا الدور لتحديد المدير عند ربط SSO.

## 14.3 عملاء OIDC (ربط المنتجات الجديدة بـ SSO)

1. Clients ← Create client ← اكتب اسم المنتج في Client ID (مثل `newapi` / `grafana` / `langfuse`)؛

2. Client authentication: On (وإلا لن يظهر تبويب Credentials)، وStandard flow: On؛

3. اكتب عنوان رد نداء المنتج في Valid redirect URIs / Web origins (أضف عنوان IP الداخلي و127.0.0.1 معًا)؛

4. احفظ ← انسخ Client secret من تبويب Credentials وسلّمه إلى المنتج.

## 14.4 صيانة اتحاد AD / LDAP

- **تغيير نطاق التحكم/كلمة المرور**: User Federation ← انقر على LDAP Provider ← غيّر Connection URL / Bind credentials ← Save؛

- **المزامنة اليدوية**: Synchronize all users؛

- **تعيين المجموعات**: من تبويب Mappers ← group-ldap-mapper ← عيّن Groups DN إلى الحاوية التي توجد بها مجموعات AD، واربط مجموعات AD بأدوار Keycloak.

## 14.5 إدارة الجلسات

- **عرض الجلسات النشطة**: Users ← مستخدم معين ← Sessions؛

- **تسجيل الخروج القسري**: Sessions ← Sign out all؛

- **إعداد الجلسات/الرموز العامة**: من Realm settings ← تبويب Sessions / Tokens لضبط المهلة.

> ⚠️ مراجعة النقاط الحرجة: ① حافظ على المسافات في CN الخاص بـ bind DN كما هي؛ ② استخدم `sAMAccountName` في Username LDAP attribute وليس `cn`؛ ③ اختر Subtree في Search scope؛ ④ عند ظهور `unknown_error` في SSO فغالبًا يرجع السبب إلى عدم تشغيل iphlpsvc في المضيف مما يعطّل إعادة توجيه منافذ AD؛ ⑤ عندما يكون جهاز نطاق التحكم AD غير مشغّل يظهر `LDAP Connection refused` عند تسجيل دخول حسابات اتحاد LDAP.

> 📖 الوثائق الرسمية:وثائق Keycloak الرسمية https://www.keycloak.org/documentation · دليل إدارة الخادم https://www.keycloak.org/server/

---

[← الفصل 13: قائمة التحقق من الترابط](ch13-interconnect.md) · [📖 الفهرس](index.md) · [الفصل 15: الإدارة اليومية لـ NewAPI →](ch15-ops-newapi.md)
