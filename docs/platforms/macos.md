---
summary: OpenClaw macOS companion app (menu bar + gateway broker)
read_when:
  - Implementing macOS app features
  - Changing gateway lifecycle or node bridging on macOS
---
# OpenClaw macOS 伴侣（菜单栏 + 网关代理）

macOS 应用程序是 OpenClaw 的**菜单栏伴侣**。它负责权限管理，在本地运行或连接到网关（通过 launchd 或手动启动），并将 macOS 功能作为节点暴露给代理。

## 功能概述

- 在菜单栏中显示原生通知和状态。
- 掌管 TCC 提示（通知、辅助功能、屏幕录制、麦克风、语音识别、自动化/AppleScript）。
- 运行或连接到网关（本地或远程）。
- 暴露仅限 macOS 的工具（画布、摄像头、屏幕录制、`system.run`）。
- 在**远程**模式下通过 launchd 启动本地节点主机服务，并在**本地**模式下停止该服务。
- 可选地托管用于 UI 自动化的 **PeekabooBridge**。
- 根据请求通过 npm/pnpm 安装全局 CLI (`openclaw`)（不建议在网关运行时使用 Bun）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地网关，应用程序会附加到该网关；否则，它通过 `openclaw gateway install` 启用 launchd 服务。
- **远程**：应用程序通过 SSH/Tailscale 连接到网关，且从不启动本地进程。应用程序会启动本地**节点主机服务**，以便远程网关可以访问这台 Mac。应用程序不会以子进程的形式启动网关。

## Launchd 控制

应用程序管理一个按用户划分的 LaunchAgent，其标签为 `bot.molt.gateway`（当使用 `--profile`/`OPENCLAW_PROFILE` 时为 `bot.molt.<profile>`；旧版 `com.openclaw.*` 仍会被卸载）。

```bash
launchctl kickstart -k gui/$UID/bot.molt.gateway
launchctl bootout gui/$UID/bot.molt.gateway
```

运行命名配置文件时，将标签替换为 `bot.molt.<profile>`。

如果未安装 LaunchAgent，可通过应用程序启用，或运行 `openclaw gateway install`。

## 节点功能（mac）

macOS 应用程序本身表现为一个节点。常见命令：

- 画布：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- 摄像头：`camera.snap`、`camera.clip`
- 屏幕：`screen.record`
- 系统：`system.run`、`system.notify`

节点报告一个 `permissions` 映射，以便代理决定允许哪些操作。

节点服务与应用 IPC：
- 当无头节点主机服务运行时（远程模式），它作为节点连接到网关 WS。
- `system.run` 在 macOS 应用程序中执行（UI/TCC 上下文），通过本地 Unix 套接字进行通信；提示和输出保留在应用内。

图示（SCI）：
```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec 批准（system.run）

`system.run` 受 macOS 应用程序中**Exec 批准**的控制（设置 → Exec 批准）。安全、询问和白名单信息本地存储在 Mac 上：

```
~/.openclaw/exec-approvals.json
```

示例：

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        { "pattern": "/opt/homebrew/bin/rg" }
      ]
    }
  }
}
```

注意事项：
- `allowlist` 条目是解析后二进制路径的 glob 模式。
- 在提示中选择“始终允许”会将该命令添加到白名单。
- `system.run` 环境覆盖会被过滤（删除 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`），然后与应用的环境合并。

## 深度链接

应用程序注册了 `openclaw://` URL 方案，用于本地操作。

### `openclaw://agent`

触发网关 `agent` 请求。

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

查询参数：
- `message`（必填）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选无人值守模式密钥）

安全性：
- 如果没有 `key`，应用程序会提示确认。
- 使用有效的 `key`，运行将处于无人值守状态（适用于个人自动化）。

## 典型入门流程

1) 安装并启动 **OpenClaw.app**。
2) 完成权限检查清单（TCC 提示）。
3) 确保**本地**模式已激活，且网关正在运行。
4) 如果需要终端访问权限，安装 CLI。

## 原生构建与开发工作流

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 打包应用： `scripts/package-mac-app.sh`

## 在 macOS CLI 中调试网关连接性

使用调试 CLI 可以模拟 macOS 应用程序所使用的网关 WebSocket 握手和发现逻辑，而无需启动应用程序。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

连接选项：
- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置中解析（默认：配置或本地）
- `--probe`：强制执行新的健康探测
- `--timeout <ms>`：请求超时（默认： `15000`）
- `--json`：结构化输出，便于对比差异

发现选项：
- `--include-local`：包含本应被过滤为“本地”的网关
- `--timeout <ms>`：整体发现窗口（默认： `2000`）
- `--json`：结构化输出，便于对比差异

提示：与 `openclaw gateway discover --json` 对比，以了解 macOS 应用程序的发现管道（NWBrowser + tailnet DNS‑SD 回退）是否与 Node CLI 的 `dns-sd` 基于发现的方式有所不同。

## 遥远连接管道（SSH 隧道）

当 macOS 应用程序以**远程**模式运行时，它会打开一个 SSH 隧道，使本地 UI 组件能够像在 localhost 上一样与远程网关通信。

### 控制隧道（网关 WebSocket 端口）
- **用途**：健康检查、状态、Web Chat、配置以及其他控制平面调用。
- **本地端口**：网关端口（默认 `18789`），始终保持稳定。
- **远程端口**：远程主机上的相同网关端口。
- **行为**：没有随机本地端口；应用程序会复用现有的健康隧道，或在必要时重新启动它。
- **SSH 形状**：`ssh -N -L <local>:127.0.0.1:<remote>`，带有 BatchMode、ExitOnForwardFailure 和保持连接选项。
- **IP 报告**：SSH 隧道使用环回地址，因此网关会将节点 IP 视为 `127.0.0.1`。如果您希望显示真实的客户端 IP，请使用**直接（ws/wss）**传输方式（参见 [macOS 远程访问](/platforms/mac/remote)）。

有关设置步骤，请参阅 [macOS 运输](/platforms/mac/remote)。有关协议细节，请参阅 [网关协议](/gateway/protocol)。

## 相关文档

- [网关运行手册](/gateway)
- [网关（macOS）](/platforms/mac/bundled-gateway)
- [macOS 权限](/platforms/mac/permissions)
- [画布](/platforms/mac/canvas)
