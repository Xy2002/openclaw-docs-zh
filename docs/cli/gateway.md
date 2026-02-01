---
summary: 'OpenClaw Gateway CLI (`openclaw gateway`) — run, query, and discover gateways'
read_when:
  - Running the Gateway from the CLI (dev or servers)
  - 'Debugging Gateway auth, bind modes, and connectivity'
  - Discovering gateways via Bonjour (LAN + tailnet)
---
# 网关 CLI

网关是 OpenClaw 的 WebSocket 服务器，负责管理通道、节点、会话和钩子。

本页面中的子命令位于 `openclaw gateway …` 下。

相关文档：
- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## 运行网关

运行本地网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

注意事项：
- 默认情况下，网关会拒绝启动，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`。对于临时或开发环境的运行，可以使用 `--allow-unconfigured`。
- 在没有身份验证的情况下绑定到环回以外的地址会被阻止（安全防护机制）。
- 当获得授权时，设置 `SIGUSR1` 会触发进程内重启（启用 `commands.restart` 或使用 gateway 工具/配置 apply/update）。
- 处理程序 `SIGINT`/`SIGTERM` 会停止网关进程，但不会恢复任何自定义终端状态。如果你将 CLI 包装在 TUI 或原始模式输入中，请在退出前恢复终端。

### 选项

- `--port <port>`: WebSocket 端口（默认来自配置或环境变量；通常为 `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`: 监听器绑定模式。
- `--auth <token|password>`: 身份验证模式覆盖。
- `--token <token>`: 令牌覆盖（同时为进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
- `--password <password>`: 密码覆盖（同时为进程设置 `OPENCLAW_GATEWAY_PASSWORD`）。
- `--tailscale <off|serve|funnel>`: 通过 Tailscale 公开网关。
- `--tailscale-reset-on-exit`: 关机时重置 Tailscale 服务/隧道配置。
- `--allow-unconfigured`: 全球网关
- `gateway.mode=local`: 允许在配置中缺少 `gateway.mode=local` 的情况下启动网关。
- `--dev`: 如果缺失，则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
- `--reset`: 重置开发配置 + 凭据 + 会话 + 工作区（需要 `--dev`）。
- `--force`: 在启动之前杀死选定端口上的任何现有监听器。
- `--verbose`: 详细日志。
- `--claude-cli-logs`: 仅在控制台中显示 claude-cli 日志（并启用其 stdout/stderr）。
- `--ws-log <auto|full|compact>`: WebSocket 日志样式（默认为 `auto`）。
- `--compact`: 是 `--ws-log compact` 的别名。
- `--raw-stream`: 将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`: 原始流 jsonl 路径。

## 查询正在运行的网关

所有查询命令都使用 WebSocket RPC。

输出模式：
- 默认：人类可读（TTY 中有颜色）。
- `--json`: 机器可读 JSON（无样式/加载动画）。
- `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，但仍保持人类友好的布局。

共享选项（在支持的情况下）：
- `--url <url>`: 网关 WebSocket URL。
- `--token <token>`: 网关令牌。
- `--password <password>`: 网关密码。
- `--timeout <ms>`: 超时/预算（因命令而异）。
- `--expect-final`: 等待“最终”响应（代理调用）。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` 显示网关服务（launchd/systemd/schtasks），并可选地进行 RPC 探测。

```bash
openclaw gateway status
openclaw gateway status --json
```

选项：
- `--url <url>`: 覆盖探测 URL。
- `--token <token>`: 探测的令牌认证。
- `--password <password>`: 探测的密码认证。
- `--timeout <ms>`: 探测超时（默认为 `10000`）。
- `--no-probe`: 跳过 RPC 探测（仅查看服务）。
- `--deep`: 同时扫描系统级服务。

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终探测：
- 您配置的远程网关（如果已设置），以及
- 本地主机（环回）**即使已配置远程网关**。

如果可以访问多个网关，它会打印所有网关。当您使用隔离的配置文件或端口时（例如救援机器人），支持多个网关，但大多数安装仍然只运行一个网关。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

#### 通过 SSH 远程（与 Mac 应用程序功能一致）

macOS 应用程序的“通过 SSH 进行远程连接”模式使用本地端口转发，使可能仅绑定到环回的远程网关能够在 `ws://127.0.0.1:<port>` 上被访问。

CLI 等效：

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项：
- `--ssh <target>`: `user@host` 或 `user@host:port`（端口默认为 `22`）。
- `--ssh-identity <path>`: 身份文件。
- `--ssh-auto`: 将第一个发现的网关主机作为 SSH 目标（仅限 LAN/WAB）。

配置（可选，用作默认值）：
- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低级 RPC 辅助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## 管理网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

注意事项：
- `gateway install` 支持 `--port`、`--runtime`、`--token`、`--force`、`--json`。
- 生命周期命令接受 `--json` 用于脚本编写。

## 发现网关（Bonjour）

`gateway discover` 扫描网关信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（例如 `openclaw.internal.`），并设置拆分 DNS + DNS 服务器；参见 [/gateway/bonjour](/gateway/bonjour)

只有启用了 Bonjour 发现功能的网关才会广播信标。

广域发现记录包括（TXT）：
- `role`（网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（SSH 端口；如果未指定，默认为 `22`）
- `tailnetDns`（MagicDNS 主机名，如果可用）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）
- `cliPath`（远程安装的可选提示）

### `gateway discover`

```bash
openclaw gateway discover
```

选项：
- `--timeout <ms>`: 每个命令的超时时间（浏览/解析）；默认为 `2000`。
- `--json`: 机器可读输出（同时禁用样式/加载动画）。

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
