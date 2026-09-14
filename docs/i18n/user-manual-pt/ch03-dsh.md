# Capítulo 3: Ferramenta 1: DSH Desktop

*Início rápido*

> Cliente de desktop de conversa com IA: download, configuração, conversa e dicas avançadas.

[← Capítulo 2: AI All In One Hub (portal)](ch02-hub.md) · [📖 Índice](index.md) · [Capítulo 4: Ferramenta 2: Dify →](ch04-dify.md)

---

## 3.1 Download e instalação

1. Abra a central de downloads do portal `http://IP:8090/downloads/`;

2. Baixe e instale o instalador conforme seu sistema;

3. Inicie o DSH Desktop.

## 3.2 Configurar o modelo (conectar ao gateway da empresa)

No primeiro uso, é preciso dizer ao DSH Desktop onde está o modelo. A empresa já centralizou os modelos no gateway **NewAPI**; você só precisa preencher três valores:

**1.** Abra o DSH Desktop → canto inferior esquerdo **Configurações (⚙️)** → **serviço de modelos / provedor de modelos**.

**2.** Adicione «**Provider personalizado**» ou «**compatível com OpenAI**».

**3.** Preencha os três itens abaixo:

| Campo | O que preencher |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | a chave `sk-` solicitada no NewAPI (veja o capítulo 5) |
| Modelo | `deepseek-chat` (padrão da empresa; pode escolher outros modelos liberados) |

**4.** Salve.

> ⚠️ **Importante**: a API Base URL deve usar o **IP de intranet** (`http://IP:3000/v1`), não `localhost`, senão não conecta ao servidor da empresa.

## 3.3 Começar a conversar

1. Clique em «**+ nova conversa**»;

2. Digite na caixa e pressione Enter para enviar;

3. Receber a resposta indica que a cadeia está normal.

> 💡 **Experimente**: envie «escreva um e-mail educado de cobrança para um cliente» e veja como a IA responde. Depois tente «traduza o texto abaixo para inglês: ……». O DSH Desktop suporta conversas de várias rodadas; você pode continuar perguntando e pedir à IA para alterar.

## 3.4 Funções e dicas comuns

| Função | Como usar |
| --- | --- |
| Alternância de modelos | No topo da conversa, selecione modelos diferentes (se a empresa liberou vários) |
| Leitura/escrita de arquivos / ferramentas MCP | Configurações → MCP, habilite as ferramentas da empresa (como sistema de arquivos) para a IA ler arquivos locais |
| Tema escuro/claro | Configurações → aparência |
| Problema de proxy de rede | Erro «tempo de conexão esgotado» → Configurações → rede/proxy → «não usar proxy / conexão direta» |

## 3.5 Dicas de perguntas

> ✅ **Quanto mais específico, melhor** — dê contexto, deixe claro o que quer e forneça exemplos; a qualidade da resposta melhora.

> 💡 Bom exemplo: «Você é um redator sênior, escreva uma descrição de produto de 200 palavras para leitores CTO, em tom profissional e contido» — muito melhor do que «escreva uma descrição».

- **Dê um papel**: «Você é um especialista financeiro, me ajude a…»;

- **Dê restrições**: «limite a 100 palavras / use tabela / em três passos»;

- **Dê exemplos**: «reescreva seguindo este formato…»;

- **Pergunte por etapas**: se não gostar, «ajuste de novo», «mude o tom».

> 📖 Documentação oficial:guia rápido do DSH Desktop https://www.dshdesktop.com/docs/guide/getting-started/ · repositório open source https://github.com/dataelement/dsh-desktop

---

[← Capítulo 2: AI All In One Hub (portal)](ch02-hub.md) · [📖 Índice](index.md) · [Capítulo 4: Ferramenta 2: Dify →](ch04-dify.md)
