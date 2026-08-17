# 第25章：PII 遮蔽（Presidio）

*第二部分 · 管理篇（各產品日常操作）*

> 敏感資訊在出內網前自動遮蔽。

[← 第24章：統一日誌（Loki）](ch24-ops-loki.md) · [📖 目錄](index.md) · [第26章：MailHog 郵件接收器 →](ch26-ops-mailhog.md)

---

## 25.1 兩層遮蔽

| 層 | 能力 |
| --- | --- |
| LiteLLM 內建正則（`litellm_content_filter`） | 手機號、身分證、銀行卡、郵箱、統一社會信用程式碼、護照、IPv4 等，命中即替換 `[xxx_REDACTED]`；敏感詞黑名單命中即 BLOCK 拒絕 |
| Microsoft Presidio | 更細粒度實體（英文人名、郵箱等），`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 內建正則規則

| 規則 | 正則 | 型別 |
| --- | --- | --- |
| 中國手機號 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身分證號 | `\b\d{17}[\dXx]\b` | cn_id |
| 銀行卡號 | `\b\d{16,19}\b` | bank_card |
| 郵箱 | prebuilt `email` | email |
| 統一社會信用程式碼 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 護照號 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

敏感詞黑名單在 `litellm-config.yaml` 的 `blocked_words` 按公司實際增刪（`內部機密`、`商業機密` 等）。

## 25.3 啟用 Presidio（當前暫註釋）

新版 LiteLLM guardrail API 變更，Presidio 段當前註釋。啟用要點：

- guardrails 加 `default_on: true` 才全域生效；

- 端點環境變數 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` 必須填 base URL（LiteLLM 自動拼 `/analyze`、`/anonymize`，帶路徑會變 `/analyze/analyze` 404）。

> ⚠️ 映像約 965MB，國內拉取很慢（實測約 1 小時），拉不動可先用內建正則（已覆蓋中文核心 PII）。

## 25.4 驗證

發含手機號/郵箱的請求 → 模型回覆中原始值被替換為 `[REDACTED]`；發含「內部機密」的請求 → 直接返回 `Content blocked`。

> 📖 原廠文件：Microsoft Presidio https://microsoft.github.io/presidio/ · 原始碼 https://github.com/microsoft/presidio

---

[← 第24章：統一日誌（Loki）](ch24-ops-loki.md) · [📖 目錄](index.md) · [第26章：MailHog 郵件接收器 →](ch26-ops-mailhog.md)
