---
summary: GLM model family overview + how to use it in OpenClaw
read_when:
  - You want GLM models in OpenClaw
  - You need the model naming convention and setup
---
# GLM 模型

GLM 是一个通过 Z.AI 平台提供的**模型族**（而非公司）。在 OpenClaw 中，可通过 `zai` 提供者以及类似 `zai/glm-4.7` 的模型 ID 来访问 GLM 模型。

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-4.7" } } }
}
```

## 注意事项

- GLM 的版本和可用性可能会发生变化；请查阅 Z.AI 的文档以获取最新信息。
- 示例模型 ID 包括 `glm-4.7` 和 `glm-4.6`。
- 有关提供者的详细信息，请参阅 [/providers/zai](/providers/zai)。
