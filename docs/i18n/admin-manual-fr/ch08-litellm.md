# Chapitre 8 : LiteLLM : vérification et cache

*Première partie · Déploiement*

> Vérifier que le proxy LiteLLM fonctionne et activer le cache de réponses pour économiser des tokens.

[← Chapitre 7 : NewAPI : initialisation, canaux et OIDC](ch07-newapi.md) · [📖 Index](index.md) · [Chapitre 9 : Configuration de Dify / Ghost / Gitea →](ch09-products.md)

---

> ⚠️ L'anonymisation PII (guardrail Presidio) est actuellement **temporairement désactivée** : le format de configuration guardrail de la nouvelle version de LiteLLM a changé, la section correspondante de `litellm-config.yaml` est commentée ; actuellement LiteLLM ne fait que du transfert de proxy (sans anonymisation). La méthode d'activation figure au chapitre 25.

## 8.1 Vérifier le fonctionnement de base de LiteLLM

```
curl -X POST http://<IP-du-serveur>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

> ⚠️ `<LITELLM_MASTER_KEY>` est la clé d'administrateur de LiteLLM : prenez la valeur réelle de `.env` (pas le placeholder lui-même, sinon 401). Utilisez impérativement l'IP intranet `<IP-du-serveur>:4001`, pas `127.0.0.1:4001` (problème de redirection de ports WSL2).

## 8.2 Cache de réponses (intégré, économise des tokens)

LiteLLM a déjà activé le cache Redis exact match : les requêtes strictement identiques (modèle + messages + paramètres) renvoient directement le cache, partagé entre utilisateurs, économisant des tokens.

```
# Fin de litellm-config.yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: litellm-redis   # Redis de cache dédié
    port: 6379
    ttl: 3600            # Cache pendant 1 heure
```

> Vérification : `curl http://<IP-du-serveur>:4001/cache/ping -H "Authorization: Bearer <KEY>"` renvoie `ping_response: true` ; deux requêtes identiques consécutives : la seconde tombe à l'échelle de la milliseconde. Désactivation du cache : `cache: false` puis redémarrage de litellm.

## 8.3 Ajouter d'autres fournisseurs LLM

1. Dans `.env`, décommentez `# OPENAI_API_KEY=` et renseignez la clé ;

2. Dans `litellm-config.yaml`, décommentez le bloc model correspondant ;

3. `docker compose up -d litellm`.

> 📖 Documentation officielle :documentation officielle de LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Chapitre 7 : NewAPI : initialisation, canaux et OIDC](ch07-newapi.md) · [📖 Index](index.md) · [Chapitre 9 : Configuration de Dify / Ghost / Gitea →](ch09-products.md)
