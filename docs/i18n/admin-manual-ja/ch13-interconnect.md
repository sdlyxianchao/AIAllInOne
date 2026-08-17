# 第13章：相互接続検証チェックリスト

*第一部 · デプロイ編*

> デプロイ完了後、12 本の相互接続経路を項目ごとにすべて疎通確認します。

[← 第12章：AI 管理センター](ch12-admin-center.md) · [📖 目次](index.md) · [第14章：Keycloak の日常管理 →](ch14-ops-keycloak.md)

---

デプロイ編はここで終了です。最後に以下の 12 項目を順に検証し、すべて ✅ になればプラットフォームが本当に稼働していることを示します。

| # | 相互接続 | 検証方法 |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | NewAPI チャネルテストで OK を受信 |
| 2 | Dify → NewAPI | Dify モデルプロバイダーテストで応答を受信 |
| 3 | DeepChat → NewAPI | DeepChat でメッセージ送信し応答を受信 |
| 4 | Keycloak → NewAPI | Keycloak アカウントで OIDC ログイン NewAPI |
| 5 | Keycloak → Dify | Keycloak アカウントで SSO ログイン Dify |
| 6 | MCP Gateway → DeepChat | DeepChat が MCP ツールリストを取得し呼び出し |
| 7 | MCP Gateway → Dify | Dify ワークフローが MCP ツールを呼び出し |
| 8 | Gitea Runner → Docker | Runner が CI/CD タスクを実行可能 |
| 9 | Gitea → 更新サーバー | CI 成果物を更新サーバーにアップロード可能 |
| 10 | Ghost API → Gitea | Gitea Actions が Ghost API を呼び出してお知らせを発行可能 |
| 11 | Ghost → Dify 遷移 | ポータル「AI ワークベンチ」が正しく Dify へ遷移 |
| 12 | AI 管理センター | Dashboard に全コンテナが表示され、左メニューから全製品にアクセス可能 |

> ✅ すべて通過したら、第二部「管理編」で各製品の日常運用、第三部「運用編」のバックアップ、ヘルスチェック、トラブル対応を学習します。

---

[← 第12章：AI 管理センター](ch12-admin-center.md) · [📖 目次](index.md) · [第14章：Keycloak の日常管理 →](ch14-ops-keycloak.md)
