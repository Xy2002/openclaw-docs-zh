---
summary: 'Beginner guide: from zero to first message (wizard, auth, channels, pairing)'
read_when:
  - First time setup from zero
  - You want the fastest path from install → onboarding → first message
---
# 入门指南

目标：尽可能快速地从**零**开始，构建并运行第一个可用的聊天系统（并采用合理的默认配置）。

最快启动聊天的方式：打开控制 UI（无需设置频道）。运行 `openclaw dashboard`，即可在浏览器中开始聊天；或者在网关主机上打开 `http://127.0.0.1:18789/`。相关文档：[仪表板](/web/dashboard) 和 [控制 UI](/web/control-ui)。

推荐路径：使用 **CLI 引导向导** (`openclaw onboard`)。它会自动完成以下设置：

- 模型与身份验证（推荐使用 OAuth）
- 网关设置
- 渠道配置（WhatsApp、Telegram、Discord、Mattermost（插件）等）
- 配对默认设置（安全的私信）
- 工作区初始化 + 技能配置
- 可选的后台服务

如果您需要更深入的参考文档，请跳转至：[向导](/start/wizard)、[设置](/start/setup)、[配着](/start/pairing)、[安全](/gateway/security)。

沙箱说明：`agents.defaults.sandbox.mode: "non-main"` 使用 `session.mainKey`（默认为 `"main"`），因此群组或频道会话会被隔离在沙箱中。如果您希望主代理始终在主机上运行，可以为每个代理显式设置覆盖：

```json
{
  "routing": {
    "agents": {
      "main": {
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    }
  }
}
```

## 0) 前置条件

- 节点 `>=22`
- `pnpm`（可选；如果从源码构建，建议安装）
- **推荐：** Brave Search API 密钥，用于网络搜索。最简便的方法是使用 `openclaw configure --section web`（存储 `tools.web.search.apiKey`）。更多信息请参见 [网络工具](/tools/web)。

macOS：如果您计划构建应用程序，请安装 Xcode 或命令行工具（CLT）。如果仅使用 CLI 和网关，只需安装 Node.js 即可。Windows：我们推荐使用 **WSL2**（建议安装 Ubuntu）。强烈建议您使用 WSL2；原生 Windows 尚未经过充分测试，存在较多已知问题，且工具兼容性较差。请先安装 WSL2，然后在 WSL 环境中按照适用于 Linux 的步骤进行操作。更多信息请参见 [Windows (WSL2)](/platforms/windows)。

## 1) 安装 CLI（推荐）

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

安装选项（安装方式、非交互式、来自 GitHub）：[安装](/install)。

Windows（PowerShell）：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

替代方案（全局安装）：

```bash
npm install -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## 2) 运行引导向导（并安装服务）

```bash
openclaw onboard --install-daemon
```

您将选择的内容包括：

- **本地 vs 远程** 网关
- **身份验证**：OpenAI Code（Codex）订阅（OAuth）或 API 密钥。对于 Anthropic，我们建议使用 API 密钥；也支持 `claude setup-token`。
- **提供商**：WhatsApp QR 登录、Telegram/Discord 机器人令牌、Mattermost 插件令牌等。
- **守护进程**：后台安装（launchd/systemd；WSL2 使用 systemd）
  - **运行时**：Node（推荐；WhatsApp/Telegram 必需）。不推荐使用 Bun。
- **网关令牌**：向导默认生成一个令牌（即使在环回模式下），并将其存储在 `gateway.auth.token` 中。

向导文档：[向导](/start/wizard)

### 身份验证：存储位置（重要）

- **Anthropic 推荐路径：** 设置 API 密钥（向导可为其服务存储密钥）。如果您想复用 Claude Code 凭证，也支持 `claude setup-token`。

- OAuth 凭证（旧版导入）：`~/.openclaw/credentials/oauth.json`
- 身份验证配置文件（OAuth + API 密钥）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

无头服务器提示：先在普通机器上完成 OAuth 流程，然后将 `oauth.json` 复制到网关主机。

## 3) 启动网关

如果您在引导过程中已安装服务，网关应已运行：

```bash
openclaw gateway status
```

手动运行（前台）：

```bash
openclaw gateway --port 18789 --verbose
```

仪表板（本地环回）：`http://127.0.0.1:18789/`
如果已配置令牌，请将其粘贴到控制 UI 设置中（存储为 `connect.params.auth.token`）。

⚠️ **Bun 警告（WhatsApp + Telegram）：** Bun 在这些渠道上存在已知问题。如果您使用 WhatsApp 或 Telegram，请改用 **Node** 运行网关。

## 3.5) 快速验证（2分钟）

```bash
openclaw status
openclaw health
openclaw security audit --deep
```

## 4) 配置并连接您的第一个聊天界面

__HEADING_0__WhatsApp（二维码登录）

```bash
openclaw channels login
```

通过 WhatsApp → 设置 → 已链接设备进行扫描。

WhatsApp 文档：[WhatsApp](/channels/whatsapp)

### 电报 / Discord / 其他

向导可以为您生成令牌/配置。如果您更倾向于手动配置，可以从以下内容开始：

- Telegram：[Telegram](/channels/telegram)
- Discord：[Discord](/channels/discord)
- Mattermost（插件）：[Mattermost](/channels/mattermost)

**Telegram 私信提示：** 您的第一条私信会附带一个代码。请批准该代码（见下一步），否则机器人将无法响应。

## 5) 私信安全（需批准）

默认行为：未知私信会收到一个短代码，在消息获得批准之前不会被处理。如果您的第一条私信没有回复，请批准配着：

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <code>
```

配着文档：[配着](/start/pairing)

## 从源码（开发）

如果您正在对 OpenClaw 本身进行开发，请直接从源代码运行：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard --install-daemon
```

如果您尚未进行全局安装，可以通过仓库中的 `pnpm openclaw ...` 运行引导步骤。`pnpm build` 还打包了A2UI资产；如果只需要运行这一步骤，可以使用 `pnpm canvas:a2ui:bundle`。

网关（来自此仓库）：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 7) 验证端到端功能

在新终端中发送一条测试消息：

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

如果 `openclaw health` 显示“未配置身份验证”，请返回向导并设置 OAuth/密钥身份验证——否则代理将无法响应。

提示：`openclaw status --all` 是最佳的可复制只读调试报告。健康探测：`openclaw health`（或 `openclaw status --deep`）会向正在运行的网关请求健康快照。

## 下一步（可选，但非常值得）

- macOS 菜单栏应用 + 语音唤醒：[macOS 应用](/platforms/macos)
- iOS/Android 节点（画布/相机/语音）：[节点](/nodes)
- 运程访问（SSH 隧道 / Tailscale Serve）：[远程访问](/gateway/remote) 和 [Tailscale](/gateway/tailscale)
- 常开 / VPN 设置：[远程访问](/gateway/remote)、[exe.dev](/platforms/exe-dev)、[Hetzner](/platforms/hetzner)、[macOS 远程](/platforms/mac/remote)
