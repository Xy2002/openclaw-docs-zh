---
summary: 'Session pruning: tool-result trimming to reduce context bloat'
read_when:
  - You want to reduce LLM context growth from tool outputs
  - You are tuning agents.defaults.contextPruning
---
# 会话修剪

会话修剪会在每次调用 LLM 之前，从内存中的上下文中移除**旧的工具结果**。它**不会**重写磁盘上的会话历史记录（`*.jsonl`）。

## 运行时机
- 当 `mode: "cache-ttl"` 已启用，且该会话中最后一次 Anthropic 调用的时间超过 `ttl` 时。
- 只影响发送给模型的该次请求的消息。
- 仅适用于 Anthropic API 调用（以及 OpenRouter 的 Anthropic 模型）。
- 为获得最佳效果，应将 `ttl` 设置为与您的模型 `cacheControlTtl` 相匹配。
- 在修剪后，TTL 窗口会重置，因此后续请求可在 `ttl` 再次到期前继续使用缓存。

## 智能默认设置（Anthropic）
- **OAuth 或 setup-token** 配置文件：启用 `cache-ttl` 修剪，并将心跳间隔设置为 `1h`。
- **API 密钥** 配置文件：启用 `cache-ttl` 修剪，将心跳间隔设置为 `30m`，并将 Anthropic 模型上的 `cacheControlTtl` 默认值设为 `1h`。
- 如果您显式设置了这些值，OpenClaw**不会**覆盖它们。

## 改进的内容（成本 + 缓存行为）
- **为何要修剪：** Anthropic 提示词缓存仅在 TTL 范围内生效。如果会话在 TTL 过期后处于空闲状态，下一次请求将重新缓存整个提示词，除非您事先进行修剪。
- **哪些成本降低：** 修剪可减少 TTL 过期后首次请求的 **cacheWrite** 大小。
- **TTL 重置的重要性：** 修剪运行后，缓存窗口会重置，因此后续请求可以复用新缓存的提示词，而无需再次缓存完整的历史记录。
- **修剪不会做什么：** 修剪不会增加令牌数量或导致“双重”成本；它只改变在 TTL 过期后的首次请求中被缓存的内容。

## 可修剪的内容
- 仅 `toolResult` 消息。
- 用户和助手消息**绝不会**被修改。
- 最近 `keepLastAssistants` 条助手消息受到保护；在此截断点之后的工具结果不会被修剪。
- 如果助手消息不足以确定截断点，则跳过修剪。
- 包含**图像块**的工具结果会被跳过（绝不会被修剪或清除）。

## 上下文窗口估算
修剪使用估算的上下文窗口（字符数 ≈ 令牌数 × 4）。窗口大小按以下顺序确定：
1) 模型定义 `contextWindow`（来自模型注册表）。
2) `models.providers.*.models[].contextWindow` 优先级更高。
3) `agents.defaults.contextTokens`。
4) 默认 `200000` 令牌数。

## 模式
### cache-ttl
- 修剪仅在最后一次 Anthropic 调用时间超过 `ttl`（默认 `5m`）时运行。
- 运行时的行为与之前的软修剪和硬清除行为相同。

## 软修剪 vs 硬修剪
- **软修剪：** 仅针对过大的工具结果。
  - 保留头部和尾部，插入 `...`，并附上包含原始大小的备注。
  - 跳过包含图像块的工具结果。
- **硬清除：** 用 `hardClear.placeholder` 替换整个工具结果。

## 工具选择
- `tools.allow` / `tools.deny` 支持 `*` 通配符。
- 拒绝优先。
- 匹配不区分大小写。
- 允许列表为空 => 所有工具均被允许。

## 与其他限制的交互
- 内置工具已经会截断自己的输出；会话修剪是额外的一层，可防止长时间对话在模型上下文中积累过多的工具输出。
- 压缩是独立的：压缩会总结并持久化，而修剪则是每次请求的临时操作。请参阅 [concepts/compaction](/concepts/compaction)。

## 默认设置（启用时）
- `ttl`：`"5m"`
- `keepLastAssistants`：`3`
- `softTrimRatio`：`0.3`
- `hardClearRatio`：`0.5`
- `minPrunableToolChars`：`50000`
- `softTrim`：`{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`：`{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## 示例
默认设置（关闭）：
```json5
{
  agent: {
    contextPruning: { mode: "off" }
  }
}
```

启用 TTL 感知修剪：
```json5
{
  agent: {
    contextPruning: { mode: "cache-ttl", ttl: "5m" }
  }
}
```

将修剪限制于特定工具：
```json5
{
  agent: {
    contextPruning: {
      mode: "cache-ttl",
      tools: { allow: ["exec", "read"], deny: ["*image*"] }
    }
  }
}
```

查看配置参考：[Gateway Configuration](/gateway/configuration)
