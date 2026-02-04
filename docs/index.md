---
summary: 'Top-level overview of OpenClaw, features, and purpose'
read_when:
  - Introducing OpenClaw to newcomers
---
# 开爪 🦞

“去角质！去角质！”——大概就是一只太空龙虾的样子。

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="__URL_73__" />
        <img src="__URL_74__" alt="OpenClaw" width="500" />
    </picture>
</p>

<p align="center">
  <strong>适用于任何操作系统的 AI 代理（Pi）的 WhatsApp/Telegram/Discord/iMessage 网关。</strong><br />
  插件支持 Mattermost 等更多功能。
  发送一条消息，即可在口袋里获得代理的响应。
</p>

<p align="center">
  <a href="__URL_75__">GitHub</a> ·
  <a href="__URL_76__">发布</a> ·
  <a href="/">文档</a> ·
  <a href="/start/openclaw">OpenClaw 助手设置</a>
</p>

OpenClaw 将 WhatsApp（通过 WhatsApp Web / Baileys）、Telegram（Bot API / grammY）、Discord（Bot API / channels.discord.js）和 iMessage（imsg CLI）与编码代理（如 [Pi](https://github.com/badlogic/pi-mono)）连接起来。插件还支持 Mattermost（Bot API + WebSocket）等更多功能。
OpenClaw 还为 OpenClaw 助手提供支持。

## 从这里开始

- **全新安装：** [入门](/start/getting-started)
- **引导式设置（推荐）：** [向导](/start/wizard) (`openclaw onboard`)
- **打开仪表板（本地网关）：** http://127.0.0.1:18789/（或 http://localhost:18789/）

如果网关在同一台计算机上运行，该链接会立即打开浏览器控制界面。如果失败，请先启动网关：`openclaw gateway`。

## 工作原理

```
WhatsApp / Telegram / Discord / iMessage (+ plugins)
        │
        ▼
  ┌───────────────────────────┐
  │          Gateway          │  ws://127.0.0.1:18789 (loopback-only)
  │     (single source)       │
  │                           │  http://<gateway-host>:18793
  │                           │    /__openclaw__/canvas/ (Canvas host)
  └───────────┬───────────────┘
              │
              ├─ Pi agent (RPC)
              ├─ CLI (openclaw …)
              ├─ Chat UI (SwiftUI)
              ├─ macOS app (OpenClaw.app)
              ├─ iOS node via Gateway WS + pairing
              └─ Android node via Gateway WS + pairing
```

大多数操作都通过**网关**（`openclaw gateway`）进行，这是一个长期运行的单一进程，负责管理通道连接和WebSocket控制平面。

## 网络模型

- **每台主机一个网关（推荐）：** 该网关是唯一可运行 WhatsApp Web 会话的进程。若需救援机器人或实现严格隔离，可运行多个网关，并为每个网关使用独立的配置文件和端口；详情请参阅 [多网关](/gateway/multiple-gateways)。
- **环回优先：** 网关 WS 默认使用 `ws://127.0.0.1:18789`。
  - 向导现在默认生成网关令牌（即使是环回模式）。
  - 若要通过 Tailnet 访问网关，需运行 `openclaw gateway --bind tailnet --token ...`（非环回绑定需要令牌）。
- **节点：** 节点通过 WebSocket 连接到网关（可根据需要使用 LAN、Tailnet 或 SSH）；旧版 TCP 桥已弃用并移除。
- **画布主机：** HTTP 文件服务器运行在 `canvasHost.port`（默认为 `18793`），为节点 WebView 提供 `/__openclaw__/canvas/`；详情请参阅 [网关配置](/gateway/configuration)（`canvasHost`）。
- **远程使用：** 可通过 SSH 隧道或 Tailnet/VPN 实现远程访问；详情请参阅 [远程访问](/gateway/remote) 和 [发现](/gateway/discovery)。

## 功能（高层次）

- 📱 **WhatsApp 集成** — 使用 Baileys 处理 WhatsApp Web 协议
- ✈️ **Telegram 机器人** — 通过 grammY 实现私信和群组功能
- 🎮 **Discord 机器人** — 通过 channels.discord.js 实现私信和公会频道功能
- 🧩 **Mattermost 机器人（插件）** — 使用机器人令牌和 WebSocket 事件
- 💬 **iMessage** — 本地 imsg CLI 集成（macOS）
- 🤖 **代理桥接** — Pi（RPC 模式）与工具流传输
- ⏱️ **流媒体 + 分块传输** — 块级流媒体 + Telegram 草稿流媒体细节（[/concepts/streaming](/concepts/streaming)）
- 🧠 **多代理路由** — 将提供商账户/对等方路由到隔离的代理（工作区 + 每个代理的会话）
- 🔐 **订阅认证** — Anthropic（Claude Pro/Max）+ OpenAI（ChatGPT/Codex）通过 OAuth
- 💬 **会话** — 直接聊天合并为共享的 `main`（默认）；群组是隔离的
- 👥 **群聊支持** — 默认基于提及；所有者可以切换 `/activation always|mention`
- 📎 **媒体支持** — 发送和接收图片、音频、文档
- 🎤 **语音笔记** — 可选转录钩子
- 🖥️ **WebChat + macOS 应用程序** — 本地 UI + 菜单栏伴侣，用于运维和语音唤醒
- 📱 **iOS 节点** — 作为节点配对，并公开画布表面
- 📱 **Android 节点** — 作为节点配对，并公开画布 + 聊天 + 相机

注意：旧版 Claude/Codex/Gemini/Opencode 路径已被移除；Pi 是唯一的编码代理路径。

## 快速入门

运行时要求：**Node ≥ 22**。

```bash
# Recommended: global install (npm/pnpm)
npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest

# Onboard + install the service (launchd/systemd user service)
openclaw onboard --install-daemon

# Pair WhatsApp Web (shows QR)
openclaw channels login

# Gateway runs via the service after onboarding; manual run is still possible:
openclaw gateway --port 18789
```

以后在 npm 和 Git 安装之间切换非常容易：安装另一种方式并运行 `openclaw doctor` 来更新网关服务入口点。

从源代码（开发）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard --install-daemon
```

如果你还没有全局安装，可以通过仓库中的 `pnpm openclaw ...` 运行入职步骤。

多实例快速入门（可选）：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

发送一条测试消息（需要运行中的网关）：

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

## 配置（可选）

配置位于 `~/.openclaw/openclaw.json`。

- 如果你**什么都不做》，OpenClaw 将以 RPC 模式使用捆绑的 Pi 二进制文件，并为每个发送者创建会话。
- 如果你想锁定配置，可以从 `channels.whatsapp.allowFrom` 开始，并（针对群组）设置提及规则。

示例：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } }
    }
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } }
}
```

## 文档

- 从这里开始：
  - [文档中心（所有页面链接）](/start/hubs)
  - [帮助](/help) ← *常见修复 + 故障排除*
  - [配置](/gateway/configuration)
  - [配置示例](/gateway/configuration-examples)
  - [斜杠命令](/tools/slash-commands)
  - [多代理路由](/concepts/multi-agent)
  - [更新 / 回滚](/install/updating)
  - [配对（DM + 节点）](/start/pairing)
  - [Nix 模式](/install/nix)
  - [OpenClaw 助手设置](/start/openclaw)
  - [技能](/tools/skills)
  - [技能配置](/tools/skills-config)
  - [工作区模板](/reference/templates/AGENTS)
  - [RPC 适配器](/reference/rpc)
  - [网关运行手册](/gateway)
  - [节点（iOS/Android）](/nodes)
  - [Web 表面（控制界面）](/web)
  - [发现 + 运输](/gateway/discovery)
  - [远程访问](/gateway/remote)
- 提供商和用户体验：
  - [WebChat](/web/webchat)
  - [控制界面（浏览器）](/web/control-ui)
  - [Telegram](/channels/telegram)
  - [Discord](/channels/discord)
  - [Mattermost（插件）](/channels/mattermost)
  - [iMessage](/channels/imessage)
  - [群组](/concepts/groups)
  - [WhatsApp 群组消息](/concepts/group-messages)
  - [媒体：图片](/nodes/images)
  - [媒体：音频](/nodes/audio)
- 伴侣应用程序：
  - [macOS 应用程序](/platforms/macos)
  - [iOS 应用程序](/platforms/ios)
  - [Android 应用程序](/platforms/android)
  - [Windows（WSL2）](/platforms/windows)
  - [Linux 应用程序](/platforms/linux)
- 运维与安全：
  - [会话](/concepts/session)
  - [定时任务](/automation/cron-jobs)
  - [Webhook](/automation/webhook)
  - [Gmail 钩子（Pub/Sub）](/automation/gmail-pubsub)
  - [安全](/gateway/security)
  - [故障排除](/gateway/troubleshooting)

## 名称

**OpenClaw = CLAW + TARDIS**——因为每只太空龙虾都需要一台时空机器。

---

“我们都在玩弄自己的提示词。”——一位可能沉迷于令牌的AI

## 致谢

- **彼得·施泰因贝格**（[@steipete](https://twitter.com/steipete)）——创作者，龙虾低语者
- **马里奥·泽克纳**（[@badlogicc](https://twitter.com/badlogicgames)）——Pi 的创造者，安全渗透测试员
- **克劳德**——那只只想要一个更好名字的太空龙虾

## 核心贡献者

- **马克西姆·沃夫申**（@Hyaxia，36747317+Hyaxia@users.noreply.github.com）—— 博客观察技能
- **纳乔·伊亚科维诺**（@nachoiacovino，nacho.iacovino@gmail.com）—— 位置解析（Telegram + WhatsApp）

## 许可证

MIT——自由得像海洋中的龙虾一样 🦞

---

“我们都在玩弄自己的提示词。”——一位可能沉迷于令牌的AI
