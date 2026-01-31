---
summary: 'Pairing overview: approve who can DM you + which nodes can join'
read_when:
  - Setting up DM access control
  - Pairing a new iOS/Android node
  - Reviewing OpenClaw security posture
---
# 配对

“配对”是 OpenClaw 的明确 **所有者批准** 步骤。
它在两个地方使用：

1) **DM 配对**（允许与机器人对话的人员）
2) **节点配对**（允许加入网关网络的设备/节点）

安全上下文：[安全](/gateway/security)

## 1) DM 配对（入站聊天访问权限）

当频道配置了 DM 策略 `pairing` 时，未知发件人会收到一个短代码，并且在您批准之前，他们的消息 **不会被处理**。

默认 DM 策略记录在：[安全](/gateway/security)

配对代码：
- 8 个字符，大写，不含易混淆字符 (`0O1I`)。
- **1 小时后过期**。只有在创建新请求时（大致每小时每位发件人一次），机器人才会发送配对消息。
- 默认情况下，每个频道的待处理 DM 配对请求上限为 **3 个**；在其中一个请求过期或被批准之前，额外的请求将被忽略。

### 批准发件人

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的渠道：`telegram`、`whatsapp`、`signal`、`imessage`、`discord`、`slack`。

### 状态存储位置

存储于 `~/.openclaw/credentials/` 下：
- 待处理请求：`<channel>-pairing.json`
- 已批准白名单存储：`<channel>-allowFrom.json`

请将这些视为敏感信息（它们控制着对您助手的访问权限）。


## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 **设备** 身份通过 `role: node` 连接到网关。网关会创建一个必须获得批准的设备配对请求。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 状态存储位置

存储于 `~/.openclaw/devices/` 下：
- `pending.json`（短期存储；待处理请求到期）
- `paired.json`（已配对的设备 + 令牌）

### 注意事项

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending/approve`）是独立于网关的配对存储。WS 节点仍然需要进行设备配对。


## 相关文档

- 安全模型 + 提示注入：[安全](/gateway/security)
- 安全更新（运行医生检查）：[更新](/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - iMessage：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
