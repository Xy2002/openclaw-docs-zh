---
summary: 'Date and time handling across envelopes, prompts, tools, and connectors'
read_when:
  - You are changing how timestamps are shown to the model or users
  - You are debugging time formatting in messages or system prompt output
---
# 日期与时间

OpenClaw 默认使用**主机本地时间作为传输时间戳**，并且仅在系统提示中使用**用户时区**。提供程序的时间戳会被保留，以便工具保持其原生语义（当前时间可通过 `session_status` 获取）。

## 消息信封（默认为本地时间）

传入消息会以时间戳（精确到分钟）进行封装：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

此信封时间戳**默认为主机本地时间**，与提供程序的时区无关。

你可以覆盖此行为：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on" // "on" | "off"
    }
  }
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "local"` 使用主机时区。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机时区）。
- 使用明确的 IANA 时区（例如 `"America/Chicago"`）以指定固定时区。
- `envelopeTimestamp: "off"` 从信封标头中移除绝对时间戳。
- `envelopeElapsed: "off"` 移除经过时间后缀（采用 `+2m` 样式）。

### 示例

**本地时间（默认）：**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**启用经过时间：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系统提示：当前日期与时间

如果已知用户时区，系统提示将包含一个专门的**当前日期与时间**部分，其中仅显示**时区信息**（不包含具体时间或时间格式），以确保提示缓存的稳定性：

```
Time zone: America/Chicago
```

当代理需要获取当前时间时，请使用 `session_status` 工具；状态卡片中会包含一条时间戳行。

## 系统事件行（默认为本地时间）

插入到代理上下文中的排队系统事件会在前面加上时间戳，所使用的时区选择与消息信封相同（默认为主机本地时间）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 配置用户时区 + 格式

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto" // auto | 12 | 24
    }
  }
}
```

- `userTimezone` 为提示上下文设置**用户本地时区**。
- `timeFormat` 控制提示中**12 小时制/24 小时制显示**。`auto` 遵循操作系统偏好设置。

## 时间格式检测（自动）

当 `timeFormat: "auto"` 启用时，OpenClaw 会检查操作系统偏好设置（macOS/Windows），并在必要时回退到区域设置格式。检测到的值会**按进程缓存**，以避免重复调用系统 API。

## 工具负载 + 连接器：原始提供程序时间 + 规范化字段

渠道工具返回**提供程序原生时间戳**，并添加规范化字段以保证一致性：

- `timestampMs`：以毫秒为单位的 Unix 时间戳（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

原始提供程序字段会被保留，以确保数据完整无损。

- Slack：来自 API 的类似 Unix 时间戳的字符串
- Discord：UTC ISO 时间戳
- Telegram/WhatsApp：提供程序特定的数字或 ISO 时间戳

如果你需要本地时间，可以在下游根据已知时区进行转换。

## 相关文档

- [系统提示](/concepts/system-prompt)
- [时区](/concepts/timezone)
- [消息](/concepts/messages)
