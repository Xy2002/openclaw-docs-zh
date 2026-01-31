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

macOS 也可以以 **节点模式** 运行：菜单栏应用会连接到网关的 WS 服务器，并将其本地画布/相机命令作为节点暴露出来（因此 `openclaw nodes …` 可以针对这台 Mac 工作）。

注意事项：
- 节点是 **外设**，而非网关。它们不运行网关服务。
- Telegram/WhatsApp 等消息会到达 **网关**，而不是节点。

## 配对 + 状态

**WS 节点使用设备配对。** 节点在 `connect` 期间呈现设备身份；网关为 `role: node` 创建设备配对请求。可通过设备 CLI（或 UI）批准配对。

快速 CLI：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

注意事项：
- 当节点的设备配对角色包含 `node` 时，`nodes status` 将节点标记为 **已配对**。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject`）是网关拥有的独立节点配对存储；它 **不** 对 WS `connect` 握手进行门控。

## 远程节点主机（system.run）

当您的网关运行在一台机器上，而您希望命令在另一台机器上执行时，可以使用 **节点主机**。模型仍然与 **网关** 通信；当选择 `host=node` 时，网关会将 `exec` 调用转发到 **节点主机**。

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

### 配对 + 命名

在网关主机上：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes list
```

命名选项：
- `--display-name` 在 `openclaw node run` / `openclaw node install` 上设置（持久保存在节点的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（网关覆盖）。

### 允许列表中的命令

执行审批是 **按节点主机** 的。从网关添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

审批信息存储在节点主机的 `~/.openclaw/exec-approvals.json` 中。

### 将执行指向节点

配置默认设置（网关配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或按会话配置：

```
/exec host=node security=allowlist node=<id-or-name>
```

一旦设置，任何带有 `host=node` 的 `exec` 调用都会在节点主机上执行（受节点允许列表/审批限制）。

相关：
- [节点主机 CLI](/cli/node)
- [Exec 工具](/tools/exec)
- [Exec 审批](/tools/exec-approvals)

## 调用命令

低级别（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

对于常见的“向代理提供 MEDIA 附件”工作流，存在更高级别的辅助工具。

## 截图（画布快照）

如果节点正在显示画布（WebView），`canvas.snapshot` 返回 `{ format, base64 }`。

CLI 辅助工具（写入临时文件并打印 `MEDIA:<path>`）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### 画布控制

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意事项：
- `canvas present` 接受 URL 或本地文件路径（`--target`），并可选接受 `--x/--y/--width/--height` 用于定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（画布）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事项：
- 仅支持 A2UI v0.8 JSONL（v0.9/createSurface 被拒绝）。

## 照片 + 视频（节点相机）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事项：
- 节点必须处于 **前台** 才能执行 `canvas.*` 和 `camera.*`（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段时长被限制（目前为 `<= 60s`），以避免过大的 base64 负载。
- Android 会在可能的情况下提示获取 `CAMERA`/`RECORD_AUDIO` 权限；被拒绝的权限会导致 `*_PERMISSION_REQUIRED` 错误。

## 屏幕录制（节点）

节点暴露 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事项：
- `screen.record` 要求节点应用处于前台。
- Android 会在录制前显示系统屏幕录制提示。
- 屏幕录制时长被限制为 `<= 60s`。
- `--no-audio` 会禁用麦克风采集（iOS/Android 支持；macOS 使用系统音频采集）。
- 当有多屏可用时，使用 `--screen <index>` 选择显示器。

## 位置（节点）

当设置中启用位置功能时，节点会暴露 `location.get`。

CLI 辅助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事项：
- 位置功能 **默认关闭**。
- “始终”需要系统权限；后台获取是尽力而为。
- 响应包括纬度/经度、精度（米）和时间戳。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以暴露 `sms.send`。

低级别调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事项：
- 必须在 Android 设备上先接受权限提示，该功能才会被公开。
- 仅支持 Wi-Fi 的设备如果没有电话功能，将不会公开 `sms.send`。

## 系统命令（节点主机 / mac 节点）

macOS 节点暴露 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。无头节点主机暴露 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

注意事项：
- `system.run` 在负载中返回 stdout/stderr/退出码。
- `system.notify` 尊重 macOS 应用的通知权限状态。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- `system.notify` 支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- macOS 节点会忽略 `PATH` 的覆盖；无头节点主机仅在 `PATH` 前置节点主机 PATH 时才接受。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中执行审批的约束（设置 → 执行审批）。询问/允许列表/完整行为与无头节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受执行审批的约束（`~/.openclaw/exec-approvals.json`）。

## 绑定执行节点

当有多个节点可用时，您可以将执行绑定到特定节点。这会为 `exec host=node` 设置默认节点（也可按代理覆盖）。

全局默认：

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

OpenClaw 可以运行 **无头节点主机**（无 UI），它连接到网关 WebSocket 并暴露 `system.run` / `system.which`。这在 Linux/Windows 上很有用，或者用于在服务器旁边运行一个极简节点。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事项：
- 仍需配对（网关会显示节点批准提示）。
- 节点主机将其节点 ID、令牌、显示名称和网关连接信息存储在 `~/.openclaw/node.json` 中。
- 执行审批通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（参见 [执行审批](/tools/exec-approvals))。
- 在 macOS 上，无头节点主机优先使用可达的配套应用执行主机，如果应用不可用，则回退到本地执行。设置 `OPENCLAW_NODE_EXEC_HOST=app` 以要求使用该应用，或 `OPENCLAW_NODE_EXEC_FALLBACK=0` 以禁用回退。
- 如果网关 WS 使用 TLS，添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用会以节点身份连接到网关 WS 服务器（因此 `openclaw nodes …` 可以针对这台 Mac 工作）。
- 在远程模式下，该应用会为网关端口打开一个 SSH 隧道，并连接到 `localhost`。
