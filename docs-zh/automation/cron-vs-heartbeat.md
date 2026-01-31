---
summary: Guidance for choosing between heartbeat and cron jobs for automation
read_when:
  - Deciding how to schedule recurring tasks
  - Setting up background monitoring or notifications
  - Optimizing token usage for periodic checks
---
# Cron 与心跳：何时使用哪种机制

心跳和 Cron 作业都允许你按计划运行任务。本指南将帮助你为自己的用例选择合适的机制。

## 快速决策指南

| 用例 | 推荐 | 原因 |
|----------|-------------|-----|
| 每 30 分钟检查一次收件箱 | 心跳 | 可与其他检查批量处理，具备上下文感知能力 |
| 每天早上 9 点准时发送日报 | Cron（隔离） | 需要精确的时间安排 |
| 监控日历以获取即将发生的事件 | 心跳 | 非常适合周期性状态感知 |
| 每周运行深度分析 | Cron（隔离） | 独立任务，可使用不同的模型 |
| 20 分钟后提醒我 | Cron（主会话，`--at`） | 一次性任务，时间精准 |
| 后台项目健康检查 | 心跳 | 利用现有周期进行附加监控 |

## 心跳：周期性状态感知

心跳在**主会话**中以固定间隔（默认 30 分钟）运行。其设计目的是让代理定期检查各项状态，并及时汇报重要信息。

### 何时使用心跳

- **多项周期性检查**：与其设置 5 个独立的 Cron 作业分别检查收件箱、日历、天气、通知和项目状态，不如使用一个心跳来批量完成所有这些检查。
- **上下文感知决策**：代理拥有完整的主会话上下文，因此能够智能判断哪些事项紧急、哪些可以稍后处理。
- **对话连续性**：心跳运行共享同一会话，代理可以记住最近的对话并自然地跟进。
- **低开销监控**：一个心跳即可替代多个小型轮询任务。

### 心跳的优势

- **批量处理多项检查**：一次代理操作即可同时检查收件箱、日历和通知。
- **减少 API 调用**：单个心跳比 5 个独立的 Cron 作业更经济。
- **上下文感知**：代理了解你当前的工作内容，并据此优先处理相关事项。
- **智能抑制**：如果没有需要关注的内容，代理会回复 `HEARTBEAT_OK`，不会发送任何消息。
- **自然的时间安排**：根据队列负载略有偏差，但这对大多数监控场景来说是完全可以接受的。

### 心跳示例：HEARTBEAT.md 检查清单

```md
# Heartbeat checklist

- Check email for urgent messages
- Review calendar for events in next 2 hours
- If a background task finished, summarize results
- If idle for 8+ hours, send a brief check-in
```

代理在每次心跳时读取此清单，并在一次操作中处理所有事项。

### 配置心跳

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",        // interval
        target: "last",      // where to deliver alerts
        activeHours: { start: "08:00", end: "22:00" }  // optional
      }
    }
  }
}
```

完整配置请参见 [心跳](/gateway/heartbeat)。

## Cron：精确调度

Cron 作业在**精确的时间点**运行，并且可以在隔离会话中执行，而不影响主会话上下文。

### 何时使用 Cron

- **需要精确时间**：“每周一上午 9:00 发送”（而不是“大约 9 点”）。
- **独立任务**：不需要对话上下文的任务。
- **不同模型/思维模式**：需要更强大模型的重型分析任务。
- **一次性提醒**：“20 分钟后提醒我”，使用 `--at`。
- **高频或嘈杂任务**：如果任务过于频繁，可能会干扰主会话历史记录。
- **外部触发**：无论代理是否处于活动状态，任务都应独立运行。

### Cron 的优势

- **精确时间**：支持带时区的 5 字段 Cron 表达式。
- **会话隔离**：在 `cron:<jobId>` 中运行，不会污染主历史记录。
- **模型覆盖**：每个作业可以使用更便宜或更强大的模型。
- **交付控制**：可以直接发送到某个渠道；默认仍会在主会话中发布摘要（可配置）。
- **无需代理上下文**：即使主会话空闲或被压缩，任务仍能运行。
- **支持一次性任务**：`--at` 可用于指定未来的精确时间戳。

### Cron 示例：每日晨间简报

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

此任务将在纽约时间上午 7:00 准确执行，使用 Opus 模型以确保质量，并直接发送到 WhatsApp。

### Cron 示例：一次性提醒

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

完整 CLI 参考请参见 [Cron 作业](/automation/cron-jobs)。

## 决策流程图

```
Does the task need to run at an EXACT time?
  YES -> Use cron
  NO  -> Continue...

Does the task need isolation from main session?
  YES -> Use cron (isolated)
  NO  -> Continue...

Can this task be batched with other periodic checks?
  YES -> Use heartbeat (add to HEARTBEAT.md)
  NO  -> Use cron

Is this a one-shot reminder?
  YES -> Use cron with --at
  NO  -> Continue...

Does it need a different model or thinking level?
  YES -> Use cron (isolated) with --model/--thinking
  NO  -> Use heartbeat
```

## 结合使用两者

最高效的设置是**同时使用两者**：

1. **心跳**每 30 分钟批量处理例行监控任务（收件箱、日历、通知等）。
2. **Cron**负责精确的时间安排（日报、周报）以及一次性提醒。

### 示例：高效自动化设置

**HEARTBEAT.md**（每 30 分钟检查一次）：
```md
# Heartbeat checklist
- Scan inbox for urgent emails
- Check calendar for events in next 2h
- Review any pending tasks
- Light check-in if quiet for 8+ hours
```

**Cron 作业**（精确时间安排）：
```bash
# Daily morning briefing at 7am
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --deliver

# Weekly project review on Mondays at 9am
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# One-shot reminder
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```


## Lobster：带有审批的确定性工作流

Lobster 是用于**多步骤工具管道**的工作流运行时，适用于需要确定性执行和显式审批的场景。
当任务超出单次代理操作范围，并且你需要一个可恢复的工作流及人工检查点时，就该使用 Lobster。

### Lobster 的适用场景

- **多步骤自动化**：你需要固定的工具调用流程，而不仅仅是一次性的提示。
- **审批关卡**：副作用应在你批准后暂停，然后继续执行。
- **可恢复运行**：在暂停的工作流中继续执行，而无需重新运行之前的步骤。

### 如何与心跳和 Cron 配合使用

- **心跳/Cron**决定何时启动运行。
- **Lobster**定义一旦运行开始后将执行的*具体步骤*。

对于计划的工作流，使用 Cron 或心跳触发代理操作，由代理调用 Lobster。
对于临时工作流，则直接调用 Lobster。

### 操作注意事项（来自代码）

- Lobster 以**本地子进程**（`lobster` CLI）的形式在工具模式下运行，并返回一个**JSON 封装**。
- 如果工具返回 `needs_approval`，则需使用 `resumeToken` 和 `approve` 标志继续运行。
- 工具是**可选插件**；建议通过 `tools.alsoAllow: ["lobster"]` 以附加方式启用。
- 如果传递 `lobsterPath`，则必须是**绝对路径**。

完整用法和示例请参见 [Lobster](/tools/lobster)。

## 主会话 vs 隔离会话

心跳和 Cron 都可以与主会话交互，但方式有所不同：

| | 心跳 | Cron（主会话） | Cron（隔离会话） |
|---|---|---|---|
| 会话 | 主会话 | 主会话（通过系统事件） | `cron:<jobId>` |
| 历史 | 共享 | 共享 | 每次运行都是全新历史 |
| 上下文 | 完整 | 完整 | 无（从头开始） |
| 模型 | 主会话模型 | 主会话模型 | 可覆盖 |
| 输出 | 若非 `HEARTBEAT_OK`，则会送达 | 心跳提示 + 事件 | 摘要发布到主会话 |

### 何时使用主会话 Cron

当您希望：
- 提醒/事件出现在主会话上下文中
- 代理在下次心跳时以完整上下文处理该事件
- 不需要单独的隔离运行
时，请使用 `--session main` 并搭配 `--system-event`。

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### 何时使用隔离 Cron

当您希望：
- 拥有一个没有先前上下文的干净环境
- 使用不同的模型或思维设置
- 输出直接发送到某个渠道（默认情况下摘要仍会发布到主会话）
- 历史不会污染主会话
时，请使用 `--session isolated`。

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --deliver
```

## 成本考量

| 机制 | 成本概况 |
|-----------|--------------|
| 心跳 | 每 N 分钟一次操作；成本随 HEARTBEAT.md 大小变化 |
| Cron（主会话） | 在下次心跳时添加事件（无需隔离运行） |
| Cron（隔离会话） | 每个作业都需要一次完整的代理操作；可使用更便宜的模型 |

**提示**：
- 保持 `HEARTBEAT.md` 简短，以最小化 token 开销。
- 将相似的检查合并到心跳中，而不是使用多个 Cron 作业。
- 如果只需要内部处理，可在心跳中使用 `target: "none"`。
- 对于常规任务，可使用隔离 Cron 并搭配更便宜的模型。

## 相关内容

- [心跳](/gateway/heartbeat) - 完整心跳配置
- [Cron 作业](/automation/cron-jobs) - 完整 Cron CLI 和 API 参考
- [系统](/cli/system) - 系统事件 + 心跳控制
