# 第26章：MailHog 邮件接收器

*第二部分 · 管理篇（各产品日常操作）*

> 内网无 SMTP 时的「邮件出口」，承接 Ghost 验证码/通知邮件。

[← 第25章：PII 脱敏（Presidio）](ch25-ops-pii.md) · [📖 目录](index.md) · [第27章：备份与恢复 →](ch27-backup.md)

---

## 26.1 与 AI 管理中心的关系

MailHog **没有**独立菜单页（它是内网邮件接收器，不是管理后台）。但它支撑两个功能：① Ghost 免密登录的验证码邮件；② AI 管理中心「Ghost 后台 → 打开」的自动免密登录（见 26.5）。MailHog 必须保持运行，否则 Ghost 登录报 `Failed to send email`。

## 26.2 登录 MailHog 收件箱

- 浏览器打开 `http://<服务器IP>:8025`（Web 收件箱，无需登录）；SMTP 端口 1025 仅容器内部使用。

## 26.3 Ghost 侧配置

```
# docker-compose.yml 里 Ghost 的环境变量
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.4 查看邮件

1. 浏览器打开 `http://<服务器IP>:8025`；
2. 收件箱里看到 Ghost 发的验证码/通知邮件（Ghost 后台登录的 6 位验证码在这里找）。

## 26.5 Ghost 免登录（AI 管理中心自动登录）

Ghost 的 6 位验证码本质是 **TOTP**（`TOTP(admin_session_secret + userId)`，6 位/60 秒/HMAC-SHA1）。AI 管理中心能本地算出验证码，点「Ghost 后台 → 打开」自动完成：密码登录 → 本地算码 → 验证会话 → 写 cookie → 进后台，全程无感、免翻 MailHog（`ghostSession` 缓存 24 小时，避免触发 Ghost 429 限流）。

> ⚠️ 就算自己算码，Ghost 仍会真发邮件，所以 MailHog 必须保留，否则登录报 `Failed to send email`。

> 📖 原厂文档：MailHog 源码仓库 https://github.com/mailhog/MailHog

---

[← 第25章：PII 脱敏（Presidio）](ch25-ops-pii.md) · [📖 目录](index.md) · [第27章：备份与恢复 →](ch27-backup.md)
