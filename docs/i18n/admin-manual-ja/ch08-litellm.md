# 第8章：LiteLLM：検証とキャッシュ

*第一部 · デプロイ編*

> LiteLLM プロキシが利用可能であることを検証し、レスポンスキャッシュを有効にして token を節約します。

[← 第7章：NewAPI：初期化・チャネル・OIDC](ch07-newapi.md) · [📖 目次](index.md) · [第9章：Dify / Ghost / Gitea の設定 →](ch09-products.md)

---

> ⚠️ PII マスキング（Presidio guardrail）は現在**一時的に無効**：新版 LiteLLM の guardrail 設定形式が変更され、`litellm-config.yaml` の該当部分はコメントアウトされています。現在 LiteLLM はプロキシ転送のみを行います（マスキングなし）。有効化方法は第 25 章参照。

## 8.1 LiteLLM の基本利用検証

```
curl -X POST http://<サーバーIP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` は LiteLLM 管理者キーで、`.env` の実際の値を取ります（プレースホルダそのままだと 401）。かつ、イントラネット IP `<サーバーIP>:4001` を使う必要があり、`127.0.0.1:4001` は使えません（WSL2 ポート転送の問題）。

## 8.2 レスポンスキャッシュ（組み込み済み、token 節約）

LiteLLM は Redis exact match キャッシュを有効にしています：完全に同一のリクエスト（モデル+メッセージ+パラメータ）はキャッシュを直接返し、ユーザー間で共有して token を節約します。

```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # 独立キャッシュ Redis
    port: 6379
    ttl: 3600            # キャッシュ 1 時間
```

> 検証：`curl http://<サーバーIP>:4001/cache/ping -H "Authorization: Bearer <KEY>"` が `ping_response: true` を返すこと。同じリクエストを連続 2 回行うと、2 回目の所要時間がミリ秒単位に短縮されます。キャッシュ無効化：`cache: false` にして litellm を再起動。

## 8.3 その他の LLM プロバイダーの追加

1. `.env` の `# OPENAI_API_KEY=` のコメントを解除して Key を記入；

2. `litellm-config.yaml` の対応する model ブロックのコメントを解除；

3. `docker compose up -d litellm`。

> 📖 公式ドキュメント：LiteLLM 公式ドキュメント https://docs.litellm.ai · Presidio guardrail https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← 第7章：NewAPI：初期化・チャネル・OIDC](ch07-newapi.md) · [📖 目次](index.md) · [第9章：Dify / Ghost / Gitea の設定 →](ch09-products.md)
