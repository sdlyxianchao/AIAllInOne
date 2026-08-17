# Chapitre 18 : Administration quotidienne de Ghost

*Deuxième partie · Administration (opérations quotidiennes de chaque produit)*

> Portail d'entreprise / Hub : articles, pages, navigation, thèmes, membres.

[← Chapitre 17 : Administration quotidienne de Dify](ch17-ops-dify.md) · [📖 Index](index.md) · [Chapitre 19 : Administration quotidienne de Gitea →](ch19-ops-gitea.md)

---

**Accès** : frontal `http://<IP-du-serveur>:8090` ; administration `http://<IP-du-serveur>:8090/ghost/` (attention au suffixe /ghost/).

## 18.1 Connexion à l'administration

L'administration de Ghost 5 est **à connexion sans mot de passe** : saisissez l'e-mail → Ghost envoie un code de vérification à 6 chiffres vers MailHog (`:8025`). Méthode plus rapide : dans le Centre d'administration IA, cliquez sur « Ouvrir » du bouton « Administration Ghost », la connexion se fait automatiquement (calcul local du code TOTP, sans consulter les e-mails).

## 18.2 Publier du contenu

1. **Articles** : Posts → New post → écrire le contenu (éditeur Markdown) → Publish ;

2. **Pages** : Pages → New page (par exemple « Centre de téléchargement » slug `downloads`) ;

3. **Étiquettes / catégories** : Tags → créer des catégories (par exemple `news` / `docs`), classer les articles dans les catégories.

## 18.3 Menu de navigation

1. Administration → Apparence (Design) → Menus (Navigation) ;

2. Modifiez le menu principal « Primary », ajoutez Accueil / Actualités / Centre de téléchargement / Espace de travail IA / Documentation d'aide (voir le tableau des menus du chapitre 9).

## 18.4 Thèmes

- **Changer** : Apparence → Thèmes, activez directement Casper / Source inclus ;

- **Installer** : marché des thèmes (Design → Change theme) ou téléversement d'un zip.

> ⚠️ N'installez pas la dernière version d'un thème depuis GitHub (peut cibler Ghost 6.x, incompatible avec 5.x) ; installez plutôt l'ancienne version en zip.

## 18.5 Membres et abonnements (si nécessaire)

- Members : gérer les abonnés ;

- Si l'abonnement n'est pas nécessaire, ce module peut être ignoré (généralement inutile pour un portail intranet).

## 18.6 Intégrations (jeton API)

1. Administration → Settings → Integrations → ajouter une intégration personnalisée ;

2. Générez une clé API d'administration (format `id:secret`), utilisée par Gitea Actions pour publier des annonces et autres automatisations.

> ⚠️ Pièges clés : ① ne cliquez pas sur « S'inscrire » sur la page d'accueil `/` (c'est l'inscription des abonnés visiteurs) ; ② le code à 6 chiffres est essentiellement un TOTP, le Centre d'administration IA peut le calculer localement ; ③ même avec un calcul local du code, Ghost envoie réellement l'e-mail, donc MailHog doit être conservé (sinon `Failed to send email`).

> 📖 Documentation officielle :documentation officielle de Ghost https://ghost.org/docs/ · console d'administration https://ghost.org/docs/admin/

---

[← Chapitre 17 : Administration quotidienne de Dify](ch17-ops-dify.md) · [📖 Index](index.md) · [Chapitre 19 : Administration quotidienne de Gitea →](ch19-ops-gitea.md)
