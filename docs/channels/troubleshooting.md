---
summary: Channel-specific troubleshooting shortcuts (Discord/Telegram/WhatsApp)
read_when:
  - A channel connects but messages don’t flow
  - 'Investigating channel misconfiguration (intents, permissions, privacy mode)'
---
# 频道故障排除

从以下内容开始：

```bash
openclaw doctor
openclaw channels status --probe
```

`channels status --probe` 在检测到常见频道配置错误时会打印警告，并包含一些小型实时检查（凭据、部分权限/成员资格）。

## 频道

- Discord：[/channels/discord#troubleshooting](/channels/discord#troubleshooting)
- Telegram：[/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)
- WhatsApp：[/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

__HEADING_0__Telegram快速修复

- 日志显示 `HttpError: Network request for 'sendMessage' failed` 或 `sendChatAction` → 检查 IPv6 DNS。如果 `api.telegram.org` 首先解析为 IPv6，而主机缺少 IPv6 出站连接，则强制使用 IPv4 或启用 IPv6。请参阅 [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)。
- 日志显示 `setMyCommands failed` → 检查出站 HTTPS 和 DNS 是否可访问 `api.telegram.org`（在受限 VPS 或代理中很常见）。
