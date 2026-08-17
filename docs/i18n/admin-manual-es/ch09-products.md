# Capítulo 9: Configuración de Dify / Ghost / Gitea

*Parte I · Implementación*

> Inicialización y configuración de interconexión de cada uno de los tres productos.

[← Capítulo 8: LiteLLM: verificación y caché](ch08-litellm.md) · [📖 Índice](index.md) · [Capítulo 10: Distribución de DeepChat y CI/CD →](ch10-deepchat.md)

---

## 9.1 Dify: configurar el proveedor de modelos

1. Abre `http://<IP-del-servidor>` → en la primera vez configura el correo/contraseña del administrador (correo `ai_all_in_one_admin@<dominio-empresa>`);

2. **Configuración → Proveedor de modelos** → OpenAI-API-compatible → añadir modelo:

- Nombre del modelo `deepseek-chat` (según el real);

- API Key: el `sk-xxx` de `dify-key`;

- API endpoint: `http://host.docker.internal:3000/v1`.

3. Estudio → crear asistente de chat → elegir modelo → enviar un mensaje para verificar.

> ⚠️ Dify usa `host.docker.internal` y no el nombre de contenedor, porque Dify está en su propia red, distinta de la de NewAPI.

## 9.2 Ghost: configurar el portal

1. Entrada del panel: `http://<IP-del-servidor>:8090/ghost/` (**atención al sufijo /ghost/**). La primera vez se sigue el asistente de setup para crear el administrador (correo `ai_all_in_one_admin@<dominio-empresa>`, contraseña ≥ 10 caracteres);

2. Automatización: ejecuta directamente `scripts\ghost-setup.ps1` para crear el administrador de una vez mediante la API de setup, equivalente al asistente (si ya está inicializado se omite automáticamente);

3. **Tema**: Apariencia → Tema; activa directamente los incluidos Casper/Source;

4. **Menú de navegación**: Apariencia → Menú → crea la «Navegación principal».

| Elemento del menú | Tipo | URL |
| --- | --- | --- |
| Inicio | Página | `/` |
| Noticias | Categoría | `/category/news` |
| Centro de descargas | Página | `/downloads` |
| Banco de trabajo de IA | Enlace personalizado | `http://<IP-del-servidor>` |
| Documentación de ayuda | Categoría | `/category/docs` |

1. **Página del centro de descargas**: Página → crea «Centro de descargas» (slug `downloads`), con el enlace de intranet del instalador de DeepChat en el contenido.

```
## DeepChat Edición empresarial
### Windows
- [DeepChat v1.1.0 (Windows x64)](http://<IP-del-servidor>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe)
### macOS
- [DeepChat v1.1.0 (macOS x64)](http://<IP-del-servidor>:8091/deepchat/DeepChat-1.1.0-mac-x64.dmg)
```

> ⚠️ No hagas clic en «Registrarse» en la portada del portal `/` — es el registro de suscriptores visitantes (sin SMTP configurado da 500); la entrada del administrador es `/ghost/`. No instales temas de última versión desde GitHub (pueden ser para Ghost 6.x y dar incompatible con 5.x).

## 9.3 Gitea: inicialización y registro del Runner

1. Abre `http://<IP-del-servidor>:3002` → asistente de instalación (la base de datos SQLite ya está preconfigurada) → crea el administrador (nombre de usuario `ai_all_in_one_admin`);

2. Avatar de la esquina superior derecha → **Site Administration → Actions** → confirma que Enabled Actions está activado;

3. **Runners → Create new Runner** → copia el Registration Token;

4. Rellena `GITEA_RUNNER_TOKEN` de `.env` con el Token y reconstruye el Runner:

```
# ⚠️ Debe usarse up -d, no restart (restart no relee el token de .env)
docker compose -f docker-compose.yml up -d gitea-runner
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

> ⚠️ Escollo 1: el error `readonly database` suele deberse a que `gitea.db` pertenece a root; elimina esa db de root para que se recree con el usuario git.
 ⚠️ Escollo 2: `ROOT_URL` debe configurarse como `http://<IP-del-servidor>:3002/`; de lo contrario, los enlaces de repositorio generados son localhost y no funcionan para los empleados.

> 📖 Documentación oficial:Dify https://docs.dify.ai · Ghost https://ghost.org/docs/ · Gitea (en chino) https://docs.gitea.com/zh-cn

---

[← Capítulo 8: LiteLLM: verificación y caché](ch08-litellm.md) · [📖 Índice](index.md) · [Capítulo 10: Distribución de DeepChat y CI/CD →](ch10-deepchat.md)
