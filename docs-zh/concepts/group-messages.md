---
summary: >-
  Behavior and config for WhatsApp group message handling (mentionPatterns are
  shared across surfaces)
read_when:
  - Changing group message rules or mentions
---
# 群组消息（WhatsApp 网页渠道）

目标：让 Clawd 待在 WhatsApp 群组中，仅在收到 ping 时唤醒，并将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也用于 Telegram/Discord/Slack/iMessage；本文档重点介绍 WhatsApp 特有的行为。对于多代理设置，请为每个代理单独设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 已实现功能（2025-12-03）
- 激活模式：`mention`（默认）或 __ INLINE_CODE_5__。`mention` 需要通过 ping 触发（通过 `mentionedJids` 发送的真实 WhatsApp @提及、正则表达式模式，或文本中任何位置出现的机器人 E.164 号码）。`always` 会在每条消息到达时唤醒代理，但只有在能够提供有意义价值时才回复；否则返回静默标记 `NO_REPLY`。默认值可在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 在群组级别覆盖。当 `channels.whatsapp.groups` 设置为启用时，它还充当群组白名单（包含 `"*"` 则允许所有成员）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式 `channels.whatsapp.allowFrom`）。默认为 `allowlist`（阻止所有消息，直到你添加发送者）。
- 每个群组的独立会话：会话密钥格式为 `agent:<agentId>:whatsapp:group:<jid>`，因此诸如 `/verbose on` 或 `/think high` 的命令（作为独立消息发送）仅作用于该群组；个人私信状态不受影响。群组线程会跳过心跳检测。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）若*未*触发运行，则会在 `[Chat messages since your last reply - for context]` 下进行前缀标注，触发行则位于 `[Current message - respond to this]` 下。已在会话中的消息不会被重新注入。
- 发送者标识：每个群组批次现在都以 `[from: Sender Name (+E164)]` 结尾，以便 Pi 能够识别当前发言者。
- 临时消息/阅后即焚：我们在提取文本和提及之前先解包这些消息，因此其中的 ping 仍能触发响应。
- 群组系统提示词：在群组会话的第一轮（以及每当 `/activation` 更改模式时），我们会向系统提示词中注入一段简短说明，如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`。如果元数据不可用，我们仍会告知代理这是一个群聊。

## WhatsApp 配置示例
在 `~/.openclaw/openclaw.json` 中添加一个 `groupChat` 块，以便即使 WhatsApp 在文本主体中剥离了视觉 `@`，显示名 ping 也能正常工作：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true }
      }
    }
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: [
            "@?openclaw",
            "\\+?15555550123"
          ]
        }
      }
    ]
  }
}
```

注意事项：
- 正则表达式不区分大小写；它们涵盖类似 `@openclaw` 的显示名 ping，以及带有或不带 `+`/空格的原始号码。
- 当有人点击联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此很少需要使用号码回退，但它是一个有用的安全网。

### 激活命令（仅限群主）
使用群聊命令：
- `/activation mention`
- `/activation always`

只有群主号码（来自 `channels.whatsapp.allowFrom`，或在未设置时使用机器人的 E.164）才能更改此设置。在群组中发送 `/status` 作为独立消息，即可查看当前的激活模式。

## 使用方法
1) 将你的 WhatsApp 账号（运行 OpenClaw 的账号）加入群组。
2) 说出 `@openclaw …`（或直接提及号码）。除非你设置 `groupPolicy: "open"`，否则只有白名单中的发送者才能触发。
3) 代理提示词将包含最近的群组上下文以及尾部的 `[from: …]` 标记，以便它能准确回应正确的用户。
4) 会话级指令（`/verbose on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的会话；请将其作为独立消息发送，以便生效。你的个人私信会话保持独立。

## 测试与验证
- 手动烟雾测试：
  - 在群组中发送一个 `@openclaw` ping，并确认回复中引用了发送者姓名。
  - 发送第二个 ping，并验证历史记录块是否已包含并在下一轮中被清除。
- 检查网关日志（使用 `--verbose` 运行），查看 `inbound web message` 条目，显示 `from: <groupJid>` 和 `[from: …]` 后缀。

## 已知注意事项
- 为避免嘈杂的广播，群组会主动跳过心跳检测。
- 回声抑制基于组合后的批次字符串；如果你两次发送完全相同的文本且不含提及，只有第一次会得到响应。
- 会话存储条目将在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认为 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目仅表示该群组尚未触发运行。
- 群组中的打字指示器遵循 `agents.defaults.typingMode`（默认：未提及时为 `message`）。
