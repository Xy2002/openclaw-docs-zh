---
summary: 'Nextcloud Talk support status, capabilities, and configuration'
read_when:
  - Working on Nextcloud Talk channel features
---
__HEADING_0__Nextcloud Talk（插件）

状态：通过插件（Webhook 机器人）支持。支持直接消息、聊天室、表情反应和 Markdown 消息。

## 需要插件

Nextcloud Talk 作为插件提供，未与核心安装捆绑在一起。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

本地检出（从 Git 仓库运行时）：

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

如果在配置或引导过程中选择 Nextcloud Talk 并检测到 Git 检出，OpenClaw 将自动提供本地安装路径。

详情：[插件](/plugin)

快速设置（初学者）

1) 安装 Nextcloud Talk 插件。
2) 在您的 Nextcloud 服务器上创建一个机器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3) 在目标聊天室设置中启用该机器人。
4) 配置 OpenClaw：

- 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅适用于默认账户）

5) 重启网关（或完成引导）。

最小配置：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing"
    }
  }
}
```

## 注意事项

- 机器人无法主动发起私信。用户必须先向机器人发送消息。
- Webhook URL 必须可被网关访问；如果位于代理后，请设置 `webhookPublicUrl`。
- 机器人 API 不支持直接上传媒体；媒体必须以 URL 的形式发送。
- Webhook 负载无法区分私信和聊天室；设置 `apiUser` + `apiPassword` 以启用聊天室类型查询（否则私信将被视为聊天室）。

## 访问控制（DMs）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发件人会收到配对码。
- 批准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开 DM：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。

## 聊天室（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（需提及才能加入）。
- 使用 `channels.nextcloud-talk.rooms` 将聊天室列入白名单：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true }
      }
    }
  }
}
```

- 若要不允许多个聊天室，请将白名单留空或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能支持情况

| 功能 | 状态 |
|---------|--------|
| 直接消息 | 支持 |
| 聊天室 | 支持 |
| 帖子线程 | 不支持 |
| 媒体 | 仅支持 URL |
| 表情反应 | 支持 |
| 原生命令 | 不支持 |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用或禁用频道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：机器人共享密钥。
- `channels.nextcloud-talk.botSecretFile`：密钥文件路径。
- `channels.nextcloud-talk.apiUser`：用于聊天室查询的 API 用户（用于检测 DM）。
- `channels.nextcloud-talk.apiPassword`：用于聊天室查询的 API/应用密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：Webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook 主机（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook 路径（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：DM 白名单（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组白名单（用户 ID）。
- `channels.nextcloud-talk.rooms`：每个聊天室的设置和白名单。
- `channels.nextcloud-talk.historyLimit`：群组历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：DM 历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dms`：针对单个 DM 的覆盖设置（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符数）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，在按长度分块之前按空行（段落边界）进行拆分。
- `channels.nextcloud-talk.blockStreaming`：为此频道禁用块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。
