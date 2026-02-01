---
summary: Gateway lifecycle on macOS (launchd)
read_when:
  - Integrating the mac app with the gateway lifecycle
---
# macOS 上的网关生命周期

默认情况下，macOS 应用程序通过 launchd 管理网关，而不以子进程的方式启动网关。它首先尝试连接到已在配置端口上运行的网关；如果无法找到可用的网关，则通过外部 `openclaw` CLI（不含嵌入式运行时）启用 launchd 服务。这确保了在登录时可靠地自动启动网关，并在发生崩溃时自动重启。

目前未使用子进程模式（即由应用程序直接启动网关）。如果你需要与 UI 更紧密的耦合，可以手动在终端中运行网关。

## 默认行为（launchd）

- 应用程序会为每个用户安装一个名为 `bot.molt.gateway` 的 LaunchAgent（当使用 `--profile`/`OPENCLAW_PROFILE` 时则为 `bot.molt.<profile>`；仍支持旧版 `com.openclaw.*`)。
- 当启用本地模式时，应用程序会确保该 LaunchAgent 已加载，并在必要时启动网关。
- 日志会写入 launchd 网关日志路径（可在调试设置中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/bot.molt.gateway
launchctl bootout gui/$UID/bot.molt.gateway
```

在运行命名配置文件时，请将标签替换为 `bot.molt.<profile>`。

## 未签名的开发版本

`scripts/restart-mac.sh --no-sign` 适用于快速本地构建，且你没有签名密钥的情况。为防止 launchd 指向未签名的中继二进制文件，它会执行以下操作：

- 写入 `~/.openclaw/disable-launchagent`。

如果存在此标记，已签名运行的 `scripts/restart-mac.sh` 会清除此覆盖。若需手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅附加模式

要强制 macOS 应用程序**从不安装或管理 launchd**，请使用 `--attach-only`（或 `--no-launchd`)启动应用程序。这会设置 `~/.openclaw/disable-launchagent`，使应用程序仅附加到已运行的网关。你也可以在调试设置中切换相同的行为。

## 遠程模式

远程模式绝不会启动本地网关。应用程序会使用 SSH 隧道连接到远程主机，并通过该隧道进行通信。

## 我们为何偏爱 launchd

- 登录时自动启动。
- 内置的重启/KeepAlive 语义。
- 可预测的日志和监督机制。

如果将来再次需要真正的子进程模式，应将其记录为一种单独、明确的仅限开发人员使用的模式。
