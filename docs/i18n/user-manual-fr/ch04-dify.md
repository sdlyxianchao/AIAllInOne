# Chapitre 4 : Outil 2 : Dify

*Démarrage rapide*

> Plateforme d'applications IA Web : utiliser des applications existantes, créer du question-réponse sur base de connaissances.

[← Chapitre 3 : Outil 1 : DeepChat](ch03-deepchat.md) · [📖 Index](index.md) · [Chapitre 5 : Demander une clé API →](ch05-key.md)

---

## 4.1 Se connecter à Dify

1. Ouvrez `http://IP` dans le navigateur (port 80, sans numéro de port ; accessible aussi depuis l'« Espace de travail IA » du portail) ;

2. Connectez-vous avec le compte unifié (la première fois, l'administrateur doit peut-être créer le compte au préalable).

## 4.2 Utiliser une application de chat existante

L'administrateur prépare à l'avance des applications (comme « Questions-réponses sur le règlement de l'entreprise », « Assistant support ») ; l'utilisateur ordinaire n'a qu'à les « utiliser » :

1. Après connexion, entrez dans la liste « **Studio / Applications** » ;

2. Trouvez l'application à utiliser, cliquez sur « **Exécuter / Aperçu** » (bouton de lecture en haut à droite) ;

3. Posez directement vos questions dans la page de conversation qui s'ouvre.

## 4.3 Question-réponse sur base de connaissances

Pour « donner » des documents internes à l'IA afin qu'elle réponde, utilisez la **base de connaissances** de Dify (autorisation requise de l'administrateur) :

1. « **Base de connaissances** » → « Créer une base de connaissances » ;

2. Téléversez des documents (Word / PDF / Markdown / lien de page Web, etc.) ;

3. Le système segmente et indexe automatiquement ;

4. « Référencez » cette base dans l'application, et l'IA pourra répondre à partir de vos documents.

> 📌 Le contenu de la base de connaissances est utilisé par l'IA pour répondre ; respectez les règles de sécurité des données du chapitre 6 — **ne téléversez pas de documents confidentiels**.

## 4.4 Créer soi-même une application simple (avancé)

1. Studio → créer une application vide → choisissez « Assistant de chat » ;

2. Écrivez un « prompt » pour indiquer son rôle à l'IA (par exemple « Vous êtes l'assistant de réponse sur le règlement de présence de l'entreprise ») ;

3. Ajoutez une base de connaissances → choisissez un modèle → aperçu/test → publiez.

> 📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai

---

[← Chapitre 3 : Outil 1 : DeepChat](ch03-deepchat.md) · [📖 Index](index.md) · [Chapitre 5 : Demander une clé API →](ch05-key.md)
