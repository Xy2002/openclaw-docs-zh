---
summary: Loopback WebChat static host and Gateway WS usage for chat UI
read_when:
  - Debugging or configuring WebChat access
---
# WebChat（网关 WebSocket UI）


状态：macOS/iOS SwiftUI 聊天 UI 直接与网关 WebSocket 通信。

## 它是什么
- 针对网关的原生聊天 UI（无需嵌入浏览器，也无需本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速入门
1) 启动网关。
2) 打开 WebChat UI（macOS/iOS 应用）或控制 UI 的聊天选项卡。
3) 确保已配置网关身份验证（默认情况下必需，即使在环回模式下也是如此）。

## 工作原理（行为）
- UI 连接到网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.inject` 会直接将助手备注附加到对话记录中，并将其广播到 UI（无需代理运行）。
- 历史记录始终从网关获取（无需本地文件监控）。
- 如果网关无法访问，WebChat 将变为只读模式。

## 远程使用
- 在远程模式下，网关 WebSocket 通过 SSH/Tailscale 进行隧道传输。
- 您无需单独运行 WebChat 服务器。

## 配置参考（WebChat）
完整配置：[配置](/gateway/configuration)

渠道选项：
- 无专用的 `webchat.*` 块。WebChat 使用下方的网关端点 + 身份验证设置。

相关全局选项：
- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：WebSocket 身份验证。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程网关目标。
- `session.*`：会话存储及主密钥默认值。
