# 제9장: Dify / Ghost / Gitea 설정

*제1부 · 배포편*

> 세 제품 각각의 초기화 및 상호 연결 설정.

[← 제8장: LiteLLM: 검증 및 캐시](ch08-litellm.md) · [📖 목차](index.md) · [제10장: DeepChat 배포 및 CI/CD →](ch10-deepchat.md)

---

## 9.1 Dify: 모델 공급자 설정

1. `http://<서버-IP>` 열기 → 최초 관리자 이메일/비밀번호 설정 (이메일 `ai_all_in_one_admin@<회사-도메인>`);

2. **설정 → 모델 공급자** → OpenAI-API-compatible → 모델 추가:

- 모델명 `deepseek-chat` (실제에 따름);

- API Key: `dify-key`의 `sk-xxx`;

- API endpoint: `http://host.docker.internal:3000/v1`.

3. 스튜디오 → 채팅 어시스턴트 생성 → 모델 선택 → 메시지 전송 검증.

> ⚠️ Dify는 `host.docker.internal`을 사용하며 컨테이너 이름을 쓰지 않습니다. Dify가 자체 네트워크에 있어 NewAPI와 네트워크가 다르기 때문입니다.

## 9.2 Ghost: 포털 설정

1. 관리 페이지 `http://<서버-IP>:8090/ghost/` (**/ghost/ 접미사 주의**). 최초 setup 마법사로 관리자 생성 (이메일 `ai_all_in_one_admin@<회사-도메인>`, 비밀번호 10자 이상);

2. 자동화: `scripts\ghost-setup.ps1`을 직접 실행해 setup API로 한 번에 관리자 생성, 마법사와 동일 (이미 초기화된 경우 자동 건너뜀);

3. **테마**: 디자인 → 테마, 기본 제공 Casper/Source를 바로 활성화;

4. **내비게이션 메뉴**: 디자인 → 메뉴 → 「메인 내비게이션」 생성.

| 메뉴 항목 | 유형 | URL |
| --- | --- | --- |
| 홈 | 페이지 | `/` |
| 뉴스 | 카테고리 | `/category/news` |
| 다운로드 센터 | 페이지 | `/downloads` |
| AI 워크벤치 | 사용자 지정 링크 | `http://<서버-IP>` |
| 도움말 | 카테고리 | `/category/docs` |

1. **다운로드 센터 페이지**: 페이지 → 「다운로드 센터」 새로 만들기 (slug `downloads`), 내용에 DeepChat 설치 패키지 내부망 링크.

```
## DeepChat 엔터프라이즈
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<서버-IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<서버-IP>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```

> ⚠️ 포털 홈 `/`에서 「가입」을 누르지 마세요——방문자 구독자 가입입니다 (SMTP 미설정 시 500). 관리자 진입점은 `/ghost/`입니다. GitHub에서 최신 테마를 설치하지 마세요 (Ghost 6.x용일 수 있어 5.x에서 incompatible 오류).

## 9.3 Gitea: 초기화 및 Runner 등록

1. `http://<서버-IP>:3002` 열기 → 설치 마법사 (데이터베이스 SQLite 사전 설정됨) → 관리자 생성 (사용자명 `ai_all_in_one_admin`);

2. 우측 상단 아바타 → **Site Administration → Actions** → Enabled Actions 켜짐 확인;

3. **Runners → Create new Runner** → Registration Token 복사;

4. Token을 `.env`의 `GITEA_RUNNER_TOKEN`에 입력, Runner 재생성:

```
# ⚠️ 반드시 up -d 사용, restart 사용 금지 (restart는 .env의 token을 다시 읽지 않음)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

> ⚠️ 함정 1: `readonly database` 오류는 대부분 `gitea.db`가 root 소유자이기 때문입니다. root 소유 db를 삭제해 git 사용자로 재생성하세요.
 ⚠️ 함정 2: `ROOT_URL`을 `http://<서버-IP>:3002/`로 설정해야 하며, 아니면 생성된 저장소 링크가 localhost가 되어 직원이 열어도 무효화됩니다.

> 📖 원문 문서:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (중국어) https://docs.gitea.com/zh-cn

---

[← 제8장: LiteLLM: 검증 및 캐시](ch08-litellm.md) · [📖 목차](index.md) · [제10장: DeepChat 배포 및 CI/CD →](ch10-deepchat.md)
