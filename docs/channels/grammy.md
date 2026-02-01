---
summary: Telegram Bot API integration via grammY with setup notes
read_when:
  - Working on Telegram or grammY pathways
---
# grammY 集成（Telegram Bot API）


# 为什么选择 grammY
- 这是一个以 TypeScript 优先的 Bot API 客户端，内置长轮询与 Webhook 辅助工具、中间件、错误处理和限流器。
- 提供比手动构建 fetch + FormData 更简洁的媒体辅助工具；支持所有 Bot API 方法。
- 可扩展：通过自定义 fetch 支持代理，可选会话中间件，以及类型安全的上下文。

# 我们已实现的功能
- **单一客户端路径：** 去除了基于 fetch 的实现；grammY 现在是唯一的 Telegram 客户端（发送 + 网关），且默认启用 grammY 限流器。
- **网关：:** `monitorTelegramProvider` 构建了一个 grammY `Bot`，并集成了提及/白名单过滤、通过 `getFile`/`download` 进行媒体下载，以及使用 `sendMessage/sendPhoto/sendVideo/sendAudio/sendDocument` 发送回复。支持通过 `webhookCallback` 实现长轮询或 Webhook。
- **代理：** 可选的 `channels.telegram.proxy` 通过 grammY 的 `client.baseFetch` 使用 `undici.ProxyAgent`。
- **Webhook 支持：** `webhook-set.ts` 包装了 `setWebhook/deleteWebhook`；`webhook.ts` 承载回调，并提供健康检查与优雅关闭功能。当 `channels.telegram.webhookUrl` 被设置时，网关会启用 Webhook 模式（否则采用长轮询）。
- **会话：** 直接聊天合并到代理主会话中 (`agent:<agentId>:<mainKey>`)；群组使用 __ INLINE_CODE_14__；回复会路由回同一频道。
- **配置选项：** `channels.telegram.botToken`、`channels.telegram.dmPolicy`、`channels.telegram.groups`（白名单与提及的默认值）、`channels.telegram.allowFrom`、`channels.telegram.groupAllowFrom`、`channels.telegram.groupPolicy`、`channels.telegram.mediaMaxMb`、`channels.telegram.linkPreview`、`channels.telegram.proxy`、`channels.telegram.webhookSecret`、`channels.telegram.webhookUrl`。
- **草稿流式传输：** 可选的 `channels.telegram.streamMode` 在私密话题聊天中使用 `sendMessageDraft`（Bot API 9.3 及以上版本）。这与频道块流式传输是分开的。
- **测试：** grammy 模拟覆盖了私信和群组提及过滤以及出站发送；我们仍欢迎更多媒体/Webhook 测试用例。

待解决的问题
- 如果遇到 Bot API 429 错误，可考虑引入可选的 grammY 插件（如限流器）。
- 增加更结构化的媒体测试（例如贴纸、语音消息）。
- 使 Webhook 监听端口可配置（目前固定为 8787，除非通过网关进行配置）。
