# 第24章：統合ログ（Loki）

*第二部 · 管理編（各製品の日常運用）*

> 全コンテナログを集約し、コンテナ + キーワード + 時間で検索します。

[← 第23章：LLM 可観測性（Langfuse）](ch23-ops-langfuse.md) · [📖 目次](index.md) · [第25章：PII マスキング（Presidio） →](ch25-ops-pii.md)

---

**入口**：AI 管理センター「📜 統合ログ」ページ（最も便利）、または Loki `http://<サーバーIP>:3110`。

## 24.1 コンポーネント

| コンポーネント | ポート | 用途 |
| --- | --- | --- |
| Loki | 3110 | ログ保存と照会（単一マシン、ローカルファイルシステム） |
| Promtail | —（内部） | docker.sock 経由でコンテナを検出し、json ログを収集して Loki に送信 |

## 24.2 ログ照会

1. AI 管理センター → 統合ログ；

2. コンテナ選択（ドロップダウン）→ キーワード入力 → 時間範囲選択 → 照会；

3. バックエンド `/api/logs/query` が LogQL で Loki を照会。

## 24.3 LogQL クイックリファレンス

```
{container="new-api"} |= "error"              # あるコンテナの error を含む行
{container=~".+"} |~ "(?i)error|exception"      # 全コンテナでマッチ
{service="litellm"} |= "EMAIL"                  # サービス別で照会
```

> 📌 Loki の label は `container / project / service` で、**`job` はありません**。照会は `{container=~".+"}` を使い、`{job="docker"}` は使いません。

> ⚠️ 重要な落とし穴（Docker Desktop のマウント）：Promtail は `/var/run/docker.sock` と `/var/lib/docker/containers` をマウントする必要があります（WSL2 下では Docker Desktop VM 内部を指し、ログのある場所です）。ホストマシン Windows の `C:\...\containers` パスは使わないでください。Loki 単一マシンは `store: tsdb` + filesystem を使います。

> 📖 公式ドキュメント：Loki 公式ドキュメント https://grafana.com/docs/loki/latest/

---

[← 第23章：LLM 可観測性（Langfuse）](ch23-ops-langfuse.md) · [📖 目次](index.md) · [第25章：PII マスキング（Presidio） →](ch25-ops-pii.md)
