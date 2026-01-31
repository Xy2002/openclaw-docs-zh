---
summary: 'Multi-agent routing: isolated agents, channel accounts, and bindings'
title: Multi-Agent Routing
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
---
# 多智能体路由

目标：在一个运行的网关中，支持多个*隔离*的智能体（独立工作空间 + `agentDir` + 会话），以及多个渠道账号（例如两个 WhatsApp）。入站消息通过绑定规则被路由到相应的智能体。

## 什么是“一个智能体”？

**智能体**是一个完全隔离的“大脑”，拥有自己的：

- **工作空间**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、角色规则）。
- **状态目录**（用于存储身份验证配置、模型注册表和每个智能体的配置）。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions` 下。

身份验证配置是**按智能体划分**的。每个智能体从自己的配置中读取：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

主智能体的凭据**不会自动共享**。切勿在不同智能体之间重复使用 `agentDir`（这会导致身份验证或会话冲突）。如果需要共享凭据，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。

技能是按智能体划分的，通过各自工作空间的 `skills/` 文件夹实现；共享技能则可以从 `~/.openclaw/skills` 获取。请参阅 [技能：按智能体 vs 共享](/tools/skills#per-agent-vs-shared-skills)。

网关可以同时托管**一个智能体**（默认）或**多个智能体**。

**工作空间说明**：每个智能体的工作空间是**默认的当前工作目录**，而不是严格的沙盒环境。相对路径会在工作空间内解析，但绝对路径可以访问主机上的其他位置，除非启用了沙盒机制。请参阅 [沙盒化](/gateway/sandboxing)。

## 路径速查表

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作空间：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果您不进行任何配置，OpenClaw 将运行单个智能体：

- `agentId` 默认为 **`main`**。
- 会话以 `agent:main:<mainKey>` 作为键。
- 工作空间默认为 `~/.openclaw/workspace`（当设置 `OPENCLAW_PROFILE` 时，默认为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导添加一个新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导自动完成），以路由入站消息。

验证方法如下：

```bash
openclaw agents list --bindings
```

## 多个智能体 = 多个人、多个人格

在**多智能体**模式下，每个 `agentId` 都成为一个**完全隔离的角色**：

- **不同的电话号码/账号**（按渠道划分的 `accountId`）。
- **不同的人格**（按智能体划分的工作空间文件，如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的身份验证和会话**（除非显式启用，否则彼此之间无交叉通信）。

这使得**多人**可以在共享一个网关服务器的同时，保持各自的 AI “大脑”和数据相互隔离。

## 一个 WhatsApp 号码，多人共用（DM 分流）

您可以在**一个 WhatsApp 账号**下，将**不同的 WhatsApp 私信**路由到不同的智能体。通过匹配发送方的 E.164 号码（如 `+15551234567`），使用 `peer.kind: "dm"` 进行匹配。回复仍然来自同一个 WhatsApp 号码（没有按智能体区分的发送方身份）。

重要细节：直接聊天会合并到智能体的**主会话键**，因此要实现真正的隔离，必须确保**每人一个智能体**。

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
- DM 访问控制是**针对整个 WhatsApp 账号的全局控制**（配对/白名单），而不是按智能体控制。
- 对于共享群组，可将群组绑定到一个智能体，或使用 [广播群组](/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定规则是**确定性的**，且**最具体的规则优先**：

1. `peer` 匹配（精确的 DM/群组/频道 ID）
2. `guildId`（Discord）
3. `teamId`（Slack）
4. `accountId` 匹配某个频道
5. 频道级匹配（`accountId: "*"`）
6. 回退到默认智能体（`agents.list[].default`，否则使用列表中的第一个条目，默认为 `main`）

## 多账号 / 多手机号

支持**多账号**的渠道（如 WhatsApp）使用 `accountId` 来标识每次登录。每个 `accountId` 都可以被路由到不同的智能体，因此一台服务器可以托管多个手机号，而不会混杂会话。

## 核心概念

- `agentId`：一个“大脑”（工作空间、按智能体的身份验证、按智能体的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` vs `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 以及可选的公会/团队 ID，将入站消息路由到某个 `agentId`。
- 直接聊天会合并到 `agent:<agentId>:<mainKey>`（按智能体的“主会话”；`session.mainKey`）。

## 示例：两个 WhatsApp → 两个智能体

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

## 示例：WhatsApp 日常聊天 + Telegram 深度工作

按渠道分流：将 WhatsApp 路由到快速的日常智能体，将 Telegram 路由到 Opus 智能体。

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
- 如果您在一个渠道上有多个账号，需在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 若要将单个 DM/群组路由到 Opus，同时将其余消息保留在聊天中，可为该对等方添加一个 `match.peer` 绑定；对等方匹配始终优先于频道级规则。

## 示例：同一渠道，特定对等方路由到 Opus

让 WhatsApp 保留在快速智能体上，但将某个 DM 路由到 Opus：

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

对等方绑定始终优先，因此请将其置于频道级规则之上。

## 家庭智能体绑定到 WhatsApp 群组

将一个专用的家庭智能体绑定到单个 WhatsApp 群组，并启用提及限制和更严格的工具策略：

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
- 工具允许/禁止列表是针对**工具**的，而非技能。如果某项技能需要运行二进制文件，需确保 `exec` 被允许，并且该二进制文件存在于沙盒中。
- 如需更严格的限制，可设置 `agents.list[].groupChat.mentionPatterns`，并保持针对该渠道的群组白名单开启。

## 按智能体的沙盒与工具配置

自 v2026.1.6 起，每个智能体都可以拥有自己的沙盒和工具限制：

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

注意：`setupCommand` 存在于 `sandbox.docker` 下，在容器创建时运行一次。当解析后的范围为 `"shared"` 时，按智能体的 `sandbox.docker.*` 重写会被忽略。

**优势**：
- **安全隔离**：可为不可信智能体限制工具
- **资源控制**：可对特定智能体启用沙盒，而其他智能体仍使用主机资源
- **灵活的策略**：可为每个智能体设置不同的权限

注意：`tools.elevated` 是**全局的**，基于发送方；无法按智能体单独配置。若需要按智能体划分边界，可使用 `agents.list[].tools` 来拒绝 `exec`。对于群组定向，可使用 `agents.list[].groupChat.mentionPatterns`，以便 @提及能够准确映射到目标智能体。

有关详细示例，请参阅 [多智能体沙盒与工具](/multi-agent-sandbox-tools)。
