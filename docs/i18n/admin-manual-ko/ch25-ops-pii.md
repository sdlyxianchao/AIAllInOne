# 제25장: PII 비식별화 (Presidio)

*제2부 · 관리편 (각 제품 일상 운영)*

> 민감 정보가 내부망을 나가기 전에 자동 비식별화.

[← 제24장: 통합 로그 (Loki)](ch24-ops-loki.md) · [📖 목차](index.md) · [제26장: MailHog 메일 수신기 →](ch26-ops-mailhog.md)

---

## 25.1 2단계 비식별화

| 계층 | 기능 |
| --- | --- |
| LiteLLM 내장 정규식 (`litellm_content_filter`) | 휴대폰번호, 주민등록번호, 은행카드, 이메일, 통일사회신용코드, 여권, IPv4 등, 일치 시 `[xxx_REDACTED]`로 대체; 민감어 블랙리스트 일치 시 BLOCK 거부 |
| Microsoft Presidio | 더 세밀한 엔티티 (영문 인명, 이메일 등), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 내장 정규식 규칙

| 규칙 | 정규식 | 유형 |
| --- | --- | --- |
| 중국 휴대폰번호 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 주민등록번호 | `\b\d{17}[\dXx]\b` | cn_id |
| 은행카드 번호 | `\b\d{16,19}\b` | bank_card |
| 이메일 | prebuilt `email` | email |
| 통일사회신용코드 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 여권 번호 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

민감어 블랙리스트는 `litellm-config.yaml`의 `blocked_words`에서 회사 실정에 맞게 추가/삭제 (`내부 기밀`, `영업 기밀` 등).

## 25.3 Presidio 활성화 (현재 잠시 주석 처리)

새 LiteLLM guardrail API 변경으로 Presidio 부분이 현재 주석 처리되어 있습니다. 활성화 핵심:

- guardrails에 `default_on: true`를 추가해야 전역 적용;

- 엔드포인트 환경 변수 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE`에 반드시 base URL 입력 (LiteLLM이 자동으로 `/analyze`, `/anonymize`를 붙이므로, 경로를 포함하면 `/analyze/analyze`가 되어 404).

> ⚠️ 이미지 약 965MB로 국내 다운로드가 매우 느립니다 (실측 약 1시간). 다운로드가 안 되면 먼저 내장 정규식을 사용하세요 (이미 중국어 핵심 PII 커버).

## 25.4 검증

휴대폰번호/이메일이 포함된 요청 전송 → 모델 응답에서 원본 값이 `[REDACTED]`로 대체; 「내부 기밀」 포함 요청 전송 → 바로 `Content blocked` 반환.

> 📖 원문 문서:Microsoft Presidio https://microsoft.github.io/presidio/ · 소스 https://github.com/microsoft/presidio

---

[← 제24장: 통합 로그 (Loki)](ch24-ops-loki.md) · [📖 목차](index.md) · [제26장: MailHog 메일 수신기 →](ch26-ops-mailhog.md)
