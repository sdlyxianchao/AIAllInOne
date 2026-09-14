# Chapitre 3 : Fichiers de configuration et variables d'environnement

*Première partie · Déploiement*

> Trois fichiers de configuration principaux + l'explication complète des variables d'environnement, celles à configurer maintenant et celles à configurer plus tard.

[← Chapitre 2 : Préparation préalable](ch02-prereq.md) · [📖 Index](index.md) · [Chapitre 4 : Démarrage des services principaux →](ch04-start.md)

---

## 3.1 Les trois fichiers de configuration principaux

| Fichier | Usage | À modifier ? |
| --- | --- | --- |
| `.env.windows` | Tous les mots de passe et clés API externes | **À modifier impérativement** : renseigner la clé API DeepSeek, les autres fournisseurs selon les besoins |
| `litellm-config.yaml` | Liste des modèles de LiteLLM + règles d'anonymisation PII | En général inchangé (si vous n'utilisez que DeepSeek, vous pouvez supprimer les entrées OpenAI/Claude) |
| `docker-compose.yml` | Orchestration des services principaux | Déjà préconfiguré (y compris `KC_HOSTNAME` de Keycloak + volumes persistants) |

## 3.2 Vue d'ensemble des variables d'environnement par catégorie

Ouvrez `.env` (copié depuis `.env.windows`) et configurez par ordre de priorité.

| Variable | Priorité | Description |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 🔴 Immédiate | Clé API LLM externe ; sans elle, la chaîne ne fonctionne pas |
| `LITELLM_MASTER_KEY` | 🔴 Immédiate | Clé d'authentification interne de LiteLLM, utilisée par NewAPI |
| `NEWAPI_DB_PASSWORD` | 🔴 Immédiate | Mot de passe root de MySQL, à ne plus modifier après la première création |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 Immédiate | Mot de passe administrateur de Keycloak |
| `NEWAPI_SESSION_SECRET` | 🔴 Immédiate | Chiffrement de session de NewAPI, chaîne aléatoire |
| `NEWAPI_CRYPTO_SECRET` | 🔴 Immédiate | Chiffrement des données de NewAPI, chaîne aléatoire |
| `ADMIN_PASSWORD` | 🔴 Immédiate | Mot de passe Global Admin du Centre d'administration IA |
| `SESSION_SECRET` | 🔴 Immédiate | Chiffrement de session du Centre d'administration IA, chaîne aléatoire |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 Peut être configuré plus tard | À créer d'abord dans Keycloak pour obtenir le Secret du Client OIDC (voir chapitre 12) |
| `GITEA_RUNNER_TOKEN` | 🟡 Peut être configuré plus tard | Démarrez d'abord Gitea pour obtenir le Token dans l'interface (voir chapitre 9) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 À la demande | Décommentez lorsque nécessaire et modifiez `litellm-config.yaml` en conséquence |
| `GLOBAL_WEB_RATE_LIMIT` et autres limites de débit | ⚪ Par défaut | Réglé à 999999 en phase de test, à réduire en production selon le cas |
| `DEFAULT_QUOTA` | ⚪ Par défaut | Quota par défaut des nouveaux utilisateurs (en dollars) ; 100 = 100 dollars offerts au nouvel utilisateur |
| `GENERATE_DEFAULT_TOKEN` | ⚪ Par défaut | Génère automatiquement une clé initiale à l'inscription ; mettre true pour que l'utilisateur soit opérationnel dès la connexion |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ Par défaut | Les valeurs par défaut suffisent |

## 3.3 🔴 Configuration immédiate (à terminer avant le premier démarrage)

| Variable | Description | Comment l'obtenir | Format |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Clé LLM cloud de DeepSeek | Inscription sur https://platform.deepseek.com → API Keys | `sk-xxxx` |
| `LITELLM_MASTER_KEY` | Clé d'administrateur interne de LiteLLM (pas une clé LLM externe) | Génération aléatoire (voir ci-dessous) | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | Mot de passe MySQL | À définir soi-même ; **à ne plus modifier** après la première création | Libre |
| `KEYCLOAK_ADMIN_PASSWORD` | Mot de passe administrateur de Keycloak | À définir soi-même, ≥ 8 caractères | Libre |
| `NEWAPI_SESSION_SECRET` | Chiffrement de session de NewAPI | Génération aléatoire | 32 caractères |
| `NEWAPI_CRYPTO_SECRET` | Chiffrement des données de NewAPI | Génération aléatoire | 32 caractères |
| `ADMIN_PASSWORD` | Mot de passe administrateur du Centre d'administration IA | À définir soi-même, ≥ 8 caractères | Libre |
| `SESSION_SECRET` | Chiffrement de session du Centre d'administration IA | Génération aléatoire | 64 caractères |

Générer une chaîne aléatoire (PowerShell) :

```
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Exemple de saisie de la clé API

```
# DeepSeek est configuré par défaut (décommentez et renseignez la clé)
DEEPSEEK_API_KEY=sk-votre_clé_DeepSeek_réelle

# Décommentez pour OpenAI / Claude, et décommentez le bloc model correspondant dans litellm-config.yaml
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3.4 Politique de modification des mots de passe

> ⚠️ `NEWAPI_DB_PASSWORD` concerne une base déjà créée : après modification, il faut supprimer le volume correspondant et le reconstruire (les données seront perdues) ; mieux vaut le fixer dès le début.
 Les mots de passe d'administration comme `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_PASSWORD` peuvent être modifiés dans l'interface de chaque produit ; mettez ensuite à jour `.env` en conséquence (simple aide-mémoire, sans impact sur l'exécution).

## 3.5 Explication de litellm-config.yaml

- `model_list` — définit les modèles externes disponibles ; NewAPI appelle via LiteLLM. Par défaut, seul `deepseek-chat` est activé ;

- `general_settings.master_key` — clé d'administrateur de LiteLLM, lit `LITELLM_MASTER_KEY` depuis `.env` ;

- L'anonymisation PII (Presidio) est actuellement **commentée temporairement** (l'API guardrail de la nouvelle version de LiteLLM a changé et n'est pas compatible) ; pour l'activer plus tard, voir le chapitre 25 ;

- Utilisez la version stable `v1.95.1` (`main-latest` a des bugs connus).

---

[← Chapitre 2 : Préparation préalable](ch02-prereq.md) · [📖 Index](index.md) · [Chapitre 4 : Démarrage des services principaux →](ch04-start.md)
