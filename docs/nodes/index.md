---
summary: >-
  Nodes: pairing, capabilities, permissions, and CLI helpers for
  canvas/camera/screen/system
read_when:
  - Pairing iOS/Android nodes to a gateway
  - Using node canvas/camera for agent context
  - Adding new node commands or CLI helpers
---
# 节点

**节点**是一种配套设备（macOS/iOS/Android/无头），通过`role: "node"`连接到网关的 **WebSocket**（与操作员使用相同端口），并通过 `node.invoke` 暴露命令界面（例如 `canvas.*`、`camera.*`、`system.*`）。协议详情：[网关协议](/gateway/protocol)。

旧版传输：[桥接协议](/gateway/bridge-protocol)（TCP JSONL；已弃用/移除，不再用于当前节点）。

macOS 也可以以**节点模式**运行：菜单栏应用会连接到网关的 WebSocket 服务器，并将其本地画布/相机命令作为节点暴露出来（因此 `openclaw nodes …` 可以在这台 Mac 上正常工作）。

注意事项：

- 节点是**外设**，而非网关。它们不运行网关服务。
- Telegram/WhatsApp等消息会到达**网关**，而不是节点。

## 配对 + 状态

**WS 节点使用设备配对。** 节点在 `connect` 期间呈现设备身份；网关为 `role: node` 创建设备配对请求。可通过设备 CLI（或 UI）批准配对。

快速命令行界面：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

注意事项：

- 当节点的设备配对角色包含 `node` 时，`nodes status` 将节点标记为**已配对**。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject`）是网关拥有的独立节点配对存储；它**不**对 WS `connect` 握手进行门控。

## 远程节点主机（system.run）

当您的网关运行在一台机器上，而您希望命令在另一台机器上执行时，可以使用**节点主机**。模型仍然与**网关**通信；当选择`host=node`时，网关会将`exec`调用转发到**节点主机**。

### 各组件的运行位置

- **网关主机**：接收消息、运行模型、路由工具调用。
- **节点主机**：在节点机器上执行 `system.run`/`system.which`。
- **审批**：通过 `~/.openclaw/exec-approvals.json` 在节点主机上强制执行。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 匹配 + 命名

在网关主机上：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes list
```

命名选项：

- 在 `openclaw node run` / `openclaw node install` 上设置 `--display-name`（持久保存在节点的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（网关覆盖）。

### 全局默认：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按代理覆盖：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消设置以允许任意节点：

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 权限映射

节点可以在 `node.list` / `node.describe` 中包含一个 `permissions` 映射，以权限名称（如 `screenRecording`、`accessibility`）为键，以布尔值（`true` = 已授予）为值。

## 无头节点主机（跨平台）

OpenClaw 可以在**无头节点主机**（无UI）上运行，通过WebSocket连接到网关，并公开 `system.run` 和 `system.which`。这在Linux或Windows上非常实用，也适用于在服务器旁运行一个极简节点。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事项：

- 仍需配对（网关会显示节点批准提示）。
- 节点主机将其节点ID、令牌、显示名称和网关连接信息存储在 `~/.openclaw/node.json` 中。
- 执行审批通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（参见 [执行审批](/tools/exec-approvals))。
- 在macOS上，无头节点主机优先使用可访问的配套应用来执行主机任务；如果该应用不可用，则回退到本地执行。设置 `OPENCLAW_NODE_EXEC_HOST=app` 以强制要求使用该应用，或设置 `OPENCLAW_NODE_EXEC_FALLBACK=0` 以禁用回退机制。
- 如果网关WS使用TLS，添加 `--tls` / `--tls-fingerprint`。

__HEADING_0__Mac 节点模式

- macOS 菜单栏应用会以节点身份连接到网关 WS 服务器（因此 `openclaw nodes …` 可以在这台 Mac 上运行）。
- 在远程模式下，该应用会为网关端口打开一个 SSH 隧道，并连接到 `localhost`。
