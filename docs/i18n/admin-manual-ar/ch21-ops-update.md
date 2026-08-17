# الفصل 21: إدارة خادم التحديثات

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> استضافة حزم تثبيت DeepChat والتحديث التلقائي.

[← الفصل 20: الإدارة اليومية لـ MCP Gateway](ch20-ops-mcp.md) · [📖 الفهرس](index.md) · [الفصل 22: إدارة المراقبة والإنذارات →](ch22-ops-monitoring.md)

---

**المدخل**: `http://<عنوان-IP-الخادم>:8091` والبيانات في `deepchat-updates/`.

## 21.1 وضع إصدار جديد يدويًا

1. نزّل حزمة تثبيت DeepChat الرسمية إلى `deepchat-updates/deepchat/`؛

2. حدّث `version.txt` (اكتب رقم الإصدار الجديد)؛

3. عند التحديث التلقائي في DeepChat لدى الموظف يتحقق من `version.txt`، وعند اكتشاف إصدار جديد ينزّله ويثبّته.

## 21.2 المزامنة التلقائية (موصى بها)

تعتمد على Gitea Actions في مستودع `deepchat-sync` للتحقق يوميًا من إصدارات GitHub الجديدة ومزامنتها (انظر الفصل 10). التشغيل اليدوي:

```
curl -X POST "http://<عنوان-IP-الخادم>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<كلمة-المرور>" -H "Content-Type: application/json" -d '{"ref":"main"}'
```

## 21.3 إعداد المزامنة (sync-config.json)

| الحقل | الوظيفة |
| --- | --- |
| `version_source` | `github` / `official` |
| `download_prefix` | بادئة تسريع التنزيل (مثل ghproxy.com) |
| `keep_releases` | عدد الإصدارات التاريخية المحفوظة |
| `market_url` | عنوان سوق «مدير المهارات» في صفحة التنزيل |

> 📌 عند ظهور «انتهاء مهلة الاتصال بالنموذج» في عميل DeepChat فغالبًا يرجع السبب إلى مرور العميل عبر وكيل نظام معطل (`ECONNREFUSED 127.0.0.1:33210`). اطلب من المستخدم تغيير الخيار إلى «بدون وكيل/اتصال مباشر» في DeepChat من «الإعدادات ← الشبكة/الوكيل».

> 📖 الوثائق الرسمية:البداية السريعة لـ DeepChat https://deepchatai.cn/docs/guide/getting-started/ · المستودع مفتوح المصدر https://github.com/ThinkInAIXYZ/deepchat

---

[← الفصل 20: الإدارة اليومية لـ MCP Gateway](ch20-ops-mcp.md) · [📖 الفهرس](index.md) · [الفصل 22: إدارة المراقبة والإنذارات →](ch22-ops-monitoring.md)
