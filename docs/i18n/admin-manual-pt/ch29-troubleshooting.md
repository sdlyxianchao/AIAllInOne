# Capítulo 29: Manual de solução de problemas

*Parte 3 · Operações*

> Consulta rápida por sintoma para localizar a causa raiz rapidamente.

[← Capítulo 28: Verificação de integridade e autoteste na inicialização](ch28-healthcheck.md) · [📖 Índice](index.md) · [Capítulo Ap: Índice de documentação oficial →](ch30-appendix.md)

---

## 29.1 Três passos gerais de solução

1. **Ver o status dos contêineres**: `docker ps -a` para encontrar Exited/Restarting;

2. **Ver os logs**: `docker logs <nome-do-contêiner> --tail 30`;

3. **Ver a verificação de integridade**: execute `health-check.ps1` para localizar o estágio com falha.

## 29.2 Tabela rápida de sintomas

| Sintoma | Causa raiz | Solução |
| --- | --- | --- |
| localhost não abre nenhum produto | Problema de compatibilidade com IPv6 `::1` do WSL2 | Use IP de intranet ou 127.0.0.1 |
| Ghost sempre Restarting, com ECONNREFUSED :3306 | Config de MySQL residual no volume | Forçar SQLite por variável de ambiente (capítulo 4) |
| 4 contêineres do Dify quebram no start com ValidationError | GRAPH_ENGINE_SCALE_UP_THRESHOLD=0 | Mudar para 50 (capítulo 5) |
| Teste de canal do NewAPI dá No connected db | Chave do canal preenchida com valor de exemplo | Preencher o valor real de `LITELLM_MASTER_KEY` |
| OIDC do NewAPI dá invalid_grant / Incorrect redirect_uri | Endereço do servidor é localhost | Definir endereço de intranet (capítulo 7) |
| Login do NewAPI dá 429 | Limitação de taxa das interfaces críticas | Limpar rateLimit:* do redis ou alterar .env |
| Dify reconecta repetidamente em ws://localhost ao criar app | Endereço WebSocket não alterado | NEXT_PUBLIC_SOCKET_URL com IP de intranet |
| Clicar em login no Dify não faz nada | Senha precisa de base64 / 401 por não logado é normal | Script: base64 antes; navegador: tentar de novo |
| Gitea dá readonly database | gitea.db com dono root | Apagar o db com dono root para recriar |
| Link de repositório do Gitea é localhost | ROOT_URL não alterado | Definir endereço de intranet |
| Login SSO dá unknown_error | Falha no encaminhamento de porta do AD (iphlpsvc) | Verificar iphlpsvc + rede Hyper-V |
| Keycloak não vê os usuários do domínio | Search scope = One Level | Mudar para Subtree |
| Langfuse não mostra dados | V4_WRITE_MODE ou conta SSO fora da organização | Definir dual; SQL para adicionar à organização (capítulo 23) |
| DeepChat dá tempo esgotado de conexão com o modelo | Cliente passou por proxy de sistema caído | Definir sem proxy/conexão direta |
| Loki não encontra logs | Usou o label job | Use `{container=~".+"}` |
| Presidio dá 404 /analyze/analyze | Endpoint com caminho | Preencher apenas a base URL |
| Após alterar server.js, nova interface dá 404 | up -d não relê a mudança do volume | docker restart admin-portal |

## 29.3 Comandos comuns

```
docker ps -a                                        # status de todos os contêineres
docker logs <contêiner> --tail 50                    # ver logs
docker compose up -d <serviço>                       # reconstruir um serviço
docker compose restart <serviço>                     # reiniciar um serviço (não relê .env)
docker system df                                     # ocupação de disco do Docker
C:\AIAllInOne\windows\scripts\health-check.ps1       # exame completo com um clique
```

---

[← Capítulo 28: Verificação de integridade e autoteste na inicialização](ch28-healthcheck.md) · [📖 Índice](index.md) · [Capítulo Ap: Índice de documentação oficial →](ch30-appendix.md)
