---
summary: >-
  Bonjour/mDNS discovery + debugging (Gateway beacons, clients, and common
  failure modes)
read_when:
  - Debugging Bonjour discovery issues on macOS/iOS
  - 'Changing mDNS service types, TXT records, or discovery UX'
---
# 你好 / mDNS 发现

OpenClaw 使用 Bonjour（mDNS/DNS‑SD）作为一种仅限局域网的便捷方式来发现活跃的网关（WebSocket 端点）。这是一种尽力而为的机制，**不能**替代基于 SSH 或 Tailnet 的连接。

## 通过 Tailscale 实现广域 Bonjour（单播 DNS‑SD）

如果节点和网关位于不同的网络中，多播 mDNS 就无法跨越网络边界。通过切换到基于 Tailscale 的**单播 DNS‑SD**（“广域 Bonjour”），你可以在保持相同发现用户体验的同时实现跨网络的设备发现。

高级步骤：

1) 在网关主机上运行一个可通过 Tailnet 访问的 DNS 服务器。
2) 在专用区域下发布针对 `_openclaw-gw._tcp` 的 DNS‑SD 记录（示例：`openclaw.internal.`）。
3) 配置 Tailscale 的“分离 DNS”，以便你选择的域名通过该 DNS 服务器解析并传递给客户端（包括 iOS）。

OpenClaw 支持任何发现域名；`openclaw.internal.` 只是一个示例。iOS/Android 节点会同时浏览 `local.` 和你配置的广域域名。

### 推荐的网关配置

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } } // enables wide-area DNS-SD publishing
}
```

### 网关主机的一次性 DNS 服务器设置

```bash
openclaw dns setup --apply
```

此设置会安装 CoreDNS，并将其配置为：

- 仅在网关的 Tailscale 接口上监听端口 53
- 从 `~/.openclaw/dns/<domain>.db` 提供你选择的域名（示例：`openclaw.internal.`）

从已连接到 Tailnet 的一台机器进行验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

__HEADING_0__Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加指向网关 Tailnet IP 的名称服务器（UDP/TCP 53）。
- 配置分离 DNS，使你的发现域名使用该名称服务器。

一旦客户端接受 Tailnet DNS，iOS 节点无需多播即可浏览你发现域名中的 `_openclaw-gw._tcp`。

### 推荐的网关监听器安全设置

网关的 WS 端口（默认为 `18789`）默认绑定到环回地址。若需通过局域网或 Tailnet 访问，必须显式绑定端口并保持身份验证处于启用状态。

仅限 Tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启网关（或重启 macOS 菜单栏应用程序）。

## 哪些内容会被通告

只有网关会通告 `_openclaw-gw._tcp`。

## 服务类型

- `_openclaw-gw._tcp` — 网关传输信标（由 macOS/iOS/Android 节点使用）。

__HEADING_0__TXT键（非秘密提示）

网关会通告一些小型的非秘密提示，以方便UI流程：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（网关 WS + HTTP）
- `gatewayTls=1`（仅当启用了 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅当启用了 TLS且指纹可用时）
- `canvasPort=<port>`（仅当画布主机启用时；默认 `18793`）
- `sshPort=<port>`（未覆盖时默认为 22）
- `transport=gateway`
- `cliPath=<path>`（可选；指向可执行 `openclaw` 入口点的绝对路径）
- `tailnetDns=<magicdns>`（Tailnet 可用时的可选提示）

## 在 macOS 上进行调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析单个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览正常但解析失败，通常是因为局域网策略或mDNS解析器存在问题。

在网关日志中进行调试

网关会写入滚动日志文件（启动时打印为 `gateway log file: ...`）。请查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

在 iOS 节点上进行调试

iOS节点使用`NWBrowser`来发现`_openclaw-gw._tcp`。

要捕获日志：

- 设置 → 网关 → 高级 → **发现调试日志**
- 设置 → 网关 → 高级 → **发现日志** → 复现 → **复制**

日志包含浏览器状态转换和结果集变化。

## 常见故障模式

- **Bonjour 不跨网络**：请使用 Tailnet 或 SSH 来实现跨网络通信。
- **多播被阻止**：某些 Wi‑Fi 网络会禁用 mDNS，导致无法正常工作。
- **休眠或接口波动**：macOS 可能会暂时丢弃 mDNS 查询结果，请稍后重试。
- **浏览正常但解析失败**：请确保设备名称简洁（避免使用表情符号或标点符号），然后重启网关。服务实例名称源自主机名，因此过于复杂的名称可能会导致某些解析器出现混淆。

## 转义的实例名称 (`\032`)

Bonjour/DNS-SD 经常将服务实例名称中的字节转义为十进制`\DDD`序列（例如，空格变为`\032`）。

- 这在协议层面是正常的。
- UI 应解码后显示（iOS 使用 `BonjourEscapes.decode`）。

## 禁用与配置

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用通告（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制网关的绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中通告的 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 覆盖通告的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 发现策略与传输选择：[发现](/gateway/discovery)
- 节点配对 + 批准：[网关配对](/gateway/pairing)
