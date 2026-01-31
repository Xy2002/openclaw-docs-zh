---
title: Lobster
summary: Typed workflow runtime for OpenClaw with resumable approval gates.
description: >-
  Typed workflow runtime for OpenClaw — composable pipelines with approval
  gates.
read_when:
  - You want deterministic multi-step workflows with explicit approvals
  - You need to resume a workflow without re-running earlier steps
---
# 龙虾

龙虾是一种工作流外壳，使OpenClaw能够以单一、确定性的操作运行多步骤工具序列，并配备明确的审批检查点。

## 挂钩

你的助手可以构建自我管理的工具。只需请求一个工作流，30分钟后你便拥有一套CLI以及可作为一次调用运行的管道。龙虾正是这一缺失的环节：确定性管道、明确审批和可恢复状态。

## 为什么

如今，复杂的工作流需要多次来回调用工具。每次调用都会消耗令牌，且LLM必须协调每一步。龙虾将这种协调转移到一个类型化的运行时中：

- **一次调用取代多次调用**：OpenClaw只需调用一次龙虾工具，即可获得结构化结果。
- **内置审批机制**：副作用（发送电子邮件、发表评论）会在未获明确批准前暂停工作流。
- **可恢复**：暂停的工作流会返回一个令牌；批准后即可恢复，无需重新运行所有内容。

## 为什么使用DSL而非普通程序？

龙虾的设计刻意精简。其目标并非“一种新语言”，而是一种可预测、对AI友好的管道规范，具备一流的审批和恢复令牌。

- **内置审批/恢复功能**：普通程序可以提示人类，但如果没有你自行发明的运行时，它无法通过持久令牌来“暂停并恢复”。
- **确定性 + 可审计性**：管道是数据，因此易于记录、比较、重放和审查。
- **为AI限制表面**：微小的语法 + JSON管道减少了“创造性”代码路径，使验证变得切实可行。
- **内置安全策略**：超时、输出上限、沙盒检查和白名单由运行时强制执行，而不是由每个脚本单独处理。
- **仍然可编程**：每一步都可以调用任何CLI或脚本。如果你需要JS/TS，可以从代码生成`.lobster`文件。

## 工作原理

OpenClaw在**工具模式**下启动本地`lobster` CLI，并从stdout解析JSON信封。
如果管道因等待审批而暂停，该工具会返回一个`resumeToken`，以便你稍后继续。

## 模式：小型CLI + JSON管道 + 审批

构建以JSON为通信协议的小型命令，然后将它们串联成一次龙虾调用。（以下为示例命令名称——请替换为你自己的。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

如果管道请求审批，可用令牌继续：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI触发工作流；龙虾执行各步骤。审批闸门使副作用保持明确且可审计。

示例：将输入项映射到工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅限JSON的LLM步骤（llm-task）

对于需要**结构化LLM步骤**的工作流，启用可选的
`llm-task`插件工具，并从龙虾中调用它。这使工作流保持
确定性，同时仍允许你使用模型进行分类/总结/草拟。

启用该工具：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

在管道中使用它：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

有关详细信息和配置选项，请参阅[LLM Task](/tools/llm-task)。

## 工作流文件（.lobster）

龙虾可以使用`name`、`args`、`steps`、`env`、`condition`和`approval`字段运行YAML/JSON工作流文件。在OpenClaw工具调用中，将`pipeline`设置为文件路径。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

注意事项：

- `stdin: $step.stdout`和`stdin: $step.json`传递上一步的输出。
- `condition`（或`when`）可以根据`$step.approved`控制步骤。

## 安装龙虾

在运行OpenClaw网关的**同一主机**上安装龙虾CLI（参见[龙虾仓库](https://github.com/openclaw/lobster)），并确保`lobster`位于`PATH`上。
如果你想使用自定义二进制位置，在工具调用中传递一个**绝对**`lobsterPath`。

## 启用工具

龙虾是一个**可选**的插件工具（默认未启用）。

推荐（叠加式，安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或按代理：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

除非你打算在严格的白名单模式下运行，否则避免使用`tools.allow: ["lobster"]`。

注意：白名单是可选插件的可选功能。如果你的白名单只列出
插件工具（如`lobster`），OpenClaw会保持核心工具启用。要限制核心
工具，也需将你希望的核心工具或工具组列入白名单。

## 示例：邮件分类

没有龙虾：
```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

有了龙虾：
```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

返回JSON信封（截断）：
```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

用户批准→恢复：
```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

一个工作流。确定性。安全。

## 工具参数

### `run`

以工具模式运行管道。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "/path/to/workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

使用参数运行工作流文件：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

在审批后继续暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `lobsterPath`：龙虾二进制的绝对路径（省略则使用`PATH`）。
- `cwd`：管道的工作目录（默认为当前进程的工作目录）。
- `timeoutMs`：如果子进程超过此持续时间，则终止之（默认：20000）。
- `maxStdoutBytes`：如果stdout超过此大小，则终止子进程（默认：512000）。
- `argsJson`：传递给`lobster run --args-json`的JSON字符串（仅适用于工作流文件）。

## 输出信封

龙虾返回一个JSON信封，包含三种状态之一：

- `ok` → 成功完成
- `needs_approval` → 暂停；需`requiresApproval.resumeToken`才能恢复
- `cancelled` → 明确拒绝或取消

该工具以两种形式呈现信封：`content`（美观的JSON）和`details`（原始对象）。

## 审批

如果存在`requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续副作用
- `approve: false` → 取消并结束工作流

使用`approve --preview-from-stdin --limit N`可在不使用自定义jq/heredoc胶水的情况下，将JSON预览附加到审批请求中。恢复令牌现在更加紧凑：龙虾在其状态目录下存储工作流恢复状态，并返回一个小令牌密钥。

## OpenProse

OpenProse与龙虾配合默契：使用`/prose`来编排多代理准备，然后运行龙虾管道以实现确定性审批。如果Prose程序需要龙虾，可通过`tools.subagents.tools`为子代理启用`lobster`工具。详情请参阅[OpenProse](/prose)。

## 安全性

- **仅本地子进程** — 插件本身不进行网络调用。
- **无机密** — 龙虾不管理OAuth；它调用负责管理OAuth的OpenClaw工具。
- **沙盒感知** — 当工具上下文处于沙盒中时禁用。
- **加固** — 如果指定`lobsterPath`，则必须为绝对路径；强制执行超时和输出上限。

## 故障排除

- **`lobster subprocess timed out`** → 增加`timeoutMs`，或拆分长管道。
- **`lobster output exceeded maxStdoutBytes`** → 提高`maxStdoutBytes`，或减少输出大小。
- **`lobster returned invalid JSON`** → 确保管道在工具模式下运行，并且仅输出JSON。
- **`lobster failed (code …)`** → 在终端中运行相同的管道，以检查stderr。

## 了解更多信息

- [插件](/plugin)
- [插件工具编写](/plugins/agent-tools)

## 案例研究：社区工作流

一个公开示例：一个“第二大脑”CLI + 龙虾管道，用于管理三个Markdown保险库（个人、伙伴、共享）。CLI发出用于统计、收件箱列表和过时扫描的JSON；龙虾将这些命令串联成诸如`weekly-review`、`inbox-triage`、`memory-consolidation`和`shared-task-sync`等工作流，每个工作流都设有审批闸门。当可用时，AI负责判断（分类），不可用时则退而求其次，采用确定性规则。

- 线程：https://x.com/plattenschieber/status/2014508656335770033
- 仓库：https://github.com/bloomedai/brain-cli
