# Chapitre 15 : Administration quotidienne de NewAPI

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Passerelle LLM : gérer les canaux, les tokens, les quotas, les utilisateurs, les journaux et les coûts.

[← Chapitre 14 : Administration quotidienne de Keycloak](ch14-ops-keycloak.md) · [📖 Index](index.md) · [Chapitre 16 : Administration quotidienne de LiteLLM →](ch16-ops-litellm.md)

---

**Accès** : `http://<IP-du-serveur>:3000`.

## 15.1 Gestion des canaux (modèles en amont)

1. **Ajouter un canal** : Canaux → ajouter un nouveau canal → type OpenAI (ou Claude, etc.) → Base URL `http://litellm:4000` → clé `LITELLM_MASTER_KEY` → renseigner le nom du modèle → enregistrer ;

2. **Tester** : dans la liste des canaux, cliquez sur « Tester », choisissez un modèle pour vérifier la connectivité ;

3. **Désactiver/activer** : commutateur de la liste des canaux ; une fois désactivé, le canal ne reçoit plus de requêtes ;

4. **Priorité / poids** : avec plusieurs canaux pour un même modèle, répartissez par priorité/poids.

## 15.2 Gestion des tokens (clés API)

1. **Créer** : Clés API → nouveau token → nommer (par exemple `dsh-key`) → définir éventuellement quota/expiration/restriction de modèles → enregistrer ;

2. **Copier la clé** : commence par `sk-`, **affichée une seule fois, sauvegardez immédiatement** ;

3. **Désactiver/supprimer** : opérations de la liste des tokens (une fois désactivée, la clé cesse immédiatement) ;

4. **Consulter la consommation** : le détail du token montre le quota déjà consommé.

## 15.3 Quotas et utilisateurs

- **Quota par défaut des nouveaux utilisateurs** : `DEFAULT_QUOTA` (100 dollars conseillés) ;

- **Augmenter le quota d'un utilisateur** : page Utilisateurs → modifier l'utilisateur → définir le quota ;

- **Recharger/bannir** : opérations de la page Utilisateurs ;

- **Gestion par groupes** : créez des groupes par service, définissez des multiplicateurs de modèles / quotas ; les utilisateurs rattachés à un groupe sont gérés selon le service.

## 15.4 Journaux et coûts

- **Page Journaux** : consulter utilisateur/modèle/token/quota/coût/IP source de chaque appel ;

- **Rapport de coûts** : la page « Gestion NewAPI » du Centre d'administration IA offre un rapport de coûts agrégé par utilisateur/modèle/date + les 100 derniers journaux d'audit.

> 📌 L'enregistrement de l'IP du client dépend du paramètre utilisateur « Enregistrer le journal IP » (`record_ip_log`, désactivé par défaut) ; activez-le pour l'utilisateur concerné lorsque l'audit d'IP est requis.

## 15.5 Points de réglage système

- **Adresse du serveur** : doit être réglée sur l'adresse intranet `http://<IP-du-serveur>:3000` (sinon OIDC renvoie `invalid_grant - Incorrect redirect_uri`) ;

- **Authentification → OAuth personnalisé** : intégration Keycloak OIDC (voir chapitre 7) ;

- **Mode d'utilisation** : commutable entre usage personnel et exploitation externe.

> ⚠️ Rappel des pièges clés : ① renseignez toujours le nom de conteneur `http://litellm:4000` dans la Base URL des canaux ; ② la limite de débit 429 se contrôle par `CRITICAL_RATE_LIMIT_ENABLE=false` et les variables associées ; ③ pour modifier la base, utilisez directement la variable d'environnement `MYSQL_PWD` afin d'éviter qu'un avertissement de mot de passe sur stderr soit pris pour une erreur.

> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai · dépôt open source https://github.com/QuantumNous/new-api

---

[← Chapitre 14 : Administration quotidienne de Keycloak](ch14-ops-keycloak.md) · [📖 Index](index.md) · [Chapitre 16 : Administration quotidienne de LiteLLM →](ch16-ops-litellm.md)
