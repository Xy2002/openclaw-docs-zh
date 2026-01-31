---
summary: 'Tlon/Urbit support status, capabilities, and configuration'
read_when:
  - Working on Tlon/Urbit channel features
---
# Tlon（插件）

Tlon 是一款基于 Urbit 构建的去中心化即时通讯工具。OpenClaw 可以连接到您的 Urbit 船，并能回复私信和群聊消息。默认情况下，群组回复需要通过 @ 提及来触发，并可通过白名单进一步限制。

状态：通过插件支持。支持私信、群组提及、线程回复以及仅文本媒体回退（URL 附加到标题）。不支持表情反应、投票和原生媒体上传。

## 需要插件

Tlon 作为插件提供，未与核心安装捆绑在一起。

通过 CLI（npm 注册表）安装：

```bash
openclaw plugins install @openclaw/tlon
```

本地检出（从 Git 仓库运行时）：

```bash
openclaw plugins install ./extensions/tlon
```

详情：[插件](/plugin)

## 设置

1) 安装 Tlon 插件。
2) 获取您的船 URL 和登录代码。
3) 配置 `channels.tlon`。
4) 重启网关。
5) 向机器人发送私信，或在群组频道中提及它。

最小配置（单账户）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup"
    }
  }
}
```

## 群组频道

自动发现默认启用。您也可以手动固定频道：

```json5
{
  channels: {
    tlon: {
      groupChannels: [
        "chat/~host-ship/general",
        "chat/~host-ship/support"
      ]
    }
  }
}
```

禁用自动发现：

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false
    }
  }
}
```

## 访问控制

私信白名单（空 = 允许所有人）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"]
    }
  }
}
```

群组授权（默认受限）：

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"]
          },
          "chat/~host-ship/announcements": {
            mode: "open"
          }
        }
      }
    }
  }
}
```

## 投递目标（CLI/cron）

将这些与 `openclaw message send` 或 cron 投递一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 注意事项

- 群组回复需要提及（例如 `~your-bot-ship`）才能作出响应。
- 线程回复：如果传入消息位于线程中，OpenClaw 将在线程中回复。
- 媒体：`sendMedia` 回退为文本 + URL（不支持原生上传）。
