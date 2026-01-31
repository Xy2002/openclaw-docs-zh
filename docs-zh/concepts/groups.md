---
summary: >-
  Group chat behavior across surfaces
  (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams)
read_when:
  - Changing group chat behavior or mention gating
---
# 群组

OpenClaw 在不同平台上一致地处理群聊：WhatsApp、Telegram、Discord、Slack、Signal、iMessage 和 Microsoft Teams。

## 初学者入门（2分钟）
OpenClaw“驻扎”在你自己的消息账户中，不存在单独的 WhatsApp 机器人用户。如果**你**身处某个群组，OpenClaw 就能识别该群组并在此群组中作出响应。

默认行为：
- 群组受到限制（`groupPolicy: "allowlist"`）。
- 回复需要提及 OpenClaw，除非你明确禁用提及触发机制。

翻译：白名单中的发件人可以通过提及 OpenClaw 来触发它。

> 总结
> - **私信访问权限**由 `*.allowFrom` 控制。
> - **群组访问权限**由 `*.groupPolicy` + 白名单（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发机制**由提及 gating 控制（`requireMention`、`/activation`）。

快速流程（群消息的处理过程）：
```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

如果你想要……
| 目标 | 设置内容 |
|------|-------------|
| 允许所有群组，但仅对 @提及作出回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅允许特定群组 | `groups: { "<group-id>": { ... } }`（无 `"*"` 键） |
| 只有你可以触发群组中的回复 | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## 会话密钥
- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话密钥（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题会在群组 ID 中添加 `:topic:<threadId>`，因此每个话题都有自己的会话。
- 直接聊天使用主会话（或根据配置使用每发送者会话）。
- 群组会话会跳过心跳检测。

## 模式：个人私信 + 公共群组（单代理）

是的——如果你的“个人”流量是**私信**，而你的“公共”流量是**群组**，这种模式效果很好。

原因：在单代理模式下，私信通常进入**主**会话密钥（`agent:main:main`），而群组始终使用**非主**会话密钥（`agent:main:<channel>:group:<id>`）。如果你启用沙箱功能（`mode: "non-main"`），这些群组会话将在 Docker 中运行，而你的主私信会话则保留在主机上。

这样，你拥有一个代理“大脑”（共享工作空间 + 内存），但有两种执行姿态：
- **私信**：完整工具集（主机）
- **群组**：沙箱 + 有限工具集（Docker）

> 如果你需要真正分离的工作空间/角色身份（“个人”和“公共”绝不能混杂），请使用第二个代理 + 绑定。参见 [多代理路由](/concepts/multi-agent)。

示例（私信在主机上，群组被沙箱化并仅使用消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none"
      }
    }
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"]
      }
    }
  }
}
```

想要“群组只能看到文件夹 X”，而不是“无法访问主机”？保留 `workspaceAccess: "none"`，并将仅限白名单的路径挂载到沙箱中：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "~/FriendsShared:/data:ro"
          ]
        }
      }
    }
  }
}
```

相关：
- 配置键和默认值：[网关配置](/gateway/configuration#agentsdefaultssandbox)
- 调试工具被阻止的原因：[沙箱 vs 工具策略 vs 提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱化](/gateway/sandboxing#custom-bind-mounts)

## 显示标签
- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间/频道；群聊使用 `g-<slug>`（小写，空格替换为 `-`，保留 `#@+._-`）。

## 群组政策
按通道控制群组/房间消息的处理方式：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"]
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789", "@username"]
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"]
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"]
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"]
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "GUILD_ID": { channels: { help: { allow: true } } }
      }
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } }
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true }
      }
    }
  }
}
```

| 政策 | 行为 |
|--------|----------|
| `"open"` | 群组绕过白名单；提及 gating 仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与配置的白名单匹配的群组/房间。 |

注：
- `groupPolicy` 与提及 gating 是分开的（后者需要 @提及）。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams：使用 `groupAllowFrom`（后备：显式 `allowFrom`）。
- Discord：白名单使用 `channels.discord.guilds.<id>.channels`。
- Slack：白名单使用 `channels.slack.channels`。
- Matrix：白名单使用 `channels.matrix.groups`（房间 ID、别名或名称）。使用 `channels.matrix.groupAllowFrom` 来限制发件人；还支持按房间设置的 `users` 白名单。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 白名单可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认是 `groupPolicy: "allowlist"`；如果你的群组白名单为空，群组消息将被阻止。

快速思维模型（群组消息的评估顺序）：
1) `groupPolicy`（开放/禁用/白名单）
2) 群组白名单（`*.groups`、`*.groupAllowFrom`、特定通道白名单）
3) 提及 gating（`requireMention`、`/activation`）

## 提及 gating（默认）
除非按群组覆盖，否则群组消息需要提及。默认设置位于子系统下的 `*.groups."*"`。

回复机器人消息被视为隐式提及（当通道支持回复元数据时）。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false }
      }
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false }
      }
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false }
      }
    }
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50
        }
      }
    ]
  }
}
```

注：
- `mentionPatterns` 是不区分大小写的正则表达式。
- 提供显式提及的平台仍会通过；模式只是后备。
- 每个代理可覆盖：`agents.list[].groupChat.mentionPatterns`（当多个代理共享一个群组时很有用）。
- 提及 gating 仅在能够检测提及时才生效（已配置原生提及或 `mentionPatterns`）。
- Discord 的默认设置位于 `channels.discord.guilds."*"` 中（可按公会/频道覆盖）。
- 群组历史上下文在各通道中统一封装，且仅适用于**待处理消息**（因提及 gating 而被跳过的消息）；使用 `messages.groupChat.historyLimit` 作为全局默认，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 可以禁用。

## 群组/频道工具限制（可选）
某些通道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：允许或禁止整个群组使用某些工具。
- `toolsBySender`：群组内的每发送者覆盖（键为发送者 ID/用户名/电子邮件/电话号码，具体取决于通道）。使用 `"*"` 作为通配符。

解析顺序（最具体优先）：
1) 群组/频道 `toolsBySender` 匹配
2) 群组/频道 `tools`
3) 默认（`"*"`） `toolsBySender` 匹配
4) 默认（`"*"`） `tools`

示例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "123456789": { alsoAllow: ["exec"] }
          }
        }
      }
    }
  }
}
```

注：
- 群组/频道工具限制是在全局/代理工具策略之外应用的（拒绝优先）。
- 某些通道对房间/频道的嵌套有不同的规定（例如，Discord `guilds.*.channels.*`、Slack `channels.*`、MS Teams `teams.*.channels.*`）。

## 群组白名单
当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键充当群组白名单。使用 `"*"` 可以允许所有群组，同时仍设置默认的提及行为。

常见意图（复制/粘贴）：

1) 禁用所有群组回复
```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } }
}
```

2) 仅允许特定群组（WhatsApp）
```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false }
      }
    }
  }
}
```

3) 允许所有群组，但需要显式提及
```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } }
    }
  }
}
```

4) 只有群组所有者可以在群组中触发
```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } }
    }
  }
}
```

## 激活（仅限所有者）
群组所有者可以切换群组激活状态：
- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（或在未设置时由机器人的自我 E.164 决定）。请以独立消息的形式发送命令。其他平台目前忽略 `/activation`。

## 上下文字段
群组入站负载设置：
- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及 gating 结果）
- Telegram 论坛话题还包括 `MessageThreadId` 和 `IsForum`。

在新群组会话的第一轮中，代理系统提示会包含群组简介。它提醒模型像人类一样回应，避免使用 Markdown 表格，并避免输入字面意义上的 `\n` 序列。

## iMessage 特殊说明
- 在路由或白名单设置中，优先使用 `chat_id:<id>`。
- 列表聊天：`imsg chats --limit 20`。
- 群组回复始终返回到相同的 `chat_id`。

## WhatsApp 特殊说明
有关 WhatsApp 专用行为（历史注入、提及处理细节），请参阅 [群组消息](/concepts/group-messages)。
