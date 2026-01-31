---
summary: Model provider overview with example configs + CLI flows
read_when:
  - You need a provider-by-provider model setup reference
  - You want example configs or CLI onboarding commands for model providers
---
# 模型提供商

本页面介绍的是**LLM/模型提供商**（而非 WhatsApp/Telegram 等聊天渠道）。
有关模型选择规则，请参阅 [/concepts/models](/concepts/models)。

## 快速规则

- 模型引用使用 `provider/model`（示例：`opencode/claude-opus-4-5`）。
- 如果您设置 `agents.defaults.models`，它将成为允许列表。
- CLI 辅助命令：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。

## 内置提供商（pi‑ai 目录）

OpenClaw 随附 pi‑ai 目录。这些提供商**无需**任何 `models.providers` 配置；只需设置身份验证并选择一个模型即可。

### OpenAI

- 提供商：`openai`
- 身份验证：`OPENAI_API_KEY`
- 示例模型：`openai/gpt-5.2`
- CLI：`openclaw onboard --auth-choice openai-api-key`

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.2" } } }
}
```

### Anthropic

- 提供商：`anthropic`
- 身份验证：`ANTHROPIC_API_KEY` 或 `claude setup-token`
- 示例模型：`anthropic/claude-opus-4-5`
- CLI：`openclaw onboard --auth-choice token`（粘贴 setup-token）或 `openclaw models auth paste-token --provider anthropic`

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

### OpenAI Code (Codex)

- 提供商：`openai-codex`
- 身份验证：OAuth（ChatGPT）
- 示例模型：`openai-codex/gpt-5.2`
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.2" } } }
}
```

### OpenCode Zen

- 提供商：`opencode`
- 身份验证：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- 示例模型：`opencode/claude-opus-4-5`
- CLI：`openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-5" } } }
}
```

### Google Gemini（API 密钥）

- 提供商：`google`
- 身份验证：`GEMINI_API_KEY`
- 示例模型：`google/gemini-3-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`

### Google Vertex / Antigravity / Gemini CLI

- 提供商：`google-vertex`、`google-antigravity`、`google-gemini-cli`
- 身份验证：Vertex 使用 gcloud ADC；Antigravity/Gemini CLI 使用各自的认证流程
- Antigravity OAuth 作为捆绑插件提供（`google-antigravity-auth`，默认禁用）。
  - 启用：`openclaw plugins enable google-antigravity-auth`
  - 登录：`openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth 作为捆绑插件提供（`google-gemini-cli-auth`，默认禁用）。
  - 启用：`openclaw plugins enable google-gemini-cli-auth`
  - 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
  - 注意：您**不需要**将客户端 ID 或密钥粘贴到 `openclaw.json` 中。CLI 登录流程会将令牌存储在网关主机的身份验证配置文件中。

### Z.AI（GLM）

- 提供商：`zai`
- 身份验证：`ZAI_API_KEY`
- 示例模型：`zai/glm-4.7`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 会被规范化为 `zai/*`

### Vercel AI Gateway

- 提供商：`vercel-ai-gateway`
- 身份验证：`AI_GATEWAY_API_KEY`
- 示例模型：`vercel-ai-gateway/anthropic/claude-opus-4.5`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他内置提供商

- OpenRouter：`openrouter`（`OPENROUTER_API_KEY`）
- 示例模型：`openrouter/anthropic/claude-sonnet-4-5`
- xAI：`xai`（`XAI_API_KEY`）
- Groq：`groq`（`GROQ_API_KEY`）
- Cerebras：`cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras 上的 GLM 模型使用 ID `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容的基础 URL：`https://api.cerebras.ai/v1`。
- Mistral：`mistral`（`MISTRAL_API_KEY`）
- GitHub Copilot：`github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）

## 通过 `models.providers` 的提供商（自定义/基础 URL）

使用 `models.providers`（或 `models.json`）来添加**自定义**提供商或与 OpenAI/Anthropic 兼容的代理。

### Moonshot AI（Kimi）

Moonshot 使用与 OpenAI 兼容的端点，因此可将其配置为自定义提供商：

- 提供商：`moonshot`
- 身份验证：`MOONSHOT_API_KEY`
- 示例模型：`moonshot/kimi-k2.5`
- Kimi K2 模型 ID：
  {/* moonshot-kimi-k2-model-refs:start */}
  - `moonshot/kimi-k2.5`
  - `moonshot/kimi-k2-0905-preview`
  - `moonshot/kimi-k2-turbo-preview`
  - `moonshot/kimi-k2-thinking`
  - `moonshot/kimi-k2-thinking-turbo`
  {/* moonshot-kimi-k2-model-refs:end */}
```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } }
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }]
      }
    }
  }
}
```

### Kimi Code

Kimi Code 使用专用端点和密钥（与 Moonshot 分开）：

- 提供商：`kimi-code`
- 身份验证：`KIMICODE_API_KEY`
- 示例模型：`kimi-code/kimi-for-coding`

```json5
{
  env: { KIMICODE_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-code/kimi-for-coding" } }
  },
  models: {
    mode: "merge",
    providers: {
      "kimi-code": {
        baseUrl: "https://api.kimi.com/coding/v1",
        apiKey: "${KIMICODE_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-for-coding", name: "Kimi For Coding" }]
      }
    }
  }
}
```

### Qwen OAuth（免费层级）

Qwen 通过设备码流程提供对 Qwen Coder + Vision 的 OAuth 访问权限。
启用捆绑插件，然后登录：

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

模型引用：
- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

有关设置详情和注意事项，请参阅 [/providers/qwen](/providers/qwen)。

### Synthetic

Synthetic 在 `synthetic` 提供商后端提供与 Anthropic 兼容的模型：

- 提供商：`synthetic`
- 身份验证：`SYNTHETIC_API_KEY`
- 示例模型：`synthetic/hf:MiniMaxAI/MiniMax-M2.1`
- CLI：`openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" } }
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.1", name: "MiniMax M2.1" }]
      }
    }
  }
}
```

### MiniMax

MiniMax 通过 `models.providers` 进行配置，因为它使用自定义端点：

- MiniMax（与 Anthropic 兼容）：`--auth-choice minimax-api`
- 身份验证：`MINIMAX_API_KEY`

有关设置详情、模型选项和配置片段，请参阅 [/providers/minimax](/providers/minimax)。

### Ollama

Ollama 是一个本地 LLM 运行时，提供与 OpenAI 兼容的 API：

- 提供商：`ollama`
- 身份验证：无需（本地服务器）
- 示例模型：`ollama/llama3.3`
- 安装：https://ollama.ai

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } }
  }
}
```

当在本地运行时，Ollama 会自动检测到 `http://127.0.0.1:11434/v1`。有关模型推荐和自定义配置，请参阅 [/providers/ollama](/providers/ollama)。

### 本地代理（LM Studio、vLLM、LiteLLM 等）

示例（与 OpenAI 兼容）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } }
    }
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

注意：
- 对于自定义提供商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。
  如果省略，OpenClaw 默认使用：
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 建议：设置与您的代理/模型限制相匹配的显式值。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-5
openclaw models list
```

另请参阅：[/gateway/configuration](/gateway/configuration) 获取完整的配置示例。
