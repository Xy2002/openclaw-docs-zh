---
summary: 'CLI backends: text-only fallback via local AI CLIs'
read_when:
  - You want a reliable fallback when API providers fail
  - >-
    You are running Claude Code CLI or other local AI CLIs and want to reuse
    them
  - 'You need a text-only, tool-free path that still supports sessions and images'
---
# CLI 后端（回退运行时）

当 API 提供商宕机、受到速率限制或暂时出现异常时，OpenClaw 可以运行**本地 AI CLI**作为**纯文本回退**。这一设计刻意保持保守：

- **工具被禁用**（不进行工具调用）。
- **纯文本输入 → 纯文本输出**（可靠）。
- **支持会话**（确保后续轮次保持连贯）。
- **可传递图像**：如果 CLI 接受图像路径，则可直接传递图像。

此功能旨在作为**安全网**，而非主要路径。当你希望在不依赖外部 API 的情况下获得“始终可用”的文本响应时，可以使用它。

## 适合初学者的快速入门

你可以**无需任何配置**就使用 Claude Code CLI——OpenClaw 自带一个内置默认配置：

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.5
```

Codex CLI 也开箱即用：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.2-codex
```

如果你的网关在 launchd/systemd 下运行且 PATH 配置较为精简，只需添加命令路径即可：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude"
        }
      }
    }
  }
}
```

仅此而已。无需密钥，也不需要额外的认证配置，只需 CLI 本身即可。

## 作为回退使用

将 CLI 后端添加到你的回退列表中，使其仅在主模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: [
          "claude-cli/opus-4.5"
        ]
      },
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "claude-cli/opus-4.5": {}
      }
    }
  }
}
```

注意事项：
- 如果你使用 `agents.defaults.models`（白名单），则必须包含 `claude-cli/...`。
- 如果主提供商发生故障（认证失败、速率限制、超时等），OpenClaw 将转而尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于以下路径下：

```
agents.defaults.cliBackends
```

每个条目都以**提供商 ID**为键（例如 `claude-cli`、`my-cli`）。提供商 ID 将成为你的模型引用左侧的部分：

```
<provider>/<model>
```

### 示例配置

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude"
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet"
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true
        }
      }
    }
  }
}
```

## 工作原理

1) 根据提供商前缀（`claude-cli/...`）**选择后端**。
2) 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示**。
3) 如果 CLI 支持会话，则使用会话 ID 执行 CLI，以保持历史记录的一致性。
4) **解析输出**（JSON 或纯文本），并返回最终文本。
5) **为每个后端持久化会话 ID**，以便后续请求复用同一 CLI 会话。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），以便在多个标志中插入会话 ID。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置 `resumeArgs`（在恢复时替换 `args`），并可选设置 `resumeOutput`（用于非 JSON 格式的恢复）。
- `sessionMode`：
  - `always`：始终发送会话 ID（如果没有存储过，则生成新 UUID）。
  - `existing`：仅在之前已存储会话 ID 时才发送。
  - `none`：从不发送会话 ID。

## 图像（传递）
如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 Base64 编码的图像写入临时文件。如果设置了 `imageArg`，这些路径将作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径附加到提示中（路径注入），这对于能够自动从普通路径加载本地文件的 CLI（如 Claude Code CLI 的行为）已经足够。

## 输入/输出
- `output: "json"`（默认）尝试解析 JSON 并提取文本和会话 ID。
- `output: "jsonl"` 解析 JSONL 流（如 Codex CLI 的 `--json`），并提取最后一条代理消息以及 `thread_id`（如果存在）。
- `output: "text"` 将标准输出视为最终响应。

输入模式：
- `input: "arg"`（默认）将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过标准输入发送提示。
- 如果提示非常长且设置了 `maxPromptArgChars`，则使用标准输入。

## 内置默认配置
OpenClaw 为 `claude-cli` 提供了一个内置默认配置：

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--dangerously-skip-permissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--dangerously-skip-permissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw 还为 `codex-cli` 提供了一个内置默认配置：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

仅在必要时覆盖默认配置（常见情况：绝对路径 `command`）。

## 限制
- **无 OpenClaw 工具**（CLI 后端永远不会接收工具调用）。某些 CLI 仍可能运行其自身的代理工具。
- **无流式传输**（CLI 输出会被收集后再返回）。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（无 JSONL），其结构化程度低于初始 `--json` 运行。OpenClaw 会话仍可正常工作。

## 故障排除
- **未找到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **会话不连续**：确保已设置 `sessionArg`，且 `sessionMode` 不是 `none`（目前 Codex CLI 无法通过 JSON 输出恢复）。
- **图像被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
