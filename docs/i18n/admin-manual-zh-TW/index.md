# AI AllInOne 管理員手冊

*v0.2 · 部署 · 管理 · 維運*

本手冊分為三部分：**部署篇**（第 1–13 章，從零搭建平台）、**管理篇**（第 14–26 章，13 個產品的日常操作）和**營運篇**（第 27–29 章，備份 / 健康檢查 / 故障排除），外加**附錄**（第三方文件連結）。每個章節頁面底部都有上一章 / 下一章導覽——可以依序閱讀，也可以直接跳到需要的章節。

## 第一部分 · 部署篇

| # | 章節 | 說明 |
| --- | --- | --- |
| 1 | [平台概覽與架構](ch01-overview.md) | 理解這套平台的組成、埠、資料流，是後續所有部署與管理操作的前提。 |
| 2 | [前置準備](ch02-prereq.md) | 安裝 Docker Desktop、準備目錄、打通網路、固定 IP——部署前必須完成的事。 |
| 3 | [配置檔案與環境變數](ch03-env.md) | 三個核心配置檔案 + 全套環境變數說明，哪些現在配、哪些以後配。 |
| 4 | [啟動核心服務](ch04-start.md) | 複製 .env、拉起容器、逐服務驗證可訪問，處理 Ghost 的 SQLite 已知問題。 |
| 5 | [Dify 獨立部署](ch05-dify-deploy.md) | Dify 用官方 compose（約 15 個容器）獨立部署，避免埠衝突。 |
| 6 | [Keycloak：Realm、使用者與 AD](ch06-keycloak.md) | 建立 Realm、建本地帳號、或從 Active Directory 匯入網域帳號——所有產品 SSO 的基礎。 |
| 7 | [NewAPI：初始化、渠道與 OIDC](ch07-newapi.md) | 完成初始安裝嚮導，配置指向 LiteLLM 的渠道、下發 API Key，接入 Keycloak OIDC。 |
| 8 | [LiteLLM：驗證與快取](ch08-litellm.md) | 驗證 LiteLLM 代理可用、開啟響應快取節省 token。 |
| 9 | [Dify / Ghost / Gitea 配置](ch09-products.md) | 三個產品各自的初始化與互連配置。 |
| 10 | [DeepChat 分發與 CI/CD](ch10-deepchat.md) | 把 DeepChat 安裝包分發給員工，以及用 Gitea Actions 自動同步官方新版本。 |
| 11 | [MCP Gateway 與 Skill 市場](ch11-mcp.md) | 集中管理 Skill 和 MCP 工具的閘道器，DeepChat/Dify 連一個地址即可拿到所有工具。 |
| 12 | [AI 管理中心](ch12-admin-center.md) | 統一管理員門戶：Keycloak 鑑權、左側選單內嵌全部產品、Dashboard 叢集狀態。 |
| 13 | [互連驗證清單](ch13-interconnect.md) | 部署完成後，逐項確認 12 條互連鏈路全部打通。 |

## 第二部分 · 管理篇（各產品日常操作）

| # | 章節 | 說明 |
| --- | --- | --- |
| 14 | [Keycloak 日常管理](ch14-ops-keycloak.md) | 認證中樞：管使用者、角色、OIDC 客戶端、AD 聯邦、會話。 |
| 15 | [NewAPI 日常管理](ch15-ops-newapi.md) | LLM 閘道器：管渠道、令牌、額度、使用者、日誌、成本。 |
| 16 | [LiteLLM 日常管理](ch16-ops-litellm.md) | PII 遮蔽代理：模型列表、遮蔽規則、快取、Langfuse 上報。 |
| 17 | [Dify 日常管理](ch17-ops-dify.md) | AI 應用平台：應用、知識庫、模型供應商、成員權限、釋出。 |
| 18 | [Ghost 日常管理](ch18-ops-ghost.md) | 企業門戶 / Hub：文章、頁面、導航、主題、成員。 |
| 19 | [Gitea 日常管理](ch19-ops-gitea.md) | 內部 Git + CI/CD：倉庫、組織、Runner、Actions。 |
| 20 | [MCP Gateway 日常管理](ch20-ops-mcp.md) | 增刪 MCP Server、上傳/刪除 Skill、擴充套件內建工具。 |
| 21 | [更新伺服器管理](ch21-ops-update.md) | DeepChat 安裝包託管與自動更新。 |
| 22 | [監控告警管理](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager：容器資源監控與告警通知。 |
| 23 | [LLM 可觀測（Langfuse）](ch23-ops-langfuse.md) | 追蹤每次模型呼叫的提示詞、響應、延遲、token、成本。 |
| 24 | [統一日誌（Loki）](ch24-ops-loki.md) | 聚合所有容器日誌，按容器 + 關鍵字 + 時間檢索。 |
| 25 | [PII 遮蔽（Presidio）](ch25-ops-pii.md) | 敏感資訊在出內網前自動遮蔽。 |
| 26 | [MailHog 郵件接收器](ch26-ops-mailhog.md) | 內網無 SMTP 時的「郵件出口」，承接 Ghost 驗證碼/通知郵件。 |

## 第三部分 · 維運篇

| # | 章節 | 說明 |
| --- | --- | --- |
| 27 | [備份與恢復](ch27-backup.md) | 全量資料每日備份、一鍵恢復。 |
| 28 | [健康檢查與開機自檢](ch28-healthcheck.md) | 一鍵體檢全部 41 個容器 + LLM 全鏈路 + 認證鏈路。 |
| 29 | [疑難排解手冊](ch29-troubleshooting.md) | 按症狀速查，快速定位根因。 |

## 附錄

| # | 章節 | 說明 |
| --- | --- | --- |
| 附錄 | [原廠文件索引](ch30-appendix.md) | 所有第三方產品的官方文件地址（明文 URL，列印後仍可對照訪問）。 |

---

> 🌐 其他語言版本：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · 繁體中文 · [Français](../admin-manual-fr/index.md) · [Español](../admin-manual-es/index.md) · [Português](../admin-manual-pt/index.md) · [日本語](../admin-manual-ja/index.md) · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
