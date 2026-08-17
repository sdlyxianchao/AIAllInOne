# الفصل 10: توزيع DeepChat و CI/CD

*الجزء الأول · قسم النشر*

> توزيع حزم تثبيت DeepChat على الموظفين، ومزامنة الإصدارات الرسمية الجديدة تلقائيًا عبر Gitea Actions.

[← الفصل 9: إعداد Dify / Ghost / Gitea](ch09-products.md) · [📖 الفهرس](index.md) · [الفصل 11: MCP Gateway وسوق المهارات (Skill) →](ch11-mcp.md)

---

## 10.1 سلسلة التوزيع

سلسلة التوزيع = حزم تثبيت GitHub Releases ← Gitea Actions في مستودع `deepchat-sync` ← خادم التحديثات (:8091) ← صفحة التنزيل في Ghost ← تنزيل الموظفين.

> 📌 حُذف مستودع mirror الخاص بمصدر `deepchat` — لأن mirror يزامن مصدر git فقط ولا يزامن حزم تثبيت release، لذا لا يفيد في التوزيع. وإن أردت تدقيق المصدر أو تطويره ثانويًا فأنشئ مستودعًا منفصلًا.

## 10.2 تنزيل حزم التثبيت إلى خادم التحديثات

```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```

التحقق: `curl -I http://<عنوان-IP-الخادم>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` ← 200/206. ثم حدّث صفحة التنزيل في Ghost (انظر الفصل 9).

## 10.3 المزامنة التلقائية (Gitea Actions، موصى بها)

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

## 10.4 إعداد مصدر التنزيل المحلي (sync-config.json)

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

## 10.5 الطريقة B: بناء إصدار مخصص عبر Docker (اختياري)

```
mkdir deepchat-build
docker run -it --rm -v ${PWD}/deepchat-build:/app -w /app node:20 bash
# داخل الحاوية
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci
npx electron-builder --win --x64
# الناتج في dist/، وبعد الخروج انسخه إلى deepchat-updates/
```

## 10.6 إعداد عميل DeepChat (من جانب الموظف)

1. DeepChat ← الإعدادات ← خدمة النماذج ← مزوّد مخصص / متوافق مع OpenAI؛

2. API Base URL: `http://<عنوان-IP-الخادم>:3000/v1` (يجب استخدام عنوان IP الداخلي)؛

3. مفتاح API: `sk-xxx` الخاص بـ `deepchat-key`؛

4. النموذج: `deepseek-chat`، وبعد الحفظ جرّب محادثة للاختبار.

> 📖 الوثائق الرسمية:البداية السريعة لـ DeepChat https://deepchatai.cn/docs/guide/getting-started/ · المستودع مفتوح المصدر https://github.com/ThinkInAIXYZ/deepchat

---

[← الفصل 9: إعداد Dify / Ghost / Gitea](ch09-products.md) · [📖 الفهرس](index.md) · [الفصل 11: MCP Gateway وسوق المهارات (Skill) →](ch11-mcp.md)
