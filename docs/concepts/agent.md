---
summary: 'Agent runtime (embedded pi-mono), workspace contract, and session bootstrap'
read_when:
  - 'Changing agent runtime, workspace bootstrap, or session behavior'
---
# 代理运行时 🤖

OpenClaw 运行一个源自 **pi-mono** 的嵌入式代理运行时。

## 工作空间（必需）

OpenClaw 使用单个代理工作空间目录 (`agents.defaults.workspace`) 作为代理的 **唯一** 工作目录 (`cwd`)，用于存放工具和上下文。

推荐：使用 `openclaw setup` 创建 `~/.openclaw/openclaw.json`（如果缺失），并初始化工作空间文件。

完整工作空间布局 + 备份指南：[代理工作空间](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以通过位于 `agents.defaults.sandbox.workspaceRoot` 下的会话级工作空间来覆盖此设置（参见 [网关配置](/gateway/configuration))。

## 引入的引导文件

在 `agents.defaults.workspace` 内部，OpenClaw 期望存在以下用户可编辑的文件：
- `AGENTS.md` — 操作说明 + “记忆”
- `SOUL.md` — 角色、边界、语气
- `TOOLS.md` — 用户维护的工具注释（例如 `imsg`, `sag`, 约定）
- `BOOTSTRAP.md` — 一次性首次运行仪式（完成后删除）
- `IDENTITY.md` — 代理名称/风格/表情符号
- `USER.md` — 用户档案 + 首选地址

在新会话的第一轮中，OpenClaw 会将这些文件的内容直接注入代理上下文。

空白文件会被跳过。大文件会被裁剪并用标记截断，以保持提示简洁（完整内容请查看文件）。

如果某个文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 将创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅在 **全新工作空间** 中创建（不存在其他引导文件）。如果您在完成仪式后将其删除，在后续重启时不应重新创建。

要完全禁用引导文件的创建（适用于预先填充的工作空间），请设置：

```json5
{ agent: { skipBootstrap: true } }
```

## 内置工具

核心工具（读取/执行/编辑/写入及相关系统工具）始终可用，但受工具策略约束。`apply_patch` 是可选的，并由 `tools.exec.applyPatch` 控制。`TOOLS.md` 并不控制哪些工具存在；它只是指导 *您* 希望如何使用这些工具。

## 技能

OpenClaw 从三个位置加载技能（当名称冲突时，工作空间优先）：
- 捆绑技能（随安装一起提供）
- 受管理/本地技能：`~/.openclaw/skills`
- 工作空间技能：`<workspace>/skills`

技能可通过配置或环境进行限制（参见 [网关配置](/gateway/configuration) 中的 `skills`）。

## pi-mono 集成

OpenClaw 重用了 pi-mono 代码库中的部分组件（模型/工具），但 **会话管理、发现机制和工具连接由 OpenClaw 自主负责**。

- 不使用 pi-coding 代理运行时。
- 不参考 `~/.pi/agent` 或 `<workspace>/.pi` 设置。

## 会话

会话记录以 JSONL 格式存储在：
- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，由 OpenClaw 选择。旧版 Pi/Tau 会话文件夹 **不会** 被读取。

## 流式传输中的引导

当队列模式为 `steer` 时，传入消息会被注入当前运行中。队列会在 **每次工具调用之后** 检查；如果队列中有消息，则跳过当前助手消息中的剩余工具调用（工具结果会显示“因排队用户消息而跳过”），然后在下一次助手响应之前注入排队的用户消息。

当队列模式为 `followup` 或 `collect` 时，传入消息会一直保留到当前回合结束，然后在新的代理回合开始时处理排队的消息负载。有关模式及去抖动/上限行为，请参阅 [队列](/concepts/queue)。

块流式传输会在助手块完成后立即发送；该功能 **默认关闭** (`agents.defaults.blockStreamingDefault: "off"`)。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` vs `message_end`；默认为 text_end）。
通过 `agents.defaults.blockStreamingChunk` 控制软块分块（默认为 800–1200 字符；优先段落换行，其次为行尾换行，最后是句子）。
通过 `agents.defaults.blockStreamingCoalesce` 合并流式传输的块，以减少单行垃圾信息（在发送前基于空闲状态进行合并）。非 Telegram 频道需要显式启用 `*.blockStreaming: true` 才能支持块回复。
工具启动时会发出详细的工具摘要（无去抖动）；在可用时，UI 通过代理事件流式传输工具输出。
更多详情：[流式传输 + 分块](/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过在 **第一个** `/` 处进行拆分来解析。

- 在配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如 `openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会将输入视为别名或 **默认提供商** 的模型（仅在模型 ID 中没有 `/` 时有效）。

## 最小化配置

至少需要设置：
- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈推荐）

---

*接下来：[群聊](/concepts/group-messages)* 🦞
