---
summary: Model providers (LLMs) supported by OpenClaw
read_when:
  - You want to choose a model provider
  - You want quick setup examples for LLM auth + model selection
---
# 模型提供商

OpenClaw 可以使用众多大语言模型提供商。选择一个提供商，进行身份验证，然后将默认模型设置为 `provider/model`。

## 亮点：Venius（Venice AI）

Venius 是我们推荐的 Venice AI 设置，专为注重隐私的推理而设计，并提供在最困难的任务中使用 Opus 的选项。

- 默认：`venice/llama-3.3-70b`
- 综合表现最佳：`venice/claude-opus-45`（Opus 依然是最强的模型）

详情请参阅 [Venice AI](/providers/venice)。

## 快速入门（两步）

1) 向提供商进行身份验证（通常通过 `openclaw onboard`）。
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
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venius（Venice AI）](/providers/venice)
- [Amazon Bedrock](/bedrock)

如需查看完整的提供商目录（xAI、Groq、Mistral 等）以及高级配置，请参阅 [模型提供商](/concepts/model-providers)。
