# Capítulo 5: Implementación independiente de Dify

*Parte I · Implementación*

> Dify se implementa de forma independiente con el compose oficial (unos 15 contenedores) para evitar conflictos de puertos.

[← Capítulo 4: Iniciar los servicios principales](ch04-start.md) · [📖 Índice](index.md) · [Capítulo 6: Keycloak: Realm, usuarios y AD →](ch06-keycloak.md)

---

> 📌 Dify usa el docker-compose oficial (con ~15 contenedores); se implementa de forma independiente para evitar conflictos de puertos y usa su propia red por defecto (distinta de la red `ai-platform` de los servicios principales).

## 5.1 Clonar Dify

```
# Opción A: GitHub (requiere acceso)
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# Opción B: espejo oficial de Gitee (recomendado en China)
git clone https://gitee.com/dify_ai/dify.git
```

## 5.2 Corregir compatibilidad + copiar las variables de entorno

```
cd dify\docker

# Corregir el formato de env_file (compatibilidad con versiones antiguas de Docker Compose)
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# Copiar las variables de entorno principales
copy .env.example .env

# Copiar todas las subplantillas (sandbox.env, etc.)
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $t = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}

# Corregir el problema de validación upstream de Dify 1.16.1 (obligatorio)
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# Verificación
docker compose config --quiet
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
```

> ⚠️ Por qué hay que cambiar `GRAPH_ENGINE_SCALE_UP_THRESHOLD`: Dify 1.16.1 elevó este campo de «permite 0» a «debe ser > 0», pero la plantilla de `shared.env` sigue en 0. Si no lo cambias, los 4 contenedores `dify-api-1` / `worker` / `worker_beat` / `api_websocket` se caen al arrancar con el registro `ValidationError: Input should be greater than 0`.

## 5.3 Iniciar Dify

```
docker compose up -d
docker compose ps
```

> ✅ Todos los contenedores `Up` (que `init_permissions` muestre Exited es normal). Abre `http://127.0.0.1/install` en el navegador para inicializar la cuenta de administrador.

## 5.4 Corregir la dirección WebSocket (si no, se conectará repetidamente a ws://localhost)

En `.env`, `NEXT_PUBLIC_SOCKET_URL` es por defecto `ws://localhost`; en una implementación de intranet, el localhost del navegador apunta al propio equipo del usuario, por lo que el frontend falla al conectarse repetidamente (la creación de aplicaciones y la depuración de flujos de trabajo se quedan bloqueadas).

```
# En .env cámbialo por la IP de intranet
NEXT_PUBLIC_SOCKET_URL=ws://<IP-del-servidor>

# En docker-compose.yaml cambia también el fallback del servicio web
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<IP-del-servidor>}

# Reconstruye el contenedor web para que surta efecto
docker compose up -d web
```

> 📌 Tras cambiarlo, fuerza la recarga del navegador (Ctrl+F5). Esta variable se lee en tiempo de ejecución; basta con cambiar .env + reiniciar web, sin necesidad de reconstruir la imagen.

## 5.5 Consulta rápida de escollos

> ⚠️ **La contraseña de inicio de sesión se transmite en base64**: en Dify 1.16.x, el `password` de la interfaz de inicio de sesión `POST /console/api/login` es la contraseña codificada en base64. En un script de inicio de sesión hay que hacer primero `base64(contraseña)`; si en el frontend «al hacer clic en iniciar sesión no pasa nada», el `GET /account/profile 401` de la consola es normal cuando no se ha iniciado sesión.

> ⚠️ **Restablecer la contraseña de administrador olvidada**: el hash de contraseña de Dify es `pbkdf2_hmac('sha256', password, salt, 10000)` (10000 iteraciones) y no se puede invertir; restablécela con un comando del contenedor (la nueva contraseña debe tener ≥ 8 caracteres):

```
docker exec dify-api-1 flask reset-password \
  --email ai_all_in_one_admin@<dominio-empresa> \
  --new-password '<nueva-contraseña>' \
  --password-confirm '<nueva-contraseña>'
```

> 📖 Documentación oficial:Documentación oficial de Dify https://docs.dify.ai · Implementación autoalojada https://docs.dify.ai/getting-started/install-self-hosted

---

[← Capítulo 4: Iniciar los servicios principales](ch04-start.md) · [📖 Índice](index.md) · [Capítulo 6: Keycloak: Realm, usuarios y AD →](ch06-keycloak.md)
