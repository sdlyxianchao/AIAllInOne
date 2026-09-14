# Capítulo 4: Ferramenta 2: Dify

*Início rápido*

> Plataforma de aplicações de IA na Web: usar aplicações prontas, criar respostas da base de conhecimento.

[← Capítulo 3: Ferramenta 1: DSH Desktop](ch03-dsh.md) · [📖 Índice](index.md) · [Capítulo 5: Solicitar API Key →](ch05-key.md)

---

## 4.1 Entrar no Dify

1. Abra `http://IP` no navegador (porta 80, sem número de porta; também dá para entrar pelo «Workbench de IA» do portal);

2. Entre com a conta unificada (na primeira vez, pode ser preciso que o administrador crie a conta antes).

## 4.2 Usar aplicações de chat prontas

O administrador monta previamente algumas aplicações (como «perguntas sobre políticas da empresa», «assistente de atendimento»); usuários comuns apenas «usam»:

1. Após entrar, acesse a lista «**Studio / aplicações**»;

2. Encontre a aplicação desejada e clique em «**executar / pré-visualizar**» (botão de play no canto superior direito);

3. Faça as perguntas diretamente na página de conversa aberta.

## 4.3 Perguntas e respostas da base de conhecimento

Para «alimentar» a IA com documentos internos e fazer perguntas, use a **base de conhecimento** do Dify (é preciso permissão do administrador):

1. «**Base de conhecimento**» → «criar base de conhecimento»;

2. Envie documentos (aceita Word / PDF / Markdown / links de páginas etc.);

3. O sistema segmenta e indexa automaticamente;

4. «Referencie» essa base na aplicação e a IA passará a responder com base nos seus documentos.

> 📌 O conteúdo da base de conhecimento é usado pela IA para responder; obedeça às normas de segurança de dados do capítulo 6 — **não envie material confidencial**.

## 4.4 Montar uma aplicação simples por conta própria (avançado)

1. Studio → criar aplicação em branco → escolha «assistente de chat»;

2. Escreva um «prompt» dizendo à IA qual é o papel dela (como «você é o assistente de dúvidas do regulamento de ponto da empresa»);

3. Adicione a base de conhecimento → selecione o modelo → teste a pré-visualização → publique.

> 📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai

---

[← Capítulo 3: Ferramenta 1: DSH Desktop](ch03-dsh.md) · [📖 Índice](index.md) · [Capítulo 5: Solicitar API Key →](ch05-key.md)
