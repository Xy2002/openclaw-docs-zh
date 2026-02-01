---
summary: 'Signal support via signal-cli (JSON-RPC + SSE), setup, and number model'
read_when:
  - Setting up Signal support
  - Debugging Signal send/receive
---
# Signal (signal-cli)


状态：外部 CLI 集成。网关通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

## 快速设置（初学者）
1) 为机器人使用一个**独立的 Signal 号码**（推荐）。
2) 安装 `signal-cli`（需要 Java）。
3) 链接机器人设备并启动守护进程：
   - `signal-cli link -n "OpenClaw"`
4) 配置 OpenClaw 并启动网关。

最小配置：
```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"]
    }
  }
}
```

## 是什么
- 通过 `signal-cli` 提供 Signal 通道（非嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- 私信共享代理的主要会话；群组是隔离的 (`agent:<agentId>:signal:group:<groupId>`)。

## 配置写入
默认情况下，Signal 被允许在 `/config set|unset` 触发时写入配置更新（需要 `commands.config: true`）。

可通过以下方式禁用：
```json5
{
  channels: { signal: { configWrites: false } }
}
```

## 号码模型（重要）
- 网关连接到一个**Signal 设备**（即 `signal-cli` 账号）。
- 如果你在**自己的个人 Signal 账号**上运行机器人，它会忽略你自己的消息（防止循环）。
- 若要实现“我给机器人发消息，它回复”，请使用一个**独立的机器人号码**。

## 设置（快速路径）
1) 安装 `signal-cli`（需要 Java）。
2) 链接一个机器人账号：
   - `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描二维码。
3) 配置 Signal 并启动网关。

示例：
```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"]
    }
  }
}
```

多账号支持：使用 `channels.signal.accounts` 结合每账号配置，并可选使用 `name`。共享模式详见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)。

## 外部守护进程模式（httpUrl）
如果你想自行管理 `signal-cli`（例如 JVM 冷启动较慢、容器初始化或共享 CPU），可以单独运行守护进程，并让 OpenClaw 指向该守护进程：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false
    }
  }
}
```

这将跳过 OpenClaw 内的自动启动和启动等待。对于自动启动时的缓慢启动，可设置 `channels.signal.startupTimeoutMs`。

## 访问控制（私信 + 群组）
私信：
- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发件人会收到配对码；消息在批准前会被忽略（配对码 1 小时后失效）。
- 可通过以下方式批准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配着是 Signal 私信的默认令牌交换方式。详情参见 [Pairing](/start/pairing)。
- 仅包含 UUID 的发件人（来自 `sourceUuid`）会以 `uuid:<id>` 的形式存储在 `channels.signal.allowFrom` 中。

群组：
- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当 `allowlist` 设置时， `channels.signal.groupAllowFrom` 控制谁可以在群组中触发。

## 工作原理（行为）
- `signal-cli` 以守护进程形式运行；网关通过 SSE 读取事件。
- 入站消息被归一化为共享通道信封。
- 回复始终路由回同一号码或群组。

## 媒体 + 限制
- 出站文本按 `channels.signal.textChunkLimit` 分块（默认 4000 字符）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"` 以在长度分块之前按空行（段落边界）分割。
- 支持附件（从 `signal-cli` 获取 base64 编码）。
- 默认媒体上限： `channels.signal.mediaMaxMb`（默认 8 MB）。
- 使用 `channels.signal.ignoreAttachments` 可跳过下载媒体。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），退回到 `messages.groupChat.historyLimit`。设置 `0` 可禁用（默认 50 条）。

## 键入指示 + 已读回执
- **键入指示**：OpenClaw 通过 `signal-cli sendTyping` 发送键入信号，并在回复进行时持续刷新。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为真时，OpenClaw 会转发允许的私信的已读回执。
- Signal-cli 不公开群组的已读回执。

## 反应（消息工具）
- 使用 `message action=react` 结合 `channel=signal`。
- 目标：发件人的 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可）。
- `messageId` 是你要对其作出反应的消息的 Signal 时间戳。
- 群组反应需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：
```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：
- `channels.signal.actions.reactions`：启用/禁用反应操作（默认为真）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 禁用代理反应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 启用代理反应，并设置指导级别。
- 每账号覆盖： `channels.signal.accounts.<id>.actions.reactions`、 `channels.signal.accounts.<id>.reactionLevel`。

## 投递目标（CLI/cron）
- 私信： `signal:+15551234567`（或纯 E.164）。
- UUID 私信： `uuid:<id>`（或裸 UUID）。
- 群组： `signal:group:<groupId>`。
- 用户名： `username:<name>`（如果您的 Signal 货号支持）。

## 配置参考（Signal）
完整配置： [Configuration](/gateway/configuration)

提供商选项：
- `channels.signal.enabled`：启用/禁用通道启动。
- `channels.signal.account`：机器人账号的 E.164。
- `channels.signal.cliPath`：指向 `signal-cli` 的路径。
- `channels.signal.httpUrl`：完整的守护进程 URL（覆盖主机/端口）。
- `channels.signal.httpHost`、 `channels.signal.httpPort`：守护进程绑定地址（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动启动守护进程（若未设置 `httpUrl`，默认为真）。
- `channels.signal.startupTimeoutMs`：启动等待超时时间（毫秒；上限 120000）。
- `channels.signal.receiveMode`： `on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的故事。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`： `pairing | allowlist | open | disabled`（默认：配对）。
- `channels.signal.allowFrom`：私信白名单（E.164 或 `uuid:<id>`）。 `open` 需要 `"*"`。Signal 没有用户名；使用电话/UUID ID。
- `channels.signal.groupPolicy`： `open | allowlist | disabled`（默认：白名单）。
- `channels.signal.groupAllowFrom`：群组发件人白名单。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 表示禁用）。
- `channels.signal.dmHistoryLimit`：私信历史限制（用户回合数）。每用户覆盖： `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符）。
- `channels.signal.chunkMode`： `length`（默认）或 `newline`，用于在长度分块前按空行（段落边界）分割。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：
- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。
