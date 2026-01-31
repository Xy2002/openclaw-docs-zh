---
summary: 'Context: what the model sees, how it is built, and how to inspect it'
read_when:
  - You want to understand what “context” means in OpenClaw
  - You are debugging why the model “knows” something (or forgot it)
  - 'You want to reduce context overhead (/context, /status, /compact)'
---
# 上下文

“上下文”是 **OpenClaw 在每次运行时发送给模型的所有内容**。它受模型的 **上下文窗口**（token 限制）约束。

初学者的心理模型：
- **系统提示**（由OpenClaw构建）：规则、工具、技能列表、时间/运行时，以及注入的工作空间文件。
- **对话历史**：您在此会话中的消息加上助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取、图像/音频等。

上下文 *不同于*“内存”：内存可以存储在磁盘上并在以后重新加载；而上下文则是当前模型窗口内的内容。

## 快速入门（检查上下文）

- `/status` → 快速查看“我的窗口有多满？”并获取会话设置。
- `/context list` → 查看已注入的内容及大致大小（按文件和总计）。
- `/context detail` → 更深入的细分：按文件、按工具模式的大小，按技能条目的大小，以及系统提示的大小。
- `/usage tokens` → 在普通回复中附加每条回复的用量脚注。
- `/compact` → 将较旧的历史汇总为一条简洁条目，以释放窗口空间。

另请参阅：[斜杠命令](/tools/slash-commands)，[Token 使用与成本](/token-use)，[压缩](/concepts/compaction)。

## 示例输出

数值因模型、提供商、工具策略以及工作空间中的内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## 哪些内容计入上下文窗口

模型接收到的一切内容都会计入，包括：
- 系统提示（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件/记录（图像/音频/文件）。
- 压缩摘要和修剪产物。
- 提供商的“包装器”或隐藏标头（不可见，但仍计入）。

## OpenClaw 如何构建系统提示

系统提示由 **OpenClaw 所有**，并在每次运行时重新构建。它包括：
- 工具列表 + 简短描述。
- 技能列表（仅元数据；见下文）。
- 工作空间位置。
- 时间（UTC + 如果配置了，则转换为用户时间）。
- 运行时元数据（主机/操作系统/模型/思考过程）。
- 在 **项目上下文** 下注入的工作空间引导文件。

完整分解：[系统提示](/concepts/system-prompt)。

## 注入的工作空间文件（项目上下文）

默认情况下，OpenClaw 会注入一组固定的工作空间文件（如果存在）：
- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会按文件进行截断，使用 `agents.defaults.bootstrapMaxChars`（默认 `20000` 字符）。`/context` 显示 **原始 vs 注入** 的大小，并标明是否发生了截断。

## 技能：哪些内容被注入，哪些按需加载

系统提示包含一个精简的 **技能列表**（名称 + 描述 + 位置）。此列表本身具有实际开销。

技能说明默认 *不* 包含在内。模型预计会在 **需要时** `read` 技能的 `SKILL.md`。

## 工具：存在两种成本

工具以两种方式影响上下文：
1) **工具列表文本** 出现在系统提示中（您看到的“工具”部分）。
2) **工具模式**（JSON）。这些模式会被发送给模型，以便模型能够调用工具。即使您看不到它们的纯文本形式，它们仍然会计入上下文。

`/context detail` 细分了最大的工具模式，以便您了解哪些占主导地位。

## 命令、指令和“内联快捷方式”

斜杠命令由网关处理。行为有几种不同形式：
- **独立命令**：仅作为命令运行的消息。
- **指令**：`/think`、`/verbose`、`/reasoning`、`/elevated`、`/model`、`/queue` 在模型看到消息之前被剥离。
  - 仅指令消息会保留会话设置。
  - 普通消息中的内联指令则作为每条消息的提示发挥作用。
- **内联快捷方式**（仅限白名单发件人）：普通消息中的某些 `/...` 标记可以立即执行（例如，“hey /status”），并在模型看到剩余文本之前被剥离。

详情：[斜杠命令](/tools/slash-commands)。

## 会话、压缩和修剪（哪些内容持久化）

跨消息持久化的内容取决于机制：
- **常规历史** 在会话记录中持续保存，直到根据策略被压缩或修剪。
- **压缩** 会将摘要保留在记录中，并保持最近的消息完好无损。
- **修剪** 会从一次运行的 *内存中* 提示中移除旧的工具结果，但不会重写记录。

文档：[会话](/concepts/session)，[压缩](/concepts/compaction)，[会话修剪](/concepts/session-pruning)。

## `/context` 实际报告的内容

`/context` 在可用时优先使用最新的 **运行构建** 系统提示报告：
- `System prompt (run)` = 从上次嵌入式（具备工具能力）运行中捕获，并保存在会话存储中。
- `System prompt (estimate)` = 在没有运行报告时（或通过不生成报告的 CLI 后端运行时）即时计算。

无论哪种情况，它都会报告大小和主要贡献者；但它 **不会** 转储完整的系统提示或工具模式。
