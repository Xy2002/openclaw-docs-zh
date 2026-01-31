---
summary: Command queue design that serializes inbound auto-reply runs
read_when:
  - Changing auto-reply execution or concurrency
---
# 命令队列（2026-01-16）

我们通过一个小型的进程内队列对所有渠道的入站自动回复运行进行串行化处理，以防止多个座席运行发生冲突，同时仍允许会话之间的安全并行执行。

## 为什么
- 自动回复运行可能成本较高（如调用大语言模型），且当多个入站消息几乎同时到达时，可能会发生冲突。
- 通过串行化处理，可以避免争用共享资源（如会话文件、日志、CLI 标准输入），并降低触发上游速率限制的风险。

## 工作原理
- 一个车道感知的先进先出队列以可配置的并发上限来处理每个车道中的任务（未配置车道的默认值为 1；主车道默认为 4，子座席车道默认为 8）。
- `runEmbeddedPiAgent` 按照 **会话键**（车道 `session:<key>`）将任务加入队列，以确保每个会话中始终只有一个活动运行。
- 每个会话运行随后被排队到一个 **全局车道**（默认为 `main`），从而通过 `agents.defaults.maxConcurrent` 对整体并行性进行限制。
- 当启用详细日志记录时，如果排队运行在开始前等待超过约 2 秒，会发出简短通知。
- 在通道支持的情况下，打字指示器会在任务入队时立即触发，因此在我们等待轮到自己时，用户体验不会受到影响。

## 队列模式（按渠道）
入站消息可以引导当前运行、等待后续回合，或两者兼而有之：
- `steer`: 立即注入到当前运行中（在下一个工具边界之后取消待处理的工具调用）。如果非流式传输，则回退到后续回合。
- `followup`: 在当前运行结束后，将消息排队等待下一次座席回合。
- `collect`: 将所有排队的消息合并为 **单个** 后续回合（默认）。如果消息针对不同的渠道或线程，则单独处理，以保留路由。
- `steer-backlog`（又称 `steer+backlog`）：既立即引导，又保留消息以供后续回合使用。
- `interrupt`（旧版）：中止该会话的当前运行，然后处理最新消息。
- `queue`（旧版别名）：与 `steer` 相同。

引导后置意味着在引导运行完成后仍可获得后续响应，因此流式表面可能会显示为重复内容。如果您希望每条入站消息只产生一个响应，请优先选择 `collect`/`steer`。
将 `/queue collect` 作为独立命令发送（按会话）或设置 `messages.queue.byChannel.discord: "collect"`。

默认设置（在配置中未指定时）：
- 所有表面 → `collect`

可通过 `messages.queue` 在全局或按渠道级别进行配置：

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" }
    }
  }
}
```

## 队列选项
这些选项适用于 `followup`、`collect` 和 `steer-backlog`（以及当它们回退到后续回合时的 `steer`）：
- `debounceMs`: 在启动后续回合之前等待安静期（防止“继续，继续”现象）。
- `cap`: 每个会话的最大排队消息数。
- `drop`: 溢出策略（`old`、`new`、`summarize`）。

汇总功能会保留一份已丢弃消息的简短列表，并将其作为合成的后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话的覆盖设置
- 发送 `/queue <mode>` 作为独立命令，以存储当前会话的模式。
- 可以组合使用选项：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 清除会话覆盖设置。

## 适用范围和保证
- 适用于使用网关回复管道的所有入站渠道中的自动回复座席运行（WhatsApp Web、Telegram、Slack、Discord、Signal、iMessage、网页聊天等）。
- 默认车道（`main`）适用于整个进程的入站 + 主心跳信号；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行运行。
- 可能存在其他车道（例如 `cron`、`subagent`），以便后台作业可以并行运行而不阻塞入站回复。
- 按会话的车道可确保同一时间只有一个座席运行操作给定会话。
- 不依赖外部依赖项或后台工作线程；纯 TypeScript + Promise 实现。

## 故障排除
- 如果命令似乎卡住了，请启用详细日志，并查找包含“排队 …ms”的行，以确认队列正在正常处理。
- 如果需要了解队列深度，请启用详细日志，并观察队列计时行。
