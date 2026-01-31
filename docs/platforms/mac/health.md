---
summary: How the macOS app reports gateway/Baileys health states
read_when:
  - Debugging mac app health indicators
---
# macOS 上的健康检查

如何通过菜单栏应用查看已链接频道是否正常运行。

## 菜单栏
- 状态点现在反映了 Baileys 的健康状况：
  - 绿色：已链接且套接字最近已打开。
  - 橙色：正在连接或重试中。
  - 红色：已登出或探测失败。
- 第二行显示“已链接 · 认证 12 分钟”，或显示失败原因。
- “运行健康检查”菜单项可触发按需探测。

## 设置
- 在“常规”选项卡中新增了一个健康卡片，显示：已链接认证的时效、会话存储路径/数量、上次检查时间、上次错误/状态码，以及“运行健康检查”和“显示日志”按钮。
- 使用缓存快照，确保界面即时加载，并在离线时优雅降级。
- **“通道”选项卡**显示 WhatsApp 和 Telegram 的通道状态及控制选项：登录二维码、登出、探测、上次断开连接或错误信息。

## 探测的工作原理
- 应用每约 60 秒以及按需通过 `openclaw health --json` 和 `ShellExecutor` 运行探测。探测会加载凭据并报告状态，而不会发送任何消息。
- 分别缓存最后一次成功的快照和最后一次错误，以避免界面闪烁；同时显示每次操作的时间戳。

## 如有疑问
- 您仍然可以使用 CLI 流程，在 [网关健康](/gateway/health) 中执行（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），并使用 `/tmp/openclaw/openclaw-*.log` 尾随日志，以获取 `web-heartbeat` / `web-reconnect` 的详细信息。
