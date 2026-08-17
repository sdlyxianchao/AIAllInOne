# 第26章：MailHog 邮件接收器

*第二部分 · 管理篇（各产品日常操作）*

> 内网无 SMTP 时的「邮件出口」，承接 Ghost 验证码/通知邮件。

[← 第25章：PII 脱敏（Presidio）](ch25-ops-pii.md) · [📖 目录](index.md) · [第27章：备份与恢复 →](ch27-backup.md)

---

**入口**：`http://<服务器IP>:8025`（Web 收件箱，SMTP 1025 仅内部）。

## 26.1 为什么需要它

Ghost 5 后台是免密登录：输入邮箱后 Ghost 发一封带 6 位验证码的邮件。内网没有 SMTP 时邮件发不出去，登录就报 `Failed to send email`。MailHog 当「邮件出口」接住这些邮件。

## 26.2 Ghost 侧配置

```
# docker-compose.yml 里 Ghost 的环境变量
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 查看邮件

1. 浏览器打开 `http://<服务器IP>:8025`；

2. 收件箱里看到 Ghost 发的验证码/通知邮件。

## 26.4 Ghost 免登录（AI 管理中心自动登录）

Ghost 的 6 位验证码本质是 **TOTP**（`TOTP(admin_session_secret + userId)`，6 位/60 秒/HMAC-SHA1）。AI 管理中心能本地算出验证码，点「Ghost 后台 → 打开」自动完成：密码登录 → 本地算码 → 验证会话 → 写 cookie → 进后台，全程无感、免翻 MailHog。

> ⚠️ 就算自己算码，Ghost 仍会真发邮件，所以 MailHog 必须保留，否则登录报 `Failed to send email`。

> 📖 原厂文档：MailHog 源码仓库 https://github.com/mailhog/MailHog

---

[← 第25章：PII 脱敏（Presidio）](ch25-ops-pii.md) · [📖 目录](index.md) · [第27章：备份与恢复 →](ch27-backup.md)
