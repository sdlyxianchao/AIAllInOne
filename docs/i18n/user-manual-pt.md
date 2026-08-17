# Manual do Usuário do AI AllInOne

*v0.2 · Guia de uso para funcionários*

**Início rápido**

## 1. Conhecendo a plataforma

> 📌 Observação: neste manual, `IP` refere-se ao endereço do servidor da intranet da empresa (exemplo `192.168.31.117`; na prática, siga o que o administrador divulgar). Todos os endereços usam o **IP de intranet**; não use `localhost` nem `127.0.0.1`.
### 1.1 O que é a plataforma
«AI AllInOne» é uma plataforma corporativa de IA implantada na intranet da empresa, que centraliza as capacidades dos grandes modelos (DeepSeek, GPT, Claude etc.) na rede interna; os funcionários usam com **uma única conta**. Você não precisa se preocupar com servidores, modelos ou chaves — basta lembrar das três entradas.
### 1.2 O que posso fazer com a plataforma
| O que você quer fazer | Qual usar | Onde abrir |
| --- | --- | --- |
| Conversar no dia a dia como no ChatGPT, escrever documentos, traduzir, corrigir código | 💬 DeepChat | Cliente de desktop (instale primeiro pelo portal) |
| Usar aplicações de IA prontas da empresa (QA de atendimento, assistente de aprovação etc.) | 🤖 Dify | Navegador `http://IP` |
| Enviar documentos para «perguntas e respostas da base de conhecimento» (consultar material interno) | 🤖 Dify | Navegador `http://IP` |
| Ver notícias da empresa, avisos, baixar software | 📰 Portal (Hub) | Navegador `http://IP:8090` |
| Solicitar você mesmo uma API Key para integrar ferramentas de terceiros | 🔑 NewAPI | Navegador `http://IP:3000` |
### 1.3 Como escolher entre as três entradas
> ✅ **Resumo em uma frase**: **conversar/escrever/traduzir → DeepChat**; **aplicações prontas da empresa / base de conhecimento → Dify**; **achar coisas / ver avisos / baixar software → portal Hub**. As três usam a mesma conta para login.
Método de login: todos os produtos usam a **conta unificada do Keycloak** (alguns também aceitam a conta de domínio AD da empresa, ou seja, a mesma conta de ligar o computador). Clique em «Entrar» e você será redirecionado à página de login unificada; digite a conta uma vez e os demais produtos não exigirão novo login.
### 1.4 Como usar este manual
- **Iniciante**: leia os capítulos 2~4 em ordem e instale o DeepChat para começar;
- **Integrar ferramentas de terceiros**: leia o capítulo 5 para solicitar uma Key;
- **Dúvidas**: consulte primeiro o FAQ do capítulo 7 e depois fale com o administrador;
- **Leitura obrigatória**: capítulo 6 (segurança de dados) e capítulo 8 (código de conduta) — todos devem cumprir.

## 2. AI All In One Hub (portal)

### 2.1 O que é o portal
Ghost**AI All In One Hub** é o portal corporativo da empresa (baseado no software open source Ghost), endereço `http://IP:8090`. É o **ponto de partida** da plataforma de IA.
### 2.2 Ver notícias / avisos
1. Abra `http://IP:8090` no navegador;
2. A página inicial traz as notícias e avisos mais recentes; clique no título para ler o texto completo.
### 2.3 Central de downloads (instalar o DeepChat)
1. Clique no menu «**Central de downloads**» no topo do portal, ou abra diretamente `http://IP:8090/downloads/`;
2. Escolha o instalador **Windows** / **macOS** conforme seu sistema e baixe o **DeepChat**;
3. Instalação: no Windows, dê dois cliques no .exe e siga o assistente; no macOS, abra o .dmg e arraste para «Aplicativos».
> ✅ O aviso «instale primeiro o Assistente de Skills» no topo da página de downloads é o pacote de skills para usuários avançados; usuários comuns podem ignorar.
### 2.4 Pular para o Dify / ajuda
- Clique no menu «**Workbench de IA**» do portal → pula direto para o Dify (plataforma de aplicações de IA);
- Clique em «**Documentação de ajuda**» → veja os artigos de ajuda organizados pela empresa.
> 📖 Documentação oficial:o portal é fornecido pelo Ghost; documentação oficial https://ghost.org/docs/

## 3. Ferramenta 1: DeepChat

### 3.1 Download e instalação
1. Abra a central de downloads do portal `http://IP:8090/downloads/`;
2. Baixe e instale o instalador conforme seu sistema;
3. Inicie o DeepChat.
### 3.2 Configurar o modelo (conectar ao gateway da empresa)
No primeiro uso, é preciso dizer ao DeepChat onde está o modelo. A empresa já centralizou os modelos no gateway **NewAPI**; você só precisa preencher três valores:
1Abra o DeepChat → canto inferior esquerdo **Configurações (⚙️)** → **serviço de modelos / provedor de modelos**.
2Adicione «**Provider personalizado**» ou «**compatível com OpenAI**».
3Preencha os três itens abaixo:
| Campo | O que preencher |
| --- | --- |
| API Base URL | `http://IP:3000/v1` |
| API Key | a chave `sk-` solicitada no NewAPI (veja o capítulo 5) |
| Modelo | `deepseek-chat` (padrão da empresa; pode escolher outros modelos liberados) |
4Salve.
> ⚠️ **Importante**: a API Base URL deve usar o **IP de intranet** (`http://IP:3000/v1`), não `localhost`, senão não conecta ao servidor da empresa.
### 3.3 Começar a conversar
1. Clique em «**+ nova conversa**»;
2. Digite na caixa e pressione Enter para enviar;
3. Receber a resposta indica que a cadeia está normal.
### 💡 **Experimente**: envie «escreva um e-mail educado de cobrança para um cliente» e veja como a IA responde. Depois tente «traduza o texto abaixo para inglês: ……». O DeepChat suporta conversas de várias rodadas; você pode continuar perguntando e pedir à IA para alterar.

    3.4 Funções e dicas comuns
| Função | Como usar |
| --- | --- |
| Alternância de modelos | No topo da conversa, selecione modelos diferentes (se a empresa liberou vários) |
| Leitura/escrita de arquivos / ferramentas MCP | Configurações → MCP, habilite as ferramentas da empresa (como sistema de arquivos) para a IA ler arquivos locais |
| Tema escuro/claro | Configurações → aparência |
| Problema de proxy de rede | Erro «tempo de conexão esgotado» → Configurações → rede/proxy → «não usar proxy / conexão direta» |
### 3.5 Dicas de perguntas
> ✅ **Quanto mais específico, melhor** — dê contexto, deixe claro o que quer e forneça exemplos; a qualidade da resposta melhora.
- 💡 Bom exemplo: «Você é um redator sênior, escreva uma descrição de produto de 200 palavras para leitores CTO, em tom profissional e contido» — muito melhor do que «escreva uma descrição».
    
      **Dê um papel**: «Você é um especialista financeiro, me ajude a…»;
- **Dê restrições**: «limite a 100 palavras / use tabela / em três passos»;
- **Dê exemplos**: «reescreva seguindo este formato…»;
- **Pergunte por etapas**: se não gostar, «ajuste de novo», «mude o tom».
> 📖 Documentação oficial:guia rápido do DeepChat https://deepchatai.cn/docs/guide/getting-started/ · repositório open source https://github.com/ThinkInAIXYZ/deepchat

## 4. Ferramenta 2: Dify

### 4.1 Entrar no Dify
1. Abra `http://IP` no navegador (porta 80, sem número de porta; também dá para entrar pelo «Workbench de IA» do portal);
2. Entre com a conta unificada (na primeira vez, pode ser preciso que o administrador crie a conta antes).
### 4.2 Usar aplicações de chat prontas
O administrador monta previamente algumas aplicações (como «perguntas sobre políticas da empresa», «assistente de atendimento»); usuários comuns apenas «usam»:
1. Após entrar, acesse a lista «**Studio / aplicações**»;
2. Encontre a aplicação desejada e clique em «**executar / pré-visualizar**» (botão de play no canto superior direito);
3. Faça as perguntas diretamente na página de conversa aberta.
### 4.3 Perguntas e respostas da base de conhecimento
Para «alimentar» a IA com documentos internos e fazer perguntas, use a **base de conhecimento** do Dify (é preciso permissão do administrador):
1. «**Base de conhecimento**» → «criar base de conhecimento»;
2. Envie documentos (aceita Word / PDF / Markdown / links de páginas etc.);
3. O sistema segmenta e indexa automaticamente;
4. «Referencie» essa base na aplicação e a IA passará a responder com base nos seus documentos.
> 📌 O conteúdo da base de conhecimento é usado pela IA para responder; obedeça às normas de segurança de dados do capítulo 6 — **não envie material confidencial**.
### 4.4 Montar uma aplicação simples por conta própria (avançado)
1. Studio → criar aplicação em branco → escolha «assistente de chat»;
2. Escreva um «prompt» dizendo à IA qual é o papel dela (como «você é o assistente de dúvidas do regulamento de ponto da empresa»);
3. Adicione a base de conhecimento → selecione o modelo → teste a pré-visualização → publique.
> 📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai

## 5. Solicitar API Key

Se você quer integrar a capacidade de IA da empresa a **ferramentas de terceiros** (seus próprios scripts, outros softwares compatíveis com a interface OpenAI), precisa de uma API Key (chave que começa com `sk-`).
### 5.1 Entrar no NewAPI
1. Abra `http://IP:3000` no navegador;
2. Entre com a conta unificada (ou clique em «login com um clique / OIDC» para usar a conta de domínio).
### 5.2 Criar um token
1. Menu à esquerda «**API Keys / tokens**»;
2. Clique em «**criar token**», dê um nome (como `meu script`), podendo definir cota e expiração;
3. Após salvar, copie a string `sk-xxxx` gerada. **É exibida só uma vez, salve imediatamente**.
### 5.3 Preencher no cliente
- **API Base URL**: `http://IP:3000/v1`
- **API Key**: a `sk-xxxx` copiada há pouco
### 5.4 Exemplos de uso comum
> 💡 Testar com curl:  
> 
>     `curl http://IP:3000/v1/chat/completions -H "Authorization: Bearer sk-xxxx" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"olá"}]}'`
> 
>     ⚠️ Quando a cota acabar, aparecerá «saldo insuficiente»; fale com o administrador para aumentar a cota. A Key equivale à sua senha de conta: **não envie a ninguém e não a envie para repositórios de código**.
> 📖 Documentação oficial:documentação oficial do NewAPI https://docs.newapi.pro · site oficial https://www.newapi.ai

## 6. Normas de segurança de dados

A plataforma já **anonimiza** automaticamente informações sensíveis como **celular, CPF, número de cartão bancário, e-mail** (mascara antes de enviar ao modelo) e bloqueia palavras sensíveis. Mas siga conscientemente as linhas vermelhas abaixo.
### 6.1 O que pode e o que não pode enviar
#### ❌ Proibido enviar à IA
- Segredos internos / comerciais (código de produto não publicado, preços, lista de clientes, cláusulas de contrato);
- Privacidade pessoal (CPF, número de cartão bancário, senhas, informações de saúde, privacidade de terceiros);
- Código-fonte / soluções técnicas não publicadas.
#### ✅ Pode usar com segurança
- Materiais públicos, conhecimento geral, redação de documentos, tradução, resumo;
- Dados de negócio já anonimizados (após remover nomes/números/campos sensíveis específicos).
### 6.2 Consulta rápida de classificação de dados
| Nível de dados | Pode ir ao modelo externo? | Descrição |
| --- | --- | --- |
| Dados públicos | ✅ Sim | Materiais já publicados, informações gerais |
| Dados internos comuns | ⚠️ Sim, após anonimização | Pode usar após remover campos sensíveis |
| Segredos internos / privacidade pessoal | ❌ Proibido | Jamais enviar |
> > Critério: **«se este conteúdo for visto por alguém de fora, haveria problema?»** Se sim → não envie.
### 6.3 Três cenários típicos
| Cenário | O que fazer |
| --- | --- |
| Escrever relatório semanal mencionando nome de cliente | Use «certo cliente», «cliente A» no lugar do nome real |
| Pedir à IA para analisar uma tabela de dados | Apague primeiro colunas como nome, telefone, CPF; deixe apenas dados agregados |
| Traduzir cláusulas de contrato | Apague primeiro valores, nomes das partes etc., ou use «parte A/parte B» |

## 7. Perguntas frequentes (FAQ)

### 7.1 Login / acesso
| Problema | Solução |
| --- | --- |
| Não consigo entrar em algum produto? | Confirme que usa o IP de intranet (não localhost) e a conta unificada; se persistir, fale com o administrador |
| A página de login não abre / fica carregando? | Confirme que está conectado à intranet da empresa (WiFi/cabo) e use `http://IP` em vez de localhost |
| Esqueci a senha da conta unificada? | Peça ao administrador para redefinir (ou recupere pela conta de domínio) |
### 7.2 Uso
| Problema | Solução |
| --- | --- |
| Aviso de cota insuficiente? | Verifique o saldo no painel do NewAPI; quando acabar, peça ao administrador para recarregar/aumentar |
| Conteúdo enviado foi bloqueado? | Acionou palavra sensível ou contém informação sensível; ajuste conforme as normas do capítulo 6 e tente de novo |
| DeepChat dá tempo de conexão esgotado? | Configurações → rede/proxy → «não usar proxy / conexão direta» |
| Resposta do modelo com baixa qualidade? | Troque de modelo ou otimize a pergunta (dê contexto, deixe claro o que quer, forneça exemplo) |
| Esqueceu onde baixar o DeepChat? | Central de downloads do portal `http://IP:8090/downloads/` |
| Dify fica carregando ao criar aplicação? | Geralmente é problema de rede/WebSocket; fale com o administrador; no navegador, force com Ctrl+F5 |
### 7.3 Cognição
| Problema | Solução |
| --- | --- |
| Posso confiar nas respostas da IA? | Não totalmente. A IA pode errar (alucinação); fatos, números e códigos importantes devem ser verificados manualmente |
| A IA lembra o que eu disse? | O contexto da conversa atual é mantido para respostas em várias rodadas; não digite informações confidenciais (veja o capítulo 6) |

## 8. Código de conduta

### 8.1 Normas de uso
- Não usar para fins ilegais; não gerar conteúdo ilegal, prejudicial ou que viole direitos;
- Não burlar as restrições de segurança da plataforma nem fazer uso em massa de cota;
- Ao enviar conteúdo gerado por IA para fora, verifique os fatos e obedeça às normas de publicação da empresa;
- Guarde bem a sua API Key, não empreste a terceiros nem envie para repositórios de código;
- Ao detectar anomalias (conta anômala, conteúdo anômalo), reporte ao administrador em tempo hábil.
### 8.2 Resumo em uma frase
> ✅ Use bem a IA para aumentar a produtividade, mas **não envie confidências, sempre verifique os fatos e siga as regras**. Em caso de dúvida, fale com o administrador da plataforma.

