# Capítulo 18: Gestão diária do Ghost

*Parte 2 · Gestão (operações diárias de cada produto)*

> Portal corporativo / Hub: artigos, páginas, navegação, temas, membros.

[← Capítulo 17: Gestão diária do Dify](ch17-ops-dify.md) · [📖 Índice](index.md) · [Capítulo 19: Gestão diária do Gitea →](ch19-ops-gitea.md)

---

**Entrada**: frontend `http://<IP-do-servidor>:8090`; painel `http://<IP-do-servidor>:8090/ghost/` (atenção ao sufixo /ghost/).

## 18.1 Entrar no painel

O painel do Ghost 5 usa **login sem senha**: digite o e-mail → o Ghost envia um código de 6 dígitos ao MailHog (`:8025`). Um jeito mais rápido: na Central de Administração de IA, clique no botão «Abrir» de «Painel do Ghost», que conclui o login automaticamente (calcula o código TOTP localmente, sem consultar o e-mail).

## 18.2 Publicar conteúdo

1. **Artigos**: Posts → New post → escrever conteúdo (editor Markdown) → Publish;

2. **Páginas**: Pages → New page (como «Central de downloads», slug `downloads`);

3. **Tags/categorias**: Tags → criar categoria (como `news` / `docs`), e classificar os artigos na categoria.

## 18.3 Menu de navegação

1. Painel → Design → menus (Navigation);

2. Edite o menu principal «Primary», adicionando Início/Notícias/Central de downloads/Workbench de IA/Documentação de ajuda (veja a tabela de menus do capítulo 9).

## 18.4 Temas

- **Alternar**: Design → temas, ative diretamente os temas Casper / Source embutidos;

- **Instalar**: mercado de temas (Design → Change theme) ou upload de zip.

> ⚠️ Não instale temas da versão mais recente pelo GitHub (podem ser compatíveis com Ghost 6.x, e no 5.x dão incompatible); instale o zip de versão antiga.

## 18.5 Membros e assinaturas (se necessário)

- Members: gerenciar assinantes;

- Se não precisar de assinaturas, ignore este módulo (portais de intranet normalmente não usam).

## 18.6 Integrações (API Token)

1. Painel → Settings → Integrations → adicionar integração personalizada;

2. Gerar Admin API Key (formato `id:secret`), usada pelo Gitea Actions para publicar avisos e outras automações.

> ⚠️ Armadilhas críticas: ① não clique em «Registrar» na página inicial `/` (é o registro de visitantes/assinantes); ② o código de 6 dígitos é essencialmente TOTP, e a Central de Administração de IA consegue calculá-lo localmente; ③ mesmo calculando o código localmente, o Ghost ainda envia o e-mail de verdade, então o MailHog deve ser mantido (senão dá `Failed to send email`).

> 📖 Documentação oficial:documentação oficial do Ghost https://ghost.org/docs/ · painel de administração https://ghost.org/docs/admin/

---

[← Capítulo 17: Gestão diária do Dify](ch17-ops-dify.md) · [📖 Índice](index.md) · [Capítulo 19: Gestão diária do Gitea →](ch19-ops-gitea.md)
