---
summary: CLI reference for `openclaw node` (headless node host)
read_when:
  - Running the headless node host
  - Pairing a non-macOS node for system.run
---
# `openclaw node`

运行一个**无头节点主机**，该主机连接到网关 WebSocket，并在此机器上公开
`system.run` / `system.which`。

## 为什么要使用节点主机？

当您希望代理在您的网络中**在其他机器上运行命令**，而无需在这些机器上安装完整的 macOS 伴侣应用时，就使用节点主机。

常见用例：
- 在远程 Linux/Windows 设备（构建服务器、实验室机器、NAS）上运行命令。
- 将 exec 保持在网关的**沙盒环境中**，但将获批准的执行委托给其他主机。
- 为自动化或 CI 节点提供轻量级、无头的执行目标。

执行仍然受节点主机上的**exec 批准**和每个代理的白名单保护，因此您可以保持命令访问范围明确且受控。

## 浏览器代理（零配置）

如果节点上未禁用 `browser.enabled`，节点主机会自动发布浏览器代理。这使代理无需额外配置即可在该节点上使用浏览器自动化。

如有需要，可在节点上禁用它：

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false
    }
  }
}
```

## 前台运行

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项：
- `--host <host>`: 网关 WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`: 网关 WebSocket 端口（默认：`18789`）
- `--tls`: 对网关连接使用 TLS
- `--tls-fingerprint <sha256>`: 预期的 TLS 证书指纹（sha256）
- `--node-id <id>`: 覆盖节点 ID（清除配对令牌）
- `--display-name <name>`: 覆盖节点显示名称

## 后台服务

将无头节点主机作为用户服务安装。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：
- `--host <host>`: 网关 WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`: 网关 WebSocket 端口（默认：`18789`）
- `--tls`: 对网关连接使用 TLS
- `--tls-fingerprint <sha256>`: 预期的 TLS 证书指纹（sha256）
- `--node-id <id>`: 覆盖节点 ID（清除配对令牌）
- `--display-name <name>`: 覆盖节点显示名称
- `--runtime <runtime>`: 服务运行时（`node` 或 `bun`）
- `--force`: 如果已安装则重新安装/覆盖

管理服务：

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 可以运行前台节点主机（无需服务）。

服务命令接受 `--json` 以获取机器可读输出。

## 配对

首次连接会在网关上创建一个待处理的节点配对请求。可通过以下方式批准：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

节点主机将其节点 ID、令牌、显示名称以及网关连接信息存储在 `~/.openclaw/node.json` 中。

## Exec 批准

`system.run` 受本地 exec 批准的限制：

- `~/.openclaw/exec-approvals.json`
- [Exec 批准](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从网关编辑）
