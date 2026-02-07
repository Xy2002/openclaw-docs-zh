---
summary: 'LINE Messaging API plugin setup, config, and usage'
read_when:
  - You want to connect OpenClaw to LINE
  - You need LINE webhook + credential setup
  - You want LINE-specific message options
---
# 行（插件）

LINE 通过 LINE 消息 API 连接到 OpenClaw。该插件在网关上作为 Webhook 接收器运行，并使用您的通道访问令牌和通道密钥进行身份验证。

状态：通过插件支持。支持直接消息、群聊、媒体、位置、Flex消息、模板消息和快速回复。不支持反应和线程。

## 需要安装插件

安装 LINE 插件：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 Git 仓库运行时）：

```bash
openclaw plugins install ./extensions/line
```

## 设置

1) 创建一个 LINE 开发者账户并打开控制台：
   https://developers.line.biz/console/
2) 创建（或选择）一个提供商，并添加一个 **Messaging API** 通道。
3) 从通道设置中复制 **通道访问令牌** 和 **通道密钥**。
4) 在 Messaging API 设置中启用 **使用 webhook**。
5) 将 webhook URL 设置为您的网关端点（需使用 HTTPS）：

```
https://gateway-host/line/webhook
```

网关会响应 LINE 的 Webhook 验证（GET）和入站事件（POST）。如果您需要自定义路径，请设置 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

## 配置

最小配置：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing"
    }
  }
}
```

环境变量（仅适用于默认账户）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

令牌/密钥文件：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt"
    }
  }
}
```

多账户配置：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing"
        }
      }
    }
  }
}
```

## 访问控制

直接消息默认启用配对。未知发件人会收到一个配对代码，在获得批准之前其消息会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

白名单和策略：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: 用于 DM 的已批准 LINE 用户 ID 列表
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 用于群组的已批准 LINE 用户 ID 列表
- 每个群组的覆盖设置： `channels.line.groups.<groupId>.allowFrom`

LINE ID 区分大小写。有效 ID 的格式如下：

- 用户： `U` + 32个十六进制字符
- 群组： `C` + 32个十六进制字符
- 房间： `R` + 32个十六进制字符

## 消息行为

- 文本在5000字符处分块。
- Markdown格式将被剥离；在可能的情况下，代码块和表格会被转换为Flex卡。
- 流式响应会被缓冲；在代理处理期间，LINE会以加载动画接收完整的数据块。
- 媒体下载受`channels.line.mediaMaxMb`限制（默认为10）。

## 渠道数据（富消息）

使用 `channelData.line` 发送快速回复、位置、Flex 卡或模板消息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125
      },
      flexMessage: {
        altText: "Status card",
        contents: { /* Flex payload */ }
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no"
      }
    }
  }
}
```

LINE 插件还提供一个用于 Flex 消息预设的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

故障排除

- **Webhook 验证失败：** 确保 webhook URL 使用 HTTPS，且 `channelSecret` 与 LINE 控制台一致。
- **无入站事件：** 确认 webhook 路径与 `channels.line.webhookPath` 匹配，并确保 LINE 可以访问网关。
- **媒体下载错误：** 如果媒体超过默认限制，请提高 `channels.line.mediaMaxMb`。
