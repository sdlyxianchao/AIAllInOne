# الفصل 23: قابلية مراقبة LLM (Langfuse)

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> تتبع الموجهات والاستجابات وزمن الاستجابة والرموز والتكلفة لكل استدعاء نموذج.

[← الفصل 22: إدارة المراقبة والإنذارات](ch22-ops-monitoring.md) · [📖 الفهرس](index.md) · [الفصل 24: السجلات الموحدة (Loki) →](ch24-ops-loki.md)

---

**المدخل**: `http://<عنوان-IP-الخادم>:3010` (تسجيل دخول SSO تلقائي، ويشير مدخل مركز إدارة الذكاء الاصطناعي إلى `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 المكونات

| المكوّن | الاستخدام |
| --- | --- |
| langfuse | Web UI + عرض التتبع (3010) |
| langfuse-worker | معالجة الأحداث غير المتزامنة |
| langfuse-postgres | تخزين البيانات الوصفية |
| langfuse-clickhouse | تخزين بيانات الأحداث/التتبع |
| langfuse-minio | تخزين مرفقات/وسائط S3 |
| langfuse-redis | قائمة الانتظار |

يُبلّغ LiteLLM تلقائيًا عبر `success_callback: ["langfuse"]` (باستخدام `LANGFUSE_*` في `.env`).

## 23.2 عرض التتبع

1. سجّل الدخول إلى Langfuse ← اختر المنظمة `AI All In One` / المشروع `AI Platform`؛

2. اعرض كل استدعاء في قائمة Traces وانقر عليه لمشاهدة الموجه/الاستجابة/النموذج/زمن الاستجابة/الرموز/التكلفة؛

3. اربط جولات المحادثة المتعددة عبر Session.

## 23.3 استكشاف الأخطاء

> ⚠️ نقاط حرجة:
> - يجب ضبط `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (لكل من web وworker)، وإلا سيفشل الإبلاغ عبر `trace-create` في SDK القديم ولن تظهر البيانات؛
> - عند عدم ظهور البيانات مع تسجيل الدخول عبر SSO: حساب SSO (بريد AD) يختلف عن حساب التهيئة، وينشئ Langfuse تلقائيًا حسابًا لا ينتمي لأي منظمة. الإصلاح (إضافة مستخدم SSO إلى المنظمة):

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<نطاق-الشركة>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 الوثائق الرسمية:وثائق Langfuse الرسمية https://langfuse.com/docs · الاستضافة الذاتية https://langfuse.com/self-hosting

---

[← الفصل 22: إدارة المراقبة والإنذارات](ch22-ops-monitoring.md) · [📖 الفهرس](index.md) · [الفصل 24: السجلات الموحدة (Loki) →](ch24-ops-loki.md)
