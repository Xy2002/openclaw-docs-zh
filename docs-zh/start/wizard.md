---
summary: >-
  CLI onboarding wizard: guided setup for gateway, workspace, channels, and
  skills
read_when:
  - Running or configuring the onboarding wizard
  - Setting up a new machine
---
# 入门向导（CLI）

入门向导是**推荐**的在 macOS、Linux 或 Windows（通过 WSL2；强烈推荐）上设置 OpenClaw 的方式。它在一个引导式流程中配置本地网关或远程网关连接，以及通道、技能和工作区默认设置。

主要入口：

```bash
openclaw onboard
```

首次聊天最快捷的方式：打开控制 UI（无需设置通道）。运行 `openclaw dashboard`，并在浏览器中进行聊天。文档：[仪表板](/web/dashboard)。

后续重新配置：

```bash
openclaw configure
```

推荐：设置 Brave Search API 密钥，以便代理可以使用 `web_search`（`web_fetch` 无需密钥即可工作）。最简单的方法：`openclaw configure --section web`，它会存储 `tools.web.search.apiKey`。文档：[Web 工具](/tools/web)。

## QuickStart 与高级

向导首先提供 **QuickStart**（默认设置）和 **高级**（完全自定义）两种模式。

**QuickStart** 使用默认设置：
- 本地网关（环回）
- 工作区默认（或现有工作区）
- 网关端口 **18789**
- 网关认证 **Token**（自动生成，即使在环回模式下也是如此）
- Tailscale 暴露 **关闭**
- Telegram + WhatsApp 私信默认为 **白名单**（系统会提示您输入手机号码）

**高级** 模式则暴露所有步骤（模式、工作区、网关、通道、守护进程、技能）。

## 向导执行的操作

**本地模式（默认）** 引导您完成以下步骤：
- 模型/认证（OpenAI Code (Codex) 订阅 OAuth、Anthropic API 密钥（推荐）或 setup-token（粘贴），以及 MiniMax/GLM/Moonshot/AI Gateway 选项）
- 工作区位置 + 引导文件
- 网关设置（端口/绑定/认证/Tailscale）
- 服务提供商（Telegram、WhatsApp、Discord、Google Chat、Mattermost（插件）、Signal）
- 守护进程安装（LaunchAgent / systemd 用户单元）
- 健康检查
- 技能（推荐）

**远程模式** 仅配置本地客户端以连接到其他位置的网关。它**不会**在远程主机上安装或更改任何内容。

要添加更多隔离的代理（独立的工作区 + 会话 + 认证），请使用：

```bash
openclaw agents add <name>
```

提示：`--json` 并不意味着非交互模式。对于脚本，请使用 `--non-interactive`（以及 `--workspace`）。

## 流程详情（本地）

1) **现有配置检测**
   - 如果 `~/.openclaw/openclaw.json` 存在，可以选择 **保留 / 修改 / 重置**。
   - 重新运行向导**不会**清除任何内容，除非您明确选择 **重置**（或传递 `--reset`）。
   - 如果配置无效或包含旧版密钥，向导将停止并要求您先运行 `openclaw doctor` 再继续。
   - 重置使用 `trash`（绝不用 `rm`），并提供以下范围：
     - 仅重置配置
     - 重置配置 + 凭证 + 会话
     - 完全重置（同时移除工作区）

2) **模型/认证**
   - **Anthropic API 密钥（推荐）**：如果存在，则使用 `ANTHROPIC_API_KEY`；否则提示您输入密钥，并将其保存以供守护进程使用。
   - **Anthropic OAuth（Claude Code CLI）**：在 macOS 上，向导会检查钥匙串中的“Claude Code-credentials”条目（选择“始终允许”，以免 launchd 启动被阻止）；在 Linux/Windows 上，如果存在，则重复使用 `~/.claude/.credentials.json`。
   - **Anthropic token（粘贴 setup-token）**：在任何机器上运行 `claude setup-token`，然后粘贴令牌（您可以为其命名；留空则使用默认值）。
   - **OpenAI Code (Codex) 订阅（Codex CLI）**：如果 `~/.codex/auth.json` 存在，向导可以重复使用它。
   - **OpenAI Code (Codex) 订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
     - 当未设置模型或 `openai/*` 时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.2`。
   - **OpenAI API 密钥**：如果存在，则使用 `OPENAI_API_KEY`；否则提示您输入密钥，并将其保存到 `~/.openclaw/.env`，以便 launchd 可以读取。
   - **OpenCode Zen（多模型代理）**：提示您输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取）。
   - **API 密钥**：为您存储密钥。
   - **Vercel AI Gateway（多模型代理）**：提示您输入 `AI_GATEWAY_API_KEY`。
   - 更多信息：[Vercel AI Gateway](/providers/vercel-ai-gateway)
   - **MiniMax M2.1**：配置会自动写入。
   - 更多信息：[MiniMax](/providers/minimax)
   - **Synthetic（与 Anthropic 兼容）**：提示您输入 `SYNTHETIC_API_KEY`。
   - 更多信息：[Synthetic](/providers/synthetic)
   - **Moonshot（Kimi K2）**：配置会自动写入。
   - **Kimi Code**：配置会自动写入。
   - 更多信息：[Moonshot AI（Kimi + Kimi Code）](/providers/moonshot)
   - **跳过**：尚未配置认证。
   - 从检测到的选项中选择默认模型（或手动输入服务提供商/模型）。
   - 向导会运行模型检查，并在配置的模型未知或缺少认证时发出警告。
   - OAuth 凭证存储在 `~/.openclaw/credentials/oauth.json` 中；认证档案存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中（API 密钥 + OAuth）。
   - 更多信息：[/concepts/oauth](/concepts/oauth)

3) **工作区**
   - 默认 `~/.openclaw/workspace`（可配置）。
   - 提供代理引导仪式所需的工作区文件种子。
   - 完整的工作区布局 + 备份指南：[代理工作区](/concepts/agent-workspace)

4) **网关**
   - 端口、绑定、认证模式、Tailscale 暴露。
   - 认证建议：即使在环回模式下也应保持 **Token**，以确保本地 WS 客户端必须进行认证。
   - 仅在您完全信任每个本地进程时才禁用认证。
   - 非环回绑定仍需要认证。

5) **通道**
   - [WhatsApp](/channels/whatsapp)：可选 QR 登录。
   - [Telegram](/channels/telegram)：机器人令牌。
   - [Discord](/channels/discord)：机器人令牌。
   - [Google Chat](/channels/googlechat)：服务账号 JSON + Webhook 受众。
   - [Mattermost](/channels/mattermost)（插件）：机器人令牌 + 基础 URL。
   - [Signal](/channels/signal)：可选 `signal-cli` 安装 + 账户配置。
   - [iMessage](/channels/imessage)：本地 `imsg` CLI 路径 + 数据库访问。
   - DM 安全性：默认为配对模式。首次 DM 会发送一个代码；可通过 `openclaw pairing approve <channel> <code>` 批准，或使用白名单。

6) **守护进程安装**
   - macOS：LaunchAgent
     - 需要登录用户会话；对于无头环境，使用自定义 LaunchDaemon（未随附）。
   - Linux（以及 Windows 通过 WSL2）：systemd 用户单元
     - 向导会尝试通过 `loginctl enable-linger <user>` 启用 linger 功能，以便在注销后网关仍保持运行。
     - 可能会提示输入 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试在没有 sudo 的情况下运行。
   - **运行时选择：** Node（推荐；WhatsApp/Telegram 所需）。Bun **不推荐**。

7) **健康检查**
   - 启动网关（如有必要）并运行 `openclaw health`。
   - 提示：`openclaw status --deep` 将网关健康探测器添加到状态输出中（需要可访问的网关）。

8) **技能（推荐）**
   - 读取可用技能并检查要求。
   - 让您选择节点管理器：**npm / pnpm**（不推荐 bun）。
   - 安装可选依赖项（部分依赖项在 macOS 上使用 Homebrew 安装）。

9) **完成**
   - 总结 + 下一步操作，包括用于额外功能的 iOS/Android/macOS 应用程序。
   - 如果未检测到 GUI，向导会打印 SSH 端口转发指令，而不是打开浏览器来访问控制 UI。
   - 如果控制 UI 资产缺失，向导会尝试构建它们；备用方案是 `pnpm ui:build`（自动安装 UI 依赖项）。

## 远程模式

远程模式配置本地客户端以连接到其他位置的网关。

您将设置的内容：
- 远程网关 URL (`ws://...`)
- 如果远程网关需要认证，则设置 Token（推荐）

注意事项：
- 不会在远程主机上执行任何安装或守护进程更改。
- 如果网关仅限于环回模式，则使用 SSH 隧道或 tailnet。
- 发现提示：
  - macOS：Bonjour (`dns-sd`)
  - Linux：Avahi (`avahi-browse`)

## 添加另一个代理

使用 `openclaw agents add <name>` 创建具有独立工作区、会话和认证档案的单独代理。如果不使用 `--workspace`，向导将启动。

它设置的内容：
- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事项：
- 默认工作区遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 以路由传入消息（向导可以完成此操作）。
- 非交互标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 非交互模式

使用 `--non-interactive` 自动化或编写脚本来完成入门：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

添加 `--json` 以获得机器可读的摘要。

Gemini 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Z.AI 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice zai-api-key \
  --zai-api-key "$ZAI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Vercel AI Gateway 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Moonshot 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice moonshot-api-key \
  --moonshot-api-key "$MOONSHOT_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Synthetic 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice synthetic-api-key \
  --synthetic-api-key "$SYNTHETIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

OpenCode Zen 示例：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice opencode-zen \
  --opencode-zen-api-key "$OPENCODE_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

添加代理（非交互）示例：

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## 网关向导 RPC

网关通过 RPC 暴露向导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。客户端（macOS 应用、控制 UI）可以在不重新实现入门逻辑的情况下渲染步骤。

## Signal 设置（signal-cli）

向导可以从 GitHub 发布页面安装 `signal-cli`：
- 下载适当的发布资产。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入您的配置。

注意事项：
- JVM 构建需要 **Java 21**。
- 可用时使用原生构建。
- Windows 使用 WSL2；signal-cli 安装遵循 WSL 内部的 Linux 流程。

## 向导写入的内容

典型字段在 `~/.openclaw/openclaw.json` 中：
- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `gateway.*`（模式、绑定、认证、Tailscale）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.signal.*`、`channels.imessage.*`
- 当您在提示中选择加入时，渠道白名单（Slack/Discord/Matrix/Microsoft Teams）（名称尽可能解析为 ID）。
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 写入 `agents.list[]` 和可选 `bindings`。

WhatsApp 凭证存储在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些通道以插件形式提供。当您在入门过程中选择其中一个时，向导会提示您先安装它（通过 npm 或本地路径），然后再进行配置。

## 相关文档

- macOS 应用入门：[入门](/start/onboarding)
- 配置参考：[网关配置](/gateway/configuration)
- 服务提供商：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)、[Google Chat](/channels/googlechat)、[Signal](/channels/signal)、[iMessage](/channels/imessage)
- 技能：[技能](/tools/skills)、[技能配置](/tools/skills-config)
