#!/bin/bash
# 修正版官方文档下载（英文文件名，Mintlify 站点 .md 导出）
set -u
TRAIN="/c/AIAllInOne/trainning"
dl() { # dir url outfile
  local dir="$TRAIN/$1/refs"; mkdir -p "$dir"
  local code=$(curl -sL --max-time 40 -o "$dir/$3" -w "%{http_code}" "$2" 2>/dev/null)
  local sz=$(wc -c < "$dir/$3" 2>/dev/null || echo 0)
  if [ "$code" = "200" ] && [ "$sz" -gt 100 ]; then
    echo "OK  [$1] $3 ($sz B)"
  else
    echo "FAIL [$1] $3 ($code $sz)"; rm -f "$dir/$3"
  fi
}
dl 04-dify "https://docs.dify.ai/getting-started/install-self-hosted.md" dify-selfhosted.md
dl 04-dify "https://docs.dify.ai/guides/knowledge-base/knowledge-base.md" dify-knowledge.md
dl 04-dify "https://docs.dify.ai/guides/workflow/workflow.md" dify-workflow.md
dl 04-dify "https://docs.dify.ai/guides/agent-plan/agent.md" dify-agent.md
dl 12-langfuse "https://langfuse.com/docs.md" langfuse-overview.md
dl 12-langfuse "https://langfuse.com/self-hosting.md" langfuse-selfhost.md
dl 12-langfuse "https://langfuse.com/docs/tracing.md" langfuse-tracing.md
dl 09-mcp-gateway "https://modelcontextprotocol.io/docs.md" mcp-overview.md
dl 09-mcp-gateway "https://modelcontextprotocol.io/docs/learn/architecture.md" mcp-architecture.md
dl 03-litellm-presidio "https://docs.litellm.ai/docs/proxy/guardrails/presidio.md" litellm-presidio.md
dl 03-litellm-presidio "https://docs.litellm.ai/docs/proxy/caching.md" litellm-caching.md
dl 03-litellm-presidio "https://docs.litellm.ai/docs/proxy/quick_start.md" litellm-quickstart.md
dl 15-docker-ollama "https://docs.ollama.com.md" ollama-overview.md
dl 15-docker-ollama "https://docs.ollama.com/quickstart.md" ollama-quickstart.md
dl 02-newapi "https://docs.newapi.pro/index.md" newapi-index.md
dl 02-newapi "https://docs.newapi.pro/guides/channel.md" newapi-channel.md
echo "=== done ==="
