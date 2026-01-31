---
summary: Twitch chat bot configuration and setup
read_when:
  - Setting up Twitch chat integration for OpenClaw
---
# Twitch（插件）

通过IRC连接实现Twitch聊天支持。OpenClaw以Twitch用户（机器人账号）身份连接，以便在频道中接收和发送消息。

## 插件要求

Twitch作为插件提供，不包含在核心安装中。

通过CLI（npm注册表）安装：

```bash
openclaw plugins install @openclaw/twitch
```

本地检出（从Git仓库运行时）：

```bash
openclaw plugins install ./extensions/twitch
```

详情：[插件](/plugin)

## 快速设置（初学者）

1) 为机器人创建一个专用的Twitch账号（或使用现有账号）。
2) 生成凭据：[Twitch令牌生成器](https://twitchtokengenerator.com/)
   - 选择**Bot Token**
   - 确保已选中作用域 `chat:read` 和 `chat:write`
   - 复制**Client ID**和**Access Token**
3) 查找您的Twitch用户ID：https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
4) 配置令牌：
   - 环境变量：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅适用于默认账号）
   - 或配置文件：`channels.twitch.accessToken`
   - 如果同时设置了环境变量和配置文件，则以配置文件为准（环境变量仅作为默认账号的后备）。
5) 启动网关。

**⚠️ 重要提示：** 添加访问控制（`allowFrom` 或 `allowedRoles`），以防止未经授权的用户触发机器人。`requireMention` 默认为 `true`。

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",              // Bot's Twitch account
      accessToken: "oauth:abc123...",    // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...",             // Client ID from Token Generator
      channel: "vevisk",                 // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"]           // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    }
  }
}
```

## 它是什么

- 由网关拥有的Twitch频道。
- 确定性路由：回复始终返回到Twitch。
- 每个账号映射到一个隔离的会话密钥 `agent:<agentId>:twitch:<accountName>`。
- `username` 是机器人的账号（用于身份验证），`channel` 是要加入的聊天室。

## 设置（详细）

### 生成凭据

使用 [Twitch令牌生成器](https://twitchtokengenerator.com/)：
- 选择**Bot Token**
- 确保已选中作用域 `chat:read` 和 `chat:write`
- 复制**Client ID**和**Access Token**

无需手动注册应用。令牌会在数小时内过期。

### 配置机器人

**环境变量（仅适用于默认账号）：**
```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**或配置文件：**
```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk"
    }
  }
}
```

如果同时设置了环境变量和配置文件，则以配置文件为准。

### 访问控制（推荐）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"],       // (recommended) Your Twitch user ID only
      allowedRoles: ["moderator"]     // Or restrict to roles
    }
  }
}
```

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**为什么使用用户ID？** 用户名可能会更改，从而导致冒充。用户ID是永久性的。

查找您的Twitch用户ID：https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/（将您的Twitch用户名转换为ID）

## 令牌刷新（可选）

来自 [Twitch令牌生成器](https://twitchtokengenerator.com/)的令牌无法自动刷新——过期后需重新生成。

如需自动刷新令牌，请在 [Twitch开发者控制台](https://dev.twitch.tv/console)创建您自己的Twitch应用程序，并将其添加到配置中：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token"
    }
  }
}
```

机器人会在令牌到期前自动刷新，并记录刷新事件。

## 多账号支持

使用 `channels.twitch.accounts` 并为每个账号提供单独的令牌。有关共享模式的详细信息，请参阅 [`gateway/configuration`](/gateway/configuration)。

示例（一个机器人账号在两个频道中）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk"
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel"
        }
      }
    }
  }
}
```

**注意：** 每个账号都需要自己的令牌（每个频道一个令牌）。

## 访问控制

### 基于角色的限制

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"]
        }
      }
    }
  }
}
```

### 按用户ID的白名单（最安全）

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"]
        }
      }
    }
  }
}
```

### 白名单与角色结合

位于 `allowFrom` 中的用户可绕过角色检查：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789"],
          allowedRoles: ["moderator"]
        }
      }
    }
  }
}
```

### 禁用@提及要求

默认情况下，`requireMention` 是 `true`。要禁用并响应所有消息：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false
        }
      }
    }
  }
}
```

## 故障排除

首先运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

### 机器人不响应消息

**检查访问控制：** 暂时设置 `allowedRoles: ["all"]` 进行测试。

**检查机器人是否在频道中：** 机器人必须加入 `channel` 中指定的频道。

### 令牌问题

**“连接失败”或身份验证错误：**
- 确认 `accessToken` 是OAuth访问令牌值（通常以 `oauth:` 为前缀）
- 检查令牌是否具有 `chat:read` 和 `chat:write` 作用域
- 如果使用令牌刷新功能，确保已设置 `clientSecret` 和 `refreshToken`

### 令牌刷新不起作用

**检查日志中的刷新事件：**
```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

如果您看到“令牌刷新已禁用（无刷新令牌）”：
- 确保提供了 `clientSecret`
- 确保提供了 `refreshToken`

## 配置

**账号配置：**
- `username` - 机器人用户名
- `accessToken` - OAuth访问令牌，具有 `chat:read` 和 `chat:write` 作用域
- `clientId` - Twitch Client ID（来自令牌生成器或您的应用）
- `channel` - 要加入的频道（必填）
- `enabled` - 启用此账号（默认：`true`）
- `clientSecret` - 可选：用于自动刷新令牌
- `refreshToken` - 可选：用于自动刷新令牌
- `expiresIn` - 令牌有效期（秒）
- `obtainmentTimestamp` - 令牌获取时间戳
- `allowFrom` - 用户ID白名单
- `allowedRoles` - 基于角色的访问控制（`"moderator" | "owner" | "vip" | "subscriber" | "all"`）
- `requireMention` - 要求@提及（默认：`true`）

**提供商选项：**
- `channels.twitch.enabled` - 启用或禁用频道启动
- `channels.twitch.username` - 机器人用户名（简化单账号配置）
- `channels.twitch.accessToken` - OAuth访问令牌（简化单账号配置）
- `channels.twitch.clientId` - Twitch Client ID（简化单账号配置）
- `channels.twitch.channel` - 要加入的频道（简化单账号配置）
- `channels.twitch.accounts.<accountName>` - 多账号配置（包含上述所有账号字段）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"]
        }
      }
    }
  }
}
```

## 工具操作

代理可以调用 `twitch`，执行以下操作：
- `send` - 向频道发送消息

示例：

```json5
{
  "action": "twitch",
  "params": {
    "message": "Hello Twitch!",
    "to": "#mychannel"
  }
}
```

## 安全与运维

- **将令牌视为密码** - 切勿将令牌提交到Git
- **对长期运行的机器人使用自动令牌刷新**
- **使用用户ID白名单**代替用户名进行访问控制
- **监控日志**以查看令牌刷新事件和连接状态
- **尽可能缩小令牌的作用域** - 仅请求 `chat:read` 和 `chat:write`
- **若卡住**：在确认没有其他进程占用会话后重启网关

## 限制

- 每条消息最多500个字符（在单词边界处自动分块）
- 在分块前会剥离Markdown
- 无速率限制（使用Twitch内置的速率限制）
