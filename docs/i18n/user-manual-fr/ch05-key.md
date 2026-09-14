# Chapitre 5 : Demander une clé API

*Démarrage rapide*

> Pour intégrer les capacités IA de l'entreprise à un outil tiers, il faut une clé API.

[← Chapitre 4 : Outil 2 : Dify](ch04-dify.md) · [📖 Index](index.md) · [Chapitre 6 : Règles de sécurité des données →](ch06-security.md)

---

Si vous devez intégrer les capacités IA de l'entreprise à un **outil tiers** (votre propre script, ou un autre logiciel prenant en charge l'interface OpenAI), il vous faut une clé API (la clé commençant par `sk-`).

## 5.1 Se connecter à NewAPI

1. Ouvrez `http://IP:3000` dans le navigateur ;

2. Connectez-vous avec le compte unifié (ou cliquez sur « Connexion en un clic / OIDC » pour utiliser le compte de domaine).

## 5.2 Créer un token

1. Menu de gauche « **Clés API / Tokens** » ;

2. Cliquez sur « **Nouveau token** », donnez-lui un nom (par exemple `mon-script`), définissez éventuellement le quota et la date d'expiration ;

3. Après enregistrement, copiez la chaîne `sk-xxxx` générée. **Affichée une seule fois, sauvegardez-la immédiatement**.

## 5.3 Renseigner dans le client

- **API Base URL** : `http://IP:3000/v1`

- **API Key** : le `sk-xxxx` que vous venez de copier

## 5.4 Exemples d'usage courant

> 💡 Test avec curl :
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Bonjour"}]}'`

> ⚠️ Si le quota est épuisé, « solde insuffisant » s'affiche ; contactez l'administrateur pour l'augmenter. La clé équivaut au mot de passe de votre compte : **ne la communiquez à personne et ne la committez pas dans un dépôt de code**.

> 📖 Documentation officielle :documentation officielle de NewAPI https://docs.newapi.pro · site officiel https://www.newapi.ai

---

[← Chapitre 4 : Outil 2 : Dify](ch04-dify.md) · [📖 Index](index.md) · [Chapitre 6 : Règles de sécurité des données →](ch06-security.md)
