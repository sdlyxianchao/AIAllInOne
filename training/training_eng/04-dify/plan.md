# Dify — Training Plan (M06, 6 h, D5)

## 1. Schedule

| Time | Content | Method |
|---|---|---|
| 09:00-09:30 | Overview + deploy troubleshooting | lecture |
| 09:30-10:30 | Lab 1: model providers (LLM+embedding) + chatbot | lab |
| 10:30-11:30 | Lab 2: KB + KB app + Knowledge API key | lab |
| 11:30-12:00 | Publish/embed + members | lecture |
| 14:00-15:00 | Lab 3: Agent app | lab |
| 15:00-16:00 | Lab 4: Workflow (retrieval + LLM + condition) | lab |
| 16:00-17:00 | Integrated: KB customer-service bot → publish to Ghost (S) | lab |

## 2. Lab Checklist

- [ ] Provider (deepseek-chat via host.docker.internal:3000/v1 + bge-m3 default) tested (S)
- [ ] Chatbot replies
- [ ] KB High quality indexed
- [ ] Chatflow retrieval hits (S)
- [ ] Knowledge API key recorded
- [ ] Agent with ≥1 tool
- [ ] Workflow with retrieval node
- [ ] App published with WebApp/embed
- [ ] (Bonus) Service API call

## 3. Homework

- 10+ item "Dify FAQ card"
- Read `../../Dify-RAG-接入实现方案.md` → draw RAG chain (DSH Desktop → MCP → Dify Knowledge API)
- Tune retrieval params and note effect

## 4. Failure Drills

- Endpoint missing /v1 → fail
- Embedding not default → KB error
- WebSocket localhost → debug hangs
- Wrong dataset → search_knowledge empty

## 5. Handoff

- Knowledge API key feeds M10
- Ghost embed is M07 content
