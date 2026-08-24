# 제29장: 문제 해결 매뉴얼

*제3부 · 운영편*

> 증상별 빠른 조회로 근본 원인 신속 파악.

[← 제28장: 상태 점검 및 부팅 자체 점검](ch28-healthcheck.md) · [📖 목차](index.md) · [제부장: 원문 문서 색인 →](ch30-appendix.md)

---

## 29.1 공통 문제 해결 3단계

1. **컨테이너 상태 확인**: `docker ps -a`에서 Exited/Restarting 확인;

2. **로그 확인**: `docker logs <컨테이너명> --tail 30`;

3. **상태 점검 확인**: `health-check.ps1` 실행해 실패 단계 파악.

## 29.2 증상 빠른 조회표

| 증상 | 근본 원인 | 해결 |
| --- | --- | --- |
| localhost에서 어떤 제품도 열리지 않음 | WSL2 IPv6 `::1` 호환 문제 | 내부망 IP 또는 127.0.0.1 사용 |
| Ghost가 계속 Restarting, ECONNREFUSED :3306 오류 | 볼륨 내 MySQL config 잔존 | 환경 변수로 SQLite 강제 (제4장) |
| Dify 4개 컨테이너 시작 즉시 크래시 ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 50으로 변경 (제5장) |
| NewAPI 채널 테스트 No connected db 오류 | 채널 키에 예시 값 입력 | `LITELLM_MASTER_KEY` 실제 값 입력 |
| NewAPI OIDC invalid_grant / Incorrect redirect_uri 오류 | 서버 주소가 localhost | 내부망 주소 설정 (제7장) |
| NewAPI 로그인 429 | 핵심 API 속도 제한 | redis rateLimit:* 삭제 또는 .env 변경 |
| Dify 앱 생성 시 계속 ws://localhost 연결 | WebSocket 주소 미변경 | NEXT_PUBLIC_SOCKET_URL 내부망 IP 설정 |
| Dify 로그인 클릭 시 반응 없음 | 비밀번호 base64 필요 / 미로그인 401 정상 | 스크립트 먼저 base64; 브라우저 재시도 |
| Gitea readonly database 오류 | gitea.db가 root 소유 | root 소유 db 삭제 후 재생성 |
| Gitea 저장소 링크가 localhost | ROOT_URL 미변경 | 내부망 주소 설정 |
| SSO 로그인 unknown_error | AD 포트 포워딩 무효 (iphlpsvc) | iphlpsvc + Hyper-V 네트워크 확인 |
| Keycloak에서 도메인 사용자가 안 보임 | Search scope = One Level | Subtree로 변경 |
| Langfuse 데이터가 안 보임 | V4_WRITE_MODE 또는 SSO 계정 미가입 조직 | dual 설정; SQL로 조직 추가 (제23장) |
| DSH Desktop 모델 연결 타임아웃 | 클라이언트가 죽은 시스템 프록시 경유 | 프록시 사용 안 함/직접 연결로 설정 |
| Loki 로그 조회 안 됨 | job 라벨 사용 | `{container=~".+"}` 사용 |
| Presidio 404 /analyze/analyze | 엔드포인트에 경로 포함 | base URL만 입력 |
| server.js 수정 후 새 API 404 | up -d는 volume 변화를 다시 읽지 않음 | docker restart admin-portal |

## 29.3 자주 쓰는 명령

```
docker ps -a                                        # 모든 컨테이너 상태
docker logs <컨테이너> --tail 50                     # 로그 확인
docker compose up -d <서비스>                        # 특정 서비스 재빌드
docker compose restart <서비스>                      # 특정 서비스 재시작 (.env 다시 읽지 않음)
docker system df                                     # Docker 디스크 사용량
C:\AIAllInOne\windows\scripts\health-check.ps1       # 원클릭 점검
```

---

[← 제28장: 상태 점검 및 부팅 자체 점검](ch28-healthcheck.md) · [📖 목차](index.md) · [제부장: 원문 문서 색인 →](ch30-appendix.md)
