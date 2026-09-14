# الفصل 12: مركز إدارة الذكاء الاصطناعي

*الجزء الأول · قسم النشر*

> بوابة المدير الموحدة: مصادقة Keycloak، وتضمين جميع المنتجات في القائمة اليسرى، وحالة المجموعة في Dashboard.

[← الفصل 11: MCP Gateway وسوق المهارات (Skill)](ch11-mcp.md) · [📖 الفهرس](index.md) · [الفصل 13: قائمة التحقق من الترابط →](ch13-interconnect.md)

---

> 📌 التموضع: ليست منصة إدارة Docker (مثل 1Panel/Portainer)، بل لوحة إدارة موحدة للمديرين — مصادقة Keycloak + روابط لجميع المنتجات في القائمة اليسرى + حالة المجموعة في Dashboard + حساب مدير موحد.

## 12.1 القدرات الأساسية

| عنصر القائمة | السلوك | الوصف |
| --- | --- | --- |
| 📊 لوحة النظرة العامة | صفحة مضمّنة | مؤشرات أعمال 8 منتجات + خدمات Docker (مجمعة حسب المنتج) + معلومات النظام |
| Ghost / Dify / Gitea / Keycloak | صفحة إحصاءات مضمّنة | اعرض الإحصاءات أولًا، ولا يُنقَل إلا عند النقر على «فتح اللوحة» |
| 🔀 إدارة NewAPI | صفحة مضمّنة | القنوات/المستخدمون/المفاتيح + تقارير التكلفة + سجلات التدقيق |
| 🔌 MCP Gateway | صفحة إدارة مضمّنة | إضافة/حذف خوادم MCP ورفع/حذف المهارات |
| 📈 المراقبة / 🔍 قابلية المراقبة | تبويب جديد | Grafana :3030 / Langfuse :3010 |
| 📜 السجلات الموحدة | صفحة مضمّنة | الاستعلام في Loki حسب الحاوية + الكلمة المفتاحية + الوقت |
| 💾 النسخ الاحتياطي والاستعادة | صفحة مضمّنة | قائمة النسخ + نسخ فوري + استعادة بضغطة واحدة |
| 🩺 اختبار التوفر | صفحة مضمّنة | اختبار المسار الكامل دوريًا + يدويًا |
| 📄 توليد التقارير | صفحة مضمّنة | تصدير بصيغة .md بفترات مخصصة |
| ⚙️ إعدادات النظام | صفحة مضمّنة | 9 لغات للواجهة + عناوين URL لمداخل المنتجات |

## 12.2 تهيئة Global Administrator

```
# الإعداد في .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=انظر قائمة أسماء المستخدمين وكلمات المرور
ADMIN_EMAIL=ai_all_in_one_admin@<نطاق-الشركة>
```

بعد التشغيل يُنشأ المستخدم `ai_all_in_one_admin` تلقائيًا في Keycloak (ويتخطى الإنشاء إن كان موجودًا)، ويُمنح دور Realm `ai-platform-admin`. الفكرة الأساسية: **حساب Global Admin واحد يدير المنصة كلها**.

## 12.3 النشر عبر Docker Compose

```
# المتطلب المسبق: ثبّت التبعيات أولًا (مرة واحدة)
cd admin-portal
npm install
cd ..
```

```
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports: ["10086:3000"]
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://<عنوان-IP-الخادم>:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<نطاق-الشركة>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<عنوان-IP-الخادم>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks: [ai-platform]
```

## 12.4 إعداد عميل Keycloak

1. Keycloak ← enterprise-ai ← Clients ← Create؛

2. Client ID `AI-all-in-one-admin-portal` مع تفعيل Client authentication / Standard flow؛

3. Valid Redirect URIs: `http://127.0.0.1:10086/*` و`http://<عنوان-IP-الخادم>:10086/*`؛

4. انسخ Client Secret ← اكتبه في `KEYCLOAK_CLIENT_SECRET` داخل `.env` ← `docker compose up -d admin-portal`؛

5. أنشئ دور Realm `ai-platform-admin` وخصّصه إلى `ai_all_in_one_admin`.

> ⚠️ نقاط مهمة في النشر/استكشاف الأخطاء:
> - تُخزَّن جلسات admin-portal في الذاكرة، وإعادة بناء الحاوية عبر `up -d` ستؤدي إلى **مسح جلسات تسجيل الدخول** (ويلزم إعادة الدخول)؛
> - يجب حماية الصفحة الرئيسية `/` بواسطة Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` صراحةً)، وإلا ستُعرض لوحة فارغة عند عدم تسجيل الدخول؛
> - استخدم البريد الإلكتروني الفعلي للمدير (`ai_all_in_one_admin@<نطاق-الشركة>`، المطابق للمسؤول العام في AD) في إحصاءات Dify؛
> - **بعد تعديل server.js يجب تنفيذ `docker restart admin-portal`**، ولا تستخدم `up -d` (لأن تغيير محتوى ملف الحجم لا يؤدي إلى إعادة البناء).

## 12.5 التحقق

1. افتح `http://<عنوان-IP-الخادم>:10086` ← سينتقل تلقائيًا إلى تسجيل الدخول في Keycloak (لا تظهر لوحة فارغة دون تسجيل الدخول)؛

2. سجّل الدخول بـ `ai_all_in_one_admin` ← ادخل إلى لوحة النظرة العامة؛

3. تعرض Dashboard مؤشرات 8 منتجات + تجميع الحاويات؛

4. عند النقر على أي منتج تُعرض الإحصاءات أولًا، ولا يُنقَل إلا عند النقر على «فتح اللوحة»؛

5. يمكن التبديل بين 9 لغات من إعدادات النظام.

## 12.6 تفويض المسؤول لكل وحدة + إدارة صفحة Keycloak (v0.91)

يمكن للمسؤول العام إدارة المسؤولين الآخرين و Keycloak من مركز إدارة AI:

- **حسابات المسؤولين**: ابحث عن حساب موجود في موفّر الهوية Keycloak (مستخدمو AD/LDAP، لا إنشاء حساب جديد ولا كلمة مرور) → اختر الوحدات → تأكيد. يمنح النظام دور Realm `admin:<المنتج>` و**يفعّل المنتج فعلياً** (SSO أولاً ثم API): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. إلغاء وحدة أو حذف مسؤول **يحذف الحساب من المنتج**. المنتجات بدون SSO تولّد كلمة مرور مؤقتة تُعرض عبر أيقونة 🔑 (للمسؤول العام فقط). يرى غير المسؤولين رسالة «لست مسؤولاً» ويُسجّل خروجهم.

- **صفحة Keycloak**: زرّا «مزامنة الكل / مزامنة التغييرات» لجلب تغييرات AD بنقرة واحدة؛ كل صف مستخدم فيه «تعديل» (إلى وحدة تحكم Keycloak) و«حذف»؛ قسم الأدوار يدعم إنشاء/حذف الأدوار وعرض الأعضاء. عمليات المزامنة/الحذف/الأدوار للمسؤول العام فقط.

> ⚠️ ملاحظة: لا يوجد في Keycloak نقطة نهاية «لمزامنة مستخدم واحد» — المزامنة التزايدية تجلب كل حسابات AD المتغيّرة. يظهر المستخدمون المربوطون بـ AD مجدداً بعد المزامنة الكاملة التالية أو تسجيل الدخول التالي عبر SSO؛ ولإزالتهم نهائياً، عطّل/احذف الحساب في AD.

---

[← الفصل 11: MCP Gateway وسوق المهارات (Skill)](ch11-mcp.md) · [📖 الفهرس](index.md) · [الفصل 13: قائمة التحقق من الترابط →](ch13-interconnect.md)
