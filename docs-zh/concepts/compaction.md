---
summary: 'Context window + compaction: how OpenClaw keeps sessions under model limits'
read_when:
  - You want to understand auto-compaction and /compact
  - You are debugging long sessions hitting context limits
---
# 上下文窗口与压缩

每种模型都有一个**上下文窗口**（即它能处理的最大标记数）。长时间进行的对话会不断累积消息和工具结果；一旦上下文窗口接近满载，OpenClaw就会对较早的历史记录进行**压缩**，以确保始终在限制范围内。

## 什么是压缩
压缩会将较早的对话内容**总结为一条紧凑的摘要条目**，同时保留最近的消息不变。该摘要会存储在会话历史中，因此未来的请求将使用：
- 压缩摘要
- 压缩点之后的最新消息

压缩结果会**持久化**保存在会话的 JSONL 历史中。

## 配置
有关`agents.defaults.compaction`设置，请参阅[压缩配置与模式](/concepts/compaction)。

## 自动压缩（默认启用）
当会话接近或超出模型的上下文窗口时，OpenClaw会触发自动压缩，并可能使用压缩后的上下文重试原始请求。

在详细模式下，您会看到：
- `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在压缩之前，OpenClaw可以执行一轮**静默内存刷新**，将持久性笔记存储到磁盘上。有关详情和配置，请参阅[内存](/concepts/memory)。

## 手动压缩
使用 `/compact`（可选附带指令）来强制执行一次压缩操作：
```
/compact Focus on decisions and open questions
```

## 上下文窗口来源
上下文窗口由具体模型决定。OpenClaw会根据已配置提供商目录中的模型定义来确定这些限制。

## 压缩与修剪的区别
- **压缩**：对对话进行总结并**持久化**存储在 JSONL 中。
- **会话修剪**：仅在内存中按请求修剪旧的**工具结果**。

有关修剪的详细信息，请参阅[/concepts/session-pruning](/concepts/session-pruning)。

## 小贴士
- 当会话感觉陈旧或上下文过于臃肿时，使用 `/compact`。
- 大型工具输出本身已被截断；修剪可以进一步减少工具结果的堆积。
- 如果您需要一个全新的会话，使用 `/new` 或 `/reset` 来启动一个新的会话 ID。
