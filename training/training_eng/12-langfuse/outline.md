# Langfuse — Training Outline (M14 · LLM Observability)

## 1. Positioning

LLM observability platform (port 3010): trace every model call — prompt, response, model, latency, tokens, cost — for back-tracing and cost/quality analysis; also Prompt Management & evaluation.

## 2. Data Flow

LiteLLM `success_callback: ["langfuse"]` auto-reports every call.

## 3. Learning Objectives

- Understand Langfuse architecture and data flow
- Login via Admin Center SSO auto-login
- Navigate Traces, Metrics/Cost pages
- Interpret trace data (model, latency, tokens, cost)
- Understand and resolve the two critical pitfalls (V4_WRITE_MODE, SSO org binding)

## 4. Resources

- Textbook: `textbook.md`; Plan: `plan.md`; Exam: `exam.md`
- References: `references.md`
- Platform docs: `../../docs/admin-manual/ch23-ops-langfuse.md`
- Official: langfuse.com/docs, self-hosting, videos
