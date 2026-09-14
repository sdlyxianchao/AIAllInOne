# Capítulo 4: Iniciar serviços principais

*Parte 1 · Implantação*

> Copiar o .env, subir os contêineres, validar o acesso serviço por serviço e tratar o problema conhecido de SQLite do Ghost.

[← Capítulo 3: Arquivos de configuração e variáveis de ambiente](ch03-env.md) · [📖 Índice](index.md) · [Capítulo 5: Implantação independente do Dify →](ch05-dify-deploy.md)

---

## 4.1 Copiar o .env

```
# PowerShell
copy .env.windows .env
```

O Docker Compose lê o `.env` por padrão.

## 4.2 Iniciar todos os serviços principais

```
docker compose -f docker-compose.yml up -d
```

Na primeira vez, todas as imagens serão baixadas (cerca de 5–10 minutos, dependendo da velocidade da rede).

| Imagem | Contêiner | Tamanho |
| --- | --- | --- |
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` + `gitea/act_runner` | gitea / runner | ~400MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |

## 4.3 Verificar o status dos contêineres

```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Espera-se que os 10 contêineres principais estejam todos `Up`. Se algum contêiner ficar constantemente `Restarting`, use `docker logs nome-do-contêiner` para ver a causa.

## 4.4 Correção de problema conhecido: Ghost forçando SQLite

Se o `ghost` ficar sempre em Restarting e o log mostrar `Error: connect ECONNREFUSED <IP-do-servidor>:3306` — significa que o volume de dados ainda contém um `config.production.json` antigo apontando para o MySQL. Correção: declare explicitamente SQLite em `environment` do serviço ghost no compose:

```
ghost:
  image: ghost:5-alpine
  environment:
    url: http://127.0.0.1:8090
    database__client: sqlite3
    database__connection__filename: /var/lib/ghost/content/data/ghost.db
    database__use_null_pool: "true"
  volumes:
    - ghost-data:/var/lib/ghost/content
```

```
docker compose up -d ghost
docker logs ghost --tail 20
```

> ⚠️ No Windows + Docker Desktop WSL2, os dados do volume ficam dentro do disco virtual do WSL2 e o git bash do host não os enxerga, portanto não dá para excluir diretamente o `config.production.json` de dentro do volume; a única saída é a rota de «sobrescrita por variável de ambiente». Também não execute `docker volume rm windows_ghost-data` (isso apagaria os artigos já publicados).

> ✅ Verificação: o log mostra `Ghost database ready` + `Ghost booted`, e `curl.exe -I http://127.0.0.1:8090` retorna 200.

## 4.5 Validar o acesso serviço por serviço

```
# Keycloak — 302 indica OK
curl.exe -I http://127.0.0.1:9090/admin/
# NewAPI — 200
curl.exe -I http://127.0.0.1:3000
# Ghost — 302 (redireciona para a página de inicialização /ghost/)
curl.exe -I http://127.0.0.1:8090
# Gitea — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002
# Servidor de Atualização — 403 (diretório vazio, nginx em execução)
curl.exe -I http://127.0.0.1:8091
# Central de Administração de IA — 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

O LiteLLM é uma API pura, sem interface Web; valide a partir de dentro do contêiner:

```
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models
# Resposta esperada: {"data":[{"id":"deepseek-chat",...}]}
```

> 📌 O proxy HTTP do Docker Desktop WSL2 pode fazer o LiteLLM ficar inacessível a partir do host (resposta HEART/vazia); é um bug conhecido e não afeta o NewAPI, que o chama pelo nome do contêiner.

---

[← Capítulo 3: Arquivos de configuração e variáveis de ambiente](ch03-env.md) · [📖 Índice](index.md) · [Capítulo 5: Implantação independente do Dify →](ch05-dify-deploy.md)
