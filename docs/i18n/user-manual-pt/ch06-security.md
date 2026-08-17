# Capítulo 6: Normas de segurança de dados

*Início rápido*

> O que pode ser enviado à IA e o que jamais pode — a linha vermelha que todos devem cumprir.

[← Capítulo 5: Solicitar API Key](ch05-key.md) · [📖 Índice](index.md) · [Capítulo 7: Perguntas frequentes (FAQ) →](ch07-faq.md)

---

A plataforma já **anonimiza** automaticamente informações sensíveis como **celular, CPF, número de cartão bancário, e-mail** (mascara antes de enviar ao modelo) e bloqueia palavras sensíveis. Mas siga conscientemente as linhas vermelhas abaixo.

## 6.1 O que pode e o que não pode enviar

### ❌ Proibido enviar à IA

- Segredos internos / comerciais (código de produto não publicado, preços, lista de clientes, cláusulas de contrato);

- Privacidade pessoal (CPF, número de cartão bancário, senhas, informações de saúde, privacidade de terceiros);

- Código-fonte / soluções técnicas não publicadas.

### ✅ Pode usar com segurança

- Materiais públicos, conhecimento geral, redação de documentos, tradução, resumo;

- Dados de negócio já anonimizados (após remover nomes/números/campos sensíveis específicos).

## 6.2 Consulta rápida de classificação de dados

| Nível de dados | Pode ir ao modelo externo? | Descrição |
| --- | --- | --- |
| Dados públicos | ✅ Sim | Materiais já publicados, informações gerais |
| Dados internos comuns | ⚠️ Sim, após anonimização | Pode usar após remover campos sensíveis |
| Segredos internos / privacidade pessoal | ❌ Proibido | Jamais enviar |

Critério: **«se este conteúdo for visto por alguém de fora, haveria problema?»** Se sim → não envie.

## 6.3 Três cenários típicos

| Cenário | O que fazer |
| --- | --- |
| Escrever relatório semanal mencionando nome de cliente | Use «certo cliente», «cliente A» no lugar do nome real |
| Pedir à IA para analisar uma tabela de dados | Apague primeiro colunas como nome, telefone, CPF; deixe apenas dados agregados |
| Traduzir cláusulas de contrato | Apague primeiro valores, nomes das partes etc., ou use «parte A/parte B» |

---

[← Capítulo 5: Solicitar API Key](ch05-key.md) · [📖 Índice](index.md) · [Capítulo 7: Perguntas frequentes (FAQ) →](ch07-faq.md)
