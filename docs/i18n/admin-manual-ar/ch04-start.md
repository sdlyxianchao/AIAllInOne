# الفصل 4: تشغيل الخدمات الأساسية

*الجزء الأول · قسم النشر*

> انسخ ملف .env، وشغّل الحاويات، وتحقق من إمكانية الوصول لكل خدمة، وعالج مشكلة SQLite المعروفة في Ghost.

[← الفصل 3: ملفات الإعداد ومتغيرات البيئة](ch03-env.md) · [📖 الفهرس](index.md) · [الفصل 5: نشر Dify المستقل →](ch05-dify-deploy.md)

---

## 4.1 نسخ .env

```
# PowerShell
copy .env.windows .env
```

يقرأ Docker Compose ملف `.env` افتراضيًا.

## 4.2 تشغيل جميع الخدمات الأساسية

```
docker compose -f docker-compose.yml up -d
```

في المرة الأولى سيتم سحب جميع الصور (حوالي 5–10 دقائق حسب سرعة الشبكة).

| الصورة | الحاوية | الحجم |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |

## 4.3 التحقق من حالة الحاويات

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

من المتوقع أن تكون الحاويات الأساسية العشر جميعها بحالة `Up`. إذا استمرت أي حاوية في `Restarting` فنفّذ `docker logs اسم_الحاوية` لمعرفة السبب.

## 4.4 إصلاح مشكلة معروفة: إجبار Ghost على SQLite

إذا استمرت `ghost` في حالة Restarting وكانت السجلات تُظهر `Error: connect ECONNREFUSED <عنوان-IP-الخادم>:3306` — فهذا يعني وجود ملف `config.production.json` قديم في حجم البيانات يشير إلى MySQL. الإصلاح: أعلن صراحةً عن SQLite في `environment` الخاص بخدمة ghost في compose:

```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```

```
docker compose up -d ghost
docker logs ghost --tail 20
```

> ⚠️ تحت Windows + Docker Desktop WSL2 تُخزَّن بيانات الأحجام داخل القرص الافتراضي لـ WSL2، ولا يستطيع git bash في المضيف رؤيتها، لذا لا يمكن حذف `config.production.json` داخل الحجم مباشرة، والحل الوحيد هو «التجاوز عبر متغيرات البيئة». ولا تنفّذ أيضًا `docker volume rm windows_ghost-data` (لأنك ستفقد المقالات المنشورة).

> ✅ التحقق: تظهر في السجلات `Ghost database ready` + `Ghost booted`، ويعيد `curl.exe -I http://127.0.0.1:8090` الرمز 200.

## 4.5 التحقق من إمكانية الوصول لكل خدمة

```
# Keycloak — 302 يعني أن كل شيء سليم
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (إعادة توجيه إلى صفحة التهيئة /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (مجلد فارغ، nginx يعمل)
curl.exe -I http://127.0.0.1:8091
# مركز إدارة الذكاء الاصطناعي — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM هو API خالص بدون واجهة ويب، لذا تحقق منه من داخل الحاوية:

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# الناتج المتوقع: {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 قد يؤدي وكيل HTTP في Docker Desktop WSL2 إلى تعذّر الوصول إلى LiteLLM من المضيف (HEART/استجابة فارغة)، وهي مشكلة معروفة، ولا تؤثر على استدعاء NewAPI له عبر اسم الحاوية.

---

[← الفصل 3: ملفات الإعداد ومتغيرات البيئة](ch03-env.md) · [📖 الفهرس](index.md) · [الفصل 5: نشر Dify المستقل →](ch05-dify-deploy.md)
