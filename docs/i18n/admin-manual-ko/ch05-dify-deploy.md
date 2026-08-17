# 제5장: Dify 독립 배포

*제1부 · 배포편*

> Dify는 공식 compose(약 15개 컨테이너)로 독립 배포하여 포트 충돌을 피합니다.

[← 제4장: 핵심 서비스 시작](ch04-start.md) · [📖 목차](index.md) · [제6장: Keycloak: Realm, 사용자 및 AD →](ch06-keycloak.md)

---

> 📌 Dify는 공식 docker-compose(~15개 컨테이너 포함)를 사용하며, 독립 배포로 포트 충돌을 피하고 자체 기본 네트워크(핵심 서비스의 `ai-platform` 네트워크와 다름)를 사용합니다.

## 5.1 Dify 클론

```
# 방안 A: GitHub (접근 가능해야 함)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 방안 B: Gitee 공식 미러 (국내 권장)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 호환성 수정 + 환경 변수 복사

```
cd dify\docker

# env_file 형식 수정 (구버전 Docker Compose 호환)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 메인 환경 변수 복사
copy .env.example .env

# 모든 서브 템플릿 복사 (sandbox.env 등)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Dify 1.16.1 업스트림 검증 문제 수정 (필수)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 검증
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ 왜 `GRAPH_ENGINE_SCALE_UP_THRESHOLD`를 반드시 바꿔야 하는가: Dify 1.16.1이 해당 필드를 「0 허용」에서 「반드시 > 0」으로 업그레이드했지만 `shared.env` 템플릿은 여전히 0입니다. 바꾸지 않으면 `docker-api-1` / `worker` / `worker_beat` / `api_websocket` 4개 컨테이너가 시작하자마자 크래시되고 로그에 `ValidationError: Input should be greater than 0`이 나타납니다.

## 5.3 Dify 시작

```
docker compose up -d
docker compose ps
```

> ✅ 모든 컨테이너 `Up` (`init_permissions`이 Exited로 표시되는 것은 정상). 브라우저에서 `http://127.0.0.1/install`을 열어 관리자 계정을 초기화하세요.

## 5.4 WebSocket 주소 수정 (안 고치면 계속 ws://localhost에 연결)

`.env`의 `NEXT_PUBLIC_SOCKET_URL` 기본값은 `ws://localhost`인데, 내부망 배포 시 브라우저의 localhost는 사용자 본인 컴퓨터를 가리켜 프런트엔드가 계속 연결되지 않습니다 (앱 생성/워크플로 디버깅이 멈춥니다).

```
# .env에서 내부망 IP로 변경
NEXT_PUBLIC_SOCKET_URL=ws://<서버-IP>

# docker-compose.yaml의 web 서비스 fallback도 함께 변경
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<서버-IP>}

# web 컨테이너 재빌드로 적용
docker compose up -d web
```

> 📌 변경 후 브라우저를 강력 새로고침하세요 (Ctrl+F5). 이 변수는 런타임에 읽히므로 .env 변경 + web 재시작으로 충분하며 이미지 재빌드는 필요 없습니다.

## 5.5 함정 빠른 참조

> ⚠️ **로그인 비밀번호는 base64로 전송**: Dify 1.16.x 로그인 API `POST /console/api/login`의 `password`는 base64로 인코딩된 비밀번호입니다. 스크립트 로그인 시 먼저 `base64(비밀번호)`를 해야 합니다; 프런트엔드에서 「로그인 클릭 시 반응 없음」은 console의 `GET /account/profile 401`이 미로그인 상태의 정상 현상입니다.

> ⚠️ **관리자 비밀번호 분실 시 재설정**: Dify 비밀번호 해시는 `pbkdf2_hmac('sha256', password, salt, 10000)`(반복 10000)이므로 역산할 수 없습니다. 컨테이너 명령으로 재설정하세요 (새 비밀번호 8자 이상):

```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<회사-도메인> \
  --new-password '<새-비밀번호>' \
  --password-confirm '<새-비밀번호>'
```

> 📖 원문 문서:Dify 공식 문서 https://docs.dify.ai · 자체 호스팅 배포 https://docs.dify.ai/getting-started/install-self-hosted

---

[← 제4장: 핵심 서비스 시작](ch04-start.md) · [📖 목차](index.md) · [제6장: Keycloak: Realm, 사용자 및 AD →](ch06-keycloak.md)
