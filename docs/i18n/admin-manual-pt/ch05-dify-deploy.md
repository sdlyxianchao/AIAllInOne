# Capítulo 5: Implantação independente do Dify

*Parte 1 · Implantação*

> O Dify é implantado independentemente com o compose oficial (cerca de 15 contêineres), evitando conflitos de porta.

[← Capítulo 4: Iniciar serviços principais](ch04-start.md) · [📖 Índice](index.md) · [Capítulo 6: Keycloak: Realm, usuários e AD →](ch06-keycloak.md)

---

> 📌 O Dify usa o docker-compose oficial (com ~15 contêineres), com implantação independente para evitar conflitos de porta, usando sua própria rede padrão (diferente da rede `ai-platform` dos serviços principais).

## 5.1 Clonar o Dify

```
# Opção A: GitHub (requer acesso)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Opção B: espelho oficial do Gitee (recomendado na China)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 Corrigir compatibilidade + copiar variáveis de ambiente

```
cd dify\docker

# Corrigir o formato env_file (compatível com Docker Compose antigo)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# Copiar as variáveis de ambiente principais
copy .env.example .env

# Copiar todos os subtemplates (sandbox.env etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Corrigir problema de validação upstream do Dify 1.16.1 (obrigatório)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# Verificar
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ Por que é obrigatório mudar `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: o Dify 1.16.1 elevou esse campo de «permitido 0» para «deve ser > 0», mas o template `shared.env` ainda está 0. Sem a mudança, os 4 contêineres `dify-api-1` / `worker` / `worker_beat` / `api_websocket` quebram logo ao iniciar, com o log `ValidationError: Input should be greater than 0`.

## 5.3 Iniciar o Dify

```
docker compose up -d
docker compose ps
```

> ✅ Todos os contêineres `Up` (`init_permissions` aparecendo como Exited é normal). Abra `http://127.0.0.1/install` no navegador para inicializar a conta de administrador.

## 5.4 Corrigir o endereço WebSocket (sem a mudança, fica reconectando em ws://localhost)

No `.env`, `NEXT_PUBLIC_SOCKET_URL` é por padrão `ws://localhost`; na implantação em intranet, o localhost do navegador aponta para o computador do próprio usuário, fazendo o frontend falhar repetidamente na conexão (a criação de aplicativos/depuração de fluxo de trabalho trava).

```
# No .env, troque para o IP de intranet
NEXT_PUBLIC_SOCKET_URL=ws://<IP-do-servidor>

# No docker-compose.yaml, altere em sincronia o fallback do serviço web
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<IP-do-servidor>}

# Reconstrua o contêiner web para aplicar
docker compose up -d web
```

> 📌 Após a mudança, force a atualização do navegador (Ctrl+F5). Essa variável é lida em tempo de execução; basta alterar o .env + reiniciar o web, sem reconstruir a imagem.

## 5.5 Consulta rápida de armadilhas

> ⚠️ **A senha de login é transmitida em base64**: no Dify 1.16.x, o `password` da interface de login `POST /console/api/login` é a senha codificada em base64. Scripts de login devem primeiro fazer `base64(senha)`; no frontend, quando «clicar em login não faz nada», o `GET /account/profile 401` no console é um fenômeno normal de não logado.

> ⚠️ **Redefinir senha de administrador esquecida**: o hash de senha do Dify é `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iterações), não é reversível; use o comando do contêiner para redefinir (nova senha ≥ 8 caracteres):

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<domínio-empresa> \
  --new-password '<nova-senha>' \
  --password-confirm '<nova-senha>'
```

> 📖 Documentação oficial:documentação oficial do Dify https://docs.dify.ai · implantação self-hosted https://docs.dify.ai/getting-started/install-self-hosted

---

[← Capítulo 4: Iniciar serviços principais](ch04-start.md) · [📖 Índice](index.md) · [Capítulo 6: Keycloak: Realm, usuários e AD →](ch06-keycloak.md)
