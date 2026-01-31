---
summary: Slack setup for socket or HTTP webhook mode
read_when: Setting up Slack or debugging Slack socket/HTTP mode
---
# Slack

## 套接字模式（默认）

### 快速设置（初学者）
1) 创建一个 Slack 应用并启用 **套接字模式**。
2) 创建一个 **应用令牌** (`xapp-...`) 和 **机器人令牌** (`xoxb-...`)。
3) 为 OpenClaw 设置令牌并启动网关。

最小配置：
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-..."
    }
  }
}
```

### 设置
1) 在 https://api.slack.com/apps. 中从头开始创建一个 Slack 应用。
2) 启用 **套接字模式**，然后转到 **基本信息** → **应用级令牌** → 使用范围 `connections:write` 生成令牌和范围。复制 **应用令牌** (`xapp-...`)。
3) 转到 **OAuth 和权限** → 添加机器人令牌范围（使用下方清单）。单击 **安装到工作区**。复制 **机器人用户 OAuth 令牌** (`xoxb-...`)。
4) 可选：转到 **OAuth 和权限** → 添加 **用户令牌范围**（参见下方只读列表）。重新安装应用并复制 **用户 OAuth 令牌** (`xoxp-...`)。
5) 转到 **事件订阅** → 启用事件并订阅：
   - `message.*`（包括编辑/删除/线程广播）
   - `app_mention`
   - `reaction_added`, `reaction_removed`
   - `member_joined_channel`, `member_left_channel`
   - `channel_rename`
   - `pin_added`, `pin_removed`
6) 邀请机器人加入您希望它读取的频道。
7) 转到 **斜杠命令** → 如果您使用 `channels.slack.slashCommand`，则创建 `/openclaw`。如果您启用原生命令，则为每个内置命令添加一个斜杠命令（名称与 `/help` 相同）。Slack 的原生命令默认关闭，除非您设置 `channels.slack.commands.native: true`（全局 `commands.native` 是 `"auto"`，这会使 Slack 保持关闭状态）。
8) 转到 **应用主页** → 启用 **消息选项卡**，以便用户可以向机器人发送私信。

使用下方清单以确保范围和事件保持同步。

多账户支持：使用 `channels.slack.accounts` 结合每账户令牌，并可选使用 `name`。共享模式请参阅 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)。

### OpenClaw 配置（最小）
推荐通过环境变量设置令牌：
- `SLACK_APP_TOKEN=xapp-...`
- `SLACK_BOT_TOKEN=xoxb-...`

或通过配置文件设置：

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-..."
    }
  }
}
```

### 用户令牌（可选）
OpenClaw 可以使用 Slack 用户令牌 (`xoxp-...`) 进行读操作（历史记录、置顶、反应、表情符号、成员信息）。默认情况下，此模式仅用于读取：如果存在用户令牌，读取将优先使用用户令牌；写操作仍使用机器人令牌，除非您明确选择启用。即使启用了 `userTokenReadOnly: false`，只要机器人令牌可用，写操作仍优先使用机器人令牌。

用户令牌在配置文件中进行配置（不支持环境变量）。对于多账户，设置 `channels.slack.accounts.<id>.userToken`。

包含机器人、应用和用户令牌的示例：
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-..."
    }
  }
}
```

显式设置 userTokenReadOnly 的示例（允许用户令牌执行写操作）：
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-...",
      userTokenReadOnly: false
    }
  }
}
```

#### 令牌使用
- 读操作（历史记录、反应列表、置顶列表、表情符号列表、成员信息、搜索）在已配置时优先使用用户令牌，否则使用机器人令牌。
- 写操作（发送/编辑/删除消息、添加/移除反应、置顶/取消置顶、文件上传）默认使用机器人令牌。如果 `userTokenReadOnly: false` 已启用且没有可用的机器人令牌，OpenClaw 将回退到用户令牌。

### 历史上下文
- `channels.slack.historyLimit`（或 `channels.slack.accounts.*.historyLimit`）控制最近多少条频道/群组消息会被纳入提示中。
- 默认回退到 `messages.groupChat.historyLimit`。设置 `0` 可禁用此功能（默认值为 50）。

## HTTP 模式（事件 API）
当您的网关可通过 HTTPS 被 Slack 访问时（通常适用于服务器部署），请使用 HTTP Webhook 模式。HTTP 模式使用事件 API + 交互性 + 斜杠命令，并共享请求 URL。

### 设置
1) 创建一个 Slack 应用并 **禁用套接字模式**（如果您只使用 HTTP，则可选）。
2) 转到 **基本信息** → 复制 **签名密钥**。
3) 转到 **OAuth 和权限** → 安装应用并复制 **机器人用户 OAuth 令牌** (`xoxb-...`)。
4) 转到 **事件订阅** → 启用事件并将 **请求 URL** 设置为您网关的 Webhook 路径（默认 `/slack/events`)。
5) 转到 **交互性和快捷方式** → 启用并设置相同的 **请求 URL**。
6) 转到 **斜杠命令** → 为您的命令设置相同的 **请求 URL**。

示例请求 URL：
`https://gateway-host/slack/events`

### OpenClaw 配置（最小）
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events"
    }
  }
}
```

多账户 HTTP 模式：设置 `channels.slack.accounts.<id>.mode = "http"` 并为每个账户提供唯一的 `webhookPath`，以便每个 Slack 应用都可以指向自己的 URL。

### 清单（可选）
使用此 Slack 应用清单可快速创建应用（如需，可调整名称/命令）。如果您计划配置用户令牌，请包含用户范围。

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "groups:write",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ],
      "user": [
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "users:read",
        "reactions:read",
        "pins:read",
        "emoji:read",
        "search:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

如果您启用原生命令，则为每个您希望公开的命令添加一个 `slash_commands` 条目（与 `/help` 列表匹配）。使用 `channels.slack.commands.native` 进行覆盖。

## 范围（当前 vs 可选）
Slack 的 Conversations API 是按类型划分范围的：您只需为实际接触的对话类型获取范围（频道、群组、私信、多用户私信）。有关概述，请参阅 https://docs.slack.dev/apis/web-api/using-the-conversations-api/。

### 机器人令牌范围（必需）
- `chat:write`（通过 `chat.postMessage` 发送/更新/删除消息）
  https://docs.slack.dev/reference/methods/chat.postMessage
- `im:write`（通过 `conversations.open` 打开用户 DM）
  https://docs.slack.dev/reference/methods/conversations.open
- `channels:history`, `groups:history`, `im:history`, `mpim:history`
  https://docs.slack.dev/reference/methods/conversations.history
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
  https://docs.slack.dev/reference/methods/conversations.info
- `users:read`（用户查找）
  https://docs.slack.dev/reference/methods/users.info
- `reactions:read`, `reactions:write`（`reactions.get` / `reactions.add`）
  https://docs.slack.dev/reference/methods/reactions.get
  https://docs.slack.dev/reference/methods/reactions.add
- `pins:read`, `pins:write`（`pins.list` / `pins.add` / `pins.remove`）
  https://docs.slack.dev/reference/scopes/pins.read
  https://docs.slack.dev/reference/scopes/pins.write
- `emoji:read`（`emoji.list`）
  https://docs.slack.dev/reference/scopes/emoji.read
- `files:write`（通过 `files.uploadV2` 进行上传）
  https://docs.slack.dev/messaging/working-with-files/#upload

### 用户令牌范围（可选，默认为只读）
如果您配置 `channels.slack.userToken`，请在 **用户令牌范围** 下添加这些范围。

- `channels:history`, `groups:history`, `im:history`, `mpim:history`
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
- `users:read`
- `reactions:read`
- `pins:read`
- `emoji:read`
- `search:read`

### 当前不需要（但未来可能需要）
- `mpim:write`（仅当我们通过 `conversations.open` 添加群组 DM 打开/DM 开始功能时）
- `groups:write`（仅当我们添加私有频道管理功能：创建/重命名/邀请/归档时）
- `chat:write.public`（仅当我们希望在机器人不在的频道中发布内容时）
  https://docs.slack.dev/reference/scopes/chat.write.public
- `users:read.email`（仅当我们需要来自 `users.info` 的电子邮件字段时）
  https://docs.slack.dev/changelog/2017-04-narrowing-email-access
- `files:read`（仅当我们开始列出/读取文件元数据时）

## 配置
Slack 仅使用套接字模式（无 HTTP Webhook 服务器）。提供两种令牌：

```json
{
  "slack": {
    "enabled": true,
    "botToken": "xoxb-...",
    "appToken": "xapp-...",
    "groupPolicy": "allowlist",
    "dm": {
      "enabled": true,
      "policy": "pairing",
      "allowFrom": ["U123", "U456", "*"],
      "groupEnabled": false,
      "groupChannels": ["G123"],
      "replyToMode": "all"
    },
    "channels": {
      "C123": { "allow": true, "requireMention": true },
      "#general": {
        "allow": true,
        "requireMention": true,
        "users": ["U123"],
        "skills": ["search", "docs"],
        "systemPrompt": "Keep answers short."
      }
    },
    "reactionNotifications": "own",
    "reactionAllowlist": ["U123"],
    "replyToMode": "off",
    "actions": {
      "reactions": true,
      "messages": true,
      "pins": true,
      "memberInfo": true,
      "emojiList": true
    },
    "slashCommand": {
      "enabled": true,
      "name": "openclaw",
      "sessionPrefix": "slack:slash",
      "ephemeral": true
    },
    "textChunkLimit": 4000,
    "mediaMaxMb": 20
  }
}
```

令牌也可以通过环境变量提供：
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`

确认反应由 `messages.ackReaction` + `messages.ackReactionScope` 全局控制。使用 `messages.removeAckAfterReply` 可在机器人回复后清除确认反应。

## 限制
- 出站文本被分块为 `channels.slack.textChunkLimit`（默认 4000）。
- 可选换行分块：设置 `channels.slack.chunkMode="newline"` 可在长度分块之前按空行（段落边界）进行分割。
- 媒体上传受 `channels.slack.mediaMaxMb`（默认 20）的限制。

## 回复线程化
默认情况下，OpenClaw 在主频道中回复。使用 `channels.slack.replyToMode` 可控制自动线程化：

| 模式 | 行为 |
| --- | --- |
| `off` | **默认。** 在主频道中回复。仅当触发消息已在线程中时才进行线程化。 |
| `first` | 第一次回复进入线程（在触发消息下方），后续回复回到主频道。有助于在避免线程混乱的同时保持上下文可见。 |
| `all` | 所有回复都进入线程。使对话保持集中，但可能会降低可见性。 |

该模式适用于自动回复和代理工具调用（`slack sendMessage`）。

### 按聊天类型线程化
您可以通过设置 `channels.slack.replyToModeByChatType` 为每种聊天类型配置不同的线程化行为：

```json5
{
  channels: {
    slack: {
      replyToMode: "off",        // default for channels
      replyToModeByChatType: {
        direct: "all",           // DMs always thread
        group: "first"           // group DMs/MPIM thread first reply
      },
    }
  }
}
```

支持的聊天类型：
- `direct`：1:1 私信（Slack `im`）
- `group`：群组私信 / MPIM（Slack `mpim`）
- `channel`：标准频道（公共/私人）

优先级：
1) `replyToModeByChatType.<chatType>`
2) `replyToMode`
3) 提供方默认（`off`）

旧版 `channels.slack.dm.replyToMode` 仍作为 `direct` 的后备方案被接受，当未设置聊天类型覆盖时。

示例：

仅对私信进行线程化：
```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { direct: "all" }
    }
  }
}
```

对群组私信进行线程化，但将频道保留在根中：
```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { group: "first" }
    }
  }
}
```

使频道线程化，将私信保留在根中：
```json5
{
  channels: {
    slack: {
      replyToMode: "first",
      replyToModeByChatType: { direct: "off", group: "off" }
    }
  }
}
```

### 手动线程化标签
为了更精细地控制，可在代理回复中使用以下标签：
- `[[reply_to_current]]` — 回复触发消息（开始/继续线程）。
- `[[reply_to:<id>]]` — 回复特定的消息 ID。

## 会话 + 路由
- 私信共享 `main` 会话（类似于 WhatsApp/Telegram）。
- 频道映射到 `agent:<agentId>:slack:channel:<channelId>` 会话。
- 斜杠命令使用 `agent:<agentId>:slack:slash:<userId>` 会话（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）。
- 如果 Slack 不提供 `channel_type`，OpenClaw 会根据频道 ID 前缀推断（`D`, `C`, `G`），并默认使用 `channel`，以保持会话密钥稳定。
- 原生命令注册使用 `commands.native`（全局默认 `"auto"` → Slack 关闭），并可使用 `channels.slack.commands.native` 按工作区覆盖。文本命令需要独立的 `/...` 消息，并可使用 `commands.text: false` 禁用。Slack 斜杠命令在 Slack 应用中管理，不会自动删除。使用 `commands.useAccessGroups: false` 可绕过命令的访问组检查。
- 完整命令列表 + 配置：[斜杠命令](/tools/slash-commands)

## 私信安全（配对）
- 默认：`channels.slack.dm.policy="pairing"` — 未知的私信发送者会收到一个配对代码（1 小时后失效）。
- 通过：`openclaw pairing approve slack <code>` 批准。
- 若要允许任何人：设置 `channels.slack.dm.policy="open"` 和 `channels.slack.dm.allowFrom=["*"]`。
- `channels.slack.dm.allowFrom` 接受用户 ID、@句柄或电子邮件（在启动时解析，前提是令牌允许）。向导在设置期间接受用户名并在令牌允许时将其解析为 ID。

## 组策略
- `channels.slack.groupPolicy` 控制频道处理（`open|disabled|allowlist`）。
- `allowlist` 要求频道必须列在 `channels.slack.channels` 中。
- 如果您只设置 `SLACK_BOT_TOKEN`/`SLACK_APP_TOKEN`，从未创建 `channels.slack` 部分，
   运行时默认 `groupPolicy` 为 `open`。添加 `channels.slack.groupPolicy`,
   `channels.defaults.groupPolicy` 或频道白名单以锁定设置。
- 配置向导接受 `#channel` 名称，并在可能的情况下将其解析为 ID
   （公共 + 私人）；如果有多个匹配项，它优先选择活跃频道。
- 在启动时，OpenClaw 会将白名单中的频道/用户名称解析为 ID（在令牌允许时）
   并记录映射；未解析的条目将保留为类型。
- 若要允许 **不使用任何频道**，设置 `channels.slack.groupPolicy: "disabled"`（或保持空白白名单）。

频道选项（`channels.slack.channels.<id>` 或 `channels.slack.channels.<name>`）：
- `allow`：在 `groupPolicy="allowlist"` 时允许/拒绝该频道。
- `requireMention`：对该频道实施提及门控。
- `tools`：可选的每频道工具政策覆盖（`allow`/`deny`/`alsoAllow`）。
- `toolsBySender`：可选的每发送者工具政策覆盖（密钥是发送者 ID/@句柄/电子邮件；支持 `"*"` 通配符）。
- `allowBots`：允许在此频道中出现机器人撰写的消息（默认：否）。
- `users`：可选的每频道用户白名单。
- `skills`：技能过滤器（omit = 所有技能，empty = 无技能）。
- `systemPrompt`：为该频道设置额外的系统提示（与主题/目的相结合）。
- `enabled`：设置 `false` 可禁用该频道。

## 交付目标
结合 Cron/CLI 发送使用：
- `user:<id>` 用于私信
- `channel:<id>` 用于频道

## 工具操作
Slack 工具操作可通过 `channels.slack.actions.*` 进行门控：

| 操作组 | 默认 | 备注 |
| --- | --- | --- |
| 反应 | 已启用 | 反应 + 反应列表 |
| 消息 | 已启用 | 读取/发送/编辑/删除 |
| 置顶 | 已启用 | 置顶/取消置顶/列表 |
| 成员信息 | 已启用 | 成员信息 |
| 表情符号列表 | 已启用 | 自定义表情符号列表 |

## 安全注意事项
- 写操作默认使用机器人令牌，因此改变状态的操作始终限定于应用程序的机器人权限和身份。
- 设置 `userTokenReadOnly: false` 可允许在无法使用机器人令牌时使用用户令牌进行写操作，这意味着操作将以安装用户的访问权限执行。请将用户令牌视为高度特权，并严格控制操作门控和白名单。
- 如果您启用用户令牌写操作，请确保用户令牌包含您期望的写范围（`chat:write`, `reactions:write`, `pins:write`, `files:write`），否则这些操作将失败。

## 备注
- 提及门控由 `channels.slack.channels` 控制（设置 `requireMention` 至 `true`）；`agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）也被视为提及。
- 多代理覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每代理模式。
- 反应通知遵循 `channels.slack.reactionNotifications`（使用 `reactionAllowlist` 时配合 `allowlist` 模式）。
- 机器人撰写的消息默认被忽略；可通过 `channels.slack.allowBots` 或 `channels.slack.channels.<id>.allowBots` 启用。
- 警告：如果您允许回复其他机器人（`channels.slack.allowBots=true` 或 `channels.slack.channels.<id>.allowBots=true`），请通过 `requireMention`、`channels.slack.channels.<id>.users` 白名单以及 `AGENTS.md` 和 `SOUL.md` 中的清除护栏来防止机器人之间的回复循环。
- 对于 Slack 工具，反应移除语义请参见 [/tools/reactions](/tools/reactions)。
- 附件在允许且不超过尺寸限制的情况下下载到媒体存储中。
