# Chapitre 23 : Observabilité LLM (Langfuse)

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Tracer le prompt, la réponse, la latence, les tokens et le coût de chaque appel au modèle.

[← Chapitre 22 : Administration de la surveillance et des alertes](ch22-ops-monitoring.md) · [📖 Index](index.md) · [Chapitre 24 : Journaux unifiés (Loki) →](ch24-ops-loki.md)

---

**Accès** : `http://<IP-du-serveur>:3010` (connexion SSO automatique, l'entrée du Centre d'administration IA pointe vers `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 Composants

| Composant | Usage |
| --- | --- |
| langfuse | UI Web + affichage des traces (3010) |
| langfuse-worker | Traitement asynchrone des événements |
| langfuse-postgres | Stockage des métadonnées |
| langfuse-clickhouse | Stockage des événements / traces |
| langfuse-minio | Stockage des pièces jointes / médias S3 |
| langfuse-redis | File d'attente |

LiteLLM remonte automatiquement via `success_callback: ["langfuse"]` (`LANGFUSE_*` de `.env`).

## 23.2 Consulter les traces

1. Connectez-vous à Langfuse → choisissez l'organisation `AI All In One` / le projet `AI Platform` ;

2. La liste Traces montre chaque appel ; cliquez pour voir le prompt/réponse/modèle/latence/tokens/coût ;

3. Utilisez Session pour associer les conversations multi-tours.

## 23.3 Dépannage

> ⚠️ Pièges clés :
> - Il faut définir `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (sur web et worker), sinon l'ancien SDK échoue à remonter `trace-create` et les données ne sont pas visibles ;
> - Connexion SSO sans données visibles : le compte SSO (e-mail AD) diffère du compte d'initialisation ; Langfuse crée alors automatiquement un compte n'appartenant à aucune organisation. Correction (ajouter l'utilisateur SSO à l'organisation) :

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<domaine-entreprise>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 Documentation officielle :documentation officielle de Langfuse https://langfuse.com/docs · auto-hébergement https://langfuse.com/self-hosting

---

[← Chapitre 22 : Administration de la surveillance et des alertes](ch22-ops-monitoring.md) · [📖 Index](index.md) · [Chapitre 24 : Journaux unifiés (Loki) →](ch24-ops-loki.md)
