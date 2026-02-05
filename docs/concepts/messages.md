---
summary: 'Message flow, sessions, queueing, and reasoning visibility'
read_when:
  - Explaining how inbound messages become replies
  - 'Clarifying sessions, queueing modes, or streaming behavior'
  - Documenting reasoning visibility and usage implications
---
# 消息

本页面概述了OpenClaw如何处理入站消息、会话、排队、流式传输以及推理可见性。

## 消息流（高层次）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键配置选项位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于块级流式传输和分块的默认设置。
- 通道覆盖（`channels.whatsapp.*`、`channels.telegram.*` 等）用于限制和流式传输开关。

完整模式请参见 [配置](/gateway/configuration)。

## 入站去重

在重新连接后，通道可能会重新发送相同的消息。为避免重复交付触发额外的代理运行，OpenClaw维护一个以通道、账户、对等方、会话和消息ID为键的短期缓存。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 批量合并为一次代理回合。防抖功能作用于每个通道和对话，并使用最新消息对回复进行线程化或编号。

配置（全局默认值 + 每个通道的覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500
      }
    }
  }
}
```

注意事项：

- 防抖仅适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令绕过防抖，因此它们保持独立。

## 会话与设备

会话由网关而非客户端拥有。

- 直聊会话将合并到代理主会话密钥中。
- 群组和频道各自拥有独立的会话密钥。
- 会话存储和对话记录保存在网关主机上。

多个设备或通道可以映射到同一个会话，但历史记录不会完全同步到每个客户端。建议：对于长时间对话，使用一个主要设备，以避免上下文出现分歧。控制UI和TUI始终显示由网关支持的会话记录，因此它们是事实的权威来源。

详情：[会话管理](/concepts/session)。

## 入站正文与历史上下文

OpenClaw将**提示正文**与**命令正文**分开：

- `Body`：发送给代理的提示文本。这可能包括通道信封和可选的历史包装器。
- `CommandBody`：用于解析指令/命令的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当通道提供历史时，它使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组/频道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用的样式相同）。这确保了实时消息在代理提示中与队列和历史消息保持一致。

历史缓冲区是**仅待处理**的：它们包含尚未触发运行的群组消息（例如，受提及限制的消息），并**排除**已存在于会话记录中的消息。

指令剥离仅应用于**当前消息**部分，因此历史保持完整。包装历史的通道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保留为组合提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及每通道覆盖（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）进行配置。要禁用，请将 `0` 设置为关闭。

## 排队与后续处理

如果运行已经处于活动状态，入站消息可以排队、引导至当前运行，或收集以供后续回合处理。

- 通过 `messages.queue`（和 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及积压变体。

详情：[排队](/concepts/queue)。

## 流式传输、分块与批处理

块级流式传输会在模型生成文本块时发送部分回复。分块会尊重通道的文本限制，并避免拆分围栏代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（基于空闲时间的批处理）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间的类人暂停）
- 通道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非Telegram通道需要显式设置 `*.blockStreaming: true`）

详情：[流式传输 + 分块](/concepts/streaming)。

## 推理可见性和令牌

OpenClaw可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 模型生成的推理内容在生成时仍会计入令牌使用量。
- Telegram 支持将推理流显示在草稿气泡中。

详情：[思考 + 推理指令](/tools/thinking) 和 [令牌使用](/token-use)。

## 前缀、线程化与回复

出站消息格式化集中于 `messages`：

- `messages.responsePrefix`（出站前缀）和 `channels.whatsapp.messagePrefix`（WhatsApp入站前缀）
- 通过 `replyToMode` 实现回复线程化，并为每个渠道提供默认设置

详情：[配置](/gateway/configuration#messages) 和通道文档。
