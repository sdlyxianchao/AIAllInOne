# الفصل 16: الإدارة اليومية لـ LiteLLM

*الجزء الثاني · قسم الإدارة (العمليات اليومية لكل منتج)*

> وكيل إخفاء PII: قائمة النماذج، وقواعد الإخفاء، والتخزين المؤقت، والإبلاغ إلى Langfuse.

[← الفصل 15: الإدارة اليومية لـ NewAPI](ch15-ops-newapi.md) · [📖 الفهرس](index.md) · [الفصل 17: الإدارة اليومية لـ Dify →](ch17-ops-dify.md)

---

**المدخل**: `http://<عنوان-IP-الخادم>:4001` (API خالص بدون واجهة ويب، ويُستخدم `/v1/models` للتجربة). الإعداد في `litellm-config.yaml`.

## 16.1 صيانة قائمة النماذج

عدّل `model_list` في `litellm-config.yaml` لإضافة/حذف النماذج ومفاتيح API المقابلة. خطوات إضافة مزوّد جديد:

1. أزل التعليق عن `# OPENAI_API_KEY=` في `.env` واملأ المفتاح؛

2. أزل التعليق عن كتلة النموذج المقابلة في `litellm-config.yaml`؛

3. `docker compose up -d litellm`.

## 16.2 التخزين المؤقت للاستجابات

تخزين مؤقت بتطابق تام عبر Redis، تُشارك الطلبات المتطابقة تمامًا بين المستخدمين. اضبط `cache_params.ttl` (الافتراضي 3600 ثانية). للإيقاف: اضبط `cache: false` ثم أعد التشغيل.

## 16.3 الإبلاغ إلى Langfuse

يُبلَّغ تلقائيًا عن كل استدعاء عبر `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` في `.env`.

## 16.4 إعادة التشغيل واستكشاف الأخطاء

```
docker compose restart litellm          # أعد التشغيل بعد تعديل الإعداد
docker logs litellm --tail 50           # عرض السجلات
```

> ⚠️ نقاط حرجة: ① يجب إضافة `default_on: true` إلى guardrails لتفعيلها عالميًا؛ ② إخفاء PII (Presidio) معلّق حاليًا بسبب تغيير في API العلوية، ويعمل كوسيط خالص فقط؛ ③ استخدم الإصدار المستقر `v1.95.1` (يحتوي `main-latest` على أخطاء).

> 📖 الوثائق الرسمية:وثائق LiteLLM الرسمية https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← الفصل 15: الإدارة اليومية لـ NewAPI](ch15-ops-newapi.md) · [📖 الفهرس](index.md) · [الفصل 17: الإدارة اليومية لـ Dify →](ch17-ops-dify.md)
