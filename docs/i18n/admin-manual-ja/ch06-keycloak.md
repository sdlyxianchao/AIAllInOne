# 第6章：Keycloak：Realm・ユーザー・AD

*第一部 · デプロイ編*

> Realm の作成、ローカルアカウントの作成、または Active Directory からのドメインアカウント取り込み——全製品 SSO の基盤。

[← 第5章：Dify の独立デプロイ](ch05-dify-deploy.md) · [📖 目次](index.md) · [第7章：NewAPI：初期化・チャネル・OIDC →](ch07-newapi.md)

---

> 📌 アクセス：ホストマシン `http://127.0.0.1:9090`、イントラネット `http://<サーバーIP>:9090`。データは named volume `keycloak-data` に保存され、コンテナ再構築でも失われません。資格情報は `.env.windows` の `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` 参照。

## 6.1 Realm の作成

1. ブラウザで `http://127.0.0.1:9090` を開く → Administration Console → 管理者ログイン；

2. 左上のドロップダウン → **Create Realm** → Realm name に `enterprise-ai` を入力 → Create。

## 6.2 方法A：ローカルでアカウント作成（AD なしの小規模チーム/テスト）

1. **Groups** → Create Group → `ai-admin`；さらに `ai-user` を作成；

2. **Users** → Add user → ユーザー名 → Create；

3. Credentials タブ → パスワード設定 → Temporary をオフ；

4. Groups タブ → `ai-user` グループに追加。

## 6.3 方法B：Active Directory からアカウントを取り込み（推奨）

会社に既存の Windows AD ドメインコントローラがある場合、従業員はドメインアカウントでログインでき、Keycloak で手動アカウント作成は不要です。前提：Docker コンテナからドメインコントローラネットワークへの疎通が済んでいること（ネットワークトポロジ、Hyper-V Internal Switch、ポート転送は『Keycloak AD 統合ガイド』`windows-ad-integration.html` 参照）。

> 📌 必要な AD アカウント：サービスアカウント `svc_keycloak`（パスワード無期限、LDAP バインド用）+ テスト用ドメインユーザー 2 人（同期検証用）。

### LDAP ユーザーフェデレーションの作成

1. enterprise-ai Realm → 左側 **User Federation** → Add provider → **ldap**；

2. 下表に従って入力。

| 設定項目 | 値 | 説明 |
| --- | --- | --- |
| Vendor | **Active Directory** | AD を選択。Other を選ばない（objectGUID を認識できなくなる） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 経由のポート転送。本番は `ldap://dc.会社ドメイン:389` を記入 |
| Enable StartTLS | **Off** | LDAP 389 または LDAPS 636 |
| Bind type | **simple** | ユーザー名+パスワード認証 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必ず LDAP DN 形式**。~~DOMAIN\ユーザー~~ は使わない |
| Bind credentials | `svc_keycloak のパスワード` | `.env.windows` 参照 |
| Edit mode | **READ_ONLY** | 読み取り専用。AD に書き戻さない |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 子 OU がある場合は `DC=testcompany,DC=local` に変更 |
| Username LDAP attribute | `sAMAccountName` | **cn を入力しない** |
| RDN LDAP attribute | `cn` | エントリ命名属性 |
| UUID LDAP attribute | `objectGUID` | AD の不変の一意識別子 |
| User object classes | `person, organizationalPerson, user` | カンマ区切り |
| Search scope | **Subtree** | **One Level を選ばない**（子 OU を検索できなくなる） |
| Pagination | **On** | ユーザーが多い場合の分割取得 |
| Referral | **ignore** | 存在しないドメインコントローラへの追従を回避 |
| Import users | **On** | 全量同期取り込み |
| Sync Registrations | **On** | 初回ログイン時に即時同期 |

Save → **Synchronize all users** → 同期完了を待つ。

> ⚠️ よくある入力ミス：
> - Bind DN は **LDAP 形式**（`CN=svc_keycloak,CN=Users,DC=xxx`）。~~DOMAIN\ユーザー~~ ではない；
> - Username LDAP attribute = `sAMAccountName`。`cn` ではない；
> - Search scope = **Subtree**；
> - **CN のスペースはそのまま保持**：表示名にスペースがある場合（例：`ai all in one admin` の中央がスペース）、Bind DN は `CN=ai all in one admin,...` と書く必要があり、アンダースコアにすると接続できません。

### AD ログインの検証

1. シークレットウィンドウで `http://127.0.0.1:9090/realms/enterprise-ai/account` を開く；

2. ドメインアカウントでログイン（ユーザー名 `aitest1` または `aitest1@<会社ドメイン>` の UPN のいずれでも可）；

3. Account Console に遷移できれば成功。

## 6.4 その他の企業アイデンティティソース（付録 N の要約）

Keycloak は複数のアイデンティティソースをサポートし、すべて同じ `enterprise-ai` Realm 配下に接続します：

| アイデンティティソース | 接続方法 | ポイント |
| --- | --- | --- |
| Microsoft Entra ID（旧 Azure AD） | Identity Providers → OpenID Connect v1.0 | Azure でアプリを登録して client id/secret を取得。redirect URI `/realms/enterprise-ai/broker/entra-id/endpoint` |
| Google Workspace | Identity Providers → Google（組み込み） | Mapper で `hd=ドメイン` を追加してドメイン制限可能 |
| GitHub | Identity Providers → GitHub（組み込み） | OAuth App コールバック `/broker/github/endpoint` |
| 汎用 LDAP（OpenLDAP/FreeIPA） | User Federation → ldap | Vendor は Other、Username attribute は `uid` |
| 汎用 SAML 2.0（Okta/ADFS） | Identity Providers → SAML v2.0 | IdP メタデータ URL を貼り付けて自動入力 |

> ✅ 複数アイデンティティソースの共存：Authentication → Browser flow に Identity Provider Redirector を追加し、メールドメインで自動的に IdP を選択できます（`@会社.com`→AD、`@会社.onmicrosoft.com`→Entra ID）。

> 📖 公式ドキュメント：Keycloak 公式ドキュメント https://www.keycloak.org/documentation · サーバー管理ガイド https://www.keycloak.org/server/ · LDAP フェデレーション https://www.keycloak.org/docs/latest/server_admin/#_ldap

---

[← 第5章：Dify の独立デプロイ](ch05-dify-deploy.md) · [📖 目次](index.md) · [第7章：NewAPI：初期化・チャネル・OIDC →](ch07-newapi.md)
