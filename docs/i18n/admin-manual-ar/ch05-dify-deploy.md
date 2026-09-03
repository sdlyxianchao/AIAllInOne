# الفصل 5: نشر Dify المستقل

*الجزء الأول · قسم النشر*

> يُنشر Dify بشكل مستقل باستخدام compose الرسمي (نحو 15 حاوية) لتجنب تعارض المنافذ.

[← الفصل 4: تشغيل الخدمات الأساسية](ch04-start.md) · [📖 الفهرس](index.md) · [الفصل 6: Keycloak: Realm والمستخدمون وAD →](ch06-keycloak.md)

---

> 📌 يستخدم Dify ملف docker-compose الرسمي (يضم ~15 حاوية) ويُنشر بشكل مستقل لتجنب تعارض المنافذ، ويستخدم شبكته الافتراضية الخاصة (تختلف عن شبكة `ai-platform` الخاصة بالخدمات الأساسية).

## 5.1 استنساخ Dify

```
# الطريقة A: عبر GitHub (يتطلب إمكانية الوصول)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# الطريقة B: عبر مرآة Gitee الرسمية (موصى بها داخل الصين)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 إصلاح التوافق + نسخ متغيرات البيئة

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

> ⚠️ لماذا يجب تغيير `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: رفع Dify 1.16.1 هذا الحقل من «يسمح بـ 0» إلى «يجب أن يكون > 0»، لكن قالب `shared.env` ما يزال 0. دون التغيير ستنهار الحاويات الأربع `dify-api-1` / `worker` / `worker_beat` / `api_websocket` فور الإقلاع، وستُظهر السجلات `ValidationError: Input should be greater than 0`.

## 5.3 تشغيل Dify

```
docker compose up -d
docker compose ps
```

> ✅ تكون جميع الحاويات بحالة `Up` (من الطبيعي أن تظهر `init_permissions` بحالة Exited). افتح `http://127.0.0.1/install` في المتصفح لتهيئة حساب المدير.

## 5.4 إصلاح عنوان WebSocket (دون التغيير سيتصل المتصفح مرارًا بـ ws://localhost)

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

## 5.5 مرجع سريع للمزالق

> ⚠️ **كلمة مرور تسجيل الدخول تُنقل بصيغة base64**: في Dify 1.16.x تكون `password` بواجهة تسجيل الدخول `POST /console/api/login` هي كلمة المرور بعد ترميز base64. عند تسجيل الدخول عبر السكربتات يجب أولًا تنفيذ `base64(كلمة المرور)`؛ وعندما «لا يحدث شيء عند النقر على تسجيل الدخول» في الواجهة، فإن ظهور `GET /account/profile 401` في console هو حالة طبيعية لعدم تسجيل الدخول.

> ⚠️ **إعادة تعيين كلمة مرور المدير عند نسيانها**: تجزئة كلمة المرور في Dify هي `pbkdf2_hmac('sha256', password, salt, 10000)` (بعدد تكرارات 10000) ولا يمكن فكّها عكسيًا، لذا أعد تعيينها عبر أمر في الحاوية (كلمة المرور الجديدة 8 أحرف فأكثر):

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<نطاق-الشركة> \
  --new-password '<كلمة-مرور-جديدة>' \
  --password-confirm '<كلمة-مرور-جديدة>'
```

> 📖 الوثائق الرسمية:وثائق Dify الرسمية https://docs.dify.ai · النشر المستضاف ذاتيًا https://docs.dify.ai/getting-started/install-self-hosted

---

[← الفصل 4: تشغيل الخدمات الأساسية](ch04-start.md) · [📖 الفهرس](index.md) · [الفصل 6: Keycloak: Realm والمستخدمون وAD →](ch06-keycloak.md)
