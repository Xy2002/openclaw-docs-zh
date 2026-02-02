---
summary: 'Discord bot support status, capabilities, and configuration'
read_when:
  - Working on Discord channel features
---
__HEADING_0__Discord（机器人API）

状态：已准备好通过官方 Discord 机器人网关在私信和服务器文本频道中使用。

快速设置（初学者）

1) 创建一个 Discord 机器人并复制机器人令牌。
2) 在 Discord 应用程序设置中，启用“消息内容意图”（如果您计划使用白名单或名称查找，则还需启用“服务器成员意图”）。
3) 为 OpenClaw 设置令牌：

- 环境变量：`DISCORD_BOT_TOKEN=...`
   - 或配置文件：`channels.discord.token: "..."`。
   - 如果两者都设置了，配置优先（环境变量回退仅适用于默认账户）。

4) 使用消息权限将机器人邀请到您的服务器（如果您只想使用私信，请创建一个私人服务器）。
5) 启动网关。
6) 默认情况下，私信访问采用配对模式；首次联系时需批准配对代码。

最小配置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN"
    }
  }
}
```

## 目标

- 通过 Discord 私信或服务器频道与 OpenClaw 对话。
- 直接聊天会合并到代理的主要会话中（默认 `agent:main:main`)；服务器频道保持隔离，作为 `agent:<agentId>:discord:channel:<channelId>`（显示名称使用 `discord:<guildSlug>#<channelSlug>`)。
- 默认忽略群组私信；可通过 `channels.discord.dm.groupEnabled` 启用，并可选择通过 `channels.discord.dm.groupChannels` 进行限制。
- 保持路由确定性：回复始终返回到它们到达的频道。

## 工作原理

1. 创建一个 Discord 应用程序并添加机器人，启用所需的权限意图（私信、服务器消息和消息内容），然后获取机器人令牌。
2. 将机器人邀请到您的服务器，并授予其在您希望使用的频道中读取和发送消息所需的权限。
3. 使用 `channels.discord.token` 配置 OpenClaw；如果失败，则回退到使用 `DISCORD_BOT_TOKEN`。
4. 启动网关；当令牌可用时（优先使用配置文件中的设置，其次使用环境变量），且 `channels.discord.enabled` 不等于 `false` 时，网关会自动启动 Discord 频道。
   - 如果您更倾向于使用环境变量，请设置 `DISCORD_BOT_TOKEN`（可选配置块）。
5. 直接聊天：交付消息时使用 `user:<id>`（或通过 `<@id>` 提及机器人）；所有对话回合都会进入共享的 `main` 会话。裸露的数字 ID 会被模糊处理并拒绝。
6. 服务器频道：使用 `channel:<channelId>` 进行消息交付。默认情况下需要提及机器人，此行为可按服务器或按频道单独配置。
7. 直接聊天：默认通过 `channels.discord.dm.policy` 进行保护（默认值为 `"pairing"`）。未知发件人会收到一个有效期为 1 小时的配对代码；该代码需通过 `openclaw pairing approve discord <code>` 批准后方可继续通信。
   - 若要恢复旧版“对任何人开放”的行为：请设置 `channels.discord.dm.policy="open"` 和 `channels.discord.dm.allowFrom=["*"]`。
   - 若需实施严格的白名单机制：请设置 `channels.discord.dm.policy="allowlist"`，并在 `channels.discord.dm.allowFrom` 中列出获准的发件人。
   - 若要完全忽略所有私信：请设置 `channels.discord.dm.enabled=false` 或 `channels.discord.dm.policy="disabled"`。
8. 默认情况下会忽略群组私信；可通过 `channels.discord.dm.groupEnabled` 启用此功能，并可选择通过 `channels.discord.dm.groupChannels` 对其进行进一步限制。
9. 可选的服务器规则：可按服务器 ID（推荐）或 slug 设置 `channels.discord.guilds`，并为每个频道单独定义规则。
10. 可选的原生命令：默认情况下，`commands.native` 的值为 `"auto"`（Discord 和 Telegram 已启用，Slack 已禁用）。可通过 `channels.discord.commands.native: true|false|"auto"` 覆盖此设置；`false` 可清除先前注册的命令。文本命令由 `commands.text` 控制，且必须作为独立的 `/...` 消息发送。使用 `commands.useAccessGroups: false` 可绕过对命令访问权限的检查。
    - 完整命令列表与配置详情：请参阅 [Slash 命令](/tools/slash-commands)。
11. 可选的服务器上下文历史：设置 `channels.discord.historyLimit`（默认值为 20，回退至 `messages.groupChat.historyLimit`)，以在回复提及时将最近 N 条服务器消息作为上下文包含在内。设置 `0` 可禁用此功能。
12. 反应：代理可通过 `discord` 工具触发反应（受 `channels.discord.actions.*` 限制）。
    - 关于反应移除语义的更多信息，请参阅 [/tools/reactions](/tools/reactions)。
    - 当前频道为 Discord 时，才会公开 `discord` 工具。
13. 原生命令使用隔离的会话密钥 (`agent:<agentId>:discord:slash:<userId>`)，而非共享的 `main` 会话。

注意：名称→ID解析使用服务器成员搜索，需要服务器成员意图；如果机器人无法搜索成员，使用ID或`<@id>`提及。
注意：Slug为小写，空格替换为`-`。频道名称被转换为slug，不带前导`#`。
注意：Guild上下文`[from:]`行包括`author.tag` + `id`，使ping就绪的回复变得容易。

## 配置写入

默认情况下，Discord 全允许由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`)。

禁用方法：

```json5
{
  channels: { discord: { configWrites: false } }
}
```

## 如何创建您自己的机器人

这是“Discord 开发者门户”设置，用于在服务器（guild）频道中运行 OpenClaw，如 `#help`。

### 1) 创建 Discord 应用程序 + 机器人用户

1. Discord 开发者门户 → **应用程序** → **新应用程序**
2. 在您的应用中：
   - **机器人** → **添加机器人**
   - 复制 **机器人令牌**（这是您需要放入 `DISCORD_BOT_TOKEN` 的内容）

### 2) 启用 OpenClaw 所需的网关意图

Discord 会阻止“特权意图”，除非您明确启用它们。

在**机器人**→**特权网关意图**中，启用：

- **消息内容意图**（在大多数服务器中读取消息文本所必需；如果没有此意图，您将看到“使用了不允许的意图”消息，或者机器人虽然会连接，但不会对消息作出任何反应）
- **服务器成员意图**（推荐；在某些服务器中进行成员/用户查找和白名单匹配所必需）

您通常不需要**存在意图**。

### 3) 生成邀请网址（OAuth2 URL生成器）

在您的应用中：**OAuth2** → **URL生成器**

**范围**

- ✅ `bot`
- ✅ `applications.commands`（原生命令所必需）

**机器人权限**（最低基线）

- ✅ 查看频道
- ✅ 发送消息
- ✅ 读取消息历史
- ✅ 嵌入链接
- ✅ 附件文件
- ✅ 添加反应（可选但推荐）
- ✅ 使用外部表情符号/贴纸（可选；仅在您需要时使用）

除非您正在调试并且完全信任机器人，否则请避免使用**管理员**权限。

复制生成的网址，打开它，选择您的服务器并安装机器人。

### 4) 获取ID（服务器/用户/频道）

Discord 在任何地方都使用数字ID；OpenClaw的配置更倾向于使用ID。

1. Discord（桌面版/网页版）→ **用户设置** → **高级** → 启用 **开发者模式**
2. 右键单击：
   - 服务器名称 → **复制服务器 ID**（guild ID）
   - 频道（例如 `#help`）→ **复制频道 ID**
   - 您的用户 → **复制用户 ID**

### 5) 配置 OpenClaw

#### 令牌

通过环境变量设置机器人令牌（建议在服务器上使用）：

- `DISCORD_BOT_TOKEN=...`

或通过配置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN"
    }
  }
}
```

多账户支持：使用 `channels.discord.accounts` 与每账户令牌以及可选的 `name`。有关共享模式，请参阅 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)。

#### 白名单 + 频道路由

示例“单个服务器，只允许我，只允许#help”：

```json5
{
  channels: {
    discord: {
      enabled: true,
      dm: { enabled: false },
      guilds: {
        "YOUR_GUILD_ID": {
          users: ["YOUR_USER_ID"],
          requireMention: true,
          channels: {
            help: { allow: true, requireMention: true }
          }
        }
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    }
  }
}
```

注释：

- `requireMention: true` 表示机器人仅在被提及时回复（推荐用于共享频道）。
- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）也被视为对服务器消息的提及。
- 多代理覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每代理模式。
- 如果 `channels` 存在，未列出的任何频道默认被拒绝。
- 使用 `"*"` 频道条目可在所有频道中应用默认值；显式频道条目会覆盖通配符。
- 线程会继承父频道的配置（白名单、`requireMention`、技能、提示等），除非您明确添加线程频道 ID。
- 机器人撰写的消息默认被忽略；设置 `channels.discord.allowBots=true` 以允许它们（自有消息仍被过滤）。
- 警告：如果您允许对其他机器人进行回复（`channels.discord.allowBots=true`），请通过 `requireMention`、`channels.discord.guilds.*.channels.<id>.users` 白名单和/或清除 `AGENTS.md` 和 `SOUL.md` 中的护栏来防止机器人之间的回复循环。

### 6) 验证是否正常工作

1. 启动网关。
2. 在您的服务器频道中，发送：`@Krill hello`（或您的机器人名称）。
3. 如果没有任何反应：请查看下面的“故障排除”。

### 故障排除

- 首先：运行 `openclaw doctor` 和 `openclaw channels status --probe`（可操作的警告 + 快速审计）。
- **“使用了不允许的意图”**：在开发者门户中启用 **消息内容意图**（很可能还需要 **服务器成员意图**），然后重启网关。
- **机器人连接但从未在 guild 频道中回复**：
  - 缺少 **消息内容意图**，或
  - 机器人缺乏频道权限（查看/发送/读取消息历史），或
  - 您的配置要求提及，而您没有提及，或
  - 您的 guild/频道白名单拒绝该频道/用户。
- **`requireMention: false` 但仍无回复**：
- `channels.discord.groupPolicy` 默认为 **白名单**；将其设置为 `"open"` 或在 `channels.discord.guilds` 下添加 guild 条目（可选地在 `channels.discord.guilds.<id>.channels` 下列出频道以进行限制）。
  - 如果您只设置 `DISCORD_BOT_TOKEN` 而从未创建 `channels.discord` 部分，运行时

默认 `groupPolicy` 到 `open`。添加 `channels.discord.groupPolicy`、
    `channels.defaults.groupPolicy`，或公会/频道白名单以锁定它。

- `requireMention` 必须位于 `channels.discord.guilds`（或特定频道）之下。顶级的 `channels.discord.requireMention` 被忽略。
- **权限审计**（`channels status --probe`)仅检查数字频道 IDs。如果您使用 slug/名称作为 `channels.discord.guilds.*.channels` 键，审计无法验证权限。
- **DMs 不工作**：`channels.discord.dm.enabled=false`、`channels.discord.dm.policy="disabled"`，或者您尚未获得批准（`channels.discord.dm.policy="pairing"`)。

## 功能与限制

- 私信和公会文本频道（线程被视为独立频道；不支持语音）。
- 输入指示器采用尽力而为的设计；消息分块使用 `channels.discord.textChunkLimit`（默认 2000 字符），并根据行数对长回复进行分割（`channels.discord.maxLinesPerMessage`，默认 17 行）。
- 可选的换行符分块：通过设置 `channels.discord.chunkMode="newline"`，可在按长度分块之前先按空行（段落边界）进行分割。
- 文件上传支持的最大文件大小可达配置的 `channels.discord.mediaMaxMb`（默认 8 MB）。
- 默认启用对公会回复的提及控制，以避免机器人消息过于嘈杂。
- 当消息引用另一条消息时，系统会注入回复上下文（引用内容 + IDs）。
- 原生回复线程功能**默认关闭**；可通过 `channels.discord.replyToMode` 和回复标签启用。

重试策略

出站 Discord API 调用在遇到速率限制（429）时会使用 Discord 的 `retry_after` 进行重试，并采用指数退避和抖动。可通过 `channels.discord.retry` 配置。参见 [重试策略](/concepts/retry)。

## 配置

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "abc.123",
      groupPolicy: "allowlist",
      guilds: {
        "*": {
          channels: {
            general: { allow: true }
          }
        }
      },
      mediaMaxMb: 8,
      actions: {
        reactions: true,
        stickers: true,
        emojiUploads: true,
        stickerUploads: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        channels: true,
        voiceStatus: true,
        events: true,
        moderation: false
      },
      replyToMode: "off",
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["123456789012345678", "steipete"],
        groupEnabled: false,
        groupChannels: ["openclaw-dm"]
      },
      guilds: {
        "*": { requireMention: true },
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          reactionNotifications: "own",
          users: ["987654321098765432", "steipete"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["search", "docs"],
              systemPrompt: "Keep answers short."
            }
          }
        }
      }
    }
  }
}
```

确认反应在全球范围内由 `messages.ackReaction` +
`messages.ackReactionScope` 控制。使用 `messages.removeAckAfterReply` 可在机器人回复后清除确认反应。

- `dm.enabled`: 设置 `false` 忽略所有 DM（默认 `true`)。
- `dm.policy`: DM 访问控制（推荐 `pairing`)。`"open"` 需要 `dm.allowFrom=["*"]`。
- `dm.allowFrom`: DM 白名单（用户 ID 或名称）。被 `dm.policy="allowlist"` 使用，并用于 `dm.policy="open"` 验证。向导接受用户名，并在机器人可以搜索成员时将其解析为 ID。
- `dm.groupEnabled`: 启用群组 DMs（默认 `false`)。
- `dm.groupChannels`: 可选的群组 DM 频道 ID 或 slug 白名单。
- `groupPolicy`: 控制 guild 频道处理（`open|disabled|allowlist`)；`allowlist` 需要频道白名单。
- `guilds`: 按 guild ID（首选）或 slug 设置的 per-guild 规则。
- `guilds."*"`: 当没有明确条目时，应用默认的 per-guild 设置。
- `guilds.<id>.slug`: 可选的友好 slug 用于显示名称。
- `guilds.<id>.users`: 可选的 per-guild 用户白名单（ID 或名称）。
- `guilds.<id>.tools`: 可选的 per-guild 工具政策覆盖（`allow`/`deny`/`alsoAllow`)，在缺少频道覆盖时使用。
- `guilds.<id>.toolsBySender`: 可选的 per-sender 工具政策覆盖，在 guild 层面生效（当缺少频道覆盖时适用；支持 `"*"` 通配符）。
- `guilds.<id>.channels.<channel>.allow`: 当 `groupPolicy="allowlist"` 时，允许或拒绝频道。
- `guilds.<id>.channels.<channel>.requireMention`: 频道的提及控制。
- `guilds.<id>.channels.<channel>.tools`: 可选的 per-channel 工具政策覆盖（`allow`/`deny`/`alsoAllow`)。
- `guilds.<id>.channels.<channel>.toolsBySender`: 可选的 per-sender 工具政策覆盖，在频道内生效（支持 `"*"` 通配符）。
- `guilds.<id>.channels.<channel>.users`: 可选的 per-channel 用户白名单。
- `guilds.<id>.channels.<channel>.skills`: 技能过滤器（omit = 所有技能，empty = 无）。
- `guilds.<id>.channels.<channel>.systemPrompt`: 频道的额外系统提示（与频道主题结合）。
- `guilds.<id>.channels.<channel>.enabled`: 设置 `false` 可禁用频道。
- `guilds.<id>.channels`: 频道规则（键是频道 slug 或 ID）。
- `guilds.<id>.requireMention`: per-guild 提及要求（可按频道覆盖）。
- `guilds.<id>.reactionNotifications`: 反应系统事件模式（`off`、`own`、`all`、`allowlist`)。
- `textChunkLimit`: 出站文本分块大小（字符）。默认：2000。
- `chunkMode`: `length`（默认）仅在超过 `textChunkLimit` 时才会分割；`newline` 在长度分块之前按空行（段落边界）进行分割。
- `maxLinesPerMessage`: 每条消息的软最大行数。默认：17。
- `mediaMaxMb`: 对保存到磁盘的传入媒体进行限制。
- `historyLimit`: 在回复提及时包含的最近 guild 消息数量作为上下文（默认 20；回退到 `messages.groupChat.historyLimit`；`0` 禁用）。
- `dmHistoryLimit`: 用户回合中的 DM 历史限制。按用户覆盖：`dms["<user_id>"].historyLimit`。
- `retry`: 出站 Discord API 调用的重试策略（尝试次数、最小延迟毫秒数、最大延迟毫秒数、抖动）。
- `actions`: 每项行动的工具门控；省略以允许一切（设置 `false` 以禁用）。
  - `reactions`（涵盖反应 + 读取消息反应）
  - `stickers`、`emojiUploads`、`stickerUploads`、`polls`、`permissions`、`messages`、`threads`、`pins`、`search`
  - `memberInfo`、`roleInfo`、`channelInfo`、`voiceStatus`、`events`
  - `channels`（创建/编辑/删除频道 + 分类 + 权限）
  - `roles`（角色添加/删除，默认 `false`)
  - `moderation`（超时/踢出/禁止，默认 `false`)

反应通知使用 `guilds.<id>.reactionNotifications`：

- `off`: 无反应事件。
- `own`: 在机器人自己的消息上添加反应（默认）。
- `all`: 对所有消息的所有反应。
- `allowlist`: 来自 `guilds.<id>.users` 的所有反应（空列表表示禁用）。

### 工具行动默认值

| 行动组 | 默认 | 注释 |
| --- | --- | --- |
| 反应 | 开启 | 反应 + 列举反应 + emojiList |
| 贴纸 | 开启 | 发送贴纸 |
| emojiUploads | 开启 | 上传表情符号 |
| stickerUploads | 开启 | 上传贴纸 |
| 投票 | 开启 | 创建投票 |
| 权限 | 开启 | 频道权限快照 |
| 消息 | 开启 | 读取/发送/编辑/删除 |
| 线程 | 开启 | 创建/列举/回复 |
| 图钉 | 开启 | 固定/解除固定/列举 |
| 搜索 | 开启 | 消息搜索（预览功能） |
| memberInfo | 开启 | 成员信息 |
| roleInfo | 开启 | 角色列表 |
| channelInfo | 开启 | 频道信息 + 列表 |
| channels | 开启 | 频道/类别管理 |
| voiceStatus | 开启 | 语音状态查询 |
| events | 开启 | 列举/创建预定事件 |
| roles | 关闭 | 角色添加/删除 |
| moderation | 关闭 | 超时/踢出/禁止 |

- `replyToMode`：`off`（默认）、`first` 或 `all`。仅在模型包含回复标签时适用。

## 回复标签

要请求线程回复，模型可以在其输出中包含一个标签：

- `[[reply_to_current]]` — 回复触发的 Discord 消息。
- `[[reply_to:<id>]]` — 回复来自上下文/历史中的特定消息 ID。

当前消息ID作为`[message_id: …]`附加到提示中；历史条目已包含ID。

行为由 `channels.discord.replyToMode` 控制：

- `off`: 忽略标签。
- `first`: 只有第一个出站分块/附件是回复。
- `all`: 每个出站分块/附件都是回复。

白名单匹配注意事项：

- `allowFrom`/`users`/`groupChannels` 接受 ID、名称、标签或提及，如 `<@id>`。
- 支持前缀，如 `discord:`/`user:`（用户）和 `channel:`（群组 DMs）。
- 使用 `*` 可以允许任何发件人/频道。
- 当 `guilds.<id>.channels` 存在，未列出的频道默认被拒绝。
- 当 `guilds.<id>.channels` 被省略，白名单 guild 中的所有频道都被允许。
- 若要允许 **无频道**，设置 `channels.discord.groupPolicy: "disabled"`（或保持空白白名单）。
- 配置向导接受 `Guild/Channel` 名称（公共 + 私人），并在可能的情况下将其解析为 ID。
- 启动时，OpenClaw 将白名单中的频道/用户名称解析为 ID（当机器人可以搜索成员时），并记录映射；未解析的条目保持原样。

原生命令注意事项：

- 注册的命令与 OpenClaw 的聊天命令相匹配。
- 原生命令遵循与私信/服务器消息相同的白名单规则（`channels.discord.dm.allowFrom`、`channels.discord.guilds`，以及按频道设定的规则）。
- 斜杠命令可能仍会在 Discord 界面中对未列入白名单的用户可见；但在执行时，OpenClaw 会强制实施白名单，并回复“未授权”。

## 工具行动

代理可以使用 `discord` 调用以下行动：

- `react` / `reactions`（添加或列举反应）
- `sticker`、`poll`、`permissions`
- `readMessages`、`sendMessage`、`editMessage`、`deleteMessage`
- 读取/搜索/图钉工具的有效载荷包括归一化的 `timestampMs`（UTC纪元毫秒）和 `timestampUtc`，以及原始Discord `timestamp`。
- `threadCreate`、`threadList`、`threadReply`
- `pinMessage`、`unpinMessage`、`listPins`
- `searchMessages`、`memberInfo`、`roleInfo`、`roleAdd`、`roleRemove`、`emojiList`
- `channelInfo`、`channelList`、`voiceStatus`、`eventList`、`eventCreate`
- `timeout`、`kick`、`ban`

在注入的上下文中呈现 Discord 消息 ID（`[discord message id: …]` 和历史行），以便代理可以瞄准它们。
表情符号可以是 Unicode 表情符号（例如 `✅`）或自定义表情符号语法，如 `<:party_blob:1234567890>`。

## 安全与运营

- 将机器人令牌视为密码；在受监督的主机上优先使用 `DISCORD_BOT_TOKEN` 环境变量，或锁定配置文件权限。
- 仅授予机器人所需的权限（通常是读取/发送消息）。
- 如果机器人卡住或受到速率限制，在确认没有其他进程占用 Discord 会话后，重启网关（`openclaw gateway --force`）。
