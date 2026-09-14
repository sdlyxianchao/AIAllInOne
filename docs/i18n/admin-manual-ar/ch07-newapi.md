# الفصل 7: NewAPI: التهيئة والقنوات وOIDC

*الجزء الأول · قسم النشر*

> أكمل معالج التثبيت الأولي، واضبط القناة التي تشير إلى LiteLLM، ووزّع مفاتيح API، واربط Keycloak OIDC.

[← الفصل 6: Keycloak: Realm والمستخدمون وAD](ch06-keycloak.md) · [📖 الفهرس](index.md) · [الفصل 8: LiteLLM: التحقق والتخزين المؤقت →](ch08-litellm.md)

---

## 7.1 معالج التثبيت الأولي (عند أول زيارة)

عند أول تشغيل لـ NewAPI يظهر معالج إعداد النظام في 4 خطوات:

1. **فحص قاعدة البيانات**: انقر «التحقق من اتصال قاعدة البيانات» وستظهر علامة صح خضراء.

2. **حساب المدير**: اسم المستخدم `ai_all_in_one_admin` والبريد الإلكتروني `ai_all_in_one_admin@<نطاق-الشركة>` وكلمة مرور المدير الموحد.

> 📌 لماذا ننشئ المدير المحلي أولًا: لم يُضبط OIDC بعد، ولا يعرف NewAPI بعدُ Keycloak، لذا يجب أن يتوفر حساب محلي «للولوج» وإتمام الإعداد، ثم تفعيل OIDC لاحقًا من إعدادات النظام.

3. **وضع الاستخدام**: اختر «الاستخدام الشخصي» (للاستخدام الداخلي في الشركة: يمكن للموظفين التسجيل ومشاهدة الاستخدام بشكل منفصل دون وحدة شحن/فوترة).

4. **تأكيد التهيئة**: أنشئ جداول قاعدة البيانات ← سجّل الدخول كمدير.

## 7.2 إعداد قناة LLM (تشير إلى LiteLLM)

1. **القنوات** ← إضافة قناة جديدة ← النوع `OpenAI`؛

2. اكتب في Base URL `http://litellm:4000` (اسم الحاوية عبر شبكة Docker، **وليس localhost**)؛

3. اكتب القيمة الفعلية لـ `LITELLM_MASTER_KEY` من `.env` (وليس القيمة النموذجية، وإلا سيظهر `No connected db`)؛

4. اكتب النموذج `deepseek-chat` (مثال، حسب الإعداد الفعلي)؛

5. احفظ ← انقر «اختبار» للتحقق من الاتصال.

إذا ضبطت عدة مزودين فأضفهم بالتكرار: نوع Claude هو `Anthropic Claude` ونوع DeepSeek هو `OpenAI`، واكتب في Base URL دائمًا `http://litellm:4000`.

## 7.3 إنشاء مفاتيح API

أنشئ مفتاحًا لكل من Dify وDSH Desktop لفصل إحصاءات الاستخدام:

1. في اليسار **مفاتيح API** ← جديد؛

2. الاسم `dify-key` ← احفظ ← انسخ `sk-xxx` (واكتبه في مزوّد نماذج Dify)؛

3. أنشئ أيضًا `dsh-key` ← انسخ `sk-xxx` (ووزّعه على مستخدمي DSH Desktop).

## 7.4 السماح للمستخدمين العاديين بطلب المفاتيح ذاتيًا

بعد تسجيل الدخول يمكن للموظفين افتراضيًا إنشاء مفاتيح بأنفسهم من صفحة «مفاتيح API». ولكي يتمكنوا فعليًا من استدعاء النماذج يجب توفر شرطين (مُعدّان مسبقًا في `.env`):

1. **توفر حصة**: `DEFAULT_QUOTA=100` (يمنح المستخدم الجديد حصة 100 دولار)؛

2. **توفر token**: `GENERATE_DEFAULT_TOKEN=true` (يولّد token أوليًا فور التسجيل).

> ⚠️ يسري هذا على المستخدمين «المسجّلين حديثًا» فقط: المستخدمون الذين سجّلوا الدخول سابقًا (مثل `aitest1`) لن يُمنحوا تلقائيًا، بل يجب على المدير تعيين الحصة يدويًا من صفحة «المستخدمون».

## 7.5 ربط Keycloak OIDC (ليتمكن مستخدمو AD من الدخول مباشرة)

### ① إنشاء OIDC Client خاص بـ NewAPI في Keycloak

1. من Realm الخاص بـ enterprise-ai ← **Clients** ← Create client؛

2. Client ID `newapi` ونوع OpenID Connect؛

3. **Client authentication: On** (يجب تفعيله وإلا لن يظهر تبويب Credentials)، وStandard flow / Direct access grants: On؛

4. Valid redirect URIs: `http://<عنوان-IP-الخادم>:3000/*` و`http://127.0.0.1:3000/*`؛

5. احفظ ← من تبويب Credentials ← انسخ Client secret.

### ② تفعيل OIDC في NewAPI

من لوحة NewAPI ← **إعدادات النظام ← المصادقة ← OAuth مخصص ← إضافة مزوّد OAuth** ثم املأ:

| المجموعة | عنصر الإعداد | القيمة |
| --- | --- | --- |
| الإعداد السريع | القالب الجاهز / عنوان API | `Keycloak` / `http://127.0.0.1:9090` |
| المعلومات الأساسية | اسم المزوّد / المعرّف | `Keycloak` / `keycloak` |
| بيانات الدخول | Client ID / Secret | `newapi` / القيمة المنسوخة من Keycloak |
| نقاط النهاية | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| تعيين الحقول | معرّف المستخدم / اسم المستخدم / البريد الإلكتروني | `sub` / `preferred_username` / `email` |

بعد النقر على «الاكتشاف التلقائي» واكتمال تعبئة نقاط النهاية، **غيّر نقطة الرمز ونقطة معلومات المستخدم إلى `host.docker.internal:9090`** (لأن حاوية NewAPI تستدعي Keycloak من الداخل)، وأبقِ نقطة التفويض على `<عنوان-IP-الخادم>:9090` (لإعادة توجيه المتصفح). النطاقات `openid profile email`.

> ⚠️ تعديلان ضروريان وإلا سيفشل تسجيل الدخول:
> - **بعد الحفظ عُد إلى Keycloak وأضف عنوان الرد**: أضف `http://<عنوان-IP-الخادم>:3000/oauth/keycloak` و`http://127.0.0.1:3000/oauth/keycloak` إلى Valid redirect URIs؛
> - **عيّن «عنوان الخادم» في NewAPI إلى العنوان الداخلي**: إعدادات النظام ← الإعدادات العامة ← غيّر عنوان الخادم إلى `http://<عنوان-IP-الخادم>:3000` (القيمة الافتراضية localhost ستؤدي عند تبادل الرمز إلى الخطأ `invalid_grant - Incorrect redirect_uri`). بعد التغيير يجب أيضًا الوصول إلى NewAPI على هذا الجهاز باستخدام عنوان IP الداخلي.

طريقة التعديل على قاعدة البيانات:

```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<عنوان-IP-الخادم>:3000') ON DUPLICATE KEY UPDATE value='http://<عنوان-IP-الخادم>:3000';"
docker compose restart new-api
```

> ⚠️ استكشاف الأخطاء: إذا أعاد تسجيل الدخول **429 Too Many Requests** — فهذا ناتج عن تحديد المعدل للواجهات الحرجة في NewAPI (الافتراضي 20 مرة/20 دقيقة). الحل المؤقت: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`؛ أما الحل الدائم فقد ضُبط مسبقًا في `.env` عبر أربع مجموعات من المتغيرات مثل `CRITICAL_RATE_LIMIT_ENABLE=false`.

> 📖 الوثائق الرسمية:وثائق NewAPI الرسمية https://docs.newapi.pro · الموقع الرسمي https://www.newapi.ai · المستودع مفتوح المصدر https://github.com/QuantumNous/new-api

---

[← الفصل 6: Keycloak: Realm والمستخدمون وAD](ch06-keycloak.md) · [📖 الفهرس](index.md) · [الفصل 8: LiteLLM: التحقق والتخزين المؤقت →](ch08-litellm.md)
