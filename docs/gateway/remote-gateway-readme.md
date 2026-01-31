---
summary: SSH tunnel setup for OpenClaw.app connecting to a remote gateway
read_when: Connecting the macOS app to a remote gateway over SSH
---
# 使用远程网关运行 OpenClaw.app

OpenClaw.app 使用 SSH 隧道连接到远程网关。本指南将向您展示如何进行设置。

## 概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Machine                          │
│                                                              │
│  OpenClaw.app ──► ws://127.0.0.1:18789 (local port)           │
│                     │                                        │
│                     ▼                                        │
│  SSH Tunnel ────────────────────────────────────────────────│
│                     │                                        │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                         Remote Machine                        │
│                                                              │
│  Gateway WebSocket ──► ws://127.0.0.1:18789 ──►              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 快速设置

### 第 1 步：添加 SSH 配置

编辑 `~/.ssh/config` 并添加：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为您的值。

### 第 2 步：复制 SSH 密钥

将您的公钥复制到远程机器（只需输入一次密码）：

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### 第 3 步：设置网关令牌

```bash
launchctl setenv OPENCLAW_GATEWAY_TOKEN "<your-token>"
```

### 第 4 步：启动 SSH 隧道

```bash
ssh -N remote-gateway &
```

### 第 5 步：重启 OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

现在，应用程序将通过 SSH 隧道连接到远程网关。

---

## 登录时自动启动隧道

要使 SSH 隧道在您登录时自动启动，请创建一个启动代理。

### 创建 PLIST 文件

将其保存为 `~/Library/LaunchAgents/bot.molt.ssh-tunnel.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>bot.molt.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### 加载启动代理

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/bot.molt.ssh-tunnel.plist
```

现在，该隧道将：
- 在您登录时自动启动
- 在崩溃时自动重启
- 在后台持续运行

旧版说明：如果存在任何遗留的 `com.openclaw.ssh-tunnel` LaunchAgent，请将其移除。

---

## 故障排除

**检查隧道是否正在运行：**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**重启隧道：**

```bash
launchctl kickstart -k gui/$UID/bot.molt.ssh-tunnel
```

**停止隧道：**

```bash
launchctl bootout gui/$UID/bot.molt.ssh-tunnel
```

---

## 工作原理

| 组件 | 功能 |
|-----------|--------------|
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789 |
| `ssh -N` | 仅执行端口转发而不执行远程命令的 SSH |
| `KeepAlive` | 在隧道崩溃时自动重启 |
| `RunAtLoad` | 在代理加载时启动隧道 |

OpenClaw.app 连接到您客户端机器上的 `ws://127.0.0.1:18789`。SSH 隧道会将该连接转发到运行网关的远程机器上的端口 18789。
