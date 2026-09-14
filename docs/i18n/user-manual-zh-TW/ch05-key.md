# 第5章：申請 API Key

*快速開始*

> 把公司 AI 能力接入第三方工具，需要一個 API Key。

[← 第4章：工具二：Dify](ch04-dify.md) · [📖 目錄](index.md) · [第6章：資料安全規範 →](ch06-security.md)

---

如果你要把公司的 AI 能力接入**第三方工具**（自己的指令碼、其它支援 OpenAI 介面的軟體），需要一個 API Key（`sk-` 開頭的金鑰）。

## 5.1 登入 NewAPI

1. 瀏覽器開啟 `http://IP:3000`；

2. 用統一帳號登入（或點「一鍵登入 / OIDC」用網域帳號）。

## 5.2 新建令牌

1. 左側選單「**API 金鑰 / 令牌**」；

2. 點「**新建令牌**」，起名（如 `我的指令碼`），可設額度、過期時間；

3. 儲存後複製生成的 `sk-xxxx` 字串。**只顯示一次，務必立即儲存**。

## 5.3 填入客戶端

- **API Base URL**：`http://IP:3000/v1`

- **API Key**：剛才複製的 `sk-xxxx`

## 5.4 常見用法示例

> 💡 用 curl 測試：
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"你好"}]}'`

> ⚠️ 額度用完後報「餘額不足」，聯絡管理員申請提額。Key 相當於你的帳號密碼，**不要發給別人、不要提交到程式碼倉庫**。

> 📖 原廠文件：NewAPI 官方文件 https://docs.newapi.pro · 官網 https://www.newapi.ai

---

[← 第4章：工具二：Dify](ch04-dify.md) · [📖 目錄](index.md) · [第6章：資料安全規範 →](ch06-security.md)
