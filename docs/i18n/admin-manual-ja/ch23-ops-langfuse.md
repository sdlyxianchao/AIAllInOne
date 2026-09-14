# 第23章：LLM 可観測性（Langfuse）

*第二部 · 管理編（各製品の日常運用）*

> 各モデル呼び出しのプロンプト、レスポンス、遅延、token、コストを追跡します。

[← 第22章：監視・アラート管理](ch22-ops-monitoring.md) · [📖 目次](index.md) · [第24章：統合ログ（Loki） →](ch24-ops-loki.md)

---

**入口**：`http://<サーバーIP>:3010`（SSO 自動ログイン、AI 管理センターの入口は `/auth/sso-initiate?provider=KEYCLOAK` を指す）。

## 23.1 コンポーネント

| コンポーネント | 用途 |
| --- | --- |
| langfuse | Web UI + トレース表示（3010） |
| langfuse-worker | 非同期イベント処理 |
| langfuse-postgres | メタデータ保存 |
| langfuse-clickhouse | イベント/トレースデータ保存 |
| langfuse-minio | S3 添付/メディア保存 |
| langfuse-redis | キュー |

LiteLLM は `success_callback: ["langfuse"]` で自動報告します（`.env` の `LANGFUSE_*`）。

## 23.2 トレースの閲覧

1. Langfuse にログイン → 組織 `AI All In One` / プロジェクト `AI Platform` を選択；

2. Traces リストで各呼び出しを確認し、クリックしてプロンプト/レスポンス/モデル/遅延/token/コストを表示；

3. Session で複数ターンの対話を関連付け。

## 23.3 トラブルシュート

> ⚠️ 重要な落とし穴：
> - `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web と worker の両方）を設定する必要があります。しないと旧 SDK の報告 `trace-create` が失敗しデータが見えません；
> - SSO ログインでデータが見えない：SSO アカウント（AD メール）と初期化アカウントが異なるため、Langfuse がどの組織にも属さないアカウントを自動新規作成します。修正（SSO ユーザーを組織に追加）：

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<会社ドメイン>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 公式ドキュメント：Langfuse 公式ドキュメント https://langfuse.com/docs · セルフホスト https://langfuse.com/self-hosting

---

[← 第22章：監視・アラート管理](ch22-ops-monitoring.md) · [📖 目次](index.md) · [第24章：統合ログ（Loki） →](ch24-ops-loki.md)
