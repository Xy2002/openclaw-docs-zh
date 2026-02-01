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

## 遠程節點主機（system.run）

當您的網關運行在一台機器上，而您希望命令在另一台機器上執行時，可以使用 **節點主機**。模型仍然與 **網關** 通信；當選擇 `host=node` 时，網關會將 `exec` 調用轉發到 **節點主機**。

### 各組件的運行位置
- **網關主機**：接收消息、運行模型、路由工具調用。
- **節點主機**：在節點機器上執行 `system.run`/`system.which`。
- **審批**：通過 `~/.openclaw/exec-approvals.json` 在節點主機上強制執行。

### 啟動節點主機（前台）

在節點機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 啟動節點主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 配對 + 命名

在網關主機上：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes list
```

命名选项：
- `--display-name` 在 `openclaw node run` / `openclaw node install` 上設置（持久保存在節點的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（網關覆蓋）。

### 全局預設：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按代理覆蓋：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消設置以允許任意節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 權限映射

節點可以在 `node.list` / `node.describe` 中包含一個 `permissions` 映射，以權限名稱（如 `screenRecording`、`accessibility`）為鍵，以布爾值（`true` = 已授予）為值。

## 無頭節點主機（跨平台）

OpenClaw 可以運行 **無頭節點主機**（無 UI），它連接到網關 WebSocket 并暴露 `system.run` / `system.which`。這在 Linux/Windows 上很有用，或者用於在伺服器旁運行一個極簡節點。

啟動它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：
- 仍需配對（網關會顯示節點批准提示）。
- 節點主機將其節點 ID、令牌、顯示名稱和網關連接信息存儲在 `~/.openclaw/node.json` 中。
- 執行審批通過 `~/.openclaw/exec-approvals.json` 在本地強制執行（參見 [執行審批](/tools/exec-approvals))。
- 在 macOS 上，無頭節點主機會優先使用可達的配套應用執行主機，如果應用不可用，則回退到本地執行。設置 `OPENCLAW_NODE_EXEC_HOST=app` 以要求使用該應用，或 `OPENCLAW_NODE_EXEC_FALLBACK=0` 以禁用回退。
- 如果網關 WS 使用 TLS，添加 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 菜單欄應用會以節點身份連接到網關 WS 伺服器（因此 `openclaw nodes …` 可以針對這台 Mac 工作）。
- 在遠程模式下，該應用會為網關端口打開一個 SSH 隧道，並連接到 `localhost`。
