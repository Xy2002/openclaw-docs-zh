---
summary: 'WhatsApp (web channel) integration: login, inbox, replies, media, and ops'
read_when:
  - Working on WhatsApp/web channel behavior or inbox routing
---
# WhatsApp（网页渠道）


状态：仅通过 Baileys 使用 WhatsApp Web。网关拥有会话。

## 快速设置（初学者）
1）如果可能，使用**独立的手机号码**（推荐）。
2）在 `~/.openclaw/openclaw.json` 中配置 WhatsApp。
3）运行 `openclaw channels login` 扫描二维码（已链接设备）。
4）启动网关。

最小配置：
```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"]
    }
  }
}
```

## 目标
- 在一个网关进程中支持多个 WhatsApp 账户（多账户）。
- 确定性路由：回复返回到 WhatsApp，不进行模型路由。
- 模型能够获得足够的上下文以理解引用回复。

## 配置写入
默认情况下，WhatsApp 允许在 `/config set|unset` 触发时写入配置更新（需要 `commands.config: true`）。

禁用方法：
```json5
{
  channels: { whatsapp: { configWrites: false } }
}
```

## 架构（各方职责）
- **网关**负责管理 Baileys 套接字和收件箱循环。
- **CLI / macOS 应用程序**与网关通信；不直接使用 Baileys。
- 发送消息时需要**活跃监听器**；否则发送会迅速失败。

## 获取手机号码（两种模式）

WhatsApp 需要真实的手机号码进行验证。VoIP 和虚拟号码通常会被阻止。在 WhatsApp 上运行 OpenClaw 有两种受支持的方式：

### 专用号码（推荐）
为 OpenClaw 使用**独立的手机号码**。用户体验最佳，路由清晰，不存在自聊怪癖。理想设置：**备用/旧 Android 手机 + eSIM**。将其保持在 Wi‑Fi 和电源连接状态，并通过 QR 码进行绑定。

**WhatsApp Business：** 您可以在同一设备上使用不同的号码运行 WhatsApp Business。这非常适合将您的个人 WhatsApp 与工作分开——安装 WhatsApp Business 并在那里注册 OpenClaw 号码。

**专用号码单用户白名单示例配置：**
```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"]
    }
  }
}
```

**配对模式（可选）：**
如果您希望使用配对而非白名单，请将 `channels.whatsapp.dmPolicy` 设置为 `pairing`。未知发件人会收到配对代码；批准方式：
`openclaw pairing approve whatsapp <code>`

### 个人号码（回退）
快速回退：在**您自己的号码**上运行 OpenClaw。通过给自己发送消息（WhatsApp“给自己发消息”）进行测试，以免向联系人发送垃圾信息。在设置和实验期间，您可能需要在主手机上查看验证码。**必须启用自聊模式。**

当向导询问您的个人 WhatsApp 号码时，请输入您将用于发送消息的电话号码（所有者/发送者），而不是助手号码。

**个人号码自聊模式示例配置：**
```json
{
  "whatsapp": {
    "selfChatMode": true,
    "dmPolicy": "allowlist",
    "allowFrom": ["+15551234567"]
  }
}
```

自聊回复在设置时默认为 `[{identity.name}]`（否则为 `[openclaw]`)，如果 `messages.responsePrefix` 未设置。显式设置以自定义或禁用前缀（使用 `""` 可移除前缀）。

### 获取号码提示
- **本地 eSIM**来自您所在国家的移动运营商（最可靠）
  - 奥地利：[hot.at](https://www.hot.at)
  - 英国：[giffgaff](https://www.giffgaff.com) — 免费 SIM，无合约
- **预付费 SIM**— 便宜，只需接收一条短信即可完成验证

**避免：** TextNow、Google Voice 和大多数“免费 SMS”服务——WhatsApp 对这些服务采取了严格的封锁措施。

**提示：** 号码只需接收一条验证短信。之后，WhatsApp Web 会话可通过 `creds.json` 持续存在。

## 为什么不用 Twilio？
- 早期的 OpenClaw 版本支持 Twilio 的 WhatsApp Business 集成。
- WhatsApp Business 号码并不适合个人助理。
- Meta 强制执行 24 小时回复窗口；如果您在过去 24 小时内未回复，该商业号码将无法发起新消息。
- 高流量或“聊天式”使用会触发严厉的封锁，因为商业账户并非设计用于发送数十条个人助理消息。
- 结果：交付不可靠且频繁被封锁，因此已取消对该功能的支持。

## 登录 + 凭据
- 登录命令：`openclaw channels login`（通过已链接设备扫描 QR 码）。
- 多账户登录：`openclaw channels login --account <id>`（`<id>` = `accountId`）。
- 默认账户（当 `--account` 未指定时）：如果有 `default`，则使用该账户；否则使用第一个已配置账户 ID（按排序顺序）。
- 凭据存储在 `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` 中。
- 备份副本位于 `creds.json.bak`（在损坏时恢复）。
- 旧版兼容性：较早版本的安装会将 Baileys 文件直接存储在 `~/.openclaw/credentials/` 中。
- 注销：`openclaw channels logout`（或 `--account <id>`）会删除 WhatsApp 认证状态（但保留共享的 `oauth.json`）。
- 注销后的套接字会引发错误，提示重新链接。

## 入站流程（私信 + 群组）
- WhatsApp 事件来自 `messages.upsert`（Baileys）。
- 收件箱监听器在关闭时会断开，以避免在测试/重启中累积事件处理程序。
- 状态/广播聊天会被忽略。
- 直接聊天使用 E.164 格式；群组使用群组 JID。
- **私信策略**：`channels.whatsapp.dmPolicy` 控制直接聊天的访问权限（默认：`pairing`）。
  - 配对：未知发件人会收到配对代码（通过 `openclaw pairing approve whatsapp <code>` 批准；代码 1 小时后失效）。
  - 开放：需要 `channels.whatsapp.allowFrom` 包括 `"*"`。
  - 您已链接的 WhatsApp 号码被视为隐含信任，因此自消息会跳过 `channels.whatsapp.dmPolicy` 和 `channels.whatsapp.allowFrom` 检查。

### 个人号码模式（回退）
如果您在**个人 WhatsApp 号码**上运行 OpenClaw，请启用 `channels.whatsapp.selfChatMode`（见上方示例）。

行为：
- 出站私信永远不会触发配对回复（防止向联系人发送垃圾信息）。
- 入站未知发件人仍遵循 `channels.whatsapp.dmPolicy`。
- 自聊模式（allowFrom 包括您的号码）可避免自动读取回执，并忽略提及 JID。
- 非自聊私信会发送读取回执。

## 读取回执
默认情况下，网关会在接受入站 WhatsApp 消息后立即将其标记为已读（显示蓝勾）。

全局禁用：
```json5
{
  channels: { whatsapp: { sendReadReceipts: false } }
}
```

按账户禁用：
```json5
{
  channels: {
    whatsapp: {
      accounts: {
        personal: { sendReadReceipts: false }
      }
    }
  }
}
```

注意：
- 自聊模式始终跳过读取回执。

## WhatsApp 常见问题解答：发送消息 + 配对

**当我绑定 WhatsApp 时，OpenClaw 会随机给联系人发送消息吗？**  
不会。默认的私信策略是**配对**，因此未知发件人只会收到配对代码，他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天消息，或者您明确触发的发送（代理/CLI）。

**WhatsApp 上的配对是如何工作的？**  
配对是针对未知发件人的私信门控：
- 来自新发件人的第一条私信会返回一个短代码（消息不会被处理）。
- 批准方式：`openclaw pairing approve whatsapp <code>`（通过 `openclaw pairing list whatsapp` 列表批准）。
- 代码 1 小时后失效；每个频道最多允许 3 个待处理请求。

**是否有多个人可以使用不同的 OpenClaw 实例在一个 WhatsApp 号码上？**  
是的，可以通过 `bindings` 将每个发件人路由到不同的代理（peer `kind: "dm"`，发件人 E.164 如 `+15551234567`)。回复仍然来自**同一个 WhatsApp 账户**，直接聊天会合并到每个代理的主要会话中，因此请使用**每人一个代理**。私信访问控制（`dmPolicy`/`allowFrom`）是针对 WhatsApp 账户的全局设置。请参阅 [多代理路由](/concepts/multi-agent)。

**为什么向导会要求我的电话号码？**  
向导使用它来设置您的**白名单/所有者**，以便您自己的私信被允许。它不用于自动发送。如果您在个人 WhatsApp 号码上运行，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

## 消息规范化（模型看到的内容）
- `Body` 是当前带有信封的消息正文。
- 引用回复上下文**始终附加**：
  ```
  [Replying to +1555 id:ABC123]
  <quoted text or <media:...>>
  [/Replying]
  ```
- 回复元数据也一并设置：
  - `ReplyToId` = stanzaId
  - `ReplyToBody` = 引用正文或媒体占位符
  - `ReplyToSender` = 已知时的 E.164
- 仅包含媒体的入站消息使用占位符：
  - `<media:image|video|audio|document|sticker>`

## 群组
- 群组映射到 `agent:<agentId>:whatsapp:group:<jid>` 会话。
- 群组政策：`channels.whatsapp.groupPolicy = open|disabled|allowlist`（默认 `allowlist`）。
- 激活模式：
  - `mention`（默认）：需要 @提及或正则表达式匹配。
  - `always`：始终触发。
- `/activation mention|always` 仅供所有者使用，必须作为独立消息发送。
- 所有者 = `channels.whatsapp.allowFrom`（或如未设置则为自 E.164）。
- **历史注入**（仅限待处理消息）：
  - 最近 *未处理* 的消息（默认 50 条）插入以下内容：
    `[Chat messages since your last reply - for context]`（会话中已有的消息不会再次注入）
  - 当前消息插入以下内容：
    `[Current message - respond to this]`
  - 发件人后缀附加：`[from: Name (+E164)]`
- 群组元数据缓存 5 分钟（主题 + 参与者）。

## 回复传递（线程化）
- WhatsApp Web 发送标准消息（当前网关不支持引用回复线程化）。
- 在此渠道上忽略回复标签。

## 确认反应（收到消息后自动反应）

WhatsApp 可以在收到传入消息后立即自动发送表情符号反应，在机器人生成回复之前提供即时反馈，让用户知道他们的消息已被接收。

**配置：**
```json
{
  "whatsapp": {
    "ackReaction": {
      "emoji": "👀",
      "direct": true,
      "group": "mentions"
    }
  }
}
```

**选项：**
- `emoji`（字符串）：用于确认的表情符号（例如，“👀”、“✅”、“📨”）。空值或未设置 = 功能禁用。
- `direct`（布尔值，默认为 `true`）：在直接/私信聊天中发送反应。
- `group`（字符串，默认为 `"mentions"`）：群组聊天行为：
  - `"always"`：对所有群组消息作出反应（即使没有 @提及）
  - `"mentions"`：仅在机器人被 @提及时才作出反应
  - `"never"`：从不在群组中作出反应

**按账户覆盖：**
```json
{
  "whatsapp": {
    "accounts": {
      "work": {
        "ackReaction": {
          "emoji": "✅",
          "direct": false,
          "group": "always"
        }
      }
    }
  }
}
```

**行为说明：**
- 反应在消息收到**立即**发送，早于打字指示器或机器人回复。
- 在具有 `requireMention: false`（激活：始终）的群组中，`group: "mentions"` 会对所有消息作出反应（而不仅仅是 @提及）。
- 一次性的反应失败会被记录，但不会阻止机器人回复。
- 参与者 JID 会自动包含在群组反应中。
- WhatsApp 会忽略 `messages.ackReaction`；请改用 `channels.whatsapp.ackReaction`。

## 代理工具（反应）
- 工具：`whatsapp`，带有 `react` 操作（`chatJid`、`messageId`、`emoji`，可选 `remove`）。
- 可选：`participant`（群组发件人）、`fromMe`（对自己消息作出反应）、`accountId`（多账户）。
- 反应移除语义：请参阅 [/tools/reactions](/tools/reactions)。
- 工具门控：`channels.whatsapp.actions.reactions`（默认：启用）。

## 限制
- 出站文本按 `channels.whatsapp.textChunkLimit` 分块（默认 4000 字）。
- 可选换行分块：将 `channels.whatsapp.chunkMode="newline"` 设置为在长度分块之前按空行（段落边界）进行分割。
- 入站媒体保存上限由 `channels.whatsapp.mediaMaxMb` 设定（默认 50 MB）。
- 出站媒体项目上限由 `agents.defaults.mediaMaxMb` 设定（默认 5 MB）。

## 出站发送（文本 + 媒体）
- 使用活跃的网页监听器；如果网关未运行，则会出错。
- 文本分块：每条消息最多 4k 字（可通过 `channels.whatsapp.textChunkLimit` 进行配置，可选 `channels.whatsapp.chunkMode`）。
- 媒体：
  - 支持图像/视频/音频/文档。
  - 音频以 PTT 形式发送；`audio/ogg` => `audio/ogg; codecs=opus`。
  - 仅在第一件媒体上添加说明。
  - 媒体获取支持 HTTP(S) 和本地路径。
  - 动画 GIF：WhatsApp 期望 MP4 格式，并使用 `gifPlayback: true` 实现内联循环。
    - CLI：`openclaw message send --media <mp4> --gif-playback`
    - 网关：`send` 参数包括 `gifPlayback: true`

## 语音笔记（PTT 音频）
WhatsApp 以**语音笔记**（PTT 气泡）的形式发送音频。
- 最佳效果：OGG/Opus。OpenClaw 会将 `audio/ogg` 重写为 `audio/ogg; codecs=opus`。
- `[[audio_as_voice]]` 对 WhatsApp 无效（音频已经以语音笔记形式发送）。

## 媒体限制 + 优化
- 默认出站上限：5 MB（每件媒体）。
- 覆盖：`agents.defaults.mediaMaxMb`。
- 图片在上限范围内会自动优化为 JPEG（调整大小 + 质量扫描）。
- 超大媒体会导致错误；媒体回复会回落为文本警告。

## 心跳
- **网关心跳**记录连接健康状况（`web.heartbeatSeconds`，默认 60 秒）。
- **代理心跳**可以按代理配置（`agents.list[].heartbeat`）或通过 `agents.defaults.heartbeat` 进行全局配置（当未设置代理特定条目时的回退）。
  - 使用配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）+ `HEARTBEAT_OK` 跳过行为。
  - 交付默认为最后使用的渠道（或配置的目标）。

## 重新连接行为
- 退避策略：`web.reconnect`：
  - `initialMs`、`maxMs`、`factor`、`jitter`、`maxAttempts`。
- 如果达到最大尝试次数，网页监控将停止（性能下降）。
- 注销 => 停止并要求重新链接。

## 配置快速地图
- `channels.whatsapp.dmPolicy`（私信策略：配对/白名单/开放/禁用）。
- `channels.whatsapp.selfChatMode`（同手机设置；机器人使用您的个人 WhatsApp 号码）。
- `channels.whatsapp.allowFrom`（私信白名单）。WhatsApp 使用 E.164 电话号码（无用户名）。
- `channels.whatsapp.mediaMaxMb`（入站媒体保存上限）。
- `channels.whatsapp.ackReaction`（收到消息时自动反应：`{emoji, direct, group}`）。
- `channels.whatsapp.accounts.<accountId>.*`（按账户设置 + 可选 `authDir`）。
- `channels.whatsapp.accounts.<accountId>.mediaMaxMb`（按账户入站媒体上限）。
- `channels.whatsapp.accounts.<accountId>.ackReaction`（按账户确认反应覆盖）。
- `channels.whatsapp.groupAllowFrom`（群组发件人白名单）。
- `channels.whatsapp.groupPolicy`（群组政策）。
- `channels.whatsapp.historyLimit` / `channels.whatsapp.accounts.<accountId>.historyLimit`（群组历史上下文；`0` 可禁用）。
- `channels.whatsapp.dmHistoryLimit`（以用户回合计的私信历史上限）。按用户覆盖：`channels.whatsapp.dms["<phone>"].historyLimit`。
- `channels.whatsapp.groups`（群组白名单 + 提及门控默认；使用 `"*"` 可允许所有人）。
- `channels.whatsapp.actions.reactions`（控制 WhatsApp 工具反应）。
- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.groupChat.historyLimit`。
- `channels.whatsapp.messagePrefix`（入站前缀；按账户：`channels.whatsapp.accounts.<accountId>.messagePrefix`；已弃用：`messages.messagePrefix`）。
- `messages.responsePrefix`（出站前缀）。
- `agents.defaults.mediaMaxMb`。
- `agents.defaults.heartbeat.every`。
- `agents.defaults.heartbeat.model`（可选覆盖）。
- `agents.defaults.heartbeat.target`。
- `agents.defaults.heartbeat.to`。
- `agents.defaults.heartbeat.session`。
- `agents.list[].heartbeat.*`（按代理覆盖）。
- `session.*`（范围、闲置、存储、mainKey）。
- `web.enabled`（当为假时禁用通道启动）。
- `web.heartbeatSeconds`。
- `web.reconnect.*`。

## 日志 + 故障排除
- 子系统：`whatsapp/inbound`、`whatsapp/outbound`、`web-heartbeat`、`web-reconnect`。
- 日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（可配置）。
- 故障排除指南：[网关故障排除](/gateway/troubleshooting)。

## 故障排除（快速）

**未链接 / 需要 QR 登录**
- 症状：`channels status` 显示 `linked: false` 或警告“未链接”。
- 解决方法：在网关主机上运行 `openclaw channels login`，并扫描 QR 码（WhatsApp → 设置 → 已链接设备）。

**已链接但断开 / 重新连接循环**
- 症状：`channels status` 显示 `running, disconnected` 或警告“已链接但断开”。
- 解决方法：`openclaw doctor`（或重启网关）。如果问题仍然存在，通过 `channels login` 重新链接，并检查 `openclaw logs --follow`。

**Bun 运行时**
- **不推荐使用 Bun**。WhatsApp（Baileys）和 Telegram 在 Bun 上表现不稳定。
  请使用 **Node** 运行网关。（请参阅入门运行时注意事项。）
