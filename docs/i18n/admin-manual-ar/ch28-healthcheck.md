# الفصل 28: الفحص الصحي والفحص الذاتي عند الإقلاع

*الجزء الثالث · قسم التشغيل والصيانة*

> فحص شامل بضغطة واحدة لجميع الحاويات الـ 41 + مسار LLM الكامل + مسار المصادقة.

[← الفصل 27: النسخ الاحتياطي والاستعادة](ch27-backup.md) · [📖 الفهرس](index.md) · [الفصل 29: دليل استكشاف الأعطال وإصلاحها →](ch29-troubleshooting.md)

---

**السكربت**: `C:\AIAllInOne\windows\scripts\health-check.ps1`، ويولّد `health_check_<الطابع-الزمني>.log`. يغطي 41 حاوية (25 حاوية Windows أساسية + 16 حاوية Dify)، وتُقرأ بيانات الدخول من `.env` دون ترميز كلمات المرور في الكود.

## 28.1 نطاق الفحص (9 مراحل)

| المرحلة | عنصر الفحص |
| --- | --- |
| Stage 1 | ما إذا كان Docker Daemon يعمل (مع انتظار الجاهزية لتناسب الفحص الذاتي عند الإقلاع) |
| Stage 2 | حالة الحاويات الـ 41 (Up/Exited/Restarting) |
| Stage 3 | استجابة 10 نقاط نهاية HTTP |
| Stage 4 | جاهزية LiteLLM + تسجيل النماذج وDify API وسلامة قاعدة البيانات/Redis/Sandbox |
| Stage 5 | مسار LLM الكامل (طلب حقيقي عبر NewAPI ← LiteLLM ← DeepSeek) |
| Stage 6 | مسار مصادقة حساب AD + تسجيل دخول مدير NewAPI |
| Stage 7 | MCP Gateway + وظائف المهارات |
| Stage 8 | المتطلبات المسبقة لتسجيل الدخول إلى DSH Desktop/Dify |
| Stage 9 | مساحة القرص |

## 28.2 التنفيذ اليدوي

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ يعني ظهور `ALL CLEAR` في نهاية الناتج مع `Fail: 0` أن كل شيء سليم.

## 28.3 التشغيل التلقائي عند الإقلاع (مهمة مجدولة)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # تأخير دقيقتين بعد تسجيل الدخول لانتظار Docker + بدء الحاويات
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 ملاحظة: يستخدم السكربت `127.0.0.1` وليس localhost؛ وتُستخدم `/health/readiness` لسلامة LiteLLM الداخلية (دون مصادقة)؛ وحالة Exited(0) للحاوية `docker-init_permissions-1` طبيعية؛ وعودة Update Server بالرمز 403 طبيعية (لعدم وجود index.html افتراضي)؛ وexit code يساوي 0 للنجاح و1 لوجود فشل.

---

[← الفصل 27: النسخ الاحتياطي والاستعادة](ch27-backup.md) · [📖 الفهرس](index.md) · [الفصل 29: دليل استكشاف الأعطال وإصلاحها →](ch29-troubleshooting.md)
