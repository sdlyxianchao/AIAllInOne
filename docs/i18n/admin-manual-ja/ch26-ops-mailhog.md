# 第26章：MailHog メール受信

*第二部 · 管理編（各製品の日常運用）*

> イントラネットに SMTP がない場合の「メール出口」。Ghost の認証コード/通知メールを受け取ります。

[← 第25章：PII マスキング（Presidio）](ch25-ops-pii.md) · [📖 目次](index.md) · [第27章：バックアップと復元 →](ch27-backup.md)

---

**入口**：`http://<サーバーIP>:8025`（Web 受信箱。SMTP 1025 は内部のみ）。

## 26.1 なぜ必要か

Ghost 5 のバックエンドはパスワードレスログインです：メール入力後、Ghost が 6 桁の認証コードを含むメールを送信します。イントラネットに SMTP がないとメールが送信できず、ログイン時に `Failed to send email` を返します。MailHog が「メール出口」としてこれらのメールを受け取ります。

## 26.2 Ghost 側の設定

```
# docker-compose.yml 内の Ghost 環境変数
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 メールの確認

1. ブラウザで `http://<サーバーIP>:8025` を開く；

2. 受信箱で Ghost が送信した認証コード/通知メールを確認。

## 26.4 Ghost のパスワードレスログイン（AI 管理センターの自動ログイン）

Ghost の 6 桁の認証コードの正体は **TOTP**（`TOTP(admin_session_secret + userId)`、6 桁/60 秒/HMAC-SHA1）。AI 管理センターがローカルで認証コードを計算でき、「Ghost バックエンド → 開く」をクリックすると自動完了します：パスワードログイン → ローカルでコード計算 → セッション検証 → cookie 書き込み → バックエンドへ、全プロセス無感覚で MailHog 確認不要。

> ⚠️ 自分でコードを計算しても、Ghost は依然として実際にメールを送信するため、MailHog を保持する必要があります。ないとログイン時に `Failed to send email` を返します。

> 📖 公式ドキュメント：MailHog ソースリポジトリ https://github.com/mailhog/MailHog

---

[← 第25章：PII マスキング（Presidio）](ch25-ops-pii.md) · [📖 目次](index.md) · [第27章：バックアップと復元 →](ch27-backup.md)
