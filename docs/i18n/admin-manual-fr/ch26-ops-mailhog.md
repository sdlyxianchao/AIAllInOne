# Chapitre 26 : MailHog, récepteur d'e-mails

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> La « sortie e-mail » en l'absence de SMTP sur l'intranet, qui reçoit les codes de vérification / e-mails de notification de Ghost.

[← Chapitre 25 : Anonymisation PII (Presidio)](ch25-ops-pii.md) · [📖 Index](index.md) · [Chapitre 27 : Sauvegarde et restauration →](ch27-backup.md)

---

**Accès** : `http://<IP-du-serveur>:8025` (boîte de réception Web, SMTP 1025 interne uniquement).

## 26.1 Pourquoi il est nécessaire

L'administration de Ghost 5 est à connexion sans mot de passe : après saisie de l'e-mail, Ghost envoie un e-mail avec un code de vérification à 6 chiffres. Sans SMTP sur l'intranet, l'e-mail ne peut pas partir et la connexion renvoie `Failed to send email`. MailHog sert de « sortie e-mail » pour recevoir ces messages.

## 26.2 Configuration côté Ghost

```
# Variables d'environnement de Ghost dans docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 Consulter les e-mails

1. Ouvrez `http://<IP-du-serveur>:8025` dans le navigateur ;

2. Dans la boîte de réception, vous voyez les codes de vérification / e-mails de notification envoyés par Ghost.

## 26.4 Connexion Ghost sans mot de passe (connexion automatique du Centre d'administration IA)

Le code à 6 chiffres de Ghost est essentiellement un **TOTP** (`TOTP(admin_session_secret + userId)`, 6 chiffres / 60 secondes / HMAC-SHA1). Le Centre d'administration IA peut calculer le code localement ; cliquez sur « Administration Ghost → Ouvrir » pour tout automatiser : connexion par mot de passe → calcul local du code → validation de la session → écriture du cookie → entrée dans l'administration, sans aucune intervention ni consultation de MailHog.

> ⚠️ Même en calculant le code soi-même, Ghost envoie réellement l'e-mail, donc MailHog doit être conservé, sinon la connexion renvoie `Failed to send email`.

> 📖 Documentation officielle :dépôt source de MailHog https://github.com/mailhog/MailHog

---

[← Chapitre 25 : Anonymisation PII (Presidio)](ch25-ops-pii.md) · [📖 Index](index.md) · [Chapitre 27 : Sauvegarde et restauration →](ch27-backup.md)
