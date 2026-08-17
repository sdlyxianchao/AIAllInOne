# 第2章：事前準備

*第一部 · デプロイ編*

> Docker Desktop のインストール、ディレクトリ準備、ネットワーク疎通、IP 固定——デプロイ前に必ず行うこと。

[← 第1章：プラットフォーム概要とアーキテクチャ](ch01-overview.md) · [📖 目次](index.md) · [第3章：設定ファイルと環境変数 →](ch03-env.md)

---

## 2.0 2 つのデプロイ方法

本マニュアルは**手動で章ごとに実行**することも、**AI Agent ツールに自動実行させる**こともできます。Agent を使う場合は、本ディレクトリ（本マニュアル、`docker-compose.yml`、`.env.example`、`scripts/` を含む）を Agent に渡し、以下のプロンプトを貼り付けます。

> **Agent にコピーするデプロイプロンプト：**
> あなたは企業内網 AI プラットフォームのデプロイエンジニアです。本ディレクトリの『管理者マニュアル』デプロイ編、docker-compose.yml、.env.example に基づいて、このマシン上で「AI AllInOne」プラットフォームを完全にデプロイ・検証してください。終始日本語でコミュニケーションします。
>
> ステップ1 パラメータ収集（項目ごとに質問し、スキップ・推測しない）：
> 1) 対外サービスのイントラネット IP；2) スキルマーケットのホスト名（ドメイン。mcp-gateway/skills/skill-market/config.json と SKILL.md の <マーケットホスト名> を置換し、hosts/DNS で解決）；3) アイデンティティソース（AD ドメインコントローラに接続する場合はドメイン/ドメインコントローラ IP/LDAP base DN/bind DN/bind パスワード/sAMAccountName）；4) 統合管理者アカウントのパスワード；5) 大規模モデル API Key；6) 必要に応じてアラート webhook、HTTPS、バックアップ保持ポリシーを確認。
>
> ステップ2 進捗ファイルを生成し、各項目の完了・各問題の解決ごとに更新して報告します。
>
> ステップ3 本マニュアル第 1~13 章の順序に厳密に従い、各章の「⚠️ 重要な落とし穴」に注意し、scripts/ 配下のスクリプトを優先して自動化します。
>
> ステップ4 エラー時はまずログ（docker logs、ヘルスエンドポイント、設定）を確認して根本原因を特定してから修正し、盲目的に再試行しません。
>
> ステップ5 全フロー検証：コンテナ全 Up、Keycloak SSO、NewAPI/LiteLLM 経由の実対話で PII マスキング検証、アイデンティティソースログイン、監視/ログ/アラート、バックアップ復元を、項目ごとに ✅/❌ で集計します。

> 💡 Agent を使わない場合も、上記は「デプロイ前情報チェックリスト」として使えます：デプロイ前にイントラネット IP、アイデンティティソース、管理者パスワード、モデル Key の 4 点を明確にしておきます。

## 2.1 Docker Desktop のインストールと設定

Docker Desktop はインストール後デフォルトで WSL2 バックエンドを使うため、通常は追加設定不要です。リソース上限を手動調整する場合は、ユーザーディレクトリに `.wslconfig` を作成します：

```
# %UserProfile%\.wslconfig（例：C:\Users\あなたのユーザー名\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大メモリ（最低 16GB、推奨 24~32GB）
processors=8      # CPU コア数（物理コア数に合わせる）
swap=4GB
```

保存後、PowerShell で `wsl --shutdown` を実行し、Docker Desktop を再起動すると反映されます。

> ✅ 検証：Docker Desktop のステータスバーに "Engine running"（緑）と表示されること。

## 2.2 ディレクトリ構成の準備

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # 想定するデプロイのルートディレクトリ
├─ docker-compose.yml           # コアサービスオーケストレーション
├─ .env.windows                 # 環境変数（API Key の記入が必要）
├─ litellm-config.yaml          # LiteLLM PII マスキング設定
├─ deepchat-updates\            # DeepChat インストーラのホスティングディレクトリ
├─ admin-portal\                # AI 管理センター実装
├─ mcp-gateway\                 # スキル / MCP ゲートウェイ
├─ monitoring\                  # Prometheus / Loki 設定
└─ scripts\                     # バックアップ / 復元 / ヘルスチェック / 初期化スクリプト
```

## 2.3 Docker 共有ネットワークの作成

```
docker network create ai-platform
docker network ls | findstr ai-platform   # 検証
```

> すべてのコアコンテナは `ai-platform` ネットワークでコンテナ名によって相互アクセスします（例：NewAPI が LiteLLM にアクセスする際は `http://litellm:4000` を使い、localhost を経由しません）。

## 2.4 ホストマシンのイントラネット IP 固定（重要）

ホストマシンが WiFi 接続の場合、IP は DHCP で動的に割り当てられ、再起動やリース期限切れで変わります。変わると従業員が各製品へアクセスするアドレスがすべて無効になります。ルーターで **DHCP 予約（MAC バインド）** を行うことを推奨します：

1. WiFi アダプタの MAC を確認：`ipconfig /all` で「ワイヤレス LAN アダプター WLAN」の物理アドレスを確認（例：`60-A3-E3-41-8F-61`）；

2. ルーター管理画面（例：`http://192.168.31.1`）にログイン → LAN 設定 / DHCP 静的 IP 割り当て；

3. ルールを追加：MAC → IP（例：`192.168.31.117`）を保存；

4. WiFi に再接続して IP が固定されたことを確認。

> ✅ DHCP 予約の方が Windows 内で静的 IP を設定するより安定します（ルーターで一元管理でき、競合しません）。

## 2.5 ネットワーク疎通（最もつまずきやすい手順）

- **Docker イメージレジストリに接続できる**：Docker Hub / quay.io / ghcr.io。つながらない場合は先にミラーアクセラレータ（例：DaoCloud）を設定します。

- **GitHub に接続できる**：リポジトリのクローン、公開依存の取得。つながらない場合はプロキシを使うか、あらかじめソースパッケージをダウンロードします。

- **対象マシンにイントラネットからアクセスできる**：公開するネットワークセグメントが到達可能であることを確認します。

---

[← 第1章：プラットフォーム概要とアーキテクチャ](ch01-overview.md) · [📖 目次](index.md) · [第3章：設定ファイルと環境変数 →](ch03-env.md)
