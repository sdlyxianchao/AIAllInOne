# 제4장: 핵심 서비스 시작

*제1부 · 배포편*

> .env 복사, 컨테이너 기동, 서비스별 접근 가능 여부 검증, Ghost의 SQLite 알려진 문제 처리.

[← 제3장: 설정 파일 및 환경 변수](ch03-env.md) · [📖 목차](index.md) · [제5장: Dify 독립 배포 →](ch05-dify-deploy.md)

---

## 4.1 .env 복사

```
# PowerShell
copy .env.windows .env
```

Docker Compose는 기본적으로 `.env`를 읽습니다.

## 4.2 전체 핵심 서비스 시작

```
docker compose -f docker-compose.yml up -d
```

최초 실행 시 모든 이미지를 풀링합니다 (약 5–10분, 네트워크 속도에 따라 다름).

| 이미지 | 컨테이너 | 크기 |
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

## 4.3 컨테이너 상태 확인

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

예상되는 10개 핵심 컨테이너 모두 `Up`. 컨테이너가 계속 `Restarting`이면 `docker logs 컨테이너명`으로 원인을 확인하세요.

## 4.4 알려진 문제 수정: Ghost의 SQLite 강제

`ghost`가 계속 Restarting이고 로그에 `Error: connect ECONNREFUSED <서버-IP>:3306`이 나타나면——데이터 볼륨에 MySQL을 가리키는 이전 `config.production.json`이 남아 있다는 뜻입니다. 수정: compose의 ghost 서비스 `environment`에 SQLite를 명시적으로 선언하세요:

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

> ⚠️ Windows + Docker Desktop WSL2 환경에서는 볼륨 데이터가 WSL2 가상 디스크 안에 있어 호스트 git bash에서 보이지 않으므로 볼륨 내 `config.production.json`을 직접 삭제할 수 없고, 「환경 변수 덮어쓰기」 방식으로만 해결할 수 있습니다. `docker volume rm windows_ghost-data`도 실행하지 마세요 (이미 게시된 글이 손실됩니다).

> ✅ 검증: 로그에 `Ghost database ready` + `Ghost booted`가 나타나고, `curl.exe -I http://127.0.0.1:8090`이 200을 반환.

## 4.5 서비스별 접근 가능 여부 검증

```
# Keycloak — 302이면 OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (/ghost/ 초기화 페이지로 리다이렉트)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Update Server — 403 (빈 디렉터리, nginx 실행 중)
curl.exe -I http://127.0.0.1:8091
# AI 관리 센터 — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

LiteLLM은 순수 API로 웹 인터페이스가 없어 컨테이너 내부에서 검증합니다:

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# 예상 반환 {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 Docker Desktop WSL2의 HTTP 프록시 때문에 LiteLLM이 호스트에서 접근 불가할 수 있습니다 (HEART/빈 응답). 이는 알려진 버그이며 NewAPI가 컨테이너 이름으로 호출하는 데는 영향을 주지 않습니다.

---

[← 제3장: 설정 파일 및 환경 변수](ch03-env.md) · [📖 목차](index.md) · [제5장: Dify 독립 배포 →](ch05-dify-deploy.md)
