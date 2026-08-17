# الفصل 20: الإدارة اليومية لـ MCP Gateway

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> إضافة/حذف خوادم MCP، ورفع/حذف المهارات، وتوسيع الأدوات المدمجة.

[← الفصل 19: الإدارة اليومية لـ Gitea](ch19-ops-gitea.md) · [📖 الفهرس](index.md) · [الفصل 21: إدارة خادم التحديثات →](ch21-ops-update.md)

---

**المدخل**: `http://<عنوان-IP-الخادم>:3100` (صفحة السوق `/market`). تُجرى الإدارة عبر صفحة «MCP Gateway» في مركز إدارة الذكاء الاصطناعي (بدور `ai-platform-admin`)، ويمكن أيضًا استدعاء API الإدارة مباشرة.

## 20.1 إدارة خوادم MCP

1. عدّل `mcp-gateway/mcp-servers.json` لإضافة/حذف الخوادم (نوعا stdio/http)؛

2. أعد التشغيل `docker compose restart mcp-gateway`؛

3. أو أضف/احذف من صفحة MCP Gateway في مركز إدارة الذكاء الاصطناعي (مع الكتابة مرة أخرى إلى الإعداد + إعادة الاتصال تلقائيًا).

## 20.2 إدارة المهارات (حزم المهارات)

1. **الرفع**: صفحة MCP Gateway في مركز إدارة الذكاء الاصطناعي ← رفع حزمة مهارة بصيغة zip (مع التحقق من احتوائها على SKILL.md ومنع اختراق المسارات)؛

2. **الحذف**: احذف المهارة المقابلة؛

3. توضع المهارات في `mcp-gateway/skills/` (أدلة فرعية تحتوي SKILL.md)، وتُفحص تلقائيًا عند كل طلب دون حاجة لإعادة التشغيل.

## 20.3 توسيع الأدوات المدمجة

أضف خطوتين في `mcp-gateway/gateway.js`:

```
// ① تعريف الأداة (أضف عنصرًا إلى مصفوفة builtinTools)
{ name: 'platform_health', description: 'الاستعلام عن حالة سلامة الخدمات',
  inputSchema: { type: 'object', properties: {} } }

// ② منطق التنفيذ (أضف فرعًا إلى callBuiltin)
if (name === 'platform_health') { return 'جميع الخدمات تعمل بشكل سليم'; }
```

بعد التعديل نفّذ `docker compose restart mcp-gateway`.

## 20.4 صيانة عنوان سوق skill-market

يوجد `market_url` الخاص بـ «مدير المهارات» في `mcp-gateway/skills/skill-market/config.json` + `SKILL.md`، ويجب استخدام اسم مضيف (وليس عنوان IP) لأنه معامل نشر (راجع الفصل 11).

> ⚠️ يتطلب API الإدارة رأس `X-Admin-Token` (من `MCP_ADMIN_TOKEN` في `.env`)؛ يعيد 503 عند عدم الضبط و401 عند خطأ الرمز.

> 📖 الوثائق الرسمية:بروتوكول MCP الرسمي https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← الفصل 19: الإدارة اليومية لـ Gitea](ch19-ops-gitea.md) · [📖 الفهرس](index.md) · [الفصل 21: إدارة خادم التحديثات →](ch21-ops-update.md)
