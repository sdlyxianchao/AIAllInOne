# 第18章：Ghost 日常管理

*第二部分 · 管理篇（各產品日常操作）*

> 企業門戶 / Hub：文章、頁面、導航、主題、成員。

[← 第17章：Dify 日常管理](ch17-ops-dify.md) · [📖 目錄](index.md) · [第19章：Gitea 日常管理 →](ch19-ops-gitea.md)

---

**入口**：前臺 `http://<伺服器IP>:8090`；後臺 `http://<伺服器IP>:8090/ghost/`（注意 /ghost/ 字尾）。

## 18.1 登入後臺

Ghost 5 後臺是**免密登入**：輸入郵箱 → Ghost 發 6 位驗證碼到 MailHog（`:8025`）。更快的方式：在 AI 管理中心點「Ghost 後臺」的「開啟」按鈕，自動完成登入（本地算 TOTP 碼，免翻郵件）。

## 18.2 釋出內容

1. **文章**：Posts → New post → 寫內容（Markdown 編輯器）→ Publish；

2. **頁面**：Pages → New page（如「下載中心」slug `downloads`）；

3. **標籤/分類**：Tags → 建分類（如 `news` / `docs`），文章歸到分類下。

## 18.3 導航選單

1. 後臺 → 外觀（Design）→ 選單（Navigation）；

2. 編輯「Primary」主導航，新增首頁/新聞/下載中心/AI 工作臺/幫助文件（見第 9 章選單表）。

## 18.4 主題

- **切換**：外觀 → 主題，自帶的 Casper / Source 直接啟用；

- **安裝**：主題市場（Design → Change theme）或上傳 zip。

> ⚠️ 別從 GitHub 裝最新版主題（可能適配 Ghost 6.x，5.x 報 incompatible），要裝舊版 zip。

## 18.5 成員與訂閱（如需）

- Members：管理訂閱者；

- 若不需要訂閱，可忽略此模組（內網門戶通常用不到）。

## 18.6 整合（API Token）

1. 後臺 → Settings → Integrations → 新增自定義整合；

2. 生成 Admin API Key（格式 `id:secret`），供 Gitea Actions 釋出公告等自動化用。

> ⚠️ 關鍵坑：① 別在首頁 `/` 點「註冊」（那是訪客訂閱者註冊）；② 6 位驗證碼本質是 TOTP，AI 管理中心能本地算出；③ 即使本地算碼，Ghost 仍會真發郵件，所以 MailHog 必須保留（否則 `Failed to send email`）。

> 📖 原廠文件：Ghost 官方文件 https://ghost.org/docs/ · 管理後臺 https://ghost.org/docs/admin/

---

[← 第17章：Dify 日常管理](ch17-ops-dify.md) · [📖 目錄](index.md) · [第19章：Gitea 日常管理 →](ch19-ops-gitea.md)
