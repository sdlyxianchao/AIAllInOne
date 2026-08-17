# الفصل 11: MCP Gateway وسوق المهارات (Skill)

*الجزء الأول · قسم النشر*

> بوابة لإدارة مهارات Skill وأدوات MCP مركزيًا؛ يكفي DeepChat/Dify الاتصال بعنوان واحد للحصول على جميع الأدوات.

[← الفصل 10: توزيع DeepChat و CI/CD](ch10-deepchat.md) · [📖 الفهرس](index.md) · [الفصل 12: مركز إدارة الذكاء الاصطناعي →](ch12-admin-center.md)

---

> 📌 يعتمد MCP Gateway على `@modelcontextprotocol/sdk` الرسمي، ويعرض نقطة نهاية Streamable HTTP القياسية `/mcp`، وقد أُدمج في `docker-compose.yml` الرئيسي (المنفذ 3100) ليبدأ مع الخدمات الأساسية. المصدر في `mcp-gateway/`.

## 11.1 أدوات المنصة المدمجة

| الأداة | الاستخدام |
| --- | --- |
| `platform_time` | يعيد الوقت الحالي للخادم |
| `platform_echo` | يعيد النص كما هو (لاختبار الاتصال) |
| `platform_services` | يعرض قائمة خدمات المنصة |

## 11.2 تجميع خوادم MCP خارجية

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

## 11.3 ربط العملاء

1. DeepChat: الإعدادات ← MCP ← إضافة خادم ← النوع «HTTP قابل للبث» والعنوان `http://<عنوان-IP-الخادم>:3100/mcp`؛

2. سير عمل Dify: وجّه إعداد الأداة المخصصة / أداة MCP إلى العنوان نفسه.

> التحقق: يعيد `curl http://<عنوان-IP-الخادم>:3100/health` الناتج `{"status":"ok"}`؛ ويعيد `curl -X POST .../mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` قائمة الأدوات.

## 11.4 سوق المهارات (توزيع حزم المهارات داخليًا)

| نقطة النهاية | الوظيفة |
| --- | --- |
| `/market` | صفحة سوق المهارات (تصفح البطاقات + تنزيل ZIP + نسخ عنوان التثبيت) |
| `/skills` | قائمة المهارات بصيغة JSON (name/description/version) |
| `/skills/<الاسم>.zip` | تنزيل حزمة المهارة (تغليف ديناميكي) |

توضع المهارات في مجلد `mcp-gateway/skills/` (أدلة فرعية تحتوي SKILL.md)، **وتُفحص تلقائيًا عند كل طلب دون حاجة لإعادة التشغيل**. تتضمن مهارة إرشادية مدمجة باسم `skill-market`.

> 📌 في DeepChat يُعد MCP وSkill مفهومين مختلفين: MCP هو «أداة» (function calling)، أما Skill فهو «حزمة مهارات للوكيل الذكي» (SKILL.md + سكربتات). لا يوجد «عنوان سوق مخصص» لمهارات DeepChat، بل تدعم ثلاثة أنماط للتثبيت فقط: مجلد/ZIP/عنوان URL، ويتم التوزيع الداخلي عبر «التثبيت بعنوان URL» بشكل غير مباشر.

## 11.5 ⚠️ اسم مضيف سوق المهارات (معامل نشر يجب استبداله)

يقرأ «مدير المهارات» `market_url` من `config.json` لطلب قائمة `/skills`. هناك نقطتان مهمتان:

- **استخدم اسم مضيف وليس عنوان IP**: بيئة الوكيل في DeepChat تُخفي عنوان IP وتحوله إلى `[IP_ADDRESS_REDACTED]`، فلا يمكن قراءة العنوان الحقيقي؛

- **اسم المضيف معامل نشر**: يختلف من نشر إلى آخر ولا يمكن نسخه كما هو.

```
# mcp-gateway/skills/skill-market/config.json
{ "market_url": "http://<اسم-مضيف-السوق>:3100" }
```

#### تلقائي (عبر النشر بالوكيل)

عند جمع المعاملات يسألك الوكيل عن «اسم مضيف سوق المهارات» ويستبدل تلقائيًا `<اسم-مضيف-السوق>` في `config.json` و`SKILL.md`.

#### يدوي

1. عدّل العنوان الاحتياطي في `config.json` + `SKILL.md` واستبدل `<اسم-مضيف-السوق>`؛

2. اجعل اسم المضيف قابلًا للحل: على جهاز واحد أضف `<عنوان-IP-الخادم> <اسم-المضيف>` في `C:\Windows\System32\drivers\etc\hosts`؛ وعلى الشبكة الداخلية للشركة أضف سجل A في DNS.

> ✅ يُنصح باستخدام FQDN بصيغة «اسم الخدمة + نطاق الشركة» مثل `skillmarket.نطاق_شركتك`. لإضافة سجل A في DNS: على نطاق التحكم «DNS ← منطقة البحث الأمامي ← نطاقك ← مضيف جديد (A)»، أو استخدم `Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "نطاقك" -IPv4Address "<عنوان-IP-الخادم>"`.

## 11.6 API الإدارة (للإضافة/الحذف/التعديل من مركز إدارة الذكاء الاصطناعي)

| نقطة النهاية | الوظيفة |
| --- | --- |
| `GET/POST /api/servers` و`PUT/DELETE /api/servers/:name` | إضافة/حذف/تعديل/استعلام خوادم MCP (مع الكتابة مرة أخرى إلى الإعدادات + إعادة الاتصال تلقائيًا) |
| `POST /api/skills/upload` | رفع حزمة مهارة بصيغة zip (مع التحقق من SKILL.md ومنع اختراق المسارات) |
| `DELETE /api/skills/:name` | حذف مهارة |

تتطلب رأس `X-Admin-Token` (من `MCP_ADMIN_TOKEN` في `.env`). تُستدعى عبر صفحة «MCP Gateway» في مركز إدارة الذكاء الاصطناعي (المحمية بدور `ai-platform-admin`).

> 📖 الوثائق الرسمية:بروتوكول MCP الرسمي https://modelcontextprotocol.io · SDK https://github.com/modelcontextprotocol

---

[← الفصل 10: توزيع DeepChat و CI/CD](ch10-deepchat.md) · [📖 الفهرس](index.md) · [الفصل 12: مركز إدارة الذكاء الاصطناعي →](ch12-admin-center.md)
