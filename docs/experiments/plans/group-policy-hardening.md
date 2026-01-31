---
summary: 'Telegram allowlist hardening: prefix + whitespace normalization'
read_when:
  - Reviewing historical Telegram allowlist changes
---
# Telegram 允许列表强化

**日期**: 2026-01-05  
**状态**: 完成  
**PR**: #216

## 摘要

Telegram 允许列表现在不区分大小地接受 `telegram:` 和 `tg:` 前缀，并且能够容忍意外的空白字符。这使得入站允许列表检查与出站发送规范化保持一致。

## 变更内容

- 前缀 `telegram:` 和 `tg:` 被视为相同（不区分大小写）。
- 允许列表条目会被修剪；空条目将被忽略。

## 示例

对于同一个 ID，以下所有条目均被接受：

- `telegram:123456`
- `TG:123456`
- ` tg:123456 `

## 重要性

从日志或聊天 ID 中复制粘贴的内容通常包含前缀和空白字符。通过进行规范化，可以避免在决定是否在私信或群组中回复时出现误判。

## 相关文档

- [群组聊天](/concepts/groups)
- [Telegram 提供商](/channels/telegram)
