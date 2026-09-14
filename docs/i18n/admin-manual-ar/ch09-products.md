# الفصل 9: إعداد Dify / Ghost / Gitea

*الجزء الأول · قسم النشر*

> تهيئة كل منتج من المنتجات الثلاثة وإعدادات الترابط الخاصة به.

[← الفصل 8: LiteLLM: التحقق والتخزين المؤقت](ch08-litellm.md) · [📖 الفهرس](index.md) · [الفصل 10: توزيع DSH Desktop و CI/CD →](ch10-dsh.md)

---

## 9.1 Dify: إعداد مزوّد النماذج

1. افتح `http://<عنوان-IP-الخادم>` ← عند أول استخدام عيّن بريد المدير وكلمة المرور (البريد `ai_all_in_one_admin@<نطاق-الشركة>`)؛

2. **الإعدادات ← مزوّدو النماذج** ← OpenAI-API-compatible ← إضافة نموذج:

- اسم النموذج `deepseek-chat` (حسب الفعلي)؛

- مفتاح API: `sk-xxx` الخاص بـ `dify-key`؛

- نقطة نهاية API: `http://host.docker.internal:3000/v1`.

3. الاستوديو ← إنشاء مساعد محادثة ← اختر النموذج ← أرسل رسالة للتحقق.

> ⚠️ يستخدم Dify `host.docker.internal` بدلًا من اسم الحاوية، لأن Dify يعمل في شبكته الخاصة وهي مختلفة عن شبكة NewAPI.

## 9.2 Ghost: إعداد البوابة

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

1. **صفحة مركز التنزيلات**: الصفحات ← أنشئ «مركز التنزيلات» (slug `downloads`) وضع فيه الروابط الداخلية لحزم تثبيت DSH Desktop.

```
## DSH Desktop إصدار المؤسسات
### Windows
- [DSH Desktop v0.5.0 (Windows x64)](http://<عنوان-IP-الخادم>:8091/dsh/dsh-desktop-windows-x64-setup.exe)
### macOS
- [DSH Desktop v0.5.0 (macOS x64)](http://<عنوان-IP-الخادم>:8091/dsh/dsh-desktop-mac-x64.dmg)
```

> ⚠️ لا تنقر «التسجيل» في الصفحة الرئيسية للبوابة `/` — فهي مخصصة لتسجيل الزوار المشتركين (وستظهر خطأ 500 إن لم يُضبط SMTP)؛ مدخل المدير هو `/ghost/`. ولا تثبّت أحدث إصدار من القوالب من GitHub (لأنها قد تكون متوافقة مع Ghost 6.x وستظهر رسالة incompatible مع 5.x).

## 9.3 Gitea: التهيئة وتسجيل Runner

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
 ⚠️ المزلق 2: يجب ضبط `ROOT_URL` إلى `http://<عنوان-IP-الخادم>:3002/` وإلا ستُولَّد روابط المستودعات بصيغة localhost وتصبح غير صالحة عند فتحها من أجهزة الموظفين.

> 📖 الوثائق الرسمية:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (بالصينية) https://docs.gitea.com/zh-cn

---

[← الفصل 8: LiteLLM: التحقق والتخزين المؤقت](ch08-litellm.md) · [📖 الفهرس](index.md) · [الفصل 10: توزيع DSH Desktop و CI/CD →](ch10-dsh.md)
