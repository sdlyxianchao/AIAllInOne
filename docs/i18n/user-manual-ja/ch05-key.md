# 第5章：API Key の申請

*クイックスタート*

> 会社の AI 能力をサードパーティツールに接続するには、API Key が必要です。

[← 第4章：ツール2：Dify](ch04-dify.md) · [📖 目次](index.md) · [第6章：データセキュリティ規程 →](ch06-security.md)

---

会社の AI 能力を**サードパーティツール**（自分のスクリプト、OpenAI インターフェース対応の他のソフト）に接続する場合、API Key（`sk-` で始まるキー）が必要です。

## 5.1 NewAPI へのログイン

1. ブラウザで `http://IP:3000` を開く；

2. 統合アカウントでログイン（または「ワンクリックログイン / OIDC」でドメインアカウントを使用）。

## 5.2 新規トークンの作成

1. 左メニュー「**API キー / トークン**」；

2. 「**新規トークン**」をクリックし、名前を付け（例：`私のスクリプト`）、クォータ、有効期限を設定可能；

3. 保存後に生成された `sk-xxxx` 文字列をコピー。**一度しか表示されないため、必ずすぐに保存**。

## 5.3 クライアントへの記入

- **API Base URL**：`http://IP:3000/v1`

- **API Key**：先ほどコピーした `sk-xxxx`

## 5.4 よくある使い方の例

> 💡 curl でテスト：
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"こんにちは"}]}'`

> ⚠️ クォータを使い切ると「残高不足」と表示されます。管理者に引き上げを申請してください。Key はあなたのアカウントパスワードに相当し、**他人に渡さない、コードリポジトリにコミットしない**。

> 📖 公式ドキュメント：NewAPI 公式ドキュメント https://docs.newapi.pro · 公式サイト https://www.newapi.ai

---

[← 第4章：ツール2：Dify](ch04-dify.md) · [📖 目次](index.md) · [第6章：データセキュリティ規程 →](ch06-security.md)
