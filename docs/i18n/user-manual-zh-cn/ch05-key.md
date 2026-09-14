# 第5章：申请 API Key

*快速开始*

> 把公司 AI 能力接入第三方工具，需要一个 API Key。

[← 第4章：工具二：Dify](ch04-dify.md) · [📖 目录](index.md) · [第6章：数据安全规范 →](ch06-security.md)

---

如果你要把公司的 AI 能力接入**第三方工具**（自己的脚本、其它支持 OpenAI 接口的软件），需要一个 API Key（`sk-` 开头的密钥）。

## 5.1 登录 NewAPI

1. 浏览器打开 `http://IP:3000`；

2. 用统一账号登录（或点「一键登录 / OIDC」用域账号）。

## 5.2 新建令牌

1. 左侧菜单「**API 密钥 / 令牌**」；

2. 点「**新建令牌**」，起名（如 `我的脚本`），可设额度、过期时间；

3. 保存后复制生成的 `sk-xxxx` 字符串。**只显示一次，务必立即保存**。

## 5.3 填入客户端

- **API Base URL**：`http://IP:3000/v1`

- **API Key**：刚才复制的 `sk-xxxx`

## 5.4 常见用法示例

> 💡 用 curl 测试：
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"你好"}]}'`

> ⚠️ 额度用完后报「余额不足」，联系管理员申请提额。Key 相当于你的账号密码，**不要发给别人、不要提交到代码仓库**。

> 📖 原厂文档：NewAPI 官方文档 https://docs.newapi.pro · 官网 https://www.newapi.ai

---

[← 第4章：工具二：Dify](ch04-dify.md) · [📖 目录](index.md) · [第6章：数据安全规范 →](ch06-security.md)
