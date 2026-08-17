# Chapitre 22 : Administration de la surveillance et des alertes

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Prometheus + Grafana + Alertmanager : surveillance des ressources des conteneurs et notifications d'alerte.

[← Chapitre 21 : Administration du serveur de mise à jour](ch21-ops-update.md) · [📖 Index](index.md) · [Chapitre 23 : Observabilité LLM (Langfuse) →](ch23-ops-langfuse.md)

---

**Accès** : Grafana `http://<IP-du-serveur>:3030` (connexion SSO automatique) ; Prometheus `:9091` ; Alertmanager `:9093`.

## 22.1 Composants et ports

| Composant | Port | Usage |
| --- | --- | --- |
| cadvisor | 8080 (interne) | Collecte le CPU/mémoire/réseau/disque de chaque conteneur |
| Prometheus | 9091 | Agrégation des métriques + règles d'alerte (`monitoring/alerts.yml`) |
| Grafana | 3030 | Tableau de bord de visualisation (préconfiguré « AI All In One — Surveillance des conteneurs ») |
| Alertmanager | 9093 | Dédoublonnage / regroupement / routage / notification des alertes |

## 22.2 Consulter le tableau de bord

1. Connectez-vous à Grafana (`ai_all_in_one_admin` / mot de passe unifié, connexion SSO automatique) ;

2. Ouvrez le panneau « AI All In One — Surveillance des conteneurs » pour voir le CPU/mémoire/réseau de chaque conteneur.

## 22.3 Règles d'alerte

Règles préconfigurées (`monitoring/alerts.yml`) : conteneur en panne (critical), mémoire du conteneur > 90 % (warning), CPU du conteneur > 80 % (warning).

> ⚠️ Piège des fausses alertes : cadvisor remonte tous les cgroups de l'hôte (y compris systemd), les règles d'alerte doivent filtrer avec `{name!=""}`, et l'alerte mémoire doit ajouter `container_spec_memory_limit_bytes > 0` (sinon limit=0 provoque une division par zéro et une alerte permanente).

## 22.4 Brancher la notification d'alerte (IM entreprise)

Le cheminement des alertes est **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM entreprise**. Configurez-le dans le menu **« Opérations → Alertes IM entreprise »** (configuration stockée dans Redis, survit au redémarrage) :

- **Destinataires** : ajoutez-en plusieurs. Type « DingTalk/WeCom/Feishu » = robot de groupe (URL webhook, envoi au groupe) ; type « DingTalk App (à une personne) » (AppKey/AppSecret/AgentId/userid) ou « WeCom App (à une personne) » (corpId/secret/agentid/userid) = application d'entreprise, envoi à des personnes.

- **Règles d'envoi** : interrupteur général, sévérité minimale (critique/avertissement/info), envoi ou non des notifications « firing » / « resolved ».

- **Historique d'envoi** : enregistre chaque envoi (heure/destinataire/type/nom d'alerte/sévérité/résultat), avec pagination, taille de page réglable, recherche par mot-clé et filtrage par type/résultat/sévérité.

- Chaque destinataire a un bouton « Test » pour envoyer un message de test, et un interrupteur d'activation.

> ⚠️ Un webhook de robot de groupe ne peut envoyer qu'à un **groupe**, pas à une personne. Pour envoyer à des personnes, utilisez les types « application d'entreprise » (DingTalk/WeCom), qui nécessitent une application interne créée dans la console d'administration avec l'autorisation d'envoyer des messages. Les robots de groupe DingTalk nécessitent aussi des « mots-clés personnalisés » (ex. « AI 平台 » / « 告警 ») ou la « signature », sinon le message est bloqué par la politique de sécurité.

> 📌 Explication des conflits de ports : le port Prometheus par défaut 9090 étant occupé par Keycloak, il est passé à 9091 ; les ports Grafana par défaut 3000/3001 étant occupés, il est passé à 3030.

> 📖 Documentation officielle :Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← Chapitre 21 : Administration du serveur de mise à jour](ch21-ops-update.md) · [📖 Index](index.md) · [Chapitre 23 : Observabilité LLM (Langfuse) →](ch23-ops-langfuse.md)
