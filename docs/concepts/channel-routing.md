---
summary: >-
  Routing rules per channel (WhatsApp, Telegram, Discord, Slack) and shared
  context
read_when:
  - Changing channel routing or inbox behavior
---
# 频道与路由


OpenClaw会将回复**路由回消息最初来自的频道**。模型本身不负责选择频道；路由是确定性的，由主机配置控制。

## 关键术语

- **频道**：`whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`。
- **AccountId**：每个频道的账户实例（在支持的情况下）。
- **AgentId**：一个隔离的工作区加上会话存储（“大脑”）。
- **SessionKey**：用于存储上下文并控制并发的桶键。

## 会话密钥形状（示例）

直接消息会合并到代理的**主**会话中：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

群组和频道则按频道保持隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord线程会在基础密钥上附加`:thread:<threadId>`。
- Telegram论坛主题会将`:topic:<topicId>`嵌入群组密钥中。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 路由规则（如何选择代理）

对于每条入站消息，路由会选出**一个代理**：

1. **精确对等匹配**（`bindings`与`peer.kind` + `peer.id`）。
2. **公会匹配**（Discord），通过`guildId`。
3. **团队匹配**（Slack），通过`teamId`。
4. **账户匹配**（该频道上的`accountId`）。
5. **频道匹配**（该频道上的任意账户）。
6. **默认代理**（`agents.list[].default`，否则使用列表中的第一条，回退至`main`）。

匹配的代理决定了使用哪个工作区和会话存储。

## 广播组（运行多个代理）

广播组允许你在OpenClaw通常会自动回复的情况下，为同一对等方运行**多个代理**（例如：在WhatsApp群组中，在提及/激活门控之后）。

配置：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"]
  }
}
```

详情请参阅：[广播组](/broadcast-groups)。

## 配置概览

- `agents.list`：命名代理定义（工作区、模型等）。
- `bindings`：将入站频道/账户/对等方映射到代理。

示例：

```json5
{
  agents: {
    list: [
      { id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }
    ]
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" }
  ]
}
```

## 会话存储

会话存储位于状态目录下（默认`~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL转录文件与存储文件并存

你可以通过`session.store`和`{agentId}`模板覆盖存储路径。

## WebChat行为

WebChat会连接到**选定的代理**，并默认使用该代理的主会话。因此，WebChat使你能够在一处查看该代理的跨频道上下文。

## 回复上下文

入站回复包含：
- 在可用时包括`ReplyToId`、`ReplyToBody`和`ReplyToSender`。
- 引用的上下文会作为`[Replying to ...]`块附加到`Body`。

此行为在所有频道中保持一致。
