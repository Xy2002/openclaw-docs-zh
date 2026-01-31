---
summary: 'WebSocket gateway architecture, components, and client flows'
read_when:
  - 'Working on gateway protocol, clients, or transports'
---
# 网关架构

最后更新：2026-01-22

## 概述

- 单个长期运行的 **Gateway** 负责管理所有消息传递界面（通过 Baileys 使用 WhatsApp，通过 grammY 使用 Telegram，以及 Slack、Discord、Signal、iMessage 和 WebChat）。
- 控制平面客户端（macOS 应用、CLI、Web UI 和自动化工具）通过配置的绑定主机上的 **WebSocket** 连接到 Gateway（默认为 `127.0.0.1:18789`）。
- **节点**（macOS/iOS/Android/无头设备）也通过 **WebSocket** 连接，但会声明带有明确能力或命令的 `role: node`。
- 每台主机只有一个 Gateway；它是唯一打开 WhatsApp 会话的地方。
- 一个 **画布主机**（默认为 `18793`）提供代理可编辑的 HTML 和 A2UI。

## 组件与流程

### Gateway（守护进程）
- 维护提供商连接。
- 公开类型化的 WS API（请求、响应和服务器推送事件）。
- 根据 JSON Schema 验证入站帧。
- 发出诸如 `agent`、`chat`、`presence`、`health`、`heartbeat` 和 `cron` 等事件。

### 客户端（mac 应用 / CLI / Web 管理界面）
- 每个客户端有一个 WS 连接。
- 发送请求（`health`、`status`、`send`、`agent`、`system-presence`）。
- 订阅事件（`tick`、`agent`、`presence`、`shutdown`）。

### 节点（macOS / iOS / Android / 无头设备）
- 使用 `role: node` 连接到 **同一 WS 服务器**。
- 在 `connect` 中提供设备身份；配对是基于设备的（角色为 `node`），且批准信息存储在设备配对存储中。
- 公开诸如 `canvas.*`、`camera.*`、`screen.record` 和 `location.get` 等命令。

协议详情：
- [Gateway 协议](/gateway/protocol)

### WebChat
- 静态 UI 使用 Gateway 的 WS API 来获取聊天历史并发送消息。
- 在远程设置中，通过与其他客户端相同的 SSH/Tailscale 隧道进行连接。

## 连接生命周期（单个客户端）

```
Client                    Gateway
  |                          |
  |---- req:connect -------->|
  |<------ res (ok) ---------|   (or res error + close)
  |   (payload=hello-ok carries snapshot: presence + health)
  |                          |
  |<------ event:presence ---|
  |<------ event:tick -------|
  |                          |
  |------- req:agent ------->|
  |<------ res:agent --------|   (ack: {runId,status:"accepted"})
  |<------ event:agent ------|   (streaming)
  |<------ res:agent --------|   (final: {runId,status,summary})
  |                          |
```

## 传输协议（摘要）

- 传输层：WebSocket，文本帧携带 JSON 负载。
- 第一帧 **必须** 是 `connect`。
- 握手完成后：
  - 请求：`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 事件：`{type:"event", event, payload, seq?, stateVersion?}`
- 如果设置了 `OPENCLAW_GATEWAY_TOKEN`（或 `--token`），则 `connect.params.auth.token` 必须匹配，否则套接字将关闭。
- 对于具有副作用的方法（`send`、`agent`），需要使用幂等密钥以安全重试；服务器维护一个短期去重缓存。
- 节点必须在 `connect` 中包含 `role: "node"` 以及能力、命令和权限。

## 配对 + 本地信任

- 所有 WS 客户端（操作员和节点）在 `connect` 中包含 **设备身份**。
- 新设备 ID 需要配对批准；Gateway 会为后续连接颁发 **设备令牌**。
- **本地**连接（环回地址或网关主机自身的 tailnet 地址）可以自动批准，以保持同主机用户体验的流畅性。
- **非本地**连接必须签署 `connect.challenge` 随机数，并需明确批准。
- Gateway 身份验证（`gateway.auth.*`）仍然适用于 **所有**连接，无论是本地还是远程。

详情：[Gateway 协议](/gateway/protocol)、[配对](/start/pairing)、[安全性](/gateway/security)。

## 协议类型化与代码生成

- TypeBox 模式定义了协议。
- 从这些模式生成 JSON Schema。
- 从 JSON Schema 生成 Swift 模型。

## 远程访问

- 推荐方式：Tailscale 或 VPN。
- 替代方式：SSH 隧道
  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```
- 同样的握手和身份验证令牌适用于隧道连接。
- 在远程设置中，可以为 WS 启用 TLS 并选择性启用证书固定。

## 运维快照

- 启动：`openclaw gateway`（前台运行，日志输出到 stdout）。
- 健康检查：通过 WS 提供 `health`（也包含在 `hello-ok` 中）。
- 监督机制：使用 launchd/systemd 实现自动重启。

## 不变性

- 每台主机恰好有一个 Gateway 控制一个 Baileys 会话。
- 握手是强制性的；任何非 JSON 或非连接的第一帧都会导致硬关闭。
- 事件不会被重放；客户端必须在出现间隙时刷新。
