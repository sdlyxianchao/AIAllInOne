# Capítulo 13: Lista de verificação de interconexão

*Parte 1 · Implantação*

> Após concluir a implantação, confirme item por item que as 12 cadeias de interconexão estão todas abertas.

[← Capítulo 12: Central de Administração de IA](ch12-admin-center.md) · [📖 Índice](index.md) · [Capítulo 14: Gestão diária do Keycloak →](ch14-ops-keycloak.md)

---

A parte de implantação termina aqui. Por fim, valide os 12 itens abaixo um a um; somente com todos ✅ a plataforma estará realmente funcionando.

| # | Interconexão | Método de verificação |
| --- | --- | --- |
| 1 | NewAPI → LiteLLM | Teste de canal do NewAPI recebe OK |
| 2 | Dify → NewAPI | Teste do provedor de modelos do Dify recebe resposta |
| 3 | DSH Desktop → NewAPI | Enviar mensagem no DSH Desktop recebe resposta |
| 4 | Keycloak → NewAPI | Login OIDC no NewAPI com conta Keycloak |
| 5 | Keycloak → Dify | Login SSO no Dify com conta Keycloak |
| 6 | MCP Gateway → DSH Desktop | DSH Desktop obtém a lista de ferramentas MCP e as chama |
| 7 | MCP Gateway → Dify | Fluxo de trabalho do Dify chama a ferramenta MCP |
| 8 | Gitea Runner → Docker | Runner executa tarefas de CI/CD |
| 9 | Gitea → Servidor de Atualização | Artefatos de CI podem ser enviados ao Servidor de Atualização |
| 10 | Ghost API → Gitea | Gitea Actions pode chamar a API do Ghost para publicar avisos |
| 11 | Ghost → redirecionamento para Dify | «Workbench de IA» do portal redireciona corretamente ao Dify |
| 12 | Central de Administração de IA | Dashboard mostra todos os contêineres + menu lateral acessa todos os produtos |

> ✅ Após passar em todos, continue lendo a Parte 2 «Gestão» para aprender as operações diárias de cada produto, e a Parte 3 «Operações» para backup, verificação de integridade e solução de problemas.

---

[← Capítulo 12: Central de Administração de IA](ch12-admin-center.md) · [📖 Índice](index.md) · [Capítulo 14: Gestão diária do Keycloak →](ch14-ops-keycloak.md)
