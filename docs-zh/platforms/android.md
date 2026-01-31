---
summary: 'Android app (node): connection runbook + Canvas/Chat/Camera'
read_when:
  - Pairing or reconnecting the Android node
  - Debugging Android gateway discovery or auth
  - Verifying chat history parity across clients
---
# Android 应用（节点）

## 支持快照
- 角色：配套节点应用（Android 不托管网关）。
- 是否需要网关：是（通过 WSL2 在 macOS、Linux 或 Windows 上运行）。
- 安装：[入门指南](/start/getting-started) + [配对](/gateway/pairing)。
- 网关：[操作手册](/gateway) + [配置](/gateway/configuration)。
  - 协议：[网关协议](/gateway/protocol)（节点 + 控制平面）。

## 系统控制
系统控制（launchd/systemd）位于网关主机上。详情请参见 [网关](/gateway)。

## 连接操作手册

Android 节点应用 ⇄ (mDNS/NSD + WebSocket) ⇄ **网关**

Android 直接连接到网关 WebSocket（默认 `ws://<host>:18789`），并使用由网关管理的配对机制。

### 先决条件

- 您可以在“主”机器上运行网关。
- Android 设备/模拟器可以访问网关 WebSocket：
  - 与网关处于同一局域网，并使用 mDNS/NSD，**或**
  - 通过 Tailscale 尾网使用广域 Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动指定网关主机和端口（备用方案）
- 您可以在网关机器上运行 CLI（`openclaw`），或通过 SSH 运行。

### 1) 启动网关

```bash
openclaw gateway --port 18789 --verbose
```

在日志中确认您看到类似以下内容：
- `listening on ws://0.0.0.0:18789`

对于仅使用尾网的设置（推荐用于维也纳 ⇄ 伦敦），将网关绑定到尾网 IP：

- 在网关主机上的 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启网关或 macOS 菜单栏应用。

### 2) 验证发现（可选）

从网关机器执行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/gateway/bonjour)。

#### 尾网（维也纳 ⇄ 伦敦）通过单播 DNS-SD 进行发现

Android 的 NSD/mDNS 发现无法跨网络工作。如果您的 Android 节点和网关位于不同网络但通过 Tailscale 连接，则应改用广域 Bonjour / 单播 DNS-SD：

1) 在网关主机上设置一个 DNS-SD 区域（示例 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2) 为选定的域名配置 Tailscale 分割 DNS，使其指向该 DNS 服务器。

详细信息和 CoreDNS 配置示例：[Bonjour](/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持续通知）保持与网关的连接。
- 打开**设置**。
- 在**已发现的网关**中选择您的网关并点击**连接**。
- 如果 mDNS 被阻止，请使用**高级 → 手动网关**（主机 + 端口）并点击**手动连接**。

首次成功配对后，Android 在启动时会自动重新连接：
- 如果启用了手动端点，则使用手动端点；否则，
- 使用最近发现的网关（尽力而为）。

### 4) 通过 CLI 批准配对

在网关机器上：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

配对详情：[网关配对](/gateway/pairing)。

### 5) 验证节点是否已连接

- 通过节点状态：
  ```bash
  openclaw nodes status
  ```
- 通过网关：
  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 历史记录

Android 节点的聊天界面使用网关的**主会话密钥**（`main`），因此历史记录和回复会与 WebChat 和其他客户端共享：

- 历史记录：`chat.history`
- 发送消息：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) 画布 + 相机

#### 网关画布主机（推荐用于 Web 内容）

如果您希望节点显示代理可在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向网关画布主机。

注意：节点使用独立的画布主机，地址为 `canvasHost.port`（默认 `18793`）。

1) 在网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2) 通过局域网将节点导航到该地址：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18793/__openclaw__/canvas/"}'
```

尾网（可选）：如果两台设备都位于 Tailscale 尾网中，可使用 MagicDNS 名称或尾网 IP 替代 `.local`，例如 `http://<gateway-magicdns>:18793/__openclaw__/canvas/`。

此服务器会将实时重载客户端注入 HTML，并在文件更改时自动重载。A2UI 主机位于 `http://<gateway-host>:18793/__openclaw__/a2ui/`。

画布命令（仅限前台）：
- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认框架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 是旧别名）。

相机命令（仅限前台；需权限）：
- `camera.snap`（jpg）
- `camera.clip`（mp4）

有关参数和 CLI 辅助工具的详细信息，请参阅 [相机节点](/nodes/camera)。
