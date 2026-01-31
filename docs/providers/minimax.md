---
summary: Use MiniMax M2.1 in OpenClaw
read_when:
  - You want MiniMax models in OpenClaw
  - You need MiniMax setup guidance
---
# MiniMax

MiniMax是一家人工智能公司，致力于打造**M2/M2.1**模型系列。目前专注于编码的版本是**MiniMax M2.1**（2025年12月23日），专为现实世界中的复杂任务而设计。

来源：[MiniMax M2.1发布说明](https://www.minimax.io/news/minimax-m21)

## 模型概览（M2.1）

MiniMax在M2.1中重点提升了以下能力：

- 更强大的**多语言编码**能力（Rust、Java、Go、C++、Kotlin、Objective-C、TS/JS）。
- 更出色的**Web/应用开发**能力与美学输出质量（包括原生移动端）。
- 改进的**复合指令**处理能力，适用于办公类工作流，基于交错式思维和集成约束执行。
- **更简洁的响应**，同时减少令牌使用并加快迭代速度。
- 更强的**工具/代理框架**兼容性与上下文管理能力（Claude Code、Droid/Factory AI、Cline、Kilo Code、Roo Code、BlackBox）。
- 更高质量的**对话与技术写作**输出。

## MiniMax M2.1 vs MiniMax M2.1 Lightning

- **速度**：Lightning是MiniMax定价文档中定义的“快速”变体。
- **成本**：定价显示输入成本相同，但Lightning的输出成本更高。
- **编码计划路由**：Lightning后端并未直接提供给MiniMax编码计划。MiniMax会自动将大多数请求路由到Lightning，但在流量高峰时会回退到常规的M2.1后端。

## 选择配置方案

### MiniMax M2.1——推荐配置

**适用场景**：托管的MiniMax，搭配与Anthropic兼容的API。

通过CLI进行配置：
- 运行 `openclaw configure`
- 选择 **Model/auth**
- 选择 **MiniMax M2.1**

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.1" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

### MiniMax M2.1作为备选（Opus为主）

**适用场景**：以Opus 4.5为主，当无法使用Opus时切换到MiniMax M2.1。

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" }
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"]
      }
    }
  }
}
```

### 可选：本地部署 via LM Studio（手动）

**适用场景**：使用LM Studio进行本地推理。我们在功能强大的硬件（如台式机或服务器）上，结合LM Studio的本地服务器，已验证MiniMax M2.1表现出色。

通过 `openclaw.json` 手动配置：

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } }
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

## 通过 `openclaw configure` 进行配置

使用交互式配置向导设置MiniMax，无需手动编辑JSON：

1) 运行 `openclaw configure`。
2) 选择 **Model/auth**。
3) 选择 **MiniMax M2.1**。
4) 在提示时选择您的默认模型。

## 配置选项

- `models.providers.minimax.baseUrl`: 建议优先使用 `https://api.minimax.io/anthropic`（与Anthropic兼容）；`https://api.minimax.io/v1` 是可选的，用于OpenAI兼容的负载。
- `models.providers.minimax.api`: 建议优先使用 `anthropic-messages`；`openai-completions` 是可选的，用于OpenAI兼容的负载。
- `models.providers.minimax.apiKey`: MiniMax API密钥（`MINIMAX_API_KEY`）。
- `models.providers.minimax.models`: 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost`。
- `agents.defaults.models`: 列出您希望加入白名单的别名模型。
- `models.mode`: 如果您想在内置模型之外添加MiniMax，请保留 `merge`。

## 备注

- 模型引用为 `minimax/<model>`。
- 编码计划用量API：`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（需要编码计划密钥）。
- 如果需要精确的成本跟踪，请在 `models.json` 中更新定价数值。
- MiniMax编码计划推荐链接（享九折优惠）：https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link
- 有关提供商规则，请参阅 [/concepts/model-providers](/concepts/model-providers)。
- 使用 `openclaw models list` 和 `openclaw models set minimax/MiniMax-M2.1` 进行切换。

## 故障排除

### “未知模型：minimax/MiniMax-M2.1”

这通常意味着**未配置MiniMax提供商**（未找到提供商条目，也未找到MiniMax认证配置或环境密钥）。针对此问题的修复已在 **2026.1.12** 中实现（撰写本文时尚未发布）。解决方法如下：
- 升级到 **2026.1.12**（或从源代码运行 `main`），然后重启网关。
- 运行 `openclaw configure` 并选择 **MiniMax M2.1**；
- 手动添加 `models.providers.minimax` 块；
- 设置 `MINIMAX_API_KEY`（或创建一个MiniMax认证配置），以便注入提供商。

请确保模型ID**区分大小写**：
- `minimax/MiniMax-M2.1`
- `minimax/MiniMax-M2.1-lightning`

然后通过以下命令重新检查：
```bash
openclaw models list
```
