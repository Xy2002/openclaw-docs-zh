---
summary: Heartbeat polling messages and notification rules
read_when:
  - Adjusting heartbeat cadence or messaging
  - Deciding between heartbeat and cron for scheduled tasks
---
# 心跳（网关）

> **心跳 vs Cron？** 请参阅 [Cron与心跳](/automation/cron-vs-heartbeat)，以了解在何时使用每种方法的指导。

心跳在主会话中运行“定期代理回合”，让模型能够及时提醒您需要注意的事项，同时尽量避免频繁打扰您。

## 快速入门（初学者）

1. 保持心跳启用（默认为 `30m`，或对于 Anthropic OAuth/设置令牌为 `1h`），或自定义心跳频率。
2. 在代理工作区创建一个极小的 `HEARTBEAT.md` 检查清单（可选但推荐）。
3. 决定心跳消息应发送到何处（默认为 `target: "last"`）。
4. 可选：启用心跳推理传递以提高透明度。
5. 可选：将心跳限制在活跃时段（本地时间）。

示例配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      }
    }
  }
}
```

## 默认设置

- 间隔：`30m`（当检测到 Anthropic OAuth/设置令牌身份验证模式时为 `1h`）。设置 `agents.defaults.heartbeat.every` 或按代理设置 `agents.list[].heartbeat.every`；使用 `0m` 来禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：

  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`

- 心跳提示会**原样**作为用户消息发送。系统提示包含“心跳”部分，并且运行会在内部被标记。
- 活跃时段（`heartbeat.activeHours`）根据配置的时区进行检查。在窗口之外，心跳会被跳过，直到下一个窗口内的触发点。

## 心跳提示的作用

默认提示有意设计得较为宽泛：

- **后台任务**：“考虑未完成的任务”会促使代理定期检查后续事项（收件箱、日历、提醒、待处理工作），并提醒任何紧急事务。
- **人类检查**：“白天偶尔与您的主人进行检查”会促使代理发送一条简短消息，询问“您是否需要什么”，同时根据您配置的本地时区自动调整时间，以避免在夜间打扰您（详情请参阅 [/concepts/timezone](/concepts/timezone))。

如果您希望心跳执行非常具体的任务（例如“检查 Gmail PubSub 统计数据”或“验证网关健康状况”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（原样发送）。

## 响应约定

- 如果没有需要注意的事项，回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，如果回复的**开头或结尾**出现 `HEARTBEAT_OK`，OpenClaw 将其视为确认。如果剩余内容**≤ `ackMaxChars`**（默认：300），则会删除该标记并丢弃回复。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；仅返回警报文本。

在非心跳期间，消息开头或结尾的随机 `HEARTBEAT_OK` 会被删除并记录；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",           // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-5",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        target: "last",         // last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567",     // optional channel-specific override
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300         // max chars allowed after HEARTBEAT_OK
      }
    }
  }
}
```

### 范围和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 会叠加；如果任何代理有 `heartbeat` 块，则**仅这些代理**会运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户渠道）覆盖每个渠道的设置。

按代理的心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，则**仅这些代理**会运行心跳。按代理块会叠加在 `agents.defaults.heartbeat` 上（因此您可以先设置共享默认值，然后按代理进行覆盖）。

示例：有两个代理，只有第二个代理运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last"
      }
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK."
        }
      }
    ]
  }
}
```

### 字段注释

- `every`：心跳间隔（持续时间字符串；默认单位为分钟）。
- `model`：心跳运行时的可选模型覆盖（`provider/model`）。
- `includeReasoning`：启用后，还会在可用时传递单独的 `Reasoning:` 消息（与 `/reasoning on` 形状相同）。
- `session`：心跳运行的可选会话密钥。
  - `main`（默认）：代理主会话。
  - 显式会话密钥（从 `openclaw sessions --json` 或 [sessions CLI](/cli/sessions) 复制）。
  - 会话密钥格式：参见 [Sessions](/concepts/session) 和 [Groups](/concepts/groups)。
- `target`：
  - `last`（默认）：发送到最后使用的外部渠道。
  - 显式渠道：`whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none`：运行心跳但**不对外传递**。
- `to`：可选的接收者覆盖（特定于渠道的 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。
- `prompt`：覆盖默认提示正文（不合并）。
- `ackMaxChars`：在交付前允许的最大字符数，超过 `HEARTBEAT_OK` 后。

## 交付行为

- 默认情况下，心跳在代理的主会话中运行（`agent:<id>:<mainKey>`），或者在 `session.scope = "global"` 时为 `global`。设置 `session` 可以将其覆盖为特定渠道会话（Discord/WhatsApp 等）。
- `session` 仅影响运行上下文；交付由 `target` 和 `to` 控制。
- 若要发送到特定渠道/接收者，设置 `target` + `to`。使用 `target: "last"`，交付将使用该会话的最后一个外部渠道。
- 如果主队列繁忙，心跳会被跳过并在稍后重试。
- 如果 `target` 解析为没有外部目的地，运行仍然会发生，但不会发送任何出站消息。
- 仅心跳回复**不会保持会话存活**；最后的 `updatedAt` 会被恢复，因此空闲超时行为正常。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而警报内容会被传递。您可以按渠道或按账户调整此设置：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false      # Hide HEARTBEAT_OK (default)
      showAlerts: true   # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true       # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

优先级：按账户 → 按渠道 → 按渠道默认 → 内置默认。

### 各标志的作用

- `showOk`：当模型返回仅包含 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送警报内容。
- `useIndicator`：为 UI 状态界面发出指示事件。

如果**全部三个**均为假，OpenClaw 将完全跳过心跳运行（不调用模型）。

### 按渠道 vs 按账户示例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| --- | --- |
| 默认行为（静默 OK，警报开启） | *(无需配置)* |
| 完全静默（无消息，无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在一个渠道中显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## 心跳.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会指示代理读取该文件。你可以把它看作你的“心跳检查清单”：小巧而稳定，每30分钟安全地运行一次。

如果 `HEARTBEAT.md` 存在但实际上是空的（只有空白行和如 `# Heading` 这样的 Markdown 标题），OpenClaw 会跳过心跳运行，以节省 API 调用。如果文件缺失，心跳仍会运行，由模型决定如何处理。

保持文件小巧（如简短的检查清单或提醒），以避免提示膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down *what is missing* and ask Peter next time.
```

### 代理可以更新 HEARTBEAT.md 吗？

可以——只要您提出要求。

`HEARTBEAT.md` 只是代理工作区中的普通文件，因此您可以在常规聊天中告诉代理：

- “更新 `HEARTBEAT.md` 以添加每日日历检查。”
- “重写 `HEARTBEAT.md`，使其更短并专注于收件箱的后续事项。”

如果您希望主动触发这种情况，也可以在心跳提示中加入一行明确说明：“如果检查清单已过时，请用更完善的版本更新 HEARTBEAT.md。”

安全提示：请勿在 `HEARTBEAT.md` 中放入机密信息（如 API 密钥、电话号码、私有令牌）——这些信息会成为提示上下文的一部分。

## 手动唤醒（按需）

您可以排队一个系统事件并触发立即心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个代理配置了 `heartbeat`，手动唤醒会立即触发每个代理的心跳。

使用 `--mode next-heartbeat` 可以等待下一个计划的触发点。

## 推理传递（可选）

默认情况下，心跳只传递最终的“答案”有效载荷。

如果您希望提高透明度，可以启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会传递一条带有前缀 `Reasoning:` 的单独消息，其形状与 `/reasoning on` 完全相同。这在代理管理多个会话或典籍时非常有用，可以帮助你了解它为何决定提醒你——但这也可能泄露比你预期更多的内部细节。在群聊中，最好保持此功能关闭。

## 成本意识

心跳运行完整的代理回合。较短的间隔会消耗更多令牌。保持 `HEARTBEAT.md` 小巧，如果您只需要内部状态更新，可以考虑使用更便宜的 `model` 或 `target: "none"`。
