---
summary: 'Streaming + chunking behavior (block replies, draft streaming, limits)'
read_when:
  - Explaining how streaming or chunking works on channels
  - Changing block streaming or channel chunking behavior
  - Debugging duplicate/early block replies or draft streaming
---
# 流式传输 + 分块

OpenClaw 有两个独立的“流式传输”层：
- **区块流式传输（频道）：** 在助手生成内容时，即时发出已完成的**区块**。这些是普通的频道消息，而非标记增量。
- **类似标记的流式传输（仅限 Telegram）：** 在生成过程中，用部分文本更新一个**草稿气泡**；最终消息在生成结束时发送。

目前，外部频道消息中**不存在真正的标记流式传输**。Telegram 的草稿流式传输是唯一提供部分流式传输的界面。

## 区块流式传输（频道消息）

区块流式传输在助手输出可用时，以粗粒度的块形式发送。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```
图例：
- `text_delta/events`：模型流事件（对于非流式传输模型，可能较为稀疏）。
- `chunker`：应用最小/最大限制及拆分偏好的`EmbeddedBlockChunker`。
- `channel send`：实际发出的消息（区块回复）。

**控制选项：**
- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 频道覆盖：`*.blockStreaming`（以及按账户变体），用于强制为每个频道启用`"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式区块）。
- 频道硬性上限：`*.textChunkLimit`（例如，`channels.whatsapp.textChunkLimit`）。
- 频道分块模式：`*.chunkMode`（默认为`length`；`newline`在长度分块之前按空行（段落边界）进行拆分）。
- Discord 软性上限：`channels.discord.maxLinesPerMessage`（默认为 17），用于拆分过高的回复以避免 UI 截断。

**边界语义：**
- `text_end`：一旦分块器发出区块，立即开始流式传输；每次遇到`text_end`时清空缓冲区。
- `message_end`：等待助手消息完成后再清空缓冲输出。

如果缓冲文本超过`maxChars`，`message_end` 仍会使用分块器，因此它可以在最后发出多个区块。

## 分块算法（低/高限制）

区块分块由`EmbeddedBlockChunker` 实现：
- **低限制：** 在缓冲区小于等于`minChars` 时不会发出区块（除非被强制）。
- **高限制：** 优先在达到`maxChars` 之前进行拆分；若被强制，则在`maxChars` 处拆分。
- **拆分偏好顺序：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬性拆分。
- **代码围栏：** 永远不在围栏内拆分；若在`maxChars` 处被迫拆分，则先关闭再重新打开围栏，以保持 Markdown 的有效性。

`maxChars` 受频道`textChunkLimit` 的限制，因此您无法超出每个频道的上限。

## 合并（合并流式区块）

当区块流式传输启用时，OpenClaw 可以在发送之前**合并连续的区块块**。这减少了“单行垃圾信息”，同时仍能提供渐进式的输出。

- 合并会在出现**空闲间隔**（`idleMs`）后才进行刷新。
- 缓冲区受`maxChars` 的限制，一旦超过该值就会被清空。
- `minChars` 会阻止微小片段在文本积累到足够之前发送（最终刷新始终会发送剩余文本）。
- 连接符源自`blockStreamingChunk.breakPreference`（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 频道覆盖可通过`*.blockStreamingCoalesce` 设置（包括按账户配置）。
- 默认合并阈值`minChars` 已提高到 1500，适用于 Signal、Slack 和 Discord，除非另有设置。

## 区块之间的类人节奏
当区块流式传输启用时，您可以在**第一个区块之后**的区块回复之间添加一个**随机暂停**。这使得多气泡回复显得更加自然。

- 配置：`agents.defaults.humanDelay`（可通过`agents.list[].humanDelay` 对每个代理进行覆盖）。
- 模式：`off`（默认）、`natural`（800–2500 毫秒）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**区块回复**，不适用于最终回复或工具摘要。

## “分块流式传输或一次性全部传输”
这对应于：
- **分块流式传输：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 频道还需要 `*.blockStreaming: true`。
- **一次性全部流式传输：** `blockStreamingBreak: "message_end"`（一次性刷新，如果内容非常长，可能会发送多个区块）。
- **无区块流式传输：** `blockStreamingDefault: "off"`（仅发送最终回复）。

**频道提示：** 对于非 Telegram 频道，除非显式将`*.blockStreaming` 设置为`true`，否则区块流式传输将处于关闭状态。Telegram 可以在没有区块回复的情况下进行草稿流式传输（`channels.telegram.streamMode`）。

配置位置提醒：`blockStreaming*` 的默认设置位于`agents.defaults` 下，而不是根配置下。

## Telegram 草稿流式传输（类似标记）
Telegram 是唯一支持草稿流式传输的渠道：
- 在带有主题的**私人聊天**中使用 Bot API `sendMessageDraft`。
- `channels.telegram.streamMode: "partial" | "block" | "off"`。
  - `partial`：草稿根据最新的流式文本进行更新。
  - `block`：草稿以分块的形式更新（采用相同的分块规则）。
  - `off`：无草稿流式传输。
- 草稿分块配置（仅适用于 `streamMode: "block"`）：`channels.telegram.draftChunk`（默认值：`minChars: 200`、`maxChars: 800`）。
- 草稿流式传输与区块流式传输是独立的；区块回复默认关闭，仅在非 Telegram 频道上通过 `*.blockStreaming: true` 才会启用。
- 最终回复仍然是普通消息。
- `/reasoning stream` 将推理写入草稿气泡（仅限 Telegram）。

当草稿流式传输激活时，OpenClaw 会禁用该回复的区块流式传输，以避免双重流式传输。

```
Telegram (private + topics)
  └─ sendMessageDraft (draft bubble)
       ├─ streamMode=partial → update latest text
       └─ streamMode=block   → chunker updates draft
  └─ final reply → normal message
```
图例：
- `sendMessageDraft`：Telegram 草稿气泡（不是真实消息）。
- `final reply`：正常的 Telegram 消息发送。
