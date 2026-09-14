# Chapitre 25 : Anonymisation PII (Presidio)

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Les informations sensibles sont anonymisées automatiquement avant de sortir de l'intranet.

[← Chapitre 24 : Journaux unifiés (Loki)](ch24-ops-loki.md) · [📖 Index](index.md) · [Chapitre 26 : MailHog, récepteur d'e-mails →](ch26-ops-mailhog.md)

---

## 25.1 Deux couches d'anonymisation

| Couche | Capacité |
| --- | --- |
| Expressions régulières intégrées de LiteLLM (`litellm_content_filter`) | Numéros de téléphone mobile, cartes d'identité, cartes bancaires, e-mails, codes de crédit social unifiés, passeports, IPv4, etc. ; en cas de correspondance, remplacement par `[xxx_REDACTED]` ; en cas de correspondance à la liste noire de mots sensibles, rejet BLOCK |
| Microsoft Presidio | Entités plus fines (noms de personnes anglaises, e-mails, etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 Règles d'expressions régulières intégrées

| Règle | Expression régulière | Type |
| --- | --- | --- |
| Numéro de téléphone mobile chinois | `\b1[3-9]\d{9}\b` | cn_mobile |
| Numéro de carte d'identité | `\b\d{17}[\dXx]\b` | cn_id |
| Numéro de carte bancaire | `\b\d{16,19}\b` | bank_card |
| E-mail | prebuilt `email` | email |
| Code de crédit social unifié | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Numéro de passeport | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

La liste noire de mots sensibles se gère dans `blocked_words` de `litellm-config.yaml` selon la réalité de l'entreprise (`confidentiel interne`, `secret commercial`, etc.).

## 25.3 Activer Presidio (actuellement commenté)

L'API guardrail de la nouvelle version de LiteLLM a changé, la section Presidio est actuellement commentée. Points d'activation :

- Les guardrails nécessitent `default_on: true` pour s'appliquer globalement ;

- Les variables d'environnement de point de terminaison `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` doivent contenir la base URL (LiteLLM ajoute automatiquement `/analyze`, `/anonymize` ; avec un chemin, cela donne `/analyze/analyze` → 404).

> ⚠️ L'image pèse environ 965 Mo, très lente à télécharger en Chine (environ 1 heure en pratique) ; si le téléchargement bloque, utilisez d'abord les expressions régulières intégrées (qui couvrent déjà les PII chinois de base).

## 25.4 Vérification

Envoyez une requête contenant un numéro de téléphone/e-mail → dans la réponse du modèle, la valeur d'origine est remplacée par `[REDACTED]` ; envoyez une requête contenant « confidentiel interne » → réponse directe `Content blocked`.

> 📖 Documentation officielle :Microsoft Presidio https://microsoft.github.io/presidio/ · code source https://github.com/microsoft/presidio

---

[← Chapitre 24 : Journaux unifiés (Loki)](ch24-ops-loki.md) · [📖 Index](index.md) · [Chapitre 26 : MailHog, récepteur d'e-mails →](ch26-ops-mailhog.md)
