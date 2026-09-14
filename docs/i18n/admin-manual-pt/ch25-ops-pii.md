# Capítulo 25: Anonimização de PII (Presidio)

*Parte 2 · Gestão (operações diárias de cada produto)*

> Informações sensíveis são anonimizadas automaticamente antes de sair da intranet.

[← Capítulo 24: Logs unificados (Loki)](ch24-ops-loki.md) · [📖 Índice](index.md) · [Capítulo 26: MailHog: receptor de e-mails →](ch26-ops-mailhog.md)

---

## 25.1 Duas camadas de anonimização

| Camada | Capacidade |
| --- | --- |
| Regex integrada do LiteLLM (`litellm_content_filter`) | Celular, CPF, cartão bancário, e-mail, código unificado de crédito social, passaporte, IPv4 etc.; ao corresponder, substitui por `[xxx_REDACTED]`; ao corresponder à lista negra de palavras sensíveis, bloqueia com BLOCK |
| Microsoft Presidio | Entidades mais granulares (nomes em inglês, e-mail etc.), `presidio-analyzer` 5002 / `presidio-anonymizer` 5001 |

## 25.2 Regras de regex integradas

| Regra | Regex | Tipo |
| --- | --- | --- |
| Celular chinês | `\b1[3-9]\d{9}\b` | cn_mobile |
| Número de CPF | `\b\d{17}[\dXx]\b` | cn_id |
| Número de cartão bancário | `\b\d{16,19}\b` | bank_card |
| E-mail | prebuilt `email` | email |
| Código unificado de crédito social | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| Número de passaporte | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

A lista negra de palavras sensíveis fica em `blocked_words` do `litellm-config.yaml`, adicionada/removida conforme a realidade da empresa (`confidencial interno`, `segredo comercial` etc.).

## 25.3 Ativar o Presidio (atualmente comentado)

Com a mudança da API de guardrail do LiteLLM, a seção do Presidio está comentada no momento. Pontos para ativar:

- guardrails precisam de `default_on: true` para valer globalmente;

- as variáveis de ambiente de endpoint `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` devem conter apenas a base URL (o LiteLLM concatena `/analyze`, `/anonymize`; com caminho, vira `/analyze/analyze` e dá 404).

> ⚠️ A imagem tem cerca de 965MB e é muito lenta de baixar na China (cerca de 1 hora em testes); se não conseguir baixar, use primeiro a regex integrada (já cobre as PII chinesas principais).

## 25.4 Verificação

Envie uma requisição com celular/e-mail → na resposta do modelo, os valores originais são substituídos por `[REDACTED]`; envie uma requisição com «confidencial interno» → retorna diretamente `Content blocked`.

> 📖 Documentação oficial:Microsoft Presidio https://microsoft.github.io/presidio/ · código-fonte https://github.com/microsoft/presidio

---

[← Capítulo 24: Logs unificados (Loki)](ch24-ops-loki.md) · [📖 Índice](index.md) · [Capítulo 26: MailHog: receptor de e-mails →](ch26-ops-mailhog.md)
