---
summary: How OpenClaw builds prompt context and reports token usage + costs
read_when:
  - 'Explaining token usage, costs, or context windows'
  - Debugging context growth or compaction behavior
---
# 令牌使用与成本

OpenClaw 追踪的是**令牌**，而非字符。令牌是特定于模型的，但对于大多数 OpenAI 风格的模型而言，英文文本平均每枚令牌约对应 4 个字符。

## 系统提示的构建方式

OpenClaw 在每次运行时都会动态组装自己的系统提示。它包含以下内容：

- 工具列表 + 简短描述
- 技能列表（仅元数据；指令按需通过 `read` 加载）
- 自我更新指令
- 工作空间 + 引导文件（当为新文件时，包括 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。大文件会通过 `agents.defaults.bootstrapMaxChars` 截断（默认截断长度为 20000）。
- 时间（UTC + 用户时区）
- 回复标签 + 心跳行为
- 运行时元数据（主机/操作系统/模型/思考状态）

完整细分请参见 [系统提示](/concepts/system-prompt)。

## 哪些内容计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示（上述所有部分）
- 对话历史（用户和助手消息）
- 工具调用及工具结果
- 附件/转录本（图像、音频、文件）
- 紧缩摘要和修剪生成的中间产物
- 提供商封装器或安全标头（不可见，但仍计入）

如需按注入文件、工具、技能以及系统提示大小进行实际细分，请使用 `/context list` 或 `/context detail`。更多信息请参见 [上下文](/concepts/context)。

## 如何查看当前令牌使用情况

在聊天中可使用以下命令：

- `/status` → 显示**富含表情符号的状态卡片**，其中包含会话使用的模型、上下文使用情况、最近回复的输入/输出令牌数，以及**预估成本**（仅适用于已配置 API 密钥的情况）。
- `/usage off|tokens|full` → 在每条回复后附加一个**每条回复的使用量页脚**。
  - 持久保存于会话中（存储为 `responseUsage`）。
  - OAuth 身份验证会**隐藏成本**（仅显示令牌数量）。
- `/usage cost` → 从 OpenClaw 会话日志中显示本地成本汇总。

其他界面支持：

- **TUI/Web TUI：** 支持 `/status` 和 `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 显示提供商配额窗口（不显示每条回复的成本）。

## 成本估算（何时显示）

成本根据您的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是针对 `input`、`output`、`cacheRead` 和 `cacheWrite` 的**每 100 万令牌的美元价格**。如果缺少定价信息，OpenClaw 将仅显示令牌数量。OAuth 令牌始终不显示美元成本。

## 缓存 TTL 及修剪的影响

提供商的提示缓存仅在缓存 TTL 窗口内有效。OpenClaw 可选择启用**缓存 TTL 修剪**：一旦缓存 TTL 到期，系统会修剪会话，并重置缓存窗口，以便后续请求可以重新使用新鲜缓存的上下文，而无需重新缓存整个历史记录。这有助于在会话空闲时间超过 TTL 时降低缓存写入成本。

您可在 [网关配置](/gateway/configuration)中进行相关配置，并在 [会话修剪](/concepts/session-pruning)中查看详细行为说明。

心跳机制可以在空闲时段保持缓存**“温暖”**。如果您的模型缓存 TTL 为 `1h`，将心跳间隔设置为略低于该值（例如 `55m`），即可避免重新缓存完整提示，从而降低缓存写入成本。

对于 Anthropic API 的定价，缓存读取的成本显著低于输入令牌，而缓存写入则按更高的倍数计费。有关最新费率和 TTL 倍数，请参阅 Anthropic 的提示缓存定价：
https://docs.anthropic.com/docs/build-with-claude/prompt-caching

### 示例：通过心跳保持 1 小时缓存“温暖”
```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-5"
    models:
      "anthropic/claude-opus-4-5":
        params:
          cacheControlTtl: "1h"
    heartbeat:
      every: "55m"
```

## 减少令牌压力的技巧

- 使用 `/compact` 来总结长时间会话。
- 在工作流中裁剪大型工具输出。
- 保持技能描述简短（技能列表会被注入到提示中）。
- 在需要大量文本的探索性任务中优先选择较小的模型。

有关确切的技能列表开销公式，请参见 [技能](/tools/skills)。
