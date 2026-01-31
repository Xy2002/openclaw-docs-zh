---
summary: Mattermost bot setup and OpenClaw config
read_when:
  - Setting up Mattermost
  - Debugging Mattermost routing
---
# Mattermost（插件）

状态：通过插件支持（机器人令牌 + WebSocket 事件）。支持频道、群组和私信。
Mattermost 是一个可自托管的团队消息平台；有关产品详情和下载，请访问其官方网站：
[mattermost.com](https://mattermost.com)。

## 需要插件
Mattermost 以插件形式提供，不随核心安装包一起打包。

通过 CLI 安装（npm 注册表）：
```bash
openclaw plugins install @openclaw/mattermost
```

本地检出（从 Git 仓库运行时）：
```bash
openclaw plugins install ./extensions/mattermost
```

如果在配置/引导过程中选择 Mattermost 并检测到 Git 检出，OpenClaw 将自动提供本地安装路径。

详情：[插件](/plugin)

## 快速设置
1) 安装 Mattermost 插件。
2) 创建 Mattermost 机器人账户并复制 **机器人令牌**。
3) 复制 Mattermost 的 **基础 URL**（例如，`https://chat.example.com`）。
4) 配置 OpenClaw 并启动网关。

最小配置：
```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing"
    }
  }
}
```

## 环境变量（默认账户）
如果您更倾向于使用环境变量，请在网关主机上设置以下变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于 **默认** 账户（`default`）。其他账户必须使用配置值。

## 聊天模式
Mattermost 会自动回复私信。频道行为由 `chatmode` 控制：

- `oncall`（默认）：仅在频道中被提及时回复。
- `onmessage`：回复所有频道消息。
- `onchar`：当消息以触发前缀开头时回复。

配置示例：
```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"]
    }
  }
}
```

注意事项：
- `onchar` 仍会响应显式提及。
- `channels.mattermost.requireMention` 仍适用于旧版配置，但建议优先使用 `chatmode`。

## 访问控制（私信）
- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发件人会收到配对码）。
- 通过以下方式批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 频道（群组）
- 默认：`channels.mattermost.groupPolicy = "allowlist"`（需提及才能进入）。
- 使用 `channels.mattermost.groupAllowFrom`（用户 ID 或 `@username`）允许特定发件人加入。
- 开放频道：`channels.mattermost.groupPolicy="open"`（需提及才能进入）。

## 出站交付目标
将以下目标格式与 `openclaw message send` 或 cron/webhook 一起使用：

- `channel:<id>` 用于频道
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

纯 ID 被视为频道。

## 多账户
Mattermost 在 `channels.mattermost.accounts` 下支持多个账户：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" }
      }
    }
  }
}
```

## 故障排除
- 频道中无回复：确保机器人已在频道中，并提及它（oncall），或使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查机器人令牌、基础 URL 以及账户是否已启用。
- 多账户问题：环境变量仅适用于 `default` 账户。
