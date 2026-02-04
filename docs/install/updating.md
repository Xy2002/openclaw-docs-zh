---
summary: 'Updating OpenClaw safely (global install or source), plus rollback strategy'
read_when:
  - Updating OpenClaw
  - Something breaks after an update
---
# 更新

OpenClaw 正在快速演进（尚未达到“1.0”版本）。请将更新视为基础设施部署：更新 → 运行检查 → 重启（或使用 `openclaw update`，它会自动重启）→ 验证。

## 推荐：重新运行网站安装程序（就地升级）

**首选**的更新路径是从网站重新运行安装程序。它会检测现有安装，进行就地升级，并在必要时运行 `openclaw doctor`。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

注意事项：

- 如果您不希望再次运行入门向导，请添加 `--no-onboard`。
- 对于**源码安装**，请使用：

  ```bash
  curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git --no-onboard
  ```

安装程序**仅**在仓库状态干净时才会执行 `git pull --rebase`。

- 对于**全局安装**，脚本在后台使用 `npm install -g openclaw@latest`。
- 旧版说明：`openclaw` 仍作为兼容性适配层提供。

## 在更新之前

- 了解您的安装方式：是**全局安装**（npm/pnpm）还是**源码安装**（git clone）。
- 了解您的网关运行方式：是**前台终端**还是**受监督的服务**（launchd/systemd）。
- 备份您的自定义配置：
  - 配置： `~/.openclaw/openclaw.json`
  - 凭据： `~/.openclaw/credentials/`
  - 工作区： `~/.openclaw/workspace`

## 更新（全局安装）

全局安装（任选其一）：

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

我们**不推荐**在 Gateway 运行时使用 Bun（WhatsApp/Telegram 存在问题）。

切换更新通道（通过 Git + npm 安装）：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

使用 `--tag <dist-tag|version>` 可以一次性指定安装标签或版本。

有关通道语义和发布说明，请参阅 [开发通道](/install/development-channels)。

注意：在 npm 安装中，Gateway 在启动时会记录一条更新提示（检查当前通道标签）。可通过 `update.checkOnStart: false` 禁用此功能。

然后：

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

注意事项：

- 如果您的网关以服务形式运行，建议使用 `openclaw gateway restart`，而不是直接杀死 PID。
- 如果您已锁定到特定版本，请参阅下方的“回滚/固定版本”部分。

## 更新（`openclaw update`）

对于**源码安装**（git checkout），建议使用：

```bash
openclaw update
```

它执行一个相对安全的更新流程：

- 要求工作树保持干净。
- 切换到所选通道（标签或分支）。
- 拉取代码，并基于配置的上游（开发通道）进行变基。
- 安装依赖项、构建代码、构建 Control UI，并运行 `openclaw doctor`。
- 默认情况下会重启 Gateway（使用 `--no-restart` 可跳过重启）。

如果您通过 **npm/pnpm** 安装（没有 Git 元数据），`openclaw update` 将尝试通过您的包管理器进行更新。如果无法检测到安装，请改用“更新（全局安装）”。

## 更新（控制界面 / RPC）

Control UI 提供“更新与重启”功能（RPC：`update.run`）。它执行以下操作：
1) 运行与 `openclaw update` 相同的源码更新流程（仅适用于 git checkout）。
2) 写入重启标记，并附带结构化报告（位于 stdout/stderr 尾部）。
3) 重启 Gateway，并使用报告向最后一个活动会话发送 ping。

如果变基失败，网关将中止并重启，但不会应用更新。

## 更新（从源码）

从仓库检出开始：

首选：

```bash
openclaw update
```

手动（等效）：

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
openclaw doctor
openclaw health
```

注意事项：

- 当您运行打包的 `openclaw` 二进制文件（[`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)) 或使用 Node 运行 `dist/` 时，`pnpm build` 至关重要。
- 如果您从仓库检出运行且未进行全局安装，可使用 `pnpm openclaw ...` 执行 CLI 命令。
- 如果您直接从 TypeScript 运行（`pnpm openclaw ...`），通常无需重新构建，但**配置迁移仍然适用** → 请运行 doctor。
- 在全局安装和 git 安装之间切换非常容易：安装另一种形式的版本，然后运行 `openclaw doctor`，以便 Gateway 服务入口点被重写为当前安装。

## 始终运行：`openclaw doctor`

Doctor 是一个“安全更新”命令。它的设计极其简单：修复 + 过渡 + 警告。

注意：如果您是**源码安装**（git checkout），`openclaw doctor` 会先提示您运行 `openclaw update`。

典型操作包括：

- 迁移已弃用的配置键或旧版配置文件位置。
- 审计 DM 策略，并对存在风险的“开放”设置发出警告。
- 检查 Gateway 的健康状况，并可能建议重启。
- 检测并迁移旧版 Gateway 服务（launchd/systemd；旧版 schtasks）到当前的 OpenClaw 服务。
- 在 Linux 上，确保启用 systemd 用户 linger 功能，以使 Gateway 在用户注销后仍能持续运行。

详情：[医生](/gateway/doctor)

## 启动/停止/重启网关

CLI（适用于所有操作系统）：

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

如果您使用的是受监督的服务：

- macOS launchd（应用捆绑的 LaunchAgent）：`launchctl kickstart -k gui/$UID/bot.molt.gateway`（使用 `bot.molt.<profile>`；旧版 `com.openclaw.*` 仍可用）
- Linux systemd 用户服务：`systemctl --user restart openclaw-gateway[-<profile>].service`
- Windows（WSL2）：`systemctl --user restart openclaw-gateway[-<profile>].service`
  - `launchctl`/`systemctl` 仅在服务已安装时有效；否则请运行 `openclaw gateway install`。

运行手册及确切的服务标签：[Gateway 运行手册](/gateway)

## 回滚/固定版本（出现问题时）

### 固定版本（全局安装）

安装一个已知良好的版本（将 `<version>` 替换为上一个正常工作的版本）：

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

提示：要查看当前发布的版本，可运行 `npm view openclaw version`。

然后重启并再次运行医生：

```bash
openclaw doctor
openclaw gateway restart
```

### 按日期固定版本（源码）

选择某个日期的提交（例如：“截至2026年1月1日的main分支状态”）：

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

然后重新安装依赖项并重启：

```bash
pnpm install
pnpm build
openclaw gateway restart
```

如果您以后想恢复到最新版本：

```bash
git checkout main
git pull
```

## 如果您遇到困难

- 再次运行 `openclaw doctor` 并仔细阅读输出（它通常会告诉你如何修复）。
- 查看：[故障排除](/gateway/troubleshooting)
- 在 Discord 中提问：https://channels.discord.gg/clawd
