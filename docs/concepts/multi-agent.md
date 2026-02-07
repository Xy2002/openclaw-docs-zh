---
summary: 'Multi-agent routing: isolated agents, channel accounts, and bindings'
title: Multi-Agent Routing
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
---
# 多代理路由

目标：在运行中的网关中，支持多个*隔离*代理（独立工作区 + `agentDir` + 会话）以及多个渠道账号（例如两个 WhatsApp）。入站消息通过绑定规则被路由到相应的代理。

## 什么是“一个代理”？

**代理**是一个完全隔离的智能体，拥有自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、角色规则）。
- **状态目录**（用于身份验证配置、模型注册表和每个代理的配置）。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions` 下。

身份验证配置是**按代理划分**的。每个代理从自己的配置中读取：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

主代理凭据**不会自动共享**。切勿在不同代理之间重复使用 `agentDir`（这会导致身份验证或会话冲突）。如果需要共享凭据，请将 `auth-profiles.json` 复制到另一个代理的 `agentDir` 中。

技能按代理划分，通过每个工作区的 `skills/` 文件夹实现；共享技能则可在 `~/.openclaw/skills` 中获取。请参阅 [技能：按代理 vs 共享](/tools/skills#per-agent-vs-shared-skills)。

网关可以同时托管**一个代理**（默认）或**多个代理**。

**工作区说明**：每个代理的工作区是**默认当前工作目录**，而非严格的沙箱环境。相对路径会在工作区内解析，但绝对路径仍可访问主机上的其他位置，除非启用了沙箱机制。详情请参阅 [沙箱化](/gateway/sandboxing)。

## 路径速查表

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 代理目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单代理模式（默认）

如果不进行任何配置，OpenClaw 将运行单个代理：

- `agentId` 默认为 **`main`**。
- 会话以 `agent:main:<mainKey>` 为键。
- 工作区默认为 `~/.openclaw/workspace`（当设置 `OPENCLAW_PROFILE` 时，默认为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## 代理助手

使用代理向导添加一个新的隔离代理：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导自动完成），以路由入站消息。

验证方法如下：

```bash
openclaw agents list --bindings
```

## 多个代理 = 多个人，多种人格

在**多代理**模式下，每个 `agentId` 都成为一个**完全隔离的角色**：

- **不同的电话号码/账号**（按渠道划分的 `accountId`）。
- **不同的人格**（按代理划分的工作区文件，如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的身份验证和会话**（除非显式启用，否则彼此之间无交叉通信）。

这使得**多人**可以共享一个网关服务器，同时保持各自的AI“大脑”和数据相互隔离。

## 一个WhatsApp号码，多人共用（私信分流）

您可以在**一个 WhatsApp 账号**下，将**不同的 WhatsApp 私信**路由到不同的代理。通过发件人 E.164 号码（如 `+15551234567`）与 `peer.kind: "dm"` 匹配。回复仍然来自同一个 WhatsApp 号码（不会根据代理区分发件人身份）。

重要细节：直接聊天会合并到代理的**主会话键**，因此要实现真正的隔离，必须确保**为每人分配一名独立代理**。

示例：

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" }
    ]
  },
  bindings: [
    { agentId: "alex", match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551230001" } } },
    { agentId: "mia",  match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551230002" } } }
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"]
    }
  }
}
```

注意事项：

- 私信访问控制是**针对整个 WhatsApp 账号的全局控制**（配对/白名单），而不是按代理单独控制。
- 对于共享群组，可将群组绑定到一个代理，或使用 [广播群组](/broadcast-groups)。

## 路由规则（消息如何选择代理）

绑定规则是**确定性的**，且**最具体优先**：

1. `peer` 匹配（精确的 DM/群组/频道 ID）
2. `guildId`（Discord）
3. `teamId`（Slack）
4. `accountId` 匹配某个频道
5. 频道级匹配（`accountId: "*"`）
6. 回退到默认代理（`agents.list[].default`，否则使用列表中的第一个条目，默认为 `main`）

## 多账号 / 多手机号

支持**多账号**的渠道（如 WhatsApp）使用 `accountId` 来标识每个登录。每个 `accountId` 都可以被路由到不同的代理，因此一台服务器可以托管多个手机号，而不会混杂会话。

## 核心概念

- `agentId`：一个“大脑”（工作区、按代理划分的身份验证、按代理划分的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 货号 `"personal"` 与 `"biz"`）。
- `binding`：根据 `(channel, accountId, peer)` 以及可选的公会/团队 ID，将入站消息路由到 `agentId`。
- 直接聊天会合并到 `agent:<agentId>:<mainKey>`（按代理划分的“主会话”；`session.mainKey`）。

## 示例：两个 WhatsApp → 两个代理

`~/.openclaw/openclaw.json`（JSON5）：

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 示例：WhatsApp日常聊天 + Telegram深度工作

按渠道分流：将 WhatsApp 路由到快速的日常代理，将 Telegram 路由到 Opus 代理。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5"
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-5"
      }
    ]
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } }
  ]
}
```

注意事项：

- 如果您为某个渠道拥有多个账号，请在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 若要将单个DM/群组路由到Opus，同时将其余消息保留在聊天中，可为该对等方添加一个 `match.peer` 绑定；对等方匹配始终优先于频道级规则。

## 示例：在同一渠道中，某位好友的消息被路由到 Opus

让 WhatsApp 保留在快速代理上，但将某条私信路由到 Opus：

```json5
{
  agents: {
    list: [
      { id: "chat", name: "Everyday", workspace: "~/.openclaw/workspace-chat", model: "anthropic/claude-sonnet-4-5" },
      { id: "opus", name: "Deep Work", workspace: "~/.openclaw/workspace-opus", model: "anthropic/claude-opus-4-5" }
    ]
  },
  bindings: [
    { agentId: "opus", match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551234567" } } },
    { agentId: "chat", match: { channel: "whatsapp" } }
  ]
}
```

对等方绑定始终具有优先权，因此请将其置于频道级规则之上。

## 将家庭代理绑定到 WhatsApp 群组

将专用的家庭代理绑定到单个WhatsApp群组，并通过提及限制和更严格的工具策略来管理该群组：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"]
        },
        sandbox: {
          mode: "all",
          scope: "agent"
        },
        tools: {
          allow: ["exec", "read", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"]
        }
      }
    ]
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" }
      }
    }
  ]
}
```

注意事项：

- 工具允许/禁止列表是针对**工具**的，而非技能。如果某个技能需要运行二进制文件，请确保 `exec` 被允许，并且该二进制文件存在于沙箱中。
- 如需更严格的限制，请设置 `agents.list[].groupChat.mentionPatterns`，并为该渠道保持群组白名单开启。

## 按代理划分的沙箱和工具配置

自 v2026.1.6 起，每个代理都可以拥有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

注意：`setupCommand` 存在于 `sandbox.docker` 下，并在容器创建时运行一次。当解析后的范围为 `"shared"` 时，将忽略按代理的 `sandbox.docker.*` 重写的操作。

**优势**：

- **安全隔离**：可为不受信任的代理限制可用工具。
- **资源控制**：可为特定代理启用沙箱，同时允许其他代理使用主机资源。
- **灵活策略**：可为每个代理设置不同的权限。

注意：`tools.elevated` 是**全局的**，基于发件人；无法按代理单独配置。若需要按代理划分边界，请使用 `agents.list[].tools` 来拒绝 `exec`。对于群组定向，请使用 `agents.list[].groupChat.mentionPatterns`，以便@提及能准确映射到目标代理。

更多详细示例，请参阅 [多代理沙箱与工具](/multi-agent-sandbox-tools)。
