# 第14章：Keycloak の日常管理

*第二部 · 管理編（各製品の日常運用）*

> 認証中枢：ユーザー、ロール、OIDC クライアント、AD フェデレーション、セッションの管理。

[← 第13章：相互接続検証チェックリスト](ch13-interconnect.md) · [📖 目次](index.md) · [第15章：NewAPI の日常管理 →](ch15-ops-newapi.md)

---

**入口**：`http://<サーバーIP>:9090` → Administration Console → 管理者ログイン。

> 📌 これらの操作の多くは AI 管理センター → Keycloak ページでも実行できます（グローバル管理者のみ）：LDAP 全量/増分同期、ユーザー削除、ロール管理（一覧/作成/削除/メンバー確認）。第 12.6 章参照。

## 14.1 ユーザー管理

1. **新規ユーザー**：Users → Add user → ユーザー名入力 → Create；

2. **パスワード設定**：該当ユーザーの Credentials タブ → パスワード設定 → Temporary をオフ（オンだと初回ログイン時に変更を強制）；

3. **パスワードリセット**：Users → ユーザー検索 → Credentials → Set password；

4. **無効化/有効化**：ユーザー詳細上部の Enabled スイッチ（無効化するとそのユーザーの全 SSO が即時失効）；

5. **削除**：ユーザー詳細 → Delete。

## 14.2 ロールと権限

- **Realm Role**：Realm roles → Create role でロール作成（例：`ai-platform-admin`）；

- **ロール割り当て**：ユーザー → Role mapping → Assign role；

- **グループ**：Groups → グループ作成（`ai-admin` / `ai-user`）→ グループにユーザー追加。ロールをグループに付与し、ユーザーはグループを通じて権限を継承します。

> ✅ 管理権限は `ai-platform-admin` ロールで一元管理します。各製品は SSO 接続時にこのロールで管理者を識別します。

## 14.3 OIDC クライアント（新製品の SSO 接続）

1. Clients → Create client → Client ID に製品名を入力（例：`newapi` / `grafana` / `langfuse`）；

2. Client authentication：On（オフだと Credentials タブが出ない）、Standard flow：On；

3. Valid redirect URIs / Web origins に製品のコールバックアドレスを入力（イントラネット IP + 127.0.0.1 の両方を追加）；

4. 保存 → Credentials タブで Client secret をコピーして製品側に渡します。

## 14.4 AD / LDAP フェデレーションの保守

- **ドメインコントローラ/パスワード変更**：User Federation → LDAP Provider をクリック → Connection URL / Bind credentials を変更 → Save；

- **手動同期**：Synchronize all users；

- **グループマッピング**：Mappers タブ → group-ldap-mapper → Groups DN に AD グループのコンテナを設定し、AD グループを Keycloak ロールにマッピング。

## 14.5 セッション管理

- **アクティブセッションの確認**：Users → 任意のユーザー → Sessions；

- **強制ログアウト**：Sessions → Sign out all；

- **グローバルセッション/トークン設定**：Realm settings → Sessions / Tokens タブでタイムアウト調整。

> ⚠️ 重要な落とし穴の復習：① bind DN の CN のスペースはそのまま保持；② Username LDAP attribute は `sAMAccountName` で `cn` ではない；③ Search scope は Subtree を選択；④ SSO で `unknown_error` が出るのは多くの場合ホストマシンの iphlpsvc が停止して AD ポート転送が失効しているため；⑤ AD ドメインコントローラ VM が起動していない場合、LDAP フェデレーションのアカウントログインは `LDAP Connection refused` を返します。

> 📖 公式ドキュメント：Keycloak 公式ドキュメント https://www.keycloak.org/documentation · サーバー管理ガイド https://www.keycloak.org/server/

---

[← 第13章：相互接続検証チェックリスト](ch13-interconnect.md) · [📖 目次](index.md) · [第15章：NewAPI の日常管理 →](ch15-ops-newapi.md)
