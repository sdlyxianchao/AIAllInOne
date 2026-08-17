# دليل مدير AI AllInOne

*v0.2 · النشر · الإدارة · التشغيل والصيانة*

**الجزء الأول · قسم النشر**

## 1. نظرة عامة على المنصة والبنية المعمارية

### 1.1 ما هي هذه المنصة
«AI AllInOne» هي **منصة ذكاء اصطناعي داخلية للمؤسسة** تنظم أكثر من عشرة منتجات مفتوحة المصدر عبر Docker في منظومة واحدة: المصادقة الموحدة، وتوجيه LLM، وإخفاء بيانات PII، وتطبيقات الذكاء الاصطناعي، وبوابة المؤسسة، وCI للمصدر، وتوزيع العملاء، والإدارة الموحدة، والمراقبة والإنذارات، وقابلية المراقبة، والسجلات، والنسخ الاحتياطي والاستعادة — كلها تعمل بشكل متكامل، مع **دخول موحّد عبر حساب Keycloak واحد لجميع المنتجات**.
| الطبقة | المكوّن | الوظيفة |
| --- | --- | --- |
| المصادقة الموحدة | Keycloak | SSO / OIDC، يمكن الاتصال بـ AD/LDAP أو الحسابات المحلية |
| توجيه LLM | NewAPI | القنوات والمفاتيح والحصص والتدقيق والتكلفة |
| إخفاء PII | LiteLLM + Presidio | إخفاء أرقام الهاتف وبطاقات الهوية والبريد الإلكتروني تلقائيًا قبل استدعاء النموذج |
| تطبيقات الذكاء الاصطناعي | Dify | منصة تطبيقات AI مرئية / Agent / قاعدة معرفية |
| بوابة المؤسسة | Ghost | الإعلانات والأخبار ومركز التنزيلات وHub الموظفين |
| المصدر / CI | Gitea + Runner | مستودع Git داخلي + أتمتة Actions |
| العميل | DeepChat | عميل سطح مكتب AI محلي (Win/macOS/Linux) |
| توزيع العميل | خادم التحديثات | استضافة حزم تثبيت DeepChat والتحديث التلقائي |
| الإدارة الموحدة | مركز إدارة الذكاء الاصطناعي | نقطة الإدارة الوحيدة: Dashboard + تضمين المنتجات + التدقيق/التكلفة/التقارير |
| البوابة | MCP Gateway | إدارة سوق Skill / MCP |
| المراقبة والإنذارات | Prometheus + Grafana + Alertmanager | مراقبة موارد الحاويات + إشعارات الإنذار |
| قابلية مراقبة LLM | Langfuse | تتبع / زمن الاستجابة / الرموز / التكلفة لكل استدعاء نموذج |
| السجلات الموحدة | Loki + Promtail | تجميع والبحث في سجلات جميع الحاويات |
| النسخ الاحتياطي والاستعادة | سكربتات backup / restore + صفحة الإدارة | نسخ احتياطي يومي كامل للبيانات + استعادة بضغطة واحدة |
### 1.2 متطلبات البرامج والأجهزة
| البند | الحد الأدنى | الإعداد الموصى به |
| --- | --- | --- |
| نظام التشغيل | Windows 11 (Docker Desktop + واجهة WSL2 الخلفية) | Windows 11 Pro / Enterprise (مع دعم إضافي لـ Hyper-V لتشغيل نطاق AD) |
| CPU | 4 أنوية / 8 خيوط | 8 أنوية / 16 خيطًا |
| الذاكرة | 16 GB | 32 GB |
| القرص | 60 GB مساحة SSD متاحة | 150 GB+ مساحة SSD متاحة |
| GPU | بدون بطاقة رسومات منفصلة | بدون بطاقة رسومات منفصلة |
> 📌 بناءً على قياسات فعلية: نحو 30 حاوية تستهلك معًا حوالي 5 GB من الذاكرة عند الخمول، وتزداد الذاكرة بمقدار 3–5 GB إضافية في الذروة بسبب معالجة/فهرسة Dify وJVM في Keycloak وذاكرة التخزين المؤقت لقواعد البيانات، إضافة إلى الذاكرة الافتراضية لـ WSL2؛ لذا فإن 16 GB هو الحد الأدنى و32 GB هي القيمة المريحة. جميع النماذج الكبيرة تستخدم واجهات API خارجية (مثل deepseek-chat) دون استدلال محلي، لذا **لا حاجة لـ GPU**.
### 1.3 جدول توزيع المنافذ
فيما يلي يُستخدم `<عنوان-IP-الخادم>` للإشارة إلى عنوان المضيف الخارجي (العنوان في البيئة الحالية هو `192.168.31.117`، ويجب استبداله بعنوان IP الداخلي أو اسم النطاق الخاص بك عند النشر).
| # | المنتج | الاستخدام | الوصول المحلي | الوصول الداخلي (الموظفون) |
| --- | --- | --- | --- | --- |
| 1 | مركز إدارة الذكاء الاصطناعي | بوابة المدير الموحدة | `127.0.0.1:10086` | `<عنوان-IP-الخادم>:10086` |
| 2 | Keycloak | المصادقة / SSO | `127.0.0.1:9090` | `<عنوان-IP-الخادم>:9090` |
| 3 | NewAPI | بوابة توجيه LLM | `127.0.0.1:3000` | `<عنوان-IP-الخادم>:3000` |
| 4 | LiteLLM | وكيل إخفاء PII | `<عنوان-IP-الخادم>:4001` | — (يُستدعى فقط من NewAPI) |
| 5 | Dify | منصة تطبيقات الذكاء الاصطناعي | `127.0.0.1` | `<عنوان-IP-الخادم>` (المنفذ 80) |
| 6 | Ghost | بوابة المؤسسة | `127.0.0.1:8090` | `<عنوان-IP-الخادم>:8090` |
| 7 | Gitea | المصدر + CI/CD | `127.0.0.1:3002` | `<عنوان-IP-الخادم>:3002` |
| 8 | خادم التحديثات | حزم تثبيت DeepChat | `127.0.0.1:8091` | `<عنوان-IP-الخادم>:8091` |
| 9 | MCP Gateway | بوابة Skill / MCP | `127.0.0.1:3100` | `<عنوان-IP-الخادم>:3100` |
| 10 | Grafana | لوحة المراقبة | `127.0.0.1:3030` | `<عنوان-IP-الخادم>:3030` |
| 11 | Prometheus | جمع المؤشرات / الإنذار | `127.0.0.1:9091` | `<عنوان-IP-الخادم>:9091` |
| 12 | Langfuse | قابلية مراقبة LLM | `127.0.0.1:3010` | `<عنوان-IP-الخادم>:3010` |
| 13 | Loki | تجميع السجلات (داخلي) | `127.0.0.1:3110` | — (يُعرض عبر صفحة الإدارة) |
| 14 | MailHog | استقبال البريد المحلي | `127.0.0.1:8025` | `<عنوان-IP-الخادم>:8025` |
> ⚠️ استخدم دائمًا **عنوان IP الداخلي** للوصول، ولا تستخدم `localhost` (لأن دعم Docker Desktop WSL2 لعنوان IPv6 `::1` غير مستقر مما يؤدي إلى فشل إعادة توجيه المنافذ). قواعد البيانات (MySQL/Redis/PostgreSQL) غير مكشوفة للمستخدمين، وتتواصل داخل شبكة Docker فقط.
### 1.4 تدفقات البيانات الأساسية
#### تدفق طلبات LLM (أهم مسار)
1. **① إعادة التوجيه**: يرسل DeepChat / Dify الطلب إلى NewAPI (`:3000/v1`)؛
2. **② إخفاء البيانات**: يحوّل NewAPI الطلب إلى LiteLLM، الذي يستبدل أرقام الهاتف وبطاقات الهوية والبريد الإلكتروني بـ `[xxx_REDACTED]` باستخدام التعبيرات النمطية + Presidio؛
3. **③ طلب النموذج الخارجي**: يُرسل الطلب بعد إخفاء البيانات إلى DeepSeek / GPT / Claude؛
4. **④ استعادة PII**: عند عودة الاستجابة يستعيد LiteLLM المعلومات الحساسة؛
5. **⑤ الإرجاع**: تعود النتيجة النهائية إلى العميل.
#### تدفقات أخرى
- **تدفق المصادقة**: يوفر Keycloak OIDC SSO دخولًا موحدًا لجميع منتجات الويب (باستخدام `ai_all_in_one_admin` المشترك)؛
- **تدفق قابلية المراقبة**: `success_callback` في LiteLLM → يتتبع Langfuse كل استدعاء؛
- **تدفق التحديث التلقائي**: بناء Gitea Actions → خادم التحديثات (:8091) → يتحقق DeepChat من `version.txt` وينزّل ويثبّت تلقائيًا؛
- **تدفق السجلات الموحدة**: يجمع Promtail سجلات الحاويات → يجمعها Loki → تُعرض في صفحة «السجلات الموحدة» بمركز إدارة الذكاء الاصطناعي.
### 1.5 هيكل الكتاب وطريقة التنقل
ينقسم هذا الدليل إلى ثلاثة أجزاء: **قسم النشر** (الفصول 1–13، لتشغيل المنصة من الصفر)، **قسم الإدارة** (الفصول 14–26، العمليات اليومية لكل منتج من المنتجات الثلاثة عشر)، **قسم التشغيل والصيانة** (الفصول 27–29، النسخ الاحتياطي/الفحص الصحي/استكشاف الأخطاء). يمكن التنقل في أي وقت عبر الشريط الجانبي، وتوجد أزرار الصفحة السابقة/التالية أسفل الصفحة.
> ✅ يمكن أثناء النشر تسليم العمل مباشرة إلى **أدوات AI Agent** (مثل WorkBuddy / OpenClaw) لأتمتته: سلّم هذا الدليل + `docker-compose.yml` + `.env.example` + `scripts/` إلى الوكيل، ودعه ينفذ الخطوات بترتيب «قسم النشر» (راجع موجه نشر الوكيل في بداية الفصل الثاني).

## 2. الاستعدادات المسبقة

### 2.0 طريقتا النشر
يمكن تنفيذ هذا الدليل **يدويًا فصلًا بفصل**، أو **تسليمه لأداة AI Agent للتنفيذ التلقائي**. عند استخدام الوكيل، وفّر له هذا المجلد (بما في ذلك هذا الدليل و`docker-compose.yml` و`.env.example` و`scripts/`) ثم الصق الموجه التالي.
**موجه النشر الذي يُنسخ إلى الوكيل:**
```
أنت مهندس نشر لمنصة ذكاء اصطناعي داخلية للمؤسسة. يرجى نشر منصة «AI AllInOne» والتحقق منها بالكامل على هذا الجهاز وفقًا لقسم النشر في «دليل المدير» وملف docker-compose.yml وملف .env.example في هذا المجلد. تواصل باللغة العربية طوال العملية.

الخطوة الأولى — جمع المعاملات (اسألني عن كل عنصر، لا تتخطَّ ولا تخمّن):
1) عنوان IP الداخلي للخدمات الخارجية؛ 2) اسم مضيف سوق المهارات (اسم النطاق، لاستبدال <اسم-مضيف-السوق> في mcp-gateway/skills/skill-market/config.json و SKILL.md، مع الضبط في hosts/DNS)؛ 3) مصدر الهوية (عند الاتصال بنطاق AD تحتاج اسم النطاق/IP الخاص بنطاق التحكم/LDAP base DN/bind DN/كلمة مرور bind/sAMAccountName)؛ 4) كلمة مرور حساب المدير الموحد؛ 5) مفتاح API الخاص بالنموذج الكبير؛ 6) اسأل عند الحاجة عن webhook للإنذار وHTTPS وسياسة الاحتفاظ بالنسخ الاحتياطي.

الخطوة الثانية — أنشئ ملف تقدم، وحدّثه وأبلغني بعد إنجاز كل عنصر وحلّ كل مشكلة.

الخطوة الثالثة — نفّذ بدقة وفقًا لترتيب الفصول 1~13 من هذا الدليل، وانتبه إلى «⚠️ النقاط الحرجة» في كل فصل، وأعطِ الأولوية لاستخدام السكربتات الموجودة في scripts/ للأتمتة.

الخطوة الرابعة — عند حدوث خطأ افحص السجلات أولًا (docker logs ونقاط الصحة والإعدادات) لتحديد السبب الجذري ثم أصلحه، ولا تعِد المحاولة بشكل أعمى.

الخطوة الخامسة — تحقق من العملية كاملة: جميع الحاويات Up، وSSO في Keycloak، وإرسال محادثة حقيقية عبر NewAPI/LiteLLM للتحقق من إخفاء PII، وتسجيل الدخول عبر مصدر الهوية، والمراقبة/السجلات/الإنذارات، والنسخ الاحتياطي والاستعادة، ولخّص كل عنصر بـ ✅/❌.
```
> 💡 إن لم تستخدم الوكيل، يمكن الاستعانة بالنص أعلاه بوصفه «قائمة تدقيق للمعلومات قبل النشر»: حدّد قبل النشر أربعة أمور هي عنوان IP الداخلي ومصدر الهوية وكلمة مرور المدير ومفتاح النموذج.
### 2.1 تثبيت وإعداد Docker Desktop
بعد تثبيت Docker Desktop يُستخدم واجهة WSL2 الخلفية افتراضيًا، وعادة لا تحتاج إعدادات إضافية. وإن احتجت ضبط الحد الأعلى للموارد يدويًا، أنشئ ملف `.wslconfig` في مجلد المستخدم:
```
# %UserProfile%\.wslconfig (مثل C:\Users\اسم_المستخدم_الخاص_بك\.wslconfig)
[wsl2]
memory=24GB       # الحد الأقصى لذاكرة Docker (الحد الأدنى 16GB، والموصى به 24~32GB)
processors=8      # عدد أنوية CPU (وفقًا لعدد الأنوية الفعلية)
swap=4GB
```
بعد الحفظ نفّذ `wsl --shutdown` في PowerShell ثم أعد تشغيل Docker Desktop لتفعيل الإعدادات.
> ✅ التحقق: يعرض شريط حالة Docker Desktop عبارة "Engine running" (باللون الأخضر).
### 2.2 تجهيز بنية المجلدات
```
# PowerShell
mkdir deepchat-updates
```
### 2.3 إنشاء شبكة Docker المشتركة
```
docker network create ai-platform
docker network ls | findstr ai-platform   # التحقق
```
> تتواصل جميع الحاويات الأساسية مع بعضها عبر شبكة `ai-platform` باستخدام أسماء الحاويات (مثل وصول NewAPI إلى LiteLLM عبر `http://litellm:4000` دون المرور عبر localhost).
### 2.4 تثبيت عنوان IP الداخلي للمضيف (مهم)
عند اتصال المضيف عبر WiFi يُخصص عنوان IP ديناميكيًا عبر DHCP، ويتغير عند إعادة التشغيل أو انتهاء مدة التأجير؛ وعندما يتغير تُصبح جميع العناوين التي يصل بها الموظفون إلى المنتجات غير صالحة. يُنصح بإجراء **حجز DHCP (ربط MAC)** على الراوتر:
1. ابحث عن MAC الخاص ببطاقة WiFi: نفّذ `ipconfig /all` وابحث عن العنوان الفعلي لـ «محول الشبكة المحلية اللاسلكية WLAN» (مثل `60-A3-E3-41-8F-61`)؛
2. سجّل الدخول إلى لوحة الراوتر (مثل `http://192.168.31.1`) ← إعدادات الشبكة المحلية / تخصيص IP ثابت عبر DHCP؛
3. أضف قاعدة: MAC ← IP (مثل `192.168.31.117`) ثم احفظ؛
4. أعد الاتصال بشبكة WiFi وتأكد من ثبات عنوان IP.
> ✅ حجز DHCP أكثر استقرارًا من تعيين IP ثابت داخل Windows (إدارة موحدة عبر الراوتر دون تعارض).
### 2.5 فتح الشبكة (الخطوة الأكثر عرضة للتعثر)
- **القدرة على الاتصال بمستودعات صور Docker**: Docker Hub / quay.io / ghcr.io. إن تعذر الاتصال فاضبط مسرّع الصور أولًا (مثل DaoCloud).
- **القدرة على الاتصال بـ GitHub**: لاستنساخ المستودعات وسحب التبعيات العامة. إن تعذر الاتصال فاستخدم وكيلًا أو نزّل حزم المصدر مسبقًا.
- **إمكانية الوصول إلى الجهاز الهدف عبر الشبكة الداخلية**: تأكد من إمكانية الوصول إلى الشبكة الفرعية المطلوب كشفها.

## 3. ملفات الإعداد ومتغيرات البيئة

### 3.1 ملفات الإعداد الأساسية الثلاثة
| الملف | الاستخدام | هل يحتاج تعديلًا |
| --- | --- | --- |
| `.env.windows` | جميع كلمات المرور ومفاتيح API الخارجية | **يجب تعديله**: تعبئة DeepSeek API Key وبقية المزودين حسب الحاجة |
| `litellm-config.yaml` | قائمة نماذج LiteLLM + قواعد إخفاء PII | عادة لا يُعدّل (عند استخدام DeepSeek فقط يمكن حذف مدخلات OpenAI/Claude) |
| `docker-compose.yml` | تنظيم الخدمات الأساسية | مُعدّ مسبقًا (يشمل `KC_HOSTNAME` في Keycloak + الأحجام الدائمة) |
### 3.2 نظرة عامة على تصنيف متغيرات البيئة
افتح `.env` (انسخه من `.env.windows`) واضبطه وفقًا للأولوية.
| المتغير | الأولوية | الوصف |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 فوري | مفتاح API الخاص بـ LLM الخارجي؛ إن لم يُضبط فلن يعمل المسار |
| `LITELLM_MASTER_KEY` | 🔴 فوري | مفتاح المصادقة الداخلي لـ LiteLLM، يحتاجه NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 فوري | كلمة مرور MySQL root، يُفضّل عدم تغييرها بعد الإنشاء الأول |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 فوري | كلمة مرور مدير Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 فوري | تشفير جلسات NewAPI، سلسلة عشوائية |
| `NEWAPI_CRYPTO_SECRET` | 🔴 فوري | تشفير بيانات NewAPI، سلسلة عشوائية |
| `ADMIN_PASSWORD` | 🔴 فوري | كلمة مرور مدير Global Admin بمركز إدارة الذكاء الاصطناعي |
| `SESSION_SECRET` | 🔴 فوري | تشفير جلسات مركز إدارة الذكاء الاصطناعي، سلسلة عشوائية |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 يمكن ضبطه لاحقًا | تحتاج أولًا إنشاء OIDC Client في Keycloak للحصول على Secret (انظر الفصل 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 يمكن ضبطه لاحقًا | شغّل Gitea أولًا ثم احصل على الرمز من اللوحة (انظر الفصل 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 حسب الحاجة | أزل التعليق عند الاستخدام وعدّل `litellm-config.yaml` بالمثل |
| `GLOBAL_WEB_RATE_LIMIT` وعناصر تحديد المعدل الأخرى | ⚪ افتراضي | اضبطها على 999999 أثناء الاختبار، وخفّضها حسب الحاجة في الإنتاج |
| `DEFAULT_QUOTA` | ⚪ افتراضي | الحصة الافتراضية للمستخدم الجديد (بالدولار)؛ ضبطها على 100 يمنح المستخدم الجديد 100 دولار |
| `GENERATE_DEFAULT_TOKEN` | ⚪ افتراضي | إنشاء مفتاح أولي تلقائيًا عند تسجيل المستخدم الجديد؛ اضبطه على true ليتمكن المستخدم من الاستخدام فور تسجيل الدخول |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ افتراضي | القيم الافتراضية كافية |
### 3.3 🔴 الضبط الفوري (يجب إتمامه قبل التشغيل الأول)
| المتغير | الوصف | كيفية الحصول عليه | الصيغة |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | مفتاح LLM السحابي من DeepSeek | سجّل في https://platform.deepseek.com ← API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | مفتاح المدير الداخلي لـ LiteLLM (ليس مفتاح LLM خارجيًا) | ولّده عشوائيًا (انظر أدناه) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | كلمة مرور MySQL | اخترها بنفسك، ويُفضّل عدم تغييرها بعد الإنشاء الأول | أي قيمة |
| `KEYCLOAK_ADMIN_PASSWORD` | كلمة مرور مدير Keycloak | اخترها بنفسك، 8 أحرف فأكثر | أي قيمة |
| `NEWAPI_SESSION_SECRET` | تشفير جلسات NewAPI | ولّده عشوائيًا | 32 خانة |
| `NEWAPI_CRYPTO_SECRET` | تشفير بيانات NewAPI | ولّده عشوائيًا | 32 خانة |
| `ADMIN_PASSWORD` | كلمة مرور مدير مركز إدارة الذكاء الاصطناعي | اخترها بنفسك، 8 أحرف فأكثر | أي قيمة |
| `SESSION_SECRET` | تشفير جلسات مركز إدارة الذكاء الاصطناعي | ولّده عشوائيًا | 64 خانة |
توليد سلسلة عشوائية (PowerShell):
```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```
#### مثال على تعبئة مفتاح API
```
# افتراضيًا يُضبط DeepSeek (أزل التعليق واملأ المفتاح)
DEEPSEEK_API_KEY=sk-مفتاح_DeepSeek_الحقيقي_الخاص_بك

# عند الحاجة إلى OpenAI / Claude أزل التعليق، وأزل التعليق أيضًا عن كتلة النموذج المقابلة في litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```
### 3.4 سياسة تغيير كلمات المرور
> ⚠️ يرتبط `NEWAPI_DB_PASSWORD` بقاعدة البيانات المنشأة بالفعل؛ وعند تغييره يجب حذف الحجم المقابل وإعادة إنشائه (وستفقد البيانات)، لذا يُنصح بتحديده من البداية.  
> 
>     يمكن تغيير كلمات مرور الإدارة مثل `KEYCLOAK_ADMIN_PASSWORD` و`ADMIN_PASSWORD` من لوحة كل منتج، وبعد التغيير حدّث `.env` بالمثل (للتذكير فقط، ولا يؤثر على التشغيل).
### 3.5 شرح ملف litellm-config.yaml
- `model_list` — يحدد النماذج الخارجية المتاحة التي يستدعيها NewAPI عبر LiteLLM. افتراضيًا يُفعَّل `deepseek-chat` فقط؛
- `general_settings.master_key` — مفتاح مدير LiteLLM، يقرأ `LITELLM_MASTER_KEY` من `.env`؛
- إخفاء PII (Presidio) مُعلّق مؤقتًا حاليًا (بسبب تغيير غير متوافق في guardrail API في الإصدار الأحدث من LiteLLM)، وسيُفعَّل لاحقًا كما في الفصل 25؛
- استخدم الإصدار المستقر `v1.95.1` (لأن `main-latest` يحتوي على أخطاء معروفة).

## 4. تشغيل الخدمات الأساسية

### 4.1 نسخ .env
```
# PowerShell
copy .env.windows .env
```
يقرأ Docker Compose ملف `.env` افتراضيًا.
### 4.2 تشغيل جميع الخدمات الأساسية
```
docker compose -f docker-compose.yml up -d
```
في المرة الأولى سيتم سحب جميع الصور (حوالي 5–10 دقائق حسب سرعة الشبكة).
| الصورة | الحاوية | الحجم |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |
### 4.3 التحقق من حالة الحاويات
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
من المتوقع أن تكون الحاويات الأساسية العشر جميعها بحالة `Up`. إذا استمرت أي حاوية في `Restarting` فنفّذ `docker logs اسم_الحاوية` لمعرفة السبب.
### 4.4 إصلاح مشكلة معروفة: إجبار Ghost على SQLite
إذا استمرت `ghost` في حالة Restarting وكانت السجلات تُظهر `Error: connect ECONNREFUSED <عنوان-IP-الخادم>:3306` — فهذا يعني وجود ملف `config.production.json` قديم في حجم البيانات يشير إلى MySQL. الإصلاح: أعلن صراحةً عن SQLite في `environment` الخاص بخدمة ghost في compose:
```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```
```
docker compose up -d ghost
docker logs ghost --tail 20
```
> ⚠️ تحت Windows + Docker Desktop WSL2 تُخزَّن بيانات الأحجام داخل القرص الافتراضي لـ WSL2، ولا يستطيع git bash في المضيف رؤيتها، لذا لا يمكن حذف `config.production.json` داخل الحجم مباشرة، والحل الوحيد هو «التجاوز عبر متغيرات البيئة». ولا تنفّذ أيضًا `docker volume rm windows_ghost-data` (لأنك ستفقد المقالات المنشورة).
> ✅ التحقق: تظهر في السجلات `Ghost database ready` + `Ghost booted`، ويعيد `curl.exe -I http://127.0.0.1:8090` الرمز 200.
### 4.5 التحقق من إمكانية الوصول لكل خدمة
```
# Keycloak — 302 يعني أن كل شيء سليم
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (إعادة توجيه إلى صفحة التهيئة /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (مجلد فارغ، nginx يعمل)
curl.exe -I http://127.0.0.1:8091
# مركز إدارة الذكاء الاصطناعي — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```
LiteLLM هو API خالص بدون واجهة ويب، لذا تحقق منه من داخل الحاوية:
```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# الناتج المتوقع: {"data":[{"id":"deepseek-chat",...}]}
```
> 📌 قد يؤدي وكيل HTTP في Docker Desktop WSL2 إلى تعذّر الوصول إلى LiteLLM من المضيف (HEART/استجابة فارغة)، وهي مشكلة معروفة، ولا تؤثر على استدعاء NewAPI له عبر اسم الحاوية.

## 5. نشر Dify المستقل

> 📌 يستخدم Dify ملف docker-compose الرسمي (يضم ~15 حاوية) ويُنشر بشكل مستقل لتجنب تعارض المنافذ، ويستخدم شبكته الافتراضية الخاصة (تختلف عن شبكة `ai-platform` الخاصة بالخدمات الأساسية).
### 5.1 استنساخ Dify
```
# الطريقة A: عبر GitHub (يتطلب إمكانية الوصول)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# الطريقة B: عبر مرآة Gitee الرسمية (موصى بها داخل الصين)
git clone https://gitee.com/dify_ai/dify.git
```
### 5.2 إصلاح التوافق + نسخ متغيرات البيئة
```
cd dify\docker

# إصلاح صيغة env_file (للتوافق مع الإصدارات القديمة من Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# نسخ متغيرات البيئة الرئيسية
copy .env.example .env

# نسخ جميع القوالب الفرعية (مثل sandbox.env)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# إصلاح مشكلة التحقق في Dify 1.16.1 (ضروري)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# التحقق
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```
> ⚠️ لماذا يجب تغيير `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: رفع Dify 1.16.1 هذا الحقل من «يسمح بـ 0» إلى «يجب أن يكون > 0»، لكن قالب `shared.env` ما يزال 0. دون التغيير ستنهار الحاويات الأربع `docker-api-1` / `worker` / `worker_beat` / `api_websocket` فور الإقلاع، وستُظهر السجلات `ValidationError: Input should be greater than 0`.
### 5.3 تشغيل Dify
```
docker compose up -d
docker compose ps
```
> ✅ تكون جميع الحاويات بحالة `Up` (من الطبيعي أن تظهر `init_permissions` بحالة Exited). افتح `http://127.0.0.1/install` في المتصفح لتهيئة حساب المدير.
### 5.4 إصلاح عنوان WebSocket (دون التغيير سيتصل المتصفح مرارًا بـ ws://localhost)
القيمة الافتراضية لـ `NEXT_PUBLIC_SOCKET_URL` في `.env` هي `ws://localhost`؛ وعند النشر الداخلي يشير localhost في متصفح المستخدم إلى جهازه هو، مما يجعل الواجهة الأمامية تفشل في الاتصال مرارًا (ويتعطل إنشاء التطبيقات/تصحيح سير العمل).
```
# غيّر في .env إلى عنوان IP الداخلي
NEXT_PUBLIC_SOCKET_URL=ws://<عنوان-IP-الخادم>

# وعدّل أيضًا fallback الخاص بخدمة web في docker-compose.yaml بالمثل
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<عنوان-IP-الخادم>}

# أعد بناء حاوية web لتفعيل التغيير
docker compose up -d web
```
> 📌 بعد التغيير أعد تحميل المتصفح بقوة (Ctrl+F5). يُقرأ هذا المتغير في وقت التشغيل، لذا يكفي تعديل .env + إعادة تشغيل web دون إعادة بناء الصورة.
### 5.5 مرجع سريع للمزالق
> ⚠️ **كلمة مرور تسجيل الدخول تُنقل بصيغة base64**: في Dify 1.16.x تكون `password` بواجهة تسجيل الدخول `POST /console/api/login` هي كلمة المرور بعد ترميز base64. عند تسجيل الدخول عبر السكربتات يجب أولًا تنفيذ `base64(كلمة المرور)`؛ وعندما «لا يحدث شيء عند النقر على تسجيل الدخول» في الواجهة، فإن ظهور `GET /account/profile 401` في console هو حالة طبيعية لعدم تسجيل الدخول.
```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<نطاق-الشركة> \
  --new-password '<كلمة-مرور-جديدة>' \
  --password-confirm '<كلمة-مرور-جديدة>'
```
> ⚠️ **إعادة تعيين كلمة مرور المدير عند نسيانها**: تجزئة كلمة المرور في Dify هي `pbkdf2_hmac('sha256', password, salt, 10000)` (بعدد تكرارات 10000) ولا يمكن فكّها عكسيًا، لذا أعد تعيينها عبر أمر في الحاوية (كلمة المرور الجديدة 8 أحرف فأكثر):
>     
>     📖 الوثائق الرسمية:وثائق Dify الرسمية https://docs.dify.ai · النشر المستضاف ذاتيًا https://docs.dify.ai/getting-started/install-self-hosted

## 6. Keycloak: Realm والمستخدمون وAD

> 📌 الوصول: على المضيف `http://127.0.0.1:9090`، وعلى الشبكة الداخلية `http://<عنوان-IP-الخادم>:9090`. تُخزَّن البيانات في الحجم المسمى `keycloak-data` ولا تُفقد عند إعادة بناء الحاوية. راجع بيانات الدخول في `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` داخل `.env.windows`.
### 6.1 إنشاء Realm
1. افتح `http://127.0.0.1:9090` في المتصفح ← Administration Console ← تسجيل دخول المدير؛
2. من القائمة المنسدلة أعلى اليسار ← **Create Realm** ← اكتب `enterprise-ai` في Realm name ← Create.
### 6.2 الطريقة A: إنشاء حسابات محلية (للفرق الصغيرة/الاختبار بدون AD)
1. **Groups** ← Create Group ← `ai-admin`؛ ثم أنشئ `ai-user`؛
2. **Users** ← Add user ← اسم المستخدم ← Create؛
3. من تبويب Credentials ← عيّن كلمة المرور ← أوقف خيار Temporary؛
4. من تبويب Groups ← أضف إلى مجموعة `ai-user`.
### 6.3 الطريقة B: استيراد الحسابات من Active Directory (موصى بها)
عندما يكون لدى الشركة نطاق Windows AD بالفعل، يسجّل الموظفون الدخول بحسابات النطاق دون الحاجة لإنشاء حسابات يدويًا في Keycloak. المتطلب المسبق: أن تكون شبكة حاويات Docker متصلة بشبكة نطاق التحكم (راجع طوبولوجيا الشبكة وHyper-V Internal Switch وإعادة توجيه المنافذ في «دليل دمج Keycloak مع AD» `windows-ad-integration.html`).
> 📌 حسابات AD المطلوبة: حساب خدمة `svc_keycloak` (كلمة مروره لا تنتهي، ويُستخدم لربط LDAP) + مستخدما نطاق للاختبار (للتحقق من المزامنة).
#### إنشاء اتحاد مستخدمي LDAP
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
- ⚠️ أخطاء شائعة في التعبئة:
      
        استخدم **صيغة LDAP** في Bind DN (`CN=svc_keycloak,CN=Users,DC=xxx`) وليس ~~DOMAIN\المستخدم~~؛
- Username LDAP attribute = `sAMAccountName` وليس `cn`؛
- Search scope = **Subtree**؛
- **حافظ على المسافات في CN كما هي**: إذا كان اسم العرض يحتوي مسافات (مثل المسافة في منتصف `ai all in one admin`)، فيجب كتابة Bind DN على النحو `CN=ai all in one admin,...`؛ أما استبدالها بشرطة سفلية فيمنع الاتصال.
#### التحقق من تسجيل الدخول عبر AD
1. افتح `http://127.0.0.1:9090/realms/enterprise-ai/account` في نافذة تصفح خفي؛
2. سجّل الدخول بحساب النطاق (يُقبل اسم المستخدم `aitest1` أو UPN `aitest1@<نطاق-الشركة>`)؛
3. إذا تم الانتقال بنجاح إلى Account Console فالمصادقة ناجحة.
### 6.4 مصادر هوية مؤسسية أخرى (ملخص الملحق N)
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

## 7. NewAPI: التهيئة والقنوات وOIDC

### 7.1 معالج التثبيت الأولي (عند أول زيارة)
عند أول تشغيل لـ NewAPI يظهر معالج إعداد النظام في 4 خطوات:
1. **فحص قاعدة البيانات**: انقر «التحقق من اتصال قاعدة البيانات» وستظهر علامة صح خضراء.
> **حساب المدير**: اسم المستخدم `ai_all_in_one_admin` والبريد الإلكتروني `ai_all_in_one_admin@<نطاق-الشركة>` وكلمة مرور المدير الموحد.
>         📌 لماذا ننشئ المدير المحلي أولًا: لم يُضبط OIDC بعد، ولا يعرف NewAPI بعدُ Keycloak، لذا يجب أن يتوفر حساب محلي «للولوج» وإتمام الإعداد، ثم تفعيل OIDC لاحقًا من إعدادات النظام.
3. **وضع الاستخدام**: اختر «الاستخدام الشخصي» (للاستخدام الداخلي في الشركة: يمكن للموظفين التسجيل ومشاهدة الاستخدام بشكل منفصل دون وحدة شحن/فوترة).
4. **تأكيد التهيئة**: أنشئ جداول قاعدة البيانات ← سجّل الدخول كمدير.
### 7.2 إعداد قناة LLM (تشير إلى LiteLLM)
1. **القنوات** ← إضافة قناة جديدة ← النوع `OpenAI`؛
2. اكتب في Base URL `http://litellm:4000` (اسم الحاوية عبر شبكة Docker، **وليس localhost**)؛
3. اكتب القيمة الفعلية لـ `LITELLM_MASTER_KEY` من `.env` (وليس القيمة النموذجية، وإلا سيظهر `No connected db`)؛
4. اكتب النموذج `deepseek-chat` (مثال، حسب الإعداد الفعلي)؛
5. احفظ ← انقر «اختبار» للتحقق من الاتصال.
إذا ضبطت عدة مزودين فأضفهم بالتكرار: نوع Claude هو `Anthropic Claude` ونوع DeepSeek هو `OpenAI`، واكتب في Base URL دائمًا `http://litellm:4000`.
### 7.3 إنشاء مفاتيح API
أنشئ مفتاحًا لكل من Dify وDeepChat لفصل إحصاءات الاستخدام:
1. في اليسار **مفاتيح API** ← جديد؛
2. الاسم `dify-key` ← احفظ ← انسخ `sk-xxx` (واكتبه في مزوّد نماذج Dify)؛
3. أنشئ أيضًا `deepchat-key` ← انسخ `sk-xxx` (ووزّعه على مستخدمي DeepChat).
### 7.4 السماح للمستخدمين العاديين بطلب المفاتيح ذاتيًا
بعد تسجيل الدخول يمكن للموظفين افتراضيًا إنشاء مفاتيح بأنفسهم من صفحة «مفاتيح API». ولكي يتمكنوا فعليًا من استدعاء النماذج يجب توفر شرطين (مُعدّان مسبقًا في `.env`):
1. **توفر حصة**: `DEFAULT_QUOTA=100` (يمنح المستخدم الجديد حصة 100 دولار)؛
2. **توفر token**: `GENERATE_DEFAULT_TOKEN=true` (يولّد token أوليًا فور التسجيل).
> ⚠️ يسري هذا على المستخدمين «المسجّلين حديثًا» فقط: المستخدمون الذين سجّلوا الدخول سابقًا (مثل `aitest1`) لن يُمنحوا تلقائيًا، بل يجب على المدير تعيين الحصة يدويًا من صفحة «المستخدمون».
### 7.5 ربط Keycloak OIDC (ليتمكن مستخدمو AD من الدخول مباشرة)
#### ① إنشاء OIDC Client خاص بـ NewAPI في Keycloak
1. من Realm الخاص بـ enterprise-ai ← **Clients** ← Create client؛
2. Client ID `newapi` ونوع OpenID Connect؛
3. **Client authentication: On** (يجب تفعيله وإلا لن يظهر تبويب Credentials)، وStandard flow / Direct access grants: On؛
4. Valid redirect URIs: `http://<عنوان-IP-الخادم>:3000/*` و`http://127.0.0.1:3000/*`؛
5. احفظ ← من تبويب Credentials ← انسخ Client secret.
#### ② تفعيل OIDC في NewAPI
من لوحة NewAPI ← **إعدادات النظام ← المصادقة ← OAuth مخصص ← إضافة مزوّد OAuth** ثم املأ:
| المجموعة | عنصر الإعداد | القيمة |
| --- | --- | --- |
| الإعداد السريع | القالب الجاهز / عنوان API | `Keycloak` / `http://127.0.0.1:9090` |
| المعلومات الأساسية | اسم المزوّد / المعرّف | `Keycloak` / `keycloak` |
| بيانات الدخول | Client ID / Secret | `newapi` / القيمة المنسوخة من Keycloak |
| نقاط النهاية | Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| تعيين الحقول | معرّف المستخدم / اسم المستخدم / البريد الإلكتروني | `sub` / `preferred_username` / `email` |
بعد النقر على «الاكتشاف التلقائي» واكتمال تعبئة نقاط النهاية، **غيّر نقطة الرمز ونقطة معلومات المستخدم إلى `host.docker.internal:9090`** (لأن حاوية NewAPI تستدعي Keycloak من الداخل)، وأبقِ نقطة التفويض على `<عنوان-IP-الخادم>:9090` (لإعادة توجيه المتصفح). النطاقات `openid profile email`.
- ⚠️ تعديلان ضروريان وإلا سيفشل تسجيل الدخول:
      
        **بعد الحفظ عُد إلى Keycloak وأضف عنوان الرد**: أضف `http://<عنوان-IP-الخادم>:3000/oauth/keycloak` و`http://127.0.0.1:3000/oauth/keycloak` إلى Valid redirect URIs؛
- **عيّن «عنوان الخادم» في NewAPI إلى العنوان الداخلي**: إعدادات النظام ← الإعدادات العامة ← غيّر عنوان الخادم إلى `http://<عنوان-IP-الخادم>:3000` (القيمة الافتراضية localhost ستؤدي عند تبادل الرمز إلى الخطأ `invalid_grant - Incorrect redirect_uri`). بعد التغيير يجب أيضًا الوصول إلى NewAPI على هذا الجهاز باستخدام عنوان IP الداخلي.
طريقة التعديل على قاعدة البيانات:
```
docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<عنوان-IP-الخادم>:3000') ON DUPLICATE KEY UPDATE value='http://<عنوان-IP-الخادم>:3000';"
docker compose restart new-api
```
> ⚠️ استكشاف الأخطاء: إذا أعاد تسجيل الدخول **429 Too Many Requests** — فهذا ناتج عن تحديد المعدل للواجهات الحرجة في NewAPI (الافتراضي 20 مرة/20 دقيقة). الحل المؤقت: `docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`؛ أما الحل الدائم فقد ضُبط مسبقًا في `.env` عبر أربع مجموعات من المتغيرات مثل `CRITICAL_RATE_LIMIT_ENABLE=false`.
> 📖 الوثائق الرسمية:وثائق NewAPI الرسمية https://docs.newapi.pro · الموقع الرسمي https://www.newapi.ai · المستودع مفتوح المصدر https://github.com/QuantumNous/new-api

## 8. LiteLLM: التحقق والتخزين المؤقت

> ⚠️ إخفاء PII (Presidio guardrail) **معطّل مؤقتًا** حاليًا: تغيّرت صيغة إعداد guardrail في الإصدار الأحدث من LiteLLM، وأُضيف التعليق إلى ذلك المقطع في `litellm-config.yaml`، لذا يعمل LiteLLM حاليًا كوسيط تمرير فقط (دون إخفاء). راجع الفصل 25 لطريقة التفعيل.
### 8.1 التحقق من عمل LiteLLM الأساسي
```
curl -X POST http://<عنوان-IP-الخادم>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```
> ⚠️ `<LITELLM_MASTER_KEY>` هو مفتاح مدير LiteLLM، استخدم القيمة الفعلية من `.env` (وليس العنصر النائب نفسه، وإلا ستحصل على 401). ويجب استخدام عنوان IP الداخلي `<عنوان-IP-الخادم>:4001` وليس `127.0.0.1:4001` (بسبب مشكلة إعادة توجيه المنافذ في WSL2).
### 8.2 التخزين المؤقت للاستجابات (مدمج بالفعل، ويوفر الرموز)
فعّل LiteLLM تخزينًا مؤقتًا بتطابق تام عبر Redis: الطلبات المتطابقة تمامًا (النموذج + الرسائل + المعاملات) تُعاد مباشرة من الذاكرة المؤقتة، وتُشارك بين المستخدمين مما يوفر الرموز.
```
# في نهاية litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis مستقل للتخزين المؤقت
    port: 6379
    ttl: 3600            # التخزين المؤقت لمدة ساعة واحدة
```
> التحقق: يعيد `curl http://<عنوان-IP-الخادم>:4001/cache/ping -H "Authorization: Bearer <KEY>"` الناتج `ping_response: true`؛ وعند إرسال طلبين متطابقين متتاليين ينخفض زمن الثاني إلى مستوى المللي ثانية. لإيقاف التخزين المؤقت: اضبط `cache: false` ثم أعد تشغيل litellm.
### 8.3 إضافة مزيد من مزودي LLM
1. أزل التعليق عن `# OPENAI_API_KEY=` في `.env` واملأ المفتاح؛
2. أزل التعليق عن كتلة النموذج المقابلة في `litellm-config.yaml`؛
3. `docker compose up -d litellm`.
> 📖 الوثائق الرسمية:وثائق LiteLLM الرسمية https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 9. إعداد Dify / Ghost / Gitea

### 9.1 Dify: إعداد مزوّد النماذج
1. افتح `http://<عنوان-IP-الخادم>` ← عند أول استخدام عيّن بريد المدير وكلمة المرور (البريد `ai_all_in_one_admin@<نطاق-الشركة>`)؛
  - **الإعدادات ← مزوّدو النماذج** ← OpenAI-API-compatible ← إضافة نموذج:
        
          اسم النموذج `deepseek-chat` (حسب الفعلي)؛
  - مفتاح API: `sk-xxx` الخاص بـ `dify-key`؛
  - نقطة نهاية API: `http://host.docker.internal:3000/v1`.
3. الاستوديو ← إنشاء مساعد محادثة ← اختر النموذج ← أرسل رسالة للتحقق.
> ⚠️ يستخدم Dify `host.docker.internal` بدلًا من اسم الحاوية، لأن Dify يعمل في شبكته الخاصة وهي مختلفة عن شبكة NewAPI.
### 9.2 Ghost: إعداد البوابة
1. مدخل اللوحة `http://<عنوان-IP-الخادم>:8090/ghost/` (**انتبه للاحقة /ghost/**). عند أول استخدام مرّ عبر معالج setup لإنشاء المدير (البريد `ai_all_in_one_admin@<نطاق-الشركة>` وكلمة مرور لا تقل عن 10 أحرف)؛
2. الأتمتة: شغّل مباشرة `scripts\ghost-setup.ps1` لإنشاء المدير دفعة واحدة عبر setup API بما يعادل المعالج (ويتخطى تلقائيًا إن كانت التهيئة تمت بالفعل)؛
3. **القالب**: المظهر ← القوالب، فعّل القوالب المدمجة Casper/Source مباشرة؛
4. **قائمة التنقل**: المظهر ← القوائم ← أنشئ «التنقل الرئيسي».
| عنصر القائمة | النوع | URL |
| --- | --- | --- |
| الرئيسية | صفحة | `/` |
| الأخبار | تصنيف | `/category/news` |
| مركز التنزيلات | صفحة | `/downloads` |
| منضدة عمل AI | رابط مخصص | `http://<عنوان-IP-الخادم>` |
| مستندات المساعدة | تصنيف | `/category/docs` |
1. **صفحة مركز التنزيلات**: الصفحات ← أنشئ «مركز التنزيلات» (slug `downloads`) وضع فيه الروابط الداخلية لحزم تثبيت DeepChat.
```
## DeepChat إصدار المؤسسات
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<عنوان-IP-الخادم>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<عنوان-IP-الخادم>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```
> ⚠️ لا تنقر «التسجيل» في الصفحة الرئيسية للبوابة `/` — فهي مخصصة لتسجيل الزوار المشتركين (وستظهر خطأ 500 إن لم يُضبط SMTP)؛ مدخل المدير هو `/ghost/`. ولا تثبّت أحدث إصدار من القوالب من GitHub (لأنها قد تكون متوافقة مع Ghost 6.x وستظهر رسالة incompatible مع 5.x).
### 9.3 Gitea: التهيئة وتسجيل Runner
1. افتح `http://<عنوان-IP-الخادم>:3002` ← معالج التثبيت (قاعدة البيانات SQLite مُعدّة مسبقًا) ← أنشئ المدير (اسم المستخدم `ai_all_in_one_admin`)؛
2. من الصورة الرمزية أعلى اليمين ← **Site Administration ← Actions** ← تأكد من تفعيل Enabled Actions؛
3. **Runners ← Create new Runner** ← انسخ Registration Token؛
4. ضع الرمز في `GITEA_RUNNER_TOKEN` داخل `.env` ثم أعد بناء Runner:
```
# ⚠️ يجب استخدام up -d وليس restart (لأن restart لا يعيد قراءة الرمز من .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```
> ⚠️ المزلق 1: خطأ `readonly database` غالبًا لأن مالك `gitea.db` هو root؛ احذف قاعدة البيانات التي يملكها root ليعاد إنشاؤها بحساب المستخدم git.  
> 
>     ⚠️ المزلق 2: يجب ضبط `ROOT_URL` إلى `http://<عنوان-IP-الخادم>:3002/` وإلا ستُولَّد روابط المستودعات بصيغة localhost وتصبح غير صالحة عند فتحها من أجهزة الموظفين.
> 
>     📖 الوثائق الرسمية:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (بالصينية) https://docs.gitea.com/zh-cn

## 10. توزيع DeepChat و CI/CD

### 10.1 سلسلة التوزيع
سلسلة التوزيع = حزم تثبيت GitHub Releases ← Gitea Actions في مستودع `deepchat-sync` ← خادم التحديثات (:8091) ← صفحة التنزيل في Ghost ← تنزيل الموظفين.
> 📌 حُذف مستودع mirror الخاص بمصدر `deepchat` — لأن mirror يزامن مصدر git فقط ولا يزامن حزم تثبيت release، لذا لا يفيد في التوزيع. وإن أردت تدقيق المصدر أو تطويره ثانويًا فأنشئ مستودعًا منفصلًا.
### 10.2 تنزيل حزم التثبيت إلى خادم التحديثات
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```
التحقق: `curl -I http://<عنوان-IP-الخادم>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` ← 200/206. ثم حدّث صفحة التنزيل في Ghost (انظر الفصل 9).
### 10.3 المزامنة التلقائية (Gitea Actions، موصى بها)
| المكوّن | الوصف |
| --- | --- |
| `deepchat-sync` مستودع | مستودع عادي (لا يمكن استخدام mirror)، ضع فيه `.gitea/workflows/sync.yml` + `update_ghost.py` |
| المشغّل | `schedule` (يوميًا عند الساعة 2 بتوقيت UTC) + `workflow_dispatch` (يدوي) |
| المنطق | ابحث عن أحدث tag في GitHub ← قارن مع `version.txt` ← عند وجود إصدار جديد نزّله + حدّث صفحة التنزيل في Ghost + اكتب الإصدار |
```
# تشغيل يدوي مرة واحدة
curl -X POST "http://<عنوان-IP-الخادم>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<كلمة-المرور>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
> ⚠️ نقاط حرجة: ① يجب ضبط `container.network` الخاص بـ act_runner عبر `config.yaml` (بالإضافة إلى متغير البيئة `CONFIG_FILE`)، وإلا لن تتمكن حاوية job من حل اسم المضيف `gitea`؛ ② يُركّب docker.sock تلقائيًا بواسطة runner، فلا تركّبه مرة أخرى في options (لأنه سيؤدي إلى خطأ Duplicate mount point).
### 10.4 إعداد مصدر التنزيل المحلي (sync-config.json)
ما تزال حزم التثبيت في صفحة التنزيل بالموقع الرسمي `deepchatai.cn` تشير إلى GitHub، وهي غالبًا غير قابلة للوصول داخل الصين. الحل الحقيقي يعتمد على `sync-config.json`:
| الحقل | الوظيفة | الافتراضي |
| --- | --- | --- |
| `version_source` | `github` (الأدق عبر GitHub API) أو `official` (ذاكرة الموقع الرسمي، قابلة للوصول لكنها متأخرة) | `github` |
| `download_prefix` | بادئة تسريع التنزيل مثل `https://ghproxy.com/` | `""` |
| `keep_releases` | عدد الإصدارات التاريخية المحفوظة | `5` |
| `market_url` | عنوان السوق الداخلي لعبارة «ثبّت مدير المهارات أولًا» في صفحة التنزيل | `http://<عنوان-IP-الخادم>:3100` |
```
# يمكن الوصول إلى GitHub: لا تغيّر الإعداد الافتراضي
{ "version_source": "github", "download_prefix": "" }
# وكيل تسريع GitHub (الأكثر استخدامًا)
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
```
> 📌 يتضمن سير العمل أداة مقارنة الإصدارات `version_cmp.py`، فلا يُنزّل إلا عندما يكون «أحدث إصدار > الإصدار المحلي» (لتجنب إرجاع العميل إلى إصدار أقدم بسبب تأخر ذاكرة الموقع الرسمي).
### 10.5 الطريقة B: بناء إصدار مخصص عبر Docker (اختياري)
```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# داخل الحاوية
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# الناتج في dist/، وبعد الخروج انسخه إلى deepchat-updates/
```
### 10.6 إعداد عميل DeepChat (من جانب الموظف)
1. DeepChat ← الإعدادات ← خدمة النماذج ← مزوّد مخصص / متوافق مع OpenAI؛
2. API Base URL: `http://<عنوان-IP-الخادم>:3000/v1` (يجب استخدام عنوان IP الداخلي)؛
3. مفتاح API: `sk-xxx` الخاص بـ `deepchat-key`؛
4. النموذج: `deepseek-chat`، وبعد الحفظ جرّب محادثة للاختبار.
> 📖 الوثائق الرسمية:البداية السريعة لـ DeepChat https://deepchatai.cn/docs/guide/getting-started/ · المستودع مفتوح المصدر https://github.com/ThinkInAIXYZ/deepchat

## 11. MCP Gateway وسوق المهارات (Skill)

> 📌 يعتمد MCP Gateway على `@modelcontextprotocol/sdk` الرسمي، ويعرض نقطة نهاية Streamable HTTP القياسية `/mcp`، وقد أُدمج في `docker-compose.yml` الرئيسي (المنفذ 3100) ليبدأ مع الخدمات الأساسية. المصدر في `mcp-gateway/`.
### 11.1 أدوات المنصة المدمجة
| الأداة | الاستخدام |
| --- | --- |
| `platform_time` | يعيد الوقت الحالي للخادم |
| `platform_echo` | يعيد النص كما هو (لاختبار الاتصال) |
| `platform_services` | يعرض قائمة خدمات المنصة |
### 11.2 تجميع خوادم MCP خارجية
عدّل `mcp-gateway/mcp-servers.json` وأضف نوع stdio أو http، ثم أعد تشغيل `mcp-gateway` لتفعيل التغيير:
```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```
تُضاف البادئة `{serverName}_` تلقائيًا إلى الأدوات المجمعة لتجنب تكرار الأسماء.
### 11.3 ربط العملاء
1. DeepChat: الإعدادات ← MCP ← إضافة خادم ← النوع «HTTP قابل للبث» والعنوان `http://<عنوان-IP-الخادم>:3100/mcp`؛
2. سير عمل Dify: وجّه إعداد الأداة المخصصة / أداة MCP إلى العنوان نفسه.
> التحقق: يعيد `curl http://<عنوان-IP-الخادم>:3100/health` الناتج `{"status":"ok"}`؛ ويعيد `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` قائمة الأدوات.
### 11.4 سوق المهارات (توزيع حزم المهارات داخليًا)
| نقطة النهاية | الوظيفة |
| --- | --- |
| `/market` | صفحة سوق المهارات (تصفح البطاقات + تنزيل ZIP + نسخ عنوان التثبيت) |
| `/skills` | قائمة المهارات بصيغة JSON (name/description/version) |
| `/skills/<الاسم>.zip` | تنزيل حزمة المهارة (تغليف ديناميكي) |
توضع المهارات في مجلد `mcp-gateway/skills/` (أدلة فرعية تحتوي SKILL.md)، **وتُفحص تلقائيًا عند كل طلب دون حاجة لإعادة التشغيل**. تتضمن مهارة إرشادية مدمجة باسم `skill-market`.
> 📌 في DeepChat يُعد MCP وSkill مفهومين مختلفين: MCP هو «أداة» (function calling)، أما Skill فهو «حزمة مهارات للوكيل الذكي» (SKILL.md + سكربتات). لا يوجد «عنوان سوق مخصص» لمهارات DeepChat، بل تدعم ثلاثة أنماط للتثبيت فقط: مجلد/ZIP/عنوان URL، ويتم التوزيع الداخلي عبر «التثبيت بعنوان URL» بشكل غير مباشر.
### 11.5 ⚠️ اسم مضيف سوق المهارات (معامل نشر يجب استبداله)
يقرأ «مدير المهارات» `market_url` من `config.json` لطلب قائمة `/skills`. هناك نقطتان مهمتان:
- **استخدم اسم مضيف وليس عنوان IP**: بيئة الوكيل في DeepChat تُخفي عنوان IP وتحوله إلى `[IP_ADDRESS_REDACTED]`، فلا يمكن قراءة العنوان الحقيقي؛
- **اسم المضيف معامل نشر**: يختلف من نشر إلى آخر ولا يمكن نسخه كما هو.
```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<اسم-مضيف-السوق>:3100" }
```
##### تلقائي (عبر النشر بالوكيل)
عند جمع المعاملات يسألك الوكيل عن «اسم مضيف سوق المهارات» ويستبدل تلقائيًا `<اسم-مضيف-السوق>` في `config.json` و`SKILL.md`.
##### يدوي
1. عدّل العنوان الاحتياطي في `config.json` + `SKILL.md` واستبدل `<اسم-مضيف-السوق>`؛
2. اجعل اسم المضيف قابلًا للحل: على جهاز واحد أضف `<عنوان-IP-الخادم>  <اسم-المضيف>` في `C:\Windows\System32\drivers\etc\hosts`؛ وعلى الشبكة الداخلية للشركة أضف سجل A في DNS.
> ✅ يُنصح باستخدام FQDN بصيغة «اسم الخدمة + نطاق الشركة» مثل `skillmarket.نطاق_شركتك`. لإضافة سجل A في DNS: على نطاق التحكم «DNS ← منطقة البحث الأمامي ← نطاقك ← مضيف جديد (A)»، أو استخدم `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "نطاقك" -IPv4Address "<عنوان-IP-الخادم>"`.
### 11.6 API الإدارة (للإضافة/الحذف/التعديل من مركز إدارة الذكاء الاصطناعي)
| نقطة النهاية | الوظيفة |
| --- | --- |
| `GET/POST /api/servers` و`PUT/DELETE /api/servers/:name` | إضافة/حذف/تعديل/استعلام خوادم MCP (مع الكتابة مرة أخرى إلى الإعدادات + إعادة الاتصال تلقائيًا) |
| `POST /api/skills/upload` | رفع حزمة مهارة بصيغة zip (مع التحقق من SKILL.md ومنع اختراق المسارات) |
| `DELETE /api/skills/:name` | حذف مهارة |
تتطلب رأس `X-Admin-Token` (من `MCP_ADMIN_TOKEN` في `.env`). تُستدعى عبر صفحة «MCP Gateway» في مركز إدارة الذكاء الاصطناعي (المحمية بدور `ai-platform-admin`).
> 📖 الوثائق الرسمية:بروتوكول MCP الرسمي https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 12. مركز إدارة الذكاء الاصطناعي

> 📌 التموضع: ليست منصة إدارة Docker (مثل 1Panel/Portainer)، بل لوحة إدارة موحدة للمديرين — مصادقة Keycloak + روابط لجميع المنتجات في القائمة اليسرى + حالة المجموعة في Dashboard + حساب مدير موحد.
### 12.1 القدرات الأساسية
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
### 12.2 تهيئة Global Administrator
```
# الإعداد في .env
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=انظر قائمة أسماء المستخدمين وكلمات المرور
ADMIN_EMAIL=ai_all_in_one_admin@<نطاق-الشركة>
```
بعد التشغيل يُنشأ المستخدم `ai_all_in_one_admin` تلقائيًا في Keycloak (ويتخطى الإنشاء إن كان موجودًا)، ويُمنح دور Realm `ai-platform-admin`. الفكرة الأساسية: **حساب Global Admin واحد يدير المنصة كلها**.
### 12.3 النشر عبر Docker Compose
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
### 12.4 إعداد عميل Keycloak
1. Keycloak ← enterprise-ai ← Clients ← Create؛
2. Client ID `AI-all-in-one-admin-portal` مع تفعيل Client authentication / Standard flow؛
3. Valid Redirect URIs: `http://127.0.0.1:10086/*` و`http://<عنوان-IP-الخادم>:10086/*`؛
4. انسخ Client Secret ← اكتبه في `KEYCLOAK_CLIENT_SECRET` داخل `.env` ← `docker compose up -d admin-portal`؛
5. أنشئ دور Realm `ai-platform-admin` وخصّصه إلى `ai_all_in_one_admin`.
- ⚠️ نقاط مهمة في النشر/استكشاف الأخطاء:
      
        تُخزَّن جلسات admin-portal في الذاكرة، وإعادة بناء الحاوية عبر `up -d` ستؤدي إلى **مسح جلسات تسجيل الدخول** (ويلزم إعادة الدخول)؛
- يجب حماية الصفحة الرئيسية `/` بواسطة Keycloak (`express.static(..., {index:false})` + `app.get('/', keycloak.protect())` صراحةً)، وإلا ستُعرض لوحة فارغة عند عدم تسجيل الدخول؛
- استخدم البريد الإلكتروني الفعلي للمدير (`ai_all_in_one_admin@<نطاق-الشركة>`، المطابق للمسؤول العام في AD) في إحصاءات Dify؛
- **بعد تعديل server.js يجب تنفيذ `docker restart admin-portal`**، ولا تستخدم `up -d` (لأن تغيير محتوى ملف الحجم لا يؤدي إلى إعادة البناء).
### 12.5 التحقق
1. افتح `http://<عنوان-IP-الخادم>:10086` ← سينتقل تلقائيًا إلى تسجيل الدخول في Keycloak (لا تظهر لوحة فارغة دون تسجيل الدخول)؛
2. سجّل الدخول بـ `ai_all_in_one_admin` ← ادخل إلى لوحة النظرة العامة؛
3. تعرض Dashboard مؤشرات 8 منتجات + تجميع الحاويات؛
4. عند النقر على أي منتج تُعرض الإحصاءات أولًا، ولا يُنقَل إلا عند النقر على «فتح اللوحة»؛
5. يمكن التبديل بين 9 لغات من إعدادات النظام.
### 12.6 تفويض المسؤول لكل وحدة + إدارة صفحة Keycloak (v0.91)
يمكن للمسؤول العام إدارة المسؤولين الآخرين و Keycloak من مركز إدارة AI:
- **حسابات المسؤولين**: ابحث عن حساب موجود في موفّر الهوية Keycloak (مستخدمو AD/LDAP، لا إنشاء حساب جديد ولا كلمة مرور) → اختر الوحدات → تأكيد. يمنح النظام دور Realm `admin:<المنتج>` و**يفعّل المنتج فعلياً** (SSO أولاً ثم API): Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse. إلغاء وحدة أو حذف مسؤول **يحذف الحساب من المنتج**. المنتجات بدون SSO تولّد كلمة مرور مؤقتة تُعرض عبر أيقونة 🔑 (للمسؤول العام فقط). يرى غير المسؤولين رسالة «لست مسؤولاً» ويُسجّل خروجهم.
- **صفحة Keycloak**: زرّا «مزامنة الكل / مزامنة التغييرات» لجلب تغييرات AD بنقرة واحدة؛ كل صف مستخدم فيه «تعديل» (إلى وحدة تحكم Keycloak) و«حذف»؛ قسم الأدوار يدعم إنشاء/حذف الأدوار وعرض الأعضاء. عمليات المزامنة/الحذف/الأدوار للمسؤول العام فقط.
> ⚠️ ملاحظة: لا يوجد في Keycloak نقطة نهاية «لمزامنة مستخدم واحد» — المزامنة التزايدية تجلب كل حسابات AD المتغيّرة. يظهر المستخدمون المربوطون بـ AD مجدداً بعد المزامنة الكاملة التالية أو تسجيل الدخول التالي عبر SSO؛ ولإزالتهم نهائياً، عطّل/احذف الحساب في AD.

## 13. قائمة التحقق من الترابط

ينتهي قسم النشر هنا. وأخيرًا تحقق من البنود الاثني عشر التالية واحدًا تلو الآخر؛ فوجود ✅ على جميعها يعني أن المنصة تعمل فعلًا.
| # | الترابط | طريقة التحقق |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | اختبار قناة NewAPI يعيد OK |
| 2 | Dify → NewAPI | اختبار مزوّد النماذج في Dify يعيد ردًا |
| 3 | DeepChat → NewAPI | إرسال رسالة من DeepChat يعيد ردًا |
| 4 | Keycloak → NewAPI | تسجيل الدخول إلى NewAPI عبر OIDC بحساب Keycloak |
| 5 | Keycloak → Dify | تسجيل الدخول إلى Dify عبر SSO بحساب Keycloak |
| 6 | MCP Gateway → DeepChat | يحصل DeepChat على قائمة أدوات MCP ويستدعيها |
| 7 | MCP Gateway → Dify | يستدعي سير عمل Dify أداة MCP |
| 8 | Gitea Runner → Docker | يمكن لـ Runner تنفيذ مهام CI/CD |
| 9 | Gitea → خادم التحديثات | يمكن رفع نواتج CI إلى خادم التحديثات |
| 10 | Ghost API → Gitea | يمكن لـ Gitea Actions استدعاء Ghost API لنشر إعلان |
| 11 | Ghost → Dify انتقال | ينتقل «منضدة عمل AI» في البوابة إلى Dify بشكل صحيح |
| 12 | مركز إدارة الذكاء الاصطناعي | تعرض Dashboard جميع الحاويات + يمكن الوصول إلى جميع المنتجات من القائمة اليسرى |
> ✅ بعد اجتياز الجميع، انتقل إلى الجزء الثاني «قسم الإدارة» لتعلّم العمليات اليومية لكل منتج، وإلى الجزء الثالث «قسم التشغيل والصيانة» الخاص بالنسخ الاحتياطي والفحص الصحي واستكشاف الأخطاء.

**الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)**

## 14. الإدارة اليومية لـ Keycloak

Keycloak**المدخل**: http://<عنوان-IP-الخادم>:9090 ← Administration Console ← تسجيل دخول المدير.
> 📌 يمكن تنفيذ كثير من هذه العمليات أيضاً من مركز إدارة AI → صفحة Keycloak (للمسؤول العام فقط): مزامنة LDAP الكاملة/التزايدية، حذف المستخدمين، وإدارة الأدوار (عرض/إنشاء/حذف/عرض الأعضاء). انظر الفصل 12.6.
### 14.1 إدارة المستخدمين
1. **إنشاء مستخدم**: Users ← Add user ← اكتب اسم المستخدم ← Create؛
2. **تعيين كلمة المرور**: من تبويب Credentials الخاص بالمستخدم ← عيّن كلمة المرور ← أوقف خيار Temporary (وإلا سيُجبر على تغييرها عند أول تسجيل دخول)؛
3. **إعادة تعيين كلمة المرور**: Users ← ابحث عن المستخدم ← Credentials ← Set password؛
4. **التعطيل/التفعيل**: مفتاح Enabled أعلى تفاصيل المستخدم (عند التعطيل تتوقف جميع جلسات SSO الخاصة به فورًا)؛
5. **الحذف**: تفاصيل المستخدم ← Delete.
### 14.2 الأدوار والصلاحيات
- **دور Realm**: Realm roles ← Create role لإنشاء دور (مثل `ai-platform-admin`)؛
- **تخصيص الدور**: المستخدم ← Role mapping ← Assign role؛
- **المجموعات**: Groups ← أنشئ مجموعة (`ai-admin` / `ai-user`) ← أضف المستخدمين إلى المجموعة، وخصّص الأدوار للمجموعة ليرث المستخدمون الصلاحيات عبر المجموعة.
> ✅ تُدار صلاحيات الإدارة بشكل موحد عبر دور `ai-platform-admin`، وتستخدم المنتجات هذا الدور لتحديد المدير عند ربط SSO.
### 14.3 عملاء OIDC (ربط المنتجات الجديدة بـ SSO)
1. Clients ← Create client ← اكتب اسم المنتج في Client ID (مثل `newapi` / `grafana` / `langfuse`)؛
2. Client authentication: On (وإلا لن يظهر تبويب Credentials)، وStandard flow: On؛
3. اكتب عنوان رد نداء المنتج في Valid redirect URIs / Web origins (أضف عنوان IP الداخلي و127.0.0.1 معًا)؛
4. احفظ ← انسخ Client secret من تبويب Credentials وسلّمه إلى المنتج.
### 14.4 صيانة اتحاد AD / LDAP
- **تغيير نطاق التحكم/كلمة المرور**: User Federation ← انقر على LDAP Provider ← غيّر Connection URL / Bind credentials ← Save؛
- **المزامنة اليدوية**: Synchronize all users؛
- **تعيين المجموعات**: من تبويب Mappers ← group-ldap-mapper ← عيّن Groups DN إلى الحاوية التي توجد بها مجموعات AD، واربط مجموعات AD بأدوار Keycloak.
### 14.5 إدارة الجلسات
- **عرض الجلسات النشطة**: Users ← مستخدم معين ← Sessions؛
- **تسجيل الخروج القسري**: Sessions ← Sign out all؛
- **إعداد الجلسات/الرموز العامة**: من Realm settings ← تبويب Sessions / Tokens لضبط المهلة.
> ⚠️ مراجعة النقاط الحرجة: ① حافظ على المسافات في CN الخاص بـ bind DN كما هي؛ ② استخدم `sAMAccountName` في Username LDAP attribute وليس `cn`؛ ③ اختر Subtree في Search scope؛ ④ عند ظهور `unknown_error` في SSO فغالبًا يرجع السبب إلى عدم تشغيل iphlpsvc في المضيف مما يعطّل إعادة توجيه منافذ AD؛ ⑤ عندما يكون جهاز نطاق التحكم AD غير مشغّل يظهر `LDAP Connection refused` عند تسجيل دخول حسابات اتحاد LDAP.
> 📖 الوثائق الرسمية:وثائق Keycloak الرسمية https://www.keycloak.org/documentation · دليل إدارة الخادم https://www.keycloak.org/server/

## 15. الإدارة اليومية لـ NewAPI

NewAPI**المدخل**: http://<عنوان-IP-الخادم>:3000.
### 15.1 إدارة القنوات (النماذج العلوية)
1. **إضافة قناة**: القنوات ← إضافة قناة جديدة ← النوع OpenAI (أو Claude وغيرها) ← Base URL `http://litellm:4000` ← المفتاح `LITELLM_MASTER_KEY` ← اكتب اسم النموذج ← احفظ؛
2. **الاختبار**: انقر «اختبار» في قائمة القنوات واختر النموذج للتحقق من الاتصال؛
3. **التعطيل/التفعيل**: مفتاح في قائمة القنوات؛ عند التعطيل لن تستقبل القناة طلبات؛
4. **الأولوية/الوزن**: عند تعدد القنوات لنفس النموذج يُوزع التدفق حسب الأولوية/الوزن.
### 15.2 إدارة الرموز (مفاتيح API)
1. **إنشاء**: مفاتيح API ← رمز جديد ← سمِّه (مثل `deepchat-key`) ← يمكن تعيين الحصة/تاريخ الانتهاء/قيود النموذج ← احفظ؛
2. **نسخ المفتاح**: يبدأ بـ `sk-`، **يُعرض مرة واحدة فقط فاحفظه فورًا**؛
3. **التعطيل/الحذف**: من قائمة الرموز (عند التعطيل يتوقف المفتاح فورًا)؛
4. **الاطلاع على الاستخدام**: اعرض الحصة المستهلكة في تفاصيل الرمز.
### 15.3 الحصص والمستخدمون
- **الحصة الافتراضية للمستخدم الجديد**: `DEFAULT_QUOTA` (يُوصى بـ 100 دولار)؛
- **رفع حصة مستخدم بعينه**: صفحة المستخدمين ← عدّل المستخدم ← عيّن الحصة؛
- **الشحن/الحظر**: من صفحة المستخدمين؛
- **إدارة المجموعات**: أنشئ مجموعات حسب الأقسام وعيّن مضاعف النموذج/الحصة، وبمجرد انضمام المستخدم إلى مجموعة تُدار وفقًا للقسم.
### 15.4 السجلات والتكلفة
- **صفحة السجلات**: استعرض المستخدم/النموذج/token/الحصة/التكلفة/عنوان IP المصدر لكل استدعاء؛
- **تقارير التكلفة**: تتوفر في صفحة «إدارة NewAPI» بمركز إدارة الذكاء الاصطناعي تقارير تكلفة مجمعة حسب المستخدم/النموذج/التاريخ + آخر 100 سجل تدقيق.
> 📌 يعتمد تسجيل عنوان IP الخاص بالعميل على إعداد «تسجيل سجل IP» للمستخدم (`record_ip_log`، وهو معطّل افتراضيًا)؛ فعّله للمستخدمين المعنيين عند الحاجة إلى تدقيق IP.
### 15.5 نقاط مهمة في إعدادات النظام
- **عنوان الخادم**: يجب ضبطه إلى العنوان الداخلي `http://<عنوان-IP-الخادم>:3000` (وإلا سيظهر خطأ OIDC `invalid_grant - Incorrect redirect_uri`)؛
- **المصادقة ← OAuth مخصص**: ربط Keycloak OIDC (انظر الفصل 7)؛
- **وضع الاستخدام**: يمكن التبديل بين الاستخدام الشخصي ↔ التشغيل الخارجي.
> ⚠️ مراجعة النقاط الحرجة: ① اكتب في Base URL الخاص بالقناة اسم الحاوية دائمًا `http://litellm:4000`؛ ② تحكم في تحديد المعدل 429 عبر متغيرات مثل `CRITICAL_RATE_LIMIT_ENABLE=false`؛ ③ عند تعديل قاعدة البيانات استخدم متغير البيئة `MYSQL_PWD` مباشرة لتجنب اعتبار تحذير كلمة المرور في stderr خطأً.
> 📖 الوثائق الرسمية:وثائق NewAPI الرسمية https://docs.newapi.pro · الموقع الرسمي https://www.newapi.ai · المستودع مفتوح المصدر https://github.com/QuantumNous/new-api

## 16. الإدارة اليومية لـ LiteLLM

**المدخل**: http://<عنوان-IP-الخادم>:4001 (API خالص بدون واجهة ويب، ويُستخدم `/v1/models` للتجربة). الإعداد في `litellm-config.yaml`.
### 16.1 صيانة قائمة النماذج
عدّل `model_list` في `litellm-config.yaml` لإضافة/حذف النماذج ومفاتيح API المقابلة. خطوات إضافة مزوّد جديد:
1. أزل التعليق عن `# OPENAI_API_KEY=` في `.env` واملأ المفتاح؛
2. أزل التعليق عن كتلة النموذج المقابلة في `litellm-config.yaml`؛
3. `docker compose up -d litellm`.
### 16.2 التخزين المؤقت للاستجابات
تخزين مؤقت بتطابق تام عبر Redis، تُشارك الطلبات المتطابقة تمامًا بين المستخدمين. اضبط `cache_params.ttl` (الافتراضي 3600 ثانية). للإيقاف: اضبط `cache: false` ثم أعد التشغيل.
### 16.3 الإبلاغ إلى Langfuse
يُبلَّغ تلقائيًا عن كل استدعاء عبر `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` في `.env`.
### 16.4 إعادة التشغيل واستكشاف الأخطاء
```
docker compose restart litellm          # أعد التشغيل بعد تعديل الإعداد
docker logs litellm --tail 50           # عرض السجلات
```
> ⚠️ نقاط حرجة: ① يجب إضافة `default_on: true` إلى guardrails لتفعيلها عالميًا؛ ② إخفاء PII (Presidio) معلّق حاليًا بسبب تغيير في API العلوية، ويعمل كوسيط خالص فقط؛ ③ استخدم الإصدار المستقر `v1.95.1` (يحتوي `main-latest` على أخطاء).
> 📖 الوثائق الرسمية:وثائق LiteLLM الرسمية https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

## 17. الإدارة اليومية لـ Dify

Dify**المدخل**: http://<عنوان-IP-الخادم> (المنفذ 80، وباستخدام compose الرسمي المستقل، وتُجرى الترقية والصيانة بشكل منفصل في `dify/docker/`).
### 17.1 إدارة التطبيقات (الاستوديو)
1. **إنشاء تطبيق**: الاستوديو ← إنشاء تطبيق فارغ ← اختر النوع (مساعد محادثة / Agent / سير عمل / توليد نصوص)؛
2. **التنسيق**: اسحب العقد لتنظيم الموجهات والأدوات وقواعد المعرفة والمتغيرات؛
3. **التجربة**: شغّل «المعاينة» أعلى اليمين للتجربة؛
4. **النشر**: بعد نجاح التجربة انقر «نشر» ← لتوليد رابط مشاركة أو تضمين تطبيق الويب.
### 17.2 إدارة قواعد المعرفة
1. قاعدة المعرفة ← إنشاء قاعدة معرفة؛
2. ارفع المستندات (Word / PDF / Markdown / روابط صفحات ويب) واختر قاعدة التقسيم + طريقة الفهرسة (جودة عالية/اقتصادية)؛
3. أضف قاعدة المعرفة تلك داخل التطبيق ليتمكن الذكاء الاصطناعي من الإجابة بناءً على المستندات.
> 📌 ستُستخدم محتويات قاعدة المعرفة في إجابات الذكاء الاصطناعي، لذا لا ترفع المستندات السرية (التزم بضوابط تصنيف البيانات).
### 17.3 مزوّدو النماذج
- **إضافة نموذج**: الإعدادات ← مزوّدو النماذج ← OpenAI-API-compatible ← API endpoint `http://host.docker.internal:3000/v1` (عبر NewAPI) + `dify-key`؛
- **إعداد نموذج النظام**: حدّد نماذج المحادثة/الاستدلال/التضمين الافتراضية.
### 17.4 الأعضاء والصلاحيات
- **الأعضاء**: ادعُ الأعضاء إلى مساحة العمل وعيّن أدوار Owner/Admin/Editor/Normal؛
- **طريقة تسجيل الدخول**: الإعدادات ← طريقة تسجيل الدخول ← يمكن ربط OIDC (Keycloak) لتفعيل SSO.
### 17.5 الترقية والصيانة
```
cd dify\docker
git pull                          # اسحب أحدث إصدار
docker compose pull               # اسحب الصور الجديدة
docker compose up -d              # أعد البناء
```
> ⚠️ نقاط حرجة: ① يجب ضبط `NEXT_PUBLIC_SOCKET_URL` الخاص بـ WebSocket إلى عنوان IP الداخلي؛ ② كلمة مرور تسجيل الدخول مُرمَّزة بصيغة base64؛ ③ عند نسيان كلمة المرور استخدم `docker exec docker-api-1 flask reset-password` (8 أحرف فأكثر).
> 📖 الوثائق الرسمية:وثائق Dify الرسمية https://docs.dify.ai · الاستضافة الذاتية https://docs.dify.ai/getting-started/install-self-hosted

## 18. الإدارة اليومية لـ Ghost

Ghost**المدخل**: الواجهة الأمامية http://<عنوان-IP-الخادم>:8090؛ واللوحة http://<عنوان-IP-الخادم>:8090/ghost/ (انتبه للاحقة /ghost/).
### 18.1 تسجيل الدخول إلى اللوحة
تستخدم لوحة Ghost 5 **تسجيل دخول بدون كلمة مرور**: أدخل البريد الإلكتروني ← يرسل Ghost رمز تحقق من 6 أرقام إلى MailHog (`:8025`). والطريقة الأسرع: انقر زر «فتح» في «لوحة Ghost» بمركز إدارة الذكاء الاصطناعي ليتم تسجيل الدخول تلقائيًا (بحساب رمز TOTP محليًا دون البحث في البريد).
### 18.2 نشر المحتوى
1. **المقالات**: Posts ← New post ← اكتب المحتوى (محرر Markdown) ← Publish؛
2. **الصفحات**: Pages ← New page (مثل «مركز التنزيلات» وslug `downloads`)؛
3. **الوسوم/التصنيفات**: Tags ← أنشئ تصنيفًا (مثل `news` / `docs`) وصنّف المقالات تحته.
### 18.3 قائمة التنقل
1. اللوحة ← المظهر (Design) ← القوائم (Navigation)؛
2. عدّل قائمة «Primary» الرئيسية وأضف الرئيسية/الأخبار/مركز التنزيلات/منضدة عمل AI/مستندات المساعدة (انظر جدول القوائم في الفصل 9).
### 18.4 القوالب
- **التبديل**: المظهر ← القوالب، فعّل القوالب المدمجة Casper / Source مباشرة؛
- **التثبيت**: سوق القوالب (Design ← Change theme) أو رفع ملف zip.
> ⚠️ لا تثبّت أحدث إصدار من القوالب من GitHub (قد يكون متوافقًا مع Ghost 6.x وستظهر رسالة incompatible مع 5.x)، بل ثبّت إصدارًا أقدم بصيغة zip.
### 18.5 الأعضاء والاشتراكات (عند الحاجة)
- Members: إدارة المشتركين؛
- إن لم تكن بحاجة إلى الاشتراكات فيمكن تجاهل هذه الوحدة (فالبوابة الداخلية لا تحتاجها عادة).
### 18.6 التكامل (رموز API)
1. اللوحة ← Settings ← Integrations ← إضافة تكامل مخصص؛
2. ولّد Admin API Key (بصيغة `id:secret`) لاستخدامه في أتمتة نشر الإعلانات عبر Gitea Actions وغيرها.
> ⚠️ نقاط حرجة: ① لا تنقر «التسجيل» في الصفحة الرئيسية `/` (فهي لتسجيل الزوار المشتركين)؛ ② رمز التحقق من 6 أرقام هو في جوهره TOTP ويمكن لمركز إدارة الذكاء الاصطناعي حسابه محليًا؛ ③ حتى مع الحساب المحلي للرمز سيظل Ghost يرسل البريد فعليًا، لذا يجب الإبقاء على MailHog (وإلا سيظهر `Failed to send email`).
> 📖 الوثائق الرسمية:وثائق Ghost الرسمية https://ghost.org/docs/ · لوحة الإدارة https://ghost.org/docs/admin/

## 19. الإدارة اليومية لـ Gitea

Gitea**المدخل**: الويب http://<عنوان-IP-الخادم>:3002؛ وSSH `ssh://git@<عنوان-IP-الخادم>:2222`.
### 19.1 المستودعات والمنظمات
1. **إنشاء مستودع**: علامة + أعلى اليمين ← New repository؛
2. **إنشاء منظمة**: + ← New organization، وأنشئ المستودعات وأدر الفرق تحت المنظمة؛
3. **ترحيل مستودع خارجي**: + ← New migration، واكتب عنوان GitHub لعمل mirror (مزامنة للمصدر للقراءة فقط).
### 19.2 المستخدمون والصلاحيات
- **إضافة مستخدم**: Site Administration ← User Accounts ← Create user؛
- **صلاحيات المستودع**: المستودع ← Settings ← Collaborators؛
- **فرق المنظمة**: المنظمة ← Teams ← أنشئ فريقًا ← أضف الأعضاء ← امنح صلاحيات المستودع.
### 19.3 إدارة Actions / Runner
1. **تفعيل Actions**: Site Administration ← Actions ← Enabled؛
2. **تسجيل Runner**: Runners ← Create new Runner ← انسخ الرمز ← اكتبه في `GITEA_RUNNER_TOKEN` داخل `.env` ← `docker compose up -d gitea-runner`؛
3. **الاطلاع على حالة Runner**: عرض صفحة Runners لحالة Idle (بالأخضر) التي تعني أنه سليم؛
4. **تشغيل سير العمل**: المستودع ← Actions ← التشغيل اليدوي أو التشغيل عند push.
> ⚠️ عند تغيير رمز Runner يجب استخدام `up -d` (لأن restart لا يعيد قراءة .env).
### 19.4 إعدادات الموقع
- **ROOT_URL**: يجب ضبط `GITEA__server__ROOT_URL` إلى العنوان الداخلي `http://<عنوان-IP-الخادم>:3002/` وإلا ستُولَّد روابط المستودعات بصيغة localhost؛
- **سياسة التسجيل**: Site Administration ← Config لضبط مفتاح التسجيل وإعداد البريد الإلكتروني.
> ⚠️ نقطة حرجة: خطأ `readonly database` غالبًا لأن مالك `gitea.db` هو root؛ احذف قاعدة البيانات التي يملكها root ليعاد إنشاؤها بحساب المستخدم git.
> 📖 الوثائق الرسمية:وثائق Gitea الرسمية (بالصينية) https://docs.gitea.com/zh-cn · الإدارة https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

## 20. الإدارة اليومية لـ MCP Gateway

**المدخل**: http://<عنوان-IP-الخادم>:3100 (صفحة السوق `/market`). تُجرى الإدارة عبر صفحة «MCP Gateway» في مركز إدارة الذكاء الاصطناعي (بدور `ai-platform-admin`)، ويمكن أيضًا استدعاء API الإدارة مباشرة.
### 20.1 إدارة خوادم MCP
1. عدّل `mcp-gateway/mcp-servers.json` لإضافة/حذف الخوادم (نوعا stdio/http)؛
2. أعد التشغيل `docker compose restart mcp-gateway`؛
3. أو أضف/احذف من صفحة MCP Gateway في مركز إدارة الذكاء الاصطناعي (مع الكتابة مرة أخرى إلى الإعداد + إعادة الاتصال تلقائيًا).
### 20.2 إدارة المهارات (حزم المهارات)
1. **الرفع**: صفحة MCP Gateway في مركز إدارة الذكاء الاصطناعي ← رفع حزمة مهارة بصيغة zip (مع التحقق من احتوائها على SKILL.md ومنع اختراق المسارات)؛
2. **الحذف**: احذف المهارة المقابلة؛
3. توضع المهارات في `mcp-gateway/skills/` (أدلة فرعية تحتوي SKILL.md)، وتُفحص تلقائيًا عند كل طلب دون حاجة لإعادة التشغيل.
### 20.3 توسيع الأدوات المدمجة
أضف خطوتين في `mcp-gateway/gateway.js`:
```
// ① تعريف الأداة (أضف عنصرًا إلى مصفوفة builtinTools)
{ name: 'platform_health', description: 'الاستعلام عن حالة سلامة الخدمات',
  inputSchema: { type: 'object', properties: {} } }

// ② منطق التنفيذ (أضف فرعًا إلى callBuiltin)
if (name === 'platform_health') { return 'جميع الخدمات تعمل بشكل سليم'; }
```
بعد التعديل نفّذ `docker compose restart mcp-gateway`.
### 20.4 صيانة عنوان سوق skill-market
يوجد `market_url` الخاص بـ «مدير المهارات» في `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`، ويجب استخدام اسم مضيف (وليس عنوان IP) لأنه معامل نشر (راجع الفصل 11).
> ⚠️ يتطلب API الإدارة رأس `X-Admin-Token` (من `MCP_ADMIN_TOKEN` في `.env`)؛ يعيد 503 عند عدم الضبط و401 عند خطأ الرمز.
> 📖 الوثائق الرسمية:بروتوكول MCP الرسمي https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

## 21. إدارة خادم التحديثات

**المدخل**: http://<عنوان-IP-الخادم>:8091 والبيانات في `deepchat-updates/`.
### 21.1 وضع إصدار جديد يدويًا
1. نزّل حزمة تثبيت DeepChat الرسمية إلى `deepchat-updates/deepchat/`؛
2. حدّث `version.txt` (اكتب رقم الإصدار الجديد)؛
3. عند التحديث التلقائي في DeepChat لدى الموظف يتحقق من `version.txt`، وعند اكتشاف إصدار جديد ينزّله ويثبّته.
### 21.2 المزامنة التلقائية (موصى بها)
تعتمد على Gitea Actions في مستودع `deepchat-sync` للتحقق يوميًا من إصدارات GitHub الجديدة ومزامنتها (انظر الفصل 10). التشغيل اليدوي:
```
curl -X POST "http://<عنوان-IP-الخادم>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<كلمة-المرور>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```
### 21.3 إعداد المزامنة (sync-config.json)
| الحقل | الوظيفة |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | بادئة تسريع التنزيل (مثل ghproxy.com) |
| `keep_releases` | عدد الإصدارات التاريخية المحفوظة |
| `market_url` | عنوان سوق «مدير المهارات» في صفحة التنزيل |
> 📌 عند ظهور «انتهاء مهلة الاتصال بالنموذج» في عميل DeepChat فغالبًا يرجع السبب إلى مرور العميل عبر وكيل نظام معطل (`ECONNREFUSED 127.0.0.1:33210`). اطلب من المستخدم تغيير الخيار إلى «بدون وكيل/اتصال مباشر» في DeepChat من «الإعدادات ← الشبكة/الوكيل».
> 📖 الوثائق الرسمية:البداية السريعة لـ DeepChat https://deepchatai.cn/docs/guide/getting-started/ · المستودع مفتوح المصدر https://github.com/ThinkInAIXYZ/deepchat

## 22. إدارة المراقبة والإنذارات

Grafana**المدخل**: Grafana http://<عنوان-IP-الخادم>:3030 (تسجيل دخول SSO تلقائي)؛ وPrometheus :9091؛ وAlertmanager :9093.
### 22.1 المكونات والمنافذ
| المكوّن | المنفذ | الاستخدام |
| --- | --- | --- |
| cadvisor | 8080 (داخلي) | جمع CPU/الذاكرة/الشبكة/القرص لكل حاوية |
| Prometheus | 9091 | تجميع المؤشرات + قواعد الإنذار (`monitoring/alerts.yml`) |
| Grafana | 3030 | لوحة مرئية (مُعدّة مسبقًا «AI All In One — مراقبة الحاويات») |
| Alertmanager | 9093 | إزالة التكرار/التجميع/التوجيه/الإشعار للإنذارات |
### 22.2 عرض اللوحة
1. سجّل الدخول إلى Grafana (`ai_all_in_one_admin` / كلمة المرور الموحدة، تسجيل دخول SSO تلقائي)؛
2. افتح لوحة «AI All In One — مراقبة الحاويات» واعرض CPU/الذاكرة/الشبكة لكل حاوية.
### 22.3 قواعد الإنذار
القواعد المُعدّة مسبقًا (`monitoring/alerts.yml`): تعطل الحاوية (critical)، وذاكرة الحاوية >90% (warning)، وCPU الحاوية >80% (warning).
> ⚠️ مأزق الإنذارات الكاذبة: يرسل cadvisor تقارير عن جميع مجموعات cgroup في المضيف (بما فيها systemd)، لذا يجب كتابة `{name!=""}` في قواعد الإنذار للتصفية، ويجب أيضًا إضافة `container_spec_memory_limit_bytes > 0` في إنذار الذاكرة (وإلا ستُطلق باستمرار بسبب القسمة على limit=0).
### 22.4 ربط إشعارات الإنذار (IM المؤسسي)
مسار الإنذار هو **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM المؤسسي**. قم بضبطه في قائمة **«العمليات → تنبيهات IM المؤسسية»** (يُحفظ الإعداد في Redis ويبقى بعد إعادة التشغيل):
- **المستقبلون**: أضف عدة مستقبلين. النوع «DingTalk/WeCom/Feishu» = روبوت مجموعة (أدخل رابط Webhook، يُرسل إلى المجموعة); النوع «تطبيق DingTalk (لشخص)» (AppKey/AppSecret/AgentId/userid) أو «تطبيق WeCom (لشخص)» (corpId/secret/agentid/userid) = تطبيق مؤسسي، يُرسل إلى أفراد.
- **قواعد الإرسال**: مفتاح عام، أدنى خطورة (حرج/تحذير/معلومات)، إرسال إشعارات «firing» / «resolved» أم لا.
- **سجل الإرسال**: يسجل كل إرسال (الوقت/المستقبل/النوع/اسم الإنذار/الخطورة/النتيجة)، مع ترقيم صفحات وتعديل حجم الصفحة وبحث بالكلمة المفتاحية وتصفية حسب النوع/النتيجة/الخطورة.
- لكل مستقبل زر «اختبار» لإرسال رسالة اختبار ومفتاح تفعيل.
> ⚠️ رابط Webhook لروبوت المجموعة لا يُرسل إلا إلى **مجموعة**، وليس إلى شخص. للإرسال إلى أفراد استخدم نوع «التطبيق المؤسسي» (DingTalk/WeCom)، الذي يتطلب تطبيقًا داخليًا منشأً في لوحة الإدارة مع صلاحية الرسائل. تحتاج روبوتات مجموعة DingTalk أيضًا إلى «كلمات مفتاحية مخصصة» (مثل «AI 平台» / «告警») أو «توقيع»، وإلا حُظرت الرسالة بسياسة الأمان.
> 📌 ملاحظة حول تعارض المنافذ: المنفذ الافتراضي 9090 لـ Prometheus مشغول بـ Keycloak فغُيّر إلى 9091؛ والمنفذان الافتراضيان 3000/3001 لـ Grafana مشغولان فغُيّر إلى 3030.
> 📖 الوثائق الرسمية:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

## 23. قابلية مراقبة LLM (Langfuse)

Langfuse**المدخل**: http://<عنوان-IP-الخادم>:3010 (تسجيل دخول SSO تلقائي، ويشير مدخل مركز إدارة الذكاء الاصطناعي إلى `/auth/sso-initiate?provider=KEYCLOAK`).
### 23.1 المكونات
| المكوّن | الاستخدام |
| --- | --- |
| langfuse | Web UI + عرض التتبع (3010) |
| langfuse-worker | معالجة الأحداث غير المتزامنة |
| langfuse-postgres | تخزين البيانات الوصفية |
| langfuse-clickhouse | تخزين بيانات الأحداث/التتبع |
| langfuse-minio | تخزين مرفقات/وسائط S3 |
| langfuse-redis | قائمة الانتظار |
يُبلّغ LiteLLM تلقائيًا عبر `success_callback: ["langfuse"]` (باستخدام `LANGFUSE_*` في `.env`).
### 23.2 عرض التتبع
1. سجّل الدخول إلى Langfuse ← اختر المنظمة `AI All In One` / المشروع `AI Platform`؛
2. اعرض كل استدعاء في قائمة Traces وانقر عليه لمشاهدة الموجه/الاستجابة/النموذج/زمن الاستجابة/الرموز/التكلفة؛
3. اربط جولات المحادثة المتعددة عبر Session.
### 23.3 استكشاف الأخطاء
- ⚠️ نقاط حرجة:
      
        يجب ضبط `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (لكل من web وworker)، وإلا سيفشل الإبلاغ عبر `trace-create` في SDK القديم ولن تظهر البيانات؛
- عند عدم ظهور البيانات مع تسجيل الدخول عبر SSO: حساب SSO (بريد AD) يختلف عن حساب التهيئة، وينشئ Langfuse تلقائيًا حسابًا لا ينتمي لأي منظمة. الإصلاح (إضافة مستخدم SSO إلى المنظمة):
```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<نطاق-الشركة>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```
> 📖 الوثائق الرسمية:وثائق Langfuse الرسمية https://langfuse.com/docs · الاستضافة الذاتية https://langfuse.com/self-hosting

## 24. السجلات الموحدة (Loki)

**المدخل**: صفحة «📜 السجلات الموحدة» في مركز إدارة الذكاء الاصطناعي (الأسهل)، أو Loki http://<عنوان-IP-الخادم>:3110.
### 24.1 المكونات
| المكوّن | المنفذ | الاستخدام |
| --- | --- | --- |
| Loki | 3110 | تخزين السجلات والاستعلام عنها (جهاز واحد ونظام ملفات محلي) |
| Promtail | — (داخلي) | يكتشف الحاويات عبر docker.sock ويجمع سجلات json ويدفعها إلى Loki |
### 24.2 الاستعلام عن السجلات
1. مركز إدارة الذكاء الاصطناعي ← السجلات الموحدة؛
2. اختر الحاوية (قائمة منسدلة) ← اكتب الكلمة المفتاحية ← اختر النطاق الزمني ← استعلم؛
3. تستخدم الواجهة الخلفية `/api/logs/query` للاستعلام في Loki عبر LogQL.
### 24.3 مرجع سريع لـ LogQL
```
{container="new-api"} |= "error"              # الأسطر التي تحتوي error في حاوية معينة
{container=~".+"} |~ "(?i)error|exception"      # المطابقة في جميع الحاويات
{service="litellm"} |= "EMAIL"                  # الاستعلام حسب الخدمة
```
> 📌 تسميات Loki هي `container / project / service`، **ولا توجد `job`**. استخدم `{container=~".+"}` في الاستعلام بدلًا من `{job="docker"}`.
> ⚠️ نقطة حرجة (تركيب Docker Desktop): يجب أن يركّب Promtail `/var/run/docker.sock` و`/var/lib/docker/containers` (تحت WSL2 تشير إلى داخل جهاز Docker Desktop الافتراضي وهو موضع السجلات بالضبط)؛ ولا تستخدم مسار `C:\...\containers` الخاص بـ Windows في المضيف. استخدم في Loki أحادي الجهاز `store: tsdb` + filesystem.
> 📖 الوثائق الرسمية:وثائق Loki الرسمية https://grafana.com/docs/loki/latest/

## 25. إخفاء بيانات PII (Presidio)

### 25.1 طبقتا الإخفاء
| الطبقة | القدرة |
| --- | --- |
| التعبيرات النمطية المدمجة في LiteLLM (`litellm_content_filter`) | أرقام الهاتف وبطاقات الهوية والبطاقات المصرفية والبريد الإلكتروني ورمز الائتمان الاجتماعي الموحد وجوازات السفر وIPv4 وغيرها؛ عند التطابق تُستبدل بـ `[xxx_REDACTED]`؛ وعند مطابقة قائمة الكلمات الحساسة السوداء يُرفض الطلب بـ BLOCK |
| Microsoft Presidio | كيانات أدق تفصيلًا (أسماء الأشخاص الإنجليزية والبريد الإلكتروني وغيرها)، `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |
### 25.2 قواعد التعبيرات النمطية المدمجة
| القاعدة | التعبير النمطي | النوع |
| --- | --- | --- |
| رقم الهاتف الصيني | `\b1[3-9]\d{9}\b` | cn_mobile |
| رقم بطاقة الهوية | `\b\d{17}[\dXx]\b` | cn_id |
| رقم البطاقة المصرفية | `\b\d{16,19}\b` | bank_card |
| البريد الإلكتروني | prebuilt `email` | email |
| رمز الائتمان الاجتماعي الموحد | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| رقم جواز السفر | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |
تُضاف وتُحذف القائمة السوداء للكلمات الحساسة في `blocked_words` داخل `litellm-config.yaml` حسب حاجة الشركة الفعلية (`أسرار داخلية` و`أسرار تجارية` وغيرها).
### 25.3 تفعيل Presidio (معلّق حاليًا)
بسبب تغيير guardrail API في الإصدار الأحدث من LiteLLM، أصبح مقطع Presidio معلّقًا حاليًا. نقاط مهمة للتفعيل:
- أضف `default_on: true` إلى guardrails لتفعيلها عالميًا؛
- يجب أن يُكتب في متغيري البيئة الخاصين بنقاط النهاية `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` عنوان base URL فقط (يضيف LiteLLM `/analyze` و`/anonymize` تلقائيًا؛ أما كتابة المسار فستؤدي إلى `/analyze/analyze` وخطأ 404).
> ⚠️ حجم الصورة نحو 965MB وسحبها داخل الصين بطيء جدًا (نحو ساعة بحسب القياس الفعلي)؛ وإن تعذر السحب فيمكن الاكتفاء مؤقتًا بالتعبيرات النمطية المدمجة (التي تغطي بالفعل بيانات PII الأساسية الصينية).
### 25.4 التحقق
أرسل طلبًا يتضمن رقم هاتف/بريدًا إلكترونيًا ← تُستبدل القيمة الأصلية في رد النموذج بـ `[REDACTED]`؛ وأرسل طلبًا يتضمن «أسرار داخلية» ← يعود مباشرة `Content blocked`.
> 📖 الوثائق الرسمية:Microsoft Presidio https://microsoft.github.io/presidio/ · المصدر https://github.com/microsoft/presidio

## 26. مستقبل البريد MailHog

**المدخل**: http://<عنوان-IP-الخادم>:8025 (صندوق وارد عبر الويب، وSMTP 1025 داخلي فقط).
### 26.1 لماذا نحتاجه
تستخدم لوحة Ghost 5 تسجيل دخول بدون كلمة مرور: بعد إدخال البريد الإلكتروني يرسل Ghost رسالة تحتوي رمز تحقق من 6 أرقام. عند غياب SMTP في الشبكة الداخلية لا تُرسل الرسائل، ويظهر خطأ `Failed to send email` عند تسجيل الدخول. يعمل MailHog كـ «مخرج للبريد» لالتقاط هذه الرسائل.
### 26.2 إعداد جانب Ghost
```
# متغيرات بيئة Ghost في docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```
### 26.3 عرض الرسائل
1. افتح `http://<عنوان-IP-الخادم>:8025` في المتصفح؛
2. سترى في صندوق الوارد رسائل رمز التحقق/الإشعارات المرسلة من Ghost.
### 26.4 تسجيل الدخول إلى Ghost بدون كلمة مرور (تسجيل الدخول التلقائي عبر مركز إدارة الذكاء الاصطناعي)
رمز التحقق المكون من 6 أرقام في Ghost هو في جوهره **TOTP** (`TOTP(admin_session_secret + userId)`، 6 أرقام/60 ثانية/HMAC-SHA1). يمكن لمركز إدارة الذكاء الاصطناعي حساب الرمز محليًا؛ فعند النقر على «لوحة Ghost ← فتح» تُكتمل العملية تلقائيًا: تسجيل الدخول بكلمة المرور ← حساب الرمز محليًا ← التحقق من الجلسة ← كتابة cookie ← الدخول إلى اللوحة، كل ذلك دون أي تدخل ودون البحث في MailHog.
> ⚠️ حتى مع الحساب المحلي للرمز سيظل Ghost يرسل البريد فعليًا، لذا يجب الإبقاء على MailHog، وإلا سيظهر `Failed to send email` عند تسجيل الدخول.
> 📖 الوثائق الرسمية:مستودع مصدر MailHog https://github.com/mailhog/MailHog

**الجزء الثالث · قسم التشغيل والصيانة**

## 27. النسخ الاحتياطي والاستعادة

**المدخل**: صفحة «💾 النسخ الاحتياطي والاستعادة» في مركز إدارة الذكاء الاصطناعي، أو سطر الأوامر `scripts/backup.ps1` / `restore.ps1`. يُنفَّذ نسخ احتياطي تلقائي يوميًا عند الساعة 02:00 عبر مهمة مجدولة مع الاحتفاظ بـ 7 أيام.
### 27.1 عناصر النسخ الاحتياطي
| عنصر النسخ | الطريقة |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | نسخ الملفات |
| Keycloak | **realm export (JSON)** |
| ملفات الإعداد | نسخ الملفات |
### 27.2 النسخ الاحتياطي اليدوي
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```
### 27.3 النسخ الاحتياطي المجدول (مهمة مجدولة)
سُجّلت المهمة المجدولة `AI-Platform-Backup` بالفعل (يوميًا عند 02:00). وإن لم تُسجَّل تلقائيًا يمكن إنشاؤها يدويًا: برنامج جدولة المهام ← جديد ← البرنامج `powershell.exe` والوسائط `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1` والمشغّل يوميًا عند 02:00.
> 📌 يُخزَّن النسخ الاحتياطي افتراضيًا على القرص C؛ ويُنصح بمزامنة `C:\AIAllInOne\backups\` دوريًا إلى قرص آخر أو تخزين كائنات للتعافي من الكوارث في موقع مختلف.
### 27.4 الاستعادة
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```
يطلب السكربت كتابة `yes` للتأكيد (أضف `-Force` لتخطي ذلك، للاستخدام في السكربتات/CI فقط). ويمكن أيضًا الاستعادة بضغطة واحدة من صفحة «النسخ الاحتياطي والاستعادة» في مركز إدارة الذكاء الاصطناعي عبر النقر على «استعادة» الخاصة بنسخة معينة.
### 27.5 نقاط حرجة (مُتحقق منها أثناء التدريب)
- ⚠️
      
        يجب استخدام **realm export/import (JSON)** مع Keycloak؛ فاستعادة pg_dump ستفقد ارتباط default role وتؤدي إلى تعذر الإقلاع؛
- بعد استعادة SQLite يكون المالك root، فيجب تنفيذ chown إلى uid المقابل (grafana=472 وgitea=1000) وإلا سيظهر خطأ readonly؛
- استخدم `--clean --if-exists` مع pg_dump لتجنب التعارض عند الاستعادة؛
- كان الإصدار القديم من backup.ps1 يستخدم `Copy-Item` للنسخ الجماعي، وكان ملف النقطة `.env` يتسبب في فشل صامت للمجموعة كاملة؛ لذا عُدّل إلى النسخ ملفًا بملف عبر `-LiteralPath`؛
- يستخدم النسخ الاحتياطي في مركز إدارة الذكاء الاصطناعي تمريرًا عبر base64 + tar-fs لضمان سلامة البيانات الثنائية (لأن stdout الخاص بـ docker exec يعمل بصيغة utf8 وقد يُتلف ملفات SQLite .db).

## 28. الفحص الصحي والفحص الذاتي عند الإقلاع

**السكربت**: `C:\AIAllInOne\windows\scripts\health-check.ps1`، ويولّد `health_check_<الطابع-الزمني>.log`. يغطي 41 حاوية (25 حاوية Windows أساسية + 16 حاوية Dify)، وتُقرأ بيانات الدخول من `.env` دون ترميز كلمات المرور في الكود.
### 28.1 نطاق الفحص (9 مراحل)
| المرحلة | عنصر الفحص |
| --- | --- |
| Stage 1 | ما إذا كان Docker Daemon يعمل (مع انتظار الجاهزية لتناسب الفحص الذاتي عند الإقلاع) |
| Stage 2 | حالة الحاويات الـ 41 (Up/Exited/Restarting) |
| Stage 3 | استجابة 10 نقاط نهاية HTTP |
| Stage 4 | جاهزية LiteLLM + تسجيل النماذج وDify API وسلامة قاعدة البيانات/Redis/Sandbox |
| Stage 5 | مسار LLM الكامل (طلب حقيقي عبر NewAPI ← LiteLLM ← DeepSeek) |
| Stage 6 | مسار مصادقة حساب AD + تسجيل دخول مدير NewAPI |
| Stage 7 | MCP Gateway + وظائف المهارات |
| Stage 8 | المتطلبات المسبقة لتسجيل الدخول إلى DeepChat/Dify |
| Stage 9 | مساحة القرص |
### 28.2 التنفيذ اليدوي
```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```
> ✅ يعني ظهور `ALL CLEAR` في نهاية الناتج مع `Fail: 0` أن كل شيء سليم.
### 28.3 التشغيل التلقائي عند الإقلاع (مهمة مجدولة)
```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # تأخير دقيقتين بعد تسجيل الدخول لانتظار Docker + بدء الحاويات
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
> 📌 ملاحظة: يستخدم السكربت `127.0.0.1` وليس localhost؛ وتُستخدم `/health/readiness` لسلامة LiteLLM الداخلية (دون مصادقة)؛ وحالة Exited(0) للحاوية `docker-init_permissions-1` طبيعية؛ وعودة Update Server بالرمز 403 طبيعية (لعدم وجود index.html افتراضي)؛ وexit code يساوي 0 للنجاح و1 لوجود فشل.

## 29. دليل استكشاف الأعطال وإصلاحها

### 29.1 ثلاث خطوات عامة لاستكشاف الأخطاء
1. **افحص حالة الحاويات**: `docker ps -a` للبحث عن Exited/Restarting؛
2. **افحص السجلات**: `docker logs <اسم-الحاوية> --tail 30`؛
3. **افحص الصحة**: شغّل `health-check.ps1` لتحديد المرحلة الفاشلة.
### 29.2 جدول مرجعي سريع للأعراض
| العَرَض | السبب الجذري | الحل |
| --- | --- | --- |
| لا يفتح أي منتج عبر localhost | مشكلة توافق WSL2 IPv6 `::1` | استخدم عنوان IP الداخلي أو 127.0.0.1 |
| يستمر Ghost في Restarting ويظهر ECONNREFUSED :3306 | إعداد MySQL متبقٍ في الحجم | إجبار SQLite عبر متغيرات البيئة (الفصل 4) |
| تنهار حاويات Dify الأربع فور الإقلاع بخطأ ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | غيّرها إلى 50 (الفصل 5) |
| يعيد اختبار قناة NewAPI No connected db | كُتبت قيمة نموذجية في مفتاح القناة | اكتب القيمة الفعلية لـ `LITELLM_MASTER_KEY` |
| يظهر خطأ OIDC في NewAPI: invalid_grant / Incorrect redirect_uri | عنوان الخادم هو localhost | عيّن العنوان الداخلي (الفصل 7) |
| 429 عند تسجيل الدخول إلى NewAPI | تحديد معدل للواجهات الحرجة | امسح rateLimit:* من redis أو عدّل .env |
| يتصل Dify مرارًا بـ ws://localhost عند إنشاء التطبيقات | لم يُغيَّر عنوان WebSocket | عيّن NEXT_PUBLIC_SOCKET_URL إلى عنوان IP الداخلي |
| لا يحدث شيء عند النقر على تسجيل الدخول في Dify | كلمة المرور تحتاج base64 / ظهور 401 دون تسجيل دخول أمر طبيعي | نفّذ base64 أولًا في السكربتات؛ وأعد المحاولة في المتصفح |
| يظهر خطأ readonly database في Gitea | مالك gitea.db هو root | احذف قاعدة البيانات التي يملكها root وأعد إنشاءها |
| روابط المستودعات في Gitea بصيغة localhost | لم يُغيَّر ROOT_URL | عيّن العنوان الداخلي |
| يظهر unknown_error عند تسجيل الدخول عبر SSO | تعطل إعادة توجيه منافذ AD (iphlpsvc) | افحص iphlpsvc + شبكة Hyper-V |
| لا يظهر مستخدمو النطاق في Keycloak | Search scope = One Level | غيّرها إلى Subtree |
| لا تظهر البيانات في Langfuse | V4_WRITE_MODE أو عدم إضافة حساب SSO إلى المنظمة | عيّن dual؛ وأضف المنظمة عبر SQL (الفصل 23) |
| انتهاء مهلة الاتصال بالنموذج في DeepChat | مرّ العميل عبر وكيل نظام معطل | اضبطه على بدون وكيل/اتصال مباشر |
| لا تظهر السجلات في Loki | استخدام تسمية job | استخدم `{container=~".+"}` |
| خطأ Presidio 404 /analyze/analyze | كُتب المسار في نقطة النهاية | اكتب base URL فقط |
| خطأ 404 للواجهات الجديدة بعد تعديل server.js | لا يعيد up -d قراءة تغيير الحجم | نفّذ docker restart admin-portal |
### 29.3 أوامر شائعة
```
docker ps -a                                        # حالة جميع الحاويات
docker logs <الحاوية> --tail 50                         # عرض السجلات
docker compose up -d <الخدمة>                          # إعادة بناء خدمة معينة
docker compose restart <الخدمة>                        # إعادة تشغيل خدمة معينة (دون إعادة قراءة .env)
docker system df                                     # استخدام مساحة Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # فحص شامل بضغطة واحدة
```

**الملحق**

## ملحق. فهرس الوثائق الرسمية

### الوثائق الرسمية لجميع المنتجات
| المنتج | عنوان الوثيقة الرسمية |
| --- | --- |
| Keycloak | https://www.keycloak.org/documentation |
| إدارة خادم Keycloak | https://www.keycloak.org/server/ |
| NewAPI | https://docs.newapi.pro |
| موقع NewAPI الرسمي | https://www.newapi.ai |
| مصدر NewAPI | https://github.com/QuantumNous/new-api |
| LiteLLM | https://docs.litellm.ai |
| LiteLLM Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Dify | https://docs.dify.ai |
| استضافة Dify الذاتية | https://docs.dify.ai/getting-started/install-self-hosted |
| Ghost | https://ghost.org/docs/ |
| لوحة إدارة Ghost | https://ghost.org/docs/admin/ |
| Gitea (بالصينية) | https://docs.gitea.com/zh-cn |
| إدارة Gitea | https://docs.gitea.com/zh-cn/category/administration |
| Gitea Actions | https://docs.gitea.com/zh-cn/usage/actions/overview |
| DeepChat | https://deepchatai.cn/docs/guide/getting-started/ |
| مصدر DeepChat | https://github.com/ThinkInAIXYZ/deepchat |
| بروتوكول MCP | https://modelcontextprotocol.io |
| MCP SDK | https://github.com/modelcontextprotocol |
| Grafana | https://grafana.com/docs/grafana/latest/ |
| Prometheus | https://prometheus.io/docs/ |
| Alertmanager | https://prometheus.io/docs/alerting/latest/alertmanager/ |
| Langfuse | https://langfuse.com/docs |
| استضافة Langfuse الذاتية | https://langfuse.com/self-hosting |
| Loki | https://grafana.com/docs/loki/latest/ |
| Microsoft Presidio | https://microsoft.github.io/presidio/ |
| مصدر Presidio | https://github.com/microsoft/presidio |
| MailHog | https://github.com/mailhog/MailHog |
> ✅ يتضمن نهاية كل فصل أيضًا عنوان الوثيقة الرسمية للمنتج المعني لتسهيل الرجوع إليها حسب الفصل.

