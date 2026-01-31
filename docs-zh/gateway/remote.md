---
summary: Remote access using SSH tunnels (Gateway WS) and tailnets
read_when:
  - Running or troubleshooting remote gateway setups
---
# 远程访问（SSH、隧道与尾网）

此仓库通过在专用主机（桌面或服务器）上运行单个网关（主节点），并让客户端连接到该网关，从而支持“通过 SSH 进行远程访问”。

- 对于**操作员（您或 macOS 应用程序）**：SSH 隧道是通用的后备方案。
- 对于**节点（iOS/Android 及未来设备）**：根据需要通过 **WebSocket** 连接到网关（可通过局域网/尾网或 SSH 隧道进行连接）。

## 核心理念

- 网关 WebSocket 绑定到您配置的端口上的 **环回地址**（默认为 18789）。
- 在远程使用场景中，您可以通过 SSH 转发该环回端口（或者使用尾网/VPN 并减少隧道需求）。

## 常见 VPN/尾网设置（代理所在位置）

将**网关主机**视为“代理所在的位置”。它负责管理会话、认证配置文件、通道和状态。您的笔记本电脑/台式机（以及节点）都连接到该主机。

### 1) 永久在线的网关位于您的尾网中（VPS 或家庭服务器）

在持久运行的主机上运行网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳用户体验**：保留 `gateway.bind: "loopback"`，并使用 **Tailscale Serve** 提供控制界面。
- **后备方案**：保持环回 + 从任何需要访问的机器建立 SSH 隧道。
- **示例**：[exe.dev](/platforms/exe-dev)（简易虚拟机）或 [Hetzner](/platforms/hetzner)（生产级 VPS）。

当您的笔记本电脑经常休眠，但您希望代理始终在线时，这是理想的选择。

### 2) 家庭桌面运行网关，笔记本电脑作为远程控制端

笔记本电脑**不**运行代理。它以远程方式连接：

- 使用 macOS 应用程序的 **通过 SSH 远程** 模式（设置 → 通用 → “OpenClaw 运行”）。
- 应用程序会自动打开并管理隧道，因此 WebChat 和健康检查可以“无缝工作”。

操作手册：[macOS 远程访问](/platforms/mac/remote)。

### 3) 笔记本电脑运行网关，其他机器进行远程访问

让网关保留在本地，但安全地对外暴露：

- 其他机器通过 SSH 隧道连接到笔记本电脑；或者
- 使用 Tailscale Serve 提供控制界面，并将网关限制为仅监听环回地址。

指南：[Tailscale](/gateway/tailscale) 和 [Web 概览](/web)。

## 命令流程（各组件运行位置）

一个网关服务负责管理状态和通道。节点属于外围设备。

流程示例（Telegram → 节点）：
- Telegram 消息到达 **网关**。
- 网关运行 **代理**，并决定是否调用节点工具。
- 网关通过网关 WebSocket (`node.*` RPC) 调用 **节点**。
- 节点返回结果；网关再将响应发送回 Telegram。

注意事项：
- **节点不运行网关服务。** 每台主机应仅运行一个网关，除非您有意运行隔离的配置文件（参见 [多个网关](/gateway/multiple-gateways))。
- macOS 应用程序的“节点模式”只是通过网关 WebSocket 进行连接的节点客户端。

## SSH 隧道（CLI + 工具）

创建指向远程网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：
- `openclaw health` 和 `openclaw status --deep` 现在可通过 `ws://127.0.0.1:18789` 访问远程网关。
- `openclaw gateway {status,health,send,agent,call}` 也可以在需要时通过 `--url` 指向转发的 URL。

注意：请将 `18789` 替换为您配置的 `gateway.port`（或 `--port`/`OPENCLAW_GATEWAY_PORT`）。

## CLI 远程默认设置

您可以持久化一个远程目标，使 CLI 命令默认使用该目标：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token"
    }
  }
}
```

当网关仅监听环回地址时，请将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。

## 通过 SSH 使用聊天界面

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天界面直接连接到网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后让客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，建议使用应用程序的“通过 SSH 远程”模式，该模式可自动管理隧道。

## macOS 应用程序的“通过 SSH 远程”

macOS 菜单栏应用程序可以端到端地完成相同的设置（远程状态检查、WebChat 和语音唤醒转发）。

操作手册：[macOS 远程访问](/platforms/mac/remote)。

## 安全规则（远程/VPN）

简而言之：**除非您确定需要绑定，否则请将网关限制为仅监听环回地址。**

- **环回 + SSH/Tailscale Serve** 是最安全的默认设置（无公开暴露）。
- **非环回绑定**（`lan`/`tailnet`/`custom`，或在无法使用环回时使用 `auto`）必须使用身份令牌/密码。
- `gateway.remote.token` **仅**用于远程 CLI 调用——它**不**启用本地身份验证。
- `gateway.remote.tlsFingerprint` 在使用 `wss://` 时会固定远程 TLS 证书。
- **Tailscale Serve** 可以在 `gateway.auth.allowTailscale: true` 启用时通过身份标头进行身份验证。
  如果您希望使用令牌/密码替代，则将其设置为 `false`。
- 将浏览器控制视为操作员访问：仅限尾网，并需明确进行节点配对。

深入探讨：[安全](/gateway/security)。
