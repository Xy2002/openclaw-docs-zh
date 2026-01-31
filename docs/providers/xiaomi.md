---
summary: Use Xiaomi MiMo (mimo-v2-flash) with OpenClaw
read_when:
  - You want Xiaomi MiMo models in OpenClaw
  - You need XIAOMI_API_KEY setup
---
# 小米米么

小米米么是面向**MiMo**模型的API平台。它提供与OpenAI和Anthropic格式兼容的REST API，并使用API密钥进行身份验证。您可以在[小米米么控制台](https://platform.xiaomimimo.com/#/console/api-keys)中创建您的API密钥。OpenClaw使用带有小米米么API密钥的`xiaomi`提供商。

## 模型概览

- **mimo-v2-flash**: 上下文窗口为262144个标记，兼容Anthropic Messages API。
- 基础URL：`https://api.xiaomimimo.com/anthropic`
- 授权：`Bearer $XIAOMI_API_KEY`

## CLI设置

```bash
openclaw onboard --auth-choice xiaomi-api-key
# or non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 配置片段

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/anthropic",
        api: "anthropic-messages",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

## 注意事项

- 模型引用：`xiaomi/mimo-v2-flash`。
- 当设置了`XIAOMI_API_KEY`（或存在身份验证配置文件）时，提供商将自动注入。
- 有关提供商规则，请参阅[/concepts/model-providers](/concepts/model-providers)。
