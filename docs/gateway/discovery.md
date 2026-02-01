---
summary: >-
  Node discovery and transports (Bonjour, Tailscale, SSH) for finding the
  gateway
read_when:
  - Implementing or changing Bonjour discovery/advertising
  - Adjusting remote connection modes (direct vs SSH)
  - Designing node discovery + pairing for remote nodes
---
# 发现与传输

OpenClaw 面临两个表面上相似但实质不同的问题：

1) **操作员远程控制**：macOS 菜单栏应用程序控制在其他位置运行的网关。
2) **节点配对**：iOS/Android（以及未来节点）发现网关并安全配对。

设计目标是将所有网络发现/广告功能保留在**节点网关**中（`openclaw gateway`），而让客户端（mac 应用、iOS）仅作为消费者。

## 术语

- **网关**：一个长期运行的网关进程，负责管理状态（会话、配对、节点注册表）并运行通道。大多数部署方案为每台主机使用一个网关；也可采用隔离的多网关架构。
- **网关 WS（控制平面）**：默认情况下位于 `127.0.0.1:18789` 的 WebSocket 端点；可通过 `gateway.bind` 绑定到局域网或尾网。
- **直接 WS 传输**：面向局域网或尾网的网关 WS 端点（无需 SSH）。
- **SSH 传输（回退机制）**：通过在 SSH 上转发 `127.0.0.1:18789` 实现远程控制。
- **旧版 TCP 桥接（已弃用/移除）**：较早的节点传输方式（参见 [桥接协议](/gateway/bridge-protocol)）；不再用于发现广告。

协议详情：
- [网关协议](/gateway/protocol)
- [桥接协议（旧版）](/gateway/bridge-protocol)

## 为何同时保留“直接”和 SSH

- **直接 WS** 在同一网络内及尾网中的用户体验最佳：
  - 通过 Bonjour 在局域网中自动发现
  - 配对令牌和 ACL 由网关掌控
  - 无需 shell 访问；协议表面简洁且易于审计
- **SSH** 仍是通用的回退机制：
  - 只要能通过 SSH 访问即可工作（即使跨不相关网络）
  - 能应对组播/mDNS 问题
  - 除了 SSH 外无需开放新的入站端口

## 发现输入（客户端如何获知网关位置）

### 1) Bonjour / mDNS（仅限局域网）

Bonjour 是尽力而为的服务，无法跨网络。它仅用于“同一局域网”的便利场景。

目标方向：
- **网关** 通过 Bonjour 广告其 WS 端点。
- 客户ients浏览并显示“选择网关”列表，然后存储所选端点。

故障排除与信标详情：[Bonjour](/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（网关传输信标）
- TXT 键（非秘密）：
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22`（或其他广告内容）
  - `gatewayPort=18789`（网关 WS + HTTP）
  - `gatewayTls=1`（仅当启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅当启用 TLS 且指纹可用时）
  - `canvasPort=18793`（默认画布主机端口；提供 `/__openclaw__/canvas/`）
  - `cliPath=<path>`（可选；指向可执行 `openclaw` 入口点或二进制文件的绝对路径）
  - `tailnetDns=<magicdns>`（可选提示；在 Tailscale 可用时自动检测）

禁用/覆盖：
- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广告。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制网关绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广告的 SSH 端口（默认为 22）。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖广告的 CLI 路径。

### 2) Tailnet（跨网络）

对于伦敦/维也纳风格的部署，Bonjour 无济于事。推荐的“直接”目标是：
- Tailscale MagicDNS 名称（首选）或稳定的 tailnet IP。

如果网关检测到自身运行在 Tailscale 下，它会发布 `tailnetDns` 作为客户端的可选提示（包括广域信标）。

### 3) 手动/SSH 目标

当不存在直接路由（或直接传输被禁用）时，客户端始终可以通过 SSH 连接到环回网关端口来建立连接。

详情参见 [远程访问](/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1) 如果已配置并可到达配着的直接端点，则使用该端点。
2) 否则，如果 Bonjour 在局域网中找到网关，则提供一键“使用此网关”的选项，并将其保存为直接端点。
3) 否则，如果已配置 tailnet DNS/IP，则尝试直接连接。
4) 否则，回退到 SSH。

## 配着 + 身份验证（直接传输）

网关是节点/客户端准入的事实权威。

- 配着请求在网关中创建/批准/拒绝（参见 [网关配着](/gateway/pairing))。
- 网关强制执行：
  - 身份验证（令牌/密钥对）
  - 作用域/ACL（网关并非每个方法的原始代理）
  - 速率限制

## 各组件职责

- **网关**：发布发现信标，掌控配着决策，并托管 WS 端点。
- **macOS 应用程序**：帮助您选择网关，显示配着提示，并仅将 SSH 作为回退机制。
- **iOS/Android 节点**：作为便利功能浏览 Bonjour，并连接到已配着的网关 WS。
