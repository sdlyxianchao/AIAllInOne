# الفصل 6: Keycloak: Realm والمستخدمون وAD

*الجزء الأول · قسم النشر*

> إنشاء Realm وحسابات محلية، أو استيراد حسابات النطاق من Active Directory — وهو أساس SSO لجميع المنتجات.

[← الفصل 5: نشر Dify المستقل](ch05-dify-deploy.md) · [📖 الفهرس](index.md) · [الفصل 7: NewAPI: التهيئة والقنوات وOIDC →](ch07-newapi.md)

---

> 📌 الوصول: على المضيف `http://127.0.0.1:9090`، وعلى الشبكة الداخلية `http://<عنوان-IP-الخادم>:9090`. تُخزَّن البيانات في الحجم المسمى `keycloak-data` ولا تُفقد عند إعادة بناء الحاوية. راجع بيانات الدخول في `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` داخل `.env.windows`.

## 6.1 إنشاء Realm

1. افتح `http://127.0.0.1:9090` في المتصفح ← Administration Console ← تسجيل دخول المدير؛

2. من القائمة المنسدلة أعلى اليسار ← **Create Realm** ← اكتب `enterprise-ai` في Realm name ← Create.

## 6.2 الطريقة A: إنشاء حسابات محلية (للفرق الصغيرة/الاختبار بدون AD)

1. **Groups** ← Create Group ← `ai-admin`؛ ثم أنشئ `ai-user`؛

2. **Users** ← Add user ← اسم المستخدم ← Create؛

3. من تبويب Credentials ← عيّن كلمة المرور ← أوقف خيار Temporary؛

4. من تبويب Groups ← أضف إلى مجموعة `ai-user`.

## 6.3 الطريقة B: استيراد الحسابات من Active Directory (موصى بها)

عندما يكون لدى الشركة نطاق Windows AD بالفعل، يسجّل الموظفون الدخول بحسابات النطاق دون الحاجة لإنشاء حسابات يدويًا في Keycloak. المتطلب المسبق: أن تكون شبكة حاويات Docker متصلة بشبكة نطاق التحكم (راجع طوبولوجيا الشبكة وHyper-V Internal Switch وإعادة توجيه المنافذ في «دليل دمج Keycloak مع AD» `windows-ad-integration.html`).

> 📌 حسابات AD المطلوبة: حساب خدمة `svc_keycloak` (كلمة مروره لا تنتهي، ويُستخدم لربط LDAP) + مستخدما نطاق للاختبار (للتحقق من المزامنة).

### إنشاء اتحاد مستخدمي LDAP

1. من Realm الخاص بـ enterprise-ai ← في اليسار **User Federation** ← Add provider ← **ldap**؛

2. املأ وفقًا للجدول التالي.

| عنصر الإعداد | القيمة | الوصف |
| --- | --- | --- |
| Vendor | **Active Directory** | اختر AD ولا تختر Other (وإلا لن يتعرف على objectGUID) |
| Connection URL | `ldap://host.docker.internal:389` | عبر Hyper-V مع إعادة توجيه المنافذ؛ في الإنتاج اكتب `ldap://dc.نطاق_الشركة:389` |
| Enable StartTLS | **Off** | LDAP 389 أو LDAPS 636 |
| Bind type | **simple** | مصادقة باسم المستخدم + كلمة المرور |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **يجب استخدام صيغة LDAP DN** وليس ~~DOMAIN\المستخدم~~ |
| Bind credentials | `كلمة مرور svc_keycloak` | راجع `.env.windows` |
| Edit mode | **READ_ONLY** | للقراءة فقط دون الكتابة مرة أخرى إلى AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | عند وجود OU فرعية غيّر إلى `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **لا تكتب cn** |
| RDN LDAP attribute | `cn` | خاصية تسمية الإدخال |
| UUID LDAP attribute | `objectGUID` | المعرّف الفريد غير القابل للتغيير في AD |
| User object classes | `person, organizationalPerson, user` | مفصولة بفواصل |
| Search scope | **Subtree** | **لا تختر One Level** (وإلا لن يجد OU الفرعية) |
| Pagination | **On** | للجلب على دفعات عند كثرة المستخدمين |
| Referral | **ignore** | لتجنب الانتقال إلى نطاق تحكم غير موجود |
| Import users | **On** | استيراد متزامن كامل |
| Sync Registrations | **On** | مزامنة فورية عند أول تسجيل دخول |

احفظ ← **Synchronize all users** ← انتظر اكتمال المزامنة.

> ⚠️ أخطاء شائعة في التعبئة:
> - استخدم **صيغة LDAP** في Bind DN (`CN=svc_keycloak,CN=Users,DC=xxx`) وليس ~~DOMAIN\المستخدم~~؛
> - Username LDAP attribute = `sAMAccountName` وليس `cn`؛
> - Search scope = **Subtree**؛
> - **حافظ على المسافات في CN كما هي**: إذا كان اسم العرض يحتوي مسافات (مثل المسافة في منتصف `ai all in one admin`)، فيجب كتابة Bind DN على النحو `CN=ai all in one admin,...`؛ أما استبدالها بشرطة سفلية فيمنع الاتصال.

### التحقق من تسجيل الدخول عبر AD

1. افتح `http://127.0.0.1:9090/realms/enterprise-ai/account` في نافذة تصفح خفي؛

2. سجّل الدخول بحساب النطاق (يُقبل اسم المستخدم `aitest1` أو UPN `aitest1@<نطاق-الشركة>`)؛

3. إذا تم الانتقال بنجاح إلى Account Console فالمصادقة ناجحة.

## 6.4 مصادر هوية مؤسسية أخرى (ملخص الملحق N)

يدعم Keycloak أيضًا مصادر هوية متعددة، جميعها متصل بنفس Realm `enterprise-ai`:

| مصدر الهوية | طريقة الاتصال | النقاط المهمة |
| --- | --- | --- |
| Microsoft Entra ID (سابقًا Azure AD) | Identity Providers ← OpenID Connect v1.0 | سجّل التطبيق في Azure للحصول على client id/secret، وredirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers ← Google (مدمج) | يمكن استخدام Mapper لإضافة `hd=اسم_النطاق` لتقييد النطاق |
| GitHub | Identity Providers ← GitHub (مدمج) | رد نداء OAuth App `/broker/github/endpoint` |
| LDAP عام (OpenLDAP/FreeIPA) | User Federation ← ldap | اختر Other في Vendor واستخدم `uid` كـ Username attribute |
| SAML 2.0 عام (Okta/ADFS) | Identity Providers ← SAML v2.0 | الصق عنوان URL لبيانات IdP لتعبئتها تلقائيًا |

> ✅ تعدد مصادر الهوية في آن واحد: يمكن إضافة Identity Provider Redirector في Authentication ← Browser flow لاختيار IdP تلقائيًا حسب نطاق البريد الإلكتروني (`@شركة.com` ← AD، `@شركة.onmicrosoft.com` ← Entra ID).

> 📖 الوثائق الرسمية:وثائق Keycloak الرسمية https://www.keycloak.org/documentation · دليل إدارة الخادم https://www.keycloak.org/server/ · اتحاد LDAP https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← الفصل 5: نشر Dify المستقل](ch05-dify-deploy.md) · [📖 الفهرس](index.md) · [الفصل 7: NewAPI: التهيئة والقنوات وOIDC →](ch07-newapi.md)
