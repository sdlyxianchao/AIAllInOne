# AI AllInOne — オープンソース・セルフホストの企業向け AI プラットフォーム

> 📖 **言語**：[English](../README.md) · [简体中文](README.zh.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt.md) · **日本語** · [한국어](README.ko.md) · [العربية](README.ar.md)

[![GitHub stars](https://img.shields.io/github/stars/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/network)
[![GitHub license](https://img.shields.io/github/license/sdlyxianchao/AIAllInOne?style=flat-square)](../LICENSE)
[![GitHub tag](https://img.shields.io/github/v/tag/sdlyxianchao/AIAllInOne?style=flat-square)](https://github.com/sdlyxianchao/AIAllInOne/tags)
![Self-hosted](https://img.shields.io/badge/self--hosted-Yes-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../CONTRIBUTING.md)

> **1 台のサーバー。1 つのアカウント。エンタープライズ向け AI オールインワン——オープンソースで無料、データはイントラネットの外に出ません。**

AI AllInOne は、**オープンソースで無料**、すぐに使える企業イントラネット向け AI プラットフォームです。統合 SSO、LLM ルーティング、AI アプリ、企業ポータル、ソースコード/CI、統合管理、監視・アラート、可観測性、ログ、バックアップと復元——すべて Docker で 1 つにオーケストレーションされています。**従業員は 1 つのアカウントで一度ログインするだけで、すべての AI ツールを利用できます。**

![AI 管理センター](<../pics/AI Admin.png>)

![企業ポータル](<../pics/AI All In One Hub.png>)

---

## ✨ AI AllInOne を選ぶ理由

| | |
|---|---|
| 🧩 **オールインワン、組み立て不要** | 8+ のオープンソースコンポーネントをプリインテグレーション：認証、ゲートウェイ、アプリ、ポータル、Git、監視、ログ、バックアップ。自分で「組み立てる」必要はありません。 |
| 🔐 **統合 SSO** | 1 つの Keycloak アカウント（AD/LDAP フェデレーション対応）ですべての製品に自動ログイン、パスワード入力不要。 |
| 🔒 **データはイントラネットの外に出ない** | 完全セルフホスト——モデル呼び出し、プロンプト、ドキュメント、ユーザーデータはすべて社内に留まります。 |
| ⚡ **約 30 分でデプロイ完了** | `docker compose` + 自動化スクリプト、または AI Agent に環境一式のデプロイを任せることもできます。 |
| 🛡️ **PII 匿名化** | 電話番号 / 身分証番号 / メールアドレスなどの機密情報を、外部大規模モデルへの呼び出し前に自動で匿名化します（Presidio）。 |
| 📊 **全チェーンの可観測性** | Prometheus + Grafana による監視、Langfuse による LLM トレーシング、Loki による統合ログ、企業 IM アラート（钉钉/企微/飞书）。 |
| 💾 **バックアップと復元** | 管理コンソールからワンクリックで毎日のフルバックアップとワンクリック復元が可能。 |
| 🌐 **9 言語対応** | マニュアルと管理画面の多言語対応（简中 / 繁中 / 英語 / フランス語 / スペイン語 / ポルトガル語 / 日本語 / 韓国語 / アラビア語）。 |

## 📦 コンポーネント一覧

| レイヤー | コンポーネント | 用途 |
|---|---|---|
| 認証 | Keycloak | SSO / OIDC、AD/LDAP フェデレーションまたはローカルアカウント |
| LLM ルーティング | NewAPI | チャネル、キー、割り当て、監査、コスト |
| PII 匿名化 | LiteLLM + Presidio | モデル呼び出し前に機密情報を自動匿名化 |
| AI アプリ | Dify | ビジュアル AI アプリ / Agent プラットフォーム + 統合ナレッジベース（RAG） |
| 企業ポータル | Ghost | 社内のお知らせとニュースのポータル（カスタム Corp Portal テーマ内蔵） |
| ソースコード / CI | Gitea + Runner | 社内 Git + Actions 自動化 |
| クライアント | DeepChat | ローカル AI デスクトップクライアント（Windows / macOS / Linux） |
| クライアント配布 | Update Server | DeepChat インストーラーのホスティングと自動更新 |
| 統合管理 | AI Admin Center | 統合エントリ：ダッシュボード + 埋め込み製品 + 監査/コスト/レポート + 階層別管理者権限 + Keycloak 同期/ロール |
| ゲートウェイ | MCP Gateway | スキル / MCP マーケット + Dify ナレッジ検索（RAG） |
| 監視 | Prometheus + Grafana + Alertmanager | コンテナリソース監視 + アラート通知 |
| LLM 可観測性 | Langfuse | モデル呼び出しごとのレイテンシ、token、コストを追跡 |
| 統合ログ | Loki + Promtail | 全コンテナログを集約し、コンテナ/キーワード/時刻で検索可能 |
| バックアップと復元 | スクリプト + 管理ページ | 毎日のフルバックアップ + ワンクリック復元 |

### アーキテクチャとデータフロー

![アーキテクチャ概要](<../pics/Architecture.png>)

![データフロー](<../pics/DataFlow.png>)

---

## 🚀 クイックスタート

**前提条件**：Docker がインストールされたマシン（Windows 11 + Docker Desktop、または Linux）と、Docker イメージレジストリへのアクセスが必要です。

```bash
git clone https://github.com/sdlyxianchao/AIAllInOne AIAllInOne
cd AIAllInOne/windows
# コアサービスを起動し、その後デプロイガイドに従って認証 / LLM チャネル / 各製品を初期化
docker compose up -d
```

次に、2 つの方法があります：

1. **自動デプロイ（推奨）**——デプロイを AI Agent（WorkBuddy / OpenClaw / Microsoft Scout）に任せます。デプロイドキュメントと設定を読み取り、パラメータ（サーバー IP、アイデンティティプロバイダ、管理者アカウント、LLM キー）をあなたから収集し、ステップごとにすべての設定を完了します。[ワンクリックデプロイ用プロンプトを確認 →](../windows/windows-deploy-guide-v2.md)

<details>
<summary>📋 ワンクリックデプロイ用プロンプト（クリックで展開）</summary>

````text
あなたは企業イントラネット向け AI プラットフォームのデプロイエンジニアです。本プロジェクトのドキュメントと設定ファイルに基づき、現在のマシンに「AI AllInOne」プラットフォームを完全にデプロイし、検証してください。やり取りはすべて日本語で行い、以下の手順に厳密に従って実行してください。

## ステップ 1：デプロイディレクトリと対象プラットフォームを確認
1. まず私に尋ねる：本プロジェクトのローカルの解凍/クローン先パスはどこか？（例：C:\AIAllInOne または /opt/AIAllInOne）
2. そのディレクトリに入ったら、現在のマシンの OS に基づいて対象プラットフォームのディレクトリを決定する：
   - Windows → windows-github（または windows）ディレクトリを使用
   - Linux / macOS → linux-github（または linux）ディレクトリを使用
   - オンラインサーバー / 純 Docker 環境 → docker-github（または docker）ディレクトリを使用
   不明な場合は、検出した OS を私に伝え、どのディレクトリを使うか私と確認する。
3. 着手する前に、ルートの README.md とそのプラットフォームディレクトリ内の README を読み、アーキテクチャとデプロイ方法を理解する。

## ステップ 2：必要なパラメータを 1 つずつ収集（個別に私に尋ね、スキップや推測をしない）
1. プラットフォームが外部に公開するイントラネット IP（またはドメイン）。つまり他のマシンがアクセスするアドレス（例：192.168.1.100 または portal.company.com）。
2. アイデンティティプロバイダ（Identity Provider）：
   - 会社の AD ドメインコントローラー：ドメイン名、DC IP、LDAP base DN、bind DN、bind アカウントのパスワード、sAMAccountName などを私に尋ねる。
   - その他の IdP（LDAP/OpenLDAP/OIDC/飞书/企微/钉钉など）：対応する設定とアカウント情報を私に尋ねる。
   - 外部アイデンティティプロバイダなし（ローカルアカウントのみ）：私と確認したうえでスキップする。
3. 統合管理者アカウント：ユーザー名、パスワード、メールアドレス（Keycloak SSO と各製品の管理者ログインに使用）。
4. LLM API キー：実際にどのモデルプロバイダとキーがあるか（DeepSeek / OpenAI / Claude / Qwen / 通义 / ERNIE など）；ないものはスキップ。
5. Ghost ポータルのサンプルコンテンツの言語：日本語、または他の言語に翻訳してからインポート。
6. その他必要に応じて尋ねる：MCP スキルマーケットのホスト名（Windows）、アラート通知チャネル（钉钉/企微/飞书 webhook）、HTTPS 証明書、バックアップ保持ポリシーなど。

## ステップ 3：ローカル進捗ファイルを生成
1. プラットフォームディレクトリ内の「進捗チェックリスト」ドキュメント（*-checklist*.html）と「アイデンティティプロバイダ連携ガイド」（*-ad-integration*.html や IdP 関連ドキュメントなど）を探す。
2. チェックリストの内容に基づき、プロジェクトディレクトリに進捗ファイルを生成し、"deployment-progress-<platform>-<date>.md" のような名前を付け、各チェックリスト項目を未完了（- [ ]）としてコピーする。
3. 以降、1 項目完了するごと、または 1 つの問題を解決するごとに、その進捗ファイルをすぐに更新し、会話の中で私に進捗を簡潔に報告する。

## ステップ 4：デプロイガイドに従って順に設定
1. プラットフォームの「デプロイガイド」ドキュメント（*-deploy-guide*.html など）をよく読み、厳密に従う。特に「⚠️ 重要な落とし穴」と注記された箇所に注意する。
2. おおよその順序：環境変数の準備 → コンテナの起動 → 認証/IdP の初期化 → LLM ルーティングとモデルチャネルの設定 → 各製品の初期化（Ghost ポータル：内蔵の Corp Portal テーマをデプロイしサンプルコンテンツをインポート）→ 監視/可観測性/ログ/匿名化の設定 → バックアップと復元の設定。
3. ディレクトリ内の自動化スクリプト（bootstrap.ps1、keycloak-realm-init.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、health-check.ps1 など）を優先的に使用し、スクリプト化できる手順は UI を手動で操作しない。

## ステップ 5：私と一緒に反復テストを行い問題を解決
1. ある手順が失敗した、または期待どおりでない場合、まずログ（docker logs、各サービスのヘルスエンドポイント、設定ファイル）を確認して根本原因を特定してから修正し、やみくもにリトライしない。
2. 私の参加が必要な場合（例：管理者権限が必要なコマンドの実行、ログイン確認、情報の補足）、「何をするのか、なぜか」を明確に私に伝える。
3. 解決後は根本原因と修正内容を進捗ファイルに記録し、私に簡潔に報告する。

## ステップ 6：完全なエンドツーエンド検証
すべてのチェックリスト項目が完了したら、完全なエンドツーエンドテストを 1 回行い、少なくとも以下をカバーする：
- サービスの健全性（すべてのコンテナが Up、ヘルスエンドポイントが正常）；
- SSO 統合ログイン（Keycloak へのログイン → 各製品の SSO/自動ログイン）；
- LLM 経路（NewAPI/LiteLLM 経由で実際の会話を 1 回送信し、応答と PII 匿名化が機能することを検証）；
- アイデンティティプロバイダでのログイン（AD/他の IdP を連携済みの場合は、対応するアカウントでログインをテスト）；
- 監視/可観測性/ログ/アラート（データが入っていること、アラートが発火できることを確認）；
- バックアップと復元（バックアップを 1 回実行し、復元できることを検証）。

最後にテスト結果を項目ごとにまとめ、✅ 合格 / ❌ 失敗を明確に記載する；失敗項目には根本原因と今後の提案を記載する。
````

</details>

2. **手動デプロイ**——[Windows デプロイガイド](../windows/windows-deploy-guide-v2.md) に従って順に操作します（`windows-checklist.html` 進捗チェックリストと併用）。

> **プラットフォームの状態**：Windows（Windows 11 + Docker Desktop）は**実測中**です。Linux/macOS（`linux/`）とオンラインサーバー（`docker/`）は計画中です——[ロードマップ](#roadmap)をご覧ください。

## 🖼️ 画面スクリーンショット

**Dify** — AI アプリプラットフォーム · **MCP/Skill マーケット** — ツールとスキルをワンクリックで接続 · **DeepChat** — デスクトップ AI クライアント

![Dify](<../pics/Dify.png>) ![MCP/SKILL マーケット](<../pics/Market.png>) ![DeepChat](<../pics/DeepChat.png>)

さらに多くのスクリーンショット（実際の画面 48 枚）は[管理者マニュアル](../docs/admin-manual/index.md)に埋め込まれています。

## 📚 マニュアル（オンライン、9 言語）

| マニュアル | 言語 |
|---|---|
| **管理者マニュアル** | [English](../docs/admin-manual/index.md) · [简体中文](../docs/i18n/admin-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/admin-manual-zh-TW/index.md) · [Français](../docs/i18n/admin-manual-fr/index.md) · [Español](../docs/i18n/admin-manual-es/index.md) · [Português](../docs/i18n/admin-manual-pt/index.md) · [日本語](../docs/i18n/admin-manual-ja/index.md) · [한국어](../docs/i18n/admin-manual-ko/index.md) · [العربية](../docs/i18n/admin-manual-ar/index.md) |
| **ユーザーマニュアル** | [English](../docs/user-manual/index.md) · [简体中文](../docs/i18n/user-manual-zh-cn/index.md) · [繁體中文](../docs/i18n/user-manual-zh-TW/index.md) · [Français](../docs/i18n/user-manual-fr/index.md) · [Español](../docs/i18n/user-manual-es/index.md) · [Português](../docs/i18n/user-manual-pt/index.md) · [日本語](../docs/i18n/user-manual-ja/index.md) · [한국어](../docs/i18n/user-manual-ko/index.md) · [العربية](../docs/i18n/user-manual-ar/index.md) |

日常の AI Agent 運用については **[AI Agent 運用ガイド](../AI-AGENT-OPS.md)** を参照してください。

## 👥 コミュニティ

> 微信グループ——交流、デプロイの疑問解消、フィードバック、**共創**のための場所です。QR コードをスキャンして友達に追加してください。グループに招待します。

<img src="../pics/wechat.png" alt="微信グループのQRコード" width="200" />

また、[GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions)（または [Issue](https://github.com/sdlyxianchao/AIAllInOne/issues) を直接作成）もご利用いただけます。

## 🤝 コントリビュート

このプロジェクトは**オープンソースで無料**、コミュニティとともに成長しています。スキルのレベルに関係なく、あなたに合った方法があります：

- ⭐ **リポジトリにスターを付ける**——最も簡単で、最も価値のあるサポートです
- 🐛 **バグ報告 / 機能要望**——issue を立てて、再現手順を明確に記載してください
- 📝 **ドキュメントやチュートリアルを書く**——デプロイガイド、トラブルシューティングの経験、ベストプラクティス
- 🌐 **翻訳**——マニュアルはすでに 9 言語あります。改善や新規追加にご協力ください
- 🧪 **テストと共有**——一度デプロイして、何が使いやすいか、どこで躓いたかを教えてください
- 💻 **コードをコントリビュートする**——統合レイヤー（統合 SSO、管理ポータル、監視、バックアップ）が最も取り組みやすい箇所です

完全なガイドは [CONTRIBUTING.md](../CONTRIBUTING.md) を参照してください。公開されている[ロードマップ](#roadmap)で今後の計画をご覧いただけます。**すべてのコントリビューター（貢献者）は README のコントリビューターリストに記載されます。**

<h2 id="roadmap">🗺️ ロードマップ</h2>

- ✅ v0.9x — Windows プラットフォーム：オールインワン + AI 管理センター + 階層別管理者権限 + 企業 IM アラート + セマンティックキャッシュ（LiteLLM redis-semantic）
- 🚧 **Linux / macOS** — セルフホスト Linux サーバー対応（`linux/`）
- 🚧 **オンラインサーバー** — 純 Docker / クラウドでの本番デプロイ（`docker/`）
- 🚧 **共創者プログラム** — タスクボード、毎週の同期ミーティング、デプロイパートナー認定

## 🔒 セキュリティについて

- 本リポジトリには**実際のシークレット（キー）は一切含まれません**；実際の値は各実行環境の `.env` にのみ存在します（リポジトリには `.env.example` テンプレートのみをコミット）。
- デフォルトはイントラネット内の平文 HTTP；HTTPS の設定は各プラットフォームのデプロイガイドを参照してください。
- 各プラットフォームの落とし穴、ポート表、データフローは、対応する `*-deploy-guide*.html` ドキュメントを参照してください。

## 📄 ライセンス

[MIT](../LICENSE)——自由に使用、変更、再配布できます。統合された各コンポーネントはそれぞれのライセンスを保持します（デプロイガイドのライセンス審査セクションを参照）。
