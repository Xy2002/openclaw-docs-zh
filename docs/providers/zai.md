---
summary: Use Z.AI (GLM models) with OpenClaw
read_when:
  - You want Z.AI / GLM models in OpenClaw
  - You need a simple ZAI_API_KEY setup
---
# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。请在 Z.AI 控制台中创建您的 API 密钥。OpenClaw 使用带有 Z.AI API 密钥的 `zai` 提供商。

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
# or non-interactive
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-4.7" } } }
}
```

## 注意事项

- GLM 模型以 `zai/<model>` 的形式提供（示例：`zai/glm-4.7`）。
- 有关模型系列的概览，请参阅 [/providers/glm](/providers/glm)。
- Z.AI 使用包含您的 API 密钥的 Bearer 身份验证。
