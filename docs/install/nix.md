---
summary: Install OpenClaw declaratively with Nix
read_when:
  - 'You want reproducible, rollback-able installs'
  - You're already using Nix/NixOS/Home Manager
  - You want everything pinned and managed declaratively
---
# Nix 安装

使用 Nix 运行 OpenClaw 的推荐方式是通过 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — 一个自带完整功能的 Home Manager 模块。

## 快速入门

将以下内容粘贴到你的 AI 助手（Claude、Cursor 等）中：

```text
I want to set up nix-openclaw on my Mac.
Repository: github:openclaw/nix-openclaw

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/openclaw-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, Anthropic key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-openclaw README for module options.
```

> **📦 完整指南：[github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> nix-openclaw 仓库是 Nix 安装的事实来源。本页面仅提供快速概览。

## 你将获得的内容

- 网关 + macOS 应用 + 工具（whisper、Spotify、摄像头等）——全部固定版本
- 可在重启后继续运行的 Launchd 服务
- 带声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

---

## Nix 模式下的运行时行为

当 `OPENCLAW_NIX_MODE=1` 被设置时（nix-openclaw 会自动设置）：

OpenClaw 支持一种 **Nix 模式**，可使配置具有确定性，并禁用自动安装流程。
通过导出以下内容启用该模式：

```bash
OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。你也可以通过默认设置启用 Nix 模式：

```bash
defaults write bot.molt.mac openclaw.nixMode -bool true
```

### 配置与状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。

- `OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）
- `OPENCLAW_CONFIG_PATH`（默认：`$OPENCLAW_STATE_DIR/openclaw.json`）

在 Nix 环境下运行时，应显式将这些路径设置为由 Nix 管理的位置，以确保运行时状态和配置不会进入不可变的存储区。

### Nix 模式下的运行时行为

- 自动安装和自我变异流程被禁用
- 缺失依赖会显示特定于 Nix 的修复提示
- 当处于 Nix 模式时，UI 会显示一个只读的 Nix 模式横幅

## 打包注意事项（macOS）

macOS 打包流程要求在以下路径存在稳定的 Info.plist 模板：

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 会将此模板复制到应用包中，并修补其中的动态字段（Bundle ID、版本/构建号、Git SHA、Sparkle 密钥）。这使得 plist 对于 SwiftPM 打包和 Nix 构建保持确定性，而后者并不依赖完整的 Xcode 工具链。

## 相关内容

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 完整设置指南
- [Wizard](/start/wizard) — 非 Nix CLI 设置
- [Docker](/install/docker) — 容器化设置
