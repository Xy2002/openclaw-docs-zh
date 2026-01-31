---
summary: Model providers (LLMs) supported by OpenClaw
read_when:
  - You want to choose a model provider
  - You need a quick overview of supported LLM backends
---
# 模型提供商

OpenClaw 支持众多大语言模型提供商。选择一个提供商并完成身份验证后，即可通过 `provider/model` 设置默认模型。

正在寻找聊天频道文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）等）？请参阅 [频道](/channels)。

## 重点推荐：Venius（Venice AI）

Venius 是我们推荐的 Venice AI 设置，专为注重隐私的推理而设计，并可针对复杂任务选择使用 Opus 模型。

- 默认设置：`venice/llama-3.3-70b`
- 综合表现最佳：`venice/claude-opus-45`（Opus 依然是最强的模型）

更多信息请参见 [Venice AI](/providers/venice)。

## 快速入门

1) 使用提供商的身份验证方式（通常通过 `openclaw onboard`）进行认证。
2) 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

## 各提供商文档

- [OpenAI（API + Codex）](/providers/openai)
- [Anthropic（API + Claude Code CLI）](/providers/anthropic)
- [Qwen（OAuth）](/providers/qwen)
- [OpenRouter](/providers/openrouter)
- [Vercel AI 网关](/providers/vercel-ai-gateway)
- [Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
- [OpenCode Zen](/providers/opencode)
- [Amazon Bedrock](/bedrock)
- [Z.AI](/providers/zai)
- [小米](/providers/xiaomi)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venius（Venice AI，注重隐私）](/providers/venice)
- [Ollama（本地模型）](/providers/ollama)

## 转录提供商

- [Deepgram（音频转录）](/providers/deepgram)

## 社区工具

- [Claude Max API 代理](/providers/claude-max-api-proxy) - 将 Claude Max/Pro 订阅用作与 OpenAI 兼容的 API 端点

如需查看完整的提供商目录（xAI、Groq、Mistral 等）以及高级配置信息，请参阅 [模型提供商](/concepts/model-providers)。
