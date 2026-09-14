# Chapitre 6 : Règles de sécurité des données

*Démarrage rapide*

> Ce qui peut être envoyé à l'IA et ce qui ne le peut absolument pas — la ligne rouge que chacun doit respecter.

[← Chapitre 5 : Demander une clé API](ch05-key.md) · [📖 Index](index.md) · [Chapitre 7 : FAQ - questions fréquentes →](ch07-faq.md)

---

La plateforme **anonymise** automatiquement les informations sensibles telles que **numéro de téléphone, numéro de carte d'identité, numéro de carte bancaire, e-mail** (masquées automatiquement avant envoi au grand modèle), et bloque les mots sensibles. Mais respectez de vous-même la ligne rouge ci-dessous.

## 6.1 Ce que l'on peut envoyer et ce que l'on ne peut pas

### ❌ Strictement interdit d'envoyer à l'IA

- Confidentiel interne / secret commercial (code produit non publié, tarifs, listes de clients, clauses contractuelles) ;

- Données personnelles (numéro de carte d'identité, numéro de carte bancaire, mot de passe, informations de santé, vie privée d'autrui) ;

- Code source / solutions techniques non publiées.

### ✅ Utilisation sans crainte

- Documents publics, connaissances générales, rédaction de documents, traduction, résumé ;

- Données métier anonymisées (après suppression des noms concrets / numéros / champs sensibles).

## 6.2 Aide-mémoire de classification des données

| Niveau de donnée | Peut aller vers un grand modèle externe ? | Description |
| --- | --- | --- |
| Données publiques | ✅ Oui | Documents déjà publiés, informations générales |
| Données internes ordinaires | ⚠️ Utilisables après anonymisation | Utilisables après suppression des champs sensibles |
| Confidentiel interne / données personnelles | ❌ Interdit | Strictement interdit d'envoi |

Principe de jugement : **« Ce contenu poserait-il problème s'il était vu par un tiers ? »** Si oui → ne l'envoyez pas.

## 6.3 Trois scénarios types

| Scénario | Comment faire |
| --- | --- |
| Rédiger un rapport hebdomadaire mentionnant des noms de clients | Remplacez les vrais noms par « client X », « client A » |
| Demander à l'IA d'analyser un tableau de données | Supprimez d'abord les colonnes nom, téléphone, numéro de carte d'identité, etc., ne gardez que les données agrégées |
| Traduire des clauses contractuelles | Supprimez d'abord les montants, noms de contreparties, etc., ou remplacez-les par « Partie A / Partie B » |

---

[← Chapitre 5 : Demander une clé API](ch05-key.md) · [📖 Index](index.md) · [Chapitre 7 : FAQ - questions fréquentes →](ch07-faq.md)
