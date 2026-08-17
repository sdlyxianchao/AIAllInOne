# 第25章：PII 脱敏（Presidio）

*第二部分 · 管理篇（各产品日常操作）*

> 敏感信息在出内网前自动脱敏。

[← 第24章：统一日志（Loki）](ch24-ops-loki.md) · [📖 目录](index.md) · [第26章：MailHog 邮件接收器 →](ch26-ops-mailhog.md)

---

## 25.1 两层脱敏

| 层 | 能力 |
| --- | --- |
| LiteLLM 内置正则（`litellm_content_filter`） | 手机号、身份证、银行卡、邮箱、统一社会信用代码、护照、IPv4 等，命中即替换 `[xxx_REDACTED]`；敏感词黑名单命中即 BLOCK 拒绝 |
| Microsoft Presidio | 更细粒度实体（英文人名、邮箱等），`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 内置正则规则

| 规则 | 正则 | 类型 |
| --- | --- | --- |
| 中国手机号 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身份证号 | `\b\d{17}[\dXx]\b` | cn_id |
| 银行卡号 | `\b\d{16,19}\b` | bank_card |
| 邮箱 | prebuilt `email` | email |
| 统一社会信用代码 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 护照号 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

敏感词黑名单在 `litellm-config.yaml` 的 `blocked_words` 按公司实际增删（`内部机密`、`商业机密` 等）。

## 25.3 启用 Presidio（当前暂注释）

新版 LiteLLM guardrail API 变更，Presidio 段当前注释。启用要点：

- guardrails 加 `default_on: true` 才全局生效；

- 端点环境变量 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` 必须填 base URL（LiteLLM 自动拼 `/analyze`、`/anonymize`，带路径会变 `/analyze/analyze` 404）。

> ⚠️ 镜像约 965MB，国内拉取很慢（实测约 1 小时），拉不动可先用内置正则（已覆盖中文核心 PII）。

## 25.4 验证

发含手机号/邮箱的请求 → 模型回复中原始值被替换为 `[REDACTED]`；发含「内部机密」的请求 → 直接返回 `Content blocked`。

> 📖 原厂文档：Microsoft Presidio https://microsoft.github.io/presidio/ · 源码 https://github.com/microsoft/presidio

---

[← 第24章：统一日志（Loki）](ch24-ops-loki.md) · [📖 目录](index.md) · [第26章：MailHog 邮件接收器 →](ch26-ops-mailhog.md)
