# 第28章：ヘルスチェックと起動時セルフチェック

*第三部 · 運用編*

> ワンクリックで全 41 コンテナ + LLM 全経路 + 認証経路を検査します。

[← 第27章：バックアップと復元](ch27-backup.md) · [📖 目次](index.md) · [第29章：トラブルシューティングマニュアル →](ch29-troubleshooting.md)

---

**スクリプト**：`C:\AIAllInOne\windows\scripts\health-check.ps1`。出力は `health_check_<タイムスタンプ>.log`。41 コンテナ（Windows コア 25 + Dify 16）をカバーし、資格情報は `.env` から読み取り、パスワードをハードコードしません。

## 28.1 検査範囲（9 ステージ）

| ステージ | 検査項目 |
| --- | --- |
| Stage 1 | Docker Daemon 稼働状態（起動待機、起動時セルフチェック対応） |
| Stage 2 | 41 コンテナの状態（Up/Exited/Restarting） |
| Stage 3 | 10 個の HTTP エンドポイント応答 |
| Stage 4 | LiteLLM readiness + モデル登録、Dify API、データベース/Redis/Sandbox ヘルス |
| Stage 5 | LLM 全経路（NewAPI → LiteLLM → DeepSeek 実リクエスト） |
| Stage 6 | AD アカウント認証経路 + NewAPI 管理者ログイン |
| Stage 7 | MCP Gateway + スキル機能 |
| Stage 8 | DSH Desktop/Dify ログイン前提条件 |
| Stage 9 | ディスク空き容量 |

## 28.2 手動実行

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ 出力末尾に `ALL CLEAR` かつ `Fail: 0` ならすべて正常です。

## 28.3 起動時自動実行（スケジュールタスク）

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # ログイン後 2 分遅延させて Docker + コンテナ起動を待つ
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 注意：スクリプトは `127.0.0.1` を使い localhost は使いません。LiteLLM 内部ヘルスは `/health/readiness`（認証不要）。`dify-init_permissions-1` の Exited(0) は正常。Update Server の 403 は正常（デフォルト index.html なし）。exit code 0=通過、1=失敗あり。

---

[← 第27章：バックアップと復元](ch27-backup.md) · [📖 目次](index.md) · [第29章：トラブルシューティングマニュアル →](ch29-troubleshooting.md)
