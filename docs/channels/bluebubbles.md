---
summary: >-
  iMessage via BlueBubbles macOS server (REST send/receive, typing, reactions,
  pairing, advanced actions).
read_when:
  - Setting up BlueBubbles channel
  - Troubleshooting webhook pairing
  - Configuring iMessage on macOS
---
# BlueBubbles（macOS REST）

状态：捆绑插件，通过 HTTP 与 BlueBubbles macOS 服务器通信。由于其 API 更丰富且设置更简单，相比旧版 imsg 通道，**推荐用于 iMessage 集成**。

## 概述
- 在 macOS 上通过 BlueBubbles 辅助应用程序运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/测试版本：macOS Sequoia (15)。macOS Tahoe (26) 也可使用；但在 Tahoe 上，编辑功能目前存在缺陷，群组图标更新可能显示成功但无法同步。
- OpenClaw 通过其 REST API 与其通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 入站消息通过 Webhook 到达；出站回复、输入指示器、已读回执和 Tapback 均通过 REST 调用发送。
- 附件和贴纸作为入站媒体被摄取，并在可能的情况下呈现给代理。
- 配对/白名单的工作方式与其他通道相同（`/start/pairing` 等），使用 `channels.bluebubbles.allowFrom` 和配对码。
- 反应以系统事件的形式呈现，就像 Slack/Telegram 一样，因此代理可以在回复之前“提及”这些反应。
- 高级功能：编辑、撤回、回复线程化、消息效果、群组管理。

## 快速入门
1. 在您的 Mac 上安装 BlueBubbles 服务器（请参阅 [bluebubbles.app/install](https://bluebubbles.app/install) 中的说明）。
2. 在 BlueBubbles 配置中，启用 Web API 并设置密码。
3. 运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：
   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook"
       }
     }
   }
   ```
4. 将 BlueBubbles Webhook 指向您的网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. 启动网关；它将注册 Webhook 处理程序并开始配对。

## 引导流程
BlueBubbles 可在交互式设置向导中找到：
```
openclaw onboard
```

向导会提示以下内容：
- **服务器 URL**（必填）：BlueBubbles 服务器地址（例如，`http://192.168.1.100:1234`）
- **密码**（必填）：来自 BlueBubbles 服务器设置的 API 密码
- **Webhook 路径**（可选）：默认为 `/bluebubbles-webhook`
- **DM 政策**：配对、白名单、开放或禁用
- **白名单**：电话号码、电子邮件或聊天目标

您也可以通过 CLI 添加 BlueBubbles：
```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（DM + 群组）
DM：
- 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发件人会收到配对码；消息在批准前会被忽略（配着码在一小时内过期）。
- 可通过以下方式批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情：[Pairing](/start/pairing)

群组：
- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- 当 `allowlist` 设置时，`channels.bluebubbles.groupAllowFrom` 控制谁可以在群组中触发。

### 提及门控（群组）
BlueBubbles 支持群聊的提及门控，行为与 iMessage/WhatsApp 一致：
- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`) 检测提及。
- 当 `requireMention` 为某个群组启用时，代理仅在被提及时才响应。
- 来自授权发件人的控制命令会绕过提及门控。

每群组配置：
```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },  // default for all groups
        "iMessage;-;chat123": { requireMention: false }  // override for specific group
      }
    }
  }
}
```

### 命令门控
- 控制命令（例如，`/config`、`/model`)需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 授权发件人即使在群组中未被提及，也可以运行控制命令。

## 输入指示器 + 已读回执
- **输入指示器**：在生成回复之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **输入指示器**：OpenClaw 发送输入开始事件；BlueBubbles 在发送或超时时自动清除输入状态（通过 DELETE 手动停止不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false  // disable read receipts
    }
  }
}
```

## 高级操作
当在配置中启用时，BlueBubbles 支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true,       // tapbacks (default: true)
        edit: true,            // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true,          // unsend messages (macOS 13+)
        reply: true,           // reply threading by message GUID
        sendWithEffect: true,  // message effects (slam, loud, etc.)
        renameGroup: true,     // rename group chats
        setGroupIcon: true,    // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true,  // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true,      // leave group chats
        sendAttachment: true   // send attachments/media
      }
    }
  }
}
```

可用操作：
- **react**：添加或移除 Tapback 反应（`messageId`、`emoji`、`remove`)
- **edit**：编辑已发送的消息（`messageId`、`text`)
- **unsend**：撤回消息（`messageId`)
- **reply**：回复特定消息（`messageId`、`text`、`to`)
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`)
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`)
- **setGroupIcon**：设置群聊的图标/照片（`chatGuid`、`media`）——在 macOS 26 Tahoe 上表现不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：将某人添加到群组（`chatGuid`、`address`)
- **removeParticipant**：从群组中移除某人（`chatGuid`、`address`)
- **leaveGroup**：退出群聊（`chatGuid`)
- **sendAttachment**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`)
  - 语音备忘录：设置 `asVoice: true`，使用 **MP3** 或 **CAF** 音频作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。

### 消息 ID（短 ID vs 全 ID）
为了节省 token，OpenClaw 可能会呈现*短*消息 ID（例如，`1`、`2`）。
- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 存储在内存中；在重启或缓存淘汰时可能会失效。
- 操作接受短 ID 或全 ID，但如果短 ID 不再可用，则会报错。

对于持久自动化和存储，请使用全 ID：
- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：`MessageSidFull` / `ReplyToIdFull` 在入站负载中

有关模板变量的详细信息，请参阅 [Configuration](/gateway/configuration)。

## 分块流式传输
控制回复是以单条消息发送还是分块流式传输：
```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true  // enable block streaming (default behavior)
    }
  }
}
```

## 媒体 + 限制
- 入站附件会下载并存储在媒体缓存中。
- 媒体上限通过 `channels.bluebubbles.mediaMaxMb` 设置（默认：8 MB）。
- 出站文本按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 字符）。

## 配置参考
完整配置：[Configuration](/gateway/configuration)

提供商选项：
- `channels.bluebubbles.enabled`：启用或禁用该通道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 的基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：DM 白名单（句柄、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发件人白名单。
- `channels.bluebubbles.groups`：每群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`true`）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小（以字符为单位，默认：4000）。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时才会分块；`newline` 在长度分块之前先按空行（段落边界）进行分块。
- `channels.bluebubbles.mediaMaxMb`：入站媒体上限（以 MB 为单位，默认：8）。
- `channels.bluebubbles.historyLimit`：上下文中的最大群组消息数（0 表示禁用）。
- `channels.bluebubbles.dmHistoryLimit`：DM 历史记录限制。
- `channels.bluebubbles.actions`：启用或禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：
- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 地址 / 投递目标
建议使用 `chat_guid` 以实现稳定的路由：
- `chat_guid:iMessage;-;+15555550123`（推荐用于群组）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果直接句柄没有现有的 DM 聊天，OpenClaw 将通过 `POST /api/v1/chat/new` 创建一个。这要求 BlueBubbles 私有 API 已启用。

## 安全性
- Webhook 请求通过比较 `guid`/`password` 查询参数或标头与 `channels.bluebubbles.password` 来进行身份验证。来自 `localhost` 的请求也被接受。
- 请保密 API 密码和 Webhook 端点（将其视为凭据）。
- 本地主机信任意味着同一主机上的反向代理可能会无意中绕过密码。如果您代理网关，请在代理处要求身份验证，并配置 `gateway.trustedProxies`。有关更多信息，请参阅 [Gateway security](/gateway/security#reverse-proxy-configuration)。
- 如果将 BlueBubbles 服务器暴露在 LAN 之外，请启用 HTTPS 并在服务器上配置防火墙规则。

## 故障排除
- 如果输入/已读事件停止工作，请检查 BlueBubbles Webhook 日志，并确保网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码在一小时内过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 反应需要 BlueBubbles 私有 API（`POST /api/v1/message/react`）；请确保服务器版本公开了该 API。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于私有 API 的变化，编辑功能目前存在缺陷。
- 在 macOS 26（Tahoe）上，群组图标更新可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知存在问题的行动。如果在 macOS 26（Tahoe）上编辑功能仍然显示，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用它。
- 如需状态/健康信息，请使用 `openclaw status --all` 或 `openclaw status --deep`。

有关通用通道工作流程的参考，请参阅 [Channels](/channels) 和 [Plugins](/plugins) 指南。
