---
summary: Platform support overview (Gateway + companion apps)
read_when:
  - Looking for OS support or install paths
  - Deciding where to run the Gateway
---
# 平台

OpenClaw 核心采用 TypeScript 编写。**推荐使用 Node.js 作为运行时**。
不建议在网关中使用 Bun（存在 WhatsApp/Telegram 相关问题）。

我们为 macOS 提供了配套应用（菜单栏应用），也为移动节点提供了配套应用（iOS/Android）。Windows 和 Linux 的配套应用正在规划中，但目前网关已完全支持这些平台。此外，我们也计划推出适用于 Windows 的原生配套应用；对于 Windows 用户，推荐通过 WSL2 使用网关。

## 选择你的操作系统

- macOS：[macOS](/platforms/macos)
- iOS：[iOS](/platforms/ios)
- Android：[Android](/platforms/android)
- Windows：[Windows](/platforms/windows)
- Linux：[Linux](/platforms/linux)

## VPS 与托管服务

- VPS 中心：[VPS 托管](/vps)
- Fly.io：[Fly.io](/platforms/fly)
- Hetzner（Docker）：[Hetzner](/platforms/hetzner)
- GCP（Compute Engine）：[GCP](/platforms/gcp)
- exe.dev（虚拟机 + HTTPS 代理）：[exe.dev](/platforms/exe-dev)

## 常用链接

- 安装指南：[入门指南](/start/getting-started)
- 网关操作手册：[网关](/gateway)
- 网关配置：[配置](/gateway/configuration)
- 服务状态：`openclaw gateway status`

## 网关服务安装（命令行）

请从以下方式中任选其一（均受支持）：

- 向导模式（推荐）：`openclaw onboard --install-daemon`
- 直接安装：`openclaw gateway install`
- 配置流程：`openclaw configure` → 选择 **网关服务**
- 修复/迁移：`openclaw doctor`（提供安装或修复服务的选项）

服务目标取决于操作系统：
- macOS：LaunchAgent（`bot.molt.gateway` 或 `bot.molt.<profile>`；旧版为 `com.openclaw.*`）
- Linux/WSL2：systemd 用户服务（`openclaw-gateway[-<profile>].service`）
