---
summary: 'Telegram bot support status, capabilities, and configuration'
read_when:
  - Working on Telegram features or webhooks
---
# 电报（机器人API）

状态：通过 grammY 实现了对机器人私信和群组的生产就绪支持。默认采用长轮询；Webhook 为可选。

快速设置（初学者）

1) 使用 **@BotFather** 创建一个机器人并复制令牌。
2) 设置令牌：

- 环境变量：`TELEGRAM_BOT_TOKEN=...`
   - 或配置文件：`channels.telegram.botToken: "..."`。
   - 如果两者都设置了，配置优先（环境变量仅用作默认账户的后备）。

3) 启动网关。
4) 私信访问默认采用配对模式；首次联系时需批准配对码。

最小配置：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing"
    }
  }
}
```

## 什么是它

- 由网关拥有的 Telegram Bot API 通道。
- 确定性路由：回复会返回到 Telegram；模型从不选择通道。
- 私信共享代理的主要会话；群组保持隔离 (`agent:<agentId>:telegram:group:<chatId>`)。

## 设置（快速路径）

### 1) 创建机器人令牌（BotFather）

1) 打开 Telegram，并联系 **@BotFather**。
2) 运行 `/newbot`，然后按照提示操作（名称 + 用户名以 `bot` 结尾）。
3) 复制令牌并安全保存。

可选的 BotFather 设置：

- `/setjoingroups` — 允许或禁止将机器人添加到群组。
- `/setprivacy` — 控制机器人是否可以看到所有群组消息。

2) 配置令牌（环境变量或配置文件）

示例：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } }
    }
  }
}
```

环境变量选项：`TELEGRAM_BOT_TOKEN=...`（适用于默认账户）。
如果同时设置了环境变量和配置，配置优先。

多账户支持：使用 `channels.telegram.accounts` 搭配每个账户的令牌，并可选地使用 `name`。共享模式请参见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)。

3) 启动网关。当解析到令牌时，Telegram 就会启动（优先使用配置，其次使用环境变量）。
4) 私信访问默认采用配对模式。首次联系机器人时，请批准代码。
5) 对于群组：添加机器人，决定隐私/管理员行为（见下文），然后设置 `channels.telegram.groups` 来控制提及门控和白名单。

## 代币 + 隐私 + 权限（Telegram 方面）

令牌创建（BotFather）

- `/newbot` 创建机器人并返回令牌（请保密）。
- 如果令牌泄露，通过 @BotFather 撤销或重新生成令牌，并更新您的配置。

群组消息可见性（隐私模式）

Telegram 机器人默认启用**隐私模式**，这限制了它们能够接收的群组消息。
如果您的机器人必须看到*所有*群组消息，您有两个选项：

- 使用 `/setprivacy` 禁用隐私模式 **或**
- 将机器人添加为群组**管理员**（管理员机器人会接收所有消息）。

**注意：** 当您切换隐私模式时，Telegram 要求从每个群组中移除并重新添加机器人，才能使更改生效。

### 群组权限（管理员权限）

管理员状态在群组内部设置（Telegram UI）。管理员机器人始终会接收所有群组消息，因此如果您需要完全可见性，请使用管理员权限。

## 工作原理（行为）

- 入站消息被归一化为共享通道信封，其中包含回复上下文和媒体占位符。
- 群组回复默认需要提及（原生 @提及或 `agents.list[].groupChat.mentionPatterns` / `messages.groupChat.mentionPatterns`）。
- 多代理覆盖：在 __INLINE_CODE_2__ 上为每个代理设置模式。
- 回复始终路由回同一个 Telegram 聊天。
- 长轮询使用 grammY 运行器对每条聊天进行序列化；整体并发由 __INLINE_CODE_3__ 限制。
- Telegram Bot API 不支持已读回执；没有 __INLINE_CODE_4__ 选项。

## 格式化（Telegram HTML）

- 出站 Telegram 文本使用 `parse_mode: "HTML"`（Telegram 支持的标签子集）。
- 类 Markdown 输入会被渲染为**Telegram 安全的 HTML**（包括粗体、斜体、删除线、代码和链接）；块元素则被展平为带有换行符和项目符号的纯文本。
- 来自模型的原始 HTML 会经过转义处理，以避免 Telegram 解析错误。
- 如果 Telegram 拒绝处理 HTML 负载，OpenClaw 会以纯文本格式重试发送同一消息。

## 命令（原生 + 自定义）

OpenClaw 在启动时向 Telegram 的机器人菜单注册原生命令（如 `/status`、`/reset`、`/model`）。
您可以通过配置向菜单添加自定义命令：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" }
      ]
    }
  }
}
```

故障排除

- 日志中的 `setMyCommands failed` 通常表示出站 HTTPS/DNS 被阻止到 `api.telegram.org`。
- 如果您看到 `sendMessage` 或 `sendChatAction` 失败，请检查 IPv6 路由和 DNS。

更多帮助：[通道故障排除](/channels/troubleshooting)。

注意事项：

- 自定义命令仅是**菜单条目**；除非您在其他地方进行处理，否则 OpenClaw 不会执行它们。
- 命令名称经过归一化处理（去除前导 `/`，转换为小写），且必须匹配 `a-z`、`0-9`、`_`（1–32 个字符）。
- 自定义命令**不能覆盖原生命令**。任何冲突都会被忽略并记录。
- 如果 `commands.native` 被禁用，则仅注册自定义命令（如果没有自定义命令，则清空注册）。

## 限制

- 出站文本按 `channels.telegram.textChunkLimit` 分块（默认 4000）。
- 可选的换行符分块：设置 `channels.telegram.chunkMode="newline"` 以在长度分块之前按空行（段落边界）分割。
- 媒体下载/上传受 `channels.telegram.mediaMaxMb` 限制（默认 5）。
- Telegram Bot API 请求在 `channels.telegram.timeoutSeconds` 后超时（默认通过 grammY 设置为 500）。设置更低值以避免长时间挂起。
- 群组历史上下文使用 `channels.telegram.historyLimit`（或 `channels.telegram.accounts.*.historyLimit`），回落到 `messages.groupChat.historyLimit`。设置 `0` 可禁用（默认 50）。
- 私信历史可通过 `channels.telegram.dmHistoryLimit` 限制（用户可调整）。每用户覆盖：`channels.telegram.dms["<user_id>"].historyLimit`。

## 群组激活模式

默认情况下，机器人仅响应群组中的提及（`@botname` 或 `agents.list[].groupChat.mentionPatterns` 中的模式）。要更改此行为：

### 通过配置（推荐）

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": { requireMention: false }  // always respond in this group
      }
    }
  }
}
```

**重要提示：** 设置 `channels.telegram.groups` 会创建一个 **白名单** -  only 列入名单的群组（或 `"*"`）才会被接受。
论坛主题将继承其父群组的配置（allowFrom、requireMention、skills、prompts），除非您在 `channels.telegram.groups.<groupId>.topics.<topicId>` 下为特定主题添加覆盖设置。

要允许所有群组始终响应：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false }  // all groups, always respond
      }
    }
  }
}
```

要保持所有群组仅响应提及（默认行为）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true }  // or omit groups entirely
      }
    }
  }
}
```

通过命令（会话级别）

在群组中发送：

- `/activation always` - 回应所有消息
- `/activation mention` - 要求提及（默认）

**注意：** 该命令仅更新会话状态。如需在重启后保持持久行为，请使用配置。

### 获取群组聊天 ID

将群组中的任何消息转发到 Telegram 上的 `@userinfobot` 或 `@getidsbot`，即可查看聊天 ID（如 `-1001234567890` 这样的负数）。

**提示：** 对于您自己的用户 ID，向机器人发送私信，它会回复您的用户 ID（配对消息），或者在启用命令后使用 `/whoami`。

**隐私提示：** `@userinfobot` 是第三方机器人。如果您愿意，可以将机器人添加到群组，发送一条消息，然后使用 `openclaw logs --follow` 读取 `chat.id`，或使用 Bot API `getUpdates`。

## 配置写入

默认情况下，Telegram 被允许写入由通道事件或 `/config set|unset` 触发的配置更新。

这种情况发生在：

- 当群组升级为超级群组且 Telegram 发出 `migrate_to_chat_id`（聊天 ID 更改）。OpenClaw 可以自动迁移 `channels.telegram.groups`。
- 当您在 Telegram 聊天中运行 `/config set` 或 `/config unset`（需要 `commands.config: true`）。

禁用方法：

```json5
{
  channels: { telegram: { configWrites: false } }
}
```

## 主题（论坛超级群组）

Telegram 论坛主题的每条消息都包含一个 `message_thread_id`。OpenClaw：

- 将 `:topic:<threadId>` 追加到 Telegram 群组会话密钥，以确保每个主题彼此隔离。
- 发送打字指示器和回复时使用 `message_thread_id`，以确保回复始终围绕当前主题展开。
- 通用主题（线程 ID `1`）具有特殊性：发送消息时应省略 `message_thread_id`（Telegram 会拒绝包含该字段的消息），但打字指示器仍需包含它。
- 在模板上下文中公开 `MessageThreadId` 和 `IsForum`，用于路由和模板化。
- 特定主题的配置可在 `channels.telegram.groups.<chatId>.topics.<threadId>` 下获取，包括技能、白名单、自动回复、系统提示和禁用设置。
- 主题配置默认继承群组设置（requireMention、白名单、技能、提示、启用），除非在主题级别进行了覆盖。

在某些边缘情况下，私人聊天可能包含 `message_thread_id`。OpenClaw会保持DM会话密钥不变，但在存在线程ID时仍使用线程ID来处理回复或草稿的流式传输。

内联按钮

Telegram 支持带有回调按钮的内联键盘。

```json5
{
  "channels": {
    "telegram": {
      "capabilities": {
        "inlineButtons": "allowlist"
      }
    }
  }
}
```

针对每个账户的配置：

```json5
{
  "channels": {
    "telegram": {
      "accounts": {
        "main": {
          "capabilities": {
            "inlineButtons": "allowlist"
          }
        }
      }
    }
  }
}
```

范围：

- `off` — 内联按钮已禁用
- `dm` — 仅限私信（阻止群组目标）
- `group` — 仅限群组（阻止私信目标）
- `all` — 私信 + 群组
- `allowlist` — 私信 + 群组，但仅允许 `allowFrom`/`groupAllowFrom` 允许的发件人（与控制命令相同的规则）

默认：`allowlist`。
旧版：`capabilities: ["inlineButtons"]` = `inlineButtons: "all"`。

发送按钮

使用消息工具并使用 `buttons` 参数：

```json5
{
  "action": "send",
  "channel": "telegram",
  "to": "123456789",
  "message": "Choose an option:",
  "buttons": [
    [
      {"text": "Yes", "callback_data": "yes"},
      {"text": "No", "callback_data": "no"}
    ],
    [
      {"text": "Cancel", "callback_data": "cancel"}
    ]
  ]
}
```

当用户点击按钮时，回调数据会以以下格式作为消息发送回代理：
`callback_data: value`

配置选项

Telegram 功能可以在两个级别上进行配置（上面显示的是对象形式；旧版字符串数组仍受支持）：

- `channels.telegram.capabilities`: 全局默认功能配置适用于所有 Telegram 账户，除非被覆盖。
- `channels.telegram.accounts.<account>.capabilities`: 每个账户的功能会覆盖该特定账户的全局默认设置。

当所有 Telegram 机器人或账户的行为应保持一致时，使用全局设置。当不同机器人需要不同的行为时（例如，一个账户只处理私信，而另一个账户被允许加入群组），使用每账户配置。

## 访问控制（私信 + 群组）

DM 访问

- 默认：`channels.telegram.dmPolicy = "pairing"`。未知发送者会收到配着代码；消息在批准之前会被忽略（代码在 1 小时后失效）。
- 批准方式：
  - `openclaw pairing list telegram`
  - `openclaw pairing approve telegram <CODE>`
- 配着是 Telegram 私信使用的默认令牌交换方式。详情：[配着](/start/pairing)
- `channels.telegram.allowFrom` 接受数字用户 ID（推荐）或 `@username` 条目。这不是机器人用户名；使用人类发送者的 ID。向导接受 `@username`，并在可能的情况下将其解析为数字 ID。

#### 查找您的 Telegram 用户 ID

更安全（无需第三方机器人）：
1) 启动网关并向您的机器人发送私信。
2) 运行 `openclaw logs --follow` 并查找 `from.id`。

替代方案（官方 Bot API）：
1) 向您的机器人发送私信。
2) 使用您的机器人令牌获取更新，并读取 `message.from.id`：

   ```bash
   curl "https://api.telegram.org/bot<bot_token>/getUpdates"
   ```

第三方（隐私性较差）：

- 向 `@userinfobot` 或 `@getidsbot` 发送私信，并使用返回的用户ID。

群组访问

两个独立的控制：

**1. 允许哪些群组**（通过 `channels.telegram.groups` 的群组白名单）：

- 如果没有 `groups` 配置，则所有群组都被允许。
- 如果有 `groups` 配置，则只有列出的群组或 `"*"` 被允许。
- 示例：`"groups": { "-1001234567890": {}, "*": {} }` 允许所有群组。

**2. 允许哪些发件人**（通过 `channels.telegram.groupPolicy` 的发件人过滤）：

- `"open"` = 允许群组中的所有发送者发送消息。
- `"allowlist"` = 只允许 `channels.telegram.groupAllowFrom` 中的发送者发送消息。
- `"disabled"` = 完全不允许群组消息。

默认是 `groupPolicy: "allowlist"`（除非您添加 `groupAllowFrom`，否则会被阻止）。

大多数用户希望：`groupPolicy: "allowlist"` + `groupAllowFrom` + 在 `channels.telegram.groups` 中列出特定群组。

长轮询与Webhook

- 默认：长轮询（不需要公共 URL）。
- Webhook 模式：设置 `channels.telegram.webhookUrl`（可选地设置 `channels.telegram.webhookSecret` + `channels.telegram.webhookPath`）。
  - 本地监听器绑定到 `0.0.0.0:8787`，且默认提供 `POST /telegram-webhook`。
  - 如果您的公共 URL 不同，使用反向代理并将 `channels.telegram.webhookUrl` 指向公共端点。

## 回复线程化

Telegram 通过标签支持可选的线程回复：

- `[[reply_to_current]]` -- 回复触发消息。
- `[[reply_to:<id>]]` -- 回复特定消息 ID。

由 `channels.telegram.replyToMode` 控制：

- `first`（默认）、`all`、`off`。

## 音频消息（语音 vs 文件）

Telegram 区分**语音笔记**（圆形气泡）和**音频文件**（元数据卡片）。
OpenClaw 默认使用音频文件以实现向后兼容性。

要在代理回复中强制使用语音笔记气泡，在回复中的任何位置加入此标签：

- `[[audio_as_voice]]` — 将音频作为语音笔记而不是文件发送。

该标签会在传递的文本中被删除。其他通道会忽略此标签。

对于消息工具发送，设置 `asVoice: true` 并使用与语音兼容的音频 `media` URL
(`message` 在有媒体时是可选)：

```json5
{
  "action": "send",
  "channel": "telegram",
  "to": "123456789",
  "media": "https://example.com/voice.ogg",
  "asVoice": true
}
```

贴纸

OpenClaw支持接收和发送Telegram贴纸，并具备智能缓存功能。

接收贴纸

当用户发送贴纸时，OpenClaw会根据贴纸类型进行处理：

- **静态贴纸（WEBP）：** 下载并经过视觉处理。贴纸在消息内容中显示为 `<media:sticker>` 占位符。
- **动画贴纸（TGS）：** 跳过（不支持以 Lottie 格式进行处理）。
- **视频贴纸（WEBM）：** 跳过（不支持以视频格式进行处理）。

接收贴纸时可用的模板上下文字段：

- `Sticker` — 包含以下信息的对象：
  - `emoji` — 与贴纸相关的表情符号
  - `setName` — 贴纸集的名称
  - `fileId` — Telegram 文件 ID（可发送相同的贴纸）
  - `fileUniqueId` — 用于缓存查找的稳定 ID
  - `cachedDescription` — 可用时的缓存视觉描述

贴纸缓存

贴纸通过人工智能的视觉能力进行处理，以生成描述。由于相同的贴纸经常被反复发送，OpenClaw会缓存这些描述，从而避免重复调用API。

**工作原理：**

1. **首次遇到：** 贴纸图像被发送至人工智能进行视觉分析。人工智能生成描述，例如“一只热情挥手的卡通猫”。
2. **缓存存储：** 描述与贴纸的文件ID、表情符号和贴纸集名称一同保存在缓存中。
3. **后续遇到：** 当再次遇到相同的贴纸时，直接调用缓存中的描述，不再将图像发送至人工智能进行处理。

**缓存位置：** `~/.openclaw/telegram/sticker-cache.json`

**缓存条目格式：**

```json
{
  "fileId": "CAACAgIAAxkBAAI...",
  "fileUniqueId": "AgADBAADb6cxG2Y",
  "emoji": "👋",
  "setName": "CoolCats",
  "description": "A cartoon cat waving enthusiastically",
  "cachedAt": "2026-01-15T10:30:00.000Z"
}
```

**好处：**

- 通过避免对同一贴纸重复进行视觉调用，降低API成本
- 对于已缓存的贴纸，响应时间更快（无需等待视觉处理延迟）
- 可根据缓存的描述实现贴纸搜索功能

缓存会在接收贴纸时自动填充，无需手动管理。

发送贴纸

代理可以使用 `sticker` 和 `sticker-search` 操作来发送和搜索贴纸。默认情况下，此功能已禁用，必须在配置中手动启用：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true
      }
    }
  }
}
```

**发送贴纸：**

```json5
{
  "action": "sticker",
  "channel": "telegram",
  "to": "123456789",
  "fileId": "CAACAgIAAxkBAAI..."
}
```

参数：

- `fileId`（必填）— 贴纸的 Telegram 文件ID。在接收贴纸时从 `Sticker.fileId` 获取，或从 `sticker-search` 结果中获取。
- `replyTo`（可选）— 回复的消息ID。
- `threadId`（可选）— 论坛主题的消息线程ID。

**搜索贴纸：**

代理可以按描述、表情符号或集名搜索缓存的贴纸：

```json5
{
  "action": "sticker-search",
  "channel": "telegram",
  "query": "cat waving",
  "limit": 5
}
```

返回缓存中匹配的贴纸：

```json5
{
  "ok": true,
  "count": 2,
  "stickers": [
    {
      "fileId": "CAACAgIAAxkBAAI...",
      "emoji": "👋",
      "description": "A cartoon cat waving enthusiastically",
      "setName": "CoolCats"
    }
  ]
}
```

搜索采用模糊匹配，涵盖描述文本、表情符号字符和集名。

**带线程化的示例：**

```json5
{
  "action": "sticker",
  "channel": "telegram",
  "to": "-1001234567890",
  "fileId": "CAACAgIAAxkBAAI...",
  "replyTo": 42,
  "threadId": 123
}
```

流式传输（草稿）

Telegram 可以在代理生成回复时流式传输**草稿气泡**。
OpenClaw 使用 Bot API `sendMessageDraft`（并非真实消息），然后将最终回复作为正常消息发送。

要求（Telegram Bot API 9.3+）：

- **启用了主题的私人聊天**（机器人处于论坛主题模式）。
- 入站消息必须包含 `message_thread_id`（私人主题线程）。
- 流式传输对群组、超级群组和频道无效。

配置：

- `channels.telegram.streamMode: "off" | "partial" | "block"`（默认：`partial`）
  - `partial`：用最新的流式文本更新草稿气泡。
  - `block`：以更大的块更新草稿气泡。
  - `off`：禁用草稿流式传输。
- 可选（仅适用于 `streamMode: "block"`）：
  - `channels.telegram.draftChunk: { minChars?, maxChars?, breakPreference? }`
    - 默认：`minChars: 200`、`maxChars: 800`、`breakPreference: "paragraph"`（限制在 `channels.telegram.textChunkLimit` 以内）。

注意：草稿流式传输与**块流式传输**（频道消息）是分开的。
块流式传输默认关闭，如果您希望获得早期 Telegram 消息而不是草稿更新，则需要 `channels.telegram.blockStreaming: true`。

推理流（仅限 Telegram）：

- `/reasoning stream` 会将推理流式传输到草稿气泡中，同时生成回复，然后在不包含推理的情况下发送最终答案。
- 如果 `channels.telegram.streamMode` 是 `off`，则推理流被禁用。

更多背景信息：[流式传输 + 分块](/concepts/streaming)。

重试策略

出站 Telegram API 调用在遇到短暂网络问题或 429 错误时，会使用指数退避和抖动机制进行重试。可通过 `channels.telegram.retry` 进行配置。更多信息请参见 [重试策略](/concepts/retry)。

代理工具（消息 + 反应）

- 工具：`telegram` 带 `sendMessage` 操作（`content`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）。
- 工具：`telegram` 带 `react` 操作（`chatId`、`messageId`、`emoji`）。
- 工具：`telegram` 带 `deleteMessage` 操作（`chatId`、`messageId`）。
- 反应移除语义：请参见 [/tools/reactions](/tools/reactions)。
- 工具门贡：`channels.telegram.actions.reactions`、`channels.telegram.actions.sendMessage`、`channels.telegram.actions.deleteMessage`（默认启用），以及 `channels.telegram.actions.sticker`（默认禁用）。

## 反应通知

**反应的工作原理：**
Telegram 反应作为**单独的 `message_reaction` 事件**到达，而不是作为消息负载中的属性。当用户添加反应时，OpenClaw：

1. 从 Telegram API 接收 `message_reaction` 更新
2. 将其转换为**系统事件**，格式为：`"Telegram reaction added: {emoji} by {user} on msg {id}"`
3. 使用与常规消息相同的**会话密钥**将系统事件加入队列
4. 当下一条消息到达该对话时，系统事件被清空，并被添加到代理的上下文中

代理在对话历史中将反应视为**系统通知**，而不是消息元数据。

**配置：**

- `channels.telegram.reactionNotifications`：控制哪些反应会触发通知
  - `"off"` — 忽略所有反应
  - `"own"` — 在用户对机器人消息做出反应时发出通知（尽力而为；内存中）（默认）
  - `"all"` — 对所有反应发出通知

- `channels.telegram.reactionLevel`：控制代理的反应能力
  - `"off"` — 代理无法对消息做出反应
  - `"ack"` — 机器人发送确认反应（处理时👀）（默认）
  - `"minimal"` — 代理可以谨慎地做出反应（指南：每 5–10 次交流做 1 次）
  - `"extensive"` — 代理可以在适当的时候自由地做出反应

**论坛群组：** 论坛群组中的回复包含 `message_thread_id`，并使用像 `agent:main:telegram:group:{chatId}:topic:{threadId}` 这样的会话密钥。这确保了同一主题内的回复和消息始终归于一处。

**示例配置：**

```json5
{
  channels: {
    telegram: {
      reactionNotifications: "all",  // See all reactions
      reactionLevel: "minimal"        // Agent can react sparingly
    }
  }
}
```

**要求：**

- Telegram 机器人必须在 `allowed_updates` 中明确请求 `message_reaction`（由 OpenClaw 自动配置）。
- 对于 webhook 模式，反应包含在 webhook `allowed_updates` 中。
- 对于 polling 模式，反应包含在 `getUpdates` `allowed_updates` 中。

投递目标（CLI/计划任务）

- 使用聊天 ID (`123456789`) 或用户名 (`@name`) 作为目标。
- 示例：`openclaw message send --channel telegram --target 123456789 --message "hi"`。

故障排除

**机器人在群组中不对非提及消息作出回应：**

- 如果您设置了 `channels.telegram.groups.*.requireMention=false`，Telegram 的 Bot API **隐私模式** 必须被禁用。
  - BotFather：`/setprivacy` → **禁用**（然后从群组中移除并重新添加机器人）
- 当配置期望未提及的群组消息时，`openclaw channels status` 会显示警告。
- `openclaw channels status --probe` 还可以额外检查成员身份，以验证明确的数字群组 ID（但它无法审核通配符 `"*"` 规则）。
- 快速测试：`/activation always`（仅限会话；使用配置以实现持久性）。

**机器人完全看不到群组消息：**

- 如果设置了 `channels.telegram.groups`，群组必须被列入名单或使用 `"*"`。
- 检查 @BotFather 中的隐私设置 → “群组隐私”应为**关闭**。
- 确认机器人实际上是群组成员（而不仅仅是没有读取权限的管理员）。
- 检查网关日志：`openclaw logs --follow`（查找“跳过群组消息”）。

**机器人会对提及作出回应，但不会对 `/activation always` 作出回应：**

- `/activation` 命令会更新会话状态，但不会将其持久化到配置中。
- 对于持久行为，请将群组添加到 __INLINE_CODE_1__ 并使用 __INLINE_CODE_2__。

**像 `/status` 这样的命令不起作用：**

- 确保您的 Telegram 用户 ID 已获授权（通过配对或 `channels.telegram.allowFrom`）。
- 即使在有 `groupPolicy: "open"` 的群组中，命令也需要授权。

**在 Node 22+ 上，长轮询会立即中止（通常在使用代理或自定义 fetch 时）：**

- Node 22+ 对 `AbortSignal` 实例的限制更为严格；外来信号可能会立即中止 `fetch` 调用。
- 升级到能够规范化中止信号的 OpenClaw 构建版本，或在能够升级之前在 Node 20 上运行网关。

**机器人启动后悄然停止响应（或记录 `HttpError: Network request ... failed`）：**

- 某些主机可能会首先将 `api.telegram.org` 解析为 IPv6。如果您的服务器没有正常的 IPv6 出口，gramY 可能会因仅支持 IPv6 的请求而卡住。
- 通过启用 IPv6 出口 **或** 强制对 `api.telegram.org` 进行 IPv4 解析（例如，使用 IPv4 A 记录添加一个 `/etc/hosts` 条目，或在您的操作系统 DNS 堆栈中优先使用 IPv4），然后重启网关。
- 快速检查：运行 `dig +short api.telegram.org A` 和 `dig +short api.telegram.org AAAA` 以确认 DNS 返回的内容。

## 配置参考（Telegram）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.telegram.enabled`：启用或禁用通道启动。
- `channels.telegram.tokenFile`：机器人令牌（BotFather）。
- `channels.telegram.tokenFile`：从文件路径读取令牌。
- `channels.telegram.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配着）。
- `channels.telegram.allowFrom`：DM 白名单（ID/用户名）。`open` 需要 `"*"`。
- `channels.telegram.groupPolicy`：`open | allowlist | disabled`（默认：白名单）。
- `channels.telegram.groupAllowFrom`：群组发送者白名单（ID/用户名）。
- `channels.telegram.groups`：每群组的默认值 + 白名单（使用 `"*"` 进行全局默认）。
  - `channels.telegram.groups.<id>.requireMention`：提及门控默认。
  - `channels.telegram.groups.<id>.skills`：技能过滤器（omit = 所有技能，empty = 无技能）。
  - `channels.telegram.groups.<id>.allowFrom`：每群组的发送者白名单覆盖。
  - `channels.telegram.groups.<id>.systemPrompt`：为群组添加额外的系统提示。
  - `channels.telegram.groups.<id>.enabled`：在满足 `false` 的条件下禁用群组。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`：每主题的覆盖（与群组相同的字段）。
  - `channels.telegram.groups.<id>.topics.<threadId>.requireMention`：每主题的提及门控覆盖。
- `channels.telegram.capabilities.inlineButtons`：`off | dm | group | all | allowlist`（默认：白名单）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`：每账户的覆盖。
- `channels.telegram.replyToMode`：`off | first | all`（默认：`first`）。
- `channels.telegram.textChunkLimit`：出站分块大小（字符）。
- `channels.telegram.chunkMode`：`length`（默认）或 `newline` 在长度分块前按空行（段落边界）分割。
- `channels.telegram.linkPreview`：切换出站消息的链接预览（默认：开启）。
- `channels.telegram.streamMode`：`off | partial | block`（草稿流式传输）。
- `channels.telegram.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.telegram.retry`：出站 Telegram API 调用的重试策略（尝试次数、最小延迟毫秒数、最大延迟毫秒数、抖动）。
- `channels.telegram.network.autoSelectFamily`：覆盖 Node autoSelectFamily（true=启用，false=禁用）。默认在 Node 22 上禁用，以避免 Happy Eyeballs 超时。
- `channels.telegram.proxy`：Bot API 调用的代理 URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`：启用 Webhook 模式。
- `channels.telegram.webhookSecret`：Webhook 密钥（可选）。
- `channels.telegram.webhookPath`：本地 Webhook 路径（默认 `/telegram-webhook`）。
- `channels.telegram.actions.reactions`：门控 Telegram 工具的反应。
- `channels.telegram.actions.sendMessage`：门控 Telegram 工具的消息发送。
- `channels.telegram.actions.deleteMessage`：门控 Telegram 工具的消息删除。
- `channels.telegram.actions.sticker`：门控 Telegram 贴纸行动——发送和搜索（默认：关闭）。
- `channels.telegram.reactionNotifications`：`off | own | all` — 控制哪些反应会触发系统事件（默认：`own`，未设置时）。
- `channels.telegram.reactionLevel`：`off | ack | minimal | extensive` — 控制代理的反应能力（默认：`minimal`，未设置时）。
