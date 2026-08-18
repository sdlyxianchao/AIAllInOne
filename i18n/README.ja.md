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

#### 🤖 AI デプロイ — ワンクリック、AI エージェントが主導

> デプロイガイド（第 0 章）からの引用：ガイドは**手動で章ごとに実行**することも、**AI エージェント**（WorkBuddy / OpenClaw / Microsoft Scout）に最初から最後まで一任することもできます。このディレクトリ（ガイド、`windows-checklist.html`、`docker-compose.yml`、`.env.example`、`scripts/`）をエージェントに渡し、下のプロンプトを貼り付けると、エージェントは：プラットフォームを判別 → パラメータを 1 つずつ収集 → ローカル進捗ファイルを作成 → ガイドに従って段階的に設定 → 失敗時はテスト・デバッグ・再試行 → 進捗を随時更新 → エンドツーエンドの完全検証を実行して結果を報告します。

**エージェントにコピーするプロンプト**（Windows プラットフォーム、日本語 — エージェントが順に案内します）：

````text
あなたは企業イントラネット AI プラットフォームのデプロイエンジニアです。このディレクトリ内のデプロイガイド「windows-deploy-guide-v2.html」、進捗チェックリスト windows-checklist.html、docker-compose.yml、.env.example に基づき、この Windows マシン上で「AI AllInOne」プラットフォームを完全にデプロイし、検証してください。全体を通して日本語で私とコミュニケーションしてください。

## ステップ1：必要パラメータを収集（1つずつ質問してください。スキップや推測はしないでください）
開始前に私から収集すること：1) 外部公開するイントラネット IP；2) Skill マーケットのホスト名（ドメイン — mcp-gateway/skills/skill-market/config.json と SKILL.md の <market-hostname> を置き換えるために使用し、hosts/DNS で解決）；3) アイデンティティソース（AD ドメインコントローラに接続する場合はドメイン/DC IP/LDAP base DN/bind DN/bind パスワード/sAMAccountName、または他の IdP の設定、接続しない場合は確認）；4) 統合管理者アカウントとパスワード；5) LLM API キー（DeepSeek/OpenAI/Claude など）；6) 必要に応じてアラート webhook、HTTPS、バックアップ保持ポリシーを質問。

## ステップ2：ローカル進捗ファイルを作成
windows-checklist.html の内容に基づき、このディレクトリに「deployment-progress-<date>.md」を生成し、すべての項目を未完了（- [ ]）としてコピーします。各項目を完了するか、各問題を解決するたびに更新し、簡単に報告してください。

## ステップ3：デプロイガイドに従って段階的に設定
windows-deploy-guide-v2.html を熟読してください——これが今回のデプロイ唯一の権威あるガイドです。第 1〜13 章を厳密に順番どおり実行し（windows-checklist.html や古いドキュメントで代替しないこと）、各章の「⚠️ 重要な落とし穴」に特に注意してください。scripts/ 以下の自動化スクリプト（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 など）を優先し、自動化できるものは UI を手動クリックしないでください。Ghost ポータル（6.5 章）は必須事項：①同梱の Corp Portal テーマをデプロイし、scripts\ghost-theme-setup.ps1 を実行して自動インストール・有効化すること。公式デフォルトテーマのままにしないこと；②サンプルコンテンツをインポート：まずポータルと各製品の対外公開アドレス（イントラネット IP またはドメイン、例：192.168.1.10 または portal.company.com）を私に質問——それを使って seed 内の <server-IP> プレースホルダを置き換える（記事本文の NewAPI / MCP / Dify 等のアクセス URL も一括置き換え。host.docker.internal のようなコンテナ内固定アドレスは変更しないこと）；次にポータルのサンプルコンテンツをどの言語にするか質問——中国語なら scripts\ghost-content-import.ps1 -ServerAddr "公開アドレス" を直接実行；他の言語なら、まず ghost-content-seed/content.json の title / html / plaintext / custom_excerpt フィールドを対象言語に翻訳し（<server-IP> プレースホルダと全 URL 構造は変更しない）、その後インポートする。

## ステップ4：反復テストで解決
エラー時はまずログ（docker logs、ヘルスエンドポイント、設定）を確認して根本原因を特定してから修正し、無闇に再試行しないこと。管理者権限や私の手動確認が必要なときは、「何を・なぜ」を明確に伝えること。解決後は進捗ファイルに書き戻し、簡単に報告してください。

## ステップ5：完全なエンドツーエンド検証
すべて完了したら、エンドツーエンドテストを実行：全コンテナ Up、Keycloak SSO ログイン、NewAPI/LiteLLM 経由の実会話で PII マスキング検証、アイデンティティソースログイン、監視/ログ/アラート、バックアップ/復元。最後に各項目を ✅/❌ でまとめ、失敗項目には根本原因と提案を記載すること。
````

> 💡 エージェントを**使わない場合**でも、このプロンプトはデプロイ前のチェックリストとして使えます — 開始前に準備すべき全パラメータが列挙されています。

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

## 🤖 AI エージェント運用

本プラットフォームは、**AI エージェントによる運用・保守**を前提に設計されています — WorkBuddy、OpenClaw、Microsoft Scout、または同等のツールです。多数の管理コンソールをクリックして回る代わりに、エージェントに自然言語でやりたいことを伝えるだけで、エージェントがファイルを読み、コマンドを実行し、サービスと通信してくれます。

プラットフォームを動かしているものはすべて、お使いのマシン上の**コード・設定・データ**として存在します — Docker Compose サービス、`.env` ファイル、管理 API、実際の状態を保持する DB/ファイル — つまりエージェントはそのすべてを閲覧・変更できます：

| 任务 | Agent 的做法 |
|---|---|
| ヘルスチェック / 状態の概要 | `docker ps` + ヘルスエンドポイント + 管理 API |
| サービスの起動 / 再起動 / 停止 | `docker compose up -d <svc>` / `docker restart <svc>` |
| ログとエラーの確認 | `docker logs <svc> --tail N` + ログファイル |
| 設定の変更 | 設定ファイルを編集し、対象コンテナを再起動 |
| AI 管理センターの編集 | `admin-portal/public/index.html`（UI）または `admin-portal/server.js`（API）を編集して再起動 |
| Gitea と同期の管理 | Gitea API：ワークフロー起動、実行状態/ログ参照、リポジトリファイル編集 |
| Ghost ポータルの管理 | Ghost の SQLite DB を読み書き、テーマ編集、コンテンツシードをインポート |
| バックアップと復元 | `scripts/backup.ps1` / `scripts/restore.ps1` |
| リリースの公開 | `publish.ps1`（ビルド + コミット + GitHub へプッシュ） |
| トラブルシューティング | ポート競合、Docker Desktop の問題、DNS/プロキシなど |

例：*「すべてのサービスが稼働し健全か確認して」* — エージェントが `docker ps` を実行し、各ヘルスエンドポイントを確認して、何がどう悪いかを報告します。完成済みプロンプト・ベストプラクティス・コマンドリファレンスは **[AI エージェント運用ガイド](../AI-AGENT-OPS.md)**（9 言語）をご覧ください。

### 🛡️ AI 運用 — ワンコマンドのヘルスチェックと自動起動

> デプロイガイド（第 12 章）からの引用：本プラットフォームには、**1 コマンドのヘルスチェック**（`health-check.ps1`）が同梱されており、**41 コンテナを 9 段階**で検証します — LLM フルチェーン、AD 認証 + 管理者ログイン、MCP/Skill 機能、ディスク容量を含みます。認証情報は `.env` から読み取り、パスワードはハードコードされていません。AI エージェントに実行させるだけで OK です（例：*「ヘルスチェックを実行して、何が失敗しているか教えて」*）。また、ログオンごとに自動実行させることもできます：

| 段階 | チェック項目 | 方法 |
|---|---|---|
| Stage 1 | Docker デーモンが起動しているか（起動自検に備え準備完了まで待機） | `docker info` |
| Stage 2 | 41 コンテナの状態（Up/Exited/Restarting） | `docker ps -a` |
| Stage 3 | 10 個の HTTP エンドポイントの応答（MCP Gateway 含む） | `curl.exe 127.0.0.1:ポート` |
| Stage 4 | LiteLLM /readiness + **モデル登録**、litellm-redis PING、Dify API /health、MySQL/PostgreSQL/Redis/Sandbox の健全性 | `docker exec` + `docker inspect` |
| Stage 5 | **LLM フルチェーン**：NewAPI チャネル状態 + DeepChat と Dify 名義で各1件の実リクエスト（NewAPI → LiteLLM → DeepSeek） | `curl /v1/chat/completions` |
| Stage 6 | **AD 認証チェーン**：Keycloak well-known + AD ユーザー同期（aitest1）+ NewAPI OIDC 設定 + OIDC クライアント整合性 + **NewAPI 管理者ログイン** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill**：/health + tools/list + tools/call + 外部 Skill 集約 | curl（MCP プロトコル） |
| Stage 8 | **DeepChat / Dify ログイン前提条件**：NewAPI 利用可 + Dify 初期化済み | curl + psql |
| Stage 9 | **ディスク容量**：システムディスク残量 + Docker 使用量 | `Get-PSDrive` + `docker system df` |

**手動実行**（PowerShell）：

```powershell
C:\AIAllInOne\windows\scripts\health-check.ps1
# 结果输出到 C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log
# 输出末尾显示 ALL CLEAR 且 Fail: 0 表示全部正常
```

**ログオン時に自動実行**（タスクスケジューラ — PowerShell を管理者として実行）：

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```
