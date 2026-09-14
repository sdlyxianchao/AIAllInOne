# Chapitre 3 : Outil 1 : DSH Desktop

*Démarrage rapide*

> Client de bureau de conversation IA : téléchargement, configuration, dialogue, astuces avancées.

[← Chapitre 2 : AI All In One Hub (le portail)](ch02-hub.md) · [📖 Index](index.md) · [Chapitre 4 : Outil 2 : Dify →](ch04-dify.md)

---

## 3.1 Téléchargement et installation

1. Ouvrez le centre de téléchargement du portail `http://IP:8090/downloads/` ;

2. Téléchargez et installez le paquet selon votre système ;

3. Lancez DSH Desktop.

## 3.2 Configurer le modèle (se connecter à la passerelle de l'entreprise)

À la première utilisation, vous devez indiquer à DSH Desktop où se trouve le modèle. L'entreprise a regroupé les modèles vers la passerelle **NewAPI** ; il vous suffit de renseigner trois valeurs :

**1.** Ouvrez DSH Desktop → en bas à gauche **Paramètres (⚙️)** → **Services de modèles / Fournisseurs de modèles**.

**2.** Ajoutez un « **fournisseur personnalisé** » ou « **compatible OpenAI** ».

**3.** Renseignez les trois champs suivants :

| Champ | Valeur à saisir |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | la clé `sk-` demandée dans NewAPI (voir chapitre 5) |
| Modèle | `deepseek-chat` (défaut de l'entreprise, autres modèles ouverts au choix) |

**4.** Enregistrez.

> ⚠️ **Essentiel** : l'API Base URL doit utiliser l'**IP intranet** (`http://IP:3000/v1`), pas `localhost`, sinon impossible de joindre le serveur de l'entreprise.

## 3.3 Commencer à dialoguer

1. Cliquez sur « **+ Nouvelle conversation** » ;

2. Saisissez du texte dans la zone de saisie, appuyez sur Entrée pour envoyer ;

3. Recevoir une réponse signifie que la chaîne fonctionne.

> 💡 **Essayez** : envoyez « Rédigez-moi un e-mail de relance à un client, sur un ton courtois » pour voir comment l'IA répond. Essayez aussi « Traduisez le passage suivant en anglais : …… ». DSH Desktop prend en charge les conversations multi-tours ; vous pouvez poursuivre les questions et demander à l'IA de modifier.

## 3.4 Fonctions courantes et astuces

| Fonction | Comment l'utiliser |
| --- | --- |
| Changement de modèle | Choisissez différents modèles en haut de la conversation (si l'entreprise en ouvre plusieurs) |
| Lecture/écriture de fichiers / outils MCP | Paramètres → MCP, activez les outils de l'entreprise (comme le système de fichiers) pour que l'IA lise des fichiers locaux |
| Thème sombre / clair | Paramètres → Apparence |
| Problème de proxy réseau | « Délai de connexion » → Paramètres → Réseau / proxy → choisir « Pas de proxy / connexion directe » |

## 3.5 Astuces de formulation

> ✅ **Plus c'est précis, mieux c'est** — donnez le contexte, précisez les exigences, fournissez des exemples, et la qualité de la réponse de l'IA s'améliore.

> 💡 Bon exemple : « Vous êtes un rédacteur senior, rédigez-moi une présentation de produit d'environ 200 mots, destinée à des CTO, dans un style professionnel et sobre » — bien meilleur que « rédigez une présentation ».

- **Donnez un rôle** : « Vous êtes un expert financier, aidez-moi à… » ;

- **Donnez des contraintes** : « limitez-vous à 100 mots / utilisez un tableau / procédez en trois étapes » ;

- **Donnez un exemple** : « réécrivez en suivant ce format… » ;

- **Affinez par étapes** : si le résultat ne convient pas, dites « modifiez encore » ou « changez de ton ».

> 📖 Documentation officielle :démarrage rapide DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · dépôt open source https://github.com/dataelement/dsh-desktop

---

[← Chapitre 2 : AI All In One Hub (le portail)](ch02-hub.md) · [📖 Index](index.md) · [Chapitre 4 : Outil 2 : Dify →](ch04-dify.md)
