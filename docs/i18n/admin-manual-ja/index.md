# AI AllInOne 管理者マニュアル

*v0.2 · デプロイ · 管理 · 運用*

本マニュアルは3つのパートに分かれています：**導入編**（第1～13章、ゼロからプラットフォームを構築）、**管理編**（第14～26章、13製品の日常運用）、**運用編**（第27～29章、バックアップ／ヘルスチェック／トラブルシューティング）、および**付録**（ベンダー公式ドキュメントへのリンク）。各章のページ下部に前へ／次へのナビゲーションがあります。順に読んでも、必要な章へ直接ジャンプしても構いません。

## 第一部 · デプロイ編

| # | 章 | 説明 |
| --- | --- | --- |
| 1 | [プラットフォーム概要とアーキテクチャ](ch01-overview.md) | このプラットフォームの構成・ポート・データフローを理解することは、以降すべてのデプロイ・管理作業の前提です。 |
| 2 | [事前準備](ch02-prereq.md) | Docker Desktop のインストール、ディレクトリ準備、ネットワーク疎通、IP 固定——デプロイ前に必ず行うこと。 |
| 3 | [設定ファイルと環境変数](ch03-env.md) | 3 つのコア設定ファイル + 全環境変数の説明。どれを今設定し、どれを後で設定するか。 |
| 4 | [コアサービスの起動](ch04-start.md) | .env のコピー、コンテナ起動、サービスごとのアクセス確認、Ghost の SQLite 既知問題の対処。 |
| 5 | [Dify の独立デプロイ](ch05-dify-deploy.md) | Dify は公式 compose（約 15 コンテナ）で独立デプロイし、ポート競合を回避します。 |
| 6 | [Keycloak：Realm・ユーザー・AD](ch06-keycloak.md) | Realm の作成、ローカルアカウントの作成、または Active Directory からのドメインアカウント取り込み——全製品 SSO の基盤。 |
| 7 | [NewAPI：初期化・チャネル・OIDC](ch07-newapi.md) | 初期インストールウィザードの完了、LiteLLM を指すチャネルの設定、API Key の発行、Keycloak OIDC への接続。 |
| 8 | [LiteLLM：検証とキャッシュ](ch08-litellm.md) | LiteLLM プロキシが利用可能であることを検証し、レスポンスキャッシュを有効にして token を節約します。 |
| 9 | [Dify / Ghost / Gitea の設定](ch09-products.md) | 3 製品それぞれの初期化と相互接続の設定。 |
| 10 | [DeepChat の配布と CI/CD](ch10-deepchat.md) | DeepChat インストーラの従業員への配布と、Gitea Actions による公式新バージョンの自動同期。 |
| 11 | [MCP Gateway とスキルマーケット](ch11-mcp.md) | スキルと MCP ツールを集中管理するゲートウェイ。DeepChat/Dify は 1 つのアドレスに接続するだけで全ツールを取得できます。 |
| 12 | [AI 管理センター](ch12-admin-center.md) | 統合管理者ポータル：Keycloak 認証、左メニューに全製品を埋め込み、Dashboard のクラスタ状態表示。 |
| 13 | [相互接続検証チェックリスト](ch13-interconnect.md) | デプロイ完了後、12 本の相互接続経路を項目ごとにすべて疎通確認します。 |

## 第二部 · 管理編（各製品の日常運用）

| # | 章 | 説明 |
| --- | --- | --- |
| 14 | [Keycloak の日常管理](ch14-ops-keycloak.md) | 認証中枢：ユーザー、ロール、OIDC クライアント、AD フェデレーション、セッションの管理。 |
| 15 | [NewAPI の日常管理](ch15-ops-newapi.md) | LLM ゲートウェイ：チャネル、トークン、クォータ、ユーザー、ログ、コストの管理。 |
| 16 | [LiteLLM の日常管理](ch16-ops-litellm.md) | PII マスキングプロキシ：モデルリスト、マスキングルール、キャッシュ、Langfuse 報告。 |
| 17 | [Dify の日常管理](ch17-ops-dify.md) | AI アプリケーションプラットフォーム：アプリ、ナレッジベース、モデルプロバイダー、メンバー権限、公開。 |
| 18 | [Ghost の日常管理](ch18-ops-ghost.md) | 企業ポータル / Hub：記事、ページ、ナビゲーション、テーマ、メンバー。 |
| 19 | [Gitea の日常管理](ch19-ops-gitea.md) | 社内 Git + CI/CD：リポジトリ、組織、Runner、Actions。 |
| 20 | [MCP Gateway の日常管理](ch20-ops-mcp.md) | MCP Server の増減、スキルのアップロード/削除、組み込みツールの拡張。 |
| 21 | [更新サーバーの管理](ch21-ops-update.md) | DeepChat インストーラのホスティングと自動更新。 |
| 22 | [監視・アラート管理](ch22-ops-monitoring.md) | Prometheus + Grafana + Alertmanager：コンテナリソース監視とアラート通知。 |
| 23 | [LLM 可観測性（Langfuse）](ch23-ops-langfuse.md) | 各モデル呼び出しのプロンプト、レスポンス、遅延、token、コストを追跡します。 |
| 24 | [統合ログ（Loki）](ch24-ops-loki.md) | 全コンテナログを集約し、コンテナ + キーワード + 時間で検索します。 |
| 25 | [PII マスキング（Presidio）](ch25-ops-pii.md) | 機密情報はイントラネット外へ出る前に自動でマスキングされます。 |
| 26 | [MailHog メール受信](ch26-ops-mailhog.md) | イントラネットに SMTP がない場合の「メール出口」。Ghost の認証コード/通知メールを受け取ります。 |

## 第三部 · 運用編

| # | 章 | 説明 |
| --- | --- | --- |
| 27 | [バックアップと復元](ch27-backup.md) | 全データの毎日バックアップ、ワンクリック復元。 |
| 28 | [ヘルスチェックと起動時セルフチェック](ch28-healthcheck.md) | ワンクリックで全 41 コンテナ + LLM 全経路 + 認証経路を検査します。 |
| 29 | [トラブルシューティングマニュアル](ch29-troubleshooting.md) | 症状別クイックリファレンスで、根本原因を素早く特定します。 |

## 付録

| # | 章 | 説明 |
| --- | --- | --- |
| 付録 | [公式ドキュメント索引](ch30-appendix.md) | すべてのサードパーティ製品の公式ドキュメントアドレス（プレーンテキスト URL。印刷後も参照できます）。 |

---

> 🌐 他の言語：[English](../../admin-manual/index.md) · [简体中文](../admin-manual-zh-cn/index.md) · [繁體中文](../admin-manual-zh-TW/index.md) · [Français](../admin-manual-fr/index.md) · [Español](../admin-manual-es/index.md) · [Português](../admin-manual-pt/index.md) · 日本語 · [한국어](../admin-manual-ko/index.md) · [العربية](../admin-manual-ar/index.md)
