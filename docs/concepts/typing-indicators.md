---
summary: When OpenClaw shows typing indicators and how to tune them
read_when:
  - Changing typing indicator behavior or defaults
---
# 键入指示器

在运行处于活动状态时，键入指示器会发送到聊天频道。使用
`agents.defaults.typingMode` 控制**何时**开始键入，使用 `typingIntervalSeconds`
控制其**刷新频率**。

## 默认行为
当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保持旧版行为：
- **私聊**：一旦模型循环开始，立即启动键入。
- **包含提及的群聊**：立即启动键入。
- **不包含提及的群聊**：仅在消息文本开始流式传输时才启动键入。
- **心跳运行**：禁用键入。

## 模式
将 `agents.defaults.typingMode` 设置为以下之一：
- `never` — 从不显示键入指示器。
- `instant` — 在**模型循环开始时即刻**启动键入，即使运行随后仅返回静默回复标记。
- `thinking` — 在**第一个推理增量**时启动键入（需要为运行启用 `reasoningLevel: "stream"`）。
- `message` — 在**第一个非静默文本增量**时启动键入（忽略 `NO_REPLY` 静默标记）。

“触发时机”的先后顺序：
`never` → `message` → `thinking` → `instant`

## 配置
```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6
  }
}
```

您可以在每个会话中覆盖模式或刷新频率：
```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4
  }
}
```

## 注意事项
- `message` 模式不会为仅包含静默回复的消息显示键入（例如用于抑制输出的 `NO_REPLY` 标记）。
- `thinking` 仅在运行流式传输推理时才会触发（`reasoningLevel: "stream"`）。如果模型不发出推理增量，键入将不会启动。
- 无论模式如何，心跳始终不会显示键入。
- `typingIntervalSeconds` 控制的是**刷新频率**，而非启动时间。默认值为 6 秒。
