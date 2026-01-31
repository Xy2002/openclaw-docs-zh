---
summary: Use OpenRouter's unified API to access many models in OpenClaw
read_when:
  - You want a single API key for many LLMs
  - You want to run models via OpenRouter in OpenClaw
---
# OpenRouter

OpenRouter提供一个**统一的API**，可通过单个端点和API密钥将请求路由到多种模型。它与OpenAI兼容，因此只需切换基础URL，大多数OpenAI SDK即可正常工作。

## CLI设置

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" }
    }
  }
}
```

## 注意事项

- 模型引用为`openrouter/<provider>/<model>`。
- 如需了解更多模型/提供商选项，请参阅[/concepts/model-providers](/concepts/model-providers)。
- OpenRouter在底层使用带有您的API密钥的Bearer令牌。
