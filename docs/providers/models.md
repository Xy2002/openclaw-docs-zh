---
summary: Model providers (LLMs) supported by OpenClaw
read_when:
  - You want to choose a model provider
  - You want quick setup examples for LLM auth + model selection
---
# 模型提供商

OpenClaw 支持众多大语言模型提供商。选择一个提供商，完成身份验证，然后将默认模型设置为 `provider/model`。

## 亮点：维纽斯（威尼斯AI）

Venius是我们推荐的威尼斯AI设置，专为注重隐私的推理而设计，并提供在最棘手的任务中使用Opus的选项。

- 默认：`venice/llama-3.3-70b`
- 综合表现最佳：`venice/claude-opus-45`（Opus 依然是最强的模型）

详情请参阅 [威尼斯AI](/providers/venice)。

## 快速入门（两步）

1) 向提供商进行身份验证（通常通过 `openclaw onboard`)。
2) 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

## 支持的提供商（入门集合）

- [OpenAI（API + Codex）](/providers/openai)
- [Anthropic（API + Claude Code CLI）](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI网关](/providers/vercel-ai-gateway)
- [Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venius（Venice AI）](/providers/venice)
- [Amazon Bedrock](/bedrock)

如需查看完整的提供商目录（xAI、Groq、Mistral等）以及高级配置，请参阅[模型提供商](/concepts/model-providers)。
