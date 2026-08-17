# Manuel de l'utilisateur AI AllInOne

*v0.2 · Guide de l'employé*

**Démarrage rapide**

## 1. Découvrir la plateforme

> 📌 Remarque : dans ce manuel, `IP` désigne l'adresse du serveur intranet de l'entreprise (exemple `192.168.31.117`, en pratique celle communiquée par l'administrateur). Toutes les adresses utilisent l'**IP intranet** ; n'utilisez pas `localhost` ni `127.0.0.1`.
### 1.1 Ce qu'est la plateforme
« AI AllInOne » est une plateforme IA d'entreprise déployée sur l'intranet de la société ; elle regroupe les capacités des grands modèles (DeepSeek, GPT, Claude, etc.) en un point unique accessible depuis l'intranet, utilisable par les employés avec **un seul compte**. Vous n'avez pas à vous soucier des serveurs, des modèles ni des clés sous-jacents — retenez simplement trois points d'entrée.
### 1.2 Ce que je peux faire avec la plateforme
| Ce que vous voulez faire | Outil à utiliser | Où l'ouvrir |
| --- | --- | --- |
| Converser au quotidien comme avec ChatGPT, rédiger des documents, traduire, corriger du code | 💬 DeepChat | Client de bureau (à installer depuis le portail) |
| Utiliser les applications IA prêtes de l'entreprise (assistant de support client, assistant d'approbation, etc.) | 🤖 Dify | Navigateur `http://IP` |
| Téléverser des documents pour du « question-réponse sur base de connaissances » (interroger des ressources internes) | 🤖 Dify | Navigateur `http://IP` |
| Lire les actualités de l'entreprise, les annonces, télécharger des logiciels | 📰 Portail (Hub) | Navigateur `http://IP:8090` |
| Demander soi-même une clé API pour l'intégrer à un outil tiers | 🔑 NewAPI | Navigateur `http://IP:3000` |
### 1.3 Comment choisir entre les trois points d'entrée
> ✅ **En une phrase** : **Discuter / rédiger / traduire → DeepChat** ; **applications toutes prêtes de l'entreprise / bases de connaissances → Dify** ; **chercher quelque chose / lire les annonces / télécharger des logiciels → le portail Hub**. Les trois s'utilisent avec le même compte.
Connexion : tous les produits passent par le **compte unifié Keycloak** (certains prennent en charge le compte de domaine AD de l'entreprise, c'est-à-dire celui de votre session Windows). Cliquez sur « Connexion » pour être redirigé automatiquement vers la page de connexion unifiée ; saisissez le compte une seule fois, puis aucun autre produit ne demandera de reconnexion.
### 1.4 Comment utiliser ce manuel
- **Débutant** : lisez les chapitres 2 à 4 dans l'ordre, installez d'abord DeepChat pour commencer ;
- **Pour intégrer un outil tiers** : lisez le chapitre 5 pour demander une clé ;
- **En cas de doute** : consultez d'abord la FAQ du chapitre 7, puis interrogez l'administrateur ;
- **À lire absolument** : chapitre 6 sécurité des données, chapitre 8 code de conduite, à respecter par tous.

## 2. AI All In One Hub (le portail)

### 2.1 Ce qu'est le portail
Ghost**AI All In One Hub** est le portail d'entreprise de la société (construit sur le logiciel open source Ghost), à l'adresse `http://IP:8090`. C'est votre **point de départ** pour entrer dans la plateforme IA.
### 2.2 Lire les actualités / annonces
1. Ouvrez `http://IP:8090` dans le navigateur ;
2. La page d'accueil affiche la liste des dernières actualités et annonces ; cliquez sur un titre pour lire l'article complet.
### 2.3 Centre de téléchargement (installer DeepChat)
1. Cliquez sur le menu « **Centre de téléchargement** » en haut du portail, ou ouvrez directement `http://IP:8090/downloads/` ;
2. Choisissez le paquet d'installation **Windows** / **macOS** selon votre système, téléchargez **DeepChat** ;
3. Installation : sous Windows, double-cliquez sur le .exe et suivez l'assistant ; sous macOS, ouvrez le .dmg et glissez-le dans « Applications ».
> ✅ En haut de la page de téléchargement, « installez d'abord le gestionnaire de skills » est un paquet de compétences destiné aux utilisateurs avancés ; les utilisateurs ordinaires peuvent l'ignorer.
### 2.4 Basculer vers Dify / l'aide
- Cliquez sur le menu du portail « **Espace de travail IA** » → basculez directement vers Dify (plateforme d'applications IA) ;
- Cliquez sur « **Documentation d'aide** » → consultez les articles d'aide rédigés par l'entreprise.
> 📖 Documentation officielle :le portail est fourni par Ghost, documentation officielle https://ghost.org/docs/

## 3. Outil 1 : DeepChat

### 3.1 Téléchargement et installation
1. Ouvrez le centre de téléchargement du portail `http://IP:8090/downloads/` ;
2. Téléchargez et installez le paquet selon votre système ;
3. Lancez DeepChat.
### 3.2 Configurer le modèle (se connecter à la passerelle de l'entreprise)
À la première utilisation, vous devez indiquer à DeepChat où se trouve le modèle. L'entreprise a regroupé les modèles vers la passerelle **NewAPI** ; il vous suffit de renseigner trois valeurs :
1Ouvrez DeepChat → en bas à gauche **Paramètres (⚙️)** → **Services de modèles / Fournisseurs de modèles**.
2Ajoutez un « **fournisseur personnalisé** » ou « **compatible OpenAI** ».
3Renseignez les trois champs suivants :
| Champ | Valeur à saisir |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | la clé `sk-` demandée dans NewAPI (voir chapitre 5) |
| Modèle | `deepseek-chat` (défaut de l'entreprise, autres modèles ouverts au choix) |
4Enregistrez.
> ⚠️ **Essentiel** : l'API Base URL doit utiliser l'**IP intranet** (`http://IP:3000/v1`), pas `localhost`, sinon impossible de joindre le serveur de l'entreprise.
### 3.3 Commencer à dialoguer
1. Cliquez sur « **+ Nouvelle conversation** » ;
2. Saisissez du texte dans la zone de saisie, appuyez sur Entrée pour envoyer ;
3. Recevoir une réponse signifie que la chaîne fonctionne.
### 💡 **Essayez** : envoyez « Rédigez-moi un e-mail de relance à un client, sur un ton courtois » pour voir comment l'IA répond. Essayez aussi « Traduisez le passage suivant en anglais : …… ». DeepChat prend en charge les conversations multi-tours ; vous pouvez poursuivre les questions et demander à l'IA de modifier.

    3.4 Fonctions courantes et astuces
| Fonction | Comment l'utiliser |
| --- | --- |
| Changement de modèle | Choisissez différents modèles en haut de la conversation (si l'entreprise en ouvre plusieurs) |
| Lecture/écriture de fichiers / outils MCP | Paramètres → MCP, activez les outils de l'entreprise (comme le système de fichiers) pour que l'IA lise des fichiers locaux |
| Thème sombre / clair | Paramètres → Apparence |
| Problème de proxy réseau | « Délai de connexion » → Paramètres → Réseau / proxy → choisir « Pas de proxy / connexion directe » |
### 3.5 Astuces de formulation
> ✅ **Plus c'est précis, mieux c'est** — donnez le contexte, précisez les exigences, fournissez des exemples, et la qualité de la réponse de l'IA s'améliore.
- 💡 Bon exemple : « Vous êtes un rédacteur senior, rédigez-moi une présentation de produit d'environ 200 mots, destinée à des CTO, dans un style professionnel et sobre » — bien meilleur que « rédigez une présentation ».
    
      **Donnez un rôle** : « Vous êtes un expert financier, aidez-moi à… » ;
- **Donnez des contraintes** : « limitez-vous à 100 mots / utilisez un tableau / procédez en trois étapes » ;
- **Donnez un exemple** : « réécrivez en suivant ce format… » ;
- **Affinez par étapes** : si le résultat ne convient pas, dites « modifiez encore » ou « changez de ton ».
> 📖 Documentation officielle :démarrage rapide DeepChat https://deepchatai.cn/docs/guide/getting-started/ · dépôt open source https://github.com/ThinkInAIXYZ/deepchat

## 4. Outil 2 : Dify

### 4.1 Se connecter à Dify
1. Ouvrez `http://IP` dans le navigateur (port 80, sans numéro de port ; accessible aussi depuis l'« Espace de travail IA » du portail) ;
2. Connectez-vous avec le compte unifié (la première fois, l'administrateur doit peut-être créer le compte au préalable).
### 4.2 Utiliser une application de chat existante
L'administrateur prépare à l'avance des applications (comme « Questions-réponses sur le règlement de l'entreprise », « Assistant support ») ; l'utilisateur ordinaire n'a qu'à les « utiliser » :
1. Après connexion, entrez dans la liste « **Studio / Applications** » ;
2. Trouvez l'application à utiliser, cliquez sur « **Exécuter / Aperçu** » (bouton de lecture en haut à droite) ;
3. Posez directement vos questions dans la page de conversation qui s'ouvre.
### 4.3 Question-réponse sur base de connaissances
Pour « donner » des documents internes à l'IA afin qu'elle réponde, utilisez la **base de connaissances** de Dify (autorisation requise de l'administrateur) :
1. « **Base de connaissances** » → « Créer une base de connaissances » ;
2. Téléversez des documents (Word / PDF / Markdown / lien de page Web, etc.) ;
3. Le système segmente et indexe automatiquement ;
4. « Référencez » cette base dans l'application, et l'IA pourra répondre à partir de vos documents.
> 📌 Le contenu de la base de connaissances est utilisé par l'IA pour répondre ; respectez les règles de sécurité des données du chapitre 6 — **ne téléversez pas de documents confidentiels**.
### 4.4 Créer soi-même une application simple (avancé)
1. Studio → créer une application vide → choisissez « Assistant de chat » ;
2. Écrivez un « prompt » pour indiquer son rôle à l'IA (par exemple « Vous êtes l'assistant de réponse sur le règlement de présence de l'entreprise ») ;
3. Ajoutez une base de connaissances → choisissez un modèle → aperçu/test → publiez.
> 📖 Documentation officielle :documentation officielle de Dify https://docs.dify.ai

## 5. Demander une clé API

Si vous devez intégrer les capacités IA de l'entreprise à un **outil tiers** (votre propre script, ou un autre logiciel prenant en charge l'interface OpenAI), il vous faut une clé API (la clé commençant par `sk-`).
### 5.1 Se connecter à NewAPI
1. Ouvrez `http://IP:3000` dans le navigateur ;
2. Connectez-vous avec le compte unifié (ou cliquez sur « Connexion en un clic / OIDC » pour utiliser le compte de domaine).
### 5.2 Créer un token
1. Menu de gauche « **Clés API / Tokens** » ;
2. Cliquez sur « **Nouveau token** », donnez-lui un nom (par exemple `mon-script`), définissez éventuellement le quota et la date d'expiration ;
3. Après enregistrement, copiez la chaîne `sk-xxxx` générée. **Affichée une seule fois, sauvegardez-la immédiatement**.
### 5.3 Renseigner dans le client
- **API Base URL** : `http://IP:3000/v1`
- **API Key** : le `sk-xxxx` que vous venez de copier
### 5.4 Exemples d'usage courant
> 💡 Test avec curl :  
> 
>     `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Bonjour"}]}'`
> 
>     ⚠️ Si le quota est épuisé, « solde insuffisant » s'affiche ; contactez l'administrateur pour l'augmenter. La clé équivaut au mot de passe de votre compte : **ne la communiquez à personne et ne la committez pas dans un dépôt de code**.
> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai

## 6. Règles de sécurité des données

La plateforme **anonymise** automatiquement les informations sensibles telles que **numéro de téléphone, numéro de carte d'identité, numéro de carte bancaire, e-mail** (masquées automatiquement avant envoi au grand modèle), et bloque les mots sensibles. Mais respectez de vous-même la ligne rouge ci-dessous.
### 6.1 Ce que l'on peut envoyer et ce que l'on ne peut pas
#### ❌ Strictement interdit d'envoyer à l'IA
- Confidentiel interne / secret commercial (code produit non publié, tarifs, listes de clients, clauses contractuelles) ;
- Données personnelles (numéro de carte d'identité, numéro de carte bancaire, mot de passe, informations de santé, vie privée d'autrui) ;
- Code source / solutions techniques non publiées.
#### ✅ Utilisation sans crainte
- Documents publics, connaissances générales, rédaction de documents, traduction, résumé ;
- Données métier anonymisées (après suppression des noms concrets / numéros / champs sensibles).
### 6.2 Aide-mémoire de classification des données
| Niveau de donnée | Peut aller vers un grand modèle externe ? | Description |
| --- | --- | --- |
| Données publiques | ✅ Oui | Documents déjà publiés, informations générales |
| Données internes ordinaires | ⚠️ Utilisables après anonymisation | Utilisables après suppression des champs sensibles |
| Confidentiel interne / données personnelles | ❌ Interdit | Strictement interdit d'envoi |
> > Principe de jugement : **« Ce contenu poserait-il problème s'il était vu par un tiers ? »** Si oui → ne l'envoyez pas.
### 6.3 Trois scénarios types
| Scénario | Comment faire |
| --- | --- |
| Rédiger un rapport hebdomadaire mentionnant des noms de clients | Remplacez les vrais noms par « client X », « client A » |
| Demander à l'IA d'analyser un tableau de données | Supprimez d'abord les colonnes nom, téléphone, numéro de carte d'identité, etc., ne gardez que les données agrégées |
| Traduire des clauses contractuelles | Supprimez d'abord les montants, noms de contreparties, etc., ou remplacez-les par « Partie A / Partie B » |

## 7. FAQ - questions fréquentes

### 7.1 Connexion / accès
| Problème | Solution |
| --- | --- |
| Impossible de se connecter à un produit ? | Vérifiez que vous utilisez l'IP intranet (pas localhost) et le compte unifié ; sinon contactez l'administrateur |
| La page de connexion ne s'ouvre pas / tourne en boucle ? | Vérifiez que vous êtes connecté à l'intranet de l'entreprise (WiFi/filaire), adresse en `http://IP` et non localhost |
| Mot de passe du compte unifié oublié ? | Contactez l'administrateur pour la réinitialisation (ou récupération via le compte de domaine) |
### 7.2 Utilisation
| Problème | Solution |
| --- | --- |
| Quota insuffisant ? | Consultez le solde dans l'interface NewAPI ; une fois épuisé, contactez l'administrateur pour recharger/augmenter le quota |
| Contenu envoyé bloqué ? | Il a touché un mot sensible ou contient des informations sensibles ; ajustez selon les règles du chapitre 6 puis réessayez |
| DeepChat signale un délai de connexion ? | Paramètres → Réseau / proxy → choisir « Pas de proxy / connexion directe » |
| Qualité de réponse du modèle médiocre ? | Changez de modèle, ou améliorez la question (fournir le contexte, préciser les exigences, donner des exemples) |
| Oublié où télécharger DeepChat ? | Centre de téléchargement du portail `http://IP:8090/downloads/` |
| La création d'application Dify tourne en boucle ? | Généralement un problème réseau/WebSocket, contactez l'administrateur ; forcez l'actualisation avec Ctrl+F5 |
### 7.3 Compréhension
| Problème | Solution |
| --- | --- |
| Peut-on faire confiance aux réponses de l'IA ? | Pas entièrement. L'IA peut se tromper (hallucination) ; les faits, chiffres et codes importants doivent être vérifiés humainement |
| L'IA retient-elle ce que je dis ? | Le contexte de la conversation courante est conservé pour les réponses multi-tours ; n'entrez pas d'informations confidentielles (voir chapitre 6) |

## 8. Code de conduite

### 8.1 Règles d'utilisation
- Ne pas utiliser à des fins illégales ou non conformes, ne pas générer de contenu illégal, nuisible ou contrefaisant ;
- Ne pas contourner les restrictions de sécurité de la plateforme, ne pas forcer les quotas en masse ;
- Lors de la diffusion de contenu généré par l'IA, vérifier les faits et respecter la politique de publication de l'entreprise ;
- Conserver soigneusement sa clé API, ne pas la prêter, ne pas la committer dans un dépôt de code ;
- Signaler rapidement toute anomalie (compte anormal, contenu anormal) à l'administrateur.
### 8.2 En résumé
> ✅ Utilisez l'IA à bon escient pour gagner en efficacité, mais **pas de données confidentielles, vérifiez toujours les faits, respectez les règles**. En cas de problème, contactez l'administrateur de la plateforme.

