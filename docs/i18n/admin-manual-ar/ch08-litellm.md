# الفصل 8: LiteLLM: التحقق والتخزين المؤقت

*الجزء الأول · قسم النشر*

> التحقق من أن وكيل LiteLLM يعمل، وتفعيل التخزين المؤقت للاستجابات لتوفير الرموز (token).

[← الفصل 7: NewAPI: التهيئة والقنوات وOIDC](ch07-newapi.md) · [📖 الفهرس](index.md) · [الفصل 9: إعداد Dify / Ghost / Gitea →](ch09-products.md)

---

> ⚠️ إخفاء PII (Presidio guardrail) **معطّل مؤقتًا** حاليًا: تغيّرت صيغة إعداد guardrail في الإصدار الأحدث من LiteLLM، وأُضيف التعليق إلى ذلك المقطع في `litellm-config.yaml`، لذا يعمل LiteLLM حاليًا كوسيط تمرير فقط (دون إخفاء). راجع الفصل 25 لطريقة التفعيل.

## 8.1 التحقق من عمل LiteLLM الأساسي

```
curl -X POST http://<عنوان-IP-الخادم>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` هو مفتاح مدير LiteLLM، استخدم القيمة الفعلية من `.env` (وليس العنصر النائب نفسه، وإلا ستحصل على 401). ويجب استخدام عنوان IP الداخلي `<عنوان-IP-الخادم>:4001` وليس `127.0.0.1:4001` (بسبب مشكلة إعادة توجيه المنافذ في WSL2).

## 8.2 التخزين المؤقت للاستجابات (مدمج بالفعل، ويوفر الرموز)

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

## 8.3 إضافة مزيد من مزودي LLM

1. أزل التعليق عن `# OPENAI_API_KEY=` في `.env` واملأ المفتاح؛

2. أزل التعليق عن كتلة النموذج المقابلة في `litellm-config.yaml`؛

3. `docker compose up -d litellm`.

> 📖 الوثائق الرسمية:وثائق LiteLLM الرسمية https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← الفصل 7: NewAPI: التهيئة والقنوات وOIDC](ch07-newapi.md) · [📖 الفهرس](index.md) · [الفصل 9: إعداد Dify / Ghost / Gitea →](ch09-products.md)
