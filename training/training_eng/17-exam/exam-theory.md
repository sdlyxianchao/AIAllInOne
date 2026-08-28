# AI AllInOne Final Exam — Theory Question Bank (100 Q)

> 100 questions, answers inline. 90 minutes, closed book.

## Single choice (50 × 1 pt)

1. [M01] DSH Desktop API address → B http://<IP>:3000/v1
2. [M01] Unified login via → A Keycloak SSO
3. [M01] Grafana port → B 3030
4. [M01] Redaction happens at → C LiteLLM (before leaving)
5. [M01] DSH Desktop download entry → C Ghost /dsh/
6. [M02] .env change effective via → B docker compose up -d
7. [M02] container-to-container → B container name (ai-platform)
8. [M02] Windows Docker backend → C WSL2
9. [M02] Dify required env fix → A GRAPH_ENGINE_SCALE_UP_THRESHOLD (0→50)
10. [M03] shared realm → B enterprise-ai
11. [M03] Client Secret requires → A Client authentication
12. [M03] AD username attribute → C sAMAccountName
13. [M03] AD search scope → B Subtree
14. [M04] channel Base URL → B http://litellm:4000
15. [M04] internal mode → C Personal use
16. [M04] token endpoint for container → C host.docker.internal:9090
17. [M04] SSO 403 fix → B promote role=100
18. [M05] LiteLLM host verify → B intranet IP:4001
19. [M05] global guardrail → A default_on:true
20. [M05] Presidio env → B bare base URL
21. [M06] Dify model endpoint → B http://host.docker.internal:3000/v1
22. [M06] login password transport → C base64
23. [M06] High-quality KB needs default → B embedding
24. [M06] Knowledge API key scope → B account-level
25. [M07] Ghost admin entry → B :8090/ghost/
26. [M07] login code view → B MailHog :8025
27. [M07] homepage Register 500 → B members magic-link needs SMTP
28. [M08] Runner token update → B up -d
29. [M08] sync download rule → B only newer
30. [M08] workflow dir → B .gitea/workflows/
31. [M09] add MCP first click → B Skip to manual configuration
32. [M09] market_url must use → B hostname (IP redacted)
33. [M10] search_knowledge API → B /v1/datasets/{id}/hit-testing
34. [M10] MCP vs Skill → B tools vs skill packages
35. [M11] init role → B ai-platform-admin
36. [M11] per-module role → B admin:<product>
37. [M11] frontend change → B browser refresh
38. [M12] :8091 403 → B service up, normal
39. [M13] Prometheus port → B 9091
40. [M13] container metrics → B cadvisor
41. [M14] Langfuse traces from → B LiteLLM success_callback
42. [M14] no traces check → B V4_WRITE_MODE=dual
43. [M15] Loki vs ELK → B labels-only indexing
44. [M15] Promtail source → B /var/lib/docker/containers/*/*-json.log
45. [M16] MailHog role → B catch Ghost code mails without SMTP
46. [M17] health-check success → B ALL CLEAR + Fail: 0
47. [M02] container→host Ollama → A host.docker.internal:11434
48. [M03] mismatched unified email → B SSO cross-account/duplicates
49. [M10] DIFY_API_BASE → B http://<IP>/v1
50. [M06] forgot admin password → B flask reset-password

## Multiple choice (15 × 2 pts, all correct to score)

51. [M02] 🔴 must-fill .env vars (ABCD) — DEEPSEEK_API_KEY / LITELLM_MASTER_KEY / KEYCLOAK_ADMIN_PASSWORD / SESSION_SECRET
52. [M03] Keycloak protocols/federation (ABCD) — OIDC / OAuth2 / SAML2 / LDAP-AD
53. [M03] AD common mistakes (ABC) — DOMAIN\user bind / cn as username attr / One Level scope
54. [M04] separate tokens benefit (ABCD) — per-use stats / disable individually / permission isolation / fault location
55. [M05] built-in regex covers (ABC) — CN mobile / CN ID / email
56. [M05] semantic cache prereqs (ABC) — redis-stack image / Ollama bge-m3 / REDIS_PASSWORD var
57. [M06] Dify app types (ABCD) — chatbot / text gen / agent / workflow+chatflow
58. [M06] RAG params tunable (ABC) — top_k / score_threshold / hybrid
59. [M08] Runner pitfalls (ABC) — container.network / docker.sock duplicate / force_pull
60. [M09] DSH Desktop features (ABCD) — multi-model / MCP tools / Skills / local file IO
61. [M10] built-in tools (ABCD) — platform_time / echo / services / search_knowledge
62. [M10] RAG 3 pitfalls (ABC) — network gap / account-level key / full path+encoding
63. [M11] Admin Center features (ABCD) — container status / cost-audit / backup / unified logs
64. [M13] preset alert rules (ABC) — down critical / mem>90% / cpu>80%
65. [M17] agent-suitable tasks (ABC) — health check / backup / config changes

## True/False (25 × 0.5 pt)

66. [M01] All model calls leave intranet, no redaction needed. F
67. [M02] restart re-reads .env. F
68. [M02] prefer <SERVER_IP> or 127.0.0.1 over localhost. T
69. [M03] Keycloak data in keycloak-data volume survives rebuild. T
70. [M03] Bind DN can use DOMAIN\user. F
71. [M04] authorize endpoint should also be host.docker.internal. F
72. [M04] after setting server address to intranet, debug via intranet too. T
73. [M05] platform runs main-latest. F (v1.95.1)
74. [M05] semantic cache best for real-time personalization. F
75. [M06] Dify shares the main compose network. F
76. [M06] profile 401 means backend down. F
77. [M07] install latest official themes from GitHub. F
78. [M07] delete ghost-data volume to fix MySQL error. F
79. [M08] dsh-sync uses a normal repo, not mirror. T
80. [M08] mount docker.sock again in options. F
81. [M09] SSE "legacy-only" notice is normal. T
82. [M09] Skills install only via marketplace. F (folder/ZIP/URL)
83. [M10] skills/ needs restart to be scanned. F
84. [M10] built-in difyKnowledge beats gateway for governance. F
85. [M11] non-admin sees "not an admin". T
86. [M11] backups should be mirrored off-box. T
87. [M13] alert rules need {name!=""} against systemd noise. T
88. [M14] /auth/sso-initiate 200 shell is normal. T
89. [M15] Promtail can mount C:\...\containers. F
90. [M17] "delete all old backups directly" is good practice. F

## Short answer / scenario (10 × 2 pts, keyword scoring)

91. [M03] SSO authorization-code flow (redirect → Keycloak → callback → token → session). 4 steps.
92. [M04] Why channel Base URL `litellm:4000` not localhost? Same ai-platform network; container name resolves; localhost = the container itself.
93. [M05] Guardrail not firing? missing default_on:true; Presidio env with /analyze (use base URL).
94. [M06] KB no hits? default embedding → index completed → retrieval params → doc/chunk quality.
95. [M07] Ghost admin login? email → code to MailHog :8025; or Admin Center TOTP auto-login.
96. [M08] Runner job fails? docker logs runner → force_pull image → container.network → docker.sock.
97. [M09] DSH Desktop can't connect? Base URL (intranet+/v1) → NewAPI reachable → token/quota → model name.
98. [M10] RAG 404/empty? DIFY_API_BASE /v1 → key/dataset_id → network (host IP) → UTF-8.
99. [M11] Revoked admin still works? revocation includes product-side delete (SSO revoke / API delete); check provisioning result.
100. [M17] "verify, don't believe" in practice? demand command proof (HTTP codes, log lines, ls) especially "fixed" claims.
