# 제26장: MailHog 메일 수신기

*제2부 · 관리편 (각 제품 일상 운영)*

> 내부망에 SMTP가 없을 때의 「메일 출구」, Ghost 인증 코드/통지 메일 수신.

[← 제25장: PII 비식별화 (Presidio)](ch25-ops-pii.md) · [📖 목차](index.md) · [제27장: 백업 및 복구 →](ch27-backup.md)

---

**진입점**: `http://<서버-IP>:8025` (Web 받은편지함, SMTP 1025는 내부 전용).

## 26.1 왜 필요한가

Ghost 5 백오피스는 비밀번호 없는 로그인입니다: 이메일 입력 후 Ghost가 6자리 인증 코드가 담긴 메일을 보냅니다. 내부망에 SMTP가 없으면 메일이 발송되지 않아 로그인 시 `Failed to send email` 오류가 납니다. MailHog가 「메일 출구」 역할로 이 메일을 받아줍니다.

## 26.2 Ghost 측 설정

```
# docker-compose.yml의 Ghost 환경 변수
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 메일 조회

1. 브라우저에서 `http://<서버-IP>:8025` 열기;

2. 받은편지함에서 Ghost가 보낸 인증 코드/통지 메일 확인.

## 26.4 Ghost 비밀번호 없는 로그인 (AI 관리 센터 자동 로그인)

Ghost의 6자리 인증 코드는 사실상 **TOTP**입니다 (`TOTP(admin_session_secret + userId)`, 6자리/60초/HMAC-SHA1). AI 관리 센터가 로컬에서 인증 코드를 계산할 수 있어, 「Ghost 백오피스 → 열기」 클릭 시 자동 완료됩니다: 비밀번호 로그인 → 로컬 코드 계산 → 세션 검증 → cookie 기록 → 백오피스 진입, 전 과정 무감각, MailHog 확인 불필요.

> ⚠️ 스스로 코드를 계산해도 Ghost는 여전히 메일을 실제 발송하므로 MailHog를 반드시 유지해야 하며, 아니면 로그인 시 `Failed to send email` 오류.

> 📖 원문 문서:MailHog 소스 저장소 https://github.com/mailhog/MailHog

---

[← 제25장: PII 비식별화 (Presidio)](ch25-ops-pii.md) · [📖 목차](index.md) · [제27장: 백업 및 복구 →](ch27-backup.md)
