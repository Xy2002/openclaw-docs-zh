---
summary: All configuration options for ~/.openclaw/openclaw.json with examples
read_when:
  - Adding or modifying config fields
---
# 配置 🔧

OpenClaw会从`~/.openclaw/openclaw.json`读取可选的**JSON5**配置文件，该文件支持使用注释和尾随逗号。

如果文件缺失，OpenClaw 会使用相对安全的默认设置（内置 Pi 代理 + 按发送方划分的会话 + 工作区 `~/.openclaw/workspace`）。通常，你只需通过配置来：

- 限制谁可以触发机器人（`channels.whatsapp.allowFrom`、`channels.telegram.allowFrom` 等）
- 控制组白名单 + 提及行为（`channels.whatsapp.groups`、`channels.telegram.groups`、`channels.discord.guilds`、`agents.list[].groupChat`）
- 自定义消息前缀（`messages`）
- 设置代理的工作空间（`agents.defaults.workspace` 或 `agents.list[].workspace`）
- 调整嵌入式代理的默认设置（`agents.defaults`）和会话行为（`session`）
- 为每个代理设置独立身份（`agents.list[].identity`）

> **刚接触配置？**请查看[配置示例](/gateway/configuration-examples)指南，其中包含附有详细说明的完整示例！

严格配置验证

OpenClaw仅接受与模式完全匹配的配置。
为确保安全，未知键、格式错误的类型或无效值会导致网关**拒绝启动**。

当验证失败时：

- 网关无法启动。
- 仅允许运行诊断命令（例如：`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`、`openclaw service`、`openclaw help`）。
- 运行 `openclaw doctor` 以查看具体问题。
- 运行 `openclaw doctor --fix`（或 `--yes`）以应用迁移/修复。

除非您明确选择加入`--fix`/`--yes`，医生绝不会记录任何变更。

## 模式 + UI 提示

网关通过`config.schema`向UI编辑器公开配置的JSON Schema表示。
控制UI根据此模式渲染一个表单，并提供一个**原始JSON**编辑器作为应急出口。

渠道插件和扩展可以为其配置注册模式和UI提示，从而使渠道设置在各应用中始终以模式驱动，而无需硬编码表单。

提示（标签、分组、敏感字段）随模式一起提供，使客户端无需硬编码配置知识即可渲染出更优质的表单。

应用并重启（RPC）

使用`config.apply`一步完成完整配置的验证与写入，并重启网关。
在网关恢复后，它会写入重启标记并ping最后一个活跃会话。

警告：`config.apply` 会替换**整个配置**。如果您只想更改少数几个键，
请使用 `openclaw config set` 或 `openclaw config set`。请保留 `~/.openclaw/openclaw.json` 的备份。

参数：

- `raw`（字符串）—— 整个配置的 JSON5 负载
- `baseHash`（可选）—— 来自 `config.get` 的配置哈希（当配置已存在时必填）
- `sessionKey`（可选）—— 用于唤醒 ping 的上次活动会话密钥
- `note`（可选）—— 要包含在重启哨兵中的备注
- `restartDelayMs`（可选）—— 重启前的延迟时间（默认为 2000）

示例（通过`gateway call`）：

```bash
openclaw gateway call config.get --params '{}' # capture payload.hash
openclaw gateway call config.apply --params '{
  "raw": "{\\n  agents: { defaults: { workspace: \\"~/.openclaw/workspace\\" } }\\n}\\n",
  "baseHash": "<hash-from-config.get>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123",
  "restartDelayMs": 1000
}'
```

部分更新（远程过程调用）

使用 `config.patch` 将部分更新合并到现有配置中，而不会覆盖无关的键。它采用 JSON 合并补丁语义：

- 对象递归合并
- `null` 删除一个键
- 数组替换

与`config.apply`一样，它会验证配置、写入配置、存储重启标记，并计划网关重启（在提供`sessionKey`时可选择唤醒）。

参数：

- `raw`（字符串）—— 包含待更改键的 JSON5 有效载荷
- `baseHash`（必填）—— 来自 `config.get` 的配置哈希
- `sessionKey`（可选）—— 用于唤醒 ping 的上次活动会话密钥
- `note`（可选）—— 要包含在重启哨兵中的备注
- `restartDelayMs`（可选）—— 重启前的延迟时间（默认 2000）

示例：

```bash
openclaw gateway call config.get --params '{}' # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{\\n  channels: { telegram: { groups: { \\"*\\": { requireMention: false } } } }\\n}\\n",
  "baseHash": "<hash-from-config.get>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123",
  "restartDelayMs": 1000
}'
```

## 最小配置（推荐起点）

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } }
}
```

使用以下命令构建默认镜像一次：

```bash
scripts/sandbox-setup.sh
```

## 自我聊天模式（建议用于群组控制）

为防止机器人响应群组中的WhatsApp提及（仅对特定文本触发词作出回应）：

```json5
{
  agents: {
    defaults: { workspace: "~/.openclaw/workspace" },
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["@openclaw", "reisponde"] }
      }
    ]
  },
  channels: {
    whatsapp: {
      // Allowlist is DMs only; including your own number enables self-chat mode.
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } }
    }
  }
}
```

## 配置包含 (`$include`)

使用`$include`指令将配置拆分为多个文件。这在以下情况下很有用：

- 整理大型配置（例如按客户端划分的代理定义）
- 在不同环境中共享通用设置
- 将敏感配置单独存放

### 基本用法

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  
  // Include a single file (replaces the key's value)
  agents: { "$include": "./agents.json5" },
  
  // Include multiple files (deep-merged in order)
  broadcast: { 
    "$include": [
      "./clients/mueller.json5",
      "./clients/schmidt.json5"
    ]
  }
}
```

```json5
// ~/.openclaw/agents.json5
{
  defaults: { sandbox: { mode: "all", scope: "session" } },
  list: [
    { id: "main", workspace: "~/.openclaw/workspace" }
  ]
}
```

合并行为

- **单个文件**：替换包含 `$include` 的对象
- **文件数组**：按顺序深度合并文件（后面的文件会覆盖前面的文件）
- **带兄弟键**：在包含之后合并兄弟键（会覆盖被包含的值）
- **兄弟键 + 数组/原始值**：不支持（被包含的内容必须是对象）

```json5
// Sibling keys override included values
{
  "$include": "./base.json5",   // { a: 1, b: 2 }
  b: 99                          // Result: { a: 1, b: 99 }
}
```

### 嵌套包含

包含的文件本身可以包含 `$include` 指令（最多10层深）：

```json5
// clients/mueller.json5
{
  agents: { "$include": "./mueller/agents.json5" },
  broadcast: { "$include": "./mueller/broadcast.json5" }
}
```

路径解析

- **相对路径**：相对于包含文件解析
- **绝对路径**：原样使用
- **父目录**：`../` 引用按预期工作

```json5
{ "$include": "./sub/config.json5" }      // relative
{ "$include": "/etc/openclaw/base.json5" } // absolute
{ "$include": "../shared/common.json5" }   // parent dir
```

### 错误处理

- **缺失文件**：显示明确的错误，并附上解析后的路径
- **解析错误**：指出是哪个被包含文件导致解析失败
- **循环包含**：检测到循环包含并报告包含链

### 示例：多客户法律架构

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789, auth: { token: "secret" } },
  
  // Common agent defaults
  agents: {
    defaults: {
      sandbox: { mode: "all", scope: "session" }
    },
    // Merge agent lists from all clients
    list: { "$include": [
      "./clients/mueller/agents.json5",
      "./clients/schmidt/agents.json5"
    ]}
  },
  
  // Merge broadcast configs
  broadcast: { "$include": [
    "./clients/mueller/broadcast.json5",
    "./clients/schmidt/broadcast.json5"
  ]},
  
  channels: { whatsapp: { groupPolicy: "allowlist" } }
}
```

```json5
// ~/.openclaw/clients/mueller/agents.json5
[
  { id: "mueller-transcribe", workspace: "~/clients/mueller/transcribe" },
  { id: "mueller-docs", workspace: "~/clients/mueller/docs" }
]
```

```json5
// ~/.openclaw/clients/mueller/broadcast.json5
{
  "120363403215116621@g.us": ["mueller-transcribe", "mueller-docs"]
}
```

常见选项

环境变量 + `.env`

OpenClaw从父进程（Shell、launchd、systemd、CI等）中读取环境变量。

此外，它还会加载：

- 从当前工作目录加载的`.env`（如果存在）
- 来自`~/.openclaw/.env`（又名`$OPENCLAW_STATE_DIR/.env`）的全局回退`.env`

没有`.env`文件会覆盖现有的环境变量。

你也可以在配置中提供内联环境变量。这些变量仅在进程环境中缺少相应键时才会生效（遵循相同的不覆盖规则）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-..."
    }
  }
}
```

有关完整的优先级和来源，请参阅[/environment](/environment)。

__标题1__ __内联代码0__（可选）

选择加入的便利性：如果已启用且尚未设置任何预期密钥，OpenClaw将运行您的登录Shell，并仅导入缺失的预期密钥（绝不会覆盖现有密钥）。这实际上会加载您的Shell配置文件。

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000
    }
  }
}
```

环境变量等效项：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

配置中的环境变量替换

您可以在任何配置字符串值中直接使用`${VAR_NAME}`语法引用环境变量。变量在配置加载时被替换，在验证之前。

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}"
      }
    }
  },
  gateway: {
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}"
    }
  }
}
```

**规则：**

- 仅匹配大写环境变量名：`[A-Z_][A-Z0-9_]*`
- 缺失或为空的环境变量会在加载配置时抛出错误
- 使用 `${VAR}` 进行转义，以输出字面量 `${VAR}`
- 适用于 `$include`（包含的文件也会进行替换）

**内联替换：**

```json5
{
  models: {
    providers: {
      custom: {
        baseUrl: "${CUSTOM_API_BASE}/v1"  // → "https://api.example.com/v1"
      }
    }
  }
}
```

身份验证存储（OAuth + API 密钥）

OpenClaw在以下位置存储**每个代理**的身份验证配置文件（OAuth + API密钥）：

- `<agentDir>/auth-profiles.json`（默认：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`）

另请参阅：[/concepts/oauth](/concepts/oauth)

旧版 OAuth 导入：

- `~/.openclaw/credentials/oauth.json`（或`$OPENCLAW_STATE_DIR/credentials/oauth.json`）

嵌入式Pi代理在以下位置维护运行时缓存：

- `<agentDir>/auth.json`（自动管理；请勿手动编辑）

遗留代理目录（多代理之前）：

- `~/.openclaw/agent/*`（从`openclaw doctor`迁移到`~/.openclaw/agents/<defaultAgentId>/agent/*`）

覆盖：

- OAuth目录（仅用于旧版导入）：`OPENCLAW_OAUTH_DIR`
- 代理目录（默认代理根目录覆盖）：`OPENCLAW_AGENT_DIR`（首选），`PI_CODING_AGENT_DIR`（旧版）

首次使用时，OpenClaw会将`oauth.json`条目导入`auth-profiles.json`。

### __INLINE_CODE_0__

身份验证配置文件的可选元数据。这**不**存储机密；它将配置文件ID映射到提供商和模式（以及可选电子邮件），并定义用于故障转移的提供商轮转顺序。

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" }
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"]
    }
  }
}
```

### __INLINE_CODE_0__

用于默认设置和用户体验的可选代理身份。此字段由 macOS 入网助理写入。

如果已设置，OpenClaw 将派生默认值（仅在您未显式设置它们时）：

- 从**活跃代理**的`identity.emoji`获取`messages.ackReaction`（回退到👀）
- 从代理的`identity.name`/`identity.emoji`获取`agents.list[].groupChat.mentionPatterns`（因此“@Samantha”在Telegram/Slack/Discord/Google Chat/iMessage/WhatsApp等平台的群组中均有效）
- `identity.avatar` 接受工作区相对的图片路径，或远程URL/数据URL。本地文件必须位于代理的工作区内。

`identity.avatar` 接受：

- 与工作区相关的路径（必须位于代理工作区内）
- `http(s)`URL
- `data:`URI

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png"
        }
      }
    ]
  }
}
```

### __INLINE_CODE_0__

由 CLI 向导编写的元数据（`onboard`、`configure`、`doctor`）。

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local"
  }
}
```

### __INLINE_CODE_0__

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- 如果你需要一个稳定的路径，请将 `logging.file` 设置为 `/tmp/openclaw/openclaw.log`。
- 控制台输出可通过以下方式单独调整：
  - `logging.consoleLevel`（默认为 `info`，在 `--verbose` 时提升至 `debug`）
  - `logging.consoleStyle`（`pretty` | `compact` | `json`）
- 工具摘要可以被屏蔽以避免泄露敏感信息：
  - `logging.redactSensitive`（`off` | `tools`，默认：`tools`）
  - `logging.redactPatterns`（正则表达式字符串数组；覆盖默认设置）

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
    redactPatterns: [
      // Example: override defaults with your own rules.
      "\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1",
      "/\\bsk-[A-Za-z0-9_-]{8,}\\b/gi"
    ]
  }
}
```

### __INLINE_CODE_0__

控制WhatsApp私信（DM）的处理方式：

- `"pairing"`（默认）：未知发件人会收到配对代码；所有者必须批准
- `channels.whatsapp.allowFrom`: 仅允许来自 `channels.whatsapp.allowFrom` 的发件人（或已配对的允许商店）
- `"open"`: 允许所有入站私信（**需要** `channels.whatsapp.allowFrom` 包含 `"*"`）
- `"disabled"`: 忽略所有入站私信

配对码在一小时后失效；机器人仅在创建新请求时发送配对码。默认情况下，每个频道的待处理私信配对请求上限为**3个**。

配对批准：

- `openclaw pairing list whatsapp`
- `openclaw pairing approve whatsapp <code>`

### __INLINE_CODE_0__

可触发WhatsApp自动回复的E.164电话号码白名单（仅限私信）。
如果为空且`channels.whatsapp.dmPolicy="pairing"`，未知发件人将收到配对码。
对于群组，请使用`channels.whatsapp.groupPolicy` + `channels.whatsapp.groupAllowFrom`。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000, // optional outbound chunk size (chars)
      chunkMode: "length", // optional chunking mode (length | newline)
      mediaMaxMb: 50 // optional inbound media cap (MB)
    }
  }
}
```

### __INLINE_CODE_0__

控制入站WhatsApp消息是否标记为已读（蓝色对勾）。默认值：`true`。

自聊模式始终会跳过已读回执，即使该功能已启用。

按账户覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`。

```json5
{
  channels: {
    whatsapp: { sendReadReceipts: false }
  }
}
```

### `channels.whatsapp.accounts`（多账户）

在一个网关中运行多个WhatsApp账号：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {}, // optional; keeps the default id stable
        personal: {},
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        }
      }
    }
  }
}
```

注释：

- 出站命令默认使用账户 `default`（如果存在）；否则使用第一个已配置的账户ID（按排序顺序）。
- 旧版单账户 Baileys 身份验证目录由 `openclaw doctor` 迁移到 `whatsapp/default`。

### `channels.telegram.accounts` / `channels.discord.accounts` / `channels.googlechat.accounts` / `channels.slack.accounts` / `channels.mattermost.accounts` / `channels.signal.accounts` / `channels.imessage.accounts`

每个渠道运行多个账号（每个账号都有自己的`accountId`，并可选`name`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC..."
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ..."
        }
      }
    }
  }
}
```

注释：

- 当省略`accountId`时，使用`default`（CLI + 路由）。
- 环境令牌仅适用于**默认**账户。
- 基础渠道设置（组策略、提及限制等）适用于所有账户，除非按账户单独覆盖。
- 使用`bindings[].match.accountId`将每个账户路由到不同的 agents.defaults。

群聊提及限制（`agents.list[].groupChat` + `messages.groupChat`）

群组消息的默认设置为“需要提及”（可通过元数据提及或正则表达式模式触发）。此设置适用于WhatsApp、Telegram、Discord、Google Chat和iMessage群聊。

**提及类型：**

- **元数据提及**：原生平台的@提及（例如，WhatsApp中的点击提及）。在WhatsApp自聊模式下会被忽略（见`channels.whatsapp.allowFrom`）。
- **文本模式**：在`agents.list[].groupChat.mentionPatterns`中定义的正则表达式模式。无论是否处于自聊模式，这些模式始终会被检查。
- 仅当可以检测到提及时（原生提及或至少存在一个`mentionPattern`），才会强制实施提及限制。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 }
  },
  agents: {
    list: [
      { id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }
    ]
  }
}
```

`messages.groupChat.historyLimit` 设置群组历史记录上下文的全局默认值。频道可以使用 `channels.<channel>.historyLimit`（或多账号场景下使用 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。将 `0` 设置为禁用历史记录环绕。

#### 私信历史限制

DM 对话使用由客服人员管理的基于会话的历史记录。您可以限制每个 DM 会话中保留的用户轮次数量：

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,  // limit DM sessions to 30 user turns
      dms: {
        "123456789": { historyLimit: 50 }  // per-user override (user ID)
      }
    }
  }
}
```

决议顺序：

1. 按DM覆盖：`channels.<provider>.dms[userId].historyLimit`
2. 提供商默认：`channels.<provider>.dmHistoryLimit`
3. 无限制（保留所有历史）

支持的提供商：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

单个代理覆盖（设置后优先，即使`[]`）：

```json5
{
  agents: {
    list: [
      { id: "work", groupChat: { mentionPatterns: ["@workbot", "\\+15555550123"] } },
      { id: "personal", groupChat: { mentionPatterns: ["@homebot", "\\+15555550999"] } }
    ]
  }
}
```

提及过滤的默认设置按频道生效（`channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`、`channels.discord.guilds`）。当设置为 `*.groups` 时，它同时充当群组白名单；包含 `"*"` 可允许所有群组。

仅响应特定文本触发器（忽略原生@提及）：

```json5
{
  channels: {
    whatsapp: {
      // Include your own number to enable self-chat mode (ignore native @-mentions).
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } }
    }
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          // Only these text patterns will trigger responses
          mentionPatterns: ["reisponde", "@openclaw"]
        }
      }
    ]
  }
}
```

### 组策略（按频道）

使用 `channels.*.groupPolicy` 来控制是否完全接受群组/房间消息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"]
    },
    telegram: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["tg:123456789", "@alice"]
    },
    signal: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"]
    },
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["chat_id:123"]
    },
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"]
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "GUILD_ID": {
          channels: { help: { allow: true } }
        }
      }
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } }
    }
  }
}
```

注释：

- `"open"`: 允许绕过允许列表的群组；提及限制仍适用。
- `"allowlist"`: 阻止所有群组/聊天室消息。
- `"allowlist"`: 仅允许与配置的允许列表匹配的群组/聊天室。
- `channels.defaults.groupPolicy` 在提供商的 `groupPolicy` 未设置时定义默认行为。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams 使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
- Discord/Slack 使用频道允许列表（`channels.discord.guilds.*.channels`, `channels.slack.channels`）。
- 群组私信（Discord/Slack）仍由 `dm.groupEnabled` + `dm.groupChannels` 控制。
- 默认为 `groupPolicy: "allowlist"`（除非被 `channels.defaults.groupPolicy` 覆盖）；如果未配置允许列表，群组消息将被阻止。

多智能体路由（`agents.list` + `bindings`）

在单个网关中运行多个隔离的代理（独立的工作区、`agentDir`、会话）。
入站消息通过绑定路由到代理。

- `agents.list[]`: 每个代理的覆盖设置。
  - `default`: 稳定的代理ID（必填）。
  - `default`: 取；如果设置了多个，以第一个为准，并记录一条警告。

如果未设置任何代理，则列表中的**第一条记录**为默认代理。

- `name`: 代理的显示名称。
  - `~/.openclaw/workspace-<agentId>`: 默认 `~/.openclaw/workspace-<agentId>`（对于 `main`，回退到 `agents.defaults.workspace`）。
  - `agentDir`: 默认 `~/.openclaw/agents/<agentId>/agent`。
  - `model`: 每个代理的默认模型，会覆盖该代理的 `agents.defaults.model`。
    - 字符串形式：`"provider/model"`，仅覆盖 `agents.defaults.model.primary`
    - 对象形式：`{ primary, fallbacks }`（回退会覆盖 `agents.defaults.model.fallbacks`；`[]` 会为该代理禁用全局回退）
  - `identity`: 每个代理的名称/主题/表情符号（用于提及模式和确认回复）。
  - `groupChat`: 每个代理的提及权限控制（`mentionPatterns`）。
  - `sandbox`: 每个代理的沙箱配置（覆盖 `agents.defaults.sandbox`）。
    - `mode`: `"off"` | `"non-main"` | `"all"`
    - `workspaceAccess`: `"none"` | `"ro"` | `"rw"`
    - `scope`: `"session"` | `"agent"` | `"shared"`
    - `workspaceRoot`: 自定义沙箱工作区根目录
    - `docker`: 每个代理的 Docker 覆盖设置（例如 `image`、`network`、`env`、`setupCommand`，以及限制；当 `scope: "shared"` 为真时被忽略）
    - `browser`: 每个代理的沙箱浏览器覆盖设置（当 `scope: "shared"` 为真时被忽略）
    - `prune`: 每个代理的沙箱修剪覆盖设置（当 `scope: "shared"` 为真时被忽略）
  - `subagents`: 每个代理的子代理默认设置。
    - `allowAgents`: 允许从此代理发起 `sessions_spawn` 的代理 ID 白名单（`["*"]` = 允许任何代理；默认：仅允许同一代理）
  - `tools`: 每个代理的工具限制（在沙箱工具策略之前应用）。
    - `profile`: 基础工具配置文件（在允许/拒绝之前应用）
    - `allow`: 允许使用的工具名称数组
    - `deny`: 禁止使用的工具名称数组（禁止优先）
- `agents.defaults`: 共享代理默认设置（模型、工作区、沙箱等）。
- `bindings[]`: 将入站消息路由到一个 `agentId`。
  - `match.channel`（必填）
  - `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
  - `match.peer`（可选；`{ kind: dm|group|channel, id }`）
  - `match.guildId` / `match.teamId`（可选；特定于渠道）

确定性匹配顺序：
1) `match.peer`
2) `match.teamId`
3) `match.teamId`
4) `match.accountId`（精确匹配，不考虑对等方/公会/团队）
5) `match.accountId: "*"`（频道范围匹配，不考虑对等方/公会/团队）
6) 默认代理（`agents.list[].default`，否则为列表中的第一条记录，否则为`"main"`）

在每个匹配层级中，`bindings` 中的第一个匹配条目获胜。

每个代理访问配置文件（多代理）

每个代理都可以携带自己的沙箱和工具策略。借助这一特性，您可以在一个网关中混合不同的访问级别：

- **完全访问权限**（个人代理）
- 仅限只读的工具和工作区
- **无文件系统访问权限**（仅限消息传递/会话工具）

有关优先级和其他示例，请参阅[多智能体沙盒与工具](/multi-agent-sandbox-tools)。

完全访问（无沙盒）：

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" }
      }
    ]
  }
}
```

只读工具 + 只读工作区：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro"
        },
        tools: {
          allow: ["read", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"]
        }
      }
    ]
  }
}
```

无文件系统访问（已启用消息传递/会话工具）：

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none"
        },
        tools: {
          allow: ["sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status", "whatsapp", "telegram", "slack", "discord", "gateway"],
          deny: ["read", "write", "edit", "apply_patch", "exec", "process", "browser", "canvas", "nodes", "cron", "gateway", "image"]
        }
      }
    ]
  }
}
```

示例：两个WhatsApp账号 → 两名客服：

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" }
    ]
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } }
  ],
  channels: {
    whatsapp: {
      accounts: {
        personal: {},
        biz: {},
      }
    }
  }
}
```

__标题1__ __内联代码0__（可选）

代理间消息传递是可选的：

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"]
    }
  }
}
```

### __INLINE_CODE_0__

控制在代理运行已处于活动状态时入站消息的行为。

```json5
{
  messages: {
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog (steer+backlog ok) | interrupt (queue=steer legacy)
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        imessage: "collect",
        webchat: "collect"
      }
    }
  }
}
```

### __INLINE_CODE_0__

对来自**同一发件人**的快速传入消息进行防抖处理，将多条连续消息合并为一次话术交互。防抖处理按渠道和会话划分作用域，并使用最新消息构建回复线程和消息ID。

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500
      }
    }
  }
}
```

注释：

- 对纯文本消息进行去抖动处理；媒体/附件则立即发送。
- 控制命令（例如 `/queue`、`/new`）绕过去抖动机制，以保持独立运行。

__标题1__ __内联代码0__（聊天命令处理）

控制聊天命令在各个连接器中的启用方式。

```json5
{
  commands: {
    native: "auto",         // register native commands when supported (auto)
    text: true,             // parse slash commands in chat messages
    bash: false,            // allow ! (alias: /bash) (host-only; requires tools.elevated allowlists)
    bashForegroundMs: 2000, // bash foreground window (0 backgrounds immediately)
    config: false,          // allow /config (writes to disk)
    debug: false,           // allow /debug (runtime-only overrides)
    restart: false,         // allow /restart + gateway restart tool
    useAccessGroups: true   // enforce access-group allowlists/policies for commands
  }
}
```

注释：

- 文本命令必须作为**独立**消息发送，并使用前导`/`（不支持纯文本别名）。
- `commands.native: "auto"`会禁用对聊天消息中命令的解析。
- `commands.native: "auto"`（默认设置）为Discord和Telegram启用原生命令，但不启用Slack；不受支持的渠道仍仅支持文本消息。
- 将`commands.native: true|false`设置为强制启用所有命令，或通过`channels.discord.commands.native`、`channels.telegram.commands.native`、`channels.slack.commands.native`（布尔值或`"auto"`）按频道覆盖设置。`false`会在启动时清除Discord/Telegram上先前注册的所有命令；Slack命令则在Slack应用中管理。
- `channels.telegram.customCommands`会添加额外的Telegram机器人菜单项。名称会进行规范化处理；与原生命令发生冲突的条目将被忽略。
- `commands.bash: true`启用`! <cmd>`以运行主机 shell 命令（`/bash <cmd>`也可用作别名）。需要`tools.elevated.enabled`，并在`tools.elevated.allowFrom.<channel>`中将发件人列入白名单。
- `commands.bashForegroundMs`控制 Bash 在将作业转入后台之前等待的时间长度。当一个 Bash 作业正在运行时，新的`! <cmd>`请求会被拒绝（一次只拒绝一个）。
- `commands.config: true`启用`/config`（读取/写入`openclaw.json`）。
- `channels.<provider>.configWrites`控制由该频道发起的配置变更是否允许（默认：true）。这适用于`/config set|unset`以及特定于提供商的自动迁移（如 Telegram 超级群组 ID 变更、Slack 频道 ID 变更）。
- `commands.debug: true`启用`/debug`（仅限运行时覆盖）。
- `commands.restart: true`启用`/restart`以及网关工具的重启操作。
- `commands.useAccessGroups: false`允许命令绕过访问组白名单/策略。
- 斜杠命令和指令仅对**授权发件人**有效。授权源自

频道白名单/配对加上`commands.useAccessGroups`。

__标题1__ __内联代码0__（WhatsApp网页渠道运行时）

WhatsApp通过网关的网页渠道（Baileys Web）运行。当存在已链接的会话时，它会自动启动。
将`web.enabled: false`设置为默认关闭。

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0
    }
  }
}
```

__标题1__ __内联代码0__（机器人运输）

OpenClaw仅在存在`channels.telegram`配置节时才启动Telegram。机器人令牌从`channels.telegram.botToken`（或`channels.telegram.tokenFile`）中解析，其中`TELEGRAM_BOT_TOKEN`用作默认账户的后备。
将`channels.telegram.enabled: false`设置为禁用自动启动。
多账户支持位于`channels.telegram.accounts`下（请参阅上方的多账户部分）。环境令牌仅适用于默认账户。
将`channels.telegram.configWrites: false`设置为阻止Telegram发起的配置写入（包括超级群组ID迁移和`/config set|unset`）。

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",                 // pairing | allowlist | open | disabled
      allowFrom: ["tg:123456789"],         // optional; "open" requires ["*"]
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic."
            }
          }
        }
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" }
      ],
      historyLimit: 50,                     // include last N group messages as context (0 disables)
      replyToMode: "first",                 // off | first | all
      linkPreview: true,                   // toggle outbound link previews
      streamMode: "partial",               // off | partial | block (draft streaming; separate from block streaming)
      draftChunk: {                        // optional; only for streamMode=block
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph"       // paragraph | newline | sentence
      },
      actions: { reactions: true, sendMessage: true }, // tool action gates (false disables)
      reactionNotifications: "own",   // off | own | all
      mediaMaxMb: 5,
      retry: {                             // outbound retry policy
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1
      },
      network: {                           // transport overrides
        autoSelectFamily: false
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook"
    }
  }
}
```

流媒体笔记草稿：

- 使用 Telegram `sendMessageDraft`（草稿气泡，而非真实消息）。
- 需要**私人聊天主题**（私信中的 message_thread_id；机器人已启用主题功能）。
- `/reasoning stream` 会将推理过程流式传输到草稿中，然后发送最终答案。

重试策略的默认设置和行为记录在[重试策略](/concepts/retry)中。

__标题1__ __内联代码0__（机器人运输）

通过设置机器人令牌和可选的准入控制来配置Discord机器人：
多账号支持位于`channels.discord.accounts`下（请参阅上文的多账号部分）。环境令牌仅适用于默认账号。

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,                          // clamp inbound media size
      allowBots: false,                       // allow bot-authored messages
      actions: {                              // tool action gates (false disables)
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false
      },
      replyToMode: "off",                     // off | first | all
      dm: {
        enabled: true,                        // disable all DMs when false
        policy: "pairing",                    // pairing | allowlist | open | disabled
        allowFrom: ["1234567890", "steipete"], // optional DM allowlist ("open" requires ["*"])
        groupEnabled: false,                 // enable group DMs
        groupChannels: ["openclaw-dm"]          // optional group DM allowlist
      },
      guilds: {
        "123456789012345678": {               // guild id (preferred) or slug
          slug: "friends-of-openclaw",
          requireMention: false,              // per-guild default
          reactionNotifications: "own",       // off | own | all | allowlist
          users: ["987654321098765432"],      // optional per-guild user allowlist
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only."
            }
          }
        }
      },
      historyLimit: 20,                       // include last N guild messages as context
      textChunkLimit: 2000,                   // optional outbound text chunk size (chars)
      chunkMode: "length",                    // optional chunking mode (length | newline)
      maxLinesPerMessage: 17,                 // soft max lines per message (Discord UI clipping)
      retry: {                                // outbound retry policy
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    }
  }
}
```

OpenClaw仅在存在`channels.discord`配置节时才启动Discord。令牌从`channels.discord.token`解析，其中`DISCORD_BOT_TOKEN`用作默认账户的后备（除非`channels.discord.enabled`等于`false`）。在为cron/CLI命令指定传递目标时，请使用`user:<id>`（私信）或`channel:<id>`（服务器频道）；纯数字ID含义不明确，将被拒绝。
服务器别名采用小写格式，并将空格替换为`-`；频道密钥使用别名化的频道名称（无前导`#`）。为避免重命名带来的歧义，建议使用服务器ID作为密钥。
默认情况下，机器人生成的消息会被忽略。可通过`channels.discord.allowBots`启用处理此类消息（自身消息仍会被过滤，以防止自我回复循环）。
反应通知模式：

- `off`: 无反应事件。
- `own`: 对机器人自身消息的反应（默认）。
- `all`: 对所有消息的所有反应。
- `allowlist`: 来自 `guilds.<id>.users` 对所有消息的反应（空列表将禁用）。

出站文本按`channels.discord.textChunkLimit`分块（默认为2000）。将`channels.discord.chunkMode="newline"`设置为在按长度分块之前按空行（段落边界）进行拆分。Discord客户端可能会截断高度过高的消息，因此`channels.discord.maxLinesPerMessage`（默认值为17）会在多行回复长度低于2000字符时仍将其拆分成多个部分。
重试策略的默认设置和行为记录在[重试策略](/concepts/retry)中。

__标题1__ __内联代码0__（聊天API Webhook）

Google Chat 通过具有应用级身份验证（服务账号）的 HTTP Webhook 运行。
多账户支持位于 `channels.googlechat.accounts` 下（请参阅上面的多账户部分）。环境变量仅适用于默认账户。

```json5
{
  channels: {
    "googlechat": {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url",             // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",        // optional; improves mention detection
      dm: {
        enabled: true,
        policy: "pairing",                // pairing | allowlist | open | disabled
        allowFrom: ["users/1234567890"]   // optional; "open" requires ["*"]
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true }
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20
    }
  }
}
```

注释：

- 服务帐号 JSON 可以是内联的 (`serviceAccount`) 或基于文件的 (`serviceAccountFile`)。
- 默认帐号的环境回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- `audienceType` + `audience` 必须与聊天应用的 Webhook 身份验证配置匹配。
- 设置投放目标时，请使用 `spaces/<spaceId>` 或 `users/<userId|email>`。

__标题1__ __行内代码0__（套接字模式）

Slack 以套接字模式运行，同时需要机器人令牌和应用令牌：

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["U123", "U456", "*"], // optional; "open" requires ["*"]
        groupEnabled: false,
        groupChannels: ["G123"]
      },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only."
        }
      },
      historyLimit: 50,          // include last N channel/group messages as context (0 disables)
      allowBots: false,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["U123"],
      replyToMode: "off",           // off | first | all
      thread: {
        historyScope: "thread",     // thread | channel
        inheritParent: false
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true
      },
      textChunkLimit: 4000,
      chunkMode: "length",
      mediaMaxMb: 20
    }
  }
}
```

多账户支持位于`channels.slack.accounts`下（请参阅上文的多账户部分）。环境令牌仅适用于默认账户。

当提供者已启用且两个令牌均已设置（通过配置或`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）时，OpenClaw会启动Slack。在为cron/CLI命令指定交付目标时，请使用`user:<id>`（私信）或`channel:<id>`。
将`channels.slack.configWrites: false`设置为阻止由Slack发起的配置写入操作（包括频道ID迁移和`/config set|unset`）。

机器人生成的消息默认会被忽略。可通过`channels.slack.allowBots`或`channels.slack.channels.<id>.allowBots`启用。

反应通知模式：

- `off`: 无反应事件。
- `own`: 对机器人自身消息的反应（默认）。
- `all`: 对所有消息的所有反应。
- `allowlist`: 来自 `channels.slack.reactionAllowlist` 对所有消息的反应（空列表将禁用）。

线程会话隔离：

- `channels.slack.thread.historyScope` 用于控制线程历史是按线程独立记录（`thread`，默认）还是在整个频道中共享（`channel`）。
- __INLINE_CODE_3__ 用于控制新线程会话是否继承父频道的对话记录（默认：false）。

Slack 操作组（网关`slack`工具操作）：
| 操作组 | 默认 | 备注 |
| --- | --- | --- |
| reactions | 已启用 | 反应 + 列出反应 |
| messages | 已启用 | 读取/发送/编辑/删除 |
| pins | 已启用 | 置顶/取消置顶/列出 |
| memberInfo | 已启用 | 成员信息 |
| emojiList | 已启用 | 自定义表情符号列表 |

__标题1__ __行内代码0__（机器人令牌）

Mattermost以插件形式提供，不随核心安装包一起打包。
请先安装它：`openclaw plugins install @openclaw/mattermost`（或从 Git 检出中使用 `./extensions/mattermost`）。

Mattermost 需要一个机器人令牌以及您服务器的基础 URL：

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      textChunkLimit: 4000,
      chunkMode: "length"
    }
  }
}
```

当账户已配置（包含机器人令牌和基础 URL）并启用时，OpenClaw 会启动 Mattermost。对于默认账户，令牌和基础 URL 将从 `channels.mattermost.botToken` + `channels.mattermost.baseUrl` 或 `MATTERMOST_BOT_TOKEN` + `MATTERMOST_URL` 中解析（除非 `channels.mattermost.enabled` 等于 `false`）。

聊天模式：

- `oncall`（默认）：仅在被@提及时回复频道消息。
- `onmessage`：回复所有频道消息。
- `onchar`：当消息以触发前缀开头时回复（`channels.mattermost.oncharPrefixes`，默认为`[">", "!"]`）。

访问控制：

- 默认私信：`channels.mattermost.dmPolicy="pairing"`（未知发件人会收到配对码）。
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。
- 群组：默认为 `channels.mattermost.groupPolicy="allowlist"`（需提及才能加入）。使用 `channels.mattermost.groupAllowFrom` 来限制发件人。

多账户支持位于`channels.mattermost.accounts`下（请参阅上方的多账户部分）。环境变量仅适用于默认账户。
在指定投放目标时，请使用`channel:<id>`或`user:<id>`（或`@username`）；裸ID被视为渠道ID。

### `channels.signal`（signal-cli）

信号反应可以发出系统事件（共享反应工具）：

```json5
{
  channels: {
    signal: {
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50 // include last N group messages as context (0 disables)
    }
  }
}
```

反应通知模式：

- `off`: 无反应事件。
- `own`: 对机器人自身消息的反应（默认）。
- `all`: 对所有消息的所有反应。
- `allowlist`: 来自 `channels.signal.reactionAllowlist` 对所有消息的反应（空列表将禁用）。

### `channels.imessage`（imsg CLI）

OpenClaw通过标准输入输出的JSON-RPC生成`imsg rpc`。无需守护进程或端口。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host", // SCP for remote attachments when using SSH wrapper
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,    // include last N group messages as context (0 disables)
      includeAttachments: false,
      mediaMaxMb: 16,
      service: "auto",
      region: "US"
    }
  }
}
```

多账户支持位于`channels.imessage.accounts`下（请参阅上面的多账户部分）。

注释：

- 需要对消息数据库拥有完全磁盘访问权限。
- 第一次发送时会提示您授予消息自动化权限。
- 优先使用`chat_id:<id>`目标。使用`imsg chats --limit 20`列出聊天。
- `channels.imessage.cliPath`可以指向一个包装脚本（例如，`ssh`指向另一台运行`imsg rpc`的Mac）；使用SSH密钥可避免出现密码提示。
- 对于远程SSH包装脚本，当__INLINE_CODE_6__启用时，将`channels.imessage.remoteHost`设置为通过SCP获取附件。

示例包装器：

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

### __INLINE_CODE_0__

设置代理用于文件操作的**单个全局工作区目录**。

默认：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } }
}
```

如果启用了`agents.defaults.sandbox`，非主会话可以使用其各自的`agents.defaults.sandbox.workspaceRoot`作用域工作区来覆盖此设置。

### __INLINE_CODE_0__

可选的仓库根目录，用于在系统提示符的运行时行中显示。如果未设置，OpenClaw 会尝试通过从工作区（以及当前工作目录）向上遍历来检测一个 `.git` 目录。只有存在的路径才能被使用。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } }
}
```

### __INLINE_CODE_0__

禁用工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md` 和 `BOOTSTRAP.md`）的自动创建。

在工作区文件来自代码库的预置部署中使用此选项。

```json5
{
  agents: { defaults: { skipBootstrap: true } }
}
```

### __INLINE_CODE_0__

在截断之前，每个工作区引导文件中可注入系统提示的最大字符数。默认值：`20000`。

当文件超出此限制时，OpenClaw会记录一条警告，并注入带有标记的截断头部或尾部。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } }
}
```

### __INLINE_CODE_0__

为**系统提示上下文**设置用户的时区（不适用于消息信封中的时间戳）。如果未设置，OpenClaw 将在运行时使用主机的时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } }
}
```

### __INLINE_CODE_0__

控制系统提示中“当前日期与时间”部分显示的**时间格式**。
默认：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } } // auto | 12 | 24
}
```

### __INLINE_CODE_0__

控制入站/出站前缀以及可选的确认响应。
有关排队、会话和流式上下文，请参阅[消息](/concepts/messages)。

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    removeAckAfterReply: false
  }
}
```

除非已存在，否则`responsePrefix`将应用于跨渠道的**所有出站回复**（工具摘要、分块流式传输、最终回复）。

如果未设置`messages.responsePrefix`，则默认不应用任何前缀。WhatsApp自助聊天回复是个例外：当设置时，默认为`[{identity.name}]`，否则为`[openclaw]`，以便同一部手机之间的对话保持可读。
将其设置为`"auto"`，以在设置时为路由座席推导出`[{identity.name}]`。

#### 模板变量

`responsePrefix` 字符串可以包含动态解析的模板变量：

| 变量 | 描述 | 示例 |
|----------|-------------|---------|
| `{model}` | 简短模型名称 | `claude-opus-4-5`、`gpt-4o` |
| `{modelFull}` | 完整模型标识符 | `anthropic/claude-opus-4-5` |
| `{provider}` | 提供商名称 | `anthropic`、`openai` |
| `{thinkingLevel}` | 当前思维层级 | `high`、`low`、`off` |
| `{identity.name}` | 代理身份名称 | （与`"auto"`模式相同）|

变量不区分大小写（`{MODEL}` = `{model}`）。`{think}` 是 `{thinkingLevel}` 的别名。
未解析的变量将保留为文本字面量。

```json5
{
  messages: {
    responsePrefix: "[{model} | think:{thinkingLevel}]"
  }
}
```

示例输出：`[claude-opus-4-5 | think:high] Here's my response...`

WhatsApp入站前缀通过`channels.whatsapp.messagePrefix`（已弃用：
`messages.messagePrefix`）进行配置。默认保持**不变**：当`channels.whatsapp.allowFrom`为空时为`"[openclaw]"`，否则为`""`（无前缀）。使用`"[openclaw]"`时，如果被路由的客服人员设置了`identity.name`，OpenClaw将改用`[{identity.name}]`。

`ackReaction` 会在支持表情反应的频道（Slack/Discord/Telegram/Google Chat）中发送尽力而为的表情反应，以确认收到的消息。默认使用已设置的当前坐席的 `identity.emoji`，否则使用 `"👀"`。将其设置为 `""` 可禁用此功能。

`ackReactionScope` 控制反应触发的时间：

- `group-mentions`（默认）：仅当群组/聊天室需要提及**且**机器人被提及时
- `group-all`：所有群组/聊天室消息
- `direct`：仅私信
- `all`：所有消息

`removeAckAfterReply` 在发送回复后移除机器人的确认反应
（仅适用于 Slack/Discord/Telegram/Google Chat）。默认值：`false`。

#### __INLINE_CODE_0__

为外发回复启用文本转语音功能。启用后，OpenClaw将使用ElevenLabs或OpenAI生成音频，并将其附加到回复中。Telegram使用Opus语音消息；其他渠道则发送MP3音频。

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all (include tool/block replies)
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true
      },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0
        }
      },
      openai: {
        apiKey: "openai_api_key",
        model: "gpt-4o-mini-tts",
        voice: "alloy"
      }
    }
  }
}
```

注释：

- `messages.tts.auto` 控制自动 TTS (`off`、`always`、`inbound`、`tagged`)。
- `messages.tts.enabled` 设置会话级别的自动模式（覆盖配置）。
- `messages.tts.enabled` 属于旧版；医生会将其迁移到 `messages.tts.auto`。
- `prefsPath` 存储本地覆盖设置（提供者/限制/总结）。
- `maxTextLength` 是 TTS 输入的硬性上限；摘要会被截断以适应此限制。
- `summaryModel` 用于覆盖自动摘要的 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或来自 `agents.defaults.models` 的别名。
- `modelOverrides` 启用模型驱动的覆盖，例如 `[[tts:...]]` 标签（默认启用）。
- `/tts limit` 和 `/tts summary` 控制每位用户的总结设置。
- `apiKey` 的值会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- `elevenlabs.baseUrl` 覆盖 ElevenLabs API 的基础 URL。
- `elevenlabs.voiceSettings` 支持 `stability`/`similarityBoost`/`style` (0..1)。

`useSpeakerBoost`，以及 `speed`（0.5..2.0）。

### __INLINE_CODE_0__

通话模式的默认设置（macOS/iOS/Android）。未设置时，语音ID会回退到`ELEVENLABS_VOICE_ID`或`SAG_VOICE_ID`。
未设置时，`apiKey`会回退到`ELEVENLABS_API_KEY`（或网关的 Shell 配置文件）。
`voiceAliases` 允许通话指令使用友好名称（例如 `"voice":"Clawd"`）。

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17"
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    interruptOnSpeech: true
  }
}
```

### __INLINE_CODE_0__

控制嵌入式代理运行时（模型/思考/详细信息/超时）。
`agents.defaults.models` 定义了配置的模型目录（并充当 `/model` 的白名单）。
`agents.defaults.model.primary` 设置默认模型；`agents.defaults.model.fallbacks` 是全局故障转移。
`agents.defaults.imageModel` 是可选的，且**仅在主模型缺少图像输入时使用**。
每个 `agents.defaults.models` 条目可以包含：

- `alias`（可选模型快捷方式，例如 `/opus`）。
- `params`（可选的提供商特定API参数，会传递到模型请求中）。

`params` 也适用于流式运行（嵌入式代理 + 压缩）。目前支持的键包括：`temperature`、`maxTokens`。这些键会与调用时选项合并；调用方提供的值优先。`temperature` 是一个高级控制开关——除非您了解模型的默认设置并确实需要进行更改，否则请保持未设置状态。

示例：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-5-20250929": {
          params: { temperature: 0.6 }
        },
        "openai/gpt-5.2": {
          params: { maxTokens: 8192 }
        }
      }
    }
  }
}
```

Z.AI GLM-4.x 模型会自动启用思考模式，除非您：

- 设置 `--thinking off`，或
- 自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。

OpenClaw还附带了一些内置的别名快捷方式。默认设置仅在模型已存在于`agents.defaults.models`中时生效。

- `opus` 转换为 `anthropic/claude-opus-4-5`
- `sonnet` 转换为 `anthropic/claude-sonnet-4-5`
- `gpt` 转换为 `openai/gpt-5.2`
- `gpt-mini` 转换为 `openai/gpt-5-mini`
- `gemini` 转换为 `google/gemini-3-pro-preview`
- `gemini-flash` 转换为 `google/gemini-3-flash-preview`

如果您自行配置相同的别名（不区分大小写），则以您的设置为准（默认值绝不会被覆盖）。

示例：主模型为 Opus 4.5，备选模型为 MiniMax M2.1（托管的 MiniMax）：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" }
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"]
      }
    }
  }
}
```

MiniMax 认证：设置 `MINIMAX_API_KEY`（环境）或配置 `models.providers.minimax`。

__标题1__ __行内代码0__（CLI 备用）

用于纯文本回退运行（不调用工具）的可选 CLI 后端。当 API 提供商出现故障时，这些后端可用作备用路径。在您配置一个接受文件路径的`imageArg`时，支持图像直通。

注释：

- CLI 后端采用“文本优先”设计；工具始终处于禁用状态。
- 当设置 `sessionArg` 时，会话功能可用；会话 ID 按后端持久化存储。
- 对于 `claude-cli`，已内置默认配置。如果 PATH 非常精简，请覆盖命令路径。

（launchd/systemd）。

示例：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude"
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat"
        }
      }
    }
  }
}
```

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "anthropic/claude-sonnet-4-1": { alias: "Sonnet" },
        "openrouter/deepseek/deepseek-r1:free": {},
        "zai/glm-4.7": {
          alias: "GLM",
          params: {
            thinking: {
              type: "enabled",
              clear_thinking: false
            }
          }
        }
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: [
          "openrouter/deepseek/deepseek-r1:free",
          "openrouter/meta-llama/llama-3.3-70b-instruct:free"
        ]
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: [
          "openrouter/google/gemini-2.0-flash-vision:free"
        ]
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      heartbeat: {
        every: "30m",
        target: "last"
      },
      maxConcurrent: 3,
      subagents: {
        model: "minimax/MiniMax-M2.1",
        maxConcurrent: 1,
        archiveAfterMinutes: 60
      },
      exec: {
        backgroundMs: 10000,
        timeoutSec: 1800,
        cleanupMs: 1800000
      },
      contextTokens: 200000
    }
  }
}
```

__标题1__ __内联代码0__（工具结果修剪）

在向 LLM 发送请求之前，从内存中的上下文中清除**旧工具结果**。
它**不会**修改磁盘上的会话历史记录（`*.jsonl` 保持完整）。

此举旨在减少那些会随时间累积大量工具输出的“健谈”智能体对令牌的使用。

高级：

- 绝不会触及用户或助手的消息。
- 保留最后`keepLastAssistants`条助手消息（该点之后的工具结果不会被修剪）。
- 保留引导前缀（在第一条用户消息之前的内容不会被修剪）。
- 模式：
  - `adaptive`：当估计的上下文比例超过`softTrimRatio`时，对过大的工具结果进行软修剪（保留开头和结尾部分）。

然后，当估计的上下文比例超过 `hardClearRatio` **且**
有足够的可修剪工具结果批量 (`minPrunableToolChars`) 时，系统会硬清除最旧的符合条件的工具结果。

- `aggressive`：始终用`hardClear.placeholder`替换截止时间前符合条件的工具结果（不进行比例检查）。

软修剪与硬修剪（发送给大语言模型的上下文有何变化）：

- **软截断**：仅适用于*超大*工具结果。保留开头和结尾，并在中间插入 `...`。
  - 前：`toolResult("…very long output…")`
  - 后：`toolResult("HEAD…\n...\n…TAIL\n\n[Tool result trimmed: …]")`
- **硬清除**：用占位符替换整个工具结果。
  - 前：`toolResult("…very long output…")`
  - 后：`toolResult("[Old tool result content cleared]")`

注意事项/当前限制：

- 目前，包含**图像块的工具结果会被跳过**（永远不会被修剪或清除）。
- 估算的“上下文比例”基于**字符数**（近似值），而非精确的标记数。
- 如果会话中尚未包含至少`keepLastAssistants`条助手消息，则跳过修剪操作。
- 在`hardClear.enabled`模式下，`hardClear.enabled`会被忽略（符合条件的工具结果始终会被替换为`hardClear.placeholder`）。

默认（自适应）：

```json5
{
  agents: { defaults: { contextPruning: { mode: "adaptive" } } }
}
```

要禁用：

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } }
}
```

默认值（当`mode`为`"adaptive"`或`"aggressive"`时）：

- `keepLastAssistants`: `3`
- `0.3`: `0.3`（仅自适应）
- `hardClearRatio`: `0.5`（仅自适应）
- `minPrunableToolChars`: `50000`（仅自适应）
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`（仅自适应）
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

示例（激进，极简）：

```json5
{
  agents: { defaults: { contextPruning: { mode: "aggressive" } } }
}
```

示例（自适应调谐）：

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "adaptive",
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        // Optional: restrict pruning to specific tools (deny wins; supports "*" wildcards)
        tools: { deny: ["browser", "canvas"] },
      }
    }
  }
}
```

有关行为详情，请参阅 [/concepts/session-pruning](/concepts/session-pruning)。

#### __行内代码_0__（预留余量 + 内存刷新）

`agents.defaults.compaction.mode` 选择压缩汇总策略。默认为 `default`；设置 `safeguard` 可为超长历史启用分块汇总。请参阅 [/concepts/compaction](/concepts/compaction)。

`agents.defaults.compaction.reserveTokensFloor` 对 Pi 压缩施加一个最小 `reserveTokens` 值（默认：`20000`）。将其设置为 `0` 以禁用下限。

`agents.defaults.compaction.memoryFlush` 在自动压缩之前执行一个**静默**的代理回合，指示模型将持久记忆存储到磁盘上（例如
`memory/YYYY-MM-DD.md`）。当会话令牌估算值低于压缩限制的软阈值时，此操作会被触发。

遗留默认值：

- `memoryFlush.enabled`: `true`
- `4000`: `4000`
- `memoryFlush.prompt` / `memoryFlush.systemPrompt`: 内置默认值，使用 `NO_REPLY`
- 注意：当会话工作区为只读时，将跳过内存刷新

（`agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"`）。

示例（调优）：

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard",
        reserveTokensFloor: 24000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

阻止流媒体：

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（默认关闭）。
- 频道覆盖：使用 `*.blockStreaming`（以及按账户变体）来强制启用或禁用直播屏蔽。

非Telegram频道需要显式设置`*.blockStreaming: true`才能启用屏蔽回复。

- `agents.defaults.blockStreamingBreak`: `"message_end"` 或 `"message_end"`（默认：text_end）。
- `agents.defaults.blockStreamingChunk`: 用于流式块的软分块。默认为

800–1200字符，优先使用段落分隔(`\n\n`)，其次使用换行，最后使用句子。
示例：

  ```json5
  {
    agents: { defaults: { blockStreamingChunk: { minChars: 800, maxChars: 1200 } } }
  }
  ```

- `agents.defaults.blockStreamingCoalesce`: 在发送前合并流式块。

默认为 `{ idleMs: 1000 }`，并从 `blockStreamingChunk` 继承 `minChars`
其中 `maxChars` 会被限制在频道文本上限内。Signal/Slack/Discord/Google Chat 默认为
`minChars: 1500`，除非被覆盖。
频道覆盖设置：`channels.whatsapp.blockStreamingCoalesce`、`channels.telegram.blockStreamingCoalesce`、
`channels.discord.blockStreamingCoalesce`、`channels.slack.blockStreamingCoalesce`、`channels.mattermost.blockStreamingCoalesce`、
`channels.signal.blockStreamingCoalesce`、`channels.imessage.blockStreamingCoalesce`、`channels.msteams.blockStreamingCoalesce`、
`channels.googlechat.blockStreamingCoalesce`（以及按账户区分的变体）。

- `agents.defaults.humanDelay`：在首次之后的**区块回复**之间进行随机暂停。

模式：`off`（默认）、`natural`（800–2500毫秒）、`custom`（使用 `minMs`/`maxMs`）。
单个座席覆盖：`agents.list[].humanDelay`。
示例：

  ```json5
  {
    agents: { defaults: { humanDelay: { mode: "natural" } } }
  }
  ```

有关行为和分块的详细信息，请参阅 [/concepts/streaming](/concepts/streaming)。

打字指示器：

- `agents.defaults.typingMode`: `"never" | "instant" | "thinking" | "message"`。默认为

`instant` 用于直接聊天/提及，`message` 用于未提及的群聊。

- `session.typingMode`: 会话级别的模式覆盖。
- `agents.defaults.typingIntervalSeconds`: 输入信号的刷新频率（默认：6秒）。
- `session.typingIntervalSeconds`: 会话级别的刷新间隔覆盖。

有关行为详情，请参阅 [/concepts/typing-indicators](/concepts/typing-indicators)。

`agents.defaults.model.primary` 应设置为 `provider/model`（例如 `anthropic/claude-opus-4-5`）。
别名来自 `agents.defaults.models.*.alias`（例如 `Opus`）。
如果您省略提供商，OpenClaw 当前会暂时将 `anthropic` 用作弃用回退。
Z.AI 模型以 `zai/<model>` 的形式提供（例如 `zai/glm-4.7`），并且需要在环境中使用 `ZAI_API_KEY`（或旧版 `Z_AI_API_KEY`）。

`agents.defaults.heartbeat` 配置定期心跳运行：

- `every`: 持续时间字符串 (`ms`, `s`, `m`, `h`)；默认单位为分钟。默认：

`30m`。将 `0m` 设置为禁用。

- `model`: 心跳运行的可选覆盖模型 (`provider/model`)。
- `true`: 当 `true` 为真时，心跳在可用的情况下还会发送单独的 `Reasoning:` 消息（形状与 `/reasoning on` 相同）。默认值：`false`。
- `session`: 可选会话密钥，用于控制心跳在哪个会话中运行。默认值：`main`。
- `to`: 可选收件人覆盖（特定于渠道的 ID，例如 WhatsApp 的 E.164、Telegram 的聊天 ID）。
- `target`: 可选投递渠道 (`last`、`whatsapp`、`telegram`、`discord`、`slack`、`msteams`、`signal`、`imessage`、`none`)。默认值：`last`。
- `prompt`: 心跳正文的可选覆盖（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。覆盖内容按原样发送；如果您仍希望读取文件，请包含一行 `Read HEARTBEAT.md`。
- `ackMaxChars`: 在投递前允许的 `HEARTBEAT_OK` 后的最大字符数（默认：300）。

每个代理的心跳：

- 将`agents.list[].heartbeat`设置为启用或覆盖特定代理的心跳设置。
- 如果任何代理条目定义了`heartbeat`，则**仅这些代理**会运行心跳；默认设置

成为这些智能体的共同基线。

心跳会消耗完整代理回合。间隔越短，消耗的代币越多；请留意`every`，尽量保持`HEARTBEAT.md`很小，和/或选择更便宜的`model`。

`tools.exec` 配置后台执行默认设置：

- `backgroundMs`: 自动转入后台前的等待时间（毫秒，默认10000）
- `cleanupMs`: 在此运行时长后自动终止（秒，默认1800）
- `cleanupMs`: 已完成会话在内存中保留的时间（毫秒，默认1800000）
- `notifyOnExit`: 当后台执行退出时，将系统事件加入队列并请求心跳（默认true）
- `applyPatch.enabled`: 启用实验性 `apply_patch`（仅适用于OpenAI/OpenAI Codex；默认false）
- `applyPatch.allowModels`: 可选的模型ID白名单（例如 `gpt-5.2` 或 `openai/gpt-5.2`）

注意：`applyPatch` 仅位于 `tools.exec` 下。

`tools.web` 配置网页搜索 + 获取工具：

- `tools.web.search.enabled`（默认：当密钥存在时为 true）
- `tools.web.search.apiKey`（推荐：通过 `openclaw configure --section web` 设置，或使用 `BRAVE_API_KEY` 环境变量）
- `tools.web.search.maxResults`（1–10，默认 5）
- `tools.web.search.timeoutSeconds`（默认 30）
- `tools.web.search.cacheTtlMinutes`（默认 15）
- `tools.web.fetch.enabled`（默认 true）
- `tools.web.fetch.maxChars`（默认 50000）
- `tools.web.fetch.timeoutSeconds`（默认 30）
- `tools.web.fetch.cacheTtlMinutes`（默认 15）
- `tools.web.fetch.userAgent`（可选覆盖）
- `tools.web.fetch.readability`（默认 true；禁用以仅使用基本 HTML 清理）
- `tools.web.fetch.firecrawl.enabled`（当设置了 API 密钥时默认为 true）
- `tools.web.fetch.firecrawl.apiKey`（可选；默认为 `FIRECRAWL_API_KEY`）
- `tools.web.fetch.firecrawl.baseUrl`（默认 https://api.firecrawl.dev）
- `tools.web.fetch.firecrawl.onlyMainContent`（默认 true）
- `tools.web.fetch.firecrawl.maxAgeMs`（可选）
- `tools.web.fetch.firecrawl.timeoutSeconds`（可选）

`tools.media` 配置入站媒体理解（图像/音频/视频）：

- `tools.media.models`: 共享模型列表（按能力标记；在各能力专用列表之后使用）。
- `tools.media.image`: 最大并发能力运行数（默认值为2）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - `enabled`: 选择退出开关（当模型已配置时，默认为真）。
  - `prompt`: 可选的提示覆盖（图像/视频会自动附加一个 `maxChars` 提示）。
  - `maxChars`: 最大输出字符数（图像/视频默认为500；音频未设置）。
  - `maxBytes`: 要发送的媒体最大尺寸（默认值：图像10MB，音频20MB，视频50MB）。
  - `timeoutSeconds`: 请求超时时间（默认值：图像60秒，音频60秒，视频120秒）。
  - `language`: 可选的音频提示。
  - `attachments`: 附件策略（`mode`、`maxAttachments`、`prefer`）。
  - `scope`: 可选的门控机制（首个匹配项优先），可与 `match.channel`、`match.chatType` 或 `match.keyPrefix` 结合使用。
  - `models`: 模型条目的有序列表；如果某个条目失败或媒体超出大小限制，则回退到下一个条目。
- 每个 `models[]` 条目：
  - 提供商条目（`type: "provider"` 或省略）：
    - `provider`: API提供商ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）。
    - `model`: 模型ID覆盖（图像必填；音频提供商默认为 `gpt-4o-mini-transcribe`/`whisper-large-v3-turbo`，视频默认为 `gemini-3-flash-preview`）。
    - `profile` / `preferredProfile`: 认证配置文件选择。
  - CLI条目（`type: "cli"`）：
    - `command`: 要运行的可执行文件。
    - `args`: 模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）。
  - `capabilities`: 可选的列表（`image`、`audio`、`video`），用于对共享条目进行门控。省略时的默认设置为：`openai`/`anthropic`/`minimax` → 图像，`google` → 图像+音频+视频，`groq` → 音频。
  - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language` 可以在每个条目中单独覆盖。

如果未配置任何模型（或为`enabled: false`），则跳过理解步骤；模型仍会收到原始附件。

提供商身份验证遵循标准的身份验证顺序模型（身份验证配置文件、环境变量，如 `OPENAI_API_KEY`/`GROQ_API_KEY`/`GEMINI_API_KEY` 或 `models.providers.*.apiKey`）。

示例：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }]
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ]
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }]
      }
    }
  }
}
```

`agents.defaults.subagents` 配置子代理默认设置：

- `model`: 用于生成的子代理的默认模型（字符串或`maxConcurrent`）。如果省略，子代理将继承调用方的模型，除非按代理或按调用单独覆盖。
- `maxConcurrent`: 最大并发子代理运行数（默认值为1）
- `archiveAfterMinutes`: 在N分钟后自动归档子代理会话（默认值为60；设置__INLINE_CODE_4__可禁用）
- 每个子代理的工具策略：__INLINE_CODE_5__ / __INLINE_CODE_6__（拒绝优先）

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置了一个**基础工具白名单**：

- `minimal`：仅适用于 `session_status`
- `coding`：适用于 `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`
- `messaging`：适用于 `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`
- `full`：无限制（与未设置相同）

每个代理的覆盖：`agents.list[].tools.profile`。

示例（默认仅支持消息功能，也允许使用 Slack 和 Discord 工具）：

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"]
  }
}
```

示例（编码配置文件，但在任何地方都拒绝执行/进程）：

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"]
  }
}
```

`tools.byProvider` 允许您**进一步限制**特定提供商（或单个 `provider/model`）的工具。
按代理覆盖：`agents.list[].tools.byProvider`。

顺序：基础配置文件 → 提供商配置文件 → 允许/拒绝策略。
提供程序密钥可接受`provider`（例如`google-antigravity`）或`provider/model`（例如`openai/gpt-5.2`）。

示例（保留全局编码配置文件，但为谷歌反重力配备最少的工具）：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" }
    }
  }
}
```

示例（提供商/型号特定的白名单）：

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] }
    }
  }
}
```

`tools.allow` / `tools.deny` 配置全局工具允许/拒绝策略（拒绝优先）。
匹配不区分大小写，并支持 `*` 通配符（`"*"` 表示所有工具）。
即使 Docker 沙盒处于**关闭**状态，此设置仍会生效。

示例（在所有地方禁用浏览器/画布）：

```json5
{
  tools: { deny: ["browser", "canvas"] }
}
```

工具组（快捷方式）适用于**全局**和**按代理**的工具策略：

- `group:runtime`: `exec`, `process`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 所有内置 OpenClaw 工具（不包括提供商插件）

`tools.elevated` 控制提升的（主机）执行访问：

- `enabled`: 允许提升模式（默认为 true）
- `allowFrom`: 每频道白名单列表（空 = 禁用）
  - `whatsapp`: E.164 号码
  - `telegram`: 聊天 ID 或用户名
  - `discord`: 用户 ID 或用户名（如未指定，则回退到 `channels.discord.dm.allowFrom`)
  - `signal`: E.164 号码
  - `imessage`: 句柄/聊天 ID
  - `webchat`: 会话 ID 或用户名

示例：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["steipete", "1234567890123"]
      }
    }
  }
}
```

按代理覆盖（进一步限制）：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        tools: {
          elevated: { enabled: false }
        }
      }
    ]
  }
}
```

注释：

- `tools.elevated` 是全局基线。`agents.list[].tools.elevated` 只能进一步限制（两者都必须允许）。
- `/elevated on|off|ask|full` 按会话密钥存储状态；内联指令仅适用于单条消息。
- 提升的 `exec` 在主机上运行，并绕过沙箱机制。
- 工具策略仍然适用；如果 `exec` 被拒绝，则无法使用提升权限的功能。

`agents.defaults.maxConcurrent` 设置可在会话间并行执行的最大嵌入式代理运行数。每个会话仍按顺序执行（每次一个会话密钥对应一个运行）。默认值：1。

### __INLINE_CODE_0__

为嵌入式代理提供可选的**Docker 沙箱**。专为非主会话设计，以防止其访问您的主机系统。

详情：[沙箱化](/gateway/sandboxing)

默认设置（如果启用）：

- 范围：`"agent"`（每个代理一个容器 + 工作区）
- 基于 Debian bookworm-slim 的镜像
- 代理工作区访问权限：`workspaceAccess: "none"`（默认）
  - `"none"`：在 `~/.openclaw/sandboxes` 下使用按范围隔离的沙盒工作区
- `"ro"`：将沙盒工作区保留在 `/workspace`，并将代理工作区以只读方式挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）
  - `"rw"`：将代理工作区以读写方式挂载到 `/workspace`
- 自动清理：空闲超过 24 小时或存在时间超过 7 天
- 工具策略：仅允许 `exec`、`process`、`read`、`write`、`edit`、`apply_patch`、`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`（拒绝优先）
  - 通过 `tools.sandbox.tools` 进行配置，可通过 `agents.list[].tools.sandbox.tools` 对单个代理进行覆盖
  - 沙盒策略中支持的工具组简写：`group:runtime`、`group:fs`、`group:sessions`、`group:memory`（参见 [沙盒策略 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands))
- 可选的沙盒浏览器（Chromium + CDP，noVNC 观察器）
- 强化选项：`network`、`user`、`pidsLimit`、`memory`、`cpus`、`ulimits`、`seccompProfile`、`apparmorProfile`

警告：`scope: "shared"` 表示共享容器和共享工作区。不存在跨会话隔离。如需实现每会话隔离，请使用 `scope: "session"`。

遗留：`perSession` 仍受支持（`scope: "session"` → `scope: "session"`，
`false` → `scope: "shared"`）。

`setupCommand` 在容器创建后**仅运行一次**（通过 `sh -lc` 在容器内部运行）。
对于软件包安装，请确保具备网络出口、可写根文件系统和 root 用户。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          // Per-agent override (multi-agent): agents.list[].sandbox.docker.*
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/var/run/docker.sock:/var/run/docker.sock", "/home/user/source:/source:rw"]
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          containerPrefix: "openclaw-sbx-browser-",
          cdpPort: 9222,
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          allowedControlUrls: ["http://10.0.0.42:18791"],
          allowedControlHosts: ["browser.lab.local", "10.0.0.42"],
          allowedControlPorts: [18791],
          autoStart: true,
          autoStartTimeoutMs: 12000
        },
        prune: {
          idleHours: 24,  // 0 disables idle pruning
          maxAgeDays: 7   // 0 disables max-age pruning
        }
      }
    }
  },
  tools: {
    sandbox: {
      tools: {
        allow: ["exec", "process", "read", "write", "edit", "apply_patch", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"]
      }
    }
  }
}
```

使用以下命令一次性构建默认沙盒镜像：

```bash
scripts/sandbox-setup.sh
```

注意：沙箱容器默认使用 `network: "none"`；如果代理需要出站访问，请将 `agents.defaults.sandbox.docker.network` 设置为 `"bridge"`（或您的自定义网络）。

注意：入站附件会暂存在活动工作区中，路径为 `media/inbound/*`。借助 `workspaceAccess: "rw"`，这意味着文件会被写入代理工作区。

注意：`docker.binds` 挂载了额外的主机目录；全局绑定和每个代理的绑定会被合并。

使用以下命令构建可选的浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

当`agents.defaults.sandbox.browser.enabled=true`时，浏览器工具会使用沙箱化的Chromium实例（CDP）。如果启用了noVNC（在headless=false时为默认设置），noVNC URL会被注入到系统提示中，以便代理可以引用它。这不需要在主配置中包含`browser.enabled`；沙箱控制URL是按会话注入的。

`agents.defaults.sandbox.browser.allowHostControl`（默认：false）允许沙箱会话通过浏览器工具 (`target: "host"`) 显式瞄准**主机**浏览器控件服务器。如果您需要严格的沙箱隔离，请将其关闭。

远程控制白名单：

- `allowedControlUrls`：允许用于`allowedControlHosts`的精确控制网址。
- `allowedControlHosts`：允许的主机名（仅限主机名，不包含端口）。
- `allowedControlPorts`：允许的端口（默认值：http=80，https=443）。

默认值：未设置任何白名单（无限制）。`allowHostControl` 默认为 false。

__标题1__ __内联代码0__（自定义提供商 + 基础URL）

OpenClaw 使用 **pi-coding-agent** 模型目录。您可以通过编写 `~/.openclaw/agents/<agentId>/agent/models.json`，或在 OpenClaw 配置中的 `models.providers` 下定义相同的模式，来添加自定义提供商（LiteLLM、本地兼容 OpenAI 的服务器、Anthropic 代理等）。
按提供商划分的概览与示例：[/concepts/model-providers](/concepts/model-providers)。

当`models.providers`存在时，OpenClaw会在启动时将一个`models.json`写入或合并到`~/.openclaw/agents/<agentId>/agent/`中：

- 默认行为：**合并**（保留现有提供者，按名称覆盖）
- 将 `models.mode: "replace"` 设置为覆盖文件内容

通过`agents.defaults.model.primary`（提供商/模型）选择模型。

```json5
{
  agents: {
    defaults: {
      model: { primary: "custom-proxy/llama-3.1-8b" },
      models: {
        "custom-proxy/llama-3.1-8b": {}
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions",
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000
          }
        ]
      }
    }
  }
}
```

OpenCode Zen（多模型代理）

OpenCode Zen是一个具有单模型端点的多模型网关。OpenClaw使用pi-ai内置的`opencode`提供商；请从https://opencode.ai/auth.设置__INLINE_CODE_1__（或__INLINE_CODE_2__）。

注释：

- 模型引用使用 `opencode/<modelId>`（示例：`opencode/claude-opus-4-5`）。
- 如果您通过 `agents.defaults.models` 启用白名单，请添加您计划使用的所有模型。
- 快捷方式：`openclaw onboard --auth-choice opencode-zen`。

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-5" },
      models: { "opencode/claude-opus-4-5": { alias: "Opus" } }
    }
  }
}
```

Z.AI（GLM-4.7）——支持提供者别名

Z.AI 模型可通过内置的 `zai` 提供商获取。在您的环境中设置 `ZAI_API_KEY`，并按提供商标识/模型标识引用该模型。

快捷方式：`openclaw onboard --auth-choice zai-api-key`。

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} }
    }
  }
}
```

注释：

- `z.ai/*` 和 `z-ai/*` 是被接受的别名，并会被规范化为 `zai/*`。
- 如果缺少 `ZAI_API_KEY`，对 `zai/*` 的请求将在运行时因身份验证错误而失败。
- 示例错误：`No API key found for provider "zai".`
- Z.AI 的通用 API 端点是 `https://api.z.ai/api/paas/v4`。GLM 编码

请求使用专用的 Coding 端点 `https://api.z.ai/api/coding/paas/v4`。
内置的 `zai` 提供程序使用 Coding 端点。如果您需要通用端点，请在 `models.providers` 中定义一个自定义提供程序，并通过覆盖基础 URL 来实现（请参阅上面的自定义提供程序部分）。

- 在文档和配置中使用虚假占位符；切勿提交真实的API密钥。

登月人工智能（Kimi）

使用与OpenAI兼容的Moonshot端点：

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } }
    }
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

注释：

- 在环境中设置 `MOONSHOT_API_KEY`，或使用 `openclaw onboard --auth-choice moonshot-api-key`。
- 模型引用：`moonshot/kimi-k2.5`。
- 如果需要中国端点，请使用 `https://api.moonshot.cn/v1`。

基米编码

使用Moonshot AI的Kimi编码端点（与Anthropic兼容，内置提供商）：

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } }
    }
  }
}
```

注释：

- 在环境中设置 `KIMI_API_KEY`，或使用 `openclaw onboard --auth-choice kimi-code-api-key`。
- 模型引用：`kimi-coding/k2p5`。

合成的（与人类兼容的）

使用Synthetic的Anthropic兼容端点：

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.1": { alias: "MiniMax M2.1" } }
    }
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536
          }
        ]
      }
    }
  }
}
```

注释：

- 设置 `SYNTHETIC_API_KEY` 或使用 `openclaw onboard --auth-choice synthetic-api-key`。
- 模型引用：`synthetic/hf:MiniMaxAI/MiniMax-M2.1`。
- 基础 URL 应省略 `/v1`，因为 Anthropic 客户端会自动添加它。

本地模型（LM Studio）——推荐设置

有关当前本地指南，请参阅[/gateway/local-models](/gateway/local-models)。简而言之：在性能强劲的硬件上通过 LM Studio Responses API 运行 MiniMax M2.1；同时将托管模型保持合并状态，以备不时之需。

迷你麦克斯 M2.1

直接使用 MiniMax M2.1，无需 LM Studio：

```json5
{
  agent: {
    model: { primary: "minimax/MiniMax-M2.1" },
    models: {
      "anthropic/claude-opus-4-5": { alias: "Opus" },
      "minimax/MiniMax-M2.1": { alias: "Minimax" }
    }
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            // Pricing: update in models.json if you need exact cost tracking.
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

注释：

- 设置`MINIMAX_API_KEY`环境变量或使用`openclaw onboard --auth-choice minimax-api`。
- 可用模型：`MiniMax-M2.1`（默认）。
- 如果需要精确的成本跟踪，请在`models.json`中更新定价。

塞瑞布拉斯（GLM 4.6 / 4.7）

通过Cerebras的OpenAI兼容端点使用：

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"]
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" }
        ]
      }
    }
  }
}
```

注释：

- 对于Cerebras，请使用`cerebras/zai-glm-4.7`；对于Z.AI Direct，请使用`zai/glm-4.7`。
- 在环境或配置中设置`CEREBRAS_API_KEY`。

注释：

- 支持的 API：`openai-completions`、`openai-responses`、`anthropic-messages`、

  `google-generative-ai`

- 对于自定义身份验证需求，使用 `authHeader: true` + `headers`。
- 使用 `OPENCLAW_AGENT_DIR`（或 `PI_CODING_AGENT_DIR`）覆盖代理配置根。

如果您想将`models.json`存储在其他位置（默认：`~/.openclaw/agents/main/agent`）。

### __INLINE_CODE_0__

控制会话作用域、重置策略、重置触发器，以及会话存储的写入位置。

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main",
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"]
    },
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      dm: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 }
    },
    resetTriggers: ["/new", "/reset"],
    // Default is already per-agent under ~/.openclaw/agents/<agentId>/sessions/sessions.json
    // You can override with {agentId} templating:
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    // Direct chats collapse to agent:<agentId>:<mainKey> (default: "main").
    mainKey: "main",
    agentToAgent: {
      // Max ping-pong reply turns between requester/target (0–5).
      maxPingPongTurns: 5
    },
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } }
      ],
      default: "allow"
    }
  }
}
```

字段：

- `mainKey`: 直聊桶键（默认：`"main"`）。当您想在不更改 `agentId` 的情况下“重命名”主私信线程时，此键非常有用。
  - 沙盒说明：`mainKey` 使用此键来检测主会话。任何与 `mainKey` 不匹配的会话键（群组/频道）都会被置于沙盒中。
- `dmScope`: 定义私信会话的分组方式（默认：`"main"`）。
  - `main`: 所有私信共享主会话以保持连续性。
  - `per-peer`: 在不同频道之间按发送者 ID 隔离私信。
  - `per-channel-peer`: 在每个频道内按发送者隔离私信（推荐用于多用户收件箱）。
  - `per-account-channel-peer`: 在每个账户、频道和发送者之间隔离私信（推荐用于多账户收件箱）。
- `identityLinks`: 将规范 ID 映射到带有提供商前缀的对等方，以便在使用 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 时，同一个人在不同频道间共享同一个私信会话。
  - 示例：`alice: ["telegram:123456789", "discord:987654321012345678"]`。
- `reset`: 主重置策略。默认为每日重置，时间在当地网关主机的凌晨 4:00。
  - `mode`: `daily` 或 `idle`（当存在 `reset` 时，默认为 `daily`）。
  - `atHour`: 每日重置边界的本地小时数（0–23）。
  - `idleMinutes`: 以分钟为单位的滑动空闲窗口。如果同时配置了每日重置和空闲重置，则先到期的规则优先生效。
- `resetByType`: 为 `dm`、`group` 和 `thread` 提供的会话级覆盖设置。
  - 如果您仅设置了旧版 `session.idleMinutes` 而未设置任何 `reset`/`resetByType`，OpenClaw 会出于向后兼容性而保持仅空闲模式。
- `heartbeatIdleMinutes`: 心跳检查的可选空闲覆盖设置（启用后仍适用每日重置）。
- `agentToAgent.maxPingPongTurns`: 请求者与目标之间的最大回复轮次（0–5，默认为 5）。
- `sendPolicy.default`: 当没有规则匹配时使用的 `allow` 或 `deny` 备用规则。
- `sendPolicy.rules[]`: 根据 `channel`、`chatType`（`direct|group|room`）或 `keyPrefix`（例如 `cron:`）进行匹配。首个拒绝规则优先；否则允许通过。

__标题1__ __内联代码0__（技能配置）

捆绑控件允许设置白名单、安装偏好、额外技能文件夹以及按技能的覆盖设置。适用于**捆绑**技能和`~/.openclaw/skills`（在名称冲突时，工作区技能仍具有优先权）。

字段：

- `allowBundled`：仅适用于**捆绑**技能的可选白名单。如果设置，则仅允许这些…

捆绑技能符合条件（受管/工作区技能不受影响）。

- `load.extraDirs`: 要扫描的附加技能目录（优先级最低）。
- `install.nodeManager`: 在可用时优先使用 Homebrew 安装程序（默认：true）。
- `install.nodeManager`: Node 安装程序偏好（`npm` | `pnpm` | `yarn`，默认：npm）。
- `entries.<skillKey>`: 各技能的配置覆盖。

按技能字段：

- `enabled`: 将 `env` 设置为禁用某个技能，即使该技能已绑定或安装。
- `env`: 为代理运行注入的环境变量（仅在尚未设置时生效）。
- `apiKey`: 为声明主要环境变量的技能提供的可选便利功能（例如 `nano-banana-pro` → `GEMINI_API_KEY`）。

示例：

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: [
        "~/Projects/agent-scripts/skills",
        "~/Projects/oss/some-skill-pack/skills"
      ]
    },
    install: {
      preferBrew: true,
      nodeManager: "npm"
    },
    entries: {
      "nano-banana-pro": {
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE"
        }
      },
      peekaboo: { enabled: true },
      sag: { enabled: false }
    }
  }
}
```

__标题1__ __内联代码0__（扩展）

控制插件的发现、允许/拒绝以及每个插件的配置。插件从`~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`以及任何`plugins.load.paths`条目中加载。**配置更改需要重启网关。**
有关完整用法，请参阅[/plugin](/plugin)。

字段：

- `enabled`: 插件加载的主开关（默认：true）。
- `deny`: 可选的插件 ID 允许列表；设置后，仅加载列出的插件。
- `deny`: 可选的插件 ID 拒绝列表（拒绝优先）。
- `load.paths`: 需要额外加载的插件文件或目录（绝对路径或 `~`)。
- `entries.<pluginId>`: 各插件的覆盖配置。
  - `enabled`: 将 `false` 设置为禁用。
  - `config`: 插件特定的配置对象（如果提供，则由插件进行验证）。

示例：

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"]
    },
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio"
        }
      }
    }
  }
}
```

### `browser`（由OpenClaw管理的浏览器）

OpenClaw可以为OpenClaw启动一个**专用且隔离的**Chrome/Brave/Edge/Chromium实例，并公开一个小型环回控制服务。
通过`profiles.<name>.cdpUrl`，配置文件可以指向一个**远程**基于Chromium的浏览器。远程配置文件仅支持附加模式（启动、停止和重置功能已被禁用）。

`browser.cdpUrl` 仍用于旧版单配置文件配置，并作为仅设置 `cdpPort` 的配置文件的基础方案/主机。

默认：

- 已启用：`true`
- 评估已启用：`true`（将 `false` 设置为禁用 `act:evaluate` 和 `wait --fn`）
- 控制服务：仅环回（端口源自 `gateway.port`，默认为 `18791`）
- CDP URL：`http://127.0.0.1:18792`（控制服务 + 1，旧版单配置文件）
- 配置文件颜色：`#FF4500`（龙虾橙）
- 注意：控制服务器由正在运行的网关启动（OpenClaw.app 菜单栏，或 `openclaw gateway`）。
- 自动检测顺序：如果基于 Chromium，则使用默认浏览器；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    defaultProfile: "chrome",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" }
    },
    color: "#FF4500",
    // Advanced:
    // headless: false,
    // noSandbox: false,
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false, // set true when tunneling a remote CDP to localhost
  }
}
```

__标题1__ __内联代码0__（外观）

原生应用用于界面装饰的可选强调色，例如通话模式气泡的色调。

如果未设置，客户端将回退到静音的浅蓝色。

```json5
{
  ui: {
    seamColor: "#FF4500", // hex (RRGGBB or #RRGGBB)
    // Optional: Control UI assistant identity override.
    // If unset, the Control UI uses the active agent identity (config or IDENTITY.md).
    assistant: {
      name: "OpenClaw",
      avatar: "CB" // emoji, short text, or image URL/data URI
    }
  }
}
```

__标题1__ __行内代码0__（网关服务器模式 + 绑定）

使用`gateway.mode`显式声明这台机器是否应运行网关。

默认：

- 模式：**未设置**（视为“不自动启动”）
- 绑定：`loopback`
- 端口：`18789`（WS和HTTP共用一个端口）

```json5
{
  gateway: {
    mode: "local", // or "remote"
    port: 18789, // WS + HTTP multiplex
    bind: "loopback",
    // controlUi: { enabled: true, basePath: "/openclaw" }
    // auth: { mode: "token", token: "your-token" } // token gates WS + Control UI access
    // tailscale: { mode: "off" | "serve" | "funnel" }
  }
}
```

控制UI基础路径：

- `gateway.controlUi.basePath` 设置提供 Control UI 的 URL 前缀。
- 示例：`"/ui"`、`"/openclaw"`、`"/apps/openclaw"`。
- 默认值：根路径 (`/`)（保持不变）。
- 当启用时，`gateway.controlUi.allowInsecureAuth` 允许仅使用令牌对 Control UI 进行身份验证。

设备身份被省略（通常通过 HTTP）。默认值：`false`。优先使用 HTTPS（Tailscale Serve）或 `127.0.0.1`。

- `gateway.controlUi.dangerouslyDisableDeviceAuth` 会禁用设备身份验证

控制界面（仅限令牌/密码）。默认：`false`。仅限紧急访问。

相关文档：

- [控制界面](/web/control-ui)
- [网络概览](/web)
- [Tailscale](/gateway/tailscale)
- [远程访问](/gateway/remote)

受信任的代理：

- `gateway.trustedProxies`：在网关前终止 TLS 的反向代理 IP 列表。
- 当连接来自这些 IP 之一时，OpenClaw 使用 `x-real-ip`（或 `x-real-ip`）来确定客户端 IP，以用于本地配对检查以及 HTTP 身份验证/本地检查。
- 仅列出您完全控制的代理，并确保它们会**覆盖**传入的 `x-forwarded-for`。

注释：

- 除非将`gateway.mode`设置为`local`（或传递覆盖标志），否则`openclaw gateway`将拒绝启动。
- `gateway.port`用于控制WebSocket与HTTP共用的单个复用端口，该端口用于管理UI、钩子和A2UI。
- OpenAI聊天补全端点：**默认禁用**；可通过`gateway.http.endpoints.chatCompletions.enabled: true`启用。
- 优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > 默认`18789`。
- 默认情况下需要网关身份验证（令牌/密码或Tailscale Serve身份）。非环回绑定需要共享令牌/密码。
- 入门向导默认会生成网关令牌（即使在环回模式下也是如此）。
- `gateway.remote.token`**仅**用于远程CLI调用；它不会启用本地网关身份验证。`gateway.token`将被忽略。

身份验证与Tailscale：

- `gateway.auth.mode` 用于设置握手要求（`token` 或 `password`）。未设置时，默认使用令牌身份验证。
- `gateway.auth.mode` 存储用于令牌身份验证的共享令牌（由同一台机器上的 CLI 使用）。
- 当 `gateway.auth.mode` 被设置时，仅接受该方法（外加可选的 Tailscale 标头）。
- 可在此处设置 `gateway.auth.password`，也可通过 `OPENCLAW_GATEWAY_PASSWORD` 设置（推荐）。
- `gateway.auth.allowTailscale` 允许使用Tailscale Serve身份标头。

(`tailscale-user-login`) 当请求通过环回接口到达时，使用 `x-forwarded-proto`、`x-forwarded-proto` 和 `x-forwarded-host` 进行身份验证。OpenClaw 会先通过 `tailscale whois` 解析 `x-forwarded-for` 地址来验证身份，然后才予以接受。当启用 `true` 时，处理请求无需提供令牌或密码；将 `false` 设置为需要显式凭据。如果未指定 `tailscale.mode = "serve"` 且身份验证模式不是 `password`，则默认为 `true`。

- `gateway.tailscale.mode: "serve"` 使用 Tailscale Serve（仅限尾网，绑定回环）。
- `gateway.tailscale.mode: "funnel"` 公开暴露仪表板；需要身份验证。
- `gateway.tailscale.resetOnExit` 在关闭时重置 Serve/Funnel 配置。

远程客户端默认设置（CLI）：

- 当`gateway.mode = "remote"`时，`gateway.remote.url`为CLI调用设置默认的网关WebSocket URL。
- `gateway.remote.transport`选择macOS远程传输（默认为`ssh`，ws/wss则使用`direct`）。当`direct`时，`gateway.remote.url`必须为`ws://`或`wss://`。`ws://host`默认使用端口`18789`。
- `gateway.remote.token`为远程调用提供令牌（留空表示不进行身份验证）。
- `gateway.remote.password`为远程调用提供密码（留空表示不进行身份验证）。

macOS应用行为：

- OpenClaw.app 监控 `~/.openclaw/openclaw.json`，并在 `gateway.mode` 或 `gateway.remote.url` 发生变化时实时切换模式。
- 如果未设置 `gateway.mode` 但已设置 `gateway.remote.url`，macOS 应用会将其视为远程模式。
- 当你在 macOS 应用中更改连接模式时，它会将 `gateway.mode`（在远程模式下还包括 `gateway.remote.url` + `gateway.remote.transport`）写回配置文件。

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "your-token",
      password: "your-password"
    }
  }
}
```

直接传输示例（macOS 应用）：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "wss://gateway.example.ts.net",
      token: "your-token"
    }
  }
}
```

__标题1__ __内联代码0__（配置热重载）

网关会监控`~/.openclaw/openclaw.json`（或`OPENCLAW_CONFIG_PATH`），并自动应用更改。

模式：

- `hybrid`（默认）：支持热部署安全变更；对于关键变更，需重启网关。
- `hot`：仅支持应用热部署安全变更；在需要重启时记录日志。
- `restart`：任何配置变更都会重启网关。
- `off`：禁用热重载。

```json5
{
  gateway: {
    reload: {
      mode: "hybrid",
      debounceMs: 300
    }
  }
}
```

热重载矩阵（文件 + 影响）

已观看的文件：

- `~/.openclaw/openclaw.json`（或`OPENCLAW_CONFIG_PATH`）

热部署（无需完整网关重启）：

- `hooks`（Webhook 认证/路径/映射）+ `hooks.gmail`（Gmail 监视器已重启）
- `cron`（浏览器控制服务器重启）
- `cron`（Cron 服务重启 + 并发更新）
- `agents.defaults.heartbeat`（心跳运行程序重启）
- `web`（WhatsApp Web 渠道重启）
- `telegram`、`discord`、`signal`、`imessage`（渠道重启）
- `agent`、`models`、`routing`、`messages`、`session`、`whatsapp`、`logging`、`skills`、`ui`、`talk`、`identity`、`wizard`（动态读取）

需要完全重启网关：

- `gateway`（端口/绑定/身份验证/控制 UI/Tailscale）
- `bridge`（旧版）
- `discovery`
- `canvasHost`
- `plugins`
- 任何未知或不支持的配置路径（为安全起见，默认重启）

多实例隔离

要在一台主机上运行多个网关（用于冗余或救援机器人），请为每个实例隔离状态和配置，并使用唯一的端口：

- `OPENCLAW_CONFIG_PATH`（按实例配置）
- `agents.defaults.workspace`（会话/凭据）
- `agents.defaults.workspace`（记忆）
- `gateway.port`（每个实例唯一）

便利标志（CLI）：

- `openclaw --dev …` → 使用 `openclaw --profile <name> …` + 从基础 `openclaw --profile <name> …` 转移端口
- `openclaw --profile <name> …` → 使用 __INLINE_CODE_4__（通过配置/环境变量/标志指定端口）

有关派生端口映射（网关/浏览器/画布），请参阅[网关运行手册](/gateway)。
有关浏览器/CDP端口隔离的详细信息，请参阅[多个网关](/gateway/multiple-gateways)。

示例：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

__标题1__ __行内代码0__（网关Webhook）

在网关 HTTP 服务器上启用一个简单的 HTTP Webhook 端点。

默认：

- 已启用: `false`
- 路径: `/hooks`
- 最大正文字节数: `262144`（256 KB）

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate:
          "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  }
}
```

请求必须包含挂钩令牌：

- `Authorization: Bearer <token>` **或**
- `x-openclaw-token: <token>` **或**
- `?token=<token>`

端点：

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析

始终将摘要发布到主会话中（并可选择通过 `wakeMode: "now"` 触发即时心跳）。

映射说明：

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `{ source: "gmail" }` 匹配有效载荷字段（例如 `{ source: "gmail" }`），因此您可以使用通用的 `/hooks/ingest` 路径。
- 类似 `{{messages[0].subject}}` 的模板会从有效载荷中读取数据。
- `transform` 可以指向一个返回钩子动作的 JS/TS 模块。
- `deliver: true` 将最终回复发送到某个频道；`channel` 默认为 `last`（回退到 WhatsApp）。
- 如果没有先前的交付路由，请显式设置 `channel` + `to`（Telegram/Discord/Google Chat/Slack/Signal/iMessage/MS Teams 需要此设置）。
- `model` 会覆盖此钩子运行中的 LLM（`provider/model` 或别名；如果设置了 `agents.defaults.models`，则必须允许该覆盖）。

Gmail助手配置（由 `openclaw webhooks gmail setup` / `run` 使用）：

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },

      // Optional: use a cheaper model for Gmail hook processing
      // Falls back to agents.defaults.model.fallbacks, then primary, on auth/rate-limit/timeout
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      // Optional: default thinking level for Gmail hooks
      thinking: "off",
    }
  }
}
```

Gmail钩子的模型覆盖：

- `hooks.gmail.model` 指定用于处理 Gmail 钩子的模型（默认为会话主模型）。
- 接受来自 `agents.defaults.models` 的 `provider/model` 引用或别名。
- 在身份验证、速率限制或超时发生时，回退至 `agents.defaults.model.fallbacks`，然后是 `agents.defaults.model.primary`。
- 如果设置了 `agents.defaults.models`，则将钩子模型纳入白名单。
- 在启动时，如果配置的模型不在模型目录或白名单中，则发出警告。
- `hooks.gmail.thinking` 设置 Gmail 钩子的默认思考级别，并可被每个钩子的 `thinking` 覆盖。

网关自动启动：

- 如果设置了`hooks.enabled=true`和`hooks.gmail.account`，网关就会启动

`gog gmail watch serve` 在启动时运行并自动续订手表。

- 将`OPENCLAW_SKIP_GMAIL_WATCHER=1`设置为禁用自动启动（用于手动运行）。
- 请勿在网关旁边单独运行__INLINE_CODE_1__；它会

失败，代码为`listen tcp 127.0.0.1:8788: bind: address already in use`。

注意：当`tailscale.mode`启用时，OpenClaw会将`serve.path`默认设置为`/`，以便
Tailscale能够正确代理`/gmail-pubsub`（它会剥离set-path前缀）。如果您希望后端接收带前缀的路径，请将
`hooks.gmail.tailscale.target`设置为完整URL，并确保`serve.path`与之匹配。

### `canvasHost`（局域网/尾网画布文件服务器 + 实时重载）

网关通过 HTTP 提供 HTML/CSS/JS 目录，以便 iOS/Android 节点可以简单地`canvas.navigate`到它。

默认根目录：`~/.openclaw/workspace/canvas`  
默认端口：`18793`（为避免与 openclaw 浏览器的 CDP 端口 `18792` 冲突而选择）  
服务器监听在**网关绑定主机**（LAN 或 Tailnet）上，以便节点能够访问它。

服务器：

- 在 `canvasHost.root` 下提供文件
- 将一个微型的实时重载客户端注入到提供的 HTML 中
- 监视该目录，并通过位于 `/__openclaw__/ws` 的 WebSocket 端点广播重载通知
- 当目录为空时自动创建一个入门用的 `index.html`（以便您立即看到一些内容）
- 还在 `/__openclaw__/a2ui/` 提供 A2UI，并以 `canvasHostUrl` 的形式向节点进行宣传

（始终由节点用于 Canvas/A2UI）

如果目录很大，或者您遇到`EMFILE`，请禁用实时重载（以及文件监听）。

- 配置: `canvasHost: { liveReload: false }`

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    port: 18793,
    liveReload: true
  }
}
```

对`canvasHost.*`的更改需要重启网关（配置重新加载会触发重启）。

禁用方式：

- 配置: `canvasHost: { enabled: false }`
- 环境: `OPENCLAW_SKIP_CANVAS_HOST=1`

### `bridge`（旧版 TCP 桥接，已移除）

当前版本的构建不再包含TCP桥接监听器；`bridge.*` 配置键已被忽略。
节点通过网关WebSocket进行连接。本节保留以供历史参考。

遗留行为：

- 网关可以为节点（iOS/Android）暴露一个简单的TCP桥接，通常使用`18790`端口。

默认：

- 已启用：`true`
- 端口：`18790`
- 绑定：`lan`（绑定到 `0.0.0.0`）

绑定模式：

- `lan`: `0.0.0.0`（可通过任何接口访问，包括 LAN/Wi‑Fi 和 Tailscale）
- `tailnet`: 仅绑定到设备的 Tailscale IP（建议用于维也纳⇄伦敦）
- `loopback`: `127.0.0.1`（仅限本地）
- `auto`: 如果存在 tailnet IP，则优先使用 tailnet IP；否则使用 `lan`

传输层安全：

- `bridge.tls.enabled`: 为桥接连接启用 TLS（仅在启用时使用 TLS）。
- `bridge.tls.autoGenerate`: 在没有证书/密钥时生成自签名证书（默认：true）。
- `bridge.tls.certPath` / `bridge.tls.keyPath`: 桥接证书和私钥的 PEM 路径。
- `bridge.tls.caPath`: 可选的 PEM CA 捆绑包（用于自定义根证书或未来的双向 TLS）。

启用TLS时，网关会在发现TXT记录中通告`bridgeTls=1`和`bridgeTlsSha256`，以便节点可以固定证书。如果尚未存储指纹，手动连接将采用首次使用信任机制。
自动生成的证书需要在PATH上具备`openssl`；如果生成失败，桥接器将无法启动。

```json5
{
  bridge: {
    enabled: true,
    port: 18790,
    bind: "tailnet",
    tls: {
      enabled: true,
      // Uses ~/.openclaw/bridge/tls/bridge-{cert,key}.pem when omitted.
      // certPath: "~/.openclaw/bridge/tls/bridge-cert.pem",
      // keyPath: "~/.openclaw/bridge/tls/bridge-key.pem"
    }
  }
}
```

__标题1__ __内联代码0__（Bonjour / mDNS 广播模式）

控制局域网mDNS发现广播（`_openclaw-gw._tcp`）。

- `minimal`（默认）：从TXT记录中省略`sshPort` + `sshPort`
- `full`：在TXT记录中包含`cliPath` + `sshPort`
- `off`：完全禁用mDNS广播
- 主机名：默认为`openclaw`（通告`openclaw.local`）。可通过`OPENCLAW_MDNS_HOSTNAME`覆盖。

```json5
{
  discovery: { mdns: { mode: "minimal" } }
}
```

__标题1__ __行内代码0__（广域Bonjour / 单播DNS‑SD）

启用后，网关将使用已配置的发现域，在`~/.openclaw/dns/`下为`_openclaw-gw._tcp`写入单播 DNS-SD 区域（示例：`openclaw.internal.`）。

要在不同网络之间实现iOS/Android发现（维也纳⇄伦敦），请将其与以下内容搭配使用：

- 在网关主机上为您所选域名配置的 DNS 服务器（推荐使用 CoreDNS）
- 使用 Tailscale 的“分离 DNS”功能，让客户端通过网关 DNS 服务器解析该域名。

一次性设置助手（网关主机）：

```bash
openclaw dns setup --apply
```

```json5
{
  discovery: { wideArea: { enabled: true } }
}
```

## 模板变量

模板占位符将在 `tools.media.*.models[].args` 和 `tools.media.models[].args`（以及未来任何模板化参数字段）中展开。

| 变量 | 描述 |
|----------|-------------|
| `{{Body}}` | 完整的入站消息正文 |
| `{{RawBody}}` | 原始入站消息正文（不含历史记录或发送者包装；最适合用于命令解析） |
| `{{BodyStripped}}` | 去除了群组提及的正文（作为代理的默认设置最为理想） |
| `{{From}}` | 发送者标识符（WhatsApp 使用 E.164 格式；不同渠道可能有所不同） |
| `{{To}}` | 目的地标识符 |
| `{{MessageSid}}` | 渠道消息 ID（如有） |
| `{{SessionId}}` | 当前会话 UUID |
| `{{IsNewSession}}` | 在创建新会话时为 `"true"` |
| `{{MediaUrl}}` | 入站媒体伪 URL（如果存在） |
| `{{MediaPath}}` | 本地媒体路径（如果已下载） |
| `{{MediaType}}` | 媒体类型（图片/音频/文档/…） |
| `{{Transcript}}` | 音频转录（启用时） |
| `{{Prompt}}` | 为 CLI 条目解析的媒体提示 |
| `{{MaxChars}}` | 为 CLI 条目解析的最大输出字符数 |
| `{{ChatType}}` | 为 `"direct"` 或 `"group"` |
| `{{GroupSubject}}` | 群组主题（尽力而为） |
| `{{GroupMembers}}` | 群组成员预览（尽力而为） |
| `{{SenderName}}` | 发送者显示名称（尽力而为） |
| `{{SenderE164}}` | 发送者电话号码（尽力而为） |
| `{{Provider}}` | 提供商提示（whatsapp|telegram|discord|googlechat|slack|signal|imessage|msteams|webchat|…）|

__HEADING_0__Cron（网关调度器）

Cron 是 Gateway 自带的调度程序，用于触发唤醒和计划任务。有关该功能的概览和 CLI 示例，请参阅 [Cron 作业](/automation/cron-jobs)。

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2
  }
}
```

---

*下一步：[代理运行时](/concepts/agent)* 🦞
