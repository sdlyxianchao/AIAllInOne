# 第29章：トラブルシューティングマニュアル

*第三部 · 運用編*

> 症状別クイックリファレンスで、根本原因を素早く特定します。

[← 第28章：ヘルスチェックと起動時セルフチェック](ch28-healthcheck.md) · [📖 目次](index.md) · [第付章：公式ドキュメント索引 →](ch30-appendix.md)

---

## 29.1 共通トラブルシュート 3 ステップ

1. **コンテナ状態の確認**：`docker ps -a` で Exited/Restarting を探す；

2. **ログの確認**：`docker logs <コンテナ名> --tail 30`；

3. **ヘルスチェックの実行**：`health-check.ps1` を実行して失敗ステージを特定。

## 29.2 症状クイックリファレンス表

| 症状 | 根本原因 | 解決策 |
| --- | --- | --- |
| localhost でどの製品も開けない | WSL2 IPv6 `::1` 互換性問題 | イントラネット IP または 127.0.0.1 に変更 |
| Ghost がずっと Restarting、ECONNREFUSED :3306 エラー | ボリューム内に MySQL 設定が残留 | 環境変数で SQLite を強制（第 4 章） |
| Dify 4 コンテナが起動直後にクラッシュ ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | 50 に変更（第 5 章） |
| NewAPI チャネルテストで No connected db | チャネルキーにサンプル値を入力 | `LITELLM_MASTER_KEY` の実際の値を入力 |
| NewAPI OIDC が invalid_grant / Incorrect redirect_uri | サーバーアドレスが localhost | イントラネットアドレスに設定（第 7 章） |
| NewAPI ログイン 429 | 重要インターフェースのレート制限 | redis rateLimit:* を削除するか .env を変更 |
| Dify アプリ作成で ws://localhost に何度も接続 | WebSocket アドレス未変更 | NEXT_PUBLIC_SOCKET_URL をイントラネット IP に設定 |
| Dify でログインが反応しない | パスワードは base64 必要 / 未ログイン 401 は正常 | スクリプトで先に base64、ブラウザは再試行 |
| Gitea が readonly database エラー | gitea.db が root 所有 | root 所有の db を削除して再構築 |
| Gitea リポジトリリンクが localhost | ROOT_URL 未変更 | イントラネットアドレスに設定 |
| SSO ログインで unknown_error | AD ポート転送失効（iphlpsvc） | iphlpsvc + Hyper-V ネットワークを確認 |
| Keycloak でドメインユーザーが見えない | Search scope = One Level | Subtree に変更 |
| Langfuse でデータが見えない | V4_WRITE_MODE または SSO アカウントが組織未所属 | dual に設定。SQL で組織に追加（第 23 章） |
| DeepChat モデル接続タイムアウト | クライアントが停止したシステムプロキシ経由 | プロキシ不使用/直接接続に設定 |
| Loki でログが見つからない | job ラベルを使用 | `{container=~".+"}` を使用 |
| Presidio 404 /analyze/analyze | エンドポイントにパス付き | base URL のみ記入 |
| server.js 変更後の新インターフェースが 404 | up -d は volume 変更を再読み込みしない | docker restart admin-portal |

## 29.3 よく使うコマンド

```
docker ps -a                                        # 全コンテナの状態
docker logs <コンテナ> --tail 50                     # ログ確認
docker compose up -d <サービス>                      # あるサービスを再構築
docker compose restart <サービス>                    # あるサービスを再起動（.env 再読み込みなし）
docker system df                                     # Docker ディスク使用量
C:\AIAllInOne\windows\scripts\health-check.ps1       # ワンクリック検査
```

---

[← 第28章：ヘルスチェックと起動時セルフチェック](ch28-healthcheck.md) · [📖 目次](index.md) · [第付章：公式ドキュメント索引 →](ch30-appendix.md)
