---
summary: Gateway runtime on macOS (external launchd service)
read_when:
  - Packaging OpenClaw.app
  - Debugging the macOS gateway launchd service
  - Installing the gateway CLI for macOS
---
# macOS 上的网关（外部 launchd）

OpenClaw.app 不再捆绑 Node/Bun 或网关运行时。macOS 应用程序期望使用**外部**的 `openclaw` CLI 安装，不会以子进程的方式启动网关，而是通过每个用户的 launchd 服务来保持网关持续运行（如果本地已运行一个网关，则会附加到该现有网关）。

## 安装 CLI（本地模式所需）

Mac 上需要安装 Node 22 或更高版本，然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用程序中的“安装 CLI”按钮会通过 npm/pnpm 执行相同的流程（不建议在网关运行时中使用 Bun）。

## Launchd（作为 LaunchAgent 的网关）

标签：
- `bot.molt.gateway`（或 `bot.molt.<profile>`；旧版 `com.openclaw.*` 可能仍存在）

Plist 位置（按用户）：
- `~/Library/LaunchAgents/bot.molt.gateway.plist`
  （或 `~/Library/LaunchAgents/bot.molt.<profile>.plist`）

管理器：
- 在本地模式下，macOS 应用程序负责 LaunchAgent 的安装和更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：
- “OpenClaw Active”用于启用或禁用 LaunchAgent。
- 退出应用程序**不会**停止网关（launchd 会使其保持运行）。
- 如果在配置的端口上已经运行了一个网关，应用程序将附加到该网关，而不是启动一个新的网关。

日志记录：
- launchd 的 stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用程序会检查网关版本与其自身版本是否兼容。如果不兼容，请更新全局 CLI 以匹配应用程序版本。

## 烟雾测试

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然后：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
