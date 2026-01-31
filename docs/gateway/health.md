---
summary: Health check steps for channel connectivity
read_when:
  - Diagnosing WhatsApp channel health
---
# 健康检查（命令行界面）

无需猜测即可验证通道连接性的简明指南。

## 快速检查
- `openclaw status` — 本地摘要：网关可达性/模式、更新提示、关联通道认证时效、会话及近期活动。
- `openclaw status --all` — 完整本地诊断（只读，彩色显示，可安全粘贴以进行调试）。
- `openclaw status --deep` — 还会探测正在运行的网关（在支持的情况下按通道分别进行探测）。
- `openclaw health --json` — 向正在运行的网关请求完整的健康快照（仅限 WebSocket；不直接使用 Baileys 套接字）。
- 在 WhatsApp/WebChat 中发送 `/status` 作为独立消息，即可在不调用代理的情况下获取状态回复。
- 日志：使用 tail `/tmp/openclaw/openclaw-*.log` 并过滤 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断
- 磁盘上的凭据：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（修改时间应较新）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。会话数量和近期收件人可通过 `status` 查看。
- 重新链接流程：当日志中出现状态码 409–515 或 `openclaw channels logout && openclaw channels login --verbose` 时执行。（注意：对于状态码 515，配对后二维码登录流程会自动重试一次。）

## 出现故障时
- 如果出现 `logged out` 或状态码 409–515 → 先使用 `openclaw channels logout` 重新链接，再执行 `openclaw channels login`。
- 网关无法访问 → 启动网关：`openclaw gateway --port 18789`（如果端口被占用，使用 `--force`）。
- 无入站消息 → 确认关联手机在线且发件人已被允许接入（`channels.whatsapp.allowFrom`）；对于群聊，确保白名单和提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用“健康”命令
`openclaw health --json` 向正在运行的网关请求其健康快照（CLI 不直接使用通道套接字）。在可用时，它会报告关联凭据和认证时效、各通道的探测摘要、会话存储摘要以及探测持续时间。如果网关无法访问或探测失败/超时，该命令将以非零退出码终止。使用 `--timeout <ms>` 可覆盖默认的 10 秒超时时间。
