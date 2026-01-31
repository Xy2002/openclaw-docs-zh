---
summary: Reaction semantics shared across channels
read_when:
  - Working on reactions in any channel
---
# 反应工具

跨渠道共享的反应语义：

- 添加反应时，必须使用 `emoji`。
- 在支持的情况下，`emoji=""` 会移除机器人的反应。
- 在支持的情况下，`remove: true` 会移除指定的表情符号（需要 `emoji`）。

渠道说明：

- **Discord/Slack**：空的 `emoji` 会移除机器人对该消息的所有反应；`remove: true` 只移除该特定表情符号。
- **Google Chat**：空的 `emoji` 会移除应用对该消息的反应；`remove: true` 只移除该特定表情符号。
- **Telegram**：空的 `emoji` 会移除机器人的反应；`remove: true` 也会移除反应，但仍然需要一个非空的 `emoji` 来进行工具验证。
- **WhatsApp**：空的 `emoji` 会移除机器人的反应；`remove: true` 映射到空表情符号（仍需要 `emoji`）。
- **Signal**：当启用 `channels.signal.reactionNotifications` 时，入站反应通知会发出系统事件。
