# Capítulo 5: Solicitar API Key

*Início rápido*

> Para integrar a capacidade de IA da empresa a ferramentas de terceiros, é preciso uma API Key.

[← Capítulo 4: Ferramenta 2: Dify](ch04-dify.md) · [📖 Índice](index.md) · [Capítulo 6: Normas de segurança de dados →](ch06-security.md)

---

Se você quer integrar a capacidade de IA da empresa a **ferramentas de terceiros** (seus próprios scripts, outros softwares compatíveis com a interface OpenAI), precisa de uma API Key (chave que começa com `sk-`).

## 5.1 Entrar no NewAPI

1. Abra `http://IP:3000` no navegador;

2. Entre com a conta unificada (ou clique em «login com um clique / OIDC» para usar a conta de domínio).

## 5.2 Criar um token

1. Menu à esquerda «**API Keys / tokens**»;

2. Clique em «**criar token**», dê um nome (como `meu script`), podendo definir cota e expiração;

3. Após salvar, copie a string `sk-xxxx` gerada. **É exibida só uma vez, salve imediatamente**.

## 5.3 Preencher no cliente

- **API Base URL**: `http://IP:3000/v1`

- **API Key**: a `sk-xxxx` copiada há pouco

## 5.4 Exemplos de uso comum

> 💡 Testar com curl:
 `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"olá"}]}'`

> ⚠️ Quando a cota acabar, aparecerá «saldo insuficiente»; fale com o administrador para aumentar a cota. A Key equivale à sua senha de conta: **não envie a ninguém e não a envie para repositórios de código**.

> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai

---

[← Capítulo 4: Ferramenta 2: Dify](ch04-dify.md) · [📖 Índice](index.md) · [Capítulo 6: Normas de segurança de dados →](ch06-security.md)
