---
summary: >-
  End-to-end guide for running OpenClaw as a personal assistant with safety
  cautions
read_when:
  - Onboarding a new assistant instance
  - Reviewing safety/permission implications
---
# 使用 OpenClaw 构建个人助理

OpenClaw 是一个为 **Pi** 代理提供的 WhatsApp + Telegram + Discord + iMessage 网关。通过插件还可以支持 Mattermost。本指南介绍的是“个人助理”设置：使用一个专用的 WhatsApp 号码，使其像始终在线的代理一样运行。

## ⚠️ 安全第一

你将让代理具备以下能力：

- 在你的机器上运行命令（具体取决于你的树莓派工具设置）
- 在你的工作空间中读写文件
- 通过插件经由 WhatsApp/Telegram/Discord/Mattermost 发送消息

因此，请从保守的设置开始：

- 始终设置 `channels.whatsapp.allowFrom`（切勿在你的个人 Mac 上以对互联网开放的方式运行）。
- 为助理使用一个专用的 WhatsApp 号码。
- 心跳现在默认每 30 分钟触发一次。在你完全信任该设置之前，请通过设置 `agents.defaults.heartbeat.every: "0m"` 来禁用心跳功能。

## 先决条件

- 节点 **22+**
- OpenClaw 已安装并可通过 PATH 访问（建议全局安装）
- 用于助理的第二个电话号码（SIM/eSIM/预付费）

```bash
npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest
```

从源代码构建（开发环境）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
pnpm link --global
```

## 推荐的双手机设置

你需要这样的设置：

```
Your Phone (personal)          Second Phone (assistant)
┌─────────────────┐           ┌─────────────────┐
│  Your WhatsApp  │  ──────▶  │  Assistant WA   │
│  +1-555-YOU     │  message  │  +1-555-ASSIST  │
└─────────────────┘           └────────┬────────┘
                                       │ linked via QR
                                       ▼
                              ┌─────────────────┐
                              │  Your Mac       │
                              │  (openclaw)      │
                              │    Pi agent     │
                              └─────────────────┘
```

如果你将个人 WhatsApp 与 OpenClaw 关联，那么发送给你的每一条消息都会被视为“代理输入”。这通常不是你想要的。

## 5分钟快速入门

1) 配对 WhatsApp Web（显示二维码；用助理手机扫描）：

```bash
openclaw channels login
```

2) 启动网关（保持运行）：

```bash
openclaw gateway --port 18789
```

3) 在 `~/.openclaw/openclaw.json` 中添加一个最小配置：

```json5
{
  channels: { whatsapp: { allowFrom: ["+15555550123"] } }
}
```

现在，使用已列入白名单的手机向助理号码发送消息。

当引导流程完成时，系统会自动打开仪表板，并显示你的网关令牌以及标记化的链接。以后要重新打开仪表板，可以使用 `openclaw dashboard`。

为代理指定工作空间（AGENTS）

OpenClaw从其工作空间目录中读取操作指令和“记忆”。

默认情况下，OpenClaw 使用 `~/.openclaw/workspace` 作为代理的工作空间，并会在设置或首次运行代理时自动创建该目录（同时创建初始的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md` 和 `USER.md`）。只有在工作空间是全新的情况下才会创建 `BOOTSTRAP.md`（删除后不应再次自动生成）。

提示：将此文件夹视为 OpenClaw 的“记忆”，并将其设为 Git 仓库（最好是私有），以便备份你的 `AGENTS.md` 和记忆文件。如果已安装 Git，全新工作空间会自动初始化。

```bash
openclaw setup
```

完整工作空间布局及备份指南：[代理工作空间](/concepts/agent-workspace)
记忆工作流：[记忆](/concepts/memory)

可选：使用 `agents.defaults.workspace` 指定不同的工作空间（支持 `~`)。

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace"
  }
}
```

如果你已经从某个仓库中提供了自己的工作空间文件，就可以完全禁用引导文件的自动生成。

```json5
{
  agent: {
    skipBootstrap: true
  }
}
```

## 将其配置为“助理”

OpenClaw 默认提供良好的助理设置，但你通常需要调整以下内容：

- 人物角色/指令：`SOUL.md`
- 思考相关默认设置（如有需要）
- 心跳频率（在你完全信任系统之后）

示例：

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-5",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" }
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }
      }
    }
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"]
    }
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080
    }
  }
}
```

## 会话与记忆

- 会话文件： `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- 会话元数据（token 使用情况、上次路由等）：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（旧版：`~/.openclaw/sessions/sessions.json`）
- `/new` 或 `/reset` 为该聊天启动一个新的会话（可通过 `resetTriggers` 进行配置）。如果单独发送，代理会回复简短的问候语以确认重置。
- `/compact [instructions]` 会压缩会话上下文，并报告剩余的上下文预算。

## 心跳（主动模式）

默认情况下，OpenClaw 每 30 分钟运行一次心跳，提示如下：
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
设置 `agents.defaults.heartbeat.every: "0m"` 可禁用心跳功能。

- 如果 `HEARTBEAT.md` 存在但实际上是空的（仅包含空行和 Markdown 标题，如 `# Heading`)，OpenClaw 会跳过心跳运行，以节省 API 调用。
- 如果该文件缺失，心跳仍会运行，由模型自行决定如何处理。
- 如果代理回复 `HEARTBEAT_OK`（可选择附带简短填充文本；参见 `agents.defaults.heartbeat.ackMaxChars`)，OpenClaw 会抑制该次心跳的对外消息发送。
- 心跳会触发完整的代理回合——间隔越短，消耗的 token 就越多。

```json5
{
  agent: {
    heartbeat: { every: "30m" }
  }
}
```

## 内外媒体传输

传入的附件（图片/音频/文档）可以通过模板传递到你的命令中：

- `{{MediaPath}}`（本地临时文件路径）
- `{{MediaUrl}}`（伪 URL）
- `{{Transcript}}`（如果启用了音频转录功能）

代理发出的附件：在单独一行中包含 `MEDIA:<path-or-url>`（无空格）。示例：

```
Here’s the screenshot.
MEDIA:/tmp/screenshot.png
```

OpenClaw会提取这些附件，并将其与文本一起作为媒体发送。

## 操作检查清单

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # adds gateway health probes (Telegram + Discord)
openclaw health --json   # gateway health snapshot (WS)
```

日志存储在 `/tmp/openclaw/` 下（默认：`openclaw-YYYY-MM-DD.log`)。

## 后续步骤

- WebChat：[WebChat](/web/webchat)
- 网关操作：[网关运行手册](/gateway)
- Cron 作业与唤醒机制：[Cron 作业](/automation/cron-jobs)
- macOS 菜单栏伴侣：[OpenClaw macOS 应用](/platforms/macos)
- iOS Node.js 应用：[iOS 应用](/platforms/ios)
- Android Node.js 应用：[Android 应用](/platforms/android)
- Windows 状态：[Windows (WSL2)](/platforms/windows)
- Linux 状态：[Linux 应用](/platforms/linux)
- 安全：[安全](/gateway/security)
