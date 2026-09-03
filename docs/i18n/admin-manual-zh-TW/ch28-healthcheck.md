# 第28章：健康檢查與開機自檢

*第三部分 · 維運篇*

> 一鍵體檢全部 41 個容器 + LLM 全鏈路 + 認證鏈路。

[← 第27章：備份與恢復](ch27-backup.md) · [📖 目錄](index.md) · [第29章：疑難排解手冊 →](ch29-troubleshooting.md)

---

**指令碼**：`C:\AIAllInOne\windows\scripts\health-check.ps1`，輸出 `health_check_<時間戳>.log`。覆蓋 41 個容器（25 Windows 核心 + 16 Dify），憑據從 `.env` 讀，不硬編碼密碼。

## 28.1 檢查範圍（9 個階段）

| 階段 | 檢查項 |
| --- | --- |
| Stage 1 | Docker Daemon 是否執行（等待就緒，適配開機自檢） |
| Stage 2 | 41 個容器狀態（Up/Exited/Restarting） |
| Stage 3 | 10 個 HTTP 端點響應 |
| Stage 4 | LiteLLM readiness + 模型註冊、Dify API、資料庫/Redis/Sandbox 健康 |
| Stage 5 | LLM 全鏈路（NewAPI → LiteLLM → DeepSeek 真實請求） |
| Stage 6 | AD 帳號認證鏈路 + NewAPI 管理員登入 |
| Stage 7 | MCP Gateway + Skill 功能 |
| Stage 8 | DSH Desktop/Dify 登入前置條件 |
| Stage 9 | 磁碟空間 |

## 28.2 手動執行

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ 輸出末尾 `ALL CLEAR` 且 `Fail: 0` 表示全部正常。

## 28.3 開機自啟（計劃任務）

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登入後延遲 2 分鐘等 Docker + 容器啟動
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 注意：指令碼用 `127.0.0.1` 不用 localhost；LiteLLM 內部健康用 `/health/readiness`（無需認證）；`dify-init_permissions-1` Exited(0) 正常；Update Server 返回 403 正常（無預設 index.html）；exit code 0=透過、1=有失敗。

---

[← 第27章：備份與恢復](ch27-backup.md) · [📖 目錄](index.md) · [第29章：疑難排解手冊 →](ch29-troubleshooting.md)
