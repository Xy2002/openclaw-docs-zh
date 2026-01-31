---
summary: Cron jobs + wakeups for the Gateway scheduler
read_when:
  - Scheduling background jobs or wakeups
  - Wiring automation that should run with or alongside heartbeats
  - Deciding between heartbeat and cron for scheduled tasks
---
# Cron 作业（网关调度器）

> **Cron 与心跳？** 请参阅 [Cron 与心跳](/automation/cron-vs-heartbeat)，以了解何时使用每种机制的指导。

Cron 是网关内置的调度器。它会持久化作业，在正确的时间唤醒代理，并可选择性地将输出发送回聊天中。

如果你想要 *“每天早上运行一次”* 或 *“在 20 分钟后唤醒代理”*，那么 cron 就是你要使用的机制。

## 简而言之
- Cron 在 **网关内部** 运行（而不是在模型内部）。
- 作业会在 `~/.openclaw/cron/` 下持久化，因此重启不会丢失计划。
- 两种执行方式：
  - **主会话**：将系统事件加入队列，然后在下一次心跳时运行。
  - **隔离**：在 `cron:<jobId>` 中运行一个专用代理回合，可选择性地传递输出。
- 唤醒是一等公民：作业可以请求“立即唤醒”或“在下一次心跳时唤醒”。

## 初学者友好概述
可以将 cron 作业视为：**何时**运行 + **做什么**。

1) **选择计划**
   - 一次性提醒 → `schedule.kind = "at"`（CLI：`--at`）
   - 重复作业 → `schedule.kind = "every"` 或 `schedule.kind = "cron"`
   - 如果你的 ISO 时间戳省略了时区，则被视为 **UTC**。

2) **选择运行位置**
   - `sessionTarget: "main"` → 在下一次心跳期间使用主上下文运行。
   - `sessionTarget: "isolated"` → 在 `cron:<jobId>` 中运行一个专用代理回合。

3) **选择负载**
   - 主会话 → `payload.kind = "systemEvent"`
   - 孤立会话 → `payload.kind = "agentTurn"`

可选：`deleteAfterRun: true` 会从存储中移除成功的一次性作业。

## 概念

### 作业
Cron 作业是一个存储记录，包含：
- **计划**（何时运行），
- **负载**（要执行什么），
- 可选的 **交付**（输出应发送到哪里）。
- 可选的 **代理绑定**（`agentId`）：在特定代理下运行作业；如果缺失或未知，网关将回退到默认代理。

作业由稳定的 `jobId` 标识（用于 CLI/网关 API）。在代理工具调用中，`jobId` 是规范；为兼容性，也接受旧版 `id`。作业可以在成功的一次性运行后通过 `deleteAfterRun: true` 自动删除。

### 计划
Cron 支持三种计划类型：
- `at`：一次性时间戳（自纪元以来的毫秒数）。网关接受 ISO 8601 并强制转换为 UTC。
- `every`：固定间隔（毫秒）。
- `cron`：带有可选 IANA 时区的 5 字段 cron 表达式。

Cron 表达式使用 `croner`。如果省略时区，则使用网关主机的本地时区。

### 主会话与隔离执行

#### 主会话作业（系统事件）
主作业会将系统事件加入队列，并可选择性地唤醒心跳运行程序。它们必须使用 `payload.kind = "systemEvent"`。

- `wakeMode: "next-heartbeat"`（默认）：事件等待下一次计划的心跳。
- `wakeMode: "now"`：事件触发立即的心跳运行。

当你希望使用正常的心跳提示 + 主会话上下文时，这是最佳选择。请参阅 [心跳](/gateway/heartbeat)。

#### 隔离作业（专用 cron 会话）
隔离作业在会话 `cron:<jobId>` 中运行一个专用代理回合。

关键行为：
- 提示前缀为 `[cron:<jobId> <job name>]`，以提高可追溯性。
- 每次运行都会启动一个 **新会话 ID**（没有之前的对话延续）。
- 摘要会发布到主会话（前缀 `Cron`，可配置）。
- `wakeMode: "now"` 在发布摘要后立即触发心跳。
- 如果 `payload.deliver: true`，输出会传递到频道；否则保持内部。

对于嘈杂、频繁或“后台任务”，且不应刷屏主聊天历史的任务，请使用隔离作业。

### 负载形状（运行内容）
支持两种负载类型：
- `systemEvent`：仅限主会话，通过心跳提示路由。
- `agentTurn`：仅限隔离会话，运行一个专用代理回合。

常见的 `agentTurn` 字段：
- `message`：必需的文本提示。
- `model` / `thinking`：可选覆盖（见下文）。
- `timeoutSeconds`：可选超时覆盖。
- `deliver`：`true` 用于将输出发送到频道目标。
- `channel`：`last` 或特定频道。
- `to`：频道特定目标（电话/聊天/频道 ID）。
- `bestEffortDeliver`：避免因交付失败而导致作业失败。

隔离选项（仅适用于 `session=isolated`）：
- `postToMainPrefix`（CLI：`--post-prefix`）：主系统事件的前缀。
- `postToMainMode`：`summary`（默认）或 `full`。
- `postToMainMaxChars`：当 `postToMainMode=full` 时的最大字符数（默认 8000）。

### 模型和思维覆盖
隔离作业（`agentTurn`）可以覆盖模型和思维级别：
- `model`：提供商/模型字符串（例如 `anthropic/claude-sonnet-4-20250514`）或别名（例如 `opus`）
- `thinking`：思维级别（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`；仅适用于 GPT-5.2 + Codex 模型）

注意：你也可以在主会话作业上设置 `model`，但这会改变共享的主会话模型。我们建议仅对隔离作业进行模型覆盖，以避免意外的上下文变化。

解析优先级：
1. 作业负载覆盖（最高）
2. 钩子特定默认值（例如 `hooks.gmail.model`）
3. 代理配置默认值

### 交付（频道 + 目标）
隔离作业可以将输出传递到频道。作业负载可以指定：
- `channel`：`whatsapp` / `telegram` / `discord` / `slack` / `mattermost`（插件） / `signal` / `imessage` / `last`
- `to`：频道特定的接收目标

如果 `channel` 或 `to` 被忽略，cron 可以回退到主会话的“最后路由”（代理上次回复的地方）。

交付注意事项：
- 如果设置了 `to`，cron 会自动传递代理的最终输出，即使 `deliver` 被忽略。
- 当你希望在没有明确 `to` 的情况下实现最后路由交付时，使用 `deliver: true`。
- 当存在 `to` 时，使用 `deliver: false` 来保持输出内部。

目标格式提醒：
- Slack/Discord/Mattermost（插件）目标应使用显式前缀（例如 `channel:<id>`、`user:<id>`），以避免歧义。
- Telegram 主题应使用 `:topic:` 格式（见下文）。

#### Telegram 交付目标（主题/论坛线程）
Telegram 通过 `message_thread_id` 支持论坛主题。对于 cron 交付，你可以将主题/线程编码到 `to` 字段中：

- `-1001234567890`（仅聊天 ID）
- `-1001234567890:topic:123`（首选：显式主题标记）
- `-1001234567890:123`（简写：数字后缀）

像 `telegram:...` / `telegram:group:...` 这样的带前缀的目标也被接受：
- `telegram:group:-1001234567890:topic:123`

## 存储与历史
- 作业存储：`~/.openclaw/cron/jobs.json`（网关管理的 JSON）。
- 运行历史：`~/.openclaw/cron/runs/<jobId>.jsonl`（JSONL，自动修剪）。
- 覆盖存储路径：配置中的 `cron.store`。

## 配置

```json5
{
  cron: {
    enabled: true, // default true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1 // default 1
  }
}
```

完全禁用 cron：
- `cron.enabled: false`（配置）
- `OPENCLAW_SKIP_CRON=1`（环境）

## CLI 快速入门

一次性提醒（UTC ISO，成功后自动删除）：
```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

一次性提醒（主会话，立即唤醒）：
```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

定期隔离作业（传递到 WhatsApp）：
```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

定期隔离作业（传递到 Telegram 主题）：
```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --deliver \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

带有模型和思维覆盖的隔离作业：
```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"

Agent selection (multi-agent setups):
```bash
# 将作业固定到代理 "ops"（如果该代理缺失则回退到默认代理）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 在现有作业上切换或清除代理
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```
```

手动运行（调试）：
```bash
openclaw cron run <jobId> --force
```

编辑现有作业（修补字段）：
```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

运行历史：
```bash
openclaw cron runs --id <jobId> --limit 50
```

无需创建作业的即时系统事件：
```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## 网关 API 表面
- `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`
- `cron.run`（强制或到期）、`cron.runs`
对于无需作业的即时系统事件，请使用 [`openclaw system event`](/cli/system)。

## 故障排除

### “没有任何东西运行”
- 检查 cron 是否已启用：`cron.enabled` 和 `OPENCLAW_SKIP_CRON`。
- 检查网关是否持续运行（cron 在网关进程内运行）。
- 对于 `cron` 计划：确认时区（`--tz`）与主机时区是否一致。

### Telegram 传递到错误的地方
- 对于论坛主题，使用 `-100…:topic:<id>`，使其明确且无歧义。
- 如果你在日志或存储的“最后路由”目标中看到 `telegram:...` 前缀，这是正常的；
  cron 交付接受这些前缀，并仍能正确解析主题 ID。
