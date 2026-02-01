---
summary: Use Venice AI privacy-focused models in OpenClaw
read_when:
  - You want privacy-focused inference in OpenClaw
  - You want Venice AI setup guidance
---
# 威尼斯 AI（威尼斯亮点）

**威尼斯**是我们主打的威尼斯设置，专为注重隐私的推理设计，并可选择以匿名方式访问专有模型。

威尼斯 AI 提供以隐私为中心的 AI 推理服务，支持无审查模型，并通过其匿名代理访问主要专有模型。所有推理默认为私密——不会对您的数据进行训练，也不会记录日志。

## 为什么在 OpenClaw 中使用威尼斯

- **私密推理**：适用于开源模型（无日志记录）。
- **无审查模型**：在您需要时提供无内容限制的模型。
- **匿名访问**：在质量至关重要的情况下，可通过匿名代理访问专有模型（Opus/GPT/Gemini）。
- 兼容 OpenAI 的 `/v1` 端点。

## 隐私模式

威尼斯提供两种隐私级别——理解这一点是选择模型的关键：

| 模式 | 描述 | 模型 |
|------|-------------|--------|
| **私密** | 完全私密。提示/响应 **从不存储或记录**。短暂存在。 | Llama、Qwen、DeepSeek、威尼斯无审查等 |
| **匿名化** | 通过威尼斯代理，且元数据被剥离。底层提供商（OpenAI、Anthropic）仅能看到匿名化的请求。 | Claude、GPT、Gemini、Grok、Kimi、MiniMax |

## 功能

- **以隐私为中心**：可在“私密”（完全私密）和“匿名化”（代理）模式之间选择
- **无审查模型**：可访问无内容限制的模型
- **主流模型访问**：通过威尼斯的匿名代理使用 Claude、GPT-5.2、Gemini、Grok
- **兼容 OpenAI 的 API**：标准 `/v1` 端点，便于集成
- **流式传输**：✅ 所有模型均支持
- **函数调用**：✅ 部分模型支持（请查看模型功能）
- **视觉功能**：✅ 具备视觉能力的模型支持
- **无硬性速率限制**：极端使用情况下可能会实施公平使用限流

## 设置

### 1. 获取 API 密钥

1. 在 [venice.ai](https://venice.ai) 注册
2. 转到 **设置 → API 密钥 → 创建新密钥**
3. 复制您的 API 密钥（格式： `vapi_xxxxxxxxxxxx`)

### 2. 配置 OpenClaw

**选项 A：环境变量**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**选项 B：交互式设置（推荐）**

```bash
openclaw onboard --auth-choice venice-api-key
```

这将：
1. 提示您输入 API 密钥（或使用现有 `VENICE_API_KEY`)
2. 显示所有可用的威尼斯模型
3. 让您选择默认模型
4. 自动配置提供商

**选项 C：非交互式**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. 验证设置

```bash
openclaw chat --model venice/llama-3.3-70b "Hello, are you working?"
```

## 模型选择

设置完成后，OpenClaw 会显示所有可用的威尼斯模型。根据您的需求进行选择：

- **默认（我们的推荐）**： `venice/llama-3.3-70b` 适用于私密、平衡性能。
- **最佳整体质量**： `venice/claude-opus-45` 适用于高难度任务（Opus 仍然是最强的）。
- **隐私**：选择“私密”模型以实现完全私密的推理。
- **能力**：选择“匿名化”模型，通过威尼斯代理访问 Claude、GPT、Gemini。

随时更改默认模型：

```bash
openclaw models set venice/claude-opus-45
openclaw models set venice/llama-3.3-70b
```

列出所有可用模型：

```bash
openclaw models list | grep venice
```

## 通过 `openclaw configure` 进行配置

1. 运行 `openclaw configure`
2. 选择 **模型/认证**
3. 选择 **威尼斯 AI**

## 我应该使用哪个模型？

| 使用场景 | 推荐模型 | 为什么 |
|----------|-------------------|-----|
| **通用聊天** | `llama-3.3-70b` | 性能全面，完全私密 |
| **最佳整体质量** | `claude-opus-45` | Opus 仍然是处理高难度任务的最强模型 |
| **隐私 + Claude 质量** | `claude-opus-45` | 通过匿名代理获得最佳推理能力 |
| **编码** | `qwen3-coder-480b-a35b-instruct` | 针对代码优化，上下文长度 262k |
| **视觉任务** | `qwen3-vl-235b-a22b` | 最佳私密视觉模型 |
| **无审查** | `venice-uncensored` | 无内容限制 |
| **快速 + 经济** | `qwen3-4b` | 轻量级，依然功能强大 |
| **复杂推理** | `deepseek-v3.2` | 强大的推理能力，私密 |

## 可用模型（共 25 个）

### 私密模型（15 个）——完全私密，无日志记录

| 模型 ID | 名称 | 上下文（token） | 特性 |
|----------|------|------------------|----------|
| `llama-3.3-70b` | Llama 3.3 70B | 131k | 通用 |
| `llama-3.2-3b` | Llama 3.2 3B | 131k | 快速、轻量级 |
| `hermes-3-llama-3.1-405b` | Hermes 3 Llama 3.1 405B | 131k | 复杂任务 |
| `qwen3-235b-a22b-thinking-2507` | Qwen3 235B Thinking | 131k | 推理 |
| `qwen3-235b-a22b-instruct-2507` | Qwen3 235B Instruct | 131k | 通用 |
| `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B | 262k | 代码 |
| `qwen3-next-80b` | Qwen3 Next 80B | 262k | 通用 |
| `qwen3-vl-235b-a22b` | Qwen3 VL 235B | 262k | 视觉 |
| `qwen3-4b` | 威尼斯小号（Qwen3 4B） | 32k | 快速、推理 |
| `deepseek-v3.2` | DeepSeek V3.2 | 163k | 推理 |
| `venice-uncensored` | 威尼斯无审查 | 32k | 无审查 |
| `mistral-31-24b` | 威尼斯中号（Mistral） | 131k | 视觉 |
| `google-gemma-3-27b-it` | Gemma 3 27B Instruct | 202k | 视觉 |
| `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 131k | 通用 |
| `zai-org-glm-4.7` | GLM 4.7 | 202k | 推理、多语言 |

### 匿名化模型（10 个）——通过威尼斯代理

| 模型 ID | 原始模型 | 上下文（token） | 特性 |
|----------|----------|------------------|----------|
| `claude-opus-45` | Claude Opus 4.5 | 202k | 推理、视觉 |
| `claude-sonnet-45` | Claude Sonnet 4.5 | 202k | 推理、视觉 |
| `openai-gpt-52` | GPT-5.2 | 262k | 推理 |
| `openai-gpt-52-codex` | GPT-5.2 Codex | 262k | 推理、视觉 |
| `gemini-3-pro-preview` | Gemini 3 Pro | 202k | 推理、视觉 |
| `gemini-3-flash-preview` | Gemini 3 Flash | 262k | 推理、视觉 |
| `grok-41-fast` | Grok 4.1 Fast | 262k | 推理、视觉 |
| `grok-code-fast-1` | Grok Code Fast 1 | 262k | 推理、代码 |
| `kimi-k2-thinking` | Kimi K2 Thinking | 262k | 推理 |
| `minimax-m21` | MiniMax M2.1 | 202k | 推理 |

## 模型发现

当设置 `VENICE_API_KEY` 时，OpenClaw 会自动从威尼斯 API 发现模型。如果 API 无法访问，则回退到静态目录。

`/models` 端点是公开的（无需认证即可列出），但推理需要有效的 API 密钥。

## 流式传输与工具支持

| 功能 | 支持 |
|---------|---------|
| **流式传输** | ✅ 所有模型 |
| **函数调用** | ✅ 大多数模型（请查看 API 中的 `supportsFunctionCalling`) |
| **视觉/图像** | ✅ 标有“视觉”功能的模型 |
| **JSON 模式** | ✅ 通过 `response_format` 支持 |

## 定价

威尼斯采用基于积分的系统。请查看 [venice.ai/pricing](https://venice.ai/pricing) 以了解当前费率：

- **私密模型**：通常成本较低
- **匿名化模型**：与直接 API 定价相似 + 小额威尼斯费用

## 对比：威尼斯 vs 直接 API

| 方面 | 威尼斯（匿名化） | 直接 API |
|--------|---------------------|------------|
| **隐私** | 元数据被剥离，匿名化 | 您的账户已关联 |
| **延迟** | +10-50ms（代理） | 直接 |
| **功能** | 大多数功能受支持 | 功能齐全 |
| **计费** | 威尼斯积分 | 提供商计费 |

## 使用示例

```bash
# Use default private model
openclaw chat --model venice/llama-3.3-70b

# Use Claude via Venice (anonymized)
openclaw chat --model venice/claude-opus-45

# Use uncensored model
openclaw chat --model venice/venice-uncensored

# Use vision model with image
openclaw chat --model venice/qwen3-vl-235b-a22b

# Use coding model
openclaw chat --model venice/qwen3-coder-480b-a35b-instruct
```

## 故障排除

### API 密钥未被识别

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

确保密钥以 `vapi_` 开头。

### 模型不可用

威尼斯模型目录会动态更新。运行 `openclaw models list` 以查看当前可用的模型。某些模型可能暂时离线。

### 连接问题

威尼斯 API 位于 `https://api.venice.ai/api/v1`.请确保您的网络允许 HTTPS 连接。

## 配置文件示例

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/llama-3.3-70b" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "llama-3.3-70b",
            name: "Llama 3.3 70B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

## 链接

- [威尼斯 AI](https://venice.ai)
- [API 文档](https://docs.venice.ai)
- [定价](https://venice.ai/pricing)
- [状态](https://status.venice.ai)
