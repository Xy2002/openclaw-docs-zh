---
summary: Directive syntax for /think + /verbose and how they affect model reasoning
read_when:
  - Adjusting thinking or verbose directive parsing or defaults
---
# 思维层级（/think 指令）

## 功能说明
- 任何入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 层级（别名）：`off | minimal | low | medium | high | xhigh`（仅适用于 GPT-5.2 和 Codex 模型）
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（仅适用于 GPT-5.2 和 Codex 模型）
  - `highest`、`max` 映射到 `high`。
- 提供商注意事项：
  - Z.AI (`zai/*`) 仅支持二元思维模式 (`on`/`off`)。任何非 `off` 的层级均被视为 `on`（映射为 `low`)。

## 解析顺序
1. 消息上的内联指令（仅适用于该消息）。
2. 会话覆盖（通过发送仅含指令的消息设置）。
3. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
4. 回退：对于具备推理能力的模型，使用 low；否则关闭。

## 设置会话默认值
- 发送一条**仅包含**指令的消息（允许空格），例如 `/think:medium` 或 `/t high`。
- 该设置在当前会话中生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 系统会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果层级无效（如 `/thinking big`），命令将被拒绝并给出提示，且会话状态保持不变。
- 发送 `/think`（或 `/think:`）且不带参数，即可查看当前的思维层级。

## 代理中的应用
- **嵌入式 Pi**：解析后的层级会传递给进程内的 Pi 代理运行时。

## 详细指令（/verbose 或 /v）
- 层级：`on`（minimal）| `full` | `off`（默认）。
- 仅含指令的消息可切换会话的详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效层级将返回提示而不改变状态。
- `/verbose off` 存储显式会话覆盖；可通过 Sessions UI 选择 `inherit` 来清除。
- 内联指令仅影响该条消息；其他情况下适用会话或全局默认值。
- 发送 `/verbose`（或 `/verbose:`）且不带参数，即可查看当前的详细模式层级。
- 当详细模式开启时，发出结构化工具结果的代理（Pi、其他 JSON 代理）会将每次工具调用作为单独的元数据消息发回，若可用则以 `<emoji> <tool-name>: <arg>` 为前缀（路径/命令）。这些工具摘要会在每个工具开始执行时立即发送（独立气泡），而非以流式增量形式发送。
- 当详细模式为 `full` 时，工具输出在完成后再转发（独立气泡，截断至安全长度）。如果在运行过程中切换 `/verbose on|full|off`，后续的工具气泡将遵循新设置。

## 推理可见性（/reasoning）
- 层级：`on|off|stream`。
- 仅含指令的消息可切换是否在回复中显示思考块。
- 启用后，推理将以**单独消息**的形式发送，前缀为 `Reasoning:`。
- `stream`（仅限 Telegram）：在生成回复期间，将推理流式传输到 Telegram 草稿气泡中，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送 `/reasoning`（或 `/reasoning:`）且不带参数，即可查看当前的推理层级。

## 相关内容
- 高级模式文档位于 [高级模式](/tools/elevated)。

## 心跳信号
- 心跳探测消息体为配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令照常生效（但应避免通过心跳更改会话默认值）。
- 心跳交付默认仅发送最终有效载荷。若要同时发送单独的 `Reasoning:` 消息（若可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或针对单个代理的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天界面
- Web 聊天中的思维选择器在页面加载时会反映入站会话存储/配置中保存的会话层级。
- 选择其他层级仅适用于下一条消息（`thinkingOnce`）；发送后，选择器会自动恢复为保存的会话层级。
- 若要更改会话默认值，可像之前一样发送 `/think:<level>` 指令；下次重新加载后，选择器将反映这一更改。
