---
summary: macOS app flow for controlling a remote OpenClaw gateway over SSH
read_when:
  - Setting up or debugging remote mac control
---
# 远程 OpenClaw（macOS ⇄ 远程主机）


此流程使 macOS 应用能够作为运行在另一台主机（桌面或服务器）上的 OpenClaw 网关的完整远程控制工具。这是应用的 **通过 SSH 远程**（远程执行）功能。所有功能——健康检查、语音唤醒转发和 Web 聊天——都复用 *设置 → 通用* 中的同一远程 SSH 配置。

## 模式
- **本地（本 Mac）**：一切都在笔记本电脑上运行，不涉及 SSH。
- **通过 SSH 远程（默认）**：OpenClaw 命令在远程主机上执行。mac 应用会使用 `-o BatchMode` 加上您选择的身份/密钥，并通过本地端口转发打开 SSH 连接。
- **直接远程（ws/wss）**：无需 SSH 隧道。mac 应用直接连接到网关 URL（例如，通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式
远程模式支持两种传输方式：
- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将网关端口转发到 localhost。由于隧道是环回连接，网关会将节点的 IP 视为 `127.0.0.1`。
- **直接（ws/wss）**：直接连接到网关 URL。网关可以看到真实的客户端 IP。

## 远程主机的先决条件
1) 安装 Node 和 pnpm，并构建/安装 OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)。
2) 确保 `openclaw` 在非交互式 shell 的 PATH 中可用（如有需要，可将其符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3) 使用密钥认证启用 Open SSH。我们建议使用 **Tailscale** IP，以确保在局域网外也能稳定访问。

## macOS 应用设置
1) 打开 *设置 → 通用*。
2) 在 **OpenClaw 运行** 下，选择 **通过 SSH 远程**，并设置：
   - **传输方式**：**SSH 隧道** 或 **直接（ws/wss）**。
   - **SSH 目标**：`user@host`（可选 `:port`）。
     - 如果网关位于同一 LAN 并广播 Bonjour，则从发现的列表中选择它，以自动填充此字段。
   - **网关 URL**（仅直接模式）：`wss://gateway.example.ts.net`（或对于本地/LAN 使用 `ws://...`）。
   - **身份文件**（高级）：您的密钥路径。
   - **项目根目录**（高级）：用于命令的远程检出路径。
   - **CLI 路径**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（在被广告时自动填充）。
3) 点击 **测试远程**。成功表示远程 `openclaw status --json` 正常运行。失败通常意味着 PATH 或 CLI 问题；退出代码 127 表示远程未找到 CLI。
4) 健康检查和 Web 聊天现在将自动通过此 SSH 隧道运行。

## Web 聊天
- **SSH 隧道**：Web 聊天通过转发的 WebSocket 控制端口（默认 18789）连接到网关。
- **直接（ws/wss）**：Web 聊天直接连接到配置的网关 URL。
- 不再有单独的 WebChat HTTP 服务器。

## 权限
- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在该机器上运行引导程序以一次性授予这些权限。
- 节点通过 `node.list` / `node.describe` 公布其权限状态，以便代理知道哪些权限可用。

## 安全注意事项
- 建议在远程主机上使用环回绑定，并通过 SSH 或 Tailscale 进行连接。
- 如果您将网关绑定到非环回接口，则需要令牌/密码认证。
- 请参阅 [安全](/gateway/security) 和 [Tailscale](/gateway/tailscale)。

## WhatsApp 登录流程（远程）
- 在 **远程主机** 上运行 `openclaw channels login --verbose`。使用手机上的 WhatsApp 扫描二维码。
- 如果身份验证过期，请在该主机上重新登录。健康检查会提示链接问题。

## 故障排除
- **退出代码 127 / 未找到**：`openclaw` 未在非登录 shell 的 PATH 中。将其添加到 `/etc/paths`、您的 shell rc 文件中，或将其符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探测失败**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录 (`openclaw status --json`)。
- **Web 聊天卡住**：确认网关正在远程主机上运行，且转发的端口与网关的 WS 端口匹配；UI 需要健康的 WS 连接。
- **节点 IP 显示为 127.0.0.1**：在使用 SSH 隧道时属正常现象。如果您希望网关看到真实的客户端 IP，请将 **传输方式** 切换为 **直接（ws/wss）**。
- **语音唤醒**：在远程模式下，触发短语会自动转发；无需单独的转发器。

## 通知声音
从带有 `openclaw` 和 `node.invoke` 的脚本中为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用程序中不再有全局“默认声音”切换；调用方可根据请求选择声音（或不选择声音）。
