---
summary: Windows (WSL2) support + companion app status
read_when:
  - Installing OpenClaw on Windows
  - Looking for Windows companion app status
---
# Windows（WSL2）

在 Windows 上运行 OpenClaw 时，我们强烈推荐通过 WSL2 来进行（建议使用 Ubuntu）。CLI 和网关在 Linux 环境中运行，这不仅保持了运行时的一致性，还显著提升了工具链的兼容性（例如 Node、Bun、pnpm、Linux 二进制文件以及各种技能）。目前尚未对原生 Windows 安装进行充分测试，且存在更多问题。

我们计划开发原生 Windows 搭配应用。

## 在 WSL2 中安装
- [入门指南](/start/getting-started)（在 WSL 内部使用）
- [安装与更新](/install/updating)
- 官方 WSL2 指南（微软）：https://learn.microsoft.com/windows/wsl/install

## 网关
- [网关操作手册](/gateway)
- [配置](/gateway/configuration)

## 在 CLI 中安装网关服务

在 WSL2 中执行以下命令：

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

在提示时选择 **Gateway service**。

修复或迁移：

```
openclaw doctor
```

## 高级用法：通过 LAN 暴露 WSL 服务（使用 portproxy）

WSL 拥有自己的虚拟网络。如果另一台机器需要访问 **WSL 内部** 运行的服务（例如 SSH、本地 TTS 服务器或网关），则必须将 Windows 端口转发到当前 WSL 的 IP 地址。由于 WSL 的 IP 地址在重启后会发生变化，因此可能需要刷新端口转发规则。

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

一次性允许该端口通过 Windows 防火墙：

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
- 从另一台机器通过 SSH 连接到的是 **Windows 主机 IP**（示例：`ssh user@windows-host -p 2222`）。
- 远程节点必须指向一个 **可访问** 的网关 URL（而非 `127.0.0.1`）；使用 `openclaw status --all` 可进行确认。
- 使用 `listenaddress=0.0.0.0` 可实现局域网访问；而 `127.0.0.1` 则仅限于本地访问。
- 如果希望自动完成此过程，可以注册一个计划任务，在登录时自动执行刷新步骤。

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

在 WSL 终端中执行以下命令：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后在 PowerShell 中执行：

```powershell
wsl --shutdown
```

重新打开 Ubuntu，然后验证：

```bash
systemctl --user status
```

### 3) 在 WSL 内部安装 OpenClaw

在 WSL 中按照适用于 Linux 的入门流程进行操作：

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

我们目前尚未提供 Windows 搭配应用。如果您有意参与开发并推动这一功能的实现，欢迎提交贡献。
