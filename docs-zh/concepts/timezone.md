---
summary: 'Timezone handling for agents, envelopes, and prompts'
read_when:
  - You need to understand how timestamps are normalized for the model
  - Configuring the user timezone for system prompts
---
# 时区

OpenClaw 对时间戳进行标准化，使模型看到一个**单一的参考时间**。

## 消息信封（默认为本地时间）

传入的消息会被封装在如下形式的信封中：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

信封中的时间戳**默认为主机本地时间**，精度为分钟。

你可以通过以下方式覆盖这一设置：

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

- `envelopeTimezone: "utc"` 使用 UTC 时间。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机所在时区）。
- 使用明确的 IANA 时区（例如 `"Europe/Vienna"`），以固定偏移量为准。
- `envelopeTimestamp: "off"` 从信封头中移除绝对时间戳。
- `envelopeElapsed: "off"` 移除经过时间后缀（如 `+2m` 样式）。

### 示例

**本地时间（默认）：**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定时区：**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**经过时间：**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## 工具负载（原始提供商数据 + 规范化字段）

工具调用（`channels.discord.readMessages`、`channels.slack.readMessages` 等）返回**原始提供商时间戳**。我们还附加了规范化字段以确保一致性：

- `timestampMs`（UTC 基点毫秒）
- `timestampUtc`（ISO 8601 UTC 字符串）

原始提供商字段会原样保留。

## 用户时区用于系统提示词

设置 `agents.defaults.userTimezone`，以告知模型用户的本地时区。如果未设置，OpenClaw 将在运行时解析**主机时区**（无需写入配置）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } }
}
```

系统提示词包含：
- 包含本地时间和时区的 `Current Date & Time` 部分
- `Time format: 12-hour` 或 `24-hour`

你可以通过 `agents.defaults.timeFormat` 控制提示词格式（`auto` | `12` | `24`）。

有关完整行为和示例，请参阅 [日期与时间](/date-time)。
