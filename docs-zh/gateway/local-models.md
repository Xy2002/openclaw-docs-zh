---
summary: 'Run OpenClaw on local LLMs (LM Studio, vLLM, LiteLLM, custom OpenAI endpoints)'
read_when:
  - You want to serve models from your own GPU box
  - You are wiring LM Studio or an OpenAI-compatible proxy
  - You need the safest local model guidance
---
# 本地模型

在本地运行是可行的，但 OpenClaw 建议使用大上下文并配备强大的提示注入防御机制。小型模型会截断上下文，并可能泄露安全性。目标要高：**至少配备两台满配 Mac Studio 或等效 GPU 集群（约 3 万美元以上）**。单个 **24 GB** GPU 只适用于较轻量的提示，且延迟较高。请尽可能使用你所能运行的**最大尺寸/全尺寸模型变体**；经过激进量化或“小型”检查点会显著增加提示注入风险（参见 [安全](/gateway/security))。

## 推荐方案：LM Studio + MiniMax M2.1（Responses API，全尺寸）

当前最佳的本地部署方案。在 LM Studio 中加载 MiniMax M2.1，启用本地服务器（默认为 `http://127.0.0.1:1234`），并通过 Responses API 将推理过程与最终文本输出分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

**设置检查清单**
- 安装 LM Studio：https://lmstudio.ai
- 在 LM Studio 中下载**可用的最大 MiniMax M2.1 构建版本**（避免“小”或高度量化的变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 中已列出该服务器。
- 保持模型始终加载；冷加载会导致启动延迟。
- 如果你的 LM Studio 版本有所不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，务必使用 Responses API，以确保仅发送最终文本。

即使在本地运行时，也应保持托管模型的配置；使用 `models.mode: "merge"` 以确保备用方案始终可用。

### 混合配置：托管为主、本地为备
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.1-gs32", "anthropic/claude-opus-4-5"]
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.1-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-5": { alias: "Opus" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

### 本地优先，托管作为安全网
将主用和备用顺序互换；保留相同的提供商块和 `models.mode: "merge"`，以便在本地系统宕机时能够无缝切换到 Sonnet 或 Opus。

### 区域化托管与数据路由
- OpenRouter 上也提供托管版 MiniMax、Kimi 和 GLM 的区域固定端点（例如美国托管）。选择相应的区域变体，可在指定司法管辖区内处理流量，同时仍可通过 `models.mode: "merge"` 使用 Anthropic 或 OpenAI 作为后备。
- 完全本地运行仍然是隐私保护最强的路径；当你需要提供商的功能但又希望控制数据流向时，区域化托管则是一种折中方案。

## 其他兼容 OpenAI 的本地代理
vLLM、LiteLLM、OAI-proxy 或自定义网关如果能暴露符合 OpenAI 标准的 `/v1` 端点，即可使用。只需将上述提供商块替换为你自己的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

请保留 `models.mode: "merge"`，以确保托管模型仍可作为备用方案。

## 故障排除
- 网关能否成功连接到代理？查看 `curl http://127.0.0.1:1234/v1/models`。
- LM Studio 中的模型是否已卸载？请重新加载；冷启动是导致“挂起”的常见原因。
- 出现上下文错误？降低 `contextWindow` 设置，或提高服务器的上下文限制。
- 安全性：本地模型会跳过提供商侧的过滤机制；请尽量缩小智能体的职责范围，并启用压缩功能，以限制提示注入的影响范围。
