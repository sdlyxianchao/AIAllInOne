# LiteLLM + Presidio — References (learning resources)

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch08 | `../../docs/admin-manual/ch08-litellm.md` |
| Admin Manual ch16 (ops) | `../../docs/admin-manual/ch16-ops-litellm.md` |
| Admin Manual ch25 (PII/Presidio) | `../../docs/admin-manual/ch25-ops-pii.md` |
| Deployment Guide §6.3, §13.1 | `../../windows/windows-deploy-guide-v2.en.html` |
| Live config | `../../windows/litellm-config.yaml` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| LiteLLM docs | https://docs.litellm.ai/ |
| Presidio guardrail | https://docs.litellm.ai/docs/proxy/guardrails/presidio |
| Caching | https://docs.litellm.ai/docs/proxy/caching |
| LiteLLM source | https://github.com/BerriAI/litellm |
| Presidio docs | https://microsoft.github.io/presidio/ |
| Presidio source (community-maintained) | https://github.com/data-privacy-stack/presidio |

## Articles
| Article | Link |
|---|---|
| LiteLLM production gateway (-70% cost) | https://blog.csdn.net/qq_73472828/article/details/160699220 |
| Self-hosted AI gateway with LiteLLM (EN) | https://niteagent.com/blog/build-self-hosted-ai-gateway-litellm |
| Presidio CN text scanning & caveats | https://blog.csdn.net/qq_29490749/article/details/140938216 |
| Presidio intro (Analyzer/Anonymizer/Recognizers) | https://developer.mamezou-tech.com/zh-CN/blogs/2025/01/04/presidio-intro/ |
| Presidio for AI privacy | https://www.toutiao.com/article/7654962916076962350 |

## Self-study path
1. `package.md` → chain + 4 pitfalls; 2. labs (direct call → redaction → cache hit → Langfuse); 3. CSDN production article (routing/fallback/budget) then official docs; 4. Presidio CN tuning (spaCy zh model / custom Recognizers) as needed — built-in regex already covers core CN PII.
