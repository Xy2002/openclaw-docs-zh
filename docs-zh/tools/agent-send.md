---
summary: Direct `openclaw agent` CLI runs (with optional delivery)
read_when:
  - Adding or modifying the agent CLI entrypoint
---
# `openclaw agent`（直接代理运行）

__ INLINE_CODE_2__ 在无需入站聊天消息的情况下运行单个代理回合。
默认情况下，它会**通过网关**运行；添加 `--local` 可强制在当前机器上使用嵌入式运行时。

## 行为

- 必需：`--message <text>`
- 会话选择：
  - `--to <dest>` 派生会话密钥（群组/频道目标保持隔离；直接聊天合并为 `main`），**或者**
  - `--session-id <id>` 按 ID 重用现有会话，**或者**
  - `--agent <id>` 直接指向配置的代理（使用该代理的 `main` 会话密钥）
- 运行与正常入站回复相同的嵌入式代理运行时。
- 思考/详细标志会持续保存到会话存储中。
- 输出：
  - 默认：打印回复文本（加上 `MEDIA:<url>` 行）
  - `--json`：打印结构化负载 + 元数据
- 可选通过 `--deliver` + `--channel` 将结果发送回渠道（目标格式与 `openclaw message --target` 匹配）。
- 使用 `--reply-channel`/`--reply-to`/`--reply-account` 可在不更改会话的情况下覆盖交付。

如果网关无法访问，CLI **将回退**到嵌入式的本地运行。

## 示例

```bash
openclaw agent --to +15555550123 --message "status update"
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --to +15555550123 --message "Summon reply" --deliver
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## 标志

- `--local`：在本地运行（需要在您的 shell 中提供模型提供商 API 密钥）
- `--deliver`：将回复发送到所选渠道
- `--channel`：交付渠道（`whatsapp|telegram|discord|googlechat|slack|signal|imessage`，默认：`whatsapp`）
- `--reply-to`：交付目标覆盖
- `--reply-channel`：交付渠道覆盖
- `--reply-account`：交付账户 ID 覆盖
- `--thinking <off|minimal|low|medium|high|xhigh>`：持久化思考级别（仅适用于 GPT-5.2 和 Codex 模型）
- `--verbose <on|full|off>`：持久化详细级别
- `--timeout <seconds>`：覆盖代理超时时间
- `--json`：输出结构化的 JSON
