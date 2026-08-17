# 第16章：LiteLLM の日常管理

*第二部 · 管理編（各製品の日常運用）*

> PII マスキングプロキシ：モデルリスト、マスキングルール、キャッシュ、Langfuse 報告。

[← 第15章：NewAPI の日常管理](ch15-ops-newapi.md) · [📖 目次](index.md) · [第17章：Dify の日常管理 →](ch17-ops-dify.md)

---

**入口**：`http://<サーバーIP>:4001`（純粋な API で Web 画面なし。デバッグは `/v1/models`）。設定は `litellm-config.yaml`。

## 16.1 モデルリストの保守

`litellm-config.yaml` の `model_list` を編集し、モデルと対応する API Key を追加/削除します。新しい provider の追加手順：

1. `.env` の `# OPENAI_API_KEY=` のコメントを解除して Key を記入；

2. `litellm-config.yaml` の対応する model ブロックのコメントを解除；

3. `docker compose up -d litellm`。

## 16.2 レスポンスキャッシュ

Redis exact match キャッシュ。完全に同一のリクエストをユーザー間で共有。`cache_params.ttl`（デフォルト 3600 秒）を調整。無効化：`cache: false` にして再起動。

## 16.3 Langfuse 報告

`success_callback: ["langfuse"]` + `.env` の `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` により各呼び出しを自動報告します。

## 16.4 再起動とトラブルシュート

```
docker compose restart litellm          # 設定変更後の再起動
docker logs litellm --tail 50           # ログ確認
```

> ⚠️ 重要な落とし穴：① guardrails に `default_on: true` を追加しないとグローバルに有効になりません；② PII マスキング（Presidio）は現在上流 API 変更により一時コメントアウトされ、純粋なプロキシのみを行います；③ 安定版 `v1.95.1` を使用（`main-latest` にはバグあり）。

> 📖 公式ドキュメント：LiteLLM 公式ドキュメント https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第15章：NewAPI の日常管理](ch15-ops-newapi.md) · [📖 目次](index.md) · [第17章：Dify の日常管理 →](ch17-ops-dify.md)
