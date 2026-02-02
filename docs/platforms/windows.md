---
summary: Windows (WSL2) support + companion app status
read_when:
  - Installing OpenClaw on Windows
  - Looking for Windows companion app status
---
# Windows（WSL2）

在 Windows 上运行 OpenClaw 时，我们强烈建议通过 WSL2 来进行（推荐使用 Ubuntu）。CLI 和网关在 Linux 环境中运行，这不仅确保了运行时的一致性，还显著提升了工具链（Node/Bun/pnpm、Linux 二进制文件、技能等）的兼容性。目前，原生 Windows 安装尚未经过充分测试，可能存在更多未发现的问题。

我们计划开发原生Windows应用程序。

## 在 WSL2 中安装

- [入门指南](/start/getting-started)（在 WSL 内部使用）
- [安装与更新](/install/updating)
- 官方 WSL2 指南（微软）：https://learn.microsoft.com/windows/wsl/install

## 网关

- [网关操作手册](/gateway)
- [配置](/gateway/configuration)

## 在 CLI 中安装网关服务

在 WSL2 中：

```
openclaw onboard --install-daemon
```

或者：

```
openclaw gateway install
```

或者：

```
openclaw configure
```

在提示时选择**网关服务**。

修复或迁移：

```
openclaw doctor
```

## 高级用法：通过 LAN 暴露 WSL 服务（使用 portproxy）

WSL 拥有自己的虚拟网络。如果另一台机器需要访问在 **WSL 内部** 运行的服务（例如 SSH、本地 TTS 服务器或网关），则必须将 Windows 端口转发到当前 WSL 的 IP 地址。由于 WSL 的 IP 地址在重启后可能会发生变化，因此可能需要刷新端口转发规则。

示例（以管理员身份运行 PowerShell）：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

一次性允许该端口通过Windows防火墙：

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

在 WSL 重启后刷新 portproxy：

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注意事项：

- 通过 SSH 从另一台机器连接时，使用的是**Windows 主机的 IP**（例如：`ssh user@windows-host -p 2222`）。
- 驻留在远程节点上的网关 URL 必须是**可访问**的；可以使用 `listenaddress=0.0.0.0` 来进行确认。
- 使用 `listenaddress=0.0.0.0` 可实现局域网访问；而使用 `127.0.0.1` 则仅限于本地访问。
- 如果希望自动执行此操作，可以注册一个计划任务，在登录时自动运行刷新步骤。

## WSL2 安装分步指南

### 1) 安装 WSL2 + Ubuntu

以管理员身份打开 PowerShell：

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 提示，请重启系统。

### 2) 启用 systemd（网关安装所必需）

在 WSL 终端中：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后在 PowerShell 中：

```powershell
wsl --shutdown
```

重新打开 Ubuntu，然后验证：

```bash
systemctl --user status
```

3) 在 WSL 内部安装 OpenClaw

在 WSL 中按照 Linux 入门流程进行操作：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard
```

完整指南：[入门指南](/start/getting-started)

## Windows 搭配应用

我们目前还没有适用于Windows的应用。如果您有意为此贡献力量，欢迎参与开发！
