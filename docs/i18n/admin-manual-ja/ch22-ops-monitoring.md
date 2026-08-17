# 第22章：監視・アラート管理

*第二部 · 管理編（各製品の日常運用）*

> Prometheus + Grafana + Alertmanager：コンテナリソース監視とアラート通知。

[← 第21章：更新サーバーの管理](ch21-ops-update.md) · [📖 目次](index.md) · [第23章：LLM 可観測性（Langfuse） →](ch23-ops-langfuse.md)

---

**入口**：Grafana `http://<サーバーIP>:3030`（SSO 自動ログイン）；Prometheus `:9091`；Alertmanager `:9093`。

## 22.1 コンポーネントとポート

| コンポーネント | ポート | 用途 |
| --- | --- | --- |
| cadvisor | 8080（内部） | 各コンテナの CPU/メモリ/ネットワーク/ディスクを収集 |
| Prometheus | 9091 | メトリクス集約 + アラートルール（`monitoring/alerts.yml`） |
| Grafana | 3030 | 可視化ダッシュボード（プリセット「AI All In One — コンテナ監視」） |
| Alertmanager | 9093 | アラートの重複排除/グループ化/ルーティング/通知 |

## 22.2 ダッシュボードの閲覧

1. Grafana にログイン（`ai_all_in_one_admin` / 統一パスワード、SSO 自動ログイン）；

2. 「AI All In One — コンテナ監視」パネルを開き、各コンテナの CPU/メモリ/ネットワークを確認。

## 22.3 アラートルール

プリセットルール（`monitoring/alerts.yml`）：コンテナ停止（critical）、コンテナメモリ >90%（warning）、コンテナ CPU >80%（warning）。

> ⚠️ アラート誤報の落とし穴：cadvisor はホストマシンの全 cgroup（systemd 含む）を報告するため、アラートルールに `{name!=""}` フィルタを書く必要があります。メモリアラートはさらに `container_spec_memory_limit_bytes > 0` を追加します（ないと limit=0 のゼロ除算で常時発火）。

## 22.4 アラート通知の接続（企業 IM）

アラート経路は **Prometheus → Alertmanager → AI管理センター（`/api/alert-webhook`）→ 企業 IM**。AI管理センターの **「システム運用 → 企業 IM アラート」** メニューで設定します（設定は Redis に保存され再起動後も保持）：

- **受信者**：複数追加可。種別「DingTalk/WeCom/Feishu」＝グループボット（Webhook URL を入力、グループへ送信）；種別「DingTalk アプリ（個人宛）」（AppKey/AppSecret/AgentId/userid）または「WeCom アプリ（個人宛）」（corpId/secret/agentid/userid）＝企業アプリ、個人へ送信。

- **送信ルール**：全体スイッチ、最低重大度（重大/警告/情報）、「発火 firing」/「復旧 resolved」通知の送信有無。

- **送信履歴**：各送信（時刻/受信者/種別/アラート名/重大度/結果）を記録し、ページ送り・ページサイズ調整・キーワード検索・種別/結果/重大度による分類絞り込みに対応。

- 各受信者にはテストメッセージ送信用の「テスト」ボタンと有効スイッチがあります。

> ⚠️ グループボットの Webhook は**グループ**にしか送信できず、個人には送信できません。個人へ送るには「企業アプリ」種別（DingTalk/WeCom）を使い、管理コンソールでメッセージ権限を持つ内部アプリを作成する必要があります。DingTalk のグループボットは「カスタムキーワード」（例「AI 平台」「告警」）または「署名」の設定も必要で、無いとセキュリティポリシーでブロックされます。

> 📌 ポート競合の説明：Prometheus のデフォルト 9090 は Keycloak が使用するため 9091 に変更。Grafana のデフォルト 3000/3001 は使用中のため 3030 に変更。

> 📖 公式ドキュメント：Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← 第21章：更新サーバーの管理](ch21-ops-update.md) · [📖 目次](index.md) · [第23章：LLM 可観測性（Langfuse） →](ch23-ops-langfuse.md)
