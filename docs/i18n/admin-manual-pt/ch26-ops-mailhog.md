# Capítulo 26: MailHog: receptor de e-mails

*Parte 2 · Gestão (operações diárias de cada produto)*

> A «saída de e-mail» quando a intranet não tem SMTP, recebendo os códigos de verificação/e-mails de notificação do Ghost.

[← Capítulo 25: Anonimização de PII (Presidio)](ch25-ops-pii.md) · [📖 Índice](index.md) · [Capítulo 27: Backup e recuperação →](ch27-backup.md)

---

**Entrada**: `http://<IP-do-servidor>:8025` (caixa de entrada Web, SMTP 1025 apenas interno).

## 26.1 Por que ele é necessário

O painel do Ghost 5 usa login sem senha: ao digitar o e-mail, o Ghost envia uma mensagem com código de 6 dígitos. Sem SMTP na intranet, o e-mail não sai e o login dá `Failed to send email`. O MailHog funciona como a «saída de e-mail» que recebe essas mensagens.

## 26.2 Configuração do lado do Ghost

```
# variáveis de ambiente do Ghost no docker-compose.yml
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

## 26.3 Ver os e-mails

1. Abra `http://<IP-do-servidor>:8025` no navegador;

2. Na caixa de entrada, veja os códigos de verificação/e-mails de notificação enviados pelo Ghost.

## 26.4 Login sem senha do Ghost (login automático pela Central de Administração de IA)

O código de 6 dígitos do Ghost é essencialmente **TOTP** (`TOTP(admin_session_secret + userId)`, 6 dígitos/60 segundos/HMAC-SHA1). A Central de Administração de IA calcula o código localmente; ao clicar em «Painel do Ghost → Abrir», conclui automaticamente: login por senha → cálculo local do código → validação da sessão → gravação de cookie → entrada no painel, tudo sem fricção e sem consultar o MailHog.

> ⚠️ Mesmo calculando o código por conta própria, o Ghost ainda envia o e-mail de verdade, então o MailHog deve ser mantido, senão o login dá `Failed to send email`.

> 📖 Documentação oficial:repositório do código-fonte do MailHog https://github.com/mailhog/MailHog

---

[← Capítulo 25: Anonimização de PII (Presidio)](ch25-ops-pii.md) · [📖 Índice](index.md) · [Capítulo 27: Backup e recuperação →](ch27-backup.md)
