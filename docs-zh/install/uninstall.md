---
summary: 'Uninstall OpenClaw completely (CLI, service, state, workspace)'
read_when:
  - You want to remove OpenClaw from a machine
  - The gateway service is still running after uninstall
---
# 卸载

有两种途径：
- 如果 `openclaw` 仍已安装，则采用**简易路径**。
- 如果 CLI 已消失但服务仍在运行，则采用**手动移除服务**的方法。

## 简易路径（CLI 仍已安装）

推荐使用内置卸载程序：

```bash
openclaw uninstall
```

非交互式（自动化 / npx）：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手动步骤（效果相同）：

1) 停止网关服务：

```bash
openclaw gateway stop
```

2) 卸载网关服务（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3) 删除状态和配置：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你将 `OPENCLAW_CONFIG_PATH` 设置为状态目录之外的自定义位置，请一并删除该文件。

4) 删除工作区（可选，会移除代理文件）：

```bash
rm -rf ~/.openclaw/workspace
```

5) 移除 CLI 安装（选择你当时使用的安装方式）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6) 如果你安装了 macOS 应用程序：

```bash
rm -rf /Applications/OpenClaw.app
```

注意事项：
- 如果你使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），请对每个状态目录重复执行步骤 3（默认状态目录为 `~/.openclaw-<profile>`）。
- 在远程模式下，状态目录位于**网关主机**上，因此也需在该主机上执行步骤 1–4。

## 手动移除服务（CLI 未安装）

如果网关服务仍在运行，但 `openclaw` 丢失，则使用此方法。

### macOS（launchd）

默认标签为 `bot.molt.gateway`（或 `bot.molt.<profile>`；旧版 `com.openclaw.*` 可能仍存在）：

```bash
launchctl bootout gui/$UID/bot.molt.gateway
rm -f ~/Library/LaunchAgents/bot.molt.gateway.plist
```

如果你使用了配置文件，请将标签和 plist 名称替换为 `bot.molt.<profile>`。如果存在任何旧版 `com.openclaw.*` plist，请一并移除。

### Linux（systemd 用户单元）

默认单元名称为 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）：

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（计划任务）

默认任务名称为 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。任务脚本位于你的状态目录下。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

如果你使用了配置文件，请删除匹配的任务名称以及 `~\.openclaw-<profile>\gateway.cmd`。

## 普通安装与源码检出的区别

### 普通安装（install.sh / npm / pnpm / bun）

如果你使用了 `https://openclaw.bot/install.sh` 或 `install.ps1`，则 CLI 是通过 `npm install -g openclaw@latest` 安装的。请使用 `npm rm -g openclaw` 来移除它（或者如果你是以其他方式安装的，则使用 `pnpm remove -g` / `bun remove -g`）。

### 源码检出（git clone）

如果你从仓库检出运行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1) 在删除仓库之前，先**卸载**网关服务（使用上述简易路径或手动移除服务）。
2) 删除仓库目录。
3) 按照上述说明移除状态和工作区。
