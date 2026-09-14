# 第26章：MailHog 郵件接收器

*第二部分 · 管理篇（各產品日常操作）*

> 內網無 SMTP 時的「郵件出口」，承接 Ghost 驗證碼/通知郵件。

[← 第25章：PII 遮蔽（Presidio）](ch25-ops-pii.md) · [📖 目錄](index.md) · [第27章：備份與恢復 →](ch27-backup.md)

---

**入口**：`http://<伺服器IP>:8025`（Web 收件箱，SMTP 1025 僅內部）。

## 26.1 為什麼需要它

Ghost 5 後臺是免密登入：輸入郵箱後 Ghost 發一封帶 6 位驗證碼的郵件。內網沒有 SMTP 時郵件發不出去，登入就報 `Failed to send email`。MailHog 當「郵件出口」接住這些郵件。

## 26.2 Ghost 側配置

```
# docker-compose.yml 裡 Ghost 的環境變數
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 檢視郵件

1. 瀏覽器開啟 `http://<伺服器IP>:8025`；

2. 收件箱裡看到 Ghost 發的驗證碼/通知郵件。

## 26.4 Ghost 免登入（AI 管理中心自動登入）

Ghost 的 6 位驗證碼本質是 **TOTP**（`TOTP(admin_session_secret + userId)`，6 位/60 秒/HMAC-SHA1）。AI 管理中心能本地算出驗證碼，點「Ghost 後臺 → 開啟」自動完成：密碼登入 → 本地算碼 → 驗證會話 → 寫 cookie → 進後臺，全程無感、免翻 MailHog。

> ⚠️ 就算自己算碼，Ghost 仍會真發郵件，所以 MailHog 必須保留，否則登入報 `Failed to send email`。

> 📖 原廠文件：MailHog 原始碼倉庫 https://github.com/mailhog/MailHog

---

[← 第25章：PII 遮蔽（Presidio）](ch25-ops-pii.md) · [📖 目錄](index.md) · [第27章：備份與恢復 →](ch27-backup.md)
