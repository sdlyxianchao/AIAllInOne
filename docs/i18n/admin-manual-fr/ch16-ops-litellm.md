# Chapitre 16 : Administration quotidienne de LiteLLM

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Proxy d'anonymisation PII : liste des modèles, règles d'anonymisation, cache, remontée vers Langfuse.

[← Chapitre 15 : Administration quotidienne de NewAPI](ch15-ops-newapi.md) · [📖 Index](index.md) · [Chapitre 17 : Administration quotidienne de Dify →](ch17-ops-dify.md)

---

**Accès** : `http://<IP-du-serveur>:4001` (pure API, sans interface Web ; pour le débogage, utilisez `/v1/models`). La configuration se trouve dans `litellm-config.yaml`.

## 16.1 Maintenance de la liste des modèles

Modifiez `model_list` de `litellm-config.yaml` pour ajouter/supprimer des modèles et les clés API correspondantes. Étapes pour ajouter un nouveau fournisseur :

1. Dans `.env`, décommentez `# OPENAI_API_KEY=` et renseignez la clé ;

2. Dans `litellm-config.yaml`, décommentez le bloc model correspondant ;

3. `docker compose up -d litellm`.

## 16.2 Cache de réponses

Cache Redis exact match, partagé entre utilisateurs pour les requêtes strictement identiques. Ajustez `cache_params.ttl` (3600 secondes par défaut). Désactivation : `cache: false` puis redémarrage.

## 16.3 Remontée vers Langfuse

Via `success_callback: ["langfuse"]` + `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST` de `.env`, chaque appel est automatiquement remonté.

## 16.4 Redémarrage et dépannage

```
docker compose restart litellm          # Redémarrer après modification de la configuration
docker logs litellm --tail 50           # Consulter les journaux
```

> ⚠️ Pièges clés : ① les guardrails nécessitent `default_on: true` pour s'appliquer globalement ; ② l'anonymisation PII (Presidio) est actuellement commentée en raison d'un changement d'API en amont, elle ne fait que du proxy pur ; ③ utilisez la version stable `v1.95.1` (`main-latest` a des bugs).

> 📖 Documentation officielle :documentation officielle de LiteLLM https://docs.litellm.ai · guardrail Presidio https://docs.litellm.ai/docs/proxy/guardrails/presidio

---

[← Chapitre 15 : Administration quotidienne de NewAPI](ch15-ops-newapi.md) · [📖 Index](index.md) · [Chapitre 17 : Administration quotidienne de Dify →](ch17-ops-dify.md)
