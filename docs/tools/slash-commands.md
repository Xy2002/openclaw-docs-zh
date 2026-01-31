---
summary: 'Slash commands: text vs native, config, and supported commands'
read_when:
  - Using or configuring chat commands
  - Debugging command routing or permissions
---
# 斜杠命令

命令由网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。
仅限主机的 Bash 聊天命令使用 `! <cmd>`（别名为 `/bash <cmd>`）。

有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/verbose`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令在模型看到消息之前会被剥离。
  - 在普通聊天消息中（非仅指令），它们被视为“内联提示”，并且**不会**保留会话设置。
  - 在仅指令消息中（消息仅包含指令），它们会保留在会话中，并以确认回复。
  - 指令仅适用于**授权发送者**（频道白名单/配对加上 `commands.useAccessGroups`）。
    未授权的发送者会将指令视为纯文本。

还有一些**内联快捷方式**（仅限白名单/授权发送者）：`/help`、`/commands`、`/status`、`/whoami` (`/id`)。
它们会立即执行，在模型看到消息之前被剥离，剩余文本则按正常流程继续处理。

## 配置

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    debug: false,
    restart: false,
    useAccessGroups: true
  }
}
```

- `commands.text`（默认 `true`）启用解析聊天消息中的 `/...`。
  - 在没有原生命令的平台上（WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams），即使您将其设置为 `false`，文本命令仍然有效。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - 自动：Discord/Telegram 上为开启；Slack 上为关闭（直到您添加斜杠命令）；对于不支持原生命令的提供商，则忽略此设置。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可以按提供商覆盖此设置（布尔值或 `"auto"`）。
  - `false` 在启动时清除 Discord/Telegram 上先前注册的命令。Slack 命令由 Slack 应用管理，不会自动移除。
- `commands.nativeSkills`（默认 `"auto"`）在支持的情况下原生注册**技能**命令。
  - 自动：Discord/Telegram 上为开启；Slack 上为关闭（Slack 需要为每个技能创建一个斜杠命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可以按提供商覆盖此设置（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 白名单）。
- `commands.bashForegroundMs`（默认 `2000`）控制 Bash 在切换到后台模式之前等待的时间长度（`0` 会立即进入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.useAccessGroups`（默认 `true`）强制执行命令的白名单/策略。

## 命令列表

文本 + 原生（启用时）：
- `/help`
- `/commands`
- `/skill <name> [input]`（按名称运行技能）
- `/status`（显示当前状态；在可用时包括当前模型提供商的使用情况/配额）
- `/allowlist`（列出/添加/删除白名单条目）
- `/approve <id> allow-once|allow-always|deny`（解决执行批准提示）
- `/context [list|detail|json]`（解释“上下文”；`detail` 显示每文件 + 每工具 + 每技能 + 系统提示的大小）
- `/whoami`（显示您的发送者 ID；别名：`/id`）
- `/subagents list|stop|log|info|send`（检查、停止、记录或向当前会话中的子代理发送消息）
- `/config show|get|set|unset`（将配置持久化到磁盘，仅限所有者；需要 `commands.config: true`）
- `/debug show|set|unset|reset`（仅运行时覆盖，仅限所有者；需要 `commands.debug: true`）
- `/usage off|tokens|full|cost`（每响应使用量页脚或本地成本摘要）
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio`（控制 TTS；参见 [/tts](/tts)）
  - Discord：原生命令是 `/voice`（Discord 保留了 `/tts`）；文本 `/tts` 仍然有效。
- `/stop`
- `/restart`
- `/dock-telegram`（别名：`/dock_telegram`）（将回复切换到 Telegram）
- `/dock-discord`（别名：`/dock_discord`）（将回复切换到 Discord）
- `/dock-slack`（别名：`/dock_slack`）（将回复切换到 Slack）
- `/activation mention|always`（仅限群组）
- `/send on|off|inherit`（仅限所有者）
- `/reset` 或 `/new [model]`（可选的模型提示；其余部分会传递下去）
- `/think <off|minimal|low|medium|high|xhigh>`（根据模型/提供商动态选择；别名：`/thinking`、`/t`）
- `/verbose on|full|off`（别名：`/v`）
- `/reasoning on|off|stream`（别名：`/reason`；开启时，会发送一条带有 `Reasoning:` 前缀的单独消息；`stream` = 仅 Telegram 草稿）
- `/elevated on|off|ask|full`（别名：`/elev`；`full` 跳过执行批准）
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`（发送 `/exec` 以显示当前状态）
- `/model <name>`（别名：`/models`；或从 `agents.defaults.models.*.alias` 发送 `/<alias>`）
- `/queue <mode>`（以及诸如 `debounce:2s cap:25 drop:summarize` 之类的选项；发送 `/queue` 以查看当前设置）
- `/bash <command>`（仅限主机；`! <command>` 的别名；需要 `commands.bash: true` + `tools.elevated` 白名单）

仅文本：
- `/compact [instructions]`（参见 [/concepts/compaction](/concepts/compaction)）
- `! <command>`（仅限主机；一次一个；对于长时间运行的任务，请使用 `!poll` + `!stop`）
- `!poll`（检查输出 / 状态；接受可选的 `sessionId`；`/bash poll` 也有效）
- `!stop`（停止正在运行的 Bash 作业；接受可选的 `sessionId`；`/bash stop` 也有效）

注意事项：
- 命令在命令和参数之间接受可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本将被视为消息正文。
- 要获得完整的提供商使用情况细分，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true` 并尊重频道 `configWrites`。
- `/usage` 控制每响应使用量页脚；`/usage cost` 从 OpenClaw 会话日志中打印本地成本摘要。
- `/restart` 默认禁用；设置 `commands.restart: true` 可以启用它。
- `/verbose` 用于调试和额外的可见性；在正常使用中请保持**关闭**。
- `/reasoning`（和 `/verbose`）在群组环境中存在风险：它们可能会泄露您本意未打算公开的内部推理或工具输出。尤其是在群聊中，最好保持关闭状态。
- **快速通道：**来自白名单发送者的仅命令消息会立即处理（绕过队列 + 模型）。
- **群组提及门控：**来自白名单发送者的仅命令消息会绕过提及要求。
- **内联快捷方式（仅限白名单发送者）：**某些命令也可以嵌入在普通消息中，并在模型看到剩余文本之前被剥离。
  - 例如：`hey /status` 触发状态回复，而剩余文本则按正常流程继续。
- 目前：`/help`、`/commands`、`/status`、`/whoami` (`/id`)。
- 未经授权的仅命令消息会被静默忽略，内联的 `/...` 标记会被视为纯文本。
- **技能命令：**`user-invocable` 技能以斜杠命令的形式公开。名称会被清理为 `a-z0-9_`（最多 32 个字符）；冲突的名称会附加数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行技能（当原生命令限制阻止每个技能单独命令时非常有用）。
  - 默认情况下，技能命令会作为普通请求转发给模型。
  - 技能可以选择声明 `command-dispatch: tool`，以将命令直接路由到工具（确定性，无需模型）。
  - 例如：`/prose`（OpenProse 插件）——参见 [OpenProse](/prose)。
- **原生命令参数：**Discord 使用自动完成来提供动态选项（并在您省略必填参数时显示按钮菜单）。Telegram 和 Slack 在命令支持选择且您省略参数时会显示按钮菜单。

## 使用界面（哪些内容在哪里显示）

- **提供商使用情况/配额**（例如：“Claude 剩余 80%”）会在启用使用跟踪时出现在当前模型提供商的 `/status` 中。
- **每响应标记/成本**由 `/usage off|tokens|full` 控制（附加到常规回复中）。
- `/model status` 关注的是**模型/认证/端点**，而不是使用情况。

## 模型选择 (`/model`)

`/model` 以指令的形式实现。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

注意事项：
- `/model` 和 `/model list` 显示一个紧凑的编号选择器（模型系列 + 可用提供商）。
- `/model <#>` 从该选择器中进行选择（并在可能的情况下优先选择当前提供商）。
- `/model status` 显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用的话。

## 调试覆盖

`/debug` 允许您设置**仅运行时**配置覆盖（内存，而非磁盘）。仅限所有者。默认关闭；通过 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意事项：
- 覆盖会立即应用于新的配置读取，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 可以清除所有覆盖并恢复到磁盘上的配置。

## 配置更新

`/config` 写入您的磁盘配置（`openclaw.json`）。仅限所有者。默认关闭；通过 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意事项：
- 配置在写入前会经过验证；无效更改会被拒绝。
- `/config` 更新会在重启后持续生效。

## 表面说明

- **文本命令**在正常的聊天会话中运行（私信共享 `main`，群组有自己的会话）。
- **原生命令**使用隔离的会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（可通过 `channels.slack.slashCommand.sessionPrefix` 配置前缀）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位到聊天会话）
- **`/stop`** 定位到当前活动的聊天会话，以便它可以中止当前运行。
- **Slack：**`channels.slack.slashCommand` 仍支持单个 `/openclaw` 风格的命令。如果您启用 `commands.native`，则必须为每个内置命令创建一个 Slack 斜杠命令（与 `/help` 使用相同的名称）。Slack 的命令参数菜单以短暂的 Block Kit 按钮形式呈现。
