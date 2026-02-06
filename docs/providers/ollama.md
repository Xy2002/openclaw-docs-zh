---
summary: Run OpenClaw with Ollama (local LLM runtime)
read_when:
  - You want to run OpenClaw with local models via Ollama
  - You need Ollama setup and configuration guidance
---
# 奥拉玛

Ollama是一个本地大语言模型运行时，可让你轻松在本地机器上运行开源模型。OpenClaw与Ollama的OpenAI兼容API集成，并且在你通过`OLLAMA_API_KEY`（或身份验证配置文件）选择启用且**未显式定义`models.providers.ollama`条目**时，能够**自动发现具备工具能力的模型**。

## 快速入门

1) 安装Ollama：https://ollama.ai

2) 拉取一个模型：

```bash
ollama pull llama3.3
# or
ollama pull qwen2.5-coder:32b
# or
ollama pull deepseek-r1:32b
```

3) 为OpenClaw启用Ollama（任何值均可；Ollama不需要真实密钥）：

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4) 使用Ollama模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/llama3.3" }
    }
  }
}
```

## 模型发现（隐式提供者）

当您设置`OLLAMA_API_KEY`（或身份验证配置文件）且**未**定义`models.providers.ollama`时，OpenClaw会从本地Ollama实例中发现模型，该实例位于`http://127.0.0.1:11434`：

- 查询`/api/tags`和`/api/show`
- 仅保留报告具有`tools`能力的模型
- 当模型报告`thinking`时，标记为`reasoning`
- 在可用时从`model_info["<arch>.context_length"]`读取`contextWindow`
- 将`maxTokens`设置为上下文窗口的10倍
- 将所有成本设置为`0`

这避免了手动输入模型条目，同时使目录与Ollama的功能保持一致。

要查看有哪些可用模型：

```bash
ollama list
openclaw models list
```

要添加新模型，只需使用Ollama拉取它：

```bash
ollama pull mistral
```

新模型将被自动发现并可供使用。

如果你显式设置了`models.providers.ollama`，则会跳过自动发现，你需要手动定义模型（见下文）。

## 配置

### 基本设置（隐式发现）

启用Ollama最简单的方式是通过环境变量：

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 显式设置（手动模型）

在以下情况下使用显式配置：

- Ollama运行在其他主机或端口上。
- 你想强制指定特定的上下文窗口或模型列表。
- 你想包含不报告工具支持的模型。

```json5
{
  models: {
    providers: {
      ollama: {
        // Use a host that includes /v1 for OpenAI-compatible APIs
        baseUrl: "http://ollama-host:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "llama3.3",
            name: "Llama 3.3",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

如果设置了`OLLAMA_API_KEY`，你可以省略提供者条目中的`apiKey`，OpenClaw会自动填充以进行可用性检查。

### 自定义基础URL（显式配置）

如果Ollama运行在不同的主机或端口上（显式配置会禁用自动发现，因此需要手动定义模型）：

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434/v1"
      }
    }
  }
}
```

### 模型选择

配置完成后，你的所有Ollama模型都可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/llama3.3",
        fallback: ["ollama/qwen2.5-coder:32b"]
      }
    }
  }
}
```

## 高级功能

### 推理模型

当Ollama在`/api/show`中报告`thinking`时，OpenClaw会将模型标记为具备推理能力：

```bash
ollama pull deepseek-r1:32b
```

### 模型成本

Ollama是免费的，并且在本地运行，因此所有模型的成本都被设置为0美元。

### 上下文窗口

对于自动发现的模型，OpenClaw会在可用时使用Ollama报告的上下文窗口，否则默认使用`8192`。你可以在显式提供者配置中覆盖`contextWindow`和`maxTokens`。

故障排除

### 未检测到Ollama

确保Ollama正在运行，并且你已设置`OLLAMA_API_KEY`（或身份验证配置文件），并且**未**定义显式的`models.providers.ollama`条目：

```bash
ollama serve
```

同时确保API可访问：

```bash
curl http://localhost:11434/api/tags
```

### 没有可用模型

OpenClaw仅自动发现报告工具支持的模型。如果你的模型未列出，可以采取以下措施：

- 拉取一个具备工具能力的模型，或
- 在`models.providers.ollama`中显式定义该模型。

要添加模型：

```bash
ollama list  # See what's installed
ollama pull llama3.3  # Pull a model
```

### 连接被拒绝

检查Ollama是否在正确的端口上运行：

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## 参见

- [模型提供商](/concepts/model-providers) - 所有提供商的概述
- [模型选择](/concepts/models) - 如何选择模型
- [配置](/gateway/configuration) - 完整配置参考
