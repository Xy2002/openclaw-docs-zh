---
summary: Messaging platforms OpenClaw can connect to
read_when:
  - You want to choose a chat channel for OpenClaw
  - You need a quick overview of supported messaging platforms
---
# 聊天频道

OpenClaw 可以在你已使用的任何聊天应用中与你对话。每个频道都通过网关连接。
文本功能在所有频道中均受支持；媒体和表情反应则因频道而异。

## 支持的频道

- [WhatsApp](/channels/whatsapp) — 最受欢迎；使用 Baileys，需通过二维码配对。
- [Telegram](/channels/telegram) — 通过 grammY 使用 Bot API；支持群组。
- [Discord](/channels/discord) — 使用 Discord Bot API 和网关；支持服务器、频道和私信。
- [Slack](/channels/slack) — 使用 Bolt SDK；适用于工作区应用。
- [Google Chat](/channels/googlechat) — 通过 HTTP Webhook 使用 Google Chat API 应用。
- [Mattermost](/channels/mattermost) — 使用 Bot API 和 WebSocket；支持频道、群组和私信（插件需单独安装）。
- [Signal](/channels/signal) — 使用 signal-cli；注重隐私。
- [BlueBubbles](/channels/bluebubbles) — **推荐用于 iMessage**；使用 BlueBubbles macOS 服务器 REST API，提供完整功能支持（编辑、撤回消息、特效、表情反应、群组管理——目前在 macOS 26 Tahoe 上编辑功能存在问题）。
- [iMessage](/channels/imessage) — 仅限 macOS；通过 imsg 进行原生集成（较旧方案，建议新部署使用 BlueBubbles）。
- [Microsoft Teams](/channels/msteams) — 使用 Bot Framework；面向企业级支持（插件需单独安装）。
- [LINE](/channels/line) — 使用 LINE Messaging API 机器人（插件需单独安装）。
- [Nextcloud Talk](/channels/nextcloud-talk) — 通过 Nextcloud Talk 提供自托管聊天服务（插件需单独安装）。
- [Matrix](/channels/matrix) — 使用 Matrix 协议（插件需单独安装）。
- [Nostr](/channels/nostr) — 通过 NIP-04 实现去中心化私信（插件需单独安装）。
- [Tlon](/channels/tlon) — 基于 Urbit 的即时通讯工具（插件需单独安装）。
- [Twitch](/channels/twitch) — 通过 IRC 连接接入 Twitch 聊天（插件需单独安装）。
- [Zalo](/channels/zalo) — 使用 Zalo Bot API；越南流行的即时通讯工具（插件需单独安装）。
- [Zalo Personal](/channels/zalouser) — 通过 QR 登录访问 Zalo 个人账号（插件需单独安装）。
- [WebChat](/web/webchat) — 基于 WebSocket 的网关 WebChat 界面。

## 注意事项

- 频道可同时运行；配置多个频道后，OpenClaw 将根据聊天自动路由消息。
- 通常情况下，设置最快的渠道是 **Telegram**（只需简单的 bot 令牌）。WhatsApp 需要二维码配对，并且会在磁盘上存储更多状态。
- 各频道的群组行为有所不同；详情请参阅 [群组](/concepts/groups)。
- 为确保安全，会强制执行私信配对和白名单机制；详情请参阅 [安全](/gateway/security)。
- Telegram 内部实现：[grammY 备忘录](/channels/grammy)。
- 故障排除：[频道故障排除](/channels/troubleshooting)。
- 模型提供商信息另行记录；详情请参阅 [模型提供商](/providers/models)。
