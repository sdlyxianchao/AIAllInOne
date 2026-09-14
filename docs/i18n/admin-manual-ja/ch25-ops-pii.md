# 第25章：PII マスキング（Presidio）

*第二部 · 管理編（各製品の日常運用）*

> 機密情報はイントラネット外へ出る前に自動でマスキングされます。

[← 第24章：統合ログ（Loki）](ch24-ops-loki.md) · [📖 目次](index.md) · [第26章：MailHog メール受信 →](ch26-ops-mailhog.md)

---

## 25.1 2 層のマスキング

| レイヤー | 能力 |
| --- | --- |
| LiteLLM 内蔵正規表現（`litellm_content_filter`） | 携帯番号、身分証番号、銀行カード、メール、統一社会信用コード、パスポート、IPv4 など。ヒットすると `[xxx_REDACTED]` に置換。機密語ブラックリストにヒットすると BLOCK 拒否 |
| Microsoft Presidio | より細かいエンティティ（英語人名、メールなど）。`presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 内蔵正規表現ルール

| ルール | 正規表現 | タイプ |
| --- | --- | --- |
| 中国携帯番号 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身分証番号 | `\b\d{17}[\dXx]\b` | cn_id |
| 銀行カード番号 | `\b\d{16,19}\b` | bank_card |
| メール | prebuilt `email` | email |
| 統一社会信用コード | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| パスポート番号 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

機密語ブラックリストは `litellm-config.yaml` の `blocked_words` で会社の実情に合わせて増減します（`内部機密`、`商業機密` など）。

## 25.3 Presidio の有効化（現在一時コメントアウト）

新版 LiteLLM の guardrail API 変更により、Presidio 部分は現在コメントアウトされています。有効化の要点：

- guardrails に `default_on: true` を追加しないとグローバルに有効になりません；

- エンドポイント環境変数 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` は必ず base URL を記入します（LiteLLM が `/analyze`、`/anonymize` を自動付加するため、パス付きだと `/analyze/analyze` 404 になります）。

> ⚠️ イメージは約 965MB で、中国国内での取得は非常に遅い（実測約 1 時間）。取得できない場合はまず内蔵正規表現を使用できます（中国語のコア PII をカバー済み）。

## 25.4 検証

携帯番号/メールを含むリクエストを送信 → モデル応答内の元の値が `[REDACTED]` に置換されます。「内部機密」を含むリクエスト → 直接 `Content blocked` が返ります。

> 📖 公式ドキュメント：Microsoft Presidio https://microsoft.github.io/presidio/ · ソース https://github.com/microsoft/presidio

---

[← 第24章：統合ログ（Loki）](ch24-ops-loki.md) · [📖 目次](index.md) · [第26章：MailHog メール受信 →](ch26-ops-mailhog.md)
