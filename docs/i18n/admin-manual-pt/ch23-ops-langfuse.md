# Capítulo 23: Observabilidade de LLM (Langfuse)

*Parte 2 · Gestão (operações diárias de cada produto)*

> Rastrear o prompt, a resposta, a latência, os tokens e o custo de cada chamada ao modelo.

[← Capítulo 22: Gestão de monitoramento e alertas](ch22-ops-monitoring.md) · [📖 Índice](index.md) · [Capítulo 24: Logs unificados (Loki) →](ch24-ops-loki.md)

---

**Entrada**: `http://<IP-do-servidor>:3010` (login automático via SSO, a entrada da Central de Administração de IA aponta para `/auth/sso-initiate?provider=KEYCLOAK`).

## 23.1 Componentes

| Componente | Uso |
| --- | --- |
| langfuse | Web UI + exibição de rastreamento (3010) |
| langfuse-worker | Processamento assíncrono de eventos |
| langfuse-postgres | Armazenamento de metadados |
| langfuse-clickhouse | Armazenamento de eventos/rastreamento |
| langfuse-minio | Armazenamento S3 de anexos/mídia |
| langfuse-redis | Fila |

O LiteLLM reporta automaticamente via `success_callback: ["langfuse"]` (`LANGFUSE_*` do `.env`).

## 23.2 Ver o rastreamento

1. Entre no Langfuse → selecione a organização `AI All In One` / projeto `AI Platform`;

2. A lista Traces mostra cada chamada; clique para ver prompt/resposta/modelo/latência/tokens/custo;

3. Use Session para relacionar conversas de múltiplas rodadas.

## 23.3 Solução de problemas

> ⚠️ Armadilhas críticas:
> - É obrigatório definir `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual` (tanto no web quanto no worker), senão o SDK antigo falha no reporte `trace-create` e os dados não aparecem;
> - Login SSO sem dados: a conta SSO (e-mail AD) é diferente da conta de inicialização, e o Langfuse cria automaticamente uma conta que não pertence a nenhuma organização. Correção (adicionar o usuário SSO à organização):

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<domínio-empresa>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

> 📖 Documentação oficial:documentação oficial do Langfuse https://langfuse.com/docs · self-hosting https://langfuse.com/self-hosting

---

[← Capítulo 22: Gestão de monitoramento e alertas](ch22-ops-monitoring.md) · [📖 Índice](index.md) · [Capítulo 24: Logs unificados (Loki) →](ch24-ops-loki.md)
