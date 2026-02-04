---
summary: 'iMessage support via imsg (JSON-RPC over stdio), setup, and chat_id routing'
read_when:
  - Setting up iMessage support
  - Debugging iMessage send/receive
---
# iMessage (imsg)

状态：外部 CLI 集成。网关会启动 `imsg rpc`（通过标准输入/输出的 JSON-RPC）。

快速设置（初学者）

1) 确保此 Mac 上已登录“信息”。
2) 安装 `imsg`：

- `brew install steipete/tap/imsg`

3) 使用 `channels.imessage.cliPath` 和 `channels.imessage.dbPath` 配置 OpenClaw。
4) 启动网关，并批准任何 macOS 提示（自动化权限和全盘访问权限）。

最小配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db"
    }
  }
}
```

## 什么是它

- 基于 macOS 上的 `imsg` 的 iMessage 渠道。
- 确定性路由：回复始终返回到 iMessage。
- 私信共享代理的主要会话；群组是隔离的 (`agent:<agentId>:imessage:group:<chat_id>`)。
- 如果多参与者线程以 `is_group=false` 形式到达，您仍然可以通过使用 `channels.imessage.groups` 来将其隔离 (`chat_id`)（见下文“类似群组的线程”）。

## 配置写入

默认情况下，iMessage 被允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方法：

```json5
{
  channels: { imessage: { configWrites: false } }
}
```

## 需求

- 已登录“信息”的 macOS。
- OpenClaw 具有全盘访问权限 + `imsg`（“信息”数据库访问）。
- 发送时需具备自动化权限。
- `channels.imessage.cliPath` 可指向任何代理标准输入/输出的命令（例如，通过 SSH 连接到另一台 Mac 并运行 `imsg rpc` 的包装脚本）。

## 设置（快速路径）

1) 确保此Mac已登录“信息”。
2) 配置iMessage并启动网关。

### 专用机器人 macOS 用户（用于隔离身份）

如果您希望机器人使用**独立的 iMessage 身份**发送消息（并保持您个人“信息”应用的整洁），请使用专用的 Apple ID 和专用的 macOS 用户账户。

1) 创建专用 Apple ID（示例：`my-cool-bot@icloud.com`）。

- 苹果可能需要电话号码进行验证或双重认证。

2) 创建 macOS 用户（示例：`openclawhome`），并登录该用户。
3) 在该 macOS 用户中打开“信息”，并使用机器人 Apple ID 登录 iMessage。
4) 启用远程登录（系统设置 → 通用 → 共享 → 远程登录）。
5) 安装 `imsg`：

- `brew install steipete/tap/imsg`

6) 配置 SSH，使 `ssh <bot-macos-user>@localhost true` 无需密码即可正常运行。
7) 将 `channels.imessage.accounts.bot.cliPath` 指向一个 SSH 包装脚本，该脚本以机器人用户身份运行，并执行 `imsg`。

首次运行注意事项：在*机器人 macOS 用户*中，发送/接收可能需要通过 GUI 进行批准（自动化权限 + 全盘访问权限）。如果 `imsg rpc` 似乎卡住或退出，请以该用户身份登录（屏幕共享有助于操作），运行一次性 `imsg chats --limit 1` / `imsg send ...`，批准相关提示，然后重试。

示例包装脚本（`chmod +x`）。将 `<bot-macos-user>` 替换为您的实际 macOS 用户名：

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run an interactive SSH once first to accept host keys:
#   ssh <bot-macos-user>@localhost true
exec /usr/bin/ssh -o BatchMode=yes -o ConnectTimeout=5 -T <bot-macos-user>@localhost \
  "/usr/local/bin/imsg" "$@"
```

示例配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      accounts: {
        bot: {
          name: "Bot",
          enabled: true,
          cliPath: "/path/to/imsg-bot",
          dbPath: "/Users/<bot-macos-user>/Library/Messages/chat.db"
        }
      }
    }
  }
}
```

对于单账户设置，使用扁平选项（`channels.imessage.cliPath`, `channels.imessage.dbPath`）而不是 `accounts` 映射。

### 这是远程/SSH变体（可选）

如果您希望在另一台 Mac 上使用 iMessage，请将 `channels.imessage.cliPath` 设置为一个包装脚本，该脚本通过 SSH 在远程 macOS 主机上运行 `imsg`。OpenClaw 只需标准输入和输出即可正常运行。

示例包装脚本：

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

**远程附件：** 当 `cliPath` 通过 SSH 连接到远程主机时，“信息”数据库中的附件路径会引用远程机器上的文件。通过设置 `channels.imessage.remoteHost`，OpenClaw 可以通过 SCP 自动获取这些文件：

```json5
{
  channels: {
    imessage: {
      cliPath: "~/imsg-ssh",                     // SSH wrapper to remote Mac
      remoteHost: "user@gateway-host",           // for SCP file transfer
      includeAttachments: true
    }
  }
}
```

如果未设置 `remoteHost`，OpenClaw 会尝试通过解析包装脚本中的 SSH 命令来自动检测它。为确保可靠性，建议进行显式配置。

#### 通过 Tailscale 远程访问 Mac（示例）

如果网关运行在 Linux 主机或虚拟机上，而 iMessage 必须在 Mac 上运行，那么 Tailscale 就是最简单的桥梁：网关通过 Tailscale 与 Mac 通信，通过 SSH 运行 `imsg`，并通过 SCP 将附件传回。

架构：

```
┌──────────────────────────────┐          SSH (imsg rpc)          ┌──────────────────────────┐
│ Gateway host (Linux/VM)      │──────────────────────────────────▶│ Mac with Messages + imsg │
│ - openclaw gateway           │          SCP (attachments)        │ - Messages signed in     │
│ - channels.imessage.cliPath  │◀──────────────────────────────────│ - Remote Login enabled   │
└──────────────────────────────┘                                   └──────────────────────────┘
              ▲
              │ Tailscale tailnet (hostname or 100.x.y.z)
              ▼
        user@gateway-host
```

具体配置示例（Tailscale 主机名）：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db"
    }
  }
}
```

示例包装脚本（`~/.openclaw/scripts/imsg-ssh`）：

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

注意事项：

- 确保 Mac 已登录“信息”，并已启用远程登录。
- 使用 SSH 密钥，使 `ssh bot@mac-mini.tailnet-1234.ts.net` 无需提示即可正常工作。
- `remoteHost` 应与 SSH 目标匹配，以便 SCP 能够获取附件。

多账户支持：使用 `channels.imessage.accounts` 结合每账户配置和可选 `name`。共享模式请参见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)。请勿提交 `~/.openclaw/openclaw.json`（其中通常包含令牌）。

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.imessage.dmPolicy = "pairing"`。
- 未知发件人会收到配对码；消息会被忽略，直到获得批准（代码 1 小时后失效）。
- 批准方式：
  - `openclaw pairing list imessage`
  - `openclaw pairing approve imessage <CODE>`
- 配对是 iMessage 私信的默认令牌交换方式。详情请参见 [配对](/start/pairing)

群组：

- `channels.imessage.groupPolicy = open | allowlist | disabled`。
- `channels.imessage.groupAllowFrom` 控制当 `allowlist` 设置时谁可以在群组中触发。
- 提及限制使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）是因为 iMessage 没有原生提及元数据。
- 多代理覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每代理模式。

## 工作原理（行为）

- `imsg` 流式传输消息事件；网关将其归一化为共享通道信封。
- 回复始终路由回相同的聊天 ID或句柄。

## 类似群组的线程（`is_group=false`）

某些 iMessage 线程可能有多个参与者，但仍以 `is_group=false` 形式到达，这取决于“信息”如何存储聊天标识符。

如果您在 `channels.imessage.groups` 下显式配置了 `chat_id`，OpenClaw 会将该线程视为“群组”，用于：

- 会话隔离（独立的 `agent:<agentId>:imessage:group:<chat_id>` 会话密钥）
- 群组白名单/提及限制行为

示例：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "42": { "requireMention": false }
      }
    }
  }
}
```

当您希望为特定线程提供隔离的个性或模型时，这非常有用（参见 [多代理路由](/concepts/multi-agent))。有关文件系统隔离，请参见 [沙箱化](/gateway/sandboxing)。

## 媒体 + 限制

- 可选附件摄入通过 `channels.imessage.includeAttachments`。
- 媒体上限通过 `channels.imessage.mediaMaxMb`。

## 限制

- 出站文本被分块为 `channels.imessage.textChunkLimit`（默认 4000）。
- 可选换行分块：设置 `channels.imessage.chunkMode="newline"` 以在长度分块之前按空行（段落边界）分割。
- 媒体上传受 `channels.imessage.mediaMaxMb` 限制（默认 16）。

## 地址 / 投递目标

优先使用 `chat_id` 以实现稳定的路由：

- `chat_id:123`（首选）
- `chat_guid:...`
- `chat_identifier:...`
- 直接句柄：`imessage:+1555` / `sms:+1555` / `user@example.com`

列出聊天：

```
imsg chats --limit 20
```

## 配置参考（iMessage）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.imessage.enabled`：启用或禁用渠道启动。
- `channels.imessage.cliPath`：指向 `imsg` 的路径。
- `channels.imessage.dbPath`：“信息”数据库路径。
- `channels.imessage.remoteHost`：当 `cliPath` 指向远程 Mac 时，用于 SCP 附件传输的 SSH 主机（例如，`user@gateway-host`）。如果未设置，则自动从 SSH 包装脚本中检测。
- `channels.imessage.service`：`imessage | sms | auto`。
- `channels.imessage.region`：短信区域。
- `channels.imessage.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配对）。
- `channels.imessage.allowFrom`：私信白名单（句柄、电子邮件、E.164 号码或 `chat_id:*`）。`open` 需要 `"*"`。iMessage 没有用户名；使用句柄或聊天目标。
- `channels.imessage.groupPolicy`：`open | allowlist | disabled`（默认：白名单）。
- `channels.imessage.groupAllowFrom`：群组发件人白名单。
- `channels.imessage.historyLimit` / `channels.imessage.accounts.*.historyLimit`：作为上下文包含的最大群组消息数（0 表示禁用）。
- `channels.imessage.dmHistoryLimit`：以用户回合计的私信历史限制。每用户覆盖：`channels.imessage.dms["<handle>"].historyLimit`。
- `channels.imessage.groups`：每群组默认值 + 白名单（使用 `"*"` 获取全局默认值）。
- `channels.imessage.includeAttachments`：将附件纳入上下文。
- `channels.imessage.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.imessage.textChunkLimit`：出站分块大小（字符）。
- `channels.imessage.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）分割。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。
