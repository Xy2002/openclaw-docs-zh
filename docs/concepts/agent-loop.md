---
summary: 'Agent loop lifecycle, streams, and wait semantics'
read_when:
  - You need an exact walkthrough of the agent loop or lifecycle events
---
# 代理循环（OpenClaw）

代理循环是代理完整“真实”运行过程的核心：输入 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化。它是将消息转化为行动和最终回复，并保持会话状态一致的权威路径。

在OpenClaw中，一个循环代表每个会话中的单次序列化运行，它会在模型思考、调用工具并流式输出时发出生命周期和流事件。本文档详细说明了这一真实循环是如何端到端连接起来的。

## 入口点
- 网关 RPC：`agent` 和 __ INLINE_CODE_1__。
- CLI：`agent` 命令。

## 工作原理（高层次）
1) `agent` RPC 验证参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2) `agentCommand` 运行代理：
   - 解析模型及思考/详细模式默认值
   - 加载技能快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出，则发出 **生命周期结束/错误** 事件
3) `runEmbeddedPiAgent`：
   - 通过会话级和全局队列对运行进行序列化
   - 解析模型和身份验证配置文件，并构建 pi 会话
   - 订阅 pi 事件并流式传输助手/工具增量
   - 强制执行超时——如果超过超时时间则中止运行
   - 返回有效负载和用量元数据
4) `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw 的 `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5) `agent.wait` 使用 `waitForAgentJob`：
   - 等待 **生命周期结束/错误** 以获取 `runId`
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列与并发
- 运行按会话密钥（会话车道）进行序列化，并可选择通过全局车道。
- 这可防止工具/会话竞争，并保持会话历史的一致性。
- 消息通道可以选择队列模式（收集/引导/后续处理），这些模式会为该车道系统提供输入。
  参见 [命令队列](/concepts/queue)。

## 会话与工作区准备
- 工作区被解析并创建；沙盒运行可能会重定向到沙盒工作区根目录。
- 技能被加载（或从快照中重用），并注入环境和提示中。
- 引导/上下文文件被解析并注入系统提示报告中。
- 获取会话写锁；在开始流式传输之前，打开并准备好 `SessionManager`。

## 提示组装与系统提示
- 系统提示由 OpenClaw 的基础提示、技能提示、引导上下文以及每次运行的覆盖项组成。
- 强制执行特定于模型的限制和压缩预留标记。
- 参见 [系统提示](/concepts/system-prompt)，了解模型所见的内容。

## 钩子点（可拦截的位置）
OpenClaw 有两个钩子系统：
- **内部钩子**（网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：位于代理/工具生命周期和网关管道内的扩展点。

### 内部钩子（网关钩子）
- **`agent:bootstrap`**：在系统提示最终确定之前构建引导文件时运行。
  可用于添加或移除引导上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop`以及其他命令事件（参见钩子文档）。

有关设置和示例，请参见 [钩子](/hooks)。

### 插件钩子（代理 + 网关生命周期）
这些钩子在代理循环或网关管道中运行：
- **`before_agent_start`**：在运行开始前注入上下文或覆盖系统提示。
- **`agent_end`**：在运行完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`tool_result_persist`**：在工具结果写入会话记录之前同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：网关生命周期事件。

有关钩子 API 和注册详情，请参见 [插件](/plugin#plugin-hooks)。

## 流式传输 + 部分回复
- 助手增量从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 块式流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为块式回复发出。
- 参见 [流式传输](/concepts/streaming)，了解分块和块式回复的行为。

## 工具执行 + 消息工具
- 工具启动/更新/结束事件在 `tool` 流上发出。
- 工具结果在记录/发出前会针对大小和图像负载进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认。

## 回复塑造 + 抑制
- 最终有效负载由以下内容组成：
  - 助手文本（以及可选的推理）
  - 内联工具摘要（当启用详细模式且允许时）
  - 当模型出错时的助手错误文本
- `NO_REPLY` 被视为静默标记，并从传出有效负载中过滤掉。
- 消息工具的重复内容从最终有效负载列表中移除。
- 如果没有可渲染的有效负载剩余且工具出错，则发出后备工具错误回复
  （除非消息工具已经发送了用户可见的回复）。

## 压缩 + 重试
- 自动压缩会发出 `compaction` 流事件，并可能触发重试。
- 在重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 参见 [压缩](/concepts/compaction)，了解压缩管道。

## 事件流（当前）
- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并在备用情况下由 `agentCommand` 发出）
- `assistant`：从 pi-agent-core 流式传输的增量
- `tool`：从 pi-agent-core 流式传输的工具事件

## 聊天频道处理
- 助手增量被缓冲到聊天 `delta` 消息中。
- 在 **生命周期结束/错误** 时发出聊天 `final`。

## 超时
- `agent.wait` 默认值：30秒（仅等待）。`timeoutMs` 参数可覆盖。
- 代理运行时：`agents.defaults.timeoutSeconds` 默认 600 秒；在 `runEmbeddedPiAgent` 中强制执行中止计时器。

## 可能提前结束的情况
- 代理超时（中止）
- AbortSignal（取消）
- 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不终止代理）
