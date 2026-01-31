---
summary: How the mac app embeds the gateway WebChat and how to debug it
read_when:
  - Debugging mac WebChat view or loopback port
---
# WebChat（macOS 应用）

macOS 菜单栏应用将 WebChat 界面嵌入为原生 SwiftUI 视图。它连接到网关，并默认使用所选客服的**主会话**（同时提供会话切换器以选择其他会话）。

- **本地模式**：直接连接到本地网关 WebSocket。
- **远程模式**：通过 SSH 转发网关控制端口，并使用该隧道作为数据平面。

## 启动与调试

- 手动启动：Lobster 菜单 → “打开聊天”。
- 用于测试的自动打开：
  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```
- 日志：`./scripts/clawlog.sh`（子系统 `bot.molt`，类别 `WebChatSwiftUI`）。

## 内部连接方式

- 数据平面：网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- 会话：默认使用主会话（当作用域为全局时，则使用 `global`）。UI 支持在不同会话之间切换。
- 引导流程使用专用会话，以将首次运行设置与其他会话隔离。

## 安全面

- 远程模式仅通过 SSH 转发网关 WebSocket 控制端口。

## 已知限制

- UI 针对聊天会话进行了优化，而非完整的浏览器沙箱。
