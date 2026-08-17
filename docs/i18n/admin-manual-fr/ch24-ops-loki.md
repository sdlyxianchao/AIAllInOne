# Chapitre 24 : Journaux unifiés (Loki)

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Agréger les journaux de tous les conteneurs et les interroger par conteneur + mot-clé + temps.

[← Chapitre 23 : Observabilité LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Index](index.md) · [Chapitre 25 : Anonymisation PII (Presidio) →](ch25-ops-pii.md)

---

**Accès** : page « 📜 Journaux unifiés » du Centre d'administration IA (la plus pratique), ou Loki `http://<IP-du-serveur>:3110`.

## 24.1 Composants

| Composant | Port | Usage |
| --- | --- | --- |
| Loki | 3110 | Stockage et interrogation des journaux (machine unique, système de fichiers local) |
| Promtail | — (interne) | Découvre les conteneurs via docker.sock, collecte les journaux json et les envoie à Loki |

## 24.2 Interroger les journaux

1. Centre d'administration IA → Journaux unifiés ;

2. Choisir un conteneur (liste déroulante) → saisir un mot-clé → choisir une plage de temps → interroger ;

3. Le backend `/api/logs/query` interroge Loki avec LogQL.

## 24.3 Aide-mémoire LogQL

```
{container="new-api"} |= "error"              # Lignes contenant error dans un conteneur
{container=~".+"} |~ "(?i)error|exception"      # Correspondance sur tous les conteneurs
{service="litellm"} |= "EMAIL"                  # Interroger par service
```

> 📌 Les labels de Loki sont `container / project / service`, **il n'y a pas de `job`**. Interrogez avec `{container=~".+"}` et non `{job="docker"}`.

> ⚠️ Piège clé (montage sous Docker Desktop) : Promtail doit monter `/var/run/docker.sock` et `/var/lib/docker/containers` (sous WSL2, cela pointe vers l'intérieur de la VM Docker Desktop, là où se trouvent les journaux) ; n'utilisez pas le chemin Windows `C:\...\containers` de l'hôte. Loki en machine unique utilise `store: tsdb` + filesystem.

> 📖 Documentation officielle :documentation officielle de Loki https://grafana.com/docs/loki/latest/

---

[← Chapitre 23 : Observabilité LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Index](index.md) · [Chapitre 25 : Anonymisation PII (Presidio) →](ch25-ops-pii.md)
